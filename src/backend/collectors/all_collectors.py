"""
立法追踪 + 案件评析 + 司法政策 + 法律招聘 数据采集器集合
"""
import logging
import json
import random
from datetime import datetime, timedelta
from collectors.base import BaseCollector
from models.database import LegislationProject, JudicialCase, JudicialPolicy, LegalRecruitment

logger = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════
# 1. 立法项目采集器
# ══════════════════════════════════════════════════════
class LegislationCollector(BaseCollector):
    name = 'legislation'
    display_name = '立法追踪采集器'

    SOURCES = [
        {
            'name': '中国人大网立法工作',
            'url': 'http://www.npc.gov.cn/npc/c2/c30834/pc_list.shtml',
            'type': 'html_list',
        },
    ]

    def _collect(self):
        for source in self.SOURCES:
            try:
                resp = self.fetch_url(source['url'])
                if not resp:
                    continue
                # 解析逻辑（根据实际页面结构调整）
                self.stats['total_fetched'] += 0  # 实际解析时更新
            except Exception as e:
                logger.warning(f'立法数据采集失败 [{source["name"]}]: {e}')


# ══════════════════════════════════════════════════════
# 2. 案件评析采集器
# ══════════════════════════════════════════════════════
class CasesCollector(BaseCollector):
    name = 'cases'
    display_name = '案件评析采集器'

    SOURCES = [
        {
            'name': '最高人民法院典型案例',
            'url': 'https://www.court.gov.cn/zixun-gengduo-104.html',
            'type': 'html_list',
        },
    ]

    def _collect(self):
        for source in self.SOURCES:
            try:
                resp = self.fetch_url(source['url'])
                if not resp:
                    continue
            except Exception as e:
                logger.warning(f'案件数据采集失败 [{source["name"]}]: {e}')


# ══════════════════════════════════════════════════════
# 3. 司法政策采集器
# ══════════════════════════════════════════════════════
class PolicyCollector(BaseCollector):
    name = 'policy'
    display_name = '司法政策采集器'

    SOURCES = [
        {
            'name': '最高人民法院司法解释',
            'url': 'https://www.court.gov.cn/fabu-gengduo-16.html',
            'type': 'html_list',
        },
        {
            'name': '最高人民检察院',
            'url': 'https://www.spp.gov.cn/spp/flfgk/index.shtml',
            'type': 'html_list',
        },
    ]

    def _collect(self):
        for source in self.SOURCES:
            try:
                resp = self.fetch_url(source['url'])
                if not resp:
                    continue
            except Exception as e:
                logger.warning(f'政策数据采集失败 [{source["name"]}]: {e}')


# ══════════════════════════════════════════════════════
# 4. 法律招聘采集器
# ══════════════════════════════════════════════════════
class RecruitmentCollector(BaseCollector):
    name = 'recruitment'
    display_name = '法律招聘采集器'

    SOURCES = [
        {
            'name': '法律招聘公众号聚合',
            'url': 'https://weixin.sogou.com/weixin?type=2&query=法律招聘',
            'type': 'wechat_search',
        },
    ]

    def _collect(self):
        for source in self.SOURCES:
            try:
                resp = self.fetch_url(source['url'])
                if not resp:
                    continue
            except Exception as e:
                logger.warning(f'招聘数据采集失败 [{source["name"]}]: {e}')


# ══════════════════════════════════════════════════════
# 种子数据生成器
# ══════════════════════════════════════════════════════
def seed_all_data():
    """生成全部种子数据"""
    seed_legislation_data()
    seed_cases_data()
    seed_policy_data()
    seed_recruitment_data()
    logger.info('全部种子数据生成完成')


