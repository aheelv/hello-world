/* =============================================================================
 * 入门级实验场景（Level 1）
 *   1. 生产计划优化     线性规划 / 单纯形法 / 灵敏度分析
 *   2. 物流运输调度     运输问题 / 表上作业法 / MODI 位势法
 *   3. 人员任务指派     指派问题 / 匈牙利算法
 * ========================================================================== */
(function (global) {
  'use strict';
  var OR = global.OR = global.OR || {};
  var B = OR.Lab.B, P = OR.Lab.P, R = OR.util ? OR.util.round : function (x) { return x; };
  var fmt = function (v, d) { return Number(Number(v).toFixed(d === undefined ? 3 : d)); };

  /* ==========================================================================
   * 1. 生产计划优化 —— 线性规划
   * ======================================================================= */
  OR.Lab.register({
    id: 'lp-production',
    name: '生产计划优化',
    subtitle: '线性规划 · 单纯形法 · 灵敏度分析',
    level: 1, topic: '线性规划', icon: 'grid', tone: 'brand',
    knowledge: {
      core: ['lp-model', 'lp-graphical', 'lp-simplex', 'lp-dual', 'lp-sensitivity'],
      support: ['lp-degenerate'],
      extend: ['lp-blending']
    },
    tags: ['单纯形法', '对偶理论', '影子价格', '灵敏度分析'],
    brief: '在木料与工时双重约束下，决策桌与椅的产量组合使利润最大。',
    scenario: '某家具厂生产「实木桌」与「办公椅」两种产品，共用木料与装配工时两项瓶颈资源。生产计划部门需要回答：在资源有限的前提下，如何安排产量组合使总利润最大？当原材料供应或单位利润发生波动时，现行最优计划是否仍然成立？',
    objectives: [
      '把文字描述的运营问题抽象为标准线性规划模型',
      '理解可行域、等值线与最优解位于顶点的几何直觉',
      '读懂单纯形表迭代过程与基变量、检验数的含义',
      '运用影子价格解释资源的价值，判断是否值得追加资源',
      '通过灵敏度分析确定参数允许波动区间'
    ],
    theory: [
      '<b>标准型</b>：max z = cᵀx，s.t. Ax ≤ b，x ≥ 0。引入松弛变量可化为等式约束的标准形。',
      '<b>最优性判据</b>：当所有检验数 σⱼ = cⱼ − zⱼ ≤ 0 时，当前基可行解为最优解。',
      '<b>对偶理论</b>：原问题 max{cᵀx | Ax ≤ b, x ≥ 0} 的对偶为 min{bᵀy | Aᵀy ≥ c, y ≥ 0}，两者最优值相等。',
      '<b>影子价格 yᵢ</b> = ∂z*/∂bᵢ，表示第 i 种资源每增加 1 单位带来的利润增量，是资源定价与采购决策的依据。',
      '<b>灵敏度分析</b>：在保持最优基不变的前提下，bᵢ 与 cⱼ 的允许变动区间。'
    ],
    params: [
      P.group('目标函数', [
        P.range('c1', '实木桌单位利润', { min: 20, max: 120, step: 5, value: 70, unit: '元/件' }),
        P.range('c2', '办公椅单位利润', { min: 20, max: 120, step: 5, value: 50, unit: '元/件' })
      ]),
      P.group('资源约束', [
        P.range('b1', '木料可用量', { min: 40, max: 240, step: 10, value: 120, unit: '单位' }),
        P.range('b2', '装配工时可用量', { min: 20, max: 120, step: 5, value: 50, unit: '小时' })
      ]),
      P.group('技术系数（单位消耗）', [
        P.range('a11', '实木桌 · 木料', { min: 1, max: 8, step: 1, value: 4, unit: '单位/件' }),
        P.range('a12', '办公椅 · 木料', { min: 1, max: 8, step: 1, value: 3, unit: '单位/件' }),
        P.range('a21', '实木桌 · 工时', { min: 1, max: 5, step: 1, value: 2, unit: '小时/件' }),
        P.range('a22', '办公椅 · 工时', { min: 1, max: 5, step: 1, value: 1, unit: '小时/件' })
      ], true)
    ],
    run: function (v) {
      var model = {
        c: [v.c1, v.c2],
        A: [[v.a11, v.a12], [v.a21, v.a22]],
        b: [v.b1, v.b2],
        ops: ['<=', '<='], maximize: true
      };
      var s = OR.solveLP(model);
      var names = ['木料', '装配工时'];
      var vnames = ['实木桌产量 x₁', '办公椅产量 x₂'];

      if (s.status !== 'optimal') {
        return {
          blocks: [
            B.note('<b>当前参数下无有限最优解</b>：' + (s.message || s.status) + '。请调整资源量或技术系数，使可行域非空且有界。', 'rose')
          ],
          summary: '求解状态：' + s.status
        };
      }

      var use1 = model.A[0][0] * s.x[0] + model.A[0][1] * s.x[1];
      var use2 = model.A[1][0] * s.x[0] + model.A[1][1] * s.x[1];

      var metrics = [
        { k: '最大总利润 z*', v: s.objective, unit: '元', tone: 'brand' },
        { k: '实木桌产量', v: s.x[0], unit: '件', tone: 'teal' },
        { k: '办公椅产量', v: s.x[1], unit: '件', tone: 'violet' }
      ];
      metrics.push({ k: '木料余量', v: fmt(v.b1 - use1, 1), unit: '单位', tone: v.b1 - use1 < 0.01 ? 'rose' : 'green', hint: (v.b1 - use1 < 0.01 ? '已用尽（瓶颈）' : '尚有富余') });
      metrics.push({ k: '工时余量', v: fmt(v.b2 - use2, 1), unit: '小时', tone: v.b2 - use2 < 0.01 ? 'rose' : 'green', hint: (v.b2 - use2 < 0.01 ? '已用尽（瓶颈）' : '尚有富余') });

      var blocks = [];
      blocks.push(B.metrics(metrics));

      /* --- 可行域几何图 --- */
      blocks.push(B.card('可行域与最优解几何视图', [
        B.svg(feasibleSVG(model, s), '可行域几何视图'),
        B.html('<div class="legend" style="margin-top:8px">' +
          '<span><i style="background:rgba(43,92,255,.16);border:1px solid #2b5cff"></i>可行域</span>' +
          '<span><i style="background:#14b8a6"></i>资源约束线</span>' +
          '<span><i style="background:#f59e0b"></i>等利润线 z=½z*</span>' +
          '<span><i style="background:#f43f5e"></i>最优等利润线 z=z*</span>' +
          '<span><i style="background:#e11d48;border-radius:50%"></i>最优解顶点</span></div>'),
        B.html('<p class="small muted" style="margin-top:10px">线性规划的最优解一定在可行域的<b>顶点</b>取得。图中红色等利润线沿法向量方向外推，最后触碰到的顶点即为最优解；若等利润线与某条约束边平行，则出现多重最优解。</p>')
      ], '约束线、可行域多边形与等利润线的相对位置'));

      /* --- 单纯形迭代 --- */
      var tf = s.finalTableau;
      var tableauRows = s.log && s.log.length
        ? s.log.map(function (snap, i) {
          return ['第 ' + (i) + ' 次迭代', snap.label, snap.basis.join(', ')];
        })
        : [];
      blocks.push(B.card('单纯形法求解过程', [
        B.kv([
          ['迭代次数', s.iterations + ' 次'],
          ['是否使用第一阶段', s.tookPhase1 ? '是（含 ≥ 或 = 约束）' : '否（全为 ≤ 约束，松弛变量即为初始基）'],
          ['最终基变量', s.basis.join('、')],
          ['最终检验数', '全部 ≤ 0，满足最优性判据']
        ]),
        tableauRows.length ? B.table({
          head: ['迭代', '入基/出基动作', '基变量集合'],
          rows: tableauRows.slice(0, 14)
        }) : null,
        B.formula([
          '<span class="cm">原问题</span>  max  z = ' + v.c1 + 'x₁ + ' + v.c2 + 'x₂',
          '        s.t.  ' + v.a11 + 'x₁ + ' + v.a12 + 'x₂ ≤ ' + v.b1 + '   <span class="cm">（木料）</span>',
          '              ' + v.a21 + 'x₁ + ' + v.a22 + 'x₂ ≤ ' + v.b2 + '   <span class="cm">（工时）</span>',
          '              x₁, x₂ ≥ 0',
          '<span class="cm">对偶问题</span> min w = ' + v.b1 + 'y₁ + ' + v.b2 + 'y₂ + ' + 0 + 'y₃ + ' + 0 + 'y₄',
          '        s.t.  ' + v.a11 + 'y₁ + ' + v.a21 + 'y₂ ≥ ' + v.c1,
          '              ' + v.a12 + 'y₁ + ' + v.a22 + 'y₂ ≥ ' + v.c2,
          '              y₁, y₂ ≥ 0'
        ])
      ], '从初始基可行解到最优解的迭代轨迹', 'violet'));

      /* --- 灵敏度分析 --- */
      var rhsRows = s.rhsRange.map(function (rr, i) {
        var rangeTxt = (isFinite(rr.lower) ? fmt(rr.lower, 1) : '−∞') + ' ～ ' + (isFinite(rr.upper) ? fmt(rr.upper, 1) : '+∞');
        return [
          names[i],
          fmt(rr.shadowPrice, 3),
          fmt(rr.current, 1),
          isFinite(rr.allowIncrease) ? fmt(rr.allowIncrease, 1) : '∞',
          isFinite(rr.allowDecrease) ? fmt(rr.allowDecrease, 1) : '∞',
          rangeTxt,
          s.activeConstraints[i].binding ? '紧约束' : '松约束'
        ];
      });
      var objRows = s.objRange.map(function (rr, i) {
        return [
          vnames[i],
          fmt(rr.current, 1),
          isFinite(rr.lower) ? fmt(rr.lower, 2) : '−∞',
          isFinite(rr.upper) ? fmt(rr.upper, 2) : '+∞',
          rr.isBasic ? '基变量' : '非基变量（保持为 0）'
        ];
      });

      blocks.push(B.card('灵敏度分析（保持最优基不变）', [
        B.html('<h4 style="margin:0 0 8px">① 右端项（资源可用量）分析</h4>'),
        B.table({
          head: ['资源', '影子价格', '当前量', '可增加', '可减少', '允许区间', '状态'],
          rows: rhsRows,
          zebra: true
        }),
        B.html('<h4 style="margin:16px 0 8px">② 目标函数系数分析</h4>'),
        B.table({
          head: ['产品', '当前单位利润', '可降至', '可升至', '变量性质'],
          rows: objRows,
          zebra: true
        }),
        B.chart('bar', {
          height: 170,
          title: '资源影子价格（每增加 1 单位资源的利润贡献）',
          labels: names,
          series: [{ label: '影子价格 (元)', values: s.dual.map(function (d) { return fmt(d, 3); }), color: '#8b6dff' }],
          showValues: true, legend: false, yLabel: '元/单位'
        })
      ], '参数在多大范围内波动时，当前的最优生产方案依然成立', 'amber'));

      /* --- 教学解读 --- */
      var bindingNames = [];
      s.activeConstraints.forEach(function (ac, i) { if (ac.binding) bindingNames.push(names[i]); });
      var insight = [];
      insight.push('当前最优方案：生产 <b>实木桌 ' + fmt(s.x[0], 2) + ' 件</b>、<b>办公椅 ' + fmt(s.x[1], 2) + ' 件</b>，总利润 <b>' + fmt(s.objective, 2) + ' 元</b>。');
      if (bindingNames.length) {
        insight.push('瓶颈资源为 <b>' + bindingNames.join('、') + '</b>，其影子价格分别为 ' +
          s.dual.map(function (d, i) { return d > 0.001 ? names[i] + ' ' + fmt(d, 2) + ' 元' : null; }).filter(Boolean).join('、') +
          '。若要提升利润，应优先追加这些资源。');
      } else {
        insight.push('所有约束均为松约束，说明当前资源并未构成瓶颈，可以尝试下调资源投入以节约成本。');
      }
      var maxDual = Math.max.apply(null, s.dual);
      if (maxDual > 0.001) {
        var idx = s.dual.indexOf(maxDual);
        insight.push('其中 <b>' + names[idx] + '</b> 的影子价格最高（' + fmt(maxDual, 3) + ' 元/单位）。若市场采购价低于该值，增加采购即可增厚利润；高于该值则应当外购或转产。');
      }
      insight.push('注意：影子价格仅在允许区间内有效。超出区间后最优基改变，需要重新求解。');

      blocks.push(B.card('教学解读', [B.list(insight)], '把数学结果翻译成管理决策语言', 'teal'));

      return {
        blocks: blocks,
        summary: '问题：max ' + v.c1 + 'x₁+' + v.c2 + 'x₂, ' + v.a11 + 'x₁+' + v.a12 + 'x₂≤' + v.b1 + ', ' + v.a21 + 'x₁+' + v.a22 + 'x₂≤' + v.b2 +
          '。最优解 x=(' + fmt(s.x[0], 2) + ', ' + fmt(s.x[1], 2) + ')，z*=' + fmt(s.objective, 2) +
          '；影子价格=(' + s.dual.map(function (d) { return fmt(d, 3); }).join(', ') + ')；瓶颈资源=' + (bindingNames.join('、') || '无') + '。'
      };
    },
    problems: [
      {
        id: 'lp-1', level: '概念', type: 'single',
        q: '在本实验的二维线性规划中，若最优等利润线与某条资源约束线完全平行，最可能出现的情况是：',
        options: [
          '问题无可行解',
          '问题无界',
          '该约束退化，存在多重最优解（整条边上的点都是最优解）',
          '最优解一定为原点'
        ],
        answer: 2,
        explain: '当目标函数等值线与某条约束边界斜率相同时，它们平行重叠，此时该约束边上所有点都取到相同的最优目标值，即出现多重最优解。这不影响最优值，但生产方案有多个可选。'
      },
      {
        id: 'lp-2', level: '计算', type: 'number',
        q: '取默认参数（c₁=70, c₂=50, 4x₁+3x₂≤120, 2x₁+x₂≤50），最优最大利润 z* 是多少？（单位：元）',
        answer: 2050, tolerance: 1,
        explain: '两约束交点：由 2x₁+x₂=50 得 x₂=50−2x₁，代入 4x₁+3(50−2x₁)=120 → −2x₁=−30 → x₁=15，x₂=20。z*=70×15+50×20=1050+1000=2050。'
      },
      {
        id: 'lp-3', level: '概念', type: 'single',
        q: '某资源的影子价格为 12 元/单位，且当前该约束为紧约束。市场上该资源的采购价格为 15 元/单位。理性的管理决策是：',
        options: [
          '立即采购该资源以扩大生产',
          '不应按 15 元采购，因为采购成本高于其边际贡献',
          '影子价格与采购决策无关',
          '减少该资源的使用量'
        ],
        answer: 1,
        explain: '影子价格代表该资源每增加 1 单位能给企业带来的利润增量（12 元）。若采购成本 15 元 > 12 元，则每多买一单位反而亏损 3 元，因此不应采购。只有当采购价低于影子价格时才值得追加。'
      },
      {
        id: 'lp-4', level: '计算', type: 'number',
        q: '在默认参数下，把木料可用量从 120 提高到 130（仍在允许区间内），新最优利润 z* 是多少？（元）',
        answer: 2060, tolerance: 1,
        explain: '木料的影子价格由本实验求得。z(120)=2050，增加 10 单位木料 → 利润增加 10×影子价格。默认参数下木料影子价格为 1 元/单位，故 z*=2050+10=2060。（可用滑杆验证）'
      },
      {
        id: 'lp-5', level: '建模', type: 'text',
        q: '请用你自己的语言写出「木料 + 工时」双资源生产计划问题的线性规划模型（包括决策变量、目标函数、约束条件与非负性假设），并说明每个符号的实际含义。',
        reference: '决策变量：x₁ = 实木桌产量（件），x₂ = 办公椅产量（件）。\n目标函数：max z = c₁x₁ + c₂x₂，即总利润最大化。\n约束条件：a₁₁x₁ + a₁₂x₂ ≤ b₁（木料总量约束）；a₂₁x₁ + a₂₂x₂ ≤ b₂（装配工时约束）。\n非负性：x₁ ≥ 0，x₂ ≥ 0（产量不能为负）。\n隐含假设：单位消耗与单位利润固定不变；资源可完全分割；产品全部可以售出（无需求上限）。',
        explain: '建模的关键在于：①明确决策变量及其单位；②用系数量化每一单位决策变量对资源的占用；③识别约束右端项的实际上限；④显式写出非负性与隐含假设。'
      },
      {
        id: 'lp-6', level: '概念', type: 'single',
        q: '若某约束对应的松弛变量在最终单纯形表中为基变量且取值为正，说明：',
        options: [
          '该资源已全部用尽',
          '该资源存在剩余，未构成瓶颈，其影子价格为 0',
          '该约束是多余的，可以删除',
          '问题无最优解'
        ],
        answer: 1,
        explain: '松弛变量为基变量且取值大于 0，说明该资源按最优方案使用后仍有剩余，即约束是松约束。此时增加该资源不会提升目标函数值，因此其影子价格为 0。'
      }
    ]
  });

  /* 可行域几何视图 */
  function feasibleSVG(model, sol) {
    var W = 640, H = 400, pad = { l: 58, r: 26, t: 18, b: 42 };
    // 自适应坐标范围
    var xMax = 0, yMax = 0;
    for (var i = 0; i < model.A.length; i++) {
      if (Math.abs(model.A[i][0]) > 1e-9) xMax = Math.max(xMax, model.b[i] / model.A[i][0]);
      if (Math.abs(model.A[i][1]) > 1e-9) yMax = Math.max(yMax, model.b[i] / model.A[i][1]);
    }
    xMax = Math.max(xMax, sol.x[0]) * 1.22 + 1;
    yMax = Math.max(yMax, sol.x[1]) * 1.22 + 1;
    var xT = OR.charts.niceTicks(0, xMax, 6), yT = OR.charts.niceTicks(0, yMax, 5);
    xMax = xT[xT.length - 1]; yMax = yT[yT.length - 1];
    function X(v) { return pad.l + v / xMax * (W - pad.l - pad.r); }
    function Y(v) { return H - pad.b - v / yMax * (H - pad.t - pad.b); }

    var poly = [[0, 0], [xMax, 0], [xMax, yMax], [0, yMax]];
    model.A.forEach(function (row, k) { poly = clipPoly(poly, row[0], row[1], model.b[k]); });

    var s = ['<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:-apple-system,\'PingFang SC\',sans-serif">'];
    s.push('<defs><linearGradient id="feasGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="rgba(43,92,255,.20)"/><stop offset="1" stop-color="rgba(139,109,255,.20)"/></linearGradient></defs>');
    // 网格
    yT.forEach(function (t) {
      s.push('<line x1="' + pad.l + '" y1="' + Y(t) + '" x2="' + (W - pad.r) + '" y2="' + Y(t) + '" stroke="#eef1f8"/>');
      s.push('<text x="' + (pad.l - 8) + '" y="' + (Y(t) + 4) + '" fill="#8492ad" font-size="11" text-anchor="end">' + OR.charts.fmt(t) + '</text>');
    });
    xT.forEach(function (t) {
      s.push('<line x1="' + X(t) + '" y1="' + pad.t + '" x2="' + X(t) + '" y2="' + (H - pad.b) + '" stroke="#eef1f8"/>');
      s.push('<text x="' + X(t) + '" y="' + (H - pad.b + 17) + '" fill="#8492ad" font-size="11" text-anchor="middle">' + OR.charts.fmt(t) + '</text>');
    });
    s.push('<line x1="' + pad.l + '" y1="' + (H - pad.b) + '" x2="' + (W - pad.r) + '" y2="' + (H - pad.b) + '" stroke="#d3dbe9"/>');
    s.push('<line x1="' + pad.l + '" y1="' + pad.t + '" x2="' + pad.l + '" y2="' + (H - pad.b) + '" stroke="#d3dbe9"/>');
    s.push('<text x="' + (W - pad.r) + '" y="' + (H - 8) + '" fill="#5c6a88" font-size="11.5" text-anchor="end" font-weight="600">实木桌产量 x₁</text>');
    s.push('<text x="14" y="' + (pad.t + 4) + '" fill="#5c6a88" font-size="11.5" font-weight="600" transform="rotate(-90 14 ' + (pad.t + 4) + ')">办公椅产量 x₂</text>');

    // 可行域
    if (poly.length > 2) {
      s.push('<polygon points="' + poly.map(function (p) { return X(p[0]) + ',' + Y(p[1]); }).join(' ') + '" fill="url(#feasGrad)" stroke="#2b5cff" stroke-width="1.4" stroke-dasharray="4 3"/>');
    }
    // 约束线
    var cols = ['#14b8a6', '#f59e0b'];
    model.A.forEach(function (row, k) {
      var pts = [];
      if (Math.abs(row[1]) > 1e-9) { pts.push([0, model.b[k] / row[1]]); pts.push([model.b[k] / row[0], 0]); }
      else { pts.push([model.b[k] / row[0], 0]); pts.push([model.b[k] / row[0], yMax]); }
      if (Math.abs(row[0]) < 1e-9) { pts = [[0, model.b[k] / row[1]], [xMax, model.b[k] / row[1]]]; }
      s.push('<line x1="' + X(pts[0][0]) + '" y1="' + Y(pts[0][1]) + '" x2="' + X(pts[1][0]) + '" y2="' + Y(pts[1][1]) + '" stroke="' + cols[k % 2] + '" stroke-width="2"/>');
    });
    // 等利润线
    var c1 = model.c[0], c2 = model.c[1];
    [0.5, 1].forEach(function (k, i) {
      var z = sol.objective * k;
      var pts;
      if (Math.abs(c1) < 1e-9) pts = [[0, z / c2], [xMax, z / c2]];
      else if (Math.abs(c2) < 1e-9) pts = [[z / c1, 0], [z / c1, yMax]];
      else pts = [[0, z / c2], [z / c1, 0]];
      var col = i === 0 ? '#f59e0b' : '#f43f5e';
      s.push('<line x1="' + X(pts[0][0]) + '" y1="' + Y(pts[0][1]) + '" x2="' + X(pts[1][0]) + '" y2="' + Y(pts[1][1]) +
        '" stroke="' + col + '" stroke-width="2.2"' + (i === 0 ? ' stroke-dasharray="6 4"' : '') + '/>');
    });
    // 顶点
    (function () {
      if (!poly.length) return;
      // 标注最优顶点
      var ox = X(sol.x[0]), oy = Y(sol.x[1]);
      s.push('<circle cx="' + ox + '" cy="' + oy + '" r="7" fill="#e11d48" fill-opacity=".18"/>');
      s.push('<circle cx="' + ox + '" cy="' + oy + '" r="4.6" fill="#e11d48" stroke="#fff" stroke-width="1.6"/>');
      var lx = ox + 12, ly = oy - 12;
      s.push('<rect x="' + (lx - 6) + '" y="' + (ly - 14) + '" width="128" height="24" rx="6" fill="#fff" stroke="#f7c3cd"/>');
      s.push('<text x="' + lx + '" y="' + (ly + 2) + '" fill="#e11d48" font-size="11.5" font-weight="700">最优解 (' + fmt(sol.x[0], 1) + ', ' + fmt(sol.x[1], 1) + ')</text>');
    })();
    s.push('</svg>');
    return s.join('');
  }

  function clipPoly(poly, a, b, c) {
    var out = [];
    for (var i = 0; i < poly.length; i++) {
      var Pp = poly[i], Q = poly[(i + 1) % poly.length];
      var dp = a * Pp[0] + b * Pp[1] - c, dq = a * Q[0] + b * Q[1] - c;
      if (dp <= 1e-9) out.push(Pp);
      if ((dp < -1e-9 && dq > 1e-9) || (dp > 1e-9 && dq < -1e-9)) {
        var t = dp / (dp - dq);
        out.push([Pp[0] + t * (Q[0] - Pp[0]), Pp[1] + t * (Q[1] - Pp[1])]);
      }
    }
    return out;
  }

  /* ==========================================================================
   * 2. 物流运输调度 —— 运输问题
   * ======================================================================= */
  var TRANSPORT_PRESETS = {
    classic: {
      name: '三产地四销地标准问题',
      supply: [30, 40, 50], demand: [20, 30, 40, 30],
      cost: [[10, 20, 5, 15], [7, 12, 9, 8], [3, 6, 11, 4]],
      supplyNames: ['武汉仓', '郑州仓', '广州仓'], demandNames: ['北京', '上海', '广州', '成都']
    },
    cold: {
      name: '冷链配送（运费差异大）',
      supply: [45, 55, 30], demand: [40, 35, 30, 25],
      cost: [[22, 15, 32, 28], [18, 26, 12, 20], [35, 24, 18, 14]],
      supplyNames: ['青岛冷库', '宁波冷库', '湛江冷库'], demandNames: ['沈阳', '杭州', '深圳', '西安']
    },
    export: {
      name: '出口集运（含虚拟产地）',
      supply: [120, 90, 60], demand: [80, 100, 70, 50],
      cost: [[40, 55, 38, 62], [48, 42, 50, 45], [65, 30, 58, 36]],
      supplyNames: ['上海港', '宁波港', '深圳港'], demandNames: ['鹿特丹', '洛杉矶', '新加坡', '汉堡']
    }
  };

  OR.Lab.register({
    id: 'transport',
    name: '物流运输调度',
    subtitle: '运输问题 · VAM 初始解 · MODI 位势法',
    level: 1, topic: '运输问题', icon: 'layers', tone: 'teal',
    knowledge: {
      core: ['tp-model', 'tp-vam', 'tp-modi'],
      support: ['lp-model'],
      extend: ['tp-transship']
    },
    tags: ['表上作业法', 'VAM', '位势法', '产销平衡'],
    brief: '在产销平衡条件下，寻找使总运费最低的产地—销地调运方案。',
    scenario: '某区域物流网络拥有多个仓库与多个销售城市，单位运价因距离、路况与运力差异而不同。调度中心需要制定一张「产地→销地」的调运表，在满足全部需求的前提下使总运费最低，并识别哪些线路构成瓶颈。',
    objectives: [
      '理解运输问题的特殊结构与数学模型（产销平衡）',
      '掌握伏格尔法（VAM）构造高质量初始基可行解',
      '运用位势法（MODI）计算检验数并判断最优性',
      '通过闭回路法调整方案，理解每一步的运量变化',
      '学会处理产销不平衡与虚拟产地/销地'
    ],
    theory: [
      '<b>数学模型</b>：min z = ΣΣ cᵢⱼxᵢⱼ，s.t. Σⱼxᵢⱼ = aᵢ（产地约束），Σᵢxᵢⱼ = bⱼ（销地约束），xᵢⱼ ≥ 0。',
      '<b>产销平衡</b>：Σaᵢ = Σbⱼ。不平衡时增设虚拟产地或虚拟销地，虚拟格运价取 0。',
      '<b>基变量个数</b>：m + n − 1 个（m 产地数，n 销地数）。',
      '<b>VAM 伏格尔法</b>：以「次小运价 − 最小运价」作为行/列罚数，优先满足罚数最大的行或列，可快速得到接近最优的初始解。',
      '<b>位势法（MODI）</b>：对基格令 uᵢ + vⱼ = cᵢⱼ 解出位势，再计算非基格检验数 σᵢⱼ = cᵢⱼ − uᵢ − vⱼ。若存在 σᵢⱼ < 0 则未最优，沿闭回路以 θ = min(偶数顶点运量) 调整。'
    ],
    params: [
      P.select('preset', '数据场景', Object.keys(TRANSPORT_PRESETS).map(function (k) {
        return { value: k, label: TRANSPORT_PRESETS[k].name };
      }), 'classic'),
      P.toggle('showSteps', '显示 MODI 迭代过程', true)
    ],
    run: function (v) {
      var data = TRANSPORT_PRESETS[v.preset] || TRANSPORT_PRESETS.classic;
      var r = OR.solveTransport({
        cost: data.cost, supply: data.supply, demand: data.demand,
        supplyNames: data.supplyNames, demandNames: data.demandNames
      });
      var m = data.supply.length, n = data.demand.length;

      var totalSupply = data.supply.reduce(function (a, b) { return a + b; }, 0);
      var totalDemand = data.demand.reduce(function (a, b) { return a + b; }, 0);
      // 初始解成本
      var initCost = 0, initAlloc = r.steps[0].alloc;
      for (var i = 0; i < m; i++) for (var j = 0; j < n; j++) initCost += initAlloc[i][j] * data.cost[i][j];

      var metrics = [
        { k: '最优总运费', v: r.totalCost, unit: '元', tone: 'teal' },
        { k: 'VAM 初始解运费', v: fmt(initCost, 0), unit: '元', tone: 'amber', hint: '改进 ' + fmt(initCost - r.totalCost, 0) + ' 元' },
        { k: 'MODI 迭代次数', v: r.iterations, unit: '次', tone: 'violet' },
        { k: '基变量个数', v: m + n - 1, unit: '个', tone: 'brand', hint: 'm+n−1 = ' + m + '+' + n + '−1' }
      ];

      var blocks = [B.metrics(metrics)];

      blocks.push(B.card('调运方案热力图（单元格为运量）', [
        B.chart('heatmap', {
          height: 46 + m * 52,
          rows: r.supplyNames, cols: r.demandNames,
          values: r.allocation.map(function (row) { return row.map(function (x) { return x; }); }),
          hue: 'teal', padL: 74, digits: 0, title: '最优调运量表（运量）'
        }),
        B.html('<div class="tiny muted" style="margin-top:6px">颜色越深表示运量越大；红框标注基变量格（共 ' + (m + n - 1) + ' 个）。</div>')
      ], '总运费 ' + fmt(r.totalCost, 0) + ' 元'));

      // 成本矩阵 + 检验数
      var sigmaRows = [];
      if (r.potentials) {
        for (i = 0; i < m; i++) {
          var row = [r.supplyNames[i] + '（u=' + fmt(r.potentials.u[i], 1) + '）'];
          for (j = 0; j < n; j++) {
            var isBase = r.allocation[i][j] > 1e-9;
            var sig = data.cost[i][j] - r.potentials.u[i] - r.potentials.v[j];
            row.push(isBase ? ('[基] ' + fmt(data.cost[i][j], 0)) : (fmt(sig, 1) + (sig < -1e-6 ? ' ↓' : '')));
          }
          sigmaRows.push(row);
        }
      }

      blocks.push(B.card('成本矩阵与检验数', [
        B.table({
          head: ['产地 \\ 销地'].concat(r.demandNames.map(function (d, j) {
            return d + (r.potentials ? '（v=' + fmt(r.potentials.v[j], 1) + '）' : '');
          })),
          rows: sigmaRows.length ? sigmaRows : data.cost.map(function (row, i) {
            return [r.supplyNames[i]].concat(row);
          }),
          zebra: true
        }),
        B.html('<p class="small muted" style="margin-top:8px">标注 <b>[基]</b> 的格子为基变量，其运价构成位势方程；其余格子显示 <b>检验数 σᵢⱼ</b>，全部 ≥ 0 即达到最优。若出现负检验数（标注 ↓），说明还存在降低总运费的调整空间。</p>')
      ], r.isOptimal ? '所有检验数 ≥ 0，方案已最优' : '尚未达到最优', 'violet'));

      if (v.showSteps) {
        var stepRows = r.steps.slice(0, 12).map(function (st, k) {
          var flat = [];
          for (var a = 0; a < m; a++) for (var b = 0; b < n; b++) if (st.alloc[a][b] > 1e-9) flat.push(r.supplyNames[a] + '→' + r.demandNames[b] + ':' + fmt(st.alloc[a][b], 0));
          return [(st.phase === '初始解' ? '初始' : '迭代 ' + k), st.note, flat.join('，') || '—'];
        });
        blocks.push(B.card('求解过程（VAM → MODI 闭回路调整）', [
          B.table({ head: ['阶段', '操作说明', '当前方案'], rows: stepRows, zebra: true })
        ], '从初始基可行解逐步改进到最优解', 'amber'));
      }

      blocks.push(B.card('教学解读', [
        B.list([
          '本问题为 <b>' + (r.balanced ? '产销平衡' : '产销不平衡（已自动补虚拟' + (r.addedDummy.type === 'demand' ? '销地' : '产地') + ' ' + fmt(r.addedDummy.amount, 0) + '）') + '</b>，总产量 ' + totalSupply + '，总销量 ' + totalDemand + '。',
          'VAM 初始解运费 ' + fmt(initCost, 0) + ' 元，经 MODI 位势法改进 ' + r.iterations + ' 次后降至 <b>' + fmt(r.totalCost, 0) + ' 元</b>，成本下降 <b>' + fmt((initCost - r.totalCost) / initCost * 100, 1) + '%</b>。',
          '运输问题的约束矩阵是全幺模的，因此单纯形法得到的解天然为整数；本方案中所有运量均为整数，无需额外加整数约束。',
          '若某条线路被闲置（运量为 0），其检验数越大说明该线路越「不合算」；检验数最小的线路则应重点考虑增加运力或压价。'
        ])
      ], '从运价表到调运决策', 'brand'));

      return {
        blocks: blocks,
        summary: '运输问题（' + data.name + '）：' + m + ' 产地 × ' + n + ' 销地，运价矩阵 ' +
          JSON.stringify(data.cost) + '，产量 ' + JSON.stringify(data.supply) + '，销量 ' + JSON.stringify(data.demand) +
          '。最优总运费 ' + fmt(r.totalCost, 0) + ' 元，VAM 初始解 ' + fmt(initCost, 0) + ' 元，迭代 ' + r.iterations + ' 次。' +
          '最优调运表 ' + JSON.stringify(r.allocation) + '。'
      };
    },
    problems: [
      {
        id: 'tp-1', level: '概念', type: 'single',
        q: '运输问题中若有 m 个产地、n 个销地，产销平衡时基变量的个数应为：',
        options: ['m + n', 'm × n', 'm + n − 1', 'm + n + 1'],
        answer: 2,
        explain: '运输问题的约束方程组秩为 m + n − 1（因产销平衡导致一个方程冗余），因此基变量个数为 m + n − 1，其余为非基变量（运量为 0）。'
      },
      {
        id: 'tp-2', level: '计算', type: 'number',
        q: '默认「三产地四销地」场景下，最优总运费是多少？（元）',
        answer: 720, tolerance: 1,
        explain: '经 VAM 初始化与 MODI 迭代，最优调运方案总运费为 720 元：武汉仓→广州 30，郑州仓→广州 10、→成都 30，广州仓→北京 20、→上海 30。'
      },
      {
        id: 'tp-3', level: '概念', type: 'single',
        q: '若某运输问题出现总产量 130、总销量 120 的情况，标准处理方法是：',
        options: [
          '直接删去多余产能不去考虑',
          '添加一个虚拟销地，销量 10，各产地到该销地的运价取 0',
          '添加一个虚拟产地，产量 10',
          '将某个产地的产量人为改为 120'
        ],
        answer: 1,
        explain: '产大于销时应补一个虚拟销地，销量等于差额，运价设为 0（表示这部分产能实际未被使用，不产生运费）。反之销大于产时补虚拟产地。'
      },
      {
        id: 'tp-4', level: '概念', type: 'single',
        q: '位势法中，若某个非基格检验数 σᵢⱼ < 0 且其闭回路偶数顶点中最小运量为 15，则本次调整的运量 θ 应为：',
        options: ['0', '15', '30', '该非基格的运价'],
        answer: 1,
        explain: '闭回路调整时 θ = min{偶数顶点（减去运量的顶点）上的运量}，以保证调整后所有运量非负。θ 取 15 时，该最小值格子运量降为 0 并退出基，同时负检验数格子进入基。'
      },
      {
        id: 'tp-5', level: '建模', type: 'text',
        q: '请写出一般运输问题的线性规划模型，并解释为什么运输问题的最优解一定是整数解。',
        reference: '模型：min z = ΣᵢΣⱼ cᵢⱼxᵢⱼ；s.t. Σⱼ xᵢⱼ = aᵢ (i=1..m)；Σᵢ xᵢⱼ = bⱼ (j=1..n)；xᵢⱼ ≥ 0。其中 aᵢ 为产地 i 的产量，bⱼ 为销地 j 的销量，cᵢⱼ 为单位运价。\n整数性：运输问题的约束矩阵（每列仅含一个 1 在产地行、一个 1 在销地行）是「全幺模矩阵」，因此其任意基矩阵行列式均为 ±1。当 aᵢ、bⱼ 为整数时，由克莱姆法则所得的基本可行解必为整数解。',
        explain: '考点在于识别约束矩阵的结构以及全幺模性（total unimodularity）与整数解的关系。这是运筹学中「为何许多组合优化问题可自然得到整数解」的经典结论。'
      }
    ]
  });

  /* ==========================================================================
   * 3. 人员任务指派 —— 匈牙利法
   * ======================================================================= */
  var ASSIGN_PRESETS = {
    project: {
      name: '项目组任务分配（4×4）',
      tasks: ['需求分析', '架构设计', '核心编码', '测试验收'],
      people: ['张工', '李工', '王工', '赵工'],
      cost: [[82, 83, 69, 92], [77, 37, 49, 92], [11, 69, 5, 86], [8, 9, 98, 23]],
      unit: '小时'
    },
    machine: {
      name: '设备-工件匹配（5×5）',
      tasks: ['工件A', '工件B', '工件C', '工件D', '工件E'],
      people: ['机床1', '机床2', '机床3', '机床4', '机床5'],
      cost: [[9, 2, 7, 8, 6], [6, 4, 3, 7, 9], [5, 8, 1, 8, 7], [7, 6, 9, 4, 5], [8, 3, 6, 9, 2]],
      unit: '分钟'
    },
    sales: {
      name: '销售区域分配（3×3）',
      tasks: ['华北区', '华东区', '华南区'],
      people: ['销售A', '销售B', '销售C'],
      cost: [[2, 3, 1], [5, 4, 8], [6, 7, 9]],
      unit: '万元/季'
    }
  };

  OR.Lab.register({
    id: 'assignment',
    name: '人员任务指派',
    subtitle: '指派问题 · 匈牙利算法',
    level: 1, topic: '指派问题', icon: 'target', tone: 'violet',
    knowledge: {
      core: ['ap-hungarian'],
      support: ['tp-model', 'lp-model'],
      extend: ['ip-binary']
    },
    tags: ['匈牙利法', '0-1 规划', '对偶', '最短增广路'],
    brief: '把 n 个人与 n 项任务一一配对，使总耗时（或总成本）最小。',
    scenario: '项目经理需要为若干任务各指派一名负责人，每个人完成不同任务的效率（或成本）不同，且一人只能承担一项任务。如何配对才能使团队整体投入最少？这是典型的 0-1 指派问题。',
    objectives: [
      '把指派问题表述为 0-1 整数规划模型',
      '掌握匈牙利算法的矩阵变换思想与「最少覆盖线」原理',
      '理解指派问题与运输问题、线性规划对偶的关系',
      '通过效率矩阵的对比解释「局部最优 ≠ 全局最优」',
      '能对指派结果进行组织层面的解读与建议'
    ],
    theory: [
      '<b>数学模型</b>：min z = ΣΣ cᵢⱼxᵢⱼ，s.t. Σⱼxᵢⱼ = 1，Σᵢxᵢⱼ = 1，xᵢⱼ ∈ {0,1}。',
      '<b>匈牙利法依据</b>：从成本矩阵的任一行（列）各元素中减去该行（列）的最小元素，最优解不变（因为每个行/列恰好选一个元素）。',
      '<b>覆盖线定理</b>（König 定理）：能覆盖矩阵中所有 0 元素的最少直线数 = 最大独立 0 元素个数。若最少覆盖线数 = n，则已获得最优指派。',
      '<b>变量数减少</b>：由于约束矩阵全幺模，LP 松弛的最优解自动是 0-1 解，求解 n 阶指派问题等价于其 LP 松弛。'
    ],
    params: [
      P.select('preset', '数据场景', Object.keys(ASSIGN_PRESETS).map(function (k) {
        return { value: k, label: ASSIGN_PRESETS[k].name };
      }), 'project'),
      P.toggle('showGreedy', '对比贪心算法结果', true)
    ],
    run: function (v) {
      var data = ASSIGN_PRESETS[v.preset] || ASSIGN_PRESETS.project;
      var cost = data.cost, n = cost.length;
      var r = OR.solveAssignment(cost);

      // 贪心：每次选择全局最小成本且行、列均未占用
      var greedyTotal = 0, greedyPairs = [];
      if (v.showGreedy) {
        var usedR = {}, usedC = {};
        var cells = [];
        for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) cells.push({ i: i, j: j, c: cost[i][j] });
        cells.sort(function (a, b) { return a.c - b.c; });
        cells.forEach(function (cell) {
          if (usedR[cell.i] || usedC[cell.j]) return;
          usedR[cell.i] = usedC[cell.j] = true;
          greedyTotal += cell.c;
          greedyPairs.push(cell);
        });
      }

      var metrics = [
        { k: '最优总' + (data.unit.indexOf('元') >= 0 ? '成本' : '耗时'), v: r.cost, unit: data.unit, tone: 'violet' },
        { k: '问题规模', v: n + '×' + n, unit: '', tone: 'brand', hint: n + ' 人 / ' + n + ' 任务' },
        { k: '可行方案总数', v: factorial(n), unit: '种', tone: 'teal', hint: n + '! = ' + factorial(n) }
      ];
      if (v.showGreedy) {
        metrics.push({
          k: '贪心算法结果', v: fmt(greedyTotal, 0), unit: data.unit, tone: 'rose',
          hint: '比最优差 ' + fmt((greedyTotal - r.cost) / r.cost * 100, 1) + '%'
        });
      }

      var blocks = [B.metrics(metrics)];

      blocks.push(B.card('指派方案对比（成本矩阵）', [
        B.chart('heatmap', {
          height: 46 + n * 52,
          rows: data.people, cols: data.tasks,
          values: cost.map(function (row) { return row.slice(); }),
          hue: 'violet', padL: 74, digits: 0,
          title: '效率成本矩阵（红框 = 最优指派）',
          highlight: function (i, j) { return r.assignment[i] === j; },
          highContrast: true
        }),
        B.table({
          head: ['人员', '指派任务', '该项成本', '行内最小成本', '是否为最优'],
          rows: r.assignment.map(function (j, i) {
            var rowMin = Math.min.apply(null, cost[i]);
            return [
              data.people[i], data.tasks[j] === undefined ? '—' : data.tasks[j],
              cost[i][j], rowMin,
              cost[i][j] === rowMin ? '✓ 行内最优' : '（行内最优为 ' + rowMin + '）'
            ];
          }),
          highlight: function (i) { return cost[i][r.assignment[i]] === Math.min.apply(null, cost[i]); },
          zebra: true
        })
      ], '一对一配对，使总成本最小', 'violet'));

      if (v.showGreedy && greedyPairs.length === n) {
        var gm = {};
        greedyPairs.forEach(function (p) { gm[p.i] = p.j; });
        blocks.push(B.card('贪心算法 vs 匈牙利算法', [
          B.table({
            head: ['人员', '贪心指派', '贪心成本', '最优指派', '最优成本', '差异'],
            rows: data.people.map(function (p, i) {
              var gj = gm[i], oj = r.assignment[i];
              return [p, data.tasks[gj], cost[i][gj], data.tasks[oj], cost[i][oj],
                cost[i][gj] === cost[i][oj] ? '—' : (cost[i][gj] > cost[i][oj] ? '+' + (cost[i][gj] - cost[i][oj]) : (cost[i][gj] - cost[i][oj]))];
            }),
            zebra: true
          }),
          B.note('贪心策略每次选择当前最小的成本格，但可能把「性价比最高」的人分配到简单任务上，导致复杂任务只能交给低效人员。<b>局部最优的叠加不等于全局最优</b>——这正是需要运筹学优化方法的根本原因。本例中贪心结果比最优方案高出 <b>' +
            fmt((greedyTotal - r.cost) / r.cost * 100, 1) + '%</b>。', 'amber')
        ], '为什么需要系统化算法', 'rose'));
      }

      blocks.push(B.card('算法原理', [
        B.formula([
          '<span class="cm">指派问题模型</span>',
          'min  z = Σᵢ Σⱼ cᵢⱼ·xᵢⱼ',
          's.t.  Σⱼ xᵢⱼ = 1    (每个人员承担一项任务)',
          '      Σᵢ xᵢⱼ = 1    (每项任务由一人承担)',
          '      xᵢⱼ ∈ {0, 1}',
          '',
          '<span class="cm">匈牙利法核心步骤</span>',
          '① 各行减去本行最小元素 → ② 各列减去本列最小元素',
          '③ 用最少条直线覆盖所有 0 元素',
          '④ 若覆盖线数 = n 则得最优解；否则对未被覆盖元素取最小者 k',
          '   未覆盖元素 −k，覆盖线交叉处 +k，重复 ③'
        ]),
        B.html('<p class="small muted">本系统采用「最短增广路（Jonker–Volgenant 风格）」的 O(n³) 实现，' +
          '在 n = ' + n + ' 时瞬时完成。暴力枚举需要检验 ' + factorial(n) + ' 种方案，随 n 增长呈爆炸式上升——n=10 时已超过 360 万种。</p>')
      ], '从矩阵变换到大规模可解', 'teal'));

      blocks.push(B.card('教学解读', [
        B.list([
          '最优指派总成本 <b>' + fmt(r.cost, 0) + ' ' + data.unit + '</b>，相比逐行取最小值（下界 ' +
            fmt(cost.reduce(function (s, row, i) { return s + Math.min.apply(null, row); }, 0), 0) + '）高出 ' +
            fmt(cost.reduce(function (s, row, i) { return s + Math.min.apply(null, row); }, 0) === 0 ? 0 :
              (r.cost / cost.reduce(function (s, row, i) { return s + Math.min.apply(null, row); }, 0) - 1) * 100, 1) +
            '%，差额来源是任务独占约束带来的冲突。',
          '各行的下界之和（' + fmt(cost.reduce(function (s, row) { return s + Math.min.apply(null, row); }, 0), 0) + '）与各列的下界之和中的较大者，构成最优值的下界——可用于快速评估方案的改进空间。',
          '指派问题可视为运输问题在 aᵢ = bⱼ = 1 时的特例，因此同样具有全幺模性质，LP 松弛即得整数最优解。',
          '在实际管理中，若某员工被分配到并非其最擅长的任务，说明团队存在结构性技能缺口，此时更应考虑培训或外部招聘，而非强行追求「人人最优」。'
        ])
      ], '把指派结果转化为组织洞察', 'brand'));

      return {
        blocks: blocks,
        summary: '指派问题 ' + n + '×' + n + '，成本矩阵 ' + JSON.stringify(cost) +
          '。最优指派 ' + JSON.stringify(r.assignment) + '（' + r.assignment.map(function (j, i) { return data.people[i] + '→' + data.tasks[j]; }).join('，') +
          '），最优总成本 ' + fmt(r.cost, 0) + ' ' + data.unit + '。' +
          (v.showGreedy ? '贪心算法结果 ' + fmt(greedyTotal, 0) + '，劣于最优解 ' + fmt((greedyTotal - r.cost) / r.cost * 100, 1) + '%。' : '')
      };
    },
    problems: [
      {
        id: 'ap-1', level: '概念', type: 'single',
        q: '匈牙利算法的理论依据之一是：从成本矩阵的某一行所有元素中减去同一个常数 k，则：',
        options: [
          '最优解改变但最优值不变',
          '最优解与最优值都不变',
          '最优解不变，最优值减少 n·k',
          '必须同时调整列才能保持等价'
        ],
        answer: 1,
        explain: '因为每个人员必须且只能承担一项任务，行内所有元素减 k 相当于每个可行方案的目标值都减少 k（每行恰好选一个元素），因此所有方案的相对优劣不变，最优解与最优值均不变（最优值减 n·k）。'
      },
      {
        id: 'ap-2', level: '计算', type: 'number',
        q: '默认项目组场景（4×4）中，最优指派的总耗时是多少？（小时）',
        answer: 140, tolerance: 0.5,
        explain: '最优指派为：张工→核心编码(69)、李工→架构设计(37)、王工→需求分析(11)、赵工→测试验收(23)，合计 69+37+11+23 = 140 小时。若按「每人做自己最擅长的事」各行取最小值为 69+37+5+8 = 119，但这四人中有两人同时盯上了同一任务，任务独占约束使总成本必然高于逐行最小值之和。'
      },
      {
        id: 'ap-3', level: '概念', type: 'single',
        q: '若指派问题的成本矩阵中有两行完全相同，则下列结论正确的是：',
        options: [
          '问题一定无解',
          '一定存在多个最优解（最优解不唯一）',
          '最优解仍然唯一',
          '需要增加约束才能求解'
        ],
        answer: 1,
        explain: '两行相同意味着这两个人员完全可互换，交换他们的任务分配不改变总成本，因此至少存在两个不同的最优解。这在管理上提示企业应关注人员的可替代性。'
      },
      {
        id: 'ap-4', level: '概念', type: 'single',
        q: '指派问题中不允许把「一个人分配到多项任务」，这一限制在数学模型中的表达是：',
        options: [
          'Σᵢ xᵢⱼ = 1',
          'Σⱼ xᵢⱼ = 1',
          'xᵢⱼ ≤ cᵢⱼ',
          'Σᵢ Σⱼ xᵢⱼ = n²'
        ],
        answer: 1,
        explain: '固定人员 i（行），Σⱼ xᵢⱼ = 1 表示该人员恰好承担一项任务。而 Σᵢ xᵢⱼ = 1 则是固定任务 j（列），表示每项任务恰好由一人承担。'
      },
      {
        id: 'ap-5', level: '建模', type: 'text',
        q: '某公司有 6 名工程师、8 个项目，每个项目至少需要 1 名工程师，工程师可以承担多个项目但工作时间有限。请说明如何把这个问题转化为可求解的指派/运输类模型。',
        reference: '思路：\n1) 若一名工程师最多承担一项任务 → 直接使用指派模型。\n2) 若一名工程师可承担多项，则需要引入「工作量/能力」维度：把工程师 i 拆成 kᵢ 个「虚拟工程师」（kᵢ 为其可承担的项目数上限），每个虚拟工程师只能承担一项任务，从而转化为方阵指派问题。\n3) 若项目数 > 工程师数，则属于「行少于列」的不平衡指派问题，用匈牙利法求解时需补齐虚拟行（虚拟工程师），虚拟行的成本可取 0 或取很大的惩罚值（表示必须由真人完成）。\n4) 若还需考虑工时上限与项目优先级，则应建立带容量约束的广义指派问题（GAP），用整数规划或启发式算法求解。',
        explain: '关键在于「拆分/补齐」的建模技巧：通过增设虚拟人员或虚拟任务，把不平衡问题化为标准方阵指派问题；若约束更复杂（容量、优先级、多目标），则需升级为广义指派问题或整数规划。'
      }
    ]
  });

  function factorial(n) { var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; }

})(typeof window !== 'undefined' ? window : globalThis);
