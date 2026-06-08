# CODEX 续航状态（Dou-Admin）

最后更新时间：2026-06-08 (Asia/Shanghai)

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

## 2026-05-31 Phase E 圈主费率提示

- 当前目标：把 Phase D 的费率策略从平台后台延伸到圈主经营视角，让圈主能看到当前生效服务费率，并在可降费时看到开通、续费或升级套餐提示。
- 已改文件：`src/api/admin.ts`、`src/views/tenant/dashboard.vue`、`src/views/tenant/wallet.vue`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `src/lib/platformFeePolicies.js`、`src/routes/admin/tenant.routes.js`。
- 已完成前端能力：圈主工作台 `套餐订阅` 卡片展示当前交易服务费、费率来源和新订单生效说明；钱包页新增当前交易服务费展示，并在有更低费率套餐时提示每成交 ¥100 可少扣的服务费。
- 协同后端能力：Dou-Server 租户工作台和钱包接口返回 `fee_policy`、`fee_policy_upgrade` 和 `fee_policy_options`；升级建议按有效租户、套餐价格和套餐费率计算，支持到期套餐给出“续费”降费提示。
- 验证结果：Dou-Server `node --check src/lib/platformFeePolicies.js`、`src/routes/admin/tenant.routes.js` 和动态导入通过；临时库迁移到 `038` 后的费率视图 smoke 覆盖入门版升级专业版、到期专业版续费提示；Dou-Admin 圈主工作台和钱包页 SFC 解析通过。未启动本地服务、未安装依赖。
- 下一步计划：继续做对账中心和导出前的低风险只读能力，优先补平台收入流水导出预览或按圈子/订单的对账筛选；人工调账继续后置。

## 2026-06-01 平台营收导出预览

- 当前目标：根据最新代码与续航文档继续推进平台营收低风险只读能力，补齐收入流水按支付渠道/状态筛选和导出前预览。
- 已改文件：`src/api/admin.ts`、`src/views/finance/revenue.vue`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `src/routes/admin/revenue.routes.js`。
- 已完成前端能力：`交易资金 / 平台营收` 新增流水状态、支付渠道筛选；新增“导出预览”抽屉，展示匹配流水数、预览笔数、平台服务费、净收入和前 200 条脱敏预览。
- 边界：当前只做导出前只读预览，不生成文件、不写审计、不改变任何资金状态；正式导出和审计留到下一步。
- 验证结果：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build`、`git diff --check` 通过；改动文件 UTF-8 扫描无 U+FFFD。

## 2026-06-01 平台营收正式导出与审计

- 当前目标：在导出预览基础上补齐正式 CSV 导出和管理员审计，形成平台营收对账文件下载闭环。
- 已改文件：`src/api/admin.ts`、`src/views/finance/revenue.vue`、`docs/CREATOR_COMMERCE_PLATFORM_REVENUE_DESIGN.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `src/routes/admin/revenue.routes.js`、`src/lib/adminPermissions.js`。
- 已完成前端能力：预览抽屉新增“确认导出 CSV”，导出前二次确认；成功后浏览器下载 CSV，并提示导出动作已写入审计。
- 边界：导出仍为只读能力，不改变订单、结算、钱包或营收流水状态；单次导出超过后端上限会要求缩小筛选范围。
- 下一步计划：验证通过并提交推送后，线上用超管或 1 级管理员回归导出、审计日志和 2 级管理员无导出权限；对账中心继续先做只读列表，人工调账继续后置。

## 2026-06-01 对账中心只读列表

- 当前目标：承接平台营收导出后的下一步，把对账中心先做成只读异常列表，覆盖支付、结算、平台收入流水、退款和提现的低风险核对入口。
- 已改文件：`src/api/admin.ts`、`src/router/modules/home.ts`、`src/views/finance/reconciliation.vue`、`docs/CREATOR_COMMERCE_PLATFORM_REVENUE_DESIGN.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `src/routes/admin/reconciliation.routes.js`、`src/routes/admin/index.js`、`src/lib/adminPermissions.js`。
- 已完成前端能力：`交易资金 / 对账中心` 新增只读页面；支持日期、异常类型、严重级别、业务域和关键词筛选；展示待核对总数、异常数、提醒数、涉及金额、差额合计、异常类型分布和分页对账列表。
- 协同后端能力：新增 `finance:reconciliation:view` 权限和 `/api/admin/finance/reconciliation` 只读接口；接口实时聚合缺结算、缺收入流水、结算/流水金额不一致、订单服务费负数、支付意图待查单、支付金额不一致、退款待确认、提现待确认和提现锁定不一致等记录。
- 边界：本轮不创建对账批次、不写人工调整流水、不导出文件、不改变订单、结算、钱包、提现、退款或平台营收流水状态；所有记录只用于运营核对和后续人工处理。
- 验证结果：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build` 通过；Dou-Server `node --check src/routes/admin/reconciliation.routes.js`、`src/routes/admin/index.js`、`src/lib/adminPermissions.js` 和动态导入通过；双仓 `git diff --check` 通过（仅 CRLF 转换提示）；改动文件 UTF-8 扫描无 U+FFFD。
- 下一步计划：验证线上权限和接口返回后，再做对账详情/标记处理设计；人工调账继续后置到独立二次确认、审计和回滚方案之后。

## 2026-06-01 对账详情与处理标记

- 当前目标：在只读对账列表基础上补齐单项详情和处理标记，让运营能记录“跟进中、已处理、忽略”的核对结论，但不触碰资金主链路。
- 已改文件：`src/api/admin.ts`、`src/views/finance/reconciliation.vue`、`docs/CREATOR_COMMERCE_PLATFORM_REVENUE_DESIGN.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `src/db/migrations/039_finance_reconciliation_marks.sql`、`src/routes/admin/reconciliation.routes.js`。
- 已完成前端能力：对账列表新增标记列和“详情”操作；详情抽屉展示异常说明、建议、关联订单/结算/收入流水/支付意图/售后/提现摘要，并支持保存处理标记和备注。
- 协同后端能力：新增 `finance_reconciliation_marks` 标记表；新增对账详情接口和标记接口；保存标记时写入 `finance_reconciliation.mark` 管理员审计。标记只依附实时对账项，不修改任何业务资金表。
- 边界：本轮不创建人工调整流水、不释放余额、不重算结算、不同步退款/提现状态；“已处理/忽略”只是运营核对标记，不能代表资金终态已被自动修复。
- 验证结果：Dou-Server `npm.cmd run migrate` 已应用 `039_finance_reconciliation_marks.sql`；`node --check src/routes/admin/reconciliation.routes.js`、动态导入通过；Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build` 通过；双仓 `git diff --check` 通过（仅 CRLF 转换提示）；改动文件 UTF-8 扫描无 U+FFFD。
- 下一步计划：线上回归详情抽屉、标记审计和权限；之后再设计人工调整流水，必须先补二次确认、差额限制、审计详情和回滚/反向调整方案。

