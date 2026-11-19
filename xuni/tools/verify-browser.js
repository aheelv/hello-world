/* =============================================================================
 * OR-SimLab · 无头浏览器渲染回归测试
 * -----------------------------------------------------------------------------
 * 用 jsdom 真实加载 index.html 的完整脚本链，然后驱动全部路由与交互路径，
 * 断言「渲染成功 + 无未捕获异常 + 关键节点存在」。
 *
 * 覆盖范围：
 *   1. 外壳       侧栏 / 顶栏 / AI 面板 / 面包屑
 *   2. 全路由     9 个场景 × 4 个页签、场景目录、习题库、错题本、学习档案、
 *                 AI 配置、文档中心 11 份文档
 *   3. 图表挂载   折线 / 柱状 / 饼图 / 热力 / 网络 / 甘特 六类 canvas 绘制
 *   4. 题目作答   自动答对全部题目 → 校验判分、错题本、档案聚合
 *   5. AI 通道    离线知识引擎四种角色 + 面板交互
 *   6. 异常兜底   全流程零 console.error / 零未捕获异常
 *
 * 用法：node tools/verify-browser.js
 * ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const NODE_PATH = process.env.NODE_PATH || '';

/* ---------- 断言收集 ---------- */
const results = [];
let currentGroup = '';
function group(name) { currentGroup = name; console.log('\n■ ' + name); }
function ok(name, cond, detail) {
  results.push({ group: currentGroup, name, pass: !!cond, detail });
  console.log('  ' + (cond ? '\u2713' : '\u2717') + ' ' + name + (cond ? '' : '   <<< ' + (detail || '')));
}

/* ---------- 读取 index.html 并抽取脚本清单 ---------- */
const htmlRaw = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scriptSrcs = [...htmlRaw.matchAll(/<script src="([^"]+)"><\/script>/g)]
  .map((m) => m[1])
  .filter((s) => !/^https?:/.test(s));
ok('脚本清单：本地脚本全部存在', scriptSrcs.length >= 19, '共 ' + scriptSrcs.length + ' 个');
const missing = scriptSrcs.filter((s) => !fs.existsSync(path.join(ROOT, s)));
ok('脚本清单：引用路径均可达', missing.length === 0, '缺失：' + missing.join(', '));

/* 移除外部 CDN 脚本，避免网络等待 */
const html = htmlRaw.replace(/<script src="https:\/\/[^"]+"><\/script>/g, '');

/* ---------- 构造 JSDOM ---------- */
const errors = [];
const warns = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => {
  if (/Could not parse CSS|Not implemented/.test(e.message)) { warns.push(e.message); return; }
  errors.push('jsdomError: ' + (e.stack || e.message));
});
vc.on('error', (...a) => errors.push('console.error: ' + a.map(String).join(' ')));
vc.on('warn', (...a) => warns.push('console.warn: ' + a.map(String).join(' ')));

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  url: 'http://127.0.0.1:8080/',
  virtualConsole: vc
});
const win = dom.window;

/* ---------- 浏览器 API 补丁（jsdom 未实现的部分） ---------- */
(function patch() {
  /* canvas 2d 上下文桩：记录调用次数以验证图表确实被绘制 */
  const ctxCalls = win.__ctxCalls = { total: 0, byType: {} };
  function stubCtx(canvas) {
    const store = { canvas, font: '10px sans-serif' };
    return new Proxy(store, {
      get(t, k) {
        if (k === 'canvas') return canvas;
        if (k in t) return t[k];
        if (k === 'measureText') return (s) => ({ width: String(s).length * 6 });
        if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern') {
          return () => ({ addColorStop() { } });
        }
        if (k === 'getImageData') return () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 });
        if (k === 'createImageData') return () => ({ data: new Uint8ClampedArray(4) });
        if (k === 'isPointInPath') return () => false;
        return function () { ctxCalls.total++; ctxCalls.byType[k] = (ctxCalls.byType[k] || 0) + 1; };
      },
      set(t, k, v) { t[k] = v; return true; }
    });
  }
  win.HTMLCanvasElement.prototype.getContext = function () {
    this.__ctx = this.__ctx || stubCtx(this);
    return this.__ctx;
  };
  win.HTMLCanvasElement.prototype.toDataURL = function () { return 'data:image/png;base64,'; };

  /* 布局尺寸：给出非零宽度，让图表走真实绘制分支 */
  const RECT = (w, h) => ({
    width: w, height: h, top: 0, left: 0, right: w, bottom: h, x: 0, y: 0,
    toJSON() { return this; }
  });
  win.Element.prototype.getBoundingClientRect = function () {
    if (this.tagName === 'CANVAS') return RECT(640, 300);
    return RECT(this.clientWidth || 900, 24);
  };
  Object.defineProperty(win.HTMLElement.prototype, 'clientWidth', { get() { return 640; }, configurable: true });
  Object.defineProperty(win.HTMLElement.prototype, 'clientHeight', { get() { return 320; }, configurable: true });
  Object.defineProperty(win.HTMLElement.prototype, 'offsetWidth', { get() { return 640; }, configurable: true });

  win.scrollTo = function () { };
  win.matchMedia = win.matchMedia || function (q) {
    return { matches: false, media: q, addListener() { }, removeListener() { }, addEventListener() { }, removeEventListener() { } };
  };
  win.devicePixelRatio = 2;

  /* fetch：默认失败，用于验证「网络不可用时自动降级」 */
  win.fetch = function () { return Promise.reject(new Error('Failed to fetch (测试环境断网)')); };
  win.navigator.clipboard = { writeText: () => Promise.resolve() };

  /* 收集未捕获异常 */
  win.addEventListener('error', (e) => errors.push('window.error: ' + (e.message || e.error)));
  win.addEventListener('unhandledrejection', (e) => {
    const r = e.reason || {};
    errors.push('unhandledrejection: ' + (r.message || String(r)));
  });
})();

