# Maintenance Audit

更新时间：2026-05-12

本文记录当前项目维护风险、建议处理顺序和验收标准。

## P0: Must Not Break

- 不覆盖生产服务器真实 `.env`。
- 不删除 Docker volume 或数据库备份。
- 不让本地软件直连 PostgreSQL。
- 不把 `node_modules/`、`.next/`、`backup/`、`frontend-deploy/`、`frontend-runtime/` 放回正式工作区。
- 不在未备份数据库前运行破坏性数据库操作。

## P1: Immediate Cleanup

1. 配置安全
   - 目标：Git 中不再跟踪真实 `backend/.env` 和 `docker/.env`。
   - 当前：本地正式目录已删除真实 `.env`，只保留 `docker/.env.example`。
   - 验收：发布包和 Git diff 不包含真实密钥。

2. 编码修复
   - 目标：修复本地源码中已乱码的中文 UI 文案和注释。
   - 涉及：`frontend/src/lib/api.ts`、`frontend/src/components/AdminNav.tsx`、`backend/src/middleware/auth.ts`、`docker/nginx.conf` 等。
   - 验收：页面菜单、错误提示、Nginx 注释显示正常；构建通过。

3. 部署方式统一
   - 目标：确认生产前端到底使用 systemd 还是 Docker Compose，只保留一种主路径。
   - 当前：生产前端是 systemd，compose 中仍有 frontend 服务定义。
   - 建议：短期保留 systemd；文档明确；后续再决定是否全 Docker 化。

4. README 更新
   - 目标：README 与当前真实技术栈一致。
   - 当前：README 写 Next.js 14 / Puppeteer，但实际是 Next.js 16 / print-service 无 Puppeteer。

## P2: Structural Refactor

1. 拆分 `backend/src/routes/business.ts`
   - 当前该文件超过 1600 行，包含人员、牌位、打印、法会、后勤、用户、日志、导入等大量逻辑。
   - 建议按业务域拆分：people、plaques、printing、rituals、logistics、users、imports。
   - 验收：路由行为不变，测试覆盖关键模块。

2. 打印任务模型收敛
   - 当前已经有 `PrintClient`、`PrintJob`、`PrintJobItem` 和 local-print API 雏形。
   - 建议以“本地客户端领取任务并回传状态”为最终模型。
   - 验收：服务器不直接控制客户打印机。

3. 前端 API 类型化
   - 当前 `frontend/src/lib/api.ts` 大量 `any`。
   - 建议先给核心模块加类型：登录、牌位、模板、打印任务、登记。
   - 验收：核心页面减少运行时字段错配。

## P3: Product/Delivery Improvements

- 增加“系统设置导出/导入”，方便复制新客户服务器。
- 增加版本号展示和部署记录。
- 增加备份恢复演练文档。
- 增加桌面端连接配置文档。
- 增加生产健康检查脚本。

## Current Verification Commands

后端：

```bash
cd backend
npm ci
npm run build
npm test
```

前端：

```bash
cd frontend
npm ci
npm run build
```

打印服务：

```bash
cd print-service
npm ci
node --check index.js
node --check public/app.js
```

发布包：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\make-release.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\check-release.ps1 -ZipPath <zip>
```

