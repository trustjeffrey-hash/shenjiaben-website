"""
沈家本研究院官网 - API 主应用入口
"""
import os
import sys
import logging
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS

# 确保 backend 目录在 path 中
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import (
    DEBUG, SECRET_KEY, HOST, PORT, API_PREFIX,
    CORS_ORIGINS, LOG_DIR, LOG_LEVEL, COMPLIANCE
)
from models.database import init_db, SessionLocal

# ── 日志配置 ──────────────────────────────────────────
os.makedirs(LOG_DIR, exist_ok=True)
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(LOG_DIR, f'app_{datetime.now().strftime("%Y%m%d")}.log'), encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ── 创建应用 ──────────────────────────────────────────
app = Flask(__name__)
app.config['SECRET_KEY'] = SECRET_KEY
app.config['JSON_AS_ASCII'] = False  # 支持中文 JSON
app.config['JSONIFY_MIMETYPE'] = 'application/json; charset=utf-8'

CORS(app, resources={f'{API_PREFIX}/*': {'origins': CORS_ORIGINS}})

# ── 全局错误处理 ──────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({'code': 404, 'message': '接口不存在', 'data': None}), 404

@app.errorhandler(500)
def server_error(e):
    logger.error(f'Server error: {e}', exc_info=True)
    return jsonify({'code': 500, 'message': '服务器内部错误', 'data': None}), 500


# ══════════════════════════════════════════════════════
# 通用响应工具
# ══════════════════════════════════════════════════════
def api_response(data=None, message='success', code=200):
    return jsonify({'code': code, 'message': message, 'data': data})

def api_error(message='error', code=400):
    return jsonify({'code': code, 'message': message, 'data': None}), code

def paginated_response(items, total, page, page_size):
    return jsonify({
        'code': 200,
        'message': 'success',
        'data': {
            'items': items,
            'pagination': {
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size if page_size > 0 else 0
            }
        }
    })


# ══════════════════════════════════════════════════════
# 基础路由
# ══════════════════════════════════════════════════════
@app.route('/')
def index():
    return jsonify({
        'name': '沈家本研究院 API',
        'version': '1.0.0',
        'status': 'running',
        'docs': f'{API_PREFIX}/'
    })

@app.route(f'{API_PREFIX}/')
def api_index():
    return jsonify({
        'name': '沈家本研究院 API v1',
        'endpoints': {
            'home': f'{API_PREFIX}/home',
            'discipline': f'{API_PREFIX}/discipline',
            'legislation': f'{API_PREFIX}/legislation',
            'cases': f'{API_PREFIX}/cases',
            'policy': f'{API_PREFIX}/policy',
            'recruitment': f'{API_PREFIX}/recruitment',
            'admin': f'{API_PREFIX}/admin',
            'compliance': f'{API_PREFIX}/compliance',
        }
    })

@app.route(f'{API_PREFIX}/health')
def health():
    return api_response({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route(f'{API_PREFIX}/compliance')
def compliance():
    """合规信息接口 - 供前端页脚调用"""
    return api_response(COMPLIANCE)


# ══════════════════════════════════════════════════════
# 注册 API 蓝图
# ══════════════════════════════════════════════════════
from api.home import home_bp
from api.discipline import discipline_bp
from api.legislation import legislation_bp
from api.cases import cases_bp
from api.policy import policy_bp
from api.recruitment import recruitment_bp
from api.admin import admin_bp

app.register_blueprint(home_bp, url_prefix=API_PREFIX)
app.register_blueprint(discipline_bp, url_prefix=API_PREFIX)
app.register_blueprint(legislation_bp, url_prefix=API_PREFIX)
app.register_blueprint(cases_bp, url_prefix=API_PREFIX)
app.register_blueprint(policy_bp, url_prefix=API_PREFIX)
app.register_blueprint(recruitment_bp, url_prefix=API_PREFIX)
app.register_blueprint(admin_bp, url_prefix=API_PREFIX)


# ══════════════════════════════════════════════════════
# 启动入口
# ══════════════════════════════════════════════════════
if __name__ == '__main__':
    logger.info('初始化数据库...')
    init_db()
    logger.info('数据库初始化完成')

    logger.info(f'启动 API 服务: http://{HOST}:{PORT}')
    app.run(host=HOST, port=PORT, debug=DEBUG)
