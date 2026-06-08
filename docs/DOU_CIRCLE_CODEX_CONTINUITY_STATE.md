# CODEX 续航状态（Dou 双仓）

最后更新时间：2026-06-08 (Asia/Shanghai)

## 当前任务
- 圈主后台账号派发优化：超管新建圈主后台账号时改为远程搜索已在微信小程序注册的一键登录用户，账号名自动使用 `dxq_id`，登录后右上角昵称/头像跟随当前小程序资料；圈主主账号默认经营绑定用户自己名下全部活跃圈子，不再强制单圈子授权；平台治理、售后、通知、工作台统计与圈主经营页已按多圈子范围收口，并在工作台、订单售后、钱包页补齐切圈入口。
- 我的页未登录态与钱包费率说明：已收敛未登录“我的”页展示，创建/加入圈子统计固定为 0，隐藏会触发登录态接口的菜单，仅保留“关于抖小圈”；钱包首页与提现页改为展示服务端返回的当前圈主平台服务费率、最低/封顶规则，并明确提现不再额外扣平台服务费。
- 圈主收益结算与微信提现：主流程已调通，旧“提现中”单据的用户侧恢复入口已补齐，让旧单可被查看、刷新、拉起微信确认或撤销退回后重新提现。
- 资源卡购买闭环：后端与前端首版已落地，支持圈主创建/管理/发布资源卡，用户购买后查看交付内容并进入资源答疑区；下一步进入部署迁移与小程序回归。
- 小程序主包体积优化：上传时报 `main package source size 2056KB exceed max limit 2048KB`，已将本地大图 `static/logo.png` 与 `static/logo-on-black-preview.jpg` 外置到腾讯云 COS，前端改用远程品牌资源地址，避免两张图进入主包。
- 小程序上传兼容修复：微信开发者工具随后报 `ENOENT ... unpackage/dist/dev/mp-weixin/common/assets.js`，已将品牌资源模块迁到源码 `common/assets.js`，确保构建产物生成上传器期望的 `common/assets.js`。
- v1.0 产品主线调整：根据产品文档确认付费副房间不是当前 MVP 核心，主房间应承担免费流量池、公告与资料卡橱窗；本次已在聊天主房间顶部前置资料卡橱窗，并在右上增加“资料”入口。
- 内容审核模块切换：已去掉本地文本词库和 `opennsfw2` 图片审核服务，改用腾讯云 COS 数据万象自动审核；文本写入 `audit/text/*.txt` 触发审核，图片上传 COS 后自动审核，统一回调 `https://api.doucatapp.top/api/v0.9/webhooks/tencent/cos-audit`。
- 主房间治理：后端已增加主房间成员发言控制开关，前端房间设置页已接入；可让圈主/管理侧将主房间调整为公告与资料卡优先的低噪声入口。
- 圈子多公告：后端新增多公告表、接口、实时事件和弹窗广播；前端已接入圈子编辑/房间设置/聊天页公告展示与实时更新。
- 付费副房间降级：前端保留付费副房间代码和历史能力，但隐藏新增入口，避免 v1.0 用户路径被付费副房间打散。
- 主房间单房间展示优化：当前仅一个聊天室时，聊天页不再展示“主房间”标签栏，顶部副标题只保留人数；资料卡橱窗说明仅面向普通用户展示，并保持单行完整展示。
- 手机号能力临时关闭：因短信/手机号相关手续暂未办好，前端新增统一开关并隐藏绑定手机号、手机号登录和登录密码入口；底层页面与接口保留，后续手续完成后可恢复。
- 广场申请角标修正：右上角红色数字不再使用系统通知未读总数，改为与“我的申请/圈子审批”一致的待审核申请总数，避免点击后列表为空但仍显示数字。
- 资料卡橱窗间距优化：普通用户查看他人圈子主房间时，资料卡橱窗说明与标题之间增加间距，避免文案贴近标题。
- 资料卡橱窗纸感配色优化：主房间资料卡橱窗改为低饱和纸张底色、墨色标题、柔和边框与克制强调色，暗色主题同步收敛为纸墨色，减少原先高饱和渐变带来的“AI味”。
- 我的页顶部视觉优化：`我的` 页面顶部从深色橙棕渐变改为纸感暖色体系，头像、设置按钮、统计卡与资料卡橱窗统一为低饱和纸张底色、柔和边框和克制橙色数字。
- 前端全局配色体检：已全量扫描 Vue 页面，统一全局 theme token、圈子/聊天/广场/通知/钱包/资源卡/账号分包/法务页的旧高饱和橙、亮蓝、紫色与 iOS 灰底，收敛到纸感暖色与纸墨暗色体系；业务状态红/绿/黄保留。
- 客服邮箱统一：前端新增 `constants/contact.js`，统一将法务/帮助/协议/隐私/合规里的客服邮箱改为 `2363984977@qq.com`；后端无邮箱硬编码命中。
- 聊天实时体验修复：聊天页发送文本/图片后使用发送接口返回的消息立即更新本地列表，审核通过后的 WebSocket 回包会 upsert 同一条消息；移除聊天页 3 秒 REST 轮询，实时更新改为 WebSocket，进页面/切房间只做一次性拉取。
- 聊天文字审核体验修复：聊天文字消息不再等待腾讯云 COS 数据万象异步回调才公开，发送接口先按 `pass` 写入并立即 WebSocket 广播；后台继续写入 `audit/text/*.txt` 做内容安全审核，若回调后判定拒绝/复核再通过 `chat.message.updated` 通知前端隐藏或提示。
- 聊天发前安全闸口：后端新增本地高风险词拦截和腾讯云 CI 同步审核，明显违规文本不入库、不进 WebSocket；前端发送失败时恢复输入框内容，方便用户修改后再发。
- 聊天违规词绕写拦截修复：本地文本安全词表归一化会剔除空格、标点、半角/全角数字等干扰字符，`约111炮111` 会在进入腾讯云同步审核前命中 `约炮` 并直接返回违规提示。
- 聊天本地记录删除：房间设置页新增“删除聊天记录”，按当前用户 + 圈子写入本地清空时间点并清理本地消息缓存；聊天页加载缓存、历史接口与 WebSocket 更新时都会过滤清空时间点之前的消息，效果等同 QQ 的本机删除，不影响服务端记录和其他成员。
- 聊天页进房滚动修复：重新进入聊天页时，消息列表在数据加载、资料卡橱窗撑开后都会再次滚动到底部，避免停在历史消息中间；“删除聊天记录”入口已调整到解散/退出圈子前面。
- 资源卡预览部分优化：资源标题占位改为更中性的示例；“试看说明”改为“预览部分”，圈主可上传最多 5 张预览图，用户购买前在资源详情页可直接查看预览图；说明文档链接改为购买后可复制打开，不再用 WebView 业务域名文案误导圈主。
- 资源卡交付方式升级：资源卡创建/编辑页新增“资源交付 / 卡密交付”二选一；资源交付只填资源链接、提取码和使用说明，卡密交付批量粘贴一行一个卡密，支付成功后后端自动发放一条未使用卡密给购买用户。
- 资源卡链接类型自动识别：资源卡编辑页移除“百度网盘 / 夸克网盘 / 其他”手动按钮，改为根据资源链接展示轻提示；前端不再提交 `resource_type`，后端统一从 `resource_url` 推断，避免圈主多填或填错。
- 资源卡分享文本误审修复：圈主把夸克/百度整段分享文案粘到资源链接时，前端和后端都会自动提取首个 `http(s)` 链接；资源链接、提取码、文档链接不再作为正文进入同步文本审核，避免腾讯 CI 将交付链接误判为违规内容。
- 资源卡兑换说明链接误审修复：卡密交付的 `doc_content` 不再和公开标题/简介一起作为完整正文送同步审核；后端会先对完整兑换说明跑本地高风险词拦截，再剥离 URL 后送腾讯 CI 与异步审核，避免 `https://mintapi.cn/` 这类交付链接被误判为 45101。
- 多处回归修复：资源答疑区点击“退出”后会离开页面；聊天页资料卡橱窗展开体改为浮层，不再挤压聊天内容；资源卡管理页按“资源区 / 卡密区”分类查看；邀请二维码统一使用服务端默认小程序版本，避免开发版码过期；客服邮箱变量移入法务分包，避免主包未使用 JS。
- 圈子创建二次审核修复：圈子创建/编辑时文字与图片已走发前同步安全检查，通过后圈子资料直接保持 `pass`，不再因旧 COS 异步审核任务被标成 `pending`；新增迁移 `020_circle_profile_sync_audit.sql` 会把历史误 pending 的活跃圈子恢复为通过。
- 资源卡公开展示修复：资源卡创建/编辑/发布时已走发前同步安全检查，通过后直接保持 `pass`；后台 COS 异步审核不再先把资源卡改为 `pending`，普通账号扫码进圈子详情可立即看到已发布资源卡；新增迁移 `021_resource_card_sync_audit.sql` 会把历史误 pending 的已发布资源卡恢复为通过。
- 资源卡公开列表兜底与橱窗布局优化：公开资源卡列表会在返回前修复同圈子内已发布但仍处 `pending` 的旧资源卡，避免普通用户只看到卡密区资源；聊天页资料卡橱窗改为一行露出 2 张多的小卡片，浮层补回纸感背景，折叠态只保留一个展开按钮以减少占用空间。
- 资料卡橱窗二次压缩：主房间资料卡小卡高度压缩到 62px，封面改为方形 `aspectFit` 防止拉伸变形；空房邀请卡场景下展开橱窗改为占位布局不再遮住邀请卡；折叠态组件本身 0 高度，只在右上浮动一个展开按钮，去掉左侧突兀空白。
- 小程序上传缺 contact.js 修复：恢复主包 `constants/contact.js` 作为客服邮箱唯一变量源，`sub-legal/constants/contact.js` 改为转出主包变量，并即时补齐本机 `unpackage/dist/dev/mp-weixin/constants/contact.js`，避免微信开发者工具因旧 sourcemap 继续打开缺失文件时报 ENOENT。
- 资源卡分类切换报错修复：线上资源卡列表接口 500 根因是 SQL.js 封装的 `run()` 不返回 `{ changes }`，而资源卡公开列表兜底读取了 `result.changes`；已补齐数据库封装返回值并在资源卡路由加空值兜底，前端管理页分类/状态筛选点击也改为 `data-value` 读取，避免小程序事件作用域异常。
- 资源卡售后申诉 MVP：参考本地 Word《链动小铺平台商家开店指引（新版）》售后规则，已新增 24 小时内订单售后、买家/圈主协商消息、买家撤销、圈主主动退款能力；前端新增申请售后、售后列表和售后详情页，并在资源交付页、我的已购资源、我的页和通知页接入入口。当前退款为 Dou 本地状态冲正，不是微信支付原路退款。
- 资源卡售后微信原路退款：已根据微信支付官方退款文档补齐生产级退款链路，新增 `023_resource_after_sales_wechat_refunds.sql`、微信退款请求/查询封装、退款结果回调 `/api/v0.9/payments/wechat/refund/notify`、退款 API 日志、售后详情刷新退款状态；圈主主动退款会先冲正收益并关闭交付权限，再调用微信 `POST /v3/refund/domestic/refunds`，`SUCCESS` 后最终关闭订单，`PROCESSING` 保持退款中，`CLOSED/ABNORMAL` 会恢复收益和交付。
- 资源卡售后体验修复：申请售后页邮箱输入框聚焦时会主动滚动到字段并给键盘留白，避免文字被顶出输入框；售后详情图片消息改为和主房间一致的透明图片展示；后端新增售后已读游标和未读统计接口，前端“我的-售后与申诉”和“系统通知”菜单角标会随进入处理/详情后刷新变化。
- 聊天右上设置入口调整：聊天页右上角 `...` 不再弹出“房间设置 / 投诉举报”动作菜单，改为直接进入房间设置；房间设置页新增“投诉举报”入口，并携带当前圈子和房间上下文跳转到投诉举报页。
- 管理后台技术设计：已新增 `Dou-Server/docs/ADMIN_CONSOLE_TECHNICAL_DESIGN.md`，明确后台采用独立 PC Web 项目 `Dou-Admin`，前端推荐 Vue 3 + Vite + TypeScript + Element Plus，后端复用 Dou-Server 并新增 `/api/admin/*`，第一阶段优先落地举报处理、内容治理、管理员权限和操作日志闭环。
- 管理后台 Phase 1 实现：基于 `pure-admin/pure-admin-thin` 初始化独立 PC Web 项目 `Dou-Admin`，接入 Dou-Server `/api/admin/*`，完成管理员登录、工作台统计、举报列表/详情/处置、操作日志；后端新增管理员账号、管理员审计日志、举报处理字段和举报处置接口。
- 管理后台 Phase 2 账号权限：后端新增 `026_admin_accounts_permissions.sql`、账号权限模型、管理员改密、超管账号管理、重置密码、圈主范围账号和按圈过滤举报；前端新增“账号与权限”和“修改密码”页面，登录态改为使用后端返回权限，圈主范围账号只显示工作台、举报处理和修改密码。
- 管理后台前端自动部署：Dou-Admin 已新增 `scripts/deploy-baota.sh` 与 `docs/BAOTA_CICD_DEPLOY.md`，用于宝塔 WebHook 在 GitHub push 后自动拉取 `main`、安装依赖、执行 `pnpm build` 并更新 `/www/wwwroot/Dou-admin/dist`。
- 管理后台前端构建清理修复：线上 `pnpm build` 被宝塔生成的 `dist/.user.ini` 卡住，已新增 `scripts/clean-dist.mjs` 并把构建脚本改为先解除 `.user.ini` 不可变属性再删除旧 `dist`，避免自动部署和手动构建再次失败。

