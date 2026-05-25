# Security & Deep Audit Fix Plan

基于 2026-05-24 深度安全审计和架构一致性审计。

---

## P0: CRITICAL — 立即修复

### P0-#1: SSRF 代理路由修复

**问题**: 3 条 Next.js API 代理路由接受 `x-temple-api-base` header 指定任意后端 URL，可被利用访问内部网络资源。

**涉及文件**:
- `frontend/src/app/api/[...path]/route.ts`
- `frontend/src/app/search/[...path]/route.ts`
- `frontend/src/app/export/[...path]/route.ts`

**修复方案**: 添加后端 URL 白名单校验，拒绝非白名单 URL。

**QA**:
```powershell
# 验证白名单外 URL 被拒绝
curl -H "x-temple-api-base: http://169.254.169.254" http://localhost:3000/api/test | Select-String "invalid"
# 验证正常 URL 可通过
curl -H "x-temple-api-base: https://temple.example.com" http://localhost:3000/api/test
```

---

### P0-#2: PII 调试日志移除

**问题**: `console.log("[DEBUG] body:", JSON.stringify(req.body))` 打印完整注册表单数据到 stdout，包含姓名、电话、地址。

**涉及文件**: `backend/src/routes/registration.ts:319`

**修复方案**: 删除该调试日志行。

**QA**:
```powershell
# 确认该行不再存在
Select-String "\[DEBUG\] body" backend/src/routes/registration.ts
# 预期：无匹配
```

---

### P0-#3: 硬编码管理员密码移除

**问题**: `adminPassword = 'admin123'` 硬编码在数据库初始化脚本中。

**涉及文件**: `backend/scripts/init-db.js:14`

**修复方案**: 改为从环境变量 `INIT_ADMIN_PASSWORD` 读取，若未设置则生成随机密码并打印。

**QA**:
```powershell
# 语法检查
node --check backend/scripts/init-db.js
# 确认不再硬编码
Select-String "admin123" backend/scripts/init-db.js
# 预期：无匹配
```

---

## P1: HIGH — 本周修复

### P1-#1: CSRF 防护

**问题**: 整个后端无 CSRF 保护。

**涉及文件**: `backend/src/index.ts`, `backend/src/routes/auth.ts`

**修复方案**:
1. 安装 `csurf` 或实现 double-submit cookie 模式
2. `SameSite` 改为 `strict`
3. Cookie 名加 `__Host-` 前缀

**QA**:
```powershell
cd backend; npm test
# 确认 auth 相关测试仍通过
```

---

### P1-#2: Helmet 安全头

**问题**: Express 后端无安全头中间件。

**涉及文件**: `backend/src/index.ts`, `backend/package.json`

**修复方案**:
1. 安装 `helmet`
2. `app.use(helmet())` 在路由之前

**QA**:
```powershell
# 启动后端后检查响应头
curl -I http://localhost:3002/api/health 2>&1 | Select-String "X-Content-Type-Options|X-Frame-Options|Content-Security-Policy"
```

---

### P1-#3: JSON body 限制 & 限流收紧

**问题**: 80MB JSON body 限制过高 + 全局限流 300 req/min。

**涉及文件**:
- `backend/src/index.ts:15` — 80MB limit
- `backend/src/middleware/rateLimiter.ts:11` — 300 req/min

**修复方案**:
1. JSON body 降至 10MB
2. 全局限流收紧至 100 req/min
3. 为 `/api/auth/login` 和 `/api/registration/requests` 添加专用限流

**QA**:
```powershell
cd backend; npm test
```

---

### P1-#4: 测试密钥隔离

**问题**: `JWT_SECRET='test-secret-key...'` 在 vitest.setup.ts 中，虽然是测试文件但和源码在同一目录。

**涉及文件**: `backend/vitest.setup.ts`

**修复方案**: 使用 `vitest.setup.ts` 内联设置或统一测试配置，标记 `/* test-only */`。

**QA**:
```powershell
cd backend; npm test
# 确认 7 files, 64 tests 通过
```

---

## P2: MEDIUM — 两周内修复

### P2-#1: 密码策略强化

**问题**: 密码最低 6 字符无复杂度要求。

**涉及文件**: `backend/src/routes/auth.ts:144, 222`, `backend/src/routes/business/systemAdmin.ts:23`

**修复方案**:
1. 最低 8 字符
2. 至少包含大小写字母 + 数字
3. 添加密码强度校验

**QA**:
```powershell
cd backend; npm test
```

---

### P2-#2: 变更端点输入校验（11 个端点）

**问题**: 大量 `POST/PUT` 端点将 `req.body` 直接传给 Prisma，无类型校验。

