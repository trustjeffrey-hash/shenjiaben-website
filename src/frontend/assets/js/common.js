/**
 * 沈家本研究院官网 — 公共 JS 工具库
 * 全站统一交互逻辑
 */

const ShenJB = window.ShenJB || {};

/* ============================================
   API 配置
   ============================================ */
ShenJB.API_BASE = '/api/v1';

/* ============================================
   通用 API 请求封装
   ============================================ */
ShenJB.api = {
  async get(endpoint, params = {}) {
    const url = new URL(ShenJB.API_BASE + endpoint, window.location.origin);
    Object.keys(params).forEach(k => {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
        url.searchParams.append(k, params[k]);
      }
    });
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // 服务端返回 {code, message, data: ...}，自动解包 data
      return json.data !== undefined ? json.data : json;
    } catch (err) {
      console.error(`[API GET] ${endpoint}:`, err);
      throw err;
    }
  },

  async post(endpoint, data = {}) {
    try {
      const res = await fetch(ShenJB.API_BASE + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`[API POST] ${endpoint}:`, err);
      throw err;
    }
  }
};

/* ============================================
   全局加载/空/异常渲染
   ============================================ */
ShenJB.renderState = {
  loading(container) {
    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>数据加载中…</p>
      </div>`;
  },
  empty(container) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>暂无匹配数据</p>
      </div>`;
  },
  error(container) {
    container.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <p>数据加载异常，请稍后重试</p>
      </div>`;
  }
};

/* ============================================
   防抖函数
   ============================================ */
ShenJB.debounce = (fn, delay = 300) => {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
};

/* ============================================
   导航栏交互
   ============================================ */
ShenJB.nav = {
  init() {
    // 导航吸顶阴影
    const header = document.querySelector('.site-header');
    if (header) {
      window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 10);
      });
    }

    // 移动端汉堡菜单
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');
    if (hamburger && mobileNav) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileNav.classList.toggle('open');
        document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
      });

      // 点击菜单项关闭
      mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          hamburger.classList.remove('active');
          mobileNav.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    }

    // 当前页面高亮
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath || (currentPath === 'index.html' && href === '/')) {
        link.classList.add('active');
      }
    });
  }
};

/* ============================================
   通用分页组件
   ============================================ */
ShenJB.Pagination = class {
  constructor(container, { total, pageSize = 20, current = 1, onChange }) {
    this.container = container;
    this.total = total;
    this.pageSize = pageSize;
    this.current = current;
    this.onChange = onChange;
    this.render();
  }

  get totalPages() {
    return Math.ceil(this.total / this.pageSize) || 1;
  }

  render() {
    const p = this.totalPages;
    if (p <= 1) { this.container.innerHTML = ''; return; }

    let html = '';
    html += `<button ${this.current <= 1 ? 'disabled' : ''} data-page="${this.current - 1}">‹</button>`;

    for (let i = 1; i <= p; i++) {
      if (i === 1 || i === p || (i >= this.current - 2 && i <= this.current + 2)) {
        html += `<button class="${i === this.current ? 'active' : ''}" data-page="${i}">${i}</button>`;
      } else if (i === this.current - 3 || i === this.current + 3) {
        html += `<button disabled>…</button>`;
      }
    }

    html += `<button ${this.current >= p ? 'disabled' : ''} data-page="${this.current + 1}">›</button>`;
    this.container.innerHTML = html;

    this.container.querySelectorAll('button:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (page && page !== this.current) {
          this.current = page;
          this.render();
          if (this.onChange) this.onChange(page);
        }
      });
    });
  }
};

/* ============================================
   通用搜索+筛选联动
   ============================================ */
ShenJB.SearchFilter = class {
  constructor({ searchInput, filterContainer, onSearch, debounceMs = 400 }) {
    this.searchInput = document.querySelector(searchInput);
    this.filterContainer = document.querySelector(filterContainer);
    this.onSearch = onSearch;

    // 搜索输入防抖监听
    if (this.searchInput) {
      this.searchInput.addEventListener('input', ShenJB.debounce(() => {
        this.trigger();
      }, debounceMs));
    }

    // 筛选变更监听
    if (this.filterContainer) {
      this.filterContainer.addEventListener('change', () => this.trigger());
    }
  }

  getFilters() {
    const filters = {};
    if (this.searchInput) filters.keyword = this.searchInput.value.trim();
    if (this.filterContainer) {
      this.filterContainer.querySelectorAll('select, input[type="date"], input[type="text"]').forEach(el => {
        if (el.value) filters[el.name] = el.value;
      });
    }
    return filters;
  }

  trigger() {
    if (this.onSearch) this.onSearch(this.getFilters());
  }
};

/* ============================================
   通用详情弹窗
   ============================================ */
ShenJB.modal = {
  open(title, content) {
    let overlay = document.querySelector('.modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal">
          <div class="modal-header">
            <span class="modal-title"></span>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body"></div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('.modal-close').addEventListener('click', () => this.close());
      overlay.addEventListener('click', (e) => { if (e.target === overlay) this.close(); });
    }

    overlay.querySelector('.modal-title').textContent = title;
    overlay.querySelector('.modal-body').innerHTML = content;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  close() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }
};

/* ============================================
   表单提交
   ============================================ */
ShenJB.FormHandler = class {
  constructor(formSelector, apiEndpoint, options = {}) {
    this.form = document.querySelector(formSelector);
    this.endpoint = apiEndpoint;
    this.onSuccess = options.onSuccess || (() => {});
    this.onError = options.onError || (() => {});
    if (this.form) this.init();
  }

  init() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = this.form.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '提交中…';
      }

      const formData = new FormData(this.form);
      const data = Object.fromEntries(formData.entries());

      try {
        const res = await ShenJB.api.post(this.endpoint, data);
        if (submitBtn) submitBtn.textContent = '提交成功 ✓';
        this.onSuccess(res);
        this.form.reset();
        setTimeout(() => { if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; } }, 2000);
      } catch (err) {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
        this.onError(err);
        alert('提交失败，请稍后重试');
      }
    });
  }
};

/* ============================================
   页面初始化
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  ShenJB.nav.init();
});

window.ShenJB = ShenJB;
