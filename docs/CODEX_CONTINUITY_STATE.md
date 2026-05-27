# CODEX 续航状态（Dou-Admin）

最后更新时间：2026-05-28 00:00 (Asia/Shanghai)

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

## 续航规则

- 后续涉及本仓后台前端改动时，优先读取并更新本文档。
- 阶段性完成后同步更新 `docs/CODEX_TASK_LEDGER.md`。
- 与 `Dou-Server` 协同改动时，前后端完成验证后都要提交并推送远程。
- 续航文档放在本仓 `docs/` 内，并随本仓代码一起提交推送。
- 不再只写外层 `Dou-Circle/docs` 作为唯一续航来源。

## 下一步

1. 在线部署前先部署 `Dou-Server` 最新代码，并执行迁移 `025_admin_console_base.sql`、`026_admin_accounts_permissions.sql`、`027_admin_finance_reviews.sql`。
2. 使用开发默认后台账号 `admin / Admin@123456` 首次登录后立刻修改密码；生产可通过 `ADMIN_BOOTSTRAP_USERNAME`、`ADMIN_BOOTSTRAP_PASSWORD` 覆盖首次种子账号。
3. 真机/线上联调微信退款、微信商家转账、提现撤销等资金动作。
4. 按 `docs/COMMERCIAL_MULTI_TENANT_ADMIN.md` 分阶段推进多租户、圈主后台、套餐计费和私域转化能力。
