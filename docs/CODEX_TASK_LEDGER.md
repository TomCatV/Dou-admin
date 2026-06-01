# CODEX 任务台账（Dou-Admin）

> 本文件记录 Dou-Admin 仓库内的阶段性任务，便于跨会话恢复。

---

## 2026-05-21

### 管理后台初始化

- 时间：2026-05-21 18:57 (Asia/Shanghai)
- 任务目标：基于 pure-admin-thin 初始化 Dou 管理后台，接入登录、工作台、举报处理、操作日志、账号权限与改密。
- 改动仓库：Dou-Admin
- 关键文件：
  - `src/api/admin.ts`
  - `src/api/user.ts`
  - `src/router/modules/home.ts`
  - `src/views/reports/index.vue`
  - `src/views/audit-logs/index.vue`
  - `src/views/admin-users/index.vue`
  - `src/views/account/security.vue`
- 验证：前端类型检查和构建已通过。
- 风险与回滚：如前端部署异常，可回滚到上一个构建产物或上一个 Git 提交。

### 宝塔部署脚本与构建修复

- 时间：2026-05-21 18:57 (Asia/Shanghai)
- 任务目标：支持宝塔 WebHook 自动部署，并修复宝塔 `dist/.user.ini` 导致构建清理失败。
- 改动仓库：Dou-Admin
- 改动文件：
  - `scripts/deploy-baota.sh`
  - `scripts/clean-dist.mjs`
  - `docs/BAOTA_CICD_DEPLOY.md`
  - `package.json`
- 验证：`pnpm build` 已通过。
- 风险与回滚：如服务器仍因 `.user.ini` 不可删失败，先执行 `chattr -i dist/.user.ini 2>/dev/null || true && rm -rf dist` 后再构建。

### 仓库续航文档内置

- 时间：2026-05-21 18:57 (Asia/Shanghai)
- 任务目标：将续航文档迁入 Dou-Admin 仓库内。
- 改动仓库：Dou-Admin
- 改动文件：
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 验证：UTF-8 检查和 `git diff --check` 已作为提交前门禁。
- 风险与回滚：仅文档变更，不影响运行。

### 管理后台内容治理页面

- 时间：2026-05-21 20:30 (Asia/Shanghai)
- 任务目标：继续完善后台管理开发，新增用户、圈子、资源卡治理页面。
- 改动仓库：Dou-Admin
- 改动文件：
  - `src/api/admin.ts`
  - `src/router/modules/home.ts`
  - `src/utils/labels.ts`
  - `src/views/users/index.vue`
  - `src/views/circles/index.vue`
  - `src/views/resource-cards/index.vue`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 验证：
  - `pnpm exec tsc --noEmit`
  - `pnpm exec vue-tsc --noEmit --skipLibCheck`
  - `pnpm build`
- 下一步：继续开发人工复核、售后退款、提现审核页面。
- 风险与回滚：页面依赖 Dou-Server 最新 `/api/admin/users`、`/api/admin/circles`、`/api/admin/resource-cards`，上线需先部署后端。

## 2026-05-26

### 管理端复核、售后、提现闭环

- 时间：2026-05-26 23:05 (Asia/Shanghai)
- 任务目标：前后端协同补齐 Dou 管理后台 `/api/admin` 能力，新增人工复核、售后退款、提现审核页面。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/router/modules/home.ts`
  - `src/utils/labels.ts`
  - `src/views/manual-reviews/index.vue`
  - `src/views/after-sales/index.vue`
  - `src/views/withdrawals/index.vue`
  - `src/views/users/index.vue`
  - `src/views/circles/index.vue`
  - `src/views/resource-cards/index.vue`
  - `src/views/account/security.vue`
  - `src/views/welcome/index.vue`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- Dou-Server 改动文件：
  - `src/db/migrations/027_admin_finance_reviews.sql`
  - `src/lib/adminPermissions.js`
  - `src/routes/admin/index.js`
  - `src/routes/admin/dashboard.routes.js`
  - `src/routes/admin/resourceCards.routes.js`
  - `src/routes/admin/manualReviews.routes.js`
  - `src/routes/admin/afterSales.routes.js`
  - `src/routes/admin/withdrawals.routes.js`
- 验证：
  - Dou-Server `node --check src/routes/admin/manualReviews.routes.js`
  - Dou-Server `node --check src/routes/admin/afterSales.routes.js`
  - Dou-Server `node --check src/routes/admin/withdrawals.routes.js`
  - Dou-Server `node --check src/routes/admin/index.js`
  - Dou-Server `node --check src/app.js`
  - Dou-Server 临时库迁移完整通过
  - Dou-Server `/api/admin` 登录、工作台、用户、圈子、资源卡、人工复核、售后、提现列表 smoke test 通过
- 后端提交：`b0ff65c feat: 增加管理后台接口`，已推送 `master`。
- 备注：本机 `pnpm install` 在 Dou-Admin 依赖链接阶段持续超时，前端 `vue-tsc` 因顶层类型依赖未链接完整未能完成。
- 下一步：部署后端迁移，线上用真实管理员账号完成资金动作联调。
- 风险与回滚：新增后端管理端路由独立挂载在 `/api/admin`，不改动小程序 `/api/v0.9` 路由；如管理后台异常，可回滚 Dou-Server 最新提交或临时移除 `/api/admin` 挂载。

## 2026-05-28

### 商用多租户规划与改密会话安全

- 时间：2026-05-28 00:00 (Asia/Shanghai)
- 任务目标：评估当前后台商用差距，规划多租户圈主后台和私域转化能力，并修复后台改密后旧 token 仍可访问的问题。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `docs/COMMERCIAL_MULTI_TENANT_ADMIN.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
  - `src/views/account/security.vue`
- Dou-Server 改动文件：
  - `src/lib/adminAuth.js`
  - `src/middleware/requireAdminAuth.js`
- 验证：
  - Dou-Server `node --check src/lib/adminAuth.js`
  - Dou-Server `node --check src/middleware/requireAdminAuth.js`
  - Dou-Server `node --check src/routes/admin/auth.routes.js`
  - Dou-Server 临时库改密 smoke test 通过：旧 token 返回 `40105`，旧密码登录失败，新密码登录成功。
  - Dou-Admin `src/views/account/security.vue` SFC 解析与模板编译通过。
  - Dou-Admin `git diff --check` 通过。
  - Dou-Admin 完整 `vue-tsc` 仍因本机 `node_modules` 顶层类型链接缺失失败，错误为 `@pureadmin/*/volar`、`element-plus/global`、`node`、`vite/client`、`unplugin-icons/types/vue` 类型入口缺失。
