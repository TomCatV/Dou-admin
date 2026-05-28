# 圈主商业后台 P4 运营工具与分销设计

最后更新：2026-05-28

## 阶段目标

P4 在交易、支付、售后资金闭环稳定后，提供小而美的运营工具：优惠券、邀请码、活动、渠道归因、买家标签、库存预警和简易分销。第一版只做一个可验收的运营闭环，避免做成复杂 ERP。

## 范围

1. 优惠券：满减、折扣、指定商品、有效期、领取/使用限制。
2. 邀请码：商品或店铺级邀请码，记录来源。
3. 活动：限时活动、活动链接、活动商品。
4. 渠道归因：订单记录来源渠道、活动、邀请码。
5. 买家标签：手动标签、购买行为标签、黑名单联动。
6. 库存预警：卡密库存不足通知。
7. 简易分销：代理链接、佣金预估、退款反冲；P4 首版可只做统计和人工结算。

## 不做事项

1. 不做多级分销和复杂团队计酬。
2. 不让分销佣金直接进入可提现余额，必须先经过结算服务。
3. 不做大规模 BI 导出，只做分页和额度限制。

## 数据模型

新增迁移建议：`037_commerce_operations_distribution.sql`

### `commerce_coupons`

| 字段 | 说明 |
| --- | --- |
| `id` | 优惠券 ID |
| `circle_id` | 圈子 |
| `name` | 名称 |
| `type` | `amount_off` / `percent_off` |
| `value` | 优惠值，金额分或折扣百分比 |
| `min_amount` | 使用门槛 |
| `product_scope_json` | 指定商品范围 |
| `total_limit` / `per_buyer_limit` | 总量和单人限制 |
| `starts_at` / `ends_at` | 有效期 |
| `status` | `draft` / `active` / `paused` / `expired` |

### `commerce_invite_codes`

| 字段 | 说明 |
| --- | --- |
| `id` | 邀请码 ID |
| `circle_id` | 圈子 |
| `code` | 邀请码 |
| `target_type` | `store` / `product` / `activity` |
| `target_id` | 目标 |
| `channel_name` | 渠道名 |
| `status` | 状态 |

### `commerce_campaigns`

| 字段 | 说明 |
| --- | --- |
| `id` | 活动 ID |
| `circle_id` | 圈子 |
| `name` | 活动名 |
| `type` | `limited_time` / `bundle` / `launch` |
| `rules_json` | 活动规则 |
| `starts_at` / `ends_at` | 时间 |
| `status` | 状态 |

### `commerce_order_attributions`

| 字段 | 说明 |
| --- | --- |
| `id` | 归因 ID |
| `order_id` | 订单 |
| `circle_id` | 圈子 |
| `source_channel` | 来源 |
| `invite_code_id` | 邀请码 |
| `campaign_id` | 活动 |
| `coupon_id` | 优惠券 |
| `affiliate_id` | 分销代理 |
| `created_at` | 时间 |

### `commerce_affiliates`

| 字段 | 说明 |
| --- | --- |
| `id` | 代理 ID |
| `circle_id` | 圈子 |
| `user_id` | 代理用户 |
| `rate_bps` | 佣金比例，万分比 |
| `status` | `active` / `paused` / `blocked` |

### `commerce_affiliate_commissions`

| 字段 | 说明 |
| --- | --- |
| `id` | 佣金记录 |
| `order_id` | 订单 |
| `affiliate_id` | 代理 |
| `amount` | 佣金分 |
| `status` | `pending` / `settled` / `reversed` |

## 后端接口

| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/api/admin/tenant/operations/coupons` | GET/POST | 优惠券列表和创建 |
| `/api/admin/tenant/operations/coupons/:id` | PATCH | 编辑、暂停、恢复 |
| `/api/admin/tenant/operations/invite-codes` | GET/POST | 邀请码 |
| `/api/admin/tenant/operations/campaigns` | GET/POST | 活动 |
| `/api/admin/tenant/operations/attributions` | GET | 渠道效果 |
| `/api/admin/tenant/operations/affiliates` | GET/POST | 简易代理 |
| `/api/shop/products/:id/apply-coupon` | POST | 下单前试算优惠 |
| `/api/shop/order-drafts/:id/attribution` | POST | 记录邀请码/渠道 |

## 订单价格和归因规则

1. 优惠试算和最终订单创建都由服务端计算。
2. 优惠券只影响订单支付金额，不影响商品原价字段。
3. 同一订单只允许一个最终归因来源，优先级：活动 > 邀请码 > 普通渠道。
4. 退款后优惠券核销和佣金记录必须反冲。
5. 分销佣金初版进入 `pending`，不直接打入钱包。

## 前端页面

| 页面 | 路由 | 说明 |
| --- | --- | --- |
| 优惠工具 | `/tenant/operations/coupons` | 创建、暂停、统计 |
| 邀请渠道 | `/tenant/operations/channels` | 邀请码和渠道链接 |
| 活动管理 | `/tenant/operations/campaigns` | 限时活动 |
| 买家标签 | `/tenant/conversion/leads` | 复用线索和标签能力 |
| 库存预警 | `/tenant/resources?stock=low` | 商品中心筛选低库存 |
| 分销代理 | `/tenant/operations/affiliates` | 简易代理和佣金统计 |

## 反作弊

1. 同买家、同设备、同支付账号不能重复领取超过限制。
2. 邀请码与代理归因写入后不可由前端修改。
3. 自购返佣默认禁止：代理用户和买家用户一致时不产生佣金。
4. 高频取消、退款、异常支付会冻结佣金。
5. 导出按套餐限额控制，导出数据脱敏。

## 验收

1. 圈主能创建优惠券，H5 下单可试算并使用。
2. 邀请码链接下单后订单记录来源。
3. 活动页面能筛选活动订单。
4. 卡密库存低于阈值时右上角通知提醒。
5. 代理链接产生订单后佣金进入待结算，退款后反冲。
6. viewer 不能创建运营工具。

## 验证命令

```powershell
node --check src/lib/commerceOperations.js
node --check src/routes/admin/tenantOperations.routes.js
node --check src/routes/shop/attribution.routes.js
npm run migrate
git diff --check
```

## 回滚方案

1. 优惠券异常：关闭优惠券试算入口，订单恢复原价。
2. 归因异常：停止写入新归因，历史订单保留。
3. 佣金异常：佣金保持 `pending`，人工对账后处理。

## 待用户提供参数

| 参数 | 填写指导 |
| --- | --- |
| 优惠券默认上限 | 建议单租户每月 50 个，后续按套餐放大 |
| 库存预警阈值 | 建议卡密可售库存低于 5 条提醒 |
| 分销比例上限 | 建议首版不超过 30%，并默认需要平台开关 |