def seed_legislation_data():
    from models.database import SessionLocal, init_db
    init_db()
    db = SessionLocal()
    if db.query(LegislationProject).count() > 0:
        db.close()
        return

    projects = [
        {'title': '《中华人民共和国民营经济促进法》', 'stage': '审议中', 'category': '经济法',
         'body': '全国人大常委会法工委', 'summary': '为促进民营经济发展壮大提供法治保障，确立民营经济平等地位'},
        {'title': '《中华人民共和国金融稳定法》', 'stage': '公开征求意见', 'category': '金融法',
         'body': '中国人民银行', 'summary': '建立金融稳定保障体系，防范化解系统性金融风险'},
        {'title': '《中华人民共和国数据安全法实施条例》', 'stage': '起草中', 'category': '行政法',
         'body': '国家互联网信息办公室', 'summary': '细化数据安全法执行标准，规范数据处理活动'},
        {'title': '《中华人民共和国人工智能法》', 'stage': '立法建议', 'category': '科技法',
         'body': '国务院', 'summary': '规范人工智能研发应用，保障公民权益和数据安全'},
        {'title': '《中华人民共和国增值税法实施条例》', 'stage': '已通过', 'category': '财税法',
         'body': '财政部、国家税务总局', 'summary': '落实增值税法具体执行细则'},
        {'title': '《中华人民共和国反洗钱法（修订）》', 'stage': '修订中', 'category': '金融法',
         'body': '中国人民银行', 'summary': '适应国际反洗钱标准变化，强化金融机构反洗钱义务'},
        {'title': '《中华人民共和国公司法司法解释（五）》', 'stage': '已公布', 'category': '司法解释',
         'body': '最高人民法院', 'summary': '针对公司纠纷案件审理中的法律适用问题作出解释'},
        {'title': '《中华人民共和国治安管理处罚法（修订）》', 'stage': '审议中', 'category': '行政法',
         'body': '全国人大常委会', 'summary': '优化治安管理处罚程序，加强人权保障'},
        {'title': '《中华人民共和国农村集体经济组织法》', 'stage': '已生效', 'category': '经济法',
         'body': '全国人大常委会', 'summary': '规范农村集体经济组织运行管理'},
        {'title': '《中华人民共和国慈善法实施条例》', 'stage': '起草中', 'category': '社会法',
         'body': '民政部', 'summary': '落实慈善法配套措施，规范慈善组织运作'},
        {'title': '《中华人民共和国矿产资源法（修订）》', 'stage': '公开征求意见', 'category': '经济法',
         'body': '自然资源部', 'summary': '完善矿业权管理制度，促进资源合理利用'},
        {'title': '《中华人民共和国商标法修订草案》', 'stage': '立法建议', 'category': '知识产权法',
         'body': '国家知识产权局', 'summary': '加强商标保护力度，打击恶意注册'},
    ]

    stages = ['立法建议', '起草中', '审议中', '公开征求意见', '已通过', '已公布', '已生效', '修订中']
    collector = LegislationCollector()

    for i, p in enumerate(projects):
        date = datetime(2024, random.randint(1, 6), random.randint(1, 28))
        timeline = [
            {'date': (date - timedelta(days=90)).strftime('%Y-%m-%d'), 'event': '项目提出'},
            {'date': (date - timedelta(days=60)).strftime('%Y-%m-%d'), 'event': '列入立法计划'},
            {'date': (date - timedelta(days=30)).strftime('%Y-%m-%d'), 'event': f'进入{p["stage"]}阶段'},
        ]
        data_hash = collector.make_hash(p['title'], p['stage'])
        try:
            db.add(LegislationProject(
                title=p['title'], stage=p['stage'], category=p['category'],
                proposing_body=p['body'], summary=p['summary'],
                draft_date=date - timedelta(days=random.randint(60, 180)),
                public_comment_start=date if p['stage'] == '公开征求意见' else None,
                passed_date=date if p['stage'] in ['已通过', '已公布', '已生效'] else None,
                effective_date=date + timedelta(days=30) if p['stage'] == '已生效' else None,
                timeline_json=json.dumps(timeline, ensure_ascii=False),
                old_text=f'修订前{p["title"]}条款原文...' if p['stage'] == '修订中' else '',
                new_text=f'修订后{p["title"]}条款草案...' if p['stage'] == '修订中' else '',
                source_url='http://www.npc.gov.cn/', source_name='中国人大网',
                data_hash=data_hash,
            ))
        except Exception:
            db.rollback()
    db.commit()
    logger.info(f'立法种子数据: {db.query(LegislationProject).count()} 条')
    db.close()


