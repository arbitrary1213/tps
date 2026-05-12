# Desktop App and Local Printing Plan

The target model is: the server stores data and templates; the desktop app reads them and prints on the local machine. The server creates, stores, and tracks print jobs, but it does not control the customer's printer directly.

## Target Flow

```text
desktop app logs in to server
        |
fetch plaques, orders, and templates
        |
render local preview
        |
select local printer
        |
print locally
        |
report print status to server
```

## Server Responsibilities

- Store business data such as plaques, orders, and devotees.
- Store print templates, template assets, and template versions.
- Create print jobs.
- Expose pending print jobs to desktop clients.
- Store print success, failure reason, and reprint records.
- Keep operation/audit logs.

## Desktop App Responsibilities

- Store the server URL and login state.
- Fetch pending print jobs and templates.
- Render print preview locally.
- Call the local printer.
- Support printer selection, paper size, margin, and scale settings.
- Queue status updates locally if the network is unavailable.

## Recommended API Shape

```text
POST /api/print-jobs
Create a print job.

GET /api/print-jobs?status=PENDING
Desktop app fetches pending jobs.

GET /api/print-jobs/:id
Fetch job details, plaque data, and template snapshot.

POST /api/print-jobs/:id/complete
Desktop app reports print success.

POST /api/print-jobs/:id/fail
Desktop app reports print failure and reason.
```

## Current print-service Position

The current `print-service` can stay as the web template design and fallback preview tool. Over time, the template rendering and local printer integration should move into the desktop app.

`desktop-app/` contains the first Electron client shell. It stores server URL, auth, print client registration, default printer, cached jobs, recent data, and pending print status reports locally.

Suggested migration order:

1. Keep the current web print service so existing production use is not interrupted.
2. Stabilize the template data structure and rendering rules.
3. Implement desktop template loading and preview.
4. Implement desktop local printing.
5. Change server print jobs to a fetch-and-report model.
6. Keep the web print service as template design and fallback preview only.

## Print Job Data Requirements

A print job should store at least:

```text
id
sourceType
plaqueIds
templateId
templateSnapshot
paperWidthMm
paperHeightMm
status
printClientId
printedAt
failedReason
createdBy
createdAt
updatedAt
```

The template snapshot must be stored with the print job, so historical print records are not affected when a template is edited later.
