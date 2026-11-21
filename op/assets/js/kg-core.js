/* 公共数据层：所有页面只通过 KG.data 读取同一份 data/course-kg.js。
   无 fetch、无网络请求，双击 HTML 即可运行。 */
(function (global) {
  'use strict';

  var KG = {
    data: null,
    base: '',
    byId: {},
    byName: {},
    chapters: [],
    chapterColors: {},
    palette: ['#2E5C8A', '#4A90D9', '#27AE60', '#E67E22', '#D4537E', '#7F77DD', '#17A2B8'],
    relColor: { '前置': '#4A90D9', '后置': '#E67E22', '关联': '#27AE60' }
  };

  KG.init = function (data, base) {
    KG.data = data || global.COURSE_KG;
    KG.base = base || '';
    if (!KG.data) throw new Error('未找到 window.COURSE_KG，请确认已引入 data/course-kg.js');
    KG.byId = {}; KG.byName = {};
    KG.data.nodes.forEach(function (n) { KG.byId[n.id] = n; KG.byName[n.name] = n; });
    KG.chapters = KG.data.chapters.map(function (c) { return c.name; });
    KG.chapters.forEach(function (c, i) { KG.chapterColors[c] = KG.palette[i % KG.palette.length]; });
    return KG;
  };

  KG.path = function (rel) { return KG.base + rel; };
  KG.nodeUrl = function (id) { return KG.path('app/node.html?id=' + encodeURIComponent(id)); };
  KG.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  KG.color = function (chapter) { return KG.chapterColors[chapter] || '#5A6B7B'; };
  KG.typeColor = function (t) { return t === '知识点' ? '#27AE60' : '#2E5C8A'; };

  /* ---------- 登录态（纯前端演示，无后端、无真实鉴权） ---------- */
  var KEY = 'course_kg_session';
  KG.user = function () {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  };
  KG.login = function (name, role) {
    localStorage.setItem(KEY, JSON.stringify({ name: name, role: role, at: new Date().toISOString() }));
  };
  KG.logout = function () { localStorage.removeItem(KEY); };

  /* ---------- 顶栏 / 页脚 ---------- */
  KG.mountHeader = function (opts) {
    opts = opts || {};
    var el = document.getElementById('site-header');
    if (!el) return;
    var u = KG.user();
    var links = [
      ['home', KG.path('index.html'), '登录入口'],
      ['app', KG.path('app/index.html'), '通用系统'],
      ['demos', KG.path('demos/index.html'), '模板演示'],
      ['io', KG.path('io/index.html'), '导入导出'],
      ['docs', KG.path('docs/index.html'), '项目说明']
    ];
    var nav = links.map(function (l) {
      return '<a href="' + l[1] + '" class="' + (opts.active === l[0] ? 'active' : '') + '">' + l[2] + '</a>';
    }).join('');
    var chip = u
      ? '<span class="chip green">已登录 · ' + KG.esc(u.name) + '（' + KG.esc(u.role) + '）</span>' +
        '<a class="btn ghost sm" href="' + KG.path('index.html') + '" onclick="KG.logout();">退出</a>'
      : '<span class="chip orange">访客模式</span><a class="btn sm" href="' + KG.path('index.html') + '">去登录</a>';
    el.innerHTML =
      '<div class="topbar"><div class="topbar-inner">' +
      '<a class="brand" href="' + KG.path('index.html') + '"><span class="brand-mark">KG</span>' +
      '<span>课程知识图谱系统<small>运筹学 · 7 章 · 超星格式兼容</small></span></a>' +
      '<nav class="nav">' + nav + '</nav>' +
      '<div class="topbar-right">' + chip + '</div></div></div>';
  };

  KG.mountFooter = function () {
    var el = document.getElementById('site-footer');
    if (!el) return;
    var m = KG.data.meta;
    el.innerHTML = '<div class="footer">' +
      '统一数据源：<code>data/course-kg.json</code> · ' + KG.esc(m.nodeCount) + ' 节点 / ' +
      KG.esc(m.edgeCount) + ' 关系 / ' + KG.esc(m.chapterCount) + ' 章节 · 生成于 ' + KG.esc(m.generatedAt) +
      '<br>本项目为教学演示：<b>登录为纯前端演示，不含后端鉴权</b>；与超星平台为文件级导入导出，不调用在线接口。' +
      '</div>';
  };

  KG.mountAuthNotice = function () {
    if (KG.user()) return;
    var host = document.getElementById('auth-notice');
    if (!host) return;
    host.innerHTML = '<div class="note warn"><b>当前为访客模式</b>：页面与数据均可完整查看；' +
      '如需进入登录后的工作台视图，请到 <a href="' + KG.path('index.html') + '">统一登录入口</a> 登录（演示账号见该页）。</div>';
  };

  /* ---------- 数据查询 ---------- */
  KG.children = function (id) {
    return KG.data.nodes.filter(function (n) { return n.parentId === id; });
  };
  KG.hierarchy = function (chapter) {
    var roots = KG.data.nodes.filter(function (n) { return n.parentId == null && (!chapter || n.chapter === chapter); });
    function build(n) {
      return { node: n, children: KG.children(n.id).map(build) };
    }
    return roots.map(build);
  };
  KG.relationsOf = function (id) {
    return KG.data.edges.filter(function (e) { return e.source === id || e.target === id; });
  };
  KG.search = function (q, opts) {
    opts = opts || {};
    q = (q || '').trim().toLowerCase();
    return KG.data.nodes.filter(function (n) {
      if (opts.chapter && n.chapter !== opts.chapter) return false;
      if (opts.type && n.type !== opts.type) return false;
      if (opts.level && n.level !== +opts.level) return false;
      if (opts.difficulty && n.difficulty !== opts.difficulty) return false;
      if (!q) return true;
      var hay = [n.name, n.description, n.chapter, n.category, n.keypoint, n.literacy, n.application]
        .concat(n.tags).join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    });
  };
  KG.neighborIds = function (id) {
    var set = {};
    KG.relationsOf(id).forEach(function (e) { set[e.source === id ? e.target : e.source] = true; });
    return set;
  };

  KG.stat = function () {
    var d = KG.data;
    return {
      nodes: d.nodes.length, edges: d.edges.length, chapters: d.chapters.length,
      units: d.nodes.filter(function (n) { return n.type === '知识单元'; }).length,
      points: d.nodes.filter(function (n) { return n.type === '知识点'; }).length,
      tags: {}, relations: d.statistics.byRelation, difficulty: d.statistics.byDifficulty
    };
  };

  /* ---------- 节点详情 HTML ---------- */
  KG.relList = function (arr, label) {
    if (!arr || !arr.length) return '';
    return '<dt>' + label + '</dt><dd class="chip-row">' + arr.map(function (name) {
      var t = KG.byName[name];
      return t ? '<a class="chip" href="' + KG.nodeUrl(t.id) + '">' + KG.esc(name) + '</a>'
               : '<span class="chip gray">' + KG.esc(name) + '</span>';
    }).join('') + '</dd>';
  };
  KG.detailHTML = function (n) {
    if (!n) return '<div class="empty">请选择一个节点</div>';
    var rels = KG.relationsOf(n.id);
    var inc = rels.filter(function (e) { return e.target === n.id; });
    var out = rels.filter(function (e) { return e.source === n.id; });
    function lines(list, dir) {
      if (!list.length) return '<span class="muted">无</span>';
      return list.map(function (e) {
        var t = KG.byId[dir === 'in' ? e.source : e.target];
        return '<a class="chip" style="border-color:' + KG.relColor[e.relation] + ';color:' + KG.relColor[e.relation] +
          '" href="' + KG.nodeUrl(t.id) + '">' + KG.esc(e.relation) + ' · ' + KG.esc(t.name) + '</a>';
      }).join(' ');
    }
    return '<div class="chip-row" style="margin-bottom:10px">' +
        '<span class="chip" style="background:' + KG.color(n.chapter) + ';color:#fff;border:0">' + KG.esc(n.chapter) + '</span>' +
        '<span class="chip ' + (n.type === '知识点' ? 'green' : 'purple') + '">' + KG.esc(n.type) + '</span>' +
        '<span class="chip gray">第 ' + n.level + ' 级</span>' +
        (n.difficulty ? '<span class="chip orange">难易：' + KG.esc(n.difficulty) + '</span>' : '') +
        (n.keypoint ? '<span class="chip pink">' + KG.esc(n.keypoint) + '</span>' : '') +
      '</div>' +
      '<h2 style="font-size:20px">' + KG.esc(n.name) + '</h2>' +
      '<div class="muted" style="font-size:12.5px;margin-bottom:12px">路径：' + KG.esc(n.path.join(' › ')) +
      '　|　编号 ' + n.id + '　|　源表第 ' + n.sourceRow + ' 行</div>' +
      '<dl class="detail">' +
      '<dt>节点描述</dt><dd>' + (KG.esc(n.description) || '<span class="muted">（知识单元无描述）</span>') + '</dd>' +
      (n.type === '知识点' ? (
        '<dt>专业素养</dt><dd>' + (KG.esc(n.literacy) || '—') + '</dd>' +
        '<dt>应用能力</dt><dd>' + (KG.esc(n.application) || '—') + '</dd>' +
        '<dt>知识点分类</dt><dd>' + (KG.esc(n.category) || '—') + '</dd>' +
        '<dt>标签</dt><dd class="chip-row">' + (n.tags.length ? n.tags.map(function (t) { return '<span class="chip gray">' + KG.esc(t) + '</span>'; }).join('') : '—') + '</dd>'
      ) : '') +
      '<dt>入边（' + inc.length + '）</dt><dd class="chip-row">' + lines(inc, 'in') + '</dd>' +
      '<dt>出边（' + out.length + '）</dt><dd class="chip-row">' + lines(out, 'out') + '</dd>' +
      '</dl>';
  };

  /* ---------- 工具 ---------- */
  KG.download = function (filename, content, mime) {
    var blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };
  KG.toast = function (msg) {
    var t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(KG._tt); KG._tt = setTimeout(function () { t.classList.remove('show'); }, 2400);
  };
  KG.selectOptions = function (arr, cur, allLabel) {
    var h = allLabel ? '<option value="">' + allLabel + '</option>' : '';
    return h + arr.map(function (x) {
      return '<option value="' + KG.esc(x) + '"' + (String(cur) === String(x) ? ' selected' : '') + '>' + KG.esc(x) + '</option>';
    }).join('');
  };
  KG.qsa = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  global.KG = KG;
})(window);