def seed_cases_data():
    from models.database import SessionLocal, init_db
    init_db()
    db = SessionLocal()
    if db.query(JudicialCase).count() > 0:
        db.close()
        return

    cases_data = [
        {'title': '某科技公司诉某数据平台不正当竞争纠纷案', 'type': '民事', 'cause': '不正当竞争纠纷',
         'stage': '二审判决', 'court': '北京知识产权法院', 'hot': True,
         'summary': '涉及数据爬取行为的法律边界认定，对互联网行业数据权益保护具有示范意义。'},
        {'title': '张某等人特大跨境电信网络诈骗案', 'type': '刑事', 'cause': '诈骗罪',
         'stage': '已结案', 'court': '浙江省高级人民法院', 'hot': True,
         'summary': '涉案金额逾5亿元，涉及东南亚多个国家，法院认定主犯构成诈骗罪。'},
        {'title': '某环保组织诉某化工厂环境污染公益诉讼案', 'type': '民事', 'cause': '环境污染责任纠纷',
         'stage': '一审判决', 'court': '江苏省南京市中级人民法院', 'hot': False,
         'summary': '检察机关支持起诉的环境民事公益诉讼典型案例。'},
        {'title': '李某诉某市人民政府行政征收决定违法案', 'type': '行政', 'cause': '行政征收',
         'stage': '再审', 'court': '最高人民法院', 'hot': True,
         'summary': '涉及集体土地征收补偿标准的司法审查标准。'},
        {'title': '某股份有限公司证券虚假陈述责任纠纷系列案', 'type': '民事', 'cause': '证券虚假陈述',
         'stage': '审理中', 'court': '上海金融法院', 'hot': True,
         'summary': '代表人诉讼机制在证券纠纷领域的创新应用。'},
        {'title': '王某故意伤害致人死亡案', 'type': '刑事', 'cause': '故意伤害罪',
         'stage': '一审判决', 'court': '广东省深圳市中级人民法院', 'hot': False,
         'summary': '正当防卫与防卫过当的界限认定。'},
        {'title': '某互联网公司与员工竞业限制纠纷案', 'type': '民事', 'cause': '竞业限制纠纷',
         'stage': '二审判决', 'court': '北京市第一中级人民法院', 'hot': False,
         'summary': '竞业限制补偿金标准与范围的司法认定。'},
        {'title': '某外资企业税务行政复议及诉讼案', 'type': '行政', 'cause': '税务行政',
         'stage': '已结案', 'court': '北京市高级人民法院', 'hot': False,
         'summary': '转让定价调整中的举证责任分配。'},
        {'title': '刘某等人侵犯公民个人信息案', 'type': '刑事', 'cause': '侵犯公民个人信息罪',
         'stage': '已结案', 'court': '上海市第一中级人民法院', 'hot': True,
         'summary': '大规模倒卖个人信息的定罪量刑标准。'},
        {'title': '某房地产公司破产重整案', 'type': '民事', 'cause': '破产重整',
         'stage': '审理中', 'court': '广东省广州市中级人民法院', 'hot': False,
         'summary': '大型房企破产重整中的债权人保护机制。'},
    ]

    stage_options = ['已立案', '审理中', '一审判决', '二审判决', '再审', '已结案']
    collector = CasesCollector()

    for i, c in enumerate(cases_data):
        ruling_date = datetime(2024, random.randint(1, 6), random.randint(1, 28))
        filing_date = ruling_date - timedelta(days=random.randint(30, 365))
        data_hash = collector.make_hash(c['title'], c['court'])
        try:
            db.add(JudicialCase(
                case_title=c['title'], case_number=f'（2024）{c["court"][:2]}法{random.randint(100, 999)}号',
                case_type=c['type'], cause_of_action=c['cause'],
                stage=c['stage'], court=c['court'],
                filing_date=filing_date, ruling_date=ruling_date,
                case_summary=c['summary'],
                ruling_points=f'裁判要点：{c["summary"]}',
                tags=','.join(random.sample(['典型案例', '指导案例', '社会关注', '新类型'], 2)),
                is_hot=c['hot'], view_count=random.randint(100, 5000),
                source_url='https://wenshu.court.gov.cn/', source_name='中国裁判文书网',
                data_hash=data_hash,
            ))
        except Exception:
            db.rollback()
    db.commit()
    logger.info(f'案件种子数据: {db.query(JudicialCase).count()} 条')
    db.close()


