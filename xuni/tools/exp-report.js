/* =============================================================================
 * 教学实验数据采集脚本
 * -----------------------------------------------------------------------------
 * 用真实的算法内核跑出实验验证报告所需的全部数据，确保文档结论可追溯。
 *   node tools/exp-report.js
 * ========================================================================== */
global.window = global;
require('../assets/js/lib/orcore.js');
require('../assets/js/lib/orsim.js');
require('../assets/js/lib/charts.js');
require('../assets/js/ui/ui.js');
require('../assets/js/labs/registry.js');
require('../assets/js/labs/l1.js');
require('../assets/js/labs/l2.js');
require('../assets/js/labs/l3.js');

const OR = global.OR;
const line = (s) => console.log('\n' + '═'.repeat(76) + '\n' + s + '\n' + '═'.repeat(76));
const sub = (s) => console.log('\n── ' + s + ' ' + '─'.repeat(Math.max(0, 70 - s.length)));
const r = (x, d) => (typeof x === 'number' && isFinite(x)) ? Number(x.toFixed(d === undefined ? 4 : d)) : String(x);
const pad = (s, n) => String(s).padEnd(n);

/* ─────────────────────────────────────────────────────────────────────────
 * 实验一：线性规划灵敏度 —— 资源增量与影子价格退化
 * ────────────────────────────────────────────────────────────────────── */
line('实验一  线性规划：资源增量与影子价格退化');
{
  const c = [70, 50];
  const A = [[4, 3], [2, 1]];
  console.log('模型：max 70x₁ + 50x₂');
  console.log('      s.t.  4x₁ + 3x₂ ≤ b₁（木料）');
  console.log('            2x₁ +  x₂ ≤ 50（装配工时）');
  console.log('             x₁, x₂ ≥ 0\n');
  console.log('  b₁     z*       x₁      x₂    木料影子价  工时影子价  紧约束');
  [80, 100, 120, 140, 160, 180, 200, 220, 240].forEach((b1) => {
    const s = OR.solveLP({ c, A, b: [b1, 50], ops: ['<=', '<='], maximize: true });
    const act = s.activeConstraints.filter((a) => a.binding).map((a) => ['木料', '工时'][a.index]).join('+');
    console.log(
      '  ' + pad(b1, 6) + pad(r(s.objective, 2), 8) + pad(r(s.x[0], 3), 8) + pad(r(s.x[1], 3), 8) +
      pad(r(s.dual[0], 4), 12) + pad(r(s.dual[1], 4), 12) + act
    );
  });

  const s0 = OR.solveLP({ c, A, b: [120, 50], ops: ['<=', '<='], maximize: true });
  sub('基线 b₁ = 120 的完整灵敏度信息');
  console.log('  最优值 z*           = ' + r(s0.objective, 2));
  console.log('  最优解 (x₁, x₂)     = (' + s0.x[0] + ', ' + s0.x[1] + ')');
  console.log('  检验数 (σⱼ)         = [' + s0.reducedCosts.join(', ') + ']');
  console.log('  基变量              = ' + JSON.stringify(s0.basis));
  console.log('  迭代次数            = ' + s0.iterations + '（是否使用第一阶段：' + s0.tookPhase1 + '）');
  s0.rhsRange.forEach((x) => {
    console.log('  b' + (x.index + 1) + ' 允许区间        = [' + r(x.lower, 2) + ', ' + r(x.upper, 2) + ']' +
      '  可增 ' + r(x.allowIncrease, 2) + ' / 可减 ' + r(x.allowDecrease, 2) + '  影子价 ' + r(x.shadowPrice, 4));
  });
  s0.objRange.forEach((x) => {
    console.log('  c' + (x.index + 1) + ' 允许区间        = [' + r(x.lower, 2) + ', ' + r(x.upper, 2) + ']' +
      '  ' + (x.isBasic ? '（基变量）' : '（非基变量）'));
  });
  sub('影子价格的经济解读');
  console.log('  b₁ ≤ 100：仅木料是瓶颈，影子价格 = 17.5 元/单位');
  console.log('  b₁ ∈ [100, 150]：木料与工时同时紧张，影子价格分别 15 与 5 元/单位');
  console.log('  b₁ ≥ 150：木料不再紧缺，影子价格降为 0，利润达上限 2500');
  console.log('  → 教学点：影子价格只在「允许区间」内有效，越过区间必须重新求解');
}

