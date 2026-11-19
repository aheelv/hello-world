/* 项目文档中心 v1:将 docs/*.md(需求/设计/权限/重构/完善方案)与 UML 过程网页化
   数据由 tools/build-docs.js 生成的 js/project-docs.js 提供;UML 使用 mermaid 在线渲染。 */

/* ---------- mermaid 初始化与渲染(按需加载) ----------
   mermaid 体积较大(约 3.2MB),首页/其它页面无需它。仅在项目文档页首次
   需要渲染 UML 时再动态加载本地库,避免拖慢整体启动,也避免因外部 CDN
   不可达导致页面白屏。 */
let _mermaidReady = false;
let _mermaidLoading = null;
function ensureMermaid(){
  if(typeof window!=='undefined' && window.mermaid) return Promise.resolve(window.mermaid);
  if(_mermaidLoading) return _mermaidLoading;
  _mermaidLoading = new Promise((resolve,reject)=>{
    if(typeof document==='undefined'){ reject(new Error('no document')); return; }
    const s = document.createElement('script');
    s.src = 'libs/mermaid.min.js';
    s.async = true;
    s.onload = ()=>{ window.mermaid ? resolve(window.mermaid) : reject(new Error('mermaid 未挂载')); };
    s.onerror = ()=>reject(new Error('mermaid 加载失败'));
    (document.head||document.documentElement).appendChild(s);
  }).catch(err=>{ _mermaidLoading = null; throw err; });
  return _mermaidLoading;
}
function initMermaid(){
  if(_mermaidReady || !window.mermaid) return;
  try{
    window.mermaid.initialize({
      startOnLoad:false, securityLevel:'loose', theme:'base',
      fontFamily:'"Segoe UI","PingFang SC","Microsoft YaHei",system-ui,sans-serif',
      themeVariables:{
        primaryColor:'#eff5ff', primaryBorderColor:'#93c5fd', primaryTextColor:'#1b2436',
        lineColor:'#94a3b8', secondaryColor:'#f5f3ff', tertiaryColor:'#ecfdf5',
        fontSize:'13px'
      }
    });
    _mermaidReady = true;
  }catch(e){}
}
function renderMermaid(root){
  if(!root) return Promise.resolve();
  const codes = root.querySelectorAll('code.language-mermaid');
  if(!codes.length) return Promise.resolve();
  return ensureMermaid().then(()=>{
    initMermaid();
    codes.forEach(code=>{
      const pre = code.closest('pre') || code;
      const div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = code.textContent;
      pre.replaceWith(div);
    });
    const nodes = [...root.querySelectorAll('.mermaid')];
    if(nodes.length){
      try{
        const p = window.mermaid.run({ nodes });
        if(p && p.catch) p.catch(()=>{});
      }catch(e){ /* 降级:保留代码块原文 */ }
    }
  }).catch(()=>{ /* 加载失败:保留 Markdown 中的原始代码块,不影响其它内容 */ });
}

/* ---------- 页内目录 ---------- */
function buildToc(root, tocEl){
  if(!tocEl) return;
  const hs = [...root.querySelectorAll('h2,h3')];
  if(!hs.length){ tocEl.style.display='none'; return; }
  tocEl.style.display = '';
  tocEl.innerHTML = '<b style="font-size:12.5px">📑 本页目录</b><div class="toc-list">' +
    hs.map((h,i)=>{
      const id = 'ds-h-'+i; h.id = id;
      return `<a class="toc-item ${h.tagName==='H3'?'sub':''}" href="#${id}"
        onclick="event.preventDefault();document.getElementById('${id}').scrollIntoView({behavior:'smooth',block:'start'})">${esc(h.textContent)}</a>`;
    }).join('') + '</div>';
}

/* ---------- 视图 ---------- */
function viewDocSpace(id){
  const docs = (typeof PROJECT_DOCS!=='undefined' && PROJECT_DOCS) || [];
  if(!docs.length) return '<div class="card empty">暂无项目文档 — 请先运行 <code>node tools/build-docs.js</code></div>';
  const cur = docs.find(d=>d.id===id) || docs[0];
  return `
  <div class="page-head"><div><h1>项目文档中心</h1>
    <div class="sub">需求 → 设计(UML) → 实现 → 完善 全过程文档网页化,在线直接查看;UML 图随文实时渲染</div></div>
    <div class="row">
      <button class="btn small" onclick="window.print()">🖨 打印本页</button>
      <button class="btn small" onclick="viewDocSpace.exportMd('${cur.id}')">⬇ 导出本文档</button>
    </div></div>
  <div class="docspace">
    <aside class="docspace-nav">
      <input id="ds-kw" placeholder="🔍 搜索文档…" oninput="dsFilter(this.value)">
      <div class="toc-list" id="ds-nav-list">
        ${docs.map(d=>`<a class="ds-nav-item ${d.id===cur.id?'active':''}" href="#/docspace/${d.id}"
          data-hay="${esc((d.title+' '+d.md).toLowerCase())}">${d.icon} ${esc(d.title)}</a>`).join('')}
      </div>
      <div class="mini" style="margin-top:10px">共 ${docs.length} 篇 · 含全部 UML 过程图</div>
    </aside>
    <div class="docspace-body">
      <div class="row" style="margin-bottom:8px">
        <h2 style="margin:0;font-size:17px" id="ds-title">${esc(cur.heading||cur.title)}</h2>
        <span class="spacer"></span>
        <span class="mini" id="ds-count">${cur.md.length} 字符</span>
      </div>
      <div class="ds-toc" id="ds-toc"></div>
      <article id="ds-article" class="md"></article>
    </div>
  </div>`;
}
function mountDocSpace(id){
  const docs = (typeof PROJECT_DOCS!=='undefined' && PROJECT_DOCS) || [];
  if(!docs.length) return;
  const cur = docs.find(d=>d.id===id) || docs[0];
  const art = document.getElementById('ds-article'); if(!art) return;
  art.innerHTML = R.md(cur.md);
  R.typeset(art);
  renderMermaid(art);
  buildToc(art, document.getElementById('ds-toc'));
}
function dsFilter(kw){
  kw = (kw||'').toLowerCase().trim();
  document.querySelectorAll('#ds-nav-list .ds-nav-item').forEach(a=>{
    a.style.display = (!kw || (a.dataset.hay||'').includes(kw)) ? '' : 'none';
  });
}
viewDocSpace.exportMd = function(id){
  const docs = (typeof PROJECT_DOCS!=='undefined' && PROJECT_DOCS) || [];
  const d = docs.find(x=>x.id===id) || docs[0]; if(!d) return;
  download(`${d.file||d.title+'.md'}`, d.md, 'text/markdown');
  toast('文档已导出(Markdown)');
};
