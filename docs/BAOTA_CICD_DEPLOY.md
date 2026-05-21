# Dou-Admin 宝塔自动部署说明

## 目标

`Dou-Admin` 是纯前端静态项目，线上站点根目录为：

```text
/www/wwwroot/Dou-admin/dist
```

提交推送到 GitHub 后，可以让宝塔 WebHook 在服务器上自动执行：

```bash
cd /www/wwwroot/Dou-admin
bash scripts/deploy-baota.sh
```

脚本会完成：

1. 拉取 `main` 最新代码。
2. 安装依赖。
3. 执行 `pnpm build`。
4. 生成新的 `dist`，Nginx 静态站点自动读取新文件。

后台前端不需要重启 Node 项目。

## 服务器准备

确认服务器目录已经是 Git 仓库：

```bash
cd /www/wwwroot/Dou-admin
git remote -v
git branch
```

如果还没有克隆：

```bash
cd /www/wwwroot
git clone https://github.com/TomCatV/Dou-admin.git Dou-admin
cd /www/wwwroot/Dou-admin
```

确认 Node 版本建议为 20+：

```bash
node -v
```

首次手动跑一次：

```bash
cd /www/wwwroot/Dou-admin
bash scripts/deploy-baota.sh
```

成功后应看到：

```text
dou-admin deploy success
```

## 宝塔 WebHook 配置

在宝塔面板安装或打开 WebHook 插件，新建 Hook：

```bash
cd /www/wwwroot/Dou-admin && bash scripts/deploy-baota.sh
```

保存后宝塔会生成一个 WebHook URL。

## GitHub 配置

进入 GitHub 仓库：

```text
TomCatV/Dou-admin
```

路径：

```text
Settings -> Webhooks -> Add webhook
```

建议配置：

| 项 | 值 |
| --- | --- |
| Payload URL | 宝塔生成的 WebHook URL |
| Content type | `application/json` |
| Secret | 可留空；如果宝塔 WebHook 插件支持密钥，填同一个密钥 |
| SSL verification | Enable SSL verification |
| Which events | Just the push event |
| Active | 勾选 |

之后每次本地推送：

```bash
git push origin main
```

GitHub 会通知宝塔，宝塔执行部署脚本。

## 查看日志

部署日志默认写入：

```text
/www/wwwlogs/dou-admin-deploy.log
```

查看最近日志：

```bash
tail -n 120 /www/wwwlogs/dou-admin-deploy.log
```

## 常见问题

### 1. 代码拉取失败

如果服务器无法用 SSH 拉取，改用 HTTPS：

```bash
cd /www/wwwroot/Dou-admin
git remote set-url origin https://github.com/TomCatV/Dou-admin.git
```

### 2. pnpm 不存在

部署脚本会优先用 `corepack`，如果没有 `pnpm` 会自动安装：

```bash
npm install -g pnpm@10.8.1
```

### 3. 构建时报 `dist/.user.ini`

宝塔可能会在站点目录生成 `.user.ini`。如果旧构建目录里存在 `dist/.user.ini`，直接删除 `dist` 可能报：

```text
ENOTDIR: not a directory, scandir '/www/wwwroot/Dou-admin/dist/.user.ini'
```

当前仓库的 `pnpm build` 已改为先执行：

```bash
node scripts/clean-dist.mjs
```

它会在 Linux 上尝试解除 `.user.ini` 的不可变属性，再删除旧 `dist`。

如果线上已经卡住，先拉取最新代码后重跑：

```bash
cd /www/wwwroot/Dou-admin
git pull origin main
pnpm build
```

如仍失败，可手动处理一次：

```bash
cd /www/wwwroot/Dou-admin
chattr -i dist/.user.ini 2>/dev/null || true
rm -rf dist
pnpm build
```

### 4. 构建成功但页面还是旧的

检查 Nginx 站点根目录是否仍是：

```text
/www/wwwroot/Dou-admin/dist
```

并清理浏览器缓存或强制刷新。

### 5. API 请求失败

确认 Nginx 反代仍包含：

```nginx
location /api/admin/ {
  proxy_pass http://127.0.0.1:3001/api/admin/;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

并确认 Dou-Server 正在运行。

## 回滚

查看历史提交：

```bash
cd /www/wwwroot/Dou-admin
git log --oneline -5
```

临时回滚到某个提交：

```bash
git checkout <commit>
pnpm build
```

确认恢复后，再决定是否在本地仓库创建正式回滚提交。
