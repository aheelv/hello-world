/* 仿真引擎自检 —— node assets/js/lib/__selftest_sim.js */
require('./orcore.js');
const OR = require('./orsim.js');
let pass = 0, fail = 0;
const ok = (n, c, e) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + '   ' + (e === undefined ? '' : JSON.stringify(e))); } };
const near = (a, b, t = 1e-4) => Math.abs(a - b) <= t;

console.log('\n[1] 排队论解析解');
{
  const r = OR.queue.mmck(4, 5, 1, Infinity);
  ok('M/M/1 ρ=0.8', near(r.rho, 0.8), r.rho);
  ok('M/M/1 L=4', near(r.L, 4), r.L);
  ok('M/M/1 Lq=3.2', near(r.Lq, 3.2), r.Lq);
  ok('M/M/1 W=1', near(r.W, 1), r.W);
  ok('M/M/1 Wq=0.8', near(r.Wq, 0.8), r.Wq);
}
{
  const r = OR.queue.mmck(4, 2, 3, Infinity);
  ok('M/M/3 P0=1/9', near(r.P0, 1 / 9), r.P0);
  ok('M/M/3 Lq=8/9', near(r.Lq, 8 / 9), r.Lq);
  ok('M/M/3 L=26/9', near(r.L, 26 / 9), r.L);
  ok('M/M/3 Wq=2/9', near(r.Wq, 2 / 9), r.Wq);
  ok('M/M/3 Pwait=4/9', near(r.Pwait, 4 / 9), r.Pwait);
}
{
  const r = OR.queue.mmck(4, 5, 1, 3);
  ok('M/M/1/3 P0=0.33875', near(r.P0, 0.33875, 1e-5), r.P0);
  ok('M/M/1/3 L≈1.2249', near(r.L, 1.2249, 1e-3), r.L);
  ok('M/M/1/3 损失率≈0.1734', near(r.Pk, 0.17344, 1e-4), r.Pk);
}
{
  const r = OR.queue.mmck(10, 4, 2, Infinity);
  ok('不稳定系统被识别', r.stable === false, r);
}
{
  // M/G/1: λ=3, E[S]=0.25(μ=4), σ=0.25  → PK
  const r = OR.queue.mg1(3, 0.25, 0.25);
  const ES2 = 0.25 * 0.25 + 0.25 * 0.25; // 0.125
  const Lq = 9 * ES2 / (2 * (1 - 0.75));
  ok('M/G/1 Lq 与 P-K 公式一致', near(r.Lq, Lq, 1e-5), [r.Lq, Lq]);
  const md1 = OR.queue.mg1(3, 0.25, 0);
  ok('M/D/1 Lq = ρ²/(2(1-ρ))', near(md1.Lq, 0.75 * 0.75 / (2 * 0.25), 1e-6), md1.Lq);
}

console.log('\n[2] 离散事件仿真 与 解析解一致性');
{
  const sim = OR.queue.simulate({
    arrivalDist: { type: 'exponential', mean: 0.25 },   // λ=4
    serviceDist: { type: 'exponential', mean: 0.2 },    // μ=5
    servers: 1, capacity: Infinity, duration: 30000, warmup: 1000, seed: 42
  });
  const th = OR.queue.mmck(4, 5, 1, Infinity);
  ok('DES Wq 接近理论 0.8 (±0.05)', Math.abs(sim.stats.meanWait - th.Wq) < 0.05, [sim.stats.meanWait, th.Wq]);
  ok('DES Lq 接近理论 3.2 (±0.35)', Math.abs(sim.stats.meanQueueLen - th.Lq) < 0.35, [sim.stats.meanQueueLen, th.Lq]);
  ok('DES 利用率接近理论 0.8 (±0.02)', Math.abs(sim.stats.utilisation - 0.8) < 0.02, sim.stats.utilisation);
  ok('DES 等待概率接近 0.8 (±0.03)', Math.abs(sim.stats.pWait - 0.8) < 0.03, sim.stats.pWait);
  ok('DES 到达量约为 4×时长', Math.abs(sim.stats.arrivals - 4 * 30000) < 2000, sim.stats.arrivals);
}
{
  const sim = OR.queue.simulate({
    arrivalDist: { type: 'exponential', mean: 0.5 },   // λ=2
    serviceDist: { type: 'deterministic', mean: 0.25 },
    servers: 1, capacity: Infinity, duration: 20000, warmup: 500, seed: 7
  });
  const md1 = OR.queue.mg1(2, 0.25, 0);
  ok('M/D/1 仿真 Wq 接近理论 (±0.02)', Math.abs(sim.stats.meanWait - md1.Wq) < 0.02, [sim.stats.meanWait, md1.Wq]);
}
{
  const sim = OR.queue.simulate({
    arrivalDist: { type: 'exponential', mean: 0.25 },
    serviceDist: { type: 'exponential', mean: 0.2 },
    servers: 1, capacity: 4, duration: 20000, warmup: 500, seed: 11
  });
  const th = OR.queue.mmck(4, 5, 1, 4);
  const lossRate = sim.stats.balked / (sim.stats.arrivals + sim.stats.balked);
  ok('有限容量 损失率接近理论 (±0.03)', Math.abs(lossRate - th.Pk) < 0.03, [lossRate, th.Pk]);
}
{
  // 多服务台一致性
  const sim = OR.queue.simulate({
    arrivalDist: { type: 'exponential', mean: 0.5 },    // λ=2
    serviceDist: { type: 'exponential', mean: 0.6 },    // μ=1.667
    servers: 2, capacity: Infinity, duration: 30000, warmup: 1000, seed: 2024
  });
  const th = OR.queue.mmck(2, 1 / 0.6, 2, Infinity);
  ok('M/M/2 仿真 Wq 接近理论 (±0.10)', Math.abs(sim.stats.meanWait - th.Wq) < 0.10, [sim.stats.meanWait, th.Wq]);
}

