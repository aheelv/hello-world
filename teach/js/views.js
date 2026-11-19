/* 视图层 v2:看板 / 专业 / 课程群工作台 / 课程库 / 课程详情 / 图谱 / 题库 / 卷库 / 模板 / 数据 + 权限控制 */
const NAV = [
  {id:'dashboard', icon:'🏠', label:'教师工作台',     module:'dashboard', desc:'任务进度 · 待办 · 学情概览'},
  {id:'majors',    icon:'🏛️', label:'专业管理',       module:'majors',    desc:'专业 · 课程体系 · 修读计划'},
  {id:'group',     icon:'🗂️', label:'课程群工作台',   module:'group',     desc:'群内课程 · 衔接 · 群图谱'},
  {id:'courses',   icon:'📚', label:'课程库',         module:'courses',   desc:'课程信息 · 章节 · 知识点'},
  {id:'docs',      icon:'📄', label:'教学文档',       module:'docs',      desc:'大纲 · 教案 · 日历 · 在线编辑'},
  {id:'classes',   icon:'👥', label:'教学班级',       module:'classes',   desc:'名册 · 成绩 · 作业'},
  {id:'graph',     icon:'🕸️', label:'知识图谱',       module:'graph',     desc:'知识点关联关系可视化'},
  {id:'bank',      icon:'🧮', label:'题库管理',       module:'bank',      desc:'题目录入 · 批量导入导出'},
  {id:'papers',    icon:'🗒️', label:'卷库管理',       module:'papers',    desc:'组卷 · 预览 · 打印'},
  {id:'chaoxing',  icon:'🔁', label:'超星互动',       module:'chaoxing',  desc:'与学习通双向导入导出'},
  {id:'templates', icon:'🧩', label:'文档模板',       module:'templates', desc:'大纲/教案等文档模板库'},
  {id:'datatpl',   icon:'📋', label:'数据模板',       module:'datatpl',   desc:'导入导出模板与字段说明'},
  {id:'search',    icon:'🔍', label:'全站检索',       module:'search',    desc:'课程/知识点/题目/文档'},
  {id:'docspace',  icon:'📖', label:'项目文档',       module:'docspace',  desc:'需求/设计/UML 在线查看'},
  {id:'data',      icon:'🔄', label:'数据与接口',     module:'data',      desc:'备份 · 平台对接 · AI 工作流'},
  {id:'help',      icon:'❓', label:'使用说明',       module:'help',      desc:'分角色操作指南'},
];
/* 权限小工具 */
const CAN = m => auth.canSee(m)? '' : 'display:none';
const W = (m,item) => auth.canW(m,item);

/* ================= 角色切换(演示) ================= */
const ROLE_DEFAULT_NAME = {admin:'系统管理员', major_leader:'刘院长', group_leader:'赵强', course_leader:'王伟', student:'张同学'};
function renderRoleBox(){
  const u = auth.user();
  return `
  <div style="margin-bottom:8px">
    <label style="margin:0 0 4px">🔑 当前角色</label>
    <select id="role-sel" onchange="switchRole(this.value)">
      ${Object.entries(ROLES).map(([k,v])=>`<option value="${k}" ${auth.role()===k?'selected':''}>${v.label}</option>`).join('')}
    </select>
    <label style="margin:6px 0 4px">姓名(用于负责人范围匹配)</label>
    <input id="role-name" value="${esc(u.userName||'')}" onchange="setName(this.value)">
  </div>
  <div class="row" style="margin-top:2px">
    <button class="btn ghost small" style="flex:1" onclick="location.hash='#/help'">❓ 使用说明</button>
    <button class="btn ghost small" style="display:${CAN('data')}" onclick="exporters.fullBackup()">⬇ 备份</button>
  </div>`;
}
function switchRole(role){
  store.db.settings.role = role;
  store.db.settings.userName = ROLE_DEFAULT_NAME[role]||'';
  store.save();
  toast(`已切换为【${ROLES[role].label}】· ${store.db.settings.userName}`);
  location.hash = role==='group_leader'? '#/group' : '#/dashboard';
  initNav(); route();
}
function setName(n){ store.db.settings.userName = n.trim(); store.save(); toast('姓名已更新,数据范围权限随之生效'); initNav(); route(); }