def seed_policy_data():
    from models.database import SessionLocal, init_db
    init_db()
    db = SessionLocal()
    if db.query(JudicialPolicy).count() > 0:
        db.close()
        return

    policies = [
        {'title': '最高人民法院关于适用《中华人民共和国民法典》合同编通则若干问题的解释', 'category': '司法解释',
         'body': '最高人民法院', 'is_guiding': False},
        {'title': '最高人民法院关于审理证券市场虚假陈述侵权民事赔偿案件的若干规定', 'category': '司法解释',
         'body': '最高人民法院', 'is_guiding': False},
        {'title': '最高人民检察院关于加强新时代检察机关法律监督工作的意见', 'category': '指导意见',
         'body': '最高人民检察院', 'is_guiding': False},
        {'title': '最高人民法院 最高人民检察院关于办理侵犯知识产权刑事案件适用法律若干问题的解释', 'category': '司法解释',
         'body': '最高人民法院、最高人民检察院', 'is_guiding': False},
        {'title': '最高人民法院第37批指导性案例', 'category': '指导案例', 'body': '最高人民法院', 'is_guiding': True},
        {'title': '司法部关于进一步规范律师服务收费的意见', 'category': '指导意见', 'body': '司法部', 'is_guiding': False},
        {'title': '最高人民检察院第四十五批指导性案例', 'category': '指导案例', 'body': '最高人民检察院', 'is_guiding': True},
        {'title': '最高人民法院关于加强和规范裁判文书释法说理的指导意见', 'category': '指导意见', 'body': '最高人民法院', 'is_guiding': False},
        {'title': '关于依法惩治网络暴力违法犯罪的指导意见', 'category': '指导意见',
         'body': '最高人民法院、最高人民检察院、公安部', 'is_guiding': False},
        {'title': '最高人民法院第38批指导性案例——环境公益诉讼专题', 'category': '指导案例',
         'body': '最高人民法院', 'is_guiding': True},
    ]

    collector = PolicyCollector()
    for i, p in enumerate(policies):
        pub_date = datetime(2024, random.randint(1, 6), random.randint(1, 28))
        data_hash = collector.make_hash(p['title'], p['body'], pub_date.isoformat())
        try:
            db.add(JudicialPolicy(
                title=p['title'],
                doc_number=f'法释〔2024〕{random.randint(1,20)}号',
                category=p['category'], issuing_body=p['body'],
                publish_date=pub_date,
                effective_date=pub_date + timedelta(days=30),
                summary=f'{p["title"]}的要点概述...',
                source_url='https://www.court.gov.cn/', source_name=p['body'],
                is_guiding_case=p['is_guiding'],
                data_hash=data_hash,
            ))
        except Exception:
            db.rollback()
    db.commit()
    logger.info(f'政策种子数据: {db.query(JudicialPolicy).count()} 条')
    db.close()


def seed_recruitment_data():
    from models.database import SessionLocal, init_db
    init_db()
    db = SessionLocal()
    if db.query(LegalRecruitment).count() > 0:
        db.close()
        return

    cities = ['北京', '上海', '深圳', '广州', '杭州', '成都', '南京', '武汉', '西安', '重庆']
    job_types = ['律师', '法务', '合规', '知识产权', '实习律师', '律师助理', '法律顾问']
    salaries = ['8K-12K', '12K-20K', '20K-35K', '35K-50K', '50K-80K', '面议']
    companies = ['金杜律师事务所', '中伦律师事务所', '君合律师事务所', '腾讯法务部', '阿里巴巴法务部',
                 '字节跳动法务部', '华为法务部', '美团法务部', '方达律师事务所', '海问律师事务所']
    wechat_accounts = ['法律招聘', '律所直聘', '法律求职', '法务招聘', 'LegalCareer']

    collector = RecruitmentCollector()
    for i in range(50):
        city = random.choice(cities)
        job_type = random.choice(job_types)
        company = random.choice(companies)
        pub_date = datetime(2024, random.randint(1, 6), random.randint(1, 28))

        data_hash = collector.make_hash(
            f'{company}{job_type}{city}', pub_date.isoformat()
        )
        title = f'【{city}】{company}招聘{job_type}'
        try:
            db.add(LegalRecruitment(
                title=title, company=company, city=city,
                job_type=job_type, salary_range=random.choice(salaries),
                experience=random.choice(['1-3年', '3-5年', '5年以上', '不限']),
                education=random.choice(['本科', '硕士', '博士', '不限']),
                description=f'{company}现面向社会公开招聘{job_type}，工作地点{city}，'
                           f'要求法学专业背景，具有良好的法律专业素养和团队协作能力。',
                requirements='1. 法学本科及以上学历\n2. 通过法律职业资格考试\n3. 具有良好的沟通能力',
                wechat_account=random.choice(wechat_accounts),
                wechat_article_url=f'https://mp.weixin.qq.com/s/demo_{i}',
                original_url=f'https://www.zhipin.com/job_detail/demo_{i}.html',
                publish_date=pub_date,
                is_active=True,
                data_hash=data_hash,
            ))
            if i % 10 == 0:
                db.commit()
        except Exception:
            db.rollback()
    db.commit()
    logger.info(f'招聘种子数据: {db.query(LegalRecruitment).count()} 条')
    db.close()