console.log('\n[3] 库存模型');
{
  const r = OR.inv.eoq({ demand: 10000, orderCost: 100, holdingCost: 2, unitCost: 10 });
  ok('EOQ Q*=1000', near(r.Q, 1000), r.Q);
  ok('EOQ 年订货 10 次', near(r.ordersPerYear, 10), r.ordersPerYear);
  ok('EOQ 可变成本 2000', near(r.totalVariable, 2000), r.totalVariable);
}
{
  const r = OR.inv.epq({ demand: 1000, orderCost: 50, holdingCost: 2, productionRate: 5000 });
  ok('EPQ Q*=250', near(r.Q, 250), r.Q);
  ok('EPQ Imax=200', near(r.maxInventory, 200), r.maxInventory);
}
{
  // 报童：μ=100, σ=20, Cu=4, Co=2 → CR=2/3, z≈0.4307, Q≈108.6
  const r = OR.inv.newsvendor({ mean: 100, sd: 20, underageCost: 4, overageCost: 2, price: 10, cost: 6, salvage: 2 });
  ok('临界比 = 2/3', near(r.criticalRatio, 2 / 3), r.criticalRatio);
  ok('最优订货量 ≈ 108.6', Math.abs(r.orderQty - 108.6) < 0.5, r.orderQty);
  ok('分位数函数自洽', near(OR.stats.normCdf(OR.stats.probit(0.975)), 0.975, 1e-6), OR.stats.probit(0.975));
}
{
  const r = OR.inv.discount({
    demand: 5000, orderCost: 200, holdingRate: 0.2,
    breaks: [{ minQty: 0, price: 10 }, { minQty: 1000, price: 9.5 }, { minQty: 3000, price: 9 }]
  });
  ok('存在可行方案', r.options.length === 3, r.options.length);
  ok('最优方案总成本最小', r.best.total === Math.min(...r.options.map(o => o.total)), r.best);
}
{
  const r = OR.inv.simulate({
    meanDemand: 50, sdDemand: 10, leadTime: 2, policy: 'QR', orderQty: 200, reorderPoint: 130,
    holdingCost: 0.5, orderCost: 80, shortageCost: 8, unitCost: 10, periods: 500, seed: 3
  });
  ok('(Q,R) 仿真产生序列', r.series.length === 500, r.series.length);
  ok('填充率合理 (>0.9)', r.stats.fillRate > 0.9, r.stats.fillRate);
  ok('安全库存理论值 = 130-100 = 30', near(r.theory.safetyStock, 30), r.theory.safetyStock);
}

console.log('\n[4] 蒙特卡洛统计量');
{
  const rand = OR.rng(12345);
  const D = OR.makeDist(rand);
  const xs = Array.from({ length: 200000 }, () => D.normal(10, 2));
  const st = OR.stats.statistics(xs);
  ok('正态均值收敛 (±0.03)', Math.abs(st.mean - 10) < 0.03, st.mean);
  ok('正态标准差收敛 (±0.03)', Math.abs(st.sd - 2) < 0.03, st.sd);
  const var95 = OR.stats.varCvar(xs, 0.95);
  ok('VaR95 ≈ μ-1.645σ', Math.abs(var95.VaR - (10 - 1.645 * 2)) < 0.08, var95.VaR);
  ok('CVaR < VaR', var95.CVaR < var95.VaR, [var95.CVaR, var95.VaR]);
  // 指数分布
  const es = Array.from({ length: 100000 }, () => D.exp(2));
  const st2 = OR.stats.statistics(es);
  ok('指数均值 = 0.5 (±0.01)', Math.abs(st2.mean - 0.5) < 0.01, st2.mean);
}

