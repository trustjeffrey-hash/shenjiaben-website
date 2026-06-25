"""
司法政策与指导案例汇总 API
"""
from datetime import datetime
from flask import Blueprint, request
from models.database import SessionLocal, JudicialPolicy
from sqlalchemy import func

policy_bp = Blueprint('policy', __name__)


@policy_bp.route('/policy/list')
def policy_list():
    """政策文件分页列表+分类/时间筛选接口"""
    db = SessionLocal()
    try:
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 20, type=int)
        page_size = min(page_size, 100)

        category = request.args.get('category', '').strip()
        issuing_body = request.args.get('issuing_body', '').strip()
        date_from = request.args.get('date_from', '').strip()
        date_to = request.args.get('date_to', '').strip()
        keyword = request.args.get('keyword', '').strip()
        is_guiding = request.args.get('is_guiding', '').strip()

        query = db.query(JudicialPolicy)

        if category:
            query = query.filter(JudicialPolicy.category == category)
        if issuing_body:
            query = query.filter(JudicialPolicy.issuing_body.like(f'%{issuing_body}%'))
        if date_from:
            query = query.filter(JudicialPolicy.publish_date >= datetime.fromisoformat(date_from))
        if date_to:
            query = query.filter(JudicialPolicy.publish_date <= datetime.fromisoformat(date_to))
        if keyword:
            query = query.filter(
                JudicialPolicy.title.like(f'%{keyword}%') |
                JudicialPolicy.summary.like(f'%{keyword}%')
            )
        if is_guiding == '1':
            query = query.filter(JudicialPolicy.is_guiding == True)

        total = query.count()
        items = query.order_by(JudicialPolicy.publish_date.desc()).offset((page - 1) * page_size).limit(page_size).all()

        result = [{
            'id': i.id, 'title': i.title, 'doc_number': i.doc_number,
            'category': i.category, 'issuing_body': i.issuing_body,
            'publish_date': i.publish_date.isoformat() if i.publish_date else '',
            'effective_date': i.effective_date.isoformat() if i.effective_date else '',
            'summary': i.summary[:300] if i.summary else '',
            'is_guiding_case': i.is_guiding,
            'source_url': i.source_url,
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


@policy_bp.route('/policy/detail/<int:id>')
def policy_detail(id):
    """政策详情接口"""
    db = SessionLocal()
    try:
        item = db.query(JudicialPolicy).filter_by(id=id).first()
        if not item:
            return {'code': 404, 'message': '政策文件不存在', 'data': None}, 404

        return {'code': 200, 'message': 'success', 'data': {
            'id': item.id, 'title': item.title, 'doc_number': item.doc_number,
            'category': item.category, 'issuing_body': item.issuing_body,
            'publish_date': item.publish_date.isoformat() if item.publish_date else '',
            'effective_date': item.effective_date.isoformat() if item.effective_date else '',
            'summary': item.summary, 'content_text': item.content_text,
            'attachment_url': item.attachment_url,
            'source_url': item.source_url, 'source_name': item.source_name,
            'is_guiding_case': item.is_guiding,
        }}
    finally:
        db.close()


@policy_bp.route('/policy/categories')
def policy_categories():
    """获取政策分类列表"""
    db = SessionLocal()
    try:
        categories = db.query(JudicialPolicy.category).distinct().order_by(JudicialPolicy.category).all()
        return {'code': 200, 'message': 'success', 'data': [c[0] for c in categories if c[0]]}
    finally:
        db.close()


@policy_bp.route('/policy/stats')
def policy_stats():
    """政策统计"""
    db = SessionLocal()
    try:
        cat_dist = db.query(
            JudicialPolicy.category,
            func.count(JudicialPolicy.id).label('count')
        ).group_by(JudicialPolicy.category).all()

        body_dist = db.query(
            JudicialPolicy.issuing_body,
            func.count(JudicialPolicy.id).label('count')
        ).group_by(JudicialPolicy.issuing_body).order_by(func.count(JudicialPolicy.id).desc()).limit(10).all()

        return {'code': 200, 'message': 'success', 'data': {
            'category_distribution': [{'name': c, 'value': cnt} for c, cnt in cat_dist],
            'issuing_body_distribution': [{'name': b, 'value': cnt} for b, cnt in body_dist],
            'total': db.query(func.count(JudicialPolicy.id)).scalar() or 0,
        }}
    finally:
        db.close()
