# CODEX 续航状态（Dou-Admin）

最后更新时间：2026-05-28 19:10 (Asia/Shanghai)

## 仓库定位

`Dou-Admin` 是 Dou 平台 PC 管理后台前端仓库，基于 Vue 3 + Vite + TypeScript + Element Plus + pure-admin-thin。

## 当前状态

- 主分支：`main`
- 远程：`origin/main`
- 已完成页面：
  - 登录页
  - 工作台
  - 举报处理
  - 操作日志
  - 账号与权限
  - 账号分组
  - 修改密码
  - 用户管理
  - 圈子管理
  - 资源卡管理
  - 人工复核
  - 售后退款
  - 提现审核
  - 登录安全策略提示
- 部署脚本：
  - `scripts/deploy-baota.sh`
  - `scripts/clean-dist.mjs`
- 部署说明：
  - `docs/BAOTA_CICD_DEPLOY.md`
- 商用多租户规划：
  - `docs/COMMERCIAL_MULTI_TENANT_ADMIN.md`

## 本阶段已推进

1. 与 `Dou-Server` 协同补齐 `/api/admin` 管理端基础能力：管理员登录、权限目录、审计日志、工作台统计、用户/圈子/资源卡治理接口。
2. 新增 `人工复核` 页面：聚合用户、圈子、资源卡 `manual_review` 队列，支持详情快照、操作记录、复核通过/拒绝/继续复核。
3. 新增 `售后退款` 页面：售后列表、详情、沟通记录、微信退款发起、拒绝售后、退款状态同步。
4. 新增 `提现审核` 页面：提现列表、详情、人工通过并提交微信商家转账、拒绝、同步、撤销。
5. 将用户/圈子/资源卡治理原因改为下拉枚举并做必填前置校验。
6. 登录安全页增加 2FA、IP 白名单、会话策略提示态。
7. 补充商用多租户后台开发文档，明确平台后台、圈主后台、管理员 1-3 级、圈主账号派发和私域转化功能规划。
8. 修复后台密码变更后的会话安全：后端密码版本校验使旧 token 立即失效，前端改密成功后清除登录态并跳转登录。
9. 新增超级管理员账号分组规划与页面，支持按分组授权圈主查看自己圈子的主房间聊天记录。
10. 补齐商业级后台体验：圈主工作台展示套餐功能、用量上限和只读保护；SaaS 租户列表展示套餐限制；HTTP 异常会透出后端商业限制原因。
11. 新增右上角通知提醒：真实接入 `/api/admin/notifications/summary`，按治理待办、资金相关、到期相关分栏展示投诉举报、人工复核、售后、提现和套餐到期提醒，点击可跳转到对应菜单并带上筛选参数。
12. 新增圈主商业后台能力整合方案：`docs/CREATOR_COMMERCE_ADMIN_CAPABILITY_PLAN.md`，明确对标“链动小铺”的小而美管理系统方案，覆盖店铺、商品/卡密、H5 独立下单页、微信/支付宝扫码支付、订单交付、售后资金和 AI 经营助手分期。
13. 修复 GitHub Actions 发布切换偶发 SSH reset：`.github/workflows/deploy.yml` 增加 SSH keyscan/rsync/切换发布重试、SSH keepalive/连接复用、远端回滚保护和幂等判断，避免 `dist-next` 已切换但连接断开时误判失败。
14. 继续补齐圈主商业后台 P0 详细落地设计：在 `docs/CREATOR_COMMERCE_ADMIN_CAPABILITY_PLAN.md` 明确 P0 只做商业级后台收口，不直接接 H5 扫码支付；补充 P0 数据模型、接口边界、页面字段、权限审计、套餐只读、生产校验清单和开发顺序。

## 续航规则

- 后续涉及本仓后台前端改动时，优先读取并更新本文档。
- 阶段性完成后同步更新 `docs/CODEX_TASK_LEDGER.md`。
- 与 `Dou-Server` 协同改动时，前后端完成验证后都要提交并推送远程。
- 续航文档放在本仓 `docs/` 内，并随本仓代码一起提交推送。
- 不再只写外层 `Dou-Circle/docs` 作为唯一续航来源。