## 2026-06-02 Phase I 人工调整流水

- 当前目标：在对账详情与标记之后，补齐上线前必要但受控的“人工调整流水”闭环；只修正平台营收流水口径，不直接改订单、结算、钱包、退款或提现终态。
- 已改文件：`src/api/admin.ts`、`src/views/finance/revenue.vue`、`docs/CREATOR_COMMERCE_PLATFORM_REVENUE_DESIGN.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `.env.example`、`src/lib/adminPermissions.js`、`src/routes/admin/revenue.routes.js`。
- 已完成前端能力：`交易资金 / 平台营收` 增加“人工调整”入口；可从流水行发起关联调整；人工调整和反向调整都要求填写原因、固定二次确认文案，并在提交前再次弹窗确认；手动调整金额以元输入，提交给后端转为分。
- 协同后端能力：新增 `finance:revenue:adjust` 独立权限；新增人工调整接口和反向调整接口；调整写入 `platform_revenue_ledger(manual_adjust)`，反向调整创建金额相反的新流水并把原人工调整标记为 `reversed`；所有动作写入 `admin_audit_logs`。
- 风险边界：默认单次调整任一金额绝对值不超过 `PLATFORM_REVENUE_ADJUST_MAX_AMOUNT=100000` 分；人工调整不释放余额、不重算结算、不触发退款/提现同步、不生成持久导出文件。若线上异常，可隐藏前端“人工调整/反向”入口或临时移除 `/finance/revenue/adjustments` 路由，不影响支付和提现主链路。
- 验证结果：Dou-Server `node --check src/routes/admin/revenue.routes.js`、`node --check src/lib/adminPermissions.js` 和动态导入通过；Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build` 通过；双仓 `git diff --check` 通过（仅 CRLF 转换提示）；改动文件 UTF-8 扫描无 U+FFFD。
- 下一步计划：分仓提交推送后，线上用超管/1 级管理员回归人工调整、反向调整、审计日志和 2 级管理员无调整权限。

## 2026-06-02 线上财务模块验收脚本

- 当前目标：把平台营收、对账和人工调整的上线验收固化为可重复脚本，避免只依赖手工观察 GitHub Actions 或线上页面。
- 已改文件：`scripts/verify-finance-online.mjs`、`package.json`、`docs/CREATOR_COMMERCE_PLATFORM_REVENUE_DESIGN.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`。
- 已完成能力：新增 `corepack pnpm verify:finance-online`，默认检查 `https://admin.doucatapp.top` 和 `https://api.doucatapp.top`；会确认前端构建产物包含“人工调整 / 确认人工调整 / 确认反向调整”，并确认平台营收只读接口、人工调整接口不是 404/405。
- 可选凭证回归：设置 `ADMIN_AUTH_TOKEN` 后，脚本会要求平台营收 summary 返回 200、人工调整接口进入参数校验，并确认当前管理员返回 `finance:revenue:adjust` 权限；设置 `ADMIN_L2_AUTH_TOKEN` 后，会回归 2 级管理员调用人工调整接口返回 403。
- 当前线上探测结果：本地网络能解析并连通 `admin.doucatapp.top` / `api.doucatapp.top` 端口，但当前解析到 `28.0.0.5` / `28.0.0.6`，HTTP 为空响应或 502，HTTPS 握手失败；因此暂不能从当前环境确认线上已完整部署。
- 验证结果：`node --check scripts/verify-finance-online.mjs`、`corepack pnpm typecheck`、`corepack pnpm build`、`git diff --check` 和 UTF-8 扫描通过；`corepack pnpm verify:finance-online` 在当前线上域名因 `ECONNRESET` 失败，符合当前域名/反代阻塞判断。
- 下一步计划：待 GitHub Actions 部署结果、线上域名/反代和管理员 token 可用后，运行 `corepack pnpm verify:finance-online`；再用超管/1 级/2 级管理员完成真实页面和审计日志回归。

## 2026-06-02 P3 售后动作与买家风控

- 当前目标：回到 P3 剩余缺口，把圈主售后动作、补发/换码、平台买家风控和 H5 黑名单下单阻断补齐。
- 已改文件：`src/api/admin.ts`、`src/router/modules/home.ts`、`src/utils/labels.ts`、`src/views/tenant/orders.vue`、`src/views/risk/buyers.vue`、`docs/CREATOR_COMMERCE_P3_AFTERSALE_RISK_FUNDS_DESIGN.md`、`docs/ADMIN_USER_MANUAL.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `040_commerce_after_sale_actions_risk.sql`、`src/lib/resourceAfterSales.js`、`src/lib/commerceRisk.js`、`src/lib/commercePayments.js`、`src/routes/shop/index.js`、`src/routes/admin/tenant.routes.js`、`src/routes/admin/afterSales.routes.js`、`src/routes/admin/risk.routes.js`、`src/routes/admin/index.js`、`src/lib/adminPermissions.js`。
- 已完成前端能力：圈主 `交易资金 / 订单售后` 增加售后详情抽屉，支持查看协商记录和动作轨迹，并执行回复、补发资源、更换卡密、通过并退款、刷新退款；平台 `平台治理 / 买家风控` 可维护正常、观察和黑名单档案。
- 协同后端能力：新增售后动作日志、交付调整记录、买家风控档案；圈主售后接口补齐详情和处理动作；黑名单买家在 H5 创建订单草稿和草稿转订单两处被阻断；平台售后拒绝和平台代发退款也写入动作轨迹。
- 风险边界：补发和换码不改变资金；换码会禁用旧卡密并消耗新卡密库存；退款仍由微信退款请求、回调和查单推进终态；买家风控暂为人工维护，不做自动封禁。
- 验证结果：Dou-Server `node --check` 覆盖售后、风控、租户路由、平台售后、H5 下单、支付转单和权限模块；`npm.cmd run migrate` 已应用 `040`；Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build` 通过。
- 下一步计划：提交推送后继续 P4，优先做 H5 优惠券领取/试用、订单归因和圈主转化工具与实际成交的闭环；最终上线前再做全角色验收和手册收口。