- 风险与回滚：后端 JWT 新增 `pwdv` 密码版本校验，线上部署后旧后台 token 会被判为无效，管理员需要重新登录，这是预期安全行为。

### 账号分组与主房间聊天授权

- 时间：2026-05-28 00:30 (Asia/Shanghai)
- 任务目标：补充超级管理员账号分组能力，通过分组授权圈主查看自己绑定圈子的主房间聊天记录。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/router/modules/home.ts`
  - `src/views/account-groups/index.vue`
  - `docs/COMMERCIAL_MULTI_TENANT_ADMIN.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- Dou-Server 改动文件：
  - `src/db/migrations/028_admin_account_groups.sql`
  - `src/lib/adminAccountGroups.js`
  - `src/lib/adminPermissions.js`
  - `src/routes/admin/accountGroups.routes.js`
  - `src/routes/admin/circles.routes.js`
  - `src/routes/admin/index.js`
- 验证：
  - Dou-Server `node --check src/routes/admin/accountGroups.routes.js`
  - Dou-Server `node --check src/routes/admin/circles.routes.js`
  - Dou-Server `node --check src/routes/admin/index.js`
  - Dou-Server `node --check src/lib/adminAccountGroups.js`
  - Dou-Server `node --check src/lib/adminPermissions.js`
  - Dou-Server 临时库全量迁移通过，包含 `028_admin_account_groups.sql`。
  - Dou-Server 账号组授权 smoke test 通过：未授权圈主访问主房间消息返回 `40305`，加入已授权分组后可查看自己圈子主房间消息，访问其他圈子仍被拒绝。
  - Dou-Admin `src/views/account-groups/index.vue` SFC 解析与模板编译通过。
  - Dou-Admin `src/api/admin.ts`、`src/router/modules/home.ts` TypeScript 转译检查通过。
  - Dou-Admin `git diff --check` 通过。
  - Dou-Admin 完整 `vue-tsc` 仍因本机 `node_modules` 顶层类型链接缺失失败，错误为 `@pureadmin/*/volar`、`element-plus/global`、`node`、`vite/client`、`unplugin-icons/types/vue` 类型入口缺失。
- 风险与回滚：主房间聊天记录属于隐私敏感能力，默认不授权；只有超级管理员维护的启用分组且开启授权后，组内圈主账号才能访问自己绑定圈子的主房间记录。

### 商业级后台控制体验

- 时间：2026-05-28 10:15 (Asia/Shanghai)
- 任务目标：配合 Dou-Server 商业控制，补齐圈主后台和 SaaS 页面中的套餐、用量、只读保护展示。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/utils/http/index.ts`
  - `src/views/tenant/dashboard.vue`
  - `src/views/saas/index.vue`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 验证：
  - `node --check scripts/clean-dist.mjs` 通过。
  - 后端临时库全量迁移与商业控制 smoke 通过。
- 下一步：线上用平台管理员和圈主账号回归 SaaS 租户状态、套餐功能开关、私域工具写入拦截和只读提示。
- 风险与回滚：前端只展示后端商业控制状态，不单独决定权限；如提示不符合预期，可回滚本次前端展示变更，后端控制仍可独立生效。

### 右上角通知提醒与圈主商业后台能力整合方案

- 时间：2026-05-28 10:45 (Asia/Shanghai)
- 任务目标：补齐后台右上角通知提醒，覆盖投诉举报、资金相关、到期相关等待办；同时落地一份对标“链动小铺”的圈主商业后台能力整合方案。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/layout/components/lay-notice/data.ts`
  - `src/layout/components/lay-notice/index.vue`
  - `src/layout/components/lay-notice/components/NoticeItem.vue`
  - `src/layout/components/lay-notice/components/NoticeList.vue`
  - `src/views/reports/index.vue`
  - `src/views/manual-reviews/index.vue`
  - `src/views/after-sales/index.vue`
  - `src/views/withdrawals/index.vue`
  - `src/views/tenant/orders.vue`
  - `src/views/saas/index.vue`
  - `docs/CREATOR_COMMERCE_ADMIN_CAPABILITY_PLAN.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 验证：
  - Dou-Admin `pnpm exec vue-tsc --noEmit --skipLibCheck` 通过。
  - Dou-Admin `pnpm exec tsc --noEmit` 通过。
  - 新增中文方案文档和通知相关 Vue/TS 文件已做 UTF-8 检查，无 U+FFFD。
- 下一步：按方案进入圈主商业后台 P0，实现商品/卡密库存、H5 独立下单页、微信/支付宝扫码支付配置、订单交付和资金看板。
- 风险与回滚：通知下拉只读展示后端聚合结果，不改变业务状态；如跳转筛选异常，可先回滚通知组件和对应页面 query 初始化逻辑。方案文档不影响运行。

### GitHub Actions 发布 SSH 断连兜底

- 时间：2026-05-28 11:30 (Asia/Shanghai)
- 任务目标：修复 Dou-Admin 发布流水线在 `Switch release` 步骤偶发 `kex_exchange_identification: read: Connection reset by peer` 导致部署失败的问题。
- 改动仓库：Dou-Admin
- 改动文件：
  - `.github/workflows/deploy.yml`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 验证：
  - Python `yaml.safe_load` 解析 `.github/workflows/deploy.yml` 通过。
  - `pnpm typecheck` 通过。
  - `pnpm build` 通过。
  - `git diff --check` 通过。
- 下一步：推送后观察 GitHub Actions 新一轮部署；若仍在 SSH 握手阶段被服务器 reset，优先排查服务器 `sshd`、安全组、Fail2ban 或宝塔安全策略。
- 风险与回滚：本次只调整发布 workflow，不影响业务代码；如 workflow 兼容性异常，可回滚本次提交，或手动在服务器执行 `mv dist-next dist` 前先确认 `dist-next/index.html` 存在。

### 圈主商业后台 P0 详细落地设计

- 时间：2026-05-28 12:52 (Asia/Shanghai)
- 任务目标：按用户要求继续在 `CREATOR_COMMERCE_ADMIN_CAPABILITY_PLAN.md` 中补齐 P0 设计，而不是直接进入 P1 代码实现。
- 改动仓库：Dou-Admin
- 改动文件：
  - `docs/CREATOR_COMMERCE_ADMIN_CAPABILITY_PLAN.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 验证：Dou-Admin `git diff --check` 通过；Node UTF-8 检查 `CREATOR_COMMERCE_ADMIN_CAPABILITY_PLAN.md`、仓内续航文档和外层续航文档均无 U+FFFD。
