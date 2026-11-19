/* =============================================================================
 * docs/*.md → assets/js/docs/content.js
 * -----------------------------------------------------------------------------
 * 把 Markdown 文档打包为 JS 模块，使文档中心在 file:// 协议与断网环境下也可用。
 *   node tools/build-docs.js
 * ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'docs');
const OUT_DIR = path.join(ROOT, 'assets', 'js', 'docs');
const OUT_FILE = path.join(OUT_DIR, 'content.js');

/* 文档顺序、路由 key 与导航标题 */
const MANIFEST = [
  { key: 'overview', title: '项目总览', file: '00-项目总览.md', icon: 'home' },
  { key: 'requirements', title: '需求分析', file: '01-需求分析.md', icon: 'doc' },
  { key: 'design', title: '系统设计', file: '02-系统设计.md', icon: 'layers' },
  { key: 'validation', title: '实验验证', file: '03-实验验证.md', icon: 'check2' },
  { key: 'deploy', title: '部署方案', file: '04-部署方案.md', icon: 'cpu' },
  { key: 'algoref', title: '算法参考', file: '05-算法与公式参考.md', icon: 'book' },
  { key: 'guide', title: '使用指南', file: '06-教师与学生使用指南.md', icon: 'pen' },
  { key: 'knowledge', title: '知识图谱与知识库', file: '07-知识图谱与知识库.md', icon: 'layers' }
];

function readDoc(file) {
  const p = path.join(SRC, file);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
}

function main() {
  const docs = {};
  const order = [];
  const missing = [];

  MANIFEST.forEach((m) => {
    const md = readDoc(m.file);
    if (md === null) { missing.push(m.file); return; }
    docs[m.key] = {
      key: m.key,
      title: m.title,
      icon: m.icon,
      file: m.file,
      chars: md.length,
      md: md
    };
    order.push(m.key);
  });

  /* 自动纳入 docs/竞赛 下的材料，作为「竞赛材料」分组 */
  const compDir = path.join(SRC, '竞赛');
  const comps = [];
  if (fs.existsSync(compDir)) {
    fs.readdirSync(compDir).filter((f) => f.endsWith('.md')).sort().forEach((f) => {
      const key = 'comp_' + f.replace(/\.md$/, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]+/g, '_');
      const md = readDoc('竞赛/' + f) || '';
      docs[key] = {
        key: key, title: f.replace(/\.md$/, ''), icon: 'target',
        file: '竞赛/' + f, chars: md.length, md: md
      };
      comps.push(key);
    });
  }

  const banner =
    '/* 由 tools/build-docs.js 自动生成，请勿手工编辑。\n' +
    ' * 源文件：docs/*.md\n' +
    ' * 生成时间：' + new Date().toISOString() + '\n' +
    ' * 文档数：' + (order.length + comps.length) + '\n' +
    ' */\n';

  const body =
    '(function (global) {\n' +
    "  'use strict';\n" +
    '  var OR = global.OR = global.OR || {};\n' +
    '  OR.Docs = OR.Docs || {};\n' +
    '  OR.Docs.content = ' + JSON.stringify(docs, null, 0) + ';\n' +
    '  OR.Docs.order = ' + JSON.stringify(order) + ';\n' +
    '  OR.Docs.competition = ' + JSON.stringify(comps) + ';\n' +
    '})(typeof window !== \'undefined\' ? window : globalThis);\n';

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, banner + body, 'utf8');

  const kb = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
  console.log('已生成 ' + path.relative(ROOT, OUT_FILE).replace(/\\/g, '/') + '（' + kb + ' KB）');
  order.concat(comps).forEach((k) => {
    console.log('  · ' + k.padEnd(16) + docs[k].title + '  (' + docs[k].chars + ' 字符)');
  });
  if (missing.length) {
    console.log('\n提示：以下清单中的文档尚未创建，已跳过：');
    missing.forEach((f) => console.log('  - ' + f));
  }
}

main();