**涉及文件**:
- `backend/src/routes/business/people.ts` — volunteer create/update
- `backend/src/routes/business/systemAdmin.ts` — user create, role 无校验
- `backend/src/routes/business/plaquesPrinting.ts` — template create, plaque create/update
- `backend/src/routes/business/logistics.ts` — room, warehouse 等
- `backend/src/routes/business/rituals.ts` — ritual create/update
- `backend/src/routes/calendarEvents.ts`

**修复方案**: 为核心端点（用户创建、角色修改、牌位创建）添加 Zod schema 校验。

**QA**:
```powershell
cd backend; npm test; npx tsc --noEmit
```

---

### P2-#3: PDF 上传 MIME 校验

**问题**: 模板素材上传仅校验文件扩展名（`.pdf`），不验证实际 MIME 类型。

**涉及文件**: `backend/src/routes/business/plaquesPrinting.ts:747-749`

**修复方案**: 同时校验 `req.file.mimetype === 'application/pdf'`。

**QA**:
```powershell
cd backend; npm test
```

---

## P3: DOCS — 架构一致性修复

### P3-#1: MODULE_MAP.md 清理 → 删除

**问题**: 包含 8 个不存在的文件引用，整体严重过时。

**涉及文件**: `docs/MODULE_MAP.md`

**建议**: 该文件已无维护价值，建议删除。其核心信息已分散到 `PROJECT_OVERVIEW.md` 和 `single-server-deployment.md`。

---

### P3-#2: PROJECT_OVERVIEW.md 更新

**问题**: `business.ts` 仍描述为 ~1600 行 monolith，实际已拆分。

**涉及文件**: `docs/PROJECT_OVERVIEW.md` 第 77 行

**修复方案**: 更新路由挂载表，反映 `business/` 子模块拆分现状。

---

### P3-#3: frontend-architecture.md 更新

**问题**: authStore API 文档错误：
- `user.userId` → `user.id`
- `login() / setUser()` → `setAuth(user, token)`
- `persist(localStorage)` → 手动 localStorage

**涉及文件**: `docs/frontend-architecture.md` 第 270-274 行

---

### P3-#4: LOCAL_PROJECT_MAP.md 标记清理

**问题**: 包含已标记 `[已删除]` 但仍保留的条目（`Admin.tsx`）。

**涉及文件**: `docs/LOCAL_PROJECT_MAP.md`

**修复方案**: 移除已删除条目，清理过时引用。

---

### P3-#5: 部署文档统一

**问题**: `single-server-deployment.md` 与 `project-operations.md` 关于前端运行时矛盾。

**实际基线**: `deploy.sh` 用 Docker Compose 管全部 5 个服务，含 systemd→Docker 迁移逻辑。

**涉及文件**:
- `docs/single-server-deployment.md`
- `docs/project-operations.md`

**修复方案**: 统一为 "全栈 Docker Compose"（与 deploy.sh 一致），reference `deploy.sh` 为权威入口。

---

## 执行顺序

```
P0-#1 SSRF → P0-#2 PII → P0-#3 硬编码密码
  → P1-#1 CSRF → P1-#2 Helmet → P1-#3 body/限流 → P1-#4 测试密钥
    → P2-#1 密码策略 → P2-#2 输入校验 → P2-#3 MIME 校验
      → P3-#1~5 文档修复
```

P0 一天内必须完成。P1 本周。P2 两周。P3 可与 P1/P2 并行或后续。

---

## 大文件拆分（P4 — 后续）

| # | 文件 | 行数 | 建议 |
|---|------|------|------|
| 1 | `frontend/public/print-api/shared.js` | 4963 | 评估是否可删除（已有 6 文件拆分版，.bak 和 .js 同时存在） |
| 2 | `frontend/public/print-api/shared-layout.js` | 1907 | 继续拆分为更细粒度模块 |
| 3 | `frontend/src/app/admin/plaques/page.tsx` | 1652 | 拆分为 plaquest-list / plaque-form / batch-operaions |
| 4 | `desktop-app/src/renderer.js` | 1287 | 拆分为 renderer-ui / renderer-ipc / renderer-printer |
| 5 | `backend/src/routes/business/plaquesPrinting.ts` | 957 | 拆分为 plaques / printing / templates |

---

## 验收标准

1. `cd backend; npm test` — 全部 64+ tests 通过
2. `cd backend; npx tsc --noEmit` — 零错误
3. `cd frontend; npx tsc --noEmit` — 零错误
4. `cd frontend; npm run build` — 退出码 0
5. `cd desktop-app; npm run check` — 退出码 0
6. `node --check print-service/index.js` — 退出码 0
7. P0 修复后：SSRF 攻击向量消除、无 PII 日志、无硬编码密码
8. P1 修复后：安全头可见、CSRF token 机制就位、限流合理
9. P3 修复后：`Select-String` 搜索 8 个不存在文件引用 — 预期全部零匹配