## 2026-06-02 P4 优惠券与邀请码归因闭环

- 当前目标：把已有私域转化工具接入 H5 成交链路，形成优惠券试算、邀请码归因、订单固化和转化漏斗统计的首版闭环。
- 已改文件：`src/api/admin.ts`、`src/api/shop.ts`、`src/views/shop/product.vue`、`src/views/shop/checkout.vue`、`src/views/shop/order.vue`、`src/views/tenant/orders.vue`、`src/views/tenant/conversion-tools.vue`、`src/views/tenant/conversion-funnel.vue`、`docs/CREATOR_COMMERCE_P4_OPERATIONS_DISTRIBUTION_DESIGN.md`、`docs/ADMIN_USER_MANUAL.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `041_commerce_operations_attribution.sql`、`src/lib/commerceOperations.js`、`src/lib/commercePayments.js`、`src/lib/resourceAfterSales.js`、`src/routes/shop/index.js`、`src/routes/admin/tenant.routes.js`、`src/routes/admin/tenantConversion.routes.js`。
- 已完成前端能力：H5 商品页可输入或从链接带入优惠券/邀请码并试算优惠；确认页和订单页展示原价、优惠抵扣和成交来源；圈主订单列表展示优惠抵扣和来源；转化工具可复制带券码/邀请码的商品链接模板；转化漏斗展示归因成交、优惠订单、邀请码订单、优惠抵扣和归因成交额。
- 协同后端能力：订单草稿和订单固化原价、优惠金额、券码、邀请码、活动和归因来源；草稿转订单按最新商品价与优惠规则二次校验；支付成功后才增加优惠券/邀请码使用次数；退款后归因记录标记为 `refunded`。
- 风险边界：首版不做多级分销、不做可提现佣金、不做买家领券钱包；优惠券暂按总量和有效期控制，后续再补单买家限制。
- 验证结果：Dou-Server `node --check` 覆盖运营、支付、H5、租户订单、转化和售后模块；`npm.cmd run migrate` 已应用 `041`；动态导入通过；Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build` 通过。
- 下一步计划：提交推送后进入 P5 AI 经营助手；上线前仍需补全最终验收清单和全角色使用手册。

## 2026-06-02 P5 AI 经营助手

- 当前目标：完成 P5，接入服务端 OpenAI Responses API，给圈主后台提供经营日报、活动文案、历史记录和人工确认闭环。
- 已改文件：`src/api/admin.ts`、`src/router/modules/home.ts`、`src/views/tenant/ai.vue`、`docs/CREATOR_COMMERCE_P5_AI_ASSISTANT_DESIGN.md`、`docs/ADMIN_USER_MANUAL.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `.env.example`、`042_ai_business_assistant.sql`、`src/lib/aiBusinessAssistant.js`、`src/routes/admin/tenantAi.routes.js`、`src/routes/admin/index.js`、`src/lib/adminPermissions.js`。
- 已完成前端能力：新增一级菜单 `AI 经营 / 经营助手`，展示今日用量、模型、配置状态，支持生成经营日报、活动文案、查看历史、打开结果抽屉、复制候选文案、人工确认或忽略建议。
- 已完成后端能力：AI 报告、提示词版本、建议确认表；圈主 AI 路由；每日限额；缺少 `OPENAI_API_KEY` 或 OpenAI 请求失败时保存失败报告和兜底摘要；所有生成写管理员审计。
- 风险边界：AI 只读聚合/脱敏数据，不传聊天私信、卡密、支付密钥、完整 openid/手机号/邮箱/JWT/密码；不自动改价、库存、权限、退款、钱包、优惠券或订单状态。
- 下一步计划：执行后端迁移和语法检查、前端 typecheck/build、diff 和编码扫描；通过后按 P5 双仓提交推送；最后补上线前验收清单并完成最终使用手册收口。

## 2026-06-02 超级管理员 AI 入口权限修复

- 当前目标：修复新增 AI 经营助手权限后，平台全局超级管理员看不到 `AI 经营 / 经营助手` 入口，以及直达路由未校验 `meta.auths` 的问题。
- 已改文件：`src/router/index.ts`、`src/router/modules/home.ts`、`src/router/utils.ts`、`src/views/admin-users/index.vue`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`。
- 已完成前端能力：菜单过滤同时检查角色与 `meta.auths`；直达路由缺少权限时返回 403；AI 经营助手菜单改为全角色可参与角色判断、再由 `tenant:ai:view` 控制实际展示；编辑全局超级管理员时展示后端返回的有效权限，避免旧 `permissions_json` 造成误判。
- 实现口径：远端已具备完整 P5 AI 页面和 API，本轮 rebase 保留远端完整 `src/views/tenant/ai.vue` 与 `tenantAiApi` 实现，只叠加权限入口修复。
- 验证结果：`corepack pnpm typecheck` 通过；`corepack pnpm build` 通过，仅有 Browserslist/baseline 数据陈旧提示；`git diff --check` 与 UTF-8 扫描通过。

## 2026-06-03 H5 联系方式前端校验与记忆

