/* =============================================================================
 * OR-SimLab · 首页视图
 * -----------------------------------------------------------------------------
 * 平台门面：Hero 区、能力指标、分层场景导航、平台特性说明。
 * 目标是让学生 30 秒内建立「这是什么 / 从哪开始」的认知。
 * ========================================================================== */
(function (global) {
  'use strict';
  var OR = global.OR = global.OR || {};

  var LEVEL_META = {
    1: { name: '入门', tone: 'green', cls: 'lv1', tag: '建立直觉', desc: '确定性模型 · 会建模会算' },
    2: { name: '进阶', tone: 'amber', cls: 'lv2', tag: '引入不确定性', desc: '随机系统 · 会权衡会优化' },
    3: { name: '挑战', tone: 'rose', cls: 'lv3', tag: '综合决策', desc: '风险度量 · 会仿真会决策' }
  };

  /* 场景在首页卡片上的补充说明（避免与 lab.brief 重复表达） */
  var CARD_NOTE = {
    'lp-production': '线性规划标准型',
    'transport': '表上作业法',
    'assignment': '组合优化',
    'lp-blending': '配方与营养约束',
    'transport-transship': '中转与转运',
    'network-flow': '图与网络优化',
    'queue-service': '离散事件仿真',
    'queue-callcenter': 'Erlang C 排班',
    'inventory': '随机库存控制',
    'markov-reliability': '马尔可夫稳态',
    'pert-project': '网络计划技术',
    'mip-facility': '分支定界',
    'montecarlo-risk': '风险价值度量',
    'sim-optim': '仿真优化',
    'dp-allocation': '多阶段决策'
  };

  function heroStats() {
    var labs = OR.Lab.all();
    var total = labs.reduce(function (a, l) { return a + (l.problems ? l.problems.length : 0); }, 0);
    var kb = OR.KB ? OR.KB.stats() : { concepts: 0, domains: 0 };
    var kg = OR.KG ? OR.KG.stats() : { edges: 0 };
    return [
      { v: labs.length, k: '仿真教学场景' },
      { v: total, k: '配套练习题' },
      { v: kb.concepts, k: '结构化知识点' },
      { v: kg.edges, k: '知识图谱关联' }
    ];
  }

  function buildHero() {
    var U = OR.ui;
    var stats = heroStats();
    var inner = U.el('div.hero-inner', null, [
      U.el('div.hero-tag', { html: U.icon('spark', 13) + '<span>知识图谱 × 生成式 AI 双驱动 · 断网仍可用</span>' }),
      U.el('h1', {
        html: 'AI 增强的<span class="grad">运筹学虚拟仿真实验教学平台</span>'
      }),
      U.el('p', {
        text: '把课本上的模型放进可以「动手调参」的真实业务场景里：改变一个资源上限，立刻看到最优解、影子价格与迭代过程的变化。十五个场景覆盖线性规划、运输与指派、网络优化、排队论、库存、网络计划、随机过程、整数规划、仿真风险与动态规划，每个场景都配有 AI 助教与分层练习题；55 个结构化知识点通过知识图谱与实验双向绑定，学什么、在哪练、练完掌握到什么程度，一条线走通。还能反过来用：把一段业务描述交给「AI 建模」，系统自动翻译成实验参数并交给你确认——最难的建模第一步，不再卡住学生。'
      }),
      U.el('div.hero-actions', null, [
        U.el('button.btn.btn-white', {
          html: U.icon('play', 15) + '<span>从入门场景开始</span>',
          onclick: function () { location.hash = '#/lab/lp-production'; }
        }),
        U.el('button.btn', {
          html: U.icon('grid', 15) + '<span>浏览全部场景</span>',
          onclick: function () { location.hash = '#/labs'; }
        }),
        U.el('button.btn', {
          html: U.icon('book', 15) + '<span>打开知识图谱</span>',
          onclick: function () { location.hash = '#/knowledge'; }
        })
      ]),
      U.el('div.hero-stats', null, stats.map(function (s) {
        return U.el('div.hero-stat', null, [
          U.el('div.v', { text: String(s.v) }),
          U.el('div.k', { text: s.k })
        ]);
      }))
    ]);
    return U.el('div.hero', null, [U.el('div.hero-grid-bg'), inner]);
  }

  /* ---------- 能力矩阵 ---------- */
  function buildCapability() {
    var U = OR.ui;
    var kb = OR.KB ? OR.KB.stats() : { domains: 0 };
    return U.el('div.grid.g4', { style: 'margin-top:18px' }, [
      U.el('div.stat.t-teal', null, [
        U.el('div.stat-k', { html: U.icon('cpu', 13) + '<span>AI 助教</span>' }),
        U.el('div.stat-v', { text: '4 种角色' }),
        U.el('div.stat-d', { text: '答疑 · 提示 · 诊断 · 出题' })
      ]),
      U.el('div.stat.t-violet', null, [
        U.el('div.stat-k', { html: U.icon('layers', 13) + '<span>算法内核</span>' }),
        U.el('div.stat-v', { text: '8 大算法族' }),
        U.el('div.stat-d', { text: '单纯形 · 匈牙利 · 网络流 · 马尔可夫 · 仿真优化' })
      ]),
      U.el('div.stat.t-amber', null, [
        U.el('div.stat-k', { html: U.icon('book', 13) + '<span>知识图谱</span>' }),
        U.el('div.stat-v', { text: kb.domains + ' 个领域' }),
        U.el('div.stat-d', { text: '前置 / 相关 / 实验归属三类关系' })
      ]),
      U.el('div.stat', null, [
        U.el('div.stat-k', { html: U.icon('check2', 13) + '<span>离线可用</span>' }),
        U.el('div.stat-v', { text: '零依赖' }),
        U.el('div.stat-d', { text: '断网自动切换本地知识引擎' })
      ])
    ]);
  }

  /* ---------- 场景卡片 ---------- */
  function scenarioCard(lab) {
    var U = OR.ui;
    var lv = LEVEL_META[lab.level] || LEVEL_META[1];
    var prog = OR.Store.getProgress(lab.id);
    var done = prog.total > 0 ? prog.solved / prog.total : 0;

    return U.el('div.scn-card.' + lv.cls, {
      onclick: function () { location.hash = '#/lab/' + lab.id; }
    }, [
      U.el('div.scn-strip'),
      U.el('div.scn-body', null, [
        U.el('div.scn-top', null, [
          U.el('div.scn-icon.i-' + (lab.tone || 'brand'), { html: U.icon(lab.icon, 19) }),
          U.el('div', { style: 'flex:1;min-width:0' }, [
            U.el('div.scn-title', { text: lab.name }),
            U.el('div.scn-sub', { text: lab.subtitle })
          ]),
          U.el('span.scn-go', { html: U.icon('play', 14), title: '进入实验' })
        ]),
        U.el('div.scn-desc', { text: lab.brief }),
        U.el('div.scn-tags', null, (lab.tags || []).slice(0, 3).map(function (t) {
          return U.el('span.pill', { text: t });
        })),
        U.el('div.scn-foot', null, [
          U.el('span.pill.p-lv' + lab.level, { text: lv.name }),
          U.el('span.tiny.muted', { text: CARD_NOTE[lab.id] || lab.topic }),
          U.el('span.spacer'),
          lab.problems && lab.problems.length
            ? U.el('span.tiny' + (done >= 1 ? '.hl' : '.muted'), {
              text: '练习 ' + prog.solved + '/' + lab.problems.length
            })
            : null
        ])
      ])
    ]);
  }

  function buildScenarios() {
    var U = OR.ui;
    var labs = OR.Lab.all();
    var wrap = U.el('div');

    OR.Lab.levels().forEach(function (lv) {
      var group = labs.filter(function (l) { return l.level === lv.level; });
      if (!group.length) return;
      var meta = LEVEL_META[lv.level];
      wrap.appendChild(U.el('div.sec-head', null, [
        U.el('span.pill.p-lv' + lv.level, { text: '难度 ' + lv.level + ' · ' + lv.name }),
        U.el('h2', { text: meta.tag + '：' + meta.desc }),
        U.el('span.spacer'),
        U.el('span.sub', { text: group.length + ' 个场景' })
      ]));
      wrap.appendChild(U.el('div.grid.g3', null, group.map(scenarioCard)));
      wrap.appendChild(U.el('p.tiny.muted', { text: lv.desc, style: 'margin:-6px 0 4px' }));
    });

    return wrap;
  }

  /* ---------- 知识图谱概览 ---------- */
  function buildKnowledge() {
    var U = OR.ui, KB = OR.KB, KG = OR.KG;
    if (!KB || !KG) return U.el('div');
    var ks = KB.stats(), gs = KG.stats();
    var cov = KG.coverage();

    var wrap = U.el('div');
    wrap.appendChild(U.el('div.sec-head', null, [
      U.el('h2', { text: '知识图谱' }),
      U.el('span.sub', { text: '知识点与实验双向绑定：从概念找到实验，从实验回到概念' }),
      U.el('span.spacer'),
      U.el('span.pill.p-brand', { text: ks.concepts + ' 个知识点' }),
      U.el('span.pill', { text: ks.domains + ' 个领域' }),
      U.el('span.pill', { text: gs.edges + ' 条关联' })
    ]));

    var card = U.el('div.card');
    var canvas = U.el('div', { style: 'padding:4px 2px 0;overflow:hidden' });
    canvas.innerHTML = KG.renderSVG({ nodes: KG.nodes().filter(function (n) { return n.type === 'concept'; }), edges: KG.edges() }, {
      width: 1180, height: 400, kind: 'cluster', showLab: false,
      labels: 'auto', masteryMap: cov.details
    });
    KG.attach(canvas, {
      onPick: function (id, n) { if (n && n.type === 'concept') location.hash = '#/kb/' + id; }
    });
    card.appendChild(U.el('div.card-head', null, [
      U.el('h3', { text: '运筹学知识地图' }),
      U.el('span.sub', { text: '点击任一知识点进入详情页；颜色深浅代表你目前的掌握程度' }),
      U.el('span.spacer'),
      U.el('span.tiny.muted', { text: '学习覆盖率 ' + Math.round(cov.rate * 100) + '%' })
    ]));
    card.appendChild(canvas);
    card.appendChild(U.el('div.card-foot', null, [
      U.el('div.hstack.wrap', { style: 'gap:14px;flex:1' }, [
        legendDot('#94a3b8', '未学习'), legendDot('#f59e0b', '初步了解'),
        legendDot('#14b8a6', '基本掌握'), legendDot('#10b981', '熟练应用')
      ]),
      U.el('button.btn.btn-sm.btn-soft', {
        html: U.icon('book', 13) + '<span>知识中心</span>',
        onclick: function () { location.hash = '#/knowledge'; }
      }),
      U.el('button.btn.btn-sm.btn-primary', {
        html: U.icon('layers', 13) + '<span>查看学习路径</span>',
        onclick: function () { location.hash = '#/knowledge'; }
      })
    ]));
    wrap.appendChild(card);

    function legendDot(color, text) {
      return U.el('span.hstack', { style: 'gap:5px;align-items:center' }, [
        U.el('span', { style: 'display:inline-block;width:8px;height:8px;border-radius:99px;background:' + color }),
        U.el('span.tiny.muted', { text: text })
      ]);
    }

    return wrap;
  }

  /* ---------- 平台特性 ---------- */
  function buildFeatures() {
    var U = OR.ui;
    var feats = [
      {
        icon: 'cpu', tone: 'brand', title: 'AI 大模型助教',
        text: '内置概念答疑、引导提示、结果诊断、变式出题四种教学角色。助教可读取当前场景的实时数值与知识图谱中的关联知识点，因此回答不是通用套话，而是针对你眼前这组数据、落在课程知识体系上的讲解。三条通道自动降级：云服务 → 自定义模型 → 离线知识引擎，断网也能用。',
        go: '#/settings', goText: '配置通道'
      },
      {
        icon: 'book', tone: 'violet', title: '知识库 × 知识图谱',
        text: '55 个结构化知识点，每个都含定义、公式、要点、常见误区、示例与 AI 引导种子；它们通过「前置 / 相关 / 实验归属」三类边连成有向无环图，15 个实验各自声明核心、支撑、拓展三层知识点。拓扑排序自动生成学习路径，环检测保证知识体系自洽，掌握度由练习正确率与实验探索综合计算。',
        go: '#/knowledge', goText: '打开知识图谱'
      },
      {
        icon: 'layers', tone: 'teal', title: '可验证的算法内核',
        text: '两阶段单纯形法、匈牙利算法、Dinic 最大流、最小费用流、离散事件仿真、蒙特卡洛、动态规划、马尔可夫稳态与吸收态、Erlang C、分支定界全部自研实现，并配有交叉验证测试：设施选址与全组合暴力枚举互验、运输问题与线性规划互验、指派问题与全排列比对、仿真结果与解析解统计一致。',
        go: '#/docs/design', goText: '查看设计'
      },
      {
        icon: 'target', tone: 'amber', title: '分层递进的训练闭环',
        text: '每个场景提供概念题、计算题、建模题三类练习，自动判分并把错题归档。学习档案记录每次调参、每次作答，知识图谱按领域统计覆盖率与掌握率，仪表盘展示各知识点掌握度与薄弱环节，导出后可直接用于课程报告。',
        go: '#/dashboard', goText: '查看档案'
      },
      {
        icon: 'chart', tone: 'brand', title: '即调即见的可视化',
        text: '参数一改，可行域几何图、单纯形表、闭回路调整、甘特图、风险分布直方图、知识图谱布局同步刷新。所有图表零依赖绘制，支持高分屏与悬停读数，无需任何外部图表库。',
        go: '#/labs', goText: '去体验'
      }
    ];

    return U.el('div.grid.g2', null, feats.map(function (f) {
      return U.el('div.card', null, [
        U.el('div.card-body', null, [
          U.el('div.hstack', { style: 'gap:11px;margin-bottom:10px' }, [
            U.el('div.scn-icon.i-' + f.tone, { html: U.icon(f.icon, 18) }),
            U.el('h3', { text: f.title, style: 'font-size:14.5px' })
          ]),
          U.el('p.small.muted', { text: f.text, style: 'line-height:1.72;margin-bottom:12px' }),
          U.el('button.btn.btn-sm.btn-soft', {
            html: '<span>' + f.goText + '</span>',
            onclick: function () { location.hash = f.go; }
          })
        ])
      ]);
    }));
  }

  /* ---------- 学习路径 ---------- */
  function buildPath() {
    var U = OR.ui;
    var steps = [
      { t: '选一个场景', d: '从入门级「生产计划优化」开始，左侧拖动滑块改变资源上限。' },
      { t: '观察解的变化', d: '看最优解从顶点跳到顶点，看影子价格何时变成 0。' },
      { t: '向 AI 提问', d: '点右下角助教，选「概念答疑」问「为什么最优解一定在顶点」。' },
      { t: '做配套练习', d: '切到「配套练习」页签，做完计算题看解析与错题归档。' },
      { t: '回到知识图谱', d: '在「知识图谱」页签查看本实验关联的核心/支撑/拓展知识点，点进去补前置。' },
      { t: '挑战进阶场景', d: '当入门级场景练习正确率超过 80%，进入进阶与挑战级。' }
    ];
    return U.el('div', {
      style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px'
    }, steps.map(function (s, i) {
      return U.el('div.card', null, [
        U.el('div.card-body', { style: 'padding:14px 15px' }, [
          U.el('div.hstack', { style: 'gap:9px;margin-bottom:7px' }, [
            U.el('div.brand-logo', {
              style: 'width:23px;height:23px;flex:0 0 23px;border-radius:7px;font-size:11.5px',
              text: String(i + 1)
            }),
            U.el('div.scn-title', { text: s.t, style: 'font-size:13px' })
          ]),
          U.el('div.tiny.muted', { text: s.d, style: 'line-height:1.65' })
        ])
      ]);
    }));
  }

  /* ---------- 渲染 ---------- */
  function render(root) {
    var U = OR.ui;
    root.innerHTML = '';
    var frag = document.createDocumentFragment();

    frag.appendChild(buildHero());
    frag.appendChild(buildCapability());

    frag.appendChild(U.el('div.sec-head', null, [
      U.el('h2', { text: '从哪里开始？' }),
      U.el('span.sub', { text: '五步走完一个完整的实验闭环' })
    ]));
    frag.appendChild(buildPath());

    frag.appendChild(U.el('div.sec-head', null, [
      U.el('h2', { text: '实验场景' }),
      U.el('span.sub', { text: '按难度递进，覆盖运筹学主干知识' })
    ]));
    frag.appendChild(buildScenarios());

    frag.appendChild(buildKnowledge());

    frag.appendChild(U.el('div.sec-head', null, [
      U.el('h2', { text: '平台能力' }),
      U.el('span.sub', { text: '为什么它适合课堂教学与竞赛展示' })
    ]));
    frag.appendChild(buildFeatures());

    frag.appendChild(U.el('div.card', {
      style: 'margin-top:22px;background:linear-gradient(135deg,var(--brand-50),var(--violet-50));border-color:var(--brand-100)'
    }, [
      U.el('div.card-body', { style: 'padding:20px 22px' }, [
        U.el('div.hstack', { style: 'gap:14px;align-items:flex-start;flex-wrap:wrap' }, [
          U.el('div.scn-icon.i-violet', { html: U.icon('doc', 20) }),
          U.el('div', { style: 'flex:1;min-width:240px' }, [
            U.el('h3', { text: '配套文档齐全，可直接用于课程与竞赛提交', style: 'font-size:15px;margin-bottom:6px' }),
            U.el('p.small.muted', {
              text: '需求分析、系统设计、实验验证、部署方案四份文档，外加竞赛作品简介、演示脚本、答辩要点与创新点说明。文档内容与代码一一对应，包含算法正确性验证数据与实验结论。',
              style: 'line-height:1.72;margin:0'
            })
          ]),
          U.el('button.btn.btn-primary', {
            html: U.icon('doc', 15) + '<span>打开文档中心</span>',
            onclick: function () { location.hash = '#/docs'; }
          })
        ])
      ])
    ]));

    root.appendChild(frag);
  }

  /* ---------- 场景目录（#/labs） ---------- */
  function renderCatalog(root) {
    var U = OR.ui;
    var labs = OR.Lab.all();
    root.innerHTML = '';

    var progAll = labs.map(function (l) {
      var p = OR.Store.getProgress(l.id);
      return { lab: l, p: p };
    });
    var totalQ = labs.reduce(function (a, l) { return a + (l.problems ? l.problems.length : 0); }, 0);
    var solvedQ = progAll.reduce(function (a, x) { return a + (x.p.solved || 0); }, 0);
    var visited = progAll.filter(function (x) { return (x.p.runs || 0) > 0; }).length;

    root.appendChild(U.el('div.sec-head', { style: 'margin-top:4px' }, [
      U.el('h2', { text: '实验场景目录' }),
      U.el('span.sub', { text: '共 ' + labs.length + ' 个场景 · ' + totalQ + ' 道练习题' }),
      U.el('span.spacer'),
      U.el('span.pill', { text: '已探索 ' + visited + '/' + labs.length }),
      U.el('span.pill.p-brand', { text: '练习完成 ' + solvedQ + '/' + totalQ })
    ]));

    /* 按知识点筛选 */
    var topics = [];
    labs.forEach(function (l) { if (topics.indexOf(l.topic) < 0) topics.push(l.topic); });
    var activeTopic = '全部';
    var gridWrap = U.el('div');

    var bar = U.el('div.hstack', { style: 'gap:7px;flex-wrap:wrap;margin-bottom:16px' });
    ['全部'].concat(topics).forEach(function (t) {
      var b = U.el('button.btn.btn-sm' + (t === '全部' ? '.btn-primary' : ''), { text: t });
      b.addEventListener('click', function () {
        activeTopic = t;
        Array.prototype.forEach.call(bar.children, function (c) { c.classList.remove('btn-primary'); });
        b.classList.add('btn-primary');
        paintGrid();
      });
      bar.appendChild(b);
    });
    root.appendChild(bar);
    root.appendChild(gridWrap);

    function paintGrid() {
      gridWrap.innerHTML = '';
      var list = activeTopic === '全部' ? labs : labs.filter(function (l) { return l.topic === activeTopic; });
      OR.Lab.levels().forEach(function (lv) {
        var g = list.filter(function (l) { return l.level === lv.level; });
        if (!g.length) return;
        gridWrap.appendChild(U.el('div.sec-head', null, [
          U.el('span.pill.p-lv' + lv.level, { text: lv.name }),
          U.el('span.sub', { text: lv.desc }),
          U.el('span.spacer'),
          U.el('span.tiny.muted', { text: g.length + ' 个' })
        ]));
        gridWrap.appendChild(U.el('div.grid.g3', null, g.map(scenarioCard)));
      });
      if (!gridWrap.children.length) {
        gridWrap.appendChild(U.el('div.empty', { text: '该知识点下暂无场景' }));
      }
    }
    paintGrid();
  }

  OR.HomeView = { render: render, renderCatalog: renderCatalog, LEVEL_META: LEVEL_META };
})(typeof window !== 'undefined' ? window : globalThis);