/* ================= 专业管理 ================= */
function renderTimeline(mid){
  const plan = store.planSorted(mid);
  if(!plan.length) return '<div class="empty">尚未挂接课程</div>';
  const sems={}; plan.forEach(x=>{(sems[x.semester]=sems[x.semester]||[]).push(x)});
  return `<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">${Object.keys(sems).sort((a,b)=>a-b).map(s=>`
    <div style="border:1px solid var(--border);border-radius:9px;padding:6px 10px;background:#fbfcfe">
      <div style="font-size:10.5px;color:var(--primary);font-weight:700;margin-bottom:3px">第 ${s} 学期</div>
      ${sems[s].map(x=>{const c=store.course(x.courseId); return c?`<a href="#/course/${c.id}" class="tag blue" style="margin:2px;text-decoration:none">${esc(c.name)}</a>`:'';}).join('')}
    </div>`).join('<div style="color:var(--muted)">→</div>')}
  </div>`;
}
function viewMajors(){
  return `<div class="page-head"><div><h1>专业管理</h1><div class="sub">专业直接关联课程(含开课学期)→ 部分课程组成课程群 · 支持专业导出/导入便于迁移共享</div></div>
    <div class="row">
      <button class="btn" style="display:${auth.canExport()?'':'none'}" onclick="viewMajors.exportAll()">⬇ 导出全部专业</button>
      <button class="btn" style="display:${CAN('majors')}" onclick="viewMajors.importMajor()">📥 导入专业包</button>
      <button class="btn primary" style="display:${CAN('majors')}" onclick="viewMajors.addMajorModal()">＋ 新增专业</button>
    </div></div>
  <div class="card" style="background:var(--primary-soft);border-color:#c7d2fe">
    <div class="row"><b style="font-size:12.5px">📋 批量建模:</b>
      ${tplBtn('majorPlan','专业与修读计划模板')}
      ${tplBtn('courseInfo','课程基本信息模板')}
      <span class="mini">用模板批量建立专业、课程与修读学期,再一键导入</span>
      <span class="spacer"></span>
      <button class="btn small primary" style="display:${CAN('majors')}" onclick="ImportKit.open('majorPlan',{})">📥 导入修读计划</button>
      <button class="btn small primary" style="display:${CAN('majors')}" onclick="ImportKit.open('courseInfo',{})">📥 导入课程信息</button>
    </div></div>
  ${store.db.majors.map(m=>`
  <div class="card">
    <div class="row" style="margin-bottom:6px">
      <h3 style="margin:0">${esc(m.name)} <span class="tag gray">${esc(m.code)}</span> <span class="tag blue">负责人:${esc(m.leader||'未设')}</span></h3>
      <div class="spacer"></div>
      <button class="btn small" style="display:${auth.canExport()?'':'none'}" onclick="viewMajors.exportMajor('${m.id}')">导出</button>
      <button class="btn small" style="display:${CAN('majors')}" ${W('majors',m)?'':'disabled'} onclick="viewMajors.attachModal('${m.id}')">＋ 挂接课程</button>
      <button class="btn small" style="display:${CAN('majors')}" ${W('majors',m)?'':'disabled'} onclick="viewMajors.addGroupModal('${m.id}')">＋ 组建课程群</button>
      <button class="btn small" style="display:${CAN('majors')}" ${W('majors',m)?'':'disabled'} onclick="viewMajors.editMajorModal('${m.id}')">✏️ 编辑</button>
      <button class="btn small danger" style="display:${CAN('majors')}" ${W('majors',m)?'':'disabled'} onclick="viewMajors.delMajor('${m.id}')">🗑️ 删减</button>
    </div>
    <p style="color:var(--muted);font-size:12.5px;margin-bottom:10px">${esc(m.desc)}</p>
    <h3 style="font-size:13px;margin-bottom:6px">📌 课程修读进程(按学期升序)</h3>
    ${renderTimeline(m.id)}
    <h3 style="font-size:13px;margin:14px 0 6px">🗂 课程群(${store.groupsOfMajor(m.id).length})</h3>
    ${store.groupsOfMajor(m.id).length? store.groupsOfMajor(m.id).map(g=>{
      const sorted=[...g.courseIds].sort((a,b)=>store.semesterOf(m.id,a)-store.semesterOf(m.id,b));
      const cross = countCrossLinks(sorted);
      const sMin = sorted.length? Math.min(...sorted.map(c=>store.semesterOf(m.id,c))) : '-';
      const sMax = sorted.length? Math.max(...sorted.map(c=>store.semesterOf(m.id,c))) : '-';
      return `<div class="kp-chip">
        <div class="kp-title">🗂 <a href="#/group?g=${g.id}" style="color:inherit;text-decoration:none">${esc(g.name)}</a>
          <span style="font-weight:400;color:var(--muted);font-size:12px">负责人:${esc(g.leader||'未设')} · 覆盖第${sMin}~${sMax}学期 · 跨课程衔接 ${cross} 条</span>
          <div class="spacer"></div>
          <a class="btn small" href="#/group?g=${g.id}" style="text-decoration:none">工作台</a>
          <button class="btn small" style="display:${CAN('group')}" ${W('group',g)?'':'disabled'} onclick="viewMajors.editGroupModal('${g.id}')">编辑</button>
          <button class="btn small danger" style="display:${CAN('group')}" ${W('group',g)?'':'disabled'} onclick="viewMajors.delGroup('${g.id}')">删除</button></div>
        <div style="margin-top:8px">${sorted.map(cid=>{
          const c=store.course(cid); if(!c) return '';
          const shared = store.majorOfCourse(cid).length>1;
          return `<span class="tag ${shared?'purple':'blue'}" style="margin:2px"><a href="#/course/${cid}" style="color:inherit;text-decoration:none">S${store.semesterOf(m.id,cid)}·${esc(c.name)}${shared?' ⇄':''}</a></span>`;
        }).join('')||'<span style="color:var(--muted);font-size:12px">暂无课程,在工作台中从本专业课程加入</span>'}
        </div></div>`;
    }).join('') : '<div class="empty">尚无课程群 — 点击"组建课程群"</div>'}
  </div>`).join('')}`;
}
/* 跨课程衔接边计数 */
function countCrossLinks(courseIds){
  let n=0;
  courseIds.forEach(cid=>{ const c=store.course(cid); if(!c) return;
    c.chapters.forEach(ch=>ch.kps.forEach(k=>(k.links||[]).forEach(l=>{
      const t=store.findKpGlobal(l); if(t && t.course.id!==cid) n++;
    }))); });
  return n;
}
viewMajors.addMajorModal = function(){
  openModal(`<h3>＋ 新增专业</h3>
    <label>专业名称</label><input id="f-name" placeholder="如:数据科学与大数据技术">
    <label>专业代码</label><input id="f-code" placeholder="如:080910T">
    <label>专业负责人</label><input id="f-leader" placeholder="姓名">
    <label>简介</label><textarea id="f-desc"></textarea>
    <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
    <button class="btn primary" onclick="viewMajors.doAddMajor()">创建</button></div>`);
};
viewMajors.doAddMajor = function(){
  const name=document.getElementById('f-name').value.trim();
  if(!name){toast('请填写专业名称');return;}
  store.addMajor({name, code:document.getElementById('f-code').value.trim(),
    leader:document.getElementById('f-leader').value.trim(), desc:document.getElementById('f-desc').value.trim()});
  closeModal(); toast('专业已创建'); route();
};
viewMajors.editMajorModal = function(id){
  const m=store.major(id);
  openModal(`<h3>✏️ 编辑专业</h3>
    <label>专业名称</label><input id="f-name" value="${esc(m.name)}">
    <label>专业代码</label><input id="f-code" value="${esc(m.code)}">
    <label>专业负责人</label><input id="f-leader" value="${esc(m.leader||'')}">
    <label>简介</label><textarea id="f-desc">${esc(m.desc)}</textarea>
    <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
    <button class="btn primary" onclick="viewMajors.doEditMajor('${id}')">保存</button></div>`);
};
viewMajors.doEditMajor = function(id){
  const m=store.major(id);
  m.name=document.getElementById('f-name').value.trim()||m.name;
  m.code=document.getElementById('f-code').value.trim();
  m.leader=document.getElementById('f-leader').value.trim();
  m.desc=document.getElementById('f-desc').value.trim();
  store.save(); closeModal(); toast('已保存'); route();
};
viewMajors.delMajor = function(id){
  const m=store.major(id);
  if(confirm(`确定删减专业【${m.name}】?\n(其课程群被移除,课程实体与课程库中内容将保留)`)){
    store.delMajor(id); toast('专业已删减'); route();
  }
};
/* 挂接课程 + 每门课的学期 */
viewMajors.attachModal = function(mid){
  const m=store.major(mid);
  const map={}; m.courses.forEach(x=>map[x.courseId]=x.semester);
  openModal(`<h3>＋ 【${esc(m.name)}】挂接课程</h3>
    <p style="color:var(--muted);font-size:12.5px">专业直接关联课程并制定开课学期;课程可被多个专业共享(学期可不同)。课程群将从这些课程中选取。</p>
    <div>${store.db.courses.map(c=>`
      <div class="row" style="margin:8px 0">
        <label style="display:flex;gap:8px;align-items:center;margin:0;color:var(--ink);font-size:13px;cursor:pointer;flex:1">
          <input type="checkbox" class="att-ck" style="width:auto" value="${c.id}" ${map[c.id]!==undefined?'checked':''}>
          ${esc(c.name)} <span class="tag gray">${esc(c.code)}</span>
          <span style="color:var(--muted);font-size:11.5px">${store.majorOfCourse(c.id).length>1?'⇄已被多专业共享':''}</span></label>
        <span style="font-size:12px;color:var(--muted)">学期</span>
        <input type="number" min="1" max="8" class="att-sem" data-cid="${c.id}" value="${map[c.id]||c.semester||1}" style="width:70px" oninput="this.closest('.row').querySelector('.att-ck').checked=true">
      </div>`).join('')}
    </div>
    <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
    <button class="btn primary" onclick="viewMajors.doAttach('${mid}')">保存</button></div>`);
};
viewMajors.doAttach = function(mid){
  const list=[];
  document.querySelectorAll('#modal-root .att-ck').forEach(cb=>{
    if(cb.checked){
      const semInput=document.querySelector(`#modal-root .att-sem[data-cid="${cb.value}"]`);
      list.push({courseId:cb.value, semester:Math.min(8,Math.max(1,+semInput.value||1))});
    }
  });
  store.setMajorCourses(mid, list); closeModal(); toast('挂接已更新'); route();
};
/* 课程群:创建 / 编辑 / 删除 */
viewMajors.addGroupModal = function(mid){
  openModal(`<h3>＋ 组建课程群</h3>
    <label>课程群名称</label><input id="g-name" placeholder="如:数据科学与技术">
    <label>课程群负责人(专人负责)</label><input id="g-leader" placeholder="姓名">
    <label>说明(可描述衔接思路与覆盖学期)</label><input id="g-desc">
    <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
    <button class="btn primary" onclick="viewMajors.doSaveGroup('', '${mid}')">创建</button></div>`);
};
viewMajors.editGroupModal = function(gid){
  const g=store.group(gid);
  openModal(`<h3>✏️ 编辑课程群</h3>
    <label>课程群名称</label><input id="g-name" value="${esc(g.name)}">
    <label>课程群负责人</label><input id="g-leader" value="${esc(g.leader||'')}">
    <label>说明</label><input id="g-desc" value="${esc(g.desc||'')}">
    <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
    <button class="btn primary" onclick="viewMajors.doSaveGroup('${gid}')">保存</button></div>`);
};
viewMajors.doSaveGroup = function(gid, mid){
  const data={
    name:document.getElementById('g-name').value.trim(),
    leader:document.getElementById('g-leader').value.trim(),
    desc:document.getElementById('g-desc').value.trim()
  };
  if(!data.name){toast('请填写名称');return;}
  if(gid){ Object.assign(store.group(gid), data); }
  else store.addGroup({majorId:mid, ...data});
  store.save(); closeModal(); toast('课程群已保存'); route();
};
viewMajors.delGroup = function(gid){
  if(confirm('删除该课程群?(课程实体与专业关联保留)')){ store.delGroup(gid); route(); }
};
/* ---- 专业导出 / 导入 ---- */
viewMajors._packMajor = function(mid){
  const m=store.major(mid);
  return {
    schema:'dlufe-kb/major/v1', exportedAt:new Date().toISOString(),
    major:{name:m.name, code:m.code, leader:m.leader, desc:m.desc},
    courses: m.courses.map(x=>({semester:x.semester, course:store.course(x.courseId)})).filter(x=>x.course),
    groups: store.groupsOfMajor(mid).map(g=>({name:g.name, leader:g.leader, desc:g.desc,
      courseCodes: g.courseIds.map(cid=>(store.course(cid)||{}).code).filter(Boolean)}))
  };
};
viewMajors.exportMajor = function(mid){
  const m=store.major(mid);
  download(`${m.name}-专业包.json`, JSON.stringify(this._packMajor(mid),null,2),'application/json');
  toast('专业包已导出(专业+课程+课程群)');
};
viewMajors.exportAll = function(){
  const pkgs=store.db.majors.map(m=>this._packMajor(m.id));
  download(`全部专业包-${new Date().toISOString().slice(0,10)}.json`,
    JSON.stringify({schema:'dlufe-kb/majors/v1', majors:pkgs},null,2),'application/json');
  toast('全部专业包已导出');
};
viewMajors.importMajor = function(){
  pickFile('.json',(text)=>{
    let pkg; try{ pkg=JSON.parse(text); }catch(e){ toast('JSON 解析失败'); return; }
    const packs = String(pkg.schema||'').startsWith('dlufe-kb/majors') ? (pkg.majors||[]) : (String(pkg.schema||'').startsWith('dlufe-kb/major') ? [pkg] : null);
    if(!packs){ toast('需 dlufe-kb/major 或 dlufe-kb/majors 格式'); return; }
    let majors=0, courses=0, reused=0;
    packs.forEach(p=>{
      const m=p.major||{};
      const nM=store.addMajor({name:m.name||'导入专业', code:m.code||'', leader:m.leader||'', desc:m.desc||''});
      const list=[]; const codeToCid={};
      (p.courses||[]).forEach(item=>{
        const src=item.course; if(!src) return;
        let cid, exist=src.code? store.db.courses.find(c=>c.code&&c.code===src.code) : null;
        if(exist){ cid=exist.id; reused++; }
        else{
          const c=JSON.parse(JSON.stringify(src)); c.id=uid('c'); const map={};
          c.chapters.forEach(ch=>{ const old=ch.id; ch.id=uid('ch'); map[old]=ch.id;
            ch.kps.forEach(k=>{ const ok=k.id; k.id=uid('kp'); map[ok]=k.id; }); });
          c.chapters.forEach(ch=>ch.kps.forEach(k=>k.links=(k.links||[]).map(l=>map[l]).filter(Boolean)));
          store.db.courses.push(c); cid=c.id; courses++;
        }
        list.push({courseId:cid, semester:Math.min(8,Math.max(1,+item.semester||1))});
        if(src.code) codeToCid[src.code]=cid;
      });
      store.setMajorCourses(nM.id, list);
      (p.groups||[]).forEach(g=>store.addGroup({majorId:nM.id, name:g.name||'导入课程群', leader:g.leader||'', desc:g.desc||'',
        courseIds:(g.courseCodes||[]).map(cc=>codeToCid[cc]).filter(Boolean)}));
      majors++;
    });
    toast(`导入完成:专业 ${majors} 个 · 新建课程 ${courses} 门 · 复用已有 ${reused} 门`);
    if(window.route) route();
  });
};

/* ================= 课程群工作台 ================= */
function viewGroup(params){
  // 可管理范围
  const manageable = store.db.groups.filter(g=>W('group',g));
  let gid = (params&&params.g) || window._wkGroup || '';
  if(!gid && auth.role()==='group_leader' && manageable.length) gid=manageable[0].id;
  if(!gid && store.db.groups.length) gid=store.db.groups[0].id;
  window._wkGroup=gid;
  const g=store.group(gid);
  return `<div class="page-head"><div><h1>课程群工作台</h1>
    <div class="sub">课程群负责人专属视图 — 群内课程知识点分布、衔接依赖与修读序列 · 当前登录:${ROLES[auth.role()].label}${auth.name()?` ${esc(auth.name())}`:''}</div></div>
    <div class="row">
      <select id="wk-group" style="width:auto" onchange="window._wkGroup=this.value;route()">
        ${store.db.groups.map(x=>`<option value="${x.id}" ${x.id===gid?'selected':''}>${esc(x.name)}${W('group',x)?' ★':''}</option>`).join('')}
      </select>
      ${g&&auth.canExport()?`<button class="btn small" onclick="exporters.graphJsonCourses(${JSON.stringify(g.courseIds)},'${esc(g.name)}')">导出群图谱</button>`:''}
    </div></div>
  ${g? viewGroupBody(g) : '<div class="card empty">暂无课程群</div>'}`;
}
function viewGroupBody(g){
  const m=store.major(g.majorId);
  const canManage = W('group',g);
  const sorted=[...g.courseIds].sort((a,b)=>store.semesterOf(g.majorId,a)-store.semesterOf(g.majorId,b));
  const candidates = m? m.courses.filter(x=>!g.courseIds.includes(x.courseId)) : [];
  // 跨课程衔接清单
  const cross=[];
  sorted.forEach(cid=>{ const c=store.course(cid); if(!c) return;
    c.chapters.forEach(ch=>ch.kps.forEach(k=>(k.links||[]).forEach(l=>{
      const t=store.findKpGlobal(l);
      if(t && t.course.id!==cid) cross.push({from:{c,ch,k}, to:t});
    }))); });
  return `
  <div class="card" style="background:linear-gradient(135deg,#eff6ff,#f5f3ff);border-color:#c7d2fe">
    <div class="row">
      <h3 style="margin:0">🗂 ${esc(g.name)} <span class="tag purple">负责人:${esc(g.leader||'未设')}</span>
        <span class="tag blue">所属专业:${esc(m?m.name:'-')}</span></h3>
      <div class="spacer"></div>
      <button class="btn small" style="display:${CAN('group')}" ${canManage?'':'disabled'} onclick="viewMajors.editGroupModal('${g.id}')">✏️ 编辑群信息</button>
    </div>
    <p style="color:#475569;font-size:12.5px;margin-top:8px">${esc(g.desc||'')}</p>
    ${canManage? `<div class="row" style="margin-top:6px">
      <select id="wk-add-course" style="width:auto">
        <option value="">— 从本专业课程加入 —</option>
        ${candidates.map(x=>{const c=store.course(x.courseId);return c?`<option value="${c.id}">S${x.semester}·${esc(c.name)}</option>`:'';}).join('')}
      </select>
      <button class="btn small primary" onclick="viewGroup.addCourse('${g.id}')">＋ 加入课程群</button>
      <span style="color:var(--muted);font-size:11.5px">群内课程限定为本专业课程,保证课程群与专业课程体系一致</span></div>`:''}
  </div>
  <div class="grid cols2">
    <div class="card"><h3>📌 群内课程与修读序列(按学期升序)</h3>
      ${sorted.length? sorted.map(cid=>{const c=store.course(cid);return c?`<a href="#/course/${cid}" class="tag blue" style="margin:2px;text-decoration:none">S${store.semesterOf(g.majorId,cid)}·${esc(c.name)}</a>`:'';}).join('<span style="color:var(--muted)">→</span>'):'<div class="empty">群内暂无课程</div>'}
      <p style="color:var(--muted);font-size:11.5px;margin-top:8px">覆盖第 ${sorted.length?store.semesterOf(g.majorId,sorted[0]):'-'} ~ ${sorted.length?store.semesterOf(g.majorId,sorted[sorted.length-1]):'-'} 学期,体现低年级到高年级的衔接。</p>
    </div>
    <div class="card"><h3>🔗 跨课程知识点衔接(${cross.length})</h3>
      ${cross.length? cross.map(x=>`<div style="font-size:12.5px;margin:6px 0;padding:6px 10px;background:#fbfcfe;border-radius:8px;border-left:3px solid var(--accent)">
        <b>${esc(x.from.c.name)}</b>·${esc(x.from.k.title)} <span style="color:var(--accent)">→</span> <b>${esc(x.to.course.name)}</b>·${esc(x.to.kp.title)}</div>`).join('')
      : '<div class="empty">暂无跨课程衔接 — 在知识点编辑中关联其他课程知识点即可建立依赖</div>'}
      <p style="color:var(--muted);font-size:11.5px;margin-top:6px">提示:边的方向为"前置 → 后续",即衔接依赖关系。</p>
    </div>
  </div>
  <div class="card"><h3>🕸 课程群知识图谱(按课程着色)</h3><div id="wk-chart" style="height:520px"></div></div>
  <div class="card"><h3>📖 群内知识点分布</h3>
    ${sorted.map(cid=>{ const c=store.course(cid); if(!c) return '';
      const kps=c.chapters.flatMap(ch=>ch.kps.map(k=>({...k,chTitle:ch.title})));
      return `<div style="margin:10px 0">
        <div class="row"><a href="#/course/${c.id}" style="color:var(--primary);font-weight:700;text-decoration:none">《${esc(c.name)}》</a>
          <span class="tag gray">S${store.semesterOf(g.majorId,cid)} 学期</span>
          <span class="tag gray">负责人:${esc(c.leader||'-')}</span>
          <span style="color:var(--muted);font-size:12px">${c.chapters.length} 章 · ${kps.length} 知识点 · ${store.questions(cid).length} 题</span></div>
        <div style="margin-top:6px">${kps.length? kps.map(k=>`<span class="tag blue" style="margin:2px" title="${esc(k.chTitle)}">${esc(k.title)}</span>`).join(''):'<span style="color:var(--muted);font-size:12px">暂无知识点</span>'}</div>
      </div>`;
    }).join('')||'<div class="empty">群内暂无课程</div>'}
  </div>`;
}
function mountGroup(){
  const g=store.group(window._wkGroup);
  if(g && document.getElementById('wk-chart')) drawGraph([...g.courseIds], 'wk-chart');
}
viewGroup.addCourse = function(gid){
  const cid=document.getElementById('wk-add-course').value;
  if(!cid){toast('请选择课程');return;}
  store.groupToggleCourse(gid,cid); toast('已加入课程群'); route();
};