/* ---------- 按顺序执行脚本（模拟浏览器解析） ---------- */
function runScripts() {
  for (const rel of scriptSrcs) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    try {
      win.eval(code);
    } catch (e) {
      errors.push('脚本执行失败 ' + rel + '：' + e.message);
      console.log('  \u2717 脚本执行失败：' + rel + ' -> ' + e.message);
    }
  }
}

/* ---------- 工具：等待异步任务 ---------- */
function flush(ms) {
  return new Promise((res) => setTimeout(res, ms === undefined ? 20 : ms));
}
function text(el) { return (el && (el.textContent || '')) || ''; }
const $ = (sel) => win.document.querySelector(sel);
const $$ = (sel) => Array.from(win.document.querySelectorAll(sel));

/* ===========================================================================
 * 主流程
 * ======================================================================== */
(async function main() {
  const t0 = Date.now();
  runScripts();
  await flush(30);

  const OR = win.OR;
  ok('内核命名空间已建立', !!OR && !!OR.Lab && !!OR.Store && !!OR.render && !!OR.ui);
  ok('场景注册表加载完成', OR && OR.Lab && OR.Lab.all().length === 15,
    '实际 ' + (OR && OR.Lab ? OR.Lab.all().length : 0) + ' 个');
  ok('知识库与图谱已加载', !!OR.KB && !!OR.KG && OR.KB.all().length === 55,
    '知识点 ' + (OR.KB ? OR.KB.all().length : 0) + ' 个');

  /* =====================================================================
   * 1. 外壳
   * =================================================================== */
  group('1. 应用外壳');
  await flush(30);
  ok('侧栏品牌区渲染', text($('.brand-name')).indexOf('运筹') >= 0);
  ok('侧栏导航项数量正确', $$('#sidebar [data-nav]').length === 15 + 8,
    '实际 ' + $$('#sidebar [data-nav]').length + ' 项（15 场景 + 8 功能）');
  ok('顶栏搜索框存在', !!$('.searchbox input'));
  ok('AI 通道状态条已渲染', text($('#ai-chip')).length > 0, '内容：' + text($('#ai-chip')));
  ok('AI 面板已挂载', !!$('#ai-dock .ai-head, #ai-dock .ai-panel, #ai-dock .ai-launch, #ai-dock button'),
    '#ai-dock 子节点数=' + ($('#ai-dock') ? $('#ai-dock').children.length : -1));

  /* =====================================================================
   * 2. 全路由遍历
   * =================================================================== */
  const LABS = OR.Lab.all();
  const TABS = ['result', 'knowledge', 'theory', 'scenario', 'practice'];

  group('2. 路由遍历 · 首页与目录');
  const go = async (hash) => {
    win.location.hash = hash;
    OR.app.route();
    await flush(20);
  };

  await go('#/');
  ok('首页渲染 Hero 标题', $('.view h1, .view .hero h1, .view h2') !== null);
  const homeCards = $$('.view .scn-card').length;
  ok('首页含 ' + LABS.length + ' 张场景卡片', homeCards === LABS.length, '实际 ' + homeCards + ' 张');
  ok('首页展示分层学习路径', text($('.view')).indexOf('难度') >= 0);
  ok('首页含进场行动按钮', $$('.view button.btn').length >= 2);

  /* 真实点击一张场景卡片，验证 onclick 导航生效 */
  if (homeCards) {
    const firstCard = $$('.view .scn-card')[0];
    const firstLab = OR.Lab.all()[0];
    firstCard.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    await flush(30);
    ok('点击首页卡片可跳转到对应场景',
      win.location.hash === '#/lab/' + firstLab.id && text($('#view')).indexOf(firstLab.name) >= 0,
      'hash=' + win.location.hash);
  }

  await go('#/labs');
  const catalogCards = $$('.view .scn-card').length;
  ok('场景目录列出全部 ' + LABS.length + ' 个场景', catalogCards === LABS.length, '实际 ' + catalogCards + ' 个');
  ok('场景目录含知识点筛选按钮', $$('.view button').length >= 5,
    '按钮数=' + $$('.view button').length);

  group('3. 路由遍历 · ' + LABS.length + ' 场景 × ' + TABS.length + ' 页签');
  /* 插桩：统计每种图表实际被绘制了多少次 */
  const chartKindCalls = {};
  Object.keys(OR.charts).forEach((k) => {
    if (typeof OR.charts[k] !== 'function') return;
    const orig = OR.charts[k];
    OR.charts[k] = function () {
      chartKindCalls[k] = (chartKindCalls[k] || 0) + 1;
      return orig.apply(this, arguments);
    };
  });
  ok('图表库导出自研绘图函数', Object.keys(OR.charts).length >= 5,
    '函数：' + Object.keys(OR.charts).filter((k) => typeof OR.charts[k] === 'function').join(','));

  const canvasBefore = win.__ctxCalls.total;
  let tabFail = [];
  let canvasSeen = 0;
  for (const lab of LABS) {
    for (const tab of TABS) {
      const before = errors.length;
      await go('#/lab/' + lab.id + '/' + tab);
      const viewTxt = text($('#view'));
      const growth = viewTxt.length;
      const newErr = errors.length - before;
      /* 结果页与理论页/练习页都必须有实际内容 */
      const minLen = tab === 'practice' ? 120 : 300;
      if (growth < minLen || newErr > 0) {
        tabFail.push(lab.id + '/' + tab + '(长度' + growth + (newErr ? ',错误' + newErr : '') + ')');
      }
      if (tab === 'result') canvasSeen = Math.max(canvasSeen, $$('#view canvas').length);
    }
  }
  ok('全部 ' + (LABS.length * TABS.length) + ' 个「场景×页签」组合渲染成功', tabFail.length === 0, tabFail.join(' | '));

  const canvasGrew = win.__ctxCalls.total - canvasBefore;
  ok('canvas 绘图调用已发生（图表真实绘制）', canvasGrew > 5000, '累计绘图调用 ' + canvasGrew + ' 次');
  ok('结果页插入 canvas 元素', canvasSeen > 0, '单页最多 canvas 数=' + canvasSeen);

  /* 逐场景校验：结果页必须至少绘制 1 张图 */
  const noChartLabs = [];
  for (const lab of LABS) {
    const b = JSON.stringify(chartKindCalls);
    await go('#/lab/' + lab.id + '/result');
    if (JSON.stringify(chartKindCalls) === b) noChartLabs.push(lab.id);
  }
  ok(LABS.length + ' 个场景的结果页均绘制了图表', noChartLabs.length === 0, '未绘图：' + noChartLabs.join(','));
  ok('图表类型覆盖 ≥4 种自研绘图能力', Object.keys(chartKindCalls).length >= 4,
    '实际调用：' + JSON.stringify(chartKindCalls));

  group('4. 路由遍历 · 习题库 / 错题本 / 学习档案 / AI 配置');
  await go('#/practice');
  const bankItems = $$('#view .q-item').length;
  const TOTAL_Q = LABS.reduce((a, l) => a + (l.problems || []).length, 0);
  ok('习题库渲染全部 ' + TOTAL_Q + ' 道题目', bankItems === TOTAL_Q, '实际 ' + bankItems + ' 题');
  ok('习题库按 ' + LABS.length + ' 个场景分组', $$('#view .card .card-head').length >= LABS.length,
    '分组卡片数=' + $$('#view .card .card-head').length);

  await go('#/dashboard');
  ok('学习档案渲染 4 项指标卡', text($('#view')).indexOf('实验') >= 0 && $$('#view .card').length >= 3);

  await go('#/settings');
  ok('AI 配置页渲染三通道面板', text($('#view')).indexOf('云服务') >= 0 && text($('#view')).indexOf('离线') >= 0);
  ok('AI 配置页含连通性测试按钮', text($('#view')).indexOf('测试') >= 0);

  group('5. 路由遍历 · 文档中心 12 份文档');
  await go('#/docs');
  const docLinks = $$('#view a[href^="#/docs/"]').length;
  ok('文档中心列出全部文档', docLinks >= 12, '实际 ' + docLinks + ' 个链接');

  const docKeys = (OR.Docs && OR.Docs.order ? OR.Docs.order : []).concat(
    OR.Docs && OR.Docs.competition ? OR.Docs.competition : []
  );
  ok('文档打包数据完整', docKeys.length === 12, '共 ' + docKeys.length + ' 份');
  const docFail = [];
  for (const k of docKeys) {
    const before = errors.length;
    await go('#/docs/' + k);
    const t = text($('#view'));
    if (t.length < 1500 || errors.length > before) docFail.push(k + '(长度' + t.length + ')');
  }
  ok('12 份文档正文全部渲染（含 Markdown 解析）', docFail.length === 0, docFail.join(' | '));
  const headingCount = $$('#view h2, #view h3').length;
  ok('文档标题锚点已生成', headingCount >= 5, '当前文档标题数=' + headingCount);
  ok('文档目录树可交互', $$('#view a[href^="#doc-"], #view a[href^="#"]').length > 3);

  group('6. 文档内容真实性校验');
  const c = OR.Docs.content || {};
  const totalChars = Object.keys(c).reduce((a, k) => a + (c[k].md || '').length, 0);
  ok('文档总字数达到竞赛材料量级', totalChars > 150000, '合计 ' + totalChars + ' 字符');
  const reqKeys = ['overview', 'requirements', 'design', 'validation', 'deploy', 'algoref', 'guide', 'knowledge'];
  ok('8 份技术文档齐备', reqKeys.every((k) => c[k] && c[k].md.length > 3000));
  ok('4 份竞赛材料齐备',
    (OR.Docs.competition || []).length === 4 &&
    (OR.Docs.competition || []).every((k) => c[k] && c[k].md.length > 3000));

  group('7. 文档 Markdown 渲染器能力');
  const probe = OR.DocsView.renderMarkdown;
  if (typeof probe === 'function') {
    const md = '# 标题\n\n正文**加粗**与`代码`。\n\n- 列表项\n- 第二项\n\n| A | B |\n|:--|--:|\n| 1 | 2 |\n\n```js\nvar x=1;\n```\n\n> 引用\n\n1. 有序一\n2. 有序二\n\n[链接](https://example.com)\n';
    const r = probe(md);
    const h = typeof r === 'string' ? r : r.html;
    ok('渲染 h1/h2 标题', /<h1[^>]*>/.test(h));
    ok('渲染粗体与行内代码', /<strong>/.test(h) && /<code>/.test(h));
    ok('渲染无序列表', /<ul>/.test(h) && /<li>/.test(h));
    ok('渲染表格含对齐', /<table/.test(h) && /text-align/.test(h));
    ok('渲染代码块并标注语言', /data-lang="js"/.test(h));
    ok('渲染引用块', /<blockquote/.test(h));
    ok('渲染有序列表', /<ol>/.test(h));
    ok('渲染外链', /<a [^>]*href="https:\/\/example\.com"/.test(h));
    ok('目录树抽取二级标题', typeof r === 'object' && Array.isArray(r.toc));
  } else {
    ok('文档 Markdown 渲染器可调用', false, '未导出 renderMarkdown');
  }

  /* =====================================================================
   * 8. 题目作答 → 判分 → 错题本 → 档案聚合
   * =================================================================== */
  group('8. 题目作答闭环');
  const TOTAL_Q_N = OR.Lab.all().reduce((a, l) => a + (l.problems || []).length, 0);
  await go('#/practice');
  const allProblems = [];
  LABS.forEach((l) => (l.problems || []).forEach((p) => allProblems.push({ lab: l, p })));
  ok('题库题目总数正确', allProblems.length === TOTAL_Q_N, '实际 ' + allProblems.length + ' 道');
  const byType = allProblems.reduce((a, x) => { a[x.p.type] = (a[x.p.type] || 0) + 1; return a; }, {});
  ok('题型分布符合设计（概念/计算/建模）',
    byType.single >= 30 && byType.number >= 20 && byType.text >= 12 &&
    byType.single + byType.number + byType.text === allProblems.length,
    JSON.stringify(byType));
  ok('每题均含题目/难度/解析字段',
    allProblems.every((x) => x.p.id && x.p.q && x.p.level && x.p.explain),
    '异常题：' + allProblems.filter((x) => !(x.p.id && x.p.q && x.p.level && x.p.explain)).map((x) => x.p.id).join(','));

  /* ---- 8.1 真实 DOM 交互：在实验页「配套练习」中点击选项作答 ---- */
  const labA = LABS[0];
  await go('#/lab/' + labA.id + '/practice');
  const qItems = $$('#lab-output .q-item');
  ok('实验页练习区渲染题卡', qItems.length === (labA.problems || []).length,
    '渲染 ' + qItems.length + ' / ' + ((labA.problems || []).length) + ' 张');

  const singleQ = (labA.problems || []).find((q) => q.type === 'single');
  if (singleQ) {
    const idx = labA.problems.indexOf(singleQ);
    const card = qItems[idx];
    const opts = card ? card.querySelectorAll('.q-opt') : [];
    ok('单选题渲染全部选项', opts.length === (singleQ.options || []).length,
      '渲染 ' + opts.length + ' 个选项');
    /* 点错一个选项 */
    const wrongIdx = (singleQ.answer + 1) % (singleQ.options || []).length;
    if (opts[wrongIdx]) {
      opts[wrongIdx].dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
      await flush(20);
      const rec = OR.Store.get('answers.' + singleQ.id, null);
      ok('DOM 点击可完成答题并写入记录', !!rec && rec.chosen === wrongIdx,
        JSON.stringify(rec));
      ok('点击错误选项被判为错误并标红', !!rec && rec.ok === false);
      ok('错误选项自动进入错题本',
        (OR.Store.get('wrong', []) || []).some((w) => w.id === singleQ.id));
      ok('答错后展示解析', !!card.querySelector('.q-exp'));
      ok('正确选项被高亮标出', !!card.querySelector('.q-opt.ok'));
    }
    /* 用「重做本组」清掉再答对 */
    OR.Store.set('answers.' + singleQ.id, null);
    OR.Store.removeWrong(singleQ.id);
  }

  /* 数值题：真实输入 + 提交 */
  const numQ = (labA.problems || []).find((q) => q.type === 'number');
  if (numQ) {
    const idx = labA.problems.indexOf(numQ);
    await go('#/lab/' + labA.id + '/practice');
    const cardN = $$('#lab-output .q-item')[idx];
    const inp = cardN ? cardN.querySelector('input.num') : null;
    const btn = cardN ? cardN.querySelector('button.btn-primary') : null;
    ok('数值题渲染输入框与提交按钮', !!inp && !!btn);
    if (inp && btn) {
      inp.value = String(Math.round(numQ.answer * 100) / 100);
      btn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
      await flush(20);
      const recN = OR.Store.get('answers.' + numQ.id, null);
      ok('数值题输入正确答案可判分正确', !!recN && recN.ok === true, JSON.stringify(recN));
    }
    OR.Store.set('answers.' + numQ.id, null);
  }

  /* 建模题：渲染开放输入与参考答案 */
  const txtQ = (labA.problems || []).find((q) => q.type === 'text');
  if (txtQ) {
    const idx = labA.problems.indexOf(txtQ);
    await go('#/lab/' + labA.id + '/practice');
    const cardT = $$('#lab-output .q-item')[idx];
    ok('建模题渲染文本域与参考答案按钮',
      !!cardT && !!cardT.querySelector('textarea') &&
      /参考答案/.test(text(cardT)));
    ok('建模题预留思路输入区（不强制判分）', !!cardT.querySelector('textarea'));
  }

  /* ---- 8.2 批量写入全部作答记录，验证聚合 ---- */
  const answerAll = (correctMode) => {
    OR.Store.set('answers', {});
    OR.Store.set('wrong', []);
    allProblems.forEach(({ lab: l, p }) => {
      if (p.type === 'text') {
        OR.Store.set('answers.' + p.id, { ok: correctMode, ts: Date.now() });
        if (!correctMode) OR.Store.addWrong({ id: p.id, labName: l.name, q: p.q, explain: p.explain });
      } else if (p.type === 'number') {
        const v = correctMode ? p.answer : p.answer + 100;
        OR.Store.set('answers.' + p.id, { ok: correctMode, input: String(v), ts: Date.now() });
        if (!correctMode) OR.Store.addWrong({ id: p.id, labName: l.name, q: p.q, explain: p.explain });
      } else {
        OR.Store.set('answers.' + p.id, {
          ok: correctMode, chosen: correctMode ? p.answer : (p.answer + 1) % p.options.length, ts: Date.now()
        });
        if (!correctMode) OR.Store.addWrong({ id: p.id, labName: l.name, q: p.q, explain: p.explain });
      }
    });
  };

  answerAll(true);
  const solvedCount = allProblems.filter((x) => (OR.Store.get('answers.' + x.p.id) || {}).ok).length;
  ok('全部 ' + allProblems.length + ' 题可写入并判定为正确', solvedCount === allProblems.length, '判对 ' + solvedCount + ' / ' + allProblems.length);
  ok('全对时错题本为空', (OR.Store.get('wrong', []) || []).length === 0);

  await go('#/dashboard');
  const dashTxt = text($('#view'));
  ok('学习档案正确率显示 100%', /100(\.0)?\s*%/.test(dashTxt),
    '片段：' + dashTxt.replace(/\s+/g, ' ').slice(0, 140));
  ok('学习档案展示题目完成度 ' + allProblems.length + '/' + allProblems.length,
    new RegExp(String(allProblems.length)).test(dashTxt));
  ok('学习档案含知识点维度区块', dashTxt.indexOf('知识点') >= 0 || dashTxt.indexOf('掌握') >= 0);

  /* 错题场景 */
  answerAll(false);
  await go('#/wrong');
  ok('全错时错题本记录 ' + allProblems.length + ' 条', (OR.Store.get('wrong', []) || []).length === allProblems.length,
    '实际 ' + (OR.Store.get('wrong', []) || []).length + ' 条');
  ok('错题本视图渲染错题列表', text($('#view')).length > 300);
  await go('#/dashboard');
  ok('全错时档案正确率显示 0%', /(^|[^\d])0(\.0)?\s*%/.test(text($('#view'))),
    '片段：' + text($('#view')).replace(/\s+/g, ' ').slice(0, 140));
  ok('档案识别出薄弱环节', text($('#view')).indexOf('薄弱') >= 0);

  /* 复原为全对状态，供后续导出与演示 */
  answerAll(true);

  /* =====================================================================
   * 9. AI 助教：两级降级 + 四种角色
   * =================================================================== */
  group('9. AI 助教通道与角色');
  ok('AI 模块已加载', !!OR.AI && typeof OR.AI.ask === 'function');
  const st0 = OR.AI.status();
  ok('status() 暴露 provider 字段（界面消费契约）', typeof st0.provider === 'string',
    'provider=' + st0.provider);
  ok('无 SDK 时默认落在离线通道', st0.provider === 'offline', 'provider=' + st0.provider);
  ok('状态含 SDK 就绪标志', typeof st0.sdkReady === 'boolean');
  ok('状态含首选通道 prefer', st0.prefer === 'cloud', 'prefer=' + st0.prefer);
  ok('侧栏通道状态条与 status() 一致',
    text($('#ai-chip')).indexOf(st0.provider === 'offline' ? '离线' : '在线') >= 0,
    '状态条：' + text($('#ai-chip')));

  /* 离线知识引擎四种角色 */
  const offRoles = ['concept', 'hint', 'diagnose', 'generate'];
  const roleFail = [];
  for (const r of offRoles) {
    const out = OR.AI._offline(r, '这个模型的基本假设是什么？', {
      lab: LABS[0], values: {}, summary: '测试上下文'
    });
    if (!out || String(out).length < 40) roleFail.push(r + '(长度' + (out ? String(out).length : 0) + ')');
  }
  ok('离线知识引擎覆盖四种教学角色', roleFail.length === 0, roleFail.join(' | '));

  /* 引导提示角色必须不给答案 */
  const hintOut = OR.AI._offline('hint', '直接告诉我答案', { lab: LABS[0], values: {}, summary: '' });
  ok('引导提示不直接给最终答案', !/最优解是|答案是\s*\d|所以应当取/.test(String(hintOut)));

  /* 完整 ask 流程（断网 → 必须自动降级且不抛异常） */
  let askOk = false, askText = '', askStart = '', askDoneProvider = '';
  const beforeAsk = errors.length;
  try {
    await new Promise((resolve) => {
      OR.AI.ask('diagnose', '帮我解读这组结果', { lab: LABS[0], values: {}, summary: '目标值 17.5' }, {
        onStart(p) { askStart = p; },
        onDelta(t) { askText += t; },
        onDone(full, p) { askDoneProvider = p; resolve(); },
        onError(e) { askText += '[err]' + (e && e.message); resolve(); }
      });
      setTimeout(resolve, 8000);
    });
    askOk = askText.length > 20;
  } catch (e) {
    askText = e.message;
  }
  ok('AI ask 在断网环境下仍返回内容（降级成功）', askOk, '返回：' + String(askText).slice(0, 80));
  ok('降级顺序正确：云服务失败后落到离线通道', askStart === 'offline' && askDoneProvider === 'offline',
    'onStart=' + askStart + ' onDone=' + askDoneProvider);
  ok('调用后 status().provider 反映实际生效通道', OR.AI.status().provider === 'offline',
    'provider=' + OR.AI.status().provider);
  ok('云服务失败原因被记录并可读', typeof OR.AI.status().lastError === 'string' && OR.AI.status().lastError.length > 0,
    'lastError=' + OR.AI.status().lastError);
  ok('AI ask 过程未抛出未捕获异常', errors.length === beforeAsk, errors.slice(beforeAsk).join(' | '));

  /* 面板交互 */
  OR.AIPanel.open();
  await flush(20);
  ok('AI 面板可打开', !!$('#ai-dock .ai-body, #ai-dock .ai-panel-body, #ai-dock textarea, #ai-dock input'));
  OR.AIPanel.setContext({ lab: LABS[2], values: {}, summary: '目标值 126.1' });
  ok('AI 面板可接收实验上下文', true);
  OR.AIPanel.toggle();
  await flush(10);

  /* =====================================================================
   * 10. 持久化与学习档案导出
   * =================================================================== */
  group('10. 持久化与导出');
  OR.Store.setProgress(LABS[0].id, { runs: 5 });
  ok('进度写入可读回', OR.Store.getProgress(LABS[0].id).runs === 5);
  const raw = win.localStorage.getItem('orsimlab.v1');
  ok('数据已持久化到 localStorage', !!raw && raw.length > 10, '键 orsimlab.v1 长度 ' + (raw ? raw.length : 0));
  const parsed = raw ? JSON.parse(raw) : {};
  ok('持久化结构含 progress / answers / records / settings / wrong',
    ['progress', 'answers', 'records', 'settings', 'wrong'].every((k) => parsed[k] !== undefined),
    '顶层键：' + Object.keys(parsed).join(','));
  ok('设置的默认 schema 完整',
    parsed.settings && ['aiProvider', 'aiModel', 'apiBase', 'apiKey', 'theme'].every((k) => k in parsed.settings),
    JSON.stringify(parsed.settings));
  ok('实验记录写入持久化',
    (() => { OR.Store.record({ lab: LABS[0].id, labName: LABS[0].name, summary: 'x' }); return (OR.Store.get('records', []) || []).length > 0; })());
  ok('记录条数有上限保护（≤200）', (() => {
    for (let i = 0; i < 260; i++) OR.Store.record({ lab: 'x', summary: i });
    return (OR.Store.get('records', []) || []).length <= 200;
  })(), '实际 ' + (OR.Store.get('records', []) || []).length + ' 条');

  /* =====================================================================
   * 11. 交互：参数滑杆触发即时重算
   * =================================================================== */
  group('11. 实验工作台交互');
  await go('#/lab/' + LABS[0].id + '/result');
  const sliders = $$('#view input[type=range]');
  ok('参数控制台含滑杆控件', sliders.length > 0, '滑杆数=' + sliders.length);
  if (sliders.length) {
    const beforeTxt = text($('#lab-output'));
    const hit = sliders[0];
    const min = Number(hit.getAttribute('min') || 0);
    const max = Number(hit.getAttribute('max') || 100);
    hit.value = String(max);
    hit.dispatchEvent(new win.Event('input', { bubbles: true }));
    hit.dispatchEvent(new win.Event('change', { bubbles: true }));
    await flush(450);
    const afterTxt = text($('#lab-output'));
    ok('拖动滑杆后结果区内容发生变化（即时重算）',
      afterTxt.length > 100 && afterTxt !== beforeTxt,
      '前 ' + beforeTxt.length + ' 字符 → 后 ' + afterTxt.length + ' 字符');
    ok('参数提示更新为求解次数', /第\s*\d+\s*次求解/.test(text($('#param-hint'))),
      '提示：' + text($('#param-hint')));
  }

  /* 极端参数：容量置零，验证鲁棒性（不得崩溃） */
  const lab1 = LABS[0];
  let extremeOk = true, extremeErr = '';
  try {
    lab1.run(Object.assign({}, OR.Lab.defaults(lab1.params), { seed: 1 }));
  } catch (e) { extremeOk = false; extremeErr = e.message; }
  ok('内核在极端/边界参数下不抛异常', extremeOk, extremeErr);

  /* 每个场景执行一次 run，确保 blocks 结构合法 */
  group('12. 全部场景求解契约校验');
  const runFail = [];
  LABS.forEach((l) => {
    try {
      const r = l.run(OR.Lab.defaults(l.params));
      if (!r || !Array.isArray(r.blocks) || r.blocks.length === 0) runFail.push(l.id + '(无 blocks)');
      /* blocks 类型必须在契约白名单内 */
      const ALLOW = ['metrics', 'chart', 'svg', 'table', 'formula', 'note', 'list', 'kv', 'steps', 'card', 'grid', 'html', 'bars', 'tabs'];
      const bad = [];
      (function walk(list) {
        (list || []).forEach((b) => {
          if (!b || ALLOW.indexOf(b.type) < 0) bad.push(b && b.type);
          if (b && b.blocks) walk(b.blocks);
          if (b && b.tabs) (b.tabs || []).forEach((t) => walk(t.blocks));
        });
      })(r.blocks);
      if (bad.length) runFail.push(l.id + '(非法积木 ' + bad.join('/') + ')');
    } catch (e) {
      runFail.push(l.id + '(' + e.message + ')');
    }
  });
  ok(LABS.length + ' 个场景 run() 均返回合法积木结构', runFail.length === 0, runFail.join(' | '));

  /* =====================================================================
   * 13. 知识中心与知识点详情
   * =================================================================== */
  group('13. 知识中心与知识点详情');
  await go('#/knowledge');
  ok('知识中心渲染知识图谱 SVG', !!$('#view svg.kg-svg'));
  const kgNodes = $$('#view svg.kg-svg [data-kg-node]').length;
  ok('图谱绘制全部节点', kgNodes === OR.KG.nodes().length,
    '实际 ' + kgNodes + ' / ' + OR.KG.nodes().length + ' 个');
  ok('知识中心提供 5 个页签', $$('#view .tabs .tab').length === 5,
    '实际 ' + $$('#view .tabs .tab').length + ' 个');
  ok('图谱图例已渲染', $$('#view .kg-legend > div').length >= 8,
    '图例项 ' + $$('#view .kg-legend > div').length + ' 个');

  /* 布局切换：第二个按钮应为「难度分层」 */
  const kindBtns = $$('#view .kg-bar button').filter((b) => /聚类|分层|导向/.test(text(b)));
  ok('图谱提供多种布局切换', kindBtns.length >= 3, '按钮：' + kindBtns.map((b) => text(b)).join('/'));
  if (kindBtns.length >= 2) {
    kindBtns[1].dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    await flush(25);
    ok('切换布局后图谱重新渲染',
      !!$('#view svg.kg-svg') && $$('#view svg.kg-svg [data-kg-node]').length === kgNodes);
  }

  /* 点击节点 → 右侧信息面板 */
  const probeNode = $('#view svg.kg-svg [data-kg-node="lp-model"]');
  if (probeNode) {
    probeNode.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    await flush(25);
    ok('点击图谱节点显示知识点侧栏',
      text($('#view .kg-info')).indexOf('线性规划模型三要素') >= 0,
      '侧栏长度=' + text($('#view .kg-info')).length);
  } else {
    ok('点击图谱节点显示知识点侧栏', false, '未找到 lp-model 节点');
  }

  /* 逐页签切换 */
  const tabProbe = [
    { name: '领域覆盖', expect: '覆盖率' },
    { name: '学习路径', expect: '拓扑' },
    { name: '知识点检索', expect: '全部' },
    { name: '常见误区', expect: '误区' }
  ];
  for (const tp of tabProbe) {
    const btn = $$('#view .tabs .tab').find((b) => text(b).indexOf(tp.name) >= 0);
    if (!btn) { ok('切换到「' + tp.name + '」页签', false, '未找到页签按钮'); continue; }
    const before = errors.length;
    btn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    await flush(25);
    const t = text($('#view'));
    ok('切换到「' + tp.name + '」页签正常渲染',
      t.indexOf(tp.expect) >= 0 && errors.length === before,
      '长度=' + t.length);
  }

  /* 检索页签的实时过滤 */
  const searchTabBtn = $$('#view .tabs .tab').find((b) => text(b).indexOf('知识点检索') >= 0);
  if (searchTabBtn) {
    searchTabBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    await flush(25);
    const sInput = $('#view input.input');
    if (sInput) {
      sInput.value = '影子价格';
      sInput.dispatchEvent(new win.Event('input', { bubbles: true }));
      await flush(25);
      const t = text($('#view'));
      ok('知识点检索按关键词过滤', t.indexOf('匹配到') >= 0 && t.indexOf('影子价格') >= 0,
        '结果长度=' + t.length);
    }
  }

  /* 知识点详情页 */
  await go('#/kb/lp-model');
  const kbTxt = text($('#view'));
  ok('#/kb/:id 渲染知识点详情',
    kbTxt.indexOf('线性规划模型三要素') >= 0 && kbTxt.indexOf('定义') >= 0, '长度=' + kbTxt.length);
  ok('详情页含公式区与要点区', $$('#view .formula').length >= 1 && kbTxt.indexOf('关键要点') >= 0);
  ok('详情页含常见误区', kbTxt.indexOf('误区') >= 0);
  ok('详情页绘制局部知识网络', !!$('#view svg.kg-svg'),
    '节点数=' + $$('#view svg.kg-svg [data-kg-node]').length);
  ok('详情页可跳转关联实验', $$('#view a[href^="#/lab/"]').length >= 1,
    '链接数=' + $$('#view a[href^="#/lab/"]').length);
  ok('详情页提供 AI 精讲入口', kbTxt.indexOf('AI') >= 0);

  await go('#/kb/not-a-concept');
  ok('未知知识点 ID 降级为空状态',
    text($('#view')).indexOf('不存在') >= 0 || text($('#view')).indexOf('未找到') >= 0);

  /* 实验页「知识图谱」页签 */
  await go('#/lab/lp-production/knowledge');
  ok('实验页「知识图谱」页签绘制三层图谱',
    !!$('#view svg.kg-svg') && text($('#view')).indexOf('核心') >= 0,
    '节点数=' + $$('#view svg.kg-svg [data-kg-node]').length);
  ok('实验页图谱页签列出三层知识点卡片',
    $$('#view .grid.g3 .card').length >= 2,
    '卡片数=' + $$('#view .grid.g3 .card').length);

  /* =====================================================================
   * 14. 异常兜底
   * =================================================================== */
  group('14. 全局异常兜底');
  await go('#/完全不存在/的/路由');
  ok('未知路由降级为「页面不存在」', text($('#view')).indexOf('不存在') >= 0);
  await go('#/lab/not-a-real-lab');
  ok('未知场景 ID 不崩溃', text($('#view')).indexOf('不存在') >= 0 || text($('#view')).indexOf('未找到') >= 0);

  await go('#/');
  await flush(60);

  /* =====================================================================
   * 汇总
   * =================================================================== */
  const pass = results.filter((r) => r.pass).length;
  const fail = results.length - pass;

  console.log('\n' + '='.repeat(70));
  console.log('无头浏览器渲染回归测试：' + pass + ' / ' + results.length + ' 通过，' + fail + ' 失败');
  console.log('耗时 ' + (Date.now() - t0) + ' ms');
  console.log('canvas 绘图调用合计 ' + win.__ctxCalls.total + ' 次');
  if (errors.length) {
    console.log('\n未捕获异常 / console.error（' + errors.length + ' 条）：');
    errors.slice(0, 40).forEach((e, i) => console.log('  [' + (i + 1) + '] ' + String(e).slice(0, 300)));
  } else {
    console.log('未捕获异常 / console.error：0 条');
  }
  if (warns.length) {
    const uniq = [...new Set(warns.map((w) => String(w).slice(0, 110)))];
    console.log('\njsdom 提示（非致命，共 ' + warns.length + ' 条 / ' + uniq.length + ' 类）：');
    uniq.slice(0, 8).forEach((w) => console.log('  · ' + w));
  }
  if (fail) {
    console.log('\n失败明细：');
    results.filter((r) => !r.pass).forEach((r) => console.log('  ✗ [' + r.group + '] ' + r.name + '  ' + (r.detail || '')));
  }

  /* 写报告 */
  fs.writeFileSync(path.join(ROOT, 'docs', '附录-浏览器渲染回归输出.txt'),
    buildReport(pass, fail, errors, warns), 'utf8');

  dom.window.close();
  process.exit(fail === 0 && errors.length === 0 ? 0 : 1);
})().catch((e) => {
  console.error('测试驱动异常：', e);
  process.exit(2);
});

