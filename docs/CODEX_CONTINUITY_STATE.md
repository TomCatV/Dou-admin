# CODEX 续航状态（Dou-Admin）

最后更新时间：2026-05-29 18:27 (Asia/Shanghai)

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
- 已改文件：`src/api/admin.ts`、`src/api/shop.ts`、`src/router/index.ts`、`src/router/modules/remaining.ts`、`src/views/tenant/resources.vue`、`src/views/shop/*`、`types/router.d.ts`、`src/layout/types.ts`、`docs/CREATOR_COMMERCE_P1_PRODUCT_H5_DESIGN.md`、`docs/CREATOR_COMMERCE_ADMIN_CAPABILITY_PLAN.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`。
- 已完成前端能力：商品中心新增分类管理弹窗、分类筛选、商品编辑分类、H5 可见/隐藏设置；复制链接改为调用后端公开链接接口，优先使用 `VITE_SHOP_BASE_URL` 拼接 Admin 公开 hash 路由 `/#/shop/product/{productKey}`；公开购买页放在 Admin `/shop/*` 路由，不进入后台布局、不要求登录。
- 协同后端能力：Dou-Server 已新增 `product_categories`、`commerce_order_drafts`、`/api/shop/*`、租户分类接口和公开链接接口。
- 验证结果：Dou-Admin `pnpm typecheck`、`pnpm build` 通过；Dou-Server 公开路由和租户商品路由 `node --check` 通过；双仓 `git diff --check` 通过（仅 CRLF 转换提示），Admin/Server 改动文本与外层续航文档经 Node UTF-8 扫描无 U+FFFD 或私用区乱码字符。
- 下一步计划：提交推送后回归 Admin 公开店铺页、商品详情页、确认订单页和订单状态页；P2 前确认 H5 生产域名、HTTPS、短链重写、微信/支付宝白名单和支付商户参数。
- 风险与回滚：若分类或 H5 链接入口异常，可临时隐藏商品中心分类管理与复制 H5 链接按钮，后端接口和新增字段保留不影响既有资源卡管理。

## 2026-05-29 P1 订单状态页字段兼容修复

- 当前目标：继续回归 Admin 公开 H5 链路，修复订单状态页与 Dou-Server `/api/shop/orders/:orderId` 返回字段不一致导致的潜在白屏。
- 已改文件：`src/api/shop.ts`、`src/views/shop/order.vue`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `src/routes/shop/index.js`。
- 已完成前端能力：`PublicOrder` 同时兼容 `product_*` 与旧 `resource_*` 字段；订单状态页使用计算属性兜底商品标题、摘要和封面；公共 API 客户端允许解析 4xx 业务响应，避免频控等场景展示英文 Axios 报错。
- 协同后端能力：Dou-Server 订单公开接口补充 `product_summary`，并返回 `resource_title/resource_summary/resource_cover_url` 兼容别名，支持前后端非原子部署。
- 验证结果：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build` 通过；Dou-Server `node --check src/routes/shop/index.js` 通过；双仓 `git diff --check` 通过（仅 CRLF 转换提示）。
- 下一步计划：继续线上回归公开店铺页、商品详情页、确认订单页和订单状态页；P2 前仍需确认 H5 生产域名、HTTPS、短链重写、微信/支付宝白名单和支付商户参数。

## 2026-05-29 P1 H5 入口显性化

- 当前目标：回应前端看不到 P1 店铺页、商品详情页、确认订单页、订单状态页入口的问题，把平台资源卡管理页也接入 H5 预览/复制入口。
- 已改文件：`src/api/admin.ts`、`src/views/resource-cards/index.vue`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `src/routes/admin/resourceCards.routes.js`。
- 已完成前端能力：平台治理 `资源卡管理` 表格右侧新增 `商品页`、`店铺页`、`复制H5` 操作；详情抽屉新增 `H5 公开页` 行，展示可访问状态，并可打开商品页、店铺页或复制商品链接。
- 协同后端能力：Dou-Server 平台资源卡列表/详情返回 `circle_code`、`share_token`、`h5_status`、`public_path`、`store_path`，让平台管理员无需切到圈主商品中心即可验收 H5 公开页。
- 验证结果：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build` 通过；Dou-Server `node --check src/routes/admin/resourceCards.routes.js` 通过；双仓 `git diff --check` 通过（仅 CRLF 转换提示）。
- 下一步计划：部署后刷新 `平台治理 / 资源卡管理`，用已发布且审核通过的资源卡点击 `商品页` 和 `店铺页` 回归公开 H5；确认订单页需要从商品详情页点击立即购买后进入，订单状态页需要真实订单号或后续支付闭环产生订单。

