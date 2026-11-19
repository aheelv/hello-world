/* =============================================================================
 * OR-SimLab · UI 基础组件库
 * -----------------------------------------------------------------------------
 * DOM 构建、提示、弹窗、本地存储、格式化工具。零依赖。
 * ========================================================================== */
(function (global) {
  'use strict';
  var OR = global.OR = global.OR || {};

  /* ---------- DOM ---------- */
  function el(tag, attrs, children) {
    var parts = tag.split(/([.#])/);
    var name = 'div', cls = [], id = null;
    var t = tag.trim();
    var m = t.match(/^([a-zA-Z0-9-]+)?((?:[.#][\w-]+)*)$/);
    if (m) {
      name = m[1] || 'div';
      (m[2] || '').split(/(?=[.#])/).forEach(function (seg) {
        if (seg[0] === '.') cls.push(seg.slice(1));
        else if (seg[0] === '#') id = seg.slice(1);
      });
    }
    var node = document.createElement(name);
    if (cls.length) node.className = cls.join(' ');
    if (id) node.id = id;
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') { node.className = (node.className ? node.className + ' ' : '') + v; }
        else if (k === 'style') { node.setAttribute('style', v); }
        else if (k === 'html') { node.innerHTML = v; }
        else if (k === 'text') { node.textContent = v; }
        else if (k === 'dataset') { Object.keys(v).forEach(function (dk) { node.dataset[dk] = v[dk]; }); }
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') { node.addEventListener(k.slice(2).toLowerCase(), v); }
        else node.setAttribute(k, v);
      });
    }
    append(node, children);
    return node;
  }

  function append(node, children) {
    if (children === null || children === undefined || children === false) return node;
    if (Array.isArray(children)) { children.forEach(function (c) { append(node, c); }); return node; }
    if (children instanceof Node) { node.appendChild(children); return node; }
    node.appendChild(document.createTextNode(String(children)));
    return node;
  }

  function svgIcon(path, size) {
    var s = size || 17;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" ' +
      'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
  }

  var ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
    flask: '<path d="M9 3h6"/><path d="M10 3v6.5L4.6 18A2 2 0 0 0 6.3 21h11.4a2 2 0 0 0 1.7-3L14 9.5V3"/><path d="M7.2 15h9.6"/>',
    book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-4"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    spark: '<path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><circle cx="12" cy="12" r="3.2"/>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>',
    play: '<path d="M6 3.6v16.8L20 12z"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
    send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    check2: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>'
  };
  function icon(name, size) { return svgIcon(ICONS[name] || ICONS.grid, size); }

  /* ---------- 格式化 ---------- */
  function num(v, d) {
    if (v === null || v === undefined || !isFinite(v)) return '–';
    if (d === undefined) d = Math.abs(v) >= 1000 ? 1 : Math.abs(v) >= 1 ? 3 : 4;
    return Number(v.toFixed(d)).toLocaleString('zh-CN', { maximumFractionDigits: d });
  }
  function pct(v, d) { return num(v * 100, d === undefined ? 1 : d) + '%'; }
  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- Toast ---------- */
  function toast(msg, type, ms) {
    var wrap = document.querySelector('.toast-wrap');
    if (!wrap) { wrap = el('div.toast-wrap'); document.body.appendChild(wrap); }
    var ico = type === 'ok' ? '✓' : type === 'err' ? '✕' : type === 'warn' ? '!' : 'i';
    var t = el('div.toast' + (type ? '.' + type : ''), null, [el('span', { text: ico }), el('span', { text: msg })]);
    wrap.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .25s, transform .25s';
      t.style.opacity = '0'; t.style.transform = 'translateX(20px)';
      setTimeout(function () { t.remove(); }, 260);
    }, ms || 2600);
  }

  /* ---------- Modal ---------- */
  function modal(opts) {
    var mask = el('div.modal-mask');
    var box = el('div.modal', { style: opts.width ? 'max-width:' + opts.width : null });
    var head = el('div.modal-head', null, [el('h3', { text: opts.title || '' })]);
    var closeBtn = el('button.btn.btn-ghost.btn-ico', { html: icon('close', 16), onclick: close, title: '关闭' });
    head.appendChild(closeBtn);
    var body = el('div.modal-body', { html: opts.html || '' });
    box.appendChild(head); box.appendChild(body);
    if (opts.actions) {
      var foot = el('div.modal-foot');
      opts.actions.forEach(function (a) {
        foot.appendChild(el('button.btn' + (a.primary ? '.btn-primary' : '') , { text: a.label, onclick: function () { if (!a.onClick || a.onClick(body) !== false) close(); } }));
      });
      box.appendChild(foot);
    }
    mask.appendChild(box);
    mask.addEventListener('click', function (e) { if (e.target === mask) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(mask);
    function onKey(e) { if (e.key === 'Escape') close(); }
    function close() { document.removeEventListener('keydown', onKey); mask.style.opacity = '0'; setTimeout(function () { mask.remove(); }, 180); }
    return { close: close, body: body, el: box };
  }

  /* ---------- Store（本地持久化） ---------- */
  var KEY = 'orsimlab.v1';
  var Store = {
    data: null,
    load: function () {
      if (this.data) return this.data;
      try { this.data = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { this.data = {}; }
      if (!this.data.progress) this.data.progress = {};
      if (!this.data.records) this.data.records = [];
      if (!this.data.settings) this.data.settings = { aiProvider: 'cloud', aiModel: '', apiBase: '', apiKey: '', theme: 'light' };
      if (!this.data.wrong) this.data.wrong = [];
      return this.data;
    },
    save: function () { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { } },
    get: function (path, fallback) {
      var d = this.load(), cur = d;
      path.split('.').forEach(function (p) { cur = cur && cur[p]; });
      return cur === undefined || cur === null ? fallback : cur;
    },
    set: function (path, value) {
      var d = this.load(), segs = path.split('.'), cur = d;
      for (var i = 0; i < segs.length - 1; i++) { if (!cur[segs[i]]) cur[segs[i]] = {}; cur = cur[segs[i]]; }
      cur[segs[segs.length - 1]] = value;
      this.save();
    },
    /** 记录一次实验结果 */
    record: function (entry) {
      var d = this.load();
      d.records.unshift(Object.assign({ ts: Date.now() }, entry));
      if (d.records.length > 200) d.records.length = 200;
      this.save();
    },
    /** 更新某场景学习进度 */
    setProgress: function (labId, patch) {
      var d = this.load();
      var p = d.progress[labId] || { runs: 0, solved: 0, total: 0, best: 0, lastAt: 0, done: false };
      Object.assign(p, patch);
      p.lastAt = Date.now();
      d.progress[labId] = p;
      this.save();
      return p;
    },
    getProgress: function (labId) {
      return this.load().progress[labId] || { runs: 0, solved: 0, total: 0, best: 0, lastAt: 0, done: false };
    },
    addWrong: function (item) {
      var d = this.load();
      if (!d.wrong.some(function (w) { return w.id === item.id; })) d.wrong.unshift(item);
      if (d.wrong.length > 100) d.wrong.length = 100;
      this.save();
    },
    removeWrong: function (id) {
      var d = this.load();
      d.wrong = d.wrong.filter(function (w) { return w.id !== id; });
      this.save();
    },
    reset: function () { this.data = null; localStorage.removeItem(KEY); this.load(); }
  };

  /* ---------- 组件工厂 ---------- */
  function metricTile(k, v, unit, tone, hint) {
    return el('div.metric' + (tone ? '.' + tone : ''), null, [
      el('div.metric-k', { text: k }),
      el('div.metric-v', { html: num(v) + (unit ? '<small>' + unit + '</small>' : '') }),
      hint ? el('div.tiny.muted', { text: hint, style: 'margin-top:2px' }) : null
    ]);
  }

  function ring(value, size, color, label) {
    size = size || 46;
    var r = size / 2 - 4, c = 2 * Math.PI * r;
    var v = Math.max(0, Math.min(1, value));
    var s = size;
    return '<div class="ring" style="width:' + s + 'px;height:' + s + 'px"><svg width="' + s + '" height="' + s + '">' +
      '<circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" fill="none" stroke="#e4e9f2" stroke-width="4"/>' +
      '<circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" fill="none" stroke="' + (color || '#2b5cff') + '" stroke-width="4" ' +
      'stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - v)) + '"/>' +
      '</svg><span class="val">' + (label !== undefined ? label : Math.round(v * 100) + '%') + '</span></div>';
  }

  function field(label, control, hint, unit) {
    return el('div.field', null, [
      el('div.field-label', null, [el('span', { text: label }), unit ? el('span.unit', { text: unit }) : null]),
      control,
      hint ? el('div.field-hint', { text: hint }) : null
    ]);
  }

  /** 滑块 + 数值输入联动 */
  function slider(opts) {
    var numInput = el('input.input.num', {
      type: 'number', value: opts.value, min: opts.min, max: opts.max, step: opts.step || 1,
      style: 'width:78px;text-align:right'
    });
    var range = el('input', {
      type: 'range', min: opts.min, max: opts.max, step: opts.step || 1, value: opts.value
    });
    var wrap = el('div.vstack', { style: 'gap:2px' }, [
      el('div.hstack', { style: 'gap:8px' }, [range, numInput]),
      opts.hint ? el('div.field-hint', { text: opts.hint }) : null
    ]);
    function sync(v, from) {
      v = Number(v);
      if (!isFinite(v)) return;
      v = Math.max(opts.min, Math.min(opts.max, v));
      if (from !== 'range') range.value = v;
      if (from !== 'num') numInput.value = v;
      opts.onChange && opts.onChange(v);
    }
    range.addEventListener('input', function () { sync(range.value, 'range'); });
    numInput.addEventListener('change', function () { sync(numInput.value, 'num'); });
    wrap.setValue = function (v) { sync(v); };
    wrap.getInput = function () { return numInput; };
    return wrap;
  }

  function segmented(options, value, onChange) {
    var wrap = el('div.seg');
    options.forEach(function (o) {
      var val = typeof o === 'string' ? o : o.value;
      var lbl = typeof o === 'string' ? o : o.label;
      var b = el('button' + (val === value ? '.on' : ''), { text: lbl, type: 'button' });
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(wrap.children, function (c) { c.classList.remove('on'); });
        b.classList.add('on');
        onChange(val);
      });
      wrap.appendChild(b);
    });
    return wrap;
  }

  function toggle(label, checked, onChange) {
    var input = el('input', { type: 'checkbox' });
    input.checked = !!checked;
    input.addEventListener('change', function () { onChange(input.checked); });
    return el('label.switch', null, [input, el('span.switch-track'), el('span.small', { text: label, style: 'font-weight:600;color:var(--ink-600)' })]);
  }

  function tabs(items, active, onChange) {
    var wrap = el('div.tabs');
    items.forEach(function (it) {
      var b = el('button.tab' + (it.id === active ? '.on' : ''), { text: it.label, type: 'button' });
      b.addEventListener('click', function () { onChange(it.id); });
      wrap.appendChild(b);
    });
    return wrap;
  }

  /** 极简 Markdown 渲染（AI 回复、文档内联） */
  function md(text) {
    if (!text) return '';
    var s = esc(text);
    var blocks = s.split(/```/);
    var out = blocks.map(function (b, i) {
      if (i % 2 === 1) {
        var lines = b.replace(/^\n/, '').split('\n');
        var lang = lines[0].match(/^[a-zA-Z]+$/) ? lines.shift() : '';
        return '<pre><code>' + lines.join('\n') + '</code></pre>';
      }
      var t = b;
      t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
      t = t.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
      t = t.replace(/^### (.+)$/gm, '<h4>$1</h4>');
      t = t.replace(/^## (.+)$/gm, '<h4>$1</h4>');
      t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      t = t.replace(/^\s*[-*] (.+)$/gm, '<li>$1</li>');
      t = t.replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, '<ul>$1</ul>');
      t = t.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');
      t = t.replace(/\n{2,}/g, '</p><p>');
      t = t.replace(/\n/g, '<br>');
      if (!/^\s*<(ul|h4|pre|p)/.test(t)) t = '<p>' + t + '</p>';
      return t;
    }).join('');
    return out.replace(/<p>\s*<\/p>/g, '');
  }

  OR.ui = {
    el: el, append: append, icon: icon, ICONS: ICONS, num: num, pct: pct, esc: esc,
    toast: toast, modal: modal, Store: Store, metricTile: metricTile, ring: ring,
    field: field, slider: slider, segmented: segmented, toggle: toggle, tabs: tabs, md: md
  };
  OR.Store = Store;
})(typeof window !== 'undefined' ? window : globalThis);
