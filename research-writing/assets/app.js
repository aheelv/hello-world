/**
 * 站点渲染层：把 data/site-data.js 的结构化内容渲染进页面。
 * 无框架、无网络请求（<script src> 本地加载，file:// 直接打开也可用）。
 * 页面通过 data-render="xxx" 声明挂载点。
 */
(function () {
  'use strict';
  var D = window.SITE_DATA;
  if (!D) { console.error('site-data.js 未加载'); return; }

  /* ── 工具 ─────────────────────────────────────────────── */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function mount(name, html) {
    $$('[data-render="' + name + '"]').forEach(function (el) { el.innerHTML = html; });
  }
  function byId(id) {
    for (var i = 0; i < D.resources.length; i++) if (D.resources[i].id === id) return D.resources[i];
    return null;
  }
  function levelOf(lv) {
    for (var i = 0; i < D.levels.length; i++) if (D.levels[i].id === lv) return D.levels[i];
    return { id: lv, name: lv, color: 'blue' };
  }
  function stageName(id) {
    for (var i = 0; i < D.stages.length; i++) if (D.stages[i].id === id) return D.stages[i].name;
    return id;
  }
  function statusText(s) {
    return { ok: '链接可达（200）', bot: '自动请求被反爬拦截，正文已抓取核验', redirect: '会跳转到新地址（见说明）' }[s] || s;
  }
  function externalLink(url, label) {
    return '<a class="res-link" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' +
      esc(label || url) + ' <span aria-hidden="true">↗</span></a>';
  }
  function refChips(ids) {
    return (ids || []).map(function (id) {
      var r = byId(id);
      return '<a class="ref-chip" href="resources.html#' + esc(id) + '" title="' + esc(r ? r.zh : id) + '">' + esc(id) + '</a>';
    }).join('');
  }
  function badgeClass(color) {
    return { blue: 'b-blue', teal: 'b-teal', purple: 'b-purple', amber: 'b-amber' }[color] || 'b-grey';
  }

  /* ── 导航当前页高亮 ───────────────────────────────────── */
  function markNav() {
    var path = location.pathname.split('/').pop() || 'index.html';
    $$('.site-nav .sn-links a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('#')[0];
      if (href === path) a.setAttribute('aria-current', 'page');
    });
  }

  /* ── 元信息 ───────────────────────────────────────────── */
  function renderMeta() {
    mount('verifiedAt', esc(D.meta.verifiedAt));
    mount('version', 'v' + esc(D.meta.version));
    mount('scope', esc(D.meta.scope));
    mount('disclaimer', esc(D.meta.disclaimer));
    mount('buildNote', esc(D.meta.buildNote));
    mount('resourceCount', String(D.resources.length));
    mount('strategyCount', String(D.strategies.length));
    mount('practiceCount', String(D.practices.length));
    mount('translationCount', String(D.translations.length));
    mount('glossaryCount', String(D.glossary.length));
  }

  /* ── 证据等级 ─────────────────────────────────────────── */
  function renderLevels() {
    mount('levels', '<div class="level-list">' + D.levels.map(function (l) {
      return '<div class="level-item"><div class="lv lv-' + esc(l.color) + '">' + esc(l.id) + '</div>' +
        '<div><div class="lt">' + esc(l.name) + '</div><div class="ld">' + esc(l.desc) + '</div></div></div>';
    }).join('') + '</div>');
  }

  /* ── 阶段路线图 ───────────────────────────────────────── */
  var stageDesc = {
    topic: '研究问题的可答性、贡献定位与期刊范围初判',
    design: '分析计划、报告规范、预注册与数据可追溯性',
    writing: '章节结构、主张—证据一致性、引用与 AI 披露',
    submission: '期刊核查、材料齐备、署名与一稿一投',
    review: '评审流程、逐条回复、修订与申诉',
    publish: '发表策略、可验证性、更正撤稿与成果评价'
  };
  function renderRoadmap() {
    mount('roadmap', '<div class="roadmap">' + D.stages.map(function (s) {
      return '<a href="' + esc(s.file) + '"><span class="num">' + esc(s.icon) + ' / STAGE</span>' +
        '<span class="ttl">' + esc(s.name) + '</span><span class="dsc">' + esc(stageDesc[s.id]) + '</span></a>';
    }).join('') + '</div>');
  }

  /* ── 资源卡片 ─────────────────────────────────────────── */
  function resourceCard(r) {
    var lv = levelOf(r.level);
    var stars = (r.stars != null)
      ? '<span class="badge b-amber">★ ' + Number(r.stars).toLocaleString('en-US') + ' · ' + esc(r.starsAt) + '</span>' : '';
    var statusBadge = r.status === 'ok' ? '<span class="badge b-green">可达</span>'
      : r.status === 'redirect' ? '<span class="badge b-grey">跳转</span>'
      : '<span class="badge b-grey">反爬拦截</span>';
    return '<article class="res-card lv-' + esc(r.level) + '" id="' + esc(r.id) + '">' +
      '<div class="res-head"><h3>' + esc(r.zh) + '</h3>' +
        '<span class="badge ' + badgeClass(lv.color) + '">' + esc(r.level) + ' · ' + esc(lv.name) + '</span>' + statusBadge + stars + '</div>' +
      '<div class="res-en">' + esc(r.en) + '</div>' +
      '<div class="res-meta">' + (r.stages || []).map(function (s) {
        return '<span class="badge b-grey">' + esc(stageName(s)) + '</span>';
      }).join('') + '</div>' +
      '<p class="res-note">' + esc(r.note) + '</p>' +
      '<div class="res-caution"><strong>适用边界：</strong>' + esc(r.caution) + '</div>' +
      '<div class="res-fields">' +
        '<div><span class="k">来源</span><span class="v">' + esc(r.org) + '</span></div>' +
        '<div><span class="k">适用对象</span><span class="v">' + esc(r.audience) + '</span></div>' +
        '<div><span class="k">时效</span><span class="v">' + esc(r.time) + '</span></div>' +
        '<div><span class="k">核验</span><span class="v">' + esc(D.meta.verifiedAt) + ' · ' + esc(statusText(r.status)) + '</span></div>' +
      '</div>' +
      '<p style="margin:.7rem 0 0">' + externalLink(r.url) + '</p>' +
      '</article>';
  }

  function renderResourceLibrary() {
    var host = $('[data-render="resources"]');
    if (!host) return;
    var search = $('#res-search'), levelSel = $('#res-level'), stageSel = $('#res-stage'), kindSel = $('#res-kind');
    var kinds = [];
    D.resources.forEach(function (r) { if (kinds.indexOf(r.kind) < 0) kinds.push(r.kind); });
    var kindNames = { official: '官方规范与法规', journal: '期刊/出版机构', reporting: '报告规范', openscience: '开放科学', assessment: '评价与核查', github: 'GitHub 项目与工具', paper: '方法学文献' };
    if (kindSel) {
      kindSel.innerHTML = '<option value="">全部类型</option>' + kinds.map(function (k) {
        return '<option value="' + esc(k) + '">' + esc(kindNames[k] || k) + '</option>';
      }).join('');
    }
    if (levelSel) {
      levelSel.innerHTML = '<option value="">全部证据等级</option>' + D.levels.map(function (l) {
        return '<option value="' + esc(l.id) + '">' + esc(l.id) + ' · ' + esc(l.name) + '</option>';
      }).join('');
    }
    if (stageSel) {
      stageSel.innerHTML = '<option value="">全部阶段</option>' + D.stages.map(function (s) {
        return '<option value="' + esc(s.id) + '">' + esc(s.name) + '</option>';
      }).join('');
    }
    function apply() {
      var q = (search && search.value || '').trim().toLowerCase();
      var lv = levelSel && levelSel.value || '';
      var st = stageSel && stageSel.value || '';
      var kd = kindSel && kindSel.value || '';
      var list = D.resources.filter(function (r) {
        if (lv && r.level !== lv) return false;
        if (st && (r.stages || []).indexOf(st) < 0) return false;
        if (kd && r.kind !== kd) return false;
        if (q) {
          var hay = [r.id, r.zh, r.en, r.org, r.note, r.caution, r.audience, r.time].join(' ').toLowerCase();
          if (hay.indexOf(q) < 0) return false;
        }
        return true;
      });
      host.innerHTML = list.length
        ? '<div class="res-list">' + list.map(resourceCard).join('') + '</div>'
        : '<div class="card"><p class="muted">没有符合条件的资源，请放宽筛选条件。</p></div>';
      var c = $('[data-render="resCount"]');
      if (c) c.textContent = '显示 ' + list.length + ' / ' + D.resources.length + ' 项资源';
      highlightHash();
    }
    [search, levelSel, stageSel, kindSel].forEach(function (el) {
      if (!el) return;
      el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', apply);
    });
    apply();
  }

  function highlightHash() {
    var m = /^#(R\d+)$/.exec(location.hash);
    if (!m) return;
    var el = document.getElementById(m[1]);
    if (!el) return;
    el.style.outline = '3px solid #7fb2e5';
    el.style.outlineOffset = '3px';
  }

  /* ── 阶段页相关资源 ───────────────────────────────────── */
  function renderRelated() {
    $$('[data-related]').forEach(function (host) {
      var stage = host.getAttribute('data-related');
      var limit = parseInt(host.getAttribute('data-limit') || '0', 10);
      var list = D.resources.filter(function (r) { return (r.stages || []).indexOf(stage) >= 0; });
      if (limit > 0) list = list.slice(0, limit);
      host.innerHTML = '<div class="related-grid">' + list.map(function (r) {
        return '<div class="related-item"><a class="rt" href="resources.html#' + esc(r.id) + '">' +
          esc(r.zh) + ' <span class="badge ' + badgeClass(levelOf(r.level).color) + '">' + esc(r.level) + '</span></a>' +
          '<span class="rd">' + esc(r.org) + ' · ' + esc(r.audience) + '</span></div>';
      }).join('') + '</div>' + (limit > 0
        ? '<p class="small" style="margin-top:.7rem">共 ' + D.resources.filter(function (r) { return (r.stages || []).indexOf(stage) >= 0; }).length +
          ' 项相关资源，<a href="resources.html">前往资源库按阶段筛选全部条目</a>。</p>' : '');
    });
  }

  /* ── 译介 ─────────────────────────────────────────────── */
  function renderTranslations() {
    mount('translations', D.translations.map(function (t) {
      var r = byId(t.source);
      return '<div class="card tr-item" id="' + esc(t.id) + '">' +
        '<div style="display:flex;flex-wrap:wrap;gap:.4rem;align-items:baseline">' +
          '<h3 style="margin:0;flex:1 1 300px">' + esc(t.title) + '</h3>' +
          '<a class="badge b-blue" href="resources.html#' + esc(t.source) + '">来源 ' + esc(t.source) + ' · ' + esc(r ? r.org : '') + '</a></div>' +
        '<div class="tr-original"><strong>英文原文（摘）：</strong>' + esc(t.original) + '</div>' +
        '<p class="tr-zh"><strong>中文摘译：</strong>' + esc(t.zh) + '</p>' +
        '<p class="tr-note"><strong>说明：</strong>' + esc(t.note) + '</p>' +
        (r ? '<p class="tr-note">' + externalLink(r.url, '查看原文 ↗') + '</p>' : '') +
        '</div>';
    }).join('') + '<p class="callout warn"><strong>译介声明：</strong>以上均为本站依据英文原文所作的摘译与编译，不是任何机构的官方中文版；涉及投稿决策、署名认定与合规判断时，一律以英文原文及目标期刊当期政策为准。</p>');
  }

  /* ── 策略 ─────────────────────────────────────────────── */
  function renderStrategies() {
    mount('strategies', '<div class="grid grid-2">' + D.strategies.map(function (s) {
      return '<div class="card strategy-card" id="' + esc(s.id) + '">' +
        '<div class="st-head"><h3>' + esc(s.title) + '</h3>' +
          '<span class="badge b-blue">' + esc(stageName(s.stage)) + '</span></div>' +
        '<div class="st-sec"><span class="lbl">可执行步骤</span><ol>' + s.steps.map(function (x) {
          return '<li>' + esc(x) + '</li>';
        }).join('') + '</ol></div>' +
        '<div class="st-sec"><span class="lbl">依据来源</span>' + refChips(s.evidence) + '</div>' +
        '<div class="st-sec"><span class="lbl">适用边界</span><div class="boundary">' + esc(s.boundary) + '</div></div>' +
        '<div class="st-sec"><span class="lbl">效果说明（不作保证）</span><div class="caveat">' + esc(s.caveat) + '</div></div>' +
        '</div>';
    }).join('') + '</div>');
  }

  /* ── 合规/风险/不端 三分类 ───────────────────────────── */
  var triadMeta = {
    compliant: { t: '合规技巧', s: '在规范允许范围内提升质量与效率', cls: 'compliant' },
    risky: { t: '非正规做法 / 高风险', s: '可能违反期刊政策或损害可信度，部分已属违规', cls: 'risky' },
    misconduct: { t: '学术不端 / 科研失信', s: '法规与规范明令禁止，可能导致撤稿与调查', cls: 'misconduct' }
  };
  function renderPractices() {
    var html = '<div class="triad">' + Object.keys(triadMeta).map(function (key) {
      var m = triadMeta[key];
      var items = D.practices.filter(function (p) { return p.label === key; });
      return '<div class="triad-col ' + m.cls + '"><header><span class="t">' + m.t + ' <span class="badge b-grey">' + items.length + ' 项</span></span>' +
        '<span class="s">' + m.s + '</span></header><div class="body">' + items.map(function (p) {
          return '<div class="practice"><span class="pt">' + esc(p.title) + '</span>' +
            '<span class="pd">' + esc(p.desc) + '</span>' +
            '<span class="pb">' + esc(p.boundary) + '</span>' +
            '<span class="refs">' + refChips(p.evidence) + '</span></div>';
        }).join('') + '</div></div>';
    }).join('') + '</div>';
    mount('practices', html);
  }

  /* ── 术语表 ───────────────────────────────────────────── */
  function renderGlossary() {
    var host = $('[data-render="glossary"]');
    if (!host) return;
    var search = $('#glossary-search');
    function rows() {
      var q = (search && search.value || '').trim().toLowerCase();
      var list = D.glossary.filter(function (g) {
        return !q || (g.en + ' ' + g.zh + ' ' + g.note).toLowerCase().indexOf(q) >= 0;
      });
      host.innerHTML = '<div class="table-scroll"><table><thead><tr><th style="width:26%">English</th><th style="width:18%">中文</th><th>说明</th></tr></thead><tbody>' +
        list.map(function (g) {
          return '<tr><td><strong>' + esc(g.en) + '</strong></td><td>' + esc(g.zh) + '</td><td class="small">' + esc(g.note) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      var c = $('[data-render="glossaryCountShown"]');
      if (c) c.textContent = '显示 ' + list.length + ' / ' + D.glossary.length + ' 条';
    }
    if (search) search.addEventListener('input', rows);
    rows();
  }

  /* ── 维护页：变更记录 / 未收录项 / 资源清单摘要 ────────── */
  function renderMaintain() {
    mount('changelog', D.changelog.map(function (c) {
      return '<div class="card"><h3 style="margin-top:0">' + esc(c.date) + ' · v' + esc(c.version) + '</h3><ul>' +
        c.changes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    }).join(''));
    mount('excluded', '<div class="table-scroll"><table><thead><tr><th style="width:32%">候选项</th><th>未收录原因</th><th style="width:12%">核验日期</th></tr></thead><tbody>' +
      D.excluded.map(function (e) {
        return '<tr><td><code>' + esc(e.name) + '</code></td><td>' + esc(e.reason) + '</td><td class="small">' + esc(e.verified) + '</td></tr>';
      }).join('') + '</tbody></table></div>');
    var byLevel = {};
    D.resources.forEach(function (r) { byLevel[r.level] = (byLevel[r.level] || 0) + 1; });
    mount('levelStats', '<div class="table-scroll"><table><thead><tr><th>等级</th><th>定义</th><th>数量</th></tr></thead><tbody>' +
      D.levels.map(function (l) {
        return '<tr><td><span class="badge ' + badgeClass(l.color) + '">' + esc(l.id) + ' · ' + esc(l.name) + '</span></td>' +
          '<td class="small">' + esc(l.desc) + '</td><td>' + esc(byLevel[l.id] || 0) + '</td></tr>';
      }).join('') + '</tbody></table></div>');
  }

  /* ── 启动 ─────────────────────────────────────────────── */
  function init() {
    markNav();
    renderMeta();
    renderLevels();
    renderRoadmap();
    renderResourceLibrary();
    renderRelated();
    renderTranslations();
    renderStrategies();
    renderPractices();
    renderGlossary();
    renderMaintain();
    window.addEventListener('hashchange', highlightHash);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
