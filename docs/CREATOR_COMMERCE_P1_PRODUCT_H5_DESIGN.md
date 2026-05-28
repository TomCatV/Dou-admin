# 圈主商业后台 P1 商品中心与 H5 商品页设计

最后更新：2026-05-28

## 阶段目标

P1 把 P0 的“后台商品中心”向买家侧延伸：每个商品有公开详情页、店铺主页、订单草稿和取货入口。P1 只建立 H5 交易前台和订单草稿，不接真实微信 Native/支付宝扫码支付，真实支付放到 P2。

## 官方资料

| 领域 | 官方资料 | P1 结论 |
| --- | --- | --- |
| Vue 路由 | https://router.vuejs.org/zh/ | H5 页面使用路由参数承载店铺、商品和订单取货路径 |
| Element Plus 表单 | https://element-plus.org/zh-CN/component/form.html | 后台商品分类和店铺字段继续用现有表单校验模式 |
| 微信小程序 WebView | https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html | 如果小程序内嵌 H5，域名必须配置业务域名；P1 先保证浏览器可访问 |

## 范围

1. 商品分类：先做轻量分类，支持后台分类筛选和 H5 展示。
2. 公开商品详情：只返回公开字段，不泄露交付内容。
3. 店铺主页：按圈子/店铺展示商品列表、公告和联系方式。
4. H5 订单草稿：锁定商品快照、价格、买家联系方式和来源。
5. 取货页入口：P1 只展示订单状态和后续支付占位，不展示未支付交付内容。
6. 后台复制商品链接和店铺链接。

## 不做事项

1. 不创建真实第三方支付二维码。
2. 不处理支付成功和自动交付终态。
3. 不做复杂店铺装修、SEO 托管后台、分销佣金。
4. 不把资源卡历史数据一次性迁移到新商品大表。

## 数据模型

P1 采用“兼容优先、渐进抽象”的模型。

新增迁移建议：`034_commerce_h5_foundation.sql`

### `product_categories`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | TEXT PK | 分类 ID |
| `circle_id` | TEXT | 所属圈子 |
| `name` | TEXT | 分类名 |
| `sort_order` | INTEGER | 排序 |
| `status` | TEXT | `active` / `hidden` |
| `created_at` / `updated_at` | TEXT | 时间 |

### `creator_store_profiles`

P1 可以不立即启用完整店铺表。如果启用，字段如下：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | TEXT PK | 店铺资料 ID |
| `circle_id` | TEXT UNIQUE | 绑定圈子 |
| `slug` | TEXT UNIQUE | 店铺短链，未设置时用 circle_id |
| `name` | TEXT | 店铺名，默认圈子名 |
| `description` | TEXT | 店铺简介 |
| `logo_url` | TEXT | 店铺头像 |
| `cover_url` | TEXT | 店铺封面 |
| `contact_text` | TEXT | 客服说明 |
| `status` | TEXT | `open` / `closed` |

### `commerce_order_drafts`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | TEXT PK | 草稿 ID |
| `order_id` | TEXT | 生成真实订单后关联 |
| `circle_id` | TEXT | 租户隔离 |
| `resource_card_id` | TEXT | 兼容资源卡 |
| `buyer_user_id` | TEXT NULL | 已登录买家 |
| `buyer_contact` | TEXT | 邮箱、手机号、微信号，P1 不做强校验 |
| `source_channel` | TEXT | `h5_product` / `h5_store` / `miniapp` |
| `product_snapshot_json` | TEXT | 标题、价格、交付类型、售后规则快照 |
| `amount` | INTEGER | 服务端锁定金额 |
| `status` | TEXT | `draft` / `order_created` / `expired` |
| `expires_at` | TEXT | 草稿过期时间 |
| `created_at` / `updated_at` | TEXT | 时间 |

### `resource_cards` 兼容字段

| 字段 | 用途 |
| --- | --- |
| `category_id` | 商品分类 |
| `share_token` | 商品公开短标识 |
| `h5_status` | `visible` / `hidden`，默认跟随商品状态 |

## 公开字段边界

| 字段类别 | 未购买 H5 | 已购买取货 | 圈主后台 | 平台后台 |
| --- | --- | --- | --- | --- |
| 标题、价格、封面、简介 | 返回 | 返回 | 返回 | 返回 |
| 预览图、试看说明 | 返回 | 返回 | 返回 | 返回 |
| 库存摘要 | 返回可售/售罄 | 返回 | 返回详细 | 返回详细 |
| 资源链接、提取码、文档正文 | 不返回 | 支付成功后返回 | 有权限返回 | 有权限返回 |
| 卡密明文 | 不返回 | 支付成功且归属该订单返回 | 可按权限查看/补发 | 可审计查看 |
| 审核/禁用原因 | 不返回 | 不返回 | 返回 | 返回 |

## 后端接口

### 后台接口

| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/api/admin/tenant/product-categories` | GET | 分类列表 |
| `/api/admin/tenant/product-categories` | POST | 新增分类，审计 |
| `/api/admin/tenant/product-categories/:id` | PATCH | 编辑分类，审计 |
| `/api/admin/tenant/product-categories/:id` | DELETE | 隐藏分类，不硬删 |
| `/api/admin/tenant/store-profile` | GET/PATCH | 店铺资料，P1 可复用 `/tenant/circle` |
| `/api/admin/tenant/resource-cards/:id/public-link` | GET | 返回 H5 商品链接和二维码参数 |

### H5 公开接口

| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/api/shop/stores/:storeKey` | GET | 店铺主页公开资料和上架商品 |
| `/api/shop/products/:productKey` | GET | 商品公开详情 |
| `/api/shop/products/:productKey/order-drafts` | POST | 创建订单草稿 |
| `/api/shop/order-drafts/:draftId` | GET | 查询草稿状态 |
| `/api/shop/orders/:orderId` | GET | 查询订单公开状态，P1 不返回私密交付 |

