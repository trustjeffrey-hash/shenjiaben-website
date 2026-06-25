/**
 * 沈家本研究院官网 - Node.js API 服务器
 * 纯内置模块实现，零外部依赖
 * 
 * 用法: node server.js [--port 5000] [--seed]
 */
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');

const STATIC_ROOT = path.resolve(__dirname, '..', 'frontend');

// ── MIME 类型映射 ─────────────────────────────────
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

// ── 静态文件服务 ──────────────────────────────────
function serveStatic(res, filePath) {
  // 安全检查：防止目录遍历
  const safePath = path.normalize(filePath);
  if (!safePath.startsWith(STATIC_ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return true;
  }

  // 检查文件是否存在
  if (!fs.existsSync(safePath) || !fs.statSync(safePath).isFile()) {
    return false;
  }

  const ext = path.extname(safePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const content = fs.readFileSync(safePath);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': content.length,
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
  });
  res.end(content);
  return true;
}

const portIdx = process.argv.indexOf('--port');
const PORT = parseInt(process.env.PORT || (portIdx > -1 ? process.argv[portIdx + 1] : null) || 5000);
const API_PREFIX = '/api/v1';

// ── CORS & 通用响应头 ────────────────────────────
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8',
};

function json(res, code, data, message = 'success') {
  res.writeHead(code, CORS_HEADERS);
  res.end(JSON.stringify({ code, message, data }));
}

function jsonError(res, code, message) {
  res.writeHead(code, CORS_HEADERS);
  res.end(JSON.stringify({ code, message, data: null }));
}

// ── 请求解析 ──────────────────────────────────────
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

function parseQuery(req) {
  const parsed = url.parse(req.url, true);
  return { pathname: parsed.pathname, query: parsed.query };
}

// ── Token 验证 ────────────────────────────────────
function verifyToken(req) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const [username, hash] = token.split(':');
  const user = db.table('admin_users').find(u => u.username === username && u.isActive);
  if (!user || user.passwordHash !== hash) return null;
  return user;
}

// ═══════════════════════════════════════════════════
// API 路由处理
// ═══════════════════════════════════════════════════

// ── 首页 ──────────────────────────────────────────
function handleHomeStats(res) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const tables = ['lawyer_discipline', 'legislation_projects', 'judicial_cases', 'judicial_policies', 'legal_recruitments'];
  const stats = {};
  for (const t of tables) {
    const all = db.table(t);
    const todayNew = all.filter(r => new Date(r.createdAt) >= today).length;
    const weekNew = all.filter(r => new Date(r.createdAt) >= weekStart).length;
    stats[t] = { total: all.length, todayNew, weekNew };
  }
  json(res, 200, stats);
}

function handleHomeFeed(res, query) {
  const limit = Math.min(parseInt(query.limit) || 10, 50);
  const feed = [];

  // 最新处罚
  for (const d of db.table('lawyer_discipline').sort((a,b) => new Date(b.disciplineDate) - new Date(a.disciplineDate)).slice(0, 5)) {
    feed.push({ type: 'discipline', typeLabel: '律师处罚', title: `${d.lawyerName}（${d.lawFirm}）被${d.disciplineType}`, date: d.disciplineDate, id: d.id });
  }
  // 最新立法
  for (const l of db.table('legislation_projects').sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5)) {
    feed.push({ type: 'legislation', typeLabel: '立法追踪', title: l.title, date: l.updatedAt, id: l.id });
  }
  // 热点案件
  for (const c of db.table('judicial_cases').filter(c => c.isHot).sort((a,b) => new Date(b.rulingDate) - new Date(a.rulingDate)).slice(0, 5)) {
    feed.push({ type: 'case', typeLabel: '热点案件', title: c.caseTitle, date: c.rulingDate, id: c.id });
  }
  // 最新招聘
  for (const r of db.table('legal_recruitments').filter(r => r.isActive).sort((a,b) => new Date(b.publishDate) - new Date(a.publishDate)).slice(0, 5)) {
    feed.push({ type: 'recruitment', typeLabel: '法律招聘', title: `${r.title} - ${r.company}`, date: r.publishDate, id: r.id });
  }

  feed.sort((a, b) => new Date(b.date) - new Date(a.date));
  json(res, 200, { feed: feed.slice(0, limit) });
}

// ── 律师处罚 ──────────────────────────────────────
function handleDisciplineList(res, query) {
  const q = db.query('lawyer_discipline')
    .equals('firmProvince', query.province)
    .equals('disciplineType', query.type)
    .gte('disciplineDate', query.dateFrom)
    .lte('disciplineDate', query.dateTo)
    .sortBy('disciplineDate')
    .paginate(query.page, query.pageSize || query.page_size);
  const result = q.execute();
  // 字段映射：统一为前端期望的字段名
  result.items = result.items.map(item => ({
    id: item.id,
    lawyerName: item.lawyerName,
    firm: item.lawFirm,
    province: item.firmProvince,
    type: item.disciplineType,
    typeLabel: item.disciplineType,
    date: item.disciplineDate ? item.disciplineDate.split('T')[0] : '',
    authority: item.disciplineOrg,
    detail: item.violationDetail,
    licenseNo: item.licenseNo || '',
    sourceUrl: item.sourceUrl || '',
    sourceName: item.sourceName || '',
  }));
  json(res, 200, result);
}

