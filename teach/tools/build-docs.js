/* 构建脚本:将 docs/*.md 生成为 js/project-docs.js(供站点在线查看)
   用法: node tools/build-docs.js
   说明:使用 JSON.stringify 输出,自动规避反引号 / ${ } / 引号等转义问题。*/
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const docsDir = path.join(root, 'docs');
const outFile = path.join(root, 'js', 'project-docs.js');

/* 已知文档的图标与标题美化(可按需扩展) */
const META = {
  '01': { icon:'📋', title:'需求分析' },
  '02': { icon:'🏗️', title:'系统设计' },
  '03': { icon:'🗂️', title:'课程群与权限设计' },
  '04': { icon:'👩‍🏫', title:'教师端重构方案' },
  '05': { icon:'🧭', title:'系统完善方案' },
  '06': { icon:'📥', title:'导入导出模板规范' }
};

const files = fs.readdirSync(docsDir).filter(f => /\.md$/i.test(f)).sort();
const docs = files.map(f => {
  const num = (f.match(/^(\d+)/) || [,''])[1];
  const raw = fs.readFileSync(path.join(docsDir, f), 'utf8');
  const h1 = (raw.match(/^#\s+(.+)$/m) || [,''])[1].trim();
  const meta = META[num] || {};
  return {
    id: num || f.replace(/\.md$/i,''),
    file: f,
    title: meta.title || h1 || f.replace(/\.md$/i,''),
    heading: h1 || f,
    icon: meta.icon || '📄',
    md: raw
  };
});

const banner = `/* 项目文档数据 — 由 tools/build-docs.js 从 docs/*.md 自动生成,请勿手工修改 */

`;
const body = 'const PROJECT_DOCS = ' + JSON.stringify(docs, null, 2) + ';\n' +
             'if (typeof module !== "undefined" && module.exports) module.exports = { PROJECT_DOCS };\n';

fs.writeFileSync(outFile, banner + body, 'utf8');
console.log('已生成 ' + path.relative(root, outFile) + ' — 共 ' + docs.length + ' 篇:');
docs.forEach(d => console.log('  · [' + d.id + '] ' + d.title + ' (' + d.file + ', ' + d.md.length + ' 字符)'));
