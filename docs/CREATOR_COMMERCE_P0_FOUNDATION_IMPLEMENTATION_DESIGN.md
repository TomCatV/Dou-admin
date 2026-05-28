# 圈主商业后台 P0 后台商业化基础实现设计

最后更新：2026-05-28

## 阶段目标

P0 的目标是把现有管理后台收口为可经营、可审计、可商业化售卖的圈主后台基础盘。P0 不做 H5 扫码支付和复杂店铺装修，先确保圈主能在 PC 后台安全管理店铺资料、商品、订单、售后、钱包和通知。

## 范围

1. 店铺资料页：用 `circles` 承载店铺名称、简介、封面、公开展示和圈子码。
2. 商品中心：复用 `resource_cards`，支持创建、编辑、上架、下架、删除、卡密库存摘要和公开链接复制。
3. 通知跳转筛选：右上角通知点击后带 query 进入目标页面。
4. 全角色验收：owner、staff、viewer、到期租户、平台管理员。
5. 权限审计：所有 P0 写操作必须有后端权限兜底和 `admin_audit_logs` 记录。

## 不做事项

1. 不接微信 Native 支付和支付宝当面付。
2. 不新建完整 `commerce_products` 大表。
3. 不允许后台手动把订单改为已支付、已退款或提现成功。
4. 不做店铺复杂装修、优惠券、分销和 AI 自动运营。

## 角色和权限

| 操作 | owner | staff | viewer | 到期/暂停租户 | 平台管理员 |
| --- | --- | --- | --- | --- | --- |
| 查看工作台 | 允许 | 允许 | 允许 | 允许 | 平台视角 |
| 修改店铺资料 | 允许 | 允许 | 禁止 | 禁止 | 可平台介入 |
| 创建/编辑商品 | 允许 | 允许 | 禁止 | 禁止 | 可治理 |
| 上架/下架/删除商品 | 允许 | 允许 | 禁止 | 禁止 | 可治理 |
| 查看订单售后 | 允许 | 允许 | 允许 | 允许 | 全平台/按权限 |
| 处理售后/退款 | 允许 | 视权限 | 禁止 | 禁止 | 允许 |
| 查看钱包 | 允许 | 允许 | 允许 | 允许 | 财务视角 |
| 发起提现 | 允许 | 禁止 | 禁止 | 禁止 | 只审核不代发起 |
| 管理子账号 | 允许 | 禁止 | 禁止 | 禁止 | 允许 |

后端权限码：

| 权限码 | 用途 |
| --- | --- |
| `tenant:dashboard:view` | 圈主后台可见 |
| `circle:content:view` | 圈内内容、订单、售后只读 |
| `tenant:store:manage` | 店铺资料写操作 |
| `tenant:resource:manage` | 商品写操作 |
| `tenant:wallet:withdraw` | 圈主发起提现 |
| `after_sale:manage` | 售后处理 |
| `tenant_account:manage` | 子账号和 SaaS 租户管理 |

## 数据模型

P0 复用现有数据：

| 表 | P0 用途 |
| --- | --- |
| `circles` | 店铺基础资料 |
| `circle_tenants` | 租户套餐、状态、到期和只读保护 |
| `tenant_plans` | 套餐功能开关和用量上限 |
| `admin_users` | 圈主账号、员工账号、只读账号 |
| `resource_cards` | 商品中心主数据 |
| `resource_card_codes` | 卡密库存 |
| `orders` | 订单和收入统计 |
| `resource_after_sales` | 商品售后 |
| `creator_wallets`、`creator_withdrawals` | 钱包和提现 |
| `admin_audit_logs` | 后台审计日志 |

P0 不强制新增迁移。若实现中确实需要轻量字段，优先追加兼容字段：

| 字段 | 表 | 用途 | 默认值 |
| --- | --- | --- | --- |
| `share_token` | `resource_cards` | 商品公开链接短标识 | 可用 `id` 兜底 |
| `store_status` | `circle_tenants` | 店铺营业/打烊/只读展示 | `open` |
| `source_channel` | `orders` | 后续区分 miniapp/h5/admin_preview | `miniapp` |

## 后端接口

