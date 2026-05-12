# Desktop App Migration

更新时间：2026-05-12

## Target

The system is moving to a three-part model:

```text
server API + database + public registration site
desktop app for internal operations and local printing
small web admin for maintenance only
```

The first implementation adds `desktop-app/` as an Electron MVP. It does not remove the existing web admin pages yet.

## Current Desktop MVP

The desktop app currently supports:

- Server URL configuration.
- API login.
- Reading pending registration requests, plaques, devotees, and print jobs.
- Registering the local machine as a print client.
- Listing local printers through Electron.
- Fetching the next local print job.
- Printing fetched jobs locally through Electron.
- Caching recent data, fetched jobs, and pending print status reports.

It does not connect directly to PostgreSQL.

## Backend Printing Protocol

The desktop app uses:

```text
POST /api/local-print/clients/register
POST /api/local-print/clients/:id/heartbeat
GET /api/local-print/clients/:id/jobs/next
POST /api/local-print/jobs/:jobId/items/:itemId/report
```

The stable job status flow is:

```text
PENDING -> DISPATCHED -> PRINTING -> COMPLETED
                             |
                             v
                           FAILED
```

Failed jobs can be fetched again by the assigned print client.

## Migration Order

1. Keep the current web admin pages available.
2. Use the desktop app for local print client registration and print job execution.
3. Move high-frequency internal screens into the desktop app:
   - registration approvals
   - plaque management
   - devotees
   - print jobs
4. Reduce web admin navigation to maintenance pages:
   - users
   - settings
   - logs
   - templates
5. Keep the public site and `/register` online.

## Not In First Version

- Full offline data editing.
- Conflict resolution.
- Multi-tenant shared server.
- Payment flow.
- Removing web admin business pages.