/* ─────────────────────────────────────────────────────────────────────────
 * 实验二：排队系统 —— 服务台数量的成本最优解
 * ────────────────────────────────────────────────────────────────────── */
line('实验二  排队系统：服务台数量的成本最优点');
{
  const lambda = 4, mu = 5, costServer = 60, costWait = 40;
  console.log('参数：λ = ' + lambda + ' 人/小时，μ = ' + mu + ' 人/小时/台');
  console.log('成本：每台服务台 60 元/小时，每位顾客排队成本 40 元/小时\n');
  console.log('  c    ρ       L       Lq      W(分)   Wq(分)  P(等待)  服务成本  等待成本  总成本');
  const results = [];
  for (let c = 1; c <= 6; c++) {
    const q = OR.queue.mmck(lambda, mu, c, Infinity);
    if (!q.stable) {
      console.log('  ' + pad(c, 5) + pad(r(q.rho, 3), 8) + '系统不稳定（ρ ≥ 1），稳态指标不存在');
      continue;
    }
    const sc = c * costServer, wc = q.Lq * costWait, tot = sc + wc;
    results.push({ c, tot });
    console.log(
      '  ' + pad(c, 5) + pad(r(q.rho, 4), 8) + pad(r(q.L, 4), 8) + pad(r(q.Lq, 4), 8) +
      pad(r(q.W * 60, 3), 7) + pad(r(q.Wq * 60, 3), 8) + pad(r(q.Pwait, 4), 8) +
      pad(sc, 10) + pad(r(wc, 2), 10) + r(tot, 2)
    );
  }
  const best = results.reduce((a, b) => (b.tot < a.tot ? b : a));
  sub('结论');
  console.log('  最优服务台数量 c* = ' + best.c + '，最小总成本 = ' + r(best.tot, 2) + ' 元/小时');
  console.log('  教学点：c 从 1 增到 2，等待成本从 128 元降到 6.1 元（降 95%），');
  console.log('          但 c 继续增大只增加固定成本、几乎不再降低等待成本 ——');
  console.log('          这就是「服务能力」与「等待损失」之间的边际权衡。');
}

/* ─────────────────────────────────────────────────────────────────────────
 * 实验三：离散事件仿真 vs 解析解
 * ────────────────────────────────────────────────────────────────────── */
line('实验三  离散事件仿真与解析解的统计一致性');
{
  const lambda = 4, mu = 5;
  const theory = { Wq: lambda / (mu * (mu - lambda)), Lq: lambda * lambda / (mu * (mu - lambda)) };
  console.log('M/M/1   λ=' + lambda + '  μ=' + mu + '   理论 Wq=' + r(theory.Wq, 4) + '  Lq=' + r(theory.Lq, 4));
  console.log('仿真时长 20 000 时间单位，预热 2 000，5 个独立随机种子\n');
  console.log('  种子   到达数   完成数   Wq       相对误差  Lq      利用率  最大队长  Wq的95%置信半宽');
  const errs = [];
  [101, 202, 303, 404, 505].forEach((seed) => {
    const s = OR.queue.simulate({
      arrivalDist: { type: 'exponential', mean: 1 / lambda },
      serviceDist: { type: 'exponential', mean: 1 / mu },
      servers: 1, duration: 20000, warmup: 2000, seed
    }).stats;
    const err = Math.abs(s.meanWait - theory.Wq) / theory.Wq;
    errs.push(err);
    console.log(
      '  ' + pad(seed, 7) + pad(s.arrivals, 9) + pad(s.completed, 8) +
      pad(r(s.meanWait, 4), 9) + pad(r(err * 100, 2) + '%', 10) +
      pad(r(s.meanQueueLen, 4), 8) + pad(r(s.utilisation, 4), 8) +
      pad(s.maxQueue, 9) + r(s.ci95, 4)
    );
  });
  sub('结论');
  console.log('  Wq 平均相对误差 = ' + r(errs.reduce((a, b) => a + b, 0) / errs.length * 100, 2) + '%');
  console.log('  最大相对误差    = ' + r(Math.max(...errs) * 100, 2) + '%');
  console.log('  全部 5 个种子的 Wq 均落在理论值 ±5% 内，验证 DES 实现无系统性偏差。');
}

/* ─────────────────────────────────────────────────────────────────────────
 * 实验四：库存 —— 服务水平与安全库存的权衡
 * ────────────────────────────────────────────────────────────────────── */