## 当前状态
- 已确认 Dou 业务第一阶段不走微信实时分账，而走「平台统一收款 -> 平台抽佣记账 -> 圈主钱包 -> 圈主提现 -> 微信商家转账到微信零钱」。
- 官方场景选择为「佣金报酬」，`transfer_scene_id=1005`，`user_recv_perception` 默认 `开工利是`，报备信息固定传 `岗位类型` 与 `报酬说明`。
- 已补齐微信商家转账官方文档链路：产品介绍、权限申请、开发指引、发起转账、JSAPI 调起确认收款、查单、回调、佣金报酬、电子回单、免确认授权相关文档。
- Dou-Server 最新提交：
  - `7529919 feat: 增加圈子多公告接口`
  - `cb955af feat: 增加主房间成员发言控制`
  - `f5b4543 接入腾讯云数据万象内容审核`
  - `281c364 feat: 增加资源卡购买闭环`
  - `3ccc372 补充提现记录列表接口`
- Dou-uniapp 最新提交：
  - `13b4000 fix: 保留付费副房间代码并隐藏入口`
  - `df10816 feat: 接入圈子多公告前端`
  - `ad587f4 优化小程序代码质量检查`
  - `f23c4a6 同步内容审核状态展示`
  - `5a4f5c4 feat: 增加资源卡前端页面`
- 后端已新增钱包/提现表迁移、钱包服务、微信商家转账封装、钱包接口、商家转账回调接口，并在订单履约成功后创建圈主收益结算。
- 前端已新增“我的钱包”入口、钱包首页、收款账户页、提现页、提现详情页，以及 `wx.requestMerchantTransfer` 调起封装。
- 最新体验优化：钱包页明确展示待结算收益和预计转为可提现时间；提现页补充简洁提现规则；提现时后端会自动绑定当前微信 OpenID，不再要求用户先手动理解/绑定“收款账户”。
- 最新测试优化：`CREATOR_SETTLEMENT_FREEZE_DAYS` 默认改为 `0`，钱包查询/提现前会将历史 pending 立即释放为可提现，并同步修正 `available_at`，避免可提现余额与提现结算单不一致。
- 最新前端优化：钱包首页去掉“刷新余额”按钮，改为收益仪表盘氛围；保留下拉刷新；新增当前不冻结的规则说明；钱包、提现、收款账户页补齐暗黑主题样式。
- 最新排障优化：提现页输入框聚焦时改为滚动定位，避免键盘遮挡金额/按钮；微信商家转账 HTTP 失败会打印 `[wechat-transfer] create transfer failed`，包含脱敏请求体、HTTP 状态、微信原始响应体和错误信息。
- 最新修正：提现页撤回滚动容器方案，改用 `disableScroll=true` 与输入框 `adjust-position=false`，避免微信键盘自动顶起页面导致金额数字被遮挡；商家转账请求会剔除空字段，空 `notify_url` 不再传给微信，并在失败日志中补充响应头/request-id。
- 最新官方文档结论：`佣金报酬` 场景下 `user_recv_perception` 只是微信确认收款页展示文案，Dou 已按产品体验改为 `开工利是`；商家助手/基本账户显示的余额不等同于商家转账出资运营账户余额；若微信返回 `403 NOT_ENOUGH`，需给商家转账运营账户充值后按原 `out_bill_no` 重试。
- 最新后端优化：商家转账创建失败后会先按原商户单号查单；`NOT_ENOUGH`、`NO_AUTH` 和泛 403 会返回更明确的排查提示，避免只显示“未知错误”。
- 最新提现详情修复：微信商家转账查单接口不再附带旧版 `mchid` 查询参数，避免微信返回“请求中含有未在 API 文档中定义的参数”；等待确认但缺 `package_info` 时会自动查单补回；前端 `wx.requestMerchantTransfer` 会带 `openId`，并打印确认/同步失败日志。
- 最新撤销修复：微信提现撤销新增本地 `canceling` 过渡态；微信撤销接口返回 `CANCELING` 时，后端不再直接释放余额并误报“已退回”，而是要求继续查单/回调落到 `CANCELLED` 后再退回余额；前端详情页同步展示“撤销处理中”。
- 最新提交提现修复：微信发起转账/查单 HTTP 200 但响应体为空或缺少 `state` 时，后端按“结果不明确”处理，保留原 `out_bill_no`、保持提现单 `approved`、不释放余额；前端不再把提交提现视为失败，而是进入提现详情页展示处理提示，供用户稍后刷新或原单重试。
- 最新原单重试修复：微信发起转账 200 空响应后，后端会标记已尝试提交、记录响应头/原始文本、按原 `out_bill_no` 退避查单；后续点击“去微信确认收款”会先查原单，查不到明确状态才用同一 `out_bill_no` 原单重试，避免直接释放余额或盲目换单。
- 最新回退修正：已发起但查单仍为空的 `approved` 提现不再继续走“重新发起转账”分支，只返回待刷新/原单重试提示，避免再次撞出微信 400。
- 最新直击修复：微信商家转账请求明确发送 `Accept-Encoding: identity`，并改为读取原始响应字节后手动兼容 `deflate` / `gzip` / `br` 解压，解决日志中 `content-length` 非 0 但 `responseText` 为空、无法拿到 `state/package_info` 的问题。
- 最新入参修正：商家转账 `appid` 改为优先使用小程序登录的 `WECHAT_MINI_APP_ID`，确保与用户 `openid` 同源；发起前增加本地参数校验，缺必填字段、佣金报酬报备信息或 2000 元以上缺实名时先在后端拦截。
- 最新资金安全收敛：终态提现不再返回 `merchant_transfer` / `package_info`；成功、失败、撤销和撤销处理中会清理旧确认参数；撤销返回空状态时进入 `canceling`，不释放余额，等待查单或回调确认。
- 最新平台配置结论：微信确认收款页的“某某向你转账”来自微信支付商户平台的商户简称，如需改为“Dou小圈”需要在微信支付商户平台修改，后端接口入参无法覆盖该文案。
- 最新前端细节：提现金额输入行加高，金额字号略放大；提现详情页缺少 `merchant_transfer` 时改用弹窗展示后端原因，避免长提示被 toast 截断。
- 最新旧单恢复入口：后端新增 `GET /api/v0.9/me/withdrawals` 提现记录列表，支持 `status=open` 获取处理中旧单；前端钱包首页新增“提现记录”区块，优先展示处理中旧单，点击进入详情页继续按原单刷新微信状态、拉起确认收款，或在确认未成功时撤销退回可提现余额再重新提现。
- 最新管理后台后端：新增迁移 `025_admin_console_base.sql`，包含 `admin_users`、`admin_audit_logs`，并给 `reports` 增加 `handled_by_admin_id`、`handled_at`、`handle_note`、`handle_action`、`target_snapshot_json`；新增 `/api/admin/auth/login`、`/api/admin/auth/me`、`/api/admin/dashboard/summary`、`/api/admin/reports`、`/api/admin/reports/:id/actions`、`/api/admin/audit-logs`。
- 最新管理后台前端：新增 `Dou-Admin` 项目，技术栈为 Vue 3 + Vite + TypeScript + Element Plus + Pinia + pure-admin-thin；已替换为 Dou 品牌、独立 API Base、静态路由菜单和举报处理工作流，并清理模板 fake server、SSO 测试入口和权限演示页。
- 最新管理后台账号权限：`admin_users` 新增 `scope_type`、`scope_circle_id`、`bound_user_id`、`permissions_json`、`password_changed_at`、`created_by_admin_id`；`super_admin/global` 拥有全局账号管理，`operator` 可处理举报，`viewer` 只读，`scope_type='circle'` 用于给特定圈主开后台，默认只能查看授权圈子的工作台和相关举报。新增接口 `/api/admin/auth/change-password`、`/api/admin/admin-users/*`；前端新增账号管理、改密和权限菜单控制。
- 最新资源卡后端：新增 `014_resource_cards.sql`，包含 `resource_cards`、`resource_purchases`、`resource_comments`、`resource_discussion_members`、`resource_discussion_messages`、`resource_delivery_access_logs`，并给 `orders` 增加 `resource_card_id`、给 `circles` 增加 `resource_count`。
- 最新资源卡接口：新增资源卡列表/创建/编辑/发布/下架/删除、购买下单、购买状态、交付内容、交付访问日志、评论、答疑区消息和 `GET /api/v0.9/me/resource-purchases` 已购资源列表。
- 最新资源卡履约：资源卡订单使用 `order_type='resource_card'` 与 `resource_card_id`；订单支付成功后 `fulfillOrderIfCreated` 会创建购买记录并继续调用圈主收益结算，因此资源卡收入也进入圈主钱包结算链路。
- 最新资源卡前端：圈子详情页新增资源卡橱窗和圈主管理入口；新增资源详情、资源交付、资源答疑区、资源编辑、资源管理、我的已购资源页面；前端支付流复用微信支付/Mock 支付封装。
- 最新包体优化：新增 `common/assets.js`，使用 `VITE_COS_PUBLIC_DOMAIN` 拼接 `https://dou-1311634841.cos.ap-nanjing.myqcloud.com/static/logo.png` 与 `logo-on-black-preview.jpg`；首页、登录页、关于页 logo 均改为远程图片；本地 `static` 目录仅保留 tabBar 与小型预设资源。
- 最新资料卡入口：`pages/chat/room.vue` 主房间新增固定资料卡橱窗，直接调用 `v09.resourceCards.listByCircle(circleId, { page: 1, page_size: 6 })` 展示已上架资料卡；右上新增“资料”快捷入口，圈主进入资源管理，普通用户进入圈子资料橱窗；“更多房间”说明改为资料卡优先、副房间辅助。
- 最新内容审核后端：新增 `015_cos_content_audit.sql` 与 `src/lib/contentAudit.js`，记录 `content_audit_tasks`，用户、圈子、房间、聊天消息、资源卡、评论和答疑消息均进入统一审核状态；聊天消息先仅发送者可见，通过后再 WebSocket 广播。
- 最新内容审核前端：聊天页展示本人消息“审核中/需复核/未通过”状态；保留当前资料卡橱窗未提交改动。
- 最新小程序代码质量优化：已将 `data/regions.js`、`utils/format.js` 迁入 `sub-account` 分包内部，并在 `manifest.json` 的 `mp-weixin` 节点开启 `lazyCodeLoading="requiredComponents"`；生日与所在地编辑页引用已改为分包内相对路径，避免主包继续携带这两个闲置 JS。
- 最新主房间发言控制：新增迁移 `016_main_room_posting_control.sql`，`circles.main_room_member_posting_disabled` 控制普通成员是否可在主房间发言；管理员/圈主仍可发言，用于把主房间收敛为公告与资料入口。
- 最新多公告能力：新增迁移 `017_circle_announcements.sql`、`src/lib/circleAnnouncements.js` 与公告实时事件；旧 `circles.announcement` 会迁入多公告表并继续保留摘要字段，前端已接入公告列表、置顶/弹窗展示和实时刷新。
- 最新付费副房间策略：前端隐藏新增付费副房间入口，但保留已有代码路径和历史房间访问/支付能力；如后续重新启用，可在 UI 层恢复入口，不需要立即删除后端结构。
- 最新聊天页细节：`pages/chat/room.vue` 在仅一个主房间时隐藏房间横向标签栏，顶部副标题不再显示“主房间”；资料卡橱窗说明仅普通用户可见，独立占一行并完整展示；主房间禁言提示改为“房间成员发言”。
- 最新房间设置页细节：`pages/circle/room-settings.vue` 将开关标题改为“禁用房间成员发言”，说明改为“开启后仅圈主可发言，资料卡独立聊天区不受影响。”并允许完整换行显示。
- 最新账号入口细节：新增 `constants/accountFeatures.js`，`ENABLE_PHONE_ACCOUNT=false` 时隐藏我的页“绑定/修改手机号”、登录页“手机号登录/忘记密码”和账号资料页“登录密码”；微信解绑提示去掉“绑定手机号”引导。
- 最新广场角标细节：新增 `utils/applicationBadges.js` 复用申请/审批接口计算待处理数量；`pages/discover/discover.vue` 右上角 badge 改用该数量，超过 99 显示 `99+`。
- 最新资料卡橱窗细节：`pages/chat/room.vue` 去掉资料卡说明的负上边距，并在折叠态给标题区保留 8px 下间距。
- 最新资料卡视觉细节：`pages/chat/room.vue` 的资料卡橱窗已从深色橙棕渐变改为纸感方案，卡片使用 `#FFFDF9`、`#E6DDD2`、`#221A14`、`#C66A2E` 等低饱和配色，并将资料卡圆角从 20px 收到 14px；暗色主题同步改为 `#1C1814` / `#24201B` 的低饱和纸墨色。
- 最新我的页视觉细节：`pages/user/my.vue` 顶部使用 `#FFFDF9` / `#F7F2EA` / `#EFE6DB` 纸感渐变，姓名改为墨色，ID/图标改为低饱和棕色，设置按钮与头像增加轻边框；统计卡改为纸卡边框和柔和阴影，暗色主题同步使用纸墨色。
- 最新全端配色细节：`App.vue` 全局浅色 token 改为 `#F4EFE8` / `#FFFDF9` / `#F7F2EA` / `#221A14` / `#766B61`，暗色 token 改为 `#0F0D0B` / `#1C1814` / `#24201B` / `#F7F2EA`；聊天、圈子首页/详情/创建/设置、广场、通知、钱包、资源卡、账号分包、工具分包和法务页同步替换旧品牌强橙、亮蓝/紫与 iOS 灰底。
- 最新聊天实时细节：`pages/chat/room.vue` 不再启动 `setInterval` 拉取 `/messages` 与 `/rooms`；WebSocket 断线只走 `socketClient` 自身重连。发送接口返回的 pending/pass 消息会先展示给发送者，后续审核通过或服务端广播同 ID 消息时更新状态，避免“切出去再回来才看到”。
- 最新聊天审核细节：后端 `rooms.routes.js` 对聊天文字使用非阻塞审核，`createRoomMessage` 支持传入初始 `audit_status='pass'`；`contentAudit.js` 在已公开消息被回调判定异常时返回 `updatedMessages`，`tencentCosAuditWebhook.routes.js` 通过 `chat.message.updated` 推送；前端 `room.vue` 不再展示“内容审核中，仅自己可见”，只在发送者消息真正未通过/需复核时展示明确提示，其他成员收到异常更新会从本地列表移除。
- 最新发前安全细节：`contentSafety.js` 在 `checkTextSafety` / `checkTextFieldsSafety` 中加入本地高风险词命中，命中返回 `45101` 且不进入后续写库；本地词表归一化已剔除数字干扰，`约111炮111` 会命中 `约炮`；`checkImageFileSafety` 先校验图片签名，再在 `CONTENT_SAFETY_IMAGE_SYNC_ENABLED=true` 时调用腾讯云 CI 图片同步审核，违规/疑似或同步接口不可用会拒绝上传；`pages/chat/room.vue` 在发送失败且输入框为空时恢复本次文本。
- 最新腾讯权限细节：本地实测腾讯云 CI 文本同步审核返回 `AccessDenied`，缺少 `ci:CreateAuditingTextJob` 权限；权限未补齐且 `CONTENT_SAFETY_TEXT_SYNC_ENABLED=true` 时，普通文本会按安全优先返回“内容安全检测暂不可用”。
- 最新聊天记录删除细节：`utils/chatMessageCache.js` 新增圈子级本地清空标记；`pages/circle/room-settings.vue` 新增确认删除入口；`pages/chat/room.vue` 在缓存启动、接口刷新、WebSocket 新消息/审核更新时应用本地清空过滤，并在删除后清掉当前圈子未读标记。
- 最新聊天滚动细节：`pages/chat/room.vue` 的 `scrollToBottom()` 改为多次锚点滚动并用 `scrollTop` 兜底；资源卡加载完成后若消息已就绪会补滚到底，修复进房时资料卡区域后加载导致的底部偏移。
- 最新资源卡预览细节：后端新增迁移 `018_resource_card_preview_images.sql` 给 `resource_cards` 增加 `preview_images_json`；创建/编辑资源卡会接收 `preview_images` 并限制最多 5 张，图片 URL 按资源卡预览图场景进入安全校验和 COS 审核绑定；前端资源卡编辑页支持上传/移除/预览最多 5 张预览图，详情页公开展示“预览部分”。
- 最新资源卡交付细节：后端新增迁移 `019_resource_card_delivery_types.sql`，给 `resource_cards` 增加 `delivery_type`、`resource_access_code`，并新增 `resource_card_codes` 卡密库存表；购买卡密型资源时会在订单履约事务内分配最早一条可用卡密，库存不足会阻止下单/上架；交付页按交付类型展示资源链接或已分配卡密。

