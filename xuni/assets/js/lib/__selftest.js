/* 算法内核自检 —— node assets/js/lib/__selftest.js */
const OR = require('./orcore.js');
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + '   ' + (extra === undefined ? '' : JSON.stringify(extra))); }
}
function near(a, b, t) { return Math.abs(a - b) <= (t === undefined ? 1e-6 : t); }

console.log('\n[1] 线性规划 · 两阶段单纯形');
{
  // max 3x1 + 5x2   s.t. x1<=4, 2x2<=12, 3x1+2x2<=18
  const r = OR.solveLP({ c: [3, 5], A: [[1, 0], [0, 2], [3, 2]], b: [4, 12, 18], ops: ['<=', '<=', '<='], maximize: true });
  ok('状态最优', r.status === 'optimal', r.status);
  ok('z = 36', near(r.objective, 36), r.objective);
  ok('x = (2,6)', near(r.x[0], 2) && near(r.x[1], 6), r.x);
  ok('对偶价格', near(r.dual[0], 0) && near(r.dual[1], 1.5) && near(r.dual[2], 1), r.dual);
  ok('RHS 区间 c2: [6,18]', near(r.rhsRange[1].lower, 6) && near(r.rhsRange[1].upper, 18), r.rhsRange[1]);
}
{
  // 等式约束 + 两阶段: max 2x1+3x2, x1+x2=5, x1<=4, x2<=4
  const r = OR.solveLP({ c: [2, 3], A: [[1, 1], [1, 0], [0, 1]], b: [5, 4, 4], ops: ['=', '<=', '<='], maximize: true });
  ok('等式约束最优 z=14', r.status === 'optimal' && near(r.objective, 14), r.objective);
  ok('x=(1,4)', near(r.x[0], 1) && near(r.x[1], 4), r.x);
}
{
  // >= 约束: min 2x1+3x2, x1+x2>=4, x1>=1, x2>=1  →  x=(3,1), z=9
  const r = OR.solveLP({ c: [2, 3], A: [[1, 1], [1, 0], [0, 1]], b: [4, 1, 1], ops: ['>=', '>=', '>='], maximize: false });
  ok('最小化 z=9', r.status === 'optimal' && near(r.objective, 9), r.objective);
  ok('x=(3,1)', near(r.x[0], 3) && near(r.x[1], 1), r.x);
  // 约束2(x1>=1) 在最优解 x1=3 处非紧，对偶价格为 0
  ok('对偶价格 [2,0,1]', near(r.dual[0], 2) && near(r.dual[1], 0) && near(r.dual[2], 1), r.dual);
}
{
  // 不可行
  const r = OR.solveLP({ c: [1, 1], A: [[1, 1], [1, 1]], b: [3, 5], ops: ['<=', '>='], maximize: true });
  ok('识别不可行', r.status === 'infeasible', r.status);
}
{
  // 无界
  const r = OR.solveLP({ c: [1, 0], A: [[-1, 0]], b: [0], ops: ['<='], maximize: true });
  ok('识别无界', r.status === 'unbounded', r.status);
}
{
  // 退化解 / 多解检测 (max x1+x2 s.t. x1+x2<=4)
  const r = OR.solveLP({ c: [1, 1], A: [[1, 1]], b: [4], ops: ['<='], maximize: true });
  ok('退化 z=4', r.status === 'optimal' && near(r.objective, 4), r.objective);
}

console.log('\n[2] 运输问题 · VAM + MODI');
{
  const cost = [[10, 20, 5, 15], [7, 12, 9, 8], [3, 6, 11, 4]];
  const supply = [30, 40, 50];
  const demand = [20, 30, 40, 30];
  const r = OR.solveTransport({ cost, supply, demand });
  ok('状态最优', r.status === 'optimal', r.status);
  // 供需平衡校验
  const supplyOk = r.rowCheck.every((v, i) => near(v, supply[i]));
  const demandOk = r.colCheck.every((v, j) => near(v, demand[j]));
  ok('行和=产量', supplyOk, r.rowCheck);
  ok('列和=销量', demandOk, r.colCheck);

  // 独立交叉验证：将运输问题还原为 LP 求解，比对最优值
  const m = cost.length, nn = cost[0].length;
  const lpC = [], lpA = [], lpB = [], lpOps = [];
  cost.forEach(row => row.forEach(v => lpC.push(v)));
  for (let i = 0; i < m; i++) {
    const row = new Array(m * nn).fill(0);
    for (let j = 0; j < nn; j++) row[i * nn + j] = 1;
    lpA.push(row); lpB.push(supply[i]); lpOps.push('<=');
  }
  for (let j = 0; j < nn; j++) {
    const row = new Array(m * nn).fill(0);
    for (let i = 0; i < m; i++) row[i * nn + j] = 1;
    lpA.push(row); lpB.push(demand[j]); lpOps.push('>=');
  }
  const lp = OR.solveLP({ c: lpC, A: lpA, b: lpB, ops: lpOps, maximize: false });
  ok('与 LP 求解结果一致 (' + lp.objective + ')', near(r.totalCost, lp.objective), [r.totalCost, lp.objective]);
}
{
  // 不平衡（需加虚拟）
  const r = OR.solveTransport({ cost: [[1, 2], [3, 4]], supply: [10, 20], demand: [15, 10] });
  ok('自动平衡', r.balanced === false && r.addedDummy !== null);
  const supplyOk = r.rowCheck.every((v, i) => near(v, r.supply[i]));
  const demandOk = r.colCheck.every((v, j) => near(v, r.demand[j]));
  ok('平衡后行和列和成立', supplyOk && demandOk);
}

