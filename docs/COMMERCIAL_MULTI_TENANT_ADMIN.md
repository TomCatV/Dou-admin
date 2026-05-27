# Dou 商用多租户后台开发文档

最后更新时间：2026-05-28 (Asia/Shanghai)

## 结论

当前 `Dou-admin` 已经具备「平台管理后台」雏形，可以支撑内部运营使用，但还不是完整商用后台。

已经完成的核心能力包括：超级管理员登录、账号权限、举报处理、审计日志、用户治理、圈子治理、资源卡治理、人工复核、售后退款、提现审核和工作台概览。距离商用还需要补齐多租户账号体系、圈主工作台、付费套餐、私域转化工具、数据隔离、操作风控、财务对账、通知触达和可观测性。

目标可以做成两套后台共用一个管理端：

- 平台后台：给你和内部管理员使用，拥有全局视角和跨租户管理能力。
- 圈主后台：给付费圈主使用，只能管理被授权的圈子、资源、成员、订单和私域转化工具。

## 商业模式定位

Dou 的后台商业化可以按「平台 SaaS + 私域工具 + 交易抽佣」设计。

### 付费对象

- 普通圈主：管理单个圈子，适合小规模私域。
- 专业圈主：管理多个圈子，有资源售卖、成员分层、自动触达需求。
- 机构/团队：多个运营账号协同管理多个圈子。
- 平台内部管理员：负责审核、风控、财务、客服和账号派发。

### 收费项

- 圈主后台订阅：按月/年开通管理后台。
- 私域转化工具包：线索表单、自动欢迎语、优惠券、裂变海报、活动报名、批量触达。
- 交易服务费：资源卡、付费房间、圈子入圈费按比例抽佣。
- 增值容量：更多圈子、成员上限、运营账号数、导出次数、素材空间。
- 托管服务：官方代运营、审核加速、财务对账、数据报表。

## 账号与权限模型

### 账号类型

| 类型 | 说明 | 范围 |
| --- | --- | --- |
| 超级管理员 | 只有一个主账号，掌握全局配置、账号派发、账务和最高风控权限 | 全平台 |
| 1 级管理员 | 平台高权限管理员，可管理圈主账号、内容治理、财务审核、套餐配置 | 全平台 |
| 2 级管理员 | 平台运营管理员，可处理内容、用户、圈子、售后和部分账号操作 | 全平台或指定业务域 |
| 3 级管理员 | 平台客服/审核管理员，只能处理工单、举报、复核、只读数据或指定动作 | 受限平台范围 |
| 圈主账号 | 由超级管理员或授权管理员派发，绑定微信用户 ID/微信 openid/平台 user_id | 指定圈子 |
| 圈主子账号 | 圈主邀请自己的员工或助理，受圈主后台权限限制 | 指定圈子或指定功能 |

### 推荐角色编码

后端可从当前 `super_admin/operator/viewer + scope_type` 演进为：

- `super_admin`：唯一超级管理员。
- `admin_l1`：1 级平台管理员。
- `admin_l2`：2 级平台管理员。
- `admin_l3`：3 级平台管理员。
- `tenant_owner`：圈主主账号。
- `tenant_staff`：圈主子账号。
- `tenant_viewer`：圈主只读账号。

### 权限原则

- 超级管理员只能有一个，可通过迁移和接口强约束。
- 管理员 1-3 级不能创建或提升超过自己等级的账号。
- 平台管理员可以全权管理圈主账号，但关键动作需要审计日志。
- 圈主账号必须绑定小程序用户身份，优先绑定 `users.id`，同时记录 `dxq_id` 和 `wechat_openid` 的快照。
- 圈主账号只能访问被授权的 `circle_id`，所有查询必须强制带租户范围过滤。
- 财务类动作必须二次确认，建议后续增加 2FA 或短信验证码。

## 多租户模型

当前系统已经有 `admin_users.scope_type = global/circle` 和 `scope_circle_id`，可作为第一阶段多租户基础。

### 建议新增数据表

