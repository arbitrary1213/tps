# P1 Maintenance Plan

基于 `docs/MAINTENANCE_AUDIT.md`（2026-05-12）及项目现状。

---

## 已完成 ✅

### P1-#3: shared.js 拆分
- `frontend/public/print-api/shared.js`（5378 行）→ 6 文件
- 3 个 HTML 文件已更新，`node --check` 全部通过
- 原文件已备份为 `shared.js.bak`

### P1-#4: api.ts 类型化
- `npx tsc --noEmit` 零错误
- 9 个管理页面类型修复

---

## 待完成

### P1-#1: 配置安全

**目标**: 确保 Git 和发布包不泄露真实 `.env`

**步骤**:
1. 检查 `git ls-files` 是否包含 `.env`
2. 确认 `.gitignore` 有 `.env` 规则
3. 运行 `scripts/make-release.ps1` 后检查 zip 中无 `.env`

**QA**:
```powershell
# 1. 确认 git 跟踪状态
git ls-files '*.env'           # 预期：空（仅 .example 允许）
git ls-files backend/.env      # 预期：空
git ls-files docker/.env       # 预期：空

# 2. 确认 .gitignore 覆盖
Select-String '.env' .gitignore  # 预期：存在 .env 排除规则

# 3. 检查发布包
powershell -File .\scripts\make-release.ps1
# 然后检查 releases/*.zip 是否包含 .env 文件
```

---

### P1-#2: 编码修复

**目标**: 检查并修复源码中乱码的中文文案

**实际涉及文件**（MAINTENANCE_AUDIT.md 中的 `AdminNav.tsx` 不存在，导航在 layout.tsx 中）:
- `frontend/src/lib/api.ts` — API client 注释
- `frontend/src/app/admin/layout.tsx` — 侧边导航菜单文案（替代旧的 AdminNav.tsx）
- `backend/src/middleware/auth.ts` — 认证中间件注释
- `docker/nginx.conf` — Nginx 配置注释

**QA**:
```powershell
# 1. 扫描可能的乱码特征
Get-Content frontend/src/lib/api.ts -Encoding UTF8 | Select-String '\?{3,}|[□■]|Ã©|ç|¨'
Get-Content frontend/src/app/admin/layout.tsx -Encoding UTF8 | Select-String '\?{3,}|[□■]|Ã©|ç|¨'
Get-Content backend/src/middleware/auth.ts -Encoding UTF8 | Select-String '\?{3,}|[□■]|Ã©|ç|¨'
Get-Content docker/nginx.conf -Encoding UTF8 | Select-String '\?{3,}|[□■]|Ã©|ç|¨'

# 2. 构建验证
cd frontend; npm run build   # 预期：成功
cd backend; npm run build    # 预期：成功

# 3. 页面验证：启动前端，检查管理后台导航菜单文字正常
```

---

### P1-#5: 部署方式统一 ✅

**结论**: deploy.sh 和 docker-compose.yml **已经是统一的** — 全栈 Docker Compose。

**实际情况**:
- `deploy.sh` 已有 systemd→Docker 迁移逻辑（lines 126-141），主动停止 systemd 服务
- `docker-compose.yml` 定义 5 个服务：temple-db, temple-backend, temple-frontend, temple-print, temple-nginx
- 所有服务均通过 `deploy.sh` 编排，无 systemd 残留

**修复**: 仅更新了过时文档：
- `docs/single-server-deployment.md` — "systemd + Next standalone" → "Docker 容器"
- `docs/git-auto-deploy.md` — 移除 systemd 引用，更新为全 Docker Compose

**QA**:
- `bash syntax check` — Windows 环境无法运行 bash，deploy.sh 已人工审查，结构正确
- Docker Compose 一致性 — ✅ 5 个服务定义完整，deploy.sh 编排逻辑一致
- 文档一致性 — ✅ 已更新

---

### P1-#6: 测试验证

**目标**: 跑通所有现有测试和检查命令

| 模块 | 命令 | QA 预期 |
|---|---|---|
| Backend 构建 | `cd backend; npx tsc --noEmit` | 退出码 0 |
| Backend 测试 | `cd backend; npx vitest run` | 全部 pass（7 files, 64 tests） |
| Frontend 构建 | `cd frontend; npm run build` | 退出码 0 |
| Frontend 类型检查 | `cd frontend; npx tsc --noEmit` | 退出码 0 |
| ~~Frontend lint~~ | ~~`cd frontend; npm run lint`~~ | **N/A — Next.js 16 已移除 `next lint`** |
| Desktop-app 检查 | `cd desktop-app; npm run check` | 退出码 0 |
| Print-service 检查 | `cd print-service; node --check index.js` | 退出码 0 |
| 部署合约测试 | `node scripts/deploy-contract.test.cjs` | 退出码 0 |

---

### P1-#7: README 更新 ✅

**发现**: README 实际上已基本准确。

**实际验证**:
- README 不包含 "Puppeteer" 或 "Next.js 14" — MAINTENANCE_AUDIT 中此担忧已不适用
- print-service package.json: 仅 `express` + `pdfjs-dist`（无 Puppeteer）✅
- frontend package.json: `next: ^16.2.4`（非 14）✅

**修复**: 
- 移除 README 中 `node --check public/app.js` 命令（`print-service` 不持有自己的 public/app.js，实际复用 frontend 的静态文件）
- 添加说明注释解释 print-service 如何 serve 前端资源

**QA**:
- `(Get-Content frontend/package.json \| ConvertFrom-Json).dependencies.next` → `^16.2.4` ✅
- `(Get-Content print-service/package.json \| ConvertFrom-Json).dependencies` → `{express, pdfjs-dist}` 无 Puppeteer ✅

---

## P2 待定（后续）

1. 拆分 `backend/src/routes/business.ts`（1600+ 行 → 按业务域拆）
2. 打印任务模型收敛（PrintClient / PrintJob / PrintJobItem）

---

## 执行顺序

```
P1-#1 配置安全 → P1-#6 测试验证 → P1-#2 编码修复 → P1-#5 部署统一 → P1-#7 README
```

P1-#6 尽早跑 — 测试结果影响后续修改安全性。
P1-#1 放最前 — 立即可验证，零风险。
