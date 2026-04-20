#!/bin/bash
set -e

# 仙顶寺部署脚本
# 用法: ./deploy.sh

APP_DIR="/opt/temple-os"
BACKUP_DIR="$APP_DIR/backup"
DATE=$(date +%Y%m%d_%H%M%S)

echo "===== 仙顶寺智慧管理系统部署 ====="

# 备份函数
backup_db() {
    echo "[1/6] 备份数据库..."
    mkdir -p $BACKUP_DIR
    docker exec temple-db pg_dump -U postgres temple_os > $BACKUP_DIR/db_backup_$DATE.sql 2>/dev/null || true
}

# 拉取代码
pull_code() {
    echo "[2/6] 拉取最新代码..."
    cd $APP_DIR
    git pull origin main
}

# 构建镜像
build_images() {
    echo "[3/6] 构建 Docker 镜像..."
    cd $APP_DIR/docker
    docker-compose build --no-cache
}

# 更新数据库
update_db() {
    echo "[4/6] 更新数据库结构..."
    docker exec temple-backend npx prisma db push --skip-generate 2>/dev/null || true
    docker exec temple-backend npx prisma generate 2>/dev/null || true
}

# 重启服务
restart_services() {
    echo "[5/6] 重启服务..."
    cd $APP_DIR/docker
    docker-compose down
    docker-compose up -d
}

# 验证
verify() {
    echo "[6/6] 验证服务..."
    sleep 5
    if curl -sf http://localhost:3000 > /dev/null; then
        echo "✓ 前端正常"
    else
        echo "✗ 前端异常"
    fi
    if curl -sf http://localhost:3002/api/health > /dev/null; then
        echo "✓ 后端正常"
    else
        echo "✗ 后端异常"
    fi
}

backup_db
pull_code
build_images
update_db
restart_services
verify

echo "===== 部署完成 ====="