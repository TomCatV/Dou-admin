# Dou 商用多租户后台上线前验收清单

最后更新：2026-06-02

## 必填配置

| 模块        | 必填项                                                                             | 负责人确认                                                   |
| ----------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 管理后台    | `ADMIN_BOOTSTRAP_USERNAME`、`ADMIN_BOOTSTRAP_PASSWORD`、`ADMIN_JWT_SECRET`         | 上线后立即修改初始密码                                       |
| H5 公开页   | `VITE_SHOP_BASE_URL`、`VITE_SHOP_API_BASE_URL`                                     | 域名、HTTPS、反代和小程序业务域名一致                        |
| 微信支付    | 商户号、API V3 Key、证书序列号、私钥、平台证书、支付/退款回调 URL                  | 未确认前不要开放真实支付                                     |
| 支付宝      | AppID、应用私钥、支付宝公钥、回调 URL                                              | 私钥/公钥建议用 PEM；未启用时保持 `ALIPAY_PAY_ENABLED=false` |
| 结算提现    | `CREATOR_SETTLEMENT_ENABLED`、`CREATOR_WITHDRAW_ENABLED`、冻结天数、最低提现额     | 真实资金动作上线前必须真机联调                               |
| 平台费率    | `PLATFORM_TRADE_FEE_BPS`、`PLATFORM_CHANNEL_COST_BPS`                              | 费率策略上线后只影响新订单                                   |
| 人工调账    | `PLATFORM_REVENUE_ADJUST_MAX_AMOUNT`                                               | 建议生产默认不超过 1000 元                                   |
| 内容安全    | COS/CI 内容审核密钥、回调 URL、fail-open 策略                                      | 生产建议审核不可用时阻断高风险写入                           |
| AI 经营助手 | `OPENAI_API_KEY`、`AI_DEFAULT_MODEL`、`AI_DAILY_LIMIT_BASIC`、`AI_DAILY_LIMIT_PRO` | Key 只放 Dou-Server 环境变量                                 |

## 角色验收

| 角色           | 必验项目                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------- |
| 超级管理员     | 创建 1-3 级管理员；创建圈主账号；配置账号分组；授权主房间聊天记录；配置套餐、费率、买家风控 |
| 1 级管理员     | 平台治理、售后、提现、平台营收、对账、费率可用；不能替代超级管理员唯一身份                  |
| 2 级管理员     | 可处理运营和售后；无人工调账权限时应返回 403                                                |
| 3 级管理员     | 只做低风险治理和查看；不可进入高危财务配置                                                  |
| 圈主主账号     | 店铺资料、商品、订单售后、私域转化、钱包、AI 经营助手可用                                   |
| 圈主运营子账号 | 按授权可运营商品、售后、转化和 AI；不能跨圈访问                                             |
| 圈主只读账号   | 可查看数据和 AI 历史；不能新增商品、提现、生成 AI 或执行写操作                              |

## 主链路验收

1. 后台登录、强制改密、修改密码后旧 token 失效。
2. 圈主账号绑定微信用户 ID 和圈子后，只能访问对应圈子。
3. 商品创建、分类、上架、H5 链接复制、改价后重新下单金额同步最新价格。
4. H5 商品页、确认订单、扫码支付、支付成功、订单状态页闭环。
5. 已支付订单页展示投诉按钮，点击后能打开独立投诉页并提交售后。
6. 优惠券和邀请码试算、下单固化、支付成功核销、退款后归因标记 `refunded`。
7. 售后回复、补发资源、换卡密、发起退款、刷新退款状态。
8. 买家黑名单阻断 H5 新下单和草稿转订单。
9. 钱包余额、提现申请、平台审核、微信商家转账、同步状态。
10. 平台营收列表、CSV 导出、人工调整、反向调整、审计日志。
11. 对账中心列表、详情、标记处理，不改变资金终态。
12. AI 经营助手生成日报和活动文案；未配置 Key 时失败可见且不影响交易。

## 技术验收命令

Dou-Server：

```powershell
node --check src/lib/aiBusinessAssistant.js
node --check src/routes/admin/tenantAi.routes.js
node --check src/routes/admin/index.js
node --check src/lib/adminPermissions.js
npm.cmd run migrate
git diff --check
```

Dou-admin：

```powershell
corepack pnpm typecheck
corepack pnpm build
git diff --check
```

线上验收可选：

```powershell
corepack pnpm verify:finance-online
```

设置 `ADMIN_AUTH_TOKEN` 后可回归高权限财务接口；设置 `ADMIN_L2_AUTH_TOKEN` 后可回归 2 级管理员无人工调账权限。

## 上线判断

可上线条件：

1. P0-P5 后端迁移全部执行成功。
2. Admin 构建成功，核心菜单按角色展示正常。
3. 支付、退款、提现等资金链路已用真实商户或沙箱完成验收。
4. 必填环境变量已在服务器配置，不在仓库明文保存。
5. 超级管理员、管理员、圈主主账号、运营子账号、只读账号均完成至少一轮回归。
6. 已确认提交推送完成；不要求继续等待自动化 CI/CD 状态。