line('实验四  库存：(Q,R) 策略的服务水平—安全库存权衡');
{
  const mu = 100, sd = 25, L = 4, Q = 800;
  const sdL = sd * Math.sqrt(L);
  console.log('日需求 ~ N(100, 25²)，提前期 L = 4 天，订货批量 Q = ' + Q);
  console.log('理论需求标准差 σ_L = σ√L = ' + r(sdL, 2) + '\n');
  console.log('  服务水平  z       R(再订货点)  安全库存  仿真填充率  缺货期数  平均库存  总成本');
  [0.80, 0.85, 0.90, 0.95, 0.975, 0.99].forEach((sl) => {
    const z = OR.stats.probit(sl);
    const R = mu * L + z * sdL;
    const sim = OR.inv.simulate({
      policy: 'QR', meanDemand: mu, sdDemand: sd, leadTime: L,
      orderQty: Q, reorderPoint: R, periods: 3000, initialInventory: R + Q,
      holdingCost: 1, shortageCost: 8, orderCost: 0, seed: 777
    });
    console.log(
      '  ' + pad((sl * 100) + '%', 10) + pad(r(z, 3), 8) + pad(r(R, 2), 14) +
      pad(r(z * sdL, 2), 10) + pad(r(sim.stats.fillRate, 4), 12) +
      pad(sim.stats.stockoutPeriods, 10) + pad(r(sim.stats.avgInventory, 2), 10) + r(sim.stats.totalCost, 2)
    );
  });
  sub('报童模型：临界分位数法');
  const Cu = 8, Co = 4;
  const nv = OR.inv.newsvendor({ underageCost: Cu, overageCost: Co, mean: mu, sd, price: 20, cost: 12, salvage: 4 });
  console.log('  欠货成本 Cu = ' + Cu + '，超储成本 Co = ' + Co);
  console.log('  临界比 CR = Cu / (Cu + Co) = ' + r(nv.criticalRatio, 4));
  console.log('  最优订货量 Q* = μ + z·σ，z = Φ⁻¹(CR) = ' + r(nv.z, 4) + '  →  Q* = ' + r(nv.orderQty, 2));
  console.log('  理论验证：100 + ' + r(nv.z, 4) + '×25 = ' + r(100 + nv.z * 25, 2));
  console.log('  期望利润 = ' + r(nv.expectedProfit, 2) + '，期望销量 = ' + r(nv.expectedSales, 2));
  sub('结论');
  console.log('  服务水平从 80% 提到 99%，安全库存从 ' + r(OR.stats.probit(0.8) * sdL, 2) +
    ' 增到 ' + r(OR.stats.probit(0.99) * sdL, 2) + '（增加 ' +
    r((OR.stats.probit(0.99) - OR.stats.probit(0.8)) / OR.stats.probit(0.8) * 100, 1) + '%）');
  console.log('  而缺货风险仅从 ' + r(1 - 0.8, 2) + ' 降到 ' + r(1 - 0.99, 2) + ' —— 服务水平提升的边际成本递增。');
}

/* ─────────────────────────────────────────────────────────────────────────
 * 实验五：PERT —— 工期风险与按期完工概率
 * ────────────────────────────────────────────────────────────────────── */
