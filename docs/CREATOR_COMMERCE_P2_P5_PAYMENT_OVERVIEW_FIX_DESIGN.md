# 支付宝扫码排障与经营总览增强设计

## 目标

本轮补齐两类线上问题：

1. 支付宝支付失败时，服务端必须输出足够定位的脱敏日志，覆盖请求开始、支付宝业务失败、HTTP 失败、二维码或收银台链接生成结果。
2. H5 商品页点击购买后进入 Dou 站内扫码付款体验，微信和支付宝都在确认页自动生成二维码，避免外跳到支付宝独立二维码页。
3. 圈主工作台升级为经营总览，补齐圈主名下所有圈子的资源、订单、付费用户、收益类型、图表、搜索、AI 分析入口和经营工具入口。

## 范围

- Dou-Server：
  - 增强 `alipay.trade.precreate` 日志。
  - 支付宝主链路使用 `alipay.trade.precreate` 返回的 `qr_code`，由 Dou 站内页面渲染二维码。
  - 保留支付宝电脑网站支付收银台 URL 生成作为兼容能力，不作为商品购买默认路径。
  - 支付意图返回 `qr_code_url`；只有兼容模式才可能返回 `cashier_url`。
  - 卡密型资源卡支付前和履约时都校验库存，履约失败不能把订单误标为已支付。
  - 扩展 `/api/admin/tenant/dashboard`，返回 owner 名下所有圈子的经营总览数据。
- Dou-Admin：
  - 商品页 `立即购买`：创建草稿后统一进入 `/shop/checkout/:draftId?autopay=1&channel=...`，按钮 loading 防重复点击。
  - 确认页支持 `autopay=1` 自动固化订单、创建微信或支付宝支付意图，并展示站内二维码。
  - 圈主资源入口显性化为“资源卡管理 / 发布资源卡”，保留分类、H5 链接、卡密库存和订单入口。
  - 圈主工作台展示搜索、资源类别、付费用户排行、收益类型、趋势图、AI 入口和经营工具入口。
- Dou-uniapp：本轮不改。

## 权限与隔离

- 圈主经营总览仍走 `/api/admin/tenant/dashboard` 和 `tenant:dashboard:view`。
- 接口只能被圈主范围账号访问，平台全局账号不通过该接口读取跨租户数据。
- “所有圈子”口径限定为当前圈主账号绑定 owner 用户名下的圈子，不读取其他 owner 数据。
- AI 入口仅做跳转或只读建议入口，不自动修改资金、订单、库存、权限或优惠券。

## 支付链路

官方契约参考：

- 支付宝当面付预创建：`https://opendocs.alipay.com/apis/api_1/alipay.trade.precreate`
- 支付宝电脑网站支付收银台：`https://opendocs.alipay.com/apis/api_1/alipay.trade.page.pay`
- 支付宝电脑网站支付接入指引：`https://opendocs.alipay.com/open/repo-0038oa`

官方口径收敛：

- 支付宝 `alipay.trade.precreate` 返回 `qr_code`，适合商户站内渲染支付宝扫码二维码。
- 支付宝 `alipay.trade.page.pay` 是电脑网站支付收银台能力；`qr_pay_mode` / `qrcode_width` 会影响二维码展示模式，当前商品购买主链路不再依赖该外跳页。
- 微信 Native 支付由后端下单拿到 `code_url`，商户页面将 `code_url` 生成二维码供用户扫码。

1. 买家在商品页填写联系方式和优惠信息。
2. 前端创建订单草稿。
3. 微信与支付宝都进入 Dou 站内扫码页，并通过 `autopay=1&channel=...` 自动固化订单、创建支付意图和渲染二维码。
4. 支付宝默认使用 `alipay.trade.precreate` 返回的 `qr_code` 由 Dou 页面渲染，避免外跳到支付宝极简二维码页，也避免支付宝 `return_url` 命中错误域名后展示后端健康检查 JSON。
5. 后端仍保留 `mode=cashier` 的 `cashier_url` 兼容能力，但商品购买主路径不再默认外跳。
6. 支付成功仍只能由支付宝/微信异步通知或查单推进订单终态和交付；前端轮询成功后跳转订单页。
7. 卡密型商品在创建订单草稿、草稿转订单、创建支付意图和支付履约时都必须校验可售卡密；履约时必须先能创建购买记录并分配卡密，再推进订单为已支付。若真实支付已收到但交付失败，支付意图进入 `unknown/FULFILLMENT_FAILED`，等待补库存、查单或人工退款处理。

## 日志口径

- 日志前缀统一为 `[alipay-pay]`。
- 记录 out_trade_no、金额、接口 method、支付宝 request-id/trace-id、耗时、业务 code/sub_code/sub_msg。
- 不打印私钥、公钥、签名明文、买家联系方式、卡密或交付链接。
- 支付失败仍写 `commerce_payment_logs`，便于对账中心关联支付意图。

## 圈主经营总览口径

- `owner_overview.metrics`：名下圈子总数、资源数、已发布资源、已支付订单、成交金额、待售后、待治理举报。
- `resource_categories`：按商品分类、交付类型、上下架状态聚合资源数、销量、收入。
- `paid_user_leaderboard`：按 H5 买家用户聚合已支付订单、金额、最近支付时间。
- `income_types`：按支付通道、结算状态、交付类型展示收益类型面板。
- `revenue_trend`：最近 7 天订单数和成交金额，用于前端图表。
- `suggestions`：基于数据阈值给出经营建议，并提供 AI 分析和经营工具入口。

## 验收

1. 支付宝配置异常时，宝塔 Node 日志能看到 `[alipay-pay] business failed/http failed/create failed`，并能定位 `sub_code/sub_msg`。
2. 商品页点击购买后按钮进入 loading 状态并防重复点击；微信和支付宝都进入站内扫码页自动出码。
3. 支付成功后仍跳转订单页并展示交付内容。
4. 支付宝支付成功后不再返回 `{ ok: true, service: "dou-server" }` 健康检查 JSON；站内轮询进入订单页。
5. 卡密售罄后创建支付意图被拦截；已支付订单不会长期展示“正在分配”。
6. 圈主工作台能搜索资源或付费用户，看到资源类别、收益类型、付费用户排行、趋势图和入口按钮。
7. 圈主范围账号只能看到自己 owner 名下圈子数据。

## 回滚

- 支付异常：设置 `ALIPAY_PAY_ENABLED=false` 关闭支付宝通道，保留微信或订单草稿。
- 前端站内扫码异常：恢复到确认页手动生成二维码；后端支付意图接口可保留。
- 总览异常：前端隐藏新增面板，保留原工作台核心指标；后端新增聚合字段不影响原字段。
