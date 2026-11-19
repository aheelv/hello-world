/* =============================================================================
 * OR-SimLab · 运筹学算法内核 (Operations Research Core)
 * -----------------------------------------------------------------------------
 * 纯 JavaScript 实现，零依赖、零构建，可运行于浏览器与 Node。
 * 覆盖：线性规划(两阶段单纯形 + 灵敏度分析)、运输问题(西北角/VAM/MODI)、
 *      指派问题(匈牙利法)、最短路(Dijkstra/Floyd)、最大流(Dinic)、
 *      最小费用最大流(SSP)。
 * 所有算法均为教学级完整实现，保留迭代过程以便可视化讲解。
 * ========================================================================== */
(function (global) {
  'use strict';

  var EPS = 1e-9;
  var OR = global.OR = global.OR || {};

  /* ---------------------------------------------------------------------------
   * 0. 通用工具
   * ------------------------------------------------------------------------- */

  function zeros(m, n) {
    var a = new Array(m);
    for (var i = 0; i < m; i++) { a[i] = new Array(n).fill(0); }
    return a;
  }
  function clone(A) { return A.map(function (r) { return r.slice(); }); }
  function round(x, d) {
    var p = Math.pow(10, d === undefined ? 6 : d);
    var v = Math.round(x * p) / p;
    return Object.is(v, -0) ? 0 : v;
  }
  function approxZero(x) { return Math.abs(x) < 1e-7; }

  /* ---------------------------------------------------------------------------
   * 1. 线性规划 —— 两阶段单纯形法
   * ------------------------------------------------------------------------- */

  /**
   * 求解线性规划
   * @param {Object} p
   *   p.c        目标函数系数数组（决策变量）
   *   p.A        约束系数矩阵 m×n
   *   p.b        右端项 m
   *   p.ops      约束关系数组 '<=' | '>=' | '='
   *   p.maximize true 求最大，false 求最小
   * @returns {Object} 解对象
   */
  function solveLP(p) {
    var c0 = p.c.slice();
    var A0 = p.A.map(function (r) { return r.slice(); });
    var b0 = p.b.slice();
    var ops0 = p.ops.slice();
    var maximize = p.maximize !== false;
    var m = A0.length;
    var n = c0.length;

    if (!m || !n) return { status: 'error', message: '模型为空' };

    /* --- 归一化：保证 b >= 0，记录行符号以便还原 --- */
    var rowSign = new Array(m).fill(1);
    var A = clone(A0), b = b0.slice(), ops = ops0.slice();
    for (var i = 0; i < m; i++) {
      if (b[i] < -EPS) {
        for (var j = 0; j < n; j++) A[i][j] = -A[i][j];
        b[i] = -b[i];
        rowSign[i] = -1;
        ops[i] = ops[i] === '<=' ? '>=' : (ops[i] === '>=' ? '<=' : '=');
      }
    }

    /* --- 变量布局 --- */
    // [0, n) 决策变量 | [n, n+m) 松弛/剩余 | [n+m, n+m+q) 人工 | Binv m | RHS
    var slackBase = n;
    var artCols = [];
    var artOfRow = new Array(m).fill(-1);
    var typeOfSlack = [];      // 'slack' | 'surplus' | null
    for (i = 0; i < m; i++) typeOfSlack.push(null);

    var Aeq = [];   // 每行的系数行（稀疏填充）
    for (i = 0; i < m; i++) {
      var row = new Array(n + m).fill(0);
      for (j = 0; j < n; j++) row[j] = A[i][j];
      if (ops[i] === '<=') { row[slackBase + i] = 1; typeOfSlack[i] = 'slack'; }
      else if (ops[i] === '>=') { row[slackBase + i] = -1; typeOfSlack[i] = 'surplus'; }
      Aeq.push(row);
    }

    var nArt = 0;
    for (i = 0; i < m; i++) {
      if (ops[i] === '>=' || ops[i] === '=') {
        artOfRow[i] = n + m + nArt;
        artCols.push(n + m + nArt);
        nArt++;
      }
    }
    var totalCols = n + m + nArt;
    var binvBase = totalCols;
    var rhsCol = totalCols + m;
    var width = totalCols + m + 1;

    /* --- 构造初始单纯形表 --- */
    var T = zeros(m + 1, width);
    for (i = 0; i < m; i++) {
      for (j = 0; j < n + m; j++) T[i][j] = Aeq[i][j];
      for (var k = 0; k < nArt; k++) T[i][n + m + k] = (artOfRow[i] === n + m + k) ? 1 : 0;
      for (k = 0; k < m; k++) T[i][binvBase + k] = (i === k) ? 1 : 0;
      T[i][rhsCol] = b[i];
    }

    /* --- 初始基 --- */
    var basis = new Array(m).fill(-1);
    for (i = 0; i < m; i++) {
      if (artOfRow[i] >= 0) basis[i] = artOfRow[i];
      else basis[i] = slackBase + i;
    }

    var log = [];
    var iteration = 0;

    function computeObjectiveRow(costVec) {
      for (var j = 0; j < width; j++) T[m][j] = 0;
      for (j = 0; j < totalCols; j++) T[m][j] = -costVec[j];
      for (var r = 0; r < m; r++) {
        var cb = costVec[basis[r]];
        if (approxZero(cb)) continue;
        for (j = 0; j < width; j++) T[m][j] += cb * T[r][j];
      }
    }

    function colName(j) {
      if (j < n) return 'x' + (j + 1);
      if (j < n + m) {
        var sIdx = j - slackBase + 1;
        return typeOfSlack[j - slackBase] === 'surplus' ? ('e' + sIdx) : ('s' + sIdx);
      }
      return 'a' + (j - n - m + 1);
    }

    function snapshot(label) {
      var rows = [];
      for (var r = 0; r <= m; r++) {
        rows.push(T[r].slice(0, totalCols + 1));
      }
      log.push({
        iter: iteration,
        label: label,
        basis: basis.map(function (bIdx) { return colName(bIdx); }),
        rows: rows
      });
    }

    function pivot(r, c, allowArtificialEnter) {
      var piv = T[r][c];
      for (var j = 0; j < width; j++) T[r][j] /= piv;
      for (var i2 = 0; i2 <= m; i2++) {
        if (i2 === r) continue;
        var f = T[i2][c];
        if (approxZero(f)) continue;
        for (j = 0; j < width; j++) T[i2][j] -= f * T[r][j];
      }
      basis[r] = c;
    }

    function runSimplex(costVec, excludeArt, phaseLabel) {
      computeObjectiveRow(costVec);
      var guard = 0;
      var MAXIT = 4000;
      while (true) {
        if (++guard > MAXIT) return 'maxiter';
        // 目标行存放检验数 z_j - c_j；最大化问题中取最负者入基，全部 >= 0 即最优
        var enter = -1, best = -EPS;
        for (var j = 0; j < totalCols; j++) {
          if (excludeArt && j >= n + m) continue;
          if (basis.indexOf(j) >= 0) continue;
          if (T[m][j] < best) { best = T[m][j]; enter = j; }
        }
        if (enter < 0) return 'optimal';
        // 最小比值检验
        var leave = -1, bestRatio = Infinity;
        for (var r = 0; r < m; r++) {
          if (T[r][enter] > EPS) {
            var ratio = T[r][rhsCol] / T[r][enter];
            if (ratio < bestRatio - 1e-12 || (Math.abs(ratio - bestRatio) < 1e-12 && r < leave)) {
              bestRatio = ratio; leave = r;
            }
          }
        }
        if (leave < 0) return 'unbounded';
        pivot(leave, enter, !excludeArt);
        iteration++;
        if (log.length < 60) snapshot(phaseLabel + ' · 第 ' + iteration + ' 次迭代：' + colName(enter) + ' 入基，' + colName(basis[leave]) + ' 出基');
      }
    }

    /* --- 第一阶段 --- */
    var tookPhase1 = false;
    if (nArt > 0) {
      tookPhase1 = true;
      var cost1 = new Array(totalCols).fill(0);
      for (k = 0; k < nArt; k++) cost1[n + m + k] = -1; // 最大化 -Σ人工
      var st1 = runSimplex(cost1, false, '第一阶段');
      if (st1 === 'maxiter') return { status: 'error', message: '迭代次数超限' };
      if (T[m][rhsCol] < -1e-7) {
        // 尝试把仍留在基中的人工变量换出
        return { status: 'infeasible', message: '问题不可行（无可行解）', log: log };
      }
      // 将基中零水平人工变量换出
      for (i = 0; i < m; i++) {
        if (basis[i] >= n + m) {
          var swapped = false;
          for (j = 0; j < n + m; j++) {
            if (Math.abs(T[i][j]) > 1e-7 && basis.indexOf(j) < 0) { pivot(i, j); swapped = true; break; }
          }
          if (!swapped) { /* 该行冗余，保持 */ }
        }
      }
    }

    /* --- 第二阶段 --- */
    var cost2 = new Array(totalCols).fill(0);
    for (j = 0; j < n; j++) cost2[j] = maximize ? c0[j] : -c0[j];
    var st2 = runSimplex(cost2, nArt > 0, '第二阶段');
    if (st2 === 'maxiter') return { status: 'error', message: '迭代次数超限' };
    if (st2 === 'unbounded') {
      return { status: 'unbounded', message: '问题无界（目标函数可无限增大/减小）', log: log };
    }

    /* --- 抽取解 --- */
    var x = new Array(n).fill(0);
    for (i = 0; i < m; i++) if (basis[i] < n) x[basis[i]] = T[i][rhsCol];
    var zMax = T[m][rhsCol];
    var z = maximize ? zMax : -zMax;

    /* --- 对偶价格 (影子价格) --- */
    var dual = new Array(m).fill(0);
    for (i = 0; i < m; i++) {
      var s = 0;
      for (var r2 = 0; r2 < m; r2++) {
        var cbv = cost2[basis[r2]];
        if (!approxZero(cbv)) s += cbv * T[r2][binvBase + i];
      }
      dual[i] = (maximize ? 1 : -1) * s * rowSign[i];
    }

    /* --- 右端项灵敏度区间 --- */
    var rhsRange = [];
    for (i = 0; i < m; i++) {
      var dMin = -Infinity, dMax = Infinity;
      for (var r3 = 0; r3 < m; r3++) {
        var coef = T[r3][binvBase + i];
        var xb = T[r3][rhsCol];
        if (coef > 1e-9) dMin = Math.max(dMin, -xb / coef);
        else if (coef < -1e-9) dMax = Math.min(dMax, -xb / coef);
      }
      // 还原到原始右端项（若该行被取反）
      var bi = b0[i];
      var lo = rowSign[i] === 1 ? bi + dMin : -(bi + dMax);
      var hi = rowSign[i] === 1 ? bi + dMax : -(bi + dMin);
      rhsRange.push({
        index: i,
        current: bi,
        allowIncrease: rowSign[i] === 1 ? dMax : -dMin,
        allowDecrease: rowSign[i] === 1 ? -dMin : dMax,
        lower: isFinite(lo) ? lo : -Infinity,
        upper: isFinite(hi) ? hi : Infinity,
        shadowPrice: dual[i]
      });
    }

    /* --- 目标系数灵敏度区间（允许变动范围 dMin2 ≤ Δc_j ≤ dMax2）--- */
    var objRange = [];
    for (j = 0; j < n; j++) {
      var k2 = basis.indexOf(j);
      var dMin2 = -Infinity, dMax2 = Infinity;
      if (k2 < 0) {
        // 非基变量：仅上界受检验数约束
        dMax2 = Math.min(dMax2, T[m][j]);
      } else {
        // 基变量：T[m][l] + Δ·T[k2][l] ≥ 0 对所有非基 l 成立
        for (var l = 0; l < totalCols; l++) {
          if (basis.indexOf(l) >= 0) continue;
          var coeff = T[k2][l];
          var rc = T[m][l];
          if (coeff > 1e-9) dMin2 = Math.max(dMin2, -rc / coeff);
          else if (coeff < -1e-9) dMax2 = Math.min(dMax2, -rc / coeff);
        }
      }
      // 最小化问题等价于求解 max(-c)，Δ_max = -Δ_orig
      var dLo = maximize ? dMin2 : -dMax2;
      var dHi = maximize ? dMax2 : -dMin2;
      objRange.push({
        index: j,
        current: c0[j],
        allowIncrease: dHi,
        allowDecrease: -dLo,
        lower: isFinite(c0[j] + dLo) ? c0[j] + dLo : -Infinity,
        upper: isFinite(c0[j] + dHi) ? c0[j] + dHi : Infinity,
        isBasic: k2 >= 0
      });
    }

    /* --- 最终表 --- */
    var finalRows = [];
    for (var r4 = 0; r4 <= m; r4++) finalRows.push(T[r4].slice(0, totalCols + 1));

    var activeConstraints = [];
    for (i = 0; i < m; i++) {
      var lhs = 0;
      for (j = 0; j < n; j++) lhs += A0[i][j] * x[j];
      activeConstraints.push({
        index: i,
        lhs: lhs,
        rhs: b0[i],
        slack: ops0[i] === '<=' ? b0[i] - lhs : (ops0[i] === '>=' ? lhs - b0[i] : 0),
        binding: approxZero(ops0[i] === '<=' ? b0[i] - lhs : lhs - b0[i])
      });
    }

    return {
      status: 'optimal',
      objective: round(z, 8),
      x: x.map(function (v) { return round(v, 8); }),
      dual: dual.map(function (v) { return round(v, 6); }),
      reducedCosts: (function () {
        var rc = [];
        for (var j2 = 0; j2 < n; j2++) rc.push(round((maximize ? 1 : -1) * T[m][j2], 6));
        return rc;
      })(),
      rhsRange: rhsRange,
      objRange: objRange,
      activeConstraints: activeConstraints,
      basis: basis.map(function (bIdx) { return colName(bIdx); }),
      basicSet: basis.slice(),
      finalTableau: { rows: finalRows, colNames: buildColNames(), width: totalCols + 1, rhsCol: rhsCol, binvBase: binvBase, totalCols: totalCols },
      log: log,
      iterations: iteration,
      tookPhase1: tookPhase1,
      maximize: maximize,
      vars: { n: n, m: m, nArt: nArt, slackBase: slackBase }
    };

    function buildColNames() {
      var names = [];
      for (var j3 = 0; j3 < totalCols; j3++) names.push(colName(j3));
      names.push('RHS');
      return names;
    }
  }

  /* ---------------------------------------------------------------------------
   * 2. 运输问题 —— 最小元素/VAM 初始解 + MODI (位势法) 最优性检验与改进
   * ------------------------------------------------------------------------- */

  function solveTransport(p) {
    var supply = p.supply.slice();
    var demand = p.demand.slice();
    var cost0 = p.cost.map(function (r) { return r.slice(); });
    var supplyNames = p.supplyNames || supply.map(function (_, i) { return 'A' + (i + 1); });
    var demandNames = p.demandNames || demand.map(function (_, j) { return 'B' + (j + 1); });

    var balS = supply.reduce(function (a, b) { return a + b; }, 0);
    var balD = demand.reduce(function (a, b) { return a + b; }, 0);
    var cost = cost0.map(function (r) { return r.slice(); });
    var addedDummy = null;

    if (Math.abs(balS - balD) > 1e-9) {
      if (balS > balD) {
        demand.push(balS - balD);
        demandNames = demandNames.concat(['虚拟需求地']);
        cost.forEach(function (r) { r.push(0); });
        addedDummy = { type: 'demand', index: demand.length - 1, amount: balS - balD };
      } else {
        supply.push(balD - balS);
        supplyNames = supplyNames.concat(['虚拟产地']);
        cost.push(new Array(demand.length).fill(0));
        addedDummy = { type: 'supply', index: supply.length - 1, amount: balD - balS };
      }
    }

    var mI = supply.length, nJ = demand.length;
    var x = zeros(mI, nJ);
    var s = supply.slice(), d = demand.slice();
    var steps = [];

    function record(phase, note) {
      steps.push({ phase: phase, note: note, alloc: x.map(function (r) { return r.slice(); }) });
    }

    /* ---- 初始基可行解：Vogel 近似法 (VAM) ---- */
    var rowOpen = new Array(mI).fill(true);
    var colOpen = new Array(nJ).fill(true);
    var penaltyOps = 0;
    while (true) {
      var openRows = [], openCols = [];
      for (var i = 0; i < mI; i++) if (rowOpen[i] && s[i] > 1e-9) openRows.push(i);
      for (var j = 0; j < nJ; j++) if (colOpen[j] && d[j] > 1e-9) openCols.push(j);
      if (!openRows.length || !openCols.length) break;

      var bestPen = -1, bestType = null, bestIdx = -1;
      var rowPen = {};
      openRows.forEach(function (r) {
        var vals = openCols.map(function (cc) { return cost[r][cc]; }).sort(function (a, b) { return a - b; });
        var pen = vals.length > 1 ? vals[1] - vals[0] : vals[0];
        rowPen[r] = pen;
        if (pen > bestPen + 1e-12) { bestPen = pen; bestType = 'row'; bestIdx = r; }
      });
      openCols.forEach(function (cc) {
        var vals = openRows.map(function (r) { return cost[r][cc]; }).sort(function (a, b) { return a - b; });
        var pen = vals.length > 1 ? vals[1] - vals[0] : vals[0];
        if (pen > bestPen + 1e-12) { bestPen = pen; bestType = 'col'; bestIdx = cc; }
      });

      var targetRow, targetCol = -1, minC = Infinity;
      if (bestType === 'row') {
        targetRow = bestIdx;
        openCols.forEach(function (cc) {
          if (cost[targetRow][cc] < minC - 1e-12) { minC = cost[targetRow][cc]; targetCol = cc; }
        });
      } else {
        targetCol = bestIdx;
        var minR = Infinity;
        openRows.forEach(function (r) {
          if (cost[r][targetCol] < minR - 1e-12) { minR = cost[r][targetCol]; targetRow = r; }
        });
        minC = minR;
      }
      var amt = Math.min(s[targetRow], d[targetCol]);
      x[targetRow][targetCol] += amt;
      s[targetRow] -= amt; d[targetCol] -= amt;
      penaltyOps++;
      if (s[targetRow] <= 1e-9) rowOpen[targetRow] = false;
      if (d[targetCol] <= 1e-9) colOpen[targetCol] = false;
      record('初始解', 'VAM：取最小成本格 (' + supplyNames[targetRow] + '→' + demandNames[targetCol] + ')，运量 ' + round(amt, 4));
    }

    /* ---- MODI 位势法迭代 ---- */
    var iter = 0;
    var optimal = false;
    var potentials = null;
    var totalCost = 0;
    var MAXIT = 200;

    while (iter < MAXIT) {
      // 计算位势
      var u = new Array(mI).fill(null);
      var v = new Array(nJ).fill(null);
      u[0] = 0;
      var changed = true, guard2 = 0;
      while (changed && guard2++ < 500) {
        changed = false;
        for (var i2 = 0; i2 < mI; i2++) {
          for (var j2 = 0; j2 < nJ; j2++) {
            if (x[i2][j2] > 1e-9) {
              if (u[i2] !== null && v[j2] === null) { v[j2] = cost[i2][j2] - u[i2]; changed = true; }
              else if (v[j2] !== null && u[i2] === null) { u[i2] = cost[i2][j2] - v[j2]; changed = true; }
            }
          }
        }
      }
      for (i2 = 0; i2 < mI; i2++) if (u[i2] === null) u[i2] = 0;
      for (j2 = 0; j2 < nJ; j2++) if (v[j2] === null) v[j2] = 0;
      potentials = { u: u, v: v };

      // 检验数
      var worst = -1e-7, wi = -1, wj = -1;
      var sigma = zeros(mI, nJ);
      for (i2 = 0; i2 < mI; i2++) {
        for (j2 = 0; j2 < nJ; j2++) {
          sigma[i2][j2] = cost[i2][j2] - u[i2] - v[j2];
          if (x[i2][j2] <= 1e-9 && sigma[i2][j2] < worst) { worst = sigma[i2][j2]; wi = i2; wj = j2; }
        }
      }
      if (wi < 0) { optimal = true; break; }

      // 闭回路调整
      var loop = findLoop(x, wi, wj, mI, nJ);
      if (!loop) { optimal = true; break; }
      var theta = Infinity;
      for (var k = 1; k < loop.length; k += 2) {
        theta = Math.min(theta, x[loop[k][0]][loop[k][1]]);
      }
      for (k = 0; k < loop.length; k++) {
        var sign = (k % 2 === 0) ? 1 : -1;
        x[loop[k][0]][loop[k][1]] += sign * theta;
      }
      // 清理退化
      for (i2 = 0; i2 < mI; i2++) for (j2 = 0; j2 < nJ; j2++) if (x[i2][j2] < 1e-9) x[i2][j2] = 0;

      iter++;
      record('MODI 迭代 ' + iter, '检验数 σ(' + supplyNames[wi] + '→' + demandNames[wj] + ') = ' + round(sigma[wi][wj], 4) + ' < 0，闭回路调整量 θ = ' + round(theta, 4));
    }

    totalCost = 0;
    for (var i3 = 0; i3 < mI; i3++) for (var j3 = 0; j3 < nJ; j3++) totalCost += x[i3][j3] * cost[i3][j3];

    // 校验供需
    var rowCheck = [], colCheck = [];
    for (i3 = 0; i3 < mI; i3++) {
      var rs = 0;
      for (j3 = 0; j3 < nJ; j3++) rs += x[i3][j3];
      rowCheck.push(rs);
    }
    for (j3 = 0; j3 < nJ; j3++) {
      var cs = 0;
      for (i3 = 0; i3 < mI; i3++) cs += x[i3][j3];
      colCheck.push(cs);
    }

    return {
      status: optimal ? 'optimal' : 'maxiter',
      allocation: x.map(function (r) { return r.map(function (v) { return round(v, 6); }); }),
      cost: cost.map(function (r) { return r.slice(); }),
      totalCost: round(totalCost, 6),
      potentials: optimal ? potentials : null,
      iterations: iter,
      steps: steps,
      balanced: Math.abs(balS - balD) < 1e-9,
      addedDummy: addedDummy,
      supplyNames: supplyNames,
      demandNames: demandNames,
      supply: supply,
      demand: demand,
      rowCheck: rowCheck,
      colCheck: colCheck,
      isOptimal: optimal
    };
  }

  /** 在基本可行解中寻找 (r,c) 的闭回路：返回顶点序列（交替 +/-） */
  function findLoop(x, r, c, mI, nJ) {
    var path = [[r, c]];
    var visited = {};
    visited[r + ',' + c] = true;
    function dfs(cr, cc, dir) {
      // dir: 0 找同行, 1 找同列
      for (var k = 0; k < (dir === 0 ? nJ : mI); k++) {
        var nr = dir === 0 ? cr : k;
        var nc = dir === 0 ? k : cc;
        if (nr === r && nc === c) {
          if (path.length >= 4 && dir === 1) return true;
          continue;
        }
        if (visited[nr + ',' + nc]) continue;
        if (x[nr][nc] <= 1e-9) continue;
        visited[nr + ',' + nc] = true;
        path.push([nr, nc]);
        if (dfs(nr, nc, 1 - dir)) return true;
        path.pop();
        visited[nr + ',' + nc] = false;
      }
      return false;
    }
    // 起点先横向、再纵向尝试
    visited[r + ',' + c] = true;
    if (dfs(r, c, 0)) return path;
    path = [[r, c]];
    visited = {}; visited[r + ',' + c] = true;
    if (dfs(r, c, 1)) return path;
    return null;
  }

  /* ---------------------------------------------------------------------------
   * 3. 指派问题 —— 匈牙利算法 (最短增广路 O(n³))
   * ------------------------------------------------------------------------- */

  function solveAssignment(cost) {
    var n0 = cost.length, m0 = cost[0].length;
    var n = Math.max(n0, m0);
    var C = zeros(n, n);
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < n; j++) C[i][j] = (i < n0 && j < m0) ? cost[i][j] : 0;
    }

    var INF = Infinity;
    var u = new Array(n + 1).fill(0);
    var v = new Array(n + 1).fill(0);
    var p = new Array(n + 1).fill(0);   // p[j] = 行号 配给列 j (1-indexed)
    var way = new Array(n + 1).fill(0);

    for (i = 1; i <= n; i++) {
      p[0] = i;
      var j0 = 0;
      var minv = new Array(n + 1).fill(INF);
      var used = new Array(n + 1).fill(false);
      do {
        used[j0] = true;
        var i0 = p[j0], delta = INF, j1 = -1;
        for (var j = 1; j <= n; j++) {
          if (used[j]) continue;
          var cur = C[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
          if (minv[j] < delta) { delta = minv[j]; j1 = j; }
        }
        for (j = 0; j <= n; j++) {
          if (used[j]) { u[p[j]] += delta; v[j] -= delta; }
          else minv[j] -= delta;
        }
        j0 = j1;
      } while (p[j0] !== 0);
      do {
        var j2 = way[j0];
        p[j0] = p[j2];
        j0 = j2;
      } while (j0);
    }

    var assign = new Array(n).fill(-1);
    var total = 0;
    for (var j3 = 1; j3 <= n; j3++) {
      if (p[j3] > 0) {
        assign[p[j3] - 1] = j3 - 1;
        total += C[p[j3] - 1][j3 - 1];
      }
    }
    // 还原原始矩阵下真实成本
    var realTotal = 0;
    for (i = 0; i < n; i++) {
      var jj = assign[i];
      if (jj >= 0 && i < n0 && jj < m0) realTotal += cost[i][jj];
    }

    return {
      status: 'optimal',
      assignment: assign,
      cost: realTotal,
      paddedCost: total,
      size: n,
      wasRectangular: n0 !== m0
    };
  }

  /* ---------------------------------------------------------------------------
   * 4. 网络优化 —— 最短路 / 最大流 / 最小费用最大流
   * ------------------------------------------------------------------------- */

  function buildAdj(n, edges, directed) {
    var adj = [];
    for (var i = 0; i < n; i++) adj.push([]);
    edges.forEach(function (e, idx) {
      adj[e.from].push({ to: e.to, w: e.w, idx: idx, cap: e.cap });
      if (!directed) adj[e.to].push({ to: e.from, w: e.w, idx: idx, cap: e.cap });
    });
    return adj;
  }

  /** Dijkstra 最短路：返回 dist 数组与路径 */
  function dijkstra(n, edges, source, directed) {
    var adj = buildAdj(n, edges, directed);
    var dist = new Array(n).fill(Infinity);
    var prev = new Array(n).fill(-1);
    var visited = new Array(n).fill(false);
    var order = [];
    dist[source] = 0;
    var pq = [{ node: source, d: 0 }];
    while (pq.length) {
      pq.sort(function (a, b) { return a.d - b.d; });
      var cur = pq.shift();
      if (visited[cur.node]) continue;
      visited[cur.node] = true;
      order.push(cur.node);
      adj[cur.node].forEach(function (e) {
        if (dist[cur.node] + e.w < dist[e.to] - 1e-9) {
          dist[e.to] = dist[cur.node] + e.w;
          prev[e.to] = cur.node;
          pq.push({ node: e.to, d: dist[e.to] });
        }
      });
    }
    return { dist: dist, prev: prev, visitOrder: order };
  }

  /** 路径还原 */
  function pathTo(prev, target) {
    var path = [];
    var cur = target;
    while (cur !== -1) { path.unshift(cur); cur = prev[cur]; }
    return path;
  }

  function floydWarshall(n, edges, directed) {
    var D = zeros(n, n), N = zeros(n, n);
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < n; j++) { D[i][j] = i === j ? 0 : Infinity; N[i][j] = i === j ? i : -1; }
    }
    edges.forEach(function (e) {
      if (e.w < D[e.from][e.to]) { D[e.from][e.to] = e.w; N[e.from][e.to] = e.from; }
      if (!directed && e.w < D[e.to][e.from]) { D[e.to][e.from] = e.w; N[e.to][e.from] = e.to; }
    });
    for (var k = 0; k < n; k++) {
      for (i = 0; i < n; i++) {
        for (j = 0; j < n; j++) {
          if (D[i][k] + D[k][j] < D[i][j] - 1e-9) {
            D[i][j] = D[i][k] + D[k][j];
            N[i][j] = N[k][j];
          }
        }
      }
    }
    return { dist: D, next: N };
  }

  /** Dinic 最大流 */
  function maxFlow(n, edges, s, t) {
    var to = [], cap = [], next = [], head = new Array(n).fill(-1);
    function addEdge(u, v, c) {
      to.push(v); cap.push(c); next.push(head[u]); head[u] = to.length - 1;
      to.push(u); cap.push(0); next.push(head[v]); head[v] = to.length - 1;
    }
    edges.forEach(function (e) { addEdge(e.from, e.to, e.cap); });

    var level = new Array(n).fill(0), it = new Array(n).fill(0);
    function bfs() {
      for (var i = 0; i < n; i++) level[i] = -1;
      var q = [s]; level[s] = 0;
      while (q.length) {
        var u = q.shift();
        for (var e = head[u]; e !== -1; e = next[e]) {
          if (cap[e] > 1e-9 && level[to[e]] < 0) {
            level[to[e]] = level[u] + 1;
            q.push(to[e]);
          }
        }
      }
      return level[t] >= 0;
    }
    function dfs(u, f) {
      if (u === t) return f;
      for (; it[u] !== -1; it[u] = next[it[u]]) {
        var e = it[u];
        if (cap[e] > 1e-9 && level[to[e]] === level[u] + 1) {
          var d = dfs(to[e], Math.min(f, cap[e]));
          if (d > 1e-9) { cap[e] -= d; cap[e ^ 1] += d; return d; }
        }
      }
      return 0;
    }
    var flow = 0;
    while (bfs()) {
      for (var i = 0; i < n; i++) it[i] = head[i];
      var f;
      while ((f = dfs(s, Infinity)) > 1e-9) flow += f;
    }
    // 抽取实际流量
    var flows = edges.map(function (e, idx) {
      return { from: e.from, to: e.to, cap: e.cap, flow: 0 };
    });
    edges.forEach(function (e, idx) {
      var eid = idx * 2;
      // 反向边残余容量即正向流量（初始为0）
      flows[idx].flow = round(cap[eid ^ 1], 8);
    });
    var minCut = [];
    for (i = 0; i < n; i++) if (level[i] >= 0) minCut.push(i);
    return { maxFlow: round(flow, 8), flows: flows, minCutS: minCut, reachable: level.slice() };
  }

  /** 最小费用最大流（SSP + SPFA） */
  function minCostMaxFlow(n, edges, s, t, targetFlow) {
    var to = [], cap = [], cost = [], next = [], head = new Array(n).fill(-1);
    function addEdge(u, v, c, w) {
      to.push(v); cap.push(c); cost.push(w); next.push(head[u]); head[u] = to.length - 1;
      to.push(u); cap.push(0); cost.push(-w); next.push(head[v]); head[v] = to.length - 1;
    }
    edges.forEach(function (e) { addEdge(e.from, e.to, e.cap, e.cost); });

    var flow = 0, totalCost = 0;
    var augmentations = [];
    while (true) {
      if (targetFlow !== undefined && flow >= targetFlow - 1e-9) break;
      var dist = new Array(n).fill(Infinity), inq = new Array(n).fill(false), pe = new Array(n).fill(-1);
      dist[s] = 0;
      var q = [s]; inq[s] = true;
      while (q.length) {
        var u = q.shift(); inq[u] = false;
        for (var e = head[u]; e !== -1; e = next[e]) {
          if (cap[e] > 1e-9 && dist[u] + cost[e] < dist[to[e]] - 1e-9) {
            dist[to[e]] = dist[u] + cost[e];
            pe[to[e]] = e;
            if (!inq[to[e]]) { inq[to[e]] = true; q.push(to[e]); }
          }
        }
      }
      if (dist[t] === Infinity) break;
      var push = Infinity, v = t;
      while (v !== s) { var ee = pe[v]; push = Math.min(push, cap[ee]); v = to[ee ^ 1]; }
      if (targetFlow !== undefined) push = Math.min(push, targetFlow - flow);
      v = t;
      while (v !== s) { var e2 = pe[v]; cap[e2] -= push; cap[e2 ^ 1] += push; v = to[e2 ^ 1]; }
      flow += push;
      totalCost += push * dist[t];
      augmentations.push({ path: tracePath(pe, s, t, to), amount: round(push, 6), unitCost: round(dist[t], 6) });
    }
    function tracePath(pe, s, t, to) {
      var path = [], v = t;
      while (v !== s) { path.unshift(v); var e = pe[v]; v = to[e ^ 1]; }
      path.unshift(s);
      return path;
    }
    var flows = edges.map(function (e, idx) {
      return { from: e.from, to: e.to, cap: e.cap, cost: e.cost, flow: round(cap[idx * 2 ^ 1], 8) };
    });
    return { maxFlow: round(flow, 8), minCost: round(totalCost, 8), flows: flows, augmentations: augmentations };
  }

  /* ---------------------------------------------------------------------------
   * 7. 设施选址 —— 0-1 混合整数规划 · 分支定界
   * ------------------------------------------------------------------------- */

  /**
   * 求解带容量约束的设施选址问题（需求可分割）。
   *   p.demand    每个客户的需求量 d[i]
   *   p.fixed     每个候选设施的固定建设成本 f[j]
   *   p.capacity  每个候选设施的服务能力 cap[j]
   *   p.cost      客户 i 由设施 j 服务的单位运输成本 c[i][j]
   *   p.openK     可选：最多建设数量（不传则不限）
   * @returns {Object} 最优方案、分支定界搜索统计与下界
   */
  function solveFacility(p) {
    var demand = p.demand.slice();
    var fixed = p.fixed.slice();
    var cap = p.capacity.slice();
    var cost = p.cost.map(function (r) { return r.slice(); });
    var nC = demand.length, nF = fixed.length;
    var openK = p.openK || Infinity;
    if (!nC || !nF) return { status: 'error', message: '模型为空' };

    var totalDemand = demand.reduce(function (a, b) { return a + b; }, 0);
    var totalCap = cap.reduce(function (a, b) { return a + b; }, 0);

    /* --- 分配子问题：给定已建设施集合，按单位成本全局升序贪心分配 ---
     * 需求可分割时，每个「需求单位」独立选择当前最便宜且有剩余容量的设施，
     * 因此全局按成本排序后依次分配即为该子问题的最优解。 */
    function allocate(openSet) {
      var remD = demand.slice();
      var remC = new Array(nF).fill(0);
      openSet.forEach(function (j) { remC[j] = cap[j]; });
      var ship = [];
      for (var i = 0; i < nC; i++) ship.push(new Array(nF).fill(0));
      var pairs = [];
      for (i = 0; i < nC; i++) {
        openSet.forEach(function (j) { pairs.push({ i: i, j: j, c: cost[i][j] }); });
      }
      pairs.sort(function (a, b) { return a.c - b.c; });
      var varCost = 0, done = 0;
      for (var k = 0; k < pairs.length; k++) {
        var pr = pairs[k];
        var q = Math.min(remD[pr.i], remC[pr.j]);
        if (q <= 1e-9) continue;
        ship[pr.i][pr.j] += q;
        remD[pr.i] -= q; remC[pr.j] -= q;
        varCost += q * pr.c; done += q;
      }
      if (Math.abs(done - totalDemand) > 1e-6) return null;
      /* 诊断：各客户的实际服务设施与到货成本 */
      var assign = [];
      for (i = 0; i < nC; i++) {
        var bestJ = -1, bestQ = 0;
        openSet.forEach(function (j) { if (ship[i][j] > bestQ) { bestQ = ship[i][j]; bestJ = j; } });
        assign.push({ customer: i, facility: bestJ, qty: round(bestQ, 4), unitCost: bestJ >= 0 ? cost[i][bestJ] : 0 });
      }
      return { ship: ship, varCost: round(varCost, 6), assign: assign };
    }

    /* --- 理想下界：忽略容量约束、所有设施均可建 --- */
    var idealVar = 0;
    for (var i2 = 0; i2 < nC; i2++) {
      var minC = Math.min.apply(null, cost[i2]);
      idealVar += demand[i2] * minC;
    }
    var lowerBound = round(idealVar, 6);

    /* --- 分支定界 --- */
    var best = null;
    var nodesVisited = 0;
    var trace = [];
    var decision = new Array(nF).fill(0);

    /* 预处理：每个客户按成本升序的设施索引，用于快速下界 */
    var sortedByCost = [];
    for (var i3 = 0; i3 < nC; i3++) {
      var order = [];
      for (var j3 = 0; j3 < nF; j3++) order.push(j3);
      order.sort(function (a, b) { return cost[i3][a] - cost[i3][b]; });
      sortedByCost.push(order);
    }

    function bound(decided, openList) {
      /* 已确定的固定成本 */
      var f = 0;
      openList.forEach(function (j) { f += fixed[j]; });

      /* 运输成本下界：每个客户取「已建或待定」设施中的最小单位成本（忽略容量） */
      var varPart = 0;
      for (var i = 0; i < nC; i++) {
        var mc = Infinity;
        for (var t = 0; t < nF; t++) {
          if (decided[t] === -1) continue;              // 已明确不建
          if (cost[i][t] < mc) mc = cost[i][t];         // 已建 或 待定
        }
        if (!isFinite(mc)) return Infinity;
        varPart += demand[i] * mc;
      }

      /* 固定成本下界：按容量缺口推出「至少还要建几个」，取其最小固定成本之和。
       * 这是一个松弛（假设已建容量可服务所有客户、且能挑最便宜的补建），
       * 因此仍是合法下界，但比只算已建固定成本紧得多。 */
      var builtCap = 0;
      openList.forEach(function (j) { builtCap += cap[j]; });
      var remain = totalDemand - builtCap;
      var fixedLB = 0;
      if (remain > 1e-9) {
        var pend = [];
        for (var q = 0; q < nF; q++) if (decided[q] === 0) pend.push(q);
        pend.sort(function (a, b) { return cap[b] - cap[a]; });
        var need = 0, acc = 0;
        while (acc < remain - 1e-9 && need < pend.length) { acc += cap[pend[need]]; need++; }
        var fSorted = pend.map(function (j) { return fixed[j]; }).sort(function (a, b) { return a - b; });
        for (var k = 0; k < need && k < fSorted.length; k++) fixedLB += fSorted[k];
      }
      return f + fixedLB + varPart;
    }

    function recurse(k, chosen, costSoFar) {
      nodesVisited++;
      if (chosen.length > openK) return;
      var lb = bound(decision, chosen);
      if (best && lb >= best.totalCost - 1e-9) {
        trace.push({ depth: k, action: 'prune', bound: round(lb, 3), best: round(best.totalCost, 3) });
        return;
      }
      if (k === nF) {
        var res = allocate(chosen);
        if (!res) return;
        var fixedCost = chosen.reduce(function (a, j) { return a + fixed[j]; }, 0);
        var total = fixedCost + res.varCost;
        if (!best || total < best.totalCost - 1e-9) {
          best = {
            open: chosen.slice(), fixedCost: round(fixedCost, 6),
            varCost: round(res.varCost, 6), totalCost: round(total, 6),
            ship: res.ship, assign: res.assign
          };
          trace.push({ depth: k, action: 'improve', value: round(total, 3) });
        }
        return;
      }
      /* 分支一：建 k */
      decision[k] = 1;
      recurse(k + 1, chosen.concat([k]), costSoFar + fixed[k]);
      decision[k] = 0;
      /* 分支二：不建 k */
      decision[k] = -1;
      recurse(k + 1, chosen, costSoFar);
      decision[k] = 0;
    }

    recurse(0, [], 0);

    if (!best) {
      return {
        status: 'infeasible',
        message: '候选设施总容量 ' + round(totalCap, 2) + ' 不足以覆盖总需求 ' + round(totalDemand, 2) +
          (isFinite(openK) ? '，或受最多建设数量 ' + openK + ' 的限制' : ''),
        lowerBound: lowerBound, nodesVisited: nodesVisited
      };
    }

    var gap = best.totalCost > 1e-9 ? (best.totalCost - lowerBound) / best.totalCost : 0;
    return {
      status: 'optimal',
      best: best,
      lowerBound: lowerBound,
      gap: round(gap, 6),
      nodesVisited: nodesVisited,
      nodesTotal: Math.pow(2, nF + 1) - 1,
      exploredRate: round(nodesVisited / (Math.pow(2, nF + 1) - 1), 4),
      trace: trace,
      totalDemand: round(totalDemand, 4),
      totalCapacity: round(totalCap, 4),
      model: 'min Σ fⱼyⱼ + Σ cᵢⱼdᵢxᵢⱼ'
    };
  }

  /* ---------------------------------------------------------------------------
   * 导出
   * ------------------------------------------------------------------------- */
  OR.util = { zeros: zeros, clone: clone, round: round, EPS: EPS };
  OR.solveLP = solveLP;
  OR.solveTransport = solveTransport;
  OR.solveAssignment = solveAssignment;
  OR.solveFacility = solveFacility;
  OR.network = {
    dijkstra: dijkstra,
    pathTo: pathTo,
    floydWarshall: floydWarshall,
    maxFlow: maxFlow,
    minCostMaxFlow: minCostMaxFlow,
    buildAdj: buildAdj
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = OR;

})(typeof window !== 'undefined' ? window : globalThis);