/* ================= 课程库 ================= */
function viewCourses(){
  return `<div class="page-head"><div><h1>课程库</h1><div class="sub">课程是独立单位 — 可被多个专业按不同学期挂接;默认按开课学期升序排列</div></div>
    <button class="btn primary" style="display:${CAN('courses')}" onclick="viewCourses.addCourseModal()">＋ 新增课程</button></div>
  <div class="card">
    <table><thead><tr><th>课程</th><th>代码</th><th>类别</th><th>学期</th><th>负责人</th><th>学分/学时</th><th>章/知识点</th><th>挂接专业</th><th>操作</th></tr></thead><tbody>
    ${[...store.db.courses].sort((a,b)=>(a.semester||1)-(b.semester||1)).map(c=>{
      const mos=store.majorOfCourse(c.id);
      const chs=c.chapters.length, kps=c.chapters.reduce((s,x)=>s+x.kps.length,0);
      const sems=mos.map(m=>`S${store.semesterOf(m.id,c.id)}·${esc(m.name)}`).join(' ');
      return `<tr>
        <td><a href="#/course/${c.id}" style="color:var(--primary);font-weight:600;text-decoration:none">${esc(c.name)}</a></td>
        <td>${esc(c.code)}</td><td><span class="tag blue">${esc(c.category||'-')}</span></td>
        <td><span class="tag green">S${c.semester||1}</span></td><td>${esc(c.leader||'-')}</td>
        <td>${c.credit} / ${c.hours}</td><td>${chs} / ${kps}</td>
        <td style="font-size:11.5px">${mos.length?sems:'<span style="color:var(--muted)">未挂接</span>'}</td>
        <td class="row" style="flex-wrap:nowrap">
          <button class="btn small" style="display:${CAN('courses')}" ${W('courses',c)?'':'disabled'} onclick="viewCourses.editModal('${c.id}')">编辑</button>
          <button class="btn small" style="display:${auth.canExport()?'':'none'}" onclick="exporters.coursePackage('${c.id}')">导出包</button>
          <button class="btn small danger" style="display:${CAN('courses')}" ${W('courses',c)?'':'disabled'} onclick="viewCourses.del('${c.id}')">删除</button></td></tr>`;
    }).join('')}
    </tbody></table></div>`;
}
viewCourses.addCourseModal = function(){
  openModal(`<h3>＋ 新增课程</h3>
    <div class="grid cols2"><div><label>课程名称</label><input id="f-name"></div><div><label>课程代码</label><input id="f-code"></div></div>
    <div class="grid cols2"><div><label>学分</label><input id="f-credit" type="number" value="3"></div><div><label>学时</label><input id="f-hours" type="number" value="48"></div></div>
    <div class="grid cols2"><div><label>开课学期(1-8)</label><input id="f-sem" type="number" min="1" max="8" value="1"></div><div><label>课程负责人</label><input id="f-leader"></div></div>
    <label>课程类别</label><select id="f-cat"><option>学科基础课</option><option>专业核心课</option><option>专业方向课</option><option>通识课</option><option>实践课</option></select>
    <label>课程简介</label><textarea id="f-desc"></textarea>
    <label>课程目标(每行一条)</label><textarea id="f-obj" placeholder="掌握…&#10;能够…"></textarea>
    <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
    <button class="btn primary" onclick="viewCourses.doAdd()">创建</button></div>`);
};
viewCourses.doAdd = function(){
  const name=document.getElementById('f-name').value.trim();
  if(!name){toast('请填写课程名称');return;}
  const c=store.addCourse({
    name, code:document.getElementById('f-code').value.trim(),
    credit:+document.getElementById('f-credit').value||3, hours:+document.getElementById('f-hours').value||48,
    semester:Math.min(8,Math.max(1,+document.getElementById('f-sem').value||1)),
    leader:document.getElementById('f-leader').value.trim(),
    category:document.getElementById('f-cat').value,
    desc:document.getElementById('f-desc').value.trim(),
    objectives:document.getElementById('f-obj').value.split('\n').map(s=>s.trim()).filter(Boolean)
  });
  closeModal(); toast('课程已创建'); location.hash='#/course/'+c.id;
};
viewCourses.editModal = function(cid){
  const c=store.course(cid);
  if(!W('courses',c)){ toast('权限不足:仅课程负责人或管理员可编辑'); return; }
  openModal(`<h3>✏️ 编辑课程</h3>
    <div class="grid cols2"><div><label>课程名称</label><input id="f-name" value="${esc(c.name)}"></div><div><label>课程代码</label><input id="f-code" value="${esc(c.code)}"></div></div>
    <div class="grid cols2"><div><label>学分</label><input id="f-credit" type="number" value="${c.credit}"></div><div><label>学时</label><input id="f-hours" type="number" value="${c.hours}"></div></div>
    <div class="grid cols2"><div><label>开课学期(1-8)</label><input id="f-sem" type="number" min="1" max="8" value="${c.semester||1}"></div><div><label>课程负责人</label><input id="f-leader" value="${esc(c.leader||'')}"></div></div>
    <label>课程简介</label><textarea id="f-desc">${esc(c.desc)}</textarea>
    <label>课程目标(每行一条)</label><textarea id="f-obj">${esc((c.objectives||[]).join('\n'))}</textarea>
    <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
    <button class="btn primary" onclick="viewCourses.doEdit('${cid}')">保存</button></div>`);
};
viewCourses.doEdit = function(cid){
  const c=store.course(cid);
  c.name=document.getElementById('f-name').value.trim()||c.name;
  c.code=document.getElementById('f-code').value.trim();
  c.credit=+document.getElementById('f-credit').value||c.credit;
  c.hours=+document.getElementById('f-hours').value||c.hours;
  c.semester=Math.min(8,Math.max(1,+document.getElementById('f-sem').value||c.semester||1));
  c.leader=document.getElementById('f-leader').value.trim();
  c.desc=document.getElementById('f-desc').value.trim();
  c.objectives=document.getElementById('f-obj').value.split('\n').map(s=>s.trim()).filter(Boolean);
  store.save(); closeModal(); toast('已保存'); route();
};
viewCourses.del = function(cid){
  const c=store.course(cid);
  if(!W('courses',c)){ toast('权限不足'); return; }
  if(confirm(`删除课程【${c.name}】?\n将同时删除其章节/知识点/题目/试卷引用!`)){
    store.delCourse(cid); toast('课程已删除'); route();
  }
};

