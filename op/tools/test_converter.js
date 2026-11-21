/* 转换接口自动化测试（Node，无浏览器依赖）
 * 运行：node tools/test_converter.js
 * 覆盖：16 列 xlsx 读取 → 统一数据 → 16/15 列反向生成 → 逐格往返比对 → 硬约束校验
 * 输出：docs/05_转换接口测试记录.md
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const XLSX = require(path.join(ROOT, 'assets', 'vendor', 'xlsx.full.min.js'));
const results = [];
function check(name, ok, detail) { results.push({ name, ok: !!ok, detail: String(detail || '') }); }

// 构造与浏览器一致的沙箱环境
const sandbox = {
  console, XLSX, JSON, Date, String, Object, Array, Number, Set, Math,
  TextDecoder, TextEncoder, setTimeout, clearTimeout
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
function load(rel) { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sandbox, { filename: rel }); }
load('data/course-kg.js');
load('data/chaoxing/template-notes.js');
load('io/js/converter.js');
const C = sandbox.KGConverter;
const D = sandbox.COURSE_KG;

// ---------- 1. 基础校验 ----------
const v = C.validate(D);
check('当前基础数据通过全部硬约束', v.passed, `${v.checks.length} 项检查，${v.warnings.length} 条警告`);
check('硬约束检查项数量为 11', v.checks.length === 11, `${v.checks.length} 项`);
check('loadUnified 可载入统一 JSON', C.loadUnified(JSON.stringify(D)).nodes.length === 186);

// ---------- 2. 正向：统一数据 → 16 / 15 列 ----------
const t16 = C.toChaoxing16(D);
const t15 = C.toChaoxing15(D);
check('toChaoxing16 表头与行数', t16.header.length === 16 && t16.rows.length === 186,
  `${t16.header.length} 列 / ${t16.rows.length} 行`);
check('toChaoxing16 使用模板第 1/2 行原文', t16.note.length > 100 && t16.header[15] === '应用能力');
check('toChaoxing15 表头与行数', t15.header.length === 14 && t15.rows.length === 186,
  `${t15.header.length} 列 / ${t15.rows.length} 行`);
check('toChaoxing15 明确列出有损字段', t15.lostFields.length >= 3, t15.lostFields.join('、'));
check('15 列类型回写为「分类」', t15.rows[0][0] === '分类' && t15.rows[4][0] === '知识点');

// 与 Python 生成的示例 CSV 逐格比对
const csv16 = XLSX.read(fs.readFileSync(path.join(ROOT, 'data/chaoxing/示例_超星16列导出.csv'), 'utf8'), { type: 'string' });
const rows16 = XLSX.utils.sheet_to_json(csv16.Sheets[csv16.SheetNames[0]], { header: 1, defval: '', raw: false }).slice(1);
let diff16 = 0;
for (let i = 0; i < 186; i++) {
  for (let j = 0; j < 16; j++) {
    if (String(t16.rows[i][j]) !== String(rows16[i][j] == null ? '' : rows16[i][j])) diff16++;
  }
}
check('JS 接口 16 列输出与 Python 示例 CSV 逐格一致（186×16）', diff16 === 0, `${diff16} 处差异`);

// ---------- 3. 反向：16 列 xlsx → 统一数据 ----------
const buf = fs.readFileSync(path.join(ROOT, 'data/chaoxing/示例_超星16列导入.xlsx'));
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const input = C.readWorkbook(ab);
check('readWorkbook 识别为超星新版 16 列', input.format === 'chaoxing16', `format=${input.format}, sheet=${input.sheet}`);
check('readWorkbook 定位表头行并抽取 186 行', input.headerRow === 1 && input.rows.length === 186,
  `headerRow=${input.headerRow}, rows=${input.rows.length}`);
const parsed = C.parseRows(input.rows, input.format);
check('parseRows 节点数 = 186', parsed.nodes.length === 186, `${parsed.nodes.length}`);
check('parseRows 关系数 = 320', parsed.edges.length === 320, `${parsed.edges.length}`);
check('16 列导入无未解析引用', parsed.unresolvedReferences.length === 0,
  `${parsed.unresolvedReferences.length} 条`);
check('16 列导入无警告', parsed.warnings.length === 0, `${parsed.warnings.length} 条`);
const U = C.toUnified(parsed, { course: '运筹学', primarySource: '示例_超星16列导入.xlsx' });
check('导入生成的统一数据通过硬约束', C.validate(U).passed, JSON.stringify(C.validate(U).checks.filter(c => !c.passed)));

// ---------- 4. 无损往返 ----------
const back = C.toChaoxing16(U);
let diffBack = 0;
for (let i = 0; i < 186; i++) {
  for (let j = 0; j < 16; j++) {
    if (String(back.rows[i][j]) !== String(rows16[i][j] == null ? '' : rows16[i][j])) diffBack++;
  }
}
check('16 列 xlsx → 统一数据 → 16 列 无损往返（186×16）', diffBack === 0, `${diffBack} 处差异`);

// ---------- 5. 15 列旧版解析（有损但可转换） ----------
const srcBuf = fs.readFileSync(path.join(ROOT, 'data/source/01-知识图谱-运筹学-7章全部.xlsx'));
const srcAb = srcBuf.buffer.slice(srcBuf.byteOffset, srcBuf.byteOffset + srcBuf.byteLength);
const inp15 = C.readWorkbook(srcAb);
check('readWorkbook 识别为超星旧版 15 列', inp15.format === 'chaoxing15', `format=${inp15.format}`);
const p15 = C.parseRows(inp15.rows, inp15.format);
check('15 列解析节点数 = 186', p15.nodes.length === 186, `${p15.nodes.length}`);
check('15 列解析检出空引用并给出警告', p15.unresolvedReferences.length > 0 && p15.warnings.length > 0,
  `空引用 ${p15.unresolvedReferences.length} 条 / 警告 ${p15.warnings.length} 条`);
check('15 列转换保留标签与知识点分类', p15.nodes.some(n => n.tags.length > 0) && p15.nodes.some(n => !!n.category));
const U15 = C.toUnified(p15, { course: '运筹学' });
check('15 列 → 16 列转换可用', C.toChaoxing16(U15).rows.length === 186);

// ---------- 报告 ----------
const passed = results.filter(r => r.ok).length;
const lines = ['# 转换接口自动化测试记录', '',
  '> 运行命令：`node tools/test_converter.js` ｜ 环境：Node + 本地 SheetJS，无浏览器依赖', '',
  `**结果：${passed}/${results.length} 项通过**`, '',
  '| # | 测试项 | 结果 | 说明 |', '| --- | --- | --- | --- |'];
results.forEach((r, i) => lines.push(`| ${i + 1} | ${r.name} | ${r.ok ? '✅ 通过' : '❌ 未通过'} | ${r.detail.replace(/\|/g, '/')} |`));
lines.push('', '> 说明：15 列旧版解析必然出现空引用与有损字段（这正是转换接口要暴露的信息），因此该项以「检出并给出警告」为通过条件。', '');
fs.writeFileSync(path.join(ROOT, 'docs/05_转换接口测试记录.md'), lines.join('\n'), 'utf8');
results.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? '  | ' + r.detail : '')));
console.log(`\n${passed}/${results.length} 项通过 -> docs/05_转换接口测试记录.md`);
process.exit(passed === results.length ? 0 : 1);
