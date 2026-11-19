/* 全站检索 v1:跨对象统一搜索(专业/课程群/课程/知识点/题目/试卷/教学文档/班级) */

function searchAll(q){
  q = String(q||'').trim().toLowerCase();
  if(q.length < 1) return [];
  const res = [];
  const hit = (...ss) => ss.some(s=>String(s||'').toLowerCase().includes(q));

  store.db.majors.forEach(m=>{
    if(hit(m.name,m.code,m.leader,m.desc)) res.push({type:'专业',icon:'🏛️',title:m.name,sub:(m.code||'')+' · 负责人 '+(m.leader||'-'),href:'#/majors'});
  });
  store.db.groups.forEach(g=>{
    if(hit(g.name,g.leader,g.desc)) res.push({type:'课程群',icon:'🗂️',title:g.name,sub:'负责人 '+(g.leader||'-'),href:'#/group?g='+g.id});
  });
  store.db.courses.forEach(c=>{
    if(hit(c.name,c.code,c.desc,c.leader,(c.objectives||[]).join(' '))) res.push({type:'课程',icon:'📚',title:c.name,sub:(c.code||'')+' · '+(c.category||'')+' · S'+(c.semester||1),href:'#/course/'+c.id});
    c.chapters.forEach(ch=>ch.kps.forEach(k=>{
      if(hit(k.title,k.content)) res.push({type:'知识点',icon:'🔸',title:k.title,sub:c.name+' · '+ch.title,href:'#/course/'+c.id+'/kps'});
    }));
  });
  store.db.bank.forEach(qu=>{
    if(hit(qu.stem,qu.answer,qu.analysis,qu.chapter)) res.push({type:'题目',icon:'🧮',title:String(qu.stem||'').slice(0,70),sub:(store.course(qu.courseId)||{}).name||'-',href:'#/bank/'+qu.courseId});
  });
  store.db.papers.forEach(p=>{
    if(hit(p.name)) res.push({type:'试卷',icon:'📄',title:p.name,sub:(store.course(p.courseId)||{}).name||'-',href:'#/papers'});
  });
  (store.db.documents||[]).forEach(d=>{
    if(hit(d.title,d.content)) res.push({type:'教学文档',icon:'📝',title:d.title,sub:(store.course(d.courseId)||{}).name||'-',href:'#/doc/'+d.id});
  });
  if(auth.canSee('classes')) store.db.classes.forEach(k=>{
    if(hit(k.name,k.teacher,k.term)) res.push({type:'教学班级',icon:'👥',title:k.name,sub:(store.course(k.courseId)||{}).name||'-',href:'#/class/'+k.id});
  });
  return res;
}

const searchState = { q:'' };
function viewSearch(){
  return `
  <div class="page-head"><div><h1>全站检索</h1>
    <div class="sub">一处搜全站 — 覆盖 专业 / 课程群 / 课程 / 章节知识点 / 题库 / 卷库 / 教学文档 / 教学班级</div></div></div>
  <div class="card">
    <div class="row">
      <input id="s-q" placeholder="输入关键词,如:Python、方差、SQL、教学大纲…" style="flex:1;min-width:240px"
        value="${esc(searchState.q)}" oninput="clearTimeout(window._st);window._st=setTimeout(runSearch,260)">
      <button class="btn primary" onclick="runSearch()">🔍 搜索</button>
      <button class="btn" onclick="searchState.q='';document.getElementById('s-q').value='';runSearch()">清空</button>
    </div>
    <div class="row" style="margin-top:10px">
      <span class="mini">快捷:</span>
      ${['Python','SQL','方差','大纲','机器学习'].map(k=>`<button class="btn small" onclick="searchState.q='${k}';document.getElementById('s-q').value='${k}';runSearch()">${k}</button>`).join('')}
    </div>
  </div>
  <div id="s-res"></div>`;
}
function runSearch(){
  const inp = document.getElementById('s-q');
  const q = inp? inp.value.trim() : searchState.q;
  searchState.q = q;
  const box = document.getElementById('s-res'); if(!box) return;
  if(!q){ box.innerHTML = '<div class="card empty">输入关键词开始检索;支持课程、知识点、题目、教学文档等全部内容</div>'; return; }
  const res = searchAll(q);
  if(!res.length){ box.innerHTML = `<div class="card empty">未找到与「${esc(q)}」相关的内容</div>`; return; }
  const groups = {};
  res.forEach(r=>{ (groups[r.type]=groups[r.type]||[]).push(r); });
  box.innerHTML = `
  <div class="card"><div class="row"><b>🔎 共找到 ${res.length} 条结果</b>
    <span class="spacer"></span>${Object.entries(groups).map(([t,arr])=>`<span class="tag blue">${t} ${arr.length}</span>`).join('')}</div></div>
  ${Object.entries(groups).map(([t,arr])=>`
    <div class="card"><h3>${arr[0].icon} ${t}(${arr.length})</h3>
      ${arr.slice(0,50).map(r=>`<a class="search-hit" href="${r.href}" style="text-decoration:none;color:inherit">
        <b>${esc(r.title)}</b><div class="mini">${esc(r.sub)}</div></a>`).join('')}
      ${arr.length>50?`<div class="mini" style="margin-top:6px">仅显示前 50 条,请细化关键词</div>`:''}
    </div>`).join('')}`;
}