/* ================= 课程详情 ================= */
let currentCourseTab = 'kps';
function viewCourseDetail(cid, tab){
  const c=store.course(cid);
  if(!c) return '<div class="card empty">课程不存在</div>';
  tab = tab||currentCourseTab; currentCourseTab=tab;
  const tabs=[['kps','📖 章节与知识点'],['graph','🕸️ 本课知识图谱'],['bank','🧮 本课题库']];
  if(auth.canSee('data')) tabs.push(['export','📤 导出与平台接口']);
  const canEditKps = auth.canEditKps(c);
  return `<div class="crumb"><a href="#/courses" style="color:var(--primary);text-decoration:none">课程库</a> / ${esc(c.name)}</div>
  <div class="page-head"><div><h1>${esc(c.name)} <span class="tag gray">${esc(c.code)}</span> <span class="tag blue">${esc(c.category||'')}</span> <span class="tag green">S${c.semester||1} 学期</span> <span class="tag purple">负责人:${esc(c.leader||'未设')}</span></h1>
    <div class="sub">${c.credit} 学分 · ${c.hours} 学时 · 挂接专业:${store.majorOfCourse(cid).map(m=>m.name+'(S'+store.semesterOf(m.id,cid)+')').join('、')||'无'} · 所属课程群:${store.groupsOfCourse(cid).map(g=>g.name).join('、')||'无'}</div></div>
    <div class="row"><button class="btn" style="display:${canEditKps?'':'none'}" onclick="viewCourseDetail.addChapterModal('${cid}')">＋ 新增章节</button></div></div>
  <div class="tabs">${tabs.map(([k,l])=>`<button class="${tab===k?'active':''}" onclick="location.hash='#/course/${cid}/${k}'">${l}</button>`).join('')}</div>
  <div id="course-tab"></div>`;
}
function mountCourseDetail(cid, tab){
  tab = tab||currentCourseTab; currentCourseTab=tab;
  const c=store.course(cid); if(!c) return;
  const box=document.getElementById('course-tab'); if(!box) return;
  const canEditKps = auth.canEditKps(c);
  if(tab==='kps') box.innerHTML=renderKps(c, canEditKps);
  else if(tab==='graph'){ box.innerHTML=`<div class="card"><div id="chart" style="height:560px"></div>
      <div class="row" style="margin-top:10px">${auth.canExport()?`<button class="btn small" onclick="exporters.graphJson('${cid}')">导出图谱 JSON</button>`:''}
      <span style="color:var(--muted);font-size:12px">节点=知识点(按章节着色) · 边=知识点关联(前置→后续)</span></div></div>`;
    drawGraph(cid, 'chart'); }
  else if(tab==='bank') box.innerHTML=renderBankList(cid);
  else if(tab==='export') box.innerHTML=renderCourseExport(c);
  R.typeset(box);
}
function renderKps(c, canEdit){
  const exportTplOpts = t=>store.db.templates.filter(x=>x.type===t).map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');
  return `
  <div class="card" style="background:var(--primary-soft);border-color:#bfdbfe;display:${CAN('templates')}">
    <div class="row"><b style="font-size:13px">🧩 模板一键生成:</b>
      <select id="tpl-course-sel" style="width:auto">${exportTplOpts('course')}</select>
      <button class="btn small primary" onclick="viewCourseDetail.genDoc('${c.id}',document.getElementById('tpl-course-sel').value)">生成并编辑</button>
      <button class="btn small" onclick="exporters.tpl(document.getElementById('tpl-course-sel').value,'${c.id}')">直接导出</button>
      <span class="spacer"></span>
      <select id="tpl-ch-sel" style="width:auto">${exportTplOpts('chapter')}</select>
      <select id="tpl-chapter-pick" style="width:auto">${c.chapters.map(ch=>`<option value="${ch.id}">${esc(ch.title)}</option>`).join('')}</select>
      <button class="btn small primary" onclick="viewCourseDetail.genDoc('${c.id}',document.getElementById('tpl-ch-sel').value,document.getElementById('tpl-chapter-pick').value)">生成并编辑</button>
      <button class="btn small" onclick="exporters.tpl(document.getElementById('tpl-ch-sel').value,'${c.id}',document.getElementById('tpl-chapter-pick').value)">直接导出</button>
    </div>
    <p class="mini" style="margin-top:8px">「生成并编辑」会把结果落库为可编辑的教学文档(→ 教学文档中心),可继续在线修改、版本管理与打印。</p></div>
  ${c.chapters.length? c.chapters.map((ch,ci)=>`
    <div class="tree-item">
      <div class="tree-head" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
        <span>📗</span> ${esc(ch.title)} <span class="hours">${ch.hours} 学时 · ${ch.kps.length} 个知识点</span>
        <div class="spacer"></div>
        <button class="btn small" style="display:${canEdit?'':'none'}" title="上移" onclick="event.stopPropagation();store.moveChapter('${c.id}','${ch.id}',-1)&&route()">↑</button>
        <button class="btn small" style="display:${canEdit?'':'none'}" title="下移" onclick="event.stopPropagation();store.moveChapter('${c.id}','${ch.id}',1)&&route()">↓</button>
        <button class="btn small" style="display:${canEdit?'':'none'}" title="复制章节" onclick="event.stopPropagation();store.dupChapter('${c.id}','${ch.id}');toast('章节已复制');route()">复制</button>
        <button class="btn small" style="display:${canEdit?'':'none'}" onclick="event.stopPropagation();viewCourseDetail.editChapterModal('${c.id}','${ch.id}')">编辑</button>
        <button class="btn small" style="display:${canEdit?'':'none'}" onclick="event.stopPropagation();viewCourseDetail.addKpModal('${c.id}','${ch.id}')">＋ 知识点</button>
        <button class="btn small danger" style="display:${canEdit?'':'none'}" onclick="event.stopPropagation();viewCourseDetail.delChapter('${c.id}','${ch.id}')">删除</button>
      </div>
      <div class="tree-body">
        ${ch.kps.length? ch.kps.map((k,ki)=>`
          <div class="kp-chip">
            <div class="kp-title">🔸 ${esc(k.title)}
              <div class="spacer"></div>
              <button class="btn small" onclick="viewCourseDetail.viewKp('${c.id}','${ch.id}','${k.id}')">查看</button>
              <button class="btn small" style="display:${canEdit?'':'none'}" title="上移" onclick="store.moveKp('${c.id}','${ch.id}','${k.id}',-1)&&route()">↑</button>
              <button class="btn small" style="display:${canEdit?'':'none'}" title="下移" onclick="store.moveKp('${c.id}','${ch.id}','${k.id}',1)&&route()">↓</button>
              <button class="btn small" style="display:${canEdit?'':'none'}" onclick="viewCourseDetail.editKpModal('${c.id}','${ch.id}','${k.id}')">编辑</button>
              <button class="btn small danger" style="display:${canEdit?'':'none'}" onclick="viewCourseDetail.delKp('${c.id}','${ch.id}','${k.id}')">删除</button></div>
            <div class="kp-desc">${esc((k.content||'').replace(/[#*`$\\\\]/g,'').slice(0,80)||'暂无内容(Markdown + LaTeX 公式)')}</div>
            ${(k.links||[]).length? `<div style="margin-top:6px;font-size:12px;color:var(--accent)">🔗 关联:${k.links.map(l=>{const g=store.findKpGlobal(l);return g?`[${esc(g.course.name)}]${esc(g.kp.title)}`:l;}).join('、')}</div>`:''}
          </div>`).join('') : '<div class="empty">暂无知识点</div>'}
      </div>
    </div>`).join('') : '<div class="card empty">暂无章节</div>'}`;
}
viewCourseDetail.addChapterModal = function(cid){
  openModal(`<h3>＋ 新增章节</h3><label>章节标题</label><input id="ch-title" placeholder="如:第4章 面向对象基础">
    <label>建议学时</label><input id="ch-hours" type="number" value="6">
    <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
    <button class="btn primary" onclick="viewCourseDetail.doAddChapter('${cid}')">创建</button></div>`);
};
viewCourseDetail.doAddChapter = function(cid){
  const t=document.getElementById('ch-title').value.trim(); if(!t){toast('请填写标题');return;}
  store.addChapter(cid,{title:t,hours:+document.getElementById('ch-hours').value||4});
  closeModal(); toast('章节已创建'); route();
};
viewCourseDetail.editChapterModal = function(cid,chId){
  const ch=store.chapter(cid,chId);
  openModal(`<h3>✏️ 编辑章节</h3><label>章节标题</label><input id="ch-title" value="${esc(ch.title)}">
    <label>建议学时</label><input id="ch-hours" type="number" value="${ch.hours}">
    <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
    <button class="btn primary" onclick="viewCourseDetail.doEditChapter('${cid}','${chId}')">保存</button></div>`);
};
viewCourseDetail.doEditChapter = function(cid,chId){
  const ch=store.chapter(cid,chId);
  ch.title=document.getElementById('ch-title').value.trim()||ch.title;
  ch.hours=+document.getElementById('ch-hours').value||ch.hours;
  store.save(); closeModal(); toast('已保存'); route();
};
viewCourseDetail.delChapter = function(cid,chId){
  if(confirm('删除该章节及其全部知识点?')){ store.delChapter(cid,chId); route(); }
};
viewCourseDetail.addKpModal = function(cid,chId,title){
  openModal(`<h3>＋ 新增知识点</h3>
    <label>知识点名称</label><input id="kp-title" value="${esc(title||'')}">
    <label>内容(Markdown,支持 LaTeX:$x^2$ 与 $$\\frac{a}{b}$$、图片 ![](url)、代码块)</label>
    <textarea id="kp-content" style="min-height:180px"></textarea>
    <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
    <button class="btn primary" onclick="viewCourseDetail.doAddKp('${cid}','${chId}')">创建</button></div>`);
};
viewCourseDetail.doAddKp = function(cid,chId){
  const t=document.getElementById('kp-title').value.trim(); if(!t){toast('请填写名称');return;}
  store.addKp(cid,chId,{title:t,content:document.getElementById('kp-content').value});
  closeModal(); toast('知识点已创建'); route();
};
viewCourseDetail.editKpModal = function(cid,chId,kpId){
  const kp=store.kp(cid,chId,kpId);
  const allKps=[];
  store.db.courses.forEach(cc=>cc.chapters.forEach(x=>x.kps.forEach(k=>{ if(k.id!==kpId) allKps.push({id:k.id,label:`[${cc.name}] ${k.title}`}); })));
  openModal(`<h3>✏️ 编辑知识点</h3>
    <label>名称</label><input id="kp-title" value="${esc(kp.title)}">
    <label>内容(Markdown + LaTeX)</label>
    <div class="row" style="margin-bottom:6px"><button class="btn small" onclick="viewCourseDetail.previewKp()">👁 预览公式效果</button>
    <span style="color:var(--muted);font-size:11.5px">关联其他课程的知识点即可建立跨课程衔接(课程群图谱可见)</span></div>
    <textarea id="kp-content" style="min-height:200px">${esc(kp.content)}</textarea>
    <div id="kp-preview" class="md" style="display:none;background:#fbfcfe;border:1px dashed var(--border);border-radius:8px;padding:12px;margin-top:8px"></div>
    <label>🔗 关联知识点(构成知识图谱的边,按住 Ctrl 多选)</label>
    <select id="kp-links" multiple style="height:110px">${allKps.map(k=>`<option value="${k.id}" ${(kp.links||[]).includes(k.id)?'selected':''}>${esc(k.label)}</option>`).join('')}</select>
    <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
    <button class="btn primary" onclick="viewCourseDetail.doEditKp('${cid}','${chId}','${kpId}')">保存</button></div>`);
};
viewCourseDetail.previewKp = function(){
  const p=document.getElementById('kp-preview');
  p.style.display='block';
  p.innerHTML=R.md(document.getElementById('kp-content').value);
  R.typeset(p);
};
viewCourseDetail.doEditKp = function(cid,chId,kpId){
  const kp=store.kp(cid,chId,kpId);
  kp.title=document.getElementById('kp-title').value.trim()||kp.title;
  kp.content=document.getElementById('kp-content').value;
  kp.links=[...document.getElementById('kp-links').selectedOptions].map(o=>o.value);
  store.save(); closeModal(); toast('已保存'); route();
};
viewCourseDetail.delKp = function(cid,chId,kpId){
  if(confirm('删除该知识点?(关联边同步清理)')){ store.delKp(cid,chId,kpId); route(); }
};
viewCourseDetail.viewKp = function(cid,chId,kpId){
  const kp=store.kp(cid,chId,kpId);
  openModal(`<h3>🔸 ${esc(kp.title)}</h3><div class="md" id="kp-view">${R.md(kp.content||'(暂无内容)')}</div>
    <div class="modal-foot"><button class="btn" onclick="closeModal()">关闭</button></div>`);
  R.typeset(document.getElementById('kp-view'));
};
/* 由模板生成可编辑教学文档(落库) */
viewCourseDetail.genDoc = function(cid, tplId, chId){
  const doc = genDocument(cid, tplId, chId);
  if(!doc){ toast('生成失败:请检查模板与章节'); return; }
  toast('已生成教学文档,正在打开编辑器'); location.hash='#/doc/'+doc.id;
};
function renderCourseExport(c){
  return `
  <div class="grid cols2">
    <div class="card"><h3>📦 课程资源导出</h3>
      <div class="row">
        <button class="btn primary" onclick="exporters.coursePackage('${c.id}')">完整课程包(JSON)</button>
        <button class="btn" onclick="exporters.graphJson('${c.id}')">知识图谱 JSON</button>
        <button class="btn" onclick="exporters.exportKpsForAI('${c.id}')">导出给 AI 加工</button>
      </div>
      <label style="margin-top:14px">📚 教学文档(模板自动填充 → 可在线编辑)</label>
      ${store.db.templates.filter(t=>t.type==='course').map(t=>`
        <div class="row" style="margin:6px 0"><span class="tag blue" style="min-width:90px;text-align:center">${esc(t.name)}</span>
        <button class="btn small primary" onclick="viewCourseDetail.genDoc('${c.id}','${t.id}')">生成并编辑</button>
        <button class="btn small" onclick="exporters.tpl('${t.id}','${c.id}')">导出 Markdown</button></div>`).join('')}
      <label style="margin-top:14px">📗 章节级文档(教案/讲义)</label>
      <div class="row">
        <select id="ch-pick" style="width:auto">${c.chapters.map(ch=>`<option value="${ch.id}">${esc(ch.title)}</option>`).join('')||'<option>(无章节)</option>'}</select>
        ${store.db.templates.filter(t=>t.type==='chapter').map(t=>`
          <button class="btn small" onclick="viewCourseDetail.genDoc('${c.id}','${t.id}',document.getElementById('ch-pick').value)">生成「${esc(t.name)}」</button>`).join('')}
      </div>
      <label style="margin-top:14px">📄 本课程已有教学文档(${store.documentsOfCourse(c.id).length})</label>
      ${store.documentsOfCourse(c.id).length? store.documentsOfCourse(c.id).slice(0,6).map(d=>`
        <div class="row" style="margin:4px 0"><span class="tag gray">${docTypeMeta(d.type).icon} ${docTypeMeta(d.type).label}</span>
        <a href="#/doc/${d.id}" style="color:var(--primary);text-decoration:none;font-size:12.5px">${esc(d.title)}</a></div>`).join('')
      : '<div class="mini">尚无文档 — 用上方按钮生成,或前往教学文档中心</div>'}
      <div class="row" style="margin-top:8px"><a class="btn small" href="#/docs" style="text-decoration:none">前往教学文档中心 →</a></div>
    </div>
    <div class="card"><h3>🏫 教学平台接口(适配器模式,可扩展)</h3>
      <p style="color:var(--muted);font-size:12.5px">将课程章节结构与题库转换为目标平台格式。当前预留:超星(学习通)、雨课堂。新增平台只需注册新适配器。</p>
      ${Object.entries(PLATFORMS).map(([key,p])=>`
        <div class="row" style="margin:8px 0"><span class="tag purple" style="min-width:110px;text-align:center">${esc(p.name)}</span>
        <button class="btn small" onclick="exporters.exportPlatform('${key}','${c.id}')">导出适配包</button></div>`).join('')}
      <label style="margin-top:14px">🧮 题库导出</label>
      <div class="row"><button class="btn small" onclick="exporters.bankJson('${c.id}')">题库 JSON</button>
      <button class="btn small" onclick="exporters.bankCsv('${c.id}')">题库 CSV(Excel)</button></div>
    </div></div>`;
}

/* ================= 知识图谱(全局/课程/课程群) ================= */
function viewGraph(){
  return `<div class="page-head"><div><h1>知识图谱</h1><div class="sub">节点=知识点 · 边=衔接依赖 · 支持全部/单课程/课程群三种视图,可导出 JSON</div></div>
    <div class="row">
      <select id="graph-group" style="width:auto" onchange="document.getElementById('graph-course').value='';refreshGraph()">
        <option value="">按课程群…</option>${store.db.groups.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('')}</select>
      <select id="graph-course" style="width:auto" onchange="document.getElementById('graph-group').value='';refreshGraph()">
        <option value="">按课程…</option>${store.db.courses.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
      <button class="btn" style="display:${auth.canExport()?'':'none'}" onclick="refreshGraphExport()">导出 JSON</button></div></div>
  <div class="card"><div id="chart" style="height:640px"></div></div>`;
}
function refreshGraph(){
  const gid=document.getElementById('graph-group').value;
  const cid=document.getElementById('graph-course').value;
  if(gid){ const g=store.group(gid); drawGraph([...g.courseIds],'chart'); }
  else drawGraph(cid,'chart');
}
function refreshGraphExport(){
  const gid=document.getElementById('graph-group').value;
  const cid=document.getElementById('graph-course').value;
  if(gid){ const g=store.group(gid); exporters.graphJsonCourses([...g.courseIds], g.name); }
  else exporters.graphJson(cid);
}
const CHAPTER_COLORS=['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2','#be185d','#65a30d'];
function drawGraph(courseSel, elId){
  const g = Array.isArray(courseSel)? exporters._graphOfCourses(courseSel) : exporters._graphOf(courseSel);
  const el=document.getElementById(elId); if(!el) return;
  const chart=echarts.init(el);
  const groupColor={};
  g.nodes.forEach(n=>{ if(!(n.group in groupColor)) groupColor[n.group]=CHAPTER_COLORS[Object.keys(groupColor).length%CHAPTER_COLORS.length]; });
  const deg={}; g.edges.forEach(e=>{deg[e.source]=(deg[e.source]||0)+1;deg[e.target]=(deg[e.target]||0)+1;});
  chart.setOption({
    tooltip:{formatter:p=>p.dataType==='node'?`<b>${p.data.label}</b><br/>${p.data.group||''} · ${p.data.chapter||''}`:''},
    legend:{data:Object.keys(groupColor), textStyle:{fontSize:11}, bottom:0, type:'scroll'},
    series:[{
      type:'graph', layout:'force', roam:true, draggable:true,
      force:{repulsion:420, edgeLength:90, gravity:.08},
      label:{show:true, fontSize:11, color:'#1f2937', position:'top'},
      edgeSymbol:['none','arrow'], edgeSymbolSize:7,
      lineStyle:{color:'#94a3b8', width:1.4, curveness:.15},
      emphasis:{focus:'adjacency', lineStyle:{width:3}},
      data:g.nodes.map(n=>({id:n.id, name:n.label, symbolSize:26+(deg[n.id]||0)*8,
        itemStyle:{color:groupColor[n.group]||'#64748b'}, group:n.group, chapter:n.chapter})),
      links:g.edges.map(e=>({source:e.source,target:e.target}))
    }]
  });
  window.addEventListener('resize',()=>chart.resize());
}

/* ================= 题库 ================= */
function renderBankList(cid){
  const qs=store.questions(cid);
  const typeFilter=document.getElementById('bank-type')?.value||'';
  const diffFilter=document.getElementById('bank-diff')?.value||'';
  const kpFilter=document.getElementById('bank-kp')?.value||'';
  const kw=document.getElementById('bank-kw')?.value||'';
  const list=qs.filter(q=>(!typeFilter||q.type===typeFilter)&&(!diffFilter||q.difficulty===diffFilter)&&(!kpFilter||q.kpId===kpFilter)&&(!kw||q.stem.includes(kw)));
  const cOpts = store.db.courses.map(c=>`<option value="${c.id}" ${cid===c.id?'selected':''}>${esc(c.name)}</option>`).join('');
  const canW = W('bank');
  /* 知识点筛选选项(按当前课程范围) */
  const kpOpts=[]; (cid? [store.course(cid)] : store.db.courses).forEach(c=>{ if(!c) return;
    c.chapters.forEach(ch=>ch.kps.forEach(k=>kpOpts.push({id:k.id,label:`[${c.name.slice(0,6)}] ${k.title}`}))); });
  return `
  <div class="card"><div class="row">
    <select id="bank-course" style="width:auto" onchange="location.hash='#/bank/'+this.value">${cOpts}</select>
    <select id="bank-type" style="width:auto" onchange="route()">
      <option value="">全部题型</option>${Object.entries(TYPES).map(([k,v])=>`<option value="${k}" ${typeFilter===k?'selected':''}>${v.label}</option>`).join('')}</select>
    <select id="bank-diff" style="width:auto" onchange="route()">
      ${['','易','中','难'].map(d=>`<option value="${d}" ${diffFilter===d?'selected':''}>${d||'全部难度'}</option>`).join('')}</select>
    <select id="bank-kp" style="width:auto" onchange="route()">
      <option value="">全部知识点</option>${kpOpts.map(k=>`<option value="${k.id}" ${kpFilter===k.id?'selected':''}>${esc(k.label)}</option>`).join('')}</select>
    <input id="bank-kw" placeholder="🔍 搜索题干…" style="width:180px" value="${esc(kw)}" oninput="clearTimeout(window._bt);window._bt=setTimeout(route,400)">
    <div class="spacer"></div>
    <button class="btn small" style="display:${auth.canExport()?'':'none'}" onclick="exporters.bankCsv('${cid||''}')">导出 CSV</button>
    <button class="btn small" style="display:${auth.canExport()?'':'none'}" onclick="exporters.bankJson('${cid||''}')">导出 JSON</button>
    <button class="btn small" style="display:${auth.canExport()?'':'none'}" onclick="chaoxing.exportWithFormat('bank','${cid||''}')">⬇ 导出(多格式)</button>
    ${tplBtn('bank','题库模板')}
    <button class="btn small" style="display:${auth.role()==='admin'||auth.role()==='major_leader'?'':'none'}" onclick="exporters.importBank()">📥 导入题库</button>
    <button class="btn small primary" style="display:${canW?'':'none'}" onclick="viewBank.editModal('${cid||''}')">＋ 新增题目</button>
  </div>
  ${canW?`<div class="row" style="margin-top:10px;border-top:1px dashed var(--border);padding-top:10px">
    <label style="margin:0;display:flex;gap:6px;align-items:center;color:var(--ink);font-size:12.5px;cursor:pointer">
      <input type="checkbox" style="width:auto" onclick="viewBank.toggleAll(this)"> 全选</label>
    <span class="mini" id="bank-sel-n">已选 0 题</span>
    <span class="spacer"></span>
    <select id="batch-course" style="width:auto">${store.db.courses.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
    <button class="btn small" onclick="viewBank.batchMove()">批量移动到课程</button>
    <button class="btn small danger" onclick="viewBank.batchDel()">批量删除</button>
  </div>`:''}</div>
  <div class="card">
    ${list.length? `<div class="table-wrap"><table><thead><tr>${canW?'<th style="width:34px"></th>':''}<th style="width:38px">#</th><th style="width:190px">题型/难度/章节</th><th>题干</th><th>答案</th><th style="width:200px">操作</th></tr></thead><tbody>
    ${list.map((q,i)=>{
      const qw=W('bank',q);
      return `<tr>
      ${canW?`<td><input type="checkbox" class="q-ck" style="width:auto" value="${q.id}" onchange="viewBank.updSel()"></td>`:''}
      <td>${i+1}</td>
      <td><span class="tag blue">${TYPES[q.type].label}</span> <span class="tag ${q.difficulty==='难'?'orange':q.difficulty==='易'?'green':'gray'}">${q.difficulty}</span><br><span style="font-size:11.5px;color:var(--muted)">${esc(q.chapter||'')}</span></td>
      <td class="md-cell" data-md="${esc(q.stem)}">${esc(q.stem.slice(0,90))}${q.stem.length>90?'…':''}</td>
      <td style="max-width:200px">${esc(String(q.answer).slice(0,40))}</td>
      <td class="row" style="flex-wrap:nowrap">
        <button class="btn small" onclick="viewBank.preview('${q.id}')">预览</button>
        ${qw?`<button class="btn small" onclick="viewBank.editModal('${q.courseId}','${q.id}')">编辑</button>
          <button class="btn small danger" onclick="viewBank.del('${q.id}')">删除</button>`:'<span style="color:var(--muted);font-size:11.5px">只读</span>'}</td></tr>`;
    }).join('')}
    </tbody></table></div>` : '<div class="empty">暂无题目</div>'}
  </div>`;
}
const viewBank = {
  updSel(){
    const n=document.querySelectorAll('.q-ck:checked').length;
    const el=document.getElementById('bank-sel-n'); if(el) el.textContent='已选 '+n+' 题';
  },
  selected(){ return [...document.querySelectorAll('.q-ck:checked')].map(x=>x.value); },
  toggleAll(ck){ document.querySelectorAll('.q-ck').forEach(x=>{ x.checked=ck.checked; }); this.updSel(); },
  batchDel(){
    const ids=this.selected(); if(!ids.length){toast('请先勾选题目');return;}
    if(!confirm(`删除选中的 ${ids.length} 道题目?(同时从试卷移除)`)) return;
    let n=0; ids.forEach(id=>{ const q=store.db.bank.find(x=>x.id===id); if(q&&W('bank',q)){ store.delQuestion(id); n++; } });
    toast(`已删除 ${n} 道题目`); route();
  },
  batchMove(){
    const ids=this.selected(); if(!ids.length){toast('请先勾选题目');return;}
    const tgt=document.getElementById('batch-course').value;
    ids.forEach(id=>{ const q=store.db.bank.find(x=>x.id===id); if(q&&W('bank',q)) q.courseId=tgt; });
    store.save(); toast(`已移动 ${ids.length} 题到《${store.course(tgt).name}》`); route();
  },
  preview(id){
    const q=store.db.bank.find(x=>x.id===id); if(!q) return;
    openModal(`<h3>🧮 题目预览</h3>
      <div class="row" style="margin-bottom:8px"><span class="tag blue">${TYPES[q.type].label}</span>
        <span class="tag ${q.difficulty==='难'?'orange':q.difficulty==='易'?'green':'gray'}">${q.difficulty}</span>
        <span class="tag gray">${esc(q.chapter||'')}</span>
        <span class="tag purple">${esc((store.course(q.courseId)||{}).name||'-')}</span></div>
      <div id="q-preview" class="md">
        <div style="font-weight:600">${R.md(q.stem)}</div>
        ${(q.options||[]).length? `<div style="margin:10px 0">${(q.options||[]).map(o=>`<div>${R.md(o)}</div>`).join('')}</div>`:''}
        <blockquote style="margin-top:12px"><b>参考答案:</b>${R.md(String(q.answer||'-'))}</blockquote>
        ${q.analysis?`<p class="mini"><b>解析:</b>${esc(q.analysis)}</p>`:''}
      </div>
      <div class="modal-foot"><button class="btn" onclick="closeModal()">关闭</button>
      ${W('bank',q)?`<button class="btn primary" onclick="closeModal();viewBank.editModal('${q.courseId}','${q.id}')">编辑该题</button>`:''}</div>`);
    R.typeset(document.getElementById('q-preview'));
  },
  editModal(cid, qid){
    const q = qid? store.db.bank.find(x=>x.id===qid) : null;
    cid = cid || (q?q.courseId:'') || (store.db.courses[0]||{}).id;
    if(q && !W('bank',q)){ toast('权限不足:仅本人负责课程的题目可编辑'); return; }
    openModal(`<h3>🧮 ${q?'编辑题目':'新增题目'}</h3>
      <div class="grid cols2">
        <div><label>所属课程</label><select id="q-course">${store.db.courses.map(c=>`<option value="${c.id}" ${cid===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div>
        <div><label>题型</label><select id="q-type" onchange="viewBank.onType()">${Object.entries(TYPES).map(([k,v])=>`<option value="${k}" ${q&&q.type===k?'selected':''}>${v.label}</option>`).join('')}</select></div>
      </div>
      <div class="grid cols2">
        <div><label>难度</label><select id="q-diff">${['易','中','难'].map(d=>`<option ${q&&q.difficulty===d?'selected':''}>${d}</option>`).join('')}</select></div>
        <div><label>章节</label><input id="q-chapter" value="${esc(q?q.chapter:'')}" placeholder="如:第2章 数据类型"></div>
      </div>
      <label>题干(支持 LaTeX 公式)</label><textarea id="q-stem" style="min-height:90px">${esc(q?q.stem:'')}</textarea>
      <div id="q-opt-wrap" style="display:${q&&TYPES[q.type].hasOptions?'block':'none'}">
        <label>选项(每行一个,如 "A. xxx")</label><textarea id="q-options">${esc(q?q.options.join('\n'):'')}</textarea>
      </div>
      <label>答案</label><input id="q-answer" value="${esc(q?q.answer:'')}">
      <label>解析</label><textarea id="q-analysis" style="min-height:60px">${esc(q?q.analysis:'')}</textarea>
      <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
      <button class="btn primary" onclick="viewBank.doSave('${qid||''}')">保存</button></div>`);
  },
  onType(){
    const t=document.getElementById('q-type').value;
    document.getElementById('q-opt-wrap').style.display=TYPES[t].hasOptions?'block':'none';
  },
  doSave(qid){
    const data={
      courseId:document.getElementById('q-course').value,
      type:document.getElementById('q-type').value,
      difficulty:document.getElementById('q-diff').value,
      chapter:document.getElementById('q-chapter').value.trim(),
      stem:document.getElementById('q-stem').value,
      options:document.getElementById('q-options')?document.getElementById('q-options').value.split('\n').map(s=>s.trim()).filter(Boolean):[],
      answer:document.getElementById('q-answer').value.trim(),
      analysis:document.getElementById('q-analysis').value.trim()
    };
    if(!data.stem){toast('请填写题干');return;}
    if(qid){ Object.assign(store.db.bank.find(x=>x.id===qid), data); store.save(); }
    else store.addQuestion(data);
    closeModal(); toast('题目已保存'); route();
  },
  del(id){ const q=store.db.bank.find(x=>x.id===id);
    if(!W('bank',q)){toast('权限不足');return;}
    if(confirm('删除该题目?(同时从试卷移除)')){ store.delQuestion(id); route(); } }
};

