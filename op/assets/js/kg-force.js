/* 可复用力导向图谱组件（基于本地 d3.min.js）
   用法：var g = KGForce.create(document.getElementById('g'), {height:560, onSelect:fn});
        g.setFilter({chapter:'绪论', relation:'', keyword:''});
   所有数据来自 KG.data，不额外加载。 */
(function (global) {
  'use strict';
  var d3 = global.d3;

  function create(holder, opts) {
    opts = opts || {};
    var W = holder.clientWidth || 900, H = opts.height || 560;
    var showLabels = opts.showLabels !== false;
    var dataNodes = opts.nodes || KG.data.nodes;
    var rawLinks = opts.links || KG.data.edges;

    holder.innerHTML = '';
    holder.classList.add('graph-wrap');
    holder.style.height = H + 'px';
    var tip = document.createElement('div');
    tip.className = 'graph-tip';
    holder.appendChild(tip);

    var svg = d3.select(holder).append('svg').attr('width', '100%').attr('height', H)
      .attr('viewBox', '0 0 ' + W + ' ' + H);
    var root = svg.append('g');
    var zoom = d3.zoom().scaleExtent([0.25, 5]).on('zoom', function (e) { root.attr('transform', e.transform); });
    svg.call(zoom);
    svg.append('defs').append('marker').attr('id', 'kg-arrow').attr('viewBox', '0 -5 10 10')
      .attr('refX', 19).attr('refY', 0).attr('markerWidth', 5).attr('markerHeight', 5)
      .attr('orient', 'auto').append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#9DB0C4');

    var gLink = root.append('g'), gNode = root.append('g'), gLabel = root.append('g');
    var linkSel, nodeSel, labelSel, simulation;
    var selected = null;
    var filter = { chapter: '', relation: '', keyword: '' };

    function radius(n) { return Math.max(5, Math.min(17, 4.2 + Math.sqrt(n.degree || 0) * 2.4)); }

    function visibleSet() {
      var ids = {};
      dataNodes.forEach(function (n) {
        if (filter.chapter && n.chapter !== filter.chapter) return;
        if (filter.keyword) {
          var q = filter.keyword.toLowerCase();
          if ((n.name + ' ' + n.description).toLowerCase().indexOf(q) < 0) return;
        }
        ids[n.id] = true;
      });
      // 关键词模式：把命中节点的一跳邻居也显示出来，便于看关系
      if (filter.keyword) {
        var add = {};
        rawLinks.forEach(function (l) {
          var a = typeof l.source === 'object' ? l.source.id : l.source;
          var b = typeof l.target === 'object' ? l.target.id : l.target;
          if (ids[a]) add[b] = true;
          if (ids[b]) add[a] = true;
        });
        Object.keys(add).forEach(function (k) { ids[k] = true; });
      }
      return ids;
    }

    function currentData() {
      var ids = visibleSet();
      var nodes = dataNodes.filter(function (n) { return ids[n.id]; }).map(function (n) { return Object.assign({}, n); });
      var links = rawLinks.filter(function (l) {
        var a = typeof l.source === 'object' ? l.source.id : l.source;
        var b = typeof l.target === 'object' ? l.target.id : l.target;
        return ids[a] && ids[b] && (!filter.relation || l.relation === filter.relation);
      }).map(function (l) {
        return {
          source: typeof l.source === 'object' ? l.source.id : l.source,
          target: typeof l.target === 'object' ? l.target.id : l.target,
          relation: l.relation, undirected: l.undirected, id: l.id
        };
      });
      return { nodes: nodes, links: links };
    }

    function highlight() {
      if (!nodeSel) return;
      if (!selected) {
        nodeSel.attr('opacity', 1); labelSel.attr('opacity', 1);
        linkSel.attr('stroke-opacity', .7).attr('stroke', '#B9C7D6');
        return;
      }
      var nb = {}; nb[selected] = true;
      currentLinkData.forEach(function (l) {
        var a = l.source.id || l.source, b = l.target.id || l.target;
        if (a === selected) nb[b] = true;
        if (b === selected) nb[a] = true;
      });
      nodeSel.attr('opacity', function (d) { return nb[d.id] ? 1 : .16; });
      labelSel.attr('opacity', function (d) { return nb[d.id] ? 1 : .08; });
      linkSel.attr('stroke-opacity', function (l) {
        var a = l.source.id || l.source, b = l.target.id || l.target;
        return (a === selected || b === selected) ? .95 : .08;
      }).attr('stroke', function (l) {
        var a = l.source.id || l.source, b = l.target.id || l.target;
        return (a === selected || b === selected) ? (KG.relColor[l.relation] || '#4A90D9') : '#B9C7D6';
      });
    }

    var currentLinkData = [];

    function render(keepTransform) {
      var d = currentData();
      currentLinkData = d.links;
      if (simulation) simulation.stop();

      linkSel = gLink.selectAll('line').data(d.links, function (l) { return l.id; })
        .join('line').attr('class', 'link-line')
        .attr('stroke-width', function (l) { return l.relation === '关联' ? 1.2 : 1.6; })
        .attr('stroke-dasharray', function (l) { return l.relation === '关联' ? '4 3' : null; })
        .attr('marker-end', function (l) { return l.undirected ? null : 'url(#kg-arrow)'; });

      nodeSel = gNode.selectAll('circle').data(d.nodes, function (n) { return n.id; })
        .join('circle').attr('class', 'node-circle')
        .attr('r', radius)
        .attr('fill', function (n) { return KG.color(n.chapter); })
        .attr('stroke', function (n) { return n.type === '知识单元' ? '#22303C' : '#fff'; })
        .attr('stroke-width', function (n) { return n.type === '知识单元' ? 2 : 1.5; })
        .on('mouseover', function (event, n) {
          tip.style.opacity = 1;
          tip.innerHTML = '<b>' + KG.esc(n.name) + '</b><br><span style="color:#5A6B7B">' +
            KG.esc(n.chapter) + ' · ' + KG.esc(n.type) + ' · 第' + n.level + '级 · 关系数 ' + (n.degree || 0) + '</span>';
        })
        .on('mousemove', function (event) {
          var r = holder.getBoundingClientRect();
          tip.style.left = Math.min(event.clientX - r.left + 14, r.width - 290) + 'px';
          tip.style.top = (event.clientY - r.top + 14) + 'px';
        })
        .on('mouseout', function () { tip.style.opacity = 0; })
        .on('click', function (event, n) {
          event.stopPropagation();
          selected = (selected === n.id) ? null : n.id;
          highlight();
          if (opts.onSelect) opts.onSelect(selected ? KG.byId[selected] : null);
        });

      labelSel = gLabel.selectAll('text').data(d.nodes.filter(function (n) {
        return showLabels && (n.level <= (opts.labelLevel || 2) || (n.degree || 0) >= 6);
      }), function (n) { return n.id; }).join('text')
        .attr('class', 'node-label').attr('text-anchor', 'middle')
        .attr('dy', function (n) { return -radius(n) - 3; })
        .text(function (n) { return n.name.length > 14 ? n.name.slice(0, 13) + '…' : n.name; });

      svg.on('click', function () { selected = null; highlight(); if (opts.onSelect) opts.onSelect(null); });

      nodeSel.call(d3.drag()
        .on('start', function (event, d) { if (!event.active) simulation.alphaTarget(.25).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', function (event, d) { d.fx = event.x; d.fy = event.y; })
        .on('end', function (event, d) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

      simulation = d3.forceSimulation(d.nodes)
        .force('link', d3.forceLink(d.links).id(function (n) { return n.id; })
          .distance(opts.linkDistance || 68).strength(.28))
        .force('charge', d3.forceManyBody().strength(opts.charge || -165))
        .force('center', d3.forceCenter(W / 2, H / 2))
        .force('collide', d3.forceCollide().radius(function (n) { return radius(n) + 4; }))
        .on('tick', function () {
          linkSel.attr('x1', function (l) { return l.source.x; }).attr('y1', function (l) { return l.source.y; })
            .attr('x2', function (l) { return l.target.x; }).attr('y2', function (l) { return l.target.y; });
          nodeSel.attr('cx', function (n) { return n.x = Math.max(18, Math.min(W - 18, n.x)); })
            .attr('cy', function (n) { return n.y = Math.max(18, Math.min(H - 18, n.y)); });
          labelSel.attr('x', function (n) { return n.x; }).attr('y', function (n) { return n.y; });
        });
      highlight();
    }

    render();

    return {
      setFilter: function (f) { Object.assign(filter, f || {}); selected = null; render(); },
      getFilter: function () { return Object.assign({}, filter); },
      select: function (id) { selected = id; highlight(); },
      resetZoom: function () { svg.transition().duration(350).call(zoom.transform, d3.zoomIdentity); },
      setForces: function (f) {
        if (!simulation) return;
        if (f.charge != null) simulation.force('charge').strength(+f.charge);
        if (f.linkDistance != null) simulation.force('link').distance(+f.linkDistance);
        simulation.alpha(.75).restart();
      },
      restart: function () { if (simulation) simulation.alpha(.8).restart(); },
      count: function () { return { nodes: currentData().nodes.length, links: currentLinkData.length }; }
    };
  }

  global.KGForce = { create: create };
})(window);
