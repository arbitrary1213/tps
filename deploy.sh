#!/bin/bash
set -euo pipefail

APP_DIR="/opt/temple-os"
BACKUP_DIR="$APP_DIR/backup"
DOCKER_DIR="$APP_DIR/docker"
LOG_DIR="$DOCKER_DIR/logs"
DATE=$(date +%Y%m%d_%H%M%S)

DB_CONTAINER="temple-db"
BACKEND_CONTAINER="temple-backend"
PRINT_CONTAINER="temple-print"
FRONTEND_SERVICE="temple-frontend.service"

POSTGRES_DB="${POSTGRES_DB:-temple_os}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
JWT_SECRET="${JWT_SECRET:-SrpuIPv+t/9AUKrOOarrVxgU6CuoiSKvmt3X2SBRHaA=}"
ALLOWED_ORIGIN="${ALLOWED_ORIGIN:-https://temple.example.com}"
NEXT_PUBLIC_API_BASE="${NEXT_PUBLIC_API_BASE:-}"

TARGETS=("$@")
if [ ${#TARGETS[@]} -eq 0 ]; then
  TARGETS=("backend" "frontend" "print")
fi

echo "===== Temple OS Deploy ====="

has_target() {
  local wanted="$1"
  for item in "${TARGETS[@]}"; do
    if [ "$item" = "all" ] || [ "$item" = "$wanted" ]; then
      return 0
    fi
  done
  return 1
}

backup_db() {
  echo "[1/6] Backing up database..."
  mkdir -p "$BACKUP_DIR"
  docker exec "$DB_CONTAINER" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_DIR/db_backup_$DATE.sql" 2>/dev/null || true
}

pull_code() {
  echo "[2/6] Pulling latest code..."
  cd "$APP_DIR"
  local env_backup_dir
  env_backup_dir="$(mktemp -d)"
  if [ -f "$APP_DIR/backend/.env" ]; then
    cp "$APP_DIR/backend/.env" "$env_backup_dir/backend.env"
  fi
  if [ -f "$APP_DIR/docker/.env" ]; then
    cp "$APP_DIR/docker/.env" "$env_backup_dir/docker.env"
  fi
  git pull --rebase --autostash origin main
  if [ -f "$env_backup_dir/backend.env" ]; then
    cp "$env_backup_dir/backend.env" "$APP_DIR/backend/.env"
  fi
  if [ -f "$env_backup_dir/docker.env" ]; then
    cp "$env_backup_dir/docker.env" "$APP_DIR/docker/.env"
  fi
  rm -rf "$env_backup_dir"
}

build_backend_image() {
  echo "[3/6] Building backend image..."
  docker build -t docker_temple-backend:latest "$APP_DIR/backend"
}

restart_backend() {
  echo "[4/6] Restarting backend container..."
  mkdir -p "$LOG_DIR"
  docker rm -f "$BACKEND_CONTAINER" >/dev/null 2>&1 || true
  docker run -d \
    --name "$BACKEND_CONTAINER" \
    --network host \
    --restart unless-stopped \
    -e "DATABASE_URL=postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB" \
    -e "JWT_SECRET=$JWT_SECRET" \
    -e "ALLOWED_ORIGIN=$ALLOWED_ORIGIN" \
    -e "PORT=3002" \
    -e "NODE_ENV=production" \
    -v "$LOG_DIR:/app/logs" \
    docker_temple-backend:latest >/dev/null
}

update_backend_db() {
  echo "[5/6] Updating backend database schema..."
  docker exec "$BACKEND_CONTAINER" npx prisma db push --accept-data-loss --skip-generate >/dev/null
  docker exec "$BACKEND_CONTAINER" npx prisma generate >/dev/null
}

build_frontend() {
  echo "[3/6] Building frontend..."
  cd "$APP_DIR/frontend"
  NEXT_PUBLIC_API_BASE="$NEXT_PUBLIC_API_BASE" npm run build
}

restart_frontend() {
  echo "[4/6] Restarting frontend service..."
  local stale_pids
  stale_pids=$(ss -ltnp 2>/dev/null | awk '/:3000 / { if (match($0, /pid=[0-9]+/)) print substr($0, RSTART + 4, RLENGTH - 4) }' | sort -u)
  if [ -n "$stale_pids" ]; then
    for pid in $stale_pids; do
      if ! systemctl show "$FRONTEND_SERVICE" -p MainPID --value | grep -qx "$pid"; then
        kill "$pid" >/dev/null 2>&1 || true
      fi
    done
    sleep 2
  fi
  systemctl restart "$FRONTEND_SERVICE"
}

sync_print_api_assets() {
  echo "[3/6] Syncing print-api assets to frontend standalone..."
  local source_dir="$APP_DIR/frontend/public/print-api"
  local target_dir="$APP_DIR/frontend/.next/standalone/public/print-api"
  if [ ! -d "$source_dir" ]; then
    echo "Missing print-api source directory: $source_dir" >&2
    return 1
  fi
  mkdir -p "$(dirname "$target_dir")"
  rm -rf "$target_dir"
  cp -a "$source_dir" "$target_dir"
}

build_print_image() {
  echo "[3/6] Building print image..."
  docker build -f "$APP_DIR/print-service/Dockerfile" -t docker_temple-print:latest "$APP_DIR"
}

restart_print() {
  echo "[4/6] Restarting print container..."
  docker rm -f "$PRINT_CONTAINER" >/dev/null 2>&1 || true
  docker run -d \
    --name "$PRINT_CONTAINER" \
    --network host \
    --restart unless-stopped \
    -e "PORT=3001" \
    -e "NODE_ENV=production" \
    docker_temple-print:latest >/dev/null
}

verify_backend() {
  curl -fsS http://127.0.0.1:3002/api/health >/dev/null
  echo "✓ backend healthy"
}

verify_frontend() {
  curl -fsS http://127.0.0.1:3000 >/dev/null
  echo "✓ frontend healthy"
}

verify_print() {
  curl -fsS http://127.0.0.1:3001/health >/dev/null
  echo "✓ print healthy"
}

backup_db
pull_code

if has_target backend; then
  build_backend_image
  restart_backend
  update_backend_db
fi

if has_target frontend; then
  build_frontend
  restart_frontend
fi

if has_target print; then
  sync_print_api_assets
  restart_frontend
  build_print_image
  restart_print
fi

echo "[6/6] Verifying services..."
sleep 5
if has_target backend; then verify_backend; fi
if has_target frontend; then verify_frontend; fi
if has_target print; then verify_frontend; fi
if has_target print; then verify_print; fi

echo "===== Deploy Complete ====="