/* ================= 卷库 ================= */
function viewPapers(){
  const canW = W('papers');
  return `<div class="page-head"><div><h1>卷库管理</h1><div class="sub">从题库选题组卷 · 支持随机组卷、在线预览与打印为 PDF、导出 Markdown</div></div>
    <div class="row">
      <button class="btn" style="display:${canW?'':'none'}" onclick="viewPapers.randomModal()">🎲 随机组卷</button>
      <button class="btn primary" style="display:${canW?'':'none'}" onclick="viewPapers.createModal()">＋ 新建试卷</button>
    </div></div>
  ${store.db.papers.length? store.db.papers.map(p=>{
    const c=store.course(p.courseId);
    const pw=W('papers',p);
    const n=p.sections.reduce((s,x)=>s+x.questionIds.length,0);
    const total=p.sections.reduce((s,x)=>s+Number(x.score||0),0);
    return `<div class="card">
      <div class="row"><h3 style="margin:0">🗒️ ${esc(p.name)} <span class="tag gray">${esc(c?c.name:'-')}</span></h3>
        <div class="spacer"></div>
        <span style="color:var(--muted);font-size:12px">${n} 题 · 参考总分 ${total}</span>
        <button class="btn small" onclick="viewPapers.preview('${p.id}')">预览/打印</button>
        <button class="btn small" style="display:${pw?'':'none'}" onclick="viewPapers.editModal('${p.id}')">组卷编辑</button>
        <button class="btn small" style="display:${pw?'':'none'}" onclick="viewPapers.dup('${p.id}')">复制</button>
        <button class="btn small" style="display:${auth.canExport()?'':'none'}" onclick="exporters.paper('${p.id}')">导出</button>
        <button class="btn small danger" style="display:${pw?'':'none'}" onclick="viewPapers.del('${p.id}')">删除</button></div>
      <div style="margin-top:10px">${p.sections.map(s=>`
        <div style="border-left:3px solid var(--primary);padding:4px 12px;margin:6px 0;background:#fbfcfe;border-radius:0 8px 8px 0">
          <b style="font-size:13px">${esc(s.title)}</b> <span class="tag gray">${Number(s.score||0)}分</span>
          <div style="font-size:12px;color:var(--muted);margin-top:3px">
            ${s.questionIds.map((qid,i)=>{const q=store.db.bank.find(x=>x.id===qid);return q?`${i+1}.${q.stem.slice(0,24)}…`:'';}).join('  ')||'未选题'}
          </div></div>`).join('')||'<div class="empty">尚未组卷</div>'}
      </div></div>`;
  }).join('') : '<div class="card empty">暂无试卷 — 可「新建试卷」选题组卷,或「随机组卷」快速出卷</div>'}`;
}
viewPapers.createModal = function(){
  openModal(`<h3>＋ 新建试卷</h3><label>试卷名称</label><input id="p-name" placeholder="如:2026-2027 学年第一学期期末卷">
    <label>课程</label><select id="p-course">${store.db.courses.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
    <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
    <button class="btn primary" onclick="viewPapers.doCreate()">创建并组卷</button></div>`);
};
viewPapers.doCreate = function(){
  const name=document.getElementById('p-name').value.trim(); if(!name){toast('请填写试卷名称');return;}
  const p=store.addPaper({name, courseId:document.getElementById('p-course').value});
  closeModal(); viewPapers.editModal(p.id);
};
viewPapers.editModal = function(pid){
  const p=store.paper(pid);
  if(!W('papers',p)){ toast('权限不足'); return; }
  const cQuestions=store.questions(p.courseId);
  const chosen=new Set(p.sections.flatMap(s=>s.questionIds));
  openModal(`<h3>🧩 组卷 — ${esc(p.name)}</h3>
    <div class="row" style="margin-bottom:8px">
      <input id="sec-title" style="width:240px" placeholder="大题标题,如:一、单项选择题(每题20分)">
      <input id="sec-score" type="number" style="width:90px" placeholder="分值">
      <button class="btn small primary" onclick="viewPapers.addSection('${pid}')">＋ 添加大题</button></div>
    ${p.sections.map((s,si)=>`
      <div class="kp-chip"><div class="kp-title">📌 ${esc(s.title)} (${s.score}分)
        <div class="spacer"></div>
        <button class="btn small danger" onclick="viewPapers.delSection('${pid}',${si})">删除大题</button></div>
        <div style="margin-top:6px">
        ${cQuestions.map(q=>`<label style="display:flex;gap:8px;align-items:center;font-size:12.5px;color:var(--ink);margin:4px 0;cursor:pointer">
          <input type="checkbox" style="width:auto" ${chosen.has(q.id)?'checked':''} onchange="viewPapers.toggleQ('${pid}',${si},'${q.id}')">
          <span class="tag gray">${TYPES[q.type].label}</span>${esc(q.stem.slice(0,50))}…</label>`).join('')||'题库为空'}
        </div></div>`).join('')||'<div class="empty">先添加大题,再从本课程题库勾选题目</div>'}
    <div class="modal-foot"><button class="btn" onclick="closeModal()">完成</button></div>`);
};
viewPapers.addSection = function(pid){
  const p=store.paper(pid);
  const t=document.getElementById('sec-title').value.trim();
  if(!t){toast('请填写大题标题');return;}
  p.sections.push({title:t, score:+document.getElementById('sec-score').value||0, questionIds:[]});
  store.save(); viewPapers.editModal(pid);
};
viewPapers.delSection = function(pid,si){ const p=store.paper(pid); p.sections.splice(si,1); store.save(); viewPapers.editModal(pid); };
viewPapers.toggleQ = function(pid,si,qid){
  const s=store.paper(pid).sections[si];
  s.questionIds = s.questionIds.includes(qid)? s.questionIds.filter(x=>x!==qid) : [...s.questionIds,qid];
  store.save();
};
/* 试卷预览/打印/复制/随机组卷 */
const CN_NUM='一二三四五六七八九十';
function cnNum(i){ return CN_NUM[i-1]||('第'+(i)+''); }
function shuffle(a){ const r=a.slice(); for(let i=r.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [r[i],r[j]]=[r[j],r[i]]; } return r; }
function paperHtml(p){
  const c=store.course(p.courseId);
  const n=p.sections.reduce((s,x)=>s+x.questionIds.length,0);
  const total=p.sections.reduce((s,x)=>s+Number(x.score||0),0);
  let body=`<h1>${esc(p.name)}</h1><p class="meta">课程:${esc(c?c.name:'-')}　共 ${n} 题　参考总分 ${total}</p>`;
  p.sections.forEach(sec=>{
    body+=`<h2>${esc(sec.title)}</h2>`;
    sec.questionIds.forEach((qid,i)=>{
      const q=store.db.bank.find(x=>x.id===qid); if(!q) return;
      body+=`<div class="q"><b>${i+1}.</b> ${R.md(q.stem)}`;
      if((q.options||[]).length) body+=`<div class="opts">${q.options.map(o=>`<div>${R.md(o)}</div>`).join('')}</div>`;
      body+='</div>';
    });
  });
  body+=`<hr><h2>参考答案</h2>`;
  p.sections.forEach(sec=>{ sec.questionIds.forEach((qid,i)=>{ const q=store.db.bank.find(x=>x.id===qid); if(!q) return;
    body+=`<p class="ans"><b>${esc(sec.title)} ${i+1}.</b> ${R.md(String(q.answer||'-'))}</p>`; }); });
  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(p.name)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<style>
body{max-width:820px;margin:30px auto;padding:0 24px 70px;font-family:"Songti SC","SimSun","PingFang SC",serif;line-height:1.9;color:#111}
h1{font-size:22px;text-align:center;margin-bottom:6px}
.meta{text-align:center;color:#555;font-size:13px;border-bottom:1px solid #ddd;padding-bottom:12px}
h2{font-size:16px;margin-top:22px;border-left:3px solid #1e3a8a;padding-left:10px}
.q{margin:12px 0}
.opts{margin:6px 0 6px 18px;color:#222}
.ans{font-size:13px;color:#333;margin:4px 0}
.print-btn{position:fixed;right:20px;bottom:20px;z-index:9;background:#2563eb;color:#fff;border:none;padding:12px 20px;border-radius:999px;font-size:14px;cursor:pointer;box-shadow:0 6px 18px rgba(37,99,235,.35)}
pre{background:#f5f7fa;padding:12px;border-radius:8px;overflow-x:auto}
@media print{.print-btn{display:none}body{margin:0}}
</style></head>
<body>
<button class="print-btn" onclick="window.print()">🖨 打印 / 另存为 PDF</button>
${body}
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"><\/script>
<script>document.addEventListener('DOMContentLoaded',function(){ if(window.renderMathInElement) renderMathInElement(document.body,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false}); });<\/script>
</body></html>`;
}
viewPapers.preview = function(pid){
  const p=store.paper(pid); if(!p) return;
  const w=window.open('','_blank');
  if(!w){ toast('浏览器拦截了弹窗,请允许后重试'); return; }
  w.document.open(); w.document.write(paperHtml(p)); w.document.close();
  store.log('export','试卷',`预览/打印《${p.name}》`,1);
};
viewPapers.dup = function(pid){
  const p=store.paper(pid); if(!p) return;
  const copy=JSON.parse(JSON.stringify(p)); copy.id='p_'+uid('p'); copy.name=p.name+' (副本)';
  store.db.papers.push(copy); store.save(); toast('试卷已复制'); route();
};
viewPapers._rpConfig = function(cid){
  const qs=store.questions(cid);
  return Object.entries(TYPES).map(([k,v])=>{
    const n=qs.filter(q=>q.type===k).length;
    return `<div class="row" style="margin:6px 0"><span class="tag blue" style="min-width:86px;text-align:center">${v.label}</span>
      <span class="mini">题库 ${n} 题</span><span class="spacer"></span>
      <input id="rp-n-${k}" type="number" min="0" max="${n}" value="0" style="width:90px" placeholder="0">
      <span class="mini">题</span></div>`;
  }).join('');
};
viewPapers.onRandomCourse = function(){
  const el=document.getElementById('rp-config'); const cid=document.getElementById('rp-course').value;
  if(el) el.innerHTML=this._rpConfig(cid);
};
viewPapers.randomModal = function(){
  const first=(store.db.courses[0]||{}).id||'';
  openModal(`<h3>🎲 随机组卷</h3>
    <p class="mini">按题型与数量从课程题库自动抽题,生成一份新试卷(已按题型分大题)。适合快速生成练习卷与 AB 卷。</p>
    <label>试卷名称</label><input id="rp-name" placeholder="如:Python程序设计 随机练习卷">
    <div class="grid cols2">
      <div><label>课程</label><select id="rp-course" onchange="viewPapers.onRandomCourse()">${store.db.courses.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
      <div><label>难度筛选</label><select id="rp-diff">${['','易','中','难'].map(d=>`<option value="${d}">${d||'不限'}</option>`).join('')}</select></div>
    </div>
    <label>抽题配置</label>
    <div id="rp-config">${this._rpConfig(first)}</div>
    <label>每题分值</label><input id="rp-score" type="number" value="10">
    <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
    <button class="btn primary" onclick="viewPapers.doRandom()">生成试卷</button></div>`);
};
viewPapers.doRandom = function(){
  const cid=document.getElementById('rp-course').value;
  const name=document.getElementById('rp-name').value.trim()||'随机练习卷';
  const score=+document.getElementById('rp-score').value||10;
  const diff=document.getElementById('rp-diff').value;
  const pool=store.questions(cid).filter(q=>!diff||q.difficulty===diff);
  const sections=[]; let total=0;
  Object.keys(TYPES).forEach(t=>{
    const el=document.getElementById('rp-n-'+t); if(!el) return;
    const n=+el.value||0; if(!n) return;
    const picked=shuffle(pool.filter(q=>q.type===t)).slice(0,n).map(q=>q.id);
    if(!picked.length) return;
    sections.push({title:`${cnNum(sections.length+1)}、${TYPES[t].label}`, score:score*picked.length, questionIds:picked});
    total+=picked.length*score;
  });
  if(!sections.length){ toast('未抽到题目,请检查配置或题库'); return; }
  store.addPaper({name, courseId:cid, sections});
  closeModal(); store.log('export','试卷',`随机组卷《${name}》`,total);
  toast(`已随机组卷,参考总分 ${total}`); location.hash='#/papers'; route();
};
viewPapers.del = function(pid){ if(confirm('删除该试卷?')){ store.delPaper(pid); route(); } };

/* ================= 模板中心 ================= */
function viewTemplates(){
  const admin=auth.role()==='admin';
  const canW=auth.can('templates')==='w';
  return `<div class="page-head"><div><h1>模板中心</h1><div class="sub">占位符模板引擎 — 新增模板即注册新条目;模板可直接生成教学文档(在线编辑)或导出为文件</div></div>
    <div class="row">
      <button class="btn" style="display:${auth.canExport()?'':'none'}" onclick="viewTemplates.exportAll()">⬇ 导出模板库</button>
      <button class="btn" style="display:${canW?'':'none'}" onclick="viewTemplates.importTemplates()">📥 导入模板</button>
      <button class="btn primary" style="display:${canW?'':'none'}" onclick="viewTemplates.addModal()">＋ 注册新模板</button>
    </div></div>
  <div class="card">
    <div class="table-wrap"><table><thead><tr><th>模板</th><th>类型</th><th>内容预览</th><th style="width:260px">操作</th></tr></thead><tbody>
    ${store.db.templates.map(t=>`<tr>
      <td><b>${esc(t.name)}</b><br><span style="font-size:11.5px;color:var(--muted)">${t.id}</span></td>
      <td><span class="tag ${t.type==='course'?'blue':'purple'}">${t.type==='course'?'课程级':'章节级'}</span></td>
      <td style="max-width:360px"><code style="font-size:11px;color:var(--muted)">${esc(t.content.slice(0,100))}…</code></td>
      <td class="row" style="flex-wrap:nowrap">
        <button class="btn small" onclick="viewTemplates.preview('${t.id}')">效果预览</button>
        <button class="btn small" onclick="viewTemplates.viewModal('${t.id}')">编辑</button>
        <button class="btn small" style="display:${canW?'':'none'}" onclick="viewTemplates.dup('${t.id}')">复制</button>
        <button class="btn small primary" style="display:${auth.can('docs')==='w'?'':'none'}" onclick="viewTemplates.genDocModal('${t.id}')">生成文档</button>
      </td></tr>`).join('')}
    </tbody></table></div>
  </div>
  <div class="card" style="background:var(--primary-soft);border-color:#bfdbfe">
    <h3>💡 可用占位符(写模板时直接引用)</h3>
    <p style="font-size:12.5px;line-height:2;color:#334155">
      <code>{{course.name}}</code> <code>{{course.code}}</code> <code>{{course.credit}}</code> <code>{{course.hours}}</code> <code>{{course.semester}}</code> <code>{{course.leader}}</code> <code>{{course.desc}}</code> <code>{{course.majors}}</code> <code>{{course.objectives}}</code>
      <code>{{chapters.table}}</code> <code>{{calendar.rows}}</code> <code>{{bank.rows}}</code>
      <code>{{chapter.title}}</code> <code>{{chapter.kpTitles}}</code> <code>{{chapter.firstKp}}</code> <code>{{chapter.kpContents}}</code></p>
    <p class="mini">提示:模板生成文档后,可在「教学文档 → 存为模板」把改好的文档反存为新模板,形成资产沉淀。</p></div>`;
}
viewTemplates.preview = function(id){
  const t=store.db.templates.find(x=>x.id===id);
  const c=store.course((store.db.courses[0]||{}).id);
  if(!c){ toast('暂无课程可用于预览'); return; }
  const ch=c.chapters.find(x=>x.id===t.chapterId)||c.chapters[0];
  const md=TemplateRegistry.render(t, c, ch);
  openModal(`<h3>👁 效果预览 — ${esc(t.name)}</h3>
    <p class="mini">以《${esc(c.name)}》${ch?' · '+esc(ch.title):''}的数据自动填充后的效果:</p>
    <div id="tpl-preview" class="md" style="max-height:56vh;overflow:auto;background:#fbfcfe;border:1px solid var(--border);border-radius:10px;padding:14px">${R.md(md)}</div>
    <div class="modal-foot"><button class="btn" onclick="closeModal()">关闭</button>
    <button class="btn" onclick="viewTemplates.viewModal('${id}')">编辑模板</button>
    <button class="btn primary" onclick="closeModal();viewTemplates.genDocModal('${id}')">用此模板生成文档</button></div>`);
  R.typeset(document.getElementById('tpl-preview'));
};
viewTemplates.genDocModal = function(tplId){
  const t=store.db.templates.find(x=>x.id===tplId);
  openModal(`<h3>生成教学文档 — ${esc(t.name)}</h3>
    <label>课程</label><select id="td-course" onchange="viewTemplates.onTdCourse()">${store.db.courses.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
    <label>章节(章节级模板需要)</label><select id="td-chapter">${((store.course((store.db.courses[0]||{}).id)||{chapters:[]}).chapters||[]).map(ch=>`<option value="${ch.id}">${esc(ch.title)}</option>`).join('')||'<option value="">-</option>'}</select>
    <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
    <button class="btn primary" onclick="viewTemplates.doGenDoc('${tplId}')">生成并编辑</button></div>`);
};
viewTemplates.onTdCourse = function(){
  const c=store.course(document.getElementById('td-course').value);
  const sel=document.getElementById('td-chapter'); if(!sel) return;
  sel.innerHTML=(c?c.chapters.map(ch=>`<option value="${ch.id}">${esc(ch.title)}</option>`).join(''):'')||'<option value="">-</option>';
};
viewTemplates.doGenDoc = function(tplId){
  const cid=document.getElementById('td-course').value;
  const chId=document.getElementById('td-chapter').value||'';
  const doc=genDocument(cid, tplId, chId);
  if(!doc){ toast('生成失败'); return; }
  closeModal(); toast('文档已生成'); location.hash='#/doc/'+doc.id;
};
viewTemplates.dup = function(id){
  const copy=store.dupTemplate(id); if(!copy) return;
  toast('模板已复制'); route();
};
viewTemplates.exportAll = function(){
  download(`模板库-${new Date().toISOString().slice(0,10)}.json`,
    JSON.stringify({schema:'dlufe-kb/templates/v1', templates:store.db.templates}, null, 2), 'application/json');
  toast('模板库已导出');
};
viewTemplates.importTemplates = function(){
  pickFile('.json',(text)=>{
    let data; try{ data=JSON.parse(text); }catch(e){ toast('JSON 解析失败'); return; }
    const list=data.templates||data;
    if(!Array.isArray(list)){ toast('格式不正确'); return; }
    let n=0; list.forEach(t=>{ if(t.name&&t.content!==undefined){ store.addTemplate({name:t.name,type:t.type==='chapter'?'chapter':'course',content:t.content}); n++; } });
    toast(`已导入 ${n} 个模板`); route();
  });
};
viewTemplates.addModal = function(){
  openModal(`<h3>＋ 注册新模板</h3>
    <div class="grid cols2"><div><label>模板名称</label><input id="t-name"></div>
    <div><label>作用级别</label><select id="t-type"><option value="course">课程级</option><option value="chapter">章节级</option></select></div></div>
    <label>模板内容(Markdown + 占位符)</label><textarea id="t-content" style="min-height:200px"># {{course.name}} 自定义模板</textarea>
    <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
    <button class="btn primary" onclick="viewTemplates.doAdd()">注册</button></div>`);
};
viewTemplates.doAdd = function(){
  const name=document.getElementById('t-name').value.trim(); if(!name){toast('请填写名称');return;}
  store.db.templates.push({id:uid('tpl'),name,type:document.getElementById('t-type').value,content:document.getElementById('t-content').value});
  store.save(); closeModal(); toast('模板已注册'); route();
};
viewTemplates.viewModal = function(id){
  const t=store.db.templates.find(x=>x.id===id);
  const admin=auth.role()==='admin';
  openModal(`<h3>📄 ${esc(t.name)}</h3>
    <label>模板内容(Markdown + 占位符)</label><textarea id="t-content" style="min-height:240px" ${admin?'':'readonly'}>${esc(t.content)}</textarea>
    <div class="modal-foot">${admin?`<button class="btn danger" onclick="viewTemplates.del('${id}')">删除模板</button>`:''}
    <button class="btn" onclick="closeModal()">关闭</button>
    ${admin?`<button class="btn primary" onclick="viewTemplates.doEdit('${id}')">保存</button>`:''}</div>`);
};
viewTemplates.doEdit = function(id){
  const t=store.db.templates.find(x=>x.id===id);
  t.content=document.getElementById('t-content').value;
  store.save(); closeModal(); toast('模板已保存'); route();
};
viewTemplates.del = function(id){
  if(confirm('删除该模板?')){ store.db.templates=store.db.templates.filter(t=>t.id!==id); store.save(); closeModal(); route(); }
};

/* ================= 数据与接口 ================= */
function viewData(){
  const admin=auth.role()==='admin';
  const cOpts=store.db.courses.map(c=>`<option value="${c.id}">${esc(c.name)}${c.code?` (${esc(c.code)})`:''}</option>`).join('');
  const cid=(store.db.courses[0]||{}).id||'';
  const canW=W('courses');
  /* 批量建模类导入(不依赖已选课程) */
  const modelRows=[
    ['courseInfo','📘','课程基本信息','批量建立/更新课程(名称、学分、学时、负责人)','tpl'],
    ['majorPlan','🏛️','专业与修读计划','建专业并把课程按修读学期挂接(一行 = 专业×课程)',''],
    ['chapters','🗂️','章节结构','按课程批量建立章节与学时(大纲骨架)',''],
    ['classes','👥','教学班级','批量开课班级(自动初始化平时/期中/期末权重)',''],
    ['gradeItems','⚖️','成绩项与权重','调整班级成绩构成与权重比例','']
  ];
  /* 课程资源类导入(需选定课程) */
  const assetRows=[
    ['kpCatalog','📑','知识点目录','章节 + 知识点内容(Markdown/LaTeX),超星课程目录对应'],
    ['bank','🧮','题库','6 种题型批量导入,超星题库对应'],
    ['graph','🕸️','知识图谱','两列表(前置→后续)或 JSON,超星图谱对应'],
    ['paper','🗒️','试卷结构','按大题组织小题,题干自动匹配题库']
  ];
  return `<div class="page-head"><div><h1>数据与接口</h1>
    <div class="sub">导入导出模板 · 批量建模 · 全库备份 · AI 工作流 · 平台接口(当前角色:${ROLES[auth.role()].label})</div></div>
    <div class="row"><button class="btn primary" onclick="location.hash='#/datatpl'">📋 数据模板中心(全部模板与字段说明)</button></div></div>

  <div class="card" style="background:linear-gradient(135deg,#eff6ff,#f5f3ff);border-color:#c7d2fe">
    <h3>📋 每个导入导出功能点都配有可直接使用的模板</h3>
    <p class="mini" style="line-height:1.9">所有模板均提供 <b>CSV / TSV / Excel(.xlsx) / JSON</b> 格式,并附带<b>字段含义、是否必填、格式要求、示例数据</b>与<b>超星对应列</b>说明。
      下载「模板包(ZIP)」可一次拿到 4 种格式 + 字段说明.md + README.txt,填好即可直接导入。导入时会先<b>校验并预览</b>,逐行指出问题。</p>
    <div class="row" style="margin-top:8px">
      <button class="btn primary" style="display:${auth.canExport()?'':'none'}" onclick="templatesHub.downloadAll()">⬇ 下载全部模板(ZIP)</button>
      <button class="btn" onclick="location.hash='#/datatpl'">📖 浏览字段字典与示例</button>
    </div>
  </div>

  <div class="grid cols2">
    <div class="card"><h3>🏗️ 批量建模导入(专业 / 课程 / 班级)</h3>
      <div class="table-wrap"><table><thead><tr><th style="width:150px">对象</th><th>用途</th><th style="width:230px">操作</th></tr></thead><tbody>
      ${modelRows.map(([id,icon,name,desc,_t])=>`<tr>
        <td><b>${icon} ${name}</b></td><td class="mini">${esc(desc)}</td>
        <td class="row" style="gap:4px">${canW?`<button class="btn small primary" onclick="ImportKit.open('${id}',{})">📥 导入</button>`:'<span class="mini">无权限</span>'}
        ${tplBtn(id,'模板')}</td></tr>`).join('')}
      </tbody></table></div>
    </div>

    <div class="card"><h3>📚 课程资源导入(需先选定课程)</h3>
      <div class="row" style="margin-bottom:8px"><b style="font-size:12.5px">目标课程:</b>
        <select id="da-course" style="width:auto">${cOpts}</select></div>
      <div class="table-wrap"><table><thead><tr><th style="width:130px">对象</th><th>用途</th><th style="width:230px">操作</th></tr></thead><tbody>
      ${assetRows.map(([id,icon,name,desc])=>`<tr>
        <td><b>${icon} ${name}</b></td><td class="mini">${esc(desc)}</td>
        <td class="row" style="gap:4px">${canW?`<button class="btn small primary" onclick="ImportKit.open('${id}',{courseId:document.getElementById('da-course').value})">📥 导入</button>`:'<span class="mini">无权限</span>'}
        ${tplBtn(id,'模板')}</td></tr>`).join('')}
      </tbody></table></div>
    </div>

    <div class="card"><h3>📦 整体包导入导出</h3>
      <div class="table-wrap"><table><tbody>
        ${[['coursePackage','课程包','课程 + 章节知识点 + 图谱 + 题库 + 卷库','exporters.coursePackage(document.getElementById(\'da-course\').value)'],
           ['majorPackage','专业包','专业 + 修读计划 + 课程群(按课程代码复用)','viewMajors.exportAll()'],
           ['documents','教学文档','大纲 / 教案 / 教学日历 / 讲义','chaoxing.exportDocs(document.getElementById(\'da-course\').value)'],
           ['templates','文档模板库','大纲/教案等文档模板','viewTemplates.exportAll()'],
           ['backup','全库备份','本系统全部数据(灾备与迁移)','exporters.fullBackup()']
          ].map(([id,name,desc,fn])=>`<tr>
          <td style="width:120px"><b>${name}</b></td><td class="mini">${esc(desc)}</td>
          <td class="row" style="gap:4px;width:250px">
            <button class="btn small" style="display:${auth.canExport()?'':'none'}" onclick="${fn}">⬇ 导出</button>
            ${id!=='documents'&&id!=='aiChecklist'?`<button class="btn small primary" style="display:${admin?'':'none'}" onclick="ImportKit.open('${id}',{})">📥 导入</button>`:''}
            ${tplBtn(id,'模板')}</td></tr>`).join('')}
      </tbody></table></div>
    </div>

    <div class="card"><h3>🤖 AI 生成结果导入导出</h3>
      <p style="color:var(--muted);font-size:12.5px">工作流:① 从课程导出「AI 加工清单」→ ② 交给大模型按 <code>dlufe-kb-ai/v1</code> Schema 生成知识点/题目 → ③ 在此一键导入。</p>
      <div class="row" style="margin-top:10px">
        <select id="ai-course" style="width:auto">${cOpts}</select>
        <button class="btn" style="display:${auth.canExport()?'':'none'}" onclick="exporters.exportKpsForAI(document.getElementById('ai-course').value)">① 导出加工清单</button>
        ${W('courses')?`<button class="btn primary" onclick="exporters.importAIResult()">③ 导入 AI 结果</button>`:''}
      </div>
      <div class="row" style="margin-top:10px">${tplBtn('aiChecklist','加工清单模板')}${tplBtn('aiResult','结果模板')}</div>
    </div>

    <div class="card"><h3>💾 全库备份与恢复</h3>
      <p style="color:var(--muted);font-size:12.5px">数据存储于浏览器 localStorage。备份包含:专业 / 课程群 / 课程 / 章节知识点 / 知识图谱 / 题库 / 卷库 / 文档模板 / <b>教学文档</b> / 班级成绩 / 同步日志。定期导出备份 JSON,可在任何设备恢复。</p>
      <div class="row" style="margin-top:10px">
        <button class="btn primary" style="display:${auth.canExport()?'':'none'}" onclick="exporters.fullBackup()">⬇ 导出全库备份</button>
        ${admin?`<button class="btn" onclick="ImportKit.open('backup',{})">⬆ 恢复备份</button>
        <button class="btn danger" onclick="if(confirm('重置为示例数据?当前数据将清空!')){store.reset();toast('已重置');initNav();route();}">重置示例数据</button>`:''}
      </div></div>

    <div class="card"><h3>🏫 教学平台接口</h3>
      <p style="font-size:12.5px;line-height:1.9;color:#334155">
        <b>超星(学习通)</b>:章节目录、题库、成绩、名单、图谱、作业均支持双向导入导出 —— 见「超星互动」模块的完整对照表。<br>
        <b>雨课堂</b>:适配器已注册(<code>YuketangAdapter</code>),格式对接预留。<br>
        <b>扩展方式</b>:在 <code>exporters.js</code> 中注册新的 <code>PlatformAdapter</code>,并在 <code>js/schemas.js</code> 中登记数据字典即可自动出现在模板中心。</p>
      <div class="row" style="margin-top:8px"><button class="btn" onclick="location.hash='#/chaoxing'">打开超星互动中心 →</button></div>
    </div>
  </div>`;
}
viewData.importCourse = function(){
  // 保留原入口,统一改为带校验预览的导入向导
  ImportKit.open('coursePackage', {});
};
