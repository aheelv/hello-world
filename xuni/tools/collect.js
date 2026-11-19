/* =============================================================================
 * 学习档案批量汇总
 * -----------------------------------------------------------------------------
 * 把学生导出的 JSON 学习档案汇总为班级级统计，用于课程教学改进。
 *
 *   1. 收集：让学生在学习档案页点「导出 JSON」并提交
 *   2. 汇总：node tools/collect.js ./学生档案/
 *         node tools/collect.js ./学生档案/ --csv   # 输出 CSV
 * ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const asCsv = args.indexOf('--csv') >= 0;
const dir = args.find((a) => !a.startsWith('--')) || '.';

if (!fs.existsSync(dir)) { console.error('目录不存在：' + dir); process.exit(1); }

const pick = (s, re) => { const m = s.match(re); return m ? m[1] : null; };
const pad = (s, n) => String(s).padEnd(n);
const pct = (v) => (v * 100).toFixed(1) + '%';
const trunc = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));
const csvCell = (v) => '"' + String(v).replace(/"/g, '""') + '"';

/* ---------- 从 labs 源码提取场景与题目元信息（无需运行浏览器代码） ---------- */
function loadLabMeta() {
  const meta = {};
  const base = path.resolve(__dirname, '..', 'assets', 'js', 'labs');
  ['l1.js', 'l2.js', 'l3.js'].forEach((f) => {
    const p = path.join(base, f);
    if (!fs.existsSync(p)) return;
    const src = fs.readFileSync(p, 'utf8');
    const regRe = /OR\.Lab\.register\(\{([\s\S]*?)\n  \}\);/g;
    let m;
    while ((m = regRe.exec(src)) !== null) {
      const block = m[1];
      const id = pick(block, /id:\s*'([^']+)'/);
      if (!id) continue;
      const qids = [];
      const qRe = /id:\s*'([a-z]{2,4}-\d+)'/g;
      let q;
      while ((q = qRe.exec(block)) !== null) qids.push(q[1]);
      const lv = pick(block, /level:\s*(\d)/);
      meta[id] = {
        id: id,
        name: pick(block, /name:\s*'([^']+)'/) || id,
        level: lv ? Number(lv) : 1,
        topic: pick(block, /topic:\s*'([^']+)'/) || '未分类',
        total: qids.length,
        qids: qids
      };
    }
  });
  return meta;
}

/* ---------- 聚合（与 views/dashboard.js 逻辑一致） ---------- */
function aggregate(raw, labMeta) {
  const progress = (raw && raw.progress) || {};
  const answers = (raw && raw.answers) || {};
  const wrong = (raw && raw.wrong) || [];

  const rows = Object.keys(labMeta).map((id) => {
    const lab = labMeta[id];
    const p = progress[id] || {};
    let correct = 0;
    lab.qids.forEach((qid) => { const a = answers[qid]; if (a && a.ok) correct += 1; });
    return {
      id: id, name: lab.name, level: lab.level, topic: lab.topic,
      runs: p.runs || 0, correct: correct, total: lab.total,
      accuracy: lab.total ? correct / lab.total : 0,
      done: lab.total > 0 && correct >= lab.total
    };
  });

  const totalQ = rows.reduce((a, r) => a + r.total, 0);
  const correctQ = rows.reduce((a, r) => a + r.correct, 0);
  const topicMap = {};
  rows.forEach((r) => {
    if (!topicMap[r.topic]) topicMap[r.topic] = { topic: r.topic, total: 0, correct: 0, level: r.level };
    topicMap[r.topic].total += r.total;
    topicMap[r.topic].correct += r.correct;
  });

  return {
    rows: rows,
    topics: Object.keys(topicMap).map((k) => topicMap[k]),
    totalQ: totalQ, correctQ: correctQ, wrongCount: wrong.length,
    visited: rows.filter((r) => r.runs > 0).length,
    totalRuns: rows.reduce((a, r) => a + r.runs, 0),
    accuracy: totalQ ? correctQ / totalQ : 0
  };
}