- 当前目标：把 H5 买家联系方式收敛为手机号、QQ号、邮箱三类，前端提交前统一校验合法性，并补浏览器自动记忆，减少下单与查单误填。
- 已改文件：`src/views/shop/contact.ts`、`src/views/shop/product.vue`、`src/views/shop/order.vue`、`docs/ADMIN_USER_MANUAL.md`、`docs/CREATOR_COMMERCE_P1_PRODUCT_H5_DESIGN.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`。
- 已完成前端能力：商品详情页下单前只接受手机号、QQ号或邮箱；订单查询和投诉举报沿用同一规则；校验通过后会规范化联系方式再发请求；输入框补 `autocomplete`、统一 `name` 并保留 sessionStorage 兜底记忆。
- 协同后端口径：Dou-Server 已移除 `buyer_contact` 的内容安全送审；服务端继续负责订单归属核验、黑名单风控与同单售后复用，前端负责 H5 联系方式格式拦截。
- 风险边界：本轮不改支付、订单、售后主链路，不新增新的联系方式类型；旧的微信号填写会在前端直接提示改填手机号、QQ号或邮箱。
- 下一步计划：部署后重点回归 H5 商品下单、订单查询、投诉举报三条链路，覆盖手机号、含空格手机号、QQ号、大小写邮箱和微信号误填提示。

## 2026-06-03 支付失败提示与投诉独立页

- 当前目标：修复支付宝点击“生成支付二维码”后因私钥格式异常导致的白屏/生硬报错体验，并把已支付订单页的投诉表单收口为“投诉按钮 -> 独立投诉页”。
- 已改文件：`src/api/shop.ts`、`src/router/modules/remaining.ts`、`src/views/shop/checkout.vue`、`src/views/shop/order.vue`、`src/views/shop/report.vue`、`docs/ADMIN_USER_MANUAL.md`、`docs/GO_LIVE_ACCEPTANCE_CHECKLIST.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`。
- 已完成前端能力：支付意图创建失败时不再保留错误二维码视图，优先展示后端返回的明确失败原因；已支付订单页只展示投诉按钮和图标，点击后跳转独立 `/shop/order/:orderId/report` 页面填写投诉表单；关闭或失效后的支付单会保留当前状态，并提供“重新生成二维码”入口。
- 协同后端能力：Dou-Server 已把支付宝私钥/公钥解析改为更稳的 PEM 规范化和 `createPrivateKey/createPublicKey` 校验，`DECODER routines::unsupported` 这类 OpenSSL 原始报错会收敛成可读中文提示。
- 验证结果：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build` 通过；本轮构建产物已包含新的 `report` 独立页面与更新后的 `checkout`/`order` chunk。
- 下一步计划：服务器更新双仓后，用真实支付宝小额商品重点回归“生成二维码失败提示、修正私钥后重新生成、支付成功跳订单页、投诉按钮跳转投诉页并提交售后”四步。

## 2026-06-04 支付宝收银台直达与经营总览增强

- 当前目标：继续排查支付宝支付失败，服务端补充 `[alipay-pay]` 脱敏日志；H5 商品页点击购买后直接调起支付宝收银台扫码页；圈主工作台升级为经营总览，覆盖圈主名下全部圈子的资源分类、付费用户排行、收益类型、趋势图、搜索、AI 分析入口和经营工具入口。
- 已改文件：`src/api/admin.ts`、`src/api/shop.ts`、`src/views/shop/product.vue`、`src/views/shop/checkout.vue`、`src/views/tenant/dashboard.vue`、`docs/CREATOR_COMMERCE_P2_P5_PAYMENT_OVERVIEW_FIX_DESIGN.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `src/lib/alipayFacePay.js`、`src/lib/commercePayments.js`、`src/routes/shop/payments.routes.js`、`src/routes/admin/tenant.routes.js`。
- 已完成前端能力：商品页下单后直接创建草稿、固化订单并请求 `alipay_precreate + mode=cashier`，优先跳转支付宝收银台；失败时进入确认页 `autopay=1` 生成站内二维码兜底；确认页支持 `intent_id` 回跳加载和自动轮询。圈主经营总览新增全圈指标、7 日成交趋势、全圈搜索、全部圈子列表、资源卡按类别、付费用户排行榜、收益类型面板、经营建议、AI 分析和经营工具入口。
- 协同后端能力：支付宝请求开始、HTTP 失败、业务失败、成功、页面支付 URL 签发、支付意图创建失败均输出 `[alipay-pay]` 日志；支付意图接口支持 `mode=cashier` 返回实时签名 `cashier_url`；租户工作台返回 `owner_overview`，只聚合当前圈主 owner 名下活跃且审核通过的圈子数据。
- 验证结果：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build` 通过，仅有 Browserslist/baseline 数据陈旧提示；Dou-Server `node --check` 覆盖支付宝封装、支付服务、支付路由和租户路由通过。后端动态导入命令在本机被外层命令转义截断，本轮未把该项作为通过结果记录。
- 下一步计划：提交推送后服务器拉取并重启；确认 `SHOP_H5_BASE_URL` 或 `PUBLIC_ADMIN_BASE_URL` 可生成支付宝 return_url；用真实支付宝小额商品回归“立即购买 -> 支付宝收银台扫码 -> 异步通知/查单 -> 订单交付”，并从宝塔日志检索 `[alipay-pay]` 定位失败原因。
- 风险与回滚：若支付宝收银台异常，可设置 `ALIPAY_PAY_ENABLED=false` 暂停支付宝；前端可临时恢复跳转确认页二维码模式；经营总览新增 `owner_overview` 为只读聚合字段，不改变订单、结算、售后、钱包或 AI 写入主链路。

## 2026-06-04 H5 支付渠道选择恢复

- 当前目标：根据线上回归反馈，修复 H5 商品详情页只剩支付宝的问题，恢复微信扫码和支付宝两种支付渠道选择；同时确认支付宝 `not-online-app` 属于支付宝开放平台应用状态问题。
- 已改文件：`src/api/shop.ts`、`src/views/shop/product.vue`、`src/views/shop/checkout.vue`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `src/routes/shop/index.js`。
- 已完成前端能力：商品详情页购买信息新增支付方式选择，默认微信扫码；选择微信时创建订单草稿后进入确认页并自动生成微信 Native 二维码；选择支付宝时继续直达支付宝收银台扫码；确认页按后端渠道表禁用不可用通道，老接口未返回渠道表时保持兼容。
- 支付宝结论：生产网关返回 `not-online-app` / 应用未上线时，不是前端跳转、私钥格式或签名串问题；需要在支付宝开放平台把当前 AppID 对应应用提交审核并上线后，生产网关才会受理交易。
- 验证结果：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build`、`git diff --check` 和 UTF-8 扫描通过；构建产物与源码均确认包含 `支付方式`、`微信扫码`、`支付宝` 文案。因本机 bundled Playwright 缺 `playwright-core`，未完成截图级浏览器验证。
- 下一步计划：提交推送后服务器拉取并重启；线上用 0.01 元商品分别回归微信扫码、支付宝收银台、支付宝应用上线后的支付通知/查单和订单交付。
- 风险与回滚：若支付宝应用尚未上线，先使用微信 Native 通道验证交易闭环；如微信配置异常，可设置 `WECHAT_NATIVE_PAY_ENABLED=false` 暂停微信通道，商品页会按后端渠道表隐藏不可用入口。

