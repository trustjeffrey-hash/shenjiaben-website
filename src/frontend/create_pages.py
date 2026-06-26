import os
base = r'C:\Users\trust\WorkBuddy\2026-06-25-19-29-57\src\frontend'

pages = {
    'mediation-research.html': {
        'title': '商事调解研究 — 湖州市沈家本研究院',
        'og_title': '商事调解研究',
        'og_desc': '调解课题研究、调研论文、行业分析报告，推动商事调解理论与实务创新。',
        'hero_badge': 'Mediation Research',
        'hero_title': '商事调解研究',
        'hero_sub': '深耕调解理论，引领实务创新',
        'sections': [
            ('研究课题', '围绕商事调解制度、在线调解规则、行业调解标准化等方向开展课题研究。'),
            ('调研论文', '《跨境电商纠纷调解机制研究》《长三角一体化商事调解协作机制》等。'),
            ('行业报告', '定期发布《中国商事调解发展年度报告》《长三角商事调解白皮书》等。'),
        ],
        'api_key': 'mediation_research'
    },
    'mediation-apply.html': {
        'title': '调解业务在线申请 — 湖州市沈家本研究院',
        'og_title': '调解业务在线申请',
        'og_desc': '在线提交调解申请，查看受理范围、材料指引与办理流程。',
        'hero_badge': 'Online Application',
        'hero_title': '调解业务在线申请',
        'hero_sub': '便捷、高效、专业的商事调解服务入口',
        'form': True
    },
    'mediation-training.html': {
        'title': '商调专题培训 — 湖州市沈家本研究院',
        'og_title': '商调专题培训',
        'og_desc': '律师、法官、企业法务等调解培训课程与普法讲座归档。',
        'hero_badge': 'Training',
        'hero_title': '商调专题培训',
        'hero_sub': '赋能法律人，共建调解生态',
        'sections': [
            ('律师调解培训', '面向执业律师的商事调解技能培训，涵盖谈判技巧、调解程序等。'),
            ('法官调解培训', '与各级法院合作的诉调对接专项培训，提升法官调解能力。'),
            ('企业法务培训', '面向企业法务的合规与纠纷预防培训，降低企业诉讼风险。'),
            ('普法讲座', '面向社会公众的商事调解普法讲座与社区法律咨询服务。'),
        ],
        'api_key': 'mediation_training'
    },
    'mediation-partners.html': {
        'title': '合作共建单位 — 湖州市沈家本研究院',
        'og_title': '合作共建单位',
        'og_desc': '法院、司法局、商会、电商平台、合作律所等共建单位展示。',
        'hero_badge': 'Partners',
        'hero_title': '合作共建单位',
        'hero_sub': '共建多元解纷生态圈',
        'sections': [
            ('法院共建', '与湖州市中级人民法院、吴兴区人民法院共建诉调对接工作站。'),
            ('司法局共建', '与湖州市司法局共建人民调解与商事调解衔接机制。'),
            ('商会合作', '与湖州市工商联、吴兴区电子商务商会共建行业调解委员会。'),
            ('律所合作', '与中国政法大学、同济大学法学院及炜衡、大成、泽大等律所共建。'),
        ],
        'api_key': 'mediation_partners'
    },
    'mediation-cases.html': {
        'title': '典型调解案例库 — 湖州市沈家本研究院',
        'og_title': '典型调解案例库',
        'og_desc': '分类归档调解成功案例，支持检索查看，后台可更新案例。',
        'hero_badge': 'Case Library',
        'hero_title': '典型调解案例库',
        'hero_sub': '以案释调，以调促和',
        'cases': True
    },
}

FOOTER = '''<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-brand"><h3>沈家本研究院</h3><p>传承法治文化，弘扬法学精神。<br>致力于沈家本法学思想研究与中国法治文化传播。</p></div>
    <div class="footer-col"><h4>快速导航</h4><a href="about.html">研究院概况</a><a href="research.html">文化研究中心</a><a href="publications.html">成果出版物</a><a href="events.html">活动专栏</a></div>
    <div class="footer-col"><h4>商事调解中心</h4><a href="mediation.html">中心概况</a><a href="mediation-apply.html">调解申请</a><a href="mediation-training.html">专题培训</a><a href="mediation-cases.html">典型案例</a></div>
    <div class="footer-col"><h4>联系方式</h4><a href="contact.html">联系我们</a><a href="experts.html">专家委员会</a></div>
  </div>
  <div class="footer-bottom"><p>&copy; 2026 湖州市沈家本研究院 版权所有</p><p><a href="#">ICP备案号：待备案</a></p><p style="margin-top:8px;">本平台数据均取自公开公示内容，仅作公益学术检索，不构成法律建议</p></div>
</footer>'''