| 接口 | 方法 | 权限 | 要求 |
| --- | --- | --- | --- |
| `/api/admin/tenant/dashboard` | GET | `tenant:dashboard:view` | 按 `scope_circle_id` 汇总工作台、套餐、钱包和待办 |
| `/api/admin/tenant/circle` | GET | `tenant:dashboard:view` | 返回店铺/圈子资料和商业状态 |
| `/api/admin/tenant/circle` | PATCH | `tenant:store:manage` | 套餐可写、内容安全、圈子范围、审计；`circle:content:view` 只读账号必须被后端拒绝 |
| `/api/admin/tenant/resource-cards` | GET | `circle:content:view` | 支持关键词、状态、审核、交付方式筛选 |
| `/api/admin/tenant/resource-cards` | POST | `tenant:resource:manage` | 创建商品，校验内容安全和套餐用量 |
| `/api/admin/tenant/resource-cards/:id` | PATCH | `tenant:resource:manage` | 仅当前圈子，私密交付字段只给有权限账号 |
| `/api/admin/tenant/resource-cards/:id/publish` | POST | `tenant:resource:manage` | 卡密型必须有可售库存，禁用商品不可上架 |
| `/api/admin/tenant/resource-cards/:id/offline` | POST | `tenant:resource:manage` | 下架不影响历史订单 |
| `/api/admin/tenant/resource-cards/:id` | DELETE | `tenant:resource:manage` | 软删除，保留订单售后 |
| `/api/admin/tenant/orders` | GET | `circle:content:view` | 支持通知 query 初始化筛选 |
| `/api/admin/tenant/after-sales` | GET | `after_sale:manage` 或只读权限 | 支持 `status`、`refund_status` |
| `/api/admin/tenant/wallet` | GET | `tenant:dashboard:view` | 只读返回钱包和最近提现 |
| `/api/admin/tenant/withdrawals` | POST | `tenant:wallet:withdraw` | 调用钱包服务，不能直接改余额 |
| `/api/admin/notifications/summary` | GET | 登录账号 | 按权限和圈子范围过滤 |

## 前端页面

| 页面 | 路由 | P0 行为 |
| --- | --- | --- |
| 经营总览 | `/tenant/dashboard` | 套餐、到期、收入、商品、订单、售后、待办 |
| 店铺资料 | `/tenant/circle` | 表单编辑店铺名、简介、封面、公开展示，展示圈子码和预览链接 |
| 商品中心 | `/tenant/resources` | 表格、筛选、创建/编辑弹窗、上下架、删除、复制链接 |
| 订单售后 | `/tenant/orders` | 订单/售后 tab，读取 query 初始化 |
| 钱包提现 | `/tenant/wallet` | 钱包概览、提现申请和最近提现 |
| SaaS 租户 | `/saas` | 平台管理员按 query 过滤到期租户 |

UI 要求：

1. PC 后台保持信息密度和可扫描性，不做营销型大卡片堆叠。
2. 写操作按钮根据权限隐藏，但后端必须兜底。
3. 到期/暂停租户展示只读提示，并保留数据可见。
4. 表单失败保留用户输入，展示后端 `message`。

## 内容安全和审计

1. 店铺名称、简介、商品标题、简介、交付说明都走文本安全。
2. 封面和预览图只允许平台上传或可信 COS URL，必要时登记异步审核任务。
3. 审计动作：
   - `tenant.circle.update`
   - `tenant.resource_card.create`
   - `tenant.resource_card.update`
   - `tenant.resource_card.publish`
   - `tenant.resource_card.offline`
   - `tenant.resource_card.delete`
   - `tenant.withdrawal.create`
4. 审计摘要必须包含账号、圈子、对象 ID、动作和关键变更字段。

## 验收矩阵

1. owner 能完成店铺资料保存、商品创建、编辑、上下架、删除、提现申请。
2. staff 能创建和编辑商品，不能发起提现和管理子账号。
3. viewer 只能查看，所有写接口后端返回拒绝。
4. 到期/暂停租户能查看数据，写接口返回商业限制错误。
5. 平台管理员能治理商品、售后、提现和租户状态，不能绕过资金服务直接改终态。
6. 所有写操作均能在审计日志追踪。
7. 小程序既有资源卡详情、购买、售后不受影响。

## 验证命令

Dou-Server：

```powershell
node --check src/routes/admin/tenant.routes.js
node --check src/lib/adminPermissions.js
node -e "import('./src/routes/admin/tenant.routes.js')"
node -e "import('./src/lib/adminPermissions.js')"
git diff --check
```

Dou-Admin：

```powershell
pnpm typecheck
pnpm build
git diff --check
```

文档和中文文件：

```powershell
node -e "const fs=require('fs'); for (const f of process.argv.slice(1)) { const s=fs.readFileSync(f,'utf8'); if (s.includes('\uFFFD')) throw new Error(f+' 含乱码替换符'); }" docs/CREATOR_COMMERCE_P0_FOUNDATION_IMPLEMENTATION_DESIGN.md
```

## 回滚方案

1. 前端异常：隐藏或回滚 `/tenant/resources`、`/tenant/circle` 的写按钮，保留只读列表。
2. 后端异常：回滚租户商品写接口提交，小程序资源卡购买链路继续可用。
3. 套餐误拦：平台后台修正 `circle_tenants.status`、`paid_until` 或套餐功能开关。
4. 资金异常：关闭提现入口或撤回前端按钮，不直接改钱包余额。

## 待用户提供参数

P0 当前无需新增生产密钥。上线回归需要准备：

| 参数 | 填写指导 |
| --- | --- |
| 测试 owner 账号 | 一个绑定真实圈子的圈主后台账号 |
| 测试 staff 账号 | 由 owner 或平台创建，权限包含商品管理 |
| 测试 viewer 账号 | 只读账号，用于验证后端拒绝写操作 |
| 到期租户样本 | 将测试租户 `paid_until` 调到过去，验证只读保护 |