- 下一步：按 P0 详细设计推进后台商品中心写操作、店铺资料收口、权限审计、套餐只读保护和通知跳转筛选；P0 收口后再进入 P1 商品中心/H5 独立下单页。
- 风险与回滚：本次仅修改中文设计与续航文档，不影响运行；如 P0 边界调整，可直接修订方案文档后再开发。

### 圈主商业后台 P0 商品中心实装

- 时间：2026-05-28 13:11 (Asia/Shanghai)
- 任务目标：按生产级和商业级标准推进圈主后台 P0，把商品中心从只读列表升级为可创建、编辑、上下架和管理库存的经营页面。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/views/tenant/resources.vue`
  - `src/views/tenant/wallet.vue`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 验证：
  - `pnpm typecheck` 通过。
  - `pnpm build` 通过。
  - 协同后端 `node --check src/routes/admin/tenant.routes.js`、`node --check src/lib/adminPermissions.js` 和动态导入通过。
- 下一步：线上用圈主 owner、租户 staff、只读 viewer 回归商品中心权限、创建编辑、卡密库存、上下架、删除、复制链接、订单跳转、套餐只读和提现权限拆分。
- 风险与回滚：本轮前端写操作依赖 Dou-Server 最新租户商品接口；如线上异常，可先隐藏写按钮或回滚本次 Dou-Admin 提交，后端接口和小程序资源卡购买链路仍可独立运行。

### 圈主商业后台 P0-P5 研发模式固化

- 时间：2026-05-28 13:47 (Asia/Shanghai)
- 任务目标：按用户要求把“先设计文档，再写代码；官方文档优先；GitHub 作为工程参考；生产级和商业级标准”固化到本地记忆库、技能和圈主商业后台方案文档。
- 改动仓库：Dou-Admin
- 改动文件：
  - `docs/CREATOR_COMMERCE_ADMIN_CAPABILITY_PLAN.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 本地技能改动：
  - `C:\Users\Vincent\.codex\skills\vincent-dou-default\SKILL.md`
  - `C:\Users\Vincent\.codex\skills\dou-commerce-production-workflow\SKILL.md`
  - `C:\Users\Vincent\.codex\skills\dou-commerce-production-workflow\references\commerce-phase-gates.md`
- 验证：`dou-commerce-production-workflow` skill 快速校验通过；Dou-Admin `git diff --check` 通过；方案文档、续航文档和本地 skill 文件 UTF-8 扫描无 U+FFFD。
- 下一步：P0 店铺资料页、通知跳转筛选和全角色验收矩阵已补到实现级设计；接下来按文档开发 P0 剩余项和验收脚本。
- 风险与回滚：本次只固化研发规则和文档门禁，不改业务运行逻辑；如后续阶段边界调整，可先改设计文档和技能规则，再进入代码。

### 圈主商业后台 P0 店铺资料权限兜底

- 时间：2026-05-28 14:54 (Asia/Shanghai)
- 任务目标：修复店铺资料 PATCH 误用只读权限的 P0 安全缺口，并将圈主后台店铺页调整为“店铺资料”视角，展示套餐只读和权限提示。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/router/modules/home.ts`
  - `src/views/tenant/circle.vue`
  - `docs/ADMIN_USER_MANUAL.md`
  - `docs/COMMERCIAL_MULTI_TENANT_ADMIN.md`
  - `docs/CREATOR_COMMERCE_ADMIN_CAPABILITY_PLAN.md`
  - `docs/CREATOR_COMMERCE_P0_FOUNDATION_IMPLEMENTATION_DESIGN.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- Dou-Server 改动文件：
  - `src/lib/adminPermissions.js`
  - `src/routes/admin/tenant.routes.js`
- 验证：
  - Dou-Server `node --check src/routes/admin/tenant.routes.js` 通过。
  - Dou-Server `node --check src/lib/adminPermissions.js` 通过。
  - Dou-Server 权限矩阵 smoke 通过：owner/staff 拥有 `tenant:store:manage`，viewer 不拥有。
  - Dou-Server 管理租户路由与权限模块动态导入通过。
  - Dou-Admin `pnpm typecheck`、`pnpm build` 通过。
  - 双仓 `git diff --check` 通过。
- 下一步：线上用 owner、staff、viewer 和到期租户回归店铺资料保存、前端只读提示、后端 403/402 拒绝和审计日志。
- 风险与回滚：如店铺资料保存异常，可临时隐藏保存按钮或回滚本次店铺资料权限提交；后端独立 `tenant:store:manage` 不影响小程序资源卡购买链路。

### 圈主商业后台 P1 商品中心与 H5 商品页后台

- 时间：2026-05-28 18:43 (Asia/Shanghai)
- 任务目标：把 P1 设计落实到管理后台商品中心，支持商品分类、H5 可见性和公开链接复制。
- 改动仓库：Dou-Admin、Dou-Server、Dou-uniapp
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/views/tenant/resources.vue`
  - `docs/CREATOR_COMMERCE_P1_PRODUCT_H5_DESIGN.md`
  - `docs/CREATOR_COMMERCE_ADMIN_CAPABILITY_PLAN.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
  - `docs/GO_LIVE_ACCEPTANCE_CHECKLIST.md`
- 协同改动：Dou-Server 新增 `/api/shop/*`、商品分类和公开链接接口；H5 买家页改由 Dou-Admin `/shop/*` 公开路由承载，Dou-uniapp 不参与本阶段 H5 购买页。
- 验证：
  - Dou-Admin `pnpm typecheck` 通过。
  - Dou-Server 新增后端路由语法检查、临时库迁移和公开 API smoke 已通过。
  - 原方案曾验证 Dou-uniapp H5 页 SFC 编译；现已按用户确认撤回，最终承载改为 Dou-Admin 公开路由。
- 下一步：继续执行三仓提交推送；P2 前确认 H5 生产域名、HTTPS、短链重写、微信/支付宝白名单和支付商户参数。
- 风险与回滚：如分类管理或 H5 链接异常，可先隐藏后台分类管理和复制 H5 链接入口，商品基础管理仍可回退到 P0 能力。

