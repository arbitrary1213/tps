#!/bin/bash
set -e

# 仙顶寺首次部署脚本
# 用于新服务器首次部署

echo "===== 仙顶寺智慧管理系统 - 首次部署 ====="

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then
    echo "请使用 root 权限运行: sudo $0"
    exit 1
fi

APP_DIR="/opt/temple-os"

echo "[1/5] 安装 Docker..."
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

echo "[2/5] 安装 Docker Compose..."
apt update && apt install -y docker-compose

echo "[3/5] 创建应用目录..."
mkdir -p $APP_DIR
cd $APP_DIR

echo "[4/5] 上传代码..."
# 如果使用 git
# git clone <repo_url> .

# 如果手动上传，解压
# tar -xzf temple-os.tar.gz

echo "[5/5] 设置权限..."
chmod 755 docker/*.sh 2>/dev/null || true
chmod +x deploy.sh

echo ""
echo "===== 首次部署准备完成 ====="
echo ""
echo "请执行以下步骤："
echo "1. 确保代码已上传到 $APP_DIR"
echo "2. 配置 SSL 证书: $APP_DIR/docker/ssl/"
echo "3. 运行部署: cd $APP_DIR && ./deploy.sh"