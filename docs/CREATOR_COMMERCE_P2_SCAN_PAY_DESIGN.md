# 圈主商业后台 P2 H5 扫码支付设计

最后更新：2026-05-28

## 阶段目标

P2 在 P1 H5 商品页和订单草稿基础上接入真实扫码支付：微信支付 Native 和支付宝当面付。买家在 H5 看到二维码，扫码付款后由后端验签回调、查单兜底、自动交付，并写入对账记录。

## 官方资料

| 领域 | 官方资料 | P2 结论 |
| --- | --- | --- |
| 微信 Native 下单 | https://pay.wechatpay.cn/doc/v3/merchant/4012791877 | 使用服务端创建 Native 支付二维码，前端只展示 `code_url` |
| 微信支付通知 | https://pay.wechatpay.cn/doc/v3/merchant/4012084746 | 回调必须验签、解密、金额核对、幂等处理 |
| 微信查单 | https://pay.wechatpay.cn/doc/v3/merchant/4012524594 | 支付结果不明确时按商户单号查单 |
| 微信关单 | https://pay.wechatpay.cn/doc/v3/merchant/4012524592 | 支付超时或金额漂移时关闭待支付单 |
| 微信退款 | https://pay.wechatpay.cn/doc/v3/merchant/4013071036 | 与 P3 售后退款复用，不在支付回调直接退款 |
| 支付宝当面付预创建 | https://developer.alibaba.com/docs/api.htm?apiId=862 | 使用 `alipay.trade.precreate` 返回 `qr_code` |
| 支付宝交易查询 | https://developer.alibaba.com/docs/api.htm?apiId=757 | 支付不明确时调用查询 |
| 支付宝交易关闭 | https://developer.alibaba.com/docs/api.htm?apiId=1058 | 超时或取消时关闭交易 |
| 支付宝退款 | https://developer.alibaba.com/docs/api.htm?apiId=759 | P3 售后退款复用 |

## 范围

1. 支付意图：为订单生成微信/支付宝扫码支付意图。
2. 二维码返回：H5 展示二维码和过期倒计时。
3. 支付回调：验签、金额核对、幂等、状态推进。
4. 查单兜底：前端刷新或定时任务查询不明确订单。
5. 超时关单：支付意图过期后关闭第三方订单和本地订单。
6. 自动交付：支付成功后调用统一交付服务。
7. 对账记录：保存请求、回调、查单摘要，便于运营排障。

## 不做事项

1. 不允许前端传金额并直接下单。
2. 不做圈主自配支付通道。
3. 不做服务商分账和圈主直清。
4. 不在回调里执行不可重试的大量副作用，交付必须幂等。

## 数据模型

新增迁移建议：`035_commerce_payment_intents.sql`

### `commerce_payment_intents`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | TEXT PK | 支付意图 ID |
| `order_id` | TEXT | 本地订单 |
| `draft_id` | TEXT | 来源草稿 |
| `circle_id` | TEXT | 圈子 |
| `channel` | TEXT | `wechat_native` / `alipay_precreate` |
| `out_trade_no` | TEXT UNIQUE | 商户订单号 |
| `third_trade_no` | TEXT | 微信/支付宝交易号 |
| `amount` | INTEGER | 分 |
| `currency` | TEXT | 默认 `CNY` |
| `status` | TEXT | `created` / `qr_issued` / `paid` / `closed` / `failed` / `unknown` |
| `qr_code_url` | TEXT | 微信 `code_url` 或支付宝 `qr_code` |
| `expires_at` | TEXT | 过期时间 |
| `paid_at` | TEXT | 支付成功时间 |
| `closed_at` | TEXT | 关闭时间 |
| `last_error_code` | TEXT | 第三方错误码 |
| `last_error_message` | TEXT | 错误信息 |
| `notify_raw_json` | TEXT | 脱敏回调摘要 |
| `query_raw_json` | TEXT | 脱敏查单摘要 |
| `created_at` / `updated_at` | TEXT | 时间 |

### `commerce_payment_logs`

记录下单、回调、查单、关单请求摘要：

| 字段 | 说明 |
| --- | --- |
| `id`、`intent_id`、`order_id`、`channel` | 关联信息 |
| `action` | `create` / `notify` / `query` / `close` |
| `status_code` | HTTP 状态 |
| `request_id` | 微信 `Request-ID` 或支付宝 trace |
| `request_json`、`response_json` | 脱敏摘要 |
| `created_at` | 时间 |

### `orders` 兼容字段