function handleDisciplineDetail(res, id) {
  const item = db.findById('lawyer_discipline', id);
  if (!item) return jsonError(res, 404, '记录不存在');
  json(res, 200, {
    id: item.id,
    lawyerName: item.lawyerName,
    firm: item.lawFirm,
    province: item.firmProvince,
    type: item.disciplineType,
    typeLabel: item.disciplineType,
    date: item.disciplineDate ? item.disciplineDate.split('T')[0] : '',
    authority: item.disciplineOrg,
    detail: item.violationDetail,
    licenseNo: item.licenseNo || '',
    sourceUrl: item.sourceUrl || '',
    sourceName: item.sourceName || '',
    punishmentBasis: item.punishmentBasis || '',
  });
}

function handleDisciplineStats(res) {
  const monthlyTrend = db.countByDate('lawyer_discipline', 'disciplineDate', 'month');
  const provinceDistribution = db.groupBy('lawyer_discipline', 'firmProvince').sort((a,b) => b.value - a.value).slice(0, 10);
  const typeDistribution = db.groupBy('lawyer_discipline', 'disciplineType');
  // 前端期望的字段名
  json(res, 200, {
    monthly: monthlyTrend.map(m => ({ month: m.date, count: m.count })),
    provinces: provinceDistribution.map(p => ({ name: p.key, count: p.value })),
    types: typeDistribution.map(t => ({ name: t.key, count: t.value })),
  });
}

function handleDisciplineSearch(res, query) {
  const kw = (query.q || '').trim().toLowerCase();
  if (kw.length < 2) return json(res, 200, { suggestions: [] });
  const items = db.table('lawyer_discipline');
  const lawyers = [...new Set(items.filter(i => i.lawyerName.toLowerCase().includes(kw)).map(i => i.lawyerName))].slice(0, 5);
  const firms = [...new Set(items.filter(i => i.lawFirm.toLowerCase().includes(kw)).map(i => i.lawFirm))].slice(0, 5);
  json(res, 200, {
    suggestions: [
      ...lawyers.map(t => ({ type: 'lawyer', text: t })),
      ...firms.map(t => ({ type: 'firm', text: t })),
    ].slice(0, 10)
  });
}

// ── 立法追踪 ──────────────────────────────────────
function handleLegislationList(res, query) {
  const q = db.query('legislation_projects')
    .equals('stage', query.stage)
    .equals('category', query.category)
    .like('title', query.keyword)
    .sortBy('updatedAt')
    .paginate(query.page, query.page_size || query.pageSize);
  const result = q.execute();
  result.items = result.items.map(item => ({
    id: item.id, title: item.title,
    status: item.stage, statusLabel: item.stage,
    level: item.category, levelLabel: item.category,
    lastUpdate: item.updatedAt ? item.updatedAt.split('T')[0] : '',
    summary: item.summary || '', body: item.proposingBody || '',
  }));
  json(res, 200, result);
}

function handleLegislationDetail(res, id) {
  const item = db.findById('legislation_projects', id);
  if (!item) return jsonError(res, 404, '项目不存在');
  json(res, 200, {
    id: item.id, title: item.title,
    status: item.stage, statusLabel: item.stage,
    level: item.category, levelLabel: item.category,
    summary: item.summary || '', body: item.proposingBody || '',
    lastUpdate: item.updatedAt ? item.updatedAt.split('T')[0] : '',
    timeline: JSON.parse(item.timelineJson || '[]'),
    sourceUrl: item.sourceUrl || '',
  });
}

function handleLegislationTimeline(res, id) {
  const item = db.findById('legislation_projects', id);
  if (!item) return jsonError(res, 404, '项目不存在');
  json(res, 200, {
    id: item.id, title: item.title, currentStage: item.stage,
    timeline: JSON.parse(item.timelineJson || '[]'),
  });
}

function handleLegislationSearch(res, query) {
  const kw = (query.q || '').trim().toLowerCase();
  if (kw.length < 2) return json(res, 200, { suggestions: [] });
  const items = db.table('legislation_projects').filter(i => i.title.toLowerCase().includes(kw)).slice(0, 10);
  json(res, 200, { suggestions: items.map(i => ({ id: i.id, title: i.title })) });
}