console.log('\n[3] 指派问题 · 匈牙利法');
{
  const cost = [[82, 83, 69, 92], [77, 37, 49, 92], [11, 69, 5, 86], [8, 9, 98, 23]];
  const r = OR.solveAssignment(cost);
  ok('最优指派成本 140', near(r.cost, 140), r.cost);
  ok('指派唯一度', new Set(r.assignment).size === 4, r.assignment);
}
{
  const cost = [[2, 3, 1], [5, 4, 8], [6, 7, 9]];
  const r = OR.solveAssignment(cost);
  // 枚举全排列验证
  let best = Infinity;
  const perm = (arr, cur) => {
    if (!arr.length) { best = Math.min(best, cur.reduce((s, c, i) => s + cost[i][c], 0)); return; }
    arr.forEach((c, k) => perm(arr.filter((_, kk) => kk !== k), cur.concat([c])));
  };
  perm([0, 1, 2], []);
  ok('3×3 最优 = ' + best, near(r.cost, best), [r.cost, r.assignment]);

  // 5×5 随机矩阵与暴力枚举比对
  const rnd = (seed => () => (seed = seed * 9301 + 49297) % 233280 / 233280)(7);
  const c5 = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => 1 + Math.floor(rnd() * 20)));
  const r5 = OR.solveAssignment(c5);
  let b5 = Infinity;
  const perm5 = (arr, cur, i) => {
    if (!arr.length) { b5 = Math.min(b5, cur.reduce((s, c, k) => s + c5[k][c], 0)); return; }
    arr.forEach((c, k) => perm5(arr.filter((_, kk) => kk !== k), cur.concat([c]), i + 1));
  };
  perm5([0, 1, 2, 3, 4], [], 0);
  ok('5×5 随机与暴力枚举一致', near(r5.cost, b5), [r5.cost, b5]);
}

console.log('\n[4] 最短路');
{
  // 0-1:2, 0-2:5, 1-2:1, 1-3:2, 2-3:3, 2-4:6, 3-4:1
  const edges = [
    { from: 0, to: 1, w: 2 }, { from: 0, to: 2, w: 5 }, { from: 1, to: 2, w: 1 },
    { from: 1, to: 3, w: 2 }, { from: 2, to: 3, w: 3 }, { from: 2, to: 4, w: 6 }, { from: 3, to: 4, w: 1 }
  ];
  const d = OR.network.dijkstra(5, edges, 0, false);
  ok('dist[4] = 5', near(d.dist[4], 5), d.dist);
  const p = OR.network.pathTo(d.prev, 4);
  ok('路径 0→1→3→4', JSON.stringify(p) === JSON.stringify([0, 1, 3, 4]), p);
  const fw = OR.network.floydWarshall(5, edges, false);
  ok('Floyd 与 Dijkstra 一致', fw.dist[0].every((v, i) => near(v, d.dist[i])), fw.dist[0]);
}

console.log('\n[5] 最大流 / 最小费用最大流');
{
  // 经典 4 节点
  const edges = [{ from: 0, to: 1, cap: 3 }, { from: 0, to: 2, cap: 2 }, { from: 1, to: 3, cap: 2 }, { from: 2, to: 3, cap: 3 }];
  const r = OR.network.maxFlow(4, edges, 0, 3);
  ok('最大流 = 4', near(r.maxFlow, 4), r.maxFlow);
}
{
  const edges = [
    { from: 0, to: 1, cap: 10, cost: 2 }, { from: 0, to: 2, cap: 10, cost: 5 },
    { from: 1, to: 3, cap: 10, cost: 3 }, { from: 2, to: 3, cap: 10, cost: 1 },
    { from: 1, to: 2, cap: 5, cost: 1 }
  ];
  const r = OR.network.minCostMaxFlow(4, edges, 0, 3);
  ok('最大流 = 20', near(r.maxFlow, 20), r.maxFlow);
  // 满流 20 必须全部走 0→1(10) 与 0→2(10)，成本 10*2+10*5+10*3+10*1 = 110
  ok('最小费用 = 110', near(r.minCost, 110), r.minCost);
  ok('流守恒校验', (() => {
    const inflow = {}, outflow = {};
    r.flows.forEach(f => {
      outflow[f.from] = (outflow[f.from] || 0) + f.flow;
      inflow[f.to] = (inflow[f.to] || 0) + f.flow;
    });
    for (let i = 1; i < 3; i++) if (!near(inflow[i], outflow[i])) return false;
    return near(outflow[0], 20) && near(inflow[3], 20);
  })(), r.flows);
}

console.log('\n——————————————————————————');
console.log(`结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
