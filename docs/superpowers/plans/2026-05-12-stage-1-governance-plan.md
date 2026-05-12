# Stage 1 Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize the current Temple OS delivery path by fixing project baselines, splitting the oversized backend business router, locking the print architecture, and starting first-pass frontend API typing without changing user-facing behavior.

**Architecture:** Keep the single-customer deployment model and current runtime topology intact. First freeze the project truth in docs, then split backend routes by domain with compatibility-preserving mounts, then define one print job model across backend, print-service, and desktop-app, and finally type the highest-risk frontend API surfaces against the stabilized backend boundaries.

**Tech Stack:** Next.js 16, React 18, Tailwind CSS, Zustand, Express, TypeScript, Prisma, PostgreSQL, Electron, Node.js, Docker, systemd, GitHub Actions

---

## Stage 1 Scope

- [ ] Freeze baseline deployment and module responsibility rules in docs.
- [ ] Split `backend/src/routes/business.ts` into domain route modules without changing route paths.
- [ ] Lock one print responsibility model across `backend`, `print-service`, and `desktop-app`.
- [ ] Add first-pass typing for core frontend API surfaces.
- [ ] Do not add new business features, multi-tenant behavior, or deployment model changes.

## Milestones

### M1: Baseline Confirmation

**Files:**
- Modify: `docs/PROJECT_OVERVIEW.md`
- Modify: `docs/MODULE_MAP.md`
- Modify: `docs/MAINTENANCE_AUDIT.md`

- [ ] Confirm production runtime truth.
  - Frontend production runtime remains `systemd + Next standalone`.
  - Backend runtime remains Docker container on host networking.
  - Print runtime remains Docker container on host networking.
  - Database runtime remains PostgreSQL container.

- [ ] Confirm module responsibilities.
  - `frontend`: public and admin UI, business interaction, no physical printer control.
  - `backend`: auth, business API, print jobs, print client state.
  - `print-service`: template design, web preview, fallback print utility.
  - `desktop-app`: local print execution, printer discovery, task pickup, local cache/reporting.
  - `wechat-platform`: independent center service skeleton, structure cleanup only in this stage.

- [ ] Confirm Stage 1 boundaries.
  - In scope: backend route split, print model freeze, frontend API typing, boundary cleanup for desktop and WeChat modules.
  - Out of scope: new modules, multi-tenant changes, database deployment changes, large UI redesign.

### M2: Backend Route Split

**Files:**
- Modify: `backend/src/index.ts`
- Modify: `backend/src/routes/business.ts`
- Create: `backend/src/routes/business/index.ts`
- Create: `backend/src/routes/business/shared.ts`
- Create: `backend/src/routes/business/people.ts`
- Create: `backend/src/routes/business/rituals.ts`
- Create: `backend/src/routes/business/logistics.ts`
- Create: `backend/src/routes/business/systemAdmin.ts`
- Create: `backend/src/routes/business/plaquesPrinting.ts`

- [ ] Create a shared helper module for reusable business route dependencies.
  - Keep `logOperation`, multer instances, print helper builders, and imported normalization helpers in one place.

- [ ] Split domain routes in this order:
  1. `people`
  2. `rituals`
  3. `logistics`
  4. `systemAdmin`
  5. `plaquesPrinting`

- [ ] Keep all existing route paths and middleware behavior identical.

- [ ] Replace direct `business.ts` mounting with `routes/business/index.ts` aggregation once split is complete.

### M3: Print Architecture Freeze

**Files:**
- Modify: `docs/PROJECT_OVERVIEW.md`
- Modify: `docs/MODULE_MAP.md`
- Modify: `docs/desktop-printing-plan.md`
- Modify: `docs/DESKTOP_APP_MIGRATION.md`

- [ ] Freeze print responsibilities.
  - `backend`: job creation, client registration, dispatch, status source of truth.
  - `print-service`: template design, web preview, fallback print tool.
  - `desktop-app`: local execution, printer capability, task pickup, offline queue.

- [ ] Freeze state models.
  - `PrintClient`: active/stale/offline/disabled semantics.
  - `PrintJob`: pending/dispatched/running/success/failed/partial_failed/cancelled semantics.
  - `PrintJobItem`: pending/printing/success/failed/skipped semantics.

- [ ] Freeze protocol boundaries for register, heartbeat, next job, and item report.

### M4: Frontend API Typing

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Create: `frontend/src/types/api.ts`
- Create: `frontend/src/types/business.ts`
- Modify: `frontend/src/app/admin/page.tsx`
- Modify: `frontend/src/app/admin/plaques/page.tsx`
- Modify: `frontend/src/app/admin/plaque-templates/page.tsx`
- Modify: `frontend/src/app/admin/devotees/page.tsx`

- [ ] Add common API response types.
- [ ] Add first-pass types for auth, registration, dashboard, devotees, plaques, plaque templates, print jobs, and print clients.
- [ ] Update high-risk admin pages to consume typed API responses.

## Verification

- [ ] Backend build: `npm run build` in `backend`
- [ ] Backend tests: `npm test` in `backend`
- [ ] Frontend build: `npm run build` in `frontend`
- [ ] Print syntax: `node --check index.js` and `node --check public/app.js` in `print-service`

## Done Definition

- [ ] Project baseline docs match the real runtime and module boundaries.
- [ ] `backend/src/routes/business.ts` is no longer the single oversized route file.
- [ ] Print responsibilities and state model are explicitly frozen for follow-up work.
- [ ] Core frontend API surfaces no longer depend on broad `any` usage.
