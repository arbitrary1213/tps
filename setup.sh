#!/bin/bash
set -e

# Temple OS one-click deployment script
# Run as root on a fresh Ubuntu/Debian server

if [ "$EUID" -ne 0 ]; then
    echo "Run as root: sudo $0"
    exit 1
fi

APP_DIR="/opt/temple-os"
DOCKER_DIR="$APP_DIR/docker"
ENV_FILE="$DOCKER_DIR/.env"

echo "===== Temple OS One-Click Deploy ====="
echo ""

# ---- Step 1: Install dependencies ----
echo "[1/7] Installing Docker and Docker Compose..."
if ! command -v docker >/dev/null 2>&1; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
    apt update && apt install -y docker-compose
fi

COMPOSE="docker compose"
if ! docker compose version >/dev/null 2>&1; then
    COMPOSE="docker-compose"
fi

# ---- Step 2: Get configuration ----
echo ""
echo "[2/7] Configuration"
echo "-------------------"

read -p "Domain name (e.g. xiandingsi.cn): " DOMAIN
if [ -z "$DOMAIN" ]; then
    DOMAIN="localhost"
    echo "No domain entered, using: localhost"
fi

read -p "DB password [auto-generate]: " DB_PASS
if [ -z "$DB_PASS" ]; then
    DB_PASS=$(openssl rand -base64 18)
    echo "Generated: $DB_PASS"
fi

read -p "JWT secret [auto-generate]: " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated: $JWT_SECRET"
fi

read -p "Deploy password [auto-generate]: " DEPLOY_PASS
if [ -z "$DEPLOY_PASS" ]; then
    DEPLOY_PASS=$(openssl rand -base64 24)
    echo "Generated: $DEPLOY_PASS"
fi
DEPLOY_PASSWORD_HASH=$(echo -n "$DEPLOY_PASS" | sha256sum | awk '{print $1}')

# ---- Step 3: Create docker/.env ----
echo ""
echo "[3/7] Creating docker/.env ..."
mkdir -p "$DOCKER_DIR"

cat > "$ENV_FILE" << EOF
# Temple OS deployment configuration
APP_NAME=Temple OS
DOMAIN=$DOMAIN
PUBLIC_SITE_URL=https://$DOMAIN
ALLOWED_ORIGIN=https://$DOMAIN
NEXT_PUBLIC_API_BASE=

# Database
POSTGRES_DB=temple_os
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$DB_PASS
DATABASE_URL=postgresql://postgres:$DB_PASS@localhost:5432/temple_os

# Backend security
JWT_SECRET=$JWT_SECRET

# Runtime ports
FRONTEND_PORT=3000
BACKEND_PORT=3002
PRINT_SERVICE_PORT=3001

# Storage paths
UPLOAD_DIR=/opt/temple-os/storage/uploads
PLAQUE_TEMPLATE_ASSET_DIR=/opt/temple-os/storage/plaque-template-assets

# Payment / external integration
PAYMENT_PROVIDER=
PAYMENT_MERCHANT_ID=
PAYMENT_API_KEY=
WECHAT_APP_ID=
WECHAT_APP_SECRET=

# Central WeChat platform
PUBLIC_SERVER_URL=https://$DOMAIN
WECHAT_PLATFORM_BASE_URL=
WECHAT_PLATFORM_API_TOKEN=

# Deploy security
DEPLOY_PASSWORD_HASH=$DEPLOY_PASSWORD_HASH
EOF

echo "  DOMAIN: $DOMAIN"
echo "  Deploy password: $DEPLOY_PASS"
echo "  (save the deploy password — you'll need it to deploy updates)"

# ---- Step 4: SSL certificates ----
echo ""
echo "[4/7] SSL certificates..."

SSL_DIR="/etc/nginx/ssl"
mkdir -p "$SSL_DIR" /var/www/html

# Check if domain resolves to this server
SERVER_IP=$(curl -s4 ifconfig.me 2>/dev/null || echo "")
DOMAIN_IP=$(dig +short "$DOMAIN" 2>/dev/null | head -1 || echo "")

if [ -n "$SERVER_IP" ] && [ -n "$DOMAIN_IP" ] && [ "$SERVER_IP" = "$DOMAIN_IP" ] && [ "$DOMAIN" != "localhost" ]; then
    echo "  Domain resolves to this server — requesting Let's Encrypt certificate..."

    # Stop any service on port 80
    if systemctl is-active --quiet nginx 2>/dev/null; then
        systemctl stop nginx
    fi

    # Install certbot
    apt-get update -qq && apt-get install -y -qq certbot >/dev/null 2>&1

    certbot certonly --standalone \
        --non-interactive --agree-tos \
        --email "admin@$DOMAIN" \
        -d "$DOMAIN" -d "www.$DOMAIN" \
        2>&1 || echo "  WARNING: Let's Encrypt failed, using self-signed cert"

    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/fullchain.pem"
        cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/privkey.pem"
        echo "  Let's Encrypt certificate installed."
        # Set up auto-renewal
        echo "0 3 * * * root certbot renew --quiet --post-hook 'cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/fullchain.pem; cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/privkey.pem; cd $DOCKER_DIR && $COMPOSE restart temple-nginx'" > /etc/cron.d/temple-ssl-renew
    fi
fi

if [ ! -f "$SSL_DIR/fullchain.pem" ]; then
    echo "  Generating self-signed certificate (for testing)..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/privkey.pem" \
        -out "$SSL_DIR/fullchain.pem" \
        -subj "/CN=$DOMAIN" 2>/dev/null
    echo "  Self-signed certificate created. Browser will show a warning — this is normal for testing."
fi

# ---- Step 5: Stop any conflicting services ----
echo ""
echo "[5/7] Stopping conflicting services..."
if systemctl is-active --quiet nginx 2>/dev/null; then
    systemctl stop nginx
    systemctl disable nginx
    echo "  Stopped host nginx (now managed by Docker)"
fi
if systemctl is-active --quiet temple-frontend 2>/dev/null; then
    systemctl stop temple-frontend
    systemctl disable temple-frontend
    echo "  Stopped temple-frontend systemd service (now managed by Docker)"
fi

# ---- Step 6: Build and start ----
echo ""
echo "[6/7] Building and starting all services..."
cd "$DOCKER_DIR"

# Create backup directory
mkdir -p "$DOCKER_DIR/backup" "$DOCKER_DIR/logs"

$COMPOSE build --pull
$COMPOSE up -d

# Wait for services to be healthy
echo "  Waiting for services to be ready..."
sleep 10
for i in $(seq 1 30); do
    if curl -sf http://localhost:3002/api/health >/dev/null 2>&1; then
        echo "  Backend healthy."
        break
    fi
    if [ $i -eq 30 ]; then
        echo "  WARNING: Backend did not become healthy within 5 minutes."
    fi
    sleep 10
done

# ---- Step 7: Initialize database ----
echo ""
echo "[7/7] Initializing database schema..."
docker exec temple-backend npx prisma db push --accept-data-loss --skip-generate 2>&1 | grep -v "^$" || echo "  DB push complete (check logs for details)"

# ---- Done ----
echo ""
echo "===== Deploy Complete ====="
echo ""
echo "  Site:  https://$DOMAIN"
echo "  Admin: https://$DOMAIN/admin"
echo ""
echo "  Save the deploy password to use with future updates:"
echo "    $DEPLOY_PASS"
echo ""
echo "  To update: cd $APP_DIR && ./deploy.sh --password 'your-password'"
echo ""