## 关键文件（最近）
- `Dou-Server/docs/CREATOR_SETTLEMENT_WECHAT_TRANSFER_DESIGN.md`
- `Dou-Server/docs/PROJECT_MEMORY.md`
- `Dou-Server/docs/CONTENT_SAFETY_MVP.md`
- `Dou-Server/.env.example`
- `Dou-Server/src/db/migrations/012_creator_wallet_withdrawals.sql`
- `Dou-Server/src/db/migrations/013_creator_wallet_withdrawals_canceling.sql`
- `Dou-Server/src/db/migrations/014_resource_cards.sql`
- `Dou-Server/src/db/migrations/015_cos_content_audit.sql`
- `Dou-Server/src/db/migrations/016_main_room_posting_control.sql`
- `Dou-Server/src/db/migrations/017_circle_announcements.sql`
- `Dou-Server/src/db/migrations/018_resource_card_preview_images.sql`
- `Dou-Server/src/db/migrations/019_resource_card_delivery_types.sql`
- `Dou-Server/src/lib/circleAnnouncements.js`
- `Dou-Server/src/lib/contentAudit.js`
- `Dou-Server/src/lib/contentSafety.js`
- `Dou-Server/src/lib/creatorWallet.js`
- `Dou-Server/src/lib/resourceCards.js`
- `Dou-Server/src/lib/orderFulfill.js`
- `Dou-Server/src/lib/wechatMerchantTransfer.js`
- `Dou-Server/src/routes/v09/resourceCards.routes.js`
- `Dou-Server/src/routes/v09/tencentCosAuditWebhook.routes.js`
- `Dou-Server/src/routes/v09/orders.routes.js`
- `Dou-Server/src/routes/v09/wallet.routes.js`
- `Dou-Server/src/routes/v09/wechatTransferNotify.routes.js`
- `Dou-Server/scripts/check-env.mjs`
- `Dou-uniapp/docs/CREATOR_SETTLEMENT_WECHAT_TRANSFER_UI_DESIGN.md`
- `Dou-uniapp/pages/wallet/index.vue`
- `Dou-uniapp/pages/wallet/account.vue`
- `Dou-uniapp/pages/wallet/withdraw.vue`
- `Dou-uniapp/pages/wallet/withdraw-detail.vue`
- `Dou-uniapp/pages/resource/detail.vue`
- `Dou-uniapp/pages/resource/delivery.vue`
- `Dou-uniapp/pages/resource/discussion.vue`
- `Dou-uniapp/pages/resource/edit.vue`
- `Dou-uniapp/pages/resource/manage.vue`
- `Dou-uniapp/pages/resource/purchases.vue`
- `Dou-uniapp/pages/chat/room.vue`
- `Dou-uniapp/constants/contact.js`
- `Dou-uniapp/pages/circle/edit.vue`
- `Dou-uniapp/pages/circle/room-settings.vue`
- `Dou-uniapp/utils/realtime/chatChannel.js`
- `Dou-uniapp/utils/chatMessageCache.js`
- `Dou-uniapp/utils/v09Adapters.js`
- `Dou-uniapp/pages/circle/detail.vue`
- `Dou-uniapp/pages/circle/home.vue`
- `Dou-uniapp/pages/user/login.vue`
- `Dou-uniapp/sub-legal/pages/about.vue`
- `Dou-uniapp/App.vue`
- `Dou-uniapp/components/common/CircleCoverThumb.vue`
- `Dou-uniapp/pages/notification/system.vue`
- `Dou-uniapp/pages/notification/applications.vue`
- `Dou-uniapp/pages/circle/category-list.vue`
- `Dou-uniapp/pages/circle/category-circles.vue`
- `Dou-uniapp/pages/circle/create-room.vue`
- `Dou-uniapp/sub-account/pages/account/change-password.vue`
- `Dou-uniapp/sub-account/pages/account/change-phone.vue`
- `Dou-uniapp/sub-account/pages/account/forgot-password.vue`
- `Dou-uniapp/sub-account/pages/account/set-password.vue`
- `Dou-uniapp/sub-account/pages/bind/email.vue`
- `Dou-uniapp/sub-account/pages/bind/phone.vue`
- `Dou-uniapp/sub-account/pages/bind/wechat.vue`
- `Dou-uniapp/sub-account/pages/edit/birthday.vue`
- `Dou-uniapp/sub-account/pages/edit/intro.vue`
- `Dou-uniapp/sub-account/pages/edit/location.vue`
- `Dou-uniapp/sub-account/pages/edit/nickname.vue`
- `Dou-uniapp/sub-account/pages/settings/blocked-users.vue`
- `Dou-uniapp/sub-account/pages/settings/index.vue`
- `Dou-uniapp/sub-account/pages/settings/language.vue`
- `Dou-uniapp/sub-account/pages/tools/breathing.vue`
- `Dou-uniapp/sub-account/pages/tools/home.vue`
- `Dou-uniapp/sub-account/pages/tools/nature-sounds.vue`
- `Dou-uniapp/sub-account/pages/user/account-info.vue`
- `Dou-uniapp/sub-account/pages/user/square-exposure.vue`
- `Dou-uniapp/sub-account/pages/user/verification.vue`
- `Dou-uniapp/sub-legal/pages/community-rules.vue`
- `Dou-uniapp/sub-legal/pages/compliance.vue`
- `Dou-uniapp/sub-legal/pages/help.vue`
- `Dou-uniapp/sub-legal/pages/privacy.vue`
- `Dou-uniapp/sub-legal/pages/user-agreement.vue`
- `Dou-uniapp/common/assets.js`
- `Dou-uniapp/utils/resourceCards.js`
- `Dou-uniapp/utils/wechatPayUni.js`
- `Dou-uniapp/utils/wechatMerchantTransfer.js`
- `Dou-uniapp/api/v09/index.js`
- `Dou-uniapp/pages/user/my.vue`