function main() {
  const labMeta = loadLabMeta();
  const labCount = Object.keys(labMeta).length;
  const grandTotalQ = Object.values(labMeta).reduce((a, l) => a + l.total, 0);
  if (!labCount) { console.error('未能提取场景元信息，请检查 assets/js/labs/ 是否完整。'); process.exit(1); }

  const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.json'));
  if (!files.length) { console.error('目录中没有 .json 文件：' + dir); process.exit(1); }

  const students = [], skipped = [];
  files.forEach((f) => {
    let data;
    try { data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); }
    catch (e) { skipped.push({ file: f, reason: 'JSON 解析失败' }); return; }
    const raw = data.raw || data;
    if (!raw || (!raw.progress && !raw.answers)) { skipped.push({ file: f, reason: '不是学习档案格式' }); return; }
    students.push({
      file: f, exportedAt: data.exportedAt || null,
      label: f.replace(/\.json$/i, '').replace(/^OR-SimLab-学习档案-/, ''),
      agg: aggregate(raw, labMeta)
    });
  });

  if (!students.length) {
    console.error('没有可用的学习档案。');
    skipped.forEach((s) => console.error('  跳过 ' + s.file + '：' + s.reason));
    process.exit(1);
  }

  const n = students.length;
  const byLab = Object.keys(labMeta).map((id) => {
    const rows = students.map((s) => s.agg.rows.find((r) => r.id === id)).filter(Boolean);
    const totQ = rows.reduce((a, r) => a + r.total, 0);
    return {
      id: id, name: labMeta[id].name, level: labMeta[id].level, topic: labMeta[id].topic,
      exploredRate: rows.filter((r) => r.runs > 0).length / n,
      accuracy: totQ ? rows.reduce((a, r) => a + r.correct, 0) / totQ : 0,
      avgRuns: rows.reduce((a, r) => a + r.runs, 0) / n,
      doneRate: rows.filter((r) => r.done).length / n
    };
  });

  const topicAgg = {};
  Object.values(labMeta).forEach((l) => {
    if (!topicAgg[l.topic]) topicAgg[l.topic] = { topic: l.topic, level: l.level, labs: 0, total: 0, correct: 0 };
    topicAgg[l.topic].labs += 1;
    topicAgg[l.topic].total += l.total * n;
  });
  students.forEach((s) => s.agg.topics.forEach((t) => {
    if (topicAgg[t.topic]) topicAgg[t.topic].correct += t.correct;
  }));
  const topics = Object.values(topicAgg)
    .map((t) => Object.assign(t, { accuracy: t.total ? t.correct / t.total : 0 }))
    .sort((a, b) => a.accuracy - b.accuracy);

  /* ---------- CSV 输出 ---------- */
  if (asCsv) {
    console.log(['学生', '已探索场景', '探索率', '求解次数', '已答对', '总题数', '正确率', '错题数']
      .map(csvCell).join(','));
    students.forEach((s) => {
      const a = s.agg;
      console.log([s.label, a.visited, pct(a.visited / labCount), a.totalRuns,
        a.correctQ, a.totalQ, pct(a.accuracy), a.wrongCount].map(csvCell).join(','));
    });
    return;
  }

  /* ---------- 报告 ---------- */
  console.log('\n' + '═'.repeat(96));
  console.log('学习档案汇总报告');
  console.log('数据目录：' + path.resolve(dir));
  console.log('有效档案：' + students.length + ' 份' + (skipped.length ? '（跳过 ' + skipped.length + ' 份）' : ''));
  console.log('场景规模：' + labCount + ' 个场景 · ' + grandTotalQ + ' 道题');
  console.log('═'.repeat(96));

  console.log('\n── 学生明细（按正确率降序） ' + '─'.repeat(64));
  console.log(pad('学生', 26) + pad('已探索', 9) + pad('探索率', 9) + pad('求解数', 9) +
    pad('已答对', 10) + pad('正确率', 9) + pad('错题数', 8));
  console.log('-'.repeat(96));
  students.slice().sort((a, b) => b.agg.accuracy - a.agg.accuracy).forEach((s) => {
    const a = s.agg;
    console.log(pad(trunc(s.label, 24), 26) + pad(a.visited + '/' + labCount, 9) +
      pad(pct(a.visited / labCount), 9) + pad(a.totalRuns, 9) +
      pad(a.correctQ + '/' + a.totalQ, 10) + pad(pct(a.accuracy), 9) + pad(a.wrongCount, 8));
  });

  const avg = (fn) => students.reduce((a, s) => a + fn(s), 0) / n;
  console.log('\n── 班级整体 ' + '─'.repeat(82));
  console.log('  平均探索场景数 ：' + avg((s) => s.agg.visited).toFixed(2) + ' / ' + labCount +
    '（' + pct(avg((s) => s.agg.visited) / labCount) + '）');
  console.log('  平均求解次数   ：' + avg((s) => s.agg.totalRuns).toFixed(1) + ' 次/人');
  console.log('  平均正确率     ：' + pct(avg((s) => s.agg.accuracy)));
  console.log('  平均错题数     ：' + avg((s) => s.agg.wrongCount).toFixed(1) + ' 道/人');

  console.log('\n── 场景维度（按探索率升序，最能暴露被跳过的场景） ' + '─'.repeat(44));
  console.log(pad('场景', 22) + pad('难度', 7) + pad('探索率', 10) + pad('平均求解', 11) +
    pad('正确率', 10) + pad('全部做完率', 12));
  console.log('-'.repeat(96));
  byLab.sort((a, b) => a.exploredRate - b.exploredRate).forEach((r) => {
    console.log(pad(trunc(r.name, 20), 22) + pad(r.level, 7) + pad(pct(r.exploredRate), 10) +
      pad(r.avgRuns.toFixed(1), 11) + pad(pct(r.accuracy), 10) + pad(pct(r.doneRate), 12));
  });

  console.log('\n── 知识点维度（按正确率升序，定位集体薄弱环节） ' + '─'.repeat(46));
  console.log(pad('知识点', 18) + pad('难度', 7) + pad('场景数', 9) + pad('平均答对', 12) +
    pad('正确率', 10) + pad('诊断', 16));
  console.log('-'.repeat(96));
  topics.forEach((t) => {
    let diag = '正常';
    if (t.accuracy < 0.5) diag = '★ 需重点重讲';
    else if (t.accuracy < 0.7) diag = '△ 建议加强';
    else if (t.accuracy >= 0.9) diag = '掌握良好';
    console.log(pad(trunc(t.topic, 16), 18) + pad(t.level, 7) + pad(t.labs, 9) +
      pad((t.correct / n).toFixed(1) + '/' + (t.total / n).toFixed(1), 12) +
      pad(pct(t.accuracy), 10) + pad(diag, 16));
  });

  /* ---------- 教学建议 ---------- */
  const advice = [];
  topics.filter((t) => t.accuracy < 0.7).slice(0, 3).forEach((t) => {
    advice.push('「' + t.topic + '」班级平均正确率 ' + pct(t.accuracy) + '，建议下次课重点讲解或增加课堂演算。');
  });
  byLab.filter((r) => r.exploredRate < 0.5).forEach((r) => {
    advice.push('「' + r.name + '」仅 ' + pct(r.exploredRate) + ' 的学生探索过，检查是否课时不足或存在操作障碍。');
  });
  byLab.filter((r) => r.avgRuns > 8 && r.accuracy < 0.7).forEach((r) => {
    advice.push('「' + r.name + '」平均求解 ' + r.avgRuns.toFixed(1) + ' 次但正确率仅 ' +
      pct(r.accuracy) + '，学生在此反复卡住，建议检查场景表述是否有误导。');
  });
  const highAccLowExplore = students.filter((s) => s.agg.accuracy >= 0.85 && s.agg.visited < labCount);
  if (highAccLowExplore.length) {
    advice.push(highAccLowExplore.length + ' 名学生正确率 ≥85% 但探索场景不足全部，可能只做了简单题，建议提醒完成全部场景。');
  }

  console.log('\n── 教学改进建议 ' + '─'.repeat(80));
  if (!advice.length) {
    console.log('  未发现明显的集体薄弱点或探索缺口，班级整体表现良好。');
  } else {
    advice.forEach((a, i) => console.log('  ' + (i + 1) + '. ' + a));
  }

  if (skipped.length) {
    console.log('\n── 跳过的文件 ' + '─'.repeat(80));
    skipped.forEach((s) => console.log('  ' + s.file + '：' + s.reason));
  }

  console.log('\n提示：加 --csv 参数可输出 CSV 格式，便于用 Excel 进一步分析。');
  console.log('');
}

main();
