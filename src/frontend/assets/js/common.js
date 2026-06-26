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
   导航栏配置 & 动态生成
   ============================================ */
ShenJB.navConfig = {
  brand: { text: '沈家本研究院', icon: '沈', href: '/index.html' },
  menus: [
    { label: '首页', href: 'index.html' },
    { label: '研究院介绍', dropdown: [
      { label: '研究院概况', href: 'about.html' },
      { label: '沈家本文化研究中心', href: 'research.html' },
      { label: '成果与出版物', href: 'publications.html' },
      { label: '合作交流', href: 'cooperation.html' },
      { label: '活动专栏', href: 'events.html' },
    ]},
    { label: '专家委员会', href: 'experts.html' },
    { label: '数据平台', dropdown: [
      { label: '全国律师行政处罚查询系统', href: 'discipline.html' },
      { label: '重点立法项目进度追踪', href: 'legislation.html' },
      { label: '热点典型司法案件评析库', href: 'cases.html' },
      { label: '司法政策与指导案例汇总', href: 'policy.html' },
      { label: '全网公众号法律招聘聚合平台', href: 'recruitment.html' },
    ]},
    { label: '商事调解中心', dropdown: [
      { label: '中心概况', href: 'mediation.html' },
      { label: '商事调解研究', href: 'mediation-research.html' },
      { label: '调解业务在线申请', href: 'mediation-apply.html' },
      { label: '商调专题培训', href: 'mediation-training.html' },
      { label: '合作共建单位', href: 'mediation-partners.html' },
      { label: '典型调解案例库', href: 'mediation-cases.html' },
    ]},
    { label: '联系我们', href: 'contact.html' },
  ]
};

