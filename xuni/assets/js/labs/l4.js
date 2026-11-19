/* =============================================================================
 * 扩展实验场景（Level 1 ~ 3）
 *   10. 饲料配方优化     线性规划（最小化型）/ 影子价格
 *   11. 区域中转调运     转运问题 / 拆点建模
 *   12. 呼叫中心坐席排班  Erlang C / 服务水平 / 成本优化
 *   13. 设备可靠性分析    马尔可夫链 / 稳态分布 / 可用度
 *   14. 配送中心选址      0-1 整数规划 / 分支定界
 *   15. 库存参数仿真优化  离散事件仿真 / 网格搜索 / 共同随机数
 *
 * 每个场景的 knowledge 字段把实验与知识库中的知识点显式绑定，
 * 由 kb/graph.js 建立双向索引并在「知识图谱」页签中可视化。
 * ========================================================================== */
(function (global) {
  'use strict';
  var OR = global.OR = global.OR || {};
  var B = OR.Lab.B, P = OR.Lab.P;
  var fmt = function (v, d) { return Number(Number(v).toFixed(d === undefined ? 3 : d)); };
  var pct = function (v, d) { return Number((v * 100).toFixed(d === undefined ? 1 : d)); };

  /* ==========================================================================
   * 10. 饲料配方优化 —— 线性规划（最小化型）
   * ======================================================================= */
  OR.Lab.register({
    id: 'lp-blending',
    name: '饲料配方优化',
    subtitle: '线性规划 · 最小化型 · 影子价格',
    level: 1, topic: '线性规划', icon: 'grid', tone: 'teal',
    knowledge: {
      core: ['lp-blending', 'lp-model', 'lp-simplex'],
      support: ['lp-dual'],
      extend: ['lp-sensitivity']
    },
    tags: ['配料问题', '最小化型', '≥ 约束', '影子价格', '配方成本'],
    brief: '用玉米、豆粕、麸皮配出满足蛋白质与纤维标准的混合饲料，使每吨成本最低。',
    scenario: '某饲料厂要配制 1 000 kg 育肥猪混合饲料，原料为玉米、豆粕与麸皮。质量部门要求蛋白质含量不低于标准值、粗纤维不高于上限。三种原料的营养成分与单价差异很大：豆粕蛋白高但价格贵，麸皮便宜但纤维多。采购部需要一张「最低成本配方单」，并回答：如果客户把蛋白标准再提高一个百分点，成本会增加多少？',
    objectives: [
      '识别「不低于 / 不高于 / 恰好等于」三类约束对应的不等号方向',
      '把配料问题写成最小化型线性规划，并理解为何需要引入剩余变量与人工变量',
      '用影子价格量化质量标准的边际成本，为商务谈判提供依据',
      '观察蛋白标准从宽到严时成本曲线的形状，理解「标准越严、成本加速上升」',
      '辨析「配方比例」与「投料量」两种建模视角的等价性'
    ],
    theory: [
      '<b>配料问题</b>的决策变量是各原料的投料量（或占比），目标是最小化总成本，约束是各项质量指标必须达标。',
      '<b>≥ 型约束</b>（蛋白质不低于标准）需引入剩余变量化为等式，并配人工变量用两阶段法求初始基可行解。',
      '<b>等式约束</b>（总量恰好 1 000 kg）直接引入人工变量，其人工变量必须在第一阶段被赶出基。',
      '<b>影子价格</b>：蛋白标准每提高 1 个单位（这里是 1 kg）时最低成本的增量，等于该约束的对偶变量值。',
      '当质量标准越过某个临界点后，原来的最优配方结构失效，需要换用另一种原料组合，成本曲线出现折点。'
    ],
    params: [
      P.group('质量标准', [
        P.range('pTarget', '蛋白质最低标准', { min: 12, max: 24, step: 1, value: 16, unit: '%' }),
        P.range('fMax', '粗纤维最高限值', { min: 3, max: 12, step: 1, value: 7, unit: '%' })
      ]),
      P.group('原料单价', [
        P.range('c1', '玉米单价', { min: 1.0, max: 3.0, step: 0.1, value: 1.8, unit: '元/kg' }),
        P.range('c2', '豆粕单价', { min: 2.4, max: 5.0, step: 0.1, value: 3.6, unit: '元/kg' }),
        P.range('c3', '麸皮单价', { min: 0.6, max: 2.2, step: 0.1, value: 1.2, unit: '元/kg' })
      ]),
      P.group('原料营养成分（固定）', [
        P.range('total', '配制总量', { min: 500, max: 2000, step: 100, value: 1000, unit: 'kg' })
      ], true)
    ],
    run: function (v) {
      /* 原料成分（%）：玉米 / 豆粕 / 麸皮 */
      var NUT = {
        protein: [8, 44, 15],
        fiber: [3, 6, 11]
      };
      var names = ['玉米', '豆粕', '麸皮'];
      var T = v.total;

      var model = {
        c: [v.c1, v.c2, v.c3],
        A: [
          NUT.protein.map(function (p) { return p / 100; }),
          NUT.fiber.map(function (f) { return f / 100; }),
          [1, 1, 1]
        ],
        b: [v.pTarget / 100 * T, v.fMax / 100 * T, T],
        ops: ['>=', '<=', '='],
        maximize: false
      };
      var s = OR.solveLP(model);

      if (s.status !== 'optimal') {
        return {
          blocks: [
            B.note('<b>当前标准下无可行配方</b>：' + (s.message || s.status) +
              '。请检查质量标准的组合是否过于苛刻——例如在纤维上限很低时仍要求很高的蛋白质，可能没有任何原料组合能够满足。', 'rose'),
            B.html('<p class="small muted">提示：把「粗纤维最高限值」调高，或把「蛋白质最低标准」调低，即可恢复可行。</p>')
          ],
          summary: '配方求解状态：' + s.status
        };
      }

      var x = s.x;
      var T2 = T;
      var actualProtein = (x[0] * NUT.protein[0] + x[1] * NUT.protein[1] + x[2] * NUT.protein[2]) / T2;
      var actualFiber = (x[0] * NUT.fiber[0] + x[1] * NUT.fiber[1] + x[2] * NUT.fiber[2]) / T2;
      var perTon = s.objective / T2 * 1000;

      /* --- 数值差分求边际价值（比直接读对偶变量更稳健） --- */
      function marginalOf(idx) {
        var m2 = {
          c: model.c.slice(),
          A: model.A.map(function (r) { return r.slice(); }),
          b: model.b.slice(), ops: model.ops.slice(), maximize: false
        };
        m2.b[idx] += 1;
        var s2 = OR.solveLP(m2);
        return s2.status === 'optimal' ? s2.objective - s.objective : null;
      }
      var mProtein = marginalOf(0);
      var mFiber = marginalOf(1);

      var metrics = [
        { k: '每吨最低成本', v: fmt(perTon, 2), unit: '元/吨', tone: 'brand' },
        { k: '本批配制总成本', v: fmt(s.objective, 1), unit: '元', tone: 'teal', hint: '共配制 ' + T + ' kg' },
        { k: '玉米用量', v: fmt(x[0], 1), unit: 'kg', tone: 'amber', hint: '占比 ' + pct(x[0] / T) + '%' },
        { k: '豆粕用量', v: fmt(x[1], 1), unit: 'kg', tone: 'violet', hint: '占比 ' + pct(x[1] / T) + '%' },
        { k: '麸皮用量', v: fmt(x[2], 1), unit: 'kg', tone: 'green', hint: '占比 ' + pct(x[2] / T) + '%' },
        { k: '蛋白质实际含量', v: fmt(actualProtein, 2), unit: '%', tone: actualProtein - v.pTarget < 0.01 ? 'rose' : 'green', hint: '标准 ≥ ' + v.pTarget + '%' }
      ];

      var blocks = [];
      blocks.push(B.metrics(metrics));

      /* --- 配方结构 --- */
      blocks.push(B.card('最低成本配方结构', [
        B.chart('bar', {
          height: 200, title: '三种原料的投料量（kg）与成本贡献',
          labels: names,
          series: [
            { label: '投料量 (kg)', values: x.map(function (q) { return fmt(q, 1); }), color: '#2b5cff' },
            { label: '成本 (元)', values: x.map(function (q, i) { return fmt(q * model.c[i], 1); }), color: '#f59e0b' }
          ],
          showValues: true, yLabel: ''
        }),
        B.table({
          head: ['原料', '投料量 (kg)', '占比', '单价 (元/kg)', '成本 (元)', '成本占比'],
          rows: names.map(function (nm, i) {
            return [nm, fmt(x[i], 1), pct(x[i] / T) + '%', model.c[i], fmt(x[i] * model.c[i], 1), pct(x[i] * model.c[i] / s.objective) + '%'];
          }).concat([['合计', fmt(T, 0), '100%', '—', fmt(s.objective, 1), '100%']])
        })
      ], '把「每吨成本最低」翻译成一张可执行的投料单', 'teal'));

      /* --- 约束分析 --- */
      var limits = [
        { name: '蛋白质下限', actual: actualProtein, limit: v.pTarget, dir: '≥', unit: '%', marginal: mProtein, unit2: '元 / 每提高 1 kg' },
        { name: '粗纤维上限', actual: actualFiber, limit: v.fMax, dir: '≤', unit: '%', marginal: mFiber, unit2: '元 / 每放宽 1 kg' },
        { name: '总量平衡', actual: T, limit: T, dir: '=', unit: 'kg', marginal: null, unit2: '—' }
      ];
      blocks.push(B.card('约束松紧与边际价值', [
        B.table({
          head: ['约束', '实际值', '限值', '关系', '状态', '边际价值'],
          rows: limits.map(function (l) {
            var binding = Math.abs(l.actual - l.limit) < 0.02;
            return [
              l.name, fmt(l.actual, 2) + ' ' + l.unit, l.dir + ' ' + fmt(l.limit, 2) + ' ' + l.unit,
              l.dir, binding ? '紧约束（已顶到边界）' : '松约束（仍有余量）',
              l.marginal === null ? '—' : fmt(l.marginal, 3) + ' ' + l.unit2
            ];
          })
        }),
        B.note('只有<b>紧约束</b>才可能有非零的边际价值。若纤维上限很宽松，放宽它对成本毫无帮助（边际价值为 0）——这与「资源有富余时影子价格为 0」是同一个道理。', 'brand')
      ], '哪一条质量标准才是真正的成本推手', 'amber'));

      /* --- 蛋白标准—成本曲线 --- */
      var scanPts = [];
      for (var t = 12; t <= 24; t += 1) {
        var mm = {
          c: model.c.slice(),
          A: model.A.map(function (r) { return r.slice(); }),
          b: [t / 100 * T, v.fMax / 100 * T, T],
          ops: ['>=', '<=', '='], maximize: false
        };
        var ss = OR.solveLP(mm);
        scanPts.push({ t: t, cost: ss.status === 'optimal' ? fmt(ss.objective / T, 2) : null });
      }
      var valid = scanPts.filter(function (p) { return p.cost !== null; });
      blocks.push(B.card('蛋白标准 → 最低成本 的响应曲线', [
        B.chart('line', {
          height: 210,
          title: '每吨最低成本随蛋白质标准的变化（纤维上限固定为 ' + v.fMax + '%）',
          labels: scanPts.map(function (p) { return p.t + '%'; }),
          series: [{ label: '每吨成本 (元)', values: scanPts.map(function (p) { return p.cost; }), color: '#2b5cff', fill: true }],
          yLabel: '元/吨', xLabel: '蛋白质标准'
        }),
        B.html('<p class="small muted">曲线在可行区间内<b>单调上升</b>且斜率递增：标准越严，边际成本越高。曲线中断的位置说明该标准已无可行配方——这正是「约束过紧导致可行域为空」的直观表现。当前可行区间为 ' +
          (valid.length ? valid[0].t + '% ~ ' + valid[valid.length - 1].t + '%' : '无') + '。</p>')
      ], '质量标准的每一分提高，都要用成本来换', 'violet'));

      /* --- 教学解读 --- */
      var insight = [];
      insight.push('最优配方：<b>玉米 ' + fmt(x[0], 1) + ' kg、豆粕 ' + fmt(x[1], 1) + ' kg、麸皮 ' + fmt(x[2], 1) + ' kg</b>，每吨成本 <b>' + fmt(perTon, 2) + ' 元</b>。');
      insight.push('蛋白质实际含量 ' + fmt(actualProtein, 2) + '%、粗纤维 ' + fmt(actualFiber, 2) + '%。' +
        (Math.abs(actualProtein - v.pTarget) < 0.02 ? '蛋白质约束恰好顶到下限，说明它是<b>有效约束</b>。' : '蛋白质标准尚未成为瓶颈。') +
        (Math.abs(actualFiber - v.fMax) < 0.02 ? '纤维约束也恰好顶到上限，两条约束同时紧，配方被「夹」在一个顶点上。' : ''));
      if (mProtein !== null && Math.abs(mProtein) > 1e-6) {
        insight.push('蛋白标准每提高 1 kg（即每吨提高 0.1 个百分点），成本增加约 <b>' + fmt(Math.abs(mProtein), 3) + ' 元</b>。若客户愿意为「高蛋白」支付的溢价低于这个数，提高标准就是亏本生意。');
      }
      if (mFiber !== null && Math.abs(mFiber) < 1e-6) {
        insight.push('纤维上限目前<b>不是</b>瓶颈（边际价值为 0）：即使把上限放宽，成本也一分钱都不会降。想降本必须动蛋白质标准或原料价格。');
      }
      insight.push('注意：这里的最优解是一个<b>顶点</b>——两种原料的用量由两条紧约束联立决定，第三种原料只是补足总量。这是线性规划「最优解在顶点取得」的直接体现。');

      blocks.push(B.card('教学解读', [B.list(insight)], '从配方单到商务决策', 'teal'));

      return {
        blocks: blocks,
        summary: '配料问题：min 1.8x₁+3.6x₂+1.2x₃（默认单价），蛋白≥' + v.pTarget + '%、纤维≤' + v.fMax + '%、总量=' + T +
          '。最优配方 玉米' + fmt(x[0], 1) + '/豆粕' + fmt(x[1], 1) + '/麸皮' + fmt(x[2], 1) + ' kg，每吨成本 ' + fmt(perTon, 2) +
          ' 元；蛋白边际成本 ' + (mProtein === null ? '—' : fmt(mProtein, 3)) + ' 元/kg。'
      };
    },
    problems: [
      {
        id: 'bl-1', level: '概念', type: 'single',
        q: '「蛋白质含量不低于 16%」这一质量要求，在标准型线性规划中应当写成：',
        options: [
          '0.08x₁ + 0.44x₂ + 0.15x₃ ≤ 160',
          '0.08x₁ + 0.44x₂ + 0.15x₃ ≥ 160',
          '0.08x₁ + 0.44x₂ + 0.15x₃ = 160',
          'x₁ + x₂ + x₃ ≥ 160'
        ],
        answer: 1,
        explain: '「不低于」表示实际含量必须大于或等于标准，因此是 ≥ 约束。注意右端项要先换算成绝对量：1000 kg × 16% = 160 kg。'
      },
      {
        id: 'bl-2', level: '计算', type: 'number',
        q: '取默认参数（玉米 1.8、豆粕 3.6、麸皮 1.2 元/kg；蛋白 ≥ 16%、纤维 ≤ 7%、总量 1000 kg），每吨混合饲料的最低成本是多少元？',
        answer: 1773, tolerance: 3,
        explain: '由总量等式消去麸皮后，问题化为 min 1200 + 0.6x₁ + 2.4x₂，约束为 −0.07x₁ + 0.29x₂ ≥ 10 与 0.08x₁ + 0.05x₂ ≥ 40。两约束交点给出 x₁ ≈ 415.7、x₂ ≈ 134.8、x₃ ≈ 449.4，成本 ≈ 1 773 元/吨。'
      },
      {
        id: 'bl-3', level: '概念', type: 'single',
        q: '实验显示蛋白质约束的边际价值约为 6 元/kg。它的正确解读是：',
        options: [
          '每公斤饲料中有 6 元花在蛋白质上',
          '蛋白质标准每提高 1 kg（即每吨提高 0.1 个百分点），最低总成本增加约 6 元',
          '豆粕的价格是 6 元/kg',
          '蛋白质含量每提高 1 个百分点，成本固定增加 6 元'
        ],
        answer: 1,
        explain: '边际价值（影子价格）是「约束右端项每增加 1 个单位，最优目标值的变化量」。这里的右端项以 kg 计，所以是每提高 1 kg 蛋白标准带来约 6 元的成本增量；换算成「每吨提高 1 个百分点」则约为 60.7 元。'
      },
      {
        id: 'bl-4', level: '计算', type: 'number',
        q: '其他参数不变，把蛋白质最低标准从 16% 提高到 18%，每吨最低成本变为多少元？',
        answer: 1894, tolerance: 4,
        explain: '蛋白约束右端项由 160 kg 变为 180 kg（+20 kg）。两条紧约束联立重解：x₂ ≈ 194.8、x₁ ≈ 378.3、x₃ ≈ 427.0，成本 ≈ 1 894 元/吨，比原来增加约 121 元 —— 恰好等于 20 kg × 6.07 元/kg 的边际价值。'
      },
      {
        id: 'bl-5', level: '建模', type: 'text',
        q: '请写出这个饲料配方问题的完整线性规划模型：说明决策变量及其单位、目标函数、三类约束（蛋白、纤维、总量）与非负性，并指出它与「生产计划问题」在约束方向上的关键差别。',
        reference: '决策变量：x₁、x₂、x₃ 分别为玉米、豆粕、麸皮的投料量（kg）。\n目标函数：min z = c₁x₁ + c₂x₂ + c₃x₃（总成本最小）。\n约束：0.08x₁ + 0.44x₂ + 0.15x₃ ≥ 0.16T（蛋白质下限，≥ 型）；0.03x₁ + 0.06x₂ + 0.11x₃ ≤ 0.07T（粗纤维上限，≤ 型）；x₁ + x₂ + x₃ = T（总量平衡，等式）；x₁, x₂, x₃ ≥ 0。\n关键差别：生产计划问题是「资源有限、收益最大」，约束以 ≤ 为主且目标是最大化；配料问题是「标准必须达到、成本最小」，约束以 ≥ 为主且目标是最小化。因此配料问题必须用两阶段法（或大 M 法）才能启动单纯形迭代。',
        explain: '建模时要特别注意三点：①右端项必须与左端项量纲一致（都换算成 kg）；②「不低于」与「不高于」的方向不能写反；③总量约束是等式，它把三个变量耦合在一起，是消元的关键。'
      }
    ]
  });

  /* ==========================================================================
   * 11. 区域中转调运 —— 转运问题
   * ======================================================================= */
  OR.Lab.register({
    id: 'transport-transship',
    name: '区域中转调运',
    subtitle: '转运问题 · 拆点建模 · 流量守恒',
    level: 1, topic: '运输问题', icon: 'layers', tone: 'violet',
    knowledge: {
      core: ['tp-transship', 'tp-modi', 'tp-vam'],
      support: ['tp-model'],
      extend: ['net-mincost']
    },
    tags: ['转运问题', '拆点', '流量守恒', '中转成本', '调运方案'],
    brief: '两个产地经一个区域中转中心向三个城市供货，中转费与干线运费共同决定最优调运方案。',
    scenario: '某快消企业在城北、城西各有一个工厂，所有发往三个销售大区的货物都要先运到区域中转中心进行分拣与换装，再由中转中心配送到各大区。中转中心按吞吐量收取服务费。物流总监需要回答：在产地供给、干线运费、中转服务费与支线运费给定的情况下，如何安排调运量使总物流成本最低？如果中转费上涨，成本会怎样变化？',
    objectives: [
      '理解转运问题与标准运输问题的本质区别：中转点既不生产也不消费',
      '掌握「把中转点拆成收点与发点」的建模技巧，并说明内部弧的含义',
      '写出流量守恒约束，并解释它为何是等式而不是不等式',
      '比较干线、中转、支线三段成本的构成，识别成本的主要来源',
      '通过中转费敏感性分析理解「固定环节涨价」对总成本的线性传导'
    ],
    theory: [
      '<b>转运问题</b>允许货物在产地与销地之间经过中转节点换装，其网络结构比标准运输问题更一般。',
      '<b>拆点技巧</b>：把中转点 k 拆成 k⁻（只收货）与 k⁺（只发货），二者之间加一条运费等于中转服务费的弧。',
      '<b>流量守恒</b>：中转点不生产也不消费，因此「流入量 = 流出量」，必须写成等式约束。',
      '拆点后的模型就是一个标准的最小费用流问题，可用运输问题算法或通用线性规划求解。',
      '当中转服务费按吞吐量线性计费时，它等价于在每一条经过中转的路径上增加一个固定附加成本，因此总成本对中转费的变化率恰好等于总吞吐量。'
    ],
    params: [
      P.group('产地供给能力', [
        P.range('a1', '城北工厂供给', { min: 100, max: 300, step: 10, value: 200, unit: '件/天' }),
        P.range('a2', '城西工厂供给', { min: 80, max: 260, step: 10, value: 150, unit: '件/天' })
      ]),
      P.group('需求规模', [
        P.range('scale', '三大区需求缩放', { min: 0.6, max: 1.3, step: 0.05, value: 1.0, unit: '倍', hint: '基准需求为 120 / 90 / 60 件/天' })
      ]),
      P.group('运费结构', [
        P.range('c11', '城北 → 中转中心', { min: 2, max: 12, step: 0.5, value: 6, unit: '元/件' }),
        P.range('c21', '城西 → 中转中心', { min: 2, max: 12, step: 0.5, value: 4, unit: '元/件' }),
        P.range('h', '中转服务费', { min: 0, max: 10, step: 0.5, value: 3, unit: '元/件' }),
        P.range('k', '支线运费系数', { min: 0.6, max: 1.8, step: 0.1, value: 1.0, unit: '倍', hint: '基准支线运费 5 / 8 / 11 元/件' })
      ])
    ],
    run: function (v) {
      var baseDemand = [120, 90, 60];
      var demand = baseDemand.map(function (d) { return Math.round(d * v.scale); });
      var totalDemand = demand.reduce(function (a, b) { return a + b; }, 0);
      var totalSupply = v.a1 + v.a2;
      var C = [5, 8, 11].map(function (c) { return fmt(c * v.k, 2); });

      if (totalSupply < totalDemand) {
        return {
          blocks: [
            B.note('<b>供给不足，问题无可行解</b>：两厂总供给 ' + totalSupply + ' 件/天，而三大区总需求 ' + totalDemand +
              ' 件/天，缺口 ' + (totalDemand - totalSupply) + ' 件。转运问题与运输问题一样，产销不平衡时要么增设虚拟产地，要么调整需求——否则约束互相矛盾。', 'rose'),
            B.html('<p class="small muted">试着把「需求缩放」调小，或提高任一工厂的供给能力。</p>')
          ],
          summary: '转运问题不可行：供给 ' + totalSupply + ' < 需求 ' + totalDemand
        };
      }

      /* 变量：[x11, x21, y1, y2, y3]
       *   x11 城北→中转，x21 城西→中转，yj 中转→大区 j
       * 约束：
       *   x11 ≤ a1, x21 ≤ a2
       *   x11 + x21 − y1 − y2 − y3 = 0        （中转点流量守恒）
       *   yj = dj                              （各大区需求）
       */
      var model = {
        c: [v.c11 + v.h, v.c21 + v.h, C[0], C[1], C[2]],
        A: [
          [1, 0, 0, 0, 0],
          [0, 1, 0, 0, 0],
          [1, 1, -1, -1, -1],
          [0, 0, 1, 0, 0],
          [0, 0, 0, 1, 0],
          [0, 0, 0, 0, 1]
        ],
        b: [v.a1, v.a2, 0, demand[0], demand[1], demand[2]],
        ops: ['<=', '<=', '=', '=', '=', '='],
        maximize: false
      };
      var s = OR.solveLP(model);
      if (s.status !== 'optimal') {
        return {
          blocks: [B.note('求解失败：' + (s.message || s.status), 'rose')],
          summary: '求解状态：' + s.status
        };
      }

      var x11 = s.x[0], x21 = s.x[1], y = [s.x[2], s.x[3], s.x[4]];
      var mainCost = x11 * v.c11 + x21 * v.c21;
      var transCost = (x11 + x21) * v.h;
      var branchCost = y.reduce(function (a, q, i) { return a + q * C[i]; }, 0);
      var total = mainCost + transCost + branchCost;

      var metrics = [
        { k: '最低总成本', v: fmt(total, 1), unit: '元/天', tone: 'brand' },
        { k: '干线运费', v: fmt(mainCost, 1), unit: '元/天', tone: 'teal', hint: pct(mainCost / total) + '%' },
        { k: '中转服务费', v: fmt(transCost, 1), unit: '元/天', tone: 'violet', hint: pct(transCost / total) + '%' },
        { k: '支线配送费', v: fmt(branchCost, 1), unit: '元/天', tone: 'amber', hint: pct(branchCost / total) + '%' },
        { k: '城北调出量', v: fmt(x11, 0), unit: '件/天', tone: 'green', hint: '产能 ' + v.a1 + '，利用率 ' + pct(x11 / v.a1) + '%' },
        { k: '城西调出量', v: fmt(x21, 0), unit: '件/天', tone: 'green', hint: '产能 ' + v.a2 + '，利用率 ' + pct(x21 / v.a2) + '%' }
      ];

      var blocks = [];
      blocks.push(B.metrics(metrics));

      /* --- 网络流量图 --- */
      blocks.push(B.card('中转调运网络与流量分配', [
        B.svg(flowSVG(v, demand, C, x11, x21, y), '中转调运网络图'),
        B.html('<div class="legend" style="margin-top:8px">' +
          '<span><i style="background:#2b5cff"></i>城北工厂</span>' +
          '<span><i style="background:#0d9488"></i>城西工厂</span>' +
          '<span><i style="background:#6d4aff"></i>中转中心的收 / 发两侧</span>' +
          '<span><i style="background:#d97706"></i>销售大区</span>' +
          '<span><i style="background:#e11d48"></i>流量</span></div>')
      ], '把「拆点」画出来：中转中心的收点与发点之间是一条容量无限的内部弧', 'violet'));

      /* --- 调运方案表 --- */
      blocks.push(B.card('最优调运方案', [
        B.table({
          head: ['区段', '起止', '流量 (件/天)', '单位成本 (元/件)', '区段成本 (元/天)'],
          rows: [
            ['干线', '城北工厂 → 中转中心', fmt(x11, 0), v.c11, fmt(x11 * v.c11, 1)],
            ['干线', '城西工厂 → 中转中心', fmt(x21, 0), v.c21, fmt(x21 * v.c21, 1)],
            ['中转', '中转中心（内部弧）', fmt(x11 + x21, 0), v.h, fmt(transCost, 1)],
            ['支线', '中转中心 → 大区 A', fmt(y[0], 0), C[0], fmt(y[0] * C[0], 1)],
            ['支线', '中转中心 → 大区 B', fmt(y[1], 0), C[1], fmt(y[1] * C[1], 1)],
            ['支线', '中转中心 → 大区 C', fmt(y[2], 0), C[2], fmt(y[2] * C[2], 1)],
            ['合计', '—', fmt(totalDemand, 0), '—', fmt(total, 1)]
          ],
          highlight: function (i) { return i === 6; }
        }),
        B.formula([
          '<span class="cm">目标</span>  min  z = (c₁₁+h)x₁₁ + (c₂₁+h)x₂₁ + Σⱼ Cⱼ yⱼ',
          '<span class="cm">供给</span>  x₁₁ ≤ a₁，x₂₁ ≤ a₂',
          '<span class="cm">守恒</span>  x₁₁ + x₂₁ = y₁ + y₂ + y₃   <span class="cm">（中转点不产不耗）</span>',
          '<span class="cm">需求</span>  yⱼ = dⱼ  (j = 1,2,3)',
          '<span class="cm">非负</span>  x₁₁, x₂₁, yⱼ ≥ 0'
        ])
      ], '每一行都可以直接交给调度员执行', 'teal'));

      /* --- 中转费敏感性 --- */
      var scan = [];
      for (var hh = 0; hh <= 10; hh += 1) {
        var m2 = {
          c: [v.c11 + hh, v.c21 + hh, C[0], C[1], C[2]],
          A: model.A.map(function (r) { return r.slice(); }),
          b: model.b.slice(), ops: model.ops.slice(), maximize: false
        };
        var s2 = OR.solveLP(m2);
        scan.push({ h: hh, cost: s2.status === 'optimal' ? fmt(s2.objective, 1) : null, x11: s2.status === 'optimal' ? s2.x[0] : null });
      }
      blocks.push(B.card('中转服务费的敏感性', [
        B.chart('line', {
          height: 200,
          title: '总成本与干线分配随中转服务费的变化',
          labels: scan.map(function (p) { return p.h + ''; }),
          series: [
            { label: '总成本 (元/天)', values: scan.map(function (p) { return p.cost; }), color: '#6d4aff', fill: true },
            { label: '城北调出量 (件/天)', values: scan.map(function (p) { return p.x11; }), color: '#f59e0b' }
          ],
          yLabel: '', xLabel: '中转服务费 (元/件)'
        }),
        B.html('<p class="small muted">曲线呈分段线性：只要中转服务费的变化不足以改变「优先用城西产能」这一结构，总成本就以固定斜率上升，斜率恰好等于总吞吐量 ' +
          totalDemand + '。当斜率发生变化的拐点出现时，说明最优调运结构发生了切换。</p>')
      ], '固定环节的成本上涨如何传导到总成本', 'amber'));

      /* --- 教学解读 --- */
      var insight = [];
      insight.push('最优方案：城北调出 <b>' + fmt(x11, 0) + '</b> 件、城西调出 <b>' + fmt(x21, 0) + '</b> 件，总成本 <b>' + fmt(total, 1) + ' 元/天</b>。');
      if (Math.abs(v.c11 - v.c21) > 0.01) {
        var cheaper = v.c11 < v.c21 ? '城北' : '城西';
        var cheapCap = v.c11 < v.c21 ? v.a1 : v.a2;
        insight.push('干线方面，<b>' + cheaper + '</b> 的单位运费更低，因此优先用满它的产能（' + cheapCap + ' 件）；剩余需求再由另一厂补足。这正是线性规划「先填便宜变量」的经济直觉。');
      }
      insight.push('中转服务费按 <b>吞吐量</b> 计费，所以它等价于给每一条经过中转的路径加了一个固定附加成本。总吞吐量是 ' + totalDemand + ' 件，因此中转费每上涨 1 元/件，总成本就增加 <b>' + totalDemand + ' 元/天</b>——完全线性，与运输结构无关。');
      insight.push('若 <b>总供给 < 总需求</b>，问题立刻变为无可行解。这与运输问题一致：产销不平衡时必须补虚拟产地或调整需求，不能直接求解。');
      insight.push('建模要点：中转点的约束是<b>等式</b>（流入 = 流出），而不是像产地那样的「≤ 供给」或像销地那样的「= 需求」。把这一点写对，转运问题就与普通运输问题没有本质区别了。');

      blocks.push(B.card('教学解读', [B.list(insight)], '拆点之后，转运问题就是熟悉的运输问题', 'teal'));

      return {
        blocks: blocks,
        summary: '转运问题：两厂供给 ' + totalSupply + '、三区需求 ' + totalDemand +
          '。最优调运 城北' + fmt(x11, 0) + '/城西' + fmt(x21, 0) + ' 件，总成本 ' + fmt(total, 1) +
          ' 元/天（干线 ' + fmt(mainCost, 1) + '、中转 ' + fmt(transCost, 1) + '、支线 ' + fmt(branchCost, 1) + '）。'
      };
    },
    problems: [
      {
        id: 'ts-1', level: '概念', type: 'single',
        q: '在转运问题中，把中转中心 C 拆成 C⁻（收货）与 C⁺（发货）两个节点后，C⁻ 与 C⁺ 之间的那条内部弧表示：',
        options: [
          '一条容量为零的虚拟弧',
          '中转中心的换装 / 分拣作业，其单位费用等于中转服务费，容量原则上取总流量上界',
          '产地到销地的直达运输',
          '一条必须被删除的多余约束'
        ],
        answer: 1,
        explain: '拆点的目的是把「节点」转化为「弧」：C⁻ 收到货、C⁺ 发出货，二者之间的流动就代表中转作业。给它赋上中转服务费，就自然地把中转成本计入了总成本；容量取总流量上界则等效于「不限容量」。'
      },
      {
        id: 'ts-2', level: '计算', type: 'number',
        q: '取默认参数（城北供给 200、城西供给 150；需求 120/90/60；干线 6 与 4 元/件；中转费 3 元/件；支线 5/8/11 元/件），最低总成本是多少元/天？',
        answer: 4110, tolerance: 2,
        explain: '总需求 270 件。城西干线更便宜（4 元），故用满 150 件；城北补足 120 件。总成本 = 6×120 + 4×150 + 3×270 + 5×120 + 8×90 + 11×60 = 720 + 600 + 810 + 600 + 720 + 660 = 4 110 元/天。'
      },
      {
        id: 'ts-3', level: '概念', type: 'single',
        q: '为什么中转点的流量约束必须写成等式 x₁₁ + x₂₁ = y₁ + y₂ + y₃，而不能写成「≤」？',
        options: [
          '因为中转中心的容量是无限的',
          '因为中转点既不生产也不消费，进入的货物必须全部发出，否则就意味着货物在中转中心凭空消失或堆积',
          '因为写成「≤」会使问题无界',
          '因为等式约束更容易求解'
        ],
        answer: 1,
        explain: '中转点的物理含义是「过路」：它不产生新货物，也不消耗货物。因此流入量必须等于流出量。写成不等式会允许货物「消失」，模型就会给出一个虚假的低成本解。'
      },
      {
        id: 'ts-4', level: '计算', type: 'number',
        q: '其他参数不变，把中转服务费从 3 元/件提高到 8 元/件，最低总成本增加多少元/天？',
        answer: 1350, tolerance: 1,
        explain: '中转服务费按吞吐量线性计费，总吞吐量为 270 件，因此成本增加 270 × (8 − 3) = 1 350 元/天。由于最优运输结构并未改变，这个增量与调运方案无关。'
      },
      {
        id: 'ts-5', level: '建模', type: 'text',
        q: '请说明如何把一个「两产地—一中转—三销地」的转运问题转化为标准运输问题，写出变量定义、目标函数与全部约束，并指出拆点后模型规模发生了什么变化。',
        reference: '变量：x₁₁、x₂₁ 为两产地运往中转中心收货点 C⁻ 的量；y₁、y₂、y₃ 为从中转中心发货点 C⁺ 运往三个销地的量。\n目标：min z = (c₁₁+h)x₁₁ + (c₂₁+h)x₂₁ + C₁y₁ + C₂y₂ + C₃y₃，其中 h 为中转服务费。\n约束：x₁₁ ≤ a₁；x₂₁ ≤ a₂（产地供给）；x₁₁ + x₂₁ = y₁ + y₂ + y₃（中转点流量守恒）；yⱼ = dⱼ（销地需求）；全部变量 ≥ 0。\n规模变化：中转点由一个节点变为两个节点，模型中多出一条流量守恒等式；网络弧数由「产地→中转 + 中转→销地」变为「产地→C⁻ + C⁻→C⁺ + C⁺→销地」，即多了一条内部弧。若中转点有 m 个，节点数与等式数各增加 m。',
        explain: '转化的关键在于「把节点的守恒关系显式写成等式」。这也解释了一个更一般的结论：转运问题、最短路问题、最大流问题都可以统一到「网络流」框架下，只是约束的形式不同。'
      }
    ]
  });

  /* 网络流量图 */
function flowSVG(v, demand, C, x11, x21, y) {
  var W = 760, H = 340;
  var s = [];
  s.push('<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:inherit">');
  s.push('<defs><marker id="fl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
    '<path d="M 0 0 L 10 5 L 0 10 z" fill="#e11d48"/></marker></defs>');

  var P1 = { x: 90, y: 95 }, P2 = { x: 90, y: 245 };
  var CM = { x: 330, y: 90 }, CP = { x: 330, y: 250 };
  var D = [{ x: 640, y: 60 }, { x: 640, y: 170 }, { x: 640, y: 280 }];

  function edge(a, b, q, color, label, dash) {
    var dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
    var ux = dx / L, uy = dy / L;
    var x1 = a.x + ux * 30, y1 = a.y + uy * 30;
    var x2 = b.x - ux * 34, y2 = b.y - uy * 34;
    s.push('<path d="M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2 + '" fill="none" stroke="' + color +
      '" stroke-width="' + (1.4 + Math.min(4, q / 60)) + '"' + (dash ? ' stroke-dasharray="5 4"' : '') +
      ' marker-end="url(#fl-arrow)" opacity=".85"/>');
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 6;
    s.push('<rect x="' + (mx - 30) + '" y="' + (my - 9) + '" width="60" height="17" rx="6" fill="#fff" stroke="#e2e8f2"/>');
    s.push('<text x="' + mx + '" y="' + (my + 3) + '" font-size="10" font-weight="700" fill="#e11d48" text-anchor="middle">' + label + '</text>');
  }

  edge(P1, CM, x11, '#94a3b8', x11 + ' 件');
  edge(P2, CM, x21, '#94a3b8', x21 + ' 件');
  /* 中间内部弧 */
  s.push('<path d="M ' + CM.x + ' ' + (CM.y + 30) + ' L ' + CP.x + ' ' + (CP.y - 30) + '" fill="none" stroke="#6d4aff" stroke-width="3" stroke-dasharray="6 4" marker-end="url(#fl-arrow)"/>');
  s.push('<rect x="' + (CM.x - 46) + '" y="' + ((CM.y + CP.y) / 2 - 9) + '" width="92" height="18" rx="6" fill="#f2eeff" stroke="#6d4aff"/>');
  s.push('<text x="' + CM.x + '" y="' + ((CM.y + CP.y) / 2 + 4) + '" font-size="10" font-weight="700" fill="#6d4aff" text-anchor="middle">中转 ' + (x11 + x21) + ' 件</text>');

  D.forEach(function (d, i) { edge(CP, d, y[i], '#d97706', y[i] + ' 件'); });

  function box(p, title, sub, color, fill) {
    s.push('<rect x="' + (p.x - 42) + '" y="' + (p.y - 26) + '" width="84" height="52" rx="11" fill="' + fill + '" stroke="' + color + '" stroke-width="1.8"/>');
    s.push('<text x="' + p.x + '" y="' + (p.y - 4) + '" font-size="12" font-weight="700" fill="#1e293b" text-anchor="middle">' + title + '</text>');
    s.push('<text x="' + p.x + '" y="' + (p.y + 13) + '" font-size="9.5" fill="#64748b" text-anchor="middle">' + sub + '</text>');
  }
  box(P1, '城北工厂', '供给 ' + v.a1, '#2b5cff', '#f0f4ff');
  box(P2, '城西工厂', '供给 ' + v.a2, '#0d9488', '#e9fbf8');
  box(CM, 'C⁻ 收货', '分拣 / 换装', '#6d4aff', '#f2eeff');
  box(CP, 'C⁺ 发货', '服务费 ' + v.h + ' 元', '#6d4aff', '#f2eeff');
  D.forEach(function (d, i) {
    box(d, '大区 ' + 'ABC'[i], '需求 ' + demand[i], '#d97706', '#fff7e8');
  });
  s.push('</svg>');
  return s.join('');
}

  /* ==========================================================================
   * 12. 呼叫中心坐席排班 —— Erlang C 与服务水平
   * ======================================================================= */
  OR.Lab.register({
    id: 'queue-callcenter',
    name: '呼叫中心坐席排班',
    subtitle: 'Erlang C · 服务水平 · 人力成本优化',
    level: 2, topic: '排队论', icon: 'cpu', tone: 'teal',
    knowledge: {
      core: ['q-erlangc', 'q-mmc', 'q-optimize'],
      support: ['q-littles'],
      extend: ['q-mmk', 'q-variability']
    },
    tags: ['Erlang C', '服务水平', '80/20 标准', '坐席排班', '等待成本'],
    brief: '在「多配坐席」与「客户等待」之间找到平衡点，同时满足 80/20 服务水平承诺。',
    scenario: '某银行客服中心每小时接到约 360 通来电，平均通话（含事后处理）96 秒。运营部门承诺「80% 的来电在 20 秒内被接起」。人力成本为每坐席每小时 60 元，而客户等待造成的满意度损失折算为每小时 180 元。运营总监需要回答两个问题：为满足服务承诺至少要排多少坐席？从总成本角度看又该排多少？这两个答案一致吗？',
    objectives: [
      '用 Erlang C 公式计算「来电需等待」的概率与 20 秒内接通率',
      '理解坐席数对服务水平的<b>非线性</b>影响：临界点附近增减 1 人差异巨大',
      '分别以「服务水平约束」与「总成本最小」求解坐席数，并解释两者为何可能不同',
      '读懂成本曲线的平坦区：在最优附近多配 1 人的代价其实很小',
      '认识按时段排班的必要性：用全日平均到达率排班会同时造成高峰拥堵与低谷闲置'
    ],
    theory: [
      '<b>Erlang C</b> 给出 M/M/c 系统中「到达时全部坐席均忙、必须等待」的概率，是呼叫中心行业排班的标准工具。',
      '<b>服务水平</b> SL(T) = 1 − P(wait)·e<sup>−(cμ−λ)T</sup>，表示在 T 秒内被接起的来电比例。',
      '<b>80/20 标准</b>：至少 80% 的来电在 20 秒内被应答。它同时约束了「需等待概率」与「等待时长分布」。',
      '<b>成本模型</b>：总成本 = 坐席数 × 单位坐席成本 + 到达率 × 平均等待时间 × 单位等待成本。',
      '<b>非线性来源</b>：ρ → 1 时等待时间急剧发散，因此坐席数在临界点附近的服务水平弹性极大。'
    ],
    params: [
      P.group('话务负载', [
        P.range('lambda', '每小时来电量', { min: 120, max: 800, step: 20, value: 360, unit: '通/小时' }),
        P.range('aht', '平均处理时长', { min: 60, max: 300, step: 6, value: 96, unit: '秒' })
      ]),
      P.group('服务承诺', [
        P.range('targetSec', '应答时限 T', { min: 10, max: 60, step: 5, value: 20, unit: '秒' }),
        P.range('targetSL', '目标接通率', { min: 60, max: 95, step: 5, value: 80, unit: '%' })
      ]),
      P.group('成本参数', [
        P.range('costAgent', '每坐席成本', { min: 30, max: 120, step: 5, value: 60, unit: '元/小时' }),
        P.range('costWait', '客户等待成本', { min: 30, max: 300, step: 10, value: 180, unit: '元/小时' })
      ])
    ],
    run: function (v) {
      var mu = 3600 / v.aht;                 // 每坐席每小时处理量
      var a = v.lambda / mu;                 // 提供的负载（Erlang）
      var cMin = Math.floor(a) + 1;          // 保证 ρ < 1 的最小坐席数
      var T = v.targetSec / 3600;            // 换算为小时
      var targetSL = v.targetSL / 100;

      if (cMin > 60) {
        return {
          blocks: [B.note('负载过高（a = ' + fmt(a, 2) + ' 人·小时/小时），最小坐席数已超过 60，超出本实验的展示范围。请降低来电量或缩短处理时长。', 'rose')],
          summary: '负载过高：a=' + fmt(a, 2)
        };
      }

      var rows = [], cCol = cMin;
      var cSL = null, cCost = null;
      for (var c = cMin; c <= cMin + 14; c++) {
        var r = OR.queue.erlangC(v.lambda, mu, c, T);
        if (!r.stable) continue;
        var agentCost = c * v.costAgent;
        var waitCost = v.lambda * r.Wq * v.costWait;
        var total = agentCost + waitCost;
        var row = {
          c: c, rho: r.rho, pWait: r.pWait, wqMin: r.Wq * 60, sl: r.serviceLevel,
          agentCost: agentCost, waitCost: waitCost, total: total
        };
        rows.push(row);
        if (cSL === null && r.serviceLevel >= targetSL - 1e-9) cSL = row;
        if (cCost === null || total < cCost.total) cCost = row;
      }

      if (!rows.length) {
        return { blocks: [B.note('无稳定解：请提高坐席数范围或降低负载。', 'rose')], summary: '无稳定解' };
      }

      var rec = cCost;
      var metrics = [
        { k: '成本最优坐席数', v: rec.c, unit: '人', tone: 'brand', hint: '总成本 ' + fmt(rec.total, 0) + ' 元/小时' },
        { k: '满足服务承诺最少坐席', v: cSL ? cSL.c : '未达', unit: cSL ? '人' : '', tone: 'teal', hint: cSL ? '接通率 ' + pct(cSL.sl) + '%' : '扫描范围内未达标' },
        { k: '坐席利用率 ρ', v: fmt(rec.rho, 3), tone: rec.rho > 0.9 ? 'rose' : 'green', hint: rec.rho > 0.9 ? '已接近饱和' : '仍有余量' },
        { k: '需等待概率', v: pct(rec.pWait, 1), unit: '%', tone: 'amber', hint: '来电时全部坐席均在忙' },
        { k: '平均等待时间', v: fmt(rec.wqMin, 2), unit: '分钟', tone: 'violet', hint: '仅统计进入队列的来电' },
        { k: '20 秒接通率', v: pct(rec.sl, 1), unit: '%', tone: rec.sl >= targetSL ? 'green' : 'rose', hint: '目标 ' + v.targetSL + '%' }
      ];

      var blocks = [];
      blocks.push(B.metrics(metrics));

      /* --- 服务水平曲线 --- */
      blocks.push(B.card('坐席数与服务水平的关系', [
        B.chart('line', {
          height: 220,
          title: '坐席数 → 接通率 / 需等待概率（目标线 ' + v.targetSL + '%）',
          labels: rows.map(function (x) { return String(x.c); }),
          series: [
            { label: '20 秒接通率 (%)', values: rows.map(function (x) { return pct(x.sl, 1); }), color: '#10b981', fill: true },
            { label: '需等待概率 (%)', values: rows.map(function (x) { return pct(x.pWait, 1); }), color: '#e11d48' },
            { label: '目标接通率 (%)', values: rows.map(function () { return v.targetSL; }), color: '#94a3b8', dash: true }
          ],
          yLabel: '%', xLabel: '坐席数'
        }),
        B.html('<p class="small muted">曲线是<b>非线性</b>的：在临界点（ρ 接近 1）附近，增加 1 名坐席就能让接通率跃升十几甚至几十个百分点；而当坐席已经充裕时，再加人的边际效果迅速衰减。</p>')
      ], '非线性是排队系统最重要的直觉', 'teal'));

      /* --- 成本曲线 --- */
      blocks.push(B.card('成本权衡与最优坐席数', [
        B.chart('line', {
          height: 220,
          title: '坐席成本 + 等待成本 = 总成本（元/小时）',
          labels: rows.map(function (x) { return String(x.c); }),
          series: [
            { label: '坐席成本', values: rows.map(function (x) { return fmt(x.agentCost, 0); }), color: '#2b5cff' },
            { label: '等待成本', values: rows.map(function (x) { return fmt(x.waitCost, 0); }), color: '#f59e0b' },
            { label: '总成本', values: rows.map(function (x) { return fmt(x.total, 0); }), color: '#6d4aff', fill: true }
          ],
          yLabel: '元/小时', xLabel: '坐席数'
        }),
        B.html('<p class="small muted">总成本曲线呈 <b>U 形</b>：坐席成本线性上升，等待成本加速下降。最低点即为经济最优配置 c* = <b>' + rec.c + '</b>，总成本 <b>' + fmt(rec.total, 0) + ' 元/小时</b>。</p>')
      ], '服务成本与等待成本的取舍', 'amber'));

      /* --- 明细表 --- */
      blocks.push(B.card('各坐席配置的完整指标', [
        B.table({
          head: ['坐席数', '利用率 ρ', '需等待概率', '平均等待 (分)', '接通率', '坐席成本', '等待成本', '总成本'],
          rows: rows.map(function (x) {
            return [
              x.c, fmt(x.rho, 3), pct(x.pWait, 1) + '%', fmt(x.wqMin, 2), pct(x.sl, 1) + '%',
              fmt(x.agentCost, 0), fmt(x.waitCost, 0), fmt(x.total, 0)
            ];
          }),
          highlight: function (i) { return rows[i] && (rows[i].c === rec.c || (cSL && rows[i].c === cSL.c)); }
        }),
        B.html('<p class="tiny muted">高亮行分别为「成本最优」与「满足服务承诺的最小配置」。</p>')
      ], '把两个决策标准放在同一张表里比较', 'violet'));

      /* --- 教学解读 --- */
      var insight = [];
      insight.push('负载 a = λ/μ = ' + fmt(v.lambda, 0) + ' / ' + fmt(mu, 2) + ' = <b>' + fmt(a, 2) + ' Erlang</b>，即至少需要 ' + (Math.floor(a) + 1) + ' 名坐席才能让 ρ < 1。');
      insight.push('成本最优配置为 <b>' + rec.c + ' 人</b>，总成本 ' + fmt(rec.total, 0) + ' 元/小时（坐席 ' + fmt(rec.agentCost, 0) + ' + 等待 ' + fmt(rec.waitCost, 0) + '）。');
      if (cSL) {
        insight.push('满足「' + v.targetSL + '% 在 ' + v.targetSec + ' 秒内接通」的最少坐席为 <b>' + cSL.c + ' 人</b>（实际接通率 ' + pct(cSL.sl) + '%）。' +
          (cSL.c === rec.c ? '在本组参数下，服务标准与成本最优恰好重合，这是难得的「两全」情形。'
            : (cSL.c < rec.c ? '服务标准要求的坐席数<b>少于</b>成本最优点——说明承诺偏松，可以适当加人换取客户体验。'
              : '服务标准要求的坐席数<b>多于</b>成本最优点——若严格履约，需要为服务水平额外付费。')));
      }
      if (rows.length > 1) {
        var near = rows.filter(function (x) { return Math.abs(x.c - rec.c) === 1; })[0];
        if (near) {
          var delta = (near.total - rec.total) / rec.total * 100;
          insight.push('最优点的<b>平坦性</b>值得注意：从 ' + rec.c + ' 人增加到 ' + near.c + ' 人，总成本只变化 ' + fmt(delta, 1) +
            '%，但接通率从 ' + pct(rec.sl) + '% 变为 ' + pct(near.sl) + '%。当成本曲线平坦时，决策应更多考虑服务质量与员工负荷，而非死守成本最低点。');
        }
      }
      insight.push('实践提示：真实的到达率在一天内波动极大。用<b>全天平均</b>来排班，会让高峰时段严重拥堵、低谷时段大量闲置。正确做法是按时段（通常 15 或 30 分钟粒度）分别计算所需坐席，再取并集排班。');

      blocks.push(B.card('教学解读', [B.list(insight)], '两个标准，两种答案，以及它们背后的经济学', 'teal'));

      return {
        blocks: blocks,
        summary: '呼叫中心：λ=' + v.lambda + ' 通/时、AHT=' + v.aht + ' 秒（a=' + fmt(a, 2) + '）。成本最优 ' + rec.c +
          ' 人（总成本 ' + fmt(rec.total, 0) + ' 元/时，SL=' + pct(rec.sl) + '%）；满足 ' + v.targetSL + '%/' + v.targetSec +
          's 的最少坐席 ' + (cSL ? cSL.c : '未达') + ' 人。'
      };
    },
    problems: [
      {
        id: 'cc-1', level: '概念', type: 'single',
        q: 'Erlang C 公式给出的 P(wait) 的含义是：',
        options: [
          '来电者平均等待时长的百分比',
          '来电到达时所有坐席都在忙、因而必须进入队列等待的概率',
          '坐席空闲的概率',
          '来电被拒绝（系统满员）的概率'
        ],
        answer: 1,
        explain: 'Erlang C 计算的是「到达即需等待」的概率，它是 M/M/c 系统中 P(系统中人数 ≥ c) 的概率。它与「阻塞概率」不同：后者是有限容量系统中来电被拒绝的概率（Erlang B）。'
      },
      {
        id: 'cc-2', level: '计算', type: 'number',
        q: '取默认参数（λ = 360 通/小时，平均处理 96 秒，要求 80% 的来电在 20 秒内接通），满足该服务承诺的最少坐席数是多少人？',
        answer: 13, tolerance: 0,
        explain: 'μ = 3600/96 = 37.5 通/小时/人，a = 9.6。c = 12 时 20 秒接通率仅 77.6%，未达标；c = 13 时升到 88.8%，首次达标。故最少需要 13 人。'
      },
      {
        id: 'cc-3', level: '计算', type: 'number',
        q: '在同一组参数下（坐席成本 60 元/小时、客户等待成本 180 元/小时），使「坐席成本 + 等待成本」最小的坐席数是多少人？',
        answer: 14, tolerance: 0,
        explain: '总成本 = 60c + 360·Wq·180。c = 13 时为 780 + 116 = 896 元；c = 14 时为 840 + 53 = 893 元；c = 15 时为 900 + 25 = 925 元。故最优为 14 人。它与服务标准要求的 13 人只差 1 人，但接通率从 88.8% 提升到 94.6%。'
      },
      {
        id: 'cc-4', level: '计算', type: 'number',
        q: '同一组默认参数下，若只排 10 名坐席（ρ = 0.96），平均等待时间约为多少分钟？（保留两位小数）',
        answer: 3.44, tolerance: 0.05,
        explain: 'c = 10 时 P(wait) ≈ 0.859，服务强度 ρ = 0.96，cμ − λ = 375 − 360 = 15 通/小时。Wq = P(wait)/(cμ − λ) ≈ 0.859/15 ≈ 0.0573 小时 ≈ 3.44 分钟。利用率仅比 14 人时高 27 个百分点，等待时间却是 14 人时的 70 倍——这就是排队系统的非线性。'
      },
      {
        id: 'cc-5', level: '建模', type: 'text',
        q: '如果要求你用这套模型为一个每天 8:00–22:00 运营的呼叫中心排班，你会如何组织计算？请说明需要哪些输入、如何分时段求解、以及如何处理「班次连续性」这一现实约束。',
        reference: '输入：①分时段的到达率曲线 λ(t)（通常按 15 或 30 分钟统计历史话务）；②平均处理时长 AHT 及其分布；③服务目标（如 80/20）；④坐席成本与等待成本；⑤排班规则（班次长度、休息、交接班）。\n分时段求解：对每个时段 t，用 Erlang C 以 λ(t) 为输入、按服务目标反解所需最少坐席 c(t)，得到一条「坐席需求曲线」。\n处理班次连续性：需求曲线是阶梯状的，而班次是连续块（如 8 小时），因此不能直接按时段人数排班，而要解一个「集合覆盖 / 排班」问题——枚举可行班次（起始时间 × 时长），以「各时段人数不低于 c(t)」为约束、以总人力成本最小为目标求解。\n补充：还要为病假、午餐、培训预留余量（shrinkage），通常按 15%~30% 上浮；并用仿真或历史数据回测排班方案的实际服务水平。',
        explain: '这道题的关键认识是：Erlang C 只解决「某一时刻需要多少人」，而排班解决「如何用连续的班次覆盖这条需求曲线」。前者是排队论问题，后者是整数规划/集合覆盖问题——两者结合才是完整的劳动力管理。'
      }
    ]
  });

  /* ==========================================================================
   * 13. 设备可靠性分析 —— 马尔可夫链
   * ======================================================================= */
  OR.Lab.register({
    id: 'markov-reliability',
    name: '设备可靠性分析',
    subtitle: '马尔可夫链 · 稳态分布 · 系统可用度',
    level: 2, topic: '随机过程', icon: 'cpu', tone: 'rose',
    knowledge: {
      core: ['mk-chain', 'mk-transition', 'mk-steady', 'mk-availability'],
      support: ['q-birthdeath'],
      extend: ['mk-absorb']
    },
    tags: ['马尔可夫链', '状态转移矩阵', '稳态分布', '可用度', 'MTBF'],
    brief: '设备在「正常—劣化—故障」三态间随机转移，长期可用度由转移概率决定。',
    scenario: '某关键生产设备的状态分为「正常」「轻微劣化」「故障」三档。统计显示：正常设备每月有 6% 概率进入劣化、0.5% 概率直接故障；劣化设备每月有 35% 概率经保养恢复正常、12% 概率恶化为故障；故障设备每月有 50% 概率被修复回到正常。设备部需要回答：长期来看这台设备有多少时间是可用的？把维修响应速度提高一倍，可用度能提升多少？',
    objectives: [
      '把设备的物理状态抽象为马尔可夫链的状态，并说明无后效性假设的现实含义',
      '构造状态转移矩阵，并验证每一行概率之和为 1',
      '通过解 πP = π 求出稳态分布，理解它是「长期时间占比」而非「最终停留状态」',
      '把稳态分布换算为可用度、故障时间占比等业务指标',
      '分析修复率对可用度的影响，理解 MTBF/MTTR 框架与马尔可夫模型的等价性'
    ],
    theory: [
      '<b>马尔可夫性</b>：给定当前状态，未来状态的条件分布与更早的历史无关。设备「当前处于哪一档」已概括了预测未来所需的全部信息。',
      '<b>转移矩阵</b> P 的每一行对应一个「出发状态」，行内元素之和必须为 1。',
      '<b>稳态分布</b> π 满足 πP = π 且 Σπᵢ = 1，其分量 πᵢ 表示长期运行中处于状态 i 的<b>时间比例</b>。',
      '<b>可用度</b> A = Σ<sub>可工作状态</sub> πᵢ。对两状态系统退化为 A = MTBF/(MTBF + MTTR)。',
      '稳态分布存在且唯一的前提是链<b>不可约</b>（任意两状态互通）且<b>非周期</b>。'
    ],
    params: [
      P.group('劣化与故障转移', [
        P.range('p01', '正常 → 劣化', { min: 0.01, max: 0.20, step: 0.01, value: 0.06, unit: '/月' }),
        P.range('p02', '正常 → 故障', { min: 0.001, max: 0.05, step: 0.001, value: 0.005, unit: '/月' }),
        P.range('p12', '劣化 → 故障', { min: 0.02, max: 0.30, step: 0.01, value: 0.12, unit: '/月' })
      ]),
      P.group('恢复能力', [
        P.range('p10', '劣化 → 正常（保养）', { min: 0.05, max: 0.60, step: 0.05, value: 0.35, unit: '/月' }),
        P.range('p20', '故障 → 正常（修复）', { min: 0.10, max: 1.00, step: 0.05, value: 0.50, unit: '/月' })
      ])
    ],
    run: function (v) {
      /* 状态：0 正常 / 1 劣化 / 2 故障 */
      var P = [
        [1 - v.p01 - v.p02, v.p01, v.p02],
        [v.p10, 1 - v.p10 - v.p12, v.p12],
        [v.p20, 0, 1 - v.p20]
      ];
      var res = OR.markov.steady(P);
      if (!res.ok) {
        return { blocks: [B.note('转移矩阵无效：' + res.error, 'rose')], summary: '稳态求解失败：' + res.error };
      }
      var pi = res.stationary;
      var availability = pi[0] + pi[1];
      var names = ['正常', '劣化', '故障'];
      var colors = ['#10b981', '#f59e0b', '#e11d48'];

      /* 收敛过程：从「正常」出发 */
      var steps = 20, conv = { 0: [], 1: [], 2: [] };
      var dist = [1, 0, 0];
      for (var n = 0; n <= steps; n++) {
        for (var k = 0; k < 3; k++) conv[k].push(fmt(dist[k] * 100, 2));
        var next = [0, 0, 0];
        for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) next[j] += dist[i] * P[i][j];
        dist = next;
      }

      var metrics = [
        { k: '长期可用度', v: pct(availability, 2), unit: '%', tone: 'brand', hint: '正常 + 劣化' },
        { k: '正常状态占比', v: pct(pi[0], 2), unit: '%', tone: 'green' },
        { k: '劣化状态占比', v: pct(pi[1], 2), unit: '%', tone: 'amber' },
        { k: '故障状态占比', v: pct(pi[2], 2), unit: '%', tone: 'rose', hint: '不可用时间' },
        { k: '稳态残差', v: res.residual, unit: '', tone: 'teal', hint: '‖πP − π‖∞，应为 0' },
        { k: '等效 MTBF / MTTR', v: fmt(1 / (1 - availability) * availability, 1), unit: '月 : 1 月', tone: 'violet', hint: '按可用度反推' }
      ];

      var blocks = [];
      blocks.push(B.metrics(metrics));

      /* --- 转移矩阵 --- */
      blocks.push(B.card('状态转移矩阵', [
        B.table({
          head: ['从 \\ 到', '正常', '劣化', '故障', '行和'],
          rows: P.map(function (row, i) {
            return [names[i]].concat(row.map(function (p) { return fmt(p, 3); })).concat([fmt(row.reduce(function (a, b) { return a + b; }, 0), 3)]);
          })
        }),
        B.formula([
          '<span class="cm">稳态方程</span>  πP = π，且 π₀ + π₁ + π₂ = 1',
          '<span class="cm">展开</span>  π₀ = ' + fmt(P[0][0], 3) + 'π₀ + ' + fmt(P[1][0], 3) + 'π₁ + ' + fmt(P[2][0], 3) + 'π₂',
          '        π₁ = ' + fmt(P[0][1], 3) + 'π₀ + ' + fmt(P[1][1], 3) + 'π₁ + ' + fmt(P[2][1], 3) + 'π₂',
          '        π₂ = ' + fmt(P[0][2], 3) + 'π₀ + ' + fmt(P[1][2], 3) + 'π₁ + ' + fmt(P[2][2], 3) + 'π₂',
          '<span class="cm">解</span>    π = (' + pi.map(function (p) { return fmt(p, 4); }).join(', ') + ')'
        ])
      ], '每一行是一个「出发状态」，行和必须为 1', 'violet'));

      /* --- 稳态分布与收敛 --- */
      blocks.push(B.card('稳态分布与收敛过程', [
        B.chart('bar', {
          height: 190,
          title: '长期时间占比（稳态分布）',
          labels: names,
          series: [{ label: '时间占比 (%)', values: pi.map(function (p) { return pct(p, 2); }), color: '#6d4aff' }],
          showValues: true, legend: false, yLabel: '%'
        }),
        B.chart('line', {
          height: 210,
          title: '从「正常」出发，各状态概率随步数的收敛（单位：%）',
          labels: conv[0].map(function (_, i) { return String(i); }),
          series: [
            { label: '正常', values: conv[0], color: '#10b981' },
            { label: '劣化', values: conv[1], color: '#f59e0b' },
            { label: '故障', values: conv[2], color: '#e11d48' }
          ],
          yLabel: '%', xLabel: '步数（月）'
        }),
        B.html('<p class="small muted">三条曲线在约 8~12 步后基本贴合稳态值。注意：<b>收敛到稳态</b>并不意味着系统停止变化——它仍在三态之间不断转移，只是各状态的时间占比稳定了。</p>')
      ], '稳态是「概率的稳定」，不是「状态的不动」', 'teal'));

      /* --- 修复率敏感性 --- */
      var scan = [];
      for (var q = 0.10; q <= 1.0001; q += 0.05) {
        var P2 = [
          [1 - v.p01 - v.p02, v.p01, v.p02],
          [v.p10, 1 - v.p10 - v.p12, v.p12],
          [q, 0, 1 - q]
        ];
        var r2 = OR.markov.steady(P2);
        scan.push({ q: fmt(q, 2), A: r2.ok ? pct(r2.stationary[0] + r2.stationary[1], 3) : null });
      }
      blocks.push(B.card('修复能力对可用度的影响', [
        B.chart('line', {
          height: 200,
          title: '故障修复概率 p₂₀ 与长期可用度',
          labels: scan.map(function (x) { return x.q; }),
          series: [{ label: '可用度 (%)', values: scan.map(function (x) { return x.A; }), color: '#10b981', fill: true }],
          yLabel: '%', xLabel: '每月修复概率 p₂₀'
        }),
        B.html('<p class="small muted">曲线<b>凹向原点</b>：修复概率从 0.10 提到 0.30 时可用度提升最快；从 0.70 再往上提，收益已经很小。这说明「补短板」要补在最痛的地方——当修复已经很快时，继续压缩维修时间的性价比远低于降低故障率。</p>')
      ], '可用度的两条改进路径：少坏，或快修', 'amber'));

      /* --- 教学解读 --- */
      var insight = [];
      insight.push('长期来看，设备有 <b>' + pct(pi[0], 2) + '%</b> 的时间处于正常、<b>' + pct(pi[1], 2) + '%</b> 处于劣化、<b>' + pct(pi[2], 2) + '%</b> 处于故障。');
      insight.push('因此<b>可用度 = ' + pct(availability, 2) + '%</b>，不可用度 ' + pct(1 - availability, 2) + '%。按每月 30 天计，平均每月停机约 <b>' + fmt((1 - availability) * 30, 2) + ' 天</b>。');
      insight.push('若把故障修复概率 p₂₀ 从 ' + v.p20 + ' 提高到 ' + fmt(Math.min(1, v.p20 + 0.2), 2) + '，可用度将明显上升；但若只看「提高修复速度」，收益会随 p₂₀ 上升而递减（见曲线）。');
      insight.push('这与 MTBF/MTTR 框架完全一致：A = MTBF/(MTBF + MTTR)。马尔可夫模型的优势在于它能处理<b>三个以上状态</b>——例如把「劣化」单独建模，从而评估「预防性保养」的价值，这是两状态模型做不到的。');
      insight.push('建模提醒：状态定义必须满足无后效性。如果把状态只定义为「正常/故障」两档，就丢失了「劣化程度」这一关键信息，预测精度会明显下降。');

      blocks.push(B.card('教学解读', [B.list(insight)], '把三个数字翻译成停机天数与维修策略', 'teal'));

      return {
        blocks: blocks,
        summary: '三态设备链：稳态分布 (' + pi.map(function (p) { return fmt(p, 3); }).join(', ') + ')，长期可用度 ' +
          pct(availability, 2) + '%，每月平均停机约 ' + fmt((1 - availability) * 30, 2) + ' 天。'
      };
    },
    problems: [
      {
        id: 'mr-1', level: '概念', type: 'single',
        q: '关于「稳态分布 π」，下列说法正确的是：',
        options: [
          '系统最终会停在概率最大的那个状态不再变化',
          'πᵢ 表示长期运行中系统处于状态 i 的时间比例，系统本身仍在状态间不断转移',
          '稳态分布与初始状态有关，不同起点会收敛到不同的 π',
          '只要转移矩阵每行之和为 1，就一定存在唯一的稳态分布'
        ],
        answer: 1,
        explain: '稳态是「概率分布不再变化」，而不是「状态不再变化」。对不可约非周期的马尔可夫链，稳态分布唯一且与初始状态无关。仅有行和为 1 不足以保证唯一性（例如含吸收态或可约的链）。'
      },
      {
        id: 'mr-2', level: '计算', type: 'number',
        q: '取默认参数（p₀₁=0.06、p₀₂=0.005、p₁₂=0.12、p₁₀=0.35、p₂₀=0.50），设备的长期可用度是多少？（百分比，保留一位小数）',
        answer: 96.5, tolerance: 0.2,
        explain: '由 π₁ = (p₀₁/(p₁₀+p₁₂))π₀ = 0.1277π₀，π₂ = (p₀₂π₀ + p₁₂π₁)/p₂₀ = 0.0406π₀，归一化得 π = (0.8560, 0.1093, 0.0348)。可用度 = π₀ + π₁ = 0.9652 ≈ 96.5%。'
      },
      {
        id: 'mr-3', level: '计算', type: 'number',
        q: '承接上题，若设备当前处于「正常」状态，经过 1 个月后它处于「故障」状态的概率是多少？（百分比，保留一位小数）',
        answer: 0.5, tolerance: 0.1,
        explain: '从正常状态出发，一步转移到故障的概率就是矩阵元素 p₀₂ = 0.005 = 0.5%。注意这与稳态故障占比 3.48% 完全不同：前者是「一步内的转移概率」，后者是「长期的时间比例」。'
      },
      {
        id: 'mr-4', level: '概念', type: 'single',
        q: '把故障修复概率 p₂₀ 从 0.10 逐步提高到 0.90，可用度的提升幅度会：',
        options: [
          '保持线性增长，每提高 0.1 都带来相同的可用度增量',
          '先快后慢：低修复率区间提升明显，高修复率区间趋于饱和',
          '先慢后快：修复率越高，提升越明显',
          '完全不变，因为可用度只取决于故障率'
        ],
        answer: 1,
        explain: '可用度 A = 1 − π₂，而 π₂ 与修复率大致成反比（π₂ ≈ 故障流入率 / p₂₀）。反比关系意味着：从 0.1 提到 0.2 的效果远大于从 0.8 提到 0.9。这解释了为什么「维修已经很快」时，继续投入维修资源不如降低故障率。'
      },
      {
        id: 'mr-5', level: '建模', type: 'text',
        q: '请写出这个三状态设备的转移矩阵，说明每一行、每一列的含义，并指出若要评估「预防性保养」的价值，模型需要如何扩展。',
        reference: '状态顺序取（正常、劣化、故障），转移矩阵为：\nP = [[1−p₀₁−p₀₂, p₀₁, p₀₂],\n     [p₁₀, 1−p₁₀−p₁₂, p₁₂],\n     [p₂₀, 0, 1−p₂₀]]\n行 = 当前（出发）状态，列 = 下一期（到达）状态；元素 pᵢⱼ 表示「本期处于 i、下期转移到 j」的概率；每行之和为 1（概率完备性）。\n扩展方向：①把「保养」作为一个显式的决策变量，令 p₁₀ 随保养投入变化（p₁₀ = f(保养预算)），从而在「保养成本」与「停机损失」之间做权衡；②增加「大修」状态或引入半马尔可夫模型，刻画各状态停留时间的分布；③把 p 参数视为随时间（役龄）变化，构造非齐次马尔可夫链，反映设备老化。',
        explain: '这道题的核心是「行是出发、列是到达」这一约定不能搞反；一旦搞反，稳态解会完全错误。此外要意识到：标准马尔可夫链把转移概率当作外生常数，而管理决策（保养投入）恰恰是通过改变这些概率来影响系统行为的——这正是把模型用于决策的关键接口。'
      }
    ]
  });

  /* ==========================================================================
   * 14. 配送中心选址 —— 0-1 整数规划与分支定界
   * ======================================================================= */
  OR.Lab.register({
    id: 'mip-facility',
    name: '配送中心选址',
    subtitle: '0-1 整数规划 · 分支定界 · 固定成本权衡',
    level: 3, topic: '整数规划', icon: 'target', tone: 'amber',
    knowledge: {
      core: ['ip-facility', 'ip-binary', 'ip-branchbound'],
      support: ['ip-relaxation'],
      extend: ['lp-dual']
    },
    tags: ['选址问题', '0-1 变量', '分支定界', '固定成本', '容量约束'],
    brief: '在 6 个候选地中决定建哪几个配送中心，使「建设固定成本 + 年运输成本」最低。',
    scenario: '某零售企业计划在区域内部署配送中心，有 6 个候选地块，各自的建设成本与最大吞吐能力不同；区域内 8 个城市各有确定的年需求量，从每个候选地到每个城市的单位运价与距离成正比。董事会要求物流部给出「建几个、建在哪、谁服务谁」的完整方案，并解释为什么不多建几个以缩短运距。',
    objectives: [
      '用 0-1 变量表达「是否在候选地建站」这一离散决策',
      '写出「只有建了站才能服务」的联动约束 xᵢⱼ ≤ yⱼ，并说明缺少它会得到荒谬解',
      '理解固定成本与运输成本的张力如何决定最优建站数量',
      '读懂分支定界的「定界—剪枝—分支」三动作，并解释剪枝为什么能保证最优性',
      '比较不同固定成本水平下的选址结构，理解「规模经济 vs 响应速度」的取舍'
    ],
    theory: [
      '<b>0-1 变量</b> yⱼ ∈ {0,1} 表示是否在候选地 j 建站，fⱼ 为建设固定成本。',
      '<b>联动约束</b> Σᵢ dᵢxᵢⱼ ≤ capⱼ·yⱼ：未建的站不能承担任何需求，这是模型正确性的关键。',
      '<b>指派约束</b> Σⱼ xᵢⱼ = 1：每个城市的需求必须被完全满足。',
      '<b>分支定界</b>：对 LP 松弛解中的小数变量分支（y ≤ 0 与 y ≥ 1），用松弛值作为界剪掉不可能更优的子问题。',
      '<b>整数间隙</b>：LP 松弛解通常优于整数解，两者的差距反映了「离散性」带来的额外成本。'
    ],
    params: [
      P.group('成本结构', [
        P.range('fixedScale', '固定成本倍率', { min: 0.3, max: 1.5, step: 0.1, value: 1.0, unit: '倍', hint: '1.0 为基准建设成本' }),
        P.range('freight', '单位运价', { min: 0.04, max: 0.30, step: 0.02, value: 0.12, unit: '元/件·km' })
      ]),
      P.group('决策约束', [
        P.range('openK', '最多建站数量', { min: 2, max: 6, step: 1, value: 6, unit: '个' }),
        P.range('days', '年运营天数', { min: 200, max: 365, step: 5, value: 300, unit: '天' })
      ])
    ],
    run: function (v) {
      var FAC = [
        { id: 'F1', x: 120, y: 180, f: 520, cap: 260 },
        { id: 'F2', x: 300, y: 90, f: 610, cap: 240 },
        { id: 'F3', x: 520, y: 200, f: 560, cap: 300 },
        { id: 'F4', x: 680, y: 380, f: 430, cap: 220 },
        { id: 'F5', x: 260, y: 420, f: 470, cap: 230 },
        { id: 'F6', x: 480, y: 500, f: 380, cap: 200 }
      ];
      var CUS = [
        { id: 'C1', x: 100, y: 60, d: 90 },
        { id: 'C2', x: 240, y: 260, d: 110 },
        { id: 'C3', x: 400, y: 150, d: 130 },
        { id: 'C4', x: 600, y: 120, d: 80 },
        { id: 'C5', x: 180, y: 460, d: 70 },
        { id: 'C6', x: 380, y: 380, d: 120 },
        { id: 'C7', x: 620, y: 520, d: 95 },
        { id: 'C8', x: 720, y: 260, d: 85 }
      ];

      var fixed = FAC.map(function (f) { return Math.round(f.f * v.fixedScale); });
      /* 单位成本（万元/件·年）= 距离 × 运价 × 天数 / 10000 */
      var cost = CUS.map(function (c) {
        return FAC.map(function (f) {
          var dist = Math.hypot(c.x - f.x, c.y - f.y);
          return Math.round(dist * v.freight * v.days / 10000 * 10000) / 10000;
        });
      });
      var demand = CUS.map(function (c) { return c.d; });

      var res = OR.solveFacility({
        demand: demand, fixed: fixed, capacity: FAC.map(function (f) { return f.cap; }),
        cost: cost, openK: v.openK
      });

      if (res.status !== 'optimal') {
        return {
          blocks: [
            B.note('<b>当前约束下无可行方案</b>：' + res.message +
              '。候选设施的总容量为 ' + FAC.reduce(function (a, f) { return a + f.cap; }, 0) +
              ' 件/天，而总需求为 780 件/天——当「最多建站数量」过小时，容量不足以覆盖需求。', 'rose'),
            B.html('<p class="small muted">请把「最多建站数量」调大，至少要能让所选设施的容量之和超过总需求。</p>')
          ],
          summary: '选址问题不可行：' + res.message
        };
      }

      var best = res.best;
      var open = best.open;
      var openNames = open.map(function (j) { return FAC[j].id; });
      var metrics = [
        { k: '最低年总成本', v: fmt(best.totalCost, 1), unit: '万元', tone: 'brand' },
        { k: '建设固定成本', v: fmt(best.fixedCost, 0), unit: '万元', tone: 'violet', hint: pct(best.fixedCost / best.totalCost) + '%' },
        { k: '年运输成本', v: fmt(best.varCost, 1), unit: '万元', tone: 'teal', hint: pct(best.varCost / best.totalCost) + '%' },
        { k: '建站数量', v: open.length, unit: '个', tone: 'amber', hint: openNames.join('、') },
        { k: '分支定界访问节点', v: res.nodesVisited, unit: '个', tone: 'green', hint: '完全枚举需 ' + res.nodesTotal + ' 个' },
        { k: '剪枝率', v: pct(1 - res.nodesVisited / res.nodesTotal, 1), unit: '%', tone: 'rose', hint: '越高的界越能剪枝' }
      ];

      var blocks = [];
      blocks.push(B.metrics(metrics));

      /* --- 选址地图 --- */
      blocks.push(B.card('选址方案与配送关系', [
        B.svg(siteSVG(FAC, CUS, open, best, v), '选址方案地图'),
        B.html('<div class="legend" style="margin-top:8px">' +
          '<span><i style="background:#f59e0b"></i>已建配送中心</span>' +
          '<span><i style="background:#fff;border:1px dashed #94a3b8"></i>未选候选地</span>' +
          '<span><i style="background:#2b5cff;border-radius:50%"></i>需求城市（圆越大需求越高）</span>' +
          '<span><i style="background:#e11d48"></i>主要配送关系</span></div>')
      ], '把 0-1 决策画在地图上：哪几个点被点亮，谁服务谁', 'amber'));

      /* --- 方案明细 --- */
      var assignRows = best.assign.map(function (a) {
        var c = CUS[a.customer];
        return [c.id, c.d, FAC[a.facility].id, fmt(a.unitCost, 4), fmt(a.qty, 0), fmt(a.qty * a.unitCost, 2)];
      });
      blocks.push(B.card('服务指派明细', [
        B.table({
          head: ['城市', '需求 (件/天)', '主要服务设施', '单位成本 (万元/件)', '分配量 (件/天)', '年成本 (万元)'],
          rows: assignRows,
          highlight: function (i) { return i % 2 === 0; }
        }),
        B.formula([
          '<span class="cm">目标</span>  min  z = Σⱼ fⱼ yⱼ + Σᵢ Σⱼ cᵢⱼ dᵢ xᵢⱼ',
          '<span class="cm">指派</span>  Σⱼ xᵢⱼ = 1          <span class="cm">（每个城市必须被服务）</span>',
          '<span class="cm">联动</span>  Σᵢ dᵢ xᵢⱼ ≤ capⱼ yⱼ   <span class="cm">（没建站就不能服务）</span>',
          '<span class="cm">变量</span>  xᵢⱼ ∈ {0,1}，yⱼ ∈ {0,1}'
        ]),
        B.note('注意<b>联动约束</b>：若把 Σᵢ dᵢxᵢⱼ ≤ capⱼ·yⱼ 写成 Σᵢ dᵢxᵢⱼ ≤ capⱼ（去掉 yⱼ），模型就会允许「不建站却承担配送」，从而得到一个虚假的低成本解。这是整数规划建模最经典的陷阱。', 'brand')
      ], '约束写对，模型才有意义', 'teal'));

      /* --- 固定成本敏感性 --- */
      var scan = [];
      for (var fs = 0.3; fs <= 1.5001; fs += 0.1) {
        var f2 = FAC.map(function (f) { return Math.round(f.f * fs); });
        var r2 = OR.solveFacility({ demand: demand, fixed: f2, capacity: FAC.map(function (f) { return f.cap; }), cost: cost, openK: 6 });
        scan.push({
          fs: fmt(fs, 1),
          openCount: r2.status === 'optimal' ? r2.best.open.length : null,
          total: r2.status === 'optimal' ? fmt(r2.best.totalCost, 1) : null
        });
      }
      blocks.push(B.card('固定成本水平如何改变选址结构', [
        B.chart('line', {
          height: 210,
          title: '固定成本倍率 → 建站数量 与 总成本',
          labels: scan.map(function (x) { return x.fs; }),
          series: [
            { label: '最优建站数（个）', values: scan.map(function (x) { return x.openCount; }), color: '#f59e0b' },
            { label: '总成本（万元）', values: scan.map(function (x) { return x.total; }), color: '#6d4aff' }
          ],
          yLabel: '', xLabel: '固定成本倍率'
        }),
        B.html('<p class="small muted">固定成本越低，最优建站数越多、运输成本越低——这就是「规模经济」与「响应速度」之间的此消彼长。当固定成本降到足够低时，模型会倾向于「多而近」的网络；反之则倾向「少而大」。当前倍率 ' + v.fixedScale + ' 下最优为 <b>' + open.length + '</b> 个站。</p>')
      ], '同一片区域，成本结构不同，最优网络形态完全不同', 'violet'));

      /* --- 分支定界过程 --- */
      var pruneCount = res.trace.filter(function (t) { return t.action === 'prune'; }).length;
      blocks.push(B.card('分支定界的搜索过程', [
        B.kv([
          ['候选设施数', FAC.length + ' 个（完全枚举需 ' + res.nodesTotal + ' 个节点）'],
          ['实际访问节点', res.nodesVisited + ' 个'],
          ['剪枝次数', pruneCount + ' 次'],
          ['找到更优解', res.trace.filter(function (t) { return t.action === 'improve'; }).length + ' 次'],
          ['搜索效率', pct(1 - res.nodesVisited / res.nodesTotal, 1) + ' 的节点被剪掉']
        ]),
        B.html('<p class="small muted" style="margin-top:10px">分支定界的三个动作：<b>定界</b>——对当前子问题求 LP 松弛，得到该子问题可能达到的最好值；<b>剪枝</b>——若这个界还不如已找到的整数解，则整棵子树都不必再看；<b>分支</b>——选一个取小数的 0-1 变量，分成「取 0」与「取 1」两支。剪枝之所以不丢最优解，是因为界保证了被剪掉的子树里不可能存在更好的解。</p>')
      ], '为什么不用枚举 64 种组合？因为大多数分支可以被证明没用', 'rose'));

      /* --- 教学解读 --- */
      var insight = [];
      insight.push('最优方案：在 <b>' + openNames.join('、') + '</b> 建站，年总成本 <b>' + fmt(best.totalCost, 1) + ' 万元</b>（固定 ' + fmt(best.fixedCost, 0) + ' + 运输 ' + fmt(best.varCost, 1) + '）。');
      var ratio = best.fixedCost / best.totalCost;
      insight.push('固定成本占总成本的 <b>' + pct(ratio) + '%</b>。' +
        (ratio > 0.7 ? '当固定成本占绝对主导时，最优解必然是「少而大」——多建一个站节省的运费远不足以抵消建设投入。'
          : ratio < 0.4 ? '当运输成本占主导时，最优解倾向「多而近」。'
            : '两类成本量级接近，最优解对参数变化较为敏感。'));
      insight.push('分支定界只访问了 ' + res.nodesVisited + ' / ' + res.nodesTotal + ' 个节点（剪掉 ' + pct(1 - res.nodesVisited / res.nodesTotal, 1) + '%），却仍然<b>证明了</b>最优性——这是「界」的力量，而不是运气。');
      insight.push('若把「最多建站数量」限制为 ' + v.openK + ' 个，当前解' + (open.length <= v.openK ? '满足该约束' : '违反该约束') +
        '。当上限过小时，问题可能直接不可行（容量不足），这本身就是一条重要的管理约束。');

      blocks.push(B.card('教学解读', [B.list(insight)], '从数学最优到董事会能听懂的方案', 'teal'));

      return {
        blocks: blocks,
        summary: '选址问题：6 候选地、8 城市、总需求 780 件/天。最优建站 ' + openNames.join('、') +
          '（' + open.length + ' 个），年总成本 ' + fmt(best.totalCost, 1) + ' 万元（固定 ' + fmt(best.fixedCost, 0) +
          '、运输 ' + fmt(best.varCost, 1) + '）；分支定界访问 ' + res.nodesVisited + '/' + res.nodesTotal + ' 个节点。'
      };
    },
    problems: [
      {
        id: 'mf-1', level: '概念', type: 'single',
        q: '在设施选址模型中，约束 Σᵢ dᵢxᵢⱼ ≤ capⱼ·yⱼ（yⱼ 为是否建站的 0-1 变量）的作用是：',
        options: [
          '限制每个设施的服务能力不超过其容量',
          '同时表达「容量上限」与「只有建了站才能服务」两重含义',
          '保证每个城市恰好被一个设施服务',
          '计算建设固定成本'
        ],
        answer: 1,
        explain: '当 yⱼ = 0 时右端为 0，任何正向分配都被禁止——这就是「未建站不能服务」；当 yⱼ = 1 时右端退化为 capⱼ，即容量上限。一个约束同时承担了两个逻辑功能，这是 0-1 建模的典型技巧。'
      },
      {
        id: 'mf-2', level: '计算', type: 'number',
        q: '取默认参数（固定成本倍率 1.0、单位运价 0.12 元/件·km、年运营 300 天、不限建站数量），最优方案需要建几个配送中心？',
        answer: 3, tolerance: 0,
        explain: '总需求 780 件/天。由于建设固定成本（380~610 万元）远高于运输成本（最优方案约 467 万元），每多建一个站所节省的运费不足以抵消其固定投入，因此最优解为 3 个站（F1、F3、F4）。'
      },
      {
        id: 'mf-3', level: '计算', type: 'number',
        q: '承接上题，该最优方案的年总成本约为多少万元？（保留整数）',
        answer: 1977, tolerance: 3,
        explain: '固定成本 520 + 560 + 430 = 1 510 万元，运输成本约 467 万元，合计约 1 977 万元/年。'
      },
      {
        id: 'mf-4', level: '概念', type: 'single',
        q: '分支定界中「剪枝」的依据是：',
        options: [
          '某个子问题的 LP 松弛最优值已经不优于当前已知的整数解',
          '某个子问题的变量个数太多',
          '某个子问题已经搜索了太长时间',
          '某个子问题的约束数量超过上限'
        ],
        answer: 0,
        explain: 'LP 松弛给出的是该子问题所能达到的最好可能值（最大化时为上界，最小化时为下界）。如果这个界都不如已有的整数可行解，那么该子问题内部不可能存在更优解，整棵子树可以安全丢弃。'
      },
      {
        id: 'mf-5', level: '建模', type: 'text',
        q: '请写出这个选址问题的完整 0-1 混合整数规划模型（集合、参数、决策变量、目标函数、约束），并说明如果去掉 0-1 约束、只保留 0 ≤ yⱼ ≤ 1 会发生什么。',
        reference: '集合：候选设施 j ∈ J（|J| = 6），需求城市 i ∈ I（|I| = 8）。\n参数：fⱼ 建设固定成本；capⱼ 设施容量；dᵢ 城市需求；cᵢⱼ 单位运输成本。\n变量：yⱼ ∈ {0,1} 是否建站；xᵢⱼ ∈ [0,1] 城市 i 由设施 j 服务的比例。\n目标：min z = Σⱼ fⱼyⱼ + ΣᵢΣⱼ cᵢⱼdᵢxᵢⱼ。\n约束：Σⱼ xᵢⱼ = 1（∀i，需求全覆盖）；Σᵢ dᵢxᵢⱼ ≤ capⱼyⱼ（∀j，容量与联动）；yⱼ ∈ {0,1}；xᵢⱼ ≥ 0。\n去掉 0-1 约束后，yⱼ 可取 0.6 之类的分数，模型变成 LP 松弛：它的最优值是一个下界（通常低于真实整数最优），而且解本身不可执行（不能建「0.6 个配送中心」）。这正是分支定界需要分支的原因。',
        explain: '建模的三个易错点：①忘记 Σⱼxᵢⱼ = 1，导致部分需求被「忽略」；②忘记 yⱼ 的联动，导致不建站也能服务；③把 xᵢⱼ 设为连续变量却不说明其含义（此处表示「服务比例」，因需求可分割所以是合理的）。'
      }
    ]
  });

  /* ==========================================================================
   * 15. 库存参数仿真优化 —— 离散事件仿真 + 网格搜索
   * ======================================================================= */
  OR.Lab.register({
    id: 'sim-optim',
    name: '库存参数仿真优化',
    subtitle: '离散事件仿真 · 网格搜索 · 共同随机数',
    level: 3, topic: '仿真与风险', icon: 'chart', tone: 'brand',
    knowledge: {
      core: ['sim-optim', 'sim-des', 'sim-crn'],
      support: ['inv-qr', 'inv-service', 'sim-converge'],
      extend: ['ip-branchbound']
    },
    tags: ['仿真优化', '网格搜索', '共同随机数', '(Q,R) 策略', '噪声与置信区间'],
    brief: '当成本函数没有解析式时，用离散事件仿真在 (Q, R) 参数网格上搜索最低成本。',
    scenario: '某经销商采用 (Q, R) 补货策略：库存降到再订货点 R 就下单 Q 件。需求逐日随机波动，提前期固定为若干天，缺货会产生商誉损失。财务总监问：「到底该设多少 Q、多少 R？」由于缺货与持有成本都依赖随机需求的路径，这个问题没有简单的解析答案——只能通过仿真「测量」每个参数组合的成本，再从中挑出最好的。',
    objectives: [
      '理解仿真优化的本质：目标函数只能通过带噪声的仿真来「测量」',
      '用网格搜索在二维参数空间上定位最优区域，并读懂成本热力图',
      '认识仿真噪声：单次结果不可靠，必须重复多次并比较置信区间',
      '理解共同随机数（CRN）如何让不同参数方案的比较更公平、更灵敏',
      '观察 Q 与 R 的交互作用：两者不能独立优化'
    ],
    theory: [
      '<b>(Q, R) 策略</b>：当库存位置（现货 + 在途）降到 R 时，订购 Q 件。R 防缺货，Q 管经济批量。',
      '<b>仿真优化</b>：目标 J(θ) = E[C(θ, ω)] 无解析式，只能由仿真估计。常用网格搜索、坐标轮换、响应面法。',
      '<b>噪声处理</b>：每个参数点重复 R 次取均值，标准误为 s/√R；置信区间重叠时不能断言优劣。',
      '<b>共同随机数</b>：让不同参数方案共用同一组需求序列，使差值方差大幅降低，比较更灵敏。',
      '<b>维数灾难</b>：网格点数随参数维数指数增长，因此实际应用常采用先粗后细的两阶段搜索。'
    ],
    params: [
      P.group('需求环境', [
        P.range('meanDemand', '日均需求', { min: 120, max: 260, step: 10, value: 180, unit: '件/天' }),
        P.range('sdDemand', '需求标准差', { min: 10, max: 80, step: 5, value: 45, unit: '件/天' }),
        P.range('leadTime', '补货提前期', { min: 1, max: 5, step: 1, value: 3, unit: '天' })
      ]),
      P.group('成本参数', [
        P.range('holdingCost', '单位持有成本', { min: 0.4, max: 2.0, step: 0.1, value: 0.8, unit: '元/件·天' }),
        P.range('shortageCost', '单位缺货成本', { min: 6, max: 30, step: 2, value: 16, unit: '元/件' })
      ]),
      P.group('仿真设置', [
        P.range('periods', '仿真期数', { min: 120, max: 360, step: 20, value: 180, unit: '天' }),
        P.range('repeats', '每点重复次数', { min: 1, max: 5, step: 1, value: 3, unit: '次', hint: '次数越多噪声越小，但计算越慢' })
      ])
    ],
    run: function (v) {
      var ORDER_COST = 400;
      /* 自适应网格：以 EOQ 与提前期需求分布为中心 */
      var eoq = Math.sqrt(2 * v.meanDemand * ORDER_COST / v.holdingCost);
      var qLo = Math.max(40, Math.round(eoq * 0.7 / 10) * 10);
      var qHi = Math.round(eoq * 1.7 / 10) * 10;
      var muL = v.meanDemand * v.leadTime;
      var sdL = v.sdDemand * Math.sqrt(v.leadTime);
      var rLo = Math.max(0, Math.round((muL - 0.8 * sdL) / 10) * 10);
      var rHi = Math.round((muL + 2.2 * sdL) / 10) * 10;

      function lin(lo, hi, n) {
        var out = [];
        for (var i = 0; i < n; i++) out.push(Math.round((lo + (hi - lo) * i / (n - 1)) / 10) * 10);
        var uniq = out.filter(function (x, i2) { return out.indexOf(x) === i2; });
        return uniq;
      }
      var Qs = lin(qLo, qHi, 7);
      var Rs = lin(rLo, rHi, 7);
      var N = 7;

      function evaluate(Q, R) {
        var costs = [], fill = 0, cyc = 0, inv = 0;
        for (var s = 0; s < v.repeats; s++) {
          var sim = OR.inv.simulate({
            policy: 'QR', meanDemand: v.meanDemand, sdDemand: v.sdDemand, leadTime: v.leadTime,
            orderQty: Q, reorderPoint: R, periods: v.periods,
            initialInventory: R + Q, holdingCost: v.holdingCost, orderCost: ORDER_COST,
            shortageCost: v.shortageCost, unitCost: 0, seed: 9001 + s * 137
          });
          costs.push(sim.stats.totalCost);
          fill += sim.stats.fillRate;
          cyc += sim.stats.cycleServiceLevel;
          inv += sim.stats.avgInventory;
        }
        var st = OR.stats.statistics(costs);
        return {
          Q: Q, R: R, mean: st.mean, se: st.se, ci95: st.ci95,
          fillRate: fill / v.repeats, cycleSL: cyc / v.repeats, avgInv: inv / v.repeats
        };
      }

      var t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      var grid = [], flat = [];
      for (var qi = 0; qi < Qs.length; qi++) {
        var row = [];
        for (var ri = 0; ri < Rs.length; ri++) {
          var e = evaluate(Qs[qi], Rs[ri]);
          row.push(e.mean);
          flat.push(e);
        }
        grid.push(row);
      }
      var elapsed = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0);

      var best = flat.reduce(function (a, b) { return b.mean < a.mean ? b : a; });
      var worst = flat.reduce(function (a, b) { return b.mean > a.mean ? b : a; });

      var metrics = [
        { k: '最优订货批量 Q*', v: best.Q, unit: '件', tone: 'brand' },
        { k: '最优再订货点 R*', v: best.R, unit: '件', tone: 'teal' },
        { k: '最低总成本', v: fmt(best.mean, 0), unit: '元', tone: 'violet', hint: '每期约 ' + fmt(best.mean / v.periods, 1) + ' 元' },
        { k: '标准误', v: fmt(best.se, 1), unit: '元', tone: 'amber', hint: '95% CI ±' + fmt(best.se * 1.96, 0) + ' 元' },
        { k: '需求满足率', v: pct(best.fillRate, 1), unit: '%', tone: 'green', hint: '缺货比例 ' + pct(1 - best.fillRate, 1) + '%' },
        { k: '平均库存', v: fmt(best.avgInv, 0), unit: '件', tone: 'rose', hint: '含安全库存' }
      ];

      var blocks = [];
      blocks.push(B.metrics(metrics));

      /* --- 热力图 --- */
      blocks.push(B.card('成本曲面：Q × R 网格搜索结果', [
        B.chart('heatmap', {
          height: 40 + Qs.length * 38,
          rows: Qs.map(function (q) { return 'Q=' + q; }),
          cols: Rs.map(function (r) { return String(r); }),
          values: grid,
          hue: 'brand', padL: 66, digits: 0,
          title: '平均总成本（元）· 每点重复 ' + v.repeats + ' 次 · 共 ' + (Qs.length * Rs.length) + ' 个参数组合',
          highlight: function (i, j) { return Qs[i] === best.Q && Rs[j] === best.R; }
        }),
        B.html('<p class="small muted">颜色越深表示成本越低。注意最优点并不在最左上或最右下，而是位于一个<b>斜向的低谷</b>中——这说明 Q 与 R 相互影响：R 增大时，最优的 Q 也会随之改变。</p>')
      ], (elapsed / 1000).toFixed(2) + ' 秒内完成 ' + (Qs.length * Rs.length * v.repeats) + ' 次仿真', 'teal'));

      /* --- 两个切片 --- */
      var rowAtR = flat.filter(function (x) { return x.R === best.R; }).sort(function (a, b) { return a.Q - b.Q; });
      var colAtQ = flat.filter(function (x) { return x.Q === best.Q; }).sort(function (a, b) { return a.R - b.R; });
      blocks.push(B.card('沿最优点的两条切片', [
        B.chart('line', {
          height: 190, title: '固定 R* = ' + best.R + '，改变 Q',
          labels: rowAtR.map(function (x) { return String(x.Q); }),
          series: [{ label: '平均总成本', values: rowAtR.map(function (x) { return fmt(x.mean, 0); }), color: '#2b5cff', fill: true }],
          yLabel: '元', xLabel: 'Q'
        }),
        B.chart('line', {
          height: 190, title: '固定 Q* = ' + best.Q + '，改变 R',
          labels: colAtQ.map(function (x) { return String(x.R); }),
          series: [{ label: '平均总成本', values: colAtQ.map(function (x) { return fmt(x.mean, 0); }), color: '#6d4aff', fill: true }],
          yLabel: '元', xLabel: 'R'
        }),
        B.html('<p class="small muted">两条曲线都呈 U 形：Q 太小时订货频繁（订货成本高），太大时平均库存高（持有成本高）；R 太小时频繁缺货，太大时安全库存过高。两者的最优点必须<b>联合</b>确定。</p>')
      ], '一维切片让二维曲面的结构变得可读', 'violet'));

      /* --- 噪声诊断 --- */
      blocks.push(B.card('仿真噪声与重复次数', [
        B.table({
          head: ['参数组合', '(Q, R)', '平均成本', '标准误', '95% 置信区间', '满足率', '平均库存'],
          rows: [
            { e: best, tag: '最优' },
            { e: flat.filter(function (x) { return x.Q === best.Q && x.R === Rs[0]; })[0], tag: '同 Q 最低 R' },
            { e: flat.filter(function (x) { return x.Q === Qs[0] && x.R === best.R; })[0], tag: '同 R 最小 Q' }
          ].filter(function (x) { return x.e; }).map(function (x) {
            return [x.tag, '(' + x.e.Q + ', ' + x.e.R + ')', fmt(x.e.mean, 0),
              fmt(x.e.se, 1), '[' + fmt(x.e.ci95[0], 0) + ', ' + fmt(x.e.ci95[1], 0) + ']',
              pct(x.e.fillRate, 1) + '%', fmt(x.e.avgInv, 0)];
          })
        }),
        B.note('注意<b>标准误</b>：它衡量「如果重跑一次同样规模的仿真，均值可能偏离多少」。当两个方案的置信区间重叠时，它们的高低在统计上并不显著——此时增加重复次数（或使用共同随机数）比「盯着小数点后两位」更有意义。', 'amber'),
        B.html('<p class="small muted">当前每个参数点重复 <b>' + v.repeats + '</b> 次。把重复次数调到 1，观察最优点是否会发生跳动——这就是仿真噪声最直观的表现。</p>')
      ], '没有标准误的仿真结果，只是一个数字', 'amber'));

      /* --- 教学解读 --- */
      var insight = [];
      insight.push('最优参数为 <b>Q* = ' + best.Q + ' 件、R* = ' + best.R + ' 件</b>，平均总成本 <b>' + fmt(best.mean, 0) + ' 元</b>（每期约 ' + fmt(best.mean / v.periods, 1) + ' 元），需求满足率 ' + pct(best.fillRate, 1) + '%。');
      insight.push('参考解：EOQ ≈ √(2DS/H) = √(2×' + v.meanDemand + '×400/' + v.holdingCost + ') ≈ <b>' + fmt(eoq, 0) + '</b> 件，与网格搜索得到的最优 Q 处于同一量级——解析模型给出方向，仿真负责精细化。');
      insight.push('提前期需求 μ<sub>L</sub> = ' + v.meanDemand + '×' + v.leadTime + ' = <b>' + fmt(muL, 0) + '</b> 件，σ<sub>L</sub> = ' + v.sdDemand + '×√' + v.leadTime + ' = <b>' + fmt(sdL, 1) + '</b> 件。最优 R* (' + best.R + ') 明显高于 μ<sub>L</sub>，高出的部分就是<b>安全库存</b> ≈ ' + fmt(best.R - muL, 0) + ' 件。');
      insight.push('成本从最差的 <b>' + fmt(worst.mean, 0) + '</b> 元降到最优的 <b>' + fmt(best.mean, 0) + '</b> 元，相差 ' + fmt(worst.mean / best.mean, 1) + ' 倍——这说明参数选择的价值远大于「再精确一位小数」的优化。');
      insight.push('方法论提醒：网格搜索的代价随参数维数指数增长（7×7 = 49 点，三维就是 343 点）。实践中应「先粗后细」：先用大网格定位低谷区域，再在局部加密。若两个方案的差异小于 2 倍标准误，就不应据此下结论。');

      blocks.push(B.card('教学解读', [B.list(insight)], '从一张热力图到一条可执行的补货规则', 'teal'));

      return {
        blocks: blocks,
        summary: '仿真优化：' + (Qs.length * Rs.length) + ' 个 (Q,R) 组合、每点 ' + v.repeats + ' 次重复，' + elapsed +
          ' ms。最优 Q*=' + best.Q + '、R*=' + best.R + '，平均总成本 ' + fmt(best.mean, 0) + ' 元，满足率 ' + pct(best.fillRate, 1) + '%。'
      };
    },
    problems: [
      {
        id: 'so-1', level: '概念', type: 'single',
        q: '在仿真优化中，为什么每个参数组合都要重复运行多次并取平均？',
        options: [
          '为了让程序运行得更久、结果更精确',
          '因为单次仿真的结果包含随机噪声，重复取平均可以降低估计的标准误',
          '因为仿真模型本身有 bug，需要多次运行才能修复',
          '因为每次运行会使用不同的参数值'
        ],
        answer: 1,
        explain: '仿真输出是随机变量，单次结果可能严重偏离期望值。重复 R 次后，均值的标准误为 s/√R——重复 4 次才能把噪声减半。不重复就直接比较单次结果，很容易被噪声误导。'
      },
      {
        id: 'so-2', level: '计算', type: 'number',
        q: '取默认参数（日均需求 180、标准差 45、提前期 3 天、持有成本 0.8 元/件·天、缺货成本 16 元/件、仿真 180 天、每点重复 3 次），网格搜索得到的最优再订货点 R* 约为多少件？',
        answer: 620, tolerance: 30,
        explain: '网格以提前期需求为中心生成：μL = 540、σL = 45√3 ≈ 77.9，R 从 480 到 710 取 7 个点。仿真结果显示成本最低点位于 R ≈ 600~640 区间，其高出的部分即为安全库存（约 80 件）。实际数值会随网格与重复次数略有波动。'
      },
      {
        id: 'so-3', level: '概念', type: 'single',
        q: '「共同随机数（CRN）」在仿真优化中的作用是：',
        options: [
          '让所有参数组合使用完全相同的随机数种子，从而消除仿真中的随机性',
          '让不同参数方案面对同一组随机情景，降低方案间差值的方差，使比较更灵敏',
          '把随机需求替换为确定性需求，从而得到解析解',
          '减少仿真所需的期数'
        ],
        answer: 1,
        explain: 'CRN 并不消除随机性，而是让各方案「同甘共苦」：需求高的情景对所有方案都高。这样方案差值的方差 = Var(A) + Var(B) − 2Cov(A,B)，协方差项越大，比较越精确。它属于方差缩减技术。'
      },
      {
        id: 'so-4', level: '概念', type: 'single',
        q: '关于 Q 与 R 的关系，下列说法正确的是：',
        options: [
          'Q 与 R 可以完全独立地分别优化，先定谁都一样',
          'Q 与 R 存在交互作用，最优点必须联合搜索（或迭代求解）',
          'R 只影响缺货，Q 只影响持有成本，两者互不影响',
          '只要 R 足够大，Q 取任何值都不影响总成本'
        ],
        answer: 1,
        explain: 'Q 决定了补货的「粒度」与订货频率，R 决定了「何时触发」。Q 变大意味着每次补得更多、周期更长，相应的 R 也要调整。热力图上斜向的低谷正是这种交互作用的可视化。'
      },
      {
        id: 'so-5', level: '建模', type: 'text',
        q: '如果要把这个二维网格搜索扩展到「三类商品各自设定 (Q, R)」的联合优化，网格点数会发生什么变化？你会如何设计一个更高效的搜索策略？',
        reference: '规模变化：若每类商品在 Q 与 R 上各有 7 个候选值，单商品的组合数为 49；三类商品联合则有 49³ ≈ 1.18×10⁵ 个组合，再乘以每点重复次数，计算量将增长三个数量级——这就是维数灾难。\n更高效的策略：①坐标轮换（依次优化每一类商品，固定其余，迭代至收敛）；②先粗后细的两阶段网格（粗网格定位区域，再在局部加密）；③利用商品间的独立性——若三类商品共享同一补货预算则必须联合，若相互独立则可分别优化后合并；④用响应面法（二次回归）拟合成本曲面，在拟合面上解析地求最优；⑤用共同随机数降低比较噪声，从而减少每个点的重复次数；⑥若目标函数可微（或可估计梯度），可用随机近似（SPSA、Kiefer-Wolfowitz）替代网格。',
        explain: '这道题的核心是「维数灾难」与「分解」两种思路的对抗：能分解就分解（独立商品分别优化），不能分解就用更聪明的搜索（坐标轮换、响应面、梯度法）。网格搜索永远只是 baseline，不是终点。'
      }
    ]
  });

  /* 选址方案地图 */
  function siteSVG(FAC, CUS, open, best, v) {
    var W = 800, H = 580;
    var s = [];
    function openFlag(j) { return open.indexOf(j) >= 0; }
    s.push('<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:inherit">');
    s.push('<defs><marker id="st-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">' +
      '<path d="M 0 0 L 10 5 L 0 10 z" fill="#e11d48"/></marker></defs>');
    s.push('<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#fbfcfe" rx="10"/>');
    for (var gx = 100; gx < W; gx += 100) {
      s.push('<line x1="' + gx + '" y1="0" x2="' + gx + '" y2="' + H + '" stroke="#eef2f8" stroke-width="1"/>');
    }
    for (var gy = 100; gy < H; gy += 100) {
      s.push('<line x1="0" y1="' + gy + '" x2="' + W + '" y2="' + gy + '" stroke="#eef2f8" stroke-width="1"/>');
    }

    /* 配送关系 */
    best.assign.forEach(function (a) {
      var c = CUS[a.customer], f = FAC[a.facility];
      s.push('<line x1="' + c.x + '" y1="' + c.y + '" x2="' + f.x + '" y2="' + f.y +
        '" stroke="#e11d48" stroke-width="1.5" opacity=".45" stroke-dasharray="5 4" marker-end="url(#st-arrow)"/>');
    });

    /* 候选设施 */
    FAC.forEach(function (f, j) {
      var on = openFlag(j);
      var size = 15;
      s.push('<rect x="' + (f.x - size) + '" y="' + (f.y - size) + '" width="' + size * 2 + '" height="' + size * 2 +
        '" rx="5" fill="' + (on ? '#f59e0b' : '#ffffff') + '" stroke="' + (on ? '#b45309' : '#94a3b8') +
        '" stroke-width="' + (on ? 2 : 1.4) + '"' + (on ? '' : ' stroke-dasharray="4 3"') + '/>');
      s.push('<text x="' + f.x + '" y="' + (f.y + 4) + '" font-size="11" font-weight="700" text-anchor="middle" fill="' +
        (on ? '#ffffff' : '#64748b') + '">' + f.id + '</text>');
      s.push('<text x="' + f.x + '" y="' + (f.y + size + 14) + '" font-size="9.5" text-anchor="middle" fill="#64748b">' +
        '容量 ' + f.cap + (on ? '｜建' : '') + '</text>');
    });

    /* 需求城市 */
    CUS.forEach(function (c) {
      var r = 7 + c.d / 22;
      s.push('<circle cx="' + c.x + '" cy="' + c.y + '" r="' + r + '" fill="#2b5cff" opacity=".18"/>');
      s.push('<circle cx="' + c.x + '" cy="' + c.y + '" r="' + (r * 0.48) + '" fill="#2b5cff"/>');
      s.push('<text x="' + c.x + '" y="' + (c.y - r - 5) + '" font-size="9.5" font-weight="600" text-anchor="middle" fill="#1e293b">' +
        c.id + ' (' + c.d + ')</text>');
    });

    s.push('<text x="14" y="22" font-size="10.5" fill="#94a3b8">区域配送网络示意 · 单位运价 ' + v.freight + ' 元/件·km</text>');
    s.push('</svg>');
    return s.join('');
  }
})(typeof window !== 'undefined' ? window : globalThis);