## 2026-05-29 H5 线上接口与后台代码展示优化

- 当前目标：修复 `admin.doucatapp.top/#/shop/*` 公开页线上打开后请求失败的问题，并按用户要求清理后台详情里直接展示 JSON/代码块的体验。
- 根因确认：`http://admin.doucatapp.top/api/shop/stores/...` 返回的是 Admin 前端 HTML；`https://api.doucatapp.top/api/shop/stores/...` 返回正常 JSON，因此生产 H5 公共接口不能继续默认走 admin 域相对路径。
- 已改文件：`.env.production`、`.env.staging`、`build/utils.ts`、`types/global.d.ts`、`src/api/shop.ts`、`src/utils/readableDetail.ts`、`src/views/reports/index.vue`、`src/views/manual-reviews/index.vue`、`src/views/audit-logs/index.vue`、`src/views/saas/index.vue`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`。
- 已完成前端能力：生产/预发构建增加 `VITE_SHOP_API_BASE_URL=https://api.doucatapp.top/api/shop` 和 `VITE_SHOP_BASE_URL=http://admin.doucatapp.top`；公开 H5 API 客户端能识别 HTML/异常响应并展示中文业务提示；举报详情、人工复核、审计日志不再展示原始 JSON；SaaS 套餐配置从 JSON 文本框改为数字输入和功能开关，租户设置只显示可读摘要并保留原配置。
- 验证结果：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build`、`git diff --check` 通过；构建产物已确认公共页 API 基址写入 `https://api.doucatapp.top/api/shop`；线上公共店铺接口 `https://api.doucatapp.top/api/shop/stores/8254ecd6-190e-4db6-8718-68a4b131f7e5` 返回 JSON。
- 下一步计划：推送后等待 GitHub Actions 部署完成，再刷新 `admin.doucatapp.top/#/shop/store/8254ecd6-190e-4db6-8718-68a4b131f7e5`、对应商品页和确认订单页；若仍失败，优先检查浏览器控制台是否被旧缓存命中或服务器是否还有额外 CSP/证书策略。

## 2026-05-29 P1 下单联系方式与同单投诉收口

