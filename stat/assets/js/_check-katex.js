// 用本地 KaTeX 校验 3 个章节页面里的所有公式能否渲染
const fs = require('fs');
const path = require('path');
const katex = require('D:/AI/统计分析/assets/vendor/katex/dist/katex.js');

const files = process.argv.slice(2);
let bad = 0, total = 0;

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  // 去掉 <script>/<style> 与 HTML 注释
  let body = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  // 解码 HTML 实体（浏览器里 KaTeX 看到的是解码后的字符）
  body = body.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
  const formulas = [];
  // $$...$$ 显示公式
  let m, re = /\$\$([\s\S]+?)\$\$/g;
  while ((m = re.exec(body)) !== null) formulas.push({ tex: m[1], disp: true });
  // $...$ 行内公式（排除已匹配的 $$）
  body = body.replace(/\$\$[\s\S]+?\$\$/g, (s) => ' '.repeat(s.length));
  re = /(?<!\\)\$([^\n$]+?)(?<!\\)\$/g;
  while ((m = re.exec(body)) !== null) formulas.push({ tex: m[1], disp: false });

  let fileBad = 0;
  for (const { tex, disp } of formulas) {
    total++;
    try {
      katex.renderToString(tex, { displayMode: disp, throwOnError: true, strict: false });
    } catch (e) {
      fileBad++; bad++;
      console.log(`[FAIL] ${path.basename(f)} :: ${e.message.split('\n')[0]}`);
      console.log(`       ${tex.replace(/\n/g, ' ').slice(0, 160)}`);
    }
  }
  console.log(`${path.basename(f)}: ${formulas.length} 个公式, ${fileBad} 个失败`);
}
console.log(`\n总计 ${total} 个公式, ${bad} 个渲染失败`);
process.exit(bad ? 1 : 0);