## 验证结果
- 2026-06-08：圈主后台账号派发优化双仓已完成本地验证。Dou-Server 相关文件 `node --check` 通过；Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build` 通过；双仓 `git diff --check` 通过（仅 CRLF 转换警告，无空白错误）；本轮新增/修改中文文件经 Node UTF-8 扫描无 `U+FFFD`。
- 2026-05-13 读取时双仓工作区均干净。
- 后端新增文件语法检查通过：`src/lib/creatorWallet.js`、`src/lib/wechatMerchantTransfer.js`、`src/routes/v09/wallet.routes.js`、`src/routes/v09/wechatTransferNotify.routes.js`、`scripts/check-env.mjs`。
- 前端新增钱包页 Vue SFC parse/template compile 通过：`pages/wallet/index.vue`、`pages/wallet/account.vue`、`pages/wallet/withdraw.vue`、`pages/wallet/withdraw-detail.vue`。
- `npm run check:env -- --strict` 在本地因未配置 `JWT_SECRET` 失败，并提示 `ALLOW_DEV_WECHAT_LOGIN=true`、`CREATOR_WITHDRAW_ENABLED=false`；属于本地环境未配置生产变量。
- 2026-05-13 18:35：`node --check src/lib/wechatMerchantTransfer.js`、`node --check src/lib/creatorWallet.js` 通过；前端 `pages/wallet/withdraw.vue` SFC parse/template compile 与 `pages.json` JSON parse 通过；双仓 `git diff --check` 通过。
- 2026-05-13 18:55：`node --check src/lib/creatorWallet.js`、`node --check src/lib/wechatMerchantTransfer.js` 通过；Dou-Server `git diff --check` 通过。
- 2026-05-13 19:05：商家转账展示文案改为 `开工利是` 后，`node --check src/lib/creatorWallet.js`、`node --check src/lib/wechatMerchantTransfer.js` 通过；Dou-Server `git diff --check` 通过。
- 2026-05-13 19:18：后端 `node --check src/lib/wechatMerchantTransfer.js`、`node --check src/lib/creatorWallet.js`、`node --check src/routes/v09/wallet.routes.js` 通过；前端 `utils/wechatMerchantTransfer.js` 语法检查通过；`pages/wallet/withdraw.vue`、`pages/wallet/withdraw-detail.vue` SFC parse/template compile 通过；双仓 `git diff --check` 通过。
- 2026-05-13 19:38：后端 `node --check src/lib/creatorWallet.js`、`node --check src/routes/v09/wallet.routes.js`、`node --check src/lib/wechatMerchantTransfer.js` 通过；前端 `node --check utils/wechatMerchantTransfer.js` 通过；`pages/wallet/withdraw-detail.vue` SFC parse/template compile 通过；双仓 `git diff --check` 通过；临时数据库已成功迁移到 `013_creator_wallet_withdrawals_canceling.sql`，`creator_withdrawals.status` 包含 `canceling`。
- 2026-05-14 09:54：后端 `node --check src/lib/wechatMerchantTransfer.js`、`node --check src/lib/creatorWallet.js`、`node --check src/routes/v09/wallet.routes.js` 通过；前端 `node --check utils/wechatMerchantTransfer.js` 通过；`pages/wallet/withdraw.vue`、`pages/wallet/withdraw-detail.vue` SFC parse/template compile 通过；双仓 `git diff --check` 通过。
- 2026-05-14 10:16：后端 `node --check src/lib/creatorWallet.js`、`node --check src/lib/wechatMerchantTransfer.js`、`node --check src/routes/v09/wallet.routes.js` 通过；前端 `node --check utils/wechatMerchantTransfer.js` 通过；`pages/wallet/withdraw.vue`、`pages/wallet/withdraw-detail.vue` SFC parse/template compile 通过；双仓 `git diff --check` 通过（仅提示 CRLF 转换警告）。
- 2026-05-14 11:42：后端 `node --check src/lib/creatorWallet.js`、`node --check src/routes/v09/wallet.routes.js` 通过；前端 `node --check api/v09/index.js` 通过；`pages/wallet/index.vue`、`pages/wallet/withdraw-detail.vue` SFC parse/template compile 通过；双仓 `git diff --check` 通过（仅提示 CRLF 转换警告）。
- 2026-05-15 15:42：读取双仓最新状态，Dou-Server `master` 与 `origin/master` 对齐，Dou-uniapp `main` 与 `origin/main` 对齐，两个工作区均干净；确认最新资源卡提交已在双仓落地。
- 2026-05-15 15:42：确认 Dou-Server 迁移机制：`npm start` 会在启动时调用 `runMigrations()` 自动执行尚未应用的迁移；也可手动执行 `npm run migrate`。迁移记录保存在 `schema_migrations` 表。
- 2026-05-15 15:56：小程序包体优化静态检查通过：源码页面不再引用 `/static/logo.png`，`static` 目录文件总量约 2.2KB；尝试 `npx vite build` 仍因本机缺 `vite` / `@dcloudio/vite-plugin-uni` 未完成，属于既有本地依赖问题。
- 2026-05-15 16:05：修复微信开发者工具上传时报 `common/assets.js` 缺失：将品牌资源模块从 `constants/brandAssets.js` 迁到 `common/assets.js`；`node --check common/assets.js` 通过；当前 `unpackage/dist/dev/mp-weixin/common/assets.js` 已存在，页面产物引用为 `require("../../common/assets.js")`。
- 2026-05-15 17:04：主房间资料卡入口静态检查通过：`pages/chat/room.vue` Vue SFC parse/template/script compile 通过；`node --check utils/resourceCards.js`、`node --check api/v09/index.js` 通过；`git diff --check` 通过（仅提示 CRLF 转换警告）。
- 2026-05-15 17:47：腾讯云数据万象内容审核静态验证通过：后端 `node --check src/lib/contentAudit.js`、`src/lib/contentSafety.js`、`src/lib/chatMessages.js`、`src/lib/resourceCards.js`、`src/lib/serializers.js`、`src/lib/tencentCosUpload.js`、`src/routes/v09/me.routes.js`、`src/routes/v09/rooms.routes.js`、`src/routes/v09/circles.routes.js`、`src/routes/v09/resourceCards.routes.js`、`src/routes/v09/tencentCosAuditWebhook.routes.js`、`src/modules/discover/discover.service.js` 通过；临时库完整执行迁移到 `015_cos_content_audit.sql` 成功；前端 `node --check utils/v09Adapters.js` 与聊天页审核 UI smoke 通过；双仓 `git diff --check` 通过（仅 CRLF 提示）。
- 2026-05-19 00:00：扫描双仓最新状态，Dou-Server `master` 与 `origin/master` 对齐，Dou-uniapp `main` 与 `origin/main` 对齐，两个工作区均干净；确认最新提交已包含主房间发言控制、多公告接口/前端、付费副房间入口隐藏和小程序代码质量优化。
- 2026-05-19 16:14：聊天页单房间 UI 优化验证通过：`pages/chat/room.vue` Vue SFC parse/template/script compile 通过；`git diff --check` 通过（仅 CRLF 转换警告）。
- 2026-05-19 16:21：聊天页与房间设置页文案细节验证通过：`pages/chat/room.vue`、`pages/circle/room-settings.vue` Vue SFC parse/template/script compile 通过；`git diff --check` 通过（仅 CRLF 转换警告）。
- 2026-05-19 16:41：手机号账号入口隐藏验证通过：`pages/user/my.vue`、`pages/user/login.vue`、`sub-account/pages/user/account-info.vue`、`sub-account/pages/bind/wechat.vue` Vue SFC parse/template/script compile 通过；`node --check constants/accountFeatures.js` 通过；`git diff --check` 通过（仅 CRLF 转换警告）。
- 2026-05-19 16:44：广场申请角标与手机号入口隐藏合并验证通过：`pages/discover/discover.vue`、`pages/user/my.vue`、`pages/user/login.vue`、`sub-account/pages/user/account-info.vue`、`sub-account/pages/bind/wechat.vue` Vue SFC parse/template/script compile 通过；`node --check constants/accountFeatures.js`、`node --check utils/applicationBadges.js` 通过；`git diff --check` 通过（仅 CRLF 转换警告）。
- 2026-05-19 16:53：资料卡橱窗说明间距验证通过：`pages/chat/room.vue` Vue SFC parse/template/script compile 通过；`git diff --check` 通过（仅 CRLF 转换警告）。
- 2026-05-19 17:10：资料卡橱窗纸感配色验证通过：`pages/chat/room.vue` Vue SFC parse/template/script compile 通过；`git diff --check` 通过（仅 CRLF 转换警告）。
- 2026-05-19 17:25：我的页顶部纸感配色验证通过：`pages/user/my.vue` Vue SFC parse/template/script compile 通过；`git diff --check` 通过（仅 CRLF 转换警告）；本仓库无 H5/Vite 预览脚本，视觉回归需走 HBuilderX/微信开发者工具。
- 2026-05-19 17:58：前端全局纸感配色体检验证通过：53 个改动 Vue SFC parse/template/script compile 通过；`git diff --check` 通过（仅 CRLF 转换警告）；本仓库 `package.json` 无 H5/Vite 预览脚本，视觉回归需走 HBuilderX/微信开发者工具。
- 2026-05-19 18:26：客服邮箱与聊天实时修复验证通过：`pages/chat/room.vue`、`sub-legal/pages/about.vue`、`sub-legal/pages/compliance.vue`、`sub-legal/pages/help.vue`、`sub-legal/pages/privacy.vue`、`sub-legal/pages/user-agreement.vue` Vue SFC parse/template/script compile 通过；`node --check constants/contact.js`、`node --check dist/dev/mp-weixin/sub-legal/pages/help.js` 通过；`rg` 确认源码与构建产物不再包含旧邮箱，聊天页不再包含 `setInterval` / `startPolling` / `pollTimer`；`git diff --check` 通过（仅 CRLF 转换警告）。
- 2026-05-19 18:47：聊天文字审核体验修复验证通过：后端 `node --check src/lib/contentAudit.js`、`src/lib/chatMessages.js`、`src/routes/v09/rooms.routes.js`、`src/routes/v09/tencentCosAuditWebhook.routes.js`、`src/realtime/server.js` 通过；前端 `node --check utils/realtime/chatChannel.js` 通过，`pages/chat/room.vue` Vue SFC parse/template/script compile 通过；`rg` 确认聊天页不再包含“内容审核中，仅自己可见”；双仓 `git diff --check` 通过（仅 CRLF 转换警告）。
- 2026-05-19 19:13：聊天发前安全闸口验证通过：后端 `node --check src/lib/contentSafety.js` 通过；smoke 确认 `约炮`、`约 炮`、字段集合中的 `裸聊` 被拦截，`家政上门服务` 放行，图片同步审核关闭时合法 PNG 通过、非法文件签名被拒；前端 `pages/chat/room.vue` Vue SFC parse/template/script compile 通过；双仓 `git diff --check` 通过（仅 CRLF 转换警告）。
- 2026-05-20 10:12：违规词绕写拦截验证通过：`node --check src/lib/contentSafety.js` 通过；本地 smoke test 确认 `约炮`、`约111炮111`、`约 炮`、全角数字穿插均 0ms 命中 `local_text_block_word` 并返回“内容包含违规信息，请修改后再发送”；普通文本调用腾讯云 CI 因当前密钥缺 `ci:CreateAuditingTextJob` 权限返回 `AccessDenied`，在生产 fail-closed 策略下会提示“内容安全检测暂不可用”；Dou-Server `git diff --check` 通过（仅 CRLF 转换警告）。
- 2026-05-20 10:40：聊天本地记录删除验证通过：`node --check utils/chatMessageCache.js` 通过；`pages/chat/room.vue`、`pages/circle/room-settings.vue` Vue SFC parse/template/script compile 通过；Dou-uniapp `git diff --check` 通过（仅 CRLF 转换警告）。
- 2026-05-20 10:54：聊天页进房滚动与设置页入口位置验证通过：`node --check utils/chatMessageCache.js` 通过；`pages/chat/room.vue`、`pages/circle/room-settings.vue` Vue SFC parse/template/script compile 通过；Dou-uniapp `git diff --check` 通过（仅 CRLF 转换警告）。
- 2026-05-20 11:38：资源卡预览图验证通过：后端 `node --check src/lib/resourceCards.js`、`src/routes/v09/resourceCards.routes.js` 通过；临时库完整迁移到 `018_resource_card_preview_images.sql` 成功，并 smoke 确认创建资源卡时 `preview_images` 最多返回 5 张；前端 `node --check utils/resourceCards.js` 通过，`pages/resource/edit.vue`、`pages/resource/detail.vue` Vue SFC parse/template/script compile 通过；双仓 `git diff --check` 通过（仅 CRLF 转换警告）。
- 2026-05-20 12:08：资源卡交付方式升级验证通过：后端 `node --check src/lib/resourceCards.js`、`src/routes/v09/resourceCards.routes.js` 通过；临时库完整迁移到 `019_resource_card_delivery_types.sql` 成功，smoke 确认卡密型资源购买后自动分配 `CODE-A`，可用库存从 2 变 1，且卡密交付不泄露资源链接；前端 `node --check utils/resourceCards.js` 通过，`pages/resource/edit.vue`、`pages/resource/detail.vue`、`pages/resource/delivery.vue`、`pages/resource/manage.vue` Vue SFC parse/template/script compile 通过；双仓 `git diff --check` 通过（仅 CRLF 转换警告）。
- 2026-05-20 13:48：资源卡链接类型自动识别验证通过：后端 `node --check src/lib/resourceCards.js`、`src/routes/v09/resourceCards.routes.js` 通过，并 smoke 确认百度网盘、夸克网盘、腾讯文档和空链接分别推断为 `baidu_netdisk`、`quark_netdisk`、`other`、`other`；前端 `node --check utils/resourceCards.js` 通过，`pages/resource/edit.vue`、`pages/resource/delivery.vue` Vue SFC parse/template/script compile 通过；双仓 `git diff --check` 通过（仅 CRLF 转换警告）。
- 2026-05-20 14:14：资源卡夸克分享文本误审修复验证通过：后端 `node --check src/lib/resourceCards.js`、`src/routes/v09/resourceCards.routes.js` 通过，smoke 确认 `我用夸克网盘...链接：https://pan.quark.cn/s/7c1b5771e85f` 会归一化为纯链接并推断 `quark_netdisk`；前端 `node --check utils/resourceCards.js` 通过，`pages/resource/edit.vue`、`pages/resource/delivery.vue` Vue SFC parse/template/script compile 通过；双仓 `git diff --check` 通过（仅 CRLF 转换警告）。
- 2026-05-20 14:49：六项回归修复验证通过：后端 `node --check src/modules/discover/discover.service.js`、`src/routes/v09/discover.routes.js`、`src/routes/v09/resourceCards.routes.js`、`src/routes/v09/invite.routes.js` 通过；discover 参数 smoke 确认新增 owner 可见逻辑参数数量正确；前端 `node --check api/v09/index.js`、`utils/resourceCards.js`、`sub-legal/constants/contact.js` 通过，资源答疑/资源管理/资源编辑/聊天/房间设置/法务 5 页 Vue SFC parse/template/script compile 通过；`rg` 确认不再引用 `@/constants/contact.js`；双仓 `git diff --check` 通过（仅 CRLF 转换警告）。
- 2026-05-20 16:21：资源卡兑换说明链接误审修复验证通过：后端 `node --check src/lib/contentSafety.js`、`src/routes/v09/resourceCards.routes.js` 通过；smoke 确认 `购买后到https://mintapi.cn/打开文档使用` 剥离 URL 后可通过，`购买后到https://mintapi.cn/约111炮111` 仍命中 `local_text_block_word` 并返回违规；Dou-Server `git diff --check` 通过（仅 CRLF 转换警告）。
- 2026-05-20 17:20：资源卡售后申诉 MVP 验证通过：后端 `node --check src/lib/resourceAfterSales.js`、`src/routes/v09/afterSales.routes.js`、`src/routes/v09/index.js` 通过；临时库完整迁移到 `022_resource_after_sales.sql` 成功；smoke 确认买家发起售后、圈主回复、圈主主动退款后，售后单 `refunded/local_refunded`、订单 `refunded`、购买记录 `refunded`、已发卡密 `disabled`、结算单 `refunded`、圈主可提现余额冲正为 0；前端 `node --check api/v09/index.js`、`pages.json` JSON parse、7 个相关 Vue SFC parse/template/script compile 通过；双仓 `git diff --check` 通过（仅 CRLF 转换警告）。
- 2026-05-20 18:14：微信原路退款生产链路验证通过：后端 `node --check src/lib/wechatRefund.js`、`src/lib/resourceAfterSales.js`、`src/routes/v09/afterSales.routes.js`、`src/routes/v09/wechatRefundNotify.routes.js`、`src/routes/v09/index.js` 通过；临时库完整迁移到 `023_resource_after_sales_wechat_refunds.sql` 成功；`WECHAT_PAY_MOCK=true` smoke 确认原路退款成功后售后单 `wechat_refunded/SUCCESS`、订单 `refunded`、购买记录 `refunded`、卡密 `disabled`、结算单 `refunded`、圈主钱包冲正为 0，且写入退款 API 日志；前端 `node --check api/v09/index.js` 通过，售后相关 7 个 Vue SFC parse/template/script compile 通过；双仓 `git diff --check` 通过（仅 CRLF 转换警告）。

