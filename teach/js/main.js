/* 路由与启动 */
const routes = {
  dashboard: viewHome,
  majors: viewMajors,
  group: viewGroup,
  courses: viewCourses,
  docs: viewDocs,
  classes: viewClasses,
  graph: viewGraph,
  bank: (a)=>renderBankList(a[0]||''),
  papers: viewPapers,
  chaoxing: viewChaoxing,
  templates: viewTemplates,
  datatpl: (a,q)=>viewTemplatesHub(a[0]||'', q),
  search: viewSearch,
  docspace: (a)=>viewDocSpace(a[0]||''),
  data: viewData,
  help: (a)=>viewHelp(a[0]||''),
};
const mounts = {
  dashboard: mountHome,
  group: mountGroup,
};

function route(){
  try{ routeInner(); }
  catch(e){
    // 兜底:任一视图渲染异常都不应让整页空白
    console.error('[route] 渲染失败:', e);
    const main = document.getElementById('main');
    if(main) main.innerHTML = `
      <div class="card" style="max-width:720px">
        <h3>⚠️ 页面渲染出错</h3>
        <div class="sub">模块「${esc((location.hash||'').replace(/^#\/?/,'')||'dashboard')}」渲染异常,已拦截以避免整页空白。</div>
        <pre class="code-preview">${esc(String((e&&e.stack)||e))}</pre>
        <button class="btn" onclick="location.hash='#/dashboard';location.reload()">↩ 返回首页</button>
      </div>`;
  }
}
function routeInner(){
  const raw = location.hash.replace(/^#\/?/,'') || 'dashboard';
  const [pathPart, queryPart] = raw.split('?');
  const parts = pathPart.split('/');
  const query = Object.fromEntries(new URLSearchParams(queryPart||''));
  const main = document.getElementById('main');
  // 无权限模块访问 → 看板
  if(parts[0] && routes[parts[0]] && !auth.canSee(parts[0])){
    toast('当前角色无权访问该模块'); location.hash='#/dashboard'; return;
  }
  // 导航高亮
  document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('active', a.dataset.id===parts[0]));
  // 课程详情路由
  if(parts[0]==='course' && parts[1]){
    main.innerHTML = viewCourseDetail(parts[1], parts[2]);
    mountCourseDetail(parts[1], parts[2]);
    return;
  }
  // 班级详情路由
  if(parts[0]==='class' && parts[1]){
    main.innerHTML = viewClassDetail(parts[1], parts[2]);
    mountClassDetail(parts[1], parts[2]);
    return;
  }
  // 教学文档编辑器
  if(parts[0]==='doc' && parts[1]){
    main.innerHTML = viewDocEditor(parts[1]);
    mountDoc(parts[1]);
    return;
  }
  // 项目文档中心(含 mermaid 渲染)
  if(parts[0]==='docspace'){
    main.innerHTML = viewDocSpace(parts[1]);
    mountDocSpace(parts[1]);
    return;
  }
  const fn = routes[parts[0]] || viewHome;
  const html = fn(parts.slice(1), query);
  main.innerHTML = typeof html==='string'? html : html;
  // 挂载
  if(parts[0]==='graph') refreshGraph();
  if(mounts[parts[0]]) mounts[parts[0]]();
  // 富渲染:表格中的 Markdown 片段 + 公式
  enhanceMd(main);
}

/* 将 data-md 的单元格渲染为 Markdown+公式 */
function enhanceMd(root){
  root.querySelectorAll('.md-cell[data-md]').forEach(td=>{
    const txt = td.dataset.md||'';
    if(/\$|```|\*\*|\n/.test(txt)){
      td.innerHTML = R.md(txt);
      R.typeset(td);
    }
  });
}

function initNav(){
  const nav=document.getElementById('nav');
  nav.innerHTML = NAV.filter(n=>auth.canSee(n.module))
    .map(n=>`<a href="#/${n.id}" data-id="${n.id}" title="${esc(n.desc||n.label)}"><span class="ic">${n.icon}</span>${n.label}</a>`).join('');
  document.querySelector('.sidebar-foot').innerHTML = renderRoleBox();
}

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', ()=>{
  try{ store.load(); }catch(e){ console.error('[boot] 数据加载失败:', e); }
  try{ initNav(); }catch(e){ console.error('[boot] 导航初始化失败:', e); }
  // 按角色默认落地页
  if(!location.hash){
    try{ location.hash = auth.role()==='group_leader'? '#/group' : '#/dashboard'; }
    catch(e){ location.hash = '#/dashboard'; }
  }
  route();
});