## 2026-06-04 支付宝标准收银台页面修复

- 当前目标：根据支付宝电脑网站支付官方文档，排查 PC 网页端支付宝支付只显示极简二维码页的问题，恢复标准收银台体验。
- 已改文件：`docs/CREATOR_COMMERCE_P2_SCAN_PAY_DESIGN.md`、`docs/CREATOR_COMMERCE_P2_P5_PAYMENT_OVERVIEW_FIX_DESIGN.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `src/lib/alipayFacePay.js`。
- 根因判断：后端旧 `alipay.trade.page.pay` 的 `biz_content` 传了 `qr_pay_mode=4` 和 `qrcode_width=260`，会进入支付宝嵌入式二维码/极简二维码展示模式；标准 PC 收银台默认不传这两个字段。
- 已完成文档能力：P2 支付设计和 P2-P5 修复设计均补充支付宝电脑网站支付官方链接、标准字段口径和 `qr_pay_mode=4` 的边界说明。
- 验证结果：Dou-Server `node --check src/lib/alipayFacePay.js`、`node --check src/lib/commercePayments.js` 通过；本地 RSA 2048 URL 烟测确认 `biz_content` 不再包含 `qr_pay_mode` / `qrcode_width`，且保留 `method=alipay.trade.page.pay`、`sign_type=RSA2`、`product_code=FAST_INSTANT_TRADE_PAY` 和签名；Dou-Admin / Dou-Server `git diff --check` 与改动文件 UTF-8 扫描通过。
- 下一步计划：服务器拉取 Dou-Server 并重启后，用 0.01 元真实订单回归支付宝标准收银台；若手机扫码仍提示 `AE150003030`，继续按支付宝电脑网站支付终端限制、应用状态和风控排查，移动端直付另走 WAP/App 支付接入。
- 风险与回滚：Admin 本轮只更新设计和续航文档；实际支付行为由 Dou-Server 参数修复控制，异常时可临时关闭支付宝通道或回退确认页站内二维码模式。

## 2026-06-04 H5 站内扫码与卡密库存兜底

- 当前目标：根据线上成功支付后的反馈，修复支付宝仍外跳极简二维码页、支付按钮可重复点击、支付宝 return_url 命中后端健康检查、微信扫码页首次空白、卡密售罄仍可继续支付，以及圈主资源卡管理入口不明显的问题。
- 已改文件：`src/views/shop/product.vue`、`src/views/shop/checkout.vue`、`src/views/shop/order.vue`、`src/router/modules/home.ts`、`src/views/tenant/resources.vue`、`docs/CREATOR_COMMERCE_P2_P5_PAYMENT_OVERVIEW_FIX_DESIGN.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `src/lib/commercePayments.js`、`src/lib/orderFulfill.js`、`src/lib/resourceCards.js`、`src/routes/shop/index.js`。
- 已完成前端能力：H5 商品页微信和支付宝都统一进入 Dou 站内 `/shop/checkout/:draftId?autopay=1&channel=...`，不再默认创建 `mode=cashier` 支付单或外跳支付宝页面；购买按钮与生成二维码按钮增加 loading / `aria-busy` / 并发锁；确认页增加自动支付一次性锁、二维码渲染异常兜底和初始化错误兜底；支付成功继续依赖站内轮询跳转订单页，不再依赖支付宝 `return_url`。
- 资源卡入口：圈主后台菜单从“圈内资源”改为“资源卡管理”，页面标题、主按钮和弹窗文案改为“资源卡管理 / 发布资源卡 / 编辑资源卡”，保留已有分类、H5 链接、资源交付、卡密库存和订单入口。
- 订单展示：卡密型已支付订单若仍缺少卡密，前端不再显示“正在分配”，改为“卡密发放异常，请联系商家补货或处理退款”，避免用户误以为系统仍会自动发放。
- 验证结果：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build`、`git diff --check` 通过；构建仅有 Browserslist/baseline 数据陈旧提示；双仓 UTF-8 扫描无 U+FFFD，`git diff --check` 仅有 CRLF 转换提示。
- 下一步计划：提交推送后服务器拉取双仓并重启；线上回归支付宝和微信均进入站内二维码页、按钮防重复点击、扫码后轮询跳订单页、售罄卡密无法创建支付意图、资源卡管理入口可见。
- 风险与回滚：若支付宝站内二维码异常，可暂时设置 `ALIPAY_PAY_ENABLED=false` 隐藏支付宝通道；微信异常可设置 `WECHAT_NATIVE_PAY_ENABLED=false` 隐藏微信通道；资源卡入口文案可单独回退，不影响交易接口。

## 2026-06-04 超级管理员圈主双身份入口

- 当前目标：解决超级管理员本人也是圈主时看不到资源卡新增、编辑、删除和卡密库存入口的问题，把平台全局身份与 Dou 用户圈主身份打通。
- 已改文件：`src/api/admin.ts`、`src/router/modules/home.ts`、`src/utils/auth.ts`、`src/utils/http/index.ts`、`src/utils/tenantContext.ts`、`src/views/admin-users/index.vue`、`src/views/resource-cards/index.vue`、`src/views/tenant/resources.vue`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `src/middleware/requireTenantScope.js`、`src/routes/admin/adminUsers.routes.js`、`src/routes/admin/tenant.routes.js`。
- 已完成前端能力：租户后台菜单允许 `super_admin` 进入，但仍由 `auths` 权限和后端租户上下文兜底；新增 `tenantContext` 本地选择当前经营圈子，租户请求自动带 `X-Tenant-Circle-Id`；登出会清理已选圈子；账号与权限页面支持给全局超级管理员绑定 Dou 用户；平台资源卡页改名为 `资源卡治理` 并提示新增/编辑/库存入口在圈主后台；圈主资源卡管理页支持当前经营圈子提示和切换。
- 用户操作口径：不需要把超级管理员降级或改成租户账号；只需要在 `账号与权限 / 后台账号` 编辑自己的 admin 账号，绑定自己的 Dou 用户。绑定后重新登录，进入 `圈主后台 / 资源卡管理` 即可管理自己名下圈子的资源卡。
- 安全边界：前端仅展示入口，真实圈子归属由 Dou-Server 校验；超级管理员只能以绑定 Dou 用户 owner 的活跃圈子进入租户写接口，不能越权经营平台内任意圈子。
- 验证结果：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build`、`git diff --check` 已通过；构建仅有 Browserslist/baseline 数据陈旧提示；双仓 UTF-8 扫描无 U+FFFD，`git diff --check` 仅有 CRLF 转换提示。
- 下一步计划：部署后用当前超级管理员绑定 Dou 用户并重新登录，回归 `圈主后台 / 资源卡管理` 的发布、编辑、删除、分类、卡密库存和多圈切换；同时确认 `平台治理 / 资源卡治理` 只做审核、下架、禁用和 H5 验收。
- 风险与回滚：本轮不新增迁移；如入口异常，可回滚本次 Admin 改动，已有圈主范围账号仍可按旧路径进入租户资源卡管理。

