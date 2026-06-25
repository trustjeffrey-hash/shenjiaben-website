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
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // 各表对应的日期字段映射
  const dateFields = {
    lawyer_discipline: 'disciplineDate',
    legislation_projects: 'updatedAt',
    judicial_cases: 'filingDate',
    judicial_policies: 'publishDate',
    legal_recruitments: 'publishDate',
  };

  const stats = {};
  for (const t of Object.keys(dateFields)) {
    const all = db.table(t);
    const dateField = dateFields[t];
    const todayNew = all.filter(r => new Date(r[dateField]) >= today).length;
    const weekNew = all.filter(r => new Date(r[dateField]) >= weekStart).length;
    const monthNew = all.filter(r => new Date(r[dateField]) >= monthStart).length;
    stats[t] = { total: all.length, todayNew, weekNew, monthNew };
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
    icp: 'ICP备案号：待备案（域名备案完成后填入备案编号）',
    copyright: '© 2026 湖州市沈家本研究院 版权所有',
    dataSource: '本平台所有公开数据均取自国家机关、律协、人大、官方公众号公开公示内容，仅作公益学术信息聚合检索',
    disclaimer: '本站数据不构成任何法律建议，仅供学术研究参考',
    feedbackEmail: 'info@hz-shenjiaben.org',
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
  ['GET', '/api/v1/about/shenjiaben', (r) => handleContentPage(r, 'shenjiaben_timeline')],
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
    about_intro: { content: '湖州市沈家本研究院坐落于吴兴西塞山旅游度假区妙西镇沈家本历史文化园内，2020年11月经湖州市民政局正式登记注册，是湖州地区唯一以系统研究、整理、传播近代法制奠基人沈家本法治思想为核心职能的非营利性学术研究机构。研究院现任专职院长王俊峰，聘任同济大学法学院院长蒋惠岭担任兼职院长，汇聚法学学界专家、实务法官、资深律师、沈家本家族后人组成学术委员会与研究员队伍，立足家本故里地缘优势，深耕中华优秀传统法律文化挖掘转化，打造集文献整理、学术研究、校地协同、商事调解、法治研学、实务服务于一体的特色法治智库平台。\n\n研究院设立六大内设机构：学术研究部、文献史料中心、商事调解研究中心、研学活动部、对外合作部、行政综合部，各司其职推进各项业务落地。在学术研究层面，系统整理《沈家本全集》、枕碧楼藏书手稿、晚清修律奏折、年谱碑刻等一手史料，梳理沈家本"会通中西、慎刑恤狱、定分止争、契约为本"核心法治理念，围绕传统民商事思想、清末修律变革、多元纠纷解决机制等方向开展课题研究，推出专著汇编、论文集、通俗普法读本等系列成果，跳出单纯史料考据，推动传统法理适配当代企业合规、商事调解、基层治理现实需求。\n\n在校地协同方面，研究院已与中国政法大学法律学院达成深度共建，落地校外教学实践基地，常态化开展师生现场研学、联合课题攻关、双向讲座交流；联动湖州市、吴兴区两级司法行政机关、多家头部律所、地方龙头企业，搭建长三角法商交流纽带，先后承办WELEGAL六一五法务节、行业合规私董会、法治文化论坛等交流活动，持续输出法学交流场景与实务研究成果。\n\n依托沈家本"息讼安民"治世理念，研究院挂牌商事调解研究中心，聚焦买卖合同、知识产权、股权债权、电商经营等商事纠纷，开展诉前委派调解、争议调处、调解理论研究与调解员培育工作，助力完善区域多元化纠纷解决体系，优化地方营商环境。\n\n面向社会大众与青少年群体，研究院依托沈家本历史文化园展馆空间开发分层法治研学课程，面向党政机关、学校、企事业单位承接参观讲解、普法教育、主题党建活动，用通俗叙事解读传统法治文脉。\n\n未来，在专职院长王俊峰统筹管理、兼职院长蒋惠岭学术引领之下，湖州市沈家本研究院将持续擦亮"家本故里·法治湖州"文化名片，持续打通传统法律文化传承、法学人才培育、商事实务服务三条路径，为全面依法治国落地实践、长三角一体化法治建设提供兼具历史底蕴与现实价值的本土智力支撑。' },
    about_structure: { departments: [
      { name: '院管理层', desc: '研究院决策与管理核心', sub: ['兼职院长：蒋惠岭（统筹学术研究、课题规划、专家智库建设、商事调解理论研究）', '专职院长：王俊峰（全面统筹研究院运营、行政、对外合作、整体发展规划）', '学术委员会：沈家本研究学者、高校法学教授、退休司法实务专家、资深律师、沈家本后裔'] },
      { name: '学术研究部', desc: '课题申报、论文专著编撰、学术论坛筹办', sub: [] },
      { name: '文献史料中心', desc: '沈家本文献馆藏整理、古籍归档、史料校对汇编', sub: [] },
      { name: '商事调解研究中心', desc: '商事纠纷调解、调解员管理、调解机制课题研究', sub: [] },
      { name: '研学活动部', desc: '研学课程开发、接待讲解、普法活动、团建党建运营', sub: [] },
      { name: '对外合作部', desc: '高校对接、政企合作、行业平台联动、外部资源拓展', sub: [] },
      { name: '行政综合部', desc: '人事、财务、公章管理、日常行政、网站公众号运维', sub: [] },
      { name: '执行对接窗口', desc: '王主任 13082838161', sub: [] },
    ]},
    about_history: { items: [
      { year: '2020年11月', event: '湖州市沈家本研究院经湖州市民政局正式登记注册成立，落户吴兴西塞山旅游度假区妙西镇。' },
      { year: '2020年11月', event: '第二届「沈家本与中国法律文化」学术研讨会暨纪念沈家本诞辰180周年活动在湖州召开，中国政法大学与湖州市委市政府共同举办，140余名专家学者参会。' },
      { year: '2021年4月', event: '沈家本历史文化园正式开园，同步举办「吴兴论坛——中国法治发展战略」，园内设法治文化展厅、研学教室、枕碧楼文献展等主题空间。' },
      { year: '2021年', event: '聘任同济大学法学院院长蒋惠岭担任研究院兼职院长，统筹学术研究、课题规划与商事调解理论研究。' },
      { year: '2022年', event: '与中国政法大学法律学院达成深度共建，落地校外教学实践基地，常态化开展师生现场研学、联合课题攻关与双向讲座交流。' },
      { year: '2022年6月', event: '《沈家本手稿五种》由杭州华宝斋书社影印出版（五册一函），湖州市沈家本研究院发行，为中国法学界首度披露沈家本部分未刊手稿。同济大学法学院院长蒋惠岭、中国社科院孙家红出席首发式。' },
      { year: '2022年8月', event: '「乡心正不远——沈家本诗歌座谈会」在沈家本历史文化园举办，沈家本后裔、法学界与诗歌界学者共话其文学遗产。' },
      { year: '2022年9月', event: '沈家本历史文化园入选首届浙江省「最美公共文化空间」，成为法治文化新地标。' },
      { year: '2022年11月', event: '浙江省法学会浙籍法学家研究会2022年年会由沈家本研究院承办，省内外法学界聚焦浙籍法学家的当代价值。' },
      { year: '2023年', event: '浙江省法学会法学教育研究会年会在沈家本历史文化园召开，聚焦法学教育与法治文化传承。' },
      { year: '2023年', event: '研究院挂牌商事调解研究中心，正式组建调解员队伍，面向买卖合同、知识产权、股权债权、电商经营等商事纠纷领域，开展诉前委派调解与调解理论研究。' },
      { year: '2025年', event: '启动法治研学课程体系，面向党政机关、学校、企事业单位承接参观讲解、普法教育与主题党建活动。' },
      { year: '2026年3月', event: '湖州市司法局与同济大学法学院签署法治文化校地合作协议，在沈家本研究院设立联合研究基地。' },
      { year: '2026年4月', event: '同济大学法学院师生赴沈家本历史文化园开展「寻沈家本故里·访大余村两山」沉浸式研学活动，蒋惠岭院长、段存广书记带队。' },
      { year: '2026年6月', event: '2026湖州未来大会·第八届WELEGAL六一五法务节在沈家本历史文化园举行，300余名企业法总、学者、实务专家参会，首创「法治文化地标行」新范式。' },
      { year: '2026年', event: '官网全新上线，集成律师处罚查询、立法追踪、案件评析、政策汇总、招聘聚合五大法律数据模块，以全自动法律数据聚合平台服务法治建设。' },
    ]},
    shenjiaben_timeline: { items: [
      { year: '1840年（道光二十年）', event: '沈家本出生于浙江湖州府归安县（今浙江吴兴），字子惇，号寄簃。父沈丙莹，官至刑部郎中。' },
      { year: '1862年（同治元年）', event: '22岁，考中举人。' },
      { year: '1864年（同治三年）', event: '父亲沈丙莹被弹劾去官回乡，沈家本援例到刑部任郎中，由此开始系统学习法律，奠定一生法学根基。' },
      { year: '1883年（光绪九年）', event: '43岁，考中进士，仍留刑部供职。在此期间系统整理研究中国古代法制资料，精研律例。' },
      { year: '1886年（光绪十二年）', event: '第一部公开印行的法学著作《刺字集》成书刊行，对清代刺字刑制进行了系统考证与批判。' },
      { year: '1892年（光绪十八年）', event: '外放天津知府，任内宽严结合、恩威并施。完成《秋谳须知》《律例偶笺》《律例杂说》等十余部法学书稿。' },
      { year: '1897年（光绪二十三年）', event: '调任保定知府，妥善处理保定北关法国教堂被焚交涉案，驳回法国教士侵占保定府署东侧房产的无理要求，维护国家主权。' },
      { year: '1899年（光绪二十五年）', event: '《刑案汇览三编》成书，共124卷，附录中外交涉案件，为研究清末领事裁判权提供重要史料。' },
      { year: '1900年（光绪二十六年）', event: '升任山西按察使，未及赴任。因曾驳回法国教士无理要求被诬告私通义和团，遭八国联军拘留，后恢复自由。' },
      { year: '1901年（光绪二十七年）', event: '升任刑部右侍郎，回京就职，开启一生最辉煌的修律时期。' },
      { year: '1902年（光绪二十八年）', event: '与伍廷芳一同被保举为修订法律大臣，主持晚清修律，以收回领事裁判权为目标，拉开中国法律近代化序幕。' },
      { year: '1904年（光绪三十年）', event: '主持筹备的修订法律馆正式开馆，大规模翻译研究东西各国法律、整理中国法律旧籍。' },
      { year: '1905年（光绪三十一年）', event: '与伍廷芳联名上《删除律例内重法折》，奏请废除凌迟、枭首、戮尸三项酷刑，获准。死刑仅保留斩、绞两种。' },
      { year: '1906年（光绪三十二年）', event: '中国第一所中央官办法律专门学校——京师法律学堂正式开学，沈家本任管理学务大臣（校长），开启中国近代法学教育先河。' },
      { year: '1907年（光绪三十三年）', event: '主持编成《大清现行刑律》，删除缘坐、刺字等酷刑，禁止刑讯逼供和买卖人口，废除满汉异法，统一刑律。' },
      { year: '1910年（宣统二年）', event: '兼任资政院副总裁。《大清现行刑律》正式颁布施行。' },
      { year: '1911年（宣统三年）', event: '主持的《大清新刑律》在资政院常年会通过总则部分。后遭礼教派反对，被免去修订法律大臣和资政院副总裁职务，回任法部左侍郎。引疾辞官，退居家中整理古籍。' },
      { year: '1912年（民国元年）', event: '清帝退位。沈家本结束近五十年仕途生涯，引疾不出，专心著述，完成晚年代表作《汉律摭遗》。' },
      { year: '1913年6月9日', event: '沈家本在北京寓所病逝，享年73岁。其墓志铭称"公之学，由经入史，以律为归；公之志，融通中西，折衷至当"。' },
    ]},
    about_team: { members: [
      { name: '蒋惠岭', title: '兼职院长', bio: '同济大学法学院院长，统筹学术研究、课题规划、专家智库建设与商事调解理论研究。' },
      { name: '王俊峰', title: '专职院长', bio: '全面统筹研究院运营、行政、对外合作与整体发展规划。' },
    ]},
    research_archives: { items: [
      { title: '《沈家本手稿五种》', desc: '2022年6月由杭州华宝斋书社影印出版（五册一函），湖州市沈家本研究院发行。首次披露部分未刊手稿，含日记、书札、律学笔记等珍贵文献。', category: '文献整理', year: '2022' },
      { title: '沈家本全集增补', desc: '在已出版八卷本《沈家本全集》基础上，持续搜集、校勘新发现手稿、信函、奏折等文献。', category: '文献整理', year: '2025' },
      { title: '枕碧楼藏书编目研究', desc: '梳理沈家本"枕碧楼"所藏五万余卷古籍善本，编制专题目录并开展学术研究。', category: '文献整理', year: '2024' },
      { title: '《历代刑法考》校注', desc: '沈家本的代表性著作，系统考证中国古代法律制度，正在开展现代校注工作。', category: '原著研究', year: '2024' },
      { title: '《寄簃文存》校注', desc: '沈家本法学文集校注整理，收录其序跋、论说、考释等代表性文论。', category: '文献整理', year: '2025' },
    ]},
    research_works: { items: [
      { title: '《沈家本手稿五种》（影印本）', author: '湖州市沈家本研究院 编', description: '五册一函，杭州华宝斋书社2022年6月影印出版。收录日记、书札、律学笔记等未刊手稿，为中国法学界首度披露部分珍贵文献。孙家红撰写出版前言。', year: '2022' },
      { title: '《玉骨冰心冷不摧——沈家本诗集》', author: '沈家本研究院 编', description: '纪念沈家本诞辰180周年专题出版物，汇集沈家本生平诗作及学界纪念文章。', year: '2020' },
      { title: '《沈家本与中国法律文化论集》', author: '研究院学术委员会 编', description: '第二届沈家本与中国法律文化学术研讨会论文精选集，收入140余位学者的研究成果。', year: '2021' },
      { title: '《会通中西：沈家本法律思想研究》', author: '学术研究部', description: '研究院核心课题成果，系统梳理沈家本"会通中西、慎刑恤狱、定分止争、契约为本"核心法治理念。', year: '2024' },
    ]},
    research_topics: { items: [
      { name: '沈家本修律与清末法制改革', status: '进行中', period: '2024-2026', desc: '系统研究沈家本主持修律的历史背景、制度设计与历史影响。' },
      { name: '沈家本"会通中西"法律思想研究', status: '进行中', period: '2024-2026', desc: '梳理沈家本"会通中西、慎刑恤狱、定分止争、契约为本"核心法治理念及其当代价值。' },
      { name: '中国传统法律文化的现代转化', status: '进行中', period: '2025-2027', desc: '跳出单纯史料考据，推动传统法理适配企业合规、商事调解、基层治理等现实需求。' },
      { name: '多元纠纷解决机制比较研究', status: '筹备中', period: '2025-2027', desc: '依托商事调解研究中心，比较诉讼、仲裁、调解三大争议解决路径的实践效能。' },
    ]},
    research_study: { items: [
      { title: '沈家本法学思想青年研习营', date: '2026年7月', description: '面向全国高校法学研究生的暑期研习项目。深入沈家本故里开展史料研读、学术讲座、田野调查、古籍整理实践等沉浸式研学活动。' },
      { title: '同济大学法学院「寻沈家本故里」研学', date: '2026年4月', description: '蒋惠岭院长带队，同济大学法学院师生赴湖州沈家本历史文化园及大余村，开展现场教学与法治文化体验。' },
      { title: '大运河阅读行动·湖州站', date: '2022年6月', description: '大运河阅读行动走进沈家本历史文化园，举办阅读分享与法治文化体验活动。' },
      { title: '「乡心正不远」沈家本诗歌品读会', date: '2022年8月', description: '沈家本后裔、法学界与诗歌界学者共话沈家本文学遗产。' },
    ]},
    research_projects: { items: [
      { name: '沈家本修律与清末法制改革', status: '进行中', period: '2024-2025', desc: '系统研究沈家本主持修律的历史背景、制度设计与历史影响。' },
      { name: '中国传统法律文化的现代价值', status: '进行中', period: '2024-2026', desc: '挖掘传统法律文化中可资借鉴的理念与制度资源。' },
      { name: '大数据驱动的法律信息服务研究', status: '筹备中', period: '2025-2027', desc: '探索大数据、AI技术在法律数据聚合与分析中的应用。' },
    ]},
    cooperation_partners: { items: [
      { name: '中国政法大学', type: '法律学院深度共建单位，校外教学实践基地' },
      { name: '同济大学法学院', type: '校地协同合作单位，院长蒋惠岭担任研究院兼职院长' },
      { name: 'WELEGAL法盟', type: '法商交流合作平台，联合承办六一五法务节等行业活动' },
      { name: '北京炜衡律师事务所', type: '实务研究合作律所，商事调解专业支持' },
      { name: '北京浩天律师事务所', type: '实务研究合作律所，法治研学联合承办' },
    ]},
    cooperation_conferences: { items: [
      { title: '第八届WELEGAL六一五法务节暨法治文化地标行', date: '2026年6月14日', topic: '法商融合·产业合规·多元纠纷解决', location: '湖州沈家本历史文化园', scale: '300余人' },
      { title: '同济大学法学院「寻沈家本故里」沉浸式研学', date: '2026年4月11日', topic: '法治文化·两山理念·法律人使命', location: '湖州沈家本历史文化园/大余村', scale: '师生代表团' },
      { title: '湖州市司法局与同济大学法学院校地合作签约', date: '2026年3月', topic: '法治文化研究·人才培育·课题共建', location: '同济大学法学院', scale: '' },
      { title: '浙江省法学会法学教育研究会年会', date: '2023年', topic: '法学教育与法治文化传承', location: '湖州沈家本历史文化园', scale: '' },
      { title: '浙江省法学会浙籍法学家研究会年会', date: '2022年11月', topic: '浙籍法学家的当代价值', location: '湖州（沈家本研究院承办）', scale: '' },
      { title: '第二届沈家本与中国法律文化学术研讨会', date: '2020年11月21-22日', topic: '纪念沈家本诞辰180周年·法治文化传承', location: '湖州东吴开元名都酒店', scale: '140余人' },
    ]},
    cooperation_international: { items: [
      { title: '中日法律文化交流考察', partner: '日本法学界（东京大学等）', date: '2023年', desc: '赴日考察日本近代法律改革与多元纠纷解决机制，探讨东亚法治文化的共通与差异。' },
      { title: '中德法治对话', partner: '德国马普研究所', date: '2022年', desc: '围绕大陆法系传统与中国近代法律改革的交汇展开学术对话。' },
      { title: 'WELEGAL公益法盟（全球网络）', partner: '新加坡/日本/印尼/港澳台等', date: '2025-2026年', desc: '通过WELEGAL公益法盟跨国网络，推动中国法治文化的国际传播与法商交流。' },
    ]},
    contact_info: {
      address: '浙江省湖州市吴兴区妙西镇沈家本历史文化园', phone: '13082838161', email: 'info@hz-shenjiaben.org',
      workingHours: '周一至周五 9:00-17:00', contactPerson: '王主任',
    },
    mediation_intro: { content: '沈家本研究院商事调解中心依托沈家本"息讼安民"治世理念，聚焦买卖合同、知识产权、股权债权、电商经营等商事纠纷，开展诉前委派调解、争议调处、调解理论研究与调解员培育工作。中心汇聚资深律师、退休法官、法学教授等专业调解力量，助力完善区域多元化纠纷解决体系，优化地方营商环境。与诉讼相比，商事调解具有程序灵活、成本低廉、保密性强、维护商业关系等显著优势。' },
    mediation_process: { steps: [
      { title: '申请受理', desc: '当事人提交调解申请，中心审查受理。' },
      { title: '选定调解员', desc: '双方当事人共同选定或由中心指定调解员。' },
      { title: '调解会议', desc: '调解员主持调解会议，协助双方协商。' },
      { title: '达成协议', desc: '双方达成调解协议，签署调解书。' },
      { title: '协议履行', desc: '双方按协议约定履行，必要时可申请司法确认。' },
    ]},
  };
  return defaults[key] || { message: '内容建设中' };
}

