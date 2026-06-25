"""
律师行政处罚查询 API
"""
from datetime import datetime
from flask import Blueprint, request
from models.database import SessionLocal, LawyerDiscipline
from sqlalchemy import func, extract, and_, or_

discipline_bp = Blueprint('discipline', __name__)


@discipline_bp.route('/discipline/list')
def discipline_list():
    """处罚列表分页接口（支持：省份、处分类型、时间、律所关键词筛选）"""
    db = SessionLocal()
    try:
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 20, type=int)
        page_size = min(page_size, 100)

        province = request.args.get('province', '').strip()
        discipline_type = request.args.get('discipline_type', '').strip()
        law_firm = request.args.get('law_firm', '').strip()
        date_from = request.args.get('date_from', '').strip()
        date_to = request.args.get('date_to', '').strip()

        query = db.query(LawyerDiscipline)

        if province:
            query = query.filter(LawyerDiscipline.firm_province == province)
        if discipline_type:
            query = query.filter(LawyerDiscipline.discipline_type == discipline_type)
        if law_firm:
            query = query.filter(LawyerDiscipline.law_firm.like(f'%{law_firm}%'))
        if date_from:
            query = query.filter(LawyerDiscipline.discipline_date >= datetime.fromisoformat(date_from))
        if date_to:
            query = query.filter(LawyerDiscipline.discipline_date <= datetime.fromisoformat(date_to))

        total = query.count()
        items = query.order_by(LawyerDiscipline.discipline_date.desc()).offset((page - 1) * page_size).limit(page_size).all()

        result = [{
            'id': i.id, 'lawyer_name': i.lawyer_name, 'law_firm': i.law_firm,
            'firm_province': i.firm_province, 'firm_city': i.firm_city,
            'discipline_type': i.discipline_type, 'discipline_date': i.discipline_date.isoformat() if i.discipline_date else '',
            'discipline_org': i.discipline_org,
        } for i in items]

        return {
            'code': 200, 'message': 'success',
            'data': {
                'items': result,
                'pagination': {
                    'total': total, 'page': page, 'page_size': page_size,
                    'total_pages': (total + page_size - 1) // page_size if page_size else 0
                }
            }
        }
    finally:
        db.close()


@discipline_bp.route('/discipline/detail/<int:id>')
def discipline_detail(id):
    """处罚详情接口"""
    db = SessionLocal()
    try:
        item = db.query(LawyerDiscipline).filter_by(id=id).first()
        if not item:
            return {'code': 404, 'message': '记录不存在', 'data': None}, 404
        return {'code': 200, 'message': 'success', 'data': {
            'id': item.id, 'lawyer_name': item.lawyer_name, 'law_firm': item.law_firm,
            'firm_province': item.firm_province, 'firm_city': item.firm_city,
            'discipline_type': item.discipline_type, 'discipline_date': item.discipline_date.isoformat() if item.discipline_date else '',
            'discipline_org': item.discipline_org, 'violation_detail': item.violation_detail,
            'punishment_basis': item.punishment_basis, 'source_url': item.source_url, 'source_name': item.source_name,
        }}
    finally:
        db.close()


@discipline_bp.route('/discipline/stats')
def discipline_stats():
    """处罚统计图表接口（月度趋势、省份分布、违规类型占比）"""
    db = SessionLocal()
    try:
        # 月度趋势 - 最近12个月
        monthly = db.query(
            func.strftime('%Y-%m', LawyerDiscipline.discipline_date).label('month'),
            func.count(LawyerDiscipline.id).label('count')
        ).group_by('month').order_by('month').all()
        monthly_trend = [{'month': m, 'count': c} for m, c in monthly]

        # 省份分布 TOP10
        province_dist = db.query(
            LawyerDiscipline.firm_province,
            func.count(LawyerDiscipline.id).label('count')
        ).group_by(LawyerDiscipline.firm_province).order_by(func.count(LawyerDiscipline.id).desc()).limit(10).all()
        province_data = [{'name': p, 'value': c} for p, c in province_dist]

        # 违规类型占比
        type_dist = db.query(
            LawyerDiscipline.discipline_type,
            func.count(LawyerDiscipline.id).label('count')
        ).group_by(LawyerDiscipline.discipline_type).all()
        type_data = [{'name': t, 'value': c} for t, c in type_dist]

        return {'code': 200, 'message': 'success', 'data': {
            'monthly_trend': monthly_trend,
            'province_distribution': province_data,
            'type_distribution': type_data,
        }}
    finally:
        db.close()


@discipline_bp.route('/discipline/search')
def discipline_search():
    """律师/律所关键词实时搜索联想"""
    db = SessionLocal()
    try:
        keyword = request.args.get('q', '').strip()
        if len(keyword) < 2:
            return {'code': 200, 'message': 'success', 'data': {'suggestions': []}}

        # 搜索律师名
        lawyers = db.query(LawyerDiscipline.lawyer_name).filter(
            LawyerDiscipline.lawyer_name.like(f'%{keyword}%')
        ).distinct().limit(5).all()

        # 搜索律所
        firms = db.query(LawyerDiscipline.law_firm).filter(
            LawyerDiscipline.law_firm.like(f'%{keyword}%')
        ).distinct().limit(5).all()

        suggestions = [{'type': 'lawyer', 'text': l[0]} for l in lawyers] + \
                      [{'type': 'firm', 'text': f[0]} for f in firms]

        return {'code': 200, 'message': 'success', 'data': {'suggestions': suggestions[:10]}}
    finally:
        db.close()


@discipline_bp.route('/discipline/provinces')
def discipline_provinces():
    """获取省份列表（筛选用）"""
    db = SessionLocal()
    try:
        provinces = db.query(LawyerDiscipline.firm_province).distinct().order_by(LawyerDiscipline.firm_province).all()
        return {'code': 200, 'message': 'success', 'data': [p[0] for p in provinces if p[0]]}
    finally:
        db.close()