## 2026-06-05 H5 商品页直付与支付宝权限错误收口

- 当前目标：按线上反馈恢复“商品页选好支付方式后点击立即购买即发起支付”的体验，避免跳入确认页后首屏白屏；微信直接生成支付意图后进入支付页展示二维码，支付宝直接打开官方 `alipay.trade.page.pay` 收银台。
- 已改文件：`src/views/shop/product.vue`、`src/views/shop/checkout.vue`、`src/router/modules/remaining.ts`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `src/lib/commercePayments.js`。
- 已完成前端能力：商品页创建订单草稿后立即固化订单；选择微信时先创建 `wechat_native` 支付意图，再带 `intent_id` 进入 `/shop/checkout/:draftId` 展示已生成二维码和轮询状态；选择支付宝时以 `mode=cashier` 创建 `alipay_precreate` 支付意图并直接跳转 `cashier_url`，不再默认进入订单确认页。
- 兼容处理：旧的 `/shop/checkout/:draftId?autopay=1&channel=alipay` 链接会请求支付宝官方收银台模式；支付页标题改为“支付订单”，保留微信二维码、刷新状态、关闭支付单和失败重试入口。
- 支付宝结论：生产日志里的 `ACQ.ACCESS_FORBIDDEN` / `ACCESS_FORBIDDEN` 是支付宝网关业务拒绝，说明当前 AppID/商户没有被允许调用对应支付能力，优先检查支付宝开放平台应用是否上线、电脑网站支付/当面付是否签约开通、商户与应用是否匹配；不是前端白屏或签名串导致的错误。
- 验证结果：`corepack pnpm typecheck` 通过；`corepack pnpm build` 通过，仅有 Browserslist/baseline 数据陈旧提示；本地 in-app Browser 冒烟打开商品页和支付页假 ID，Vue 应用正常挂载并显示接口兜底错误，无前端 console error；Dou-Server `node --check src/lib/commercePayments.js` 和支付路由语法检查通过；双仓 `git diff --check` 仅有 CRLF 转换提示。
- 下一步计划：服务器拉取双仓并重启后，用真实 0.01 元商品回归微信“立即购买 -> 支付页二维码 -> 扫码付款 -> 订单交付”；支付宝需先确认开放平台应用上线和支付产品签约，之后回归“立即购买 -> 官方收银台 -> 异步通知/查单 -> 订单交付”。
- 风险与回滚：支付宝仍返回 `ACCESS_FORBIDDEN` 时先关闭 `ALIPAY_PAY_ENABLED=false`，保留微信通道交易；如微信 Native 配置异常，可设置 `WECHAT_NATIVE_PAY_ENABLED=false` 隐藏微信通道；前端可回退到站内二维码模式，但不能解决支付宝官方权限拒绝。

## 2026-06-05 资源库导入解析 P0 管理后台

- 当前目标：把外部资源 Excel/CSV 接入 `圈主后台 / 资源库导入`，让圈主在后台上传资源表、查看批次、筛选候选/隔离资源，并把低/中风险候选转为资源卡草稿。
- 已改文件：`docs/RESOURCE_LIBRARY_IMPORT_P0_UI_DESIGN.md`、`src/api/admin.ts`、`src/router/modules/home.ts`、`src/utils/http/index.ts`、`src/views/tenant/resource-library.vue`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`。
- 已完成前端能力：新增 `/tenant/resource-library` 菜单和页面；复用当前经营圈子选择器；支持上传 `.xlsx/.xls/.csv`、批次列表、批次摘要、风险分布、明细关键词/风险/状态筛选、链接检查、隔离原因查看和候选资源转资源卡草稿弹窗。
- 权限边界：页面进入要求 `circle:content:view`；上传和转草稿按钮要求 `tenant:resource:manage`；只读账号可看批次与明细但不能上传或转换；转换默认 `h5_status='hidden'`，生成后回到现有“资源卡管理”继续补封面、预览、价格和上架。
- 上传兼容：`src/utils/http/index.ts` 对 `FormData` 请求移除默认 JSON `Content-Type`，让浏览器自动设置 multipart boundary。
- 协同后端：Dou-Server 新增 `043_resource_library_imports.sql`、`resourceLibraryImports.js` 和 `/api/admin/tenant/resource-imports` 系列接口；P0 不留存原始表格到 COS，只保存结构化批次和明细。
- 验证结果：`corepack pnpm typecheck` 通过；`corepack pnpm build` 通过，仅有 Browserslist/baseline 数据陈旧提示；协同 Dou-Server `node --check`、迁移 smoke、CSV 解析 smoke 和双仓 `git diff --check` 通过。
- 下一步计划：部署后用圈主 owner/staff 上传真实资源表，确认高风险隔离、低/中风险转草稿、转完后“资源卡管理”可搜索到草稿。
- 风险与回滚：如线上需止血，可隐藏 `/tenant/resource-library` 菜单；已转出的资源卡只是草稿，可在资源卡管理中删除，不影响小程序和 H5 既有资源卡交易链路。

## 2026-06-06 AI 经营助手线上中转站协议兼容

- 当前目标：优化 Admin 线上化体验，解释并修复 AI 经营助手线上生成失败；确认运营电脑不需要通过本地 VPN 才能使用线上 AI 助手。
- 已改文件：`docs/CREATOR_COMMERCE_P5_AI_ASSISTANT_DESIGN.md`、`docs/ADMIN_USER_MANUAL.md`、`docs/GO_LIVE_ACCEPTANCE_CHECKLIST.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `src/lib/aiBusinessAssistant.js`、`.env.example`。
- 已完成前端文档口径：Admin 页面只访问 Dou-Server，不直接访问 OpenAI；线上 AI 失败应从服务端环境变量、服务端出网和中转站协议排查，不要求运营浏览器开 VPN。
- 协同后端能力：Dou-Server 新增 `OPENAI_API_PROTOCOL=responses|chat_completions|auto`，支持 Chat Completions 中转站和 `auto` 回退；服务端失败日志增加 `[ai-business] generation failed` 脱敏诊断。
- 验证结果：Admin 本轮仅文档改动，未改页面代码；Dou-Server `node --check`、动态导入、全量迁移、mock Chat Completions/auto fallback smoke、双仓 `git diff --check` 和 UTF-8 扫描均通过，仅有 CRLF 转换提示。
- 下一步计划：部署后在服务器 `.env` 按中转站能力配置协议；官方 OpenAI 保持 `responses`，第三方中转站不确定时用 `auto`，只支持 Chat Completions 时用 `chat_completions`。
- 风险与回滚：Admin 本轮只改文档，不改页面代码；如后端协议兼容异常，可回退 Dou-Server 提交或把协议固定为 `responses`。

