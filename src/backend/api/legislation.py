"""
重点立法项目进度追踪 API
"""
from datetime import datetime
from flask import Blueprint, request
from models.database import SessionLocal, LegislationProject
from sqlalchemy import func
import json

legislation_bp = Blueprint('legislation', __name__)


@legislation_bp.route('/legislation/list')
def legislation_list():
    """立法项目列表分页+筛选接口"""
    db = SessionLocal()
    try:
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 20, type=int)
        page_size = min(page_size, 100)

        stage = request.args.get('stage', '').strip()
        category = request.args.get('category', '').strip()
        keyword = request.args.get('keyword', '').strip()

        query = db.query(LegislationProject)

        if stage:
            query = query.filter(LegislationProject.stage == stage)
        if category:
            query = query.filter(LegislationProject.category == category)
        if keyword:
            query = query.filter(LegislationProject.title.like(f'%{keyword}%'))

        total = query.count()
        items = query.order_by(LegislationProject.updated_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

        result = [{
            'id': i.id, 'title': i.title, 'stage': i.stage, 'category': i.category,
            'proposing_body': i.proposing_body, 'summary': i.summary,
            'draft_date': i.draft_date.isoformat() if i.draft_date else '',
            'effective_date': i.effective_date.isoformat() if i.effective_date else '',
            'updated_at': i.updated_at.isoformat() if i.updated_at else '',
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


@legislation_bp.route('/legislation/timeline/<int:id>')
def legislation_timeline(id):
    """立法进度时间轴数据接口"""
    db = SessionLocal()
    try:
        item = db.query(LegislationProject).filter_by(id=id).first()
        if not item:
            return {'code': 404, 'message': '项目不存在', 'data': None}, 404

        try:
            timeline = json.loads(item.timeline_json) if item.timeline_json else []
        except json.JSONDecodeError:
            timeline = []

        return {'code': 200, 'message': 'success', 'data': {
            'id': item.id,
            'title': item.title,
            'current_stage': item.stage,
            'timeline': timeline,
        }}
    finally:
        db.close()


@legislation_bp.route('/legislation/detail/<int:id>')
def legislation_detail(id):
    """法条新旧对比详情接口"""
    db = SessionLocal()
    try:
        item = db.query(LegislationProject).filter_by(id=id).first()
        if not item:
            return {'code': 404, 'message': '项目不存在', 'data': None}, 404

        return {'code': 200, 'message': 'success', 'data': {
            'id': item.id, 'title': item.title, 'stage': item.stage,
            'category': item.category, 'proposing_body': item.proposing_body,
            'draft_date': item.draft_date.isoformat() if item.draft_date else '',
            'public_comment_start': item.public_comment_start.isoformat() if item.public_comment_start else '',
            'public_comment_end': item.public_comment_end.isoformat() if item.public_comment_end else '',
            'passed_date': item.passed_date.isoformat() if item.passed_date else '',
            'effective_date': item.effective_date.isoformat() if item.effective_date else '',
            'summary': item.summary,
            'old_text': item.old_text,
            'new_text': item.new_text,
            'source_url': item.source_url, 'source_name': item.source_name,
        }}
    finally:
        db.close()


@legislation_bp.route('/legislation/search')
def legislation_search():
    """立法项目搜索"""
    db = SessionLocal()
    try:
        keyword = request.args.get('q', '').strip()
        if len(keyword) < 2:
            return {'code': 200, 'message': 'success', 'data': {'suggestions': []}}

        items = db.query(LegislationProject.id, LegislationProject.title).filter(
            LegislationProject.title.like(f'%{keyword}%')
        ).limit(10).all()

        return {'code': 200, 'message': 'success', 'data': {
            'suggestions': [{'id': i[0], 'title': i[1]} for i in items]
        }}
    finally:
        db.close()


@legislation_bp.route('/legislation/stages')
def legislation_stages():
    """获取立法阶段列表"""
    return {'code': 200, 'message': 'success', 'data': [
        '立法建议', '起草中', '审议中', '公开征求意见', '已通过', '已公布', '已生效', '修订中'
    ]}


@legislation_bp.route('/legislation/stats')
def legislation_stats():
    """立法统计"""
    db = SessionLocal()
    try:
        stage_dist = db.query(
            LegislationProject.stage,
            func.count(LegislationProject.id).label('count')
        ).group_by(LegislationProject.stage).all()
        return {'code': 200, 'message': 'success', 'data': {
            'stage_distribution': [{'name': s, 'value': c} for s, c in stage_dist],
            'total': db.query(func.count(LegislationProject.id)).scalar() or 0,
        }}
    finally:
        db.close()
