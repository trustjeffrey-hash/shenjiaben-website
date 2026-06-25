"""
全自动数据采集引擎基类
所有采集器继承此基类，实现统一去重、异常重试、日志记录
"""
import hashlib
import logging
import time
import random
import requests
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from models.database import SessionLocal, CollectionLog

logger = logging.getLogger(__name__)


class BaseCollector:
    """数据采集器基类"""

    name = 'base'
    display_name = '基础采集器'

    def __init__(self):
        self.session = SessionLocal()
        self.start_time = None
        self.stats = {'total_fetched': 0, 'new_added': 0, 'duplicates': 0, 'errors': 0}

    def run(self):
        """执行采集（子类实现 _collect）"""
        self.start_time = datetime.utcnow()
        log = CollectionLog(
            collector_name=self.name,
            status='running',
            started_at=self.start_time,
        )
        self.session.add(log)
        self.session.commit()

        try:
            logger.info(f'[{self.display_name}] 开始采集...')
            self._collect()
            log.status = 'success'
            logger.info(f'[{self.display_name}] 采集完成: 新增{self.stats["new_added"]} 去重{self.stats["duplicates"]}')
        except Exception as e:
            log.status = 'failed'
            log.error_detail = str(e)[:500]
            self.stats['errors'] += 1
            logger.error(f'[{self.display_name}] 采集异常: {e}', exc_info=True)

        log.total_fetched = self.stats['total_fetched']
        log.new_added = self.stats['new_added']
        log.duplicates = self.stats['duplicates']
        log.errors = self.stats['errors']
        log.finished_at = datetime.utcnow()
        log.duration_seconds = (log.finished_at - self.start_time).total_seconds()
        self.session.commit()
        self.session.close()

    def _collect(self):
        """子类实现：采集逻辑"""
        raise NotImplementedError

    def fetch_url(self, url, headers=None, timeout=30):
        """安全 HTTP 请求，带重试和随机延迟"""
        default_headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9',
        }
        if headers:
            default_headers.update(headers)

        for attempt in range(3):
            try:
                time.sleep(random.uniform(1, 3))  # 随机延迟，防止被封
                resp = requests.get(url, headers=default_headers, timeout=timeout)
                resp.raise_for_status()
                resp.encoding = resp.apparent_encoding or 'utf-8'
                return resp
            except Exception as e:
                logger.warning(f'[{self.display_name}] 请求失败 (尝试 {attempt+1}/3): {url} - {e}')
                if attempt < 2:
                    time.sleep(5 * (attempt + 1))
        return None

    def make_hash(self, *args):
        """生成去重 hash"""
        content = '|'.join(str(a) for a in args)
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    def save_or_skip(self, model, data_hash, **kwargs):
        """保存数据，hash 重复则跳过"""
        kwargs['data_hash'] = data_hash
        try:
            obj = model(**kwargs)
            self.session.add(obj)
            self.session.commit()
            self.stats['new_added'] += 1
            return obj
        except IntegrityError:
            self.session.rollback()
            self.stats['duplicates'] += 1
            return None