## 2026-06-06 AI 经营助手可读化与超管设置入口

- 当前目标：根据用户反馈，把 AI 助手结果从“像代码/JSON”改为可读经营报告；失败生成不计次数；超级管理员默认不限次；新增只有超管可用的平台 AI 设置入口。
- 已改文件：`src/api/admin.ts`、`src/router/modules/home.ts`、`src/views/tenant/ai.vue`、`src/views/ai/settings.vue`、`docs/CREATOR_COMMERCE_P5_AI_ASSISTANT_DESIGN.md`、`docs/ADMIN_USER_MANUAL.md`、`docs/GO_LIVE_ACCEPTANCE_CHECKLIST.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server AI 设置接口、平台设置表和 AI 生成逻辑。
- 已完成前端能力：`/tenant/ai` 抽屉按经营摘要、关键指标、风险提醒、建议动作、卖点、候选文案和合规提示展示；失败报告提示不计次数；用量卡片支持 `不限`；生成按钮按平台总开关和场景开关禁用；新增 `/ai/settings` 页面。
- 超管设置入口：`AI 经营 / AI 设置` 仅 `super_admin` 可见，可调整总开关、经营日报/活动文案开关、模型、协议、中转站 URL、额度、超管不限次、超时和输出 Token；不展示也不保存 `OPENAI_API_KEY`。
- 协同后端能力：Dou-Server 新增 `platform_ai_settings` 独立表与 `/api/admin/ai/settings`；设置写入要求全局超级管理员、调整原因和审计日志；租户 AI 生成服务端强制执行设置和超管不限次。
- 验证结果：`corepack pnpm typecheck`、`corepack pnpm build` 通过，仅有 Browserslist/baseline 数据陈旧提示；协同 Dou-Server `node --check`、AI 模块动态导入、临时库全量迁移到 `044` 和 AI 用量逻辑 smoke 通过；双仓 `git diff --check` 与 UTF-8 扫描通过，仅有 CRLF 转换提示。
- 下一步计划：验证通过后双仓提交推送；线上部署后全局超管进入 `AI 经营 / AI 设置` 保存一次配置，再回归经营日报生成、失败不计数和普通圈主额度。
- 风险与回滚：前端新增设置页和展示改造不改变 AI 报告表结构；如设置页异常，可临时隐藏 `/ai/settings` 菜单，AI 经营助手原租户页仍可按后端默认配置工作。

## 2026-06-08 圈主后台账号派发与多圈子经营

- 当前目标：优化 `账号权限 / 后台账号` 的圈主开通流程，把圈主主账号从“手填账号名 + 单圈子授权”改为“远程搜索小程序用户 + 自动使用 `dxq_id` + 默认经营本人全部活跃圈子”，并补齐后台右上角昵称头像、举报动作权限收口和圈主经营页切圈体验。
- 已改文件：`src/api/admin.ts`、`src/api/user.ts`、`src/views/admin-users/index.vue`、`src/views/reports/index.vue`、`src/views/tenant/dashboard.vue`、`src/views/tenant/orders.vue`、`src/views/tenant/wallet.vue`、`docs/ADMIN_USER_MANUAL.md`、`docs/COMMERCIAL_MULTI_TENANT_ADMIN.md`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`。
- 已完成前端能力：新建/编辑 `tenant_owner` 时改为远程搜索已在微信小程序注册的一键登录用户，下拉展示 `dxq_id / 昵称 / 活跃圈子数`；账号名自动只读显示 `dxq_id`；圈主主账号不再展示“授权圈子/绑定圈主/显示名手填”；列表中对这类账号展示“圈主全部圈子”和活跃圈子数；右上角头像与昵称改为使用后端返回的当前小程序资料。
- 经营页体验：`圈主后台 / 工作台`、`交易资金 / 订单售后`、`交易资金 / 钱包提现` 已统一接入当前经营圈子上下文，支持切换本人名下活跃圈子；当账号暂无可经营圈子时，页面展示 warning 提示而不是空白报错。
- 权限边界联动：举报处理动作下拉按真实权限收口；圈主即便拥有 `report:process`，前端也不会再展示 `ban_user`、圈子关闭、资源卡禁用等超出自身权限的动作入口。
- 协同后端：Dou-Server 已支持 `tenant_owner + bound_user_id + 空 scope_circle_id` 的多圈子模型，并把工作台、成员、圈子、资源卡、售后、通知、举报、人工复核等接口都收口到本人范围。
- 验证结果：`corepack pnpm typecheck`、`corepack pnpm build` 通过；协同 Dou-Server `node --check` 覆盖 `adminPermissions.js`、`tenant.routes.js`、`dashboard.routes.js`、`reports.routes.js` 通过；双仓 `git diff --check` 通过，仅有 CRLF 转换提示；改动文件 UTF-8 扫描无 `U+FFFD`。
- 下一步计划：提交推送后，用平台超管账号回归后台账号开通/编辑页、圈主主账号登录后的右上角昵称头像、圈主工作台/订单/钱包切圈，以及圈主举报处理动作可见性；本地联调优先使用指向 `http://localhost:3001/api/admin` 的 Admin `8849` 端口。
- 风险与回滚：本轮不新增迁移；如多圈子经营范围出现异常，可先回滚 Dou-Admin 圈主主账号表单与切圈页面改动，后端仍兼容旧单圈子模型；如举报动作收口影响平台账号体验，可单独回滚前端动作过滤而不放松后端权限校验。