ShenJB.nav = {
  inject() {
    const cfg = ShenJB.navConfig;
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    function isActive(menu) {
      if (menu.href === currentPage) return true;
      if (menu.dropdown) {
        return menu.dropdown.some(sub => sub.href === currentPage);
      }
      return false;
    }

    function isSubActive(sub) {
      return sub.href === currentPage;
    }

    // Build desktop nav HTML
    let linksHTML = '';
    cfg.menus.forEach(menu => {
      const active = isActive(menu);
      if (menu.dropdown) {
        linksHTML += `<div class="nav-dropdown-wrap">`;
        linksHTML += `<a href="javascript:void(0)" class="nav-dropdown-trigger${active ? ' active' : ''}">${menu.label} <span class="nav-arrow">›</span></a>`;
        linksHTML += `<div class="nav-dropdown">`;
        menu.dropdown.forEach(sub => {
          linksHTML += `<a href="${sub.href}" class="${isSubActive(sub) ? 'active' : ''}">${sub.label}</a>`;
        });
        linksHTML += `</div></div>`;
      } else {
        linksHTML += `<a href="${menu.href}" class="${active ? 'active' : ''}">${menu.label}</a>`;
      }
    });

    // Build mobile nav HTML (with expandable submenus)
    let mobileHTML = '';
    cfg.menus.forEach((menu, i) => {
      const active = isActive(menu);
      if (menu.dropdown) {
        mobileHTML += `<div class="mnav-group">`;
        mobileHTML += `<div class="mnav-parent${active ? ' active' : ''}" data-mnav="${i}">${menu.label}<span class="mnav-toggle">+</span></div>`;
        mobileHTML += `<div class="mnav-children" id="mnav-${i}">`;
        menu.dropdown.forEach(sub => {
          mobileHTML += `<a href="${sub.href}" class="${isSubActive(sub) ? 'active' : ''}">${sub.label}</a>`;
        });
        mobileHTML += `</div></div>`;
      } else {
        mobileHTML += `<a href="${menu.href}" class="${active ? 'active' : ''}">${menu.label}</a>`;
      }
    });

    // Find or create nav container
    let header = document.getElementById('site-nav');
    if (!header) return;

    header.className = 'site-header';
    header.innerHTML = `
      <div class="nav-inner">
        <a href="${cfg.brand.href}" class="nav-logo">
          <span class="nav-logo-icon">${cfg.brand.icon}</span>
          <span class="nav-logo-text">${cfg.brand.text}</span>
        </a>
        <nav class="nav-links">${linksHTML}</nav>
        <button class="hamburger" aria-label="菜单">
          <span></span><span></span><span></span>
        </button>
      </div>
    `;

    // Build mobile nav
    let mobileNav = document.getElementById('mobile-nav');
    if (!mobileNav) {
      mobileNav = document.createElement('nav');
      mobileNav.id = 'mobile-nav';
      mobileNav.className = 'mobile-nav';
      header.insertAdjacentElement('afterend', mobileNav);
    }
    mobileNav.innerHTML = mobileHTML;

    // Bind events
    this.bindEvents();
  },

  bindEvents() {
    const header = document.querySelector('.site-header');
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.getElementById('mobile-nav');

    // Scroll sticky shadow
    if (header) {
      window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 10);
      });
    }

    // Hamburger toggle
    if (hamburger && mobileNav) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileNav.classList.toggle('open');
        document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
      });
      mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          hamburger.classList.remove('active');
          mobileNav.classList.remove('open');
          document.body.style.overflow = '';
        });
      });
    }

    // Desktop dropdown hover
    document.querySelectorAll('.nav-dropdown-wrap').forEach(wrap => {
      let timer;
      wrap.addEventListener('mouseenter', () => {
        clearTimeout(timer);
        wrap.classList.add('open');
      });
      wrap.addEventListener('mouseleave', () => {
        timer = setTimeout(() => wrap.classList.remove('open'), 150);
      });
    });

    // Mobile submenu toggle
    mobileNav.querySelectorAll('.mnav-parent').forEach(parent => {
      parent.addEventListener('click', () => {
        const idx = parent.dataset.mnav;
        const children = document.getElementById('mnav-' + idx);
        const toggle = parent.querySelector('.mnav-toggle');
        if (children) {
          const isOpen = children.style.display === 'block';
          children.style.display = isOpen ? 'none' : 'block';
          if (toggle) toggle.textContent = isOpen ? '+' : '-';
        }
      });
      // Open if currently active page
      const idx = parent.dataset.mnav;
      const children = document.getElementById('mnav-' + idx);
      if (children && parent.classList.contains('active')) {
        children.style.display = 'block';
        const toggle = parent.querySelector('.mnav-toggle');
        if (toggle) toggle.textContent = '-';
      }
    });

    // Close mobile nav on outside click
    document.addEventListener('click', (e) => {
      if (mobileNav && mobileNav.classList.contains('open')) {
        if (!e.target.closest('.site-header') && !e.target.closest('.mobile-nav')) {
          hamburger.classList.remove('active');
          mobileNav.classList.remove('open');
          document.body.style.overflow = '';
        }
      }
    });
  },

  init() {
    this.inject();
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
   统一页脚动态注入
   ============================================ */
ShenJB.footer = {
  inject() {
    const footer = document.getElementById('site-footer');
    if (!footer) return;
    footer.className = 'site-footer';
    footer.innerHTML = `
      <div class="footer-inner">
        <div class="footer-brand">
          <h3>沈家本研究院</h3>
          <p>传承法治文化，弘扬法学精神。<br>致力于沈家本法学思想研究与中国法治文化传播。</p>
          <p style="margin-top:12px;font-size:var(--fs-note-sm);">浙江省湖州市吴兴区妙西镇<br>沈家本历史文化园<br>电话：13082838161</p>
        </div>
        <div class="footer-col">
          <h4>快速导航</h4>
          <a href="about.html">研究院概况</a>
          <a href="research.html">文化研究中心</a>
          <a href="publications.html">成果出版物</a>
          <a href="cooperation.html">合作交流</a>
          <a href="events.html">活动专栏</a>
          <a href="experts.html">专家委员会</a>
        </div>
        <div class="footer-col">
          <h4>数据平台</h4>
          <a href="discipline.html">律师处罚查询</a>
          <a href="legislation.html">立法进度追踪</a>
          <a href="cases.html">热点案件评析</a>
          <a href="policy.html">司法政策汇总</a>
          <a href="recruitment.html">法律招聘聚合</a>
        </div>
        <div class="footer-col">
          <h4>商事调解</h4>
          <a href="mediation.html">中心概况</a>
          <a href="mediation-apply.html">调解申请</a>
          <a href="mediation-training.html">专题培训</a>
          <a href="mediation-cases.html">典型案例</a>
          <a href="contact.html">联系我们</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 湖州市沈家本研究院 版权所有</p>
        <p><a href="#">ICP备案号：待备案（域名备案完成后填入）</a> ｜ 公安机关备案号：待备案</p>
        <p style="margin-top:8px;font-size:var(--fs-note-sm);">
          本平台所有公开数据均取自国家机关、全国律协、人大、官方公众号公示内容，仅作公益学术信息聚合检索，不构成任何法律意见；岗位、处罚、立法信息仅供参考。信息有误可通过<a href="contact.html" style="color:var(--color-primary-light);">异议通道</a>申请下架。
        </p>
      </div>
    `;
  }
};

/* ============================================
   页面初始化
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  ShenJB.nav.init();
  ShenJB.footer.inject();
});

window.ShenJB = ShenJB;
