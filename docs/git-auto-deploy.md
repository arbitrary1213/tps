# Git Auto Deploy

This project supports two deployment paths:

- Manual package upload from `scripts/make-release.ps1`.
- GitHub Actions deployment through `.github/workflows/deploy-production.yml`.

The Git path should be used when the local project is clean, committed, and pushed to `main`.

## Required GitHub Secrets

Configure these secrets in the GitHub repository:

```text
PRODUCTION_HOST
PRODUCTION_USER
PRODUCTION_SSH_KEY
PRODUCTION_SSH_PORT
```

`PRODUCTION_SSH_PORT` can be `22` for the current server unless SSH is moved to another port.

## Server Requirements

The production server must already have:

```text
/opt/temple-os
/opt/temple-os/docker/.env
/opt/temple-os/backend/.env, if the backend needs it
Docker
Node.js
systemd service temple-frontend.service
```

The workflow does not upload `.env` files. Production secrets stay on the server.

## Deploy Behavior

On push to `main`, the workflow:

1. Installs dependencies in CI.
2. Builds the backend.
3. Runs backend tests.
4. Builds the frontend.
5. Checks print-service JavaScript syntax.
6. SSHes into the production server.
7. Runs `/opt/temple-os/deploy.sh all`.

Manual deploy is also available from GitHub Actions with `workflow_dispatch`.

Manual target options:

```text
all
backend
frontend
print
```

## Important Notes

- Do not commit real `.env` files.
- The server deploy script loads `/opt/temple-os/docker/.env` before building and restarting services.
- The current frontend runtime is systemd-based, not a frontend Docker container.
- The backend and print service are containerized with host networking.
- The deploy script creates a database backup before pulling and rebuilding.
- `desktop-app` and `wechat-platform` are not deployed by this workflow today.

## Recommended Daily Flow

```text
1. Work locally in C:\Users\28557\Documents\New project\temple-os
2. Run local checks.
3. Commit changes.
4. Push to main.
5. GitHub Actions verifies and deploys.
6. Check production health endpoints.
```

Keep the package upload path as a fallback for emergency deployments.