console.log('\n[5] 网络计划 PERT/CPM');
{
  // 经典教材例：A→B,D; B→C; C→E; D→E
  const p = OR.pert.compute([
    { id: 'A', name: '需求分析', te: 3, preds: [] },
    { id: 'B', name: '系统设计', te: 4, preds: ['A'] },
    { id: 'C', name: '编码实现', te: 6, preds: ['B'] },
    { id: 'D', name: '数据准备', te: 5, preds: ['A'] },
    { id: 'E', name: '集成测试', te: 3, preds: ['C', 'D'] }
  ]);
  ok('工期 = 16', near(p.projectDuration, 16), p.projectDuration);
  ok('关键路线 A-B-C-E', JSON.stringify(p.criticalPath) === JSON.stringify(['A', 'B', 'C', 'E']), p.criticalPath);
  // 活动D：ES=3, EF=8，须在 13 前完成 → 总时差 5
  const D = p.activities.find(a => a.id === 'D');
  ok('活动D总时差 = 5', near(D.totalFloat, 5), D.totalFloat);
  ok('活动D非关键', D.critical === false);
  ok('活动D自由时差 = 5', near(D.freeFloat, 5), D.freeFloat);
}
{
  // PERT 三点估计 + 概率
  const p = OR.pert.compute([
    { id: 'A', o: 2, m: 4, p: 6, preds: [] },
    { id: 'B', o: 3, m: 5, p: 13, preds: ['A'] },
    { id: 'C', o: 2, m: 6, p: 10, preds: ['A'] },
    { id: 'D', o: 4, m: 6, p: 8, preds: ['B', 'C'] }
  ]);
  const teA = (2 + 16 + 6) / 6, teB = (3 + 20 + 13) / 6, teD = (4 + 24 + 8) / 6;
  ok('tₑ(A)=4', near(p.activities[0].te, teA), p.activities[0].te);
  ok('tₑ(B)=6', near(p.activities[1].te, teB), p.activities[1].te);
  ok('关键路线含 A,B,D', ['A', 'B', 'D'].every(x => p.criticalPath.includes(x)), p.criticalPath);
  ok('按期概率单调递增', p.probability(p.projectDuration) < p.probability(p.projectDuration + 3));
  ok('概率在 [0,1]', p.probability(1000) === 1 && p.probability(0) >= 0, [p.probability(1000), p.probability(0)]);
}
{
  const p = OR.pert.compute([
    { id: 'A', o: 2, m: 4, p: 8, preds: [] },
    { id: 'B', o: 3, m: 6, p: 12, preds: ['A'] },
    { id: 'C', o: 1, m: 3, p: 7, preds: ['A'] },
    { id: 'D', o: 2, m: 5, p: 10, preds: ['B', 'C'] }
  ]);
  const s = OR.pert.simulate(p, 30000, 99);
  ok('仿真均值接近解析工期 (±0.6)', Math.abs(s.stats.mean - p.projectDuration) < 0.6, [s.stats.mean, p.projectDuration]);
  ok('关键度指数合计合理', s.criticalityIndex[0].index > 0.3, s.criticalityIndex.slice(0, 3));
}
{
  const p = OR.pert.compute([{ id: 'A', preds: ['B'] }, { id: 'B', preds: ['A'] }]);
  ok('检测循环依赖', p.error !== undefined, p.error);
}

console.log('\n[6] 动态规划');
{
  const r = OR.dp.knapsack01([
    { name: '物品1', weight: 2, value: 3 }, { name: '物品2', weight: 3, value: 4 },
    { name: '物品3', weight: 4, value: 5 }, { name: '物品4', weight: 5, value: 6 }
  ], 5);
  ok('0/1 背包最优值 = 7', r.maxValue === 7, r.maxValue);
  ok('选中重量 ≤ 容量', r.totalWeight <= 5, r.totalWeight);
  // 暴力验证
  const items = [[2, 3], [3, 4], [4, 5], [5, 6]];
  let bf = 0;
  for (let mask = 0; mask < 16; mask++) {
    let w = 0, v = 0;
    items.forEach((it, i) => { if (mask & (1 << i)) { w += it[0]; v += it[1]; } });
    if (w <= 5) bf = Math.max(bf, v);
  }
  ok('与暴力枚举一致 (' + bf + ')', r.maxValue === bf, r.maxValue);
}
{
  const r = OR.dp.resourceAllocation(3, 5, (i, k) => {
    const tbl = [[0, 3, 5, 6, 7, 7], [0, 4, 6, 8, 9, 10], [0, 2, 5, 7, 8, 9]];
    return tbl[i][k];
  });
  let bf = 0;
  for (let a = 0; a <= 5; a++) for (let b = 0; b + a <= 5; b++) {
    const c = 5 - a - b;
    const tbl = [[0, 3, 5, 6, 7, 7], [0, 4, 6, 8, 9, 10], [0, 2, 5, 7, 8, 9]];
    bf = Math.max(bf, tbl[0][a] + tbl[1][b] + tbl[2][c]);
  }
  ok('资源分配最优值 ' + bf, r.maxProfit === bf, [r.maxProfit, bf]);
  ok('分配用量之和 = 资源总量', r.allocation.reduce((a, b) => a + b, 0) === 5, r.allocation);
}

console.log('\n——————————————————————————');
console.log(`结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
