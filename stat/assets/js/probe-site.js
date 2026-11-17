/* CDP 探针：逐页加载站点，捕获 JS 异常、控制台错误、渲染结果与死链。
   用法: node probe-site.js [baseUrl] */
const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = process.argv[2] || "http://localhost:8765";
const IS_FILE = BASE.startsWith("file:");
const PORT = 9400 + Math.floor(Math.random() * 200);
const PROFILE = path.join("C:\\Temp", "edge-cdp-" + PORT);

// 自动发现全站页面（排除 vendor 与隐藏目录），避免新增阶段页/章节后漏测
const ROOT = path.resolve(__dirname, "..", "..");
function collectPages(dir, out) {
  for (const e of require("fs").readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "vendor" || e.name === "fragments" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) collectPages(p, out);
    else if (e.name.endsWith(".html")) out.push(path.relative(ROOT, p).replace(/\\/g, "/"));
  }
  return out;
}
const PAGES = collectPages(ROOT, []).sort();

function httpJSON(p) {
  return new Promise((res, rej) => {
    http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
      let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } });
    }).on("error", rej);
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.events = []; this.handlers = []; }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = (e) => rej(new Error("ws error")); });
    const c = new CDP(ws);
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && c.pending.has(m.id)) { c.pending.get(m.id)(m); c.pending.delete(m.id); }
      else if (m.method) { c.events.push(m); c.handlers.forEach((h) => h(m)); }
    };
    return c;
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, (m) => (m.error ? rej(new Error(method + ": " + m.error.message)) : res(m.result)));
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  on(fn) { this.handlers.push(fn); }
}