## 下一步

1. 在线部署前先部署 `Dou-Server` 最新代码，并执行迁移 `025_admin_console_base.sql` 至 `033_admin_commercial_controls.sql`。
2. 使用开发默认后台账号 `admin / Admin@123456` 首次登录后立刻修改密码；生产可通过 `ADMIN_BOOTSTRAP_USERNAME`、`ADMIN_BOOTSTRAP_PASSWORD` 覆盖首次种子账号。
3. 真机/线上联调微信退款、微信商家转账、提现撤销等资金动作。
4. 重点回归套餐到期只读保护、私域功能开关、子账号/线索上限、主房间聊天记录分组授权和资源卡改价后支付金额同步。
5. 线上回归右上角通知提醒：用平台管理员和圈主账号分别确认投诉举报、售后、提现、到期提醒的数量、权限过滤和点击跳转筛选。
6. 观察下一次 GitHub Actions 发布结果；若仍在 SSH 握手阶段被服务器 reset，优先检查服务器 `sshd`/安全组/Fail2ban/宝塔安全策略是否限制 GitHub Actions 出口 IP 或连接频率。
7. 按 `CREATOR_COMMERCE_ADMIN_CAPABILITY_PLAN.md` 的 P0 详细设计推进：先补圈主后台商品中心写操作、权限审计、套餐只读和店铺资料收口，再进入 P1 商品中心和 H5 独立下单页。
8. 继续补财务对账、异常单处理、2FA/IP 白名单、导出额度和更细的套餐到期限制。

## 2026-05-28 本轮续航补充

