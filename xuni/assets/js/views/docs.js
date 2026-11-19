/* =============================================================================
 * OR-SimLab · 文档中心
 * -----------------------------------------------------------------------------
 * 读取构建期打包的 OR.Docs.content（见 tools/build-docs.js），
 * 在页面内渲染技术文档：左侧目录树 + 右侧正文 + 顶部章节锚点。
 * 之所以打包为 JS 而非 fetch，是为了让文档在 file:// 与断网环境下依旧可读。
 * ========================================================================== */
(function (global) {
  'use strict';
  var OR = global.OR = global.OR || {};

  /* ===========================================================================
   * 一、Markdown 渲染（面向技术文档，支持表格 / 引用 / 分隔线 / 代码块）
   * ======================================================================== */
  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** 行内元素：先转义，再解析代码 / 粗体 / 斜体 / 链接 */
  function inline(s) {
    var t = esc(s);
    var codes = [];
    // 抽出行内代码，避免其中的 * _ [ ] 被后续规则误伤
    t = t.replace(/`([^`]+)`/g, function (_, c) { codes.push(c); return '\u0000C' + (codes.length - 1) + '\u0000'; });
    // 链接 [text](url)
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, txt, url) {
      var ext = /^https?:/i.test(url);
      return '<a href="' + esc(url) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + txt + '</a>';
    });
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    t = t.replace(/\u0000C(\d+)\u0000/g, function (_, i) { return '<code>' + codes[+i] + '</code>'; });
    return t;
  }

  function slug(text) {
    return String(text).trim().toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '').slice(0, 60) || 'sec';
  }

  /**
   * 主渲染器
   * @returns {{html: string, toc: Array<{level:number,id:string,text:string}>}}
   */
  function renderMarkdown(md) {
    var lines = String(md || '').replace(/\r\n/g, '\n').split('\n');
    var out = [];
    var toc = [];
    var used = {};
    var i = 0;

    function uniqueId(base) {
      var id = base, n = 1;
      while (used[id]) { id = base + '-' + (++n); }
      used[id] = true;
      return id;
    }

    while (i < lines.length) {
      var line = lines[i];

      /* --- 代码块 --- */
      if (/^```/.test(line)) {
        var lang = line.slice(3).trim();
        var buf = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++; // 跳过结束围栏
        out.push('<pre' + (lang ? ' data-lang="' + esc(lang) + '"' : '') + '><code>' +
          esc(buf.join('\n')) + '</code></pre>');
        continue;
      }

      /* --- 分隔线 --- */
      if (/^\s*---+\s*$/.test(line)) { out.push('<hr>'); i++; continue; }

      /* --- 标题 --- */
      var hm = line.match(/^(#{1,6})\s+(.*)$/);
      if (hm) {
        var lv = hm[1].length;
        var text = hm[2].trim();
        var id = uniqueId('sec-' + slug(text));
        if (lv >= 2 && lv <= 3) toc.push({ level: lv, id: id, text: text });
        out.push('<h' + lv + ' id="' + id + '">' + inline(text) + '</h' + lv + '>');
        i++;
        continue;
      }

      /* --- 表格 --- */
      if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
        var head = splitRow(line);
        var aligns = splitRow(lines[i + 1]).map(function (c) {
          var l = c.trim();
          if (/^:-+:$/.test(l)) return 'center';
          if (/^-+:$/.test(l)) return 'right';
          return 'left';
        });
        i += 2;
        var rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(splitRow(lines[i])); i++; }
        out.push('<div class="doc-tbl-wrap"><table><thead><tr>' +
          head.map(function (c, k) {
            return '<th style="text-align:' + (aligns[k] || 'left') + '">' + inline(c.trim()) + '</th>';
          }).join('') + '</tr></thead><tbody>' +
          rows.map(function (r) {
            return '<tr>' + r.map(function (c, k) {
              return '<td style="text-align:' + (aligns[k] || 'left') + '">' + inline(c.trim()) + '</td>';
            }).join('') + '</tr>';
          }).join('') + '</tbody></table></div>');
        continue;
      }

      /* --- 引用块 --- */
      if (/^\s*>\s?/.test(line)) {
        var qbuf = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
          qbuf.push(lines[i].replace(/^\s*>\s?/, '')); i++;
        }
        out.push('<blockquote>' + inline(qbuf.join(' ')) + '</blockquote>');
        continue;
      }

      /* --- 列表 --- */
      if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
        var ordered = /^\s*\d+\.\s+/.test(line);
        var items = [];
        while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*([-*+]|\d+\.)\s+/, ''));
          i++;
        }
        out.push('<' + (ordered ? 'ol' : 'ul') + '>' +
          items.map(function (t) { return '<li>' + inline(t) + '</li>'; }).join('') +
          '</' + (ordered ? 'ol' : 'ul') + '>');
        continue;
      }

      /* --- 空行 --- */
      if (/^\s*$/.test(line)) { i++; continue; }

      /* --- 段落 --- */
      var pbuf = [line];
      i++;
      while (i < lines.length && !/^\s*$/.test(lines[i]) &&
        !/^(#{1,6}\s|```|\s*\||\s*>|\s*([-*+]|\d+\.)\s|\s*---+\s*$)/.test(lines[i])) {
        pbuf.push(lines[i]); i++;
      }
      out.push('<p>' + inline(pbuf.join(' ')) + '</p>');
    }

    return { html: out.join('\n'), toc: toc };
  }

  function splitRow(line) {
    var t = line.trim().replace(/^\|/, '').replace(/\|$/, '');
    var cells = [], cur = '', esc2 = false;
    for (var k = 0; k < t.length; k++) {
      var ch = t[k];
      if (ch === '\\') { cur += t[k + 1] || ''; k++; continue; }
      if (ch === '|') { cells.push(cur); cur = ''; continue; }
      cur += ch;
    }
    cells.push(cur);
    return cells;
  }

  /* ===========================================================================
   * 二、视图
   * ======================================================================== */
  var state = { page: null, scrolled: false };

  function groupNav() {
    var D = OR.Docs;
    var groups = [
      {
        title: '技术文档',
        keys: (D.order || []).filter(function (k) { return k !== 'overview' && k !== 'guide'; })
      },
      { title: '快速上手', keys: (D.order || []).filter(function (k) { return k === 'overview' || k === 'guide'; }) },
      { title: '竞赛材料', keys: D.competition || [] }
    ];
    return groups.filter(function (g) { return g.keys.length; });
  }

  function render(root, pageKey) {
    var U = OR.ui;
    var D = OR.Docs;
    root.innerHTML = '';

    if (!D || !D.content || !Object.keys(D.content).length) {
      root.appendChild(U.el('div.empty', null, [
        U.el('div.ico', { html: U.icon('doc', 36) }),
        U.el('h4', { text: '文档尚未打包' }),
        U.el('p', { text: '请在项目根目录执行 node tools/build-docs.js 生成文档内容，然后刷新页面。' }),
        U.el('button.btn.btn-primary', {
          html: U.icon('reset', 14) + '<span>刷新页面</span>',
          onclick: function () { location.reload(); }
        })
      ]));
      return;
    }

    var order = (D.order || []).concat(D.competition || []);
    if (!pageKey || !D.content[pageKey]) pageKey = order[0];
    state.page = pageKey;
    var doc = D.content[pageKey];

    var layout = U.el('div.doc-layout');

    /* 左侧目录 */
    var nav = U.el('div.doc-nav');
    var navCard = U.el('div.card', null, [U.el('div.card-body', { style: 'padding:12px 10px' })]);
    var navBody = navCard.querySelector('.card-body');

    groupNav().forEach(function (g) {
      navBody.appendChild(U.el('div.nav-group-title', { text: g.title, style: 'padding-top:6px' }));
      g.keys.forEach(function (k) {
        var d = D.content[k];
        if (!d) return;
        navBody.appendChild(U.el('a' + (k === pageKey ? '.on' : ''), {
          href: '#/docs/' + k,
          html: U.icon(d.icon || 'doc', 14) + '<span style="margin-left:8px">' + U.esc(d.title) + '</span>',
          style: 'display:flex;align-items:center'
        }));
      });
    });

    /* 本篇章节锚点 */
    var rendered = renderMarkdown(doc.md);
    if (rendered.toc.length) {
      navBody.appendChild(U.el('div.nav-group-title', { text: '本篇目录', style: 'padding-top:14px' }));
      rendered.toc.filter(function (t) { return t.level === 2; }).forEach(function (t) {
        navBody.appendChild(U.el('a', {
          href: '#' + t.id,
          text: t.text.replace(/^\d+(\.\d+)*\s*/, ''),
          style: 'font-size:12.2px',
          onclick: function (e) { e.preventDefault(); scrollToId(t.id); }
        }));
      });
    }
    nav.appendChild(navCard);
    layout.appendChild(nav);

    /* 右侧正文 */
    var main = U.el('div', { style: 'min-width:0' });

    var headCard = U.el('div.card', { style: 'margin-bottom:16px' }, [
      U.el('div.card-body', { style: 'padding:16px 20px' }, [
        U.el('div.hstack', { style: 'gap:12px;align-items:center;flex-wrap:wrap' }, [
          U.el('div.scn-icon.i-brand', { html: U.icon(doc.icon || 'doc', 18) }),
          U.el('div', { style: 'flex:1;min-width:180px' }, [
            U.el('div.scn-title', { text: doc.title, style: 'font-size:15.5px' }),
            U.el('div.scn-sub', { text: doc.file + ' · ' + doc.chars.toLocaleString('zh-CN') + ' 字符' })
          ]),
          U.el('button.btn.btn-sm', {
            html: U.icon('doc', 13) + '<span>下载源文件</span>',
            onclick: function () { download(doc); }
          }),
          U.el('button.btn.btn-sm.btn-ghost', {
            html: U.icon('check', 13) + '<span>复制全文</span>',
            onclick: function () { copy(doc.md); }
          })
        ])
      ])
    ]);
    main.appendChild(headCard);

    var body = U.el('div.doc-body');
    body.innerHTML = rendered.html;
    main.appendChild(body);

    layout.appendChild(main);
    root.appendChild(layout);

    /* 正文内的站内锚点点击 */
    body.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      if (id && document.getElementById(id)) {
        e.preventDefault();
        scrollToId(id);
      }
    });

    /* 文档之间的上一页 / 下一页 */
    var idx = order.indexOf(pageKey);
    var prev = idx > 0 ? D.content[order[idx - 1]] : null;
    var next = idx >= 0 && idx < order.length - 1 ? D.content[order[idx + 1]] : null;
    main.appendChild(U.el('div.hstack', {
      style: 'gap:12px;margin-top:20px;flex-wrap:wrap'
    }, [
      prev ? U.el('button.btn', {
        html: '<span>← ' + U.esc(prev.title) + '</span>',
        onclick: function () { location.hash = '#/docs/' + prev.key; }
      }) : null,
      U.el('span.spacer'),
      next ? U.el('button.btn.btn-primary', {
        html: '<span>' + U.esc(next.title) + ' →</span>',
        onclick: function () { location.hash = '#/docs/' + next.key; }
      }) : null
    ]));

    if (state.scrolled !== pageKey) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      state.scrolled = pageKey;
    }
  }

  function scrollToId(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var top = el.getBoundingClientRect().top + window.scrollY - 74;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  function download(doc) {
    try {
      var blob = new Blob([doc.md], { type: 'text/markdown;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = doc.file.replace(/^.*\//, '');
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
      OR.ui.toast('已开始下载 ' + doc.file, 'ok');
    } catch (e) {
      OR.ui.toast('下载失败：' + e.message, 'err');
    }
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        OR.ui.toast('全文已复制到剪贴板', 'ok');
      }, function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); OR.ui.toast('全文已复制到剪贴板', 'ok'); }
    catch (e) { OR.ui.toast('复制失败，请手动选择文本', 'err'); }
    ta.remove();
  }

  OR.DocsView = {
    render: render,
    renderMarkdown: renderMarkdown,
    _inline: inline
  };
})(typeof window !== 'undefined' ? window : globalThis);