(async () => {
  const chrome = spawn(EDGE, [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
    "--disable-features=msEdgeSidebarV2",
    "--remote-debugging-port=" + PORT, "--user-data-dir=" + PROFILE, "about:blank",
  ], { stdio: "ignore" });

  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { await httpJSON("/json/version"); ready = true; break; } catch (e) { await sleep(250); }
  }
  if (!ready) { console.log("EDGE 启动失败"); chrome.kill(); process.exit(1); }

  const targets = await httpJSON("/json/list");
  const pageTarget = targets.find((t) => t.type === "page");
  const cdp = await CDP.connect(pageTarget.webSocketDebuggerUrl);

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");
  await cdp.send("Network.enable");

  const consoleMsgs = [];
  const exceptions = [];
  const failedReqs = [];
  cdp.on((m) => {
    if (m.method === "Runtime.exceptionThrown") {
      const d = m.params.exceptionDetails;
      exceptions.push((d.exception && (d.exception.description || d.exception.value)) || d.text);
    } else if (m.method === "Runtime.consoleAPICalled" && (m.params.type === "error" || m.params.type === "warning")) {
      consoleMsgs.push(m.params.type + ": " + m.params.args.map((a) => a.value ?? a.description ?? a.type).join(" "));
    } else if (m.method === "Log.entryAdded" && m.params.entry.level === "error") {
      consoleMsgs.push("log: " + m.params.entry.text + " " + (m.params.entry.url || ""));
    } else if (m.method === "Network.loadingFailed") {
      // 页面切换时未加载完的字体/图片会被主动取消，属正常现象，不计为失败
      if (!/ERR_ABORTED/.test(m.params.errorText || ""))
        failedReqs.push(m.params.errorText + " " + (m.params.type || ""));
    } else if (m.method === "Network.responseReceived" && m.params.response.status >= 400) {
      failedReqs.push("HTTP " + m.params.response.status + " " + m.params.response.url);
    }
  });

  const report = [];

  for (const rel of PAGES) {
    consoleMsgs.length = 0; exceptions.length = 0; failedReqs.length = 0;
    const url = BASE + "/" + rel;
    await cdp.send("Page.navigate", { url });
    await sleep(1400);

    const probe = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const r = {};
        r.title = document.title;
        r.mainText = (document.querySelector('.content')||document.querySelector('main')||document.body).innerText.replace(/\\s+/g,' ').trim();
        r.mainTextLen = r.mainText.length;
        r.bodyHeight = document.body.scrollHeight;
        r.contentVisible = (() => {
          const el = document.querySelector('.content') || document.querySelector('main');
          if (!el) return false;
          const cs = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0 && rect.height > 50;
        })();
        r.katexNodes = document.querySelectorAll('.katex').length;
        r.katexErrors = document.querySelectorAll('.katex-error').length;
        r.sidebarItems = document.querySelectorAll('#sidebar-nav .nav-item').length;
        r.tocItems = document.querySelectorAll('#toc-list a').length;
        r.anchors = document.querySelectorAll('.anchor-flag').length;
        r.h2 = document.querySelectorAll('.content h2, main h2').length;
        r.h3 = document.querySelectorAll('.content h3, main h3').length;
        r.examples = document.querySelectorAll('.example').length;
        r.solutions = document.querySelectorAll('details.solution').length;
        r.tables = document.querySelectorAll('.table-wrap table').length;
        r.emptySections = Array.from(document.querySelectorAll('.content section, main section')).filter(s=>s.innerText.trim().length < 30).length;
        r.libraryCards = document.querySelectorAll('#lib-list .res-card').length;
        r.libraryCount = (document.querySelector('#lib-count')||{}).innerText || '';
        r.timelineNodes = document.querySelectorAll('#tl-list .tl-item').length;
        r.timelineCount = (document.querySelector('#tl-count')||{}).innerText || '';
        r.links = Array.from(document.querySelectorAll('a[href]')).map(a=>a.getAttribute('href')).filter(h=>h && !h.startsWith('http') && !h.startsWith('#') && !h.startsWith('mailto'));
        r.btnCount = document.querySelectorAll('a.btn, button.btn').length;
        r.moduleNav = document.querySelectorAll('.module-nav a').length;
        // v3 教材级学习闭环组件
        r.figures = document.querySelectorAll('figure').length;
        r.figCaptions = document.querySelectorAll('figcaption').length;
        r.figureSvg = document.querySelectorAll('figure svg').length;
        r.classicNotes = document.querySelectorAll('.classic-figure, [data-classic-note]').length;
        r.quizItems = document.querySelectorAll('.quiz-item[data-answer]').length;
        r.codeLabs = document.querySelectorAll('.code-lab').length;
        r.runOutputs = document.querySelectorAll('.run-output').length;
        r.specTables = document.querySelectorAll('.spec-table').length;
        r.compareTables = document.querySelectorAll('.compare-table').length;
        r.keyResults = document.querySelectorAll('.key-result').length;
        r.stepSolve = document.querySelectorAll('.step-solve').length;
        r.breakthroughs = document.querySelectorAll('.breakthrough').length;
        r.coreQ = document.querySelectorAll('.core-q li').length;
        r.chapterPos = document.querySelectorAll('.chapter-position').length;
        r.loopNav = document.querySelectorAll('.loop-nav a').length;
        return JSON.stringify(r);
      })()`,
      returnByValue: true,
    });

    const d = JSON.parse(probe.result.value);
    report.push({ rel, d, exceptions: [...exceptions], consoleMsgs: [...consoleMsgs], failedReqs: [...failedReqs] });

    const flag = d.mainTextLen > 200 && d.contentVisible ? "OK " : "!! ";
    const extra = (d.libraryCards || d.timelineNodes)
      ? ` 资源卡=${d.libraryCards} 时间线节点=${d.timelineNodes}` : "";
    const v3 = d.chapterPos
      ? ` 闭环[定位${d.chapterPos} 核心问题${d.coreQ} 图${d.figures}/SVG${d.figureSvg} 自测${d.quizItems} 代码${d.codeLabs} 规格${d.specTables} 突破${d.breakthroughs}]` : "";
    console.log(`[${flag}] ${rel}  文本=${d.mainTextLen}高=${d.bodyHeight}可见=${d.contentVisible} katex=${d.katexNodes}(err:${d.katexErrors}) 侧栏=${d.sidebarItems} 目录=${d.tocItems} 例题=${d.examples} 解答=${d.solutions} 空节=${d.emptySections}${extra}${v3}`);
    if (exceptions.length) console.log("      异常:", exceptions.map((e) => String(e).split("\n")[0]).join(" || "));
    if (consoleMsgs.length) console.log("      控制台:", consoleMsgs.slice(0, 4).join(" || "));
    if (failedReqs.length) console.log("      请求失败:", failedReqs.slice(0, 4).join(" || "));
  }

  // 站内链接可达性检查（基于 index 的链接集合 + 每个页面收集到的）
  console.log("\n=== 站内链接可达性 ===");
  const allLinks = new Map();
  for (const r of report) for (const l of r.d.links) {
    if (!allLinks.has(l)) allLinks.set(l, []);
    allLinks.get(l).push(r.rel);
  }
  const bad = [];
  if (IS_FILE) {
    console.log("  file:// 模式：跳过 HTTP fetch 检查（路径正确性由 validate-site.py / audit-links.py 覆盖）");
  } else {
  for (const [l, froms] of allLinks) {
    // 相对链接需相对于「其来源页面」解析，而非固定基准
    const srcRel = froms[0];
    const srcAbs = new URL(BASE + "/" + srcRel).href;
    try {
      const u = new URL(l, srcAbs);
      const resp = await fetch(u.href, { method: "GET" });
      if (!resp.ok) bad.push({ l, froms, status: resp.status, u: u.href });
    } catch (e) { bad.push({ l, froms, status: "ERR " + e.message }); }
  }
  if (bad.length) { for (const b of bad) console.log(`  死链 ${b.l} (${b.status})  来源: ${b.froms.slice(0, 3).join(", ")}`); }
  else console.log("  全部站内链接可访问 ✅");
  }

  // ---------- v2 交互实测：筛选 / URL 参数 / 搜索 / 上下篇 ----------
  console.log("\n=== 交互实测 ===");
  const checks = [];
  const evalJS = async (expression) => {
    const r = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
  };
  const go = async (rel) => { await cdp.send("Page.navigate", { url: BASE + "/" + rel }); await sleep(1300); };
  const check = (name, ok, detail) => {
    checks.push({ name, ok, detail });
    console.log(`  [${ok ? "OK" : "!!"}] ${name} — ${detail}`);
  };

  try {
    await go("resources.html");
    const total = await evalJS("document.querySelectorAll('#lib-list .res-card').length");
    check("资源库渲染", total === 168, `${total} 张资源卡（期望 168）`);

    const paper = await evalJS(`(() => {
      const chip = document.querySelector('#lib-types [data-type="paper"]');
      if (!chip) return -1;
      chip.click();
      return document.querySelectorAll('#lib-list .res-card').length;
    })()`);
    check("类型筛选（论文）", paper > 0 && paper < total, `${total} → ${paper} 张`);

    await go("resources.html?stage=s6");
    const stage6 = await evalJS("document.querySelectorAll('#lib-list .res-card').length");
    const stageSel = await evalJS("(document.querySelector('#lib-stage')||{}).value || ''");
    check("URL 参数预置筛选", stageSel === "s6" && stage6 > 0 && stage6 < total,
      `#lib-stage=${stageSel}，${stage6} 张`);

    await go("timeline.html");
    const tlAll = await evalJS("document.querySelectorAll('#tl-list .tl-item').length");
    check("时间线渲染", tlAll === 39, `${tlAll} 个节点（期望 39）`);
    const tlS1 = await evalJS(`(() => {
      const sel = document.querySelector('#tl-stage');
      if (!sel) return -1;
      sel.value = 's1'; sel.dispatchEvent(new Event('change'));
      return document.querySelectorAll('#tl-list .tl-item').length;
    })()`);
    check("时间线阶段筛选", tlS1 > 0 && tlS1 < tlAll, `${tlAll} → ${tlS1} 个节点`);

    await go("index.html");
    const idxLen = await evalJS("(window.SEARCH_INDEX||[]).length");
    const hit = await evalJS(`(() => {
      const btn = document.querySelector('[data-search-open]'); if (btn) btn.click();
      const inp = document.querySelector('#search-input');
      if (!inp) return -1;
      inp.value = 'Transformer'; inp.dispatchEvent(new Event('input'));
      return document.querySelectorAll('#search-results .search-item').length;
    })()`);
    check("全站搜索（含学习闭环子条目）", idxLen >= 194 && hit > 0,
      `索引 ${idxLen} 条（基础 194 + 学习闭环），命中 ${hit} 条`);

    // ---------- v3 教材级学习闭环交互实测 ----------
    await go("modules/m15-genai-systems.html");
    const v3 = await evalJS(`(() => {
      const q = (s) => document.querySelectorAll(s).length;
      return {
        pos: q('.chapter-position'), coreQ: q('.core-q li'), loopNav: q('.loop-nav a'),
        figures: q('figure'), captions: q('figcaption'), svg: q('figure svg'),
        quizzes: q('.quiz-item[data-answer]'), codeLabs: q('.code-lab'),
        outputs: q('.run-output'), specs: q('.spec-table'), compares: q('.compare-table'),
        keys: q('.key-result'), steps: q('.step-solve'), fronts: q('.breakthrough'),
        copyBtns: q('.code-lab .copy-btn'), loopLinks: q('.loop-nav a[href^="#"]')
      };
    })()`);
    check("学习闭环骨架齐全",
      v3.pos === 1 && v3.coreQ >= 4 && v3.loopNav >= 7 && v3.loopLinks >= 7,
      `定位${v3.pos} 核心问题${v3.coreQ} 闭环导航${v3.loopNav}`);
    check("图示与图题离线内联",
      v3.figures >= 4 && v3.captions === v3.figures && v3.svg >= 3,
      `${v3.figures} 图 / ${v3.captions} 图题 / ${v3.svg} 内联 SVG`);
    check("算法与代码实验组件",
      v3.codeLabs >= 1 && v3.outputs >= 1 && v3.specs >= 1 && v3.compares >= 1 &&
      v3.keys >= 2 && v3.steps >= 1,
      `代码${v3.codeLabs} 输出${v3.outputs} 规格${v3.specs} 对比${v3.compares} 关键结论${v3.keys} 手算${v3.steps}`);
    check("最新理论突破五栏", v3.fronts >= 1,
      `${v3.fronts} 个突破条目（背景/思想/结论/影响/局限）`);
    check("代码复制按钮注入", v3.copyBtns >= 1, `${v3.copyBtns} 个复制按钮`);

    const quiz = await evalJS(`(() => {
      const box = document.querySelector('.self-test[data-quiz]');
      if (!box) return { ok: false, why: 'no quiz' };
      box.querySelectorAll('.quiz-item[data-answer]').forEach((item, i) => {
        const want = item.getAttribute('data-answer');
        const radio = item.querySelector('input[value="' + want + '"]');
        if (radio) radio.checked = true;
      });
      box.querySelector('[data-quiz-submit]').click();
      const score = box.querySelector('.st-score').textContent;
      const shown = box.querySelectorAll('.quiz-feedback.show.correct').length;
      return { ok: shown >= 4 && /得分/.test(score), score, shown };
    })()`);
    check("自测题判分与解析展开", quiz.ok,
      `${quiz.score || '无得分'}，展开正确解析 ${quiz.shown || 0} 条`);

    const learnSearch = await evalJS(`(() => {
      const btn = document.querySelector('[data-search-open]'); if (btn) btn.click();
      const inp = document.querySelector('#search-input');
      if (!inp) return -1;
      inp.value = 'ELBO'; inp.dispatchEvent(new Event('input'));
      return document.querySelectorAll('#search-results .search-item').length;
    })()`);
    check("学习闭环子条目可检索", learnSearch > 0, `关键词「ELBO」命中 ${learnSearch} 条`);

    await go("modules/m01-data.html");
    const navNext = await evalJS(`(() => {
      const a = document.querySelector('.module-nav a.next');
      return a ? a.getAttribute('href') : '';
    })()`);
    check("六阶段连续导航", navNext === "m02-descriptive.html", `m01 下一篇 → ${navNext}`);
  } catch (e) {
    check("交互实测执行", false, e.message);
  }

  // ---------- 汇总 ----------
  const white = report.filter(r => !(r.d.mainTextLen > 200 && r.d.contentVisible));
  const jsErr = report.filter(r => r.exceptions.length);
  const reqErr = report.filter(r => r.failedReqs.length);
  const katexErr = report.filter(r => r.d.katexErrors > 0);
  console.log("\n=== 汇总 ===");
  console.log(`  页面 ${report.length} 个 | 白页 ${white.length} | JS 异常 ${jsErr.length} | 请求失败 ${reqErr.length} | KaTeX 错误 ${katexErr.length}`);
  console.log(`  交互检查 ${checks.filter(c => c.ok).length}/${checks.length} 通过`);
  if (white.length) console.log("  白页:", white.map(r => r.rel).join(", "));
  if (jsErr.length) console.log("  JS 异常页:", jsErr.map(r => r.rel).join(", "));

  require("fs").writeFileSync(path.join(__dirname, "cdp-report.json"),
    JSON.stringify({ report, checks, summary: {
      pages: report.length, white: white.map(r => r.rel), jsErr: jsErr.map(r => r.rel),
      reqErr: reqErr.map(r => r.rel), katexErr: katexErr.map(r => r.rel),
      checksPassed: checks.filter(c => c.ok).length, checksTotal: checks.length
    } }, null, 2));
  chrome.kill();
  process.exit(white.length || jsErr.length || reqErr.length || bad.length ||
    katexErr.length || checks.some(c => !c.ok) ? 1 : 0);
})().catch((e) => { console.error("探针失败:", e.message); process.exit(1); });
