/* =============================================================================
 * OR-SimLab · 声明式积木渲染器
 * -----------------------------------------------------------------------------
 * 把实验场景返回的 blocks 描述渲染为 DOM，并统一管理图表挂载与自适应重绘。
 * ========================================================================== */
(function (global) {
  'use strict';
  var OR = global.OR = global.OR || {};
  var U = OR.ui, B = OR.Lab.B;

  var chartJobs = [];

  function h(tag, attrs, children) { return U.el(tag, attrs, children); }

  /** 挂载所有待绘制图表（必须在节点插入 DOM 之后调用） */
  function flush() {
    var jobs = chartJobs;
    chartJobs = [];
    jobs.forEach(function (job) { try { job(); } catch (e) { console.warn('chart error', e); } });
  }

  /** 渲染 blocks 并返回 { node, mount } */
  function renderBlocks(blocks) {
    var frag = document.createDocumentFragment();
    (blocks || []).forEach(function (b) {
      var node = renderBlock(b);
      if (node) frag.appendChild(node);
    });
    var wrap = h('div.vstack', { style: 'gap:16px' });
    wrap.appendChild(frag);
    return { node: wrap, mount: flush };
  }

  function renderBlock(b) {
    if (!b) return null;
    switch (b.type) {
      case 'metrics': return renderMetrics(b);
      case 'chart': return renderChart(b);
      case 'svg': return renderSVG(b);
      case 'table': return renderTable(b);
      case 'formula': return renderFormula(b);
      case 'note': return renderNote(b);
      case 'list': return renderList(b);
      case 'kv': return renderKV(b);
      case 'steps': return renderSteps(b);
      case 'html': return h('div', { html: b.html });
      case 'bars': return renderBars(b);
      case 'card': {
        var card = h('div.card');
        if (b.title) {
          card.appendChild(h('div.card-head', null, [
            h('h3', { text: b.title }),
            b.sub ? h('span.sub', { text: b.sub }) : null
          ]));
        }
        var body = h('div.card-body');
        var sub = renderBlocks(b.blocks || []);
        body.appendChild(sub.node);
        card.appendChild(body);
        return card;   // 图表任务已进入全局队列，由顶层 flush 统一绘制
      }
      case 'grid': {
        var g = h('div.grid.g' + (b.cols || 2));
        (b.blocks || []).forEach(function (x) {
          var n = renderBlock(x);
          if (n) g.appendChild(n);
        });
        return g;
      }
      case 'tabs': return renderTabsBlock(b);
      default: return h('div', { text: JSON.stringify(b).slice(0, 120) });
    }
  }

  function renderMetrics(b) {
    var wrap = h('div.metrics');
    (b.items || []).forEach(function (m) {
      var tone = m.tone || '';
      var tile = h('div.metric' + (tone ? '.' + tone : ''));
      tile.appendChild(h('div.metric-k', { text: m.k }));
      var v = h('div.metric-v', { html: U.num(m.v) + (m.unit ? '<small>' + U.esc(m.unit) + '</small>' : '') });
      tile.appendChild(v);
      if (m.hint) tile.appendChild(h('div.tiny.muted', { text: m.hint, style: 'margin-top:2px;line-height:1.4' }));
      wrap.appendChild(tile);
    });
    return wrap;
  }

  function renderChart(b) {
    var wrap = h('div.chart-wrap');
    var canvas = h('canvas');
    canvas.dataset.h = String((b.opts && b.opts.height) || 220);
    wrap.appendChild(canvas);
    canvas.__redraw = function () {
      var fn = OR.charts[b.kind];
      if (typeof fn !== 'function') return;
      fn(canvas, b.opts || {});
    };
    chartJobs.push(function () {
      if (!canvas.isConnected) return;
      try { canvas.__redraw(); }
      catch (e) { console.warn('chart error [' + b.kind + ']', e && e.message); }
    });
    return wrap;
  }

  function renderSVG(b) {
    var wrap = h('div.chart-wrap');
    wrap.innerHTML = b.html;
    return wrap;
  }

  function renderTable(b) {
    var wrap = h('div.tbl-wrap');
    var t = h('table.tbl' + (b.zebra === false ? '' : '.tbl-zebra'));
    if (b.head) {
      var thead = h('thead');
      var tr = h('tr');
      b.head.forEach(function (th, i) {
        tr.appendChild(h('th', { text: th, class: i > 0 && /元|数|量|价|率|值|成本|时间|距离|收益|分|%|天|件/.test(String(th)) ? 'num' : null }));
      });
      thead.appendChild(tr); t.appendChild(thead);
    }
    var tbody = h('tbody');
    (b.rows || []).forEach(function (row, ri) {
      var tr2 = h('tr' + (b.highlight && b.highlight(ri) ? '.tbl-hi' : ''));
      row.forEach(function (cell, ci) {
        var isNum = typeof cell === 'number';
        tr2.appendChild(h('td', {
          text: cell === null || cell === undefined ? '—' : (isNum ? U.num(cell) : String(cell)),
          class: isNum ? 'num' : null
        }));
      });
      tbody.appendChild(tr2);
    });
    t.appendChild(tbody);
    wrap.appendChild(t);
    return wrap;
  }

  function renderFormula(b) {
    var pre = h('div.formula');
    pre.innerHTML = (b.lines || []).join('<br>');
    return pre;
  }

  function renderNote(b) {
    var n = h('div');
    var tone = b.tone || 'brand';
    var map = { brand: ['#f0f4ff', '#2b5cff'], teal: ['#e9fbf8', '#0d9488'], amber: ['#fff7e8', '#d97706'], rose: ['#fff0f3', '#e11d48'], violet: ['#f2eeff', '#6d4aff'], green: ['#e8f9f1', '#059669'] };
    var c = map[tone] || map.brand;
    n.setAttribute('style',
      'background:' + c[0] + ';border-left:3px solid ' + c[1] + ';border-radius:9px;padding:12px 15px;' +
      'font-size:12.9px;line-height:1.78;color:#37435e');
    n.innerHTML = b.html;
    return n;
  }

  function renderList(b) {
    var ul = h('ul', { style: 'padding-left:19px;margin:0' });
    (b.items || []).forEach(function (t) {
      var li = h('li', { style: 'font-size:13.4px;line-height:1.8;color:#3d4a66;margin-bottom:5px' });
      li.innerHTML = t;
      ul.appendChild(li);
    });
    return ul;
  }

  function renderKV(b) {
    var wrap = h('div');
    (b.pairs || []).forEach(function (p, i) {
      var row = h('div.hstack', {
        style: 'padding:7px 0;border-bottom:' + (i === b.pairs.length - 1 ? 'none' : '1px solid var(--line)') + ';gap:14px'
      });
      row.appendChild(h('span', { text: p[0], style: 'font-size:12.6px;color:var(--ink-400);font-weight:600;flex:0 0 42%;min-width:120px' }));
      var v = h('span', { style: 'font-size:13px;color:var(--ink-800);font-weight:600;flex:1' });
      v.innerHTML = String(p[1]);
      row.appendChild(v);
      wrap.appendChild(row);
    });
    return wrap;
  }

  function renderSteps(b) {
    var wrap = h('div.steps-v');
    (b.items || []).forEach(function (s) {
      wrap.appendChild(h('div.step-v' + (s.done ? '.done' : ''), null, [
        h('h5', { text: s.title }),
        h('p', { text: s.text })
      ]));
    });
    return wrap;
  }

  function renderBars(b) {
    var wrap = h('div.vstack', { style: 'gap:9px' });
    var max = Math.max.apply(null, (b.items || []).map(function (i) { return i.value; })) || 1;
    (b.items || []).forEach(function (it) {
      var row = h('div');
      row.appendChild(h('div.hstack', { style: 'gap:8px;margin-bottom:4px' }, [
        h('span', { text: it.label, style: 'font-size:12.5px;font-weight:620;color:var(--ink-700)' }),
        h('span.spacer'),
        h('span', { text: it.text !== undefined ? it.text : U.num(it.value), style: 'font-size:12.5px;font-weight:700;color:' + (it.color || '#2b5cff') + ';font-variant-numeric:tabular-nums' })
      ]));
      var bar = h('div.bar' + (it.tone ? '.' + it.tone : ''));
      bar.appendChild(h('i', { style: 'width:' + Math.max(2, it.value / max * 100) + '%' }));
      row.appendChild(bar);
      wrap.appendChild(row);
    });
    return wrap;
  }

  function renderTabsBlock(b) {
    var wrap = h('div');
    var head = h('div.seg', { style: 'display:inline-flex;margin-bottom:12px' });
    var body = h('div');
    var items = b.items || [];
    items.forEach(function (it, i) {
      var btn = h('button', { text: it.label, type: 'button' });
      btn.addEventListener('click', function () {
        Array.prototype.forEach.call(head.children, function (c) { c.classList.remove('on'); });
        btn.classList.add('on');
        body.innerHTML = '';
        var r = renderBlocks(it.blocks || []);
        body.appendChild(r.node);
        requestAnimationFrame(r.mount);
      });
      head.appendChild(btn);
      if (i === 0) btn.classList.add('on');
    });
    if (items.length) {
      var r0 = renderBlocks(items[0].blocks || []);
      body.appendChild(r0.node);
    }
    wrap.appendChild(head); wrap.appendChild(body);
    return wrap;
  }

  /* 窗口尺寸变化时重绘所有图表 */
  var resizeTimer = null;
  global.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      document.querySelectorAll('.chart-wrap canvas').forEach(function (c) {
        if (!c.isConnected || !c.__redraw) return;
        try { c.__redraw(); } catch (e) { }
      });
    }, 180);
  });

  OR.render = { blocks: renderBlocks, block: renderBlock };
})(typeof window !== 'undefined' ? window : globalThis);