// ── 活动专栏 ──────────────────────────────────────
function handleEventsList(res, query) {
  const keyword = (query.keyword || '').toLowerCase();
  const page = parseInt(query.page) || 1;
  const pageSize = Math.min(parseInt(query.pageSize) || 10, 50);
  const category = query.category || query.type || '';
  const status = query.status || '';

  let items = db.table('events').filter(e => e.isActive !== false);
  if (keyword) items = items.filter(e => e.title.toLowerCase().includes(keyword) || (e.description||'').toLowerCase().includes(keyword));
  if (category) items = items.filter(e => e.category === category);
  if (status) items = items.filter(e => e.status === status);
  items = items.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));

  const total = items.length;
  const start = (page - 1) * pageSize;
  const STATUS_LABEL = { upcoming: '即将开始', ongoing: '进行中', past: '已结束' };
  const paged = items.slice(start, start + pageSize).map(e => ({
    id: e.id, title: e.title,
    date: e.eventDate || '',
    location: e.location || '',
    speaker: e.speaker || '',
    type: e.category, typeLabel: e.category,
    status: e.status, statusLabel: STATUS_LABEL[e.status] || e.status,
    content: e.description || '',
    coverImage: e.coverImage || '',
  }));
  json(res, 200, { items: paged, total, page, pageSize, totalPages: Math.ceil(total/pageSize) });
}

