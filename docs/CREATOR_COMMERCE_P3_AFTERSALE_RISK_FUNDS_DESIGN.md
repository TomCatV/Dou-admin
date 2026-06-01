# 圈主商业后台 P3 售后、风控与资金闭环设计

最后更新：2026-06-02

## 阶段目标

P3 在 P2 支付闭环后，把售后、退款、补发、风控、钱包、结算、提现和对账打通，形成可商用的交易后链路。核心原则是资金终态只能由专用服务和可信回调推进，后台只发起动作和展示状态。

## 官方资料

| 领域         | 官方资料                                             | P3 结论                                              |
| ------------ | ---------------------------------------------------- | ---------------------------------------------------- |
| 微信退款     | https://pay.wechatpay.cn/doc/v3/merchant/4013071036  | 退款请求成功只代表受理，最终以查单或退款通知为准     |
| 微信退款查询 | https://pay.wechatpay.cn/doc/v3/merchant/4013071041  | 异常和丢回调用查询兜底                               |
| 微信退款通知 | https://pay.wechatpay.cn/doc/v3/merchant/4013071196  | 回调验签解密后推进本地退款状态                       |
| 支付宝退款   | https://developer.alibaba.com/docs/api.htm?apiId=759 | 支付宝退款同样需要请求、查询、异步通知或主动查询兜底 |

## 范围

1. 商品售后中心：买家发起、圈主协商、平台介入。
2. 售后动作：回复、补发资源、补发/更换卡密、拒绝、主动退款、平台裁决。
3. 风控：买家黑名单、高频退款、可疑商品、异常支付和批量售后。
4. 资金闭环：退款、钱包冲正、结算冻结、提现拦截、对账记录。
5. 通知：售后待处理、退款异常、风控命中。

## 不做事项

1. 不允许圈主直接修改订单支付状态。
2. 不允许平台管理员手动把退款改成成功；只能触发查询、重试或登记人工处理备注。
3. 不做复杂风控模型训练，先用规则和人工复核。

## 数据模型

新增迁移建议：`036_commerce_after_sale_risk_funds.sql`

### `commerce_after_sale_actions`

| 字段            | 说明                                                                                    |
| --------------- | --------------------------------------------------------------------------------------- |
| `id`            | 动作 ID                                                                                 |
| `after_sale_id` | 售后单                                                                                  |
| `actor_type`    | `buyer` / `creator` / `platform` / `system`                                             |
| `actor_id`      | 操作人                                                                                  |
| `action`        | `reply` / `resend` / `replace_code` / `refund_request` / `reject` / `platform_decision` |
| `payload_json`  | 脱敏动作内容                                                                            |
| `created_at`    | 时间                                                                                    |

### `commerce_delivery_adjustments`

| 字段                          | 说明                                                |
| ----------------------------- | --------------------------------------------------- |
| `id`                          | 交付调整 ID                                         |
| `order_id`                    | 订单                                                |
| `resource_card_id`            | 商品                                                |
| `old_code_id` / `new_code_id` | 换卡密                                              |
| `action`                      | `resend_resource` / `replace_code` / `disable_code` |
| `reason`                      | 原因                                                |
| `created_by_admin_id`         | 操作人                                              |
| `created_at`                  | 时间                                                |

### `buyer_risk_profiles`

| 字段                   | 说明                            |
| ---------------------- | ------------------------------- |
| `id`                   | 风控档案                        |
| `buyer_key`            | 用户 ID、邮箱、手机号或设备标识 |
| `risk_level`           | `normal` / `watch` / `blocked`  |
| `refund_count_30d`     | 30 天退款数                     |
| `after_sale_count_30d` | 30 天售后数                     |
| `blocked_until`        | 封禁到期                        |
| `reason`               | 原因                            |

### `commerce_reconciliation_records`

| 字段                                | 说明                                               |
| ----------------------------------- | -------------------------------------------------- |
| `id`                                | 对账记录                                           |
| `channel`                           | `wechat` / `alipay` / `wallet`                     |
| `business_type`                     | `payment` / `refund` / `withdrawal` / `settlement` |
| `business_id`                       | 本地业务 ID                                        |
| `expected_amount` / `actual_amount` | 金额                                               |
| `status`                            | `matched` / `mismatch` / `pending` / `manual`      |
| `evidence_json`                     | 第三方单号、查单摘要、人工备注                     |

## 状态和规则

售后状态：

```text
open -> buyer_withdrew
open -> creator_replied
open -> platform_review
open -> rejected
open -> refunding -> refunded
open -> closed
```

退款状态：

```text
none -> requested -> third_pending -> third_success
                             -> third_failed
                             -> abnormal -> manual_review
```

规则：

1. 退款发起前先锁定售后单，避免重复退款。
2. 退款请求不明确时保持 `third_pending`，不恢复收益。
3. 退款成功后禁用卡密、关闭交付权限、冲正结算和钱包。
4. 退款失败后恢复交付和结算前必须有明确失败状态。
5. 已提现收益对应订单退款时进入平台垫付或负余额策略，不直接改历史提现终态。