### 圈主商业后台 P1 前端收口

- 时间：2026-05-28 19:10 (Asia/Shanghai)
- 任务目标：完成 Dou-Admin 侧 P1 构建与提交前校验。
- 改动仓库：Dou-Admin、Dou-Server、Dou-uniapp
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/views/tenant/resources.vue`
  - `docs/CREATOR_COMMERCE_P1_PRODUCT_H5_DESIGN.md`
  - `docs/CREATOR_COMMERCE_ADMIN_CAPABILITY_PLAN.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 验证：
  - `pnpm build` 通过。
  - `git diff --check` 通过（仅 CRLF 转换提示）。
  - 本次改动文本经 Node UTF-8 扫描无 U+FFFD 或私用区乱码字符。
- 下一步：随三仓提交推送；线上回归商品分类管理、H5 可见性、公开链接复制和 H5 页面承接。
- 风险与回滚：若后台分类或链接入口异常，可临时隐藏分类管理和复制 H5 链接按钮，保留 P0 商品基础管理能力。

### P1 H5 承载纠偏

- 时间：2026-05-28 19:25 (Asia/Shanghai)
- 任务目标：按用户确认撤回 Dou-uniapp 的 H5 页面，改为由 Dou-Admin 公开构建入口承载买家购买页。
- 改动仓库：Dou-Admin、Dou-Server、Dou-uniapp
- Dou-Admin 改动文件：
  - `src/api/shop.ts`
  - `src/router/index.ts`
  - `src/router/modules/remaining.ts`
  - `src/views/shop/store.vue`
  - `src/views/shop/product.vue`
  - `src/views/shop/checkout.vue`
  - `src/views/shop/order.vue`
  - `src/views/shop/format.ts`
  - `src/views/tenant/resources.vue`
  - `types/router.d.ts`
  - `src/layout/types.ts`
  - `docs/CREATOR_COMMERCE_P1_PRODUCT_H5_DESIGN.md`
  - `docs/CREATOR_COMMERCE_ADMIN_CAPABILITY_PLAN.md`
- 协同改动：Dou-Server 公开链接路径改为 `/#/shop/product/{productKey}` 与 `/#/shop/store/{storeKey}`；Dou-uniapp 已用 revert 撤回 `feat: 增加 P1 H5 商品页`。
- 验证：Dou-Admin `pnpm typecheck`、`pnpm build` 通过；Dou-Server `node --check src/routes/shop/index.js`、`src/routes/admin/tenantProductCategories.routes.js`、`src/routes/admin/tenant.routes.js`、`src/lib/resourceCards.js` 通过；双仓 `git diff --check` 通过（仅 CRLF 转换提示），Admin/Server 改动文本与外层续航文档 UTF-8 扫描通过。
- 下一步：提交并推送 Dou-Admin、Dou-Server；Dou-uniapp 已推送撤回提交 `582735a`。
- 风险与回滚：若 Admin 公开页异常，可临时隐藏后台复制链接入口或关闭 H5 域名；后端 `/api/shop` 公开接口保留，不影响小程序资源卡原购买链路。

### P1 订单状态页字段兼容修复

- 时间：2026-05-29 01:15 (Asia/Shanghai)
- 任务目标：继续回归 Dou-Admin 公开 H5 链路，修复订单状态页字段契约不一致导致的白屏风险。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/shop.ts`
  - `src/views/shop/order.vue`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 协同改动：Dou-Server `/api/shop/orders/:orderId` 补充 `product_summary`，并返回 `resource_*` 兼容别名，避免前后端非原子部署时订单状态页字段错配。
- 验证：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build` 通过；Dou-Server `node --check src/routes/shop/index.js` 通过；双仓 `git diff --check` 通过（仅 CRLF 转换提示）。
- 下一步：线上继续回归店铺页、商品详情页、确认订单页、订单状态页，以及 429 频控、订单不存在、店铺暂停等错误提示。
- 风险与回滚：本次仅补公开订单字段兼容与前端展示兜底，不改变草稿、支付或交付状态机；如异常可回滚本次前端展示修复，后端别名保留不影响旧客户端。

### P1 H5 入口显性化

- 时间：2026-05-29 01:31 (Asia/Shanghai)
- 任务目标：让平台管理员在 `平台治理 / 资源卡管理` 里直接看到并打开 P1 H5 店铺页、商品详情页入口。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/views/resource-cards/index.vue`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 协同改动：Dou-Server 平台资源卡列表/详情补充 `circle_code`、`share_token`、`h5_status`、`public_path`、`store_path`。
- 验证：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build` 通过；Dou-Server `node --check src/routes/admin/resourceCards.routes.js` 通过；双仓 `git diff --check` 通过（仅 CRLF 转换提示）。
- 下一步：部署后刷新资源卡管理页，点击表格右侧 `商品页`、`店铺页`、`复制H5` 验收公开入口；确认订单页由商品详情页下单进入，订单状态页需要订单号或后续支付闭环产生订单。
- 风险与回滚：本次只新增平台后台入口和只读字段，不改变资源卡治理状态；如入口展示异常，可隐藏新增按钮，H5 公开路由和后端公开接口不受影响。

### H5 线上接口与后台代码展示优化

- 时间：2026-05-29 01:55 (Asia/Shanghai)
- 任务目标：修复线上公开 H5 页面打开后请求失败，并清理后台详情里直接显示 JSON/代码块的体验。
- 改动仓库：Dou-Admin
- Dou-Admin 改动文件：
  - `.env.production`
  - `.env.staging`
  - `build/utils.ts`
  - `types/global.d.ts`
  - `src/api/shop.ts`
  - `src/utils/readableDetail.ts`
  - `src/views/reports/index.vue`
  - `src/views/manual-reviews/index.vue`
  - `src/views/audit-logs/index.vue`
  - `src/views/saas/index.vue`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 线上根因：`admin.doucatapp.top/api/shop/*` 当前返回 Admin 前端 HTML；`api.doucatapp.top/api/shop/*` 正常返回 JSON，且 CORS 允许 admin 域访问。
- 前端改动：生产/预发 H5 公共接口基址改为 `https://api.doucatapp.top/api/shop`；H5 API 客户端识别 HTML/异常响应并展示中文提示；举报详情、人工复核、审计日志改为字段化摘要；SaaS 套餐配置从 JSON 文本框改为数字输入和功能开关。
- 验证：
  - `corepack pnpm typecheck` 通过。
  - `corepack pnpm build` 通过。
  - `git diff --check` 通过（仅 CRLF 转换提示）。
  - 构建产物包含 `https://api.doucatapp.top/api/shop`，线上公共店铺接口返回 JSON。
