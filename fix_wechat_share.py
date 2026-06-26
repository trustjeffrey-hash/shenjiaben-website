#!/usr/bin/env python3
"""批量注入微信分享元标签到所有HTML页面"""

import re
import os

BASE_DIR = r'C:\Users\trust\WorkBuddy\2026-06-25-19-29-57\src\frontend'
IMAGE_URL = 'https://shenjiaben-research-institute.onrender.com/assets/images/wechat-share-branded.jpg'
SITE_URL = 'https://shenjiaben-research-institute.onrender.com'

# 每个页面的标题和描述
PAGE_META = {
    'index.html': {
        'title': '湖州市沈家本研究院 — 传承法治文化 · 弘扬法学精神',
        'desc': '立足家本故里，集学术研究、法律数据聚合、文化传播于一体的综合性法律研究机构。传承法治文化，弘扬法学精神。',
        'url': f'{SITE_URL}/',
    },
    'about.html': {
        'title': '研究院概况 — 湖州市沈家本研究院',
        'desc': '了解湖州市沈家本研究院的组织架构与发展历程。专职院长王俊峰，兼职院长蒋惠岭（同济大学法学院院长）。',
        'url': f'{SITE_URL}/about.html',
    },
    'research.html': {
        'title': '沈家本文化研究中心 — 湖州市沈家本研究院',
        'desc': '沈家本法治思想研究、法律文化传承、学术成果展示。',
        'url': f'{SITE_URL}/research.html',
    },
    'experts.html': {
        'title': '专家委员会 — 沈家本研究院',
        'desc': '12大细分法治研究中心，汇聚法学泰斗与实务专家。',
        'url': f'{SITE_URL}/experts.html',
    },
    'data.html': {
        'title': '法律数据聚合平台 — 湖州市沈家本研究院',
        'desc': '五大模块一站式法律数据查询：立法、案例、处罚、人才招聘、政策。',
        'url': f'{SITE_URL}/data.html',
    },
    'mediation.html': {
        'title': '商事调解中心 — 湖州市沈家本研究院',
        'desc': '专业商事调解，促进纠纷多元化解。',
        'url': f'{SITE_URL}/mediation.html',
    },
    'mediation-research.html': {
        'title': '商事调解研究 — 沈家本研究院',
        'desc': '调解课题研究、调研论文、行业分析报告，推动商事调解理论与实务创新。',
        'url': f'{SITE_URL}/mediation-research.html',
    },
    'mediation-apply.html': {
        'title': '调解业务在线申请 — 沈家本研究院',
        'desc': '在线提交调解申请，查看受理范围、材料指引与办理流程。',
        'url': f'{SITE_URL}/mediation-apply.html',
    },
    'mediation-training.html': {
        'title': '商调专题培训 — 沈家本研究院',
        'desc': '律师、法官、企业法务等调解培训课程与普法讲座归档。',
        'url': f'{SITE_URL}/mediation-training.html',
    },
    'mediation-partners.html': {
        'title': '合作共建单位 — 沈家本研究院',
        'desc': '法院、司法局、商会、电商平台、合作律所等共建单位展示。',
        'url': f'{SITE_URL}/mediation-partners.html',
    },
    'mediation-cases.html': {
        'title': '典型调解案例库 — 沈家本研究院',
        'desc': '分类归档调解成功案例，支持检索查看，后台可更新案例。',
        'url': f'{SITE_URL}/mediation-cases.html',
    },
    'events.html': {
        'title': '活动专栏 — 湖州市沈家本研究院',
        'desc': '最新学术活动、论坛讲座预告与精彩回顾。',
        'url': f'{SITE_URL}/events.html',
    },
    'cooperation.html': {
        'title': '合作交流 — 湖州市沈家本研究院',
        'desc': '与中国政法大学、同济大学法学院等机构深度合作。',
        'url': f'{SITE_URL}/cooperation.html',
    },
    'publications.html': {
        'title': '成果出版物 — 湖州市沈家本研究院',
        'desc': '学术专著、期刊论文、案例汇编等研究成果展示。',
        'url': f'{SITE_URL}/publications.html',
    },
    'contact.html': {
        'title': '联系我们 — 湖州市沈家本研究院',
        'desc': '地址、电话、邮箱，欢迎来访交流。',
        'url': f'{SITE_URL}/contact.html',
    },
    'cases.html': {
        'title': '商事调解案例 — 湖州市沈家本研究院',
        'desc': '热点典型司法案件专业评析，权威案例分析。',
        'url': f'{SITE_URL}/cases.html',
    },
    'legislation.html': {
        'title': '立法研究 — 湖州市沈家本研究院',
        'desc': '实时追踪国家及地方重点立法项目进度。',
        'url': f'{SITE_URL}/legislation.html',
    },
    'policy.html': {
        'title': '政策建议 — 湖州市沈家本研究院',
        'desc': '司法政策文件与指导案例权威汇总。',
        'url': f'{SITE_URL}/policy.html',
    },
    'discipline.html': {
        'title': '法治动态 — 湖州市沈家本研究院',
        'desc': '全国律师行政处罚信息实时查询。',
        'url': f'{SITE_URL}/discipline.html',
    },
    'recruitment.html': {
        'title': '人才招聘 — 湖州市沈家本研究院',
        'desc': '全网法律岗位聚合，律所/企业/法院招聘一站查。',
        'url': f'{SITE_URL}/recruitment.html',
    },
    'event-register.html': {
        'title': '活动报名 — 湖州市沈家本研究院',
        'desc': '在线报名参加各类学术活动和论坛讲座。',
        'url': f'{SITE_URL}/event-register.html',
    },
}