```sql
CREATE TABLE tenant_plans (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  limits_json TEXT NOT NULL DEFAULT '{}',
  features_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE circle_tenants (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL UNIQUE,
  owner_user_id TEXT NOT NULL,
  plan_id TEXT,
  status TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at TEXT,
  paid_until TEXT,
  settings_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE tenant_admin_bindings (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  circle_id TEXT NOT NULL,
  bind_type TEXT NOT NULL DEFAULT 'owner',
  wechat_openid_snapshot TEXT NOT NULL DEFAULT '',
  dxq_id_snapshot TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_by_admin_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 租户隔离规则

- 所有圈主后台接口入口统一检查 `scope_type = circle` 或 `role LIKE tenant_%`。
- 所有 SQL 必须追加 `circle_id = req.admin.scope_circle_id`。
- 所有操作日志必须记录 `admin_id`、`circle_id`、`target_type`、`target_id`。
- 圈主账号不可访问平台用户全量列表，只能访问本圈成员。
- 圈主账号不可直接处理平台级退款/提现，只能发起申请或查看与本圈相关的数据。

## 圈主后台功能

### 基础管理

- 圈子资料：名称、简介、封面、入圈规则、公开/私密、成员上限。
- 房间管理：主房间、副房间、付费房间、发言限制、置顶公告。
- 成员管理：搜索、标签、禁言、移出、付费状态、活跃度。
- 内容管理：消息、公告、资源卡、评论、讨论区。
- 订单管理：入圈订单、房间订单、资源卡订单、退款记录。
- 售后管理：售后单列表、沟通记录、同意/拒绝建议。
- 钱包管理：收入概览、可提现余额、提现申请、提现记录。

### 私域转化工具

私域转化不是只做「看数据」，而是帮助圈主把用户从入圈、活跃、复购、裂变串成路径。

建议功能矩阵：

| 模块 | 功能 | 价值 |
| --- | --- | --- |
| 线索收集 | 入圈表单、自定义字段、手机号/微信号收集、意向标签 | 沉淀潜在客户 |
| 新人转化 | 自动欢迎语、新人任务、限时优惠、首单资源推荐 | 提升首购 |
| 成员分层 | 标签、等级、活跃度、购买力、沉默用户识别 | 精准运营 |
| 触达工具 | 群公告、站内通知、短信模板、服务号/小程序订阅消息 | 唤醒和复购 |
| 活动营销 | 限时活动、报名表、打卡挑战、训练营日历 | 提升参与 |
| 优惠工具 | 优惠券、邀请码、拼团、老带新奖励 | 拉新裂变 |
| 资源销售 | 资源卡套餐、组合售卖、限时折扣、试看内容 | 提升 GMV |
| SCRM 看板 | 用户来源、转化漏斗、购买路径、复购率 | 复盘增长 |
| 私域资产 | 用户导出、标签导出、订单导出、资料库 | 圈主付费理由 |
| 自动化 | 满足条件自动打标签、自动发券、自动提醒续费 | 降低运营成本 |

### 转化漏斗

1. 曝光：广场、邀请码、裂变海报、资源试看。
2. 入圈：入圈申请、付费入圈、表单留资。
3. 激活：欢迎语、新人任务、热门资源推荐。
4. 成交：资源卡、付费房间、训练营、咨询服务。
5. 复购：优惠券、会员等级、系列课程、续费提醒。
6. 裂变：邀请码、返利、海报、排行榜。

## 平台后台功能补齐

### 账号与组织

- 超级管理员唯一性约束。
- 管理员等级 1-3。
- 管理员创建/禁用/重置密码/绑定微信用户。
- 圈主账号派发：选择用户、选择圈子、选择套餐、生成初始密码。
- 圈主子账号数量限制。
- 登录安全：强制改初始密码、密码过期、登录 IP、2FA。

### 套餐与计费

- 套餐配置：功能开关、成员上限、子账号上限、导出上限。
- 订阅状态：试用中、付费中、过期、停用。
- 账单记录：订单、续费、退款、优惠。
- 到期策略：只读模式、暂停私域工具、保留数据。

### 风控与审计

- 所有管理员动作写入审计日志。
- 敏感操作二次确认：退款、提现、封禁、删除、重置密码。
- 登录日志：IP、设备、UA、失败次数。
- 密码变更后旧 token 立即失效。
- 管理员权限变更后建议强制重新登录。

### 财务与对账

- 平台收入、圈主收入、待结算、已提现。
- 微信支付订单对账。
- 微信退款单对账。
- 商家转账/提现对账。
- 异常单：支付成功未入账、退款状态不一致、提现处理中超时。

## API 规划

### 平台后台

- `GET /api/admin/dashboard/summary`
- `GET /api/admin/admin-users`
- `POST /api/admin/admin-users`
- `PATCH /api/admin/admin-users/:id`
- `POST /api/admin/admin-users/:id/reset-password`
- `POST /api/admin/admin-users/:id/bind-wechat-user`
- `GET /api/admin/tenants`
- `POST /api/admin/tenants`
- `PATCH /api/admin/tenants/:id`
- `GET /api/admin/plans`
- `POST /api/admin/plans`
- `GET /api/admin/audit-logs`

### 圈主后台

- `GET /api/admin/tenant/dashboard`
- `GET /api/admin/tenant/circle`
- `PATCH /api/admin/tenant/circle`
- `GET /api/admin/tenant/members`
- `PATCH /api/admin/tenant/members/:id`
- `GET /api/admin/tenant/orders`
- `GET /api/admin/tenant/resource-cards`
- `GET /api/admin/tenant/conversion/leads`
- `POST /api/admin/tenant/conversion/campaigns`
- `GET /api/admin/tenant/conversion/funnel`
- `GET /api/admin/tenant/wallet`
- `POST /api/admin/tenant/withdrawals`

## 页面规划

### 平台超级管理员

- 平台总览
- 管理员账号
- 圈主账号派发
- 租户/套餐管理
- 用户管理
- 圈子管理
- 内容治理
- 人工复核
- 售后退款
- 提现审核
- 财务对账
- 操作日志
- 安全设置

### 圈主后台

- 圈主工作台
- 我的圈子
- 成员管理
- 内容与资源
- 订单与售后
- 钱包与提现
- 私域线索
- 转化活动
- 优惠券/邀请码
- 数据报表
- 子账号管理
- 安全设置

## 当前版本缺口

- 还没有真正的套餐/订阅/到期控制。
- 圈主账号虽然已有 `scope_type = circle` 基础，但页面体验仍偏平台后台。
- 管理员等级还不是 1-3 级模型。
- 私域转化工具尚未开发。
- 登录安全只有基础密码和 JWT，未接入 2FA、登录日志、失败锁定。
- 财务还缺系统化对账和异常处理。
- 前端构建依赖目前本机 `pnpm install` 顶层链接异常，需要修复依赖环境后恢复完整 CI 验证。

## 分阶段开发计划

### P0 商用安全补齐

- 修复改密后旧 token 仍可用。
- 改密成功后前端清除登录态并跳转登录。
- 管理员重置密码后目标账号旧 token 失效。
- 新增登录日志和失败次数限制。
- 强制初始密码首次登录后修改。

### P1 多租户账号

- 超级管理员唯一性约束。
- 管理员 1-3 级角色模型。
- 圈主账号绑定微信用户和圈子。
- 圈主后台菜单按租户范围裁剪。
- 后端统一租户范围中间件。

### P2 圈主基础后台

- 圈主工作台。
- 成员管理。
- 圈子资料和房间管理。
- 资源卡管理。
- 订单、售后、钱包只读与申请。

### P3 私域转化

- 线索表单。
- 用户标签。
- 新人欢迎自动化。
- 优惠券、邀请码、裂变海报。
- 活动报名和转化漏斗。
- 数据导出。

### P4 计费与 SaaS 化

- 套餐配置。
- 订阅订单。
- 到期限制。
- 用量统计。
- 发票/合同字段预留。
- 机构多圈多账号管理。

## 验收标准

- 超级管理员可以创建平台管理员和圈主账号。
- 圈主账号只能看到自己的圈子数据。
- 圈主账号无权访问其他圈子、平台用户全量、平台财务全量。
- 改密或重置密码后旧 token 立即失效。
- 所有敏感操作有审计日志。
- 圈主后台至少能完成：看数据、管成员、管资源、看订单、做一次私域活动。
- 套餐到期后按规则限制功能但不丢数据。
