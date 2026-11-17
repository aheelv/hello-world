/* 点击导航测试：像用户一样在浏览器中点击链接，检测跳转后是否白页/404。
   用法: node test-clicks.js [baseUrl] */
const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = process.argv[2] || "http://localhost:8765";
const PORT = 9800 + Math.floor(Math.random() * 150);
const PROFILE = path.join("C:\\Temp", "edge-click-" + PORT);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function httpJSON(p) {
  return new Promise((res, rej) => {
    http.get({ host: "127.0.0.1", port: PORT, path: p }, (r) => {
      let d = ""; r.on("data", (c) => (d += c));
      r.on("end", () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } });
    }).on("error", rej);
  });
}
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = []; }
  static async connect(u) {
    const ws = new WebSocket(u);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error("ws")); });
    const c = new CDP(ws);
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && c.pending.has(m.id)) { c.pending.get(m.id)(m); c.pending.delete(m.id); }
      else if (m.method) c.handlers.forEach((h) => h(m));
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
  on(f) { this.handlers.push(f); }
}

(async () => {
  const chrome = spawn(EDGE, ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
    "--remote-debugging-port=" + PORT, "--user-data-dir=" + PROFILE, "about:blank"], { stdio: "ignore" });
  let ready = false;
  for (let i = 0; i < 60; i++) { try { await httpJSON("/json/version"); ready = true; break; } catch (e) { await sleep(250); } }
  if (!ready) { console.log("EDGE FAIL"); chrome.kill(); process.exit(1); }
  const t = await httpJSON("/json/list");
  const cdp = await CDP.connect(t.find((x) => x.type === "page").webSocketDebuggerUrl);
  await cdp.send("Page.enable"); await cdp.send("Runtime.enable");

  // 收集所有站内链接并逐一真实点击
  const errors = [];
  cdp.on((m) => {
    if (m.method === "Runtime.exceptionThrown") {
      const d = m.params.exceptionDetails;
      errors.push(String((d.exception && (d.exception.description || d.exception.value)) || d.text).split("\n")[0]);
    }
  });

  await cdp.send("Page.navigate", { url: BASE + "/index.html" });
  await sleep(1600);

  const linksRes = await cdp.send("Runtime.evaluate", {
    expression: `JSON.stringify(Array.from(document.querySelectorAll('a[href]'))
      .map((a,i)=>({i, href:a.getAttribute('href'), text:(a.innerText||'').trim().slice(0,28)}))
      .filter(x=>x.href && !x.href.startsWith('http') && !x.href.startsWith('#') && !x.href.startsWith('mailto') && !x.href.startsWith('javascript')))`,
    returnByValue: true,
  });
  const links = JSON.parse(linksRes.result.value);
  console.log(`首页共发现 ${links.length} 个站内链接，开始逐个真实点击测试…\n`);

  const results = [];
  for (const l of links) {
    errors.length = 0;
    // 回到首页再点击
    await cdp.send("Page.navigate", { url: BASE + "/index.html" });
    await sleep(700);
    const click = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const a = document.querySelectorAll('a[href]')[${l.i}];
        if (!a) return JSON.stringify({err:'no el'});
        const t = a.innerText.trim().slice(0,20);
        a.click();
        return JSON.stringify({t});
      })()`,
      returnByValue: true,
    });
    await sleep(1100);
    const probe = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const el = document.querySelector('.content') || document.querySelector('main') || document.body;
        const txt = (el ? el.innerText : '').replace(/\\s+/g,' ').trim();
        return JSON.stringify({
          url: location.href, title: document.title, len: txt.length,
          h: document.body ? document.body.scrollHeight : 0,
          bodyText: document.body ? document.body.innerText.replace(/\\s+/g,' ').trim().length : 0,
          katex: document.querySelectorAll('.katex').length
        });
      })()`,
      returnByValue: true,
    });
    const d = JSON.parse(probe.result.value);
    const blank = d.len < 200 || d.h < 200;
    results.push({ l, d, blank, errors: [...errors] });
    console.log(`${blank ? "❌ 白页" : "✅ 正常"}  ${l.text.padEnd(20)} -> ${d.url.replace(BASE, "")}  文本=${d.len} 高=${d.h}`);
    if (blank) console.log(`      bodyText=${d.bodyText} title="${d.title}"`);
    if (errors.length) console.log(`      JS异常: ${errors[0]}`);
  }

  const blanks = results.filter((r) => r.blank);
  console.log(`\n=== 结果: ${results.length - blanks.length}/${results.length} 正常，${blanks.length} 个白页 ===`);
  if (blanks.length) for (const b of blanks) console.log(`  白页: "${b.l.text}" -> ${b.d.url} (text=${b.d.len}, h=${b.d.h})`);

  require("fs").writeFileSync(path.join(__dirname, "click-report.json"), JSON.stringify(results, null, 2));
  chrome.kill();
  process.exit(blanks.length ? 2 : 0);
})().catch((e) => { console.error("FAIL", e.message); process.exit(1); });