- 当前目标：按用户补充要求，H5 购买联系方式必须填写并作为后续查单凭证；支付成功订单页提供投诉举报入口，且与小程序同一订单售后记录同步，不改 Dou-uniapp。
- 已改文件：`src/api/shop.ts`、`src/views/shop/product.vue`、`src/views/shop/checkout.vue`、`src/views/shop/order.vue`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `src/routes/shop/index.js`、`src/lib/resourceAfterSales.js`、`src/db/migrations/035_h5_order_contact_after_sales.sql`。
- 已完成前端能力：商品详情页联系方式必填；确认订单页缓存联系方式用于后续订单页；订单状态页支持用“订单号 + 下单联系方式”查询，并在已支付订单展示投诉举报表单。
- 协同后端能力：订单表补充 `buyer_contact`、`source_channel`；公开订单查询按联系方式核验；H5 投诉提交到 `/api/shop/orders/:orderId/after-sales`，后端复用 `resource_after_sales`，同一 `order_id` 已有售后单时直接复用。
- 验证结果：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build`、`git diff --check` 通过；Dou-Server `node --check src/routes/shop/index.js`、`node --check src/lib/resourceAfterSales.js`、动态导入、`npm.cmd run migrate` 和 `git diff --check` 通过。
- 下一步计划：P1 收口提交推送后开始 P2；P2 先基于官方微信支付/支付宝开放平台文档校准扫码支付设计，再进入代码实现。

## 2026-05-29 P2 H5 扫码支付首版闭环

- 当前目标：在 P1 H5 商品页和订单草稿基础上接入微信 Native 与支付宝当面付扫码支付，形成“草稿转订单、二维码、回调/查单、自动交付、订单取货”的首版闭环。
- 已改文件：`package.json`、`pnpm-lock.yaml`、`src/api/shop.ts`、`src/views/shop/checkout.vue`、`src/views/shop/format.ts`、`src/views/shop/order.vue`、`docs/CREATOR_COMMERCE_P2_SCAN_PAY_DESIGN.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `036_commerce_payment_intents.sql`、`commercePayments.js`、微信/支付宝支付封装和通知路由。
- 已完成前端能力：确认订单页把草稿转为真实订单，按微信/支付宝生成支付意图，使用本地 `qrcode` 渲染二维码，轮询后端支付状态；支付成功后跳转订单页，订单页只在已支付时展示资源链接、提取码、兑换说明或已分配卡密。
- 协同后端能力：新增支付意图与支付日志；H5 匿名买家用联系方式 hash 生成稳定本地用户，复用订单、资源购买、卡密发放和圈主钱包结算；微信/支付宝回调和查单按金额、商户号/AppID、幂等规则推进支付终态。
- 验证结果：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build` 通过；Dou-Server 支付相关 `node --check`、`npm.cmd run migrate`、mock 微信/支付宝支付 smoke 通过；双仓 `git diff --check` 通过（仅 CRLF 转换提示）。
- 下一步计划：提交推送后服务器执行迁移 `036_commerce_payment_intents.sql`；生产环境配置微信/支付宝商户参数、证书/公钥、API V3 Key、回调 URL 和 H5 域名白名单，再用 0.01-1 元测试商品做真实扫码回归。
- 风险与回滚：若支付通道异常，可先关闭 `WECHAT_NATIVE_PAY_ENABLED=false` 或 `ALIPAY_PAY_ENABLED=false`，隐藏 H5 支付入口；未明确支付结果的订单只查单不退款，人工对账后处理；Dou-uniapp 本轮不变。

## 2026-05-29 平台端营收与手续费设计

- 当前目标：调研链动小铺类发卡/虚拟商品平台的收费业务，结合 Dou 圈主商业后台、H5 扫码支付、钱包结算、提现和售后退款现状，补齐平台端营收与手续费设计文档。
- 已改文件：`docs/CREATOR_COMMERCE_PLATFORM_REVENUE_DESIGN.md`、`docs/CREATOR_COMMERCE_ADMIN_CAPABILITY_PLAN.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`。
- 设计结论：Dou 不应只做“支付手续费”，而应采用“平台技术服务费 + SaaS 套餐 + 增值工具 + 分销/营销工具 + 人工服务”的组合；第一阶段继续平台统一收款和圈主钱包结算，默认交易技术服务费建议 20%，后续随套餐降到 15% / 10% / 6%。
- 关键账务口径：订单支付成功时固化订单级服务费快照，后续退款按订单、结算、钱包顺序冲正；已提现后退款进入平台垫付 + 圈主负余额策略，不直接修改提现终态。
- 下一步计划：实现前确认最终套餐价格、默认费率、最低提现金额、负余额阈值和是否首期免佣；代码阶段优先把现有 `CREATOR_PLATFORM_FEE_RATE` 兼容迁移到基点制 `PLATFORM_TRADE_FEE_BPS` 并新增平台收入流水。
- 风险与回滚：本次仅文档变更，不影响运行；后续若费率配置错误，应暂停新支付入口并用人工调整流水修正，不改历史订单快照。

## 2026-05-29 支付宝扫码支付前端渠道收口

- 当前结论：支付宝扫码支付代码链路和本地验证已闭环；真实生产闭环还需要服务器拉取本次提交、重启、确认 `.env` 与证书路径可读，并用小额真实订单完成支付宝扫码支付、异步通知、查单和取货页回归。
- 本轮没有直接安装或引用 npm `alipay-sdk`；前端只消费后端自有支付宝当面付封装产出的二维码和支付意图。
- 确认订单页默认优先支付宝扫码，支持 `channel/pay/pay_channel` 查询参数指定渠道；订单草稿和转正式订单时都会消费后端 `payment_channels`，禁用不可用渠道。
- 本轮验证：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build`、`git diff --check` 通过；改动文件 UTF-8 扫描无 U+FFFD。

## 2026-05-31 平台收入流水与服务费展示

