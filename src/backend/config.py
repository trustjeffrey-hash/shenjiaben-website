"""
沈家本研究院官网 - 全局配置文件
"""
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

# ── 基础配置 ──────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))
DATA_DIR = os.path.join(PROJECT_ROOT, 'data')

DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'
SECRET_KEY = os.getenv('SECRET_KEY', 'shenjiaben-institute-2026-secret-key-change-in-production')

# ── 数据库 ────────────────────────────────────────────
DATABASE_URL = os.getenv('DATABASE_URL', f'sqlite:///{os.path.join(DATA_DIR, "shenjiaben.db")}')

# ── 服务器 ────────────────────────────────────────────
HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', 5000))

# ── API 配置 ──────────────────────────────────────────
API_PREFIX = '/api/v1'
PAGE_SIZE_DEFAULT = 20
PAGE_SIZE_MAX = 100

# ── 数据采集配置 ──────────────────────────────────────
COLLECTOR_USER_AGENT = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
)
COLLECTOR_REQUEST_TIMEOUT = 30
COLLECTOR_RETRY_TIMES = 3
COLLECTOR_RETRY_DELAY = 5

# 采集间隔（小时）
COLLECTOR_INTERVALS = {
    'discipline': 6,      # 律师处罚 - 每6小时
    'legislation': 12,     # 立法追踪 - 每12小时
    'cases': 8,            # 案件评析 - 每8小时
    'policy': 12,          # 司法政策 - 每12小时
    'recruitment': 4,      # 法律招聘 - 每4小时
}

# ── 日志 ──────────────────────────────────────────────
LOG_DIR = os.path.join(PROJECT_ROOT, 'data', 'logs')
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

# ── CORS ──────────────────────────────────────────────
CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*')

# ── 合规声明 ──────────────────────────────────────────
COMPLIANCE = {
    'icp': os.getenv('ICP_NUMBER', 'ICP备案号：待备案'),
    'copyright': f'© {os.getenv("COPYRIGHT_YEAR", "2026")} 沈家本研究院 版权所有',
    'data_source': '本平台所有公开数据均取自国家机关、律协、人大、官方公众号公开公示内容，仅作公益学术信息聚合检索',
    'disclaimer': '本站数据不构成任何法律建议，仅供学术研究参考',
    'feedback_email': os.getenv('FEEDBACK_EMAIL', 'feedback@shenjiaben.org'),
}
