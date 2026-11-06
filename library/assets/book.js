/* ============================================================
   书籍页通用渲染引擎
   依赖：window.BOOK（同目录 data.js 定义）、window.LIBRARY（../../assets/books.js）
   新增一本书时不需要改动本文件。
   ============================================================ */
(function () {
  'use strict';

  const B = window.BOOK;
  if (!B) {
    document.body.innerHTML = '<p style="padding:60px;font-family:sans-serif">缺少 data.js：请确认本目录下存在 data.js 并定义了 window.BOOK。</p>';
    return;
  }

  const $ = s => document.querySelector(s);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const escAttr = s => String(s).replace(/"/g, '&quot;');
  const escHtml = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  const THEMES = B.themes || [];
  const QUOTES = B.quotes || [];
  const CHECKS = B.checklist || [];
  const SOURCES = B.sources || [];

  /* ---------------- 顶部导航 ---------------- */
  function initNav() {
    // 用本书主色替换全局强调色，让每本书的标题、统计与色条都带上自己的气质
    const root = document.documentElement;
    if (B.color) {
      root.style.setProperty('--c', B.color);
      root.style.setProperty('--blue-d', B.color);
    }

    $('#navTitle').textContent = B.title;
    $('#navEn').textContent = B.shortEn || '';
    document.title = `《${B.title}》精华总结与金句摘抄`;

    const sel = $('#bookSwitch');
    const books = ((window.LIBRARY && window.LIBRARY.books) || []).filter(b => b.status !== 'planned');
    if (sel) {
      if (books.length < 2) {
        sel.style.display = 'none';
      } else {
        sel.innerHTML = books.map(b =>
          `<option value="${b.slug}"${b.slug === B.slug ? ' selected' : ''}>${b.title}</option>`
        ).join('');
        sel.addEventListener('change', e => {
          location.href = '../' + e.target.value + '/index.html';
        });
      }
    }
  }

  /* ---------------- 首屏 ---------------- */
  function renderHero() {
    $('#heroEyebrow').textContent = (B.titleEn || '').toUpperCase();
    $('#heroTitle').textContent = B.title;
    $('#heroAccent').textContent = B.heroAccent || '';
    $('#heroSub').textContent = B.intro || '';
    $('#heroMeta').textContent = B.meta || '';
    const hint = $('#mapHint');
    if (hint) hint.textContent = B.mapHint || '';
    const fn = $('#footNote');
    if (fn) fn.innerHTML = B.footNote || '';
    const totalPoints = THEMES.reduce((a, t) => a + (t.points || []).length, 0);
    $('#st-themes').textContent = THEMES.length;
    $('#st-ideas').textContent = totalPoints;
    $('#st-quotes').textContent = QUOTES.length;
    $('#st-checks').textContent = CHECKS.length;
    $('#ideaCount').textContent = totalPoints;
  }

  /* ---------------- 思维导图 ---------------- */
  function drawMap() {
    const svg = $('#mapSvg');
    if (!svg) return;

    const W = 1008, TOP = 34, GAP = 22, TITLE_H = 32, ROW = 25, ITEM_H = 21;

    // 左右分栏：优先用 side 字段，否则前一半放右、其余放左
    const right = [], left = [];
    const half = Math.ceil(THEMES.length / 2);
    THEMES.forEach((t, i) => {
      const side = t.side || (i < half ? 'right' : 'left');
      (side === 'right' ? right : left).push(t);
    });

    const blockH = t => TITLE_H + 8 + (t.map || []).length * ROW + 4;
    const totalH = arr => arr.length
      ? arr.reduce((a, t) => a + blockH(t), 0) + GAP * (arr.length - 1)
      : 0;

    const H = Math.max(totalH(right), totalH(left), 420) + TOP * 2;
    const rootY = H / 2;
    const root = { x: (W - 180) / 2, y: rootY - 32, w: 180, h: 64 };

    const RX = { spine: 650, titleX: 662, titleW: 226, itemX: 674, itemW: 214 };
    const LX = { spine: 360, titleX: 120, titleW: 226, itemX: 120, itemW: 214 };

    let out = `<defs>
      <linearGradient id="rootG" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#1B2A3A"/><stop offset="1" stop-color="${B.color || '#2E5C8A'}"/>
      </linearGradient>
    </defs>`;

    const drawSide = (arr, side) => {
      const X = side === 'right' ? RX : LX;
      let y = (H - totalH(arr)) / 2;
      arr.forEach(t => {
        const items = t.map || [];
        const titleY = y;
        const titleCY = titleY + TITLE_H / 2;
        const firstItemY = titleY + TITLE_H + 8;
        const lastItemCY = firstItemY + Math.max(items.length - 1, 0) * ROW + ITEM_H / 2;
        const spineX = X.spine;
        const color = t.color || B.color || '#2E5C8A';

        if (side === 'right') {
          out += `<path d="M${root.x + root.w},${rootY} C${root.x + root.w + 36},${rootY} ${X.titleX - 40},${titleCY} ${X.titleX},${titleCY}"
            fill="none" stroke="${color}" stroke-opacity=".45" stroke-width="2"/>`;
        } else {
          out += `<path d="M${root.x},${rootY} C${root.x - 36},${rootY} ${X.titleX + X.titleW + 40},${titleCY} ${X.titleX + X.titleW},${titleCY}"
            fill="none" stroke="${color}" stroke-opacity=".45" stroke-width="2"/>`;
        }

        if (items.length) {
          out += `<path d="M${spineX},${titleCY} L${spineX},${lastItemCY}" stroke="${color}" stroke-opacity=".3" stroke-width="1.5" fill="none"/>`;
        }
        if (side === 'right') {
          out += `<path d="M${spineX},${titleCY} L${X.titleX},${titleCY}" stroke="${color}" stroke-opacity=".3" stroke-width="1.5"/>`;
        } else {
          out += `<path d="M${X.titleX + X.titleW},${titleCY} L${spineX},${titleCY}" stroke="${color}" stroke-opacity=".3" stroke-width="1.5"/>`;
        }

        out += `<g class="node" data-goto="t-${t.id}">
          <rect class="pill" x="${X.titleX}" y="${titleY}" width="${X.titleW}" height="${TITLE_H}" rx="8" fill="${color}"/>
          <text x="${X.titleX + 13}" y="${titleCY + 4.6}" font-size="13" font-weight="700" fill="#fff">${t.title}</text>
          <text x="${X.titleX + X.titleW - 12}" y="${titleCY + 4}" font-size="10" fill="#fff" fill-opacity=".65" text-anchor="end">${t.no}</text>
        </g>`;

        items.forEach((label, i) => {
          const iy = firstItemY + i * ROW;
          const icy = iy + ITEM_H / 2;
          if (side === 'right') {
            out += `<path d="M${spineX},${icy} L${X.itemX},${icy}" stroke="${color}" stroke-opacity=".28" stroke-width="1.2"/>`;
          } else {
            out += `<path d="M${X.itemX + X.itemW},${icy} L${spineX},${icy}" stroke="${color}" stroke-opacity=".28" stroke-width="1.2"/>`;
          }
          out += `<g class="node" data-goto="t-${t.id}">
            <rect x="${X.itemX}" y="${iy}" width="${X.itemW}" height="${ITEM_H}" rx="6" fill="${color}" fill-opacity=".07" stroke="${color}" stroke-opacity=".16"/>
            <circle cx="${X.itemX + 11}" cy="${icy}" r="2.1" fill="${color}" fill-opacity=".75"/>
            <text x="${X.itemX + 20}" y="${icy + 4}" font-size="11.2" fill="#44576B">${label}</text>
          </g>`;
        });

        y += blockH(t) + GAP;
      });
    };

    drawSide(right, 'right');
    drawSide(left, 'left');

    out += `<g class="node" data-goto="ideas">
      <rect x="${root.x}" y="${root.y}" width="${root.w}" height="${root.h}" rx="14" fill="url(#rootG)"/>
      <text x="${root.x + root.w / 2}" y="${root.y + 28}" font-size="15.5" font-weight="700" fill="#fff" text-anchor="middle">${B.title}</text>
      <text x="${root.x + root.w / 2}" y="${root.y + 45}" font-size="9.5" fill="#fff" fill-opacity=".62" text-anchor="middle">${THEMES.length} 大主题 · ${QUOTES.length} 条金句</text>
    </g>`;

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = out;
    svg.addEventListener('click', e => {
      const g = e.target.closest('[data-goto]');
      if (!g) return;
      const id = g.getAttribute('data-goto');
      if (id === 'ideas') { $('#ideas').scrollIntoView({ behavior: 'smooth' }); return; }
      const box = document.getElementById(id);
      if (!box) return;
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      box.classList.remove('flash');
      void box.offsetWidth;
      box.classList.add('flash');
    });
  }

  function drawMapList() {
    const box = $('#mapList');
    if (!box) return;
    THEMES.forEach((t, i) => {
      const d = document.createElement('details');
      d.className = 'acc';
      if (i === 0) d.open = true;
      d.style.setProperty('--c', t.color || B.color);
      d.innerHTML = `<summary><i></i><b>${t.title}</b><em>${(t.chapter || '').split('·').pop().trim()}</em></summary>
        <ul>${(t.map || []).map(x => `<li>${x}</li>`).join('')}</ul>`;
      box.appendChild(d);
    });
  }

  function drawLegend() {
    const box = $('#legend');
    if (!box) return;
    THEMES.forEach(t => {
      box.appendChild(el('span', '', `<i style="background:${t.color}"></i>${t.no} ${t.title}`));
    });
  }

  /* ---------------- 核心观点 ---------------- */
  function drawThemes() {
    const box = $('#themes');
    THEMES.forEach(t => {
      const art = el('article', 'theme-block');
      art.id = `t-${t.id}`;
      art.dataset.theme = t.id;
      art.style.setProperty('--c', t.color);
      const pts = (t.points || []).map((p, i) => `
        <div class="point" data-text="${escAttr([p.h, p.p, p.s].filter(Boolean).join(' '))}">
          <span class="pnum">${i + 1}</span>
          <div>
            <h4>${p.h}</h4>
            <p>${p.p}</p>
            ${p.s ? `<p class="src" style="font-size:11.5px;color:#9AA9B8;margin-top:8px">原书小节 · ${p.s}</p>` : ''}
          </div>
        </div>`).join('');
      art.innerHTML = `
        <div class="theme-head">
          <span class="theme-no">${t.no}</span>
          <div><h3>${t.title}</h3><p class="chapter">${t.chapter || ''}</p></div>
        </div>
        <p class="lead">${t.lead || ''}</p>
        <div class="points">${pts}</div>`;
      box.appendChild(art);
    });
  }

  /* ---------------- 金句 ---------------- */
  let activeTheme = 'all';

  function drawChips() {
    const box = $('#qchips');
    if (!box) return;
    const items = [{ id: 'all', title: '全部', color: '#1B2A3A', n: QUOTES.length }]
      .concat(THEMES.map(t => ({
        id: t.id, title: t.title, color: t.color,
        n: QUOTES.filter(q => q.t === t.id).length
      })));
    box.innerHTML = items.map(it => `
      <button class="chip ${it.id === 'all' ? 'on' : ''}" data-theme="${it.id}">
        ${it.id !== 'all' ? `<i style="width:8px;height:8px;border-radius:3px;background:${it.color};display:inline-block"></i>` : ''}
        ${it.title}<b>${it.n}</b>
      </button>`).join('');
    box.addEventListener('click', e => {
      const b = e.target.closest('.chip');
      if (!b) return;
      activeTheme = b.dataset.theme;
      box.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b));
      filterAll();
    });
  }

  function drawQuotes() {
    const box = $('#quotes-grid');
    if (!box) return;
    const colorOf = id => (THEMES.find(t => t.id === id) || {}).color || B.color || '#2E5C8A';
    box.innerHTML = QUOTES.map((q, i) => `
      <div class="quote" data-theme="${q.t}" data-text="${escAttr([q.zh, q.en, q.src].join(' '))}"
        style="--qc:${colorOf(q.t)}">
        <span class="qidx">${String(i + 1).padStart(2, '0')}</span>
        <p class="qzh">${q.zh}</p>
        <p class="qen">${q.en}</p>
        <p class="qsrc">${q.src}</p>
      </div>`).join('');
  }

  /* ---------------- 行动清单 ---------------- */
  function drawChecks() {
    const box = $('#checks');
    if (!box || !CHECKS.length) return;
    const KEY = 'book-' + B.slug + '-checks';
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { saved = []; }
    box.innerHTML = CHECKS.map((c, i) => `
      <label class="check">
        <input type="checkbox" data-i="${i}" ${saved.includes(i) ? 'checked' : ''}>
        <span>${c}</span>
      </label>`).join('');
    box.addEventListener('change', () => {
      const on = [...box.querySelectorAll('input:checked')].map(x => +x.dataset.i);
      try { localStorage.setItem(KEY, JSON.stringify(on)); } catch (e) {}
    });
  }

  /* ---------------- 阅读提示 / 线索 / 来源 ---------------- */
  function drawCaution() {
    const box = $('#caution');
    if (!box) return;
    if (!B.caution || !B.caution.length) { box.remove(); return; }
    box.innerHTML = `<h4>阅读提示</h4><ul>${B.caution.map(c => `<li>${c}</li>`).join('')}</ul>`;
  }

  function drawReading() {
    const box = $('#reading');
    if (!box) return;
    if (!B.reading) { box.remove(); return; }
    box.style.setProperty('--c', B.color || '#4A90D9');
    const r = B.reading;
    box.innerHTML = `
      <div class="theme-head">
        <span class="theme-no">读</span>
        <div><h3>${r.title}</h3><p class="chapter">${r.note || ''}</p></div>
      </div>
      <div class="points">
        ${r.items.map((p, i) => `
          <div class="point"><span class="pnum">${i + 1}</span>
            <div><h4>${p.h}</h4><p>${p.p}</p></div>
          </div>`).join('')}
      </div>`;
  }

  function drawSources() {
    const ol = $('#sources');
    if (!ol) return;
    ol.innerHTML = SOURCES.map(s =>
      `<li><a href="${s.u}" target="_blank" rel="noopener">${s.t}</a></li>`
    ).join('');
  }

  function drawFootLinks() {
    const box = $('#footLinks');
    if (!box) return;
    const books = ((window.LIBRARY && window.LIBRARY.books) || []).filter(b => b.status !== 'planned');
    const i = books.findIndex(b => b.slug === B.slug);
    let html = '<a href="../../index.html">← 返回书库</a>';
    if (i > 0) html += `<a href="../${books[i - 1].slug}/index.html">上一本 · ${books[i - 1].title}</a>`;
    if (i > -1 && i < books.length - 1) html += `<a href="../${books[i + 1].slug}/index.html">下一本 · ${books[i + 1].title}</a>`;
    box.innerHTML = html;
  }

  /* ---------------- 检索 ---------------- */
  function filterAll() {
    const q = ($('#q').value || '').trim().toLowerCase();
    let ideaHits = 0;

    document.querySelectorAll('#themes .theme-block[data-theme]').forEach(block => {
      let any = false;
      block.querySelectorAll('.point').forEach(p => {
        const ok = !q || p.dataset.text.toLowerCase().includes(q);
        p.classList.toggle('hide', !ok);
        if (ok) { any = true; ideaHits++; }
      });
      block.style.display = any ? '' : 'none';
    });
    $('#emptyIdeas').classList.toggle('on', ideaHits === 0);

    let quoteHits = 0;
    document.querySelectorAll('.quote').forEach(card => {
      const okTheme = activeTheme === 'all' || card.dataset.theme === activeTheme;
      const okQ = !q || card.dataset.text.toLowerCase().includes(q);
      const ok = okTheme && okQ;
      card.classList.toggle('hide', !ok);
      if (ok) quoteHits++;
    });
    $('#emptyQuotes').classList.toggle('on', quoteHits === 0);

    const info = $('#hitInfo');
    if (q) {
      info.classList.add('on');
      info.innerHTML = `关键词「${escHtml(q)}」命中 <b>${ideaHits}</b> 条观点、<b>${quoteHits}</b> 条金句。按 Esc 或点右侧 × 清空。`;
    } else {
      info.classList.remove('on');
      info.textContent = '';
    }
  }

  /* ---------------- 滚动 ---------------- */
  function scrollFx() {
    const bar = $('#bar'), top = $('#top');
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
      top.classList.toggle('on', window.scrollY > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------------- 启动 ---------------- */
  initNav();
  renderHero();
  drawMap();
  drawMapList();
  drawLegend();
  drawThemes();
  drawChips();
  drawQuotes();
  drawCaution();
  drawReading();
  drawChecks();
  drawSources();
  drawFootLinks();
  scrollFx();

  $('#q').addEventListener('input', e => {
    $('#qclr').classList.toggle('on', !!e.target.value);
    filterAll();
  });
  $('#qclr').addEventListener('click', () => {
    $('#q').value = '';
    $('#qclr').classList.remove('on');
    filterAll();
    $('#q').focus();
  });
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== $('#q')) { e.preventDefault(); $('#q').focus(); }
    if (e.key === 'Escape' && document.activeElement === $('#q')) { $('#q').blur(); }
  });

  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) {
      const html = document.documentElement;
      const prev = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      const y = target.getBoundingClientRect().top + window.pageYOffset - 78;
      window.scrollTo(0, y < 0 ? 0 : y);
      html.style.scrollBehavior = prev;
    }
  }
  window.addEventListener('hashchange', () => {
    const target = document.querySelector(location.hash);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
})();