- 下一步：推送触发部署后，回归 `/#/shop/store/{storeKey}`、`/#/shop/product/{productKey}`、确认订单页和订单状态页；若页面仍失败，优先清缓存并检查线上证书/CSP/反代策略。
- 风险与回滚：本次仅调整 Dou-Admin 构建环境和展示层，不改后端状态机；如跨域或证书策略异常，可临时把 `VITE_SHOP_API_BASE_URL` 改回同域并补 Nginx `/api/shop` 反代。

### P1 下单联系方式与同单投诉收口

- 时间：2026-05-29 02:25 (Asia/Shanghai)
- 任务目标：补齐 H5 购买联系方式必填、订单查询凭证和支付成功页投诉举报入口；投诉举报必须与小程序同一订单售后线同步，不修改 Dou-uniapp。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/shop.ts`
  - `src/views/shop/product.vue`
  - `src/views/shop/checkout.vue`
  - `src/views/shop/order.vue`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 协同改动：Dou-Server 新增 `035_h5_order_contact_after_sales.sql`，公开订单查询核验 `buyer_contact`，H5 投诉提交到 `/api/shop/orders/:orderId/after-sales` 并复用 `resource_after_sales`。
- 验证：
  - Dou-Admin `corepack pnpm typecheck` 通过。
  - Dou-Admin `corepack pnpm build` 通过。
  - Dou-Server `node --check src/routes/shop/index.js`、`node --check src/lib/resourceAfterSales.js` 通过。
  - Dou-Server 路由和售后库动态导入通过。
  - Dou-Server `npm.cmd run migrate` 通过并应用到 `035`。
  - 双仓 `git diff --check` 通过（仅 CRLF 转换提示）。
- 下一步：提交推送后进入 P2；P2 先按官方微信支付/支付宝文档校准扫码支付接口、回调、查单、关单和白名单约束。
- 风险与回滚：若 H5 投诉入口异常，可先隐藏订单页投诉表单；后端同单售后接口保留，不影响小程序既有售后接口。

### P2 H5 扫码支付首版闭环

- 时间：2026-05-29 11:04 (Asia/Shanghai)
- 任务目标：基于 P2 设计文档接入 H5 微信 Native 与支付宝当面付扫码支付，完成真实订单、支付意图、二维码、回调/查单、自动交付和订单取货页闭环。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `package.json`
  - `pnpm-lock.yaml`
  - `src/api/shop.ts`
  - `src/views/shop/checkout.vue`
  - `src/views/shop/format.ts`
  - `src/views/shop/order.vue`
  - `docs/CREATOR_COMMERCE_P2_SCAN_PAY_DESIGN.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 协同改动：Dou-Server 新增 `036_commerce_payment_intents.sql`、支付意图服务、微信 Native/支付宝当面付封装、H5 支付接口和 `/api/v0.9/payments/*/notify` 通知路由。
- 验证：
  - Dou-Admin `corepack pnpm typecheck` 通过。
  - Dou-Admin `corepack pnpm build` 通过，仅有 Browserslist/baseline 数据陈旧提示。
  - Dou-Server 支付相关文件 `node --check` 通过。
  - Dou-Server `npm.cmd run migrate` 通过。
  - Dou-Server mock 支付 smoke 通过：微信/支付宝金额不符不交付，金额正确后交付并生成结算，重复回调不重复发货。
  - 双仓 `git diff --check` 通过（仅 CRLF 转换提示）。
- 下一步：提交推送后在线上执行迁移 `036_commerce_payment_intents.sql`，配置真实微信/支付宝商户参数和回调地址，用小额测试商品完成真实扫码回归。
- 风险与回滚：可通过 `WECHAT_NATIVE_PAY_ENABLED=false`、`ALIPAY_PAY_ENABLED=false` 或隐藏前端支付入口暂停通道；未明确支付结果只查单不退款，等待对账处理；Dou-uniapp 本轮未改动。

### 平台端营收与手续费设计

- 时间：2026-05-29 12:07 (Asia/Shanghai)
- 任务目标：调研链动小铺类平台收费模式，结合 Dou 当前商品、H5 支付、钱包、提现和售后设计，形成平台端营收与手续费中文设计文档。
- 改动仓库：Dou-Admin
- 改动文件：
  - `docs/CREATOR_COMMERCE_PLATFORM_REVENUE_DESIGN.md`
  - `docs/CREATOR_COMMERCE_ADMIN_CAPABILITY_PLAN.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 设计结论：第一阶段继续平台统一收款和圈主钱包，不做直清/分账；平台收入按“平台技术服务费 + SaaS 套餐 + 增值工具 + 分销/营销工具 + 人工服务”组合设计；默认交易技术服务费建议 20%，套餐可降档到 15% / 10% / 6%。
- 验证：新增文档、方案索引和续航文档 UTF-8/乱码扫描通过；Dou-Admin `git diff --check` 通过，仅有 CRLF 转换提示。
- 下一步：实现阶段确认最终套餐价格、默认费率、最低提现金额和负余额阈值；优先兼容迁移 `CREATOR_PLATFORM_FEE_RATE` 到基点制 `PLATFORM_TRADE_FEE_BPS`，并补平台收入流水。
- 风险与回滚：本次仅文档变更，不影响运行；若后续费率策略出错，暂停新支付入口，用订单快照和人工调整流水修正。

---

### 支付宝扫码支付前端渠道收口

- 时间：2026-05-29 18:27 (Asia/Shanghai)
- 任务目标：确认当前支付宝扫码支付是否闭环，并让确认订单页优先支付宝、跟随后端渠道可用性禁用不可用支付按钮。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/shop.ts`
  - `src/views/shop/checkout.vue`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 协同改动：Dou-Server 返回订单草稿时补充 `payment_channels`，并收紧支付宝配置完整性和通知验签。
- 关键结论：本轮没有直接安装或引用 npm `alipay-sdk`；前端只消费后端自有支付宝当面付封装产出的二维码和支付意图。
- 验证：`corepack pnpm typecheck`、`corepack pnpm build`、`git diff --check` 通过；改动文件 UTF-8 扫描无 U+FFFD。
- 下一步：服务器拉取双仓后，用真实小额支付宝订单回归二维码生成、扫码、异步通知、查单和已支付订单页。