- 当前目标：按平台端营收设计 Phase B 落地订单级服务费快照、平台收入流水和圈主订单服务费展示。
- 已改文件：`src/api/admin.ts`、`src/views/tenant/orders.vue`、`docs/CREATOR_COMMERCE_PLATFORM_REVENUE_DESIGN.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `037_platform_revenue_ledger.sql`、`src/lib/creatorWallet.js`、`src/lib/resourceAfterSales.js`、`src/routes/admin/tenant.routes.js`。
- 已完成前端能力：圈主后台订单列表新增“平台服务费”和“预计入账”，服务费下方展示本单费率。
- 协同后端能力：结算配置优先基点制 `PLATFORM_TRADE_FEE_BPS`；支付成功时固化 `fee_rate_bps`、`fee_policy_id`、通道成本估算和平台净收入；新增 `platform_revenue_ledger` 并在支付成功、退款冲正、退款失败恢复时写入流水。
- 验证结果：后端 `node --check` 覆盖账务、售后和租户订单路由；`npm.cmd run migrate` 已应用到 `037`；双仓 `git diff --check` 通过。前端依赖已补齐后可继续执行 `corepack pnpm typecheck` 与 `corepack pnpm build`。
- 下一步计划：Phase C 做平台后台营收总览和收入流水列表；真实支付回归继续在线上用商户参数与小额订单完成。

## 2026-05-31 Phase C 平台营收总览与流水

- 当前目标：在 Phase B 平台收入流水基础上补齐平台后台可视化入口，让运营能在 `交易资金 / 平台营收` 查看 GMV、平台服务费、退款冲正、通道成本、净收入、收入构成、圈子贡献和收入流水。
- 已改文件：`src/api/admin.ts`、`src/router/modules/home.ts`、`src/views/finance/revenue.vue`、`docs/CREATOR_COMMERCE_PLATFORM_REVENUE_DESIGN.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `src/routes/admin/revenue.routes.js`、`src/routes/admin/index.js`、`src/lib/adminPermissions.js`。
- 已完成前端能力：新增 `/finance/revenue` 页面和菜单入口；支持日期、业务类型、关键字筛选；展示汇总指标、近 14 天趋势、收入构成、圈子贡献和分页流水；页面不展示原始 JSON/evidence 代码，只显示可读业务摘要。
- 协同后端能力：新增 `finance:revenue:view` 权限和 `/api/admin/finance/revenue/summary`、`/api/admin/finance/revenue/ledger` 只读接口；接口只允许平台全局账号访问，圈主 scope 即使误授权限也不能查看平台营收。
- 验证结果：Dou-Server `node --check src/routes/admin/revenue.routes.js`、`src/routes/admin/index.js`、`src/lib/adminPermissions.js` 通过；双仓 `git diff --check` 通过，仅有 CRLF 转换提示。按本轮约定未启动本地服务、未安装依赖，前端完整 typecheck/build 留给线上发布链路。
- 下一步计划：Phase D 做费率策略只读/编辑闭环，优先把全局默认费率、套餐费率和租户覆盖费率的生效口径展示清楚；暂不做人工调账和导出，避免过早引入高风险资金动作。

## 2026-05-31 Phase D 费率策略展示与配置闭环

- 当前目标：把平台默认、套餐和租户覆盖费率从环境变量推进到可配置、可审计、只影响新订单的后台策略闭环。
- 已改文件：`src/api/admin.ts`、`src/router/modules/home.ts`、`src/views/finance/fee-policies.vue`、`docs/CREATOR_COMMERCE_PLATFORM_REVENUE_DESIGN.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `038_platform_fee_policies.sql`、`src/lib/platformFeePolicies.js`、`src/lib/creatorWallet.js`、`src/routes/admin/feePolicies.routes.js`、`src/routes/admin/index.js`、`src/lib/adminPermissions.js`、`src/routes/admin/tenant.routes.js`。
- 已完成前端能力：新增 `交易资金 / 费率策略`，支持编辑平台默认费率、套餐费率、租户覆盖费率和停用策略；列表展示生效来源、最低/最高服务费、租户覆盖和策略记录，不展示原始 JSON。
- 协同后端能力：新增 `finance:fee-policy:manage` 权限和 `/api/admin/finance/fee-policies` 系列接口；新订单结算按 `租户覆盖 > 有效套餐费率 > 平台默认费率 > 环境默认` 命中并固化 `fee_policy_id`、`fee_rate_bps`；租户到期或套餐停用时回落到平台默认，不影响历史订单。
- 验证结果：后端费率策略、结算、租户路由 `node --check` 和动态导入通过；临时库迁移到 `038_platform_fee_policies.sql` 成功；费率命中 smoke 覆盖套餐、租户覆盖和到期回落；前端费率页 SFC 解析通过；双仓 `git diff --check` 通过，仅有 CRLF 转换提示。未启动本地服务、未安装依赖。
- 下一步计划：Phase E 优先做圈主侧“当前费率/升级可降费”提示，再做对账中心或导出；人工调账继续后置。
