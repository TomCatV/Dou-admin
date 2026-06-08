# 圈子上下文治理筛选与跳转设计

## 目标

优化平台治理后台的圈子上下文查看效率：

1. `用户管理` 支持下拉选择圈子，查看某个圈子下的成员用户。
2. `资源卡治理` 支持下拉选择圈子，查看某个圈子下的资源卡。
3. `圈子管理` 列表和详情中支持跳转到对应圈子的 `用户管理` 和 `资源卡治理`。
4. 从圈子管理跳转时自动带入 `circle_id` 查询条件，减少手工复制圈子 ID。

## 本次范围

### 做

1. Dou-Server：
   - `GET /api/admin/users` 增加 `circle_id` / `circleId` 过滤。
   - 复用现有 `adminCanAccessCircleId()` 做后端权限校验。
   - 保持 `tenant_owner` 多圈子范围与单圈子账号范围不越权。
2. Dou-Admin：
   - 用户管理页新增远程圈子下拉筛选。
   - 资源卡治理页把手填圈子 ID 改成远程圈子下拉筛选。
   - 圈子管理页新增跳转按钮，分别进入对应圈子的用户管理和资源卡治理。
   - 支持从路由 query 读取 `circle_id` 并自动查询。

### 不做

1. 不新增数据库迁移。
2. 不改变用户、圈子、资源卡治理写操作权限。
3. 不改小程序端。
4. 不把圈主经营后台的资源卡管理和平台资源卡治理合并。

## 权限与隔离

1. 平台全局账号可选择任意圈子筛选。
2. 圈主主账号只能选择和访问自己名下活跃圈子。
3. 单圈子 staff / viewer 只能访问授权圈子。
4. 前端只做体验层过滤，真实范围必须由 Dou-Server 校验。
5. 用户管理按圈过滤时返回该圈 `circle_members` 中的用户，并补充该用户在当前圈子的角色与加入时间。

## API 设计

### 用户管理列表

`GET /api/admin/users`

新增查询参数：

- `circle_id`：可选，指定要查看的圈子。
- `circleId`：兼容 camelCase。

行为：

1. 有 `circle_id` 时，先调用 `adminCanAccessCircleId(db, req.admin, circle_id)`。
2. 无权限返回 `40303`。
3. 有权限时从 `circle_members` 连接 `users` 列表，避免同一用户重复。
4. 无 `circle_id` 时保持原有按管理员范围返回。

### 圈子下拉

`GET /api/admin/circles/options`

查询参数：

- `keyword` / `q`：可选，按圈子名、圈号、圈子 ID、圈主昵称或圈主抖小圈号搜索。
- `page_size` / `pageSize`：可选，默认 20，最大 50。

权限：

1. 拥有 `circle:view`、`circle:member:view`、`user:view`、`resource_card:view` 任一权限即可拉取下拉选项。
2. 平台全局账号返回可搜索的全量圈子。
3. 圈主主账号只返回本人名下圈子。
4. 单圈子账号只返回授权圈子。

返回字段：

- `id`
- `name`
- `circle_code`
- `owner_user_id`
- `owner_nickname`
- `owner_dxq_id`
- `status`
- `member_count`

## 前端设计

### 用户管理

1. 筛选区新增“选择圈子”远程下拉。
2. 下拉展示：圈子名、圈号或 ID、圈主昵称。
3. 选中后设置 `filters.circle_id` 并重置页码为 1。
4. 路由 query 中带 `circle_id` 时，进入页面自动带入并查询。
5. 重置时清空圈子筛选。

### 资源卡治理

1. 原手填 `圈子ID` 改成“选择圈子”远程下拉。
2. 支持路由 query 中的 `circle_id` 自动带入。
3. 保留平台治理页定位：审核、下架、禁用和 H5 验收。

### 圈子管理

1. 列表操作新增：
   - `看用户`
   - `看资源`
2. 圈子详情抽屉中也提供同样跳转入口。
3. 跳转目标：
   - `/users?circle_id=<circleId>`
   - `/resource-cards?circle_id=<circleId>`

## 验证清单

1. Dou-Server：
   - `node --check src/routes/admin/users.routes.js`
   - `node --check src/routes/admin/circles.routes.js`
   - `node --check src/routes/admin/resourceCards.routes.js`
2. Dou-Admin：
   - `corepack pnpm typecheck`
   - `corepack pnpm build`
3. 通用：
   - 双仓 `git diff --check`
   - 改动文件 UTF-8 扫描无 `U+FFFD`

## 风险与回滚

1. 本轮不新增迁移，回滚代码提交即可恢复旧筛选行为。
2. 若圈子下拉异常，可临时隐藏前端下拉，后端 `circle_id` 参数仍保持兼容。
3. 若权限边界异常，优先回滚后端 `circle_id` 过滤逻辑，平台全局关键治理能力不受影响。
