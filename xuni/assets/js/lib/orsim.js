/* =============================================================================
 * OR-SimLab · 仿真引擎 (Simulation Engine)
 * -----------------------------------------------------------------------------
 * 覆盖：生灭过程排队论解析解(M/M/1、M/M/1/K、M/M/c、M/M/c/K)、M/G/1(P-K 公式)、
 *      离散事件排队仿真(DES)、库存模型(EOQ/EPQ/折扣/报童/(Q,R)仿真)、
 *      蒙特卡洛与风险度量(VaR/CVaR)、网络计划(PERT/CPM)、动态规划。
 * 所有随机过程均使用可复现的伪随机数发生器，保证教学演示结果可重复。
 * ========================================================================== */
(function (global) {
  'use strict';

  var OR = global.OR = global.OR || {};
  var round = function (x, d) { var p = Math.pow(10, d === undefined ? 6 : d); return Math.round(x * p) / p; };

  /* ===========================================================================
   * A. 随机数发生器
   * ======================================================================== */

  function rng(seed) {
    var s = (seed === undefined ? 20261017 : seed) >>> 0;
    return function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeDist(rand) {
    function uniform(a, b) { return a + (b - a) * rand(); }
    function exp(rate) { return -Math.log(1 - rand()) / rate; }
    function normal(mu, sigma) {
      var u1 = rand() || 1e-12, u2 = rand();
      return mu + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }
    function lognormal(mu, sigma) { return Math.exp(normal(mu, sigma)); }
    function triangular(a, m, b) {
      var u = rand(), c = (m - a) / (b - a);
      return u < c ? a + Math.sqrt(u * (b - a) * (m - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - m));
    }
    function erlang(k, rate) { // k 阶爱尔朗，均值 k/rate
      var s = 0;
      for (var i = 0; i < k; i++) s += exp(rate);
      return s;
    }
    function weibull(scale, shape) { return scale * Math.pow(-Math.log(1 - rand()), 1 / shape); }
    return { uniform: uniform, exp: exp, normal: normal, lognormal: lognormal, triangular: triangular, erlang: erlang, weibull: weibull, raw: rand };
  }

  /** 按类型采样 */
  function sampleDist(dist, rand) {
    var D = makeDist(rand);
    switch (dist.type) {
      case 'exponential': return D.exp(dist.rate !== undefined ? dist.rate : 1 / dist.mean);
      case 'deterministic': return dist.value !== undefined ? dist.value : dist.mean;
      case 'uniform': return D.uniform(dist.min, dist.max);
      case 'normal': return Math.max(1e-6, D.normal(dist.mean, dist.sd));
      case 'lognormal': return D.lognormal(dist.mu, dist.sigma);
      case 'triangular': return D.triangular(dist.min, dist.mode, dist.max);
      case 'erlang': return D.erlang(dist.k, dist.k / dist.mean);
      case 'weibull': return D.weibull(dist.scale, dist.shape);
      default: return dist.mean || 1;
    }
  }

  function distMoments(dist) {
    switch (dist.type) {
      case 'exponential': { var m = dist.mean !== undefined ? dist.mean : 1 / dist.rate; return { mean: m, variance: m * m }; }
      case 'deterministic': { var v = dist.value !== undefined ? dist.value : dist.mean; return { mean: v, variance: 0 }; }
      case 'uniform': { var mn = dist.min, mx = dist.max; return { mean: (mn + mx) / 2, variance: Math.pow(mx - mn, 2) / 12 }; }
      case 'normal': return { mean: dist.mean, variance: dist.sd * dist.sd };
      case 'lognormal': { var mu = dist.mu, sg = dist.sigma; var mn2 = Math.exp(mu + sg * sg / 2); return { mean: mn2, variance: (Math.exp(sg * sg) - 1) * Math.exp(2 * mu + sg * sg) }; }
      case 'triangular': { var a = dist.min, b = dist.max, c2 = dist.mode; return { mean: (a + b + c2) / 3, variance: (a * a + b * b + c2 * c2 - a * b - a * c2 - b * c2) / 18 }; }
      case 'erlang': return { mean: dist.mean, variance: dist.mean * dist.mean / dist.k };
      case 'weibull': { var G = function (x) { return gammaFn(x); }; return { mean: dist.scale * G(1 + 1 / dist.shape), variance: Math.pow(dist.scale, 2) * (G(1 + 2 / dist.shape) - Math.pow(G(1 + 1 / dist.shape), 2)) }; }
      default: return { mean: dist.mean || 1, variance: 0 };
    }
  }

  function gammaFn(z) { // Lanczos 近似
    var g = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
      12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gammaFn(1 - z));
    z -= 1;
    var x = 0.99999999999980993;
    for (var i = 0; i < g.length; i++) x += g[i] / (z + i + 1);
    var t = z + g.length - 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }

  /* ===========================================================================
   * B. 排队论 —— 生灭过程统一解析解
   * ======================================================================== */

  /**
   * 通用 M/M/c/K 解析解（K = Infinity 时自动截断）
   * @param {number} lambda 到达率
   * @param {number} mu     单服务台服务率
   * @param {number} c      服务台数
   * @param {number} K      系统容量（含正在服务的），Infinity 表示不限
   */
  function queueMMcK(lambda, mu, c, K) {
    var infinite = !isFinite(K);
    var N = infinite ? Math.max(2000, Math.ceil(c * 40 + 400)) : K;
    if (N > 20000) N = 20000;

    var rho = lambda / (c * mu);            // 服务强度
    var a = lambda / mu;                    // 提供的负载
    var pi = new Array(N + 1).fill(0);
    var i;

    if (!infinite && rho > 1 - 1e-12) {
      // 有限容量下即使 ρ>1 也稳定，用递推
    } else if (infinite && rho >= 1 - 1e-12) {
      return { stable: false, reason: '系统不稳定：λ ≥ cμ，队长将无限增长', rho: rho, offeredLoad: a, servers: c, capacity: K };
    }

    // π_n 递推
    pi[0] = 1;
    var cum = 1;
    for (i = 1; i <= N; i++) {
      var muN = Math.min(i, c) * mu;
      pi[i] = pi[i - 1] * lambda / muN;
      cum += pi[i];
      if (infinite && i > c * 6 && pi[i] < 1e-15 * cum) { N = i; break; }
    }
    if (N < (infinite ? 20 : K)) N = infinite ? Math.max(20, c * 6) : K;
    for (i = 0; i <= N; i++) pi[i] /= cum;

    function sum(f) { var s = 0; for (var k = 0; k <= N; k++) s += f(k, pi[k]); return s; }

    var L = sum(function (n, p) { return n * p; });
    var Lq = sum(function (n, p) { return Math.max(0, n - c) * p; });
    var P0 = pi[0];
    var Pw = sum(function (n, p) { return n >= c ? p : 0; });               // 等待概率
    var Peff = lambda * sum(function (n, p) { return n < N ? p : 0; });     // 有效到达率
    var lambdaEff = Peff;
    var W = lambdaEff > 1e-12 ? L / lambdaEff : 0;
    var Wq = lambdaEff > 1e-12 ? Lq / lambdaEff : 0;
    var Pk = !infinite ? pi[N] : 0;                                        // 损失概率

    var dist = [];
    var step = Math.max(1, Math.floor(N / 30));
    for (i = 0; i <= Math.min(N, c + 30); i++) dist.push({ n: i, p: pi[i] });

    return {
      stable: true, model: 'M/M/' + c + (infinite ? '' : '/' + K),
      lambda: lambda, mu: mu, servers: c, capacity: K,
      rho: round(rho, 8), offeredLoad: round(a, 8), P0: round(P0, 8),
      L: round(L, 6), Lq: round(Lq, 6), W: round(W, 6), Wq: round(Wq, 6),
      Pwait: round(Pw, 6), Pk: round(Pk, 6), lambdaEff: round(lambdaEff, 6),
      utilization: round(Math.min(1, a / c), 6),
      distribution: dist,
      formula: buildQueueFormula(c, infinite, K)
    };
  }

  function buildQueueFormula(c, infinite, K) {
    var cap = infinite ? '' : '/' + K;
    var base = [
      '系统服务强度 ρ = λ / (c·μ)',
      '空闲概率 P₀ = [ Σ<sub>n=0</sub><sup>c-1</sup> (λ/μ)ⁿ/n! + (λ/μ)ᶜ/(c!(1-ρ)) ]⁻¹   （ρ<1）',
      '平均队长 L = Lq + λ/μ',
      '平均排队长 Lq = P₀·(λ/μ)ᶜ·ρ / (c!·(1-ρ)²)',
      'Little 定律：L = λW，Lq = λWq，W = Wq + 1/μ'
    ];
    if (c === 1 && infinite) {
      base = ['服务强度 ρ = λ/μ （要求 ρ<1）',
        'L = ρ/(1-ρ)',
        'Lq = ρ²/(1-ρ)',
        'W = 1/(μ-λ)',
        'Wq = ρ/(μ-λ)',
        'P₀ = 1-ρ，Pₙ = (1-ρ)ρⁿ'];
    }
    if (!infinite) {
      base = ['容量 K' + cap + '，采用生灭过程稳态递推：πₙ = π₀·∏(λᵢ₋₁/μᵢ)',
        '有效到达率 λₑ = λ·(1-P_K)，P_K 为系统满员损失概率',
        '服务强度 ρ = λ/(c·μ)，有限容量下即使 ρ≥1 系统仍存在稳态'];
    }
    return base;
  }

  /** M/G/1 —— Pollaczek–Khinchine 公式 */
  function queueMG1(lambda, meanService, sdService) {
    var rho = lambda * meanService;
    if (rho >= 1) return { stable: false, rho: rho, reason: 'ρ ≥ 1，系统不稳定' };
    var ES2 = sdService * sdService + meanService * meanService;
    var Lq = (Math.pow(lambda, 2) * ES2) / (2 * (1 - rho));
    var Wq = Lq / lambda;
    var W = Wq + meanService;
    var L = lambda * W;
    var rhoSq = rho * rho;
    return {
      stable: true, model: 'M/G/1', rho: round(rho, 8),
      L: round(L, 6), Lq: round(Lq, 6), W: round(W, 6), Wq: round(Wq, 6),
      utilization: round(rho, 6), P0: round(1 - rho, 6),
      formula: ['Pollaczek–Khinchine 公式：Lq = (λ²σ² + ρ²) / (2(1-ρ))',
        'Wq = Lq/λ，W = Wq + E[S]，L = λW',
        'M/D/1 特例（σ=0）：Lq = ρ²/(2(1-ρ))',
        'M/M/1 特例（σ=1/μ）：Lq = ρ²/(1-ρ)']
    };
  }

  /* ===========================================================================
   * C. 离散事件排队仿真 (Discrete Event Simulation)
   * ======================================================================== */

  function MinHeap() { this.a = []; }
  MinHeap.prototype.push = function (item) {
    var a = this.a; a.push(item); var i = a.length - 1;
    while (i > 0) { var p = (i - 1) >> 1; if (a[p].time <= a[i].time) break; var t = a[p]; a[p] = a[i]; a[i] = t; i = p; }
  };
  MinHeap.prototype.pop = function () {
    var a = this.a; if (!a.length) return null;
    var top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last; var i = 0, n = a.length;
      while (true) {
        var l = 2 * i + 1, r = 2 * i + 2, m = i;
        if (l < n && a[l].time < a[m].time) m = l;
        if (r < n && a[r].time < a[m].time) m = r;
        if (m === i) break; var t = a[m]; a[m] = a[i]; a[i] = t; i = m;
      }
    }
    return top;
  };
  MinHeap.prototype.size = function () { return this.a.length; };

  /**
   * 通用排队系统离散事件仿真
   * @param {Object} cfg
   *   cfg.arrivalDist  到达间隔分布 {type, mean/rate/...}
   *   cfg.serviceDist  服务时间分布
   *   cfg.servers      服务台数量 c
   *   cfg.capacity     系统容量（Infinity 不限）
   *   cfg.duration     仿真时长
   *   cfg.warmup       预热时长（统计时剔除）
   *   cfg.seed         随机种子
   *   cfg.maxEvents    事件上限
   */
  function simulateQueue(cfg) {
    var rand = rng(cfg.seed === undefined ? 20261017 : cfg.seed);
    var servers = cfg.servers || 1;
    var capacity = cfg.capacity === undefined ? Infinity : cfg.capacity;
    var duration = cfg.duration || 1000;
    var warmup = cfg.warmup || 0;
    var maxEvents = cfg.maxEvents || 3000000;

    /* 服务台调度：serverFreeAt[s] 为第 s 台服务台的下一空闲时刻，
     * freeHeap 为惰性删除的最小堆（顶部条目过期则丢弃）。 */
    var serverFreeAt = new Array(servers).fill(0);
    var freeHeap = new MinHeap();
    for (var s = 0; s < servers; s++) freeHeap.push({ time: 0, server: s });

    function acquire(t) {
      while (freeHeap.size()) {
        var top = freeHeap.pop();
        if (serverFreeAt[top.server] !== top.time) continue;   // 过期条目，丢弃
        if (top.time > t + 1e-12) { freeHeap.push(top); return -1; }
        return { server: top.server, idleSince: top.time };
      }
      return -1;
    }
    function occupy(server, t, serviceTime) {
      serverFreeAt[server] = t + serviceTime;
      freeHeap.push({ time: t + serviceTime, server: server });
    }
    function countBusy(t) {
      var n = 0;
      for (var i = 0; i < servers; i++) if (serverFreeAt[i] > t + 1e-12) n++;
      return n;
    }

    var waiting = [];                       // FIFO 队列 {arrivalTime}
    var evHeap = new MinHeap();
    var t = 0;
    evHeap.push({ time: sampleDist(cfg.arrivalDist, rand), type: 'arrival' });

    var stats = {
      arrivals: 0, served: 0, balked: 0, foundBusy: 0, waits: [], sojourns: [],
      busyTime: 0, maxQueue: 0, areaQueue: 0, areaSystem: 0
    };
    var series = [];
    var sampleStep = duration / 240;
    var nextSample = 0;
    var samples = 0;
    var events = 0;
    var lastT = 0;
    var timeline = [];
    var recordTimeline = cfg.recordTimeline !== false;

    function note(entry) { if (recordTimeline && timeline.length < 6000) timeline.push(entry); }

    while (evHeap.size() && t < duration && events < maxEvents) {
      var ev = evHeap.pop();
      if (ev.time > duration) break;
      t = ev.time;
      events++;

      // 时间加权面积（用于计算平均队长，比抽样更精确）
      var dt = t - lastT;
      if (dt > 0) { stats.areaQueue += waiting.length * dt; stats.areaSystem += (waiting.length + countBusy(lastT)) * dt; }
      lastT = t;

      if (ev.type === 'arrival') {
        stats.arrivals++;
        if (capacity !== Infinity && waiting.length + countBusy(t) >= capacity) {
          stats.balked++;
          note({ t: round(t, 4), type: 'balk', queue: waiting.length });
        } else {
          var got = acquire(t);
          if (got !== -1) {
            var st = sampleDist(cfg.serviceDist, rand);
            occupy(got.server, t, st);
            stats.busyTime += st;
            if (t >= warmup) { stats.waits.push(0); stats.sojourns.push(st); }
            note({ t: round(t, 4), type: 'enter', server: got.server, queue: waiting.length, waited: 0 });
            evHeap.push({ time: t + st, type: 'departure', server: got.server });
          } else {
            stats.foundBusy++;
            waiting.push({ arrivalTime: t });
            if (waiting.length > stats.maxQueue) stats.maxQueue = waiting.length;
            note({ t: round(t, 4), type: 'wait', queue: waiting.length });
          }
        }
        var nextA = t + sampleDist(cfg.arrivalDist, rand);
        if (nextA <= duration) evHeap.push({ time: nextA, type: 'arrival' });
      } else {
        stats.served++;
        if (waiting.length) {
          var nx = waiting.shift();
          var wait = Math.max(0, t - nx.arrivalTime);
          var st2 = sampleDist(cfg.serviceDist, rand);
          occupy(ev.server, t, st2);
          stats.busyTime += st2;
          if (t >= warmup) { stats.waits.push(wait); stats.sojourns.push(wait + st2); }
          note({ t: round(t, 4), type: 'enter', server: ev.server, queue: waiting.length, waited: round(wait, 4) });
          evHeap.push({ time: t + st2, type: 'departure', server: ev.server });
        } else {
          note({ t: round(t, 4), type: 'idle', server: ev.server, queue: 0 });
        }
      }

      if (t >= nextSample) {
        var busyNow = countBusy(t);
        series.push({ t: round(t, 4), queue: waiting.length, inService: busyNow, inSystem: waiting.length + busyNow });
        samples++;
        nextSample = t + sampleStep;
      }
    }

    var tEnd = Math.min(t, duration);
    var nW = stats.waits.length;
    var meanWait = nW ? stats.waits.reduce(function (a, b) { return a + b; }, 0) / nW : 0;
    var meanSojourn = nW ? stats.sojourns.reduce(function (a, b) { return a + b; }, 0) / nW : 0;
    var varWait = nW > 1 ? stats.waits.reduce(function (a, b) { return a + Math.pow(b - meanWait, 2); }, 0) / (nW - 1) : 0;
    var effTime = Math.max(1e-9, tEnd);
    var util = stats.busyTime / (servers * effTime);
    var pWait = stats.arrivals > 0 ? stats.foundBusy / stats.arrivals : 0;
    var sortedW = stats.waits.slice().sort(function (a, b) { return a - b; });
    var p95 = sortedW.length ? quantile(sortedW, 0.95) : 0;
    var p50 = sortedW.length ? quantile(sortedW, 0.50) : 0;

    var done = nW || 1;
    return {
      model: 'DES',
      series: series,
      timeline: timeline.slice(0, 4000),
      stats: {
        arrivals: stats.arrivals, served: stats.served, balked: stats.balked,
        completed: nW,
        meanWait: round(meanWait, 6), meanSojourn: round(meanSojourn, 6),
        sdWait: round(Math.sqrt(varWait), 6),
        utilisation: round(Math.min(1, util), 6),
        pWait: round(pWait, 6),
        p50Wait: round(p50, 6), p95Wait: round(p95, 6),
        maxQueue: stats.maxQueue,
        meanQueueLen: round(stats.areaQueue / effTime, 6),
        meanInSystem: round(stats.areaSystem / effTime, 6),
        throughput: round(stats.served / effTime, 6),
        ci95: round(1.96 * Math.sqrt(varWait / done), 6),
        simTime: round(tEnd, 4)
      }
    };
  }

  /* ===========================================================================
   * D. 库存模型
   * ======================================================================== */

  /** 经济订货批量 EOQ */
  function eoq(p) {
    var D = p.demand, S = p.orderCost, H = p.holdingCost;
    if (H <= 0) H = (p.unitCost || 0) * (p.holdingRate || 0.2);
    if (D <= 0 || S < 0 || H <= 0) return { error: '参数不合法' };
    var Q = Math.sqrt(2 * D * S / H);
    var ordersPerYear = D / Q;
    var cycleDays = (p.daysPerYear || 365) / ordersPerYear;
    var holding = Q / 2 * H;
    var ordering = D / Q * S;
    var purchase = D * (p.unitCost || 0);
    return {
      Q: round(Q, 4), ordersPerYear: round(ordersPerYear, 4), cycleDays: round(cycleDays, 4),
      holdingCost: round(holding, 4), orderingCost: round(ordering, 4),
      totalVariable: round(holding + ordering, 4), purchaseCost: round(purchase, 4),
      totalCost: round(holding + ordering + purchase, 4),
      reorderPoint: round(D * (p.leadTime || 0) / (p.daysPerYear || 365), 4),
      sensitivity: [0.5, 0.8, 1, 1.2, 1.5, 2].map(function (k) {
        var q2 = Q * k, h2 = q2 / 2 * H, o2 = D / q2 * S;
        return { multiple: k, Q: round(q2, 2), cost: round(h2 + o2, 2), costRatio: round((h2 + o2) / (holding + ordering), 4) };
      }),
      formula: [
        'Q* = √(2DS / H)',
        '年订货次数 N* = D / Q*',
        'TC* = √(2DSH) + D·C',
        '总成本曲线在 Q* 处平坦：Q 偏离 ±20%，成本仅上升约 1.7%'
      ]
    };
  }

  /** 经济生产批量 EPQ */
  function epq(p) {
    var D = p.demand, S = p.orderCost, H = p.holdingCost, P = p.productionRate;
    if (P <= D) return { error: '生产率必须大于需求率' };
    var Q = Math.sqrt(2 * D * S / (H * (1 - D / P)));
    var T = Q / D;
    var maxInv = Q * (1 - D / P);
    return {
      Q: round(Q, 4), maxInventory: round(maxInv, 4), cycleLength: round(T, 4),
      avgInventory: round(maxInv / 2, 4),
      holdingCost: round(maxInv / 2 * H, 4), setupCost: round(D / Q * S, 4),
      totalVariable: round(maxInv / 2 * H + D / Q * S, 4),
      productionDays: round(Q / P, 4), pureDemandDays: round(maxInv / D, 4),
      formula: ['Q* = √(2DS / (H(1 - d/p)))', '最大库存 Imax = Q*(1 - d/p)', '平均库存 = Imax/2']
    };
  }

  /** 允许缺货的 EOQ */
  function eoqBackorder(p) {
    var D = p.demand, S = p.orderCost, H = p.holdingCost, B = p.backorderCost;
    var Q = Math.sqrt(2 * D * S / H * (H + B) / B);
    var Smax = Q * H / (H + B);
    return {
      Q: round(Q, 4), maxBackorder: round(Q - Smax, 4), maxInventory: round(Smax, 4),
      totalCost: round((Smax * Smax * H + Math.pow(Q - Smax, 2) * B) / (2 * Q) + D / Q * S, 4),
      compareNoShortage: round(Math.sqrt(2 * D * S * H), 4),
      formula: ['Q* = √(2DS/H · (H+B)/B)', '最大缺货量 = Q*·H/(H+B)', '允许缺货可降低总成本，但降低服务水平']
    };
  }

  /** 数量折扣模型 */
  function quantityDiscount(p) {
    var D = p.demand, S = p.orderCost, Hr = p.holdingRate;
    var breaks = p.breaks.slice().sort(function (a, b) { return a.minQty - b.minQty; });
    var results = [];
    for (var i = 0; i < breaks.length; i++) {
      var b = breaks[i];
      var H = b.price * Hr;
      var Q0 = Math.sqrt(2 * D * S / H);
      var upper = i + 1 < breaks.length ? breaks[i + 1].minQty : Infinity;
      // 若 EOQ 落在本区间内 → 采用 EOQ；否则退到本区间下界（区间内成本单调）
      var feasible = Q0 >= b.minQty && Q0 < upper;
      var Q = Q0 >= b.minQty ? Q0 : b.minQty;
      var cost = D * b.price + D / Q * S + Q / 2 * H;
      results.push({
        tier: i + 1, price: b.price, minQty: b.minQty, eoq: round(Q0, 2),
        adoptedQ: round(Q, 2), feasible: feasible,
        purchase: round(D * b.price, 2), holding: round(Q / 2 * H, 2), ordering: round(D / Q * S, 2),
        total: round(cost, 2)
      });
    }
    results.sort(function (a, b) { return a.total - b.total; });
    var best = results[0];
    return { options: results, best: best, formula: ['按价格区间分别求 EOQ，取落在该区间内的可行解', '不可行时取区间下界，再比较各方案总成本', '折扣带来的单价下降常可覆盖库存成本上升'] };
  }

  /** 报童模型（正态需求）—— 临界分位数法 */
  function newsvendor(p) {
    var Cu = p.underageCost, Co = p.overageCost;
    var CR = Cu / (Cu + Co);
    var q;
    if (p.demandType === 'discrete' && p.demandTable) {
      // 离散需求累积分布
      var cum = 0, table = p.demandTable.slice().sort(function (a, b) { return a.d - b.d; });
      q = table[table.length - 1].d;
      for (var i = 0; i < table.length; i++) {
        cum += table[i].p;
        if (cum >= CR - 1e-12) { q = table[i].d; break; }
      }
      var ev = 0;
      table.forEach(function (row) {
        ev += row.p * (Cu * Math.min(q, row.d) - Co * Math.max(0, q - row.d));
      });
      return {
        criticalRatio: round(CR, 6), orderQty: q, expectedProfit: round(ev, 4),
        demandType: 'discrete', table: table.map(function (r) { return { d: r.d, p: r.p, cum: round(r.p, 6) }; }),
        formula: ['临界比 CR = Cu / (Cu + Co)', '最优订货量 Q* = F⁻¹(CR)，F 为需求累积分布', 'Cu = 缺货成本（少订一件的机会损失），Co = 过剩成本（多订一件的处置损失）']
      };
    }
    var mu = p.mean, sd = p.sd;
    q = mu + sd * probit(CR);
    var z = (q - mu) / sd;
    var phi = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
    var expectedProfit = (p.price - p.cost) * mu - (p.cost - p.salvage) * sd * phi - (p.price - p.cost + (p.cost - p.salvage) * (1 - CR)) * 0; // 简化：使用标准报童公式
    // 标准报童期望利润：E[π] = (p-c)μ - (p-s)σ·φ(z) ... 使用 (p-v) 与 (c-v) 分解
    var p_ = p.price, c_ = p.cost, v_ = p.salvage === undefined ? 0 : p.salvage;
    expectedProfit = (p_ - v_) * mu - (p_ - c_) * 0 - (p_ - v_) * sd * phi - (c_ - v_) * q;
    expectedProfit = (p_ - c_) * q - (p_ - v_) * (q - mu) - (p_ - v_) * sd * phi - (c_ - v_) * 0;
    // 采用经典形式： E[π(Q)] = (p-v)·E[min(Q,D)] - (c-v)·Q
    var Emin = q - sd * phi - (q - mu) * (1 - normCdf(z));
    expectedProfit = (p_ - v_) * Emin - (c_ - v_) * q;

    return {
      criticalRatio: round(CR, 6), orderQty: round(q, 4), z: round(z, 4),
      expectedShortage: round(sd * phi - (q - mu) * normCdf(-z), 4),
      fillRate: round(1 - (sd * phi - (q - mu) * normCdf(-z)) / mu, 6),
      expectedProfit: round(expectedProfit, 4),
      expectedSales: round(Emin, 4),
      serviceLevel: round(CR, 6),
      demandType: 'continuous',
      curve: buildNewsCurve(Cu, Co, mu, sd, p_),
      formula: [
        '临界比 CR = Cu / (Cu + Co)' + (Cu === p_ - c_ && Co === c_ - v_ ? ' = (p-c) / (p-v)' : ''),
        'Q* = μ + z·σ，其中 z = Φ⁻¹(CR)',
        '期望利润 E[π] = (p-v)·E[min(Q,D)] - (c-v)·Q'
      ]
    };
  }

  function buildNewsCurve(Cu, Co, mu, sd, price) {
    var pts = [];
    for (var i = 0; i <= 30; i++) {
      var q = Math.max(0, mu - 2.2 * sd + (4.4 * sd) * i / 30);
      var z = (q - mu) / sd;
      var phi = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
      var Emin = q - sd * phi - (q - mu) * (1 - normCdf(z));
      pts.push({ q: round(q, 2), profit: round(Cu * Emin - Co * (q - Emin), 2) });
    }
    return pts;
  }

  function normCdf(x) { return 0.5 * (1 + erf(x / Math.SQRT2)); }
  function erf(x) {
    var s = x < 0 ? -1 : 1; x = Math.abs(x);
    var a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, pp = 0.3275911;
    var t = 1 / (1 + pp * x);
    var y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return s * y;
  }
  /** 正态分布分位数（Acklam 近似 + 一次牛顿迭代） */
  function probit(p) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    var pl = 0.02425, x;
    if (p < pl) {
      var q = Math.sqrt(-2 * Math.log(p));
      x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (p <= 1 - pl) {
      var q2 = p - 0.5, r = q2 * q2;
      x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q2 /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    } else {
      var q3 = Math.sqrt(-2 * Math.log(1 - p));
      x = -(((((c[0] * q3 + c[1]) * q3 + c[2]) * q3 + c[3]) * q3 + c[4]) * q3 + c[5]) / ((((d[0] * q3 + d[1]) * q3 + d[2]) * q3 + d[3]) * q3 + 1);
    }
    // 牛顿迭代精化
    var e = normCdf(x) - p;
    var u = e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
    x = x - u / (1 + x * u / 2);
    return x;
  }

  /** (s,S)/(Q,R) 库存策略仿真 */
  function simulateInventory(cfg) {
    var rand = rng(cfg.seed || 20261017);
    var D = makeDist(rand);
    var periods = cfg.periods || 120;
    var mu = cfg.meanDemand, sd = cfg.sdDemand || 0;
    var leadTime = cfg.leadTime || 1;
    var policy = cfg.policy; // 'QR' | 'SS'
    var Q = cfg.orderQty, ROP = cfg.reorderPoint, S = cfg.orderUpTo, s = cfg.reorderPoint;
    var holdingRate = cfg.holdingCost, orderCost = cfg.orderCost, shortage = cfg.shortageCost, unitCost = cfg.unitCost || 0;

    var inventory = cfg.initialInventory !== undefined ? cfg.initialInventory : ROP + Q;
    var pipeline = [];   // {arriveAt, qty}
    var series = [], stats = { holding: 0, ordering: 0, shortage: 0, stockouts: 0, orders: 0, filled: 0, demandTotal: 0, fillUnits: 0 };
    var onHandSeries = [];

    for (var t = 0; t < periods; t++) {
      // 到货
      pipeline = pipeline.filter(function (o) {
        if (o.arriveAt <= t) { inventory += o.qty; return false; }
        return true;
      });
      // 需求
      var dem = sd > 0 ? Math.max(0, D.normal(mu, sd)) : mu;
      if (cfg.demandType === 'poisson') {
        dem = poissonSample(mu, rand);
      }
      stats.demandTotal += dem;
      var sales = Math.min(inventory, dem);
      var lost = dem - sales;
      inventory -= sales;
      stats.fillUnits += sales;
      if (lost > 1e-9) { stats.stockouts++; }
      stats.shortage += lost * shortage;
      stats.holding += Math.max(0, inventory) * holdingRate;
      onHandSeries.push({ t: t, onHand: round(inventory, 3), demand: round(dem, 3), lost: round(lost, 3) });

      // 补货决策
      var onOrder = pipeline.reduce(function (a, o) { return a + o.qty; }, 0);
      var invPos = inventory + onOrder;
      var orderQty = 0;
      if (policy === 'QR') {
        if (invPos <= ROP && onOrder <= 1e-9) orderQty = Q;
      } else {
        if (invPos <= s && onOrder <= 1e-9) orderQty = Math.max(0, S - invPos);
      }
      if (orderQty > 1e-9) {
        stats.orders++;
        stats.ordering += orderCost;
        pipeline.push({ arriveAt: t + leadTime, qty: orderQty });
      }
      series.push({ t: t, inventory: round(inventory, 3), position: round(invPos, 3), order: round(orderQty, 3), onOrder: round(onOrder + orderQty, 3) });
    }

    var totalCost = stats.holding + stats.ordering + stats.shortage;
    var avgInv = series.reduce(function (a, s2) { return a + s2.inventory; }, 0) / series.length;
    return {
      series: series, onHand: onHandSeries,
      stats: {
        totalCost: round(totalCost, 2), holdingCost: round(stats.holding, 2),
        orderingCost: round(stats.ordering, 2), shortageCost: round(stats.shortage, 2),
        orders: stats.orders, stockoutPeriods: stats.stockouts,
        fillRate: round(stats.fillUnits / Math.max(1e-9, stats.demandTotal), 6),
        cycleServiceLevel: round(1 - stats.stockouts / periods, 6),
        avgInventory: round(avgInv, 3)
      },
      theory: theoreticalQR(mu, sd, leadTime, Q, ROP, unitCost, holdingRate, orderCost, shortage)
    };
  }

  function theoreticalQR(mu, sd, L, Q, ROP, C, h, S, B) {
    var muL = mu * L, sdL = sd * Math.sqrt(L);
    var z = sdL > 0 ? (ROP - muL) / sdL : 0;
    var expectedShortage = sdL > 0 ? sdL * (Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI) - z * normCdf(-z)) : 0;
    return {
      leadTimeDemand: round(muL, 3), sdLeadTime: round(sdL, 3), safetyStock: round(ROP - muL, 3),
      z, serviceLevel: round(normCdf(z), 6),
      expectedShortagePerCycle: round(expectedShortage, 4),
      fillRateTheory: round(1 - expectedShortage / Math.max(1e-9, Q), 6),
      eoqReference: round(Math.sqrt(2 * mu * S / h), 3),
      safetyFormula: 'ROP = μL + z·σ√L，其中 z = Φ⁻¹(服务水平)'
    };
  }

  function poissonSample(lambda, rand) {
    var L = Math.exp(-lambda), k = 0, p = 1;
    do { k++; p *= rand(); } while (p > L);
    return k - 1;
  }

  /* ===========================================================================
   * E. 蒙特卡洛与风险度量
   * ======================================================================== */

  function statistics(arr) {
    var n = arr.length;
    if (!n) return { n: 0 };
    var mean = arr.reduce(function (a, b) { return a + b; }, 0) / n;
    var variance = n > 1 ? arr.reduce(function (a, b) { return a + Math.pow(b - mean, 2); }, 0) / (n - 1) : 0;
    var sorted = arr.slice().sort(function (a, b) { return a - b; });
    return {
      n: n, mean: round(mean, 6), sd: round(Math.sqrt(variance), 6),
      se: round(Math.sqrt(variance / n), 6),
      ci95: [round(mean - 1.96 * Math.sqrt(variance / n), 6), round(mean + 1.96 * Math.sqrt(variance / n), 6)],
      min: round(sorted[0], 6), max: round(sorted[n - 1], 6),
      p5: round(quantile(sorted, 0.05), 6), p25: round(quantile(sorted, 0.25), 6),
      median: round(quantile(sorted, 0.5), 6), p75: round(quantile(sorted, 0.75), 6),
      p95: round(quantile(sorted, 0.95), 6),
      sorted: sorted
    };
  }

  function quantile(sorted, q) {
    if (!sorted.length) return NaN;
    var pos = (sorted.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
  }

  function varCvar(samples, alpha) {
    var s = samples.slice().sort(function (a, b) { return a - b; });
    var idx = Math.max(0, Math.floor((1 - alpha) * s.length) - 1);
    var v = s[idx];
    var tail = s.slice(0, idx + 1);
    var cvar = tail.length ? tail.reduce(function (a, b) { return a + b; }, 0) / tail.length : v;
    return { alpha: alpha, VaR: round(v, 4), CVaR: round(cvar, 4), tailN: tail.length, threshold: round(v, 4) };
  }

  function histogram(arr, bins) {
    bins = bins || 30;
    /* 用显式循环而非 Math.min.apply(null, arr)：
       apply 的实参个数受引擎调用栈长度限制，样本量超过约 10^5 时会抛出
       "Maximum call stack size exceeded"。蒙特卡洛场景的抽样上限为 200000，
       因此必须逐个比较。同时过滤非有限值，避免 NaN 污染分箱边界。 */
    var min = Infinity, max = -Infinity, n = 0;
    for (var i = 0; i < arr.length; i++) {
      var v = arr[i];
      if (typeof v !== 'number' || !isFinite(v)) continue;
      if (v < min) min = v;
      if (v > max) max = v;
      n++;
    }
    if (n === 0) return [];
    if (max - min < 1e-12) { max = min + 1; }
    var w = (max - min) / bins;
    var counts = new Array(bins).fill(0);
    for (var j = 0; j < arr.length; j++) {
      var x = arr[j];
      if (typeof x !== 'number' || !isFinite(x)) continue;
      var k = Math.min(bins - 1, Math.max(0, Math.floor((x - min) / w)));
      counts[k]++;
    }
    return counts.map(function (c, idx) {
      return { x0: round(min + idx * w, 4), x1: round(min + (idx + 1) * w, 4), mid: round(min + (idx + 0.5) * w, 4), count: c, freq: round(c / n, 6) };
    });
  }

  /* ===========================================================================
   * F. 网络计划 PERT / CPM
   * ======================================================================== */

  /**
   * @param {Array} activities [{id, name, dur, o, m, p, preds:[]}]
   */
  function pertCPM(activities) {
    var acts = activities.map(function (a, i) {
      var te = a.te !== undefined ? a.te : (a.o !== undefined ? (a.o + 4 * a.m + a.p) / 6 : a.dur);
      var variance = (a.o !== undefined) ? Math.pow((a.p - a.o) / 6, 2) : 0;
      return {
        id: a.id !== undefined ? a.id : String.fromCharCode(65 + i),
        name: a.name || ('活动 ' + (a.id || i + 1)),
        dur: a.dur !== undefined ? a.dur : te,
        te: round(te, 4), variance: round(variance, 6),
        o: a.o, m: a.m, p: a.p,
        preds: (a.preds || []).slice(),
        succs: []
      };
    });
    var byId = {};
    acts.forEach(function (a) { byId[a.id] = a; });
    acts.forEach(function (a) {
      a.preds.forEach(function (pid) { if (byId[pid]) byId[pid].succs.push(a.id); });
    });

    // 拓扑排序
    var indeg = {};
    acts.forEach(function (a) { indeg[a.id] = a.preds.length; });
    var queue = acts.filter(function (a) { return indeg[a.id] === 0; }).map(function (a) { return a.id; });
    var order = [];
    while (queue.length) {
      var id = queue.shift();
      order.push(id);
      byId[id].succs.forEach(function (sid) { if (--indeg[sid] === 0) queue.push(sid); });
    }
    if (order.length !== acts.length) {
      return { error: '网络存在循环依赖，无法进行网络计划计算', cycle: true };
    }

    // 正推
    acts.forEach(function (a) { a.ES = 0; a.EF = 0; });
    order.forEach(function (id) {
      var a = byId[id];
      a.ES = a.preds.length ? Math.max.apply(null, a.preds.map(function (p) { return byId[p].EF; })) : 0;
      a.EF = a.ES + a.te;
    });
    var projectDuration = Math.max.apply(null, acts.map(function (a) { return a.EF; }));

    // 逆推
    order.slice().reverse().forEach(function (id) {
      var a = byId[id];
      a.LF = a.succs.length ? Math.min.apply(null, a.succs.map(function (s) { return byId[s].LS; })) : projectDuration;
      a.LS = a.LF - a.te;
      a.totalFloat = round(a.LS - a.ES, 6);
      a.freeFloat = round((a.succs.length ? Math.min.apply(null, a.succs.map(function (s) { return byId[s].ES; })) : projectDuration) - a.EF, 6);
      a.critical = Math.abs(a.totalFloat) < 1e-6;
    });

    var criticalPath = acts.filter(function (a) { return a.critical; }).map(function (a) { return a.id; });
    var cpVariance = acts.filter(function (a) { return a.critical; }).reduce(function (s, a) { return s + a.variance; }, 0);
    var cpSd = Math.sqrt(cpVariance);

    // 前驱链排序成关键路线顺序
    var cpOrdered = [];
    var visited = {};
    (function walk(list) {
      list.sort(function (x, y) { return x.ES - y.ES; });
      list.forEach(function (a) {
        if (visited[a.id]) return;
        visited[a.id] = true;
        cpOrdered.push(a);
        walk(a.succs.map(function (s) { return byId[s]; }).filter(function (s) { return s.critical; }));
      });
    })(acts.filter(function (a) { return a.critical && a.preds.filter(function (p) { return byId[p].critical; }).length === 0; }));
    if (cpOrdered.length < criticalPath.length) cpOrdered = acts.filter(function (a) { return a.critical; });

    return {
      activities: acts.map(function (a) {
        return {
          id: a.id, name: a.name, te: a.te, variance: a.variance, dur: a.dur,
          o: a.o, m: a.m, p: a.p,
          preds: a.preds, succs: a.succs,
          ES: round(a.ES, 4), EF: round(a.EF, 4), LS: round(a.LS, 4), LF: round(a.LF, 4),
          totalFloat: a.totalFloat, freeFloat: a.freeFloat, critical: a.critical
        };
      }),
      projectDuration: round(projectDuration, 4),
      criticalPath: cpOrdered.map(function (a) { return a.id; }),
      criticalActivities: criticalPath,
      cpVariance: round(cpVariance, 6),
      cpSd: round(cpSd, 6),
      probability: function (T) {
        if (cpSd < 1e-9) return T >= projectDuration ? 1 : 0;
        return round(normCdf((T - projectDuration) / cpSd), 6);
      },
      formula: [
        '期望工期 tₑ = (a + 4m + b)/6，方差 σ² = ((b-a)/6)²',
        '关键路线：总时差为零的活动序列，决定项目总工期',
        '总时差 TF = LS - ES；自由时差 FF = min(ES_succ) - EF',
        '项目按期完工概率 P(T ≤ T₀) = Φ((T₀ - Tₑ)/σ_cp)'
      ]
    };
  }

  /* ---- PERT-Beta 分布抽样：匹配均值 (a+4m+b)/6 与方差 ((b-a)/6)² ---- */
  function gammaSample(k, rand) {
    if (k < 1) { var u = rand() || 1e-12; return gammaSample(k + 1, rand) * Math.pow(u, 1 / k); }
    var d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) {
      var x, v;
      do {
        var u1 = rand() || 1e-12, u2 = rand();
        x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        v = 1 + c * x;
      } while (v <= 0);
      v = v * v * v;
      var u3 = rand();
      if (u3 < 1 - 0.0331 * x * x * x * x) return d * v;
      if (Math.log(u3) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }
  function betaSample(alpha, beta, rand) {
    var x = gammaSample(alpha, rand), y = gammaSample(beta, rand);
    return x + y < 1e-12 ? 0.5 : x / (x + y);
  }
  /** 标准 PERT-Beta（van Dorp & Kotz）：由 a,m,b 反解 α、β */
  function pertBetaSample(a, m, b, rand) {
    if (b - a < 1e-9) return a;
    var mean = (a + 4 * m + b) / 6;
    var mx = (mean - a) / (b - a);
    mx = Math.min(0.9985, Math.max(0.0015, mx));
    var s = 36 * mx * (1 - mx) - 1;            // α + β，由方差 1/36 反解
    if (!(s > 0.05)) s = 0.05;
    var x = betaSample(mx * s, (1 - mx) * s, rand);
    return a + Math.min(0.999999, Math.max(1e-6, x)) * (b - a);
  }

  /** 网络计划仿真：对活动工期抽样，得到完工时间分布 */
  function simulatePert(pert, runs, seed) {
    var rand = rng(seed || 20261017);
    var D = makeDist(rand);
    var acts = pert.activities;
    var byId = {};
    acts.forEach(function (a) { byId[a.id] = a; });
    var results = [];
    var criticalFreq = {};
    acts.forEach(function (a) { criticalFreq[a.id] = 0; });

    for (var r = 0; r < runs; r++) {
      var ES = {}, EF = {};
      var dur = {};
      acts.forEach(function (a) {
        var d;
        if (a.o !== undefined && a.m !== undefined && a.p !== undefined) {
          d = pertBetaSample(a.o, a.m, a.p, rand);  // PERT-Beta 分布
        } else {
          d = a.te;
        }
        dur[a.id] = d;
      });
      // 拓扑顺序
      var remaining = acts.length, order2 = [];
      var indeg2 = {};
      acts.forEach(function (a) { indeg2[a.id] = a.preds.length; });
      var q = acts.filter(function (a) { return indeg2[a.id] === 0; }).map(function (a) { return a.id; });
      while (q.length) { var id = q.shift(); order2.push(id); byId[id].succs.forEach(function (s) { if (--indeg2[s] === 0) q.push(s); }); }

      order2.forEach(function (id) {
        var a = byId[id];
        ES[id] = a.preds.length ? Math.max.apply(null, a.preds.map(function (p) { return EF[p]; })) : 0;
        EF[id] = ES[id] + dur[id];
      });
      var finish = Math.max.apply(null, order2.map(function (id) { return EF[id]; }));
      results.push(finish);

      // 反推关键活动（近似：总时差 < 0.5% 的项目工期）
      var LF = {};
      order2.slice().reverse().forEach(function (id) {
        var a = byId[id];
        LF[id] = a.succs.length ? Math.min.apply(null, a.succs.map(function (s) { return (LF[s] !== undefined ? LF[s] : finish) - dur[s]; })) : finish;
      });
      order2.forEach(function (id) {
        var a = byId[id];
        var tf = (LF[id] - dur[id]) - ES[id];
        if (tf < 0.001 * finish) criticalFreq[id]++;
      });
    }

    var st = statistics(results);
    return {
      runs: runs, stats: st, histogram: histogram(results, 32),
      theoretical: { mean: pert.projectDuration, sd: pert.cpSd },
      criticalityIndex: acts.map(function (a) {
        return { id: a.id, name: a.name, index: round(criticalFreq[a.id] / runs, 4) };
      }).sort(function (x, y) { return y.index - x.index; }),
      percentiles: {
        p10: st.p10 = round(quantile(st.sorted, 0.10), 4),
        p50: round(quantile(st.sorted, 0.50), 4),
        p90: round(quantile(st.sorted, 0.90), 4)
      }
    };
  }

  /* ===========================================================================
   * G. 动态规划
   * ======================================================================== */

  /** 0/1 背包 */
  function knapsack01(items, capacity) {
    var n = items.length;
    var W = Math.round(capacity);
    var dp = [];
    for (var i = 0; i <= n; i++) dp.push(new Array(W + 1).fill(0));
    for (i = 1; i <= n; i++) {
      var it = items[i - 1];
      var w = Math.round(it.weight), v = it.value;
      for (var j = 0; j <= W; j++) {
        dp[i][j] = dp[i - 1][j];
        if (w <= j && dp[i - 1][j - w] + v > dp[i][j]) dp[i][j] = dp[i - 1][j - w] + v;
      }
    }
    // 回溯
    var chosen = [], j2 = W;
    for (i = n; i > 0; i--) {
      if (dp[i][j2] !== dp[i - 1][j2]) {
        chosen.unshift(i - 1);
        j2 -= Math.round(items[i - 1].weight);
      }
    }
    return {
      maxValue: dp[n][W],
      chosen: chosen,
      chosenItems: chosen.map(function (k) { return items[k]; }),
      totalWeight: chosen.reduce(function (s, k) { return s + Math.round(items[k].weight); }, 0),
      dp: dp.map(function (row) { return row.slice(); }),
      table: dp,
      stages: buildKnapsackStages(items, W)
    };
  }

  function buildKnapsackStages(items, W) {
    var stages = [];
    var cur = new Array(W + 1).fill(0);
    for (var i = 0; i < items.length; i++) {
      var w = Math.round(items[i].weight), v = items[i].value;
      var next = cur.slice();
      for (var j = w; j <= W; j++) next[j] = Math.max(next[j], cur[j - w] + v);
      stages.push({ item: i + 1, label: items[i].name || ('物品 ' + (i + 1)), before: cur.slice(), after: next.slice() });
      cur = next;
    }
    return stages;
  }

  /** 资源分配问题：把 n 个单位资源分配给 m 个活动 */
  function resourceAllocation(m, n, profitFn) {
    var dp = [];
    for (var i = 0; i <= m; i++) dp.push(new Array(n + 1).fill(0));
    for (i = 1; i <= m; i++) {
      for (var j = 0; j <= n; j++) {
        var best = -Infinity, bestK = 0;
        for (var k = 0; k <= j; k++) {
          var val = dp[i - 1][j - k] + profitFn(i - 1, k);
          if (val > best) { best = val; bestK = k; }
        }
        dp[i][j] = best;
      }
    }
    var alloc = [], j2 = n;
    for (i = m; i > 0; i--) {
      for (var k2 = 0; k2 <= j2; k2++) {
        if (Math.abs(dp[i][j2] - (dp[i - 1][j2 - k2] + profitFn(i - 1, k2))) < 1e-9) {
          alloc.unshift(k2); j2 -= k2; break;
        }
      }
    }
    return { maxProfit: dp[m][n], allocation: alloc, dp: dp };
  }

  /* ===========================================================================
   * 导出
   * ======================================================================== */
  OR.rng = rng;
  OR.makeDist = makeDist;
  /* ===========================================================================
   * H. 马尔可夫链与 Erlang C
   * ======================================================================== */

  /** 高斯消元（部分主元），求解 Ax = b */
  function solveLinear(A, b) {
    var n = A.length;
    if (!n) return [];
    var M = A.map(function (r, i) { return r.slice().concat([b[i]]); });
    for (var col = 0; col < n; col++) {
      var piv = col;
      for (var r = col + 1; r < n; r++) {
        if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
      }
      if (Math.abs(M[piv][col]) < 1e-12) continue;
      if (piv !== col) { var t = M[piv]; M[piv] = M[col]; M[col] = t; }
      for (r = col + 1; r < n; r++) {
        var f = M[r][col] / M[col][col];
        if (!f) continue;
        for (var c = col; c <= n; c++) M[r][c] -= f * M[col][c];
      }
    }
    var x = new Array(n).fill(0);
    for (var i = n - 1; i >= 0; i--) {
      var s = M[i][n];
      for (var j = i + 1; j < n; j++) s -= M[i][j] * x[j];
      x[i] = Math.abs(M[i][i]) < 1e-12 ? 0 : s / M[i][i];
    }
    return x;
  }

  /** 校验转移矩阵的每一行是否归一化 */
  function checkStochastic(P) {
    for (var i = 0; i < P.length; i++) {
      var s = 0;
      for (var j = 0; j < P[i].length; j++) {
        if (P[i][j] < -1e-12) return '第 ' + (i + 1) + ' 行存在负概率';
        s += P[i][j];
      }
      if (Math.abs(s - 1) > 1e-6) return '第 ' + (i + 1) + ' 行概率之和为 ' + round(s, 6) + '，应等于 1';
    }
    return null;
  }

  /**
   * 稳态分布：解 πP = π 且 Σπ = 1。
   * 把 (Pᵀ − I) 的前 n−1 个方程与归一化方程联立，用高斯消元求解。
   */
  function markovSteady(P) {
    var n = P.length;
    if (!n) return { ok: false, error: '空转移矩阵' };
    var err = checkStochastic(P);
    if (err) return { ok: false, error: err };

    var A = [], b = [];
    for (var r = 0; r < n - 1; r++) {
      var row = [];
      for (var j = 0; j < n; j++) row.push(P[j][r] - (j === r ? 1 : 0));
      A.push(row); b.push(0);
    }
    A.push(new Array(n).fill(1)); b.push(1);

    var x = solveLinear(A, b);
    var sum = 0;
    for (var i = 0; i < n; i++) sum += Math.max(0, x[i]);
    var pi = x.map(function (v) { return sum > 0 ? Math.max(0, v) / sum : 0; });

    /* 残差校验：‖πP − π‖∞ */
    var residual = 0;
    for (var j2 = 0; j2 < n; j2++) {
      var acc = 0;
      for (var k = 0; k < n; k++) acc += pi[k] * P[k][j2];
      residual = Math.max(residual, Math.abs(acc - pi[j2]));
    }
    return {
      ok: true, n: n,
      stationary: pi.map(function (v) { return round(v, 8); }),
      residual: round(residual, 12)
    };
  }

  /** n 步转移矩阵（矩阵快速幂） */
  function markovNStep(P, steps) {
    var n = P.length;
    function mul(A, B) {
      var C = [];
      for (var i = 0; i < n; i++) {
        C.push(new Array(n).fill(0));
        for (var k = 0; k < n; k++) {
          if (!A[i][k]) continue;
          for (var j = 0; j < n; j++) C[i][j] += A[i][k] * B[k][j];
        }
      }
      return C;
    }
    var result = [];
    for (var i = 0; i < n; i++) {
      result.push(new Array(n).fill(0));
      result[i][i] = 1;
    }
    var base = P.map(function (r) { return r.slice(); });
    var k = steps;
    while (k > 0) {
      if (k & 1) result = mul(result, base);
      base = mul(base, base);
      k >>= 1;
    }
    return result.map(function (r) { return r.map(function (v) { return round(v, 8); }); });
  }

  /**
   * 吸收态分析：给定吸收态集合，返回各瞬态的期望吸收步数。
   * 解 (I − Q) t = 1，其中 Q 为瞬态之间的转移子矩阵。
   */
  function markovAbsorb(P, absorbing) {
    var n = P.length;
    var isAbs = new Array(n).fill(false);
    (absorbing || []).forEach(function (i) { if (i >= 0 && i < n) isAbs[i] = true; });
    var T = [];
    for (var i = 0; i < n; i++) if (!isAbs[i]) T.push(i);
    if (!T.length) return { ok: true, times: new Array(n).fill(0), transient: [] };

    var A = T.map(function (ri, a) {
      return T.map(function (cj, b) { return (a === b ? 1 : 0) - P[ri][cj]; });
    });
    var rhs = T.map(function () { return 1; });
    var t = solveLinear(A, rhs);
    var out = new Array(n).fill(0);
    T.forEach(function (ri, k) { out[ri] = round(t[k], 6); });
    var bad = t.some(function (v) { return !isFinite(v) || v < -1e-6; });
    return { ok: !bad, times: out, transient: T, absorbing: (absorbing || []).slice() };
  }

  /**
   * Erlang C：M/M/c 系统的等待概率与服务水平。
   *   lambda 到达率、mu 单台服务率、c 服务台数、target 目标应答时限（可选）
   * 返回 pWait（需等待概率）、Wq、Lq、serviceLevel（在 target 内被应答的概率）。
   */
  function erlangC(lambda, mu, c, target) {
    var a = lambda / mu;
    var rho = a / c;
    if (!(c > 0) || !(mu > 0)) return { stable: false, error: '服务台数与服务率必须为正' };
    if (rho >= 1 - 1e-12) {
      return {
        stable: false, rho: round(rho, 6), offeredLoad: round(a, 4), servers: c,
        message: 'ρ = λ/(cμ) ≥ 1，队列将无限增长，不存在稳态等待时间'
      };
    }
    /* Σ_{n=0}^{c} aⁿ/n!，同时保留末项 a^c/c! */
    var sum = 1, term = 1;
    for (var n = 1; n <= c; n++) { term *= a / n; sum += term; }
    var tail = term / (1 - rho);                 // aᶜ / (c!(1−ρ))
    var p0 = 1 / (sum - term + tail);
    var pWait = tail * p0;
    var gap = c * mu - lambda;                   // cμ − λ
    var wq = pWait / gap;
    var lq = lambda * wq;
    var w = wq + 1 / mu;
    var l = lambda * w;
    var sl = (target !== undefined && target !== null) ? 1 - pWait * Math.exp(-gap * target) : null;
    return {
      stable: true, servers: c, lambda: lambda, mu: mu,
      offeredLoad: round(a, 4), rho: round(rho, 6), p0: round(p0, 8),
      pWait: round(pWait, 6), Wq: round(wq, 6), Lq: round(lq, 6),
      W: round(w, 6), L: round(l, 6),
      serviceLevel: sl === null ? null : round(sl, 6),
      target: sl === null ? null : target,
      utilization: round(Math.min(1, rho), 6)
    };
  }

  OR.stats = {
    statistics: statistics, varCvar: varCvar, histogram: histogram,
    quantile: quantile, normCdf: normCdf, probit: probit, gammaFn: gammaFn
  };
  OR.queue = { mmck: queueMMcK, mg1: queueMG1, simulate: simulateQueue, erlangC: erlangC };
  OR.markov = {
    steady: markovSteady, nStep: markovNStep, absorb: markovAbsorb,
    solveLinear: solveLinear, checkStochastic: checkStochastic
  };
  OR.inv = { eoq: eoq, epq: epq, eoqBackorder: eoqBackorder, discount: quantityDiscount, newsvendor: newsvendor, simulate: simulateInventory };
  OR.mc = { sample: sampleDist, distMoments: distMoments, MinHeap: MinHeap };
  OR.pert = { compute: pertCPM, simulate: simulatePert };
  OR.dp = { knapsack01: knapsack01, resourceAllocation: resourceAllocation };

  if (typeof module !== 'undefined' && module.exports) module.exports = OR;

})(typeof window !== 'undefined' ? window : globalThis);