// ── 司法案件 ──────────────────────────────────────
function handleCasesList(res, query) {
  const q = db.query('judicial_cases')
    .equals('stage', query.stage)
    .equals('caseType', query.case_type)
    .like('causeOfAction', query.cause)
    .sortBy('rulingDate')
    .paginate(query.page, query.page_size || query.pageSize);
  const result = q.execute();
  result.items = result.items.map(item => ({
    id: item.id, title: item.caseTitle,
    status: item.stage, statusLabel: item.stage,
    cause: item.causeOfAction, causeLabel: item.causeOfAction,
    court: item.court, date: item.rulingDate ? item.rulingDate.split('T')[0] : '',
    caseNo: item.caseNumber, summary: item.caseSummary,
    viewCount: item.viewCount, isHot: item.isHot,
  }));
  json(res, 200, result);
}

function handleCasesDetail(res, id) {
  let item = db.findById('judicial_cases', id);
  if (!item) return jsonError(res, 404, '案件不存在');
  item = db.update('judicial_cases', id, { viewCount: (item.viewCount || 0) + 1 });
  json(res, 200, {
    id: item.id, title: item.caseTitle,
    status: item.stage, statusLabel: item.stage,
    cause: item.causeOfAction, causeLabel: item.causeOfAction,
    court: item.court, date: item.rulingDate ? item.rulingDate.split('T')[0] : '',
    caseNo: item.caseNumber, summary: item.caseSummary,
    rulingPoints: item.rulingPoints, viewCount: item.viewCount, isHot: item.isHot,
    sourceUrl: item.sourceUrl || '',
  });
}

function handleCasesStats(res) {
  json(res, 200, {
    typeDistribution: db.groupBy('judicial_cases', 'caseType'),
    stageDistribution: db.groupBy('judicial_cases', 'stage'),
    monthlyTrend: db.countByDate('judicial_cases', 'rulingDate', 'month'),
    total: db.table('judicial_cases').length,
  });
}

// ── 司法政策 ──────────────────────────────────────
function handlePolicyList(res, query) {
  const q = db.query('judicial_policies')
    .equals('category', query.category)
    .like('issuingBody', query.issuing_body)
    .like('title', query.keyword)
    .gte('publishDate', query.date_from)
    .lte('publishDate', query.date_to)
    .boolean('isGuidingCase', query.is_guiding)
    .sortBy('publishDate')
    .paginate(query.page, query.page_size);
  json(res, 200, q.execute());
}

function handlePolicyDetail(res, id) {
  const item = db.findById('judicial_policies', id);
  if (!item) return jsonError(res, 404, '政策文件不存在');
  json(res, 200, item);
}

// ── 法律招聘 ──────────────────────────────────────
function handleRecruitmentList(res, query) {
  const q = db.query('legal_recruitments')
    .equals('city', query.city)
    .equals('jobType', query.type)
    .like('title', query.keyword)
    .where('isActive', 'eq', true)
    .sortBy('publishDate')
    .paginate(query.page, query.page_size || query.pageSize);
  const result = q.execute();
  result.items = result.items.map(item => ({
    id: item.id, title: item.title,
    company: item.company, city: item.city,
    type: item.jobType, typeLabel: item.jobType,
    salary: item.salaryRange,
    date: item.publishDate ? item.publishDate.split('T')[0] : '',
    source: item.wechatAccount, sourceUrl: item.wechatArticleUrl,
    education: item.education, experience: item.experience,
  }));
  json(res, 200, result);
}

function handleRecruitmentDetail(res, id) {
  const item = db.findById('legal_recruitments', id);
  if (!item) return jsonError(res, 404, '岗位不存在');
  json(res, 200, {
    id: item.id, title: item.title,
    company: item.company, city: item.city,
    type: item.jobType, typeLabel: item.jobType,
    salary: item.salaryRange, date: item.publishDate ? item.publishDate.split('T')[0] : '',
    source: item.wechatAccount, sourceUrl: item.wechatArticleUrl,
    education: item.education, experience: item.experience,
    description: item.description, requirements: item.requirements,
  });
}

function handleRecruitmentStats(res) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const actives = db.table('legal_recruitments').filter(r => r.isActive);
  const dailyNew = db.countByDate('legal_recruitments', 'publishDate', 'day')
    .filter(d => new Date(d.date) >= thirtyDaysAgo);
  json(res, 200, {
    cityDistribution: db.groupBy('legal_recruitments', 'city').filter(d => d.name).sort((a,b) => b.value - a.value).slice(0, 10),
    typeDistribution: db.groupBy('legal_recruitments', 'jobType'),
    dailyNewTrend: dailyNew,
    totalActive: actives.length,
  });
}

// ── 管理后台 ──────────────────────────────────────
async function handleAdminLogin(res, req) {
  const body = await parseBody(req);
  const user = db.table('admin_users').find(u => u.username === body.username && u.isActive);
  if (!user || !db.verifyPassword(body.password, user.passwordHash)) {
    return jsonError(res, 401, '用户名或密码错误');
  }
  db.update('admin_users', user.id, { lastLogin: new Date().toISOString() });
  const token = `${user.username}:${user.passwordHash}`;
  json(res, 200, { token, username: user.username, role: user.role });
}

