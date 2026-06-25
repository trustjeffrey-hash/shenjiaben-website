"""
法律招聘聚合 API
"""
from datetime import datetime
from flask import Blueprint, request
from models.database import SessionLocal, LegalRecruitment
from sqlalchemy import func

recruitment_bp = Blueprint('recruitment', __name__)


@recruitment_bp.route('/recruitment/list')
def recruitment_list():
    """招聘岗位分页列表（支持城市、岗位类型、薪资、时间筛选）"""
    db = SessionLocal()
    try:
        page = request.args.get('page', 1, type=int)
        page_size = request.args.get('page_size', 20, type=int)
        page_size = min(page_size, 100)

        city = request.args.get('city', '').strip()
        job_type = request.args.get('job_type', '').strip()
        salary = request.args.get('salary', '').strip()
        keyword = request.args.get('keyword', '').strip()

        query = db.query(LegalRecruitment).filter(LegalRecruitment.is_active == True)

        if city:
            query = query.filter(LegalRecruitment.city == city)
        if job_type:
            query = query.filter(LegalRecruitment.job_type == job_type)
        if salary:
            query = query.filter(LegalRecruitment.salary_range.like(f'%{salary}%'))
        if keyword:
            query = query.filter(
                LegalRecruitment.title.like(f'%{keyword}%') |
                LegalRecruitment.company.like(f'%{keyword}%') |
                LegalRecruitment.description.like(f'%{keyword}%')
            )

        total = query.count()
        items = query.order_by(LegalRecruitment.publish_date.desc()).offset((page - 1) * page_size).limit(page_size).all()

        result = [{
            'id': i.id, 'title': i.title, 'company': i.company,
            'city': i.city, 'job_type': i.job_type, 'salary_range': i.salary_range,
            'experience': i.experience, 'education': i.education,
            'description': i.description[:200] if i.description else '',
            'wechat_account': i.wechat_account,
            'publish_date': i.publish_date.isoformat() if i.publish_date else '',
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


@recruitment_bp.route('/recruitment/search')
def recruitment_search():
    """岗位实时搜索联想接口"""
    db = SessionLocal()
    try:
        keyword = request.args.get('q', '').strip()
        if len(keyword) < 2:
            return {'code': 200, 'message': 'success', 'data': {'suggestions': []}}

        items = db.query(
            LegalRecruitment.id, LegalRecruitment.title, LegalRecruitment.company
        ).filter(
            LegalRecruitment.is_active == True,
            LegalRecruitment.title.like(f'%{keyword}%') |
            LegalRecruitment.company.like(f'%{keyword}%')
        ).limit(10).all()

        return {'code': 200, 'message': 'success', 'data': {
            'suggestions': [{'id': i[0], 'title': i[1], 'company': i[2]} for i in items]
        }}
    finally:
        db.close()


@recruitment_bp.route('/recruitment/detail/<int:id>')
def recruitment_detail(id):
    """岗位详情接口"""
    db = SessionLocal()
    try:
        item = db.query(LegalRecruitment).filter_by(id=id).first()
        if not item:
            return {'code': 404, 'message': '岗位不存在', 'data': None}, 404

        return {'code': 200, 'message': 'success', 'data': {
            'id': item.id, 'title': item.title, 'company': item.company,
            'city': item.city, 'job_type': item.job_type, 'salary_range': item.salary_range,
            'experience': item.experience, 'education': item.education,
            'description': item.description, 'requirements': item.requirements,
            'wechat_account': item.wechat_account,
            'wechat_article_url': item.wechat_article_url,
            'original_url': item.original_url,
            'publish_date': item.publish_date.isoformat() if item.publish_date else '',
        }}
    finally:
        db.close()


@recruitment_bp.route('/recruitment/cities')
def recruitment_cities():
    """获取城市列表"""
    db = SessionLocal()
    try:
        cities = db.query(LegalRecruitment.city).filter(LegalRecruitment.is_active == True).distinct().order_by(LegalRecruitment.city).all()
        return {'code': 200, 'message': 'success', 'data': [c[0] for c in cities if c[0]]}
    finally:
        db.close()


@recruitment_bp.route('/recruitment/stats')
def recruitment_stats():
    """招聘数据统计图表（30天热度、城市分布、岗位占比）"""
    db = SessionLocal()
    try:
        thirty_days_ago = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        from datetime import timedelta
        thirty_days_ago -= timedelta(days=30)

        # 城市分布 TOP10
        city_dist = db.query(
            LegalRecruitment.city,
            func.count(LegalRecruitment.id).label('count')
        ).filter(LegalRecruitment.is_active == True).group_by(LegalRecruitment.city).order_by(
            func.count(LegalRecruitment.id).desc()
        ).limit(10).all()

        # 岗位类型占比
        type_dist = db.query(
            LegalRecruitment.job_type,
            func.count(LegalRecruitment.id).label('count')
        ).filter(LegalRecruitment.is_active == True).group_by(LegalRecruitment.job_type).all()

        # 30日新增趋势
        daily_new = db.query(
            func.date(LegalRecruitment.publish_date).label('day'),
            func.count(LegalRecruitment.id).label('count')
        ).filter(LegalRecruitment.publish_date >= thirty_days_ago).group_by('day').order_by('day').all()

        return {'code': 200, 'message': 'success', 'data': {
            'city_distribution': [{'name': c, 'value': cnt} for c, cnt in city_dist],
            'type_distribution': [{'name': t or '未分类', 'value': cnt} for t, cnt in type_dist],
            'daily_new_trend': [{'date': d, 'count': cnt} for d, cnt in daily_new],
            'total_active': db.query(func.count(LegalRecruitment.id)).filter(LegalRecruitment.is_active == True).scalar() or 0,
        }}
    finally:
        db.close()
