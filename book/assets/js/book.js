/* 书籍详情页交互：目录高亮、章节筛选、名言筛选、跨栏目检索 */
(function () {
  'use strict';

  /* 按书切换计量单位与空结果提示（首本书保持原有文案） */
  var BOOK = document.body.dataset.book || '';
  var UNITS = {
    'xitong-lun': '章', 'sikao-kuai-yu-man': '章',
    'yuan-ze': '章', 'jinrong-lianjinshu': '章', 'qiongchali-baodian': '章',
    'zhongyong': '章', 'daxue': '章', 'chuanxi-lu': '条', 'zhouyi': '卦',
    'neidan-tongshi': '题', 'xianxue-yangsheng': '题',
    'zhengxin-de-fojiao': '问', 'ahan-jing': '组', 'tanjing': '品', 'huxi-zhi-jian': '编',
    'xitong-zhimei': '章', 'nawaer-baodian': '章', 'chaoyue-zhishang': '章',
    'fan-cuiruo': '章', 'lunzheng-shi-yimen-xuewen': '条', 'renlei-jianshi': '章',
    'shijianlun-maodunlun': '节', 'renzhi-juexing': '节', 'shaoyouren-zou-de-lu': '节'
  };
  var unit = UNITS[BOOK] || '篇';
  var HINTS = {
    'huangdi-neijing': '「阴阳」「治未病」「经络」「王冰」',
    'xitong-lun': '「整体性」「涌现」「自组织」「反馈」',
    'yantie-lun': '「盐铁」「桑弘羊」「本末」「轻重」',
    'sikao-kuai-yu-man': '「系统1」「锚定」「前景理论」「框架」',
    'shanghan-lun': '「六经」「桂枝汤」「辨证」「和法」',
    'yuan-ze': '「极度求真」「创意择优」「可信度加权」「五步流程」',
    'jinrong-lianjinshu': '「反身性」「主流偏向」「盛衰」「拐点」',
    'qiongchali-baodian': '「思维模型」「逆向」「激励」「检查清单」',
    'chuanxi-lu': '「心即理」「致良知」「知行合一」「四句教」',
    'zengguofan-jiashu': '「日课」「有恒」「慎独」「拙诚」',
    'zhongyong': '「天命」「慎独」「中和」「诚」',
    'daxue': '「明明德」「格物」「诚意」「絜矩」',
    'lunyu': '「仁」「礼」「君子」「忠恕」',
    'zhouyi': '「乾」「坤」「时位」「既济」',
    'neidan-tongshi': '「性命」「周天」「火候」「玄关」',
    'zhengxin-de-fojiao': '「正信」「三法印」「四圣谛」「因果」',
    'ahan-jing': '「四圣谛」「缘起」「念处」「无我」',
    'tanjing': '「自性」「顿悟」「无念」「定慧」',
    'huxi-zhi-jian': '「正身」「入静」「调息」「胎息」',
    'xianxue-yangsheng': '「仙学」「神气合一」「性命」「静功」',
    'baiyuchan-ji': '「凝神」「性命」「即心是道」「雷法」',
    'xitong-zhimei': '「存量」「调节回路」「延迟」「目标侵蚀」「杠杆点」',
    'nawaer-baodian': '「专长」「杠杆」「判断力」「幸福」「欲望」',
    'chaoyue-zhishang': '「理性障碍」「反省心智」「认知吝啬鬼」「心智程序」',
    'fan-cuiruo': '「反脆弱」「杠铃」「选择权」「林迪效应」「切身利害」',
    'lunzheng-shi-yimen-xuewen': '「前提」「反例」「背景率」「归谬法」「共识」',
    'renlei-jianshi': '「认知革命」「虚构」「金钱」「帝国」「科学革命」',
    'shijianlun-maodunlun': '「实践」「两次飞跃」「主要矛盾」「特殊性」',
    'renzhi-juexing': '「元认知」「舒适区边缘」「深度学习」「心智带宽」',
    'shaoyouren-zou-de-lu': '「推迟满足感」「承担责任」「自我界限」「恩典」'
  };

  /* ---------- 侧栏目录高亮 ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('#side-nav a[data-section]'));
  var sections = links.map(function (a) { return document.getElementById(a.dataset.section); });
  function spy() {
    var y = window.scrollY + 130, idx = 0;
    sections.forEach(function (s, i) { if (s && s.offsetTop <= y) idx = i; });
    links.forEach(function (a, i) { a.classList.toggle('active', i === idx); });
  }
  window.addEventListener('scroll', spy, { passive: true });
  spy();

  /* ---------- 章节筛选 ---------- */
  var cSearch = document.getElementById('chapter-search');
  var partChips = document.getElementById('part-chips');
  var chapterRoot = document.getElementById('chapter-root');
  var countLine = document.getElementById('chapter-count');
  var cards = chapterRoot ? Array.prototype.slice.call(chapterRoot.querySelectorAll('.chapter-card')) : [];
  var currentPart = '__all__';

  function filterChapters() {
    var q = (cSearch && cSearch.value || '').trim().toLowerCase();
    var n = 0;
    cards.forEach(function (c) {
      var cardPart = c.closest('.chapter-part').dataset.part;
      var okPart = currentPart === '__all__' || cardPart === currentPart;
      var hay = (c.dataset.text || '').toLowerCase();
      var okText = !q || hay.indexOf(q) > -1;
      var show = okPart && okText;
      c.hidden = !show;
      if (show) n++;
      if (show && q) c.open = true;
    });
    if (chapterRoot) {
      Array.prototype.slice.call(chapterRoot.querySelectorAll('.chapter-part')).forEach(function (p) {
        var any = Array.prototype.slice.call(p.querySelectorAll('.chapter-card')).some(function (c) { return !c.hidden; });
        p.hidden = !any;
      });
    }
    if (countLine) countLine.innerHTML = '当前显示 <b>' + n + '</b> ' + unit + (q ? '（匹配「' + q.replace(/</g, '&lt;') + '」自动展开）' : '');
  }
  if (cSearch) cSearch.addEventListener('input', filterChapters);
  if (partChips) partChips.addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    partChips.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('on'); });
    b.classList.add('on'); currentPart = b.dataset.part; filterChapters();
  });
  var exAll = document.getElementById('expand-all'), coAll = document.getElementById('collapse-all');
  if (exAll) exAll.addEventListener('click', function () { cards.forEach(function (c) { if (!c.hidden) c.open = true; }); });
  if (coAll) coAll.addEventListener('click', function () { cards.forEach(function (c) { c.open = false; }); });

  /* ---------- 名言筛选 ---------- */
  var qSearch = document.getElementById('quote-search');
  var qChips = document.getElementById('quote-chips');
  var qCards = Array.prototype.slice.call(document.querySelectorAll('.quote-card'));
  var qEmpty = document.getElementById('quote-empty');
  var currentTag = '__all__';
  function filterQuotes() {
    var q = (qSearch && qSearch.value || '').trim().toLowerCase();
    var n = 0;
    qCards.forEach(function (c) {
      var tags = Array.prototype.slice.call(c.querySelectorAll('.quote-tags i')).map(function (i) { return i.textContent; });
      var okTag = currentTag === '__all__' || tags.indexOf(currentTag) > -1;
      var okText = !q || (c.dataset.text || '').toLowerCase().indexOf(q) > -1;
      var show = okTag && okText; c.hidden = !show; if (show) n++;
    });
    if (qEmpty) qEmpty.hidden = n > 0;
  }
  if (qSearch) qSearch.addEventListener('input', filterQuotes);
  if (qChips) qChips.addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    qChips.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('on'); });
    b.classList.add('on'); currentTag = b.dataset.tag; filterQuotes();
  });

  /* ---------- 跨栏目检索 ---------- */
  var overlay = document.getElementById('search-overlay');
  var input = document.getElementById('global-search');
  var results = document.getElementById('search-results');
  var openBtn = document.getElementById('global-search-btn');
  var closeBtn = document.getElementById('search-close');
  var INDEX = window.__SEARCH__ || [];
  var active = 0;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function hl(s, q) {
    if (!q) return esc(s);
    var i = s.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return esc(s);
    return esc(s.slice(0, i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>' + esc(s.slice(i + q.length));
  }
  function render(q) {
    var list = [];
    if (q) {
      var ql = q.toLowerCase();
      list = INDEX.filter(function (it) {
        return (it.h + ' ' + it.d + ' ' + it.t).toLowerCase().indexOf(ql) > -1;
      }).slice(0, 40);
    } else {
      list = INDEX.filter(function (it) { return it.t === '核心理念' || it.t === '经典分析'; }).slice(0, 12);
    }
    active = 0;
    if (!list.length) {
      results.innerHTML = '<div class="search-item"><p>没有找到相关内容，试试' + (HINTS[BOOK] || '换个关键词，或从侧栏目录进入对应栏目') + '…</p></div>';
      return;
    }
    results.innerHTML = list.map(function (it, i) {
      return '<a class="search-item' + (i === 0 ? ' focus' : '') + '" href="#' + esc(it.a) + '" data-i="' + i + '">' +
        '<div class="si-top"><span class="si-tag">' + esc(it.t) + '</span><b>' + hl(it.h, q) + '</b></div>' +
        '<p>' + hl((it.d || '').replace(/\s+/g, ' ').slice(0, 110), q) + '</p></a>';
    }).join('');
  }
  function open() { if (!overlay) return; overlay.hidden = false; document.body.style.overflow = 'hidden'; render(''); setTimeout(function () { input.focus(); }, 30); }
  function close() { if (!overlay) return; overlay.hidden = true; document.body.style.overflow = ''; }
  function go(idx) {
    var items = results.querySelectorAll('.search-item');
    if (!items[idx]) return;
    var href = items[idx].getAttribute('href');
    close();
    var target = document.getElementById(href.slice(1));
    if (target) {
      if (target.classList.contains('chapter-card')) target.open = true;
      setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
    }
  }
  if (openBtn) openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (overlay) overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  if (results) results.addEventListener('click', function (e) {
    var it = e.target.closest('.search-item'); if (!it) return;
    e.preventDefault(); go(parseInt(it.dataset.i, 10));
  });
  if (input) {
    input.addEventListener('input', function () { render(input.value.trim()); });
    input.addEventListener('keydown', function (e) {
      var items = results.querySelectorAll('.search-item');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        active = Math.max(0, Math.min(items.length - 1, active + (e.key === 'ArrowDown' ? 1 : -1)));
        items.forEach(function (x, i) { x.classList.toggle('focus', i === active); });
        if (items[active]) items[active].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') { e.preventDefault(); go(active); }
      else if (e.key === 'Escape') { close(); }
    });
  }
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); overlay && (overlay.hidden ? open() : close()); }
    else if (e.key === 'Escape' && overlay && !overlay.hidden) close();
    else if (e.key === '/' && overlay && overlay.hidden && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
  });
})();