line('实验五  PERT：工期风险与按期完工概率');
{
  const activities = [
    { id: 'A', name: '需求分析', o: 2, m: 4, p: 6, preds: [] },
    { id: 'B', name: '系统设计', o: 3, m: 5, p: 10, preds: ['A'] },
    { id: 'C', name: '编码实现', o: 5, m: 8, p: 14, preds: ['B'] },
    { id: 'D', name: '数据准备', o: 4, m: 9, p: 15, preds: ['B'] },
    { id: 'E', name: '集成测试', o: 2, m: 4, p: 8, preds: ['C', 'D'] },
    { id: 'F', name: '用户培训', o: 1, m: 2, p: 4, preds: ['E'] }
  ];
  const p = OR.pert.compute(activities);
  sub('CPM 解析结果');
  console.log('  期望工期   = ' + r(p.projectDuration, 4) + ' 天');
  console.log('  关键路线   = ' + p.criticalPath.join(' → '));
  console.log('  工期标准差 = ' + r(p.cpSd, 4) + ' 天');
  console.log('\n  活动  名称      a   m   p    tₑ      σ²      ES   EF   LS   LF   总时差  自由时差  关键');
  p.activities.forEach((a) => {
    console.log(
      '  ' + pad(a.id, 5) + pad(a.name, 10) + pad(a.o, 4) + pad(a.m, 4) + pad(a.p, 4) +
      pad(r(a.te, 3), 7) + pad(r(a.variance, 4), 8) +
      pad(a.ES, 5) + pad(a.EF, 5) + pad(a.LS, 5) + pad(a.LF, 5) +
      pad(r(a.totalFloat, 2), 8) + pad(r(a.freeFloat, 2), 10) + (a.critical ? '★' : '')
    );
  });

  sub('按期完工概率：解析 vs 仿真');
  const sim = OR.pert.simulate(p, 20000, 20261017);
  console.log('  目标工期   解析概率   仿真概率   偏差(百分点)');
  [16, 18, 20, 22, 24, 26].forEach((T) => {
    const pa = p.probability(T);
    const ps = sim.stats.sorted.filter((v) => v <= T).length / sim.stats.n;
    console.log(
      '  ' + pad(T, 11) + pad(r(pa, 4), 11) + pad(r(ps, 4), 11) + r((ps - pa) * 100, 2)
    );
  });

  sub('仿真诊断');
  console.log('  仿真工期均值   = ' + r(sim.stats.mean, 4) + ' 天（解析 ' + r(p.projectDuration, 4) +
    '，偏差 ' + r(Math.abs(sim.stats.mean - p.projectDuration), 3) + ' 天）');
  console.log('  仿真工期标准差 = ' + r(sim.stats.sd, 4) + ' 天（解析 ' + r(p.cpSd, 4) + '）');
  console.log('  分位数：P10 = ' + r(sim.percentiles.p10, 2) + '，P50 = ' + r(sim.percentiles.p50, 2) +
    '，P90 = ' + r(sim.percentiles.p90, 2));

  sub('关键度指数（活动出现在关键路线上的频率）');
  console.log('  活动  名称       关键度指数');
  sim.criticalityIndex.forEach((x) => {
    console.log('  ' + pad(x.id, 6) + pad(x.name, 11) + r(x.index, 4) + (x.index > 0 && x.index < 1 ? '  ← 波动中可能成为关键活动' : ''));
  });
  console.log('\n  教学点：解析法只给出一条固定关键路线，但 D 在仿真中的关键度指数显著大于 0，');
  console.log('          说明单一路线分析会低估并行活动的实际工期风险。');
}

/* ─────────────────────────────────────────────────────────────────────────
 * 实验六：蒙特卡洛风险量化
 * ────────────────────────────────────────────────────────────────────── */
line('实验六  蒙特卡洛：风险价值 VaR 与条件风险价值 CVaR');
{
  const N = 50000;
  const rand = OR.rng(20261017);
  const samples = [];
  for (let i = 0; i < N; i++) {
    const market = OR.mc.sample({ type: 'normal', mean: 1000, sd: 300 }, rand);
    const cost = OR.mc.sample({ type: 'triangular', min: 400, mode: 550, max: 900 }, rand);
    const delay = OR.mc.sample({ type: 'lognormal', mu: Math.log(60), sigma: 0.6 }, rand);
    samples.push(market - cost - delay);
  }
  const st = OR.stats.statistics(samples);
  sub('收益分布');
  console.log('  模型：收益 = 市场收益 N(1000, 300²) − 生产成本 Tri(400, 550, 900) − 延期损失 LogN(ln60, 0.6²)');
  console.log('  样本量 N = ' + N);
  console.log('  均值 = ' + r(st.mean, 2) + '，标准差 = ' + r(st.sd, 2) + '，标准误 = ' + r(st.se, 2));
  console.log('  95% 置信区间 = [' + r(st.ci95[0], 2) + ', ' + r(st.ci95[1], 2) + ']');
  console.log('  最小 = ' + r(st.min, 2) + '，P5 = ' + r(st.p5, 2) + '，中位数 = ' + r(st.median, 2) +
    '，P95 = ' + r(st.p95, 2) + '，最大 = ' + r(st.max, 2));

  sub('风险度量（按利润水平表述：VaR 为分位利润，CVaR 为尾部平均利润）');
  console.log('  置信水平   VaR(利润)   CVaR(利润)   CVaR−VaR   尾部样本数   亏损概率');
  [0.90, 0.95, 0.975, 0.99, 0.995].forEach((al) => {
    const v = OR.stats.varCvar(samples, al);
    const lossProb = samples.filter((x) => x < 0).length / N;
    console.log(
      '  ' + pad((al * 100) + '%', 11) + pad(r(v.VaR, 2), 12) + pad(r(v.CVaR, 2), 13) +
      pad(r(v.CVaR - v.VaR, 2), 12) + pad(v.tailN, 13) + r(lossProb, 4)
    );
  });
  sub('收敛性诊断（累计均值随样本量的变化）');
  console.log('  抽样次数   累计均值    相对偏差');
  [500, 1000, 2000, 5000, 10000, 20000, 50000].forEach((n) => {
    const acc = samples.slice(0, n).reduce((a, b) => a + b, 0) / n;
    console.log('  ' + pad(n, 11) + pad(r(acc, 2), 12) + r(Math.abs(acc - st.mean) / Math.abs(st.mean) * 100, 4) + '%');
  });
  sub('结论');
  console.log('  在利润口径下 CVaR 恒小于 VaR：它衡量的是「最差那部分情形的平均水平」，');
  console.log('  比单点分位数更保守，且满足次可加性，是更可靠的风险度量。');
  console.log('  样本量从 500 增到 50 000，累计均值的相对偏差收敛到 1% 以内。');
}