for filename, config in pages.items():
    fpath = os.path.join(base, filename)
    sections_html = ''
    
    if config.get('sections'):
        for sec_title, sec_desc in config['sections']:
            sections_html += f'''<section class="section"><div class="container"><h2 class="section-title">{sec_title}</h2><div class="section-divider"></div><div class="card" style="padding:24px;"><p style="color:var(--text-secondary);line-height:1.8;margin:0;">{sec_desc}</p></div></div></section>\n'''
    
    form_html = ''
    if config.get('form'):
        form_html = '''<section class="section"><div class="container" style="max-width:800px;"><h2 class="section-title">在线调解申请</h2><div class="section-divider"></div><div class="card" style="padding:32px;"><h3 style="margin-bottom:24px;color:var(--color-primary);">受理范围</h3><p style="color:var(--text-secondary);margin-bottom:24px;">买卖合同纠纷、服务合同纠纷、股权转让纠纷、知识产权纠纷、电子商务纠纷等商事争议。</p><h3 style="margin-bottom:24px;color:var(--color-primary);">申请表单</h3><form id="med-apply-form" style="display:grid;gap:16px;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;" class="responsive-grid-2"><div><label>申请人姓名/单位 *</label><input type="text" name="applicant" required style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:6px;"></div><div><label>联系电话 *</label><input type="tel" name="phone" required style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:6px;"></div></div><div><label>电子邮箱</label><input type="email" name="email" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:6px;"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;" class="responsive-grid-2"><div><label>纠纷类型 *</label><select name="disputeType" required style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:6px;"><option value="">请选择</option><option>买卖合同纠纷</option><option>服务合同纠纷</option><option>股权转让纠纷</option><option>知识产权纠纷</option><option>电子商务纠纷</option><option>建设工程纠纷</option><option>其他商事纠纷</option></select></div><div><label>争议金额（万元）</label><input type="number" name="amount" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:6px;"></div></div><div><label>争议简介 *</label><textarea name="description" rows="5" required style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:6px;"></textarea></div><button type="submit" class="btn btn-accent btn-lg" style="width:100%;">提交申请</button></form></div><div class="card" style="margin-top:24px;padding:24px;"><h3 style="margin-bottom:16px;color:var(--color-primary);">办理流程</h3><div style="display:flex;gap:16px;flex-wrap:wrap;"><div style="flex:1;min-width:140px;text-align:center;padding:16px;background:var(--bg-section);border-radius:6px;"><strong>1. 提交申请</strong><p style="font-size:var(--fs-note);margin-top:4px;">在线填写调解申请表</p></div><div style="flex:1;min-width:140px;text-align:center;padding:16px;background:var(--bg-section);border-radius:6px;"><strong>2. 受理审查</strong><p style="font-size:var(--fs-note);margin-top:4px;">3个工作日内反馈</p></div><div style="flex:1;min-width:140px;text-align:center;padding:16px;background:var(--bg-section);border-radius:6px;"><strong>3. 调解进行</strong><p style="font-size:var(--fs-note);margin-top:4px;">专业调解员主持</p></div><div style="flex:1;min-width:140px;text-align:center;padding:16px;background:var(--bg-section);border-radius:6px;"><strong>4. 调解结案</strong><p style="font-size:var(--fs-note);margin-top:4px;">达成协议/终止调解</p></div></div></div></div></section>\n'''

    cases_html = ''
    if config.get('cases'):
        cases_html = '''<section class="section"><div class="container"><h2 class="section-title">调解案例</h2><div class="section-divider"></div><div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;"><input type="text" id="med-case-search" placeholder="搜索案例关键词" style="flex:1;min-width:200px;padding:8px 12px;border:1px solid var(--border-color);border-radius:6px;"><select id="med-case-type" style="padding:8px 12px;border:1px solid var(--border-color);border-radius:6px;"><option value="">全部类型</option><option>买卖合同</option><option>服务合同</option><option>股权转让</option><option>知识产权</option><option>电子商务</option><option>建设工程</option><option>其他</option></select></div><div id="med-cases-list" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;" class="responsive-grid-2"><div class="loading-state"><div class="spinner"></div><p>数据加载中...</p></div></div><div id="med-cases-pagination" style="text-align:center;margin-top:24px;"></div></div></section>\n'''

    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{config['title']}</title>
  <meta property="og:type" content="website">
  <meta property="og:title" content="{config['og_title']} — 湖州市沈家本研究院">
  <meta property="og:description" content="{config['og_desc']}">
  <meta property="og:image" content="https://shenjiaben-research-institute.onrender.com/assets/images/wechat-share-square.png" itemprop="image">
  <meta property="og:url" content="https://shenjiaben-research-institute.onrender.com/{filename}">
  <meta name="wechat:title" content="{config['og_title']} — 沈家本研究院">
  <meta name="wechat:description" content="{config['og_desc']}">
  <meta name="wechat:image" content="https://shenjiaben-research-institute.onrender.com/assets/images/wechat-share-square.png">
  <link rel="stylesheet" href="assets/css/main.css">
  <link rel="stylesheet" href="assets/css/responsive.css">
</head>
<body>
<header id="site-nav"></header>
<section class="hero" style="padding:64px 0 48px;">
  <div class="hero-content">
    <span class="hero-badge">{config['hero_badge']}</span>
    <h1 class="hero-title">{config['hero_title']}</h1>
    <p class="hero-subtitle">{config['hero_sub']}</p>
  </div>
</section>
{sections_html}{form_html}{cases_html}
{FOOTER}
<script src="assets/js/common.js"></script>
</body>
</html>'''

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'Created: {filename}')
print('Done!')