function handleDashboard(res, user) {
  if (!user) return jsonError(res, 401, '未授权访问');
  const today = new Date(); today.setHours(0,0,0,0);
  const tables = ['lawyer_discipline','legislation_projects','judicial_cases','judicial_policies','legal_recruitments'];
  const totals = {}, todayNew = {};
  for (const t of tables) {
    totals[t] = db.table(t).length;
    todayNew[t] = db.table(t).filter(r => new Date(r.createdAt) >= today).length;
  }
  const lastLog = db.table('collection_logs').sort((a,b) => new Date(b.startedAt) - new Date(a.startedAt))[0];
  json(res, 200, {
    totals, todayNew,
    messagesUnread: db.table('messages').filter(m => !m.isRead).length,
    registrationsPending: db.table('event_registrations').filter(r => r.status === 'pending').length,
    lastCollection: lastLog ? { name: lastLog.collectorName, status: lastLog.status, startedAt: lastLog.startedAt, newAdded: lastLog.newAdded } : null,
  });
}

function handleMessages(res, user, query) {
  if (!user) return jsonError(res, 401, '未授权访问');
  const isRead = query.is_read;
  let items = [...db.table('messages')];
  if (isRead === '0') items = items.filter(m => !m.isRead);
  else if (isRead === '1') items = items.filter(m => m.isRead);
  items.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  const page = parseInt(query.page) || 1, ps = Math.min(parseInt(query.page_size) || 20, 100);
  const total = items.length;
  json(res, 200, {
    items: items.slice((page-1)*ps, page*ps),
    total, page, pageSize: ps, totalPages: Math.ceil(total/ps)
  });
}

function handleRegistrations(res, user, query) {
  if (!user) return jsonError(res, 401, '未授权访问');
  let items = [...db.table('event_registrations')].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  const page = parseInt(query.page) || 1, ps = Math.min(parseInt(query.page_size) || 20, 100);
  const total = items.length;
  json(res, 200, {
    items: items.slice((page-1)*ps, page*ps),
    total, page, pageSize: ps, totalPages: Math.ceil(total/ps)
  });
}

function handleCollectionLogs(res, user) {
  if (!user) return jsonError(res, 401, '未授权访问');
  const logs = [...db.table('collection_logs')].sort((a,b) => new Date(b.startedAt) - new Date(a.startedAt)).slice(0, 50);
  json(res, 200, logs);
}

async function handleAdminContent(res, req, user) {
  if (!user) return jsonError(res, 401, '未授权访问');
  if (req.method === 'GET') {
    json(res, 200, db.table('basic_content').sort((a,b) => a.orderIndex - b.orderIndex));
  } else {
    const body = await parseBody(req);
    const key = body.content_key;
    let item = db.table('basic_content').find(c => c.contentKey === key);
    if (item) {
      db.update('basic_content', item.id, {
        contentValue: body.content_value || item.contentValue,
        title: body.title || item.title,
        isPublished: body.is_published !== undefined ? body.is_published : item.isPublished,
      });
    } else {
      db.insert('basic_content', {
        contentKey: key, title: body.title || '', contentValue: body.content_value || '', isPublished: true,
      });
    }
    json(res, 200, null, '保存成功');
  }
}

// ── 留言提交（前端公开接口） ──────────────────────
async function handleMessageSubmit(res, req) {
  const body = await parseBody(req);
  const msg = db.insert('messages', {
    name: body.name || '匿名', email: body.email || '', phone: body.phone || '',
    company: body.company || '', content: body.content || '',
    category: body.category || 'general',
    isRead: false, isReplied: false, ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
  });
  json(res, 200, { id: msg.id }, '提交成功');
}

// ── 活动报名 ──────────────────────────────────────
async function handleEventRegister(res, req) {
  const body = await parseBody(req);
  const reg = db.insert('event_registrations', {
    eventId: body.event_id || 0, eventTitle: body.event_title || '',
    name: body.name, phone: body.phone, email: body.email || '',
    company: body.company || '', position: body.position || '',
    remark: body.remark || '', status: 'pending',
  });
  json(res, 200, { id: reg.id }, '报名成功');
}

// ── 基础内容查询（前端公开接口） ──────────────────
function handlePublicContent(res, query) {
  const key = query.key;
  const items = db.table('basic_content').filter(c => c.isPublished);
  if (key) {
    const item = items.find(c => c.contentKey === key);
    return json(res, 200, item || null);
  }
  json(res, 200, items);
}

// ── 合规声明 ──────────────────────────────────────
function handleCompliance(res) {
  json(res, 200, {
    icp: 'ICP备案号：待备案',
    copyright: '© 2026 沈家本研究院 版权所有',
    dataSource: '本平台所有公开数据均取自国家机关、律协、人大、官方公众号公开公示内容，仅作公益学术信息聚合检索',
    disclaimer: '本站数据不构成任何法律建议，仅供学术研究参考',
    feedbackEmail: 'feedback@shenjiaben.org',
  });
}

