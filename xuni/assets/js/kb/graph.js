/* =============================================================================
 * OR-SimLab · 知识图谱引擎（Knowledge Graph）
 * -----------------------------------------------------------------------------
 * 把「知识库知识点」与「实验场景」统一建模为一张有向/无向混合图：
 *
 *   概念节点（concept）      来自 OR.KB
 *   实验节点（lab）          来自 OR.Lab 注册表，id 加 'lab:' 前缀避免冲突
 *   前置边（prereq）         概念 → 概念，有向，语义为「必须先掌握」
 *   相关边（related）        概念 ↔ 概念，无向
 *   归属边（lab）            概念 → 实验，带 role = core | support | extend
 *
 * 在此基础上提供：拓扑序与环检测、最短路径、邻域与子图提取、三种布局算法、
 * SVG 渲染与交互绑定、掌握度模型与覆盖率统计。
 *
 * 本模块不依赖 DOM 即可在 Node.js 中运行（布局与统计部分），
 * 渲染部分需要 DOM 时由视图层调用。
 * ========================================================================== */
(function (global) {
  'use strict';
  var OR = global.OR = global.OR || {};

  /* ===========================================================================
   * 一、建模
   * ======================================================================== */
  var nodes = [];          // 全部节点
  var edges = [];          // 全部边
  var nodeById = {};       // id -> node
  var adjMap = {};         // id -> [{ id, edge, dir }]
  var built = false;
  var missing = [];        // 构建期发现的悬空引用（供自检使用）

  var TONE_COLOR = {
    brand: '#2b5cff', teal: '#0d9488', violet: '#6d4aff',
    amber: '#d97706', rose: '#e11d48', green: '#059669'
  };

  function addNode(n) {
    if (nodeById[n.id]) return nodeById[n.id];
    nodes.push(n); nodeById[n.id] = n; adjMap[n.id] = [];
    return n;
  }

  function addEdge(from, to, type, extra) {
    if (!nodeById[from] || !nodeById[to]) {
      missing.push(type + ' 边引用了不存在的节点：' + from + ' → ' + to);
      return null;
    }
    var e = Object.assign({ from: from, to: to, type: type }, extra || {});
    edges.push(e);
    var undirected = (type === 'related' || type === 'lab');
    adjMap[from].push({ id: to, edge: e, dir: 'out' });
    adjMap[to].push({ id: from, edge: e, dir: undirected ? 'both' : 'in' });
    return e;
  }

  function build() {
    if (built) return;
    built = true;
    nodes = []; edges = []; nodeById = {}; adjMap = {}; missing = [];

    var KB = OR.KB, Lab = OR.Lab;
    if (!KB) { console.warn('[KG] 知识库未加载'); return; }

    /* --- 概念节点 --- */
    KB.all().forEach(function (c) {
      addNode({
        id: c.id, type: 'concept', name: c.name, domain: c.domain,
        level: c.level, bloom: c.bloom, summary: c.summary, ref: c
      });
    });

    /* --- 实验节点 --- */
    if (Lab) Lab.all().forEach(function (l) {
      addNode({
        id: 'lab:' + l.id, type: 'lab', name: l.name, domain: l.domainHint || null,
        level: l.level, topic: l.topic, tone: l.tone || 'brand', ref: l
      });
    });

    /* --- 概念之间的关系边 --- */
    KB.all().forEach(function (c) {
      (c.prereq || []).forEach(function (p) {
        if (!nodeById[p]) { missing.push('前置引用不存在：' + c.id + ' ← ' + p); return; }
        addEdge(p, c.id, 'prereq');
      });
      (c.related || []).forEach(function (r) {
        if (!nodeById[r]) { missing.push('相关引用不存在：' + c.id + ' ↔ ' + r); return; }
        if (c.id < r) addEdge(c.id, r, 'related');   // 去重：每对无向边只存一次
      });
    });

    /* --- 概念与实验的归属边 --- */
    if (Lab) Lab.all().forEach(function (l) {
      var k = l.knowledge;
      if (!k) { missing.push('实验缺少 knowledge 声明：' + l.id); return; }
      ['core', 'support', 'extend'].forEach(function (role) {
        (k[role] || []).forEach(function (cid) {
          if (!nodeById[cid]) { missing.push('实验 ' + l.id + ' 的 ' + role + ' 引用了不存在的知识点：' + cid); return; }
          addEdge(cid, 'lab:' + l.id, 'lab', { role: role });
        });
      });
    });
  }

  /* ===========================================================================
   * 二、基础查询
   * ======================================================================== */
  function allNodes() { build(); return nodes; }
  function allEdges() { build(); return edges; }
  /**
   * 按 id 取节点。
   * 裸 id（不含 lab: 前缀）优先按「知识点」解析——知识点 id 是权威命名空间，
   * 实验节点必须带 lab: 前缀访问。这样一个知识点与同名实验共存时不会产生歧义
   * （例如知识点 lp-blending 与实验 lp-blending 同时存在）。
   */
  function node(id) {
    build();
    if (nodeById[id]) return nodeById[id];
    if (id && id.indexOf('lab:') !== 0 && nodeById['lab:' + id]) return nodeById['lab:' + id];
    return null;
  }
  function concepts() { build(); return nodes.filter(function (n) { return n.type === 'concept'; }); }
  function labNodes() { build(); return nodes.filter(function (n) { return n.type === 'lab'; }); }

  function pick(filter) {
    build();
    filter = filter || {};
    return nodes.filter(function (n) {
      if (filter.type && n.type !== filter.type) return false;
      if (filter.domain && n.domain !== filter.domain) return false;
      if (filter.level && n.level !== filter.level) return false;
      if (filter.ids && filter.ids.indexOf(n.id) < 0) return false;
      return true;
    });
  }

  function edgesBetween(idSet, types) {
    build();
    return edges.filter(function (e) {
      if (types && types.indexOf(e.type) < 0) return false;
      return idSet[e.from] && idSet[e.to];
    });
  }

  function adjacency(id) { build(); return (adjMap[id] || []).slice(); }
  function degree(id) { return adjacency(id).length; }

  function neighboursOf(id, edgeType) {
    var out = [], seen = {};
    adjacency(id).forEach(function (a) {
      if (edgeType && a.edge.type !== edgeType) return;
      if (seen[a.id]) return;
      seen[a.id] = 1;
      out.push(a.id);
    });
    return out;
  }

  /** 直接前置概念（仅 prereq 边，且方向指向本节点） */
  function prereqsOf(id) {
    var out = [];
    adjacency(id).forEach(function (a) {
      if (a.edge.type !== 'prereq') return;
      if (a.edge.to === id) out.push(a.edge.from);
    });
    return out;
  }
  /** 直接后继概念 */
  function successorsOf(id) {
    var out = [];
    adjacency(id).forEach(function (a) {
      if (a.edge.type !== 'prereq') return;
      if (a.edge.from === id) out.push(a.edge.to);
    });
    return out;
  }
  function relatedOf(id) { return neighboursOf(id, 'related'); }

  /** 某知识点关联的实验（含角色） */
  function labsOf(conceptId) {
    var out = [];
    adjacency(conceptId).forEach(function (a) {
      if (a.edge.type !== 'lab') return;
      var labId = a.edge.to === conceptId ? a.edge.from : a.edge.to;
      if (labId.indexOf('lab:') !== 0) return;
      if (!out.some(function (x) { return x.lab.id === labId.slice(4); })) {
        out.push({ lab: node(labId).ref, role: a.edge.role });
      }
    });
    return out;
  }

  /** 某实验声明的知识点分组 */
  function conceptsOfLab(labId) {
    build();
    var key = 'lab:' + (labId.indexOf('lab:') === 0 ? labId.slice(4) : labId);
    var res = { core: [], support: [], extend: [] };
    if (!nodeById[key]) return res;
    adjacency(key).forEach(function (a) {
      if (a.edge.type !== 'lab') return;
      var cid = a.edge.to === key ? a.edge.from : a.edge.to;
      if (cid.indexOf('lab:') === 0) return;
      var role = a.edge.role || 'core';
      if (res[role] && res[role].indexOf(cid) < 0) res[role].push(cid);
    });
    return res;
  }

  /** 全部传递前置（去重，按拓扑序由远及近） */
  function prereqChain(id) {
    build();
    var seen = {}, order = [];
    (function walk(x) {
      prereqsOf(x).forEach(function (p) {
        if (seen[p]) return;
        seen[p] = 1; walk(p); order.push(p);
      });
    })(id);
    return order;
  }
  /** 全部传递后继 */
  function successorChain(id) {
    build();
    var seen = {}, order = [];
    (function walk(x) {
      successorsOf(x).forEach(function (s) {
        if (seen[s]) return;
        seen[s] = 1; walk(s); order.push(s);
      });
    })(id);
    return order;
  }

  /* ===========================================================================
   * 三、结构与路径
   * ======================================================================== */
  /** 拓扑排序（仅考虑 prereq 有向边），返回 { order, ok, cycle } */
  function topoOrder(ids) {
    build();
    var pool = ids ? nodes.filter(function (n) { return ids.indexOf(n.id) >= 0; }) : nodes;
    var inDeg = {}, index = {};
    pool.forEach(function (n) { inDeg[n.id] = 0; index[n.id] = n; });
    edges.forEach(function (e) {
      if (e.type !== 'prereq') return;
      if (index[e.from] && index[e.to]) inDeg[e.to]++;
    });
    var queue = pool.filter(function (n) { return inDeg[n.id] === 0; }).map(function (n) { return n.id; });
    var order = [];
    while (queue.length) {
      var u = queue.shift();
      order.push(u);
      successorsOf(u).forEach(function (v) {
        if (!index[v]) return;
        if (--inDeg[v] === 0) queue.push(v);
      });
    }
    var ok = order.length === pool.length;
    return { order: order, ok: ok, missing: ok ? [] : pool.filter(function (n) { return order.indexOf(n.id) < 0; }).map(function (n) { return n.id; }) };
  }

  /** 环检测：返回图中是否存在前置环及其一条示例回路 */
  function hasCycle() {
    var t = topoOrder();
    if (t.ok) return { cyclic: false, cycle: [] };
    /* 在当前残留节点中找一条回路 */
    var rest = {}, path = [], found = null;
    t.missing.forEach(function (id) { rest[id] = 1; });
    var visited = {};
    function dfs(u, stack) {
      if (found) return;
      if (stack.indexOf(u) >= 0) { found = stack.slice(stack.indexOf(u)).concat([u]); return; }
      if (visited[u]) return;
      visited[u] = 1;
      successorsOf(u).forEach(function (v) { if (rest[v]) dfs(v, stack.concat([u])); });
    }
    t.missing.forEach(function (id) { if (!found) dfs(id, []); });
    return { cyclic: true, cycle: found || t.missing };
  }

  /** 无向最短路径（BFS），可限定边类型 */
  function shortestPath(a, b, types) {
    build();
    if (!nodeById[a] || !nodeById[b]) return null;
    if (a === b) return [a];
    var prev = {}, q = [a], seen = {};
    seen[a] = 1;
    while (q.length) {
      var u = q.shift();
      var ns = neighboursOf(u);
      for (var i = 0; i < ns.length; i++) {
        var v = ns[i];
        if (seen[v]) continue;
        if (types) {
          var okEdge = adjacency(u).some(function (x) { return x.id === v && types.indexOf(x.edge.type) >= 0; });
          if (!okEdge) continue;
        }
        seen[v] = 1; prev[v] = u;
        if (v === b) {
          var path = [b], cur = b;
          while (prev[cur] !== undefined) { cur = prev[cur]; path.unshift(cur); }
          return path;
        }
        q.push(v);
      }
    }
    return null;
  }

  /** 以 id 为中心、半径为 r 的邻域子图 */
  function neighborhood(id, r) {
    build();
    r = r === undefined ? 1 : r;
    var keep = {}; keep[id] = 1;
    var frontier = [id];
    for (var step = 0; step < r; step++) {
      var next = [];
      frontier.forEach(function (u) {
        neighboursOf(u).forEach(function (v) { if (!keep[v]) { keep[v] = 1; next.push(v); } });
      });
      frontier = next;
    }
    return subgraphOf(Object.keys(keep), id);
  }

  /** 由 id 集合诱导的子图 */
  function subgraphOf(ids, center) {
    build();
    var set = {};
    ids.forEach(function (i) { set[i] = 1; });
    return {
      nodes: nodes.filter(function (n) { return set[n.id]; }),
      edges: edgesBetween(set),
      center: center || null
    };
  }

  /** 以某实验为中心的知识子图（三层：support → core → extend） */
  function labSubgraph(labId) {
    build();
    var key = 'lab:' + (labId.indexOf('lab:') === 0 ? labId.slice(4) : labId);
    var g = conceptsOfLab(labId);
    var ids = [key];
    /* 核心知识点连同它们的直接前置一起纳入，使前置链完整可见 */
    g.core.forEach(function (c) { ids.push(c); });
    g.support.forEach(function (c) { ids.push(c); });
    g.extend.forEach(function (c) { ids.push(c); });
    g.core.forEach(function (c) {
      prereqChain(c).forEach(function (p) { if (ids.indexOf(p) < 0) ids.push(p); });
    });
    var sub = subgraphOf(ids, key);
    sub.groups = g;
    return sub;
  }

  /** 某知识点的局部子图：自身 + 前置链 + 后继 + 相关 + 关联实验 */
  function conceptSubgraph(conceptId, opts) {
    build();
    opts = opts || {};
    var ids = [conceptId];
    var g = OR.KB ? OR.KB.get(conceptId) : null;
    if (g) {
      (g.prereq || []).forEach(function (p) { ids.push(p); });
      (g.related || []).forEach(function (r) { ids.push(r); });
    }
    successorsOf(conceptId).forEach(function (s) { ids.push(s); });
    if (opts.withLabs !== false) {
      labsOf(conceptId).forEach(function (x) { ids.push('lab:' + x.lab.id); });
    }
    if (opts.chain) {
      prereqChain(conceptId).forEach(function (p) { ids.push(p); });
    }
    var uniq = ids.filter(function (v, i) { return ids.indexOf(v) === i; });
    return subgraphOf(uniq, conceptId);
  }

  /* ===========================================================================
   * 四、掌握度与覆盖率
   * ======================================================================== */
  var MASTERY_LABEL = ['未学习', '初步了解', '基本掌握', '熟练应用'];
  var MASTERY_COLOR = ['#94a3b8', '#f59e0b', '#14b8a6', '#10b981'];

  /**
   * 知识点掌握度：由关联实验的答题正确率与实验探索次数综合判定。
   * 数据来源为本地学习档案（OR.Store），因此无需修改题库结构即可自动计算。
   */
  function mastery(conceptId) {
    build();
    if (!OR.Store) return { level: 0, label: MASTERY_LABEL[0], score: 0, labs: [], manual: false };
    var labs = labsOf(conceptId);
    var total = 0, solved = 0, runs = 0, touched = false, details = [];
    labs.forEach(function (x) {
      var n = (x.lab.problems || []).length;
      var p = OR.Store.getProgress(x.lab.id);
      var s = Math.min(p.solved || 0, n);
      total += n; solved += s; runs += p.runs || 0;
      if (p.runs || p.solved) touched = true;
      details.push({ lab: x.lab, role: x.role, solved: s, total: n, runs: p.runs || 0 });
    });
    var rate = total ? solved / total : 0;
    var manual = !!OR.Store.get('kb.mastered.' + conceptId, false);
    var level;
    if (manual) level = 3;
    else if (!touched || solved === 0) level = 0;
    else if (rate < 0.6) level = 1;
    else if (rate < 0.9) level = 2;
    else level = 3;
    /* 综合得分：正确率 0.75 权重 + 实验探索 0.25 权重 */
    var explore = Math.min(1, runs / 12);
    var score = rate * 0.75 + explore * 0.25;
    return {
      level: level, label: MASTERY_LABEL[level], color: MASTERY_COLOR[level],
      score: Math.round(score * 1000) / 1000,
      rate: Math.round(rate * 1000) / 1000,
      runs: runs, manual: manual, labs: details
    };
  }

  function setMastered(conceptId, flag) {
    if (!OR.Store) return;
    OR.Store.set('kb.mastered.' + conceptId, !!flag);
  }

  /** 全局覆盖率统计 */
  function coverage() {
    build();
    var list = concepts();
    var acc = { 0: 0, 1: 0, 2: 0, 3: 0 };
    var byDomain = {};
    var details = {};
    list.forEach(function (n) {
      var m = mastery(n.id);
      acc[m.level]++;
      details[n.id] = m;
      if (!byDomain[n.domain]) byDomain[n.domain] = { total: 0, learned: 0, mastered: 0, sum: 0 };
      var d = byDomain[n.domain];
      d.total++;
      if (m.level > 0) d.learned++;
      if (m.level >= 2) d.mastered++;
      d.sum += m.score;
    });
    var learned = acc[1] + acc[2] + acc[3];
    var mastered = acc[2] + acc[3];
    Object.keys(byDomain).forEach(function (k) {
      var d = byDomain[k];
      d.learnedRate = d.total ? d.learned / d.total : 0;
      d.masteredRate = d.total ? d.mastered / d.total : 0;
      d.avgScore = d.total ? d.sum / d.total : 0;
    });
    return {
      total: list.length,
      touched: learned,
      mastered: mastered,
      rate: list.length ? learned / list.length : 0,
      masteryRate: list.length ? mastered / list.length : 0,
      byLevel: acc,
      byDomain: byDomain,
      details: details
    };
  }

  /** 领域维度统计 */
  function domainStats() {
    build();
    var KB = OR.KB;
    var out = [];
    (KB ? KB.domains() : []).forEach(function (d) {
      var cs = concepts().filter(function (n) { return n.domain === d.id; });
      var labs = labNodes().filter(function (n) { return labCoversDomain(n.ref, d.id); });
      out.push({
        domain: d, concepts: cs, count: cs.length,
        labs: labs, labCount: labs.length,
        color: TONE_COLOR[d.tone] || TONE_COLOR.brand
      });
    });
    return out;
  }

  function labCoversDomain(lab, domainId) {
    var k = lab.knowledge;
    if (!k) return false;
    var ids = [].concat(k.core || [], k.support || [], k.extend || []);
    return ids.some(function (c) { var g = OR.KB.get(c); return g && g.domain === domainId; });
  }

  /** 图谱总体统计 */
  function stats() {
    build();
    var cs = concepts(), ls = labNodes();
    var byType = { prereq: 0, related: 0, lab: 0 };
    edges.forEach(function (e) { byType[e.type]++; });
    var depths = cs.map(function (n) { return prereqChain(n.id).length; });
    var degs = cs.map(function (n) { return degree(n.id); });
    return {
      concepts: cs.length, labs: ls.length, nodes: nodes.length, edges: edges.length,
      byType: byType, missing: missing.slice(),
      maxDepth: depths.length ? Math.max.apply(null, depths) : 0,
      avgDepth: depths.length ? Math.round(depths.reduce(function (a, b) { return a + b; }, 0) / depths.length * 100) / 100 : 0,
      maxDegree: degs.length ? Math.max.apply(null, degs) : 0,
      avgDegree: degs.length ? Math.round(degs.reduce(function (a, b) { return a + b; }, 0) / degs.length * 100) / 100 : 0,
      orphanConcepts: cs.filter(function (n) { return degree(n.id) === 0; }).map(function (n) { return n.id; }),
      unlinkedLabs: ls.filter(function (n) { return degree(n.id) <= 1; }).map(function (n) { return n.id.slice(4); })
    };
  }

  /* ===========================================================================
   * 五、布局算法（返回归一化坐标 0..1，可直接用于 SVG 缩放）
   * ======================================================================== */
  function orderKey(n) {
    var d = OR.KB && OR.KB.domain(n.domain);
    return ((d ? d.order : 99) * 1000) + n.level * 10;
  }

  function layoutLayered(list) {
    /* 按认知难度分三列，列内按「领域顺序 → 领域内拓扑序」排布 */
    var pos = {};
    var topo = topoOrder(list.map(function (n) { return n.id; })).order;
    var topoIdx = {}; topo.forEach(function (id, i) { topoIdx[id] = i; });
    [1, 2, 3].forEach(function (lv, ci) {
      var col = list.filter(function (n) { return (n.level || 1) === lv; });
      col.sort(function (a, b) {
        var ka = orderKey(a), kb = orderKey(b);
        if (ka !== kb) return ka - kb;
        return (topoIdx[a.id] || 0) - (topoIdx[b.id] || 0);
      });
      var x = 0.13 + ci * 0.37;
      var n = col.length;
      col.forEach(function (nd, i) {
        var y = n <= 1 ? 0.5 : 0.05 + (0.90 * i) / (n - 1);
        pos[nd.id] = { x: x, y: y };
      });
    });
    return pos;
  }

  function layoutCluster(list) {
    /* 每个领域一个圆簇，簇心沿大圆均匀分布 */
    var pos = {};
    var groups = {};
    list.forEach(function (n) { (groups[n.domain] = groups[n.domain] || []).push(n); });
    var keys = Object.keys(groups);
    /* 未归属领域的节点（如实验节点）单独成簇 */
    var others = groups[null] || groups[undefined];
    delete groups[null]; delete groups[undefined];
    keys = Object.keys(groups);
    var total = keys.length + (others && others.length ? 1 : 0);
    var R = 0.34;
    var idx = 0;
    keys.forEach(function (k) {
      var ang = (2 * Math.PI * idx) / Math.max(1, total) - Math.PI / 2;
      var cx = 0.5 + R * Math.cos(ang), cy = 0.5 + R * Math.sin(ang);
      var members = groups[k];
      var rr = Math.min(0.155, 0.035 + members.length * 0.011);
      members.forEach(function (n, i) {
        var a = (2 * Math.PI * i) / members.length;
        var ring = members.length > 8 ? 0.62 + 0.38 * ((i % 2) ? 1 : 0.55) : 1;
        pos[n.id] = {
          x: clamp(cx + rr * ring * Math.cos(a), 0.03, 0.97),
          y: clamp(cy + rr * ring * Math.sin(a) * 1.25, 0.04, 0.96)
        };
      });
      idx++;
    });
    if (others && others.length) {
      var ang2 = (2 * Math.PI * idx) / Math.max(1, total) - Math.PI / 2;
      var cx2 = 0.5 + R * Math.cos(ang2), cy2 = 0.5 + R * Math.sin(ang2);
      others.forEach(function (n, i) {
        var a = (2 * Math.PI * i) / others.length;
        pos[n.id] = { x: clamp(cx2 + 0.13 * Math.cos(a), 0.03, 0.97), y: clamp(cy2 + 0.14 * Math.sin(a), 0.04, 0.96) };
      });
    }
    return pos;
  }

  /** Fruchterman-Reingold 力导向布局（以领域聚簇结果作为初值，收敛更快且更美观） */
  function layoutForce(list, edgeList) {
    var pos = layoutCluster(list);
    var n = list.length;
    if (n < 2) return pos;
    var ids = list.map(function (x) { return x.id; });
    var idx = {}; ids.forEach(function (id, i) { idx[id] = i; });
    var P = ids.map(function (id) { return { x: pos[id].x, y: pos[id].y }; });
    var k = Math.sqrt(1 / n) * 0.95;          // 理想边长
    var temp = 0.12;
    var links = edgeList.filter(function (e) { return idx[e.from] !== undefined && idx[e.to] !== undefined; });

    for (var it = 0; it < 320; it++) {
      var disp = ids.map(function () { return { x: 0, y: 0 }; });
      /* 斥力 */
      for (var i = 0; i < n; i++) {
        for (var j = i + 1; j < n; j++) {
          var dx = P[i].x - P[j].x, dy = P[i].y - P[j].y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 1e-9) { dx = (Math.random() - 0.5) * 1e-3; dy = (Math.random() - 0.5) * 1e-3; d2 = dx * dx + dy * dy; }
          var d = Math.sqrt(d2);
          var f = (k * k) / d;
          var ux = dx / d, uy = dy / d;
          disp[i].x += ux * f; disp[i].y += uy * f;
          disp[j].x -= ux * f; disp[j].y -= uy * f;
        }
      }
      /* 引力（沿边） */
      links.forEach(function (e) {
        var a = idx[e.from], b = idx[e.to];
        var dx = P[a].x - P[b].x, dy = P[a].y - P[b].y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1e-6;
        var w = e.type === 'prereq' ? 1.25 : (e.type === 'lab' ? 1.05 : 0.75);
        var f = (d * d / k) * w;
        var ux = dx / d, uy = dy / d;
        disp[a].x -= ux * f; disp[a].y -= uy * f;
        disp[b].x += ux * f; disp[b].y += uy * f;
      });
      /* 有限位移 + 降温 */
      for (i = 0; i < n; i++) {
        var dl = Math.hypot(disp[i].x, disp[i].y) || 1e-9;
        var lim = Math.min(dl, temp);
        P[i].x = clamp(P[i].x + (disp[i].x / dl) * lim, 0.035, 0.965);
        P[i].y = clamp(P[i].y + (disp[i].y / dl) * lim, 0.045, 0.955);
      }
      temp *= 0.985;
    }
    ids.forEach(function (id, i) { pos[id] = { x: P[i].x, y: P[i].y }; });
    return pos;
  }

  /** 以某节点为中心的径向布局 */
  function layoutFocus(list, centerId) {
    var pos = {};
    pos[centerId] = { x: 0.5, y: 0.5 };
    var rest = list.filter(function (n) { return n.id !== centerId; });
    var l1 = [], l2 = [];
    rest.forEach(function (n) {
      var d = shortestPath(centerId, n.id);
      var dist = d ? d.length - 1 : 99;
      if (dist <= 1) l1.push(n); else l2.push(n);
    });
    /* placed 必须在 ring 调用之前初始化（函数声明会提升，变量声明不会） */
    var placed = {};
    function ring(arr, r) {
      arr.forEach(function (n, i) {
        if (placed[n.id]) return;
        placed[n.id] = 1;
        var a = (2 * Math.PI * i) / Math.max(1, arr.length) - Math.PI / 2;
        pos[n.id] = { x: clamp(0.5 + r * Math.cos(a) * 1.25, 0.04, 0.96), y: clamp(0.5 + r * Math.sin(a), 0.05, 0.95) };
      });
    }
    ring(l1, 0.27);
    ring(l2, 0.44);
    rest.forEach(function (n) { if (!pos[n.id]) pos[n.id] = { x: 0.5, y: 0.5 }; });
    return pos;
  }

  /** 三层布局：support → core → extend（用于实验的知识图谱页签） */
  function layoutTiers(list, groups) {
    var pos = {};
    var cols = [
      { ids: groups.support || [], x: 0.13 },
      { ids: groups.core || [], x: 0.5 },
      { ids: groups.extend || [], x: 0.87 }
    ];
    var extras = list.filter(function (n) {
      return n.type !== 'lab' &&
        cols[0].ids.indexOf(n.id) < 0 && cols[1].ids.indexOf(n.id) < 0 && cols[2].ids.indexOf(n.id) < 0;
    });
    /* 未声明的间接前置放到最左侧列 */
    if (extras.length) cols[0].ids = extras.concat(cols[0].ids);
    cols.forEach(function (c) {
      var ids = c.ids.filter(function (id) { return list.some(function (n) { return n.id === id; }); });
      ids.forEach(function (id, i) {
        var y = ids.length <= 1 ? 0.5 : 0.08 + (0.84 * i) / (ids.length - 1);
        pos[id] = { x: c.x, y: y };
      });
    });
    list.forEach(function (n) {
      if (pos[n.id]) return;
      if (n.type === 'lab') { pos[n.id] = { x: 0.5, y: 0.06 }; return; }
      pos[n.id] = { x: 0.5, y: 0.5 };
    });
    return pos;
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /** 统一布局入口 */
  function layout(list, opts) {
    build();
    opts = opts || {};
    var kind = opts.kind || 'cluster';
    var edgeList = opts.edges || edgesBetween(toSet(list.map(function (n) { return n.id; })));
    var pos;
    if (kind === 'layered') pos = layoutLayered(list);
    else if (kind === 'force') pos = layoutForce(list, edgeList);
    else if (kind === 'focus') pos = layoutFocus(list, opts.center);
    else if (kind === 'tiers') pos = layoutTiers(list, opts.groups || {});
    else pos = layoutCluster(list);
    return pos;
  }

  function toSet(arr) { var s = {}; arr.forEach(function (v) { s[v] = 1; }); return s; }
  function fromSet(s) { return Object.keys(s); }

  /* ===========================================================================
   * 六、SVG 渲染
   * ======================================================================== */
  var SVG_NS = 'http://www.w3.org/2000/svg';

  /**
   * 渲染知识图谱为 SVG 字符串。
   * opts:
   *   width / height      画布尺寸（默认 1180 × 660）
   *   kind                布局类型
   *   center              聚焦节点（focus / tiers 布局使用）
   *   groups              三层分组（tiers 布局使用）
   *   showLab            是否显示实验节点（默认 true）
   *   showRelated        是否绘制 related 边（默认 true）
   *   labels             'always' | 'auto' | 'none'
   *   masteryMap         外部传入的掌握度映射（缺省时实时计算）
   *   activeId           高亮节点
   *   onNode             节点附加信息（返回 { badge, tone } 等）
   */
  function renderSVG(sub, opts) {
    build();
    opts = opts || {};
    var W = opts.width || 1180, H = opts.height || 660;
    var pad = opts.pad === undefined ? 26 : opts.pad;
    var list = sub.nodes.slice();
    if (opts.showLab === false) list = list.filter(function (n) { return n.type !== 'lab'; });
    var idSet = toSet(list.map(function (n) { return n.id; }));
    var edgeList = (sub.edges || []).filter(function (e) {
      if (!idSet[e.from] || !idSet[e.to]) return false;
      if (!opts.showRelated && e.type === 'related') return false;
      if (!opts.showLab && e.type === 'lab') return false;
      return true;
    });

    var pos = layout(list, {
      kind: opts.kind || 'cluster', center: opts.center,
      groups: opts.groups, edges: edgeList
    });

    var px = {}, py = {};
    list.forEach(function (n) {
      var p = pos[n.id] || { x: 0.5, y: 0.5 };
      px[n.id] = pad + p.x * (W - 2 * pad);
      py[n.id] = pad + p.y * (H - 2 * pad);
    });

    var deg = {};
    list.forEach(function (n) { deg[n.id] = degree(n.id); });
    var big = opts.kind === 'tiers' || opts.kind === 'focus';

    function radiusOf(n) {
      if (n.type === 'lab') return big ? 27 : 13;
      if (big) return 20 + Math.min(6, deg[n.id] * 0.7);
      return 7 + Math.min(6, deg[n.id] * 0.55);
    }

    var out = [];
    out.push('<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="' + SVG_NS + '" class="kg-svg" ' +
      'preserveAspectRatio="xMidYMid meet" role="img" aria-label="知识图谱">');
    out.push('<defs>' +
      '<marker id="kg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">' +
      '<path d="M 0 0 L 10 5 L 0 10 z" fill="#aab6cc"/></marker>' +
      '<marker id="kg-arrow-hi" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
      '<path d="M 0 0 L 10 5 L 0 10 z" fill="#2b5cff"/></marker>' +
      '</defs>');

    /* ---- 边 ---- */
    out.push('<g class="kg-edges">');
    edgeList.forEach(function (e, i) {
      var a = px[e.from], b = px[e.to], ax = a === undefined ? null : a;
      if (a === undefined || b === undefined) return;
      var ra = radiusOf(nodeById[e.from] || { type: 'concept' }), rb = radiusOf(nodeById[e.to] || { type: 'concept' });
      var dx = b - a, dy = py[e.to] - py[e.from], L = Math.hypot(dx, dy) || 1;
      var ux = dx / L, uy = dy / L;
      var x1 = a + ux * (ra + 1), y1 = py[e.from] + uy * (ra + 1);
      var x2 = b - ux * (rb + 4), y2 = py[e.to] - uy * (rb + 4);
      var cls = 'kg-edge kg-e-' + e.type + (e.type === 'lab' && e.role ? ' kg-role-' + e.role : '');
      if (opts.activeId && (e.from === opts.activeId || e.to === opts.activeId)) cls += ' hi';
      var dash = e.type === 'related' ? '5 4' : (e.type === 'lab' ? '2 3' : '');
      var stroke = e.type === 'lab'
        ? ({ core: '#2b5cff', support: '#94a3b8', extend: '#6d4aff' }[e.role] || '#94a3b8')
        : (e.type === 'related' ? '#c3ccdd' : '#aab6cc');
      var wdt = e.type === 'lab' ? 1.5 : 1.35;
      out.push('<path d="M ' + r1(x1) + ' ' + r1(y1) + ' L ' + r1(x2) + ' ' + r1(y2) + '" fill="none" ' +
        'stroke="' + stroke + '" stroke-width="' + wdt + '"' +
        (dash ? ' stroke-dasharray="' + dash + '"' : '') +
        (e.type === 'prereq' ? ' marker-end="url(#kg-arrow)"' : '') +
        ' data-kg-edge="' + i + '" data-from="' + e.from + '" data-to="' + e.to + '"/>');
    });
    out.push('</g>');

    /* ---- 节点 ---- */
    out.push('<g class="kg-nodes">');
    list.forEach(function (n) {
      var x = px[n.id], y = py[n.id], rr = radiusOf(n);
      var isLab = n.type === 'lab';
      var color, fill, textFill = '#1e293b', sw = 1.6;
      var m = null;
      if (isLab) {
        color = TONE_COLOR[n.tone] || TONE_COLOR.brand;
        fill = color; textFill = '#ffffff'; sw = 0;
      } else {
        var dom = OR.KB.domain(n.domain);
        color = TONE_COLOR[dom && dom.tone] || TONE_COLOR.brand;
        m = (opts.masteryMap && opts.masteryMap[n.id]) || (opts.showMastery === false ? null : mastery(n.id));
        if (m) { fill = m.level >= 3 ? color : (m.level === 0 ? '#ffffff' : hatched(color, m.level)); sw = 1.8; }
        else fill = '#ffffff';
      }
      var cls = 'kg-node kg-n-' + n.type + (opts.activeId === n.id ? ' active' : '');
      var label = n.name + (isLab ? '（实验）' : '');
      var tip = isLab ? (n.name + '｜' + (n.topic || '') + '｜难度 ' + n.level) :
        (n.name + '｜' + (OR.KB.domain(n.domain) || {}).name + '｜' + (m ? m.label : ''));
      out.push('<g class="' + cls + '" data-kg-node="' + n.id + '" transform="translate(' + r1(x) + ',' + r1(y) + ')" tabindex="0">');
      out.push('<title>' + esc(tip) + '</title>');
      if (isLab) {
        out.push('<rect x="' + (-rr - 4) + '" y="' + (-rr * 0.62) + '" width="' + (rr * 2 + 8) + '" height="' + (rr * 1.24) +
          '" rx="' + (rr * 0.42) + '" fill="' + fill + '" stroke="' + darken(color) + '" stroke-width="1.2"/>');
      } else {
        out.push('<circle r="' + r1(rr) + '" fill="' + fill + '" stroke="' + color + '" stroke-width="' + sw + '"/>');
        if (m && m.level > 0 && m.level < 3) {
          out.push('<circle r="' + r1(rr * 0.42) + '" fill="' + color + '" opacity="' + (0.28 + m.level * 0.24) + '"/>');
        }
        if (m && m.level === 3) {
          out.push('<path d="M ' + (-rr * 0.34) + ' 0 L ' + (-rr * 0.02) + ' ' + (rr * 0.34) + ' L ' + (rr * 0.42) + ' ' + (-rr * 0.34) +
            '" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>');
        }
      }
      if (isLab) {
        out.push('<text text-anchor="middle" y="' + (rr * 0.2) + '" font-size="' + (big ? 12.5 : 9) + '" font-weight="700" fill="' + textFill + '">' +
          esc(short(n.name, big ? 6 : 4)) + '</text>');
      }
      out.push('</g>');
      /* 标签：放于节点下方 */
      var showLabel = opts.labels === 'always' || (opts.labels !== 'none' && (big || deg[n.id] >= 3));
      if (showLabel) {
        var labelY = y + rr + (big ? 15 : 12);
        var anchor = x < 80 ? 'start' : (x > W - 80 ? 'end' : 'middle');
        var lx = x < 80 ? x - rr : (x > W - 80 ? x + rr : x);
        out.push('<text class="kg-label" x="' + r1(lx) + '" y="' + r1(labelY) + '" text-anchor="' + anchor + '" ' +
          'font-size="' + (big ? 11.5 : 9.6) + '" fill="#42506b" data-kg-label="' + n.id + '">' + esc(label) + '</text>');
      }
    });
    out.push('</g>');
    out.push('</svg>');
    return out.join('');
  }

  function hatched(hex, level) {
    /* 用浅色填充区分「部分掌握」，避免引入额外 defs，直接做颜色混合 */
    var mix = level === 1 ? 0.14 : 0.30;
    return blend(hex, '#ffffff', 1 - mix);
  }
  function blend(a, b, t) {
    var ca = hex2rgb(a), cb = hex2rgb(b);
    return '#' + [0, 1, 2].map(function (i) {
      return pad2(Math.round(ca[i] * t + cb[i] * (1 - t)).toString(16));
    }).join('');
  }
  function darken(hex) { return blend(hex, '#000000', 0.82); }
  function hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function pad2(s) { return s.length < 2 ? '0' + s : s; }
  function r1(v) { return Math.round(v * 10) / 10; }
  function short(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /** 为已插入 DOM 的图谱容器绑定交互（点击节点 / 悬浮高亮） */
  function attach(container, opts) {
    opts = opts || {};
    if (!container) return;
    var svg = container.querySelector('svg.kg-svg');
    if (!svg) return;

    function clearHi() {
      svg.querySelectorAll('.kg-edge.hi').forEach(function (el) { el.classList.remove('hi'); });
      svg.querySelectorAll('.kg-node.nb').forEach(function (el) { el.classList.remove('nb'); });
      svg.querySelectorAll('.kg-node.active').forEach(function (el) { el.classList.remove('active'); });
    }
    function highlight(id) {
      clearHi();
      var focus = svg.querySelector('[data-kg-node="' + cssEsc(id) + '"]');
      if (focus) focus.classList.add('active');
      svg.querySelectorAll('.kg-edge').forEach(function (el) {
        if (el.getAttribute('data-from') === id || el.getAttribute('data-to') === id) el.classList.add('hi');
      });
      svg.querySelectorAll('.kg-node').forEach(function (el) {
        var nid = el.getAttribute('data-kg-node');
        if (nid === id) return;
        if (neighboursOf(id).indexOf(nid) >= 0) el.classList.add('nb');
      });
    }
    svg.addEventListener('mouseover', function (e) {
      var g = e.target.closest ? e.target.closest('[data-kg-node]') : null;
      if (g) highlight(g.getAttribute('data-kg-node'));
    });
    svg.addEventListener('mouseleave', function () { clearHi(); });
    svg.addEventListener('click', function (e) {
      var g = e.target.closest ? e.target.closest('[data-kg-node]') : null;
      if (!g) return;
      var id = g.getAttribute('data-kg-node');
      if (opts.onPick) opts.onPick(id, nodeById[id]);
    });
    svg.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var g = e.target.closest ? e.target.closest('[data-kg-node]') : null;
      if (g && opts.onPick) { e.preventDefault(); opts.onPick(g.getAttribute('data-kg-node'), nodeById[g.getAttribute('data-kg-node')]); }
    });
  }

  function cssEsc(s) { return String(s).replace(/"/g, '\\"'); }

  OR.KG = {
    /* 构建与查询 */
    build: build, nodes: allNodes, node: node, edges: allEdges,
    concepts: concepts, labNodes: labNodes, pick: pick,
    edgesBetween: edgesBetween, adjacency: adjacency, degree: degree,
    neighboursOf: neighboursOf, prereqsOf: prereqsOf, successorsOf: successorsOf,
    relatedOf: relatedOf, labsOf: labsOf, conceptsOfLab: conceptsOfLab,
    /* 结构 */
    prereqChain: prereqChain, successorChain: successorChain,
    topoOrder: topoOrder, hasCycle: hasCycle, shortestPath: shortestPath,
    neighborhood: neighborhood, subgraphOf: subgraphOf,
    labSubgraph: labSubgraph, conceptSubgraph: conceptSubgraph,
    /* 学习分析 */
    mastery: mastery, setMastered: setMastered, coverage: coverage,
    domainStats: domainStats, stats: stats,
    MASTERY_LABEL: MASTERY_LABEL, MASTERY_COLOR: MASTERY_COLOR,
    /* 布局与渲染 */
    layout: layout, renderSVG: renderSVG, attach: attach,
    TONE_COLOR: TONE_COLOR,
    /* 供自检 */
    _missing: function () { build(); return missing.slice(); },
    _rebuild: function () { built = false; build(); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
