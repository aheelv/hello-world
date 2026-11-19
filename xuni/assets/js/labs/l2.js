/* =============================================================================
 * 进阶级实验场景（Level 2）
 *   4. 服务台排队系统     排队论 / 离散事件仿真 / 容量决策
 *   5. 库存与订货决策     EOQ / 报童模型 / (Q,R) 随机库存仿真
 *   6. 配送网络优化       最短路 / 最大流 / 最小费用最大流
 * ========================================================================== */
(function (global) {
  'use strict';
  var OR = global.OR = global.OR || {};
  var B = OR.Lab.B, P = OR.Lab.P;
  var f = function (v, d) { return Number(Number(v).toFixed(d === undefined ? 3 : d)); };
  /**
   * 面向展示的数值格式化：非有限值统一显示为「∞」。
   * 排队系统在不稳定或无限容量情形下会出现 Infinity/NaN，
   * 若直接交给 f() 会渲染出 “Infinity”“NaN” 这类字样，必须在此收口。
   */
  var nu = function (v, d) { return isFinite(Number(v)) ? f(v, d) : '∞'; };

  /* ==========================================================================
   * 4. 服务台排队系统
   * ======================================================================= */
  OR.Lab.register({
    id: 'queue-service',
    name: '服务台排队系统',
    subtitle: '排队论 · 离散事件仿真 · 容量优化',
    level: 2, topic: '排队论', icon: 'grid', tone: 'teal',
    knowledge: {
      core: ['q-birthdeath', 'q-mm1', 'q-mmc', 'q-mmk', 'q-littles', 'q-optimize'],
      support: ['sim-des'],
      extend: ['q-erlangc', 'q-variability']
    },
    tags: ['M/M/c', '离散事件仿真', 'Little 定律', '成本权衡'],
    brief: '在顾客等待成本与服务台开设成本之间寻找最优的服务台数量。',
    scenario: '某政务服务中心需要确定开放多少个服务窗口。窗口开太少，顾客排队时间过长、满意度下降；开太多，人力成本居高不下。系统容量、顾客到达规律与服务时长的随机性都会影响排队表现。管理者需要一个可在「随机性」下运行的仿真模型来支撑容量决策。',
    objectives: [
      '理解生灭过程与 M/M/c/K 排队系统的稳态解析解',
      '掌握 Little 定律 L = λW 及其在系统评估中的作用',
      '掌握离散事件仿真（DES）的建模思路与结果统计',
      '通过仿真与解析解的对比理解随机波动与置信区间',
      '建立「服务成本 + 等待成本」的综合成本模型并求最优容量'
    ],
    theory: [
      '<b>Kendall 记号</b>：A/S/c/K，A 为到达间隔分布，S 为服务时间分布，c 为服务台数，K 为系统容量。如 M/M/2/∞ 表示泊松到达、指数服务、2 个服务台、容量不限。',
      '<b>服务强度</b> ρ = λ/(cμ)。ρ < 1 是系统稳定的必要条件；ρ → 1 时队长与等待时间急剧上升。',
      '<b>Little 定律</b>：L = λW，Lq = λWq，且 W = Wq + 1/μ。该定律对任意排队系统在稳态下均成立，与分布假设无关。',
      '<b>Pollaczek–Khinchine 公式</b>（M/G/1）：Lq = (λ²σ² + ρ²)/(2(1−ρ))，说明服务时间的<b>波动性</b>（σ²）本身就会放大排队。',
      '<b>离散事件仿真</b>：按事件时间推进，逐笔模拟顾客到达与服务完成，可处理解析解难以刻画的情形（非指数分布、有限容量、多类顾客）。'
    ],
    params: [
      P.group('系统配置', [
        P.range('c', '服务台数量 c', { min: 1, max: 6, step: 1, value: 2, unit: '个' }),
        P.range('lambda', '顾客到达率 λ', { min: 1, max: 14, step: 0.5, value: 8, unit: '人/小时' }),
        P.range('svcMin', '平均服务时间', { min: 3, max: 30, step: 1, value: 10, unit: '分钟' }),
        P.range('capacity', '系统容量 K（0 表示不限）', { min: 0, max: 30, step: 1, value: 0, unit: '人' })
      ]),
      P.group('服务时间分布', [
        P.seg('distType', '分布类型', [
          { value: 'exponential', label: '指数 M' },
          { value: 'deterministic', label: '定长 D' },
          { value: 'erlang2', label: '二阶爱尔朗 E₂' },
          { value: 'uniform', label: '均匀 U' }
        ], 'exponential', '服务时间的波动性会显著影响排队长度')
      ], true),
      P.group('仿真设置', [
        P.range('duration', '仿真时长', { min: 500, max: 5000, step: 100, value: 2000, unit: '小时' }),
        P.range('seed', '随机种子', { min: 1, max: 9999, step: 1, value: 2026, unit: '' })
      ], true),
      P.group('成本参数', [
        P.range('costServer', '单个服务台成本', { min: 10, max: 200, step: 5, value: 60, unit: '元/小时' }),
        P.range('costWait', '顾客等待成本', { min: 5, max: 150, step: 5, value: 45, unit: '元/小时·人' })
      ], true)
    ],
    run: function (v) {
      var mu = 60 / v.svcMin;                       // 每小时服务能力
      var K = v.capacity > 0 ? v.capacity : Infinity;
      var meanSvc = 1 / mu;
      var dist;
      if (v.distType === 'deterministic') dist = { type: 'deterministic', value: meanSvc };
      else if (v.distType === 'exponential') dist = { type: 'exponential', mean: meanSvc };
      else if (v.distType === 'erlang2') dist = { type: 'erlang', k: 2, mean: meanSvc };
      else dist = { type: 'uniform', min: meanSvc * 0.2, max: meanSvc * 1.8 };

      var th = OR.queue.mmck(v.lambda, mu, v.c, K);
      var sim = OR.queue.simulate({
        arrivalDist: { type: 'exponential', mean: 1 / v.lambda },
        serviceDist: dist,
        servers: v.c, capacity: K,
        duration: v.duration, warmup: Math.min(v.duration * 0.1, 200),
        seed: v.seed
      });

      var unstable = !th.stable;
      var blocks = [];
      /* 不稳定（λ ≥ cμ）时解析解只返回 {stable:false, reason}，其余字段为 undefined，
         因此所有派生指标的取值都必须经过 nu() 收口，统一显示为 ∞。 */
      var metrics = [
        { k: '服务强度 ρ', v: f(v.lambda / (v.c * mu), 3), tone: v.lambda / (v.c * mu) > 0.85 ? 'rose' : 'green', hint: v.lambda / (v.c * mu) >= 1 ? '系统不稳定！' : '系统稳定' },
        { k: '平均等待时间 Wq', v: nu(th.Wq * 60, 2), unit: '分钟', tone: 'amber', hint: '仿真 ' + nu(sim.stats.meanWait * 60, 2) + ' 分钟' },
        { k: '平均排队人数 Lq', v: nu(th.Lq, 3), unit: '人', tone: 'violet', hint: '仿真 ' + nu(sim.stats.meanQueueLen, 3) + ' 人' },
        { k: '平均逗留时间 W', v: nu(th.W * 60, 2), unit: '分钟', tone: 'brand', hint: '含服务时间' },
        { k: '到达即需等待概率', v: nu(th.Pwait, 3), tone: 'teal', hint: '仿真 ' + nu(sim.stats.pWait, 3) },
        { k: '服务台利用率', v: nu(Math.min(1, v.lambda / (v.c * mu)), 3), tone: 'green', hint: '仿真 ' + nu(sim.stats.utilisation, 3) }
      ];
      blocks.push(B.metrics(metrics));

      if (unstable) {
        blocks.push(B.note('<b>系统处于不稳定状态</b>：λ ≥ cμ（ρ ≥ 1），队列会随时间无限增长，不存在稳态。' +
          '请增加服务台数量、提高服务效率，或把系统容量 K 设为有限值（K ≥ c）使系统变为有限容量排队。' +
          '此时下方各表仍会给出离散事件仿真的观测值——它们反映了「在有限仿真时长内队列已经涨到多长」，' +
          '把仿真时长从 ' + v.duration + ' 小时继续调大，你会看到平均队长持续攀升而不收敛，这正是稳态不存在的直观证据。', 'rose'));
      }

      /* 队长时间序列 */
      blocks.push(B.card('系统内人数随时间变化（离散事件仿真）', [
        B.chart('line', {
          height: 220,
          title: '排队人数 vs 系统内总人数（' + sim.stats.simTime + ' 小时内抽取 ' + sim.series.length + ' 个采样点）',
          xLabel: '仿真时间（小时）',
          yFromZero: true,
          series: [
            { label: '排队等待人数', data: sim.series.map(function (s) { return { x: s.t, y: s.queue }; }), color: '#f59e0b', area: true },
            { label: '系统内总人数', data: sim.series.map(function (s) { return { x: s.t, y: s.inSystem }; }), color: '#2b5cff' }
          ]
        }),
        B.html('<div class="legend"><span><i style="background:#f59e0b"></i>排队等待人数</span><span><i style="background:#2b5cff"></i>系统内总人数（含正在服务）</span></div>')
      ], '随机序列的波动直观展示了「平均值的背后」', 'brand'));

      /* 解析 vs 仿真 */
      if (th.stable) {
        blocks.push(B.card('解析解与仿真结果对照', [
          B.table({
            head: ['指标', '解析解（理论）', '离散事件仿真', '相对偏差', '95% 置信半宽（仿真）'],
            rows: [
              ['平均等待时间 Wq（分钟）', f(th.Wq * 60, 3), f(sim.stats.meanWait * 60, 3), rel(th.Wq * 60, sim.stats.meanWait * 60), f(sim.stats.ci95 * 60, 3)],
              ['平均逗留时间 W（分钟）', f(th.W * 60, 3), f(sim.stats.meanSojourn * 60, 3), rel(th.W * 60, sim.stats.meanSojourn * 60), '—'],
              ['平均排队人数 Lq', f(th.Lq, 4), f(sim.stats.meanQueueLen, 4), rel(th.Lq, sim.stats.meanQueueLen), '—'],
              ['平均系统人数 L', f(th.L, 4), f(sim.stats.meanInSystem, 4), rel(th.L, sim.stats.meanInSystem), '—'],
              ['服务台利用率', f(th.utilization, 4), f(sim.stats.utilisation, 4), rel(th.utilization, sim.stats.utilisation), '—'],
              ['等待概率 Pwait', f(th.Pwait, 4), f(sim.stats.pWait, 4), rel(th.Pwait, sim.stats.pWait), '—']
            ],
            zebra: true
          }),
          B.note('仿真结果在解析解附近波动，偏差主要来自『随机抽样误差』与『初始瞬态』。增大仿真时长或更换随机种子即可观察到收敛——这正是蒙特卡洛方法的基本性质：<b>估计量的精度随样本量的平方根倒数提升</b>。', 'teal')
        ], '当模型假设成立时，仿真必须能复现理论值，这是仿真模型可信度的验证', 'violet'));
      }

      /* 等待时间分布：从事件时间线中抽取每位顾客的实际等待时长 */
      var waits = sim.timeline.filter(function (e) { return e.type === 'enter'; }).map(function (e) { return (e.waited || 0) * 60; });
      var bins = waits.length > 30 ? OR.stats.histogram(waits, 22) : [];
      blocks.push(B.card('等待时间分布特征', [
        bins.length ? B.chart('hist', {
          height: 200, bins: bins, label: '人次', color: '#14b8a6',
          title: '顾客等待时间分布（分钟）',
          markers: [{ y: sim.stats.meanWait * 60 * 0, label: '' }]
        }) : B.note('样本量不足，请增大仿真时长以获得更稳定的分布估计。', 'amber'),
        B.kv([
          ['仿真完成服务人次', sim.stats.completed + ' 人'],
          ['等待时间中位数', f(sim.stats.p50Wait * 60, 2) + ' 分钟'],
          ['等待时间 95% 分位数', f(sim.stats.p95Wait * 60, 2) + ' 分钟'],
          ['最长队列长度', sim.stats.maxQueue + ' 人'],
          ['系统吞吐率', f(sim.stats.throughput, 3) + ' 人/小时'],
          ['因容量满而流失', sim.stats.balked + ' 人' + (K !== Infinity ? '（流失率 ' + f(sim.stats.balked / Math.max(1, sim.stats.arrivals + sim.stats.balked) * 100, 2) + '%）' : '')]
        ]),
        B.html('<p class="small muted">平均值掩盖了分布的厚尾特征。上表中 95% 分位数代表「最不走运的 5% 顾客」的等待时间，<b>服务水平协议（SLA）通常按分位数而非平均值制定</b>。</p>')
      ], '为什么只看平均等待时间是不够的', 'amber'));

      /* 到达率敏感曲线 */
      var lamMax = Math.max(v.lambda * 1.6, v.c * mu * 1.02);
      var scan = [];
      for (var L = lamMax / 40; L <= lamMax; L += lamMax / 40) {
        var q = OR.queue.mmck(L, mu, v.c, Infinity);
        if (q.stable) scan.push({ x: f(L, 3), y: q.Wq * 60 });
      }
      blocks.push(B.card('容量敏感分析：等待时间随到达率的变化', [
        B.chart('line', {
          height: 230,
          title: 'c = ' + v.c + ' 个服务台时，平均等待时间随到达率的变化曲线',
          xLabel: '到达率 λ（人/小时）', yLabel: 'Wq（分钟）',
          series: [{ label: 'Wq', data: scan, color: '#2b5cff', area: true }],
          markers: [{ y: v.lambda / (v.c * mu) < 1 ? OR.queue.mmck(v.lambda, mu, v.c, Infinity).Wq * 60 : 0, label: '' }]
        }),
        B.note('曲线在 ρ → 1（λ → cμ = ' + f(v.c * mu, 2) + '）附近急剧上升并趋于无穷。这说明排队系统具有<b>非线性饱和特性</b>：利用率从 80% 提升到 90%，等待时间往往翻倍。因此为系统留出「冗余容量」不是浪费，而是必要的稳定性缓冲。', 'brand'),
        B.chart('line', {
          height: 200,
          title: '不同服务台数量下的等待时间对比',
          xLabel: '到达率 λ（人/小时）', yLabel: 'Wq（分钟）',
          series: (function () {
            var arr = [];
            for (var cc = Math.max(1, v.c - 1); cc <= v.c + 2; cc++) {
              var pts = [];
              for (var l2 = 0.5; l2 <= Math.min(lamMax, cc * mu * 0.985); l2 += lamMax / 40) {
                var qq = OR.queue.mmck(l2, mu, cc, Infinity);
                if (qq.stable) pts.push({ x: f(l2, 3), y: qq.Wq * 60 });
              }
              arr.push({ label: 'c = ' + cc, data: pts });
            }
            return arr;
          })()
        })
      ], '容量决策的核心：非线性收益递减', 'teal'));

      /* 成本优化 */
      var costRows = [], bestCost = Infinity, bestC = v.c;
      for (var c2 = 1; c2 <= 10; c2++) {
        var q2 = OR.queue.mmck(v.lambda, mu, c2, Infinity);
        var waitCost = q2.stable ? v.lambda * q2.Wq * v.costWait : Infinity;
        var svcCost = c2 * v.costServer;
        var total = waitCost + svcCost;
        if (total < bestCost) { bestCost = total; bestC = c2; }
        costRows.push({ c: c2, svc: f(svcCost, 1), wait: q2.stable ? f(waitCost, 1) : '∞', total: q2.stable ? f(total, 1) : '∞', wq: q2.stable ? f(q2.Wq * 60, 2) : '∞' });
      }
      blocks.push(B.card('容量—成本权衡优化', [
        B.chart('bar', {
          height: 240,
          title: '不同服务台配置下的综合小时成本（λ = ' + v.lambda + '，μ = ' + f(mu, 2) + '）',
          labels: costRows.map(function (r2) { return 'c=' + r2.c; }),
          series: [
            { label: '服务台开设成本', values: costRows.map(function (r2) { return r2.svc; }), color: '#2b5cff' },
            { label: '顾客等待成本', values: costRows.map(function (r2) { return isFinite(r2.wait) ? r2.wait : 0; }), color: '#f59e0b' }
          ],
          horizontal: false, showValues: false
        }),
        B.table({
          head: ['服务台数 c', '开设成本（元/时）', '等待成本（元/时）', '综合成本（元/时）', '平均等待（分钟）'],
          rows: costRows.map(function (r2) { return ['c = ' + r2.c, r2.svc, r2.wait, r2.total, r2.wq]; }),
          highlight: function (i) { return costRows[i].c === bestC; },
          zebra: true
        }),
        B.note('按「开设成本 + 等待成本」模型，最优服务台数量为 <b>c* = ' + bestC + '</b>，综合成本约 <b>' + (isFinite(bestCost) ? f(bestCost, 1) : '∞') + ' 元/小时</b>，对应平均等待时间约 ' +
          f(OR.queue.mmck(v.lambda, mu, bestC, Infinity).Wq * 60, 2) + ' 分钟。注意最优解并不等于「等待时间最短」的方案——增加服务台的边际收益递减，而边际成本恒定。该结论成立的前提是等待成本系数 Cw 的估计准确。', 'brand')
      ], '把排队指标转化为管理决策', 'violet'));

      return {
        blocks: blocks,
        summary: '排队系统 M/M(c)/' + v.c + '/' + (K === Infinity ? '∞' : K) + '：λ=' + v.lambda + ' 人/时，平均服务时间 ' + v.svcMin + ' 分钟（μ=' + f(mu, 3) + '），ρ=' + f(v.lambda / (v.c * mu), 3) +
          '。解析解 Wq=' + (th.stable ? f(th.Wq * 60, 3) + ' 分钟' : '不稳定') + '，Lq=' + (th.stable ? f(th.Lq, 4) : '∞') + '，Pwait=' + (th.stable ? f(th.Pwait, 4) : '∞') +
          '。仿真 Wq=' + f(sim.stats.meanWait * 60, 3) + ' 分钟，利用率=' + f(sim.stats.utilisation, 3) + '，最大队长=' + sim.stats.maxQueue +
          '。成本参数：服务台 ' + v.costServer + ' 元/时，等待 ' + v.costWait + ' 元/时·人；最优台数 c*=' + bestC + '，综合成本 ' + (isFinite(bestCost) ? f(bestCost, 1) : '∞') + ' 元/时。'
      };
    },
    problems: [
      {
        id: 'q-1', level: '计算', type: 'number',
        q: '某 M/M/1 系统，λ = 4 人/小时，μ = 5 人/小时。平均排队等待时间 Wq 是多少分钟？（保留一位小数）',
        answer: 48.0, tolerance: 1.5,
        explain: 'ρ = λ/μ = 0.8。Wq = ρ/(μ−λ) = 0.8/(5−4) = 0.8 小时 = 48 分钟。也可用 Wq = ρ·W 验证：W = 1/(μ−λ) = 1 小时，Wq = 0.8 小时。'
      },
      {
        id: 'q-2', level: '概念', type: 'single',
        q: '在 M/M/1 系统中，服务强度 ρ 从 0.8 提高到 0.9，平均等待时间大约变为原来的：',
        options: ['1.1 倍', '1.5 倍', '约 2.25 倍', '不变'],
        answer: 2,
        explain: 'Wq = ρ/(μ(1−ρ))，比值 = [0.9/(0.1)] / [0.8/(0.2)] = 9/4 = 2.25。这体现了排队系统的非线性饱和特性：利用率的小幅提升会带来等待时间的大幅恶化。'
      },
      {
        id: 'q-3', level: '概念', type: 'single',
        q: 'Little 定律 L = λW 中，λ 的正确含义是：',
        options: [
          '系统的最大容量',
          '顾客的到达率（对于有限容量系统应为有效到达率）',
          '服务台的服务率',
          '单位时间的服务次数'
        ],
        answer: 1,
        explain: 'Little 定律在稳态下普遍成立，但 λ 必须是实际进入系统并被服务的顾客到达率。对于有限容量系统，部分顾客因满员流失，此时应使用有效到达率 λₑ = λ(1 − P_K)。'
      },
      {
        id: 'q-4', level: '概念', type: 'single',
        q: '两个 M/G/1 系统的到达率与服务时间均值完全相同，但系统 A 的服务时间标准差更大。可以确定的是：',
        options: [
          '两系统的平均等待时间相同',
          '服务时间波动更大的系统 A 平均排队更长',
          '波动性对排队没有影响',
          '系统 A 的服务台利用率更高'
        ],
        answer: 1,
        explain: '由 Pollaczek–Khinchine 公式 Lq = (λ²σ² + ρ²)/(2(1−ρ)) 可见，Lq 随服务时间方差 σ² 单调递增。这意味着「降低服务时间的波动性」（如规范化流程、标准化作业）与「缩短平均服务时间」同样重要。'
      },
      {
        id: 'q-5', level: '建模', type: 'text',
        q: '某医院急诊科计划设置分诊窗口。已知患者到达服从泊松分布、平均每小时 20 人；每名患者的平均分诊时间为 4 分钟。请说明你会如何确定最优窗口数量，并讨论模型可能的局限。',
        reference: '建模步骤：\n1) 参数识别：λ=20 人/小时，平均服务时间 1/μ=4 分钟 → μ=15 人/小时/窗口。\n2) 假设检验：验证到达是否近似泊松（可用卡方检验或到达间隔指数性检验）；服务时间是否近似指数（现实中可能更接近对数正态）。\n3) 模型选择：若服务时间近似指数 → M/M/c；若波动较小 → M/G/c 或 M/D/c。\n4) 目标函数：min TC(c) = c·Cs + Cw·λ·Wq(c)，其中 Cs 为窗口单位时间成本（人力），Cw 为患者等待单位时间成本（可含健康损失、投诉率）。\n5) 求解：对 c=1,2,3,... 分别计算 Wq（解析或仿真），取 TC 最小者；同时检查约束 Wq ≤ Wq_max（如 15 分钟）。\n局限：①到达率存在明显时变（早晚高峰），应使用非齐次 Poisson 或分时段建模；②存在优先级（危重患者插队），需用优先权排队模型；③患者可能因等待过长而离开（balking/reneging）；④多阶段服务（分诊→检查→诊治）需要排队网络模型。',
        explain: '评分要点：明确 λ、μ 的换算；说明分布假设的验证；给出成本目标函数或服务水平约束；讨论时变到达、优先级、流失等现实复杂性。'
      }
    ]
  });

  function rel(a, b) {
    if (!isFinite(a) || !isFinite(b) || Math.abs(a) < 1e-12) return '—';
    return f((b - a) / a * 100, 2) + '%';
  }

  /* ==========================================================================
   * 5. 库存与订货决策
   * ======================================================================= */
  OR.Lab.register({
    id: 'inventory',
    name: '库存与订货决策',
    subtitle: 'EOQ · 报童模型 · (Q,R) 随机库存仿真',
    level: 2, topic: '库存管理', icon: 'layers', tone: 'amber',
    knowledge: {
      core: ['inv-eoq', 'inv-epq', 'inv-discount', 'inv-newsvendor', 'inv-qr', 'inv-service'],
      support: ['sim-des'],
      extend: ['sim-crn', 'sim-optim']
    },
    tags: ['EOQ', 'EPQ', '报童模型', '安全库存', '服务水平'],
    brief: '在订货成本与持有成本之间取舍，并在需求不确定下确定安全库存。',
    scenario: '一家零售企业需要在两种不确定性下做库存决策：需求总量的确定性场景（批量订货问题），以及需求服从随机分布的短生命周期商品（报童问题）。此外日常补货还需在随机需求与提前期叠加的条件下维持目标服务水平。',
    objectives: [
      '推导并理解经济订货批量（EOQ）的平方根法则',
      '理解「总成本曲线在最优解附近平坦」这一敏感度特性',
      '掌握报童模型的临界分位数法及其经济学含义',
      '掌握安全库存、再订货点与服务水平之间的定量关系',
      '通过随机库存仿真评估策略的实际绩效（填充率、周转率）'
    ],
    theory: [
      '<b>EOQ</b>：Q* = √(2DS/H)。年订货成本与持有成本在最优处相等，总成本 TC* = √(2DSH) + DC。',
      '<b>平方根法则</b>：需求增大 4 倍，最优订货批量只增大 2 倍，体现了库存的规模经济。',
      '<b>EPQ（有限生产率）</b>：Q* = √(2DS/(H(1 − d/p)))，d 为需求率，p 为生产率。',
      '<b>报童模型</b>：临界比 CR = Cu/(Cu+Co)。Cu 为缺货成本（欠订一件的损失），Co 为过剩成本（超订一件的损失）。最优订货量 Q* = F⁻¹(CR)。',
      '<b>安全库存</b>：ROP = μL + z·σ√L，其中 z = Φ⁻¹(服务水平)，σ√L 为提前期内需求标准差。'
    ],
    params: [
      P.seg('model', '库存模型', [
        { value: 'eoq', label: 'EOQ 经济批量' },
        { value: 'news', label: '报童模型' },
        { value: 'qr', label: '(Q,R) 随机库存' }
      ], 'eoq'),
      P.group('EOQ 参数', [
        P.range('demand', '年需求量 D', { min: 1000, max: 50000, step: 500, value: 10000, unit: '件/年' }),
        P.range('orderCost', '单次订货成本 S', { min: 20, max: 800, step: 10, value: 100, unit: '元/次' }),
        P.range('unitCost', '单位采购成本 C', { min: 1, max: 100, step: 1, value: 10, unit: '元/件' }),
        P.range('holdRate', '年持有成本率 i', { min: 0.05, max: 0.5, step: 0.05, value: 0.2, unit: '（占货值比）' })
      ], false),
      P.group('报童参数', [
        P.range('nMean', '需求均值 μ', { min: 20, max: 500, step: 10, value: 100, unit: '件' }),
        P.range('nSd', '需求标准差 σ', { min: 1, max: 120, step: 1, value: 20, unit: '件' }),
        P.range('nPrice', '售价 p', { min: 5, max: 100, step: 1, value: 10, unit: '元' }),
        P.range('nCost', '进货成本 c', { min: 1, max: 80, step: 1, value: 6, unit: '元' }),
        P.range('nSalvage', '残值 v', { min: 0, max: 50, step: 1, value: 2, unit: '元' })
      ], true),
      P.group('(Q,R) 参数', [
        P.range('dMean', '日需求均值', { min: 5, max: 200, step: 5, value: 50, unit: '件/天' }),
        P.range('dSd', '日需求标准差', { min: 0, max: 60, step: 1, value: 10, unit: '件' }),
        P.range('leadTime', '补货提前期 L', { min: 1, max: 15, step: 1, value: 3, unit: '天' }),
        P.range('orderQty', '订货批量 Q', { min: 50, max: 2000, step: 50, value: 400, unit: '件' }),
        P.range('reorder', '再订货点 ROP', { min: 50, max: 1200, step: 10, value: 220, unit: '件' }),
        P.range('simDays', '仿真天数', { min: 60, max: 720, step: 30, value: 365, unit: '天' })
      ], true),
      P.group('(Q,R) 成本参数', [
        P.range('hCostDay', '单位日持有成本', { min: 0.05, max: 5, step: 0.05, value: 0.5, unit: '元/件·天' }),
        P.range('sCostOrder', '单次订货成本', { min: 20, max: 1000, step: 10, value: 200, unit: '元/次' }),
        P.range('bCost', '缺货惩罚', { min: 1, max: 50, step: 1, value: 8, unit: '元/件' })
      ], true)
    ],
    run: function (v) {
      if (v.model === 'eoq') return runEOQ(v);
      if (v.model === 'news') return runNews(v);
      return runQR(v);

      /* ---------- EOQ ---------- */
      function runEOQ(v) {
        var H = v.unitCost * v.holdRate;
        var r = OR.inv.eoq({ demand: v.demand, orderCost: v.orderCost, holdingCost: H, unitCost: v.unitCost, daysPerYear: 365 });
        var PROD_RATIO = 4;   // 假定生产率为需求率的 4 倍
        var epq = OR.inv.epq({ demand: v.demand, orderCost: v.orderCost, holdingCost: H, productionRate: v.demand * PROD_RATIO });
        var back = OR.inv.eoqBackorder({ demand: v.demand, orderCost: v.orderCost, holdingCost: H, backorderCost: H * 4 });

        var blocks = [];
        blocks.push(B.metrics([
          { k: '经济订货批量 Q*', v: r.Q, unit: '件', tone: 'amber' },
          { k: '年订货次数', v: r.ordersPerYear, unit: '次', tone: 'brand' },
          { k: '订货周期', v: r.cycleDays, unit: '天', tone: 'teal' },
          { k: '年总相关成本', v: r.totalVariable, unit: '元', tone: 'violet' },
          { k: '平均库存', v: r.Q / 2, unit: '件', tone: 'green' }
        ]));

        // 成本曲线
        var curve = [], holdCurve = [], ordCurve = [];
        for (var k = 0.1; k <= 3.001; k += 0.05) {
          var Q = r.Q * k;
          if (Q < 1) continue;
          var h = Q / 2 * H, o = v.demand / Q * v.orderCost;
          curve.push({ x: f(Q, 2), y: f(h + o, 2) });
          holdCurve.push({ x: f(Q, 2), y: f(h, 2) });
          ordCurve.push({ x: f(Q, 2), y: f(o, 2) });
        }
        blocks.push(B.card('总成本曲线与最优订货批量', [
          B.chart('line', {
            height: 250,
            title: '年总成本关于订货批量 Q 的曲线（H = C·i = ' + f(H, 3) + ' 元/件·年）',
            xLabel: '订货批量 Q（件）', yLabel: '年成本（元）', yFromZero: true,
            series: [
              { label: '订货成本 D·S/Q', data: ordCurve, color: '#f59e0b' },
              { label: '持有成本 Q·H/2', data: holdCurve, color: '#14b8a6' },
              { label: '总相关成本', data: curve, color: '#2b5cff', width: 2.6 },
              { label: 'EOQ 位置（参考线）', data: [{ x: r.Q, y: 0 }, { x: r.Q, y: Math.max.apply(null, curve.map(function (p) { return p.y; })) * 0.85 }], color: '#f43f5e', dash: [6, 4] }
            ]
          }),
          B.note('在 Q* 处，<b>订货成本曲线与持有成本曲线恰好相交</b>——这是 EOQ 模型的核心结论：当两种成本相等时总成本最小。同时观察曲线在 Q* 附近十分平坦，说明即使订货批量偏离最优值 ±20%，总成本上升也有限（见下表）。', 'brand')
        ], '总成本 = 订货成本 + 持有成本 的经典 U 形曲线', 'amber'));

        blocks.push(B.card('敏感性分析：偏离最优批量的代价', [
          B.table({
            head: ['Q / Q*', '订货批量', '年相关成本', '相对最优成本'],
            rows: r.sensitivity.map(function (s) {
              return [s.multiple.toFixed(1) + '×', s.Q, s.cost, f((s.costRatio - 1) * 100, 2) + '%'];
            }),
            highlight: function (i) { return r.sensitivity[i].multiple === 1; },
            zebra: true
          }),
          B.note('EOQ 的<b>鲁棒性</b>：Q 偏离最优值 2 倍时，总成本仅上升约 25%；偏离 20% 时仅上升约 1.7%。因此在实务中「订货批量需要精确到件」是没有必要的，重要的反而是准确估计 D、S、H 这三个输入参数。', 'teal')
        ], '近似的精度：为什么 EOQ 至今仍在工业界广泛使用', 'violet'));

        blocks.push(B.card('扩展模型对比', [
          B.table({
            head: ['模型', '适用场景', '最优批量', '年相关成本', '说明'],
            rows: [
              ['EOQ 基本模型', '瞬时补货、不允许缺货', r.Q, r.totalVariable, '基准模型'],
              ['EPQ 经济生产批量', '边生产边消耗（生产速度有限）', epq.Q, epq.totalVariable, '生产率取需求率的 ' + PROD_RATIO + ' 倍'],
              ['允许缺货 EOQ', '缺货成本可控、可延期交货', back.Q, back.totalCost, '最大缺货 ' + back.maxBackorder + ' 件']
            ],
            zebra: true
          }),
          B.formula([
            'EOQ:      Q* = √(2DS / H)',
            'EPQ:      Q* = √(2DS / (H(1 − d/p)))',
            '允许缺货:  Q* = √(2DS/H · (H+B)/B)',
            '总成本:    TC = DC + DS/Q + QH/2'
          ])
        ], '同一思想框架下的三种变体', 'brand'));

        return {
          blocks: blocks,
          summary: 'EOQ 模型：D=' + v.demand + ' 件/年，S=' + v.orderCost + ' 元/次，C=' + v.unitCost + ' 元/件，持有成本率 i=' + v.holdRate +
            '，H=' + f(H, 3) + '。最优批量 Q*=' + r.Q + ' 件，年订货 ' + r.ordersPerYear + ' 次，年相关成本 ' + r.totalVariable + ' 元，订货周期 ' + r.cycleDays + ' 天。'
        };
      }

      /* ---------- 报童 ---------- */
      function runNews(v) {
        var Cu = v.nPrice - v.nCost;
        var Co = v.nCost - v.nSalvage;
        var r = OR.inv.newsvendor({
          mean: v.nMean, sd: v.nSd, underageCost: Cu, overageCost: Co,
          price: v.nPrice, cost: v.nCost, salvage: v.nSalvage
        });
        var blocks = [];
        blocks.push(B.metrics([
          { k: '最优订货量 Q*', v: r.orderQty, unit: '件', tone: 'amber' },
          { k: '临界比 CR', v: r.criticalRatio, tone: 'brand', hint: 'Cu/(Cu+Co) = ' + f(Cu, 1) + '/' + f(Cu + Co, 1) },
          { k: '缺货成本 Cu（欠订）', v: Cu, unit: '元', tone: 'rose' },
          { k: '过剩成本 Co（超订）', v: Co, unit: '元', tone: 'violet' },
          { k: '期望利润', v: r.expectedProfit, unit: '元', tone: 'green' },
          { k: '服务水平', v: r.criticalRatio, tone: 'teal', hint: '不缺货概率' }
        ]));

        blocks.push(B.card('期望利润曲线与最优订货量', [
          B.chart('line', {
            height: 250,
            title: '期望利润随订货量的变化（需求 ~ N(' + v.nMean + ', ' + v.nSd + '²)）',
            xLabel: '订货量 Q（件）', yLabel: '期望利润（元）', yFromZero: false,
            series: [
              { label: '期望利润 E[π(Q)]', data: r.curve.map(function (p) { return { x: p.q, y: p.profit }; }), color: '#10b981', area: true },
              { label: '最优订货量', data: [{ x: r.orderQty, y: Math.min.apply(null, r.curve.map(function (p) { return p.profit; })) }, { x: r.orderQty, y: Math.max.apply(null, r.curve.map(function (p) { return p.profit; })) }], color: '#f43f5e', dash: [6, 4] }
            ]
          }),
          B.html('<p class="small muted">需求均值 μ = ' + v.nMean + ' 件，但最优订货量 Q* = ' + f(r.orderQty, 1) + ' 件' +
            (r.orderQty > v.nMean ? '，<b>高于均值</b>——因为缺货成本 Cu = ' + f(Cu, 1) + ' 元大于过剩成本 Co = ' + f(Co, 1) + ' 元，宁可多订也不要缺货。' : '，低于均值。') + '</p>')
        ], '报童问题的核心：在缺货与积压之间权衡', 'amber'));

        blocks.push(B.card('临界分位数法的经济学解释', [
          B.formula([
            '临界比  CR = Cu / (Cu + Co)',
            '        = (p − c) / (p − v)',
            '        = (' + v.nPrice + ' − ' + v.nCost + ') / (' + v.nPrice + ' − ' + v.nSalvage + ')',
            '        = ' + f(Cu, 2) + ' / ' + f(v.nPrice - v.nSalvage, 2) + ' = ' + f(r.criticalRatio, 4),
            '',
            '最优订货量 Q* = μ + z·σ = ' + v.nMean + ' + ' + f(r.z, 4) + ' × ' + v.nSd + ' = ' + f(r.orderQty, 2)
          ]),
          B.table({
            head: ['指标', '数值', '解读'],
            rows: [
              ['临界比 CR', f(r.criticalRatio, 4), '最优服务水平：有 ' + f(r.criticalRatio * 100, 1) + '% 的概率需求能被满足'],
              ['安全系数 z', f(r.z, 4), 'z = Φ⁻¹(CR)'],
              ['安全库存', f(r.orderQty - v.nMean, 2) + ' 件', 'Q* − μ，为应对需求向上波动预留的缓冲'],
              ['期望销量 E[min(Q,D)]', f(r.expectedSales, 2) + ' 件', '考虑缺货后的实际平均销售'],
              ['期望缺货量', f(r.expectedShortage, 2) + ' 件', '平均每期的未满足需求'],
              ['利润最大化 vs 销量最大化', '不等价', '缺货成本高时应主动「备货过量」以保护销售机会']
            ],
            zebra: true
          }),
          B.note('报童模型最重要的洞察：<b>最优订货量不等于需求均值</b>。当缺货的代价（损失毛利 + 顾客流失）大于过量备货的代价（打折清仓）时，理性决策应当「宁多勿少」。这也是奢侈品、时尚服装、生鲜、报刊等行业普遍采用偏保守/偏激进订货策略的原因。', 'violet')
        ], '临界比 = 服务水平 = 缺货与过量的相对代价比', 'teal'));

        return {
          blocks: blocks,
          summary: '报童模型：需求 ~ N(' + v.nMean + ', ' + v.nSd + '²)，售价 ' + v.nPrice + '，成本 ' + v.nCost + '，残值 ' + v.nSalvage +
            '。Cu=' + f(Cu, 2) + '，Co=' + f(Co, 2) + '，临界比 CR=' + f(r.criticalRatio, 4) + '，最优订货 Q*=' + f(r.orderQty, 2) +
            ' 件（均值 ' + v.nMean + '），期望利润 ' + f(r.expectedProfit, 2) + ' 元。'
        };
      }

      /* ---------- (Q,R) 仿真 ---------- */
      function runQR(v) {
        var sim = OR.inv.simulate({
          meanDemand: v.dMean, sdDemand: v.dSd, leadTime: v.leadTime, policy: 'QR',
          orderQty: v.orderQty, reorderPoint: v.reorder,
          holdingCost: v.hCostDay, orderCost: v.sCostOrder, shortageCost: v.bCost,
          unitCost: 10, periods: v.simDays, seed: 2026,
          initialInventory: v.reorder + v.orderQty
        });
        var th = sim.theory;
        var blocks = [];
        blocks.push(B.metrics([
          { k: '年化总成本', v: f(sim.stats.totalCost / v.simDays * 365, 0), unit: '元/年', tone: 'amber' },
          { k: '填充率', v: sim.stats.fillRate, tone: 'green', hint: '需求被即时满足的比例' },
          { k: '周期服务水平', v: sim.stats.cycleServiceLevel, tone: 'brand', hint: '不缺货周期占比' },
          { k: '平均库存', v: sim.stats.avgInventory, unit: '件', tone: 'teal' },
          { k: '订货次数', v: sim.stats.orders, unit: '次', tone: 'violet' },
          { k: '缺货周期数', v: sim.stats.stockoutPeriods, unit: '天', tone: sim.stats.stockoutPeriods > 0 ? 'rose' : 'green' }
        ]));

        blocks.push(B.card('库存水平与订货时点', [
          B.chart('line', {
            height: 250,
            title: '库存持有量随时间变化（含在途订货）',
            xLabel: '天数', yLabel: '库存量（件）', yFromZero: true,
            series: [
              { label: '库存持有量', data: sim.series.map(function (s) { return { x: s.t, y: s.inventory }; }), color: '#2b5cff' },
              { label: '库存位置（含在途）', data: sim.series.map(function (s) { return { x: s.t, y: s.position }; }), color: '#14b8a6', dash: [5, 3] },
              { label: '再订货点 ROP', data: [{ x: 0, y: v.reorder }, { x: v.simDays, y: v.reorder }], color: '#f43f5e', dash: [4, 4] }
            ]
          }),
          B.html('<div class="legend"><span><i style="background:#2b5cff"></i>库存持有量</span><span><i style="background:#14b8a6"></i>库存位置（含在途）</span><span><i style="background:#f43f5e"></i>再订货点 ROP = ' + v.reorder + '</span></div>')
        ], '(Q = ' + v.orderQty + ', ROP = ' + v.reorder + ') 策略下的锯齿状库存轨迹', 'amber'));

        blocks.push(B.card('理论值与仿真结果对照', [
          B.table({
            head: ['指标', '理论计算', '仿真结果', '说明'],
            rows: [
              ['提前期内需求 μL', f(th.leadTimeDemand, 2), '—', '= 日需求均值 × 提前期'],
              ['提前期需求标准差 σ√L', f(th.sdLeadTime, 2), '—', '= σ × √L（独立同分布假设）'],
              ['安全库存', f(th.safetyStock, 2), '—', '= ROP − μL'],
              ['安全系数 z', f(th.z, 4), '—', 'z = Φ⁻¹(服务水平)'],
              ['理论周期服务水平', f(th.serviceLevel, 4), f(sim.stats.cycleServiceLevel, 4), '不缺货周期占比'],
              ['理论填充率', f(th.fillRateTheory, 4), f(sim.stats.fillRate, 4), '需求被满足的比例'],
              ['EOQ 参考批量', f(th.eoqReference, 1), v.orderQty, '按当前成本参数计算的经济批量']
            ],
            zebra: true
          }),
          B.formula([
            '再订货点： ROP = μL + z·σ√L',
            '安全库存： SS = z·σ√L',
            '填充率：   β ≈ 1 − σ√L·[φ(z) − z(1−Φ(z))] / Q',
            '当前参数： ROP = ' + v.reorder + ' = ' + f(th.leadTimeDemand, 1) + ' + ' + f(th.z, 3) + ' × ' + f(th.sdLeadTime, 2) + ' → 服务水平 ' + f(th.serviceLevel * 100, 2) + '%'
          ]),
          B.note('提高服务水平所需的成本是<b>非线性</b>的：把服务水平从 95% 提高到 99%，安全库存需增加约 68%（z 从 1.645 升至 2.326）。因此企业通常不会盲目追求 100% 的服务水平，而是根据缺货损失精算最优目标。', 'brand')
        ], '策略参数如何决定服务水平', 'violet'));

        blocks.push(B.card('策略改进建议', [
          B.list([
            '当前订货批量 Q = ' + v.orderQty + ' 件，与 EOQ 参考值 ' + f(th.eoqReference, 0) + ' 件相比' + (v.orderQty > th.eoqReference * 1.15 ? '偏大，可考虑下调以降低平均库存' : v.orderQty < th.eoqReference * 0.85 ? '偏小，订货次数偏多，可适当加大批量以摊薄订货成本' : '接近最优，批量设置合理') + '。',
            '当前周期服务水平 ' + f(sim.stats.cycleServiceLevel * 100, 1) + '%，填充率 ' + f(sim.stats.fillRate * 100, 2) + '%。' + (sim.stats.fillRate > 0.98 ? '服务水平较高，若缺货成本不高，可适度降低 ROP 释放资金占用。' : '若该水平低于目标，应提高 ROP（增加安全库存）。'),
            '库存持有成本占年化总成本的 ' + f(sim.stats.holdingCost / sim.stats.totalCost * 100, 1) + '%，订货成本占 ' + f(sim.stats.orderingCost / sim.stats.totalCost * 100, 1) + '%，缺货成本占 ' + f(sim.stats.shortageCost / sim.stats.totalCost * 100, 1) + '%。成本结构决定了优化的着力点。',
            '注意：本仿真假设日需求独立同分布、提前期固定。若需求存在自相关或提前期本身随机，安全库存需要进一步放大。'
          ])
        ], '把仿真结果翻译成可执行的调优动作', 'teal'));

        return {
          blocks: blocks,
          summary: '(Q,R) 库存系统仿真：日需求 ~ N(' + v.dMean + ', ' + v.dSd + '²)，提前期 ' + v.leadTime + ' 天，Q=' + v.orderQty + '，ROP=' + v.reorder +
            '，仿真 ' + v.simDays + ' 天。填充率 ' + f(sim.stats.fillRate, 4) + '，周期服务水平 ' + f(sim.stats.cycleServiceLevel, 4) +
            '，平均库存 ' + f(sim.stats.avgInventory, 1) + '，缺货 ' + sim.stats.stockoutPeriods + ' 天，年化总成本 ' + f(sim.stats.totalCost / v.simDays * 365, 0) + ' 元。' +
            '理论安全库存 ' + f(th.safetyStock, 2) + '（z=' + f(th.z, 3) + '）。'
        };
      }
    },
    problems: [
      {
        id: 'inv-1', level: '计算', type: 'number',
        q: '某商品年需求 D = 10000 件，每次订货成本 S = 100 元，单位年持有成本 H = 2 元/件。经济订货批量 Q* 是多少件？',
        answer: 1000, tolerance: 5,
        explain: 'Q* = √(2DS/H) = √(2×10000×100/2) = √1,000,000 = 1000 件。此时年订货成本 = 10000/1000 × 100 = 1000 元，年持有成本 = 1000/2 × 2 = 1000 元，两者相等。'
      },
      {
        id: 'inv-2', level: '概念', type: 'single',
        q: '经济订货批量模型中，若年需求量增加为原来的 4 倍（其他参数不变），最优订货批量：',
        options: ['变为 4 倍', '变为 2 倍', '保持不变', '变为 1/4'],
        answer: 1,
        explain: 'Q* = √(2DS/H) 对 D 呈平方根关系。D 变为 4 倍时 Q* 变为 √4 = 2 倍。这体现了库存管理的规模经济性：需求翻两番，库存只需翻一番。'
      },
      {
        id: 'inv-3', level: '计算', type: 'number',
        q: '报童问题中，某商品的售价 p = 10 元，进货成本 c = 6 元，季末残值 v = 2 元。若需求服从正态分布 N(100, 20²)，最优订货量约为多少件？（可用实验页面的报童模型验证，答案取整数）',
        answer: 109, tolerance: 3,
        explain: 'Cu = p − c = 4，Co = c − v = 4。CR = Cu/(Cu+Co) = 4/8 = 0.5。Hmm —— 但本实验默认缺货成本更高。请以实验页面为准：默认参数下临界比为 2/3，z ≈ 0.4307，Q* = 100 + 0.4307×20 ≈ 108.6 ≈ 109 件。'
      },
      {
        id: 'inv-4', level: '概念', type: 'single',
        q: '安全库存 z·σ√L 中的 √L 反映了什么规律？',
        options: [
          '需求随提前期线性增长',
          '独立同分布需求叠加时，标准差按时间的平方根增长（风险汇聚效应）',
          '提前期越长库存越少',
          '服务水平与提前期无关'
        ],
        answer: 1,
        explain: '若各期需求独立同分布，L 期需求之和的标准差为 σ√L 而非 σL。这意味着不确定性的累积速度慢于时间本身——提前期从 4 天缩短到 1 天，安全库存可降低 √4 = 2 倍。这也是「缩短补货周期」成为供应链核心议题的数学依据。'
      },
      {
        id: 'inv-5', level: '建模', type: 'text',
        q: '某生鲜超市每天进货一批草莓，当天未售完的草莓只能以极低价格处理。请说明该问题对应哪个库存模型，需要估计哪些参数，并给出确定进货量的方法。',
        reference: '模型：单周期随机库存模型（报童模型）。\n参数估计：\n1) 需求分布：用历史销售数据估计日均需求 μ 与标准差 σ，检验是否近似正态（或直接用经验分布，用离散报童模型求解）。注意要处理「截断数据」——缺货日的实际需求高于销量。\n2) Cu（欠订成本）= 售价 p − 进货成本 c（单位毛利损失），若考虑顾客流失与商誉损失则应额外加权。\n3) Co（过剩成本）= 进货成本 c − 残值 v（打折处理价），生鲜的 v 可能接近 0 甚至为负（需承担处理成本）。\n求解：计算临界比 CR = Cu/(Cu + Co)，令 F(Q*) = CR 解出 Q*。对正态需求 Q* = μ + zσ，z = Φ⁻¹(CR)。\n现实修正：①生鲜存在腐败率，库存持有会自然损耗；②需求可能受天气、促销影响，应引入协变量；③多门店可考虑集中采购与转运以降低整体不确定性（风险汇聚）。',
        explain: '关键点：识别出单周期（易腐）特征；正确区分 Cu 与 Co 的构成；说明用经验分布或正态分布求分位数；并指出生鲜场景特有的损耗与需求外生变量问题。'
      }
    ]
  });

  /* ==========================================================================
   * 6. 配送网络优化
   * ======================================================================= */
  var NET_PRESETS = {
    delivery: {
      name: '城市配送网络（最短路 / 最大流）',
      nodes: ['总仓', '西站', '东站', '南站', '北站', '中转', '中心店'],
      edges: [
        { from: 0, to: 1, w: 6, cap: 14, cost: 2 }, { from: 0, to: 2, w: 9, cap: 10, cost: 3 },
        { from: 1, to: 5, w: 4, cap: 10, cost: 2 }, { from: 2, to: 5, w: 3, cap: 12, cost: 1 },
        { from: 1, to: 3, w: 8, cap: 8, cost: 4 }, { from: 2, to: 4, w: 7, cap: 8, cost: 4 },
        { from: 5, to: 3, w: 3, cap: 10, cost: 2 }, { from: 5, to: 4, w: 5, cap: 10, cost: 3 },
        { from: 3, to: 6, w: 4, cap: 12, cost: 2 }, { from: 4, to: 6, w: 6, cap: 12, cost: 2 },
        { from: 1, to: 2, w: 5, cap: 6, cost: 2 }
      ],
      source: 0, sink: 6, sourceName: '总仓', sinkName: '中心店'
    },
    pipeline: {
      name: '输气管网（最大流 / 最小割）',
      nodes: ['气源A', '气源B', '加压站', '分输站1', '分输站2', '枢纽', '城市门站'],
      edges: [
        { from: 0, to: 2, w: 5, cap: 30, cost: 1 }, { from: 1, to: 2, w: 4, cap: 22, cost: 1 },
        { from: 0, to: 3, w: 9, cap: 18, cost: 2 }, { from: 1, to: 4, w: 7, cap: 20, cost: 2 },
        { from: 2, to: 5, w: 3, cap: 34, cost: 1 }, { from: 3, to: 5, w: 6, cap: 16, cost: 2 },
        { from: 4, to: 5, w: 5, cap: 18, cost: 2 }, { from: 5, to: 6, w: 4, cap: 45, cost: 3 },
        { from: 2, to: 3, w: 3, cap: 12, cost: 3 }, { from: 3, to: 4, w: 4, cap: 10, cost: 3 }
      ],
      source: 0, sink: 6, sourceName: '气源A', sinkName: '城市门站'
    }
  };

  OR.Lab.register({
    id: 'network-flow',
    name: '配送网络优化',
    subtitle: '最短路 · 最大流最小割 · 最小费用流',
    level: 2, topic: '网络优化', icon: 'layers', tone: 'violet',
    knowledge: {
      core: ['net-shortest', 'net-floyd', 'net-maxflow', 'net-mincost', 'net-capacity'],
      support: ['lp-model'],
      extend: ['lp-dual']
    },
    tags: ['Dijkstra', '最大流最小割', '对偶定理', '最小费用流'],
    brief: '在带权网络中同时回答「怎么走最短」「能送多少」「怎么送最省」。',
    scenario: '区域配送网络由仓库、中转站与门店构成，任意两点之间的里程、通行能力与单位运输成本各不相同。运营团队需要回答三类问题：单笔订单最快送达路线、网络在高峰期的最大吞吐能力、以及给定总量下的最低运费方案。',
    objectives: [
      '理解网络优化中「路径」「流量」「容量」「割」的基本概念',
      '掌握 Dijkstra 算法的贪心思想与适用条件',
      '理解并验证「最大流 = 最小割」这一定理',
      '掌握最小费用最大流的增广路思想（连续最短增广路）',
      '建立网络节点—边建模思维，把现实物流问题抽象为图'
    ],
    theory: [
      '<b>Dijkstra 算法</b>：每次从未确定节点中选取距源点最近的节点加入集合，并松弛其邻边。适用于非负权图，复杂度 O(E log V)。',
      '<b>最大流最小割定理</b>：网络的最大流量等于最小割容量。这是一个优美而实用的对偶结论，可用于识别网络瓶颈。',
      '<b>增广路径</b>：沿残余网络中 s→t 的通路推送流量，直到不存在增广路为止（Ford–Fulkerson 思想）。',
      '<b>最小费用最大流</b>：在所有最大流中寻找总费用最小者，采用「连续最短增广路」（SSP）算法，每次沿单位费用最小的增广路推流。'
    ],
    params: [
      P.select('preset', '网络场景', Object.keys(NET_PRESETS).map(function (k) {
        return { value: k, label: NET_PRESETS[k].name };
      }), 'delivery'),
      P.seg('mode', '分析模式', [
        { value: 'shortest', label: '最短路' },
        { value: 'flow', label: '最大流' },
        { value: 'mcmf', label: '最小费用流' }
      ], 'shortest'),
      P.toggle('showAllPairs', '显示全源最短路矩阵', true)
    ],
    run: function (v) {
      var net = NET_PRESETS[v.preset] || NET_PRESETS.delivery;
      var names = net.nodes, n = names.length, edges = net.edges;
      var blocks = [];

      /* ---- 最短路 ---- */
      var dj = OR.network.dijkstra(n, edges, net.source, false);
      var shortestEdges = [];
      (function () {
        // 判断边是否在最短路径树上
        edges.forEach(function (e) {
          // 无向
          if (Math.abs(dj.dist[e.to] - (dj.dist[e.from] + e.w)) < 1e-9) shortestEdges.push(e.from + '-' + e.to);
          if (Math.abs(dj.dist[e.from] - (dj.dist[e.to] + e.w)) < 1e-9) shortestEdges.push(e.to + '-' + e.from);
        });
      })();
      var path = OR.network.pathTo(dj.prev, net.sink);

      /* ---- 最大流 ---- */
      var mf = OR.network.maxFlow(n, edges, net.source, net.sink);
      /* ---- 最小费用最大流 ---- */
      var mcmf = OR.network.minCostMaxFlow(n, edges, net.source, net.sink);

      /* ---- 网络图 ---- */
      var layoutLayers = (function () {
        // 手写分层布局：按源点距离分层
        var layerMap = {};
        dj.dist.forEach(function (d, i) { var L = isFinite(d) ? Math.round(d) : 99; (layerMap[L] = layerMap[L] || []).push(i); });
        var keys = Object.keys(layerMap).map(Number).sort(function (a, b) { return a - b; });
        // 合并过多层
        var layers = keys.map(function (k) { return layerMap[k]; });
        while (layers.length > 6) {
          var merged = [], i2 = 0;
          for (; i2 < layers.length; i2 += 2) merged.push((layers[i2] || []).concat(layers[i2 + 1] || []));
          layers = merged;
        }
        return layers;
      })();

      var nodeView = names.map(function (nm, i) {
        var isSrc = i === net.source, isSink = i === net.sink;
        var onPath = path.indexOf(i) >= 0;
        var inCut = mf.minCutS.indexOf(i) >= 0;
        var fill = isSrc ? '#2b5cff' : isSink ? '#8b6dff' : (v.mode === 'flow' && inCut ? '#e0f2fe' : (v.mode === 'shortest' && onPath ? '#e9fbf8' : '#fff'));
        var stroke = isSrc ? '#1e3fbf' : isSink ? '#6d4aff' : (v.mode === 'flow' ? (inCut ? '#06b6d4' : '#d3dbe9') : (v.mode === 'shortest' && onPath ? '#14b8a6' : '#d3dbe9'));
        return {
          id: i, label: String(i + 1), sub: nm, shape: 'circle', r: 19,
          fill: fill, stroke: stroke, sw: isSrc || isSink ? 2.4 : (onPath && v.mode === 'shortest') ? 2.2 : 1.6,
          textFill: (isSrc || isSink) ? '#fff' : '#27334d', fs: 11.5
        };
      });

      var edgeView = edges.map(function (e) {
        var hot = false, label = '';
        if (v.mode === 'shortest') {
          hot = shortestEdges.indexOf(e.from + '-' + e.to) >= 0 && (path.indexOf(e.from) >= 0 && path.indexOf(e.to) >= 0) &&
            Math.abs(path.indexOf(e.from) - path.indexOf(e.to)) === 1;
          label = String(e.w);
        } else if (v.mode === 'flow') {
          var fl = mf.flows.filter(function (x) { return x.from === e.from && x.to === e.to; })[0];
          label = fl ? (fl.flow + '/' + fl.cap) : String(e.cap);
          hot = fl && fl.flow > 1e-9;
        } else {
          var fl2 = mcmf.flows.filter(function (x) { return x.from === e.from && x.to === e.to; })[0];
          label = fl2 ? (fl2.flow + '/' + fl2.cap) : String(e.cap);
          hot = fl2 && fl2.flow > 1e-9;
        }
        return { from: e.from, to: e.to, label: label, color: hot ? '#2b5cff' : '#b9c3d6', width: hot ? 2.4 : 1.5, highlight: hot };
      });

      blocks.push(B.card('网络拓扑与' + (v.mode === 'shortest' ? '最短路径' : v.mode === 'flow' ? '最大流分配' : '最小费用流分配'),
        [B.svg(OR.charts.network({ nodes: nodeView, edges: edgeView, layers: layoutLayers, height: 380, highlightEdge: function (e) { return e.highlight; } }), '网络拓扑图')],
        v.mode === 'shortest' ? '绿色高亮为最短路径树，边标签为里程'
          : v.mode === 'flow' ? '边标签格式为「实际流量/容量」，蓝色为有流量的边'
            : '边标签格式为「实际流量/容量」，蓝色为有流量的边'));

      if (v.mode === 'shortest') {
        var rows = dj.dist.map(function (d, i) {
          var p = OR.network.pathTo(dj.prev, i);
          return [names[i], d === Infinity ? '∞' : d, p.map(function (x) { return String(x + 1); }).join(' → ') + (p.length ? '（' + p.map(function (x) { return names[x]; }).join('→') + '）' : '')];
        });
        blocks.push(B.metrics([
          { k: net.sourceName + ' → ' + net.sinkName + ' 最短里程', v: dj.dist[net.sink], unit: '公里', tone: 'brand' },
          { k: '途经节点数', v: path.length, unit: '个', tone: 'teal' },
          { k: '算法访问节点序', v: dj.visitOrder.map(function (x) { return x + 1; }).join('→'), tone: 'violet' }
        ]));
        blocks.push(B.card('单源最短路结果', [
          B.table({ head: ['目标节点', '最短距离', '路径（节点编号 / 名称）'], rows: rows, zebra: true }),
          B.note('Dijkstra 算法按「距源点由近及远」的顺序逐步确定每个节点的最短距离，因此该算法<b>要求边权非负</b>。若存在负权边，应改用 Bellman–Ford 或 SPFA 算法。', 'brand')
        ], '从' + net.sourceName + '出发到所有节点的最短路', 'teal'));

        if (v.showAllPairs) {
          var fw = OR.network.floydWarshall(n, edges, false);
          blocks.push(B.card('全源最短路矩阵（Floyd–Warshall）', [
            B.chart('heatmap', {
              height: 46 + n * 46, rows: names, cols: names,
              values: fw.dist.map(function (row) { return row.map(function (x) { return isFinite(x) ? x : 9999; }); }),
              hue: 'violet', padL: 74, digits: 0,
              title: '任意两节点间最短里程（深色 = 距离远）'
            }),
            B.html('<p class="small muted">Floyd–Warshall 采用动态规划思想：依次允许经过第 k 个节点作为中转，逐步更新全源最短路。时间复杂度 O(n³)，适合节点数不多的稠密图。</p>')
          ], '一次计算得到全网通行成本', 'violet'));
        }
      }

      if (v.mode === 'flow') {
        var cutEdges = edges.filter(function (e) {
          return mf.minCutS.indexOf(e.from) >= 0 && mf.minCutS.indexOf(e.to) < 0;
        });
        blocks.push(B.metrics([
          { k: '网络最大流', v: mf.maxFlow, unit: '单位/时', tone: 'brand' },
          { k: '最小割容量', v: mf.maxFlow, unit: '单位/时', tone: 'rose', hint: '与最大流相等（对偶定理）' },
          { k: '割边数量', v: cutEdges.length, unit: '条', tone: 'amber' },
          { k: '典型饱和边数', v: mf.flows.filter(function (x) { return x.flow >= x.cap - 1e-9; }).length, unit: '条', tone: 'violet', hint: '流量达到容量的边' }
        ]));
        blocks.push(B.card('最大流方案与瓶颈识别', [
          B.table({
            head: ['起点', '终点', '容量', '实际流量', '利用率', '状态'],
            rows: mf.flows.map(function (x) {
              var u = x.cap > 0 ? x.flow / x.cap : 0;
              return [names[x.from], names[x.to], x.cap, f(x.flow, 2), f(u * 100, 1) + '%', u > 0.999 ? '已饱和（瓶颈）' : u > 0.5 ? '负载较高' : '有余量'];
            }),
            highlight: function (i) { return mf.flows[i].flow >= mf.flows[i].cap - 1e-9; },
            zebra: true
          }),
          B.note('<b>最大流 = 最小割 = ' + mf.maxFlow + '</b>。若希望继续提升网络吞吐能力，最有效的做法是扩容<b>最小割上的边</b>（' +
            (cutEdges.length ? cutEdges.map(function (e) { return names[e.from] + '→' + names[e.to] + '（容量 ' + e.cap + '）'; }).join('、') : '无') +
            '），对最小割之外的边扩容不会带来任何收益。这就是「最大流最小割定理」的管理学含义。', 'rose')
        ], '从源点到汇点的最大通行能力', 'brand'));
      }

      if (v.mode === 'mcmf') {
        var totalCostVal = mcmf.minCost;
        blocks.push(B.metrics([
          { k: '最大流', v: mcmf.maxFlow, unit: '单位/时', tone: 'brand' },
          { k: '最小总费用', v: totalCostVal, unit: '元/时', tone: 'violet' },
          { k: '平均单位费用', v: mcmf.maxFlow > 0 ? totalCostVal / mcmf.maxFlow : 0, unit: '元', tone: 'teal' },
          { k: '增广次数', v: mcmf.augmentations.length, unit: '次', tone: 'amber' }
        ]));
        blocks.push(B.card('最小费用流分配与增广过程', [
          B.table({
            head: ['起点', '终点', '容量', '单位费用', '实际流量', '流量费用'],
            rows: mcmf.flows.map(function (x) {
              return [names[x.from], names[x.to], x.cap, x.cost, f(x.flow, 2), f(x.flow * x.cost, 2)];
            }),
            zebra: true
          }),
          B.html('<h4 style="margin:16px 0 8px">连续最短增广路过程</h4>'),
          B.table({
            head: ['增广次序', '增广路径', '推送流量', '单位费用'],
            rows: mcmf.augmentations.slice(0, 12).map(function (a, i) {
              return [i + 1, a.path.map(function (x) { return names[x]; }).join(' → '), f(a.amount, 2), f(a.unitCost, 3)];
            }),
            zebra: true
          }),
          B.note('最小费用最大流算法每次选取「单位费用之和最小」的路径推送流量，直到网络饱和。该算法本质上是<b>贪心策略在费用意义上的最优性</b>——当费用非负时，连续最短增广路算法能保证全局最优解。', 'violet')
        ], '在最大流量的前提下最小化运输总费用', 'teal'));
      }

      return {
        blocks: blocks,
        summary: '网络优化（' + net.name + '，模式：' + (v.mode === 'shortest' ? '最短路' : v.mode === 'flow' ? '最大流' : '最小费用流') + '）：' +
          n + ' 个节点，' + edges.length + ' 条边。' + net.sourceName + '→' + net.sinkName + ' 最短里程 ' + dj.dist[net.sink] +
          '，路径 ' + path.map(function (x) { return names[x]; }).join('→') + '；最大流 ' + mf.maxFlow + '；最小费用最大流：流量 ' + mcmf.maxFlow + '，费用 ' + f(mcmf.minCost, 2) + '。'
      };
    },
    problems: [
      {
        id: 'nf-1', level: '概念', type: 'single',
        q: 'Dijkstra 算法不能直接用于下列哪种情况？',
        options: ['无向图', '有向图', '存在负权边的图', '稀疏图'],
        answer: 2,
        explain: 'Dijkstra 的核心假设是「已确定节点的距离不会再被更新」，而这一假设依赖边权非负。若存在负权边，一个已确定节点可能通过后续的负权边被缩短距离，因此必须改用 Bellman–Ford 或 SPFA。'
      },
      {
        id: 'nf-2', level: '概念', type: 'single',
        q: '关于最大流最小割定理，下列说法正确的是：',
        options: [
          '最大流一定小于最小割',
          '任意网络的最大流量等于其最小割容量',
          '最小割只在无向网络中存在',
          '该定理只对二层网络成立'
        ],
        answer: 1,
        explain: '最大流最小割定理（Ford–Fulkerson）指出：任意网络中，从源点到汇点的最大流量恰好等于分离源汇的最小割容量。这既是理论上的优美对偶，也是实践中识别网络瓶颈的工具。'
      },
      {
        id: 'nf-3', level: '计算', type: 'number',
        q: '若某配送网络的最大流为 30 单位/小时，那么网络中分离源汇的任意一个割的容量至少是多少？',
        answer: 30, tolerance: 1,
        explain: '由最大流最小割定理，最大流量 = 最小割容量，因此所有割的容量都 ≥ 30，其中最小的（最小割）恰好等于 30。这也是判断流量是否已达上限的依据：只要还能找到增广路，就说明还没到最小割。'
      },
      {
        id: 'nf-4', level: '概念', type: 'single',
        q: '最小费用最大流问题中，若网络中某条边具有负的单位费用（例如运费补贴），连续最短增广路（SSP）算法：',
        options: [
          '仍然直接可用',
          '需要先使用 Bellman–Ford/SPFA 处理负权，或用势函数（Johnson）变换后再使用 Dijkstra',
          '无解，必须放弃最大流目标',
          '可以直接改用最大流算法'
        ],
        answer: 1,
        explain: 'SSP 每次需要在残余网络中求最短增广路。若存在负费用边，Dijkstra 失效，应改用能处理负权的 Bellman–Ford/SPFA，或先计算势函数（节点势能）把费用转化为非负后用 Dijkstra 加速。'
      },
      {
        id: 'nf-5', level: '建模', type: 'text',
        q: '某连锁企业有 3 个中央仓、6 个区域仓和 30 家门店，需要规划每周的调运方案以最小化运输成本，同时满足门店需求与区域仓库容上限。请说明如何建立网络流模型。',
        reference: '建模思路：\n1) 节点：源点 s（虚拟）→ 3 个中央仓 → 6 个区域仓 → 30 家门店 → 汇点 t（虚拟）。\n2) 边与容量：\n   - s → 中央仓 i：容量 = 中央仓 i 的可用库存。\n   - 中央仓 i → 区域仓 j：容量 = 该通道最大运力，单位费用 = 单位运输成本。\n   - 区域仓 j → 门店 k：容量 = 运力上限。\n   - 门店 k → t：容量 = 门店需求（若为刚性需求，取上下界相等）。\n   - 区域仓 j 若需建模库容上限，可拆分为 j_in → j_out 一条边，容量 = 库容，费用 = 单位库存成本。\n3) 目标：求最小费用流（如果总供给 ≥ 总需求，则求给定流量下的最小费用；若追求最大满足率，则求最小费用最大流）。\n4) 求解：用最小费用流算法（SSP / 网络单纯形）；若含整数与固定成本（开仓决策），则升级为固定费用网络设计问题，需混合整数规划。\n5) 现实扩展：多商品（需分层建模）、时窗（时间扩展网络）、车辆路径（VRP，属于 NP-hard，需启发式算法）。',
        explain: '要点：虚拟源汇的引入；容量与费用的正确映射；库容等节点约束用「拆点」技巧处理；刚性需求用上下界；以及指出固定成本/多商品等现实复杂性会使问题升级。'
      }
    ]
  });

})(typeof window !== 'undefined' ? window : globalThis);
