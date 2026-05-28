# 圈主商业后台 P5 AI 经营助手设计

最后更新：2026-05-28

## 阶段目标

P5 在交易数据、售后、运营归因稳定后，引入 AI 经营助手，帮助圈主生成经营日报、商品诊断、售后风险分析、买家分层和活动文案。AI 只辅助决策，不得静默修改资金、库存、交付、权限或用户访问。

## 官方资料

| 领域 | 官方资料 | P5 结论 |
| --- | --- | --- |
| OpenAI Responses API | https://platform.openai.com/docs/api-reference/responses | 经营助手优先采用统一响应接口，便于工具调用和结构化输出 |
| OpenAI 模型文档 | https://platform.openai.com/docs/models | 模型选择在 P5 开发前再次复核，按成本和推理质量分层 |
| 结构化输出 | https://platform.openai.com/docs/guides/structured-outputs | 经营日报、风险结论和文案建议使用结构化 JSON，便于前端展示和审计 |
| OpenAI 数据使用政策 | https://openai.com/policies/row-privacy-policy/ | 上线前复核隐私、保留和数据处理要求，敏感数据最小化传输 |

说明：P5 进入代码前必须再次复核 OpenAI 官方文档和当前可用模型，不用旧模型名硬编码业务承诺。

## 范围

1. 经营日报：收入、订单、转化、售后、库存、风险提醒。
2. 商品诊断：标题、简介、价格、封面、转化建议。
3. 售后风险：投诉原因归类、高风险商品和买家。
4. 买家分层：新客、复购、沉默、高价值、风险买家。
5. 活动文案：基于商品和活动目标生成候选文案。
6. AI 审计：记录输入摘要、模型、提示词版本、输出、人工确认。

## 不做事项

1. 不自动改价格、库存、交付内容、优惠券和权限。
2. 不把买家完整隐私、卡密明文、支付证书、私钥传给模型。
3. 不做无审计的后台自动执行。
4. 不把 AI 结果作为风控唯一依据。

## 数据边界

允许输入：

| 数据 | 处理方式 |
| --- | --- |
| 商品标题、简介、价格、销量 | 可传 |
| 订单聚合指标 | 只传汇总，不传完整支付单号 |
| 售后原因和处理结果 | 脱敏后传 |
| 买家分层统计 | 只传标签和汇总 |
| 运营活动数据 | 可传规则和效果汇总 |

禁止输入：

| 数据 | 处理方式 |
| --- | --- |
| 卡密明文 | 禁止传 |
| 支付证书、私钥、签名材料 | 禁止传 |
| 完整 openid、手机号、邮箱 | 默认脱敏或哈希 |
| 未经授权的聊天私信 | 禁止传 |
| 平台管理员密码、JWT、密钥 | 禁止传 |

## 数据模型

新增迁移建议：`038_ai_business_assistant.sql`

### `ai_prompt_versions`

| 字段 | 说明 |
| --- | --- |
| `id` | 提示词版本 |
| `scene` | `daily_report` / `product_diagnosis` / `after_sale_risk` / `buyer_segments` / `campaign_copy` |
| `version` | 版本号 |
| `prompt_text` | 中文提示词 |
| `schema_json` | 输出 JSON Schema |
| `status` | `draft` / `active` |

### `ai_insight_reports`

| 字段 | 说明 |
| --- | --- |
| `id` | 报告 ID |
| `circle_id` | 圈子 |
| `scene` | 场景 |
| `model` | 模型 |
| `prompt_version_id` | 提示词版本 |
| `input_digest_json` | 输入摘要，不存敏感明文 |
| `output_json` | 结构化输出 |
| `status` | `generated` / `accepted` / `dismissed` / `failed` |
| `created_by_admin_id` | 触发账号 |
| `created_at` | 时间 |

### `ai_action_confirmations`

| 字段 | 说明 |
| --- | --- |
| `id` | 确认记录 |
| `report_id` | AI 报告 |
| `suggested_action` | 建议动作 |
| `confirmed_by_admin_id` | 确认人 |
| `result_action_id` | 实际业务动作 ID |
| `created_at` | 时间 |