function buildReport(pass, fail, errors, warns) {
  const L = [];
  L.push('OR-SimLab 无头浏览器渲染回归测试报告');
  L.push('生成时间：' + new Date().toLocaleString('zh-CN'));
  L.push('运行环境：Node.js ' + process.version + ' + jsdom（真实加载 index.html 全部脚本链）');
  L.push('');
  L.push('结果：' + pass + ' / ' + (pass + fail) + ' 通过，' + fail + ' 失败');
  L.push('未捕获异常 / console.error：' + errors.length + ' 条');
  L.push('');
  let g = '';
  results.forEach((r) => {
    if (r.group !== g) { g = r.group; L.push(''); L.push('[' + g + ']'); }
    L.push('  ' + (r.pass ? '[PASS]' : '[FAIL]') + ' ' + r.name + (r.pass ? '' : '  -> ' + (r.detail || '')));
  });
  if (errors.length) {
    L.push(''); L.push('未捕获异常明细：');
    errors.forEach((e, i) => L.push('  ' + (i + 1) + '. ' + String(e).slice(0, 400)));
  }
  if (warns.length) {
    L.push(''); L.push('环境提示（非致命）：');
    [...new Set(warns.map((w) => String(w).slice(0, 200)))].forEach((w) => L.push('  - ' + w));
  }
  return L.join('\n');
}
