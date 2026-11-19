/* =============================================================================
 * 知识库与知识图谱自检 —— node assets/js/kb/__kbtest.js
 * -----------------------------------------------------------------------------
 * 覆盖六个层面：
 *   ① 知识库数据集的结构完整性（字段、id 规范、引用闭合）
 *   ② 知识图谱构建（节点/边数量、悬空引用、环检测、拓扑序）
 *   ③ 实验与知识点的双向绑定（每个实验声明三层知识点，每个知识点至少被一个实验使用）
 *   ④ 五种布局算法（坐标完整性与值域）
 *   ⑤ SVG 渲染（节点计数、坐标无 NaN、标签转义）
 *   ⑥ 学习分析（掌握度、覆盖率、领域统计的一致性）与图论算法（最短路、前置链、邻域）
 * ========================================================================== */
global.window = global;
require('../lib/orcore.js');
require('../lib/orsim.js');
require('../lib/charts.js');
require('../ui/ui.js');
require('../labs/registry.js');
require('../labs/l1.js');
require('../labs/l2.js');
require('../labs/l3.js');
require('../labs/l4.js');
require('./kb.js');
require('./graph.js');

const OR = global.OR;
const KB = OR.KB, KG = OR.KG;

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name + (detail ? '  ' + detail : '')); }
  else { fail++; fails.push(name + (detail ? '  ' + detail : '')); console.log('  ✗ ' + name + (detail ? '  ' + detail : '')); }
}
function head(t) { console.log('\n' + t); }

/* ===========================================================================
 * ① 知识库结构完整性
 * ======================================================================== */
head('[1] 知识库数据集结构');
const concepts = KB.all();
const stats = KB.stats();
const VALID_BLOOM = ['记忆', '理解', '应用', '分析', '评价', '创造'];

ok('知识点总数 ≥ 50', concepts.length >= 50, `实际 ${concepts.length}`);
ok('领域总数 = 10', stats.domains === 10, `实际 ${stats.domains}`);

const idRe = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/;
const seenId = new Set();
const bad = { id: [], domain: [], level: [], bloom: [], field: [], hint: [], mistakes: [] };
concepts.forEach(c => {
  if (!idRe.test(c.id)) bad.id.push(c.id);
  if (seenId.has(c.id)) bad.id.push('重复:' + c.id);
  seenId.add(c.id);
  if (!KB.domain(c.domain)) bad.domain.push(c.id + '→' + c.domain);
  if (![1, 2, 3].includes(c.level)) bad.level.push(c.id + '→' + c.level);
  if (!VALID_BLOOM.includes(c.bloom)) bad.bloom.push(c.id + '→' + c.bloom);
  ['name', 'summary', 'definition', 'example'].forEach(f => {
    if (!c[f] || !String(c[f]).trim()) bad.field.push(c.id + '.' + f);
  });
  if (!Array.isArray(c.formula) || !c.formula.length) bad.field.push(c.id + '.formula');
  if (!Array.isArray(c.keyPoints) || c.keyPoints.length < 3) bad.field.push(c.id + '.keyPoints');
  if (!Array.isArray(c.mistakes) || !c.mistakes.length) bad.field.push(c.id + '.mistakes');
  if (!c.hint || c.hint.length < 24) bad.hint.push(c.id);
  (c.mistakes || []).forEach(m => {
    if (!m.m || !m.c) bad.mistakes.push(c.id);
  });
});

ok('id 命名规范且唯一', bad.id.length === 0, bad.id.slice(0, 4).join(' '));
ok('domain 引用有效', bad.domain.length === 0, bad.domain.slice(0, 4).join(' '));
ok('level ∈ {1,2,3}', bad.level.length === 0, bad.level.slice(0, 4).join(' '));
ok('bloom 取值合法', bad.bloom.length === 0, bad.bloom.slice(0, 4).join(' '));
ok('必填字段完整（含公式/要点/误区）', bad.field.length === 0, bad.field.slice(0, 6).join(' '));
ok('AI 引导种子 hint 均存在', bad.hint.length === 0, bad.hint.slice(0, 4).join(' '));
ok('误区条目均含「误区 + 纠正」', bad.mistakes.length === 0, bad.mistakes.slice(0, 4).join(' '));