## 2026-06-08 Dou-Circle 父级文档归档到 Admin

- 当前目标：按用户要求把 `Dou-Circle/docs` 下与管理后台相关的父级文档纳入具体项目仓库，避免父级目录不是 Git 仓库导致方案和续航记录无法随远程提交同步。
- 已新增文件：`docs/DOU_CIRCLE_CODEX_CONTINUITY_STATE.md`、`docs/DOU_CIRCLE_CODEX_TASK_LEDGER.md`、`docs/CREATOR_ADMIN_ACCOUNT_DISPATCH_OPTIMIZATION.md`。
- 归档口径：父级 `CODEX_CONTINUITY_STATE.md` 与 `CODEX_TASK_LEDGER.md` 作为 Dou-Circle 全局快照改名归档，不覆盖本仓已有续航与台账；圈主后台账号派发设计与 Admin 表单、登录态展示、权限动作和切圈体验直接相关，因此归档到本仓。
- 验证计划：提交前复核源文件与归档文件 checksum 一致，执行 `git diff --check` 与 UTF-8 扫描。
- 下一步计划：同一批父级文档还需归档到 Dou-Server 与 Dou-uniapp 对应 docs，并分别提交推送。
- 风险与回滚：仅新增文档，不影响运行时代码；如后续发现文档归属不合理，可移动或删除对应副本后重新提交。

## 2026-06-08 圈子上下文治理筛选与跳转

- 当前目标：优化平台治理后台查看效率，让 `用户管理` 和 `资源卡治理` 都能下拉选择圈子查看圈内数据，并在 `圈子管理` 中直接跳转到对应圈子的用户与资源卡治理页。
- 已改文件：`docs/CIRCLE_CONTEXT_GOVERNANCE_NAVIGATION_DESIGN.md`、`src/api/admin.ts`、`src/views/users/index.vue`、`src/views/resource-cards/index.vue`、`src/views/circles/index.vue`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`，并协同 Dou-Server `src/routes/admin/users.routes.js`、`src/routes/admin/circles.routes.js`。
- 已完成前端能力：用户管理新增远程圈子下拉，资源卡治理从手填圈子 ID 改为远程圈子下拉；两个页面都支持读取路由 `circle_id` 并自动查询；圈子管理列表和详情抽屉新增“看用户 / 看资源”入口，跳转到 `/users?circle_id=...` 和 `/resource-cards?circle_id=...`。
- 协同后端能力：Dou-Server `GET /api/admin/users` 支持 `circle_id/circleId`，按 `circle_members` 返回圈内用户并做 `adminCanAccessCircleId()` 权限兜底；新增 `GET /api/admin/circles/options` 作为治理页通用圈子下拉，按管理员 scope 返回可访问圈子。
- 验证结果：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build` 通过，仅有 Browserslist/baseline 数据陈旧提示；协同 Dou-Server `node --check` 覆盖用户、圈子和资源卡治理路由通过；双仓 `git diff --check` 仅有 CRLF 转换提示；改动文件 UTF-8 扫描无 U+FFFD。
- 下一步计划：部署双仓后，用平台超管和圈主主账号分别回归圈子下拉可见范围、用户管理圈内成员筛选、资源卡治理圈内资源筛选，以及圈子管理跳转后自动带入圈子筛选。
- 风险与回滚：本轮不新增迁移；如圈子下拉异常，可临时隐藏前端下拉，后端 `circle_id` 过滤保持兼容；如权限边界异常，优先回滚 `/circles/options` 或 `/users?circle_id` 后端改动。

## 2026-06-08 资源卡发布分类与图片上传优化

- 当前目标：优化 `圈主后台 / 资源卡管理 / 发布资源卡` 表单，修复分类下拉空白体验，并把封面图、预览图从手填 URL 升级为后台上传，字段契约对齐小程序现有 `cover_url + preview_text + preview_images`。
- 已改文件：`docs/RESOURCE_CARD_PUBLISH_UPLOAD_OPTIMIZATION_DESIGN.md`、`src/api/admin.ts`、`src/views/tenant/resources.vue`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`；协同 Dou-Server 新增管理端图片上传接口。
- 已完成前端能力：发布/编辑弹窗内分类选择器增加空态与“分类管理”入口；新增分类后自动刷新并可回填当前表单；封面图支持上传、替换、移除和缩略图展示；预览图支持最多 5 张上传、缩略图和单张删除；保存时提交 `preview_images` 数组。
- 字段边界：本轮不引入富文本编辑器，不新增数据库字段；购买前仍展示 `preview_text + preview_images`，购买后交付仍使用 `resource_url / resource_access_code / doc_content / doc_url / code_items`。
- 验证结果：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build` 通过，构建仅有 Browserslist/baseline 数据陈旧提示；`git diff --check` 通过，仅有 CRLF 转换提示。
- 下一步计划：部署 Dou-Server 后端接口与 Dou-Admin 前端后，用圈主账号回归分类为空、新增分类、上传封面、上传 1-5 张预览图、保存草稿和上架后小程序详情展示。
- 风险与回滚：前端上传控件可单独回滚为手填 URL；后端新增接口不改变小程序 `/api/v0.9/me/upload-asset` 和既有资源卡创建/编辑接口。
