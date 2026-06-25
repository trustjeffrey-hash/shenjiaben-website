"""
定时采集调度器 + 启动管理
"""
import os
import sys
import logging
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from config import COLLECTOR_INTERVALS, DATA_DIR, LOG_DIR
from models.database import init_db
from collectors.discipline import DisciplineCollector, seed_discipline_data
from collectors.all_collectors import (
    LegislationCollector, CasesCollector, PolicyCollector,
    RecruitmentCollector, seed_all_data
)

logger = logging.getLogger(__name__)

os.makedirs(LOG_DIR, exist_ok=True)

# 调度器实例
scheduler = BackgroundScheduler(timezone='Asia/Shanghai')


def start_scheduler():
    """启动所有定时采集任务"""
    logger.info('=' * 60)
    logger.info('沈家本研究院数据采集引擎启动')

    # 初始化数据库
    init_db()

    # 检查是否需要生成种子数据
    _ensure_seed_data()

    # 注册采集任务
    collectors = {
        'discipline': (DisciplineCollector, '律师处罚采集'),
        'legislation': (LegislationCollector, '立法追踪采集'),
        'cases': (CasesCollector, '案件评析采集'),
        'policy': (PolicyCollector, '司法政策采集'),
        'recruitment': (RecruitmentCollector, '法律招聘采集'),
    }

    for name, (cls, label) in collectors.items():
        interval_hours = COLLECTOR_INTERVALS.get(name, 24)
        scheduler.add_job(
            func=lambda c=cls: c().run(),
            trigger=IntervalTrigger(hours=interval_hours),
            id=f'collector_{name}',
            name=label,
            replace_existing=True,
            misfire_grace_time=3600,
        )
        logger.info(f'  ✓ {label}: 每 {interval_hours} 小时执行')

    scheduler.start()
    logger.info(f'全部 {len(collectors)} 项采集任务已注册')
    logger.info('=' * 60)


def stop_scheduler():
    """停止调度器"""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info('采集调度器已停止')


def _ensure_seed_data():
    """首次运行时生成种子数据"""
    marker_file = os.path.join(DATA_DIR, '.seed_done')
    if not os.path.exists(marker_file):
        logger.info('首次运行，生成种子数据...')
        try:
            seed_discipline_data()
            seed_all_data()
            with open(marker_file, 'w') as f:
                f.write('done')
            logger.info('种子数据生成完成')
        except Exception as e:
            logger.error(f'种子数据生成失败: {e}')


def run_once():
    """立即执行一次全部采集（调试/手动触发用）"""
    logger.info('手动触发全量采集...')
    for cls in [DisciplineCollector, LegislationCollector, CasesCollector,
                PolicyCollector, RecruitmentCollector]:
        try:
            cls().run()
        except Exception as e:
            logger.error(f'{cls.__name__} 执行失败: {e}')
    logger.info('全量采集完成')