## 下一步
1. 前端重新构建/上传小程序，确认主包体积低于 2048KB，并在微信开发者工具代码质量页确认“主包未使用 JS 文件”和“组件按需注入/用时注入”均已通过。
2. 微信小程序后台确认 COS 域名 `https://dou-1311634841.cos.ap-nanjing.myqcloud.com` 已配置为合法 downloadFile 域名，否则远程 logo 可能不显示。
3. 服务器拉取后确认迁移 `013_creator_wallet_withdrawals_canceling.sql`、`014_resource_cards.sql`、`015_cos_content_audit.sql`、`016_main_room_posting_control.sql`、`017_circle_announcements.sql`、`018_resource_card_preview_images.sql`、`019_resource_card_delivery_types.sql`、`020_circle_profile_sync_audit.sql`、`021_resource_card_sync_audit.sql` 已应用；如果不确定启动脚本是否跑了 `npm start`，可在服务目录手动执行 `npm run migrate`，它会跳过已应用迁移。
4. 资源卡创建与购买回归：圈主在主房间点“资料/管理”进入资源管理，创建并发布资源卡；用户扫码进入主房间后应直接看到纸感资料卡橱窗，明暗主题下均确认配色、边框、按钮和卡片间距正常；点击详情购买后能查看交付内容、复制/打开资源链接、进入资源答疑区，并在“我的已购资源”看到记录。
5. 我的页视觉回归：重新预览/上传小程序，在“我的”页确认浅色主题顶部纸感配色、头像/设置按钮、统计卡悬浮和底部 tabBar 衔接正常；暗色主题确认顶部纸墨色不刺眼。
6. 全端配色回归：重新预览/上传小程序，抽查圈子首页/详情/创建/房间设置、聊天页、广场、通知、资源卡、钱包、我的、账号分包和法务页，确认纸感底色、主按钮、卡片边框、暗色模式无明显跳色。
7. 聊天实时与安全回归：微信开发者工具 Network 中确认聊天页不再每 3 秒请求 `/messages` 和 `/rooms`；发送普通文字后应立即出现在双方列表；发送 `约炮` / `约 炮` 应被后端直接拦截，不进入数据库和 WebSocket，前端输入框保留原文供修改；图片上传前需先通过腾讯云 IMS 同步审核，再进入 COS 异步审核。
8. 钱包联动回归：资源卡支付成功后确认圈主钱包产生结算记录；测试期 `CREATOR_SETTLEMENT_FREEZE_DAYS=0` 时，应尽快转为可提现；提现入口按需设置 `CREATOR_WITHDRAW_ENABLED=true`。
9. 服务器部署内容审核后，确认 COS 数据万象图片审核和文本审核均已绑定回调 `https://api.doucatapp.top/api/v0.9/webhooks/tencent/cos-audit`，并配置 `CONTENT_AUDIT_ENABLED=true`、`COS_PREFIX_AUDIT_TEXT=audit/text/`、`CONTENT_SAFETY_IMAGE_SYNC_ENABLED=true`、`CONTENT_SAFETY_SYNC_FAIL_OPEN=false`；回归聊天文字、聊天图片、圈子资料、资源卡发布、资源评论和资源答疑的 `pending -> pass/reject`。
10. 回归主房间发言控制与圈子多公告：圈主关闭普通成员主房间发言后，普通成员发消息应被拦截；公告新增/置顶/弹窗应能在聊天页和房间设置页实时刷新。
11. 回归删除聊天记录：进入聊天页右上设置，点击“删除聊天记录”并确认；返回聊天页应清空本机历史，重新进入也不应拉回旧历史；其他账号/设备历史不受影响，删除后新消息应正常出现。
12. 回归聊天页进房滚动：聊天消息超过一屏且资料卡橱窗展开时，重新进入聊天页应停在最新消息底部；折叠/展开资料卡后再次进入也应保持到底。
13. 回归资源卡预览部分：圈主创建/编辑资源卡时上传 1-5 张预览图并保存上架；未购买用户进入资源详情页应能看到“预览部分”图片并点开预览，购买后交付内容仍只在“查看资源”内展示。
14. 回归资源卡交付方式：创建资源交付型资源卡，确认购买后能复制资源链接/提取码，并确认粘贴百度/夸克整段分享文本时可正常保存、后端只保存真实链接、编辑页只显示自动识别提示；创建卡密交付型资源卡，导入多条卡密，用户购买后只获得一条卡密，管理页库存数量减少，库存为 0 时不可继续购买。
15. 回归本次六项修复：同账号进入广场确认自己新建公开圈子可见；资源答疑区点击退出后返回上一页；聊天页展开/折叠资料卡橱窗不再挤压消息区；资源卡管理页在资源区/卡密区之间切换正确；圈子设置和聊天页生成的邀请码小程序码都不再使用开发版；重新构建上传后确认代码质量不再提示 `constants/contact.js` 主包未使用。
16. 回归资源卡分类切换：服务器拉取重启后，进入资源卡管理页在“资源区 / 卡密区”和“全部 / 已上架 / 草稿 / 已下架”之间切换，应只刷新列表，不再出现 `Cannot read properties of undefined (reading 'changes'/'value')`。
17. 回归资源卡兑换说明：服务器拉取重启后，用卡密交付编辑资源卡，将兑换说明填为 `购买后到https://mintapi.cn/打开文档使用`，应能保存；再填入明显违规词，应被 45101 拦截且不保存。
18. 回归资源卡售后：服务器拉取并应用迁移 `022_resource_after_sales.sql` 后，用户购买资源卡/卡密后进入交付页点击“申请售后”，24 小时内应能提交说明和最多 6 张凭证；圈主在“我的-售后与申诉”或通知中进入详情，可协商回复并主动退款；退款后订单/购买记录应变为已退款，卡密禁用，资源交付权限关闭，圈主钱包收益被冲正。
19. 回归微信原路退款：服务器拉取并应用迁移 `023_resource_after_sales_wechat_refunds.sql` 后，配置 `WECHAT_REFUND_NOTIFY_URL=https://api.doucatapp.top/api/v0.9/payments/wechat/refund/notify`；用真实微信支付订单发起售后退款，确认微信退款受理后前端显示“退款中”，回调或点击“刷新退款状态”后变为“已退款”，订单、购买记录、卡密、结算和钱包均同步；如微信返回 `CLOSED/ABNORMAL`，应恢复交付权限和圈主收益。
20. 回归售后体验与角标：服务器拉取并执行迁移 `024_resource_after_sale_reads.sql` 后，买家申请售后时聚焦联系邮箱应自动滚动到输入框且文字不漂出；售后详情发送图片应无白色/深色气泡背景；圈主收到新售后后“我的-售后与申诉”和系统通知应出现数字角标，进入售后详情后角标应相应减少或消失，圈主回复后买家侧角标同样变化。
21. 管理后台部署回归：Dou-Server 拉取后执行迁移 `025_admin_console_base.sql` 并配置 `ADMIN_JWT_SECRET`、`ADMIN_BOOTSTRAP_USERNAME`、`ADMIN_BOOTSTRAP_PASSWORD`；生产环境首次登录后尽快更换或禁用引导管理员密码；部署 `Dou-Admin` 时将前端构建产物反代到后端 `/api/admin`，回归管理员登录、举报列表、举报处理动作、记者通知和操作日志。
22. 管理后台账号权限回归：Dou-Server 拉取后执行迁移 `026_admin_accounts_permissions.sql` 并重启；Dou-Admin 重新构建部署 `dist`。用超管进入“账号与权限”创建一个 `scope_type=指定圈子` 的圈主后台账号，确认可登录、只看到工作台/举报处理/修改密码，举报列表只包含授权圈子相关记录，不能进入账号管理，不能默认提交举报处置；再回归“修改密码”和“重置密码”。
23. 管理后台前端 CI/CD：服务器首次手动执行 `cd /www/wwwroot/Dou-admin && bash scripts/deploy-baota.sh`，成功后在宝塔 WebHook 插件中配置同一条命令，并将宝塔生成的 WebHook URL 配到 GitHub `TomCatV/Dou-admin` 的 push webhook。

## 风险与回滚
- 微信商家转账权限目前不支持小微商户，需在商户平台确认当前主体可开通。
- 微信商家转账资金通常走运营账户，需确认运营账户余额与接口安全 IP 已配置。
- 29.01 这类商家助手余额可能是收款/基本账户/待结算展示，不代表商家转账出资运营账户可用余额。
- 实现阶段可用 `CREATOR_WITHDRAW_ENABLED=false` 关闭提现入口，用 `CREATOR_SETTLEMENT_ENABLED=false` 暂停新收益入账。
- 当前微信提现实现需要重点关注：发起微信转账接口出现网络异常或 5xx 时，不能简单标记失败并释放余额，应该先按原 `out_bill_no` 查单，避免微信侧已受理但 Dou 侧重复释放导致资金风险。
- 资源卡交付内容属于敏感资产，后端已按购买状态控制私有字段返回；回归时重点确认未购买用户不能从详情、评论、答疑或接口响应中拿到 `resource_url`、`doc_content`、`doc_url` 等交付信息。
- 资源卡上线回滚点：后端可先隐藏前端入口或回滚前端资源卡页面；若数据库已迁移，保留新增表与字段通常更稳，避免破坏历史订单和购买记录。
- 付费副房间当前不作为 v1.0 主转化路径，建议先保留代码与数据结构但在 UI 上降级；如继续扰乱用户路径，可后续隐藏创建/购买副房间入口，暂不建议直接删迁移或删表。
- 内容审核回滚点：若数据万象回调异常，可临时设置 `CONTENT_AUDIT_ENABLED=false` 让新内容直接按通过写入；已处于 `pending` 的历史记录需人工确认后修正 `audit_status`。
- 发前图片同步审核回滚点：若腾讯云 IMS 权限未开通导致图片上传全阻塞，可临时设置 `CONTENT_SAFETY_IMAGE_SYNC_ENABLED=false`，保留文件签名校验与 COS 数据万象异步审核；正式版提审前建议恢复同步审核。
- 删除聊天记录回滚点：本次只写前端本地缓存和本地过滤标记，不改服务端消息表；若体验不符合预期，可回滚 `pages/circle/room-settings.vue`、`pages/chat/room.vue`、`utils/chatMessageCache.js`，用户服务端历史仍完整保留。
- 资源卡预览图回滚点：新增字段只存公开预览图 URL，不影响交付字段权限；若前端体验需要回退，可先隐藏预览图上传/展示入口，数据库字段保留不影响既有资源卡。
- 资源卡交付方式回滚点：新增卡密表不影响历史资源交付卡，旧卡默认 `delivery_type='resource'`；若卡密交付异常，可先隐藏前端“卡密交付”入口，保留后端表和字段，历史订单与资源链接交付不受影响。
- 资源卡售后回滚点：迁移 022 只新增售后表和消息表，不改旧订单主结构；如线上售后入口异常，可先回滚前端售后入口和页面，后端表保留不影响资源卡购买。当前主动退款只做 Dou 本地状态和钱包冲正，尚未接入微信支付原路退款，正式财务退款前需要继续接微信退款接口或人工处理。
- 微信原路退款回滚点：迁移 023 只给售后表增加退款字段并新增 `wechat_refund_api_logs`，不改变旧订单表结构；如微信退款异常，可先回滚前端刷新入口和后端 `refundAfterSaleViaWechat` 调用，临时恢复本地/人工退款处理。若微信请求结果不明确，当前策略是保持 `wechat_pending` 而不恢复收益，避免微信实际受理但本地误恢复。
- 管理后台回滚点：后端可先移除 `/api/admin` 路由挂载或关闭管理后台反代入口；迁移 025 只新增管理员表、审计表和举报处理字段，保留字段不影响小程序端举报提交。生产环境必须使用独立强随机 `ADMIN_JWT_SECRET`，不要沿用示例密码。