## 后端接口

| 接口                                             | 方法      | 说明                   |
| ------------------------------------------------ | --------- | ---------------------- |
| `/api/shop/orders/:orderId/after-sales`          | POST      | 买家发起售后           |
| `/api/admin/tenant/after-sales/:id/messages`     | POST      | 圈主回复               |
| `/api/admin/tenant/after-sales/:id/resend`       | POST      | 补发资源               |
| `/api/admin/tenant/after-sales/:id/replace-code` | POST      | 更换卡密               |
| `/api/admin/tenant/after-sales/:id/refund`       | POST      | 发起退款               |
| `/api/admin/after-sales/:id/platform-decision`   | POST      | 平台介入裁决           |
| `/api/admin/risk/buyers`                         | GET/PATCH | 平台查看和维护买家风控 |
| `/api/admin/reconciliation`                      | GET       | 对账列表               |
| `/api/admin/reconciliation/:id/mark`             | POST      | 人工标记处理结果       |

## 前端页面

| 页面     | 路由                             | 说明                         |
| -------- | -------------------------------- | ---------------------------- |
| 圈主售后 | `/tenant/orders?tab=after-sales` | 回复、补发、换卡密、退款     |
| 平台售后 | `/after-sales`                   | 平台介入、退款异常、风控信息 |
| 风控买家 | `/risk/buyers`                   | 黑名单和风险档案             |
| 对账中心 | `/finance/reconciliation`        | 支付、退款、提现、结算异常   |

## 2026-06-02 实装补充

本轮已把 P3 的售后动作和买家风控补成可上线的首版闭环：

1. 后端新增 `040_commerce_after_sale_actions_risk.sql`，包含售后动作日志、交付调整记录和买家风控档案。
2. 圈主后台新增售后详情接口，支持回复买家、补发资源、更换卡密、发起微信原路退款和刷新退款状态。
3. 补发资源只记录交付调整和系统消息，不改变订单、结算、钱包或平台营收流水。
4. 更换卡密会禁用旧卡密并分配一条新可用卡密；若库存不足，接口返回失败，要求圈主先补库存。
5. 平台后台新增 `平台治理 / 买家风控`，可维护正常、观察、黑名单档案。
6. 黑名单买家会在 H5 创建订单草稿和草稿转正式订单两处被阻断，避免绕过入口继续支付。
7. 平台售后拒绝、平台代发退款、圈主退款、回复、补发和换码都会写入售后动作轨迹；资金终态仍只由退款服务、回调或查单推进。

权限口径：

| 权限                | 说明                                              |
| ------------------- | ------------------------------------------------- |
| `after_sale:manage` | 圈主或平台处理售后                                |
| `risk:buyer:manage` | 平台维护买家风控，默认超级管理员和 1 级管理员拥有 |

本轮边界：

1. 暂不自动按退款率把买家升级为观察或黑名单，先由平台人工维护。
2. 暂不在圈主后台展示买家联系方式明文，避免敏感信息扩散。
3. 暂不允许圈主手动关闭售后，关闭、拒绝和平台裁决继续由平台售后治理收口。

## 风控规则

1. 24 小时内同买家超过 3 次售后进入观察。
2. 30 天内退款率超过 50% 的买家进入人工复核。
3. 同商品售后率超过阈值时通知平台治理。
4. 黑名单买家不能创建新订单草稿。
5. 可疑商品不能上架，已上架商品进入平台复核。

## 验收

1. 买家能对已支付订单发起售后，未支付不能发起。
2. 圈主能回复、补发、换卡密，所有动作有审计。
3. 圈主发起退款后订单、售后、交付、钱包、结算联动正确。
4. 重复点击退款不重复请求第三方。
5. 回调丢失时查询能恢复退款状态。
6. 风控命中后能阻断新草稿或进入人工复核。

## 验证命令

```powershell
node --check src/lib/commerceAfterSales.js
node --check src/lib/commerceRisk.js
node --check src/lib/commerceReconciliation.js
node --check src/routes/admin/reconciliation.routes.js
npm run migrate
git diff --check
```

## 回滚方案

1. 售后增强异常：保留原资源卡售后入口，隐藏补发/换卡密/风控页面。
2. 退款异常：关闭主动退款按钮，改为人工处理，保留售后沟通。
3. 风控误拦：平台解除买家或商品风险标记。
4. 对账异常：对账页面只读，不影响交易主链路。

## 待用户提供参数

| 参数               | 填写指导                                       |
| ------------------ | ---------------------------------------------- |
| 售后 SLA           | 默认 24 小时；如要延长需同步前端文案和售后校验 |
| 高频退款阈值       | 默认 30 天退款 3 次或退款率 50%                |
| 已提现订单退款策略 | 选择平台垫付、圈主负余额、或人工线下处理       |
