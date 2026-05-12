# Module Map

更新时间：2026-05-12

## Backend Modules

| Module | Main Files | Notes |
| --- | --- | --- |
| Auth | `backend/src/routes/auth.ts`, `backend/src/middleware/auth.ts` | JWT, HttpOnly cookie, role guard |
| System | `backend/src/routes/system.ts` | System settings |
| Registration | `backend/src/routes/registration.ts`, `validation.ts` | Public task forms, approvals |
| Business | `backend/src/routes/business.ts` | Main mixed business routes; should be split later |
| Batch | `backend/src/routes/batch.ts` | Bulk approve/delete/update/export |
| Export | `backend/src/routes/export.ts` | XLSX/CSV exports |
| Search | `backend/src/routes/search.ts` | Search helpers |
| WeChat | `backend/src/routes/wechat.ts`, `services/wechat.ts` | WeChat verify/callback |
| Import normalization | `backend/src/routes/business.normalize.ts` | Plaque import and duplicate key helpers |

## Frontend Modules

| Module | Main Files | Notes |
| --- | --- | --- |
| App shell | `frontend/src/app/layout.tsx`, `ClientLayout.tsx` | Global layout |
| Admin layout | `frontend/src/app/admin/layout.tsx`, `components/AdminNav.tsx` | Admin navigation and auth shell |
| API client | `frontend/src/lib/api.ts` | Central API wrapper |
| Auth store | `frontend/src/stores/authStore.ts` | Local token/user state |
| UI kit | `frontend/src/components/ui` | Local shared components |
| Plaque preview | `frontend/src/components/PlaquePrintPreview.tsx` | Print preview helper |
| Template types | `frontend/src/types/template.ts` | Template data structures |

## Print Service

| File | Role |
| --- | --- |
| `print-service/index.js` | Express static service and health endpoint |
| `print-service/public/index.html` | Web print/template UI |
| `print-service/public/app.js` | Main browser-side print/template logic |
| `print-service/public/styles.css` | Print UI styles |
| `print-service/public/sample-*.csv` | Local sample import files |

## Desktop App

| File | Role |
| --- | --- |
| `desktop-app/src/main.js` | Electron main process, local store, printer bridge |
| `desktop-app/src/preload.js` | Safe IPC bridge |
| `desktop-app/src/renderer.html` | Desktop UI shell |
| `desktop-app/src/renderer.js` | API calls, short cache, print workflow |
| `desktop-app/src/styles.css` | Desktop UI styles |

## Deployment Files

| File | Role |
| --- | --- |
| `deploy.sh` | Production pull/build/restart/verify script |
| `docker/docker-compose.yml` | DB/backend/print and legacy frontend service definitions |
| `docker/nginx.conf` | Example Nginx reverse proxy config |
| `docker/.env.example` | Per-server env template |
| `.github/workflows/ci.yml` | CI checks |
| `.github/workflows/deploy-production.yml` | GitHub Actions production deploy |
| `scripts/make-release.ps1` | Build local release zip |
| `scripts/check-release.ps1` | Validate release zip contents |
