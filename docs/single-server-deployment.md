# Single-Customer Server Deployment

This project is delivered as one isolated server per customer. It is not a shared multi-tenant deployment. Each customer gets an independent frontend, backend, database, file storage path, domain, and environment configuration.

## Architecture Rule

```text
same codebase
different server
different database
different configuration
different file storage
```

The online site, admin panel, and desktop app must access data through the HTTPS API. The desktop app must not connect to PostgreSQL directly.

```text
public site  --\
admin panel  ---- HTTPS API ---- PostgreSQL
 desktop app --/              \-- files/templates
```

## Standard Directories

```text
/opt/temple-os/backend          Backend API
/opt/temple-os/frontend         Public site and admin panel
/opt/temple-os/print-service    Current web print/template tool
/opt/temple-os/docker           Docker Compose, Nginx example, env files
/opt/temple-os/storage          Uploads and template assets
/opt/temple-os/backup           Database backups
```

## New Customer Setup

1. Prepare a new server and domain.
2. Install Docker, Docker Compose, Nginx, and Certbot.
3. Clone the same codebase into `/opt/temple-os`.
4. Copy `docker/.env.example` to `docker/.env` and change the domain, database password, JWT secret, and integration settings.
5. Start the services and initialize the database.
6. Configure Nginx and HTTPS.
7. Create the initial admin account.
8. Configure system settings, public site content, and print templates.
9. Configure the desktop app to use this customer's API URL.

## Per-Server Values

- `PUBLIC_SITE_URL`
- `ALLOWED_ORIGIN`
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- upload/storage paths
- payment and WeChat settings
- initial admin account
- Nginx `server_name` and HTTPS certificate

## Avoid

- Sharing one database across customers.
- Letting the desktop app connect directly to PostgreSQL.
- Hard-coding temple names, domains, payment credentials, or customer content in source code.
- Committing production secrets to Git.
- Removing Docker volumes without a verified database backup.

## Later Improvements

- Parameterize deployment scripts by domain and env file.
- Add system settings export/import for faster customer setup.
- Add scheduled database and file backups.
- Add version numbers and upgrade logs for multi-server maintenance.