## 后端接口

| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/api/admin/tenant/ai/reports/daily` | POST | 生成经营日报 |
| `/api/admin/tenant/ai/products/:id/diagnosis` | POST | 商品诊断 |
| `/api/admin/tenant/ai/after-sales/risk` | POST | 售后风险分析 |
| `/api/admin/tenant/ai/buyer-segments` | POST | 买家分层 |
| `/api/admin/tenant/ai/campaign-copy` | POST | 活动文案候选 |
| `/api/admin/tenant/ai/reports` | GET | 历史报告 |
| `/api/admin/tenant/ai/reports/:id/confirm` | POST | 人工确认某个建议动作 |

## 输出结构

经营日报示例字段：

| 字段 | 说明 |
| --- | --- |
| `summary` | 100 字以内经营总结 |
| `metrics` | 订单、收入、转化、售后汇总 |
| `risks` | 风险列表，含等级和理由 |
| `actions` | 可执行建议，必须要求人工确认 |
| `confidence` | 置信度，低置信时提示人工复核 |

商品诊断示例字段：

| 字段 | 说明 |
| --- | --- |
| `title_score` | 标题评分 |
| `price_opinion` | 价格建议 |
| `description_suggestions` | 简介优化建议 |
| `conversion_blocks` | 转化阻碍 |
| `safe_copy_candidates` | 可直接复制的候选文案 |

## 成本和限流

1. 按租户套餐限制每日 AI 次数。
2. 同一商品 24 小时内重复诊断命中缓存。
3. 长文本先本地摘要，再发模型。
4. 失败自动降级为“暂无 AI 结果，请稍后重试”，不影响交易。
5. 平台后台可查看 AI 调用量和失败率。

## 前端页面

| 页面 | 路由 | 说明 |
| --- | --- | --- |
| AI 经营助手 | `/tenant/ai` | 入口和历史报告 |
| 经营日报 | `/tenant/ai/daily` | 生成和查看日报 |
| 商品诊断 | `/tenant/resources` 内操作 | 商品行操作触发 |
| 售后风险 | `/tenant/orders?tab=after-sales` | 售后列表侧边分析 |
| 活动文案 | `/tenant/operations/campaigns` | 生成候选文案 |

## 安全和审计

1. 每次 AI 生成写 `ai_insight_reports`。
2. 所有建议动作必须人工确认，确认后走原业务接口。
3. AI 输出展示“生成时间、数据范围、模型、置信度”。
4. 低置信、涉及资金、涉及封禁的建议只显示，不提供一键执行。
5. 提示词版本变更必须可回滚。

## 验收

1. 圈主能生成经营日报，并看到数据范围和建议。
2. 商品诊断不泄露交付内容和卡密明文。
3. 售后风险只作为参考，不自动退款、不自动封禁。
4. 活动文案生成后需人工复制或确认，不能自动发布。
5. AI 调用失败不影响商品、订单、支付、售后主流程。

## 验证命令

```powershell
node --check src/lib/aiBusinessAssistant.js
node --check src/routes/admin/tenantAi.routes.js
npm run migrate
git diff --check
```

前端：

```powershell
pnpm typecheck
pnpm build
git diff --check
```

## 回滚方案

1. 配置关闭 AI 菜单和接口，交易主链路不受影响。
2. 提示词异常：切回上一版 `ai_prompt_versions.status='active'`。
3. 成本异常：降低每日次数、关闭长文本场景。
4. 输出异常：撤回展示入口，保留历史审计。

## 待用户提供参数

| 参数 | 填写指导 |
| --- | --- |
| `OPENAI_API_KEY` | 生产密钥，放服务器环境变量，不写入仓库 |
| `AI_DEFAULT_MODEL` | P5 开发前按官方模型文档确认，建议按“高质量/低成本”分层 |
| `AI_DAILY_LIMIT_BASIC` | 入门版每日次数，建议 3-5 次 |
| `AI_DAILY_LIMIT_PRO` | 专业版每日次数，建议 30 次 |
| 数据保留周期 | 建议 AI 输入摘要保留 90 天，输出报告按租户可长期查看 |