function handleEventDetail(res, id) {
  const item = db.table('events').find(e => e.id === id);
  if (!item) return jsonError(res, 404, '活动不存在');
  const STATUS_LABEL = { upcoming: '即将开始', ongoing: '进行中', past: '已结束' };
  json(res, 200, {
    ...item,
    date: item.eventDate || '',
    content: item.description || '',
    type: item.category, typeLabel: item.category,
    statusLabel: STATUS_LABEL[item.status] || item.status,
  });
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
  // 先解码 URL 编码（处理中文文件名）
  let staticPath;
  try { staticPath = decodeURIComponent(pathname); } catch { staticPath = pathname; }
  if (staticPath === '/') staticPath = '/index.html';
  if (!path.extname(staticPath)) staticPath += '.html';  // SPA 风格

  const filePath = path.join(STATIC_ROOT, staticPath);
  if (serveStatic(res, filePath)) return;

  // 404
  jsonError(res, 404, '页面或接口不存在');
});

// 数据时间戳迁移：如果某表 >80% 记录的 createdAt 为同一天，则重新分配
function migrateTimestamps() {
  const tables = ['lawyer_discipline', 'legislation_projects', 'judicial_cases', 'judicial_policies', 'legal_recruitments'];
  const now = Date.now();
  const dayMs = 86400000;
  let migrated = 0;
  for (const t of tables) {
    const all = db.table(t);
    if (all.length === 0) continue;
    // 按 createdAt 日期分组
    const dayCounts = {};
    for (const r of all) {
      const day = (r.createdAt || '').split('T')[0];
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }
    const maxSame = Math.max(...Object.values(dayCounts));
    if (maxSame / all.length > 0.8) {
      // 重新分配时间戳：散布在近 180 天内
      for (const r of all) {
        r.createdAt = new Date(now - Math.floor(Math.random() * 180) * dayMs).toISOString();
      }
      db.save();
      migrated++;
      console.log(`[migrate] ${t}: ${all.length} 条记录时间戳已重新分布`);
    }
  }
  if (migrated > 0) console.log(`[migrate] 共迁移 ${migrated} 个表的时间戳`);
  return migrated;
}