// ── 筛选选项 ──────────────────────────────────────
function handleFilterOptions(res, tableName, field) {
  const values = [...new Set(db.table(tableName).map(r => r[field]).filter(Boolean))].sort();
  json(res, 200, values);
}

// ═══════════════════════════════════════════════════
// 路由表
// ═══════════════════════════════════════════════════
const ROUTES = [
  // 首页
  ['GET', '/api/v1/home/stats', (r,q) => handleHomeStats(r)],
  ['GET', '/api/v1/home/feed', (r,q) => handleHomeFeed(r, q)],
  ['GET', '/api/v1/home/latest', (r,q) => handleHomeFeed(r, q)],

  // 律师处罚
  ['GET', '/api/v1/discipline/list', (r,q) => handleDisciplineList(r, q)],
  ['GET', '/api/v1/discipline/stats', (r,q) => handleDisciplineStats(r)],
  ['GET', '/api/v1/discipline/search', (r,q) => handleDisciplineSearch(r, q)],
  ['GET', '/api/v1/discipline/provinces', (r,q) => handleFilterOptions(r, 'lawyer_discipline', 'firmProvince')],

  // 立法追踪
  ['GET', '/api/v1/legislation/list', (r,q) => handleLegislationList(r, q)],
  ['GET', '/api/v1/legislation/search', (r,q) => handleLegislationSearch(r, q)],
  ['GET', '/api/v1/legislation/stages', (r) => json(r, 200, ['立法建议','起草中','审议中','公开征求意见','已通过','已公布','已生效','修订中'])],

  // 司法案件
  ['GET', '/api/v1/cases/list', (r,q) => handleCasesList(r, q)],
  ['GET', '/api/v1/cases/stats', (r,q) => handleCasesStats(r)],

  // 司法政策
  ['GET', '/api/v1/policy/list', (r,q) => handlePolicyList(r, q)],

  // 法律招聘
  ['GET', '/api/v1/recruitment/list', (r,q) => handleRecruitmentList(r, q)],
  ['GET', '/api/v1/recruitment/search', (r,q) => handleRecruitmentSearch(r, q)],
  ['GET', '/api/v1/recruitment/stats', (r,q) => handleRecruitmentStats(r)],
  ['GET', '/api/v1/recruitment/cities', (r,q) => handleFilterOptions(r, 'legal_recruitments', 'city')],

  // 公开接口
  ['POST', '/api/v1/messages', (r,q,b) => handleMessageSubmit(r, b)],
  ['POST', '/api/v1/event-register', (r,q,b) => handleEventRegister(r, b)],
  ['GET', '/api/v1/content', (r,q) => handlePublicContent(r, q)],
  ['GET', '/api/v1/compliance', (r) => handleCompliance(r)],

  // 管理后台
  ['POST', '/api/v1/admin/login', (r,q,b) => handleAdminLogin(r, b)],

  // ── 静态内容页面 API ──────────────────────────────
  // 研究院概况
  ['GET', '/api/v1/about/intro', (r) => handleContentPage(r, 'about_intro')],
  ['GET', '/api/v1/about/structure', (r) => handleContentPage(r, 'about_structure')],
  ['GET', '/api/v1/about/history', (r) => handleContentPage(r, 'about_history')],
  ['GET', '/api/v1/about/team', (r) => handleContentPage(r, 'about_team')],
  // 文化研究中心
  ['GET', '/api/v1/research/archives', (r) => handleContentPage(r, 'research_archives')],
  ['GET', '/api/v1/research/works', (r) => handleContentPage(r, 'research_works')],
  ['GET', '/api/v1/research/topics', (r) => handleContentPage(r, 'research_topics')],
  ['GET', '/api/v1/research/study', (r) => handleContentPage(r, 'research_study')],
  ['GET', '/api/v1/research/projects', (r) => handleContentPage(r, 'research_projects')],
  // 合作交流
  ['GET', '/api/v1/cooperation/partners', (r) => handleContentPage(r, 'cooperation_partners')],
  ['GET', '/api/v1/cooperation/conferences', (r) => handleContentPage(r, 'cooperation_conferences')],
  ['GET', '/api/v1/cooperation/international', (r) => handleContentPage(r, 'cooperation_international')],
  // 联系我们
  ['GET', '/api/v1/contact/info', (r) => handleContentPage(r, 'contact_info')],
  // 商事调解
  ['GET', '/api/v1/mediation/intro', (r) => handleContentPage(r, 'mediation_intro')],
  ['GET', '/api/v1/mediation/process', (r) => handleContentPage(r, 'mediation_process')],
  // 活动专栏
  ['GET', '/api/v1/events', (r,q) => handleEventsList(r, q)],
  // 成果出版物
  ['GET', '/api/v1/publications', (r,q) => handlePublicationsList(r, q)],
  // 立法统计
  ['GET', '/api/v1/legislation/stats', (r) => handleLegislationStats(r)],
];

