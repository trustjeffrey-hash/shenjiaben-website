#!/bin/bash
# ══════════════════════════════════════════════════════════
# 沈家本研究院官网 - 一键部署脚本
# 在目标服务器（Ubuntu 20.04+/CentOS 7+）上执行
# ══════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ── 配置 ──────────────────────────────────────────────
DEPLOY_DIR="/var/www/shenjiaben"
DOMAIN="${1:-shenjiaben.org}"
PYTHON_VERSION="python3.10"

log_info "========================================="
log_info "  沈家本研究院官网 - 一键部署"
log_info "  目标域名: ${DOMAIN}"
log_info "========================================="

# ── 1. 系统依赖 ────────────────────────────────────────
log_info "1/6 安装系统依赖..."
if command -v apt &> /dev/null; then
    sudo apt update -qq
    sudo apt install -y -qq nginx certbot python3-certbot-nginx \
        python3 python3-pip python3-venv supervisor
elif command -v yum &> /dev/null; then
    sudo yum install -y epel-release
    sudo yum install -y nginx certbot python3-certbot-nginx \
        python3 python3-pip
fi

# ── 2. 部署代码 ────────────────────────────────────────
log_info "2/6 部署项目代码..."
sudo mkdir -p ${DEPLOY_DIR}
sudo cp -r src/ backend/ data/ run.py requirements.txt ${DEPLOY_DIR}/
sudo chown -R www-data:www-data ${DEPLOY_DIR}

# ── 3. Python 虚拟环境 ─────────────────────────────────
log_info "3/6 创建 Python 虚拟环境..."
cd ${DEPLOY_DIR}
sudo -u www-data ${PYTHON_VERSION} -m venv venv
sudo -u www-data venv/bin/pip install --upgrade pip -q
sudo -u www-data venv/bin/pip install -r src/backend/requirements.txt -q

# ── 4. 初始化数据 ──────────────────────────────────────
log_info "4/6 初始化数据库和种子数据..."
sudo -u www-data venv/bin/python run.py --seed-only

# ── 5. Nginx 配置 ──────────────────────────────────────
log_info "5/6 配置 Nginx..."
sudo cp deploy/nginx.conf /etc/nginx/conf.d/shenjiaben.conf
sudo nginx -t && sudo systemctl reload nginx

# ── 6. 启动服务 ────────────────────────────────────────
log_info "6/6 启动 API 服务..."
sudo cp deploy/shenjiaben.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable shenjiaben
sudo systemctl restart shenjiaben

# ── HTTPS ──────────────────────────────────────────────
log_warn "是否配置 HTTPS? (y/n)"
read -r answer
if [ "$answer" = "y" ]; then
    log_info "配置 HTTPS (Let's Encrypt)..."
    sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos -m admin@${DOMAIN}
    log_info "HTTPS 证书已配置，自动续期已启用"
fi

log_info "========================================="
log_info "  部署完成!"
log_info "  网站地址: https://${DOMAIN}"
log_info "  API 地址: https://${DOMAIN}/api/v1/"
log_info "  管理后台: https://${DOMAIN}/admin/"
log_info "  默认管理员: admin / shenjiaben2026"
log_info "========================================="