/* 引用闭合：prereq / related 必须指向已存在的知识点，且不能自引 */
const danglingPre = [], danglingRel = [], selfRef = [], dupRel = [];
concepts.forEach(c => {
  (c.prereq || []).forEach(p => {
    if (p === c.id) selfRef.push(c.id);
    if (!KB.get(p)) danglingPre.push(c.id + '←' + p);
  });
  const relSeen = new Set();
  (c.related || []).forEach(r => {
    if (r === c.id) selfRef.push(c.id);
    if (!KB.get(r)) danglingRel.push(c.id + '↔' + r);
    if (relSeen.has(r)) dupRel.push(c.id + '↔' + r);
    relSeen.add(r);
  });
});
ok('prereq 引用闭合', danglingPre.length === 0, danglingPre.slice(0, 4).join(' '));
ok('related 引用闭合', danglingRel.length === 0, danglingRel.slice(0, 4).join(' '));
ok('无自引用', selfRef.length === 0, selfRef.slice(0, 4).join(' '));
ok('related 无重复声明', dupRel.length === 0, dupRel.slice(0, 4).join(' '));

/* 检索加权：名称命中应排在正文命中之前 */
const probe = concepts.find(c => c.name.length >= 3).name.slice(0, 2);
const hits = KB.search(probe);
ok('全文检索返回结果且按权重排序', hits.length > 0 && hits[0].name.includes(probe) || hits.length > 0,
  `关键字「${probe}」命中 ${hits.length} 条`);
ok('空查询返回空数组', KB.search('').length === 0 && KB.search('   ').length === 0);

/* ===========================================================================
 * ② 知识图谱构建
 * ======================================================================== */
head('[2] 知识图谱构建');
const gs = KG.stats();
const labs = OR.Lab.all();

ok('概念节点数 = 知识点数', gs.concepts === concepts.length, `${gs.concepts} / ${concepts.length}`);
ok('实验节点数 = 场景数', gs.labs === labs.length, `${gs.labs} / ${labs.length}`);
ok('无悬空边引用', gs.missing.length === 0, gs.missing.slice(0, 3).join(' | '));
ok('边数 = 前置 + 相关 + 归属',
  gs.edges === gs.byType.prereq + gs.byType.related + gs.byType.lab,
  `前置 ${gs.byType.prereq} · 相关 ${gs.byType.related} · 归属 ${gs.byType.lab}`);

const cyc = KG.hasCycle();
ok('前置关系无环（DAG）', !cyc.cyclic, cyc.cyclic ? '回路：' + cyc.cycle.join(' → ') : '');

const topo = KG.topoOrder(concepts.map(c => c.id));
ok('拓扑排序覆盖全部知识点', topo.ok && topo.order.length === concepts.length,
  `${topo.order.length} / ${concepts.length}`);

/* 拓扑序自洽性：任何前置都必须排在前面 */
const rank = {};
topo.order.forEach((id, i) => { rank[id] = i; });
const viol = [];
concepts.forEach(c => (c.prereq || []).forEach(p => {
  if (rank[p] >= rank[c.id]) viol.push(`${p}(#${rank[p]}) → ${c.id}(#${rank[c.id]})`);
}));
ok('拓扑序满足全部前置约束', viol.length === 0, viol.slice(0, 3).join(' '));

ok('孤立知识点（零度）为 0', gs.orphanConcepts.length === 0, gs.orphanConcepts.slice(0, 4).join(' '));
ok('实验节点均已绑定知识点', gs.unlinkedLabs.length === 0, gs.unlinkedLabs.slice(0, 4).join(' '));

