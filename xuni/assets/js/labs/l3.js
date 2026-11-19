/* =============================================================================
 * 挑战级实验场景（Level 3）
 *   7. 项目工期风险      网络计划 PERT/CPM + 仿真 + 关键度指数
 *   8. 投资风险量化      蒙特卡洛仿真 + VaR/CVaR + 全局敏感性分析
 *   9. 资源动态分配      动态规划 / 0-1 背包 + 最优性原理
 * ========================================================================== */
(function (global) {
  'use strict';
  var OR = global.OR = global.OR || {};
  var B = OR.Lab.B, P = OR.Lab.P;
  var f = function (v, d) { return Number(Number(v).toFixed(d === undefined ? 3 : d)); };

  /* ==========================================================================
   * 7. 项目工期风险
   * ======================================================================= */
  var PROJECTS = {
    system: {
      name: '企业信息化系统建设',
      target: 26,
      acts: [
        { id: 'A', name: '需求调研', o: 3, m: 5, p: 9, preds: [] },
        { id: 'B', name: '方案设计', o: 4, m: 6, p: 11, preds: ['A'] },
        { id: 'C', name: '硬件采购', o: 5, m: 8, p: 14, preds: ['A'] },
        { id: 'D', name: '编码开发', o: 8, m: 12, p: 20, preds: ['B'] },
        { id: 'E', name: '数据迁移', o: 4, m: 7, p: 13, preds: ['C'] },
        { id: 'F', name: '系统集成', o: 3, m: 5, p: 9, preds: ['D', 'E'] },
        { id: 'G', name: '培训上线', o: 2, m: 4, p: 7, preds: ['F'] }
      ]
    },
    construction: {
      name: '物流仓库建设',
      target: 60,
      acts: [
        { id: 'A', name: '场地平整', o: 5, m: 8, p: 14, preds: [] },
        { id: 'B', name: '基础工程', o: 10, m: 15, p: 24, preds: ['A'] },
        { id: 'C', name: '钢结构采购', o: 8, m: 12, p: 20, preds: ['A'] },
        { id: 'D', name: '主体安装', o: 12, m: 18, p: 28, preds: ['B', 'C'] },
        { id: 'E', name: '电气消防', o: 6, m: 10, p: 18, preds: ['D'] },
        { id: 'F', name: '货架安装', o: 5, m: 9, p: 16, preds: ['D'] },
        { id: 'G', name: '系统调试', o: 4, m: 7, p: 12, preds: ['E', 'F'] }
      ]
    },
    rnd: {
      name: '新产品研发（高不确定性）',
      target: 40,
      acts: [
        { id: 'A', name: '可行性研究', o: 2, m: 6, p: 14, preds: [] },
        { id: 'B', name: '原型开发', o: 6, m: 14, p: 30, preds: ['A'] },
        { id: 'C', name: '材料选型', o: 3, m: 8, p: 20, preds: ['A'] },
        { id: 'D', name: '样机测试', o: 4, m: 10, p: 24, preds: ['B', 'C'] },
        { id: 'E', name: '工艺定型', o: 5, m: 9, p: 18, preds: ['D'] },
        { id: 'F', name: '认证申报', o: 6, m: 12, p: 26, preds: ['D'] },
        { id: 'G', name: '小批量试产', o: 4, m: 8, p: 16, preds: ['E', 'F'] }
      ]
    }
  };

  OR.Lab.register({
    id: 'pert-project',
    name: '项目工期风险',
    subtitle: 'PERT / CPM · 关键路线 · 工期仿真',
    level: 3, topic: '网络计划', icon: 'cpu', tone: 'rose',
    knowledge: {
      core: ['pert-cpm', 'pert-pert3', 'pert-prob'],
      support: ['net-shortest'],
      extend: ['pert-merge', 'sim-mc']
    },
    tags: ['关键路线法', '三点估计', '关键度指数', '蒙特卡洛'],
    brief: '在活动工期不确定的条件下评估项目按期完工的概率与风险。',
    scenario: '项目各活动工期难以精确预估，只能用乐观/最可能/悲观三点估计来描述。项目经理需要知道：项目期望工期是多少？哪些活动真正决定了总工期？按承诺日期完工的概率有多大？以及应当重点监控哪些高风险活动。',
    objectives: [
      '掌握三点估计与 PERT 期望工期、方差的计算',
      '熟练进行网络计划的正推/逆推计算（ES/EF/LS/LF）',
      '理解总时差与自由时差的管理含义，识别关键路线',
      '通过仿真获得项目工期的完整概率分布与按期完工概率',
      '运用关键度指数识别「潜在关键活动」，制定风险应对措施'
    ],
    theory: [
      '<b>三点估计</b>：期望工期 tₑ = (a + 4m + b)/6，方差 σ² = ((b − a)/6)²。其中 a 为乐观值、m 为最可能值、b 为悲观值。',
      '<b>正推计算</b>：ES = max{EF(紧前活动)}，EF = ES + tₑ。项目总工期 = max{EF}。',
      '<b>逆推计算</b>：LF = min{LS(紧后活动)}（末活动 LF = 总工期），LS = LF − tₑ。',
      '<b>时差</b>：总时差 TF = LS − ES（不推迟项目工期的可推迟量）；自由时差 FF = min{ES(紧后)} − EF（不影响紧后最早开始的可推迟量）。',
      '<b>关键路线</b>：总时差为 0 的活动构成的路径，决定项目总工期。关键路线上任何延误都会直接推迟项目。',
      '<b>关键度指数</b>：通过蒙特卡洛仿真统计各活动成为关键活动的频率，识别「潜在关键活动」。'
    ],
    params: [
      P.select('preset', '项目场景', Object.keys(PROJECTS).map(function (k) {
        return { value: k, label: PROJECTS[k].name };
      }), 'system'),
      P.group('风险与仿真设置', [
        P.range('riskFactor', '工期不确定性放大系数', { min: 0.2, max: 2.5, step: 0.1, value: 1, unit: '×', hint: '对悲观值 (b−a) 的缩放，1 表示使用原始估计' }),
        P.range('runs', '仿真次数', { min: 2000, max: 50000, step: 1000, value: 20000, unit: '次' }),
        P.range('target', '承诺完工工期 T₀', { min: 10, max: 120, step: 1, value: 26, unit: '天' }),
        P.range('seed', '随机种子', { min: 1, max: 9999, step: 1, value: 88, unit: '' })
      ])
    ],
    run: function (v) {
      var proj = PROJECTS[v.preset] || PROJECTS.system;
      var acts = proj.acts.map(function (a) {
        var mid = (a.o + a.p) / 2;
        var newP = mid + (a.p - mid) * v.riskFactor;
        return { id: a.id, name: a.name, o: a.o, m: a.m, p: newP, preds: a.preds.slice() };
      });
      var pert = OR.pert.compute(acts);
      if (pert.error) return { blocks: [B.note(pert.error, 'rose')], summary: '网络存在循环依赖' };

      var sim = OR.pert.simulate(pert, v.runs, v.seed);
      var T0 = v.target;
      var analyticalProb = pert.probability(T0);
      var simProb = sim.stats.sorted.length ? 1 - (function () {
        var lo = 0, hi = sim.stats.sorted.length;
        while (lo < hi) { var m = (lo + hi) >> 1; if (sim.stats.sorted[m] <= T0) lo = m + 1; else hi = m; }
        return lo / sim.stats.sorted.length;
      })() : 0;

      var blocks = [];
      blocks.push(B.metrics([
        { k: '期望总工期 Tₑ', v: pert.projectDuration, unit: '天', tone: 'rose' },
        { k: '关键路线标准差 σ', v: pert.cpSd, unit: '天', tone: 'violet' },
        { k: '仿真均值', v: sim.stats.mean, unit: '天', tone: 'brand', hint: '±' + f(sim.stats.se, 3) },
        { k: '承诺工期 T₀', v: T0, unit: '天', tone: 'amber' },
        { k: '按期完工概率（解析）', v: analyticalProb, tone: 'teal', hint: 'P(T ≤ T₀)' },
        { k: '按期完工概率（仿真）', v: simProb, tone: 'green', hint: '基于 ' + v.runs + ' 次抽样' }
      ]));

      /* 甘特图 */
      blocks.push(B.card('项目进度甘特图（含时差条）', [
        B.svg(OR.charts.gantt({ activities: pert.activities, total: Math.max(pert.projectDuration, 1) * 1.08 }), '甘特图'),
        B.html('<div class="legend"><span><i style="background:#e11d48"></i>关键活动（总时差 = 0）</span>' +
          '<span><i style="background:#2b5cff"></i>非关键活动</span>' +
          '<span><i style="background:rgba(244,63,94,.16)"></i>总时差（可推迟时间窗）</span></div>'),
        B.note('条形长度代表活动工期，浅色延伸部分为<b>总时差</b>——活动可以在不影响项目总工期的前提下推迟的最大时间。关键路线上（红色）的活动没有任何缓冲，必须严格监控。', 'rose')
      ], '关键路线：' + pert.criticalPath.join(' → '), 'violet'));

      /* 活动明细表 */
      blocks.push(B.card('网络计划计算表（正推 / 逆推）', [
        B.table({
          head: ['活动', '名称', '紧前', '乐观 a', '最可能 m', '悲观 b′', 'tₑ', 'σ²', 'ES', 'EF', 'LS', 'LF', '总时差', '自由时差', '关键'],
          rows: pert.activities.map(function (a) {
            return [a.id, a.name, a.preds.join(',') || '—', f(a.o, 0), f(a.m, 0), f(a.p, 1), f(a.te, 2), f(a.variance, 3),
              f(a.ES, 1), f(a.EF, 1), f(a.LS, 1), f(a.LF, 1), f(a.totalFloat, 2), f(a.freeFloat, 2), a.critical ? '★' : ''];
          }),
          highlight: function (i) { return pert.activities[i].critical; },
          zebra: true
        }),
        B.formula([
          '期望工期  tₑ = (a + 4m + b) / 6',
          '方差      σ² = ((b − a) / 6)²',
          '正推      ES = max{EF(紧前)}，EF = ES + tₑ',
          '逆推      LF = min{LS(紧后)}，LS = LF − tₑ',
          '总时差    TF = LS − ES；自由时差 FF = min{ES(紧后)} − EF',
          '完工概率  P(T ≤ T₀) = Φ((T₀ − Tₑ) / σ_cp) = Φ((' + T0 + ' − ' + f(pert.projectDuration, 2) + ') / ' + f(pert.cpSd, 3) + ') = ' + f(analyticalProb, 4)
        ])
      ], '每个活动的时间参数与灵活度', 'brand'));

      /* 完工概率曲线 */
      var probCurve = [];
      var lo = Math.max(0, pert.projectDuration - 3.2 * Math.max(pert.cpSd, 0.5));
      var hi = pert.projectDuration + 3.2 * Math.max(pert.cpSd, 0.5);
      for (var t = lo; t <= hi; t += (hi - lo) / 120) {
        probCurve.push({ x: f(t, 2), y: f(pert.probability(t) * 100, 3) });
      }
      blocks.push(B.card('按期完工概率分析', [
        B.chart('line', {
          height: 240,
          title: '项目工期累积分布：P(T ≤ T₀)',
          xLabel: '承诺工期 T₀（天）', yLabel: '完工概率（%）',
          series: [{ label: '解析累积概率', data: probCurve, color: '#2b5cff', area: true }],
          markers: [{ y: simProb * 100, color: '#10b981', label: '仿真概率 ' + f(simProb * 100, 1) + '%' }]
        }),
        B.table({
          head: ['目标工期', '按期完工概率', '风险等级', '管理建议'],
          rows: [0.7, 0.8, 0.85, 0.9, 0.95].map(function (q) {
            var Tq = pert.projectDuration + pert.cpSd * OR.stats.probit(q);
            return [f(Tq, 1) + ' 天', f(q * 100, 1) + '%', q >= 0.9 ? '低' : q >= 0.8 ? '中' : '高',
              q >= 0.9 ? '可作为对外承诺工期' : q >= 0.8 ? '需配合风险准备金与关键活动赶工' : '仅作为内部目标'];
          }),
          zebra: true
        }),
        B.note('若要在 <b>' + T0 + ' 天</b>内完工，概率约为 <b>' + f(simProb * 100, 1) + '%</b>。' +
          (simProb < 0.8 ? '该承诺风险偏高。建议：①对关键活动增加资源以压缩工期；②设置 10%~15% 的时间缓冲；③采用快速跟进（Fast Tracking）并行化部分活动，但需注意返工风险。' :
            '该承诺较为稳妥，但仍需对关键活动保持监控。'), simProb < 0.8 ? 'amber' : 'teal')
      ], '把「工期」从单点估计升级为概率分布', 'amber'));

      /* 仿真分布 + 关键度指数 */
      blocks.push(B.card('工期分布仿真与关键度指数', [
        B.chart('hist', {
          height: 220, bins: sim.histogram, label: '频次', color: '#8b6dff',
          title: '项目总工期分布（' + v.runs + ' 次仿真）'
        }),
        B.kv([
          ['仿真均值', f(sim.stats.mean, 3) + ' 天（解析 ' + f(pert.projectDuration, 3) + ' 天）'],
          ['标准差', f(sim.stats.sd, 3) + ' 天（解析 ' + f(pert.cpSd, 3) + ' 天）'],
          ['P10 / P50 / P90', f(sim.percentiles.p10, 1) + ' / ' + f(sim.percentiles.p50, 1) + ' / ' + f(sim.percentiles.p90, 1) + ' 天'],
          ['95% 置信区间（均值）', '[' + sim.stats.ci95[0] + ', ' + sim.stats.ci95[1] + '] 天']
        ]),
        B.chart('bar', {
          height: 220,
          title: '关键度指数：各活动在仿真中成为关键活动的频率',
          labels: sim.criticalityIndex.map(function (c) { return c.id; }),
          series: [{ label: '关键度指数', values: sim.criticalityIndex.map(function (c) { return f(c.index * 100, 1); }), color: '#f43f5e' }],
          showValues: true, yLabel: '%'
        }),
        B.note('解析法假设关键路线固定不变，但实际中由于工期随机波动，<b>关键路线会动态切换</b>。关键度指数高的活动（如 ' +
          sim.criticalityIndex.slice(0, 3).map(function (c) { return c.id + '(' + f(c.index * 100, 0) + '%)'; }).join('、') +
          '）应优先纳入风险监控清单。关键度指数介于 0.3~0.7 的活动被称为「<b>近关键活动</b>」，往往是工期延误的隐形来源。', 'violet')
      ], '比「单条关键路线」更真实的风险视图', 'teal'));

      return {
        blocks: blocks,
        summary: '项目网络计划（' + proj.name + '，风险放大系数 ' + v.riskFactor + '）：' + pert.activities.length + ' 个活动。' +
          '期望工期 Tₑ=' + f(pert.projectDuration, 2) + ' 天，关键路线 ' + pert.criticalPath.join('→') + '，关键路线标准差 σ=' + f(pert.cpSd, 3) +
          '。承诺工期 ' + T0 + ' 天的按期完工概率：解析 ' + f(analyticalProb, 4) + '，仿真 ' + f(simProb, 4) + '（' + v.runs + ' 次）。' +
          '关键度指数前三位：' + sim.criticalityIndex.slice(0, 3).map(function (c) { return c.id + '=' + f(c.index, 3); }).join('、') + '。' +
          '活动明细：' + pert.activities.map(function (a) { return a.id + '(tₑ=' + f(a.te, 2) + ',TF=' + f(a.totalFloat, 2) + ')'; }).join('，') + '。'
      };
    },
    problems: [
      {
        id: 'pt-1', level: '计算', type: 'number',
        q: '某活动乐观工期 a = 4 天，最可能工期 m = 10 天，悲观工期 b = 22 天。其 PERT 期望工期 tₑ 是多少天？（保留一位小数）',
        answer: 11.0, tolerance: 0.5,
        explain: 'tₑ = (a + 4m + b)/6 = (4 + 40 + 22)/6 = 66/6 = 11.0 天。该活动方差 σ² = ((22−4)/6)² = 3² = 9，标准差 3 天。'
      },
      {
        id: 'pt-2', level: '概念', type: 'single',
        q: '关于总时差（TF）与自由时差（FF），下列说法正确的是：',
        options: [
          'TF ≤ FF 恒成立',
          'FF ≤ TF 恒成立，且关键活动满足 TF = FF = 0',
          '两者完全相等',
          '自由时差可能大于总时差'
        ],
        answer: 1,
        explain: '自由时差只会消耗总时差中的一部分，因此恒有 FF ≤ TF。关键活动的总时差为 0，其自由时差也必为 0。当活动推迟量超过 FF 但小于 TF 时，会影响紧后活动的最早开始时间，但不影响项目总工期。'
      },
      {
        id: 'pt-3', level: '概念', type: 'single',
        q: '在 PERT 的经典假设下，项目总工期的标准差应当如何计算？',
        options: [
          '等于所有活动标准差的算术平均',
          '等于关键路线上各活动方差之和的平方根',
          '等于所有活动方差之和的平方根',
          '无法计算，只能用仿真'
        ],
        answer: 1,
        explain: 'PERT 假设各活动工期相互独立，且项目工期近似服从正态分布。此时总工期方差等于关键路线上各活动方差之和，标准差为其平方根。注意只累加关键路线的活动，非关键活动不直接影响总工期（这一近似忽略了关键路线切换的风险）。'
      },
      {
        id: 'pt-4', level: '概念', type: 'single',
        q: '某活动的关键度指数为 0.52。最合理的解读是：',
        options: [
          '该活动有 52% 的概率延期',
          '在随机波动下，该活动有 52% 的仿真次数成为关键活动，属于「近关键活动」需重点监控',
          '该活动的工期占总工期的 52%',
          '该活动的时差为总工期的 52%'
        ],
        answer: 1,
        explain: '关键度指数（Criticality Index）是在大量仿真中某活动位于关键路线上的频率。0.52 意味着它大约一半的情况下决定总工期，虽未稳定处于关键路线，但一旦工期波动就可能成为瓶颈，属于典型的「近关键活动」。'
      },
      {
        id: 'pt-5', level: '建模', type: 'text',
        q: '项目经理在评审会上被要求「给出一个 90% 把握能完工的日期」。请说明你将如何用本实验的工具回答这个问题，并讨论你的答案有什么局限。',
        reference: '回答步骤：\n1) 建立网络计划模型：整理活动清单、紧前关系、三点估计（a/m/b）。\n2) 计算期望工期与关键路线：tₑ=(a+4m+b)/6，正推逆推求 ES/EF/LS/LF，得到 Tₑ 与 σ_cp。\n3) 用仿真获得更稳健的分布：对每个活动按 PERT-Beta 抽样，重复 N 次（如 20000 次），得到工期样本分布；取第 90 百分位数作为承诺日期。\n4) 同时给出关键度指数，指出哪些活动若延期最可能拖累整体。\n局限：①假设活动工期相互独立，实际中同一资源短缺会导致工期正相关，此时总工期方差被低估；②网络结构本身可能变化（返工回路、设计变更）；③三点估计带有主观性，可用专家 Delphi 法或历史数据校准；④新资源投入可能改变工期分布，模型未考虑赶工的非线性效果；⑤未考虑非关键活动的资源冲突。建议在承诺日期上再叠加 5%~10% 的管理缓冲，并设置里程碑检查点。',
        explain: '评分要点：能清楚区分「解析法（基于关键路线正态近似）」与「仿真法（完整分布）」；给出具体的百分位数取值方法；并至少指出独立性假设、返工回路、估计主观性三个局限。'
      }
    ]
  });

  /* ==========================================================================
   * 8. 投资风险量化 —— 蒙特卡洛
   * ======================================================================= */
  OR.Lab.register({
    id: 'montecarlo-risk',
    name: '投资风险量化',
    subtitle: '蒙特卡洛仿真 · VaR / CVaR · 敏感性分析',
    level: 3, topic: '仿真与风险', icon: 'chart', tone: 'brand',
    knowledge: {
      core: ['sim-mc', 'sim-var', 'sim-cvar', 'sim-converge'],
      support: ['inv-newsvendor'],
      extend: ['sim-crn', 'sim-optim']
    },
    tags: ['蒙特卡洛', 'VaR', 'CVaR', '龙卷风图', '收敛性'],
    brief: '在多重不确定性叠加下，量化项目收益分布与下行风险。',
    scenario: '企业计划推出一款新产品，未来的年利润取决于销量、售价与单位变动成本三个不确定因素，固定投入已确定。管理层既关心期望利润，更关心「亏损的概率有多大」「最坏情况下会亏多少」「哪个因素对结果影响最大」。这类问题无法用解析公式求解，需要蒙特卡洛仿真。',
    objectives: [
      '理解蒙特卡洛仿真的建模流程：识别变量 → 设定分布 → 抽样 → 统计分析',
      '掌握风险度量指标 VaR 与 CVaR 的定义与经济含义',
      '理解仿真估计量的收敛性与置信区间，学会确定所需样本量',
      '通过全局敏感性分析（龙卷风图）识别关键风险驱动因素',
      '把仿真结果转化为可执行的风险管理策略'
    ],
    theory: [
      '<b>蒙特卡洛仿真</b>：对随机输入变量反复抽样并代入模型计算输出，用输出的经验分布逼近真实分布。收敛速度为 O(1/√N)，与维数无关——这是它相对数值积分的关键优势。',
      '<b>VaR（风险价值）</b>：在置信水平 α 下的最大损失阈值，即 P(Loss > VaR) = 1 − α。例如 VaR₉₅ = 从最差 5% 情形中最好的一点的利润值。',
      '<b>CVaR（条件风险价值）</b>：损失超过 VaR 时的条件期望，即 E[L | L > VaR]。也称期望短缺（Expected Shortfall），具有次可加性，是比 VaR 更一致的（coherent）风险度量。',
      '<b>龙卷风图</b>：单因素敏感性分析，固定其他变量为均值，让某一变量在其 P10~P90 之间变动，观察输出的波动幅度并按幅度排序。',
      '<b>样本量估计</b>：为达到 ±ε 的估计精度，所需样本量 n ≈ (1.96σ/ε)²。'
    ],
    params: [
      P.group('市场与价格假设', [
        P.range('demandMean', '年销量均值', { min: 1000, max: 60000, step: 500, value: 20000, unit: '件' }),
        P.range('demandCv', '销量变异系数', { min: 0.05, max: 0.8, step: 0.05, value: 0.25, unit: 'σ/μ' }),
        P.range('priceMean', '单位售价均值', { min: 20, max: 300, step: 5, value: 120, unit: '元' }),
        P.range('priceCv', '售价变异系数', { min: 0, max: 0.4, step: 0.02, value: 0.08, unit: 'σ/μ' })
      ]),
      P.group('成本结构', [
        P.range('unitVarMean', '单位变动成本均值', { min: 10, max: 250, step: 5, value: 78, unit: '元' }),
        P.range('unitVarCv', '变动成本变异系数', { min: 0, max: 0.5, step: 0.02, value: 0.12, unit: 'σ/μ' }),
        P.range('fixedCost', '年固定成本', { min: 0, max: 3000000, step: 50000, value: 600000, unit: '元' })
      ]),
      P.group('仿真设置', [
        P.range('runs', '仿真次数 N', { min: 1000, max: 200000, step: 1000, value: 20000, unit: '次' }),
        P.range('alpha', '风险置信水平 α', { min: 0.8, max: 0.99, step: 0.01, value: 0.95, unit: '' , hint: 'α 越高表示越保守（关注更极端的尾部）' }),
        P.range('seed', '随机种子', { min: 1, max: 9999, step: 1, value: 2026, unit: '' })
      ], true)
    ],
    run: function (v) {
      var rand = OR.rng(v.seed);
      var D = OR.makeDist(rand);
      var sdD = v.demandMean * v.demandCv, sdP = v.priceMean * v.priceCv, sdV = v.unitVarMean * v.unitVarCv;

      var profits = new Array(v.runs);
      var qArr = new Array(v.runs), pArr = new Array(v.runs), vArr = new Array(v.runs);
      for (var i = 0; i < v.runs; i++) {
        var Q = Math.max(0, D.normal(v.demandMean, sdD));
        var Pr = Math.max(1, D.normal(v.priceMean, sdP));
        var Vc = Math.max(0, D.normal(v.unitVarMean, sdV));
        var profit = (Pr - Vc) * Q - v.fixedCost;
        profits[i] = profit; qArr[i] = Q; pArr[i] = Pr; vArr[i] = Vc;
      }
      var st = OR.stats.statistics(profits);
      var vc = OR.stats.varCvar(profits, v.alpha);
      var hist = OR.stats.histogram(profits, 46);

      var lossProb = profits.filter(function (p) { return p < 0; }).length / v.runs;
      var targetProfit = 0;   // 盈亏平衡
      var meanQ = qArr.reduce(function (a, b) { return a + b; }, 0) / v.runs;
      var meanP = pArr.reduce(function (a, b) { return a + b; }, 0) / v.runs;
      var meanV = vArr.reduce(function (a, b) { return a + b; }, 0) / v.runs;

      var blocks = [];
      blocks.push(B.metrics([
        { k: '期望年利润', v: st.mean, unit: '元', tone: 'brand' },
        { k: '利润标准差', v: st.sd, unit: '元', tone: 'violet' },
        { k: 'VaR' + Math.round(v.alpha * 100), v: vc.VaR, unit: '元', tone: 'rose', hint: '有 ' + f((1 - v.alpha) * 100, 1) + '% 概率低于此值' },
        { k: 'CVaR' + Math.round(v.alpha * 100), v: vc.CVaR, unit: '元', tone: 'rose', hint: '尾部' + f((1 - v.alpha) * 100, 0) + '% 的平均水平' },
        { k: '亏损概率 P(π<0)', v: lossProb, tone: lossProb > 0.2 ? 'rose' : lossProb > 0.05 ? 'amber' : 'green' },
        { k: '估计标准误', v: st.se, unit: '元', tone: 'amber' }
      ]));

      /* 分布直方图 + VaR */
      blocks.push(B.card('利润分布与风险价值', [
        B.chart('hist', {
          height: 250, bins: hist, label: '频次', color: '#2b5cff',
          title: '年利润概率分布（' + v.runs.toLocaleString() + ' 次仿真）'
        }),
        B.html('<div class="legend"><span><i style="background:#2b5cff"></i>利润分布</span>' +
          '<span><i style="background:#f43f5e"></i>VaR' + Math.round(v.alpha * 100) + ' = ' + OR.ui.num(vc.VaR, 0) + ' 元</span>' +
          '<span><i style="background:#0c1424"></i>期望利润 = ' + OR.ui.num(st.mean, 0) + ' 元</span>' +
          '<span><i style="background:#8492ad"></i>盈亏平衡线 π = 0</span></div>'),
        B.table({
          head: ['分位数', '利润水平（元）', '解读'],
          rows: [
            ['P95（乐观）', OR.ui.num(st.p95, 0), '最乐观的 5% 情形至少达到该水平'],
            ['P75', OR.ui.num(st.p75, 0), '四分之一的情形优于该水平'],
            ['P50（中位数）', OR.ui.num(st.median, 0), '一半情形高于、一半低于'],
            ['P25', OR.ui.num(st.p25, 0), '四分之一的情形差于该水平'],
            ['P5', OR.ui.num(st.p5, 0), '最差的 5% 情形平均：' + OR.ui.num(vc.CVaR, 0) + ' 元']
          ],
          highlight: function (i) { return i === 4; },
          zebra: true
        })
      ], '从单点预测到完整分布', 'brand'));

      /* 累积分布 */
      var cdf = [];
      var step = Math.max(1, Math.floor(st.sorted.length / 300));
      for (var k = 0; k < st.sorted.length; k += step) {
        cdf.push({ x: f(st.sorted[k], 1), y: f((k + 1) / st.sorted.length * 100, 3) });
      }
      blocks.push(B.card('风险曲线：累积分布与关键概率', [
        B.chart('line', {
          height: 230,
          title: '利润累积分布函数 F(π)：利润不超过某一水平的概率',
          xLabel: '年利润（元）', yLabel: '累积概率（%）',
          series: [{ label: 'F(π)', data: cdf, color: '#8b6dff', area: true }],
          markers: [{ y: lossProb * 100, color: '#f43f5e', label: '亏损概率 ' + f(lossProb * 100, 1) + '%' }]
        }),
        B.kv([
          ['P(利润 < 0)', f(lossProb * 100, 2) + '%'],
          ['P(利润 < 200 万)', f(profits.filter(function (p) { return p < 2000000; }).length / v.runs * 100, 2) + '%'],
          ['P(利润 > 300 万)', f(profits.filter(function (p) { return p > 3000000; }).length / v.runs * 100, 2) + '%'],
          ['盈亏平衡销量', f(v.fixedCost / Math.max(0.01, meanP - meanV), 0) + ' 件（按均值参数）'],
          ['安全边际', f((meanQ - v.fixedCost / Math.max(0.01, meanP - meanV)) / Math.max(1, meanQ) * 100, 2) + '%']
        ]),
        B.note('安全边际 = （预计销量 − 盈亏平衡销量）/ 预计销量。该值越大，企业抵御市场下滑的能力越强。当前 ' +
          f((meanQ - v.fixedCost / Math.max(0.01, meanP - meanV)) / Math.max(1, meanQ) * 100, 1) + '% 的安全边际意味着销量即使下降同样比例仍可保本。', 'amber')
      ], 'VaR 之外，管理者更常问的是「亏钱的概率有多大」', 'violet'));

      /* 收敛性 */
      var conv = [], convLo = [], convHi = [], runSum = 0, runSumSq = 0;
      var pts = Math.min(v.runs, 4000);
      for (var j2 = 0; j2 < v.runs; j2++) {
        runSum += profits[j2]; runSumSq += profits[j2] * profits[j2];
        if (j2 < pts && (j2 % Math.max(1, Math.floor(pts / 200)) === 0 || j2 === v.runs - 1)) {
          var nn = j2 + 1;
          var mm = runSum / nn;
          var vv = nn > 1 ? Math.max(0, (runSumSq - nn * mm * mm) / (nn - 1)) : 0;
          var hw = 1.96 * Math.sqrt(vv / nn);
          conv.push({ x: nn, y: f(mm, 1) });
          convLo.push({ x: nn, y: f(mm - hw, 1) });
          convHi.push({ x: nn, y: f(mm + hw, 1) });
        }
      }
      blocks.push(B.card('收敛性诊断：样本量对估计精度的影响', [
        B.chart('line', {
          height: 230,
          title: '样本均值随仿真次数的收敛过程（含 95% 置信带）',
          xLabel: '仿真次数 N', yLabel: '期望利润（元）',
          series: [
            { label: '95% 置信下界', data: convLo, color: '#aab6cc', dash: [4, 3] },
            { label: '95% 置信上界', data: convHi, color: '#aab6cc', dash: [4, 3] },
            { label: '样本均值', data: conv, color: '#2b5cff', width: 2.2 }
          ]
        }),
        (function () {
          var needed = Math.pow(1.96 * st.sd / (Math.abs(st.mean) * 0.01 || 1), 2);
          return B.table({
            head: ['目标相对精度', '所需样本量', '当前样本量下的实际精度'],
            rows: [
              ['±10%', Math.ceil(Math.pow(1.96 * st.sd / (Math.abs(st.mean) * 0.1 || 1), 2)).toLocaleString(), f(1.96 * st.se / Math.abs(st.mean) * 100, 2) + '%'],
              ['±5%', Math.ceil(Math.pow(1.96 * st.sd / (Math.abs(st.mean) * 0.05 || 1), 2)).toLocaleString(), '—'],
              ['±2%', Math.ceil(Math.pow(1.96 * st.sd / (Math.abs(st.mean) * 0.02 || 1), 2)).toLocaleString(), '—'],
              ['±1%', Math.ceil(needed).toLocaleString(), '—']
            ],
            highlight: function (i) { return i === 0; },
            zebra: true
          });
        })(),
        B.note('仿真精度按 <b>1/√N</b> 提升：把精度提高一倍需要把样本量增加 4 倍。因此在实际项目中应先做小规模试算确定方差，再据此确定样本量，避免无谓的计算浪费。', 'teal')
      ], '多少样本才够？误差如何随样本量下降', 'amber'));

      /* 龙卷风图 */
      var baseProfit = (v.priceMean - v.unitVarMean) * v.demandMean - v.fixedCost;
      var z10 = OR.stats.probit(0.10), z90 = OR.stats.probit(0.90);
      var tornado = [
        { name: '年销量', low: (v.priceMean - v.unitVarMean) * (v.demandMean + z10 * sdD) - v.fixedCost, high: (v.priceMean - v.unitVarMean) * (v.demandMean + z90 * sdD) - v.fixedCost },
        { name: '单位售价', low: (v.priceMean + z10 * sdP - v.unitVarMean) * v.demandMean - v.fixedCost, high: (v.priceMean + z90 * sdP - v.unitVarMean) * v.demandMean - v.fixedCost },
        { name: '单位变动成本', low: (v.priceMean - (v.unitVarMean + z10 * sdV)) * v.demandMean - v.fixedCost, high: (v.priceMean - (v.unitVarMean + z90 * sdV)) * v.demandMean - v.fixedCost },
        { name: '年固定成本', low: (v.priceMean - v.unitVarMean) * v.demandMean - (v.fixedCost * 1.15), high: (v.priceMean - v.unitVarMean) * v.demandMean - (v.fixedCost * 0.85) }
      ].map(function (t) {
        return { name: t.name, low: t.low, high: t.high, swing: Math.abs(t.high - t.low) };
      }).sort(function (a, b) { return b.swing - a.swing; });

      blocks.push(B.card('全局敏感性分析（龙卷风图）', [
        B.table({
          head: ['风险因素', 'P10 情形利润（元）', 'P90 情形利润（元）', '波动幅度（元）', '贡献占比'],
          rows: tornado.map(function (t) {
            var totalSwing = tornado.reduce(function (s, x) { return s + x.swing; }, 0);
            return [t.name, OR.ui.num(t.low, 0), OR.ui.num(t.high, 0), OR.ui.num(t.swing, 0), f(t.swing / totalSwing * 100, 1) + '%'];
          }),
          highlight: function (i) { return i === 0; },
          zebra: true
        }),
        B.chart('bar', {
          height: 60 + tornado.length * 42,
          title: '各因素单独变动（P10→P90）对年利润的影响幅度',
          labels: tornado.map(function (t) { return t.name; }),
          series: [
            { label: '不利情形', values: tornado.map(function (t) { return OR.ui.num(Math.min(t.low, t.high) - baseProfit, 0); }), color: '#f43f5e' },
            { label: '有利情形', values: tornado.map(function (t) { return OR.ui.num(Math.max(t.low, t.high) - baseProfit, 0); }), color: '#10b981' }
          ],
          horizontal: true, legend: true
        }),
        B.note('龙卷风图按影响幅度排序，条形越长表示该因素越关键。本项目中 <b>' + tornado[0].name + '</b> 是最大的风险来源（波动幅度 ' +
          OR.ui.num(tornado[0].swing, 0) + ' 元，占总波动的 ' + f(tornado[0].swing / tornado.reduce(function (s, x) { return s + x.swing; }, 0) * 100, 1) + '%）。' +
          '风险管理的着力点应放在降低该因素的不确定性上——例如通过预售锁定销量、签订长期供货合同稳定成本。', 'rose')
      ], '找出影响最大的风险因素，把资源用在刀刃上', 'teal'));

      /* 建议 */
      blocks.push(B.card('风险管理建议', [
        B.list([
          '期望年利润 <b>' + OR.ui.num(st.mean, 0) + ' 元</b>，但标准差高达 <b>' + OR.ui.num(st.sd, 0) + ' 元</b>（变异系数 ' + f(st.sd / Math.abs(st.mean) * 100, 1) + '%），说明收益的波动性本身就是重要风险。',
          'VaR' + Math.round(v.alpha * 100) + ' = <b>' + OR.ui.num(vc.VaR, 0) + ' 元</b>：有 ' + f((1 - v.alpha) * 100, 1) + '% 的概率年利润低于该值；而一旦进入这个尾部区间，平均亏损水平（CVaR）为 <b>' + OR.ui.num(vc.CVaR, 0) + ' 元</b>。',
          lossProb > 0.15
            ? '亏损概率达 <b>' + f(lossProb * 100, 1) + '%</b>，明显偏高。建议：①压缩固定成本以降低盈亏平衡点；②采用分阶段投资（实物期权思想），先小规模试产再决定是否放量；③通过预付款/预售锁定部分销量。'
            : lossProb > 0.03
              ? '亏损概率 ' + f(lossProb * 100, 1) + '%，处于可接受范围。建议设置专项风险准备金覆盖 CVaR 水平的下行缺口，并建立月度滚动预测机制。'
              : '亏损概率仅 ' + f(lossProb * 100, 2) + '%，项目风险可控，可考虑扩大投资规模以获取更高期望收益。',
          '敏感性分析表明 <b>' + tornado[0].name + '</b> 是最关键的风险驱动因素。建议优先针对该因素设计对冲方案（如长约、保险、多元化）。',
          '注意 VaR 的局限性：VaR 只刻画阈值而忽略尾部厚度。本项目中 CVaR 显著低于 VaR（相差 ' + OR.ui.num(vc.VaR - vc.CVaR, 0) + ' 元），说明尾部损失可能很严重，应以 CVaR 作为主要决策依据。'
        ])
      ], '从分布到行动', 'violet'));

      return {
        blocks: blocks,
        summary: '蒙特卡洛投资风险仿真（' + v.runs + ' 次）：销量 ~ N(' + v.demandMean + ', ' + f(sdD, 1) + '²)，售价 ~ N(' + v.priceMean + ', ' + f(sdP, 2) + '²)，单位变动成本 ~ N(' + v.unitVarMean + ', ' + f(sdV, 2) + '²)，固定成本 ' + v.fixedCost +
          '。期望利润 ' + f(st.mean, 0) + ' 元（标准差 ' + f(st.sd, 0) + '），VaR' + Math.round(v.alpha * 100) + '=' + f(vc.VaR, 0) + '，CVaR' + Math.round(v.alpha * 100) + '=' + f(vc.CVaR, 0) +
          '，亏损概率 ' + f(lossProb * 100, 2) + '%，P50=' + f(st.median, 0) + '。敏感性排序：' + tornado.map(function (t) { return t.name + '(波动' + f(t.swing, 0) + ')'; }).join('、') + '。'
      };
    },
    problems: [
      {
        id: 'mc-1', level: '概念', type: 'single',
        q: '关于 VaR 与 CVaR 的关系，下列说法正确的是：',
        options: [
          'CVaR 一定大于 VaR',
          'CVaR 一定小于等于 VaR，且反映尾部损失的严重程度',
          '两者一定相等',
          'CVaR 与置信水平无关'
        ],
        answer: 1,
        explain: 'CVaR 是「损失超过 VaR 时的条件期望」，因此必然 ≤ VaR（对收益型指标而言）。CVaR 补充刻画了尾部的厚度，且满足次可加性（分散化不会增加风险），因此被视为比 VaR 更一致的风险度量。'
      },
      {
        id: 'mc-2', level: '计算', type: 'number',
        q: '蒙特卡洛仿真的标准差估计为 σ = 200,000 元，若要使得期望利润的估计误差（95% 置信）不超过 10,000 元，至少需要多少次仿真？（取整数近似）',
        answer: 1537, tolerance: 60,
        explain: '由 1.96·σ/√N ≤ ε 得 N ≥ (1.96σ/ε)² = (1.96×200000/10000)² = 39.2² ≈ 1537。这说明仿真精度按 1/√N 提升——要把误差减半，样本量需要增加 4 倍。'
      },
      {
        id: 'mc-3', level: '概念', type: 'single',
        q: '蒙特卡洛仿真相比解析法（如卷积、矩母函数）的主要优势是：',
        options: [
          '计算速度一定更快',
          '收敛速度与问题维数无关，可处理任意非线性/复杂模型',
          '结果永远精确',
          '不需要设定输入变量的分布'
        ],
        answer: 1,
        explain: '蒙特卡洛的标准误差为 O(1/√N)，这一速率与随机变量的维数无关；而数值积分或网格法在维数升高时会遭遇「维数灾难」。因此蒙特卡洛特别适合多变量、非线性、含逻辑判断的复杂模型。其代价是结果带有随机误差，且必须明确设定输入分布。'
      },
      {
        id: 'mc-4', level: '概念', type: 'single',
        q: '龙卷风图（Tornado Chart）展示的是：',
        options: [
          '各风险因素的概率分布',
          '在其他因素保持基准值时，单个因素在其不确定性区间内变化对输出的影响幅度',
          '风险因素之间的相关系数',
          '历史的收益波动序列'
        ],
        answer: 1,
        explain: '龙卷风图属于「单因素敏感性分析」：每次只让一个输入变量在 P10~P90（或其他合理区间）内变动，其余变量固定在基值，记录输出的变化幅度，最后按幅度从大到小排序。它直观地揭示了哪个因素最值得优先管理。'
      },
      {
        id: 'mc-5', level: '建模', type: 'text',
        q: '你所在企业正评估一项 3 年期的新业务投资，需要向决策层说明可能的最大亏损。请描述你会如何设计蒙特卡洛仿真方案，并说明如何向非技术背景的管理者解释结果。',
        reference: '仿真设计：\n1) 明确输出变量：3 年累计税后净现值（NPV）或内部收益率（IRR）。\n2) 分解驱动因素并设定分布：市场需求量（可用历史数据拟合或专家判断，常用三角分布/对数正态）、单位售价（考虑竞争与通胀）、单位变动成本（含原材料价格波动）、固定投入（工程预算超支）、折现率。\n3) 检验相关性：售价与需求往往负相关，原材料成本与售价可能正相关。需引入相关系数矩阵或 Copula（如 Gaussian/Clayton）而非独立抽样，否则会低估尾部风险。\n4) 抽样与计算：采用拉丁超立方抽样（LHS）降低方差；对每个样本计算 NPV；重复 N 次（先试算 5000 次估计方差，再确定 N）。\n5) 统计分析：给出 NPV 的分布、均值、标准差、P5/P50/P95、P(NPV<0)、VaR95、CVaR95；做龙卷风图识别关键因素；做收敛性诊断。\n6) 决策建议：根据 CVaR 设定风险准备金；对关键因素设计对冲或分阶段投资方案。\n向管理层解释的方法：避免直接说「VaR 是 95% 分位数」；改用「在最不走运的 5% 情形下，我们至少会亏 X 万元；如果真进入这种情形，平均亏 Y 万元」；用直方图和红绿对比展示「盈利概率」，并强调关键假设（尤其是相关性假设）会如何改变结论。敏感度要说明：模型结论的可靠性取决于输入分布的准确性。',
        explain: '评分要点：完整的「输出定义—因素分解—分布设定—相关性处理—抽样计算—统计分析—决策转化」链条；提到 LHS 或方差缩减技术加分；强调相关性对尾部风险的影响；最后的「沟通方案」要体现把统计语言翻译成管理语言的能力。'
      }
    ]
  });

  /* ==========================================================================
   * 9. 资源动态分配 —— 动态规划
   * ======================================================================= */
  var DP_ITEMS = [
    { name: '智能排产系统', weight: 5, value: 12, dept: '生产' },
    { name: '仓储自动化改造', weight: 7, value: 18, dept: '物流' },
    { name: '客户数据平台', weight: 4, value: 9, dept: '市场' },
    { name: '供应链协同平台', weight: 6, value: 14, dept: '供应链' },
    { name: '能耗监测系统', weight: 3, value: 6, dept: '设备' },
    { name: '质量追溯系统', weight: 4, value: 8, dept: '质量' },
    { name: '设备预测维护', weight: 6, value: 13, dept: '设备' },
    { name: '供应商门户', weight: 3, value: 5, dept: '采购' }
  ];

  OR.Lab.register({
    id: 'dp-allocation',
    name: '资源动态分配',
    subtitle: '动态规划 · 0-1 背包 · 最优性原理',
    level: 3, topic: '动态规划', icon: 'cpu', tone: 'amber',
    knowledge: {
      core: ['dp-bellman', 'dp-knapsack', 'dp-resource'],
      support: ['lp-model'],
      extend: ['dp-state', 'ip-binary']
    },
    tags: ['最优性原理', '多维决策', '背包问题', '状态转移'],
    brief: '在有限预算下组合多个候选项目，使总收益最大。',
    scenario: '企业有 20 个单位的数字化预算，面对 8 个候选信息化项目，每个项目需要不同的资源投入并带来不同的预期收益。项目要么做要么不做（不可拆分）。管理层需要在预算内挑选一个项目组合，使总收益最大化，并理解「为什么不能简单地优先做性价比最高的项目」。',
    objectives: [
      '理解动态规划的最优性原理与多阶段决策思想',
      '掌握状态、阶段、决策、状态转移方程的建模方法',
      '能够手算小规模背包问题的 DP 表并回溯最优解',
      '通过与贪心算法的对比理解全局最优的条件',
      '了解动态规划的时间复杂度与空间优化技巧'
    ],
    theory: [
      '<b>最优性原理</b>（Bellman）：无论初始状态与初始决策如何，其余的决策对于由初始决策所形成的状态而言，必然构成一个最优策略。',
      '<b>状态定义</b>：f(i, w) = 只考虑前 i 个项目、预算为 w 时能获得的最大收益。',
      '<b>状态转移方程</b>：f(i, w) = max{ f(i−1, w), f(i−1, w − wᵢ) + vᵢ }（当 w ≥ wᵢ）。',
      '<b>边界条件</b>：f(0, w) = 0，f(i, 0) = 0。',
      '<b>回溯</b>：从 f(n, W) 出发，若 f(i,w) ≠ f(i−1,w) 则第 i 个项目被选中，w 减去其权重。',
      '<b>复杂度</b>：时间与空间均为 O(nW)，属于伪多项式算法；由于背包问题是 NP-hard，当权重为大整数时并不存在多项式算法。'
    ],
    params: [
      P.seg('mode', '模型', [
        { value: 'knapsack', label: '0-1 背包（项目组合）' },
        { value: 'allocation', label: '资源分配（多部门）' }
      ], 'knapsack'),
      P.group('背包问题参数', [
        P.range('capacity', '预算总量 W', { min: 5, max: 35, step: 1, value: 20, unit: '单位' }),
        P.range('maxItems', '候选项目数', { min: 4, max: 8, step: 1, value: 8, unit: '个' })
      ]),
      P.group('资源分配参数', [
        P.range('totalRes', '可分配资源总量', { min: 3, max: 12, step: 1, value: 8, unit: '单位' }),
        P.range('departments', '分配部门数', { min: 2, max: 4, step: 1, value: 3, unit: '个' })
      ], true),
      P.toggle('showGreedy', '对比贪心算法', true)
    ],
    run: function (v) {
      if (v.mode === 'allocation') return runAllocation(v);
      return runKnapsack(v);

      /* ---------- 0-1 背包 ---------- */
      function runKnapsack(v) {
        var items = DP_ITEMS.slice(0, v.maxItems);
        var r = OR.dp.knapsack01(items, v.capacity);
        var chosenIdx = r.chosen;

        // 贪心：按 价值/重量 比降序装入
        var greedy = { totalValue: 0, totalWeight: 0, chosen: [] };
        if (v.showGreedy) {
          var sorted = items.map(function (it, i) { return { it: it, i: i, ratio: it.value / it.weight }; })
            .sort(function (a, b) { return b.ratio - a.ratio; });
          var cap = v.capacity;
          sorted.forEach(function (s) {
            if (s.it.weight <= cap) {
              cap -= s.it.weight;
              greedy.totalValue += s.it.value;
              greedy.totalWeight += s.it.weight;
              greedy.chosen.push(s.i);
            }
          });
        }

        var metrics = [
          { k: '最优总收益', v: r.maxValue, unit: '分', tone: 'amber' },
          { k: '选中项目数', v: chosenIdx.length, unit: '个', tone: 'brand' },
          { k: '消耗预算', v: r.totalWeight + ' / ' + v.capacity, unit: '单位', tone: 'teal' },
          { k: '预算利用率', v: r.totalWeight / v.capacity, tone: 'violet' },
          { k: 'DP 表格规模', v: items.length + '×' + (v.capacity + 1), tone: 'green', hint: (items.length * (v.capacity + 1)) + ' 个状态' }
        ];
        if (v.showGreedy) metrics.push({ k: '贪心算法收益', v: greedy.totalValue, unit: '分', tone: 'rose', hint: '比最优低 ' + f(r.maxValue - greedy.totalValue, 0) + ' 分' });

        var blocks = [B.metrics(metrics)];

        blocks.push(B.card('候选项目与最优组合', [
          B.table({
            head: ['编号', '项目名称', '所属部门', '资源投入', '预期收益', '性价比', '是否入选'],
            rows: items.map(function (it, i) {
              return ['P' + (i + 1), it.name, it.dept, it.weight, it.value, f(it.value / it.weight, 3), chosenIdx.indexOf(i) >= 0 ? '✓ 入选' : '未入选'];
            }),
            highlight: function (i) { return chosenIdx.indexOf(i) >= 0; },
            zebra: true
          }),
          B.note('最优组合：<b>' + chosenIdx.map(function (i) { return items[i].name; }).join('、') + '</b>，' +
            '总投入 ' + r.totalWeight + ' 单位（预算 ' + v.capacity + '），总收益 <b>' + r.maxValue + ' 分</b>。' +
            (v.showGreedy ? ' 相比之下贪心算法只得到 ' + greedy.totalValue + ' 分，差距 ' + (r.maxValue - greedy.totalValue) + ' 分——因为高性价比项目占用了资源，导致无法装入组合起来更优的项目。' : ''), 'amber')
        ], '在预算约束下最大化总收益', 'amber'));

        /* DP 表热力图 */
        var dpRows = [], dpVals = [];
        for (var i = 0; i <= items.length; i++) {
          dpRows.push(i === 0 ? '初始' : 'P' + i);
          var row = r.table[i];
          dpVals.push(row.map(function (x) { return x; }));
        }
        // 回溯路径（用于表格高亮）
        var backtrackCells = (function () {
          var cells = {};
          var w = v.capacity;
          for (var k = items.length; k > 0; k--) {
            cells[k] = cells[k] || {};
            cells[k][w] = true;
            if (r.table[k][w] !== r.table[k - 1][w]) w -= Math.round(items[k - 1].weight);
            cells[k - 1] = cells[k - 1] || {};
            cells[k - 1][w] = true;
          }
          return cells;
        })();
        blocks.push(B.card('动态规划状态表 f(i, w)', [
          B.chart('heatmap', {
            height: 40 + (items.length + 1) * 34,
            rows: dpRows, cols: (function () { var a = []; for (var w = 0; w <= v.capacity; w++) a.push(String(w)); return a; })(),
            values: dpVals, hue: 'amber', padL: 54, digits: 0,
            title: 'f(i, w)：前 i 个项目、预算 w 时的最大收益（红框为回溯路径）',
            highlight: function (i, j) { return backtrackCells[i] && backtrackCells[i][j]; }
          }),
          B.html('<p class="small muted">表格按「阶段（项目）」逐行填充，每格表示对应子问题的最优值。红色路径为回溯得到的最优决策序列。</p>')
        ], '动态规划的核心：把大问题分解为可复用的子问题', 'violet'));

        /* 分阶段决策 */
        blocks.push(B.card('分阶段决策过程', [
          B.steps(items.map(function (it, i) {
            var isChosen = chosenIdx.indexOf(i) >= 0;
            return {
              title: '阶段 ' + (i + 1) + '：' + it.name + (isChosen ? ' —— 入选' : ' —— 放弃'),
              text: '投入 ' + it.weight + ' 单位、收益 ' + it.value + ' 分。' +
                (isChosen ? '在剩余预算下，纳入该项目能提升总收益，故决策为「选」。' : '纳入后会导致后续更优项目无法装入，期望总收益反而下降，故决策为「不选」。'),
              done: isChosen
            };
          })),
          B.formula([
            '<span class="cm">状态定义</span>  f(i, w) = 考虑前 i 个项目、预算为 w 时的最大收益',
            '<span class="cm">转移方程</span>  f(i, w) = max{ f(i−1, w), f(i−1, w − wᵢ) + vᵢ }   (w ≥ wᵢ)',
            '<span class="cm">边界条件</span>  f(0, w) = 0,  f(i, 0) = 0',
            '<span class="cm">回溯规则</span>  若 f(i, w) ≠ f(i−1, w) 则选第 i 项，w ← w − wᵢ',
            '',
            '本问题规模：n = ' + items.length + '，W = ' + v.capacity + '，状态数 = ' + (items.length * (v.capacity + 1)) + '，最优值 = ' + r.maxValue
          ])
        ], '从最后阶段向前回溯得到最优决策序列', 'teal'));

        if (v.showGreedy) {
          blocks.push(B.card('贪心 vs 动态规划', [
            B.table({
              head: ['算法', '策略', '总投入', '总收益', '是否保证最优'],
              rows: [
                ['按性价比贪心', '优先装入 价值/重量 比最高且能装下的项目', greedy.totalWeight, greedy.totalValue, '否'],
                ['动态规划', '穷举所有子问题并保留最优解（记忆化搜索）', r.totalWeight, r.maxValue, '是']
              ],
              highlight: function (i) { return i === 1; },
              zebra: true
            }),
            B.note('背包问题是 <b>NP-hard</b> 的，不存在多项式时间的精确算法（除非 P=NP）。动态规划的时间复杂度 O(nW) 是「伪多项式」——当 W 用二进制表示时复杂度呈指数级。因此在大规模实例中通常使用分支定界、近似算法（FPTAS）或元启发式方法。', 'rose')
          ], '为什么贪心在这里失效', 'rose'));
        }

        return {
          blocks: blocks,
          summary: '0-1 背包问题：预算 W=' + v.capacity + '，候选项目 ' + items.length + ' 个（' +
            items.map(function (it) { return it.name + ':投入' + it.weight + '/收益' + it.value; }).join('，') +
            '）。最优总收益 ' + r.maxValue + ' 分，选中 ' + chosenIdx.map(function (i) { return items[i].name; }).join('、') +
            '，消耗预算 ' + r.totalWeight + '。' + (v.showGreedy ? '贪心算法收益 ' + greedy.totalValue + ' 分。' : '')
        };
      }

      /* ---------- 资源分配 ---------- */
      function runAllocation(v) {
        var m = v.departments;
        var deptNames = ['生产部', '市场部', '研发部', '客服部'].slice(0, m);
        // 边际收益递减的收益函数表
        var tables = [
          [0, 4, 7, 9, 10, 11, 11.5, 11.8, 12, 12.1, 12.2, 12.3],
          [0, 3, 6, 8, 9.5, 10.5, 11, 11.2, 11.3, 11.4, 11.45, 11.5],
          [0, 5, 8, 10, 11, 11.6, 12, 12.2, 12.3, 12.35, 12.4, 12.4],
          [0, 2, 4, 5.5, 6.5, 7, 7.3, 7.5, 7.6, 7.65, 7.7, 7.7]
        ];
        var profitFn = function (d, k) { return tables[d][Math.min(k, tables[d].length - 1)]; };
        var r = OR.dp.resourceAllocation(m, v.totalRes, profitFn);

        // 贪心：每次把 1 单位资源给边际收益最大的部门
        var greedyAlloc = new Array(m).fill(0), gTotal = 0;
        for (var s = 0; s < v.totalRes; s++) {
          var bestD = 0, bestGain = -Infinity;
          for (var d = 0; d < m; d++) {
            var gain = profitFn(d, greedyAlloc[d] + 1) - profitFn(d, greedyAlloc[d]);
            if (gain > bestGain) { bestGain = gain; bestD = d; }
          }
          greedyAlloc[bestD]++;
        }
        for (d = 0; d < m; d++) gTotal += profitFn(d, greedyAlloc[d]);

        var metrics = [
          { k: '最大总收益', v: f(r.maxProfit, 2), unit: '分', tone: 'amber' },
          { k: '资源总量', v: v.totalRes, unit: '单位', tone: 'brand' },
          { k: '分配部门数', v: m, unit: '个', tone: 'teal' },
          { k: '贪心算法收益', v: f(gTotal, 2), unit: '分', tone: 'rose', hint: gTotal === r.maxProfit ? '本例贪心恰好最优' : '比最优低 ' + f(r.maxProfit - gTotal, 2) + ' 分' }
        ];
        var blocks = [B.metrics(metrics)];

        blocks.push(B.card('最优资源分配方案', [
          B.table({
            head: ['部门'].concat((function () {
              var a = [];
              for (var k = 0; k <= v.totalRes; k++) a.push('k=' + k);
              return a;
            })()),
            rows: deptNames.map(function (nm, d) {
              return [nm].concat((function () {
                var a = [];
                for (var k = 0; k <= v.totalRes; k++) a.push(f(profitFn(d, k), 1));
                return a;
              })());
            }),
            highlight: function (i, j) { return j - 1 === r.allocation[i]; },
            zebra: true
          }),
          B.html('<div class="tiny muted" style="margin-top:6px">表中为各部门在不同资源投入下的收益函数（边际收益递减）。红框标注最优投入量。</div>'),
          B.chart('bar', {
            height: 200,
            title: '最优资源分配结果',
            labels: deptNames,
            series: [{ label: '分配资源量（单位）', values: r.allocation, color: '#f59e0b' }],
            showValues: true, legend: false, yLabel: '单位'
          }),
          B.note('最优方案：' + deptNames.map(function (nm, d) {
            return nm + ' 分配 <b>' + r.allocation[d] + '</b> 单位（收益 ' + f(profitFn(d, r.allocation[d]), 1) + ' 分）';
          }).join('，') + '，总收益 <b>' + f(r.maxProfit, 2) + ' 分</b>。', 'amber')
        ], '在各部门之间分配有限资源', 'amber'));

        blocks.push(B.card('动态规划状态表与边际分析', [
          B.chart('heatmap', {
            height: 40 + (m + 1) * 36,
            rows: ['初始'].concat(deptNames.slice(0, m).map(function (nm, i) { return '前' + (i + 1) + '个'; })),
            cols: (function () { var a = []; for (var k = 0; k <= v.totalRes; k++) a.push(String(k)); return a; })(),
            values: r.dp, hue: 'brand', padL: 62, digits: 1,
            title: 'f(i, j)：前 i 个部门、资源 j 时的最大总收益'
          }),
          B.chart('line', {
            height: 200,
            title: '各部门收益函数的边际收益递减特征',
            xLabel: '资源投入（单位）', yLabel: '收益（分）',
            series: deptNames.map(function (nm, d) {
              var pts = [];
              for (var k = 0; k <= v.totalRes; k++) pts.push({ x: k, y: f(profitFn(d, k), 2) });
              return { label: nm, data: pts };
            })
          }),
          B.note('动态规划的最优解一定产生在「各部门边际收益相等」的位置（当资源可无限细分时）——这与微观经济学中「等边际原理」完全一致。本问题中资源必须按整数分配，因此最优解出现在边际收益最接近的点附近。', 'teal')
        ], '状态表与经济学直觉', 'violet'));

        blocks.push(B.card('教学解读', [
          B.list([
            '动态规划把「一次性分配 m 个部门的资源」转化为「m 个阶段依次决策」，每个阶段只需在已完成阶段的最优基础上做局部决策，从而把指数级搜索降为 O(m·n) 的填表。',
            '填表顺序至关重要：必须按阶段顺序从左到右、从上到下填充，因为 f(i, j) 依赖 f(i−1, j) 与 f(i−1, j−k)，即上一行左侧的已知值。',
            '若贪心结果与动态规划一致（本例' + (gTotal === r.maxProfit ? '确实一致' : '并不一致，相差 ' + f(r.maxProfit - gTotal, 2) + ' 分') + '），说明该问题的收益函数满足某种凸性/凹性条件；若不一致，则说明局部最优叠加不等于全局最优。',
            '动态规划可扩展到连续资源分配（用拉格朗日乘子法或边际分析），也可扩展到多资源约束（多维 DP，复杂度升至 O(n·W₁·W₂)）。'
          ])
        ], '从算法到经济学直觉', 'brand'));

        return {
          blocks: blocks,
          summary: '资源分配问题：' + m + ' 个部门，资源总量 ' + v.totalRes + '。最优分配 ' +
            deptNames.map(function (nm, d) { return nm + '=' + r.allocation[d]; }).join('，') +
            '，最大总收益 ' + f(r.maxProfit, 2) + ' 分（贪心算法 ' + f(gTotal, 2) + ' 分）。'
        };
      }
    },
    problems: [
      {
        id: 'dp-1', level: '概念', type: 'single',
        q: '动态规划「最优性原理」的含义是：',
        options: [
          '每一步都选择当前最优即得全局最优',
          '最优策略的子策略也必然是最优的（无论初始状态与初始决策如何）',
          '问题的解唯一',
          '必须遍历所有状态才能求解'
        ],
        answer: 1,
        explain: 'Bellman 最优性原理指出：最优策略具有这样的性质——无论初始状态和初始决策如何，剩余的决策相对于由第一个决策所形成的状态而言，必定构成最优策略。这正是可以「分段递推填表」的理论基础。注意它并不意味着贪心（每步局部最优）就能得到全局最优。'
      },
      {
        id: 'dp-2', level: '计算', type: 'number',
        q: '容量 W = 5 的背包，物品为 (w,v) = (2,3)、(3,4)、(4,5)、(5,6)。最大总价值是多少？',
        answer: 7, tolerance: 0.5,
        explain: '最优组合为物品 1 与物品 2，重量 2+3=5，价值 3+4=7。若贪心按性价比排序：物品1(1.5)、物品3(1.25)、物品2(1.333)…按比降序为物品1(1.5)、物品2(1.333)、物品3(1.25)、物品4(1.2)，先装1、再装2，得到 7，本例恰好最优。但换成 (w,v)=(3,5)、(2,3)、(2,3)、W=5 时贪心会装 (3,5) 得 5，而最优是 (2,3)+(2,3)=6。'
      },
      {
        id: 'dp-3', level: '概念', type: 'single',
        q: '0-1 背包问题的动态规划算法时间复杂度为 O(nW)，其中 W 为容量。这被称为「伪多项式算法」，原因是：',
        options: [
          '算法实际上是指数级的',
          '复杂度与 W 的数值大小成正比，而 W 在输入中只需 log₂W 个二进制位表示',
          '算法只能处理小规模问题',
          '该复杂度是近似值'
        ],
        answer: 1,
        explain: '输入规模应按二进制位数计量。W 只需 ⌈log₂W⌉ 位即可表示，但算法的运行时间与 W 的数值线性相关，因此当 W 很大（如 10⁹）时算法会变得不可行。这就是「伪多项式」。由于背包问题是 NP-hard，不存在真正的多项式算法（除非 P=NP）。'
      },
      {
        id: 'dp-4', level: '概念', type: 'single',
        q: '在资源分配问题的动态规划中，若各部门的收益函数都是凸函数（边际收益递增），则最优解是：',
        options: [
          '平均分配资源',
          '把全部资源集中给某一个部门',
          '无法确定',
          '资源越多越好，无需分配'
        ],
        answer: 1,
        explain: '收益函数为凸（边际收益递增）时，规模效应使得资源集中投入比分散投入更有效，因此最优解是「全部给一个部门」。而现实中管理问题通常是凹函数（边际收益递减），于是最优解倾向于分散分配，呈现「边际收益均衡」的特征。'
      },
      {
        id: 'dp-5', level: '建模', type: 'text',
        q: '某制造企业有 500 万研发预算，面对 12 个候选研发项目，每个项目需要的资金、预期收益与其技术风险各不相同，且部分项目之间存在技术复用（做了 A 会降低 B 的成本）。请说明如何建模求解。',
        reference: '基础建模（无依赖）：直接建立 0-1 背包模型。决策变量 xᵢ ∈ {0,1} 表示是否立项；目标 max Σ rᵢxᵢ（或期望收益 Σ pᵢ·rᵢxᵢ，pᵢ 为成功概率）；约束 Σ cᵢxᵢ ≤ B。用动态规划（若预算可离散化）或分支定界/整数规划求解。\n\n考虑技术复用（互补性）：\n1) 协同收益：若 A、B 同时实施可节约成本，则引入新变量 y_AB = x_A·x_B（需线性化：y ≤ x_A, y ≤ x_B, y ≥ x_A + x_B − 1），目标函数中加上节约项。\n2) 前置依赖：若做 B 必须先做 A，则加约束 x_B ≤ x_A。\n3) 互斥关系：若 A 与 B 不能同时做，则加约束 x_A + x_B ≤ 1。\n此时模型升级为 0-1 整数线性规划（MILP），可用分支定界求解；若规模过大则采用拉格朗日松弛或启发式算法。\n\n考虑风险：把目标改为最大化期望净现值并约束下行风险（如 CVaR ≤ 阈值），形成机会约束或均值-CVaR 模型，需结合蒙特卡洛与优化（即随机规划/鲁棒优化）。',
        explain: '要点：先给出标准 0-1 背包/整数规划模型；再用「线性化技巧」处理协同、依赖、互斥三类逻辑约束；最后指出风险维度需要引入随机规划或鲁棒优化。能够识别出「非线性协同项需要引入辅助变量线性化」是关键得分点。'
      }
    ]
  });

})(typeof window !== 'undefined' ? window : globalThis);
