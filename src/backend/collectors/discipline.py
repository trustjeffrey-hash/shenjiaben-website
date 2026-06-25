"""
律师行政处罚数据采集器
数据源：司法部律师工作局 / 各省律协公示
"""
import logging
from datetime import datetime
from bs4 import BeautifulSoup
from collectors.base import BaseCollector
from models.database import LawyerDiscipline

logger = logging.getLogger(__name__)


class DisciplineCollector(BaseCollector):
    name = 'discipline'
    display_name = '律师处罚采集器'

    # 数据源配置（实际部署时更新真实URL）
    SOURCES = [
        {
            'name': '全国律协处分公告',
            'url': 'https://www.acla.org.cn/col/col98/index.html',
            'type': 'html_list',
        },
        # 更多数据源...
    ]

    def _collect(self):
        """采集逻辑：尝试从多个数据源抓取处罚数据"""
        for source in self.SOURCES:
            try:
                self._fetch_source(source)
            except Exception as e:
                logger.warning(f'数据源采集失败 [{source["name"]}]: {e}')

    def _fetch_source(self, source):
        """从单个数据源抓取"""
        resp = self.fetch_url(source['url'])
        if not resp:
            return

        soup = BeautifulSoup(resp.text, 'lxml')
        # 解析逻辑根据实际页面结构调整
        # 这里提供框架结构，实际 DOM 解析需要根据目标网站适配
        items = self._parse_discipline_list(soup, source)
        self.stats['total_fetched'] += len(items)

        for item in items:
            data_hash = self.make_hash(
                item.get('lawyer_name', ''),
                item.get('law_firm', ''),
                item.get('discipline_date', ''),
                item.get('discipline_type', ''),
            )
            self.save_or_skip(
                LawyerDiscipline,
                data_hash,
                lawyer_name=item.get('lawyer_name', '未知'),
                law_firm=item.get('law_firm', '未知'),
                firm_province=item.get('firm_province', ''),
                firm_city=item.get('firm_city', ''),
                discipline_type=item.get('discipline_type', '其他'),
                discipline_date=item.get('discipline_date', datetime.utcnow()),
                discipline_org=item.get('discipline_org', source['name']),
                violation_detail=item.get('violation_detail', ''),
                punishment_basis=item.get('punishment_basis', ''),
                source_url=item.get('source_url', ''),
                source_name=source['name'],
            )

    def _parse_discipline_list(self, soup, source):
        """解析页面列表（框架方法，需根据实际HTML适配）"""
        items = []
        # 通用解析逻辑——尝试常见列表结构
        # 适配律协官网的典型公告列表结构
        for li in soup.select('ul.list li, .news-list li, .article-list .item'):
            try:
                title_el = li.select_one('a, .title')
                date_el = li.select_one('.date, .time, span.time')
                title = title_el.get_text(strip=True) if title_el else ''
                date_str = date_el.get_text(strip=True) if date_el else ''

                # 从标题提取律师名、律所、处分类型（NLP规则）
                parsed = self._parse_title(title)
                if parsed:
                    parsed['source_url'] = title_el.get('href', '') if title_el else ''
                    items.append(parsed)
            except Exception:
                continue
        return items

    def _parse_title(self, title):
        """从标题中提取结构化信息"""
        # 示例标题格式：「关于对XX律师事务所张三律师予以警告处分的通报」
        # 实际需要根据数据源调整解析规则
        if not title:
            return None
        return {
            'lawyer_name': '待解析',
            'law_firm': '待解析',
            'discipline_type': '其他',
            'violation_detail': title,
        }


# ── 种子数据生成器（测试/演示用） ──────────────────────
def seed_discipline_data():
    """生成演示种子数据，供开发测试"""
    from models.database import SessionLocal, init_db
    init_db()
    db = SessionLocal()

    # 检查是否已有数据
    existing = db.query(LawyerDiscipline).count()
    if existing > 0:
        logger.info(f'律师处罚数据已存在 ({existing} 条)，跳过种子数据生成')
        db.close()
        return

    import random
    provinces = ['北京', '上海', '广东', '浙江', '江苏', '山东', '四川', '湖北', '河南', '福建',
                 '湖南', '安徽', '辽宁', '重庆', '天津', '陕西', '河北', '江西', '广西', '云南']
    types = ['警告', '通报批评', '公开谴责', '停止执业', '吊销执业证书', '罚款']
    firms = ['中伦律师事务所', '金杜律师事务所', '君合律师事务所', '方达律师事务所',
             '海问律师事务所', '竞天公诚律师事务所', '通商律师事务所', '环球律师事务所',
             '大成律师事务所', '盈科律师事务所', '国浩律师事务所', '锦天城律师事务所']
    surnames = '张李王刘陈杨赵黄周吴徐孙马胡朱郭何罗高林郑梁谢唐许冯宋韩邓彭曹曾田萧潘袁蔡蒋余于杜叶程魏苏吕丁任卢姚沈钟姜崔谭陆范汪廖石金韦贾夏付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武莫孔汤'

    collector = DisciplineCollector()
    for i in range(80):
        name = random.choice(surnames) + random.choice(surnames)
        firm = random.choice(firms)
        province = random.choice(provinces)
        dtype = random.choice(types)
        ddate = datetime(2024, random.randint(1, 12), random.randint(1, 28),
                         random.randint(0, 23), random.randint(0, 59))

        data_hash = collector.make_hash(name, firm, ddate.isoformat(), dtype)
        try:
            db.add(LawyerDiscipline(
                lawyer_name=name, law_firm=firm,
                firm_province=province, firm_city=province + '市',
                discipline_type=dtype, discipline_date=ddate,
                discipline_org=province + '律师协会',
                violation_detail=f'{name}律师在执业过程中存在违反《律师法》及律师执业规范的行为，经{province}律师协会调查核实后作出上述处分决定。',
                punishment_basis='《律师法》第四十九条、《律师协会会员违规行为处分规则》',
                source_url=f'https://www.acla.org.cn/', source_name='全国律协',
                data_hash=data_hash,
            ))
            if i % 20 == 0:
                db.commit()
        except Exception:
            db.rollback()

    db.commit()
    logger.info(f'律师处罚种子数据生成完成: {db.query(LawyerDiscipline).count()} 条')
    db.close()