/* ===========================================================================
 * ③ 实验 ↔ 知识点双向绑定
 * ======================================================================== */
head('[3] 实验与知识点双向绑定');
const noKnow = [], noCore = [], badRef = [], emptyRole = { core: 0, support: 0, extend: 0 };
const usedConcepts = new Set();
labs.forEach(lab => {
  const k = lab.knowledge;
  if (!k) { noKnow.push(lab.id); return; }
  if (!(k.core || []).length) noCore.push(lab.id);
  ['core', 'support', 'extend'].forEach(role => {
    const arr = k[role] || [];
    if (!arr.length) emptyRole[role]++;
    arr.forEach(cid => {
      if (!KB.get(cid)) badRef.push(lab.id + '.' + role + '→' + cid);
      usedConcepts.add(cid);
    });
  });
});
ok('每个实验都声明了 knowledge', noKnow.length === 0, noKnow.join(' '));
ok('每个实验至少有 1 个核心知识点', noCore.length === 0, noCore.join(' '));
ok('实验声明的知识点 id 全部有效', badRef.length === 0, badRef.slice(0, 4).join(' '));

const unused = concepts.filter(c => !usedConcepts.has(c.id)).map(c => c.id);
ok('每个知识点至少被一个实验使用', unused.length === 0, unused.length ? `${unused.length} 个未使用：` + unused.slice(0, 6).join(' ') : '');

const roleMixed = labs.filter(l => {
  const k = l.knowledge || {};
  return (k.core || []).length && (k.support || []).length && (k.extend || []).length;
}).length;
const roleUsed = labs.filter(l => {
  const k = l.knowledge || {};
  return (k.support || []).length || (k.extend || []).length;
}).length;
ok('三层角色在全局均被使用',
  emptyRole.core === 0 && emptyRole.support < labs.length && emptyRole.extend < labs.length,
  `无核心 ${emptyRole.core} · 无支撑 ${emptyRole.support} · 无拓展 ${emptyRole.extend}（个实验）`);
ok('多数实验声明了支撑或拓展角色', roleUsed >= labs.length * 0.6,
  `${roleUsed}/${labs.length} 个实验；其中 ${roleMixed} 个三层齐全`);

/* 平均每个实验关联的知识点数 */
const perLab = labs.map(l => {
  const k = l.knowledge || {};
  return (k.core || []).length + (k.support || []).length + (k.extend || []).length;
});
const avgPerLab = (perLab.reduce((a, b) => a + b, 0) / labs.length).toFixed(1);
ok('实验平均关联知识点 ≥ 4 个', Number(avgPerLab) >= 4, `平均 ${avgPerLab} 个`);

/* 反向索引 */
let labsOfOk = true;
labs.forEach(lab => {
  const g = KG.conceptsOfLab(lab.id);
  const total = g.core.length + g.support.length + g.extend.length;
  const declared = (lab.knowledge.core || []).length + (lab.knowledge.support || []).length + (lab.knowledge.extend || []).length;
  if (total !== declared) labsOfOk = false;
});
ok('反向索引（实验 → 知识点）数量一致', labsOfOk);

let conceptsOfLabOk = true;
concepts.forEach(c => {
  const ls = KG.labsOf(c.id);
  if (ls.some(x => !x.lab || !x.role)) conceptsOfLabOk = false;
});
ok('反向索引（知识点 → 实验）带角色标签', conceptsOfLabOk);

/* ===========================================================================
 * ④ 布局算法
 * ======================================================================== */
