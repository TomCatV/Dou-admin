# CODEX 续航状态（Dou-Admin）

最后更新时间：2026-05-21 18:57 (Asia/Shanghai)

## 仓库定位

`Dou-Admin` 是 Dou 平台 PC 管理后台前端仓库，基于 Vue 3 + Vite + TypeScript + Element Plus + pure-admin-thin。

## 当前状态

- 主分支：`main`
- 远程：`origin/main`
- 最近提交：
  - `47f1fd0 fix: 兼容宝塔构建目录清理`
  - `40de8eb chore: 增加后台前端自动部署脚本`
  - `f5ffc7e feat: 增加后台账号权限页面`
  - `4624202 feat: 初始化 Dou 管理后台`
- 已完成页面：
  - 登录页
  - 工作台
  - 举报处理
  - 操作日志
  - 账号与权限
  - 修改密码
- 部署脚本：
  - `scripts/deploy-baota.sh`
  - `scripts/clean-dist.mjs`
- 部署说明：
  - `docs/BAOTA_CICD_DEPLOY.md`

## 续航规则

- 以后涉及本仓后台前端改动时，优先读取并更新本文件。
- 阶段性完成后同步更新 `docs/CODEX_TASK_LEDGER.md`。
- 续航文档放在本仓 `docs/` 内，并随本仓代码一起提交推送。
- 不再只写外层 `Dou-Circle/docs` 作为唯一续航来源。

## 下一步

1. 服务器执行 `git pull origin main && pnpm build`，确认 `.user.ini` 清理修复生效。
2. 配置宝塔 WebHook：`cd /www/wwwroot/Dou-admin && bash scripts/deploy-baota.sh`。
3. 在 GitHub `TomCatV/Dou-admin` 配置 push webhook。
4. 回归 `admin.doucatapp.top` 登录、账号权限、改密、举报列表和操作日志。
