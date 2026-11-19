/* =============================================================================
 * OR-SimLab · AI 助教（大模型集成）
 * -----------------------------------------------------------------------------
 * 两级推理通道，保证在教学现场「永远可用」：
 *   ① 自建端点     兼容 OpenAI Chat Completions 协议，需在设置页配置
 *   ② 离线知识库   完全本地运行的教学知识引擎（默认，也是断网兜底）
 * 不内置任何第三方地址或密钥；PUBLIC_CONFIG 留空即不启用云服务通道。
 * 四种教学角色：概念答疑 / 引导式提示 / 结果诊断 / 变式出题
 * ========================================================================== */
(function (global) {
  'use strict';
  var OR = global.OR = global.OR || {};

  /* 云服务公共配置
   * ---------------------------------------------------------------------------
   * 提交版本**不内置任何第三方地址、密钥或 SDK**：参赛作品必须可独立分发，
   * 且不应把凭据写进源码。部署单位若需启用「云端大模型」通道，请在此处或
   * 「系统设置 → AI 服务」中填写自有端点与密钥（兼容 OpenAI 协议即可）。
   * 留空时系统自动走「自定义端点 → 离线知识引擎」通道，功能不受影响。
   */
  var PUBLIC_CONFIG = {
    endpoint: '',
    oauthRelayBaseUrl: '',
    publishableKey: ''
  };

  /* ---------- 角色提示词 ---------- */
  var ROLES = {
    concept: {
      label: '概念答疑',
      icon: 'book',
      desc: '解释运筹学概念、公式推导与算法原理',
      quick: ['这个模型的基本假设是什么？', '为什么最优解一定在顶点？', '影子价格的经济含义是什么？'],
      system:
        '你是运筹学课程的资深助教，服务对象是本科/研究生阶段的学生。你的任务是把抽象的运筹学概念讲清楚。\n' +
        '要求：\n' +
        '1. 用「先直觉、后形式化」的方式讲解：先给生活化的类比，再给出严谨定义与公式。\n' +
        '2. 公式使用 markdown 行内代码或代码块表示，保持可读。\n' +
        '3. 必须结合学生当前的实验场景与数值作答，不要只给通用答案。\n' +
        '4. 每次回答控制在 350 字以内，结构清晰，使用小标题或要点列表。\n' +
        '5. 结尾用一句话点出该概念在实践中的应用价值。\n' +
        '6. 使用简体中文。'
    },
    hint: {
      label: '引导提示',
      icon: 'spark',
      desc: '不给答案，用苏格拉底式提问引导学生自己想通',
      quick: ['给我一点提示', '我应该先算什么？', '我的思路卡在哪一步？'],
      system:
        '你是运筹学课程的引导型助教。你深信「学生自己想通的知识才记得住」，因此绝对不直接给出最终答案。\n' +
        '要求：\n' +
        '1. 只给出下一步该思考的方向或该用哪个工具，最多给出一步运算的量级提示。\n' +
        '2. 用提问的方式引导，例如「你注意到…吗？」「如果把…换成…，结果会怎样？」\n' +
        '3. 如果学生明确要求答案，先给一个反问，再给出「思路框架」而非数值结果。\n' +
        '4. 回答控制在 220 字以内。\n' +
        '5. 使用简体中文。'
    },
    diagnose: {
      label: '结果诊断',
      icon: 'chart',
      desc: '解读当前实验数据，指出异常与改进方向',
      quick: ['帮我解读这组结果', '当前方案有什么风险？', '下一步该调整哪个参数？'],
      system:
        '你是运筹学实验的数据诊断专家。学生会提供当前实验的参数与结果，你要做的是「像顾问一样解读数据」。\n' +
        '要求：\n' +
        '1. 先给出 1~2 句总体结论（当前方案好不好，瓶颈在哪里）。\n' +
        '2. 再指出 2~3 个值得注意的数值信号（例如影子价格为正、利用率接近 1、置信区间较宽）。\n' +
        '3. 最后给出 2~3 条具体可执行的参数调整建议，并预测调整后的方向性变化。\n' +
        '4. 不要重复罗列学生已经看到的数字，要给出「数字背后意味着什么」。\n' +
        '5. 回答控制在 380 字以内，使用要点列表。\n' +
        '6. 使用简体中文。'
    },
    generate: {
      label: '变式出题',
      icon: 'pen',
      desc: '基于当前场景生成新的练习题目',
      quick: ['给我出一道新题', '出一道更有挑战的题', '换一组数据考我'],
      system:
        '你是运筹学课程的命题教师。根据学生当前所在的实验场景，生成一道新的练习题。\n' +
        '要求：\n' +
        '1. 题目必须建立在该实验场景的模型框架上，但改变具体数值或增加一个小条件。\n' +
        '2. 题目分为三部分：【题干】【参考答案要点】【评分要点】。\n' +
        '3. 难度比当前场景略高，但必须可解。\n' +
        '4. 只出一题，不要一次给多道。\n' +
        '5. 使用简体中文。'
    }
  };

  /* ---------- 状态 ---------- */
  var state = {
    provider: 'offline',      // cloud | custom | offline
    usedProvider: null,       // 最近一次真实调用实际走通的通道（null = 尚未调用）
    cloudClient: null,
    cloudModel: null,
    cloudTried: false,
    lastCall: 0,
    abort: null,
    log: [],
    mode: 'concept',
    context: null,
    lastError: ''
  };

  function cfg() {
    return (OR.Store && OR.Store.get('settings', {})) || {};
  }

  /* ===========================================================================
   * 通道 ①：云服务（仅在自行注入 SDK 与配置时启用）
   * ======================================================================== */
  function getCloudClient() {
    if (state.cloudClient) return state.cloudClient;
    var SDK = global.WorkBuddyCloud;
    if (!SDK || typeof SDK.createWorkBuddyCloud !== 'function') return null;
    /* 未配置端点或密钥时不启用该通道（提交版本默认留空） */
    if (!PUBLIC_CONFIG.endpoint || !PUBLIC_CONFIG.publishableKey) return null;
    try {
      state.cloudClient = SDK.createWorkBuddyCloud({
        endpoint: PUBLIC_CONFIG.endpoint,
        oauthRelayBaseUrl: PUBLIC_CONFIG.oauthRelayBaseUrl,
        publishableKey: PUBLIC_CONFIG.publishableKey
      });
      return state.cloudClient;
    } catch (e) {
      state.lastError = '云服务初始化失败：' + e.message;
      return null;
    }
  }

  async function pickCloudModel() {
    if (state.cloudModel) return state.cloudModel;
    var cloud = getCloudClient();
    if (!cloud) return null;
    try {
      var models = await cloud.llm.models.list();
      if (!models || !models.length) return null;
      var m = models.filter(function (x) { return x.disabled !== true; })[0];
      if (!m) return null;
      state.cloudModel = m;
      return m;
    } catch (e) {
      state.lastError = '模型列表获取失败：' + (e.error && e.error.message ? e.error.message : e.message);
      return null;
    }
  }

  async function* streamCloud(messages, signal) {
    var cloud = getCloudClient();
    var model = await pickCloudModel();
    if (!cloud || !model) throw new Error(state.lastError || '云服务不可用');
    yield* cloud.llm.chat.completions.create({
      model: model.id,
      messages: messages,
      stream: true,
      stream_options: { include_usage: true },
      temperature: 1,
      signal: signal
    });
  }

  /* ===========================================================================
   * 通道 ②：自定义 OpenAI 兼容端点
   * ======================================================================== */
  async function* streamCustom(messages, signal, settings) {
    var base = String(settings.apiBase || '').replace(/\/+$/, '');
    if (!base) throw new Error('未配置接口地址');
    var url = /\/chat\/completions$/.test(base) ? base : base + '/chat/completions';
    var res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (settings.apiKey || '')
      },
      body: JSON.stringify({
        model: settings.aiModel || 'gpt-4o-mini',
        messages: messages,
        stream: true,
        temperature: 0.7
      }),
      signal: signal
    });
    if (!res.ok) throw new Error('接口返回 ' + res.status + ' ' + res.statusText);
    var reader = res.body.getReader();
    var decoder = new TextDecoder('utf-8');
    var buf = '';
    while (true) {
      var chunk = await reader.read();
      if (chunk.done) break;
      buf += decoder.decode(chunk.value, { stream: true });
      var lines = buf.split('\n');
      buf = lines.pop();
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line || line.indexOf('data:') !== 0) continue;
        var payload = line.slice(5).trim();
        if (payload === '[DONE]') return;
        try {
          var json = JSON.parse(payload);
          var delta = json.choices && json.choices[0] && json.choices[0].delta;
          if (delta && delta.content) yield { choices: [{ delta: { content: delta.content } }] };
        } catch (e) { /* 忽略不完整帧 */ }
      }
    }
  }

  /* ===========================================================================
   * 通道 ③：离线知识引擎
   * ======================================================================== */
  function offlineAnswer(mode, question, ctx) {
    var lab = ctx && ctx.lab;
    var concept = ctx && ctx.concept;
    var q = String(question || '').toLowerCase();
    if (concept) return offlineConceptAnswer(mode, question, concept, lab);
    if (!lab) return '请先进入一个实验场景，或在「知识图谱」里打开一个知识点，我就可以结合当前上下文为你解答。';

    var scored = [];
    var pool = [];
    (lab.theory || []).forEach(function (t, i) { pool.push({ src: 'theory', i: i, text: t }); });
    (lab.objectives || []).forEach(function (t, i) { pool.push({ src: 'objective', i: i, text: t }); });
    (lab.problems || []).forEach(function (p, i) {
      pool.push({ src: 'problem', i: i, text: (p.q || '') + ' ' + (p.explain || '') + ' ' + (p.reference || '') });
    });
    pool.push({ src: 'scenario', text: lab.scenario || '' });
    pool.push({ src: 'brief', text: lab.brief || '' });

    var terms = extractTerms(q);
    pool.forEach(function (item) {
      var text = stripTags(item.text).toLowerCase();
      var score = 0;
      terms.forEach(function (t) {
        if (!t) return;
        var idx = text.indexOf(t);
        if (idx >= 0) score += t.length >= 2 ? 2 : 1;
      });
      if (score > 0) scored.push({ item: item, score: score });
    });
    scored.sort(function (a, b) { return b.score - a.score; });

    var head = '【' + lab.name + '】' + (lab.brief || '');
    var body = [];

    if (mode === 'hint') {
      body.push('**先别急着算，我们分三步想：**');
      body.push('1. **识别问题结构**：本实验属于「' + lab.topic + '」类问题，先问自己——决策变量是什么？目标是什么？约束是什么？');
      body.push('2. **对齐当前数据**：' + (ctx.summary ? '你目前的实验结果是：' + truncate(ctx.summary, 180) : '请先运行一次仿真获得当前数据。'));
      body.push('3. **检查最优性/可行性**：' + hintFor(lab, ctx));
      body.push('\n试着先回答上面第 1 问，我再根据你的回答给出下一步提示。');
    } else if (mode === 'diagnose') {
      body.push('**基于当前实验数据的诊断：**');
      body.push('· 当前场景参数：' + describeParams(lab, ctx.values));
      body.push('· 求解/仿真结果：' + truncate(ctx.summary || '（暂无）', 260));
      body.push('\n**建议关注以下信号：**');
      diagnoseHints(lab, ctx).forEach(function (h) { body.push('· ' + h); });
      body.push('\n**下一步可以试试：**调整左侧面板中的关键参数并观察指标变化方向，尤其注意那些使指标非线性跳变的临界点。');
    } else if (mode === 'generate') {
      body.push('**变式练习（基于当前场景生成）**');
      body.push(generateProblem(lab, ctx));
    } else {
      if (scored.length) {
        body.push('**关键知识点**');
        var used = {};
        scored.slice(0, 4).forEach(function (s) {
          if (used[s.item.text]) return;
          used[s.item.text] = 1;
          body.push('· ' + stripTags(s.item.text));
        });
      } else {
        body.push('**本实验的核心要点**');
        (lab.objectives || []).slice(0, 4).forEach(function (o) { body.push('· ' + o); });
      }
      var kbHits = conceptsForLab(lab);
      if (kbHits.length) {
        body.push('\n**本实验在知识图谱中的关联知识点**');
        kbHits.slice(0, 6).forEach(function (x) {
          body.push('· **' + x.concept.name + '**（' + ROLE_LABEL[x.role] + '）：' + stripTags(x.concept.summary));
        });
        var first = kbHits[0].concept;
        if (first.formula && first.formula.length) {
          body.push('\n其核心公式为：`' + stripTags(first.formula[0]) + '`');
        }
        body.push('> 在实验页的「知识图谱」页签中可以看到这些知识点与本实验的完整关联（核心 / 支撑 / 拓展三种角色）。');
      }
      body.push('\n**结合当前实验数据**');
      body.push(truncate(ctx.summary || '请先运行一次实验，我会结合你的数据进行讲解。', 260));
      body.push('\n> 提示：当前为离线知识库模式，回答基于系统内置的教学知识图谱。在联网环境下会自动切换到大模型通道，获得更灵活的讲解。');
    }

    return head + '\n\n' + body.join('\n');
  }

  var ROLE_LABEL = { core: '核心', support: '支撑', extend: '拓展' };

  /** 取某实验在知识图谱中声明的知识点（按 核心 → 支撑 → 拓展 排序） */
  function conceptsForLab(lab) {
    var ORg = OR;
    if (!ORg.KG || !ORg.KB) return [];
    var out = [];
    try {
      var g = ORg.KG.conceptsOfLab(lab.id);
      ['core', 'support', 'extend'].forEach(function (role) {
        (g[role] || []).forEach(function (cid) {
          var c = ORg.KB.get(cid);
          if (c) out.push({ concept: c, role: role });
        });
      });
    } catch (e) { /* 图谱未就绪时静默降级 */ }
    return out;
  }

  /* ===========================================================================
   * 通道 ③ 的知识点分支：以知识库条目为唯一事实来源作答
   * ======================================================================== */
  function offlineConceptAnswer(mode, question, concept, lab) {
    var c = concept;
    var KB = OR.KB, KG = OR.KG;
    var dom = KB ? KB.domain(c.domain) : null;
    var m = KG ? KG.mastery(c.id) : null;
    var out = [];

    out.push('【' + c.name + '】' + (dom ? dom.name + ' · ' : '') + c.summary);

    if (mode === 'hint') {
      out.push('\n**先别急着看答案，按这三步想：**');
      out.push('1. **拆定义**：把定义拆成「研究对象 + 成立前提 + 得出什么结论」三段，追问哪一段你还不确定。');
      out.push('2. **读公式**：逐个符号问「它在现实中对应什么量」，再试一个极端值（0 或无穷大）看结论是否还成立。');
      out.push('3. **对误区**：对照下面的常见误区，检查自己的理解是否踩中了其中一个。');
      if (c.hint) out.push('\n> ' + stripTags(c.hint));
      return out.join('\n');
    }

    if (mode === 'generate') {
      out.push('\n**变式练习（基于该知识点生成）**');
      out.push(generateFromConcept(c));
      return out.join('\n');
    }

    out.push('\n**定义**');
    out.push(stripTags(c.definition));

    if ((c.formula || []).length) {
      out.push('\n**核心公式**');
      c.formula.forEach(function (f) { out.push('`' + stripTags(f) + '`'); });
    }

    if ((c.keyPoints || []).length) {
      out.push('\n**关键要点**');
      c.keyPoints.forEach(function (k) { out.push('· ' + stripTags(k)); });
    }

    if ((c.mistakes || []).length) {
      out.push('\n**常见误区**');
      c.mistakes.forEach(function (x) {
        out.push('· ❌ ' + stripTags(x.m) + '\n  ✅ ' + stripTags(x.c));
      });
    }

    if (c.example) {
      out.push('\n**典型示例**');
      out.push(stripTags(c.example));
    }

    if (KG) {
      var pre = KG.prereqsOf(c.id).map(nameOf).filter(Boolean);
      var suc = KG.successorsOf(c.id).map(nameOf).filter(Boolean);
      if (pre.length || suc.length) {
        out.push('\n**知识网络**');
        if (pre.length) out.push('· 前置：' + pre.join('、'));
        if (suc.length) out.push('· 后继：' + suc.join('、'));
      }
      var labs = KG.labsOf(c.id);
      if (labs.length) {
        out.push('\n**可以用它做这些实验**');
        labs.forEach(function (x) { out.push('· ' + x.lab.name + '（' + ROLE_LABEL[x.role] + '）—— ' + x.lab.subtitle); });
      }
    }

    if (m) {
      out.push('\n**你的掌握情况**：' + m.label + '（综合得分 ' + Math.round(m.score * 100) + '）' +
        (m.labs.length ? '，来自 ' + m.labs.length + ' 个关联实验的练习与探索记录。' : '，尚未产生练习记录。'));
    }

    out.push('\n> 当前为离线知识库模式，回答直接取自系统内置的结构化知识条目。联网后会自动切换到大模型通道，获得更灵活的讲解与追问。');
    return out.join('\n');
  }

  function nameOf(id) {
    var c = OR.KB ? OR.KB.get(id) : null;
    return c ? c.name : null;
  }

  /** 基于知识点字段拼出一道变式题（离线通道使用） */
  function generateFromConcept(c) {
    var lines = [];
    lines.push('请围绕「' + c.name + '」回答下列三问：');
    lines.push('1. 用不超过三句话说明它解决的是什么类型的问题，以及成立的前提条件。');
    if ((c.formula || []).length) {
      lines.push('2. 写出核心公式 `' + stripTags(c.formula[0]) + '`，并解释每个符号的含义与单位。');
    } else {
      lines.push('2. 写出它的判定条件或计算步骤。');
    }
    if ((c.mistakes || []).length) {
      lines.push('3. 下面这个说法错在哪里：「' + stripTags(c.mistakes[0].m) + '」？');
    } else {
      lines.push('3. 举一个它在真实业务中的应用场景，并说明你会如何设置参数。');
    }
    lines.push('\n（作答后可以回到知识点详情页核对要点与误区。）');
    return lines.join('\n');
  }

  function hintFor(lab, ctx) {
    var map = {
      'linear': '检查是否所有检验数 σⱼ ≤ 0（最大化问题）；若存在正检验数，说明还能继续改进。',
      'lp': '检查是否所有检验数 σⱼ ≤ 0（最大化问题）；若存在正检验数，说明还能继续改进。',
      'transport': '检查基变量个数是否等于 m+n−1，再核对非基格检验数是否全部 ≥ 0。',
      'assignment': '检查是否存在能覆盖所有 0 元素且数量小于 n 的直线组。',
      'queue': '先算服务强度 ρ = λ/(cμ)。若 ρ ≥ 1 系统不稳定，任何平均值都无意义。',
      'inventory': '先确认是确定性模型还是随机模型：确定性用 EOQ 求导，随机用临界分位数。',
      'network': '先确认图的边权是否有方向性与负权，这决定用哪种最短路算法。',
      'pert': '先画网络图并做拓扑排序，再正推求 ES/EF、逆推求 LS/LF。',
      'monte': '先确认输入分布与输出函数，再检查样本量是否足以让置信区间收敛。',
      'dp': '先写出状态定义 f(i,w) 与转移方程，再考虑边界条件与回溯方式。'
    };
    var key = (lab.topic || '').toLowerCase();
    for (var k in map) if ((lab.id + lab.topic + lab.name).toLowerCase().indexOf(k) >= 0) return map[k];
    return '确认模型的目标函数与约束条件是否完整，边界情况（如资源为 0）是否处理。';
  }

  function diagnoseHints(lab, ctx) {
    var out = [];
    var s = ctx.summary || '';
    var m;
    if ((m = s.match(/影子价格=\[([^\]]+)\]/))) {
      var duals = m[1].split(',').map(Number);
      var mx = Math.max.apply(null, duals);
      out.push(mx > 0 ? '存在正影子价格（最大 ' + mx + '），说明至少有一项资源是瓶颈；提升该资源可直接增厚目标值。' : '所有资源影子价格为 0，当前资源约束没有起作用，可考虑削减投入。');
    }
    if ((m = s.match(/利用率=([\d.]+)/))) {
      var u = parseFloat(m[1]);
      out.push(u > 0.9 ? '系统利用率已达 ' + (u * 100).toFixed(1) + '%，处于饱和区，等待时间对到达率极度敏感，应预留冗余容量。' :
        u > 0.7 ? '利用率 ' + (u * 100).toFixed(1) + '%，处于合理区间，仍有优化空间。' :
          '利用率仅 ' + (u * 100).toFixed(1) + '%，资源闲置较多，可考虑缩减规模或加大需求。');
    }
    if ((m = s.match(/亏损概率[^\d]*([\d.]+)%/))) {
      out.push('亏损概率 ' + m[1] + '%，' + (parseFloat(m[1]) > 15 ? '偏高，建议压缩固定成本或分阶段投资。' : '处于可控范围。'));
    }
    if ((m = s.match(/Q\*=([\d.]+)/))) {
      out.push('经济订货批量 Q* = ' + m[1] + '，注意总成本曲线在 Q* 附近很平坦，参数估计的准确性比批量精度更重要。');
    }
    if ((m = s.match(/按期完工概率[^\d]*([\d.]+)/))) {
      out.push('按期完工概率 ' + m[1] + '，' + (parseFloat(m[1]) < 0.8 ? '低于常用管理阈值 80%，应压缩关键活动工期或设置时间缓冲。' : '达到可承诺水平。'));
    }
    if (!out.length) {
      out.push('请先运行一次实验，我会根据结果给出针对性诊断。');
      out.push('重点关注：目标值是否随参数单调变化？是否存在突变点（临界点）？');
    }
    out.push('建议同时观察「理论值 vs 仿真值」的偏差，偏差过大往往说明假设不成立或样本量不足。');
    return out;
  }

  function generateProblem(lab, ctx) {
    var v = ctx.values || {};
    var lines = [];
    lines.push('题干（场景：' + lab.name + '）：');
    var keys = Object.keys(v).filter(function (k) { return typeof v[k] === 'number'; });
    var perturbed = keys.slice(0, 4).map(function (k) {
      var orig = v[k];
      var factor = orig > 100 ? 1.15 : orig > 10 ? 1.2 : 1.25;
      return { key: k, from: orig, to: Number((orig * factor).toFixed(2)) };
    });
    if (perturbed.length) {
      lines.push('沿用本实验的模型结构，但把参数调整为：' +
        perturbed.map(function (p) { return '`' + p.key + '` 由 ' + p.from + ' 改为 ' + p.to; }).join('；') + '。');
    } else {
      lines.push('沿用本实验的模型结构，把关键参数整体上调 20%，求解新的最优方案。');
    }
    lines.push('');
    lines.push('请回答：');
    lines.push('① 建立（或说明）该问题的数学模型；② 求最优解及最优目标值；③ 说明最优解是否发生变化、为什么。');
    lines.push('');
    lines.push('参考答案要点：把上述参数代入原模型重新求解，观察最优基是否改变。若最优基不变，则最优解的形式保持但数值按灵敏度区间线性变化；若最优基改变，则需完整重算。');
    lines.push('评分要点：模型正确性 30%、计算过程 40%、分析与解释 30%。');
    return lines.join('\n');
  }

  function describeParams(lab, values) {
    if (!values) return '（未获取到参数）';
    var parts = [];
    Object.keys(values).slice(0, 6).forEach(function (k) {
      if (typeof values[k] === 'number' || typeof values[k] === 'string') parts.push(k + '=' + values[k]);
    });
    return parts.join('，');
  }

  function truncate(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n) + '…' : s; }
  function stripTags(s) { return String(s || '').replace(/<[^>]+>/g, ''); }
  function extractTerms(q) {
    var raw = q.replace(/[，。？！、；：（）【】《》,.?!;:()\[\]"'`]/g, ' ').split(/\s+/).filter(Boolean);
    var out = [];
    raw.forEach(function (w) {
      if (/[\u4e00-\u9fa5]/.test(w)) {
        // 中文：滑动出 2~4 字词组
        if (w.length <= 4) out.push(w);
        for (var i = 0; i <= w.length - 2; i++) out.push(w.substr(i, 2));
        for (var j = 0; j <= w.length - 3; j++) out.push(w.substr(j, 3));
      } else if (w.length >= 3) out.push(w.toLowerCase());
    });
    return out;
  }

  /* ===========================================================================
   * 统一入口
   * ======================================================================== */
  function buildMessages(mode, question, ctx) {
    var role = ROLES[mode] || ROLES.concept;
    var sys = role.system + '\n\n【当前实验场景】\n' + (ctx.prompt || '');
    var history = state.log.slice(-6).map(function (m) {
      return { role: m.role, content: m.text };
    });
    return [{ role: 'system', content: sys }].concat(history).concat([{ role: 'user', content: question || '请解释当前实验' }]);
  }

  /**
   * 发起一次问答（流式）
   * @param {string} mode     concept | hint | diagnose | generate
   * @param {string} question 用户提问
   * @param {Object} ctx      { lab, values, summary, prompt }
   * @param {Object} handlers { onStart(provider), onDelta(text), onDone(full, provider), onError(err) }
   */
  async function ask(mode, question, ctx, handlers) {
    handlers = handlers || {};
    state.mode = mode;
    state.context = ctx;
    var settings = cfg();
    var prefer = settings.aiProvider || 'cloud';
    var now = Date.now();
    if (now - state.lastCall < 900) {
      await new Promise(function (r) { setTimeout(r, 900 - (now - state.lastCall)); });
    }
    state.lastCall = Date.now();

    var messages = buildMessages(mode, question, ctx);
    var providerUsed = null;
    var full = '';

    // 通道 ① 云服务
    if (prefer === 'cloud') {
      try {
        providerUsed = 'cloud';
        handlers.onStart && handlers.onStart('cloud', (state.cloudModel && state.cloudModel.name) || '大模型');
        state.abort = new AbortController();
        for await (var chunk of streamCloud(messages, state.abort.signal)) {
          var d = chunk.choices && chunk.choices[0] && chunk.choices[0].delta;
          if (d && d.content) { full += d.content; handlers.onDelta && handlers.onDelta(d.content); }
        }
        if (full.trim()) { done(); return full; }
        throw new Error('空响应');
      } catch (e) {
        state.lastError = describeError(e);
        if (full.trim()) { done(); return full; }   // 流中断但已有内容
        providerUsed = null;
      }
    }

    // 通道 ② 自定义端点（当首选通道为 custom，或首选 cloud 但云服务不可用时级联）
    if (!providerUsed && settings.apiBase && (prefer === 'custom' || prefer === 'cloud')) {
      try {
        providerUsed = 'custom';
        handlers.onStart && handlers.onStart('custom', settings.aiModel || '自定义模型');
        state.abort = new AbortController();
        for await (var c2 of streamCustom(messages, state.abort.signal, settings)) {
          var d2 = c2.choices && c2.choices[0] && c2.choices[0].delta;
          if (d2 && d2.content) { full += d2.content; handlers.onDelta && handlers.onDelta(d2.content); }
        }
        if (full.trim()) { done(); return full; }
        throw new Error('空响应');
      } catch (e) {
        state.lastError = describeError(e);
        if (full.trim()) { done(); return full; }
        providerUsed = null;
      }
    }

    // 通道 ③ 离线知识库（流式模拟输出，保持自然节奏）
    providerUsed = 'offline';
    handlers.onStart && handlers.onStart('offline', '本地知识引擎');
    var text = offlineAnswer(mode, question, ctx);
    var step = 6;
    for (var i = 0; i < text.length; i += step) {
      var piece = text.slice(i, i + step);
      full += piece;
      handlers.onDelta && handlers.onDelta(piece);
      await new Promise(function (r) { setTimeout(r, 12); });
    }
    done();
    return full;

    function done() {
      state.usedProvider = providerUsed;   // 供 status().provider 汇报实际生效通道
      state.provider = providerUsed;
      state.log.push({ role: 'user', text: question || '（分析当前实验）' });
      state.log.push({ role: 'assistant', text: full });
      if (state.log.length > 24) state.log = state.log.slice(-24);
      handlers.onDone && handlers.onDone(full, providerUsed);
    }
  }

  function describeError(e) {
    if (!e) return '未知错误';
    if (e.error && e.error.code) {
      var c = e.error.code;
      if (c.indexOf('auth_') === 0) return '云服务鉴权失败（Origin 不匹配）。请通过部署后的正式域名访问，或切换到自定义接口 / 离线模式。';
      if (c.indexOf('quota_') === 0) return '云服务额度已用尽或触发限流，请稍后重试。';
      if (c.indexOf('gateway_') === 0 || c.indexOf('model_') === 0) return '模型服务暂时不可用，已自动降级为离线知识引擎。';
      return '调用失败（' + c + '）：' + (e.error.message || '');
    }
    if (e.name === 'AbortError') return '用户中止';
    return e.message || String(e);
  }

  function stop() {
    if (state.abort) { try { state.abort.abort(); } catch (e) { } state.abort = null; }
  }

  /**
   * 计算「当前实际生效」的推理通道。
   * 与 ask() 的级联降级顺序保持一致：云服务 → 自定义端点 → 离线知识引擎。
   */
  function effectiveProvider() {
    var settings = cfg();
    var prefer = settings.aiProvider || 'cloud';
    var sdkReady = !!(global.WorkBuddyCloud && typeof global.WorkBuddyCloud.createWorkBuddyCloud === 'function');
    if (prefer === 'custom') return settings.apiBase ? 'custom' : 'offline';
    if (prefer === 'cloud') {
      if (sdkReady) return 'cloud';
      if (settings.apiBase) return 'custom';   // 云 SDK 缺失时级联到自定义端点
      return 'offline';
    }
    return 'offline';
  }

  function status() {
    var settings = cfg();
    var prefer = settings.aiProvider || 'cloud';
    var sdkReady = !!(global.WorkBuddyCloud && typeof global.WorkBuddyCloud.createWorkBuddyCloud === 'function');
    return {
      /* provider：界面直接消费的「当前实际通道」；优先报告最近一次真实调用结果 */
      provider: state.usedProvider || effectiveProvider(),
      prefer: prefer,
      sdkReady: sdkReady,
      cloudReady: prefer === 'cloud' && sdkReady,
      customReady: prefer === 'custom' && !!settings.apiBase,
      modelName: state.cloudModel ? (state.cloudModel.name || state.cloudModel.id) : null,
      lastError: state.lastError
    };
  }

  /**
   * 一次性补全（非流式），供结构化任务使用（如 AI 建模的参数解析）。
   * 与 ask() 保持同一套降级顺序，但不写对话日志、不做教学角色包装。
   * @returns {Promise<{text:string, provider:'cloud'|'custom'|'offline'}>}
   */
  async function complete(messages) {
    var settings = cfg();
    var prefer = settings.aiProvider || 'cloud';

    if (prefer === 'cloud') {
      try {
        var text = '';
        var ac = new AbortController();
        for await (var chunk of streamCloud(messages, ac.signal)) {
          var d = chunk.choices && chunk.choices[0] && chunk.choices[0].delta;
          if (d && d.content) text += d.content;
        }
        if (text.trim()) { state.usedProvider = 'cloud'; return { text: text, provider: 'cloud' }; }
      } catch (e) {
        state.lastError = describeError(e);
      }
    }

    if (settings.apiBase) {
      try {
        var t2 = '';
        var ac2 = new AbortController();
        for await (var c2 of streamCustom(messages, ac2.signal, settings)) {
          var d2 = c2.choices && c2.choices[0] && c2.choices[0].delta;
          if (d2 && d2.content) t2 += d2.content;
        }
        if (t2.trim()) { state.usedProvider = 'custom'; return { text: t2, provider: 'custom' }; }
      } catch (e2) {
        state.lastError = describeError(e2);
      }
    }

    return { text: '', provider: 'offline' };
  }

  OR.AI = {
    ask: ask, stop: stop, status: status, ROLES: ROLES, complete: complete,
    clearLog: function () { state.log = []; },
    config: PUBLIC_CONFIG,
    _offline: offlineAnswer,
    _terms: extractTerms
  };
})(typeof window !== 'undefined' ? window : globalThis);