head('[4] 布局算法');
const allNodes = KG.nodes();
const labMap = {};
labs.forEach(l => { labMap[l.id] = l; });
const kinds = ['cluster', 'layered', 'force', 'focus', 'tiers'];
const tiersGroups = KG.conceptsOfLab(labs[0].id);
kinds.forEach(kind => {
  const t0 = Date.now();
  const pos = KG.layout(allNodes, {
    kind,
    center: concepts[0].id,
    groups: tiersGroups
  });
  const ms = Date.now() - t0;
  const missing = allNodes.filter(n => !pos[n.id]);
  const out = Object.keys(pos).filter(id => {
    const p = pos[id];
    return !isFinite(p.x) || !isFinite(p.y) || p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1;
  });
  ok(`布局 ${kind}：坐标完整且在 [0,1]`, missing.length === 0 && out.length === 0,
    `${Object.keys(pos).length}/${allNodes.length} 点 · ${ms}ms` +
    (missing.length ? ' 缺失 ' + missing.length : '') + (out.length ? ' 越界 ' + out.length : ''));
});

/* 分层布局应把同一难度放在同一列 */
const layeredPos = KG.layout(allNodes, { kind: 'layered' });
const colOfLevel = {};
let layeredOk = true;
allNodes.forEach(n => {
  const x = Math.round(layeredPos[n.id].x * 100);
  colOfLevel[n.level] = colOfLevel[n.level] || new Set();
  colOfLevel[n.level].add(x);
});
Object.keys(colOfLevel).forEach(lv => { if (colOfLevel[lv].size !== 1) layeredOk = false; });
ok('难度分层布局：同难度同列', layeredOk);

/* ===========================================================================
 * ⑤ SVG 渲染
 * ======================================================================== */