- 当前目标：按圈主商业后台 P0 设计继续实装，先把商品中心从只读列表升级为可经营的商业后台工作台。
- 已改文件：`src/api/admin.ts`、`src/views/tenant/resources.vue`、`src/views/tenant/wallet.vue`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`。
- 已完成前端能力：租户商品中心新增商品创建/编辑弹窗、资源交付/卡密交付、封面与预览图、价格、库存、上下架、删除、复制商品链接、跳转订单筛选；只读账号隐藏写操作；钱包提现按钮按 `tenant:wallet:withdraw` 独立权限控制。
- 协同后端能力：Dou-Server 已补齐租户商品写接口、私有交付字段权限、内容安全、COS 审核任务、审计日志、禁用商品不可由租户后台重新上架和提现权限拆分。
- 验证结果：Dou-Admin `pnpm typecheck`、`pnpm build` 通过；Dou-Server 相关文件 `node --check` 和动态导入通过。
- 下一步：线上用圈主 owner、租户 staff、只读 viewer 三类账号回归商品中心按钮可见性、创建编辑保存、卡密库存、上下架、删除、复制链接、订单跳转、套餐到期只读和提现权限。
- 风险与回滚：前端写操作依赖 Dou-Server 本轮接口；若线上需止血，可先回滚/隐藏 `src/views/tenant/resources.vue` 的写按钮，后端接口保留不影响小程序既有资源卡交易。

## 2026-05-28 研发模式记忆补充

- 用户明确要求：从 P0 到 P5 采用“先设计文档，再写代码”的模式；遇到需要先写文档的 P 阶段，必须先把文档写到足以指导代码实现，再进入开发。
- 技术资料规则：涉及支付、退款、提现、H5、内容安全、AI、第三方平台接口时，先查官方文档并记录关键链接和约束；GitHub 仅作为工程实践、SDK 示例和踩坑参考，不能替代官方契约。
- 已同步位置：
  - `docs/CREATOR_COMMERCE_ADMIN_CAPABILITY_PLAN.md`
  - `C:\Users\Vincent\.codex\skills\vincent-dou-default\SKILL.md`
  - `C:\Users\Vincent\.codex\skills\dou-commerce-production-workflow\SKILL.md`
  - `C:\Users\Vincent\.codex\skills\dou-commerce-production-workflow\references\commerce-phase-gates.md`
  - `C:\Users\Vincent\Desktop\Dou-Circle\docs\CODEX_CONTINUITY_STATE.md`
  - `C:\Users\Vincent\Desktop\Dou-Circle\docs\CODEX_TASK_LEDGER.md`
- 当前判断：P0 商品中心写操作已完成一轮代码；P0 店铺资料页、通知跳转筛选和全角色验收矩阵已补到实现级设计，可继续按文档开发 P0 剩余项。P1-P5 仍是方向级规划，不允许直接写业务代码。
- 下一步：按文档开发 P0 店铺资料页、通知跳转筛选和 P0 验收脚本；P0 验收后再补 P1 商品中心与 H5 商品页详细设计。

## 2026-05-28 P0 店铺资料权限兜底

- 当前目标：修复店铺资料 PATCH 曾复用只读查看权限的 P0 缺口，确保 viewer 即使绕过前端直调接口也不能保存。
- 已改文件：`src/views/tenant/circle.vue`、`src/router/modules/home.ts`、`src/api/admin.ts`、`docs/ADMIN_USER_MANUAL.md`、`docs/COMMERCIAL_MULTI_TENANT_ADMIN.md`、`docs/CREATOR_COMMERCE_ADMIN_CAPABILITY_PLAN.md`、`docs/CREATOR_COMMERCE_P0_FOUNDATION_IMPLEMENTATION_DESIGN.md`，并协同 Dou-Server `src/lib/adminPermissions.js`、`src/routes/admin/tenant.routes.js`。
- 已完成前端能力：`/tenant/circle` 菜单和页面切换为“店铺资料”视角，展示套餐、到期只读状态、店铺预览链接、权限提示；保存按钮按 `tenant:store:manage` 与套餐可写状态双重控制。
- 后端兜底结论：Dou-Server 新增 `tenant:store:manage` 权限，owner/staff 默认拥有，viewer 默认没有；`PATCH /api/admin/tenant/circle` 改为强制 `tenant:store:manage`，继续执行圈子 scope、套餐只读、内容安全和审计。
- 验证结果：Dou-Admin `pnpm typecheck`、`pnpm build` 通过；Dou-Server `node --check src/routes/admin/tenant.routes.js`、`node --check src/lib/adminPermissions.js`、动态导入和权限矩阵 smoke 通过；双仓 `git diff --check` 通过。
- 下一步计划：提交推送后在线上用 owner、staff、viewer、到期租户回归店铺资料保存、只读提示、后端 403/402 拒绝和审计日志。

## 2026-05-28 P1 商品中心与 H5 商品页后台

- 当前目标：按 P1 设计把商品中心扩展到 H5 独立商品页，后台侧补分类、H5 可见性和公开链接复制。
- 已改文件：`src/api/admin.ts`、`src/views/tenant/resources.vue`、`docs/CREATOR_COMMERCE_P1_PRODUCT_H5_DESIGN.md`、`docs/CREATOR_COMMERCE_ADMIN_CAPABILITY_PLAN.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`。
- 已完成前端能力：商品中心新增分类管理弹窗、分类筛选、商品编辑分类、H5 可见/隐藏设置；复制链接改为调用后端公开链接接口，优先使用 `VITE_SHOP_BASE_URL` 拼接 uniapp H5 hash 路由。
- 协同后端能力：Dou-Server 已新增 `product_categories`、`commerce_order_drafts`、`/api/shop/*`、租户分类接口和公开链接接口。
- 验证结果：Dou-Admin `pnpm typecheck`、`pnpm build` 通过；三仓 `git diff --check` 通过（仅 CRLF 转换提示）；本次改动文本经 Node UTF-8 扫描无 U+FFFD 或私用区乱码字符。
- 下一步计划：P1 随本次三仓提交推送完成；P2 前确认 H5 生产域名、HTTPS、短链重写、微信/支付宝白名单和支付商户参数。
- 风险与回滚：若分类或 H5 链接入口异常，可临时隐藏商品中心分类管理与复制 H5 链接按钮，后端接口和新增字段保留不影响既有资源卡管理。
