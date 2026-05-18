#!/bin/bash
set -euo pipefail

APP_DIR="/opt/temple-os"
DOCKER_DIR="$APP_DIR/docker"
BACKUP_DIR="$DOCKER_DIR/backup"
DATE=$(date +%Y%m%d_%H%M%S)

POSTGRES_DB="${POSTGRES_DB:-temple_os}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"

# --- Deploy password check ---
PASSWORD_ARG=""
PARSED_TARGETS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --password) PASSWORD_ARG="$2"; shift 2 ;;
    --password=*) PASSWORD_ARG="${1#*=}"; shift ;;
    *) PARSED_TARGETS+=("$1"); shift ;;
  esac
done
INPUT_PASSWORD="${PASSWORD_ARG:-${DEPLOY_PASSWORD:-}}"
if [ -f "$DOCKER_DIR/.env" ]; then
  set -a; . "$DOCKER_DIR/.env"; set +a
fi
if [ -n "${DEPLOY_PASSWORD_HASH:-}" ]; then
  if [ -z "$INPUT_PASSWORD" ]; then
    echo "ERROR: Deploy password required. Use --password or DEPLOY_PASSWORD env." >&2
    exit 1
  fi
  EXPECTED_HASH="$(echo -n "$INPUT_PASSWORD" | sha256sum | awk '{print $1}')"
  if [ "$EXPECTED_HASH" != "$DEPLOY_PASSWORD_HASH" ]; then
    echo "ERROR: Incorrect deploy password." >&2
    exit 1
  fi
  echo "Password verified OK"
fi

TARGETS=("${PARSED_TARGETS[@]:-}")
if [ ${#TARGETS[@]} -eq 0 ]; then
  TARGETS=("all")
fi

COMPOSE="docker compose"
if ! docker compose version >/dev/null 2>&1; then
  COMPOSE="docker-compose"
fi

has_target() {
  local wanted="$1"
  for item in "${TARGETS[@]}"; do
    if [ "$item" = "all" ] || [ "$item" = "$wanted" ]; then
      return 0
    fi
  done
  return 1
}

sync_print_api_assets() {
  echo "  Syncing print-api assets to frontend static directory..."
  local src="$APP_DIR/frontend/public/print-api"
  local dst="$APP_DIR/frontend/.next/standalone/public/print-api"
  if [ -d "$src" ]; then
    mkdir -p "$dst"
    cp -r "$src"/* "$dst"/
    echo "  print-api assets synced"
  fi
}

restart_frontend() {
  $COMPOSE up -d temple-frontend
}

build_print_image() {
  $COMPOSE build temple-print
}

restart_print() {
  $COMPOSE up -d temple-print
}

verify_frontend() {
  curl -fsS http://127.0.0.1:3000 >/dev/null && echo "  ✓ frontend" || echo "  ✗ frontend"
}

echo "===== Temple OS Deploy ====="
echo "Targets: ${TARGETS[*]}"

# ---- Backup DB ----
if has_target backend; then
  echo "[1/5] Backing up database..."
  mkdir -p "$BACKUP_DIR"
  docker exec temple-db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_DIR/db_backup_$DATE.sql" 2>/dev/null || true
fi

# ---- Pull code ----
echo "[2/5] Pulling latest code..."
cd "$APP_DIR"
if [ -f "$DOCKER_DIR/.env" ]; then
  cp "$DOCKER_DIR/.env" /tmp/temple_docker_env_backup
fi
git pull --rebase --autostash origin main
if [ -f /tmp/temple_docker_env_backup ]; then
  mv /tmp/temple_docker_env_backup "$DOCKER_DIR/.env"
fi

# ---- Build & restart ----
echo "[3/5] Building and restarting services..."
cd "$DOCKER_DIR"

# Ensure DOMAIN is set (migration from older .env files)
if [ -z "${DOMAIN:-}" ] && [ -n "${ALLOWED_ORIGIN:-}" ]; then
  DOMAIN=$(echo "$ALLOWED_ORIGIN" | sed 's|^https\?://||' | sed 's|/.*||')
  echo "  DOMAIN=$DOMAIN (extracted from ALLOWED_ORIGIN)"
  if ! grep -q "^DOMAIN=" "$DOCKER_DIR/.env" 2>/dev/null; then
    echo "DOMAIN=$DOMAIN" >> "$DOCKER_DIR/.env"
  fi
fi

# Migration: stop host nginx & systemd frontend if they exist (now managed by Docker)
if systemctl is-active --quiet nginx 2>/dev/null; then
  echo "  Stopping host nginx (migrating to Docker)..."
  systemctl stop nginx 2>/dev/null || true
  systemctl disable nginx 2>/dev/null || true
fi
if systemctl is-active --quiet temple-frontend 2>/dev/null; then
  echo "  Stopping temple-frontend systemd service (migrating to Docker)..."
  systemctl stop temple-frontend 2>/dev/null || true
  systemctl disable temple-frontend 2>/dev/null || true
fi

# Migration: remove old docker-run containers so Compose can take over
echo "  Cleaning up old containers (migration to Compose)..."
for c in temple-backend temple-print temple-frontend temple-nginx; do
  docker rm -f "$c" 2>/dev/null && echo "  Removed old container $c" || true
done
echo "  Container cleanup done"

if has_target all; then
  $COMPOSE build --pull
  $COMPOSE up -d
else
  if has_target print; then
    sync_print_api_assets
    restart_frontend
    build_print_image
    restart_print
  fi
  SERVICES=""
  has_target backend && SERVICES="$SERVICES temple-backend"
  has_target frontend && ! has_target print && SERVICES="$SERVICES temple-frontend"
  if [ -n "$SERVICES" ]; then
    $COMPOSE build $SERVICES
    $COMPOSE up -d $SERVICES
  fi
fi

# ---- DB migration ----
if has_target backend; then
  echo "[4/5] Updating database schema..."
  sleep 10
  docker exec temple-backend npx prisma db push --accept-data-loss --skip-generate >/dev/null 2>&1 || true
fi

# ---- Health checks ----
echo "[5/5] Verifying services..."
sleep 5
if has_target backend || has_target all; then
  curl -fsS http://127.0.0.1:3002/api/health >/dev/null && echo "  ✓ backend" || echo "  ✗ backend"
fi
if has_target frontend || has_target all; then
  curl -fsS http://127.0.0.1:3000 >/dev/null && echo "  ✓ frontend" || echo "  ✗ frontend"
fi
if has_target print || has_target all; then
  curl -fsS http://127.0.0.1:3001/health >/dev/null && echo "  ✓ print" || echo "  ✗ print"
fi
if has_target print; then verify_frontend; fi

# ---- Cleanup ----
echo ""
echo "Cleaning up..."
docker image prune -af --filter "until=24h" >/dev/null 2>&1 || true
docker container prune -f --filter "until=1h" >/dev/null 2>&1 || true
docker builder prune -af --filter "until=24h" >/dev/null 2>&1 || true
find "$BACKUP_DIR" -name "db_backup_*.sql" -type f -printf '%T@ %p\n' \
  | sort -rn | tail -n +8 | awk '{print $2}' | xargs -r rm -f
journalctl --vacuum-time=7d >/dev/null 2>&1 || true
apt-get clean >/dev/null 2>&1 || true
echo "  ✓ cleanup done"

echo ""
echo "===== Deploy Complete ====="