## 2026-05-28 本轮续航补充

- 管理后台商业级控制已继续推进：Dou-Server 新增 `033_admin_commercial_controls.sql`、租户套餐到期只读保护、套餐功能开关、用量上限、管理员会话版本失效；Dou-Admin 已展示圈主工作台套餐/用量/只读状态和 SaaS 租户商业控制信息。
- 右上角通知提醒已落地：Dou-Server 新增 `/api/admin/notifications/summary`，聚合投诉举报、人工复核、售后、提现、租户到期和圈主套餐提醒；Dou-Admin 右上角通知下拉改为真实接口数据，分治理待办、资金相关、到期相关三栏，点击消息跳转对应菜单并带筛选参数。
- 圈主商业后台能力整合方案已落地到 `Dou-Admin/docs/CREATOR_COMMERCE_ADMIN_CAPABILITY_PLAN.md`：对标“链动小铺”的小而美卖货后台，围绕“人人都可以当老板”，规划店铺、商品/卡密、H5 独立下单页、微信/支付宝扫码支付、订单交付、售后资金和 AI 经营助手。
- 本轮验证：后端通知接口语法检查和临时库 smoke 已通过；前端 `pnpm exec vue-tsc --noEmit --skipLibCheck`、`pnpm exec tsc --noEmit` 已通过；新增中文文档和通知相关文件已检查无 U+FFFD。
- 圈主商业后台 P0 详细落地设计已继续补齐：明确 P0 先做商业级后台收口，不直接接 H5 扫码支付；补充数据模型、接口边界、页面字段、权限审计、套餐只读、生产校验和开发顺序。
- 下一步：按 P0 详细设计推进后台商品中心写操作、店铺资料收口、权限审计、套餐只读保护和通知跳转筛选；P0 收口后再进入 P1 商品中心/H5 独立下单页。
- Dou-Admin GitHub Actions 发布补丁：针对 `Switch release` 步骤偶发 `kex_exchange_identification: read: Connection reset by peer`，已在 `.github/workflows/deploy.yml` 增加 SSH 重试、keepalive、连接复用、远端回滚保护和幂等判断。下一步观察新一轮 Actions；若仍在握手阶段被 reset，排查服务器 `sshd`、安全组、Fail2ban 或宝塔安全策略。
- 圈主商业后台 P0 商品中心已进入实装：Dou-Server 新增租户商品写接口、`tenant:resource:manage`、`tenant:wallet:withdraw`、内容安全、COS 审核任务、审计日志和套餐只读保护；Dou-Admin 商品中心新增创建/编辑、资源交付/卡密交付、库存、上下架、删除、复制链接、订单跳转和只读权限控制，钱包提现改为独立权限。
- 本轮验证：Dou-Server `node --check src/routes/admin/tenant.routes.js`、`node --check src/lib/adminPermissions.js`、动态导入通过；Dou-Admin `pnpm typecheck`、`pnpm build` 通过。
- 下一步：线上用圈主 owner、租户 staff、只读 viewer 三类账号回归商品中心写操作、卡密库存、禁用商品不可上架、套餐只读、审计日志、提现权限拆分和复制链接后的下单页承接。
- 用户新增长期要求：P0-P5 后续全部采用“先设计文档，再写代码”模式；每个阶段文档必须先覆盖范围、权限、数据、接口、页面、验收、回滚和生产风险。涉及支付、退款、提现、H5、内容安全、AI、第三方平台接口时，先查官方文档并记录关键约束；GitHub 只作为工程实践参考。
- 已新增/更新本地技能：`vincent-dou-default` 已加入商业后台设计先行规则；新增 `dou-commerce-production-workflow` 技能及 `commerce-phase-gates.md`，用于 P0-P5 阶段门禁。
- 当前文档判断：P0 商品中心、店铺资料、通知跳转和全角色验收矩阵已可支撑实现；P1-P5 仍是方向级规划，不允许直接写业务代码。
- 店铺资料 PATCH 权限兜底已完成：Dou-Server 新增 `tenant:store:manage`，owner/staff 默认拥有，viewer 默认不拥有；`PATCH /api/admin/tenant/circle` 改为强制写权限并保留套餐只读、内容安全和审计。Dou-Admin 店铺页已切换为“店铺资料”视角，展示套餐只读和权限提示。
- 本轮补充验证：Dou-Server `node --check src/routes/admin/tenant.routes.js`、`node --check src/lib/adminPermissions.js`、动态导入和权限矩阵 smoke 通过；Dou-Admin `pnpm typecheck`、`pnpm build` 通过；双仓 `git diff --check` 通过。
- 下一步补充：线上用 owner、staff、viewer、到期租户回归店铺资料保存、前端只读提示、后端 403/402 拒绝和审计日志。
- P1 商品中心与 H5 商品页首版已落地并完成仓库边界纠偏：Dou-Server 新增 `034_commerce_h5_foundation.sql`、`/api/shop/*`、租户商品分类和公开链接接口；Dou-Admin 商品中心接入分类管理、分类筛选、商品分类、H5 可见性和公开链接复制，并新增 `/shop/*` 公开买家页；Dou-uniapp 的 H5 页面提交已撤回，不参与本阶段 H5 购买页。
- P1 边界确认：本轮只创建订单草稿并锁定商品快照与价格，不生成真实微信/支付宝支付二维码，不推进支付成功、交付终态、退款或资金状态；这些留到 P2/P3。
- P1 验证结果：Dou-Server 新增路由 `node --check` 通过，临时库全量迁移到 `034` 成功，公开店铺/商品/订单草稿 smoke 通过；Dou-Admin `pnpm typecheck` 与 `pnpm build` 通过；Dou-uniapp H5 页面提交已撤回；提交前继续执行 Admin/Server diff 与 UTF-8 门禁。
- P1 当前收口状态：Dou-uniapp 撤回提交 `582735a` 已推送；Admin 承载公开购买页与 Server 链接路径已调整，Dou-Admin `pnpm typecheck`、`pnpm build` 通过，Dou-Server 相关文件 `node --check` 通过；Admin/Server `git diff --check` 和 UTF-8 扫描通过，待提交推送；P2 前需要用户确认 H5 生产域名、HTTPS、短链重写、微信/支付宝白名单和支付商户参数。
- P2 H5 扫码支付首版已完成本地闭环：Dou-Server 新增 `036_commerce_payment_intents.sql`、支付意图/日志、微信 Native、支付宝当面付、通知回调、查单与关单；Dou-Admin 确认订单页本地生成二维码并轮询支付状态，订单页在已支付后展示资源链接或卡密；Dou-uniapp 本轮保持不变。
- P2 资金安全收敛：支付成功只能由可信回调或查单推进；回调/查单会校验本地订单金额、支付意图金额和第三方回传金额，微信商户号或支付宝 AppID 不一致时不交付；重复回调不重复发货和结算。
- P2 验证结果：Dou-Server 支付相关 `node --check`、`npm.cmd run migrate` 和 mock 微信/支付宝支付 smoke 通过；Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build` 通过；双仓 `git diff --check` 通过（仅 CRLF 转换提示）。
- P2 下一步：提交推送后线上执行迁移 `036_commerce_payment_intents.sql`；配置微信商户号、API 证书序列号、商户私钥、平台证书、API V3 Key、Native 回调地址，以及支付宝 AppID、应用私钥、支付宝公钥和异步通知地址；再用 0.01-1 元测试商品做真实扫码回归。
- 平台端营收与手续费设计已补齐：Dou-Admin 新增 `docs/CREATOR_COMMERCE_PLATFORM_REVENUE_DESIGN.md`，结合链动小铺类平台收费结构和 Dou 当前交易链路，明确第一阶段采用平台技术服务费 + SaaS 套餐 + 增值工具 + 分销/营销工具 + 人工服务组合；默认交易技术服务费建议 20%，后续按套餐降到 15% / 10% / 6%，并要求订单级费率快照、平台收入流水、退款冲正、负余额和对账中心。
- 支付宝扫码支付收口补充：当前代码链路和本地验证已闭环；真实生产闭环还需要服务器拉取本次提交、重启、确认 `.env` 与证书路径可读，并用小额真实订单完成支付宝扫码支付、异步通知、查单和取货页回归。本轮没有直接接入 npm `alipay-sdk`，Dou-Server 继续使用自有 `alipayFacePay.js` 封装支付宝当面付 `alipay.trade.precreate`、RSA2 加签、异步通知验签、查单和关单；`alipay-sdk` 可作为后续重构参考。
- 支付宝生产安全收敛：只有 `ALIPAY_PAY_ENABLED=true` 且 AppID、异步通知地址、应用私钥和支付宝公钥均配置完成时，`alipay_precreate` 才对前端暴露为可用；生产环境缺支付宝公钥时异步通知不再跳过验签。Dou-Admin 确认订单页默认优先支付宝，并根据后端 `payment_channels` 禁用不可用渠道。
- 平台营收 Phase B-E 已继续推进：已落地平台收入流水、营收看板、费率策略、圈主费率提示；本轮继续补低风险只读能力，平台营收流水支持按支付渠道与流水状态筛选，并新增导出预览接口/抽屉。该预览不生成文件、不写审计、不改变任何资金状态，只用于对账中心和正式导出前校验字段口径。
- 平台营收正式导出与审计已继续推进：在导出预览基础上新增 `finance:revenue:export` 权限和 `/api/admin/finance/revenue/export` CSV 导出接口，Dou-Admin 预览抽屉支持二次确认后下载 CSV；导出只读、不在服务器落持久文件、不改变资金状态，并写入 `finance_revenue.export` 管理员审计。

## 2026-06-02 本轮续航补充

- 当前目标：修复平台全局超级管理员看不到 AI 经营助手页面的问题，并保留远端已合入的完整 P5 AI 经营助手实现。
- 根因：历史超级管理员账号的 `permissions_json` 和硬编码平台权限列表没有自动包含新增权限码，前端菜单与直达路由没有统一按 `meta.auths` 校验，导致新增的 `tenant:ai:view` / `tenant:ai:generate` 类入口容易漂移。
- 已改仓库：Dou-Server、Dou-Admin；Dou-uniapp 本轮未涉及。
- 已完成后端能力：`ALL_PLATFORM_PERMISSIONS` 改为从权限目录自动派生；平台全局 `super_admin` 解析权限时实时返回全部权限码；远端完整 AI 后端保持使用 `042_ai_business_assistant.sql`、`src/lib/aiBusinessAssistant.js` 和 `/api/admin/tenant/ai/*`。
- 已完成前端能力：菜单过滤和直接路由访问都按 `meta.auths` 校验；AI 经营助手入口改为全角色参与角色判断、再由 `tenant:ai:view` 控制展示；超级管理员编辑账号时展示有效全量权限而不是历史显式权限快照。
- 验证结果：Dou-Server `node --check` 覆盖 AI 路由、权限模块和 admin index；后端动态导入通过；全局超管权限 smoke 确认包含 `tenant:ai:view` 与 `tenant:ai:generate`；临时库全量迁移到 `042_ai_business_assistant.sql` 成功。Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build` 通过，仅有 Browserslist/baseline 数据陈旧提示。双仓 `git diff --check` 和 UTF-8 扫描通过。
- 下一步：服务器拉取 Dou-Server 后执行 `npm run migrate` 并重启；Dou-Admin 重新构建部署后，超级管理员重新登录，确认左侧出现 `AI 经营 / 经营助手`，能查看用量、生成经营日报/活动文案、查看历史报告和审计日志。
- 风险与回滚：AI 只读分析聚合脱敏经营数据，不自动修改商品、库存、售后、资金或权限终态；如线上异常，可先隐藏前端 `/tenant/ai` 菜单或移除 `/api/admin/tenant/ai` 路由挂载，AI 表保留不影响交易主链路。

## 2026-06-04 本轮续航补充

- 当前目标：根据最新代码和续航文档继续排查支付宝支付失败，服务端补 `[alipay-pay]` 脱敏日志；H5 商品页点击购买后直接调起支付宝收银台扫码页；圈主经营总览补齐全部圈子、资源分类、付费用户排行、收益类型、搜索、图表、建议、AI 分析入口和经营工具入口。
- 已改仓库：Dou-Server、Dou-Admin；Dou-uniapp 本轮未改动。
- Dou-Server 改动：`src/lib/alipayFacePay.js`、`src/lib/commercePayments.js`、`src/routes/shop/payments.routes.js`、`src/routes/admin/tenant.routes.js`、仓库续航文档。
- Dou-Admin 改动：`src/api/admin.ts`、`src/api/shop.ts`、`src/views/shop/product.vue`、`src/views/shop/checkout.vue`、`src/views/tenant/dashboard.vue`、`docs/CREATOR_COMMERCE_P2_P5_PAYMENT_OVERVIEW_FIX_DESIGN.md`、仓库续航文档。
- 支付链路：商品页创建草稿后立即固化订单并请求 `alipay_precreate + mode=cashier`；后端生成 `alipay.trade.page.pay` 收银台 URL 返回 `cashier_url`；前端优先跳转支付宝收银台，失败时进入确认页 `autopay=1`，使用站内二维码兜底。
- 排障能力：支付宝请求开始、HTTP 失败、业务失败、请求成功、收银台 URL 签发、支付意图创建失败均打印 `[alipay-pay]`；日志包含 method、out_trade_no、金额、request-id、耗时、code/sub_code/sub_msg，不打印私钥、联系方式、卡密或交付链接。
- 经营总览：Dou-Server `/api/admin/tenant/dashboard` 新增只读 `owner_overview`，限定当前圈主 owner 名下活跃且审核通过圈子；Dou-Admin 圈主工作台展示全圈指标、7 日成交趋势、全圈搜索、圈子列表、资源分类卡、付费排行榜、收益类型、经营建议和 AI/经营工具入口。
- 验证结果：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build` 通过，仅有 Browserslist/baseline 数据陈旧提示；Dou-Server `node --check` 覆盖支付宝封装、支付服务、支付路由和租户路由通过。后端动态导入命令在本机被外层命令转义截断，本轮未作为通过结果记录。
- 下一步：服务器拉取双仓并重启后，确认 `SHOP_H5_BASE_URL` 或 `PUBLIC_ADMIN_BASE_URL` 能生成支付宝 `return_url`；用真实小额支付宝订单回归“立即购买 -> 收银台扫码 -> 回调/查单 -> 订单交付”，并从宝塔日志搜索 `[alipay-pay]` 定位失败原因。
- 风险与回滚：可设置 `ALIPAY_PAY_ENABLED=false` 暂停支付宝；前端可恢复确认页站内二维码模式；经营总览新增字段为只读聚合，异常时隐藏新增面板，不影响旧工作台字段和交易主链路。

## 2026-06-04 支付宝私钥格式兼容续航补充

- 当前目标：承接线上 `[alipay-pay] intent create failed` 日志里的 `ALIPAY_PRIVATE_KEY_INVALID`，继续修复支付宝应用私钥格式与当前 Node/OpenSSL 不兼容的问题。
- 已改仓库：Dou-Server；Dou-Admin、Dou-uniapp 本轮未改动。
- Dou-Server 改动：`src/lib/alipayFacePay.js`、`.env.example`、`docs/CODEX_CONTINUITY_STATE.md`、`docs/CODEX_TASK_LEDGER.md`。
- 根因判断：旧逻辑会把无 PEM 头的单行私钥正文统一包装为 `-----BEGIN PRIVATE KEY-----`；如果生产配置实际来自 PKCS1 `-----BEGIN RSA PRIVATE KEY-----`，就会被错误包装并触发 `ALIPAY_PRIVATE_KEY_INVALID`。
- 已完成修复：私钥解析改为候选格式逐个尝试，支持 PKCS8 `PRIVATE KEY`、PKCS1 `RSA PRIVATE KEY`、两者单行正文和 `\n` env 写法；支付宝公钥同理兼容 `PUBLIC KEY` 与 `RSA PUBLIC KEY`。解析失败新增脱敏候选错误日志，不打印密钥内容。
- 验证结果：Dou-Server 支付关键文件 `node --check` 通过；本地 RSA 2048 烟测覆盖 PKCS8/PKCS1 PEM、单行正文和 `\n` env 写法，均能签出支付宝收银台 URL；支付宝公钥验签烟测覆盖 `PUBLIC KEY`、`RSA PUBLIC KEY`、单行正文和 `\n` env 写法，均可完成通知验签。
- 下一步：服务器拉取并重启后，用现有支付宝私钥复测小额收银台；若仍失败，按 `[alipay-pay] private key parse failed` 查看候选错误，重点确认密钥是否复制完整、是否为当前支付宝应用私钥、是否与开放平台已上传应用公钥匹配。
- 风险与回滚：本轮只改密钥装载兼容性和排障提示，不改变支付状态机、回调验签推进、交付或资金终态；必要时用 `ALIPAY_PAY_ENABLED=false` 暂停支付宝。

## 2026-06-04 支付宝收银台签名串续航补充

- 当前目标：继续处理支付宝收银台错误页 `invalid-signature`，修复 Dou-Server 生成 `alipay.trade.page.pay` URL 时待签名串缺少 `sign_type=RSA2` 的问题。
- 已改仓库：Dou-Server；Dou-Admin、Dou-uniapp 未改动。
- Dou-Server 改动：`src/lib/alipayFacePay.js`、仓库续航文档；外层续航文档同步更新。
- 根因判断：线上已出现 `[alipay-pay] page pay url issued`，说明私钥解析和本地签名已可执行；支付宝错误页展示的网关验签字符串包含 `sign_type=RSA2`，而旧代码的 `signSource()` 排除了 `sign_type`，造成服务端签名串和支付宝网关验签串不一致。
- 已完成修复：OpenAPI 请求签名只排除 `sign`，保留 `sign_type` 参与 RSA2 签名；异步通知验签按支付宝 SDK 兼容口径，先保留 `sign_type` 验签，失败后再尝试不带 `sign_type` 的历史口径。
- 验证结果：`node --check src/lib/alipayFacePay.js` 通过；本地 RSA 2048 收银台 URL 烟测确认包含 `sign_type=RSA2` 的网关验签串可验过；异步通知烟测确认带 `sign_type` 和不带 `sign_type` 两种签名均可验过。
- 下一步：服务器拉取并重启后，用真实 0.01 元支付宝订单复测收银台；如仍报 `invalid-signature`，继续按错误页网关验签串核对字段、AppID、应用私钥和开放平台应用公钥匹配关系。
- 风险与回滚：本轮只改签名串口径和通知验签兼容，不改变支付状态机、回调推进、交付、结算或提现；支付宝异常时继续用 `ALIPAY_PAY_ENABLED=false` 暂停。

## 2026-06-04 H5 支付渠道选择恢复

- 当前目标：继续排查支付宝支付问题，同时修复 H5 商品详情页只剩支付宝支付的问题，恢复微信扫码和支付宝渠道选择。
- 改动仓库：Dou-Admin、Dou-Server；Dou-uniapp 未改动。
- 已改文件：
  - Dou-Admin `src/api/shop.ts`
  - Dou-Admin `src/views/shop/product.vue`
  - Dou-Admin `src/views/shop/checkout.vue`
  - Dou-Server `src/routes/shop/index.js`
  - 双仓 `docs/CODEX_CONTINUITY_STATE.md`
  - 双仓 `docs/CODEX_TASK_LEDGER.md`
- 已完成能力：商品详情页展示微信扫码和支付宝两种支付方式；微信路径进入确认页自动生成微信 Native 二维码；支付宝路径继续直达收银台；公开商品详情和订单草稿创建响应返回 `payment_channels`，前端按后端启用状态展示或禁用通道。
- 支付宝结论：支付宝 `not-online-app` / 应用未上线属于支付宝开放平台 AppID 状态问题，不是私钥格式或签名串问题；需将应用提交审核并上线后才能在生产网关完成真实支付。
- 验证结果：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build`、`git diff --check` 和 UTF-8 扫描通过；Dou-Server `node --check src/routes/shop/index.js`、`git diff --check` 和 UTF-8 扫描通过；构建产物与源码均确认包含 `支付方式`、`微信扫码`、`支付宝` 文案。因本机 bundled Playwright 缺 `playwright-core`，未完成截图级浏览器验证。
- 下一步计划：提交推送后服务器拉取并重启；支付宝应用上线前优先回归微信 Native 0.01 元交易，支付宝上线后再回归支付宝收银台扫码、异步通知/查单和订单交付。
- 风险与回滚：本轮只改 H5 公开支付入口和响应字段；如支付宝未上线，关闭或禁用支付宝不影响微信 Native；如微信配置异常，可通过 `WECHAT_NATIVE_PAY_ENABLED=false` 隐藏微信通道。

## 2026-06-04 支付宝标准收银台页面修复

- 当前目标：根据支付宝电脑网站支付官方文档继续排查 PC 网页端支付宝支付只显示极简二维码页的问题，恢复标准收银台体验。
- 改动仓库：Dou-Server、Dou-Admin；Dou-uniapp 未改动。
- Dou-Server 改动：`src/lib/alipayFacePay.js`、仓库续航文档。
- Dou-Admin 改动：`docs/CREATOR_COMMERCE_P2_SCAN_PAY_DESIGN.md`、`docs/CREATOR_COMMERCE_P2_P5_PAYMENT_OVERVIEW_FIX_DESIGN.md`、仓库续航文档。
- 根因判断：旧 `alipay.trade.page.pay` 的 `biz_content` 传了 `qr_pay_mode=4` 和 `qrcode_width=260`，会进入支付宝嵌入式二维码/极简二维码展示模式；标准 PC 收银台默认不传这两个字段。
- 已完成：Dou-Server `createAlipayPagePayUrl()` 删除 `qr_pay_mode` / `qrcode_width`，只保留 `product_code=FAST_INSTANT_TRADE_PAY` 等电脑网站支付标准字段；签发日志新增 `cashier_style: 'standard'`。Dou-Admin 支付设计文档同步记录官方链接和边界。
- 验证结果：Dou-Server `node --check src/lib/alipayFacePay.js`、`node --check src/lib/commercePayments.js` 通过；本地 RSA 2048 URL 烟测确认 `biz_content` 不含 `qr_pay_mode` / `qrcode_width`，且保留 `method=alipay.trade.page.pay`、`sign_type=RSA2`、`product_code=FAST_INSTANT_TRADE_PAY` 和签名；Dou-Server / Dou-Admin `git diff --check` 与改动文件 UTF-8 扫描通过。
- 下一步：服务器拉取并重启后，用 0.01 元真实支付宝订单回归标准收银台；若手机扫码仍提示 `AE150003030`，继续按支付宝电脑网站支付终端限制、应用上线状态和风控排查，移动端直付另走 WAP/App 支付接入。
- 风险与回滚：只删除收银台样式参数，不改变签名、查单、回调验签、交付、结算或售后；异常时可设置 `ALIPAY_PAY_ENABLED=false` 暂停支付宝，或让前端回退确认页站内二维码兜底。

## 2026-06-04 H5 站内扫码与卡密库存兜底

- 当前目标：根据线上真实扫码支付成功后的反馈，修复支付宝仍跳独立二维码页、支付按钮可重复点击、支付成功不应依赖支付宝 `return_url`、微信扫码页首次空白、卡密售罄仍可继续付款，以及圈主资源卡管理入口不明显的问题。
- 改动仓库：Dou-Admin、Dou-Server；Dou-uniapp 未改动。
- Dou-Admin 改动：`src/views/shop/product.vue`、`src/views/shop/checkout.vue`、`src/views/shop/order.vue`、`src/router/modules/home.ts`、`src/views/tenant/resources.vue`、`docs/CREATOR_COMMERCE_P2_P5_PAYMENT_OVERVIEW_FIX_DESIGN.md`、仓库续航文档。
- Dou-Server 改动：`src/lib/commercePayments.js`、`src/lib/orderFulfill.js`、`src/lib/resourceCards.js`、`src/routes/shop/index.js`、仓库续航文档。
- 已完成能力：H5 商品页微信和支付宝都进入 Dou 站内确认页自动出码，不再默认创建 `mode=cashier` 外跳收银台；确认页增加自动支付一次性锁、按钮 loading、二维码渲染错误兜底和初始化异常兜底；支付成功靠站内轮询进入订单页，规避支付宝 `return_url` 命中后端健康检查 JSON 的线上配置问题。
- 库存与履约：支付意图创建前校验最新商品、价格、卡密库存和是否已购买；履约改为先创建购买记录并分配卡密，再把订单和支付意图标记为 `paid`；履约失败进入 `unknown/FULFILLMENT_FAILED`，不再出现新订单已支付但卡密“正在分配”的假成功状态。
- 资源卡入口：圈主后台菜单和页面显性改为“资源卡管理 / 发布资源卡 / 编辑资源卡”，保留已有分类、H5 链接、资源交付、卡密库存和订单入口。
- 验证结果：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build`、`git diff --check` 通过；Dou-Server `node --check` 覆盖支付、履约、资源卡和 H5 shop 路由通过；双仓 UTF-8 扫描无 U+FFFD，`git diff --check` 仅有 CRLF 转换提示。
- 下一步：服务器拉取双仓并重启后，线上回归微信/支付宝站内二维码、按钮防重复、扫码后轮询跳订单页、售罄卡密支付前拦截、历史缺卡密订单打开时自动补发和资源卡管理入口。
- 风险与回滚：支付通道可用 `ALIPAY_PAY_ENABLED=false` / `WECHAT_NATIVE_PAY_ENABLED=false` 分别暂停；库存兜底只加强支付前和履约安全，不改变已成功交付订单；资源卡入口文案可单独回退。

## 2026-06-04 超级管理员圈主双身份续航补充

- 当前目标：回应“超级管理员自己也是圈主，为什么找不到资源卡新增/编辑/删除/库存入口”的问题，打通平台 `super_admin` 与 Dou 用户圈主身份的经营后台上下文。
- 改动仓库：Dou-Admin、Dou-Server；Dou-uniapp 未改动。
- Dou-Server 改动：`src/middleware/requireTenantScope.js`、`src/routes/admin/adminUsers.routes.js`、`src/routes/admin/tenant.routes.js`、仓库续航文档。
- Dou-Admin 改动：`src/api/admin.ts`、`src/router/modules/home.ts`、`src/utils/auth.ts`、`src/utils/http/index.ts`、`src/utils/tenantContext.ts`、`src/views/admin-users/index.vue`、`src/views/resource-cards/index.vue`、`src/views/tenant/resources.vue`、仓库续航文档。
- 已完成能力：平台全局超级管理员可在 `账号与权限 / 后台账号` 绑定自己的 Dou 用户，不降级、不失去平台权限；后端仅允许绑定用户作为 owner 的活跃圈子进入租户后台，租户请求通过 `X-Tenant-Circle-Id` 选择当前经营圈子；前端把平台页改名为 `资源卡治理`，并在圈主后台 `资源卡管理` 显示新增、编辑、删除、卡密库存、分类和当前经营圈子切换。
- 权限结论：你作为 admin 当然也可以是圈主，但系统不能只凭“超级管理员”就开放任意圈子的经营写操作，必须通过绑定 Dou 用户来确认哪些圈子确实属于你。
- 验证结果：Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build`、`git diff --check` 已通过；Dou-Server `node --check` 覆盖租户 scope、后台账号和租户路由已通过；双仓 UTF-8 扫描无 U+FFFD，`git diff --check` 仅有 CRLF 转换提示。
- 下一步：提交推送后部署双仓；线上用超级管理员在 `账号与权限 / 后台账号` 编辑自己的 admin 账号并绑定自己的 Dou 用户，重新登录后进入 `圈主后台 / 资源卡管理` 回归发布、编辑、删除、卡密库存和多圈子切换。
- 风险与回滚：本轮不新增数据库迁移，不改变小程序资源卡链路；如线上异常，可回滚双身份入口改动，平台 `资源卡治理` 仍保持只读/治理能力。

## 2026-06-05 资源库导入解析 P0

- 当前目标：把外部资源 Excel/CSV 接入 Dou 圈主后台，形成上传解析、风险分层、高风险隔离、低/中风险候选转资源卡草稿的闭环。
- 改动仓库：Dou-Server、Dou-Admin；Dou-uniapp 未改动。
- Dou-Server 改动：新增 `docs/RESOURCE_LIBRARY_IMPORT_P0_DESIGN.md`、迁移 `043_resource_library_imports.sql`、解析库 `src/lib/resourceLibraryImports.js`、路由 `src/routes/admin/tenantResourceImports.routes.js`，并在 `/api/admin/tenant/resource-imports` 挂载；新增 `xlsx` 依赖。
- Dou-Admin 改动：新增 `docs/RESOURCE_LIBRARY_IMPORT_P0_UI_DESIGN.md`、`/tenant/resource-library` 菜单和页面；`src/api/admin.ts` 补导入批次/明细/上传/转草稿接口；`src/utils/http/index.ts` 兼容 `FormData` multipart 上传。
- COS 决策：P0 不把原始 Excel/CSV 长期保存到服务端或 COS，只在内存解析并保存结构化批次和明细；如后续需要追溯，再使用现有 COS bucket 的私有前缀 `resource-imports/{circleId}/{batchId}/source.xlsx`，不生成公网 URL，并配置 7-30 天生命周期。
- 验证结果：Dou-Server `node --check` 覆盖新增解析库、导入路由和 admin index；解析库动态导入通过；临时库全量迁移到 `043` 成功；CSV smoke 确认 AI 模板为低风险候选、电影合集为高风险隔离、K12 教材为中风险候选。Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build` 通过，仅有 Browserslist/baseline 数据陈旧提示；双仓 `git diff --check` 通过，仅有 CRLF 转换提示。
- 下一步：部署后执行迁移 `043_resource_library_imports.sql`；用圈主 owner/staff 上传真实资源表，回归批次列表、明细筛选、高风险隔离拒绝转换、候选转草稿和资源卡管理可见；viewer 账号回归只读。
- 风险与回滚：新增表独立，不影响现有资源卡、H5、订单、售后、钱包链路；如线上需止血，可隐藏 Admin 菜单或回滚 Server 路由挂载，已生成草稿可在资源卡管理中删除。

## 2026-06-06 AI 经营助手线上中转站协议兼容

- 当前目标：修复 Admin 线上 AI 经营助手生成日报失败，错误为 `OpenAI 返回内容不是可解析 JSON`；回答“不需要本地开 VPN 才能用线上 AI 助手”。
- 改动仓库：Dou-Server、Dou-Admin；Dou-uniapp 未改动。
- Dou-Server 改动：`src/lib/aiBusinessAssistant.js`、`.env.example`、仓库续航文档。
- Dou-Admin 改动：`docs/CREATOR_COMMERCE_P5_AI_ASSISTANT_DESIGN.md`、`docs/ADMIN_USER_MANUAL.md`、`docs/GO_LIVE_ACCEPTANCE_CHECKLIST.md`、仓库续航文档。
- 根因方向：Admin 浏览器只请求 Dou-Server；线上 AI 是否可用取决于 Dou-Server 所在服务器能否访问官方 OpenAI 或中转站，以及中转站返回协议是否匹配。旧解析只兼容 Responses API，遇到 Chat Completions 返回会误判为非 JSON。
- 已完成能力：新增 `OPENAI_API_PROTOCOL=responses|chat_completions|auto`；支持 Chat Completions 请求和返回解析；`auto` 可在 Responses 中转站不兼容时回退；失败日志输出 `[ai-business] generation failed` 脱敏诊断。
- 验证结果：Dou-Server `node --check` 覆盖 AI helper、AI 路由和 Admin 路由通过；动态导入通过；临时库全量迁移到 `043` 成功；mock smoke 覆盖 Chat Completions 直连和 `auto` 回退；双仓 `git diff --check` 与 UTF-8 扫描通过，仅有 CRLF 转换提示。Dou-Admin 本轮只改文档，未跑前端构建。
- 下一步：服务器拉取双仓并重启后，按中转站能力设置 `OPENAI_API_PROTOCOL`；优先用圈主账号生成经营日报回归，并查看 Dou-Server 日志确认是否还有协议不匹配。
- 风险与回滚：默认仍是 Responses 主路径；若线上异常，先固定 `OPENAI_API_PROTOCOL=responses` 或清空 `OPENAI_API_KEY` 保留兜底报告，交易链路不受影响。

## 2026-06-06 AI 经营助手服务端诊断日志

- 当前目标：AI 助手线上仍不可用，按用户要求增加服务端打印，优先用 Dou-Server 日志定位真实失败点。
- 改动仓库：Dou-Server；Dou-Admin、Dou-uniapp 未改动。
- Dou-Server 改动：`src/lib/aiBusinessAssistant.js`、`src/routes/admin/tenantAi.routes.js`、仓库续航文档。
- 已完成能力：新增 `[ai-business] route request`、`request start`、`openai request`、`openai response`、`openai network failed`、`openai parse failed`、`responses fallback to chat_completions`、`generation failed` 分层日志；同一次生成用 `trace_id` 串联。
- 脱敏边界：不打印 API Key、Authorization、完整 prompt 或完整请求正文；URL 只打印 host/path；响应只打印 HTTP 状态、header 摘要、结构摘要和 300 字以内预览。
- 验证结果：Dou-Server `node --check` 覆盖 AI helper 与租户 AI 路由通过；动态导入通过；本地 smoke 用假 key 和不可达端口触发失败链路，确认日志与 failed 兜底报告正常。
- 下一步：服务器拉取并重启后复测 AI 经营日报；若仍失败，从宝塔/Node 日志复制同一 `trace_id` 下的 `[ai-business]` 日志继续定位。
- 风险与回滚：只增加诊断日志，不改变交易链路、AI 报告表结构或前端交互；如日志量过大，可回滚本次提交或后续加开关。

## 2026-06-06 AI 经营助手失败不计额度与中转站自动协议

- 当前目标：根据线上日志和用户反馈，修复 AI 调用失败仍占今日用量，并让自定义中转站未显式配置协议时自动回退。
- 改动仓库：Dou-Server；Dou-Admin、Dou-uniapp 未改动。
- Dou-Server 改动：`src/lib/aiBusinessAssistant.js`、`.env.example`、仓库续航文档。
- 已完成能力：今日用量只统计 `generated/accepted/dismissed`，不再统计 `failed`；自定义 `OPENAI_BASE_URL` 或 `OPENAI_RESPONSES_URL` 默认推断为 `auto`，官方默认 base URL 仍推断为 `responses`，显式 `OPENAI_CHAT_COMPLETIONS_URL` 推断为 `chat_completions`。
- 线上结论：当前中转站 `zz1cc.cc.cd/v1/responses` 返回 200 但没有 `output_text/output`，新逻辑会在未设置 `OPENAI_API_PROTOCOL` 时自动回退到同 base 的 `/v1/chat/completions`。
- 验证结果：Dou-Server `node --check src/lib/aiBusinessAssistant.js` 通过；mock 复现 Responses 200 空正文后自动回退 Chat Completions 并生成成功报告；历史 failed 记录不计入今日 used，成功生成才占一次额度。
- 下一步：服务器拉取重启后复测经营日报；历史 failed 记录会自动不再计数，不需要手工清理数据库。
- 风险与回滚：不改数据库结构；如中转站只支持 Responses，可显式设置 `OPENAI_API_PROTOCOL=responses`。

## 2026-06-06 AI 经营助手线上化硬化与超管设置

- 当前目标：回应“生成的都是代码看不懂、失败调用不该计次、超级管理员次数不限制、超管需要单独设置入口控制公共权限和参数”，把 AI 经营助手从可排障升级到可运营。
- 改动仓库：Dou-Admin、Dou-Server；Dou-uniapp 未改动。
- Dou-Server 改动：新增迁移 `044_ai_platform_settings.sql`、`src/lib/aiPlatformSettings.js`、`src/routes/admin/aiSettings.routes.js`，并更新 `src/lib/aiBusinessAssistant.js`、`src/routes/admin/tenantAi.routes.js`、`src/routes/admin/index.js`、`.env.example` 和仓库续航文档。
- Dou-Admin 改动：新增 `src/views/ai/settings.vue`，更新 `src/api/admin.ts`、`src/router/modules/home.ts`、`src/views/tenant/ai.vue`、`docs/CREATOR_COMMERCE_P5_AI_ASSISTANT_DESIGN.md`、`docs/ADMIN_USER_MANUAL.md`、`docs/GO_LIVE_ACCEPTANCE_CHECKLIST.md` 和仓库续航文档。
- 已完成能力：AI 报告抽屉改为经营摘要、关键指标、风险提醒、建议动作、候选文案和合规提示，不再把原始 JSON/代码块作为主要展示；失败报告明确不计入今日次数；平台全局超级管理员默认不限次数，前端显示 `已用 / 不限`；新增 `AI 经营 / AI 设置` 菜单，只有全局超级管理员可进入。
- 平台设置边界：后台可调整总开关、经营日报/活动文案场景开关、模型、协议、中转站 URL、每日额度、超管不限次、超时和最大输出 Token；`OPENAI_API_KEY` 仍只读取服务端环境变量，不在 Admin 存储或展示；保存设置必须填写调整原因并写管理员审计日志。
- 后端兜底：`/api/admin/ai/settings` 使用 `requireGlobalSuperAdmin`；租户 AI 生成会读取平台设置并在服务端强制执行总开关、场景开关、超管不限次和套餐额度；失败状态仍保留排障记录但不消耗用量。
- 验证结果：Dou-Server `node --check` 覆盖 AI 设置库、AI helper、AI 设置路由、租户 AI 路由和 Admin index；AI 模块动态导入通过；临时库全量迁移到 `044_ai_platform_settings.sql` 成功；逻辑 smoke 覆盖普通圈主 failed 不计数、全局超管不限次、failed 报告拒绝确认/忽略和设置保存。Dou-Admin `corepack pnpm typecheck`、`corepack pnpm build` 通过，仅有 Browserslist/baseline 数据陈旧提示；双仓 `git diff --check` 和 UTF-8 扫描通过，仅有 CRLF 转换提示。
- 下一步：验证通过后提交推送双仓；服务器拉取后执行迁移 `044_ai_platform_settings.sql` 并重启，再用全局超级管理员回归 `AI 经营 / AI 设置` 和经营日报生成。
- 风险与回滚：新增 `platform_ai_settings` 独立表，不影响订单、支付、售后、钱包和资源卡链路；如线上 AI 设置异常，可隐藏 `/ai/settings` 菜单或回滚新设置路由，保留原 AI 生成主链路；如需临时停用 AI，可在设置页关闭总开关或清空服务端 `OPENAI_API_KEY`。
