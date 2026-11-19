/* =============================================================================
 * OR-SimLab · 知识中心 / 知识点详情
 * -----------------------------------------------------------------------------
 * 把「知识库（KB）」与「知识图谱（KG）」暴露给学习者：
 *   #/knowledge    知识中心：图谱总览、领域覆盖、学习路径、知识点检索、误区速查
 *   #/kb/:id       知识点详情：定义 / 公式 / 要点 / 误区 / 关联实验 / 局部图谱
 *
 * 另外导出 renderLabGraph()，供实验工作台的「知识图谱」页签复用，
 * 使「实验 → 知识点 → 实验」形成闭环。
 * ========================================================================== */
(function (global) {
  'use strict';
  var OR = global.OR = global.OR || {};
  var U = OR.ui;
  function h(t, a, c) { return U.el(t, a, c); }
  function esc(s) { return U.esc(s); }

  var LV = { 1: '入门', 2: '进阶', 3: '挑战' };
  var KIND_LABEL = {
    cluster: '领域聚类', layered: '难度分层', force: '力导向',
    tiers: '三层归属', focus: '聚焦'
  };
  var ROLE = {
    core: { label: '核心', bg: '#eef3ff', fg: '#1e3fbf' },
    support: { label: '支撑', bg: '#f1f5f9', fg: '#475569' },
    extend: { label: '拓展', bg: '#f2eeff', fg: '#6d4aff' }
  };

  /* ===========================================================================
   * 一、通用小部件
   * ======================================================================== */
  function domOf(domainId) { return OR.KB ? OR.KB.domain(domainId) : null; }
  function domColor(domainId) {
    var d = domOf(domainId);
    return (OR.KG.TONE_COLOR[d && d.tone]) || '#2b5cff';
  }

  function pill(text, bg, fg, extra) {
    return h('span.pill', {
      text: text,
      style: 'background:' + bg + ';color:' + fg + (extra ? ';' + extra : '')
    });
  }

  function rolePill(role) {
    var r = ROLE[role] || ROLE.support;
    return pill(r.label, r.bg, r.fg);
  }

  function masteryPill(m) {
    return pill(m.label, m.color + '16', m.color, 'font-weight:650');
  }

  function masteryDot(color, size) {
    var s = size || 8;
    return h('span', { style: 'display:inline-block;width:' + s + 'px;height:' + s + 'px;border-radius:99px;background:' + color + ';flex:0 0 ' + s + 'px' });
  }

  function kvRow(k, v) {
    return h('div.hstack', {
      style: 'justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px dashed var(--line)'
    }, [
      h('span.tiny.muted', { text: k, style: 'flex:0 0 auto' }),
      h('span.tiny', { text: String(v), style: 'font-weight:650;color:var(--ink-700);text-align:right' })
    ]);
  }

  function progressBar(label, val, total, color) {
    var p = total ? val / total : 0;
    return h('div', { style: 'margin-top:8px' }, [
      h('div.hstack', { style: 'justify-content:space-between;margin-bottom:3px' }, [
        h('span.tiny.muted', { text: label }),
        h('span.tiny', { text: val + ' / ' + total, style: 'font-weight:650;color:var(--ink-600)' })
      ]),
      h('div', { style: 'height:6px;border-radius:999px;background:var(--bg-alt);overflow:hidden' }, [
        h('div', { style: 'width:' + (p * 100) + '%;height:100%;background:' + color + ';border-radius:999px;transition:width .4s var(--ease-out)' })
      ])
    ]);
  }

  function statTile(icon, tone, k, v, d) {
    return h('div.stat.t-' + tone, null, [
      h('div.stat-k', { html: U.icon(icon, 13) + '<span>' + esc(k) + '</span>' }),
      h('div.stat-v', { text: String(v) }),
      h('div.stat-d', { text: d })
    ]);
  }

  function iconBox(icon, tone, size) {
    var s = size || 19;
    return h('div.scn-icon.i-' + tone, { html: U.icon(icon, s) });
  }

  /* ---------- 覆盖率缓存 ---------- */
  var covCache = null;
  function coverage() {
    if (!covCache) covCache = OR.KG.coverage();
    return covCache;
  }
  function invalidate() { covCache = null; }

  /* ===========================================================================
   * 二、知识图谱面板（知识中心与实验页共用）
   * ======================================================================== */
  /**
   * opts:
   *   width / height      画布尺寸
   *   kinds / kind        可选布局与默认布局
   *   groups              tiers 布局的分组（实验页使用）
   *   center              默认聚焦节点
   *   source()            返回子图 { nodes, edges, center }；缺省为全图
   *   search              是否显示筛选框（默认 true）
   *   showLab / showRelated  初始开关
   *   noMastery           是否关闭掌握度着色
   */
  function graphPanel(opts) {
    opts = opts || {};
    var KG = OR.KG;
    var W = opts.width || 1180, H = opts.height || 660;
    var kinds = opts.kinds || ['cluster', 'layered', 'force'];

    var state = {
      kind: opts.kind || kinds[0],
      showLab: opts.showLab !== false,
      showRelated: opts.showRelated !== false,
      active: opts.center || null,
      q: ''
    };

    var node = h('div.card.kg-panel');
    var bar = h('div.kg-bar');
    var canvas = h('div.kg-canvas');
    var info = h('div.kg-info');
    var legend = h('div.kg-legend');
    var body = h('div.kg-body', null, [canvas, info]);

    /* ---------- 子图解析 ---------- */
    function baseGraph() {
      if (opts.source) return opts.source(state);
      return { nodes: KG.nodes(), edges: KG.edges() };
    }

    function resolve() {
      var base = baseGraph();
      if (!state.q) return base;
      var kw = state.q.toLowerCase();
      var hit = base.nodes.filter(function (n) {
        return (n.name + ' ' + (n.summary || '') + ' ' + (n.topic || '')).toLowerCase().indexOf(kw) >= 0;
      });
      if (!hit.length) return { nodes: [], edges: [] };
      var ids = hit.map(function (n) { return n.id; });
      var inBase = {};
      base.nodes.forEach(function (n) { inBase[n.id] = 1; });
      hit.forEach(function (n) {
        var extra = [];
        if (n.type === 'concept') {
          KG.prereqsOf(n.id).forEach(function (p) { extra.push(p); });
          KG.successorsOf(n.id).forEach(function (p) { extra.push(p); });
          KG.labsOf(n.id).forEach(function (x) { extra.push('lab:' + x.lab.id); });
        } else if (n.type === 'lab') {
          var g = KG.conceptsOfLab(n.id.slice(4));
          extra = extra.concat(g.core, g.support, g.extend);
        }
        extra.forEach(function (v) { if (inBase[v]) ids.push(v); });
      });
      var uniq = ids.filter(function (v, i) { return ids.indexOf(v) === i; });
      return KG.subgraphOf(uniq, hit[0].id);
    }

    /* ---------- 工具栏 ---------- */
    function buildBar() {
      bar.innerHTML = '';
      var seg = h('div.hstack', { style: 'gap:6px;flex-wrap:wrap' });
      kinds.forEach(function (k) {
        var b = h('button.btn.btn-sm' + (k === state.kind ? '.btn-primary' : ''), { text: KIND_LABEL[k] || k });
        b.addEventListener('click', function () {
          state.kind = k;
          Array.prototype.forEach.call(seg.children, function (c) {
            c.classList.remove('btn-primary');
            c.classList.add('btn');
          });
          b.classList.add('btn-primary');
          paint();
        });
        seg.appendChild(b);
      });
      bar.appendChild(seg);
      bar.appendChild(h('span.spacer'));

      if (opts.search !== false) {
        var inp = h('input.input', {
          type: 'text',
          placeholder: '筛选知识点…',
          style: 'width:168px;font-size:12.5px;padding:6px 10px'
        });
        var t = null;
        inp.addEventListener('input', function () {
          clearTimeout(t);
          t = setTimeout(function () { state.q = inp.value.trim(); paint(); }, 200);
        });
        bar.appendChild(inp);
      }

      var tg = h('div.hstack', { style: 'gap:6px;flex-wrap:wrap' });
      function toggleBtn(label, key) {
        var b = h('button.btn.btn-sm', {
          text: label,
          style: 'opacity:' + (state[key] ? '1' : '.5') + ';' + (state[key] ? 'background:var(--brand-50);color:var(--brand-700);border-color:var(--brand-100)' : '')
        });
        b.addEventListener('click', function () {
          state[key] = !state[key];
          b.style.opacity = state[key] ? '1' : '.5';
          if (state[key]) {
            b.style.background = 'var(--brand-50)';
            b.style.color = 'var(--brand-700)';
            b.style.borderColor = 'var(--brand-100)';
          } else {
            b.style.background = '';
            b.style.color = '';
            b.style.borderColor = '';
          }
          paint();
        });
        tg.appendChild(b);
      }
      toggleBtn('实验节点', 'showLab');
      toggleBtn('相关边', 'showRelated');
      bar.appendChild(tg);
    }

    /* ---------- 图例 ---------- */
    function buildLegend() {
      legend.innerHTML = '';
      function item(swatchHTML, text) {
        return h('div.hstack', { style: 'gap:5px;align-items:center' }, [
          h('span', { html: swatchHTML, style: 'display:inline-flex;align-items:center' }),
          h('span.tiny.muted', { text: text })
        ]);
      }
      var circ = '<svg width="13" height="13"><circle cx="6.5" cy="6.5" r="4.6" fill="#fff" stroke="#2b5cff" stroke-width="1.5"/></svg>';
      var rect = '<svg width="15" height="13"><rect x="1" y="3.5" width="13" height="6.5" rx="3" fill="#2b5cff"/></svg>';
      function line(color, dash) {
        return '<svg width="18" height="7"><line x1="1" y1="3.5" x2="17" y2="3.5" stroke="' + color + '" stroke-width="2"' +
          (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/></svg>';
      }
      legend.appendChild(item(circ, '知识点（圆）'));
      legend.appendChild(item(rect, '仿真实验（圆角矩形）'));
      legend.appendChild(item(line('#aab6cc'), '前置关系'));
      legend.appendChild(item(line('#c3ccdd', '4 3'), '相关关系'));
      legend.appendChild(item(line('#2b5cff', '2 3'), '实验归属边'));
      legend.appendChild(h('span.spacer'));
      var levels = ['#94a3b8', '#f59e0b', '#14b8a6', '#10b981'];
      KG.MASTERY_LABEL.forEach(function (lab, i) {
        legend.appendChild(item('<svg width="13" height="13"><circle cx="6.5" cy="6.5" r="4.6" fill="' +
          (i === 0 ? '#fff' : levels[i]) + '" stroke="' + levels[i] + '" stroke-width="1.5"/></svg>', lab));
      });
    }

    /* ---------- 侧栏信息 ---------- */
    function paintInfo() {
      info.innerHTML = '';
      var id = state.active;
      if (!id) {
        info.appendChild(h('div.tiny.muted', {
          html: '<b style="color:var(--ink-600)">点击图中任意节点</b>查看定义摘要、关联实验与掌握度；' +
            '点击「打开详情」进入完整知识点页面。'
        }));
        var st = KG.stats();
        info.appendChild(h('div', { style: 'margin-top:12px' }, [
          kvRow('知识点', st.concepts + ' 个'),
          kvRow('仿真实验', st.labs + ' 个'),
          kvRow('图谱规模', st.nodes + ' 点 / ' + st.edges + ' 边'),
          kvRow('前置 / 相关', st.byType.prereq + ' / ' + st.byType.related),
          kvRow('最大前置深度', st.maxDepth + ' 层'),
          kvRow('平均节点度', st.avgDegree)
        ]));
        return;
      }

      var n = KG.node(id);
      if (!n) return;

      /* 标题 */
      var tone = n.type === 'lab' ? (n.tone || 'brand') : (domOf(n.domain) || {}).tone || 'brand';
      info.appendChild(h('div.hstack', { style: 'gap:9px;align-items:flex-start;margin-bottom:9px' }, [
        iconBox(n.type === 'lab' ? 'flask' : (domOf(n.domain) || {}).icon || 'grid', tone, 16),
        h('div', { style: 'flex:1;min-width:0' }, [
          h('div', { text: n.name, style: 'font-size:13.5px;font-weight:700;letter-spacing:-.01em;line-height:1.35' }),
          h('div.tiny.muted', {
            text: n.type === 'lab'
              ? (n.topic || '') + ' · 难度 ' + (LV[n.level] || '')
              : (domOf(n.domain) || {}).name + ' · ' + (LV[n.level] || '')
          })
        ])
      ]));

      if (n.type === 'concept') {
        var m = KG.mastery(id);
        info.appendChild(h('div.small.muted', { text: n.summary, style: 'line-height:1.62;margin-bottom:9px' }));
        info.appendChild(h('div.hstack', { style: 'gap:6px;flex-wrap:wrap;margin-bottom:10px' }, [
          masteryPill(m),
          m.rate ? h('span.tiny.muted', { text: '正确率 ' + Math.round(m.rate * 100) + '%' }) : null
        ]));
        var pre = KG.prereqsOf(id), suc = KG.successorsOf(id), rel = KG.relatedOf(id);
        if (pre.length) info.appendChild(infoGroup('前置', pre));
        if (suc.length) info.appendChild(infoGroup('后继', suc));
        if (rel.length) info.appendChild(infoGroup('相关', rel));
        var labs = KG.labsOf(id);
        if (labs.length) {
          info.appendChild(h('div.tiny.muted', { text: '关联实验', style: 'margin:10px 0 5px;font-weight:650' }));
          info.appendChild(h('div.vstack', { style: 'gap:5px' }, labs.map(function (x) {
            return h('a', {
              href: '#/lab/' + x.lab.id,
              style: 'display:flex;gap:6px;align-items:center;text-decoration:none;color:inherit;font-size:12px;padding:5px 7px;border-radius:7px;background:var(--surface-2);border:1px solid var(--line)'
            }, [
              h('span', { text: x.lab.name, style: 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }),
              rolePill(x.role)
            ]);
          })));
        }
        info.appendChild(h('div.hstack', { style: 'gap:6px;margin-top:11px' }, [
          h('button.btn.btn-sm.btn-primary', {
            html: U.icon('book', 13) + '<span>打开详情</span>',
            onclick: function () { location.hash = '#/kb/' + id; }
          }),
          h('button.btn.btn-sm.btn-soft', {
            html: U.icon('cpu', 13) + '<span>AI 精讲</span>',
            onclick: function () { askConcept(id); }
          })
        ]));
      } else {
        var g = KG.conceptsOfLab(id.slice(4));
        info.appendChild(h('div.small.muted', {
          text: '本实验共关联 ' + (g.core.length + g.support.length + g.extend.length) + ' 个知识点，其中核心 ' +
            g.core.length + ' 个、支撑 ' + g.support.length + ' 个、拓展 ' + g.extend.length + ' 个。',
          style: 'line-height:1.62;margin-bottom:9px'
        }));
        [['core', g.core], ['support', g.support], ['extend', g.extend]].forEach(function (pair) {
          if (!pair[1].length) return;
          info.appendChild(h('div.tiny.muted', { text: ROLE[pair[0]].label + '知识点', style: 'margin:9px 0 5px;font-weight:650' }));
          info.appendChild(h('div.hstack.wrap', { style: 'gap:4px' }, pair[1].map(function (cid) {
            var c = OR.KB.get(cid);
            if (!c) return null;
            return h('a.pill', {
              href: '#/kb/' + cid,
              text: c.name,
              style: 'text-decoration:none;background:' + ROLE[pair[0]].bg + ';color:' + ROLE[pair[0]].fg + ';cursor:pointer'
            });
          })));
        });
        info.appendChild(h('div.hstack', { style: 'gap:6px;margin-top:12px' }, [
          h('button.btn.btn-sm.btn-primary', {
            html: U.icon('play', 13) + '<span>进入实验</span>',
            onclick: function () { location.hash = '#/lab/' + id.slice(4); }
          }),
          h('button.btn.btn-sm.btn-soft', {
            html: U.icon('layers', 13) + '<span>知识图谱页</span>',
            onclick: function () { location.hash = '#/lab/' + id.slice(4) + '/knowledge'; }
          })
        ]));
      }
    }

    function infoGroup(label, ids) {
      return h('div', { style: 'margin-top:7px' }, [
        h('div.tiny.muted', { text: label, style: 'font-weight:650;margin-bottom:4px' }),
        h('div.hstack.wrap', { style: 'gap:4px' }, ids.map(function (cid) {
          var c = OR.KB.get(cid);
          if (!c) return null;
          return h('a.pill', {
            href: '#/kb/' + cid,
            text: c.name,
            style: 'text-decoration:none;background:var(--surface-2);color:var(--ink-600);border:1px solid var(--line);cursor:pointer'
          });
        }))
      ]);
    }

    /* ---------- 绘制 ---------- */
    function paint() {
      var sub = resolve();
      if (!sub.nodes || !sub.nodes.length) {
        canvas.innerHTML = '';
        canvas.appendChild(h('div.empty', {
          style: 'padding:60px 20px',
          html: '<div class="ico">🔍</div><h4>没有匹配的节点</h4><p>换一个关键词，或清空筛选框查看完整图谱。</p>'
        }));
        return;
      }
      var cov = opts.noMastery ? null : coverage();
      var groups = opts.groups;
      if (opts.source && sub.groups) groups = sub.groups;
      canvas.innerHTML = KG.renderSVG(sub, {
        width: W, height: H,
        kind: state.kind,
        center: state.active || sub.center || opts.center,
        groups: groups,
        showLab: state.showLab,
        showRelated: state.showRelated,
        labels: 'auto',
        masteryMap: cov ? cov.details : null,
        showMastery: !opts.noMastery,
        activeId: state.active
      });
      KG.attach(canvas, {
        onPick: function (id) {
          state.active = id;
          var svg = canvas.querySelector('svg');
          if (svg) {
            Array.prototype.forEach.call(svg.querySelectorAll('.kg-node.active'), function (el) { el.classList.remove('active'); });
            var g = svg.querySelector('[data-kg-node="' + id.replace(/"/g, '\\"') + '"]');
            if (g) g.classList.add('active');
          }
          paintInfo();
        }
      });
      paintInfo();
    }

    buildBar();
    buildLegend();
    node.appendChild(bar);
    node.appendChild(body);
    node.appendChild(legend);
    paint();

    return {
      node: node,
      refresh: function () { paint(); },
      setActive: function (id) { state.active = id; paint(); }
    };
  }

  /* ===========================================================================
   * 三、实验工作台：知识图谱页签
   * ======================================================================== */
  function renderLabGraph(host, lab) {
    host.innerHTML = '';
    var KG = OR.KG;
    var sub = KG.labSubgraph(lab.id);
    var g = sub.groups || { core: [], support: [], extend: [] };

    host.appendChild(h('div.card', null, [
      h('div.card-head', null, [
        h('h3', { text: '实验知识图谱' }),
        h('span.sub', { text: '三层归属：支撑 → 核心 → 拓展' })
      ]),
      h('div.card-body', { style: 'padding:16px 18px' }, [
        h('p.small.muted', {
          style: 'margin:0 0 12px;line-height:1.72',
          html: '本实验在知识图谱中与 <b>' + (g.core.length + g.support.length + g.extend.length) + '</b> 个知识点相连：' +
            '<b>' + g.core.length + '</b> 个<b>核心</b>知识点是实验必须掌握的主线，' +
            '<b>' + g.support.length + '</b> 个<b>支撑</b>知识点提供计算与建模基础，' +
            '<b>' + g.extend.length + '</b> 个<b>拓展</b>知识点指向更深层的问题（含核心知识点的全部前置链）。' +
            '点击节点可跳转到知识点详情。'
        }),
        h('div.hstack.wrap', { style: 'gap:7px;margin-bottom:14px' }, [
          rolePill('support'), h('span.tiny.muted', { text: '→' }),
          rolePill('core'), h('span.tiny.muted', { text: '→' }),
          rolePill('extend'), h('span.tiny.muted', { text: '（图中横向分层）' })
        ])
      ])
    ]));

    var panel = graphPanel({
      source: function () { return KG.labSubgraph(lab.id); },
      kinds: ['tiers', 'cluster', 'force'],
      kind: 'tiers',
      groups: g,
      center: 'lab:' + lab.id,
      width: 920, height: 520,
      search: true
    });
    host.appendChild(h('div', { style: 'margin-top:14px' }, [panel.node]));

    /* 知识点明细表 */
    host.appendChild(h('div', { style: 'margin-top:14px' }, [
      h('div.grid.g3', null, [
        roleCard('core', g.core, '实验主线，必须掌握'),
        roleCard('support', g.support, '计算与建模的基础工具'),
        roleCard('extend', g.extend, '延伸与进阶方向')
      ])
    ]));

    function roleCard(role, ids, desc) {
      var r = ROLE[role];
      return h('div.card', null, [
        h('div.card-head', { style: 'padding:12px 15px' }, [
          pill(r.label + '知识点', r.bg, r.fg, 'font-weight:650'),
          h('span.spacer'),
          h('span.tiny.muted', { text: ids.length + ' 个' })
        ]),
        h('div.card-body', { style: 'padding:12px 15px' }, [
          h('div.tiny.muted', { text: desc, style: 'margin-bottom:9px' }),
          ids.length
            ? h('div.vstack', { style: 'gap:6px' }, ids.map(function (cid) {
              var c = OR.KB.get(cid);
              if (!c) return null;
              var m = KG.mastery(cid);
              return h('a', {
                href: '#/kb/' + cid,
                style: 'display:flex;gap:7px;align-items:center;padding:6px 8px;border-radius:8px;background:var(--surface-2);border:1px solid var(--line);text-decoration:none;color:inherit'
              }, [
                masteryDot(m.color, 7),
                h('span', { text: c.name, style: 'flex:1;min-width:0;font-size:12.4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }),
                h('span.tiny.muted', { text: m.label, style: 'flex:0 0 auto;font-size:10.5px' })
              ]);
            }))
            : h('div.tiny.muted', { text: '（本实验未声明该层知识点）' })
        ])
      ]);
    }
  }

  /* ===========================================================================
   * 四、知识中心
   * ======================================================================== */
  function render(root) {
    root.innerHTML = '';
    var KB = OR.KB, KG = OR.KG;
    if (!KB || !KG) {
      root.appendChild(h('div.empty', {
        html: '<div class="ico">📚</div><h4>知识库未加载</h4><p>请检查 kb/kb.js 与 kb/graph.js 的脚本引用。</p>'
      }));
      return;
    }
    invalidate();
    var ks = KB.stats(), gs = KG.stats(), cvg = coverage();

    /* ---------- 概览指标 ---------- */
    root.appendChild(h('div.sec-head', { style: 'margin-top:4px' }, [
      h('h2', { text: '知识图谱' }),
      h('span.sub', { text: '知识点与仿真实验的双向索引：从概念找到实验，从实验回到概念' }),
      h('span.spacer'),
      pill(ks.concepts + ' 个知识点', 'var(--brand-50)', 'var(--brand-700)'),
      pill(ks.domains + ' 个领域', '#f4f6fb', 'var(--ink-600)'),
      pill(gs.edges + ' 条关联', '#f4f6fb', 'var(--ink-600)')
    ]));

    root.appendChild(h('div.grid.g4', { style: 'margin-bottom:18px' }, [
      statTile('book', 'brand', '知识点规模', ks.concepts,
        ks.domains + ' 个领域 · ' + ks.keyPoints + ' 条要点 · ' + ks.mistakes + ' 个误区'),
      statTile('layers', 'violet', '图谱结构', gs.nodes,
        gs.edges + ' 条边 · 前置深度 ' + gs.maxDepth + ' 层'),
      statTile('flask', 'teal', '关联实验', gs.labs,
        '实验平均关联 ' + (gs.labs ? Math.round(gs.byType.lab / gs.labs) : 0) + ' 个知识点'),
      statTile('check2', 'amber', '学习覆盖', Math.round(cvg.rate * 100) + '%',
        '已接触 ' + cvg.touched + ' / ' + cvg.total + ' · 已掌握 ' + cvg.mastered)
    ]));

    /* ---------- 页签 ---------- */
    var content = h('div');
    var active = 'graph';
    var tabs = U.tabs([
      { id: 'graph', label: '图谱总览' },
      { id: 'domain', label: '领域覆盖' },
      { id: 'path', label: '学习路径' },
      { id: 'search', label: '知识点检索' },
      { id: 'mistake', label: '常见误区' }
    ], active, function (id) { active = id; paint(); });

    root.appendChild(h('div', { style: 'margin:2px 0 16px' }, [tabs]));
    root.appendChild(content);

    /* ---------- 分页绘制 ---------- */
    function paint() {
      content.innerHTML = '';
      if (active === 'graph') paintGraph();
      else if (active === 'domain') paintDomain();
      else if (active === 'path') paintPath();
      else if (active === 'search') paintSearch();
      else paintMistake();
    }

    /* ---- ① 图谱总览 ---- */
    function paintGraph() {
      var c = coverage();
      content.appendChild(coverageCard(c));
      var panel = graphPanel({
        kinds: ['cluster', 'layered', 'force'],
        kind: 'cluster',
        width: 1180, height: 700
      });
      content.appendChild(h('div', { style: 'margin-top:14px' }, [panel.node]));
      content.appendChild(h('div.card', { style: 'margin-top:14px' }, [
        h('div.card-body', { style: 'padding:16px 18px' }, [
          h('div.hstack', { style: 'gap:11px;align-items:flex-start;flex-wrap:wrap' }, [
            iconBox('spark', 'violet', 18),
            h('div', { style: 'flex:1;min-width:240px' }, [
              h('h3', { text: '这张图怎么读？', style: 'font-size:14px;margin-bottom:6px' }),
              h('p.small.muted', {
                style: 'margin:0;line-height:1.75',
                html: '圆形节点是<b>知识点</b>，颜色由所属领域决定，填充深度表示你的掌握程度（空心＝未学习，实心＋对勾＝熟练应用）；' +
                  '圆角矩形是<b>仿真实验</b>，用带箭头的点线连到它声明的知识点上，线色区分<b>核心/支撑/拓展</b>三种角色。' +
                  '实线箭头是<b>前置关系</b>（必须先学左边再学右边，因此整张图不存在环），虚线是<b>相关关系</b>。' +
                  '切换「难度分层」可以看到知识点如何随认知难度逐级抬升；切换「力导向」则按连接紧密度重新聚团。'
              })
            ])
          ])
        ])
      ]));
    }

    function coverageCard(c) {
      var levels = [
        { lv: 0, name: '未学习', color: '#94a3b8' },
        { lv: 1, name: '初步了解', color: '#f59e0b' },
        { lv: 2, name: '基本掌握', color: '#14b8a6' },
        { lv: 3, name: '熟练应用', color: '#10b981' }
      ];
      var total = c.total || 1;
      var stack = h('div', {
        style: 'display:flex;height:10px;border-radius:999px;overflow:hidden;background:var(--bg-alt);margin:4px 0 12px'
      });
      levels.forEach(function (x) {
        var n = c.byLevel[x.lv] || 0;
        if (!n) return;
        stack.appendChild(h('div', {
          style: 'width:' + (n / total * 100) + '%;background:' + x.color,
          title: x.name + '：' + n + ' 个'
        }));
      });

      var cells = h('div', {
        style: 'display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px'
      }, levels.map(function (x) {
        var n = c.byLevel[x.lv] || 0;
        return h('div', {
          style: 'padding:9px 11px;border-radius:10px;background:var(--surface-2);border:1px solid var(--line)'
        }, [
          h('div.hstack', { style: 'gap:5px;align-items:center' }, [
            masteryDot(x.color, 7),
            h('span.tiny.muted', { text: x.name })
          ]),
          h('div', {
            text: n + ' 个',
            style: 'font-size:16px;font-weight:750;color:var(--ink-800);margin-top:2px;font-variant-numeric:tabular-nums'
          })
        ]);
      }));

      return h('div.card', null, [
        h('div.card-head', null, [
          h('h3', { text: '掌握度分布' }),
          h('span.sub', { text: '由关联实验的答题正确率（75%）与探索次数（25%）综合计算' }),
          h('span.spacer'),
          h('span.pill.p-brand', { text: '覆盖率 ' + Math.round(c.rate * 100) + '%' })
        ]),
        h('div.card-body', { style: 'padding:15px 18px 17px' }, [stack, cells])
      ]);
    }

    /* ---- ② 领域覆盖 ---- */
    function paintDomain() {
      var list = KG.domainStats();
      var c = coverage();
      content.appendChild(h('div.card', { style: 'margin-bottom:14px' }, [
        h('div.card-body', { style: 'padding:15px 18px' }, [
          h('p.small.muted', {
            style: 'margin:0;line-height:1.75',
            html: '按运筹学主干知识体系划分为 <b>' + list.length + '</b> 个领域。每个领域的覆盖率＝该领域中你已接触过的知识点比例，' +
              '掌握率＝达到「基本掌握」及以上的比例。点击知识点标签可直接进入详情页。'
          })
        ])
      ]));

      var wrap = h('div.grid.g2');
      list.forEach(function (d) {
        var st = c.byDomain[d.domain.id] || { total: 0, learned: 0, mastered: 0, avgScore: 0 };
        var total = st.total || d.count || 1;
        wrap.appendChild(h('div.card', null, [
          h('div.card-body', { style: 'padding:15px 16px' }, [
            h('div.hstack', { style: 'gap:10px;align-items:flex-start;margin-bottom:4px' }, [
              iconBox(d.domain.icon, d.domain.tone, 17),
              h('div', { style: 'flex:1;min-width:0' }, [
                h('div.hstack', { style: 'gap:7px;flex-wrap:wrap' }, [
                  h('h3', { text: d.domain.name, style: 'font-size:14px' }),
                  h('span.tiny.muted', { text: d.count + ' 个知识点' }),
                  h('span.tiny.muted', { text: '· ' + d.labCount + ' 个实验' })
                ]),
                h('div.tiny.muted', { text: d.domain.desc, style: 'margin-top:2px;line-height:1.55' })
              ]),
              h('div', { html: U.ring(total ? st.mastered / total : 0, 44, d.color, Math.round(total ? st.mastered / total * 100 : 0) + '%') })
            ]),
            progressBar('已接触', st.learned, total, d.color),
            progressBar('已掌握', st.mastered, total, '#10b981'),
            h('div.hstack.wrap', { style: 'gap:4px;margin-top:11px' }, d.concepts.map(function (n) {
              var m = c.details[n.id];
              var bg = m && m.level >= 2 ? (m.color + '18') : 'var(--surface-2)';
              var fg = m && m.level >= 2 ? m.color : 'var(--ink-600)';
              return h('a.pill', {
                href: '#/kb/' + n.id,
                text: n.name,
                title: n.summary + (m ? '｜' + m.label : ''),
                style: 'text-decoration:none;cursor:pointer;background:' + bg + ';color:' + fg + ';border:1px solid var(--line)'
              });
            })),
            h('div.hstack', { style: 'gap:6px;margin-top:11px' }, [
              h('button.btn.btn-sm.btn-soft', {
                html: U.icon('flask', 13) + '<span>该领域的实验</span>',
                onclick: function () { location.hash = '#/labs'; }
              })
            ])
          ])
        ]));
      });
      content.appendChild(wrap);
    }

    /* ---- ③ 学习路径 ---- */
    function paintPath() {
      var ids = KG.concepts().map(function (n) { return n.id; });
      var t = KG.topoOrder(ids);
      var rank = {};
      t.order.forEach(function (id, i) { rank[id] = i; });
      var c = coverage();

      content.appendChild(h('div.card', { style: 'margin-bottom:14px' }, [
        h('div.card-body', { style: 'padding:15px 18px' }, [
          h('div.hstack', { style: 'gap:11px;align-items:flex-start;flex-wrap:wrap' }, [
            iconBox('layers', 'brand', 18),
            h('div', { style: 'flex:1;min-width:240px' }, [
              h('h3', { text: '拓扑序推荐路径', style: 'font-size:14px;margin-bottom:6px' }),
              h('p.small.muted', {
                style: 'margin:0;line-height:1.75',
                html: '下面这个顺序由知识图谱的<b>拓扑排序</b>（Kahn 算法）生成：只有当某个知识点的全部前置都排在它前面时，它才会出现。' +
                  '因此顺着往下学不会遇到「还没学就先要用」的情况。同层内按领域顺序与认知难度排列。' +
                  '图中<b>不存在前置环</b>，这是拓扑排序能够完成的前提，也是知识体系自洽性的自动校验。'
              }),
              h('div.hstack.wrap', { style: 'gap:7px;margin-top:9px' }, [
                pill('无环校验通过', 'var(--green-50)', 'var(--green-600)'),
                pill('共 ' + t.order.length + ' 个知识点', 'var(--brand-50)', 'var(--brand-700)'),
                pill('最长前置链 ' + gs.maxDepth + ' 层', '#f4f6fb', 'var(--ink-600)')
              ])
            ])
          ])
        ])
      ]));

      var stageMeta = [
        { lv: 1, title: '阶段一 · 建立直觉', desc: '确定性模型与基本工具，先把「会建模、会算」的地基打牢' },
        { lv: 2, title: '阶段二 · 引入不确定性', desc: '随机系统与优化算法，学会在权衡中找最优' },
        { lv: 3, title: '阶段三 · 综合决策', desc: '复杂结构与风险度量，面向真实业务做判断' }
      ];

      stageMeta.forEach(function (sm) {
        var group = t.order.filter(function (id) {
          var n = KG.node(id);
          return n && n.level === sm.lv;
        }).sort(function (a, b) { return (rank[a] || 0) - (rank[b] || 0); });
        if (!group.length) return;

        content.appendChild(h('div.sec-head', { style: 'margin:20px 0 10px' }, [
          pill('难度 ' + sm.lv + ' · ' + LV[sm.lv], 'var(--brand-50)', 'var(--brand-700)'),
          h('h2', { text: sm.title, style: 'font-size:15px' }),
          h('span.spacer'),
          h('span.sub', { text: group.length + ' 个知识点' })
        ]));
        content.appendChild(h('p.tiny.muted', { text: sm.desc, style: 'margin:-4px 0 10px' }));

        content.appendChild(h('div.grid.g2', null, group.map(function (id, i) {
          var n = KG.node(id), cc = OR.KB.get(id), m = c.details[id] || KG.mastery(id);
          var pre = KG.prereqsOf(id);
          var unmet = pre.filter(function (p) { var mm = c.details[p]; return !mm || mm.level === 0; }).length;
          return h('a.card', {
            href: '#/kb/' + id,
            style: 'text-decoration:none;color:inherit;display:block;transition:transform .18s var(--ease-out),box-shadow .18s var(--ease-out)'
          }, [
            h('div.card-body', { style: 'padding:13px 14px' }, [
              h('div.hstack', { style: 'gap:9px;align-items:flex-start' }, [
                h('div', {
                  text: String(i + 1),
                  style: 'flex:0 0 22px;width:22px;height:22px;border-radius:7px;background:' + (m.level >= 2 ? m.color : 'var(--bg-alt)') +
                    ';color:' + (m.level >= 2 ? '#fff' : 'var(--ink-400)') + ';font-size:11px;font-weight:700;display:grid;place-items:center'
                }),
                h('div', { style: 'flex:1;min-width:0' }, [
                  h('div.hstack', { style: 'gap:6px;flex-wrap:wrap' }, [
                    h('div', { text: n.name, style: 'font-size:13px;font-weight:650;letter-spacing:-.01em' }),
                    masteryPill(m)
                  ]),
                  h('div.tiny.muted', {
                    text: cc.summary,
                    style: 'margin-top:3px;line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden'
                  }),
                  h('div.hstack.wrap', { style: 'gap:6px;margin-top:6px' }, [
                    pill(domOf(n.domain).name, 'var(--surface-2)', 'var(--ink-500)'),
                    pre.length ? pill('前置 ' + pre.length + (unmet ? '（缺 ' + unmet + '）' : ' ✓'),
                      unmet ? 'var(--amber-50)' : 'var(--green-50)',
                      unmet ? 'var(--amber-600)' : 'var(--green-600)') : pill('无前置', 'var(--green-50)', 'var(--green-600)')
                  ])
                ])
              ])
            ])
          ]);
        })));
      });
    }

    /* ---- ④ 知识点检索 ---- */
    function paintSearch() {
      var box = h('div.card');
      var inp = h('input.input', {
        type: 'text',
        placeholder: '输入关键词，例如「影子价格」「Erlang」「吸收态」「关键路线」「分支定界」',
        style: 'width:100%'
      });
      var host = h('div', { style: 'margin-top:13px' });
      box.appendChild(h('div.card-body', { style: 'padding:16px 18px' }, [inp, host]));
      content.appendChild(box);

      var c = coverage();

      function row(n, idx) {
        var cc = OR.KB.get(n.id), m = c.details[n.id] || KG.mastery(n.id);
        return h('a', {
          href: '#/kb/' + n.id,
          style: 'display:flex;gap:10px;align-items:center;padding:9px 10px;border-radius:9px;text-decoration:none;color:inherit;border:1px solid transparent'
        }, [
          h('span', {
            text: String(idx),
            style: 'flex:0 0 22px;text-align:right;font-size:11px;color:var(--ink-400);font-variant-numeric:tabular-nums'
          }),
          masteryDot(domColor(n.domain), 7),
          h('div', { style: 'flex:1;min-width:0' }, [
            h('div', { text: n.name, style: 'font-size:13px;font-weight:620' }),
            h('div.tiny.muted', {
              text: cc.summary,
              style: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap'
            })
          ]),
          pill(domOf(n.domain).name, 'var(--surface-2)', 'var(--ink-500)'),
          pill(LV[n.level], 'var(--surface-2)', 'var(--ink-500)'),
          masteryPill(m)
        ]);
      }

      function paintList() {
        var q = inp.value.trim();
        host.innerHTML = '';
        if (!q) {
          host.appendChild(h('div.tiny.muted', { text: '全部 ' + c.total + ' 个知识点（按领域分组）', style: 'margin-bottom:10px' }));
          OR.KB.domains().forEach(function (d) {
            var list = OR.KB.byDomain(d.id);
            if (!list.length) return;
            host.appendChild(h('div.hstack', { style: 'gap:7px;margin:14px 0 6px' }, [
              h('span', { html: U.icon(d.icon, 13), style: 'color:' + domColor(d.id) }),
              h('div', { text: d.name, style: 'font-size:12.5px;font-weight:700;color:var(--ink-700)' }),
              h('span.tiny.muted', { text: list.length + ' 个' })
            ]));
            host.appendChild(h('div', { style: 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px' },
              list.map(function (cc, i) { return row(KG.node(cc.id), i + 1); })));
          });
          return;
        }
        var hits = OR.KB.search(q);
        if (!hits.length) {
          host.appendChild(h('div.empty', {
            style: 'padding:34px 20px',
            html: '<h4>没有匹配「' + esc(q) + '」的知识点</h4><p>试试更短的关键词，或换用英文缩写（如 EOQ、PERT、M/M/c）。</p>'
          }));
          return;
        }
        host.appendChild(h('div.tiny.muted', { text: '匹配到 ' + hits.length + ' 个知识点（按相关度排序）', style: 'margin-bottom:8px' }));
        hits.forEach(function (cc, i) { host.appendChild(row(KG.node(cc.id), i + 1)); });
      }

      inp.addEventListener('input', paintList);
      paintList();
    }

    /* ---- ⑤ 常见误区 ---- */
    function paintMistake() {
      var all = OR.KB.allMistakes();
      var domains = OR.KB.domains();
      var bar = h('div.card', null, [
        h('div.card-body', { style: 'padding:14px 18px' }, [
          h('div.hstack.wrap', { style: 'gap:9px;align-items:center' }, [
            h('div', { style: 'flex:1;min-width:200px' }, [
              h('h3', { text: '常见误区速查表', style: 'font-size:14px' }),
              h('div.tiny.muted', {
                text: '共 ' + all.length + ' 条典型错误认知与纠正说明，来自各知识点的教学沉淀',
                style: 'margin-top:2px'
              })
            ]),
            (function () {
              var sel = h('select.select', { style: 'width:160px' });
              sel.appendChild(h('option', { value: '', text: '全部领域' }));
              domains.forEach(function (d) {
                var o = h('option', { value: d.id, text: d.name });
                sel.appendChild(o);
              });
              sel.addEventListener('change', function () { paintList(sel.value); });
              return sel;
            })()
          ])
        ])
      ]);
      content.appendChild(bar);

      var host = h('div', { style: 'margin-top:14px' });
      content.appendChild(host);

      function paintList(domId) {
        host.innerHTML = '';
        var list = domId ? all.filter(function (x) { return x.concept.domain === domId; }) : all;
        if (!list.length) { host.appendChild(h('div.empty', { text: '该领域暂无误区记录' })); return; }
        host.appendChild(h('div.grid.g2', null, list.map(function (x) {
          var cc = x.concept;
          return h('div.card', null, [
            h('div.card-body', { style: 'padding:13px 15px' }, [
              h('div.hstack', { style: 'gap:7px;margin-bottom:8px;flex-wrap:wrap' }, [
                masteryDot(domColor(cc.domain), 7),
                h('a', {
                  href: '#/kb/' + cc.id,
                  text: cc.name,
                  style: 'font-size:12.8px;font-weight:680;color:var(--brand-600);text-decoration:none'
                }),
                h('span.spacer'),
                h('span.tiny.muted', { text: domOf(cc.domain).name })
              ]),
              h('div.hstack', { style: 'gap:8px;align-items:flex-start;margin-bottom:7px' }, [
                pill('误区', 'var(--rose-50)', 'var(--rose-600)', 'flex:0 0 auto;font-weight:650'),
                h('div.small', { text: x.m, style: 'color:var(--ink-600);line-height:1.62' })
              ]),
              h('div.hstack', { style: 'gap:8px;align-items:flex-start' }, [
                pill('纠正', 'var(--green-50)', 'var(--green-600)', 'flex:0 0 auto;font-weight:650'),
                h('div.small', { text: x.c, style: 'color:var(--ink-600);line-height:1.62' })
              ])
            ])
          ]);
        })));
      }
      paintList('');
    }

    paint();
  }

  /* ===========================================================================
   * 五、知识点详情
   * ======================================================================== */
  function renderConcept(root, id) {
    root.innerHTML = '';
    var KB = OR.KB, KG = OR.KG;
    var c = KB.get(id);
    if (!c) {
      root.appendChild(h('div.empty', null, [
        h('div.ico', { html: U.icon('target', 36) }),
        h('h4', { text: '知识点不存在' }),
        h('p', { text: '标识 ' + id + ' 没有对应的知识点。' }),
        h('button.btn.btn-primary', {
          html: U.icon('book', 14) + '<span>返回知识中心</span>',
          onclick: function () { location.hash = '#/knowledge'; }
        })
      ]));
      return;
    }

    invalidate();
    var dom = domOf(c.domain) || { name: '', tone: 'brand', icon: 'grid' };
    var tone = dom.tone || 'brand';
    var m = KG.mastery(id);

    /* ---------- 头部 ---------- */
    root.appendChild(h('div.card', {
      style: 'margin-bottom:16px;background:linear-gradient(135deg,' + hexAlpha(domColor(c.domain), 0.06) + ',#fff 62%)'
    }, [
      h('div.card-body', { style: 'padding:20px 22px' }, [
        h('div.hstack.wrap', { style: 'gap:14px;align-items:flex-start' }, [
          iconBox(dom.icon, tone, 22),
          h('div', { style: 'flex:1;min-width:240px' }, [
            h('div.hstack.wrap', { style: 'gap:8px;align-items:center' }, [
              h('h1', { text: c.name, style: 'font-size:21px;letter-spacing:-.03em' }),
              pill(dom.name, hexAlpha(domColor(c.domain), 0.1), domColor(c.domain)),
              pill('难度 ' + LV[c.level], 'var(--surface-2)', 'var(--ink-500)'),
              pill('布鲁姆 · ' + c.bloom, 'var(--violet-50)', 'var(--violet-600)')
            ]),
            h('p', { text: c.summary, style: 'margin:7px 0 0;font-size:13.6px;color:var(--ink-500);font-weight:550;line-height:1.6' }),
            h('div.hstack.wrap', { style: 'gap:6px;margin-top:11px' }, [
              pill('前置 ' + (c.prereq || []).length, 'var(--surface-2)', 'var(--ink-500)'),
              pill('后继 ' + KG.successorsOf(id).length, 'var(--surface-2)', 'var(--ink-500)'),
              pill('相关 ' + (c.related || []).length, 'var(--surface-2)', 'var(--ink-500)'),
              pill('关联实验 ' + KG.labsOf(id).length, 'var(--brand-50)', 'var(--brand-700)')
            ])
          ]),
          h('div', {
            style: 'flex:0 0 auto;text-align:center;padding:10px 14px;border-radius:14px;background:#fff;border:1px solid var(--line);box-shadow:var(--sh-xs)'
          }, [
            h('div', { html: U.ring(m.score, 62, m.color, Math.round(m.score * 100) + '') }),
            h('div', { text: m.label, style: 'margin-top:7px;font-size:12px;font-weight:700;color:' + m.color }),
            h('div.tiny.muted', { text: '掌握度综合得分' })
          ])
        ]),
        h('div.hstack.wrap', { style: 'gap:7px;margin-top:15px' }, [
          h('button.btn.btn-sm.btn-primary', {
            html: U.icon('cpu', 14) + '<span>AI 精讲这个知识点</span>',
            onclick: function () { askConcept(id); }
          }),
          (function () {
            var manual = m.manual;
            var b = h('button.btn.btn-sm' + (manual ? '.btn-primary' : ''), {
              html: U.icon('check', 14) + '<span>' + (manual ? '已标记掌握' : '标记为已掌握') + '</span>',
              onclick: function () {
                KG.setMastered(id, !manual);
                invalidate();
                renderConcept(root, id);
                U.toast(!manual ? '已标记为「熟练应用」' : '已取消手动标记', 'ok');
              }
            });
            return b;
          })(),
          h('button.btn.btn-sm.btn-soft', {
            html: U.icon('flask', 14) + '<span>去做关联实验</span>',
            onclick: function () {
              var labs = KG.labsOf(id);
              location.hash = labs.length ? '#/lab/' + labs[0].lab.id : '#/labs';
            }
          }),
          h('button.btn.btn-sm.btn-ghost', {
            html: U.icon('layers', 14) + '<span>回到图谱</span>',
            onclick: function () { location.hash = '#/knowledge'; }
          })
        ])
      ])
    ]));

    /* ---------- 正文两栏 ---------- */
    var main = h('div.kb-detail');

    /* 左栏 */
    var left = h('div.vstack', { style: 'gap:14px;min-width:0' });

    left.appendChild(h('div.card', null, [
      h('div.card-head', null, [h('h3', { text: '定义' }), h('span.sub', { text: '严格表述' })]),
      h('div.card-body', null, [
        h('div', { html: c.definition, style: 'font-size:13.4px;line-height:1.92;color:var(--ink-700)' })
      ])
    ]));

    if ((c.formula || []).length) {
      left.appendChild(h('div.card', null, [
        h('div.card-head', null, [h('h3', { text: '核心公式' }), h('span.sub', { text: '可直接代入计算' })]),
        h('div.card-body', { style: 'padding:14px 18px' }, [
          h('div.formula', { style: 'margin:0' }, (c.formula || []).map(function (f) {
            return h('div', { html: f });
          }))
        ])
      ]));
    }

    if ((c.keyPoints || []).length) {
      left.appendChild(h('div.card', null, [
        h('div.card-head', null, [
          h('h3', { text: '关键要点' }),
          h('span.spacer'),
          h('span.tiny.muted', { text: c.keyPoints.length + ' 条' })
        ]),
        h('div.card-body', { style: 'padding:14px 18px' }, [
          h('div.vstack', { style: 'gap:9px' }, c.keyPoints.map(function (p, i) {
            return h('div.hstack', { style: 'gap:9px;align-items:flex-start' }, [
              h('span', {
                text: String(i + 1),
                style: 'flex:0 0 19px;width:19px;height:19px;border-radius:6px;background:hexAlpha(domColor(c.domain), 0.1);color:' +
                  domColor(c.domain) + ';font-size:10.5px;font-weight:700;display:grid;place-items:center;margin-top:1px'
              }),
              h('div', { html: p, style: 'font-size:13px;line-height:1.78;color:var(--ink-600)' })
            ]);
          }))
        ])
      ]));
    }

    if (c.example) {
      left.appendChild(h('div.card', null, [
        h('div.card-head', null, [
          h('h3', { text: '典型示例' }),
          h('span.sub', { text: '把公式落到具体数字上' })
        ]),
        h('div.card-body', null, [
          h('div', {
            html: c.example,
            style: 'font-size:13.2px;line-height:1.88;color:var(--ink-600);padding:12px 14px;border-radius:10px;background:var(--surface-2);border:1px dashed var(--line-strong)'
          })
        ])
      ]));
    }

    if ((c.mistakes || []).length) {
      left.appendChild(h('div.card', null, [
        h('div.card-head', null, [
          h('h3', { text: '常见误区' }),
          h('span.spacer'),
          pill(c.mistakes.length + ' 条', 'var(--rose-50)', 'var(--rose-600)')
        ]),
        h('div.card-body', { style: 'padding:14px 18px' }, [
          h('div.vstack', { style: 'gap:11px' }, c.mistakes.map(function (x, i) {
            return h('div', {
              style: 'padding:11px 13px;border-radius:10px;background:var(--surface-2);border:1px solid var(--line)'
            }, [
              h('div.hstack', { style: 'gap:8px;align-items:flex-start;margin-bottom:6px' }, [
                pill('误区 ' + (i + 1), 'var(--rose-50)', 'var(--rose-600)', 'flex:0 0 auto;font-weight:650'),
                h('div.small', { text: x.m, style: 'color:var(--ink-700);line-height:1.62;font-weight:600' })
              ]),
              h('div.hstack', { style: 'gap:8px;align-items:flex-start' }, [
                pill('纠正', 'var(--green-50)', 'var(--green-600)', 'flex:0 0 auto;font-weight:650'),
                h('div.small', { text: x.c, style: 'color:var(--ink-600);line-height:1.68' })
              ])
            ]);
          }))
        ])
      ]));
    }

    /* 右栏 */
    var right = h('div.vstack', { style: 'gap:14px;min-width:0' });

    /* 掌握度明细 */
    right.appendChild(h('div.card', null, [
      h('div.card-head', null, [h('h3', { text: '我的掌握度' }), h('span.spacer'), masteryPill(m)]),
      h('div.card-body', { style: 'padding:14px 16px' }, [
        progressBar('综合得分', Math.round(m.score * 100), 100, m.color),
        h('div', { style: 'margin-top:11px' }, [
          kvRow('答题正确率', m.rate ? Math.round(m.rate * 100) + '%' : '尚未作答'),
          kvRow('实验探索次数', m.runs + ' 次'),
          kvRow('关联实验', m.labs.length + ' 个'),
          kvRow('判定方式', m.manual ? '手动标记' : '按练习与探索自动计算')
        ]),
        m.labs.length ? h('div', { style: 'margin-top:11px' }, m.labs.map(function (x) {
          return h('a', {
            href: '#/lab/' + x.lab.id,
            style: 'display:block;padding:8px 10px;border-radius:9px;background:var(--surface-2);border:1px solid var(--line);text-decoration:none;color:inherit;margin-bottom:6px'
          }, [
            h('div.hstack', { style: 'gap:6px' }, [
              h('span', { text: x.lab.name, style: 'flex:1;min-width:0;font-size:12.2px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }),
              rolePill(x.role)
            ]),
            h('div.tiny.muted', { text: '练习 ' + x.solved + '/' + x.total + ' · 求解 ' + x.runs + ' 次', style: 'margin-top:2px' })
          ]);
        })) : h('div.tiny.muted', { text: '该知识点暂未关联实验场景。', style: 'margin-top:10px' })
      ])
    ]));

    /* 前置 / 后继 / 相关 */
    var pre = KG.prereqsOf(id), suc = KG.successorsOf(id), rel = KG.relatedOf(id);
    var chain = KG.prereqChain(id);
    right.appendChild(h('div.card', null, [
      h('div.card-head', null, [h('h3', { text: '知识网络' }), h('span.sub', { text: '按图谱关系导航' })]),
      h('div.card-body', { style: 'padding:14px 16px' }, [
        navGroup('直接前置', pre, 'var(--amber-50)', 'var(--amber-600)', '学这个之前先看'),
        navGroup('直接后继', suc, 'var(--teal-50)', 'var(--teal-600)', '学完这个可以继续'),
        navGroup('相关知识点', rel, 'var(--surface-2)', 'var(--ink-600)', '横向对比更清晰'),
        chain.length ? h('div', { style: 'margin-top:12px' }, [
          h('div.tiny.muted', { text: '完整前置链（' + chain.length + ' 层，由远及近）', style: 'font-weight:650;margin-bottom:6px' }),
          h('div.hstack.wrap', { style: 'gap:4px' }, chain.map(function (pid, i) {
            var pc = KB.get(pid);
            if (!pc) return null;
            return h('span.hstack', { style: 'gap:4px' }, [
              h('a.pill', {
                href: '#/kb/' + pid,
                text: pc.name,
                style: 'text-decoration:none;background:#fff;color:var(--ink-500);border:1px solid var(--line)'
              }),
              i < chain.length - 1 ? h('span.tiny.muted', { text: '→' }) : null
            ]);
          }))
        ]) : h('div.tiny.muted', { text: '该知识点位于课程起点，没有前置要求。', style: 'margin-top:10px' })
      ])
    ]));

    function navGroup(label, ids, bg, fg, hint) {
      if (!ids.length) return null;
      return h('div', { style: 'margin-bottom:11px' }, [
        h('div.hstack', { style: 'gap:6px;margin-bottom:5px' }, [
          h('span.tiny', { text: label, style: 'font-weight:700;color:var(--ink-600)' }),
          h('span.tiny.muted', { text: hint })
        ]),
        h('div.hstack.wrap', { style: 'gap:4px' }, ids.map(function (pid) {
          var pc = KB.get(pid);
          if (!pc) return null;
          return h('a.pill', {
            href: '#/kb/' + pid,
            text: pc.name,
            title: pc.summary,
            style: 'text-decoration:none;background:' + bg + ';color:' + fg + ';border:1px solid var(--line);cursor:pointer'
          });
        }))
      ]);
    }

    /* 学习顺序前后 */
    var nav = pathNeighbours(id);
    right.appendChild(h('div.card', null, [
      h('div.card-body', { style: 'padding:12px 14px' }, [
        h('div.tiny.muted', { text: '推荐学习顺序 ' + (nav.index >= 0 ? (nav.index + 1) + ' / ' + nav.total : '—'), style: 'margin-bottom:8px' }),
        h('div.hstack', { style: 'gap:7px' }, [
          nav.prev ? h('button.btn.btn-sm.btn-soft', {
            html: U.icon('reset', 13) + '<span>上一个</span>',
            title: (KB.get(nav.prev) || {}).name,
            onclick: function () { location.hash = '#/kb/' + nav.prev; }
          }) : h('span'),
          h('span.spacer'),
          nav.next ? h('button.btn.btn-sm.btn-primary', {
            html: '<span>下一个</span>' + U.icon('play', 13),
            title: (KB.get(nav.next) || {}).name,
            onclick: function () { location.hash = '#/kb/' + nav.next; }
          }) : h('span')
        ])
      ])
    ]));

    main.appendChild(left);
    main.appendChild(right);
    root.appendChild(main);

    /* ---------- 局部图谱 ---------- */
    var sub = KG.conceptSubgraph(id, { chain: true });
    root.appendChild(h('div.card', { style: 'margin-top:16px' }, [
      h('div.card-head', null, [
        h('h3', { text: '局部知识网络' }),
        h('span.sub', { text: '以本知识点为中心：前置链 + 后继 + 相关 + 关联实验' }),
        h('span.spacer'),
        h('span.tiny.muted', { text: sub.nodes.length + ' 个节点 / ' + sub.edges.length + ' 条边' })
      ]),
      h('div.card-body', { style: 'padding:10px 12px' }, [
        (function () {
          var host = h('div');
          var svg = KG.renderSVG(sub, {
            width: 900, height: 420,
            kind: 'focus',
            center: id,
            labels: 'always',
            masteryMap: coverage().details,
            activeId: id
          });
          host.innerHTML = svg;
          KG.attach(host, {
            onPick: function (nid, n) {
              if (!n) return;
              if (n.type === 'lab') location.hash = '#/lab/' + nid.slice(4);
              else location.hash = '#/kb/' + nid;
            }
          });
          return host;
        })()
      ])
    ]));

    /* ---------- AI 引导 ---------- */
    root.appendChild(h('div.card', {
      style: 'margin-top:14px;background:linear-gradient(135deg,var(--violet-50),var(--brand-50));border-color:var(--brand-100)'
    }, [
      h('div.card-body', { style: 'padding:17px 19px' }, [
        h('div.hstack', { style: 'gap:12px;align-items:flex-start;flex-wrap:wrap' }, [
          iconBox('cpu', 'violet', 18),
          h('div', { style: 'flex:1;min-width:240px' }, [
            h('h3', { text: 'AI 助教引导式提问', style: 'font-size:14px;margin-bottom:6px' }),
            h('p.small.muted', {
              text: c.hint,
              style: 'margin:0;line-height:1.78'
            })
          ]),
          h('button.btn.btn-primary', {
            html: U.icon('cpu', 15) + '<span>让助教带我推导</span>',
            onclick: function () { askConcept(id); }
          })
        ])
      ])
    ]));
  }

  /* ===========================================================================
   * 六、辅助
   * ======================================================================== */
  function hexAlpha(hex, a) {
    var hx = String(hex || '#2b5cff').replace('#', '');
    if (hx.length === 3) hx = hx[0] + hx[0] + hx[1] + hx[1] + hx[2] + hx[2];
    var r = parseInt(hx.slice(0, 2), 16), g = parseInt(hx.slice(2, 4), 16), b = parseInt(hx.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  /** 以拓扑序求某知识点的前后邻居 */
  function pathNeighbours(id) {
    var ids = OR.KG.concepts().map(function (n) { return n.id; });
    var t = OR.KG.topoOrder(ids);
    var i = t.order.indexOf(id);
    return {
      index: i,
      total: t.order.length,
      prev: i > 0 ? t.order[i - 1] : null,
      next: i >= 0 && i < t.order.length - 1 ? t.order[i + 1] : null
    };
  }

  /** 把知识点上下文注入 AI 助教并唤起面板 */
  function askConcept(id) {
    var c = OR.KB.get(id);
    if (!c || !OR.AIPanel) return;
    var labs = OR.KG.labsOf(id);
    var pre = OR.KG.prereqsOf(id).map(function (p) { var x = OR.KB.get(p); return x ? x.name : p; });
    var suc = OR.KG.successorsOf(id).map(function (p) { var x = OR.KB.get(p); return x ? x.name : p; });
    var lines = [
      '【当前知识点】' + c.name + '（' + (domOf(c.domain) || {}).name + ' · 难度 ' + LV[c.level] + ' · 布鲁姆层级 ' + c.bloom + '）',
      '一句话概述：' + c.summary,
      '定义：' + stripTags(c.definition),
      '核心公式：' + (c.formula || []).join('；'),
      '关键要点：' + (c.keyPoints || []).map(stripTags).join('；'),
      '常见误区：' + (c.mistakes || []).map(function (x) { return stripTags(x.m) + ' → 纠正：' + stripTags(x.c); }).join('；'),
      pre.length ? '前置知识点：' + pre.join('、') : '前置知识点：无',
      suc.length ? '后继知识点：' + suc.join('、') : '',
      labs.length ? '关联实验：' + labs.map(function (x) { return x.lab.name + '（' + (ROLE[x.role] || {}).label + '）'; }).join('、') : '关联实验：暂无',
      '引导策略：不要直接给出完整结论，先用提问带学生自己想清楚关键一步，再逐步补齐。'
    ];
    OR.AIPanel.setContext({
      lab: labs.length ? labs[0].lab : null,
      concept: c,
      values: null,
      summary: c.summary,
      prompt: lines.filter(Boolean).join('\n')
    });
    OR.AIPanel.open();
    U.toast('已把「' + c.name + '」的知识上下文交给 AI 助教', 'ok');
    if (typeof OR.AIPanel.ask === 'function') {
      OR.AIPanel.ask('concept', '请讲解「' + c.name + '」：它解决什么问题、成立前提是什么，再带我一步步理解核心公式。');
    }
  }

  function stripTags(s) {
    return String(s == null ? '' : s).replace(/<[^>]+>/g, '');
  }

  /* ===========================================================================
   * 导出
   * ======================================================================== */
  OR.KnowledgeView = {
    render: render,
    renderConcept: renderConcept,
    renderLabGraph: renderLabGraph,
    graphPanel: graphPanel,
    invalidate: invalidate,
    pathNeighbours: pathNeighbours
  };
})(typeof window !== 'undefined' ? window : globalThis);