// 动态路由（带ID参数）
function matchDynamicRoute(method, pathname, req, res, query) {
  const patterns = [
    // 详情路由 — 支持 /detail/:id 和 /:id 两种路径
    [/^\/api\/v1\/discipline\/detail\/(\d+)$/, 'GET', (id) => handleDisciplineDetail(res, parseInt(id))],
    [/^\/api\/v1\/discipline\/(\d+)$/, 'GET', (id) => handleDisciplineDetail(res, parseInt(id))],
    [/^\/api\/v1\/legislation\/detail\/(\d+)$/, 'GET', (id) => handleLegislationDetail(res, parseInt(id))],
    [/^\/api\/v1\/legislation\/(\d+)$/, 'GET', (id) => handleLegislationDetail(res, parseInt(id))],
    [/^\/api\/v1\/legislation\/timeline\/(\d+)$/, 'GET', (id) => handleLegislationTimeline(res, parseInt(id))],
    [/^\/api\/v1\/cases\/detail\/(\d+)$/, 'GET', (id) => handleCasesDetail(res, parseInt(id))],
    [/^\/api\/v1\/cases\/(\d+)$/, 'GET', (id) => handleCasesDetail(res, parseInt(id))],
    [/^\/api\/v1\/policy\/detail\/(\d+)$/, 'GET', (id) => handlePolicyDetail(res, parseInt(id))],
    [/^\/api\/v1\/recruitment\/detail\/(\d+)$/, 'GET', (id) => handleRecruitmentDetail(res, parseInt(id))],
    [/^\/api\/v1\/recruitment\/(\d+)$/, 'GET', (id) => handleRecruitmentDetail(res, parseInt(id))],
    // 活动详情
    [/^\/api\/v1\/events\/(\d+)$/, 'GET', (id) => handleEventDetail(res, parseInt(id))],
    [/^\/api\/v1\/admin\/messages\/(\d+)\/read$/, 'POST', (id) => {
      const user = verifyToken(req);
      if (!user) return jsonError(res, 401, '未授权访问');
      db.update('messages', parseInt(id), { isRead: true });
      json(res, 200, null);
    }],
  ];

  for (const [pattern, httpMethod, handler] of patterns) {
    if (method !== httpMethod) continue;
    const match = pathname.match(pattern);
    if (match) {
      handler(match[1]);
      return true;
    }
  }

  // 管理后台受保护路由
  if (pathname.startsWith('/api/v1/admin/')) {
    const user = verifyToken(req);
    if (!user) return jsonError(res, 401, '未授权访问');

    if (pathname === '/api/v1/admin/dashboard' && method === 'GET') return handleDashboard(res, user), true;
    if (pathname === '/api/v1/admin/messages' && method === 'GET') return handleMessages(res, user, query), true;
    if (pathname === '/api/v1/admin/registrations' && method === 'GET') return handleRegistrations(res, user, query), true;
    if (pathname === '/api/v1/admin/collection-logs' && method === 'GET') return handleCollectionLogs(res, user), true;
    if (pathname === '/api/v1/admin/content' && (method === 'GET' || method === 'POST')) return handleAdminContent(res, req, user), true;
  }

  return false;
}

function handleRecruitmentSearch(res, query) {
  const kw = (query.q || '').trim().toLowerCase();
  if (kw.length < 2) return json(res, 200, { suggestions: [] });
  const items = db.table('legal_recruitments')
    .filter(r => r.isActive && (r.title.toLowerCase().includes(kw) || r.company.toLowerCase().includes(kw)))
    .slice(0, 10);
  json(res, 200, { suggestions: items.map(i => ({ id: i.id, title: i.title, company: i.company })) });
}

// ── 静态内容页面 ──────────────────────────────────
function handleContentPage(res, pageKey) {
  const pages = db.table('content_pages');
  const page = pages.find(p => p.key === pageKey && p.isActive);
  if (!page) {
    return json(res, 200, getDefaultContent(pageKey));
  }
  json(res, 200, page.data || {});
}

