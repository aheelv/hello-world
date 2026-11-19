/* UML 图校验器:提取 docs/*.md 中的 mermaid 代码块,用与线上同版本的 mermaid(10.9.1)
   在 jsdom 中真实解析 + 渲染,逐一报告语法错误与渲染异常。
   用法:node tools/validate-uml.mjs
   依赖(隔离安装):C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(__dirname, '..', 'docs');

const WS = process.env.UML_WS || 'C:/Users/Administrator/.workbuddy/binaries/node/workspace';
const req = createRequire(path.join(WS, 'noop.js'));

/* ---------- 1) 先建 jsdom 环境,再导入 mermaid(顺序很关键:DOMPurify 靠 window 自举) ---------- */
const { JSDOM } = await import(pathToFileURL(req.resolve('jsdom')).href);
const dom = new JSDOM('<!DOCTYPE html><body><div id="c"></div></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
try { Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true }); } catch (e) {}
for (const k of ['DOMParser', 'SVGElement', 'Element', 'HTMLElement', 'Node']) globalThis[k] = dom.window[k];
globalThis.getComputedStyle = dom.window.getComputedStyle;
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);

/* jsdom 无排版引擎,补 getBBox 等度量桩,使 dagre/d3 能走完渲染 */
const bbox = () => ({ x: 0, y: 0, width: 120, height: 18, top: 0, left: 0, right: 120, bottom: 18 });
const proto = dom.window.SVGElement.prototype;
proto.getBBox = bbox;
proto.getComputedTextLength = () => 60;
proto.getSubStringLength = () => 60;
proto.getTotalLength = () => 100;
proto.getPointAtLength = () => ({ x: 0, y: 0 });
proto.getScreenCTM = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, inverse() { return this; }, multiply() { return this; } });
dom.window.Element.prototype.getBBox = bbox;

const mermaid = (await import(pathToFileURL(req.resolve('mermaid')).href)).default;
mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', fontFamily: 'system-ui, sans-serif' });

/* ---------- 2) 提取 mermaid 块 ---------- */
const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md')).sort();
const blocks = [];
for (const f of files) {
  const lines = fs.readFileSync(path.join(docsDir, f), 'utf8').split(/\r?\n/);
  let inBlock = false, buf = [], start = 0;
  lines.forEach((ln, i) => {
    if (/^```mermaid/.test(ln)) { inBlock = true; buf = []; start = i + 1; return; }
    if (/^```/.test(ln) && inBlock) { inBlock = false; blocks.push({ file: f, line: start, code: buf.join('\n') }); return; }
    if (inBlock) buf.push(ln);
  });
}

console.log(`共发现 ${blocks.length} 个 mermaid 图,分布于 ${files.length} 篇文档\n`);

/* ---------- 2.5) 静态检查:方括号/管道标签内未加引号的半角括号(最常见的解析失败根因) ---------- */
function lintUnquotedParen(code){
  const hits = [];
  code.split(/\r?\n/).forEach((ln, i) => {
    const trimmed = ln.trim();
    if (trimmed.startsWith('%%')) return;
    // 节点标签: X[文本(说明)] 或 X([文本]) —— 引号内的不算
    const noQuoted = ln.replace(/"[^"]*"/g, '""');
    // 方括号标签内出现半角括号
    const m1 = noQuoted.match(/\[[^\]]*[()][^\]]*\]/);
    if (m1 && !/\[\(|\)\]/.test(m1[0])) hits.push({ line: i + 1, what: '节点标签', snip: m1[0].slice(0, 48) });
    // 管道边标签内出现半角括号
    const m2 = noQuoted.match(/\|[^|]*[()][^|]*\|/);
    if (m2) hits.push({ line: i + 1, what: '边标签', snip: m2[0].slice(0, 48) });
  });
  return hits;
}
let lintWarn = 0;
blocks.forEach(b => {
  const hits = lintUnquotedParen(b.code);
  if (hits.length) {
    lintWarn += hits.length;
    console.log(`⚠ LINT [${b.file}:${b.line + hits[0].line - 1}] 标签内含未转义半角括号(需加双引号包裹):`);
    hits.forEach(h => console.log(`        ${h.what} → ${h.snip}`));
  }
});
if (!lintWarn) console.log('静态检查:未发现未转义的半角括号标签 ✅\n');
else console.log('');

/* ---------- 3) 逐个 parse + render ---------- */
const IGNORE = /getBBox|getComputedTextLength|getScreenCTM is not a function/;
let pass = 0, fail = 0;
const results = [];
for (const [i, b] of blocks.entries()) {
  const head = b.code.trim().split('\n')[0].trim();
  const tag = `[${b.file}:${b.line}] #${i + 1} (${head})`;
  let parseErr = null, renderErr = null, svgLen = 0, nodeCount = 0, edgeCount = 0;
  try { await mermaid.parse(b.code); } catch (e) { parseErr = e.message || String(e); }
  if (!parseErr) {
    try {
      const { svg } = await mermaid.render('uml-' + i, b.code);
      svgLen = (svg || '').length;
      if (!/<svg/.test(svg)) renderErr = 'render 未产出 <svg>';
      else {
        nodeCount = (svg.match(/class="node/g) || []).length;
        edgeCount = (svg.match(/class="edge|class="[^"]*\bedge\b/g) || []).length;
        if (/Syntax error in text|mermaid version/i.test(svg)) renderErr = 'SVG 内含语法错误提示';
      }
    } catch (e) {
      const m = e.message || String(e);
      if (!IGNORE.test(m)) renderErr = m;
      else { renderErr = null; svgLen = -1; } // 仅度量桩缺失,不算语法问题
    }
  }
  if (parseErr || renderErr) {
    fail++;
    console.log(`✗ FAIL ${tag}`);
    if (parseErr) console.log('   解析错误: ' + parseErr.split('\n').slice(0, 6).join('\n   '));
    if (renderErr) console.log('   渲染错误: ' + renderErr.split('\n').slice(0, 4).join('\n   '));
  } else {
    pass++;
    console.log(`✓ PASS ${tag}  svg=${svgLen < 0 ? 'n/a' : svgLen + 'B'} nodes=${nodeCount} edges=${edgeCount}`);
  }
  results.push({ tag, parseErr, renderErr });
}
console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