// 出版物封面迁移
function migratePublicationCovers() {
  const coverMap = {
    '《沈家本手稿五种》（影印本）': 'assets/images/publications/pub-001.png',
    '《玉骨冰心冷不摧——沈家本诗集》': 'assets/images/publications/pub-002.png',
    '《沈家本与中国法律文化论集》': 'assets/images/publications/pub-003.png',
    '《历代刑法考（校注版）》': 'assets/images/publications/pub-004.png',
    '《寄簃文存校注》': 'assets/images/publications/pub-005.png',
    '《会通中西：沈家本法律思想研究》': 'assets/images/publications/pub-006.png',
    '《商事调解案例汇编（第一辑）》': 'assets/images/publications/pub-007.png',
    '沈家本法学研究（学术期刊·半年刊）': 'assets/images/publications/pub-008.png',
    '《法治数据智能研究报告（2025年度）》': 'assets/images/publications/pub-009.png',
    '《中国传统法律文化的现代价值》': 'assets/images/publications/pub-010.png',
  };
  let updated = 0;
  for (const pub of db.table('publications')) {
    if (coverMap[pub.title] && (!pub.coverImage || pub.coverImage.trim() === '')) {
      pub.coverImage = coverMap[pub.title];
      updated++;
    }
  }
  if (updated > 0) { db.save(); console.log('[migrate] 出版物封面已更新:', updated, '条'); }
  return updated;
}

// ── 启动 ──────────────────────────────────────────
// 种子数据（容错：即使失败也正常启动）
if (process.argv.includes('--seed')) {
  try {
    require('./seed').seed();
    console.log('[seed] 种子数据初始化完成');
  } catch (err) {
    console.error('[seed] 种子数据初始化失败（服务将继续运行）:', err.message);
  }
}
// 时间戳迁移（每次启动检查）
try { migrateTimestamps(); } catch (e) { console.error('[migrate] 时间戳迁移失败:', e.message); }
// 出版物封面迁移（每次启动检查）
try { migratePublicationCovers(); } catch (e) { console.error('[migrate] 出版物封面迁移失败:', e.message); }

// 优雅退出
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM，优雅退出...');
  server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  console.log('收到 SIGINT，优雅退出...');
  server.close(() => process.exit(0));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('  沈家本研究院 API 服务');
  console.log(`  地址: http://localhost:${PORT}`);
  console.log(`  API:  http://localhost:${PORT}/api/v1/`);
  console.log(`  管理员: admin / shenjiaben2026`);
  console.log('='.repeat(50));
});