| 字段 | 用途 |
| --- | --- |
| `pay_channel` | 记录实际支付通道 |
| `payment_intent_id` | 当前有效支付意图 |
| `paid_at` | 支付成功时间 |
| `closed_at` | 关闭时间 |
| `source_channel` | `h5_product` / `h5_store` / `miniapp` |

## 状态机

```text
draft -> order_created -> paying -> paid -> delivered
                         -> closed
                         -> unknown -> paid/closed/failed
```

规则：

1. `paid` 只能由可信回调或查单确认推进。
2. 回调金额必须等于本地订单金额。
3. 重复回调返回成功但不重复交付。
4. 支付意图过期后先查单，未支付再关单。
5. 商品改价后已有支付意图不改金额；需要关闭旧单并重新下单。

## 后端接口

| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/api/shop/order-drafts/:draftId/orders` | POST | 草稿转订单，生成本地订单 |
| `/api/shop/orders/:orderId/payment-intents` | POST | 创建微信/支付宝支付意图 |
| `/api/shop/payment-intents/:id` | GET | 查询支付意图状态 |
| `/api/shop/orders/:orderId/payment-status` | POST | 主动查单并同步状态 |
| `/api/shop/payment-intents/:id/close` | POST | 用户取消或超时关单 |
| `/api/v0.9/payments/wechat/native/notify` | POST | 微信 Native 支付通知 |
| `/api/v0.9/payments/alipay/notify` | POST | 支付宝异步通知 |

## H5 页面行为

1. 选择支付方式后请求支付意图。
2. 展示二维码、倒计时、订单金额和商品标题。
3. 每 3-5 秒轮询本地支付意图，不直接信任第三方前端跳转。
4. 倒计时结束调用同步状态；未支付则提示重新生成二维码。
5. 支付成功跳转取货页。

## 安全和合规

1. 支付回调必须验签，开发环境可配置 mock，但生产不能跳过。
2. 回调解密失败、验签失败、金额不符均记录日志并拒绝推进状态。
3. 日志脱敏，不记录完整证书、私钥、openid、买家联系方式。
4. API 加入幂等键，创建支付意图时同一订单同一通道只有一个有效二维码。
5. 定时任务扫描 `unknown` 和过期 `paying`，执行查单和关单。

## 验收

1. 微信 Native 可生成二维码，扫码支付后回调推进订单为已支付并自动交付。
2. 支付宝预创建可生成二维码，扫码支付后异步通知推进订单。
3. 重复回调不重复发卡密、不重复结算。
4. 金额不一致的回调不会推进订单，进入异常日志。
5. 支付超时后关单，本地订单关闭且不可继续支付。
6. 查单能恢复回调丢失的成功订单。

## 验证命令

```powershell
node --check src/lib/commercePayments.js
node --check src/lib/wechatNativePay.js
node --check src/lib/alipayFacePay.js
node --check src/routes/shop/payments.routes.js
node --check src/routes/v09/wechatNativeNotify.routes.js
npm run migrate
git diff --check
```

## 回滚方案

1. 配置关闭 H5 支付入口，保留 H5 商品详情。
2. 移除 `/api/shop/*/payment-intents` 路由挂载，不影响小程序 JSAPI 支付。
3. 对未明确支付结果的订单只查单不退款，人工对账后处理。
4. 支付通道异常时隐藏对应通道，仅保留另一个通道或暂停购买。

## 待用户提供参数

| 参数 | 填写指导 |
| --- | --- |
| `WECHAT_PAY_MCH_ID` | 微信支付商户号 |
| `WECHAT_PAY_SERIAL_NO` | API 证书序列号 |
| `WECHAT_PAY_PRIVATE_KEY_PATH` | 商户私钥路径，生产服务器本地安全路径 |
| `WECHAT_PAY_PLATFORM_CERT_PATH` | 微信支付平台证书路径，用于回调验签 |
| `WECHAT_NATIVE_NOTIFY_URL` | 例如 `https://api.doucatapp.top/api/v0.9/payments/wechat/native/notify` |
| `ALIPAY_APP_ID` | 支付宝开放平台应用 AppID |
| `ALIPAY_PRIVATE_KEY_PATH` | 应用私钥路径 |
| `ALIPAY_PUBLIC_KEY_PATH` | 支付宝公钥路径 |
| `ALIPAY_NOTIFY_URL` | 例如 `https://api.doucatapp.top/api/v0.9/payments/alipay/notify` |
| 支付测试商品 | 准备 0.01-1 元测试商品，便于真实扫码回归 |
