/* ============================================================
   书库注册表 —— 新增一本书时，唯一需要改动的文件
   1) 在 books/<slug>/ 下放 index.html 与 data.js（可从 books/_template 复制）
   2) 在下面的 books 数组中追加一条，并用 group 指定它归入哪个模块
   3) 刷新书库首页即可，导航、切换器、统计会自动更新
   ============================================================ */
window.LIBRARY = {
  name: '我的书库',
  subtitle: '把读过的书拆成结构、观点与可执行的动作，而不是留一堆划线。',

  /* 预留空位：书架上始终保留几个“待收录”的格子 */
  slots: 2,

  /* 模块分组：决定书架的分区顺序与筛选按钮；顺序即展示顺序 */
  groups: [
    {
      id: 'base', no: '00', title: '入门读本',
      desc: '先把两条线接上：一条是「财富与判断力」，一条是「动机与执行」。'
    },
    {
      id: 'a', no: 'A', title: '认知总纲',
      desc: '多元思维、商业本质、决策系统——这一组是整套认知体系的骨架，也是纳瓦尔反复提到的思想源头。'
    },
    {
      id: 'b', no: 'B', title: '风险与不确定性',
      desc: '在不可预测的环境里配置资源，而不是押注确定性。一本书，但需要反复读。'
    },
    {
      id: 'c', no: 'C', title: '判断与行为决策',
      desc: '看清自己如何被影响、如何估计概率、如何评价一次决策的好坏。'
    },
    {
      id: 'd', no: 'D', title: '批判性思维与成长心智',
      desc: '检验论证、扩展能力——把前面所有方法落到日常读写与长期学习上，去励志化。'
    }
  ],

  books: [
    /* ---------- 00 入门读本 ---------- */
    {
      slug: 'naval-almanack',
      title: '纳瓦尔宝典',
      titleEn: 'The Almanack of Naval Ravikant',
      shortEn: 'ALMANACK',
      author: '埃里克·乔根森 编 / 纳瓦尔·拉维坎特 述',
      color: '#2E5C8A',
      tag: '财富 · 判断力 · 幸福',
      group: 'base',
      summary: '把财富、判断力与幸福拆成可训练的技能：先获得选择的自由，再练习不被欲望牵着走。',
      date: '2026-11-01',
      status: 'ready'
    },
    {
      slug: 'think-and-grow-rich',
      title: '思考致富',
      titleEn: 'Think and Grow Rich',
      shortEn: 'THINK & GROW RICH',
      author: '拿破仑·希尔（Napoleon Hill）',
      color: '#B5651D',
      tag: '欲望 · 计划 · 坚持',
      group: 'base',
      summary: '1937 年写下的十三条致富步骤。它既是动机工程的经典，也是一份需要带着怀疑读的时代文本。',
      date: '2026-11-01',
      status: 'ready'
    },

    /* ---------- A 认知总纲 ---------- */
    {
      slug: 'poor-charlies-almanack',
      title: '穷查理宝典',
      titleEn: "Poor Charlie's Almanack",
      shortEn: 'POOR CHARLIE',
      author: '查理·芒格（Charles T. Munger）',
      color: '#1F6F5C',
      tag: '多元思维 · 逆向思考',
      group: 'a',
      summary: '用多元思维模型与逆向思考替代单一学科的解释，把「避免愚蠢」当作长期优势。',
      date: '2026-11-01',
      status: 'ready'
    },
    {
      slug: 'buffett-letters',
      title: '巴菲特致股东的信',
      titleEn: 'The Essays of Warren Buffett',
      shortEn: 'ESSAYS',
      author: '沃伦·巴菲特 / 劳伦斯·坎宁安 选编',
      color: '#5D5AA0',
      tag: '商业本质 · 护城河 · 复利',
      group: 'a',
      summary: '不看 K 线，看生意：护城河、资本配置、安全边际，以及为什么价格不是价值。',
      date: '2026-11-01',
      status: 'ready'
    },
    {
      slug: 'principles',
      title: '原则',
      titleEn: 'Principles: Life and Work',
      shortEn: 'PRINCIPLES',
      author: '瑞·达利欧（Ray Dalio）',
      color: '#B03A2E',
      tag: '五步流程 · 极度开放',
      group: 'a',
      summary: '把人生与工作决策像算法一样拆解、复盘、迭代，形成一套可复用的原则系统。',
      date: '2026-11-01',
      status: 'ready'
    },

    /* ---------- B 风险与不确定性 ---------- */
    {
      slug: 'antifragile',
      title: '反脆弱',
      titleEn: 'Antifragile',
      shortEn: 'ANTIFRAGILE',
      author: '纳西姆·尼古拉斯·塔勒布',
      color: '#34495E',
      tag: '杠铃策略 · 凸性 · 切身利害',
      group: 'b',
      summary: '区分脆弱、坚韧与反脆弱：不要祈求波动消失，而要站到能从波动中获益的位置。',
      date: '2026-11-01',
      status: 'ready'
    },

    /* ---------- C 判断与行为决策 ---------- */
    {
      slug: 'noise',
      title: '噪声',
      titleEn: 'Noise: A Flaw in Human Judgment',
      shortEn: 'NOISE',
      author: '卡尼曼 / 西博尼 / 桑斯坦',
      color: '#85703A',
      tag: '决策卫生 · 结构化判断',
      group: 'c',
      summary: '偏差之外还有噪声：本应相同的判断彼此散开。它可测量、可减少，而多数组织从未测过。',
      date: '2026-11-01',
      status: 'ready'
    },
    {
      slug: 'influence',
      title: '影响力',
      titleEn: 'Influence: The Psychology of Persuasion',
      shortEn: 'INFLUENCE',
      author: '罗伯特·西奥迪尼（Robert B. Cialdini）',
      color: '#C2506F',
      tag: '互惠 · 社会认同 · 稀缺',
      group: 'c',
      summary: '看懂别人如何让你说「是」，也检查自己身上那几个从不设防的开关。',
      date: '2026-11-01',
      status: 'ready'
    },
    {
      slug: 'superforecasting',
      title: '超预测',
      titleEn: 'Superforecasting',
      shortEn: 'FORECAST',
      author: '菲利普·泰特洛克 / 丹·加德纳',
      color: '#17777E',
      tag: '概率思维 · 校准 · 更新',
      group: 'c',
      summary: '把判断拆成可结算的概率问题，持续小幅更新，用长期校准替代「我说准了」。',
      date: '2026-11-01',
      status: 'ready'
    },
    {
      slug: 'thinking-in-bets',
      title: '对赌',
      titleEn: 'Thinking in Bets',
      shortEn: 'IN BETS',
      author: '安妮·杜克（Annie Duke）',
      color: '#8C5A3C',
      tag: '决策与结果 · 期望值',
      group: 'c',
      summary: '职业赌徒的视角：结果好坏不等于决策对错。专治事后归因、侥幸与「我早就说过」。',
      date: '2026-11-01',
      status: 'ready'
    },

    /* ---------- D 批判性思维与成长心智 ---------- */
    {
      slug: 'asking-the-right-questions',
      title: '学会提问',
      titleEn: 'Asking the Right Questions',
      shortEn: 'ASKING',
      author: '尼尔·布朗 / 斯图尔特·基利',
      color: '#55688A',
      tag: '论证拆解 · 证据等级',
      group: 'd',
      summary: '批判性思维的标准手册：论题、理由、假设、谬误、替代解释，一套固定顺序的自查清单。',
      date: '2026-11-01',
      status: 'ready'
    },
    {
      slug: 'mindset',
      title: '终身成长',
      titleEn: 'Mindset',
      shortEn: 'MINDSET',
      author: '卡罗尔·德韦克（Carol S. Dweck）',
      color: '#C98A2E',
      tag: '成长型思维 · 反馈',
      group: 'd',
      summary: '能力不是天赋注定的判决。但「成长型思维」被误读得厉害，这一页把误读也一并列出。',
      date: '2026-11-01',
      status: 'ready'
    }
  ]
};