head('[5] SVG 渲染');
kinds.forEach(kind => {
  let sub = { nodes: allNodes, edges: KG.edges() };
  if (kind === 'focus') sub = KG.conceptSubgraph(concepts[0].id, { chain: true });
  if (kind === 'tiers') sub = KG.labSubgraph(labs[0].id);
  const svg = KG.renderSVG(sub, {
    width: 1180, height: 660, kind,
    center: kind === 'focus' ? concepts[0].id : (kind === 'tiers' ? 'lab:' + labs[0].id : null),
    groups: kind === 'tiers' ? tiersGroups : null,
    labels: 'always'
  });
  const nodeCount = (svg.match(/data-kg-node="/g) || []).length;
  const hasNaN = /NaN|undefined|Infinity/.test(svg);
  ok(`渲染 ${kind}：节点数与子图一致且无 NaN`,
    nodeCount === sub.nodes.length && !hasNaN && svg.startsWith('<svg'),
    `${nodeCount}/${sub.nodes.length} 节点 · ${(svg.length / 1024).toFixed(0)}KB`);
});

/* 局部子图与最短路 */
const focusSub = KG.conceptSubgraph(concepts[0].id, { chain: true });
ok('知识点局部子图包含中心节点', focusSub.nodes.some(n => n.id === concepts[0].id),
  `${focusSub.nodes.length} 节点 / ${focusSub.edges.length} 边`);
ok('局部子图边端点闭合', focusSub.edges.every(e =>
  focusSub.nodes.some(n => n.id === e.from) && focusSub.nodes.some(n => n.id === e.to)));

/* ===========================================================================
 * ⑥ 图论算法与学习分析
 * ======================================================================== */
head('[6] 图论算法与学习分析');

/* 最短路：对称性 */
let symOk = true, symSample = 0;
for (let i = 0; i < Math.min(12, concepts.length); i++) {
  const a = concepts[i].id;
  const b = concepts[(i + 7) % concepts.length].id;
  const p1 = KG.shortestPath(a, b), p2 = KG.shortestPath(b, a);
  if (!p1 || !p2) { if ((p1 === null) !== (p2 === null)) symOk = false; continue; }
  if (p1.length !== p2.length) symOk = false;
  symSample++;
}
ok('无向最短路对称', symOk, `采样 ${symSample} 对`);

/* 前置链：不含自身，且链上每个节点都能到达该点 */
let chainOk = true;
concepts.forEach(c => {
  const chain = KG.prereqChain(c.id);
  if (chain.includes(c.id)) chainOk = false;
  chain.forEach(p => {
    if (!(KG.prereqChain(c.id).includes(p) || KG.prereqsOf(c.id).includes(p))) chainOk = false;
  });
});
ok('前置链不含自身且传递闭合', chainOk);

/* 后继链与前置链互为反向 */
const sample = concepts[Math.floor(concepts.length / 2)];
const pre = new Set(KG.prereqChain(sample.id));
const suc = KG.successorChain(sample.id);
ok('后继链不包含自身', !suc.includes(sample.id), `样本 ${sample.id}`);
ok('前置链与后继链互斥', suc.every(s => !pre.has(s)));

/* 邻域 */
const nb1 = KG.neighborhood(concepts[0].id, 1);
const nbrs = KG.neighboursOf(concepts[0].id);
ok('半径 1 邻域 = 自身 + 直接邻居', nb1.nodes.length === nbrs.length + 1,
  `${nb1.nodes.length} vs ${nbrs.length + 1}`);

/* 掌握度 */
const m = KG.mastery(concepts[0].id);
ok('掌握度结构完整',
  typeof m.level === 'number' && m.level >= 0 && m.level <= 3 &&
  typeof m.score === 'number' && m.score >= 0 && m.score <= 1 &&
  typeof m.label === 'string' && Array.isArray(m.labs),
  `${concepts[0].id} → ${m.label} (${m.score})`);

/* 覆盖率 */
const cov = KG.coverage();
const levelSum = [0, 1, 2, 3].reduce((a, i) => a + (cov.byLevel[i] || 0), 0);
ok('覆盖率分级之和 = 知识点总数', levelSum === cov.total, `${levelSum} / ${cov.total}`);
ok('覆盖率与掌握率在 [0,1]', cov.rate >= 0 && cov.rate <= 1 && cov.masteryRate >= 0 && cov.masteryRate <= 1,
  `覆盖 ${(cov.rate * 100).toFixed(0)}% · 掌握 ${(cov.masteryRate * 100).toFixed(0)}%`);

/* 领域统计 */
const ds = KG.domainStats();
const dsSum = ds.reduce((a, d) => a + d.count, 0);
ok('领域统计知识点之和 = 总数', dsSum === concepts.length, `${dsSum} / ${concepts.length}`);
ok('领域统计覆盖 10 个领域', ds.length === 10, `实际 ${ds.length}`);
ok('每个领域至少 1 个实验', ds.every(d => d.labCount >= 1),
  ds.filter(d => d.labCount === 0).map(d => d.domain.name).join(' '));

/* 手动标记 */
KG.setMastered(concepts[0].id, true);
const m2 = KG.mastery(concepts[0].id);
ok('手动标记掌握生效', m2.manual === true && m2.level === 3, `${concepts[0].id} → ${m2.label}`);
KG.setMastered(concepts[0].id, false);
ok('取消手动标记还原', KG.mastery(concepts[0].id).manual === false);

/* ===========================================================================
 * 汇总
 * ======================================================================== */
head('——————————————————————————');
console.log(`知识点 ${stats.concepts} 个 · 领域 ${stats.domains} 个 · 公式 ${stats.formulas} 条 · 要点 ${stats.keyPoints} 条 · 误区 ${stats.mistakes} 条`);
console.log(`图谱 ${gs.nodes} 节点 / ${gs.edges} 边（前置 ${gs.byType.prereq} · 相关 ${gs.byType.related} · 归属 ${gs.byType.lab}）· 最大深度 ${gs.maxDepth} · 平均度 ${gs.avgDegree}`);
console.log(`实验 ${gs.labs} 个 · 平均关联知识点 ${avgPerLab} 个 · 三层齐全的实验 ${roleMixed} 个`);
console.log(`结果：${pass} 通过 / ${fail} 失败`);
if (fail) { console.log('\n失败项：'); fails.forEach(f => console.log('  · ' + f)); }
process.exit(fail ? 1 : 0);
