/* ============================================================
   书库首页渲染
   数据来源：assets/books.js（window.LIBRARY）
   统计数字由各书 data.js 实时计算，避免手写数字与实际不一致
   分组由 LIBRARY.groups 决定；一本书用 group 字段归入某个模块
   ============================================================ */
(function () {
  'use strict';

  const L = window.LIBRARY || { name: '我的书库', books: [], groups: [], slots: 0 };
  const $ = s => document.querySelector(s);

  const books = L.books || [];
  const groups = L.groups || [];
  const ready = books.filter(b => b.status === 'ready');
  const planned = books.filter(b => b.status !== 'ready');

  $('#libName').textContent = L.name;
  document.title = L.name;
  $('#libSub').textContent = L.subtitle || '';

  const escAttr = s => String(s).replace(/"/g, '&quot;');

  /* ---------- 卡片 ---------- */
  function cardHtml(b) {
    const isPlanned = b.status !== 'ready';
    const href = isPlanned ? '' : `books/${b.slug}/index.html`;
    const tag = isPlanned
      ? '<span class="pill-soon">整理中</span>'
      : `<span class="tag">${b.tag || ''}</span>`;
    const inner = `
      <div class="cover" style="--c:${b.color}">
        <span class="c-en">${(b.shortEn || '').toUpperCase()}</span>
        <span class="c-title">${b.title}</span>
        <span class="c-author">${(b.author || '').split(/[（(]/)[0].split(' / ')[0]}</span>
      </div>
      <div class="card-body">
        <h3>${b.title}</h3>
        <p class="card-en">${b.titleEn || ''}</p>
        <p class="card-author">${b.author || ''}</p>
        <p class="card-sum">${b.summary || ''}</p>
        <div class="card-foot">
          ${tag}
          <span class="card-stats" data-stats="${b.slug}">${isPlanned ? '尚未开始' : '—'}</span>
        </div>
      </div>`;

    const text = escAttr([b.title, b.titleEn, b.author, b.tag, b.summary].join(' '));
    return isPlanned
      ? `<div class="card planned" style="--c:${b.color}" data-group="${b.group || ''}" data-text="${text}">${inner}</div>`
      : `<a class="card" href="${href}" style="--c:${b.color}" data-group="${b.group || ''}" data-text="${text}">${inner}</a>`;
  }

  /* ---------- 分组渲染 ---------- */
  function render() {
    const box = $('#shelf');
    const sections = groups.length
      ? groups.map(g => ({
        id: g.id, no: g.no, title: g.title, desc: g.desc,
        list: ready.filter(b => b.group === g.id)
      })).filter(s => s.list.length)
      : [{ id: '', no: '', title: '', desc: '', list: ready }];

    // 未归组的已上线书籍，单独兜底显示，避免漏书
    const rest = ready.filter(b => !groups.some(g => g.id === b.group));
    if (groups.length && rest.length) {
      sections.push({ id: '_rest', no: '·', title: '其它', desc: '', list: rest });
    }

    let html = sections.map(s => `
      <section class="shelf-group" data-group="${s.id}">
        ${s.title ? `<div class="group-head">
          <span class="group-no">${s.no}</span>
          <div class="group-txt">
            <h2>${s.title}<em>${s.list.length} 本</em></h2>
            ${s.desc ? `<p>${s.desc}</p>` : ''}
          </div>
        </div>` : ''}
        <div class="grid">${s.list.map(cardHtml).join('')}</div>
      </section>`).join('');

    if (planned.length) {
      html += `<section class="shelf-group" data-group="_planned">
        <div class="group-head">
          <span class="group-no">＋</span>
          <div class="group-txt"><h2>整理中<em>${planned.length} 本</em></h2>
          <p>已列入计划、尚未整理成页的书。</p></div>
        </div>
        <div class="grid">${planned.map(cardHtml).join('')}</div>
      </section>`;
    }

    const slots = Array.from({ length: L.slots || 0 }, () =>
      `<div class="slot"><b>＋</b><span>预留位置</span><span>下一本书放在这里</span></div>`).join('');
    if (slots) {
      html += `<section class="shelf-group" data-group="_slot">
        <div class="grid">${slots}</div>
      </section>`;
    }

    box.innerHTML = html;
  }

  /* ---------- 模块筛选 ---------- */
  let activeGroup = 'all';

  function renderChips() {
    const box = $('#filters');
    if (!box) return;
    if (!groups.length) { box.remove(); return; }
    const items = [{ id: 'all', no: '', title: '全部', n: ready.length }]
      .concat(groups.map(g => ({
        id: g.id, no: g.no, title: g.title, n: ready.filter(b => b.group === g.id).length
      })).filter(g => g.n));
    box.innerHTML = items.map(it => `
      <button class="chip ${it.id === 'all' ? 'on' : ''}" data-group="${it.id}">
        ${it.no ? `<i class="chip-no">${it.no}</i>` : ''}${it.title}<b>${it.n}</b>
      </button>`).join('');
    box.addEventListener('click', e => {
      const b = e.target.closest('.chip');
      if (!b) return;
      activeGroup = b.dataset.group;
      box.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b));
      applyFilter();
    });
  }

  /* ---------- 统计 ---------- */
  function loadBookData(slug) {
    return new Promise(resolve => {
      const s = document.createElement('script');
      s.src = `books/${slug}/data.js`;
      s.onload = () => {
        const d = window.BOOK;
        window.BOOK = null;
        resolve(d || null);
      };
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }

  async function fillStats() {
    let tp = 0, tq = 0, ok = 0;
    for (const b of ready) {
      const d = await loadBookData(b.slug);
      const node = document.querySelector(`[data-stats="${b.slug}"]`);
      if (d && d.themes) {
        const points = d.themes.reduce((a, t) => a + (t.points || []).length, 0);
        const quotes = (d.quotes || []).length;
        tp += points; tq += quotes; ok++;
        if (node) node.textContent = `${d.themes.length} 主题 · ${points} 观点 · ${quotes} 金句`;
      } else if (node) {
        node.textContent = '数据待检查';
      }
    }
    $('#stBooks').textContent = ready.length;
    $('#stPoints').textContent = ok ? tp : '—';
    $('#stQuotes').textContent = ok ? tq : '—';
  }

  /* ---------- 检索 + 模块筛选 ---------- */
  function applyFilter() {
    const q = ($('#q').value || '').trim().toLowerCase();
    let n = 0;
    document.querySelectorAll('.card').forEach(c => {
      const okGroup = activeGroup === 'all' || c.dataset.group === activeGroup;
      const okQ = !q || c.dataset.text.toLowerCase().includes(q);
      const hit = okGroup && okQ;
      c.classList.toggle('hide', !hit);
      if (hit) n++;
    });
    document.querySelectorAll('.shelf-group').forEach(sec => {
      const g = sec.dataset.group;
      if (g === '_slot') { sec.classList.toggle('hide', activeGroup !== 'all' || !!q); return; }
      const any = [...sec.querySelectorAll('.card')].some(c => !c.classList.contains('hide'));
      sec.classList.toggle('hide', !any);
    });
    $('#emptyShelf').classList.toggle('on', n === 0);
    $('#qclr').classList.toggle('on', !!q);
  }

  function bindSearch() {
    const q = $('#q');
    q.addEventListener('input', applyFilter);
    $('#qclr').addEventListener('click', () => { q.value = ''; applyFilter(); q.focus(); });
    document.addEventListener('keydown', e => {
      if (e.key === '/' && document.activeElement !== q) { e.preventDefault(); q.focus(); }
      if (e.key === 'Escape' && document.activeElement === q) q.blur();
    });
  }

  render();
  renderChips();
  fillStats();
  bindSearch();
})();