接口规则：

1. 商品必须 `status='published'` 且审核通过才公开。
2. 店铺关闭或租户暂停时，公开接口返回店铺关闭状态，不泄露商品私密字段。
3. 创建草稿时服务端读取当前商品价格和库存，不信任前端金额。
4. 草稿过期后不能继续进入 P2 支付意图。

## H5 页面

| 页面 | 路由 | 状态 |
| --- | --- | --- |
| 店铺主页 | `/s/:storeKey` | 正常、关闭、无商品、加载失败 |
| 商品详情 | `/p/:productKey` | 正常、售罄、下架、审核中、违规不可见 |
| 订单草稿 | `/checkout/:draftId` | 待确认、过期、商品改价、库存不足 |
| 取货页 | `/orders/:orderId` | 待支付、已关闭、已支付占位、售后入口占位 |

首版 H5 承载决策：

1. H5 买家购买页放在 `Dou-Admin` 的同一套 Vite 构建产物内，使用 `/shop/*` 公开路由，不进入后台布局，不要求管理员登录。
2. `Dou-Admin` 后台只负责商品管理、分类、H5 可见性和复制公开链接；公开购买页仍调用 `Dou-Server` 的 `/api/shop/*`。
3. `Dou-uniapp` 不承载本阶段 H5 购买页，避免把小程序用户端与 PC 管理后台的公开商城入口混在一起。
4. 域名建议继续使用 `shop.doucatapp.top` 或管理后台同域公开入口，并在 Nginx 中把 `/api/shop` 反代到 `Dou-Server`。

## 风控和内容安全

1. H5 公开接口只读，不接受交付字段写入。
2. 商品标题、简介、预览、店铺资料必须已通过内容审核。
3. 创建草稿增加 IP + 商品维度频控，避免刷单草稿。
4. 草稿保留 30 分钟，定期清理。
5. 商品改价后旧草稿显示“价格已变化，请重新下单”。

## 验收

1. 圈主能给商品设置分类并复制 H5 商品链接。
2. 未购买访问商品详情看不到交付内容和卡密。
3. 下架、删除、禁用、审核未通过商品在 H5 不可购买。
4. 创建草稿后锁定服务端价格和商品快照。
5. 店铺关闭或租户暂停时，H5 给出关闭提示，不返回敏感字段。
6. P1 不生成真实支付二维码，也不推进支付终态。

## 验证命令

Dou-Server：

```powershell
node --check src/routes/shop/index.js
node --check src/routes/admin/tenantProductCategories.routes.js
npm run migrate
git diff --check
```

前端承载仓库：

```powershell
pnpm typecheck
pnpm build
git diff --check
```

## 回滚方案

1. H5 异常：关闭 H5 域名入口，后台仍保留商品中心。
2. 公开接口异常：移除 `/api/shop` 路由挂载，不影响小程序 `/api/v0.9`。
3. 分类异常：隐藏分类 UI，商品继续按未分类展示。

## 待用户提供参数

| 参数 | 填写指导 |
| --- | --- |
| H5 承载方式 | 已定为 Dou-Admin 公开路由 `/shop/*`，不再放入 Dou-uniapp |
| H5 域名 | 建议 `shop.doucatapp.top` 或 Admin 同域公开入口，需配置 HTTPS、CORS、微信/支付宝相关白名单 |
| 店铺短链规则 | 可先用 `circle_id`，后续再允许用户自定义 slug |

## 2026-05-28 P1 实现修订

本轮按用户确认后的仓库边界修订 P1：H5 买家购买页由 `Dou-Admin` 公开构建入口承载，`Dou-uniapp` 的 H5 页面提交已撤回。

1. 后端新增 `034_commerce_h5_foundation.sql`，包含 `product_categories`、`commerce_order_drafts`，并给 `resource_cards` 增加 `category_id`、`share_token`、`h5_status`。
2. 后端新增 `/api/shop/*` 公共接口，支持店铺主页、公开商品详情、订单草稿创建、草稿查询和订单公开状态查询。
3. 圈主后台新增商品分类接口和商品公开链接接口；商品中心支持按分类筛选、设置分类、设置 H5 可见性、复制 H5 商品链接。
4. `Dou-Admin` 新增公开路由 `/shop/store/:storeKey`、`/shop/product/:productKey`、`/shop/checkout/:draftId`、`/shop/order/:orderId`，P1 只展示支付占位，不生成真实支付二维码。
5. 实际 H5 链接首版使用 Admin hash 路由：`/#/shop/product/{productKey}` 与 `/#/shop/store/{storeKey}`。若后续服务器或 CDN 做短链重写，可再把 `/p/:productKey`、`/s/:storeKey` 映射到上述页面。
6. 敏感边界保持不变：公开接口不返回 `resource_url`、`resource_access_code`、`doc_content`、`doc_url`、卡密明文和后台审核原因。

本轮验证：

```powershell
node --check src/routes/shop/index.js
node --check src/routes/admin/tenantProductCategories.routes.js
node --check src/routes/admin/tenant.routes.js
node --check src/lib/resourceCards.js
node --check src/app.js
npm run migrate # 使用临时 DATABASE_PATH 全量迁移
```

H5 承载仓验证：

```powershell
pnpm typecheck
pnpm build
```

并用公开路由回归店铺页、商品详情页、确认订单页和订单状态页。