function getDefaultContent(key) {
  const defaults = {
    about_intro: [
      { title: '研究院简介', content: '沈家本研究院是以中国法律现代化之父——沈家本先生命名，专注法治文化传承、法律学术研究、法律数据聚合分析的非营利性研究机构。' },
      { title: '办院宗旨', content: '传承沈家本先生法学精神，推动法治文化研究与传播，助力中国特色社会主义法治体系建设。' },
    ],
    about_structure: [
      { title: '院长办公室', content: '负责研究院全面工作规划与决策。' },
      { title: '学术委员会', content: '由国内外知名法学专家组成，负责学术方向把握与成果评审。' },
      { title: '沈家本文化研究中心', content: '专注沈家本生平、著作、法律思想研究与传播。' },
      { title: '数据法治研究所', content: '运营法律数据聚合平台，开展法治数据研究。' },
      { title: '商事调解中心', content: '提供专业商事纠纷调解服务。' },
      { title: '综合办公室', content: '负责行政、后勤、对外联络等日常工作。' },
    ],
    about_history: [
      { year: '2024年', event: '沈家本研究院获批成立' },
      { year: '2024年', event: '沈家本文化研究中心设立' },
      { year: '2025年', event: '商事调解中心挂牌运行' },
      { year: '2025年', event: '数据法治研究所成立，法律数据聚合平台上线' },
      { year: '2026年', event: '全国律师行政处罚查询系统正式发布' },
      { year: '2026年', event: '官网全新改版，实现全自动数据聚合' },
    ],
    about_team: [
      { name: '张明楷', title: '名誉院长', description: '著名刑法学家' },
      { name: '陈兴良', title: '学术委员会主任', description: '北京大学法学院教授' },
      { name: '王利明', title: '学术委员', description: '中国人民大学法学院教授' },
      { name: '沈厚铎', title: '特邀顾问', description: '沈家本后人、法律文化学者' },
    ],
    research_archives: [
      { title: '《历代刑法考》研究', description: '沈家本的代表性著作，系统考证中国古代法律制度。', category: '原著研究', year: '2024' },
      { title: '《寄簃文存》校注', description: '沈家本法学文集校注整理。', category: '文献整理', year: '2025' },
      { title: '《沈家本全集》编纂', description: '全面收录沈家本著作、奏折、信函等文献。', category: '文献整理', year: '2026' },
    ],
    research_works: [
      { title: '《沈家本法律思想研究》', author: '李贵连', description: '系统阐述沈家本的法律改革思想。', year: '2023' },
      { title: '《近代中国法制变迁》', author: '何勤华', description: '以沈家本修律为中心考察近代中国法制。', year: '2024' },
      { title: '《大清律例与近代转型》', author: '苏亦工', description: '从大清律例到近代法律体系的转型研究。', year: '2024' },
    ],
    research_topics: [
      { title: '沈家本修律与清末法制改革', status: '进行中', leader: '学术委员会' },
      { title: '中国传统法律文化的现代价值', status: '进行中', leader: '文化研究中心' },
      { title: '大数据驱动的法律信息服务研究', status: '筹备中', leader: '数据法治研究所' },
    ],
    research_study: [
      { title: '沈家本法学思想青年研习营', date: '2026年7月', description: '面向全国高校法学研究生的暑期研习项目。' },
      { title: '法律古籍整理方法培训', date: '2026年9月', description: '邀请文献学专家讲授法律古籍整理方法。' },
    ],
    research_projects: [
      { title: '沈家本修律与清末法制改革', leader: '学术委员会', status: '进行中', progress: 60 },
      { title: '中国传统法律文化的现代价值', leader: '文化研究中心', status: '进行中', progress: 40 },
      { title: '大数据驱动的法律信息服务研究', leader: '数据法治研究所', status: '筹备中', progress: 15 },
    ],
    cooperation_partners: [
      { name: '中国政法大学', description: '法律史学科合作共建单位' },
      { name: '北京大学法学院', description: '法学研究合作基地' },
      { name: '中国人民大学法学院', description: '数据法治联合实验室' },
      { name: '华东政法大学', description: '沈家本学术研究协作单位' },
      { name: '全国律师协会', description: '律师行业数据合作单位' },
    ],
    cooperation_conferences: [
      { title: '第七届沈家本法律文化国际研讨会', date: '2025年10月', location: '北京', description: '来自10个国家的120余位学者参会。' },
      { title: '第二届法治数据智能应用论坛', date: '2026年3月', location: '上海', description: '探讨大数据、AI在法律服务中的应用。' },
    ],
    cooperation_international: [
      { title: '中日法律文化交流项目', partner: '日本东京大学法学部', year: '2025' },
      { title: '中德法治对话合作', partner: '德国马普研究所', year: '2026' },
    ],
    contact_info: {
      address: '北京市海淀区中关村南大街27号', phone: '010-12345678', email: 'info@shenjiaben.org',
      workingHours: '周一至周五 9:00-17:00',
    },
    mediation_intro: [
      { title: '中心简介', content: '沈家本研究院商事调解中心是经司法行政机关备案的专业商事纠纷调解机构，汇聚资深律师、退休法官、法学教授等专业调解力量。' },
      { title: '调解优势', content: '与诉讼相比，商事调解具有程序灵活、成本低廉、保密性强、维护商业关系等显著优势。' },
    ],
    mediation_process: [
      { step: '1', title: '申请受理', description: '当事人提交调解申请，中心审查受理。' },
      { step: '2', title: '选定调解员', description: '双方当事人共同选定或由中心指定调解员。' },
      { step: '3', title: '调解会议', description: '调解员主持调解会议，协助双方协商。' },
      { step: '4', title: '达成协议', description: '双方达成调解协议，签署调解书。' },
      { step: '5', title: '协议履行', description: '双方按协议约定履行，必要时可申请司法确认。' },
    ],
  };
  return defaults[key] || { message: '内容建设中' };
}

