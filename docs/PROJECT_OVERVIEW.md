# Temple OS Project Overview

更新时间：2026-05-12

本项目当前定位为“单客户独立服务器部署”的寺院业务管理系统。一个客户对应一台服务器、一套数据库、一套配置和一套文件存储。本地桌面软件后续通过 HTTPS API 读取服务器数据并在本地打印，不直接连接数据库。

## 1. 总体结构

```text
temple-os/
├─ backend/          Express + Prisma API
├─ frontend/         Next.js public site and admin panel
├─ print-service/    Current web print/template tool
├─ docker/           Compose, Nginx example, env template
├─ docs/             Project documentation
├─ img/              Source image assets
├─ scripts/          Local release/check tools
├─ deploy.sh         Production deploy script
└─ setup.sh          Initial setup script
```

本地正式开发目录：

```text
C:\Users\28557\Documents\New project\temple-os
```

生产服务器目录：

```text
/opt/temple-os
```

## 2. Runtime Architecture

```text
Browser / Mobile
      |
      v
Nginx HTTPS
      |
      +-- /           -> frontend:3000
      +-- /api/       -> backend:3002
      +-- /print-api/ -> print-service:3001, protected by /api/auth/me
```

服务职责：

| Service | Runtime | Role |
| --- | --- | --- |
| `temple-db` | PostgreSQL 15 | Main database |
| `temple-backend` | Docker + Node.js | API, auth, business logic, Prisma |
| `temple-frontend` | systemd + Next standalone on production | Public site and admin panel |
| `temple-print` | Docker + Node.js | Current web template/print tool |

注意：`docker/docker-compose.yml` 里保留了 `temple-frontend` 服务定义，但当前生产环境实际前端由 `temple-frontend.service` 运行：

```text
/opt/temple-os/frontend/.next/standalone/server.js
```

## 3. Backend

入口：

```text
backend/src/index.ts
```

主要路由：

| Mount | File | Purpose |
| --- | --- | --- |
| `/api/auth` | `routes/auth.ts` | Login, logout, current user, password, user creation |
| `/api/system` | `routes/system.ts` | System settings |
| `/api/registration` | `routes/registration.ts` | Public registration tasks and submissions |
| `/api` | `routes/business.ts` | Main business modules |
| `/api/batch` | `routes/batch.ts` | Batch approve/delete/update/export |
| `/export` | `routes/export.ts` | Export endpoints |
| `/search` | `routes/search.ts` | Search endpoints |
| `/wechat` | `routes/wechat.ts` | WeChat verify callbacks |

认证方式：

- Login returns JSON token and sets `temple_token` HttpOnly cookie.
- Backend auth accepts `Authorization: Bearer <token>` and `temple_token` cookie.
- Nginx `/print-api/` uses `auth_request` against `/api/auth/me`.

数据库：

```text
backend/prisma/schema.prisma
```

核心模型分组：

| Area | Models |
| --- | --- |
| System | `User`, `SystemSettings`, `WechatAccount`, `OperationLog` |
| Registration | `RegistrationTask`, `RegistrationRequest` |
| People | `Monk`, `Volunteer`, `VolunteerTask`, `VolunteerSignup`, `Devotee` |
| Ritual/Plaque | `MemorialPlaque`, `PlaqueTemplate`, `Ritual`, `RitualParticipant`, `Hall`, `HallReservation`, `LampOffering` |
| Finance/Logistics | `Donation`, `WarehouseItem`, `WarehouseIn`, `WarehouseOut`, `Room`, `AccommodationRecord`, `DiningReservation`, `VisitRecord` |
| Printing | `PrintClient`, `PrintJob`, `PrintJobItem` |

当前 schema 没有 `tenant_id`，符合“不同客户不同服务器”的部署策略。

## 4. Frontend

入口目录：

```text
frontend/src/app
```

页面分组：

| Area | Routes |
| --- | --- |
| Public | `/`, `/register`, `/login`, `/plaque-templates` |
| Admin core | `/admin`, `/admin/tasks`, `/admin/approvals`, `/admin/settings`, `/admin/users`, `/admin/logs` |
| People | `/admin/volunteers`, `/admin/volunteer-tasks`, `/admin/volunteer-attendance`, `/admin/monks`, `/admin/devotees` |
| Plaques/Ritual | `/admin/plaques`, `/admin/plaques/batch-print`, `/admin/plaque-templates`, `/admin/rituals`, `/admin/halls`, `/admin/lamps` |
| Logistics/Finance | `/admin/rooms`, `/admin/dining`, `/admin/visits`, `/admin/donations`, `/admin/warehouse` |

前端 API 封装：

```text
frontend/src/lib/api.ts
```

状态管理：

```text
frontend/src/stores/authStore.ts
```

UI 组件：

```text
frontend/src/components/ui
```

## 5. Printing Direction

当前：

```text
admin -> /print-api/ -> print-service
```

目标：

```text
server stores data/templates/jobs
desktop app fetches job/template/data
desktop app renders preview locally
desktop app prints locally
desktop app reports status to server
```

现有 `print-service` 短期保留，作为 Web 模板设计和备用预览工具。后续桌面软件要逐步接管本地打印能力。

## 6. Deployment Options

当前支持两条路径：

1. 打包上传：`scripts/make-release.ps1` + `scripts/check-release.ps1`
2. Git 自动部署：`.github/workflows/deploy-production.yml`

发布包排除：

- `.env`
- `node_modules/`
- `.next/`
- `dist/`
- `backup/`
- `logs/`
- `frontend-deploy/`
- `frontend-runtime/`
- `releases/`

生产配置保留在服务器：

```text
/opt/temple-os/backend/.env
/opt/temple-os/docker/.env
```

## 7. Stage 1 Governance Baseline

阶段 1 实施统一遵守以下基线：

- 生产前端主路径是 `systemd + Next standalone`，不是 Docker Compose 前端容器。
- 生产后端主路径是 Docker 容器。
- 生产打印服务主路径是 Docker 容器。
- 生产数据库主路径是 PostgreSQL 容器。
- `print-service` 负责模板设计、Web 预览和备用打印，不作为长期主打印执行端。
- `desktop-app` 是后续本地打印主执行端，负责打印机发现、任务领取、本地执行和状态回传。
- `wechat-platform` 在阶段 1 仅做结构整理，不扩业务面，不接入主业务强依赖。
- 阶段 1 只做结构治理：后端拆域、打印模型定稿、前端核心 API 类型化，不做新业务扩张。

## 8. Known Current State

- 本地正式项目目录已经建立。
- `frontend-deploy/` 和 `frontend-runtime/` 已从本地正式项目排除。
- `.env` 已从本地正式项目排除，但 Git 历史里曾经跟踪过 `backend/.env` 和 `docker/.env`。
- 部分中文源码/配置在本地显示为乱码，说明历史同步或编码处理存在问题。
- `docker/nginx.conf` 中中文注释有乱码，但配置指令本身可读。
- `business.ts` 过大，集中承载了大部分业务路由，后续维护成本较高。
- 生产前端实际由 systemd 运行，compose 中前端服务定义与生产现实不完全一致。