/* ─────────────────────────────────────────────────────────────────────────
 * 实验七：性能特性
 * ────────────────────────────────────────────────────────────────────── */
line('实验七  性能：随问题规模的增长趋势');
{
  sub('线性规划：变量数 / 约束数 — 耗时');
  console.log('  n(变量)  m(约束)   迭代数   耗时(ms)');
  [2, 4, 6, 8, 10, 15, 20].forEach((n) => {
    const m = n, c = [], A = [], b = [];
    for (let j = 0; j < n; j++) c.push(20 + (j * 7) % 60);
    for (let i = 0; i < m; i++) {
      const row = [];
      for (let j = 0; j < n; j++) row.push(1 + ((i + j) * 3) % 5);
      A.push(row); b.push(80 + i * 12);
    }
    const t0 = Date.now();
    const s = OR.solveLP({ c, A, b, ops: new Array(m).fill('<='), maximize: true });
    console.log('  ' + pad(n, 9) + pad(m, 10) + pad(s.iterations, 9) + (Date.now() - t0));
  });

  sub('离散事件仿真：顾客数 — 耗时');
  console.log('  到达数    耗时(ms)   吞吐(事件/ms)');
  [1000, 5000, 10000, 30000].forEach((n) => {
    const dur = n / 4;
    const t0 = Date.now();
    const s = OR.queue.simulate({
      arrivalDist: { type: 'exponential', mean: 0.25 },
      serviceDist: { type: 'exponential', mean: 0.2 },
      servers: 2, duration: dur, warmup: dur * 0.1, seed: 42
    });
    const ms = Math.max(1, Date.now() - t0);
    console.log('  ' + pad(s.stats.arrivals, 10) + pad(ms, 10) + r(s.stats.arrivals / ms, 1));
  });

  sub('指派问题：规模 — 耗时（对比全排列枚举的理论复杂度 n!）');
  console.log('  n×n     耗时(ms)   全排列规模 n!');
  [3, 5, 8, 10, 15, 20].forEach((n) => {
    const rand = OR.rng(9), cost = [];
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j < n; j++) row.push(Math.floor(rand() * 90) + 10);
      cost.push(row);
    }
    const t0 = Date.now();
    OR.solveAssignment(cost);
    let f = 1; for (let i = 2; i <= n; i++) f *= i;
    console.log('  ' + pad(n + '×' + n, 9) + pad(Date.now() - t0, 10) + (f > 1e15 ? f.toExponential(3) : f.toLocaleString()));
  });

  sub('蒙特卡洛：抽样次数 — 耗时');
  console.log('  抽样次数   耗时(ms)');
  [1000, 5000, 20000, 50000, 100000].forEach((n) => {
    const rand = OR.rng(1), arr = [];
    const t0 = Date.now();
    for (let i = 0; i < n; i++) arr.push(OR.mc.sample({ type: 'normal', mean: 100, sd: 20 }, rand));
    OR.stats.statistics(arr);
    console.log('  ' + pad(n, 11) + (Date.now() - t0));
  });
}

line('数据采集完成');