// ── 活动专栏 ──────────────────────────────────────
function handleEventsList(res, query) {
  const keyword = (query.keyword || '').toLowerCase();
  const page = parseInt(query.page) || 1;
  const pageSize = Math.min(parseInt(query.pageSize) || 10, 50);
  const category = query.category || '';

  let items = db.table('events').filter(e => e.isActive !== false);
  if (keyword) items = items.filter(e => e.title.toLowerCase().includes(keyword) || (e.description||'').toLowerCase().includes(keyword));
  if (category) items = items.filter(e => e.category === category);
  items = items.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));

  const total = items.length;
  const start = (page - 1) * pageSize;
  json(res, 200, { items: items.slice(start, start + pageSize), total, page, pageSize, totalPages: Math.ceil(total/pageSize) });
}

function handleEventDetail(res, id) {
  const item = db.table('events').find(e => e.id === id);
  if (!item) return jsonError(res, 404, '活动不存在');
  json(res, 200, item);
}

// ── 成果出版物 ────────────────────────────────────
function handlePublicationsList(res, query) {
  const keyword = (query.keyword || '').toLowerCase();
  const page = parseInt(query.page) || 1;
  const pageSize = Math.min(parseInt(query.pageSize) || 12, 50);
  const category = query.category || '';
  const year = query.year || '';

  let items = db.table('publications').filter(p => p.isActive !== false);
  if (keyword) items = items.filter(p => p.title.toLowerCase().includes(keyword) || p.author.toLowerCase().includes(keyword));
  if (category) items = items.filter(p => p.category === category);
  if (year) items = items.filter(p => String(p.year) === year);
  items = items.sort((a, b) => b.year - a.year);

  const total = items.length;
  const start = (page - 1) * pageSize;
  json(res, 200, { items: items.slice(start, start + pageSize), total, page, pageSize, totalPages: Math.ceil(total/pageSize) });
}

// ── 立法统计 ──────────────────────────────────────
function handleLegislationStats(res) {
  const items = db.table('legislation_projects');
  const byStage = {}, byMonth = {};
  for (const item of items) {
    byStage[item.stage] = (byStage[item.stage] || 0) + 1;
    const month = item.updatedAt ? item.updatedAt.substring(0, 7) : '未知';
    byMonth[month] = (byMonth[month] || 0) + 1;
  }
  json(res, 200, {
    summary: { total: items.length },
    stages: Object.entries(byStage).map(([name, count]) => ({ name, count })),
    monthly: Object.entries(byMonth).map(([month, count]) => ({ month, count })).sort(),
  });
}

// ═══════════════════════════════════════════════════
// HTTP 服务器
// ═══════════════════════════════════════════════════
const server = http.createServer(async (req, res) => {
  // CORS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  const { pathname, query } = parseQuery(req);

  // 健康检查
  if (pathname === '/api/v1/health') {
    return json(res, 200, { status: 'healthy', timestamp: new Date().toISOString() });
  }

  // API 根
  if (pathname === '/api/v1/' || pathname === '/api/v1') {
    return json(res, 200, {
      name: '沈家本研究院 API v1',
      endpoints: ['/home/stats','/home/feed','/discipline/*','/legislation/*','/cases/*','/policy/*','/recruitment/*','/admin/*','/compliance','/content','/messages'],
    });
  }

  // 匹配静态路由
  for (const [method, routePath, handler] of ROUTES) {
    if (req.method === method && pathname === routePath) {
      return handler(res, query, req);
    }
  }

  // 匹配动态路由
  if (matchDynamicRoute(req.method, pathname, req, res, query)) return;

  // ── 静态文件服务 ──────────────────────────────────
  // 将 /xxx.html 或 / 映射到 STATIC_ROOT/xxx.html
  let staticPath = pathname;
  if (staticPath === '/') staticPath = '/index.html';
  if (!path.extname(staticPath)) staticPath += '.html';  // SPA 风格

  const filePath = path.join(STATIC_ROOT, staticPath);
  if (serveStatic(res, filePath)) return;

  // 404
  jsonError(res, 404, '页面或接口不存在');
});

// ── 启动 ──────────────────────────────────────────
// 种子数据
if (process.argv.includes('--seed')) {
  require('./seed').seed();
}

server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('  沈家本研究院 API 服务');
  console.log(`  地址: http://localhost:${PORT}`);
  console.log(`  API:  http://localhost:${PORT}/api/v1/`);
  console.log(`  管理员: admin / shenjiaben2026`);
  console.log('='.repeat(50));
});
