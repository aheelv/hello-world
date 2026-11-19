/* =============================================================================
 * OR-SimLab · 轻量可视化库 (Canvas + SVG)
 * -----------------------------------------------------------------------------
 * 零依赖图表渲染：折线/面积、柱状、直方图、散点、热力矩阵、甘特图、网络图。
 * 支持高分屏、悬停提示、自适应重绘。浅色主题配色。
 * ========================================================================== */
(function (global) {
  'use strict';
  var OR = global.OR = global.OR || {};

  var PALETTE = {
    brand: '#2b5cff', brandSoft: 'rgba(43,92,255,.16)',
    teal: '#14b8a6', tealSoft: 'rgba(20,184,166,.16)',
    violet: '#8b6dff', violetSoft: 'rgba(139,109,255,.16)',
    amber: '#f59e0b', amberSoft: 'rgba(245,158,11,.18)',
    rose: '#f43f5e', roseSoft: 'rgba(244,63,94,.16)',
    green: '#10b981', greenSoft: 'rgba(16,185,129,.16)',
    cyan: '#06b6d4', cyanSoft: 'rgba(6,182,212,.16)',
    slate: '#64748b', slateSoft: 'rgba(100,116,139,.16)'
  };
  var SERIES_COLORS = [PALETTE.brand, PALETTE.teal, PALETTE.violet, PALETTE.amber, PALETTE.rose, PALETTE.green, PALETTE.cyan, PALETTE.slate];

  var INK = { 900: '#0c1424', 700: '#27334d', 500: '#5c6a88', 400: '#8492ad', 300: '#aab6cc' };
  var LINE = '#e4e9f2';
  var FONT = '-apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

  /* ---------- 通用工具 ---------- */
  function setup(canvas, height) {
    var dpr = global.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var w = Math.max(240, rect.width || canvas.parentNode.clientWidth || 600);
    var h = height || canvas.dataset.h ? parseInt(canvas.dataset.h, 10) : (parseInt(canvas.dataset.h || '240', 10));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.font = '11px ' + FONT;
    return { ctx: ctx, w: w, h: h };
  }

  function niceTicks(min, max, count) {
    count = count || 5;
    if (!isFinite(min) || !isFinite(max)) return [0, 1];
    if (max - min < 1e-12) { max = min + 1; }
    var range = max - min;
    var raw = range / count;
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var norm = raw / mag;
    var step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
    var start = Math.floor(min / step) * step;
    var ticks = [];
    for (var v = start; v <= max + step * 1e-6; v += step) ticks.push(Math.round(v / step) * step);
    return ticks;
  }

  function fmt(v, digits) {
    if (!isFinite(v)) return '–';
    var a = Math.abs(v);
    if (a === 0) return '0';
    if (a >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (a >= 10000) return (v / 1000).toFixed(1) + 'k';
    var d = digits !== undefined ? digits : (a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 3);
    return (+v.toFixed(d)).toString();
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawTitle(ctx, opts, w) {
    if (!opts.title) return 0;
    ctx.save();
    ctx.fillStyle = INK[700];
    ctx.font = '600 12.5px ' + FONT;
    ctx.textAlign = 'left';
    ctx.fillText(opts.title, 2, 13);
    ctx.restore();
    return 20;
  }

  function drawLegend(ctx, legend, w, y) {
    ctx.save();
    ctx.font = '11px ' + FONT;
    ctx.textAlign = 'left';
    var x = 2;
    legend.forEach(function (item) {
      ctx.fillStyle = item.color;
      roundRect(ctx, x, y - 7, 9, 9, 3); ctx.fill();
      ctx.fillStyle = INK[500];
      ctx.fillText(item.label, x + 13, y + 1);
      x += 13 + ctx.measureText(item.label).width + 16;
    });
    ctx.restore();
    return y + 8;
  }

  /* ===========================================================================
   * 折线 / 面积图
   * ======================================================================== */
  /**
   * 归一化系列数据：允许调用方用「labels + values」的简写形式描述折线，
   * 自动转成 { x, y } 点集。x 优先取标签的数值（如 '12' → 12），
   * 标签不可数值化时退化为序号，并在绘制刻度时回填标签文本。
   * 这样柱状图的写法可以直接复用到折线图，避免因缺少 data 字段而静默丢图。
   */
  function normalizeLineSeries(opts) {
    if (!opts || !Array.isArray(opts.series)) return opts;
    var need = opts.series.some(function (s) { return s && !Array.isArray(s.data); });
    if (!need) return opts;
    var labels = opts.labels || [];
    var out = Object.assign({}, opts);
    out.series = opts.series.map(function (s, i) {
      if (!s) return { label: '系列' + (i + 1), data: [] };
      if (Array.isArray(s.data)) return s;
      var vals = Array.isArray(s.values) ? s.values : [];
      var data = [];
      vals.forEach(function (v, j) {
        var num = Number(v);
        if (v === null || v === undefined || v === '' || !isFinite(num)) return;
        var raw = labels[j];
        var x = (raw !== undefined && raw !== null && raw !== '' && isFinite(Number(raw))) ? Number(raw) : j;
        data.push({ x: x, y: num });
      });
      var ns = Object.assign({}, s);
      ns.data = data;
      delete ns.values;
      return ns;
    });
    return out;
  }

  function lineChart(canvas, opts) {
    opts = normalizeLineSeries(opts);
    var S = setup(canvas, opts.height);
    var ctx = S.ctx, w = S.w, h = S.h;
    var pad = { t: 16, r: 14, b: 28, l: 46 };
    var top = drawTitle(ctx, opts, w);
    pad.t += top;
    if (opts.legend !== false && opts.series.length > 1) {
      drawLegend(ctx, opts.series.map(function (s, i) {
        return { label: s.label || ('系列' + (i + 1)), color: s.color || SERIES_COLORS[i % 8] };
      }), w, pad.t - 2);
      pad.t += 16;
    }

    var xs = [], ys = [];
    opts.series.forEach(function (s) {
      s.data.forEach(function (p) { xs.push(p.x); ys.push(p.y); });
    });
    if (!xs.length) { ctx.fillStyle = INK[400]; ctx.fillText('暂无数据', 10, 40); return; }

    var xMin = opts.xMin !== undefined ? opts.xMin : Math.min.apply(null, xs);
    var xMax = opts.xMax !== undefined ? opts.xMax : Math.max.apply(null, xs);
    var yMin = opts.yMin !== undefined ? opts.yMin : Math.min.apply(null, ys);
    var yMax = opts.yMax !== undefined ? opts.yMax : Math.max.apply(null, ys);
    if (opts.yFromZero !== false) yMin = Math.min(0, yMin);
    var padY = (yMax - yMin) * 0.08 || 1;
    yMax += padY;
    if (yMin < 0) yMin -= padY;

    var xTicks = niceTicks(xMin, xMax, 6);
    var yTicks = niceTicks(yMin, yMax, 5);
    yMin = Math.min(yMin, yTicks[0]); yMax = Math.max(yMax, yTicks[yTicks.length - 1]);
    xMin = Math.min(xMin, xTicks[0]); xMax = Math.max(xMax, xTicks[xTicks.length - 1]);
    if (xMax === xMin) xMax = xMin + 1;

    function X(v) { return pad.l + (v - xMin) / (xMax - xMin) * (w - pad.l - pad.r); }
    function Y(v) { return h - pad.b - (v - yMin) / (yMax - yMin) * (h - pad.t - pad.b); }

    // 网格
    ctx.strokeStyle = LINE; ctx.lineWidth = 1;
    ctx.fillStyle = INK[400]; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    yTicks.forEach(function (t) {
      var y = Math.round(Y(t)) + .5;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
      ctx.fillText(fmt(t), pad.l - 7, Y(t));
    });
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    /* 若标签无法数值化（如 '18%'），x 轴改用序号并回填标签文本 */
    var xLabelMap = null;
    if (Array.isArray(opts.labels) && opts.labels.length && opts.labels.length <= 40) {
      xLabelMap = {};
      opts.labels.forEach(function (l, i) { xLabelMap[i] = String(l); });
    }
    xTicks.forEach(function (t) {
      var txt = xLabelMap && xLabelMap[t] !== undefined ? xLabelMap[t] : fmt(t);
      ctx.fillText(txt, X(t), h - pad.b + 7);
    });

    // 参考线
    if (opts.markers) {
      opts.markers.forEach(function (mk) {
        var y = Y(mk.y);
        ctx.save();
        ctx.strokeStyle = mk.color || PALETTE.rose;
        ctx.setLineDash([5, 4]); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
        ctx.restore();
        if (mk.label) {
          ctx.save();
          ctx.fillStyle = mk.color || PALETTE.rose;
          ctx.font = '600 10.5px ' + FONT;
          ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
          ctx.fillText(mk.label, w - pad.r - 2, y - 3);
          ctx.restore();
        }
      });
    }

    // 坐标轴
    ctx.strokeStyle = '#d3dbe9'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t - 4); ctx.lineTo(pad.l, h - pad.b); ctx.lineTo(w - pad.r, h - pad.b);
    ctx.stroke();

    // 系列
    opts.series.forEach(function (s, si) {
      var col = s.color || SERIES_COLORS[si % 8];
      if (s.data.length === 0) return;
      if (s.area) {
        ctx.beginPath();
        s.data.forEach(function (p, i) { i ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y)); });
        ctx.lineTo(X(s.data[s.data.length - 1].x), Y(Math.max(yMin, 0)));
        ctx.lineTo(X(s.data[0].x), Y(Math.max(yMin, 0)));
        ctx.closePath();
        var g = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
        g.addColorStop(0, s.fill || col.replace(')', ',.25)').replace('rgb', 'rgba'));
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fill();
      }
      ctx.beginPath();
      ctx.strokeStyle = col;
      ctx.lineWidth = s.width || 2;
      if (s.dash) ctx.setLineDash(s.dash);
      s.data.forEach(function (p, i) { i ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y)); });
      ctx.stroke();
      ctx.setLineDash([]);
      if (s.points && s.data.length <= 80) {
        s.data.forEach(function (p) {
          ctx.beginPath();
          ctx.arc(X(p.x), Y(p.y), 2.6, 0, Math.PI * 2);
          ctx.fillStyle = '#fff'; ctx.fill();
          ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.stroke();
        });
      }
      if (s.fillTo !== undefined) { /* reserved */ }
    });

    if (opts.xLabel) {
      ctx.fillStyle = INK[400]; ctx.font = '10.5px ' + FONT;
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText(opts.xLabel, w - pad.r, h - 4);
    }
    if (opts.yLabel) {
      ctx.save();
      ctx.fillStyle = INK[400]; ctx.font = '10.5px ' + FONT;
      ctx.translate(11, pad.t); ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText(opts.yLabel, 0, 0);
      ctx.restore();
    }

    // 悬停提示
    if (opts.tooltip !== false) attachTooltip(canvas, opts, { X: X, Y: Y, pad: pad, w: w, h: h, xMin: xMin, xMax: xMax });
  }

  function attachTooltip(canvas, opts, geom) {
    if (canvas.__tt) { canvas.removeEventListener('mousemove', canvas.__tt.move); canvas.removeEventListener('mouseleave', canvas.__tt.leave); }
    var tip = document.createElement('div');
    tip.style.cssText = 'position:absolute;pointer-events:none;background:#0c1424;color:#fff;font-size:11px;' +
      'padding:6px 9px;border-radius:7px;white-space:nowrap;opacity:0;transition:opacity .12s;z-index:50;' +
      'font-family:' + FONT + ';line-height:1.55;box-shadow:0 8px 22px rgba(12,20,36,.22)';
    var wrap = canvas.parentNode;
    if (getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';
    wrap.appendChild(tip);

    var allX = [];
    opts.series.forEach(function (s) { s.data.forEach(function (p) { allX.push(p.x); }); });
    allX = Array.from(new Set(allX)).sort(function (a, b) { return a - b; });

    function move(ev) {
      var rect = canvas.getBoundingClientRect();
      var mx = ev.clientX - rect.left;
      if (mx < geom.pad.l || mx > geom.w - geom.pad.r) { tip.style.opacity = 0; return; }
      var xv = geom.xMin + (mx - geom.pad.l) / (geom.w - geom.pad.l - geom.pad.r) * (geom.xMax - geom.xMin);
      var nearest = allX[0], best = Infinity;
      allX.forEach(function (x) { var d = Math.abs(x - xv); if (d < best) { best = d; nearest = x; } });
      var rows = ['<b>x = ' + fmt(nearest, 3) + '</b>'];
      opts.series.forEach(function (s, i) {
        var pt = s.data.find(function (p) { return Math.abs(p.x - nearest) < 1e-9; });
        if (pt) rows.push('<span style="color:' + (s.color || SERIES_COLORS[i % 8]) + '">●</span> ' + (s.label || '系列' + (i + 1)) + '：' + fmt(pt.y, 4));
      });
      tip.innerHTML = rows.join('<br>');
      var px = geom.X(nearest);
      tip.style.left = Math.min(geom.w - 110, Math.max(4, px + 10)) + 'px';
      tip.style.top = '14px';
      tip.style.opacity = 1;
    }
    function leave() { tip.style.opacity = 0; }
    canvas.__tt = { move: move, leave: leave, tip: tip };
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseleave', leave);
  }

  /* ===========================================================================
   * 柱状图
   * ======================================================================== */
  function barChart(canvas, opts) {
    var S = setup(canvas, opts.height);
    var ctx = S.ctx, w = S.w, h = S.h;
    var pad = { t: 16, r: 14, b: 40, l: 46 };
    var top = drawTitle(ctx, opts, w); pad.t += top;
    if (opts.horizontal) pad.b = 26;
    if (opts.legend !== false && opts.series.length > 1) {
      drawLegend(ctx, opts.series.map(function (s, i) { return { label: s.label, color: s.color || SERIES_COLORS[i % 8] }; }), w, pad.t - 2);
      pad.t += 16;
    }

    var labels = opts.labels;
    var all = [];
    opts.series.forEach(function (s) { s.values.forEach(function (v) { all.push(v); }); });
    var vMax = Math.max.apply(null, all.concat([0]));
    var vMin = Math.min.apply(null, all.concat([0]));
    if (opts.valueMin !== undefined) vMin = opts.valueMin;
    var ticks = niceTicks(vMin, vMax, 5);
    vMin = Math.min(vMin, ticks[0]); vMax = Math.max(vMax, ticks[ticks.length - 1]);
    if (vMax === vMin) vMax = vMin + 1;

    if (opts.horizontal) {
      pad.l = 74;
      var innerW = w - pad.l - pad.r;
      var n0 = labels.length;
      var rowH = (h - pad.t - pad.b) / n0;
      var barH = Math.min(rowH * 0.62 / opts.series.length, 14);
      function VX(v) { return pad.l + (v - vMin) / (vMax - vMin) * innerW; }
      ctx.strokeStyle = LINE; ctx.fillStyle = INK[400]; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ticks.forEach(function (t) {
        var x = Math.round(VX(t)) + .5;
        ctx.beginPath(); ctx.moveTo(x, pad.t - 4); ctx.lineTo(x, h - pad.b); ctx.stroke();
        ctx.fillText(fmt(t), VX(t), h - pad.b + 6);
      });
      labels.forEach(function (lb, i) {
        var cy = pad.t + i * rowH + rowH / 2;
        ctx.fillStyle = INK[600] || INK[700]; ctx.font = '11.5px ' + FONT;
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(lb, pad.l - 9, cy);
        opts.series.forEach(function (s, si) {
          var v = s.values[i];
          var y = cy - (opts.series.length * barH) / 2 + si * barH;
          var x0 = VX(Math.max(0, vMin)), x1 = VX(v);
          ctx.fillStyle = s.color || SERIES_COLORS[si % 8];
          roundRect(ctx, Math.min(x0, x1), y + 1, Math.abs(x1 - x0), barH - 2, 3);
          ctx.fill();
          if (opts.showValues) {
            ctx.fillStyle = INK[500]; ctx.font = '10.5px ' + FONT;
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText(fmt(v), x1 + 5, y + barH / 2);
          }
        });
      });
    } else {
      var innerW2 = w - pad.l - pad.r;
      var n = labels.length;
      var slot = innerW2 / n;
      var barW = Math.min(slot * 0.66 / opts.series.length, 46);
      function VY(v) { return h - pad.b - (v - vMin) / (vMax - vMin) * (h - pad.t - pad.b); }
      ctx.strokeStyle = LINE; ctx.fillStyle = INK[400]; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ticks.forEach(function (t) {
        var y = Math.round(VY(t)) + .5;
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
        ctx.fillText(fmt(t), pad.l - 7, VY(t));
      });
      ctx.strokeStyle = '#d3dbe9'; ctx.beginPath();
      ctx.moveTo(pad.l, pad.t - 4); ctx.lineTo(pad.l, h - pad.b); ctx.lineTo(w - pad.r, h - pad.b); ctx.stroke();

      labels.forEach(function (lb, i) {
        var cx = pad.l + slot * (i + 0.5);
        opts.series.forEach(function (s, si) {
          var v = s.values[i];
          var y0 = VY(Math.max(0, vMin)), y1 = VY(v);
          var x = cx - (opts.series.length * barW) / 2 + si * barW;
          var grad = ctx.createLinearGradient(0, Math.min(y0, y1), 0, Math.max(y0, y1));
          var base = s.color || SERIES_COLORS[si % 8];
          grad.addColorStop(0, base);
          grad.addColorStop(1, shade(base, 0.18));
          ctx.fillStyle = grad;
          roundRect(ctx, x + 1, Math.min(y0, y1), barW - 2, Math.abs(y0 - y1) || 1, 4);
          ctx.fill();
          if (opts.showValues) {
            ctx.fillStyle = INK[500]; ctx.font = '10.5px ' + FONT;
            ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            ctx.fillText(fmt(v), x + barW / 2, Math.min(y0, y1) - 3);
          }
        });
        ctx.fillStyle = INK[500]; ctx.font = '11px ' + FONT;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        var txt = String(lb);
        if (ctx.measureText(txt).width > slot - 4) {
          ctx.save();
          ctx.translate(cx, h - pad.b + 6); ctx.rotate(-Math.PI / 3.4);
          ctx.textAlign = 'right'; ctx.fillText(txt, 0, 0);
          ctx.restore();
        } else ctx.fillText(txt, cx, h - pad.b + 7);
      });
    }
    if (opts.yLabel && !opts.horizontal) {
      ctx.save(); ctx.fillStyle = INK[400]; ctx.font = '10.5px ' + FONT;
      ctx.translate(11, pad.t); ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText(opts.yLabel, 0, 0); ctx.restore();
    }
  }

  function shade(hex, amt) {
    var c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(function (x) { return x + x; }).join('');
    var r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
    r = Math.round(r + (255 - r) * amt); g = Math.round(g + (255 - g) * amt); b = Math.round(b + (255 - b) * amt);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  /* ===========================================================================
   * 直方图
   * ======================================================================== */
  function histChart(canvas, opts) {
    var bins = opts.bins || [];
    barChart(canvas, {
      height: opts.height, title: opts.title,
      labels: bins.map(function (b) { return fmt(b.mid, 2); }),
      series: [{ label: opts.label || '频数', values: bins.map(function (b) { return b.count; }), color: opts.color || PALETTE.brand }],
      legend: false, yLabel: opts.yLabel || '频数', markers: opts.markers,
      valueMin: 0
    });
  }

  /* ===========================================================================
   * 热力矩阵（运输/指派/动态规划表）
   * ======================================================================== */
  function heatmap(canvas, opts) {
    var S = setup(canvas, opts.height);
    var ctx = S.ctx, w = S.w, h = S.h;
    var rows = opts.rows, cols = opts.cols, values = opts.values;
    var top = drawTitle(ctx, opts, w);
    var padL = opts.padL || 54, padT = top + 22, padR = 10, padB = 16;
    var cw = (w - padL - padR) / cols.length;
    var ch = (h - padT - padB) / rows.length;
    var vMin = Infinity, vMax = -Infinity;
    values.forEach(function (r) { r.forEach(function (v) { if (v !== null && isFinite(v)) { vMin = Math.min(vMin, v); vMax = Math.max(vMax, v); } }); });
    if (!isFinite(vMin)) { vMin = 0; vMax = 1; }
    if (vMax - vMin < 1e-12) vMax = vMin + 1;
    var hue = opts.hue || 'brand';

    ctx.font = '10.5px ' + FONT;
    ctx.fillStyle = INK[500]; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    cols.forEach(function (c, j) { ctx.fillText(String(c), padL + cw * (j + .5), padT - 5); });
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    rows.forEach(function (r, i) { ctx.fillText(String(r), padL - 7, padT + ch * (i + .5)); });

    values.forEach(function (row, i) {
      row.forEach(function (v, j) {
        var t = (v - vMin) / (vMax - vMin);
        ctx.fillStyle = gradientColor(hue, t, v);
        roundRect(ctx, padL + cw * j + 1.5, padT + ch * i + 1.5, cw - 3, ch - 3, 5);
        ctx.fill();
        if (opts.showValues !== false && cw > 26) {
          ctx.fillStyle = t > 0.55 ? '#fff' : INK[700];
          ctx.font = (opts.highlight && opts.highlight(i, j) ? '700 ' : '500 ') + Math.min(12, Math.max(9, cw / 4.6)) + 'px ' + FONT;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(fmt(v, opts.digits === undefined ? 2 : opts.digits), padL + cw * (j + .5), padT + ch * (i + .5));
        }
      });
    });
    if (opts.highlight) {
      values.forEach(function (row, i) {
        row.forEach(function (v, j) {
          if (opts.highlight(i, j)) {
            ctx.strokeStyle = PALETTE.rose; ctx.lineWidth = 2;
            roundRect(ctx, padL + cw * j + 1.5, padT + ch * i + 1.5, cw - 3, ch - 3, 5);
            ctx.stroke();
          }
        });
      });
    }
  }

  function gradientColor(hue, t, v) {
    var base = PALETTE[hue] || PALETTE.brand;
    if (v === null || !isFinite(v)) return '#f4f6fb';
    var c = base.replace('#', '');
    var r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
    var mix = 0.90 - t * 0.90;
    r = Math.round(r + (255 - r) * mix);
    g = Math.round(g + (255 - g) * mix);
    b = Math.round(b + (255 - b) * mix);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  /* ===========================================================================
   * 散点图
   * ======================================================================== */
  function scatterChart(canvas, opts) {
    var S = setup(canvas, opts.height);
    var ctx = S.ctx, w = S.w, h = S.h;
    var pad = { t: 16, r: 14, b: 32, l: 48 };
    var top = drawTitle(ctx, opts, w); pad.t += top;
    var pts = opts.points || [];
    if (!pts.length) { ctx.fillStyle = INK[400]; ctx.fillText('暂无数据', 10, 40); return; }
    var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
    var xT = niceTicks(Math.min.apply(null, xs), Math.max.apply(null, xs), 6);
    var yT = niceTicks(Math.min.apply(null, ys), Math.max.apply(null, ys), 5);
    var xMin = xT[0], xMax = xT[xT.length - 1], yMin = Math.min(yT[0], 0), yMax = yT[yT.length - 1];
    if (xMax === xMin) xMax = xMin + 1;
    function X(v) { return pad.l + (v - xMin) / (xMax - xMin) * (w - pad.l - pad.r); }
    function Y(v) { return h - pad.b - (v - yMin) / (yMax - yMin) * (h - pad.t - pad.b); }
    ctx.strokeStyle = LINE; ctx.fillStyle = INK[400]; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    yT.forEach(function (t) { var y = Math.round(Y(t)) + .5; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke(); ctx.fillText(fmt(t), pad.l - 7, Y(t)); });
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    xT.forEach(function (t) { ctx.fillText(fmt(t), X(t), h - pad.b + 7); });
    ctx.strokeStyle = '#d3dbe9'; ctx.beginPath(); ctx.moveTo(pad.l, pad.t - 4); ctx.lineTo(pad.l, h - pad.b); ctx.lineTo(w - pad.r, h - pad.b); ctx.stroke();
    pts.forEach(function (p, i) {
      ctx.beginPath();
      ctx.arc(X(p.x), Y(p.y), p.r || 3, 0, Math.PI * 2);
      ctx.fillStyle = p.color || opts.color || PALETTE.brand;
      ctx.globalAlpha = 0.72;
      ctx.fill(); ctx.globalAlpha = 1;
    });
    if (opts.fitLine) {
      var n = pts.length;
      var mx = xs.reduce(function (a, b) { return a + b; }, 0) / n, my = ys.reduce(function (a, b) { return a + b; }, 0) / n;
      var num = 0, den = 0;
      pts.forEach(function (p) { num += (p.x - mx) * (p.y - my); den += Math.pow(p.x - mx, 2); });
      var k = den > 1e-12 ? num / den : 0, b0 = my - k * mx;
      ctx.beginPath(); ctx.strokeStyle = PALETTE.rose; ctx.lineWidth = 1.6; ctx.setLineDash([6, 4]);
      ctx.moveTo(X(xMin), Y(k * xMin + b0)); ctx.lineTo(X(xMax), Y(k * xMax + b0)); ctx.stroke(); ctx.setLineDash([]);
    }
    if (opts.xLabel || opts.yLabel) {
      ctx.fillStyle = INK[400]; ctx.font = '10.5px ' + FONT;
      if (opts.xLabel) { ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(opts.xLabel, w - pad.r, h - 3); }
      if (opts.yLabel) { ctx.save(); ctx.translate(11, pad.t); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText(opts.yLabel, 0, 0); ctx.restore(); }
    }
  }

  /* ===========================================================================
   * 甘特图 (SVG)
   * ======================================================================== */
  function ganttSVG(opts) {
    var acts = opts.activities;
    var total = opts.total || Math.max.apply(null, acts.map(function (a) { return a.LF || a.EF; })) || 1;
    var rowH = 30, labW = 108, padR = 20, padT = 28, padB = 30;
    var W = 1000, innerW = W - labW - padR;
    var H = padT + acts.length * rowH + padB;
    function X(v) { return labW + (v / total) * innerW; }
    var s = ['<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:' + FONT + '">'];
    // 网格与刻度
    var ticks = niceTicks(0, total, 8);
    ticks.forEach(function (t) {
      var x = X(t);
      s.push('<line x1="' + x + '" y1="' + (padT - 6) + '" x2="' + x + '" y2="' + (H - padB + 4) + '" stroke="' + LINE + '" stroke-width="1"/>');
      s.push('<text x="' + x + '" y="' + (H - padB + 18) + '" fill="' + INK[400] + '" font-size="11" text-anchor="middle">' + fmt(t) + '</text>');
    });
    s.push('<line x1="' + labW + '" y1="' + (padT - 6) + '" x2="' + labW + '" y2="' + (H - padB + 4) + '" stroke="#d3dbe9" stroke-width="1"/>');
    acts.forEach(function (a, i) {
      var y = padT + i * rowH;
      var barY = y + 6, barH = rowH - 14;
      var crit = a.critical;
      // 时差条
      if (a.totalFloat > 1e-6) {
        s.push('<rect x="' + X(a.ES) + '" y="' + (barY + 2) + '" width="' + Math.max(1, X(a.LF) - X(a.ES)) + '" height="' + (barH - 4) + '" rx="4" fill="' + (crit ? PALETTE.roseSoft : PALETTE.slateSoft) + '"/>');
      }
      var x0 = X(a.ES), x1 = X(a.EF);
      var fill = crit ? 'url(#critGrad)' : 'url(#normGrad)';
      s.push('<rect x="' + x0 + '" y="' + barY + '" width="' + Math.max(2, x1 - x0) + '" height="' + barH + '" rx="5" fill="' + fill + '"' + (crit ? ' stroke="' + PALETTE.rose + '" stroke-width="1.2"' : '') + '/>');
      var inner = (x1 - x0) > 54;
      if (inner) {
        s.push('<text x="' + ((x0 + x1) / 2) + '" y="' + (barY + barH / 2 + 4) + '" fill="#fff" font-size="11" font-weight="600" text-anchor="middle">' + fmt(a.te, 2) + '</text>');
      } else {
        s.push('<text x="' + (x1 + 6) + '" y="' + (barY + barH / 2 + 4) + '" fill="' + INK[500] + '" font-size="11" text-anchor="start">' + fmt(a.te, 2) + '</text>');
      }
      s.push('<text x="' + (labW - 10) + '" y="' + (barY + barH / 2 + 4) + '" fill="' + (crit ? PALETTE.rose : INK[700]) + '" font-size="11.5" font-weight="' + (crit ? 650 : 500) + '" text-anchor="end">' + a.id + ' ' + (a.name.length > 7 ? a.name.slice(0, 6) + '…' : a.name) + '</text>');
    });
    s.push('<defs>' +
      '<linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fb7185"/><stop offset="1" stop-color="#e11d48"/></linearGradient>' +
      '<linearGradient id="normGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d8cff"/><stop offset="1" stop-color="#2b5cff"/></linearGradient>' +
      '</defs>');
    s.push('</svg>');
    return s.join('');
  }

  /* ===========================================================================
   * 网络图 (SVG) —— 支持分层布局或自定义坐标
   * ======================================================================== */
  function networkSVG(opts) {
    var nodes = opts.nodes, edges = opts.edges;
    var W = opts.width || 900, H = opts.height || 380;
    var pos = {};
    if (opts.layout === 'layered') {
      var layers = opts.layers || [];
      var maxN = Math.max.apply(null, layers.map(function (l) { return l.length; }));
      var colW = W / (layers.length + 0.6);
      layers.forEach(function (layer, li) {
        layer.forEach(function (id, ni) {
          pos[id] = {
            x: 56 + li * colW,
            y: (H / (layer.length + 1)) * (ni + 1)
          };
        });
      });
    } else {
      nodes.forEach(function (n) { pos[n.id] = { x: n.x * W, y: n.y * H }; });
    }
    var s = ['<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;font-family:' + FONT + '">'];
    s.push('<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#8492ad"/></marker>'
      + '<marker id="arrowHot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="' + PALETTE.rose + '"/></marker></defs>');
    edges.forEach(function (e) {
      var a = pos[e.from], b = pos[e.to];
      if (!a || !b) return;
      var hot = opts.highlightEdge && opts.highlightEdge(e);
      var stroke = hot ? PALETTE.rose : (e.color || '#b9c3d6');
      var wdt = hot ? 2.6 : (e.width || 1.6);
      var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      var ux = dx / len, uy = dy / len, rA = e.rFrom || 17, rB = e.rTo || 19;
      var x1 = a.x + ux * rA, y1 = a.y + uy * rA, x2 = b.x - ux * rB, y2 = b.y - uy * rB;
      // 曲线（避免重叠）
      var mx = (x1 + x2) / 2 - uy * (e.bend || 0), my = (y1 + y2) / 2 + ux * (e.bend || 0);
      s.push('<path d="M ' + x1 + ' ' + y1 + ' Q ' + mx + ' ' + my + ' ' + x2 + ' ' + y2 + '" fill="none" stroke="' + stroke + '" stroke-width="' + wdt + '"' +
        (hot ? ' marker-end="url(#arrowHot)"' : ' marker-end="url(#arrow)"') + (e.dash ? ' stroke-dasharray="5 4"' : '') + '/>');
      if (e.label !== undefined && e.label !== '') {
        s.push('<g><rect x="' + (mx - 15) + '" y="' + (my - 11) + '" width="30" height="19" rx="6" fill="#fff" stroke="' + (hot ? PALETTE.rose : LINE) + '" stroke-width="1"/>' +
          '<text x="' + mx + '" y="' + (my + 2.5) + '" fill="' + (hot ? PALETTE.rose : INK[700]) + '" font-size="10.5" font-weight="600" text-anchor="middle">' + e.label + '</text></g>');
      }
    });
    nodes.forEach(function (n) {
      var p = pos[n.id];
      if (!p) return;
      if (n.shape === 'rect') {
        var bw = n.w || 62, bh = n.h || 34;
        s.push('<rect x="' + (p.x - bw / 2) + '" y="' + (p.y - bh / 2) + '" width="' + bw + '" height="' + bh + '" rx="9" fill="' + (n.fill || '#fff') + '" stroke="' + (n.stroke || '#b9c3d6') + '" stroke-width="' + (n.sw || 1.6) + '"/>');
      } else {
        s.push('<circle cx="' + p.x + '" cy="' + p.y + '" r="' + (n.r || 18) + '" fill="' + (n.fill || '#fff') + '" stroke="' + (n.stroke || '#b9c3d6') + '" stroke-width="' + (n.sw || 1.6) + '"/>');
      }
      s.push('<text x="' + p.x + '" y="' + (p.y + 4) + '" fill="' + (n.textFill || INK[700]) + '" font-size="' + (n.fs || 11.5) + '" font-weight="' + (n.fw || 600) + '" text-anchor="middle">' + n.label + '</text>');
      if (n.sub) {
        s.push('<text x="' + p.x + '" y="' + (p.y + (n.shape === 'rect' ? (n.h || 34) / 2 + 14 : 34)) + '" fill="' + INK[400] + '" font-size="10" text-anchor="middle">' + n.sub + '</text>');
      }
    });
    s.push('</svg>');
    return s.join('');
  }

  OR.charts = {
    line: lineChart, bar: barChart, hist: histChart, heatmap: heatmap,
    scatter: scatterChart, gantt: ganttSVG, network: networkSVG,
    PALETTE: PALETTE, SERIES_COLORS: SERIES_COLORS, fmt: fmt, niceTicks: niceTicks
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = OR.charts;
})(typeof window !== 'undefined' ? window : globalThis);
