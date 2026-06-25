/**
 * 沈家本研究院官网 - JSON 文件数据库引擎
 * 纯 Node.js 实现，零外部依赖
 * 支持 CRUD、分页、筛选、排序、聚合统计
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'shenjiaben.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

/** 数据库表结构定义 */
const SCHEMA = {
  lawyer_discipline: [],
  legislation_projects: [],
  judicial_cases: [],
  judicial_policies: [],
  legal_recruitments: [],
  messages: [],
  event_registrations: [],
  basic_content: [],
  events: [],
  publications: [],
  content_pages: [],
  collection_logs: [],
  admin_users: [{ username: 'admin', passwordHash: hashPassword('shenjiaben2026'), role: 'super_admin', isActive: true, lastLogin: null, createdAt: new Date().toISOString() }],
};

// ── 简易密码哈希 ──────────────────────────────────
function hashPassword(pw) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(pw + '-shenjiaben-salt').digest('hex');
}

function verifyPassword(pw, hash) {
  return hashPassword(pw) === hash;
}

// ── 数据库加载/保存 ────────────────────────────────
let _db = null;

function load() {
  if (_db) return _db;
  if (fs.existsSync(DB_FILE)) {
    try {
      _db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      // 确保所有表存在
      for (const key of Object.keys(SCHEMA)) {
        if (!_db[key]) _db[key] = [];
      }
      return _db;
    } catch (e) {
      console.error('数据库文件损坏，重建中...', e.message);
    }
  }
  // 初始化新数据库
  _db = JSON.parse(JSON.stringify(SCHEMA));
  save();
  return _db;
}

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(_db, null, 2), 'utf-8');
}

function table(name) {
  const db = load();
  if (!db[name]) db[name] = [];
  return db[name];
}

// ── CRUD 操作 ─────────────────────────────────────
function insert(tableName, record) {
  const t = table(tableName);
  const id = t.length > 0 ? Math.max(...t.map(r => r.id)) + 1 : 1;
  record.id = id;
  record.createdAt = record.createdAt || new Date().toISOString();
  record.updatedAt = new Date().toISOString();
  t.push(record);
  save();
  return record;
}

function findById(tableName, id) {
  return table(tableName).find(r => r.id === id) || null;
}

function update(tableName, id, updates) {
  const t = table(tableName);
  const idx = t.findIndex(r => r.id === id);
  if (idx === -1) return null;
  t[idx] = { ...t[idx], ...updates, id, updatedAt: new Date().toISOString() };
  save();
  return t[idx];
}

function remove(tableName, id) {
  const t = table(tableName);
  const idx = t.findIndex(r => r.id === id);
  if (idx === -1) return false;
  t.splice(idx, 1);
  save();
  return true;
}

// ── 查询构建器 ────────────────────────────────────
class QueryBuilder {
  constructor(tableName) {
    this._tableName = tableName;
    this._filters = [];
    this._sortField = null;
    this._sortDir = 'desc';
    this._page = 1;
    this._pageSize = 20;
  }

  where(field, op, value) {
    this._filters.push({ field, op, value });
    return this;
  }

  like(field, value) {
    if (value) this._filters.push({ field, op: 'like', value });
    return this;
  }

  equals(field, value) {
    if (value !== undefined && value !== null && value !== '') {
      this._filters.push({ field, op: 'eq', value });
    }
    return this;
  }

  gte(field, value) {
    if (value) this._filters.push({ field, op: 'gte', value });
    return this;
  }

  lte(field, value) {
    if (value) this._filters.push({ field, op: 'lte', value });
    return this;
  }

  boolean(field, value) {
    if (value === '1') this._filters.push({ field, op: 'bool_true', value: true });
    if (value === '0') this._filters.push({ field, op: 'bool_false', value: false });
    return this;
  }

  sortBy(field, dir = 'desc') {
    this._sortField = field;
    this._sortDir = dir;
    return this;
  }

  paginate(page, pageSize) {
    this._page = Math.max(1, parseInt(page) || 1);
    this._pageSize = Math.min(parseInt(pageSize) || 20, 100);
    return this;
  }

  _applyFilters(items) {
    return items.filter(item => {
      for (const f of this._filters) {
        const val = item[f.field];
        switch (f.op) {
          case 'eq':
            if (val != f.value) return false;
            break;
          case 'like':
            if (!String(val || '').toLowerCase().includes(String(f.value).toLowerCase())) return false;
            break;
          case 'gte':
            if (val < f.value) return false;
            break;
          case 'lte':
            if (val > f.value) return false;
            break;
          case 'bool_true':
            if (!val) return false;
            break;
          case 'bool_false':
            if (val) return false;
            break;
          case 'or_like': {
            const fields = f.field.split(',');
            const kw = String(f.value).toLowerCase();
            if (!fields.some(fd => String(item[fd] || '').toLowerCase().includes(kw))) return false;
            break;
          }
        }
      }
      return true;
    });
  }

  execute() {
    let items = [...table(this._tableName)];

    // 过滤
    items = this._applyFilters(items);

    // 排序
    if (this._sortField) {
      items.sort((a, b) => {
        const va = a[this._sortField], vb = b[this._sortField];
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        if (va < vb) return this._sortDir === 'asc' ? -1 : 1;
        if (va > vb) return this._sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const total = items.length;
    const totalPages = Math.ceil(total / this._pageSize) || 0;
    const start = (this._page - 1) * this._pageSize;
    const paged = items.slice(start, start + this._pageSize);

    return { items: paged, total, page: this._page, pageSize: this._pageSize, totalPages };
  }

  count() {
    return this._applyFilters([...table(this._tableName)]).length;
  }

  all() {
    return this._applyFilters([...table(this._tableName)]);
  }
}

function query(tableName) {
  return new QueryBuilder(tableName);
}

// ── 聚合统计 ──────────────────────────────────────
function groupBy(tableName, field) {
  const items = table(tableName);
  const map = {};
  for (const item of items) {
    const key = item[field] || '未分类';
    map[key] = (map[key] || 0) + 1;
  }
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}

function countByDate(tableName, dateField, format = 'month') {
  const items = table(tableName);
  const map = {};
  for (const item of items) {
    if (!item[dateField]) continue;
    const d = new Date(item[dateField]);
    let key;
    if (format === 'month') key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    else if (format === 'day') key = d.toISOString().split('T')[0];
    else key = d.getFullYear().toString();
    map[key] = (map[key] || 0) + 1;
  }
  return Object.entries(map).sort().map(([k, v]) => {
    if (format === 'month') return { month: k, count: v };
    if (format === 'day') return { date: k, count: v };
    return { year: k, count: v };
  });
}

module.exports = {
  load, save, table, insert, findById, update, remove,
  query, groupBy, countByDate,
  verifyPassword, hashPassword,
};
