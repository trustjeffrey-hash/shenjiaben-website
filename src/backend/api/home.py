"""
首页概览 API - 五大模块统计 + 最新动态滚动
"""
from datetime import datetime, timedelta
from flask import Blueprint, request
from models.database import SessionLocal, LawyerDiscipline, LegislationProject, JudicialCase, JudicialPolicy, LegalRecruitment
from sqlalchemy import func

home_bp = Blueprint('home', __name__)


@home_bp.route('/home/stats')
def home_stats():
    """首页五大模块统计卡片数据（当日/本周新增数量）"""
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=now.weekday())
        total_start = datetime(2000, 1, 1)

        stats = {
            'discipline': {
                'total': db.query(func.count(LawyerDiscipline.id)).scalar() or 0,
                'today_new': db.query(func.count(LawyerDiscipline.id)).filter(LawyerDiscipline.created_at >= today_start).scalar() or 0,
                'week_new': db.query(func.count(LawyerDiscipline.id)).filter(LawyerDiscipline.created_at >= week_start).scalar() or 0,
            },
            'legislation': {
                'total': db.query(func.count(LegislationProject.id)).scalar() or 0,
                'today_new': db.query(func.count(LegislationProject.id)).filter(LegislationProject.created_at >= today_start).scalar() or 0,
                'week_new': db.query(func.count(LegislationProject.id)).filter(LegislationProject.created_at >= week_start).scalar() or 0,
            },
            'cases': {
                'total': db.query(func.count(JudicialCase.id)).scalar() or 0,
                'today_new': db.query(func.count(JudicialCase.id)).filter(JudicialCase.created_at >= today_start).scalar() or 0,
                'week_new': db.query(func.count(JudicialCase.id)).filter(JudicialCase.created_at >= week_start).scalar() or 0,
            },
            'policy': {
                'total': db.query(func.count(JudicialPolicy.id)).scalar() or 0,
                'today_new': db.query(func.count(JudicialPolicy.id)).filter(JudicialPolicy.created_at >= today_start).scalar() or 0,
                'week_new': db.query(func.count(JudicialPolicy.id)).filter(JudicialPolicy.created_at >= week_start).scalar() or 0,
            },
            'recruitment': {
                'total': db.query(func.count(LegalRecruitment.id)).scalar() or 0,
                'today_new': db.query(func.count(LegalRecruitment.id)).filter(LegalRecruitment.created_at >= today_start).scalar() or 0,
                'week_new': db.query(func.count(LegalRecruitment.id)).filter(LegalRecruitment.created_at >= week_start).scalar() or 0,
            },
        }
        return {'code': 200, 'message': 'success', 'data': stats}
    finally:
        db.close()


@home_bp.route('/home/feed')
def home_feed():
    """全站最新动态滚动列表（处罚/立法/案件/招聘混排最新 TOP10）"""
    db = SessionLocal()
    try:
        limit = request.args.get('limit', 10, type=int)
        limit = min(limit, 50)

        feed = []

        # 最新处罚
        disciplines = db.query(LawyerDiscipline).order_by(LawyerDiscipline.discipline_date.desc()).limit(5).all()
        for d in disciplines:
            feed.append({
                'type': 'discipline',
                'type_label': '律师处罚',
                'title': f'{d.lawyer_name}（{d.law_firm}）被{d.discipline_type}',
                'date': d.discipline_date.isoformat() if d.discipline_date else '',
                'id': d.id,
            })

        # 最新立法
        legislations = db.query(LegislationProject).order_by(LegislationProject.updated_at.desc()).limit(5).all()
        for l in legislations:
            feed.append({
                'type': 'legislation',
                'type_label': '立法追踪',
                'title': l.title,
                'date': l.updated_at.isoformat() if l.updated_at else '',
                'id': l.id,
            })

        # 最新案件
        cases = db.query(JudicialCase).filter(JudicialCase.is_hot == True).order_by(JudicialCase.ruling_date.desc()).limit(5).all()
        for c in cases:
            feed.append({
                'type': 'case',
                'type_label': '热点案件',
                'title': c.case_title,
                'date': c.ruling_date.isoformat() if c.ruling_date else '',
                'id': c.id,
            })

        # 最新招聘
        recruitments = db.query(LegalRecruitment).filter(LegalRecruitment.is_active == True).order_by(LegalRecruitment.publish_date.desc()).limit(5).all()
        for r in recruitments:
            feed.append({
                'type': 'recruitment',
                'type_label': '法律招聘',
                'title': f'{r.title} - {r.company}',
                'date': r.publish_date.isoformat() if r.publish_date else '',
                'id': r.id,
            })

        # 按日期排序取 TOP N
        feed.sort(key=lambda x: x['date'], reverse=True)
        feed = feed[:limit]

        return {'code': 200, 'message': 'success', 'data': {'feed': feed}}
    finally:
        db.close()
