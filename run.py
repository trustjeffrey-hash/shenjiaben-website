"""
启动入口 - API 服务 + 采集调度器
用法: python run.py [--collect-only]
"""
import os
import sys
import logging
import argparse

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'backend'))

from config import HOST, PORT, DEBUG
from models.database import init_db

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger('run')


def main():
    parser = argparse.ArgumentParser(description='沈家本研究院官网 - 后端服务')
    parser.add_argument('--collect-only', action='store_true', help='仅运行一次数据采集')
    parser.add_argument('--seed-only', action='store_true', help='仅生成种子数据')
    parser.add_argument('--no-collector', action='store_true', help='不启动定时采集器')
    args = parser.parse_args()

    # 初始化数据库
    init_db()
    logger.info('数据库初始化完成')

    if args.seed_only:
        from collectors.discipline import seed_discipline_data
        from collectors.all_collectors import seed_all_data
        seed_discipline_data()
        seed_all_data()
        logger.info('种子数据生成完成')
        return

    if args.collect_only:
        from collectors.scheduler import run_once
        run_once()
        return

    # 启动定时采集器
    if not args.no_collector:
        from collectors.scheduler import start_scheduler
        start_scheduler()

    # 启动 API 服务
    from app import app
    logger.info(f'========================================')
    logger.info(f'  沈家本研究院 API 服务')
    logger.info(f'  地址: http://{HOST}:{PORT}')
    logger.info(f'  API: http://{HOST}:{PORT}/api/v1/')
    logger.info(f'========================================')

    try:
        app.run(host=HOST, port=PORT, debug=DEBUG, use_reloader=False)
    except KeyboardInterrupt:
        logger.info('收到中断信号，正在停止服务...')
        from collectors.scheduler import stop_scheduler
        stop_scheduler()


if __name__ == '__main__':
    main()