def build_meta_block(title, desc, page_url):
    return f'''  <!-- 微信/社交分享优化 -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:image" content="{IMAGE_URL}">
  <meta property="og:image:width" content="600">
  <meta property="og:image:height" content="600">
  <meta property="og:url" content="{page_url}">
  <meta property="og:site_name" content="湖州市沈家本研究院">
  <meta property="og:locale" content="zh_CN">
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="{title}">
  <meta name="twitter:description" content="{desc}">
  <meta name="twitter:image" content="{IMAGE_URL}">
  <!-- Schema.org -->
  <meta itemprop="name" content="{title}">
  <meta itemprop="description" content="{desc}">
  <meta itemprop="image" content="{IMAGE_URL}">
  <!-- 微信 wx: 首选标签 -->
  <meta property="wx:image" content="{IMAGE_URL}">
  <meta property="wx:title" content="{title}">
  <meta property="wx:description" content="{desc}">
  <meta property="wx:url" content="{page_url}">
  <!-- 微信 wechat: 兼容标签 -->
  <meta name="wechat:image" content="{IMAGE_URL}">
  <meta name="wechat:title" content="{title}">
  <meta name="wechat:description" content="{desc}">'''


def process_file(filepath, meta):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 匹配现有的分享标签块: 从 "<!-- 微信/社交分享优化 -->" 到最后一个 wechat:* 标签
    pattern = r'  <!-- 微信/社交分享优化 -->.*?(?=\n  <link rel="stylesheet")'
    old_block = re.search(pattern, content, re.DOTALL)

    if old_block:
        new_block = build_meta_block(meta['title'], meta['desc'], meta['url'])
        content = content[:old_block.start()] + new_block + content[old_block.end():]
    else:
        # 如果没有找到, 尝试在 viewport meta 之后插入
        viewport_match = re.search(r'<meta name="viewport".*?>', content)
        if viewport_match:
            insert_pos = viewport_match.end()
            new_block = '\n' + build_meta_block(meta['title'], meta['desc'], meta['url']) + '\n'
            content = content[:insert_pos] + new_block + content[insert_pos:]
        else:
            print(f'  WARNING: Cannot find insertion point in {filepath}')
            return False

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    return True


def main():
    html_files = [f for f in os.listdir(BASE_DIR) if f.endswith('.html')]
    success = 0

    for fname in sorted(html_files):
        filepath = os.path.join(BASE_DIR, fname)
        if fname not in PAGE_META:
            print(f'  SKIP: {fname} (no meta config)')
            continue

        meta = PAGE_META[fname]
        if process_file(filepath, meta):
            print(f'  OK: {fname}')
            success += 1
        else:
            print(f'  FAIL: {fname}')

    print(f'\nDone: {success}/{len(html_files)} files updated.')


if __name__ == '__main__':
    main()
