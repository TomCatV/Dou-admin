# 支付宝扫码排障与经营总览增强设计

## 目标

本轮补齐两类线上问题：

1. 支付宝支付失败时，服务端必须输出足够定位的脱敏日志，覆盖请求开始、支付宝业务失败、HTTP 失败、二维码或收银台链接生成结果。
2. H5 商品页点击购买后直接进入支付宝扫码付款体验，不再先停留在订单确认页；确认页保留为支付兜底和状态刷新页。
3. 圈主工作台升级为经营总览，补齐圈主名下所有圈子的资源、订单、付费用户、收益类型、图表、搜索、AI 分析入口和经营工具入口。

## 范围

- Dou-Server：
  - 增强 `alipay.trade.precreate` 日志。
  - 补充支付宝电脑网站支付收银台 URL 生成，用于 H5 直接跳转扫码页。
  - 支付意图返回 `cashier_url`，仍保留 `qr_code_url` 作为站内二维码兜底。
  - 扩展 `/api/admin/tenant/dashboard`，返回 owner 名下所有圈子的经营总览数据。
- Dou-Admin：
  - 商品页 `立即购买`：创建草稿、固化订单、创建支付宝支付意图，优先跳转支付宝收银台；失败时给出可读提示。
  - 确认页支持 `autopay=1` 自动创建支付宝支付意图，收银台链接不可用时展示站内二维码。
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

1. 买家在商品页填写联系方式和优惠信息。
2. 前端创建订单草稿。
3. 前端立即调用草稿转订单。
4. 前端创建 `alipay_precreate` 支付意图。
5. 后端同时返回：
   - `qr_code_url`：当面付二维码内容。
   - `cashier_url`：支付宝收银台 URL。
6. 前端优先跳转 `cashier_url`；如缺失，则进入确认页站内扫码。
7. 支付成功仍只能由支付宝异步通知或查单推进订单终态和交付。

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
2. 商品页点击购买后不进入确认订单页，优先打开支付宝收银台；收银台缺失时进入 `/shop/checkout/:draftId?autopay=1&channel=alipay`。
3. 支付成功后仍跳转订单页并展示交付内容。
4. 圈主工作台能搜索资源或付费用户，看到资源类别、收益类型、付费用户排行、趋势图和入口按钮。
5. 圈主范围账号只能看到自己 owner 名下圈子数据。

## 回滚

- 支付异常：设置 `ALIPAY_PAY_ENABLED=false` 关闭支付宝通道，保留微信或订单草稿。
- 前端直达异常：隐藏商品页直达逻辑，恢复跳转确认页；后端支付意图接口可保留。
- 总览异常：前端隐藏新增面板，保留原工作台核心指标；后端新增聚合字段不影响原字段。
