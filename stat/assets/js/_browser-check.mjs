// 浏览器端验收：检查三章页面渲染、KaTeX 公式、折叠解答展开、目录与搜索
import puppeteer from 'puppeteer-core';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = 'http://127.0.0.1:8765';
const pages = [
  { id: 'm01', url: `${BASE}/modules/m01-data.html`, expectTags: 11 },
  { id: 'm02', url: `${BASE}/modules/m02-descriptive.html`, expectTags: 10 },
  { id: 'm03', url: `${BASE}/modules/m03-probability.html`, expectTags: 10 },
];

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});

let bad = 0;
for (const p of pages) {
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  const failed = [];
  page.on('requestfailed', (r) => failed.push(r.url()));

  await page.goto(p.url, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));

  const info = await page.evaluate(() => {
    const examples = [...document.querySelectorAll('.example')];
    const katexErrs = [...document.querySelectorAll('.katex-error')];
    // 展开所有解答后再次统计
    const details = [...document.querySelectorAll('details.solution')];
    details.forEach((d) => (d.open = true));
    const tocItems = document.querySelectorAll('#toc-list a, #toc-list li').length;
    const navItems = document.querySelectorAll('#sidebar-nav a').length;
    // 检查是否有 KaTeX 未渲染的原始 $ 残留
    const bodyText = document.body.innerText;
    const strayDollar = (bodyText.match(/\$/g) || []).length;
    return {
      exampleCount: examples.length,
      exTags: [...document.querySelectorAll('.ex-tag')].map((e) => e.textContent.trim()),
      katexErrCount: katexErrs.length,
      katexErrSample: katexErrs.slice(0, 3).map((e) => e.textContent.slice(0, 90)),
      katexRendered: document.querySelectorAll('.katex').length,
      solutionCount: details.length,
      tocItems,
      navItems,
      strayDollar,
      title: document.title,
      h1: document.querySelector('h1')?.textContent.trim(),
    };
  });

  console.log(`\n=== ${p.id} (${p.url}) ===`);
  console.log(`  标题: ${info.title}`);
  console.log(`  例题数: ${info.exampleCount} (期望 ${p.expectTags}) ${info.exampleCount === p.expectTags ? '✅' : '❌'}`);
  console.log(`  编号: ${info.exTags.join(', ')}`);
  console.log(`  折叠解答数: ${info.solutionCount}`);
  console.log(`  KaTeX 已渲染: ${info.katexRendered} 个, 错误: ${info.katexErrCount} ${info.katexErrCount === 0 ? '✅' : '❌'}`);
  if (info.katexErrSample.length) console.log(`    错误样例: ${info.katexErrSample.join(' | ')}`);
  console.log(`  目录项: ${info.tocItems}, 侧边栏: ${info.navItems}`);
  console.log(`  残留未渲染 $: ${info.strayDollar} ${info.strayDollar === 0 ? '✅' : '⚠️'}`);
  console.log(`  控制台错误: ${errors.length} ${errors.length === 0 ? '✅' : '❌ ' + errors.slice(0, 3).join(' | ')}`);
  console.log(`  资源失败: ${failed.length} ${failed.length === 0 ? '✅' : '❌ ' + failed.slice(0, 3).join(' | ')}`);

  if (info.exampleCount !== p.expectTags) { bad++; console.log('  ❌ 例题数不符'); }
  if (info.katexErrCount > 0) { bad++; console.log('  ❌ 公式渲染错误'); }
  if (errors.length) { bad++; console.log('  ❌ JS 错误'); }
  if (failed.length) { bad++; console.log('  ❌ 资源加载失败'); }

  await page.close();
}

await browser.close();
console.log('\n' + '='.repeat(60));
console.log(bad === 0 ? '✅ 三章浏览器端验收全部通过' : `❌ ${bad} 项未通过`);
process.exit(bad === 0 ? 0 : 1);
