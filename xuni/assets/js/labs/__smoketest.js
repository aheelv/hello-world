/* 实验场景冒烟测试 —— node assets/js/labs/__smoketest.js */
global.window = global;
require('../lib/orcore.js');
require('../lib/orsim.js');
require('../lib/charts.js');
require('../ui/ui.js');
require('./registry.js');
require('./l1.js');
require('./l2.js');
require('./l3.js');
require('./l4.js');

const OR = global.OR;
let pass = 0, fail = 0;
const labs = OR.Lab.all();
console.log('\n已注册实验场景：' + labs.length + ' 个\n');

labs.forEach(lab => {
  const t0 = Date.now();
  const params = OR.Lab.defaults(lab.params);
  try {
    const res = lab.run(params);
    const ms = Date.now() - t0;
    const blocks = res && res.blocks ? res.blocks : [];
    // 递归统计块数量
    let n = 0;
    (function walk(list) {
      (list || []).forEach(b => {
        if (!b) return;
        n++;
        if (b.type === 'card') walk(b.blocks);
        if (b.type === 'grid') walk(b.blocks);
      });
    })(blocks);

    const problems = lab.problems || [];
    const pTypes = problems.reduce((acc, p) => { acc[p.type] = (acc[p.type] || 0) + 1; return acc; }, {});
    const okSummary = typeof res.summary === 'string' && res.summary.length > 20;
    const okBlocks = n >= 3;
    const okProblems = problems.length >= 4;
    const okMeta = !!(lab.name && lab.scenario && lab.objectives && lab.theory && lab.topic);
    const okParams = Object.keys(params).length >= 2;
    const k = lab.knowledge || {};
    const okKnow = (k.core || []).length >= 1;

    if (okSummary && okBlocks && okProblems && okMeta && okParams && okKnow) {
      pass++;
      console.log(`  ✓ ${lab.id.padEnd(20)} 难度${lab.level}  块=${String(n).padStart(2)}  题目=${problems.length}(${JSON.stringify(pTypes)})  知识=${(k.core || []).length}/${(k.support || []).length}/${(k.extend || []).length}  耗时=${ms}ms`);
    } else {
      fail++;
      console.log(`  ✗ ${lab.id.padEnd(20)} summary=${okSummary} blocks=${okBlocks}(${n}) problems=${okProblems} meta=${okMeta} params=${okParams} knowledge=${okKnow}`);
    }
    if (ms > 3000) console.log(`     ⚠ 求解耗时较长：${ms}ms`);
  } catch (e) {
    fail++;
    console.log(`  ✗ ${lab.id}  抛出异常：${e.message}`);
    console.log('     ' + (e.stack || '').split('\n').slice(1, 4).join('\n     '));
  }
});

/* 遍历所有参数组合的关键分支（含枚举值、数值极值、开关翻转） */
console.log('\n分支覆盖测试：');
labs.forEach(lab => {
  const base = OR.Lab.defaults(lab.params);
  const variants = [];
  (function walk(list) {
    list.forEach(p => {
      if (p.type === 'group') return walk(p.params);
      /* 枚举分支：逐值切换 */
      if (p.type === 'seg' || p.type === 'select') {
        (p.options || []).forEach(o => {
          const val = typeof o === 'string' ? o : o.value;
          if (val !== base[p.key]) variants.push(Object.assign({}, base, { [p.key]: val }));
        });
      }
      /* 数值分支：取上下界，检验「把参数推到极端」不崩溃 */
      if (p.type === 'range') {
        if (p.min !== undefined && p.min !== base[p.key]) {
          variants.push(Object.assign({}, base, { [p.key]: p.min }));
        }
        if (p.max !== undefined && p.max !== base[p.key]) {
          variants.push(Object.assign({}, base, { [p.key]: p.max }));
        }
      }
      /* 开关分支：翻转 */
      if (p.type === 'toggle') {
        variants.push(Object.assign({}, base, { [p.key]: !base[p.key] }));
      }
    });
  })(lab.params);

  let okc = 0;
  const errs = [];
  variants.forEach(v => {
    try {
      const r = lab.run(v);
      if (!r || !Array.isArray(r.blocks) || !r.blocks.length) { errs.push('空 blocks'); return; }
      /* 结果必须不含 NaN / Infinity，以及关键字段的 undefined。
         样式类字段（tone/title/unit 等）允许缺省，不视为缺陷。 */
      const OPTIONAL = new Set(['tone', 'sub', 'title', 'hint', 'unit', 'color', 'label',
        'xLabel', 'yLabel', 'icon', 'zebra', 'align', 'opts', 'markers', 'marker',
        'legend', 'dash', 'area', 'width', 'maxSteps', 'html', 'note']);
      let polluted = null;
      JSON.stringify(r.blocks, (k, val) => {
        if (val === undefined) {
          if (!OPTIONAL.has(k)) polluted = polluted || ('undefined @ ' + k);
          return null;
        }
        if (typeof val === 'number' && !isFinite(val)) { polluted = polluted || (val + ' @ ' + k); return null; }
        return val;
      });
      if (polluted) { errs.push(polluted + '  ' + JSON.stringify(v)); return; }
      okc++;
    } catch (e) {
      errs.push(e.message + ' @ ' + JSON.stringify(v));
    }
  });
  if (okc === variants.length) {
    pass++;
    console.log(`  ✓ ${lab.id.padEnd(20)} ${variants.length} 个分支（含数值极值）全部通过`);
  } else {
    fail++;
    console.log(`  ✗ ${lab.id.padEnd(20)} ${okc}/${variants.length} 通过`);
    errs.slice(0, 4).forEach(e => console.log('      · ' + e));
  }
});

console.log('\n——————————————————————————');
console.log(`结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
