# Temple OS Desktop

Electron local client for internal operations and local printing.

## First Version Scope

- Configure server URL.
- Login through server API.
- Read pending registrations, plaques, devotees, and print jobs.
- Register this machine as a local print client.
- Fetch print jobs from `/api/local-print/...`.
- Print already fetched jobs on the local machine.
- Cache recent data, fetched jobs, and pending print status reports.

The desktop app does not connect directly to PostgreSQL.

## Development

```bash
npm install
npm run check
npm start
```

## Production Direction

This app starts the existing Next.js admin frontend locally and opens `/admin` inside Electron. Data still comes from the configured server API.

The older simple MVP screen is still present in `renderer.html`, but the default startup path is now the local admin frontend.
