"""
沈家本研究院官网 - 数据库模型 (SQLAlchemy ORM)
"""
import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, Float, DateTime, Boolean, Enum as SAEnum
from sqlalchemy.orm import declarative_base, sessionmaker
import enum

from config import DATABASE_URL, DATA_DIR

os.makedirs(DATA_DIR, exist_ok=True)

engine = create_engine(DATABASE_URL, echo=False, connect_args={'check_same_thread': False} if 'sqlite' in DATABASE_URL else {})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


# ══════════════════════════════════════════════════════
# 枚举类型
# ══════════════════════════════════════════════════════
class DisciplineType(str, enum.Enum):
    WARNING = '警告'
    CENSURE = '通报批评'
    PUBLIC_CENSURE = '公开谴责'
    SUSPENSION = '停止执业'
    REVOCATION = '吊销执业证书'
    FINE = '罚款'
    OTHER = '其他'


class CaseStage(str, enum.Enum):
    FILED = '已立案'
    TRIAL = '审理中'
    FIRST_INSTANCE = '一审判决'
    SECOND_INSTANCE = '二审判决'
    RETRIAL = '再审'
    CLOSED = '已结案'


class LegislationStage(str, enum.Enum):
    PROPOSED = '立法建议'
    DRAFTING = '起草中'
    REVIEW = '审议中'
    PUBLIC_COMMENT = '公开征求意见'
    PASSED = '已通过'
    PROMULGATED = '已公布'
    EFFECTIVE = '已生效'
    REVISED = '修订中'


# ══════════════════════════════════════════════════════
# 1. 律师行政处罚
# ══════════════════════════════════════════════════════
class LawyerDiscipline(Base):
    __tablename__ = 'lawyer_discipline'

    id = Column(Integer, primary_key=True, autoincrement=True)
    lawyer_name = Column(String(100), nullable=False, index=True)
    law_firm = Column(String(200), nullable=False, index=True)
    firm_province = Column(String(50), nullable=False, index=True)
    firm_city = Column(String(50), default='')
    discipline_type = Column(String(50), nullable=False, index=True)
    discipline_date = Column(DateTime, nullable=False, index=True)
    discipline_org = Column(String(200), default='')
    violation_detail = Column(Text, default='')
    punishment_basis = Column(Text, default='')
    source_url = Column(String(500), default='')
    source_name = Column(String(100), default='')
    data_hash = Column(String(64), unique=True, nullable=False)  # 去重标记
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ══════════════════════════════════════════════════════
# 2. 重点立法项目
# ══════════════════════════════════════════════════════
class LegislationProject(Base):
    __tablename__ = 'legislation_projects'

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(300), nullable=False, index=True)
    stage = Column(String(50), nullable=False, index=True)
    category = Column(String(100), default='', index=True)
    proposing_body = Column(String(200), default='')
    draft_date = Column(DateTime, nullable=True)
    public_comment_start = Column(DateTime, nullable=True)
    public_comment_end = Column(DateTime, nullable=True)
    passed_date = Column(DateTime, nullable=True)
    effective_date = Column(DateTime, nullable=True)
    summary = Column(Text, default='')
    content_text = Column(Text, default='')  # 草案/正文
    old_text = Column(Text, default='')      # 旧法条原文(如需对比)
    new_text = Column(Text, default='')      # 新法条原文
    timeline_json = Column(Text, default='[]')  # JSON: [{date, event}]
    source_url = Column(String(500), default='')
    source_name = Column(String(100), default='')
    data_hash = Column(String(64), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ══════════════════════════════════════════════════════
# 3. 热点典型司法案件
# ══════════════════════════════════════════════════════
class JudicialCase(Base):
    __tablename__ = 'judicial_cases'

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_title = Column(String(300), nullable=False, index=True)
    case_number = Column(String(100), default='', index=True)
    case_type = Column(String(100), default='', index=True)  # 刑事/民事/行政
    cause_of_action = Column(String(200), default='', index=True)
    stage = Column(String(50), nullable=False, index=True)
    court = Column(String(200), default='')
    judge = Column(String(100), default='')
    plaintiff = Column(String(200), default='')
    defendant = Column(String(200), default='')
    filing_date = Column(DateTime, nullable=True)
    ruling_date = Column(DateTime, nullable=True)
    case_summary = Column(Text, default='')
    ruling_points = Column(Text, default='')  # 裁判要点
    full_text = Column(Text, default='')
    tags = Column(String(300), default='')  # 逗号分隔标签
    is_hot = Column(Boolean, default=False, index=True)
    view_count = Column(Integer, default=0)
    source_url = Column(String(500), default='')
    source_name = Column(String(100), default='')
    data_hash = Column(String(64), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ══════════════════════════════════════════════════════
# 4. 司法政策与指导案例
# ══════════════════════════════════════════════════════
class JudicialPolicy(Base):
    __tablename__ = 'judicial_policies'

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(300), nullable=False, index=True)
    doc_number = Column(String(100), default='', index=True)
    category = Column(String(100), default='', index=True)  # 司法解释/指导意见/指导案例/通知公告
    issuing_body = Column(String(200), default='')
    publish_date = Column(DateTime, nullable=False, index=True)
    effective_date = Column(DateTime, nullable=True)
    summary = Column(Text, default='')
    content_text = Column(Text, default='')
    attachment_url = Column(String(500), default='')
    source_url = Column(String(500), default='')
    source_name = Column(String(100), default='')
    is_guiding_case = Column(Boolean, default=False)
    data_hash = Column(String(64), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ══════════════════════════════════════════════════════
# 5. 法律招聘聚合
# ══════════════════════════════════════════════════════
class LegalRecruitment(Base):
    __tablename__ = 'legal_recruitments'

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(300), nullable=False, index=True)
    company = Column(String(200), default='', index=True)
    city = Column(String(50), default='', index=True)
    job_type = Column(String(100), default='', index=True)  # 律师/法务/合规/实习/其他
    salary_range = Column(String(100), default='')
    experience = Column(String(100), default='')
    education = Column(String(50), default='')
    description = Column(Text, default='')
    requirements = Column(Text, default='')
    wechat_account = Column(String(100), default='', index=True)  # 来源公众号
    wechat_article_url = Column(String(500), default='')
    original_url = Column(String(500), default='')
    publish_date = Column(DateTime, nullable=False, index=True)
    is_active = Column(Boolean, default=True, index=True)
    data_hash = Column(String(64), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ══════════════════════════════════════════════════════
# 6. 留言/表单
# ══════════════════════════════════════════════════════
class Message(Base):
    __tablename__ = 'messages'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(200), default='')
    phone = Column(String(20), default='')
    company = Column(String(200), default='')
    content = Column(Text, nullable=False)
    category = Column(String(50), default='general')  # general/feedback/cooperation
    is_read = Column(Boolean, default=False)
    is_replied = Column(Boolean, default=False)
    reply_content = Column(Text, default='')
    ip_address = Column(String(50), default='')
    created_at = Column(DateTime, default=datetime.utcnow)


# ══════════════════════════════════════════════════════
# 7. 活动报名
# ══════════════════════════════════════════════════════
class EventRegistration(Base):
    __tablename__ = 'event_registrations'

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(Integer, nullable=False, index=True)
    event_title = Column(String(200), default='')
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(200), default='')
    company = Column(String(200), default='')
    position = Column(String(100), default='')
    remark = Column(Text, default='')
    status = Column(String(20), default='pending')  # pending/confirmed/cancelled
    created_at = Column(DateTime, default=datetime.utcnow)