### 平台收入流水与服务费展示

- 时间：2026-05-31 18:35 (Asia/Shanghai)
- 任务目标：按平台端营收设计 Phase B 实现订单级平台服务费快照、平台收入流水和圈主订单展示。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/views/tenant/orders.vue`
  - `docs/CREATOR_COMMERCE_PLATFORM_REVENUE_DESIGN.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 协同改动：Dou-Server 新增 `037_platform_revenue_ledger.sql`；账务配置优先 `PLATFORM_TRADE_FEE_BPS`，支付成功写平台收入流水，售后退款写收入冲正，退款失败恢复写人工调整。
- 验证：后端 `node --check src/lib/creatorWallet.js`、`src/lib/resourceAfterSales.js`、`src/routes/admin/tenant.routes.js` 通过；`npm.cmd run migrate` 应用到 `037` 成功；双仓 `git diff --check` 通过。前端依赖安装后继续执行 typecheck/build。
- 下一步：做平台后台营收总览和收入流水列表，支持按时间、圈子、支付通道统计 GMV、平台服务费、退款冲正和净收入估算。

### Phase C 平台营收总览与流水

- 时间：2026-05-31 20:10 (Asia/Shanghai)
- 任务目标：补齐平台后台营收可视化入口，让平台管理员能查看平台服务费、退款冲正、通道成本、净收入和收入流水。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/router/modules/home.ts`
  - `src/views/finance/revenue.vue`
  - `docs/CREATOR_COMMERCE_PLATFORM_REVENUE_DESIGN.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 协同改动：Dou-Server 新增 `finance:revenue:view`、`/api/admin/finance/revenue/summary` 和 `/api/admin/finance/revenue/ledger`。
- 验证：
  - Dou-Server `node --check src/routes/admin/revenue.routes.js` 通过。
  - Dou-Server `node --check src/routes/admin/index.js` 通过。
  - Dou-Server `node --check src/lib/adminPermissions.js` 通过。
  - 双仓 `git diff --check` 通过，仅有 CRLF 转换提示。
- 下一步：Phase D 做费率策略展示与配置闭环，先做全局/套餐/租户覆盖费率，不做人工调账和导出。

### Phase D 费率策略展示与配置闭环

- 时间：2026-05-31 21:15 (Asia/Shanghai)
- 任务目标：落地平台默认、套餐和租户覆盖费率的后台配置能力，并让新订单结算按策略固化费率快照。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/router/modules/home.ts`
  - `src/views/finance/fee-policies.vue`
  - `docs/CREATOR_COMMERCE_PLATFORM_REVENUE_DESIGN.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 协同改动：Dou-Server 新增 `038_platform_fee_policies.sql`、`platformFeePolicies` 策略解析、`/api/admin/finance/fee-policies` 管理接口和结算命中链路。
- 验证：
  - Dou-Server `node --check` 覆盖费率策略库、结算库、费率路由、admin index 和租户路由。
  - Dou-Server 动态导入通过。
  - Dou-Server 临时库迁移到 `038_platform_fee_policies.sql` 成功。
  - Dou-Server 费率命中 smoke 覆盖套餐、租户覆盖和到期回落。
  - Dou-Admin 费率页面 SFC 解析通过。
  - 双仓 `git diff --check` 通过，仅有 CRLF 转换提示。
- 下一步：圈主侧展示当前生效费率和升级降费提示；对账中心、导出和人工调账继续后置。

### Phase E 圈主费率提示

- 时间：2026-05-31 22:05 (Asia/Shanghai)
- 任务目标：让圈主后台展示当前生效交易服务费，并给出开通、续费或升级套餐后可降费的提示。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/views/tenant/dashboard.vue`
  - `src/views/tenant/wallet.vue`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 协同改动：Dou-Server `platformFeePolicies` 新增租户费率视图，租户工作台和钱包接口返回当前费率、费率来源和可降费套餐建议。
- 验证：
  - Dou-Server `node --check src/lib/platformFeePolicies.js` 通过。
  - Dou-Server `node --check src/routes/admin/tenant.routes.js` 通过。
  - Dou-Server 动态导入通过。
  - Dou-Server 临时库迁移到 `038` 后的费率视图 smoke 覆盖入门版升级专业版、到期专业版续费提示。
  - Dou-Admin 圈主工作台和钱包页 SFC 解析通过。
- 下一步：做对账中心和导出前的低风险只读能力，优先补平台收入流水导出预览或按圈子/订单的对账筛选；人工调账继续后置。

### 平台营收导出预览

- 时间：2026-06-01 00:00 (Asia/Shanghai)
- 任务目标：补齐平台营收导出前的只读预览，并增强收入流水按状态和支付渠道筛选。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/views/finance/revenue.vue`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 协同改动：Dou-Server `/api/admin/finance/revenue/ledger` 支持 `status`、`pay_channel` 筛选，新增 `/api/admin/finance/revenue/export-preview`。
- 验证：`corepack pnpm typecheck`、`corepack pnpm build`、`git diff --check` 通过；改动文件 UTF-8 扫描无 U+FFFD。
- 下一步：正式导出需要生成脱敏文件并写管理员审计；对账中心继续先做只读列表，不做人工调账。

### 平台营收正式导出与审计

- 时间：2026-06-01 00:00 (Asia/Shanghai)
- 任务目标：按上一轮建议继续推进“平台营收正式导出 + 管理员审计”，让运营可在预览确认后下载 CSV 对账文件。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/views/finance/revenue.vue`
  - `docs/CREATOR_COMMERCE_PLATFORM_REVENUE_DESIGN.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 协同改动：Dou-Server 新增 `finance:revenue:export` 权限和 `/api/admin/finance/revenue/export` CSV 导出接口，导出写 `finance_revenue.export` 管理员审计。
- 边界：导出为只读响应流，不在服务器落持久文件，不改变订单、结算、钱包或营收流水状态；单次导出上限 5000 条。
- 验证：待执行 Dou-Admin typecheck/build、Dou-Server node --check、双仓 diff 与 UTF-8 检查。
- 下一步：验证通过后双仓分别提交推送；线上用超管/1 级管理员回归 CSV 下载和审计日志，用 2 级管理员回归无正式导出权限。

### 对账中心只读列表

