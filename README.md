# Temple OS

寺院业务管理系统，当前采用“单客户独立服务器部署”模式：一个客户对应一台服务器、一套数据库、一套配置和一套文件存储。

## Tech Stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js 16, React 18, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, Prisma |
| Database | PostgreSQL 15 |
| Print Tool | Node.js, Express, browser-side print/template UI |
| Gateway | Nginx |
| Deploy | Docker, systemd, GitHub Actions, package upload |

## Main Directories

```text
backend/          API service and Prisma schema
frontend/         Public site and admin panel
print-service/    Current web print/template tool
desktop-app/      Electron local client
wechat-platform/  Central WeChat official-account platform skeleton
docker/           Compose, Nginx example, env template
docs/             Project documentation
img/              Source images
scripts/          Local release tools
```

## Important Docs

```text
docs/PROJECT_OVERVIEW.md          Full project overview
docs/MODULE_MAP.md                Module map
docs/MAINTENANCE_AUDIT.md         Risks and cleanup plan
docs/LOCAL_WORKFLOW.md            Local development and release workflow
docs/single-server-deployment.md  Single-customer server deployment
docs/desktop-printing-plan.md     Desktop app and local printing direction
docs/git-auto-deploy.md           GitHub Actions deployment
docs/project-operations.md        Production operations notes
docs/wechat-platform-plan.md      WeChat center platform and customer server integration
```

## Runtime

```text
Nginx
  /           -> frontend:3000
  /api/       -> backend:3002
  /print-api/ -> print-service:3001, protected by backend auth
```

Production server path:

```text
/opt/temple-os
```

Local working path:

```text
C:\Users\28557\Documents\New project\temple-os
```

## Development

One-click desktop start on Windows:

```powershell
.\start-desktop.bat
```

Backend:

```bash
cd backend
npm ci
npx prisma generate
npm run build
npm test
```

Frontend:

```bash
cd frontend
npm ci
npm run build
```

Print service:

```bash
cd print-service
npm ci
node --check index.js
node --check public/app.js
```

Desktop app:

```bash
cd desktop-app
npm install
npm run check
npm start
```

WeChat platform skeleton:

```bash
cd wechat-platform
npm install
npm run check
npm start
```

The WeChat platform service is a center service for multi-official-account authorization, message intake, article draft/publish, and template-message dispatch. Customer servers use `WECHAT_PLATFORM_BASE_URL` and `WECHAT_PLATFORM_API_TOKEN` to call it.

## Release Package

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\make-release.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\check-release.ps1 -ZipPath .\releases\<release>.zip
```

Release packages must not contain real `.env` files, dependencies, build output, backups, logs, or runtime directories.

## License

Private - All Rights Reserved
