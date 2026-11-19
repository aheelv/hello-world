/* =============================================================================
 * OR-SimLab · 应用外壳与路由
 * -----------------------------------------------------------------------------
 * 职责：
 *   1. 构建侧栏导航（从场景注册表动态生成）与顶栏
 *   2. hash 路由分发到各视图
 *   3. 全局错误兜底、响应式侧栏、AI 面板初始化
 * 采用 hash 路由而非 History API，以保证 file:// 协议下可直接打开。
 * ========================================================================== */
(function (global) {
  'use strict';
  var OR = global.OR = global.OR || {};
  if (!OR.ui) { console.error('[OR-SimLab] ui.js 未加载，请检查脚本引用顺序'); return; }
  var U = OR.ui;

  var LEVEL_META = { 1: '入门', 2: '进阶', 3: '挑战' };
  var viewEl = null;

  /* ===========================================================================
   * 一、导航与外壳
   * ======================================================================== */
  function buildSidebar() {
    var sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = '';

    /* 品牌 */
    sidebar.appendChild(U.el('div.brand', null, [
      U.el('div.brand-logo', { text: 'OR' }),
      U.el('div.brand-text', null, [
        U.el('div.brand-name', { text: '运筹智仿' }),
        U.el('div.brand-sub', { text: 'OR-SimLab · AI 仿真教学' })
      ])
    ]));

    var nav = U.el('div.nav');

    nav.appendChild(U.el('div.nav-group-title', { text: '学习区' }));
    nav.appendChild(navItem('#/', 'home', '首页'));
    nav.appendChild(navItem('#/labs', 'grid', '场景目录', String(OR.Lab.all().length)));
    nav.appendChild(navItem('#/knowledge', 'book', '知识图谱', OR.KB ? String(OR.KB.all().length) : null));

    /* 实验场景按难度分组 */
    OR.Lab.levels().forEach(function (lv) {
      var group = OR.Lab.all().filter(function (l) { return l.level === lv.level; });
      if (!group.length) return;
      nav.appendChild(U.el('div.nav-group-title', { text: '难度 ' + lv.level + ' · ' + lv.name }));
      group.forEach(function (lab) {
        nav.appendChild(navItem('#/lab/' + lab.id, lab.icon, lab.name, null, lab.id));
      });
    });

    nav.appendChild(U.el('div.nav-group-title', { text: '评估区' }));
    nav.appendChild(navItem('#/practice', 'pen', '习题库', String(totalQuestions())));
    nav.appendChild(navItem('#/dashboard', 'chart', '学习档案'));
    nav.appendChild(navItem('#/wrong', 'target', '错题本', wrongCount() || null));

    nav.appendChild(U.el('div.nav-group-title', { text: '支持' }));
    nav.appendChild(navItem('#/docs', 'doc', '文档中心'));
    nav.appendChild(navItem('#/settings', 'cpu', 'AI 配置'));

    sidebar.appendChild(nav);

    /* 底部通道状态 */
    var foot = U.el('div.sidebar-foot');
    var chip = U.el('div.health-chip', { id: 'ai-chip' });
    foot.appendChild(chip);
    sidebar.appendChild(foot);
  }

  function navItem(href, icon, label, badge, labId) {
    var a = U.el('a.nav-item', {
      href: href,
      'data-nav': href,
      title: label
    }, [
      U.el('span.nav-ico', { html: U.icon(icon, 17) }),
      U.el('span', { text: label, style: 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }),
      badge ? U.el('span.nav-badge', { text: badge }) : null
    ]);
    if (labId) {
      var p = OR.Store.getProgress(labId);
      var tot = (OR.Lab.get(labId).problems || []).length;
      if (tot && p.solved >= tot) a.appendChild(U.el('span.nav-badge', { text: '✓' }));
    }
    a.addEventListener('click', function () { closeDrawer(); });
    return a;
  }

  function totalQuestions() {
    return OR.Lab.all().reduce(function (a, l) { return a + (l.problems || []).length; }, 0);
  }
  function wrongCount() {
    return (OR.Store.get('wrong', []) || []).length;
  }

  /* ---------- 顶栏 ---------- */
  function buildTopbar() {
    var bar = document.getElementById('topbar');
    bar.innerHTML = '';

    bar.appendChild(U.el('button.btn.btn-ghost.btn-ico.menu-btn', {
      html: U.icon('grid', 17),
      title: '打开导航',
      onclick: function () { document.getElementById('sidebar').classList.toggle('open'); }
    }));

    bar.appendChild(U.el('div.crumb', { id: 'crumb' }));

    bar.appendChild(U.el('div.topbar-spacer'));

    /* 搜索 */
    var input = U.el('input', { type: 'text', placeholder: '搜索场景或知识点…' });
    var box = U.el('div.searchbox', null, [U.el('span', { html: U.icon('target', 14), style: 'opacity:.5' }), input]);
    var results = U.el('div.card', {
      style: 'position:absolute;top:calc(var(--topbar-h) - 8px);right:22px;width:320px;z-index:50;display:none;box-shadow:var(--sh-lg)'
    });
    var resBody = U.el('div.card-body', { style: 'padding:8px' });
    results.appendChild(resBody);

    function hide() { results.style.display = 'none'; }
    function search(q) {
      resBody.innerHTML = '';
      q = (q || '').trim().toLowerCase();
      if (!q) { hide(); return; }
      var hits = OR.Lab.all().filter(function (l) {
        return (l.name + l.subtitle + l.topic + (l.tags || []).join(' ')).toLowerCase().indexOf(q) >= 0;
      }).slice(0, 6);
      var concepts = OR.KB ? OR.KB.search(q).slice(0, 5) : [];
      if (!hits.length && !concepts.length) {
        resBody.appendChild(U.el('div.tiny.muted', { text: '没有匹配的场景或知识点', style: 'padding:9px' }));
      }
      if (hits.length) {
        resBody.appendChild(U.el('div.tiny.muted', {
          text: '实验场景', style: 'padding:4px 9px 5px;font-weight:700;letter-spacing:.04em'
        }));
        hits.forEach(function (l) {
          resBody.appendChild(U.el('a.nav-item', {
            href: '#/lab/' + l.id,
            style: 'display:flex;gap:9px;align-items:center',
            onclick: function () { hide(); input.value = ''; }
          }, [
            U.el('span.nav-ico', { html: U.icon(l.icon, 15) }),
            U.el('div', { style: 'flex:1;min-width:0' }, [
              U.el('div', { text: l.name, style: 'font-size:13px;font-weight:620' }),
              U.el('div.tiny.muted', { text: l.subtitle })
            ]),
            U.el('span.pill.p-lv' + l.level, { text: LEVEL_META[l.level] })
          ]));
        });
      }
      if (concepts.length) {
        resBody.appendChild(U.el('div.tiny.muted', {
          text: '知识点', style: 'padding:8px 9px 5px;font-weight:700;letter-spacing:.04em;border-top:1px solid var(--line);margin-top:4px'
        }));
        concepts.forEach(function (c) {
          var dom = OR.KB.domain(c.domain) || { name: '', tone: 'brand', icon: 'grid' };
          var col = (OR.KG && OR.KG.TONE_COLOR[dom.tone]) || '#2b5cff';
          resBody.appendChild(U.el('a.nav-item', {
            href: '#/kb/' + c.id,
            style: 'display:flex;gap:9px;align-items:center',
            onclick: function () { hide(); input.value = ''; }
          }, [
            U.el('span', { html: U.icon(dom.icon, 15), style: 'color:' + col + ';flex:0 0 auto' }),
            U.el('div', { style: 'flex:1;min-width:0' }, [
              U.el('div', { text: c.name, style: 'font-size:13px;font-weight:620' }),
              U.el('div.tiny.muted', {
                text: dom.name + ' · ' + c.summary,
                style: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap'
              })
            ])
          ]));
        });
      }
      results.style.display = 'block';
    }
    input.addEventListener('input', function () { search(input.value); });
    input.addEventListener('focus', function () { if (input.value) search(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { input.value = ''; hide(); }
      if (e.key === 'Enter') {
        var first = resBody.querySelector('a');
        if (first) { location.hash = first.getAttribute('href'); input.value = ''; hide(); }
      }
    });
    document.addEventListener('click', function (e) {
      if (!box.contains(e.target) && !results.contains(e.target)) hide();
    });

    bar.appendChild(box);

    bar.appendChild(U.el('button.btn.btn-sm.btn-soft', {
      html: U.icon('cpu', 14) + '<span class="hide-sm">AI 助教</span>',
      onclick: function () { OR.AIPanel.open(); }
    }));

    document.body.appendChild(results);
    return { results: results, hide: hide };
  }

  /* ---------- 面包屑 ---------- */
  function setCrumb(parts) {
    var c = document.getElementById('crumb');
    if (!c) return;
    c.innerHTML = '';
    parts.forEach(function (p, i) {
      if (i > 0) c.appendChild(U.el('span.crumb-sep', { text: '/' }));
      if (p.href) {
        c.appendChild(U.el('a', { href: p.href, text: p.text, style: 'color:inherit' }));
      } else {
        c.appendChild(U.el('b', { text: p.text }));
      }
    });
  }

  function setActiveNav(hash) {
    var items = document.querySelectorAll('[data-nav]');
    var best = null, bestLen = 0;
    Array.prototype.forEach.call(items, function (a) {
      var h = a.getAttribute('data-nav');
      a.classList.remove('active');
      if (hash === h || (h !== '#/' && hash.indexOf(h) === 0 && h.length > bestLen)) {
        if (h !== '#/' || hash === '#/') { best = a; bestLen = h.length; }
      }
    });
    if (best) best.classList.add('active');
  }

  function closeDrawer() {
    var s = document.getElementById('sidebar');
    if (s) s.classList.remove('open');
  }

  /* ===========================================================================
   * 二、路由
   * ======================================================================== */
  function parseHash() {
    var h = location.hash || '#/';
    if (h.charAt(0) === '#') h = h.slice(1);
    if (h.charAt(0) !== '/') h = '/' + h;
    var q = h.split('?');
    var segs = q[0].split('/').filter(function (s) { return s !== ''; });
    return { segs: segs, query: q[1] || '' };
  }

  function route() {
    var r = parseHash();
    var seg = r.segs;
    var scrollTop = function () { window.scrollTo({ top: 0, behavior: 'auto' }); };

    /* #/ */
    if (!seg.length) {
      setCrumb([{ text: '首页' }]);
      setActiveNav('#/');
      viewEl.innerHTML = '';
      OR.HomeView.render(viewEl);
      return scrollTop();
    }

    /* #/labs */
    if (seg[0] === 'labs') {
      setCrumb([{ text: '首页', href: '#/' }, { text: '场景目录' }]);
      setActiveNav('#/labs');
      viewEl.innerHTML = '';
      OR.HomeView.renderCatalog(viewEl);
      return scrollTop();
    }

    /* #/lab/:id/:tab? */
    if (seg[0] === 'lab' && seg[1]) {
      var lab = OR.Lab.get(seg[1]);
      if (!lab) return notFound('#/lab/' + seg[1]);
      var tab = seg[2] || 'result';
      var TAB_NAME = {
        result: '求解结果', theory: '理论要点', scenario: '场景背景',
        practice: '配套练习', knowledge: '知识图谱'
      };
      setCrumb([
        { text: '首页', href: '#/' },
        { text: '难度 ' + lab.level + ' · ' + LEVEL_META[lab.level], href: '#/labs' },
        { text: lab.name, href: '#/lab/' + lab.id },
        { text: TAB_NAME[tab] || '求解结果' }
      ]);
      setActiveNav('#/lab/' + lab.id);
      viewEl.innerHTML = '';
      OR.LabView.render(lab.id, viewEl, tab);
      return scrollTop();
    }

    /* #/knowledge 知识中心 */
    if (seg[0] === 'knowledge') {
      setCrumb([{ text: '首页', href: '#/' }, { text: '知识图谱' }]);
      setActiveNav('#/knowledge');
      viewEl.innerHTML = '';
      if (OR.KnowledgeView) OR.KnowledgeView.render(viewEl);
      else notFound('#/knowledge');
      return scrollTop();
    }

    /* #/kb/:id 知识点详情 */
    if (seg[0] === 'kb' && seg[1]) {
      var kc = OR.KB ? OR.KB.get(seg[1]) : null;
      var kd = kc && OR.KB ? OR.KB.domain(kc.domain) : null;
      setCrumb([
        { text: '首页', href: '#/' },
        { text: '知识图谱', href: '#/knowledge' },
        kd ? { text: kd.name } : null,
        { text: kc ? kc.name : '知识点' }
      ].filter(Boolean));
      setActiveNav('#/knowledge');
      viewEl.innerHTML = '';
      if (OR.KnowledgeView) OR.KnowledgeView.renderConcept(viewEl, seg[1]);
      else notFound('#/kb/' + seg[1]);
      return scrollTop();
    }

    /* #/practice 与 #/wrong */
    if (seg[0] === 'practice' || seg[0] === 'wrong') {
      setCrumb([{ text: '首页', href: '#/' }, { text: seg[0] === 'wrong' ? '错题本' : '习题库' }]);
      setActiveNav('#' + '/' + seg[0]);
      viewEl.innerHTML = '';
      OR.Problems.renderAll(viewEl);
      return scrollTop();
    }

    /* #/dashboard */
    if (seg[0] === 'dashboard') {
      setCrumb([{ text: '首页', href: '#/' }, { text: '学习档案' }]);
      setActiveNav('#/dashboard');
      OR.DashView.render(viewEl);
      return scrollTop();
    }

    /* #/settings */
    if (seg[0] === 'settings') {
      setCrumb([{ text: '首页', href: '#/' }, { text: 'AI 配置' }]);
      setActiveNav('#/settings');
      OR.SettingsView.render(viewEl);
      return scrollTop();
    }

    /* #/docs/:page? */
    if (seg[0] === 'docs') {
      var page = seg[1] || null;
      setCrumb([{ text: '首页', href: '#/' }, { text: '文档中心', href: '#/docs' }]);
      setActiveNav('#/docs');
      OR.DocsView.render(viewEl, page);
      return;
    }

    notFound(location.hash);
  }

  function notFound(hash) {
    setCrumb([{ text: '未找到' }]);
    setActiveNav('#/');
    viewEl.innerHTML = '';
    viewEl.appendChild(U.el('div.empty', null, [
      U.el('div.ico', { html: U.icon('target', 36) }),
      U.el('h4', { text: '页面不存在' }),
      U.el('p', { text: '路由 ' + hash + ' 没有匹配的视图。' }),
      U.el('button.btn.btn-primary', {
        html: U.icon('home', 14) + '<span>返回首页</span>',
        onclick: function () { location.hash = '#/'; }
      })
    ]));
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ===========================================================================
   * 三、AI 通道状态指示
   * ======================================================================== */
  function refreshAiChip() {
    var chip = document.getElementById('ai-chip');
    if (!chip || !OR.AI) return;
    var st = OR.AI.status();
    var map = {
      cloud: { label: 'AI 云服务在线', color: '#10b981', bg: 'var(--green-50)', fg: 'var(--green-600)' },
      custom: { label: 'AI 自定义端点', color: '#14b8a6', bg: 'var(--teal-50)', fg: 'var(--teal-600)' },
      offline: { label: 'AI 离线知识引擎', color: '#f59e0b', bg: 'var(--amber-50)', fg: 'var(--amber-600)' }
    };
    var m = map[st.provider] || map.offline;
    chip.style.background = m.bg;
    chip.style.color = m.fg;
    chip.innerHTML = '';
    chip.appendChild(U.el('span.dot.pulse', { style: 'background:' + m.color }));
    chip.appendChild(U.el('span', {
      text: m.label,
      style: 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'
    }));
    chip.appendChild(U.el('span.tiny', { text: st.sdkReady ? 'SDK ✓' : 'SDK —', style: 'opacity:.7' }));
    chip.title = st.lastError ? ('最近错误：' + st.lastError) : '点击打开 AI 助教面板';
    chip.style.cursor = 'pointer';
    chip.onclick = function () { OR.AIPanel.open(); };
  }

  /* ===========================================================================
   * 四、启动
   * ======================================================================== */
  function boot() {
    viewEl = document.getElementById('view');
    if (!viewEl) { console.error('[OR-SimLab] 缺少 #view 容器'); return; }

    buildSidebar();
    var topbar = buildTopbar();

    /* AI 面板 */
    var dock = document.getElementById('ai-dock');
    if (dock && OR.AIPanel) {
      try { OR.AIPanel.init(dock); }
      catch (e) { console.error('[OR-SimLab] AI 面板初始化失败', e); }
      var origUpdate = OR.AIPanel.updateStatus;
      OR.AIPanel.updateStatus = function () {
        try { origUpdate.apply(OR.AIPanel, arguments); } catch (e) { }
        refreshAiChip();
      };
      origUpdate.call(OR.AIPanel);
    }
    refreshAiChip();
    setInterval(refreshAiChip, 4000);

    /* 路由 */
    window.addEventListener('hashchange', function () {
      route();
      var c = document.getElementById('crumb');
      if (c) { /* 面包屑已在 route 内更新 */ }
      topbar.hide();
    });
    route();

    /* 移动端：点击视图区收起抽屉 */
    document.getElementById('view').addEventListener('click', function () {
      var s = document.getElementById('sidebar');
      if (s && s.classList.contains('open') && window.innerWidth <= 760) s.classList.remove('open');
    });

    /* 键盘快捷键：/ 聚焦搜索，Esc 关闭面板 */
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === '/') {
        e.preventDefault();
        var si = document.querySelector('.searchbox input');
        if (si) si.focus();
      }
    });

    console.log('%c OR-SimLab %c 运筹学虚拟仿真实验教学平台已就绪 ',
      'background:#2b5cff;color:#fff;border-radius:3px 0 0 3px;padding:2px 6px;font-weight:700',
      'background:#eef3ff;color:#2b5cff;border-radius:0 3px 3px 0;padding:2px 6px');
    console.log('场景 ' + OR.Lab.all().length + ' 个 · 题目 ' + totalQuestions() + ' 道 · 版本 v1.0');
  }

  /* ---------- 全局错误兜底 ---------- */
  window.addEventListener('error', function (e) {
    if (e && e.message && /ResizeObserver loop/i.test(e.message)) return;
    console.error('[OR-SimLab] 未捕获错误：', e.message, e.filename, e.lineno);
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    var msg = r && r.message ? r.message : String(r);
    console.error('[OR-SimLab] 未处理的 Promise 拒绝：', msg);
    if (/AI|fetch|network|Failed to fetch/i.test(msg)) {
      try { U.toast('网络请求失败，AI 助教将自动降级', 'warn'); } catch (x) { }
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  OR.app = { boot: boot, route: route, refreshAiChip: refreshAiChip };
})(typeof window !== 'undefined' ? window : globalThis);