- 时间：2026-06-01 00:00 (Asia/Shanghai)
- 任务目标：根据最新续航继续推进对账中心，先做只读异常列表，不做人工调账和资金状态变更。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/router/modules/home.ts`
  - `src/views/finance/reconciliation.vue`
  - `docs/CREATOR_COMMERCE_PLATFORM_REVENUE_DESIGN.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 协同改动：Dou-Server 新增 `finance:reconciliation:view` 权限，挂载 `/api/admin/finance/reconciliation`，实时聚合支付、结算、平台收入流水、退款和提现的异常/待确认项。
- 已完成前端能力：新增 `交易资金 / 对账中心` 页面，展示待核对总数、异常数、提醒数、涉及金额、差额合计、异常类型分布和分页列表；支持日期、异常类型、严重级别、业务域和关键词筛选。
- 边界：本轮只读，不创建对账批次，不写人工调整流水，不导出文件，不改变订单、结算、钱包、退款、提现或平台营收流水状态。
- 验证：
  - Dou-Admin `corepack pnpm typecheck` 通过。
  - Dou-Admin `corepack pnpm build` 通过，构建产物包含 `reconciliation` chunk。
  - Dou-Server `node --check src/routes/admin/reconciliation.routes.js` 通过。
  - Dou-Server `node --check src/routes/admin/index.js` 通过。
  - Dou-Server `node --check src/lib/adminPermissions.js` 通过。
  - Dou-Server 对账路由动态导入通过。
  - 双仓 `git diff --check` 通过，仅有 CRLF 转换提示。
  - 改动文件 UTF-8 扫描无 U+FFFD。
- 下一步：线上用超管/1 级/2 级管理员回归菜单、权限和接口返回；后续再补对账详情、处理标记和人工调账的独立审计方案。

### 对账详情与处理标记

- 时间：2026-06-01 00:00 (Asia/Shanghai)
- 任务目标：继续推进对账中心，在只读列表后补单项详情和处理标记，便于运营记录核对结论。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/views/finance/reconciliation.vue`
  - `docs/CREATOR_COMMERCE_PLATFORM_REVENUE_DESIGN.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 协同改动：Dou-Server 新增 `039_finance_reconciliation_marks.sql`，对账详情接口和对账标记接口。
- 已完成前端能力：对账列表新增标记列；点击“详情”打开抽屉，展示异常说明、建议、关联记录摘要和标记表单；标记支持“跟进中、已处理、忽略”及备注。
- 边界：处理标记只写 `finance_reconciliation_marks` 和管理员审计，不改变订单、结算、钱包、退款、提现或平台营收流水状态。
- 验证：
  - Dou-Server `npm.cmd run migrate` 成功应用 `039_finance_reconciliation_marks.sql`。
  - Dou-Server `node --check src/routes/admin/reconciliation.routes.js` 通过。
  - Dou-Server 对账路由动态导入通过。
  - Dou-Admin `corepack pnpm typecheck` 通过。
  - Dou-Admin `corepack pnpm build` 通过。
  - 双仓 `git diff --check` 通过，仅有 CRLF 转换提示。
  - 改动文件 UTF-8 扫描无 U+FFFD。
- 下一步：线上回归详情、标记审计和权限；人工调整流水继续后置到独立方案。

### Phase I 人工调整流水

- 时间：2026-06-02 00:00 (Asia/Shanghai)
- 任务目标：补齐平台营收人工调整与反向调整闭环，作为对账中心之后的上线前受控修正能力。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/views/finance/revenue.vue`
  - `docs/CREATOR_COMMERCE_PLATFORM_REVENUE_DESIGN.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 协同改动：Dou-Server 新增 `finance:revenue:adjust` 权限、人工调整接口、反向调整接口和 `PLATFORM_REVENUE_ADJUST_MAX_AMOUNT` 配置。
- 已完成前端能力：平台营收页新增“人工调整”抽屉；支持从流水行关联调整；反向调整自动按原流水金额取反；创建和反向都要求原因、固定二次确认文案和提交前弹窗确认。
- 边界：人工调整只写平台营收流水和审计，不修改订单、结算、钱包、退款或提现终态；默认单项金额上限 100000 分。
- 验证：
  - Dou-Server `node --check src/routes/admin/revenue.routes.js` 通过。
  - Dou-Server `node --check src/lib/adminPermissions.js` 通过。
  - Dou-Server 营收路由动态导入通过。
  - Dou-Admin `corepack pnpm typecheck` 通过。
  - Dou-Admin `corepack pnpm build` 通过。
  - 双仓 `git diff --check` 通过，仅有 CRLF 转换提示。
  - 改动文件 UTF-8 扫描无 U+FFFD。
- 下一步：双仓提交推送；线上回归超管/1 级管理员可调整、2 级管理员 403、审计日志详情和反向调整抵消口径。

### 线上财务模块验收脚本

