#!/bin/bash
set -e

echo "=========================================================="
echo "    LibraryHub 智能图书借阅管理系统 - 自动化部署脚本     "
echo "=========================================================="

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "【错误】检测到当前服务器未安装 Docker，请先安装 Docker 和 Docker Compose！"
    echo "Ubuntu/Debian 快捷安装: curl -fsSL https://get.docker.com | bash"
    exit 1
fi

# 检查 Docker Compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "【错误】未找到 docker compose 命令，请安装 docker-compose-plugin！"
    exit 1
fi

echo ">> 1. 停止旧容器服务 (如果存在)..."
$DOCKER_COMPOSE_CMD down || true

echo ">> 2. 开始构建前后端 Docker 镜像并启动容器..."
$DOCKER_COMPOSE_CMD up -d --build

echo ">> 3. 正在等待后端服务启动与数据库就绪..."
sleep 5

echo ">> 4. 检查服务健康状态..."
$DOCKER_COMPOSE_CMD ps

# 获取服务器 IP (Linux / Mac 兼容)
SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "your-server-ip")

echo "=========================================================="
echo "【部署成功】LibraryHub 系统已在服务器上成功上线！"
echo ""
echo "系统访问地址: http://${SERVER_IP}:8080"
echo "API 接口文档: http://${SERVER_IP}:8080/api/v1/docs"
echo ""
echo "预设体验账号："
echo "1. 系统管理员：账号 admin     / 密码 admin123"
echo "2. 图书管理员：账号 librarian / 密码 lib123"
echo "3. 普通读者：  账号 reader    / 密码 reader123"
echo "=========================================================="
