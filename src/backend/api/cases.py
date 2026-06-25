"""
热点典型司法案件评析 API
"""
from datetime import datetime
from flask import Blueprint, request
from models.database import SessionLocal, JudicialCase
from sqlalchemy import func

cases_bp = Blueprint('cases', __name__)


@cases_bp.route('/cases/list')
def cases_list():
    """案件列表分页+案由/进度筛选接口"""
    db = SessionLocal()
    try:
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 20, type=int)
        page_size = min(page_size, 100)

        stage = request.args.get('stage', '').strip()
        case_type = request.args.get('case_type', '').strip()
        cause = request.args.get('cause', '').strip()
        keyword = request.args.get('keyword', '').strip()
        is_hot = request.args.get('is_hot', '').strip()

        query = db.query(JudicialCase)

        if stage:
            query = query.filter(JudicialCase.stage == stage)
        if case_type:
            query = query.filter(JudicialCase.case_type == case_type)
        if cause:
            query = query.filter(JudicialCase.cause_of_action.like(f'%{cause}%'))
        if keyword:
            query = query.filter(
                JudicialCase.case_title.like(f'%{keyword}%') |
                JudicialCase.case_summary.like(f'%{keyword}%')
            )
        if is_hot == '1':
            query = query.filter(JudicialCase.is_hot == True)

        total = query.count()
        items = query.order_by(JudicialCase.ruling_date.desc()).offset((page - 1) * page_size).limit(page_size).all()

        result = [{
            'id': i.id, 'case_title': i.case_title, 'case_number': i.case_number,
            'case_type': i.case_type, 'cause_of_action': i.cause_of_action,
            'stage': i.stage, 'court': i.court,
            'filing_date': i.filing_date.isoformat() if i.filing_date else '',
            'ruling_date': i.ruling_date.isoformat() if i.ruling_date else '',
            'case_summary': i.case_summary[:200] if i.case_summary else '',
            'tags': i.tags.split(',') if i.tags else [],
            'is_hot': i.is_hot, 'view_count': i.view_count,
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


@cases_bp.route('/cases/detail/<int:id>')
def cases_detail(id):
    """案件详情接口"""
    db = SessionLocal()
    try:
        item = db.query(JudicialCase).filter_by(id=id).first()
        if not item:
            return {'code': 404, 'message': '案件不存在', 'data': None}, 404

        # 浏览量+1
        item.view_count = (item.view_count or 0) + 1
        db.commit()

        return {'code': 200, 'message': 'success', 'data': {
            'id': item.id, 'case_title': item.case_title, 'case_number': item.case_number,
            'case_type': item.case_type, 'cause_of_action': item.cause_of_action,
            'stage': item.stage, 'court': item.court, 'judge': item.judge,
            'plaintiff': item.plaintiff, 'defendant': item.defendant,
            'filing_date': item.filing_date.isoformat() if item.filing_date else '',
            'ruling_date': item.ruling_date.isoformat() if item.ruling_date else '',
            'case_summary': item.case_summary, 'ruling_points': item.ruling_points,
            'full_text': item.full_text, 'tags': item.tags.split(',') if item.tags else [],
            'is_hot': item.is_hot, 'view_count': item.view_count,
            'source_url': item.source_url, 'source_name': item.source_name,
        }}
    finally:
        db.close()


@cases_bp.route('/cases/stats')
def cases_stats():
    """案件统计图表接口"""
    db = SessionLocal()
    try:
        # 案件类型分布
        type_dist = db.query(
            JudicialCase.case_type,
            func.count(JudicialCase.id).label('count')
        ).group_by(JudicialCase.case_type).all()
        type_data = [{'name': t or '未分类', 'value': c} for t, c in type_dist]

        # 审理阶段分布
        stage_dist = db.query(
            JudicialCase.stage,
            func.count(JudicialCase.id).label('count')
        ).group_by(JudicialCase.stage).all()
        stage_data = [{'name': s, 'value': c} for s, c in stage_dist]

        # 月度趋势
        monthly = db.query(
            func.strftime('%Y-%m', JudicialCase.ruling_date).label('month'),
            func.count(JudicialCase.id).label('count')
        ).group_by('month').order_by('month').all()
        monthly_trend = [{'month': m, 'count': c} for m, c in monthly]

        return {'code': 200, 'message': 'success', 'data': {
            'type_distribution': type_data,
            'stage_distribution': stage_data,
            'monthly_trend': monthly_trend,
            'total': db.query(func.count(JudicialCase.id)).scalar() or 0,
        }}
    finally:
        db.close()