# ══════════════════════════════════════════════════════
# 8. 基础内容配置
# ══════════════════════════════════════════════════════
class BasicContent(Base):
    __tablename__ = 'basic_content'

    id = Column(Integer, primary_key=True, autoincrement=True)
    content_key = Column(String(100), unique=True, nullable=False, index=True)
    content_type = Column(String(50), default='text')  # text/html/image/json
    title = Column(String(200), default='')
    content_value = Column(Text, default='')
    order_index = Column(Integer, default=0)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ══════════════════════════════════════════════════════
# 9. 采集日志
# ══════════════════════════════════════════════════════
class CollectionLog(Base):
    __tablename__ = 'collection_logs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    collector_name = Column(String(50), nullable=False, index=True)
    status = Column(String(20), default='running')  # running/success/failed
    total_fetched = Column(Integer, default=0)
    new_added = Column(Integer, default=0)
    duplicates = Column(Integer, default=0)
    errors = Column(Integer, default=0)
    error_detail = Column(Text, default='')
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, default=0)


# ══════════════════════════════════════════════════════
# 10. 管理员账号
# ══════════════════════════════════════════════════════
class AdminUser(Base):
    __tablename__ = 'admin_users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    role = Column(String(20), default='editor')  # super_admin/admin/editor
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    """初始化数据库，创建所有表"""
    Base.metadata.create_all(bind=engine)

    # 插入默认管理员
    session = SessionLocal()
    try:
        from werkzeug.security import generate_password_hash
        existing = session.query(AdminUser).filter_by(username='admin').first()
        if not existing:
            admin = AdminUser(
                username='admin',
                password_hash=generate_password_hash('shenjiaben2026'),
                role='super_admin',
                is_active=True
            )
            session.add(admin)
            session.commit()
    finally:
        session.close()


def get_db():
    """获取数据库会话（依赖注入用）"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