- 时间：2026-06-02 00:00 (Asia/Shanghai)
- 任务目标：把平台营收、对账和人工调整的上线状态检查做成可重复脚本，支撑完整上线前最后一轮回归。
- 改动仓库：Dou-Admin
- Dou-Admin 改动文件：
  - `scripts/verify-finance-online.mjs`
  - `package.json`
  - `docs/CREATOR_COMMERCE_PLATFORM_REVENUE_DESIGN.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 已完成能力：新增 `corepack pnpm verify:finance-online`，默认检查 Admin 构建产物是否包含人工调整入口文案，并检查平台营收 summary 与人工调整接口已部署且受鉴权保护。
- 可选凭证：设置 `ADMIN_AUTH_TOKEN` 可验证超管/1 级管理员具备 `finance:revenue:adjust` 且接口进入参数校验；设置 `ADMIN_L2_AUTH_TOKEN` 可验证 2 级管理员被 403 拦截。
- 当前线上探测：本地环境解析 `admin.doucatapp.top` 到 `28.0.0.5`、`api.doucatapp.top` 到 `28.0.0.6`；端口可连通，但 HTTP 返回空响应或 502，HTTPS 握手失败，暂不能确认线上部署状态。
- 验证：
  - `node --check scripts/verify-finance-online.mjs` 通过。
  - Dou-Admin `corepack pnpm typecheck` 通过。
  - Dou-Admin `corepack pnpm build` 通过。
  - Dou-Admin `git diff --check` 通过，仅有 CRLF 转换提示。
  - 改动文件 UTF-8 扫描无 U+FFFD。
  - `corepack pnpm verify:finance-online` 因线上域名 TLS 建连前 `ECONNRESET` 失败，记录为生产访问/反代阻塞而非本地构建失败。
- 下一步：域名/反代、GitHub Actions 结果和管理员 token 可用后运行 `corepack pnpm verify:finance-online`，再进行页面、权限和审计日志人工回归。

### P3 售后动作与买家风控

- 时间：2026-06-02 00:00 (Asia/Shanghai)
- 任务目标：继续按 P0-P5 推进商用后台，把 P3 未闭环的售后动作、补发资源、换卡密、买家风控和 H5 黑名单阻断补齐。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/router/modules/home.ts`
  - `src/utils/labels.ts`
  - `src/views/tenant/orders.vue`
  - `src/views/risk/buyers.vue`
  - `docs/CREATOR_COMMERCE_P3_AFTERSALE_RISK_FUNDS_DESIGN.md`
  - `docs/ADMIN_USER_MANUAL.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 协同改动：
  - Dou-Server 新增 `040_commerce_after_sale_actions_risk.sql`
  - 新增 `commerceRisk` 买家风控 helper 和 `/api/admin/risk/buyers`
  - 圈主售后接口新增详情、回复、补发、换卡密、退款和退款同步
  - H5 创建订单草稿与草稿转订单都检查黑名单
- 已完成前端能力：圈主订单售后页新增详情抽屉、协商记录、动作轨迹和处理按钮；平台治理新增买家风控页，支持新增和编辑正常、观察、黑名单档案。
- 边界：补发/换码只处理交付和审计，不改变资金；退款终态仍由微信退款、回调或查单确认；买家风控暂不自动封禁。
- 验证：
  - Dou-Server `node --check` 覆盖 `resourceAfterSales`、`commerceRisk`、`commercePayments`、`shop/index`、`admin/tenant`、`admin/afterSales`、`admin/risk`、`admin/index`、`adminPermissions`
  - Dou-Server `npm.cmd run migrate` 成功应用 `040_commerce_after_sale_actions_risk.sql`
  - Dou-Admin `corepack pnpm typecheck` 通过
  - Dou-Admin `corepack pnpm build` 通过，仅有 Browserslist/baseline 数据陈旧提示
- 下一步：完成本阶段双仓提交推送后进入 P4，先做 H5 优惠券领取/使用、订单来源归因和私域转化成交闭环。

### P4 优惠券与邀请码归因闭环

- 时间：2026-06-02 00:00 (Asia/Shanghai)
- 任务目标：把圈主已有优惠券、邀请码和转化漏斗接入 H5 实际成交，让运营工具能影响订单金额并回流成交归因。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/api/shop.ts`
  - `src/views/shop/product.vue`
  - `src/views/shop/checkout.vue`
  - `src/views/shop/order.vue`
  - `src/views/tenant/orders.vue`
  - `src/views/tenant/conversion-tools.vue`
  - `src/views/tenant/conversion-funnel.vue`
  - `docs/CREATOR_COMMERCE_P4_OPERATIONS_DISTRIBUTION_DESIGN.md`
  - `docs/ADMIN_USER_MANUAL.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 协同改动：
  - Dou-Server 新增 `041_commerce_operations_attribution.sql`
  - 新增 `commerceOperations` 统一处理优惠试算、邀请码归因、订单归因、支付核销和退款反冲
  - H5 商品、草稿、支付转订单和圈主订单接口补充优惠和归因字段
  - 转化汇总接口新增归因成交统计
- 已完成能力：H5 商品页试算优惠；草稿创建时锁定应付金额；草稿转订单时二次校验价格和优惠有效性；支付成功后才增加券码/邀请码使用次数；退款后归因记录标记为 refunded。
- 边界：首版不做分销佣金入账，不做买家领券钱包，不做单买家领券限制。
- 验证：
  - Dou-Server `npm.cmd run migrate` 成功应用 `041_commerce_operations_attribution.sql`
  - Dou-Server `node --check` 覆盖 `commerceOperations`、`commercePayments`、`shop/index`、`tenant.routes`、`tenantConversion.routes`、`resourceAfterSales`
  - Dou-Server 路由和运营服务动态导入通过
  - Dou-Admin `corepack pnpm typecheck` 通过
  - Dou-Admin `corepack pnpm build` 通过，仅有 Browserslist/baseline 数据陈旧提示
- 下一步：双仓提交推送后进入 P5 AI 经营助手；P5 需要先按官方 OpenAI 文档确认接口和数据安全边界。

### P5 AI 经营助手

- 时间：2026-06-02 00:00 (Asia/Shanghai)
- 任务目标：完成商用多租户后台 P5，给圈主提供 AI 经营日报、活动文案和历史审计，同时确保 AI 只辅助决策，不自动修改交易、资金、库存、权限或优惠券。
- 改动仓库：Dou-Admin、Dou-Server
- Dou-Admin 改动文件：
  - `src/api/admin.ts`
  - `src/router/modules/home.ts`
  - `src/views/tenant/ai.vue`
  - `docs/CREATOR_COMMERCE_P5_AI_ASSISTANT_DESIGN.md`
  - `docs/ADMIN_USER_MANUAL.md`
  - `docs/CODEX_CONTINUITY_STATE.md`
  - `docs/CODEX_TASK_LEDGER.md`
- 协同改动：
  - Dou-Server 新增 `042_ai_business_assistant.sql`
  - 新增 `src/lib/aiBusinessAssistant.js`
  - 新增 `/api/admin/tenant/ai` 路由
  - 新增 `tenant:ai:view`、`tenant:ai:generate` 权限
  - `.env.example` 补充 `OPENAI_API_KEY`、`AI_DEFAULT_MODEL`、每日限额和请求参数
- 已完成能力：圈主可生成经营日报、生成活动文案、查看历史记录、查看用量、确认或忽略 AI 建议；未配置 OpenAI 密钥时保存失败报告和脱敏摘要，不影响主链路。
- 数据边界：只传聚合脱敏经营数据、商品公开字段、优惠券和转化汇总；不传聊天私密消息、卡密明文、支付密钥、完整 openid/手机号/邮箱/JWT/密码。
- 验证：待执行 Dou-Server `node --check`、`npm.cmd run migrate`，Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build`、双仓 `git diff --check` 和 UTF-8 扫描。
- 下一步：验证通过后双仓提交推送；随后做上线前验收文档和最终手册收口。
