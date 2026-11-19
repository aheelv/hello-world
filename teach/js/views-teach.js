/* 视图层 v3:教师工作台 · 教学班级(学生/成绩/作业) · 超星互动中心 */

/* ================= 教师工作台 ================= */
function coursesOfMine(){
  const r=auth.role(), me=auth.name();
  if(r==='admin'||r==='student'||!me) return store.db.courses;
  if(r==='course_leader') return store.db.courses.filter(c=>!c.leader||c.leader===me);
  if(r==='group_leader'){
    const ids=new Set(store.db.groups.filter(g=>!g.leader||g.leader===me).flatMap(g=>g.courseIds));
    return store.db.courses.filter(c=>ids.has(c.id));
  }
  if(r==='major_leader'){
    const ids=new Set(store.db.majors.filter(m=>!m.leader||m.leader===me).flatMap(m=>m.courses.map(x=>x.courseId)));
    return store.db.courses.filter(c=>ids.has(c.id));
  }
  return store.db.courses;
}
function courseTasks(c){
  const kps=c.chapters.reduce((s,ch)=>s+ch.kps.length,0);
  const edges=c.chapters.reduce((s,ch)=>s+ch.kps.reduce((a,k)=>a+(k.links||[]).length,0),0);
  const qs=store.questions(c.id).length;
  const cls=store.classesOfCourse(c.id);
  const gradesOk=cls.length>0 && cls.some(k=>classStats(k).completeness>0);
  return [
    {key:'info', label:'课程信息/目标', ok:!!(c.desc&&(c.objectives||[]).length&&c.credit&&c.hours), hint:'补全简介与课程目标', href:`#/course/${c.id}`},
    {key:'kp',   label:`知识点(${kps})`, ok:kps>0, hint:'建立章节与知识点', href:`#/course/${c.id}/kps`},
    {key:'graph',label:`知识图谱(${edges} 边)`, ok:edges>0, hint:'关联知识点形成图谱', href:`#/course/${c.id}/graph`},
    {key:'bank', label:`题库(${qs} 题)`, ok:qs>0, hint:'录入或导入题目', href:`#/course/${c.id}/bank`},
    {key:'doc',  label:`教学文档(${store.documentsOfCourse(c.id).length})`, ok:store.documentsOfCourse(c.id).length>0, hint:'从模板一键生成大纲/教案/日历并在线编辑', href:'#/docs'},
    {key:'class',label:`教学班级(${cls.length})`, ok:gradesOk, hint:'建班并录入成绩', href:'#/classes'}
  ];
}
/* 当前角色的"我的班级":教师看本人/本人课程的班,管理员看全部 */
function myTeachingClasses(){
  const mine=coursesOfMine();
  const r=auth.role(), me=auth.name();
  if(r==='admin'||!me) return store.db.classes;
  return store.db.classes.filter(k=>k.teacher===me || mine.some(c=>c.id===k.courseId));
}
function scoreFilledAll(k){ return k.students.reduce((a,s)=>a+scoreFilled(k,s),0); }

function viewHome(){
  const mine=coursesOfMine();
  const isStudent = auth.role()==='student';
  const canCls = auth.canSee('classes');
  const myClasses = myTeachingClasses();
  const logs=(store.db.logs||[]).slice(0,5);
  const totalStudents = myClasses.reduce((a,k)=>a+k.students.length,0);
  const kpTotal = mine.reduce((s,c)=>s+c.chapters.reduce((a,ch)=>a+ch.kps.length,0),0);
  const qTotal  = mine.reduce((s,c)=>s+store.questions(c.id).length,0);
  const docTotal= mine.reduce((s,c)=>s+store.documentsOfCourse(c.id).length,0);
  const pending = myClasses.reduce((a,k)=>a+k.students.length*((k.items||[]).length)-scoreFilledAll(k),0);
  const term = store.db.settings.term||'';
  const role = ROLES[auth.role()];
  const quick = NAV.filter(n=>n.module!=='dashboard' && n.module!=='help' && auth.canSee(n.module));
  const stats = isStudent ? [
    {n:mine.length, l:'我的课程', c:'var(--primary)'},
    {n:kpTotal,     l:'知识点',   c:'var(--accent)'},
    {n:qTotal,      l:'题库题目', c:'var(--ok)'},
    {n:docTotal,    l:'教学文档', c:'var(--warn)'}
  ] : [
    {n:mine.length,      l:'我的课程',   c:'var(--primary)'},
    {n:myClasses.length, l:'教学班级',   c:'var(--accent)'},
    {n:totalStudents,    l:'在册学生',   c:'var(--ok)'},
    {n:pending,          l:'待录成绩项', c:'var(--warn)'}
  ];
  return `
  <div class="hero">
    <div class="hero-left">
      <h1>${greet()},${esc(auth.name()||(isStudent?'同学':'老师'))} 👋</h1>
      <div class="hero-meta">
        <span class="hero-chip">${role.icon} ${esc(role.label)}</span>
        <span class="hero-chip term-chip" title="点击下拉切换当前学期">
          🗓 当前学期
          <select class="hero-select" onchange="viewHome.setTerm(this.value)" aria-label="当前学期">
            ${store.termList().map(t=>`<option value="${esc(t)}" ${t===term?'selected':''} title="${esc(fmtTerm(t))}">${esc(t)}</option>`).join('')}
          </select>
          <button class="hero-mini" onclick="viewHome.addTerm()" title="新增自定义学期">＋</button>
        </span>
        <a class="hero-link" href="#/help">📘 ${esc(role.label)}使用说明</a>
      </div>
    </div>
    <div class="hero-acts">
      ${auth.canSee('chaoxing')?'<a class="hero-btn" href="#/chaoxing">🔁 超星互动</a>':''}
      ${canCls?'<a class="hero-btn" href="#/classes">👥 我的班级</a>':''}
      ${auth.canSee('docs')?'<a class="hero-btn" href="#/docs">📄 教学文档</a>':''}
    </div>
  </div>

  <div class="card quick-wrap">
    <div class="row" style="justify-content:space-between;margin-bottom:10px">
      <h3 style="margin:0">⚡ 快捷入口</h3>
      <span class="mini">按当前角色的可见模块显示</span>
    </div>
    <div class="quick-grid">
      ${quick.map(n=>`<a class="quick-card" href="#/${n.id}" title="${esc(n.desc||'')}">
        <span class="qc-ic">${n.icon}</span>
        <span class="qc-t">${esc(n.label)}</span>
        <span class="qc-d">${esc(n.desc||'')}</span></a>`).join('')}
    </div>
  </div>

  <div class="grid cols4">
    ${stats.map(s=>`<div class="stat"><div class="num" style="color:${s.c}">${s.n}</div><div class="lbl">${esc(s.l)}</div></div>`).join('')}
  </div>

  <div class="card"><h3>${isStudent?'📚 课程资源':'📋 教学任务进度（按课程）'}</h3>
    ${mine.length? `<div class="grid cols2">${mine.map(c=>{
      const ts=courseTasks(c); const done=ts.filter(t=>t.ok).length; const pct=Math.round(done/ts.length*100);
      return `<div class="task-card">
        <div class="row"><a href="#/course/${c.id}" class="task-title">《${esc(c.name)}》</a>
          <span class="tag gray">S${c.semester||1}</span><span class="spacer"></span>
          <span class="tag ${pct===100?'green':pct>=50?'blue':'orange'}">${pct}%</span></div>
        <div class="progress"><i style="width:${pct}%"></i></div>
        <div class="chips">${ts.map(t=>t.ok
          ? `<span class="chip ok" title="${esc(t.label)}">✓ ${esc(t.label)}</span>`
          : `<a class="chip todo" href="${t.href}" title="${esc(t.hint)}">○ ${esc(t.label)}</a>`).join('')}</div>
        ${isStudent?'':`<div class="row" style="margin-top:8px">
          <button class="btn small" onclick="viewHome.genDoc('${c.id}','tpl-syllabus')" title="生成课程教学大纲(可在线编辑)">生成大纲</button>
          <button class="btn small" onclick="viewHome.genDoc('${c.id}','tpl-calendar')" title="生成教学日历(可在线编辑)">教学日历</button>
          <button class="btn small" onclick="viewHome.genLesson('${c.id}')" title="按章节生成教案(可在线编辑)">教案</button>
          <button class="btn small" style="display:${CAN('docs')}" onclick="location.hash='#/docs'" title="前往教学文档中心(在线编辑与版本)">📄 文档中心</button>
          <button class="btn small" style="display:${CAN('classes')}" onclick="viewHome.newClass('${c.id}')">＋ 开课班级</button>
        </div>`}
      </div>`;
    }).join('')}</div>` : '<div class="empty">暂无课程</div>'}
  </div>

  <div class="grid cols2">
    ${canCls? `<div class="card"><h3>👥 我的班级与成绩录入</h3>
      ${myClasses.length? `<div class="table-wrap"><table><thead><tr><th>班级</th><th>课程</th><th>人数</th><th>录入进度</th><th>平均分</th><th></th></tr></thead><tbody>
      ${myClasses.map(k=>{ const st=classStats(k); const c=store.course(k.courseId);
        return `<tr><td><b>${esc(k.name)}</b></td><td>${esc(c?c.name:'-')}</td><td>${k.students.length}</td>
        <td><div class="progress sm"><i style="width:${st.completeness}%"></i></div><span class="mini">${st.completeness}%</span></td>
        <td>${st.avg??'-'}</td><td><a class="btn small" href="#/class/${k.id}" style="text-decoration:none">录入</a></td></tr>`; }).join('')}
      </tbody></table></div>` : '<div class="empty">暂无班级,可在「教学班级」新建或批量导入</div>'}
    </div>`
    : `<div class="card"><h3>📖 我的课程</h3>
      ${mine.length? `<div class="chips">${mine.map(c=>`<a class="chip blue" href="#/course/${c.id}" style="text-decoration:none">${esc(c.name)}</a>`).join('')}</div>
      <p class="mini" style="margin-top:8px">点击课程可查看章节、知识点与知识图谱;也可在「全站检索」中按关键词定位。</p>`
      : '<div class="empty">暂无课程</div>'}
    </div>`}

    <div class="card"><h3>🔁 最近同步（与超星）</h3>
      ${logs.length? `<div class="table-wrap"><table><thead><tr><th>时间</th><th>方向</th><th>对象</th><th>说明</th></tr></thead><tbody>
      ${logs.map(l=>`<tr><td class="mini">${esc(l.time)}</td>
        <td><span class="tag ${l.direction==='export'?'blue':'purple'}">${l.direction==='export'?'导出':'导入'}</span></td>
        <td>${esc(l.type)}</td><td>${esc(l.desc)}</td></tr>`).join('')}
      </tbody></table></div>` : '<div class="empty">暂无同步记录</div>'}
      ${auth.canSee('chaoxing')?'<button class="btn small" style="margin-top:10px" onclick="location.hash=\'#/chaoxing\'">前往超星互动中心 →</button>':''}
    </div>
  </div>

  ${(canCls && myClasses.length)
    ? '<div class="card"><h3>📊 班级学情（平均分 / 及格率）</h3><div id="home-chart" style="height:300px"></div></div>'
    : '<div class="card"><h3>📚 课程知识点分布</h3><div id="home-kp" style="height:300px"></div></div>'}
  `;
}
function greet(){ const h=new Date().getHours(); return h<6?'夜深了':h<11?'早上好':h<14?'中午好':h<18?'下午好':'晚上好'; }
function mountHome(){
  const mine=coursesOfMine();
  const chartEl=document.getElementById('home-chart');
  if(chartEl){
    const ch=echarts.init(chartEl);
    const ks=myTeachingClasses().filter(k=>mine.some(c=>c.id===k.courseId));
    ch.setOption({tooltip:{trigger:'axis'},legend:{bottom:0},grid:{left:50,right:20,top:20},
      xAxis:{type:'category',data:ks.map(k=>k.name)},
      yAxis:[{type:'value',name:'分数',max:100},{type:'value',name:'%',max:100}],
      series:[
        {name:'平均分',type:'bar',data:ks.map(k=>classStats(k).avg),barWidth:22,itemStyle:{color:'#2563eb',borderRadius:[6,6,0,0]}},
        {name:'及格率',type:'line',yAxisIndex:1,data:ks.map(k=>classStats(k).pass),smooth:true,itemStyle:{color:'#059669'}}
      ]});
    window.addEventListener('resize',()=>ch.resize());
    return;
  }
  const kpEl=document.getElementById('home-kp');
  if(kpEl){
    const ch=echarts.init(kpEl);
    const cs=mine.filter(c=>c.chapters.length);
    ch.setOption({tooltip:{trigger:'axis'},grid:{left:50,right:20,top:20,bottom:60},
      xAxis:{type:'category',data:cs.map(c=>c.name),axisLabel:{rotate:30,fontSize:11}},
      yAxis:{type:'value',name:'知识点数',minInterval:1},
      series:[{type:'bar',name:'知识点',data:cs.map(c=>c.chapters.reduce((a,ch2)=>a+ch2.kps.length,0)),
        barWidth:26,itemStyle:{color:'#7c3aed',borderRadius:[6,6,0,0]}}]});
    window.addEventListener('resize',()=>ch.resize());
  }
}
/* 学期切换:写入设置、记日志、刷新页面 */
viewHome.setTerm=function(t){
  t=String(t||'').trim(); if(!t || t===store.db.settings.term) return;
  store.setTerm(t);
  toast('当前学期已切换为 '+fmtTerm(t));
  route();
};
viewHome.addTerm=function(){
  const cur=store.db.settings.term||'';
  openModal(`<h3>🗓 新增 / 自定义学期</h3>
    <p class="mini">格式:YYYY-YYYY-N(N=1 表示第 1 学期 / 2 表示第 2 学期),例如 2025-2026-1</p>
    <label>学期编码</label><input id="hm-term" value="${esc(cur)}" placeholder="2025-2026-1" autocomplete="off">
    <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
    <button class="btn primary" onclick="viewHome._saveTerm()">保存并切换</button></div>`);
};
viewHome._saveTerm=function(){
  const el=document.getElementById('hm-term');
  const s=el?String(el.value||'').trim():'';
  if(!/^\d{4}-\d{4}-[12]$/.test(s)){ toast('学期格式应为 YYYY-YYYY-1 或 YYYY-YYYY-2'); return; }
  closeModal();
  if(store.setTerm(s)) toast('当前学期已切换为 '+fmtTerm(s));
  else toast('已是该学期');
  route();
};

viewHome.genDoc=function(cid,tplId,chId){
  const doc=genDocument(cid,tplId,chId);
  if(!doc){ toast('生成失败:请检查模板'); return; }
  toast('已生成教学文档,可在线编辑');
  location.hash='#/doc/'+doc.id;
};
viewHome.genLesson=function(cid){
  const c=store.course(cid);
  if(!c || !c.chapters.length){ toast('该课程暂无章节,请先建立章节'); return; }
  openModal(`<h3>📝 生成教案 — 选择章节</h3>
    <label>章节</label><select id="les-ch">${c.chapters.map(ch=>`<option value="${ch.id}">${esc(ch.title)}</option>`).join('')}</select>
    <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
    <button class="btn primary" onclick="const v=document.getElementById('les-ch').value;closeModal();viewHome.genDoc('${cid}','tpl-lesson',v)">生成并编辑</button></div>`);
};
viewHome.newClass=function(cid){
  viewClasses.addModal(cid);
};

/* ================= 教学班级 ================= */
function viewClasses(params, query){
  query=query||{};
  const hasTerm=Object.prototype.hasOwnProperty.call(query,'term');
  /* 未指定 → 用"当前学期";指定为空串 → 全部学期(不再改写全局设置) */
  const termF = hasTerm ? String(query.term||'') : (store.db.settings.term||'');
  const terms = store.termList();
  const mine=coursesOfMine();
  const list=store.db.classes.filter(k=>mine.some(c=>c.id===k.courseId) && (!termF||k.term===termF));
  return `
  <div class="page-head"><div><h1>教学班级</h1><div class="sub">班级关联课程,承载学生名册、成绩与作业 — 教学过程的载体</div></div>
    <div class="row">
      <select style="width:auto" onchange="viewClasses.setTermFilter(this.value)" title="按学期筛选">
        <option value="" ${termF?'':'selected'}>全部学期</option>
        ${terms.map(t=>`<option value="${esc(t)}" ${t===termF?'selected':''}>${esc(t)}</option>`).join('')}</select>
      <button class="btn primary" style="display:${CAN('classes')}" onclick="viewClasses.addModal()">＋ 新建班级</button>
    </div></div>
  <div class="card" style="background:var(--primary-soft);border-color:#c7d2fe">
    <div class="row"><b style="font-size:12.5px">📋 批量开课:</b>
      ${tplBtn('classes','教学班级模板')}
      <span class="mini">用模板一次建立多个班级(自动带出平时/期中/期末权重),再导入学生名单与成绩</span>
      <span class="spacer"></span>
      <button class="btn small primary" style="display:${CAN('classes')}" onclick="ImportKit.open('classes',{})">📥 导入教学班级</button>
    </div></div>
  <div class="card">
    ${list.length? `<div class="table-wrap"><table><thead><tr><th>班级</th><th>课程</th><th>学期</th><th>任课教师</th><th>人数</th><th>成绩录入</th><th>平均分</th><th>操作</th></tr></thead><tbody>
    ${list.map(k=>{ const st=classStats(k); const c=store.course(k.courseId); const kw=W('classes',k);
      return `<tr>
        <td><a href="#/class/${k.id}" style="color:var(--primary);font-weight:600;text-decoration:none">${esc(k.name)}</a></td>
        <td>${esc(c?c.name:'-')}</td><td><span class="tag gray">${esc(k.term)}</span></td><td>${esc(k.teacher||'-')}</td>
        <td>${k.students.length}</td>
        <td><div class="progress sm"><i style="width:${st.completeness}%"></i></div><span class="mini">${st.completeness}%</span></td>
        <td>${st.avg??'-'}</td>
        <td class="row" style="flex-wrap:nowrap">
          <a class="btn small" href="#/class/${k.id}" style="text-decoration:none">打开</a>
          <button class="btn small" onclick="chaoxing.exportWithFormat('grades','${k.id}')">导出成绩</button>
          <button class="btn small danger" style="display:${kw?'':'none'}" onclick="viewClasses.del('${k.id}')">删除</button></td></tr>`; }).join('')}
    </tbody></table></div>`: '<div class="empty">暂无班级,点击"新建班级"把课程落地到班级</div>'}
  </div>`;
}
viewClasses.addModal=function(cid){
  const mine=coursesOfMine();
  openModal(`<h3>＋ 新建教学班级</h3>
    <label>班级名称</label><input id="k-name" placeholder="如:大数据2402班">
    <label>关联课程(班级为课程的教学载体)</label>
    <select id="k-course">${mine.map(c=>`<option value="${c.id}" ${cid===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
    <div class="grid cols2">
      <div><label>学期</label><input id="k-term" value="${esc(store.db.settings.term||'2025-2026-1')}"></div>
      <div><label>任课教师</label><input id="k-teacher" value="${esc(auth.name()||'')}"></div>
    </div>
    <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
    <button class="btn primary" onclick="viewClasses.doAdd()">创建</button></div>`);
};
viewClasses.doAdd=function(){
  const name=document.getElementById('k-name').value.trim(); if(!name){toast('请填写班级名称');return;}
  const k=store.addClass({name, courseId:document.getElementById('k-course').value,
    term:document.getElementById('k-term').value.trim(), teacher:document.getElementById('k-teacher').value.trim()});
  closeModal(); toast('班级已创建,可导入或录入学生名单'); location.hash='#/class/'+k.id;
};
viewClasses.del=function(id){
  const k=store.klass(id);
  if(!W('classes',k)){ toast('权限不足'); return; }
  if(confirm(`删除班级【${k.name}】及其学生与成绩数据?`)){ store.delClass(id); toast('班级已删除'); route(); }
};
/* 学期筛选走 URL 查询参数,避免误改全局"当前学期"设置 */
viewClasses.setTermFilter=function(t){
  location.hash = '#/classes?term='+(t?encodeURIComponent(t):'');
};

/* ------- 班级详情 ------- */
let classTab='students';
function viewClassDetail(id, tab){
  const k=store.klass(id);
  if(!k) return '<div class="card empty">班级不存在</div>';
  const c=store.course(k.courseId);
  tab=tab||classTab; classTab=tab;
  const st=classStats(k);
  const tabs=[['students','🎓 学生名册'],['grades','📊 成绩管理'],['homework','📝 作业'],['sync','🔁 导出与同步']];
  return `
  <div class="crumb"><a href="#/classes" style="color:var(--primary);text-decoration:none">教学班级</a> / ${esc(k.name)}</div>
  <div class="page-head"><div><h1>${esc(k.name)} <span class="tag blue">${esc(c?c.name:'-')}</span> <span class="tag gray">${esc(k.term)}</span></h1>
    <div class="sub">任课教师:${esc(k.teacher||'-')} · 学生 ${k.students.length} 人 · 成绩录入 ${st.completeness}% · 平均分 ${st.avg??'-'} · 及格率 ${st.pass}%</div></div>
    <div class="row"><button class="btn" onclick="location.hash='#/course/${k.courseId}'">查看课程</button>
    <button class="btn" onclick="chaoxing.exportWithFormat('grades','${k.id}')">⬇ 导出成绩(多格式)</button>
    ${impBtn('grades','导入成绩',{classId:k.id})}
    ${tplBtn('grades','成绩模板')}</div></div>
  <div class="tabs">${tabs.map(([a,b])=>`<button class="${tab===a?'active':''}" onclick="location.hash='#/class/${id}/${a}'">${b}</button>`).join('')}</div>
  <div id="class-tab"></div>`;
}
function mountClassDetail(id, tab){
  tab=tab||classTab; classTab=tab;
  const k=store.klass(id); if(!k) return;
  const box=document.getElementById('class-tab'); if(!box) return;
  if(tab==='students') box.innerHTML=renderStudents(k);
  else if(tab==='grades'){ box.innerHTML=renderGrades(k); drawGradeChart(k); }
  else if(tab==='homework') box.innerHTML=renderHomework(k);
  else if(tab==='sync') box.innerHTML=renderClassSync(k);
  R.typeset(box);
}
/* --- 学生名册 --- */
function renderStudents(k){
  const kw=(document.getElementById('stu-kw')?.value||'').trim();
  const list=k.students.filter(s=>!kw||s.name.includes(kw)||s.sno.includes(kw));
  const canW=W('classes',k);
  return `
  <div class="card"><div class="row">
    <input id="stu-kw" placeholder="🔍 搜索姓名/学号" style="width:180px" value="${esc(kw)}" oninput="clearTimeout(window._st);window._st=setTimeout(route,400)">
    <div class="spacer"></div>
    <span class="tag gray">共 ${k.students.length} 人</span>
    ${canW?`<button class="btn small" onclick="viewClass.studentModal('${k.id}')">＋ 添加学生</button>
    <button class="btn small" onclick="viewClass.batchModal('${k.id}')">📋 批量粘贴</button>
    ${impBtn('students','超星名单导入',{classId:k.id})}`:''}
    <button class="btn small" onclick="chaoxing.exportWithFormat('students','${k.id}')">📤 导出名单(多格式)</button>
    ${tplBtn('students','名单模板')}
  </div></div>
  <div class="card">
    ${list.length? `<div class="table-wrap"><table><thead><tr><th style="width:50px">序号</th><th>学号</th><th>姓名</th><th>性别</th><th>总评</th><th>备注</th>${canW?'<th style="width:120px">操作</th>':''}</tr></thead><tbody>
    ${list.map((s,i)=>`<tr><td>${i+1}</td><td>${esc(s.sno)}</td><td><b>${esc(s.name)}</b></td><td>${esc(s.gender||'')}</td>
      <td><b style="color:${(calcTotal(k,s)??0)>=60?'var(--ok)':'var(--danger)'}">${calcTotal(k,s)??'-'}</b></td>
      <td class="mini">${esc(s.note||'')}</td>
      ${canW?`<td><button class="btn small" onclick="viewClass.studentModal('${k.id}','${s.id}')">编辑</button>
      <button class="btn small danger" onclick="viewClass.delStudent('${k.id}','${s.id}')">删除</button></td>`:''}</tr>`).join('')}
    </tbody></table></div>` : '<div class="empty">暂无学生 — 可"超星名单导入"或批量粘贴</div>'}
  </div>`;
}
/* --- 成绩管理 --- */
function renderGrades(k){
  const canW=W('classes',k);
  const st=classStats(k);
  const itemRows=(k.items||[]).map(it=>`<tr><td>${esc(it.name)}</td>
    <td>${canW?`<input type="number" value="${it.weight}" style="width:70px" onchange="viewClass.setItem('${k.id}','${it.id}','weight',this.value)">`:`${it.weight}`}</td>
    <td>${canW?`<input type="number" value="${it.full}" style="width:70px" onchange="viewClass.setItem('${k.id}','${it.id}','full',this.value)">`:`${it.full}`}</td>
    <td>${canW?`<button class="btn small danger" onclick="viewClass.delItem('${k.id}','${it.id}')">删除</button>`:''}</td></tr>`).join('');
  return `
  <div class="grid cols4">
    <div class="stat"><div class="num">${st.count}</div><div class="lbl">学生数</div></div>
    <div class="stat"><div class="num" style="color:var(--primary)">${st.avg??'-'}</div><div class="lbl">平均分(权重总评)</div></div>
    <div class="stat"><div class="num" style="color:var(--ok)">${st.pass}%</div><div class="lbl">及格率</div></div>
    <div class="stat"><div class="num" style="color:var(--warn)">${st.completeness}%</div><div class="lbl">录入进度(${st.filled}/${st.total})</div></div>
  </div>
  <div class="card"><h3>⚖️ 成绩项与权重</h3>
    <div class="table-wrap"><table><thead><tr><th>成绩项</th><th>权重(%)</th><th>满分</th><th></th></tr></thead><tbody>${itemRows}</tbody></table></div>
    ${canW?`<div class="row" style="margin-top:10px">
      <input id="new-item" placeholder="新成绩项名称,如:实验成绩" style="width:200px">
      <input id="new-weight" type="number" placeholder="权重" style="width:90px">
      <button class="btn small primary" onclick="viewClass.addItem('${k.id}')">＋ 添加成绩项</button>
      <span class="mini">总评 = Σ(得分 ÷ 满分 × 权重),自动归一为百分制</span></div>`:''}
  </div>
  <div class="card"><h3>📝 成绩录入</h3>
    <div class="table-wrap"><table class="score-table"><thead><tr><th>学号</th><th>姓名</th>
      ${(k.items||[]).map(it=>`<th>${esc(it.name)}<div class="mini">满分${it.full}</div></th>`).join('')}
      <th>总评</th></tr></thead><tbody>
      ${k.students.map(s=>{ const tot=calcTotal(k,s);
        return `<tr><td class="mini">${esc(s.sno)}</td><td><b>${esc(s.name)}</b></td>
        ${(k.items||[]).map(it=>`<td>${canW
          ? `<input type="number" class="score-in" value="${s.scores[it.id]??''}" onchange="viewClass.setScore('${k.id}','${s.id}','${it.id}',this.value)">`
          : (s.scores[it.id]??'-')}</td>`).join('')}
        <td><b style="color:${(tot??0)>=60?'var(--ok)':'var(--danger)'}">${tot??'-'}</b></td></tr>`; }).join('')}
    </tbody></table></div>
    <!-- 手机端卡片式录入 -->
    <div class="score-cards">
      ${k.students.map(s=>`<div class="score-card"><div class="row"><b>${esc(s.name)}</b><span class="mini">${esc(s.sno)}</span><span class="spacer"></span>
        <b style="color:${(calcTotal(k,s)??0)>=60?'var(--ok)':'var(--danger)'}">${calcTotal(k,s)??'-'}</b></div>
        ${(k.items||[]).map(it=>`<label class="mini">${esc(it.name)}(满分${it.full})</label>
          <input type="number" inputmode="decimal" class="score-in" value="${s.scores[it.id]??''}" ${canW?'':'readonly'}
            onchange="viewClass.setScore('${k.id}','${s.id}','${it.id}',this.value)">`).join('')}
      </div>`).join('')}
    </div>
  </div>
  <div class="card"><h3>📈 总评分数段分布</h3><div id="grade-chart" style="height:280px"></div></div>`;
}
function drawGradeChart(k){
  const el=document.getElementById('grade-chart'); if(!el) return;
  const st=classStats(k); const dist=st.dist||{};
  const ch=echarts.init(el);
  ch.setOption({tooltip:{},grid:{left:60,right:20,top:20,bottom:30},
    xAxis:{type:'category',data:Object.keys(dist)},
    yAxis:{type:'value',minInterval:1},
    series:[{type:'bar',data:Object.values(dist),barWidth:36,
      itemStyle:{color:p=>['#059669','#2563eb','#7c3aed','#d97706','#dc2626'][p.dataIndex]||'#64748b',borderRadius:[8,8,0,0]},
      label:{show:true,position:'top'}}]});
  window.addEventListener('resize',()=>ch.resize());
}
/* --- 作业 --- */
function renderHomework(k){
  const canW=W('classes',k);
  return `<div class="card">
    <div class="row"><h3 style="margin:0">📝 作业记录(${k.assignments.length})</h3><div class="spacer"></div>
      ${canW?`<button class="btn small primary" onclick="viewClass.hwModal('${k.id}')">＋ 新增作业</button>`:''}
      <button class="btn small" onclick="chaoxing.exportWithFormat('assignments','${k.id}')">📤 导出作业成绩</button>
      ${canW?impBtn('assignments','导入作业成绩',{classId:k.id}):''}
      ${tplBtn('assignments','作业模板')}
    </div>
  </div>
  ${k.assignments.length? k.assignments.map(a=>`
    <div class="card"><div class="row"><h3 style="margin:0">${esc(a.title)}</h3>
      <span class="tag blue">满分 ${a.full}</span><span class="tag gray">截止 ${esc(a.due||'-')}</span>
      <div class="spacer"></div>
      <span class="mini">已录 ${Object.keys(a.scores||{}).length}/${k.students.length}</span>
      ${canW?`<button class="btn small danger" onclick="viewClass.delHw('${k.id}','${a.id}')">删除</button>`:''}</div>
      <div class="table-wrap" style="margin-top:8px"><table><thead><tr><th>学号</th><th>姓名</th><th style="width:130px">得分</th></tr></thead><tbody>
      ${k.students.map(s=>`<tr><td class="mini">${esc(s.sno)}</td><td>${esc(s.name)}</td>
        <td>${canW?`<input type="number" class="score-in" value="${a.scores[s.id]??''}" onchange="viewClass.setHw('${k.id}','${a.id}','${s.id}',this.value)">`:(a.scores[s.id]??'-')}</td></tr>`).join('')}
      </tbody></table></div></div>`).join('') : '<div class="card empty">暂无作业记录</div>'}`;
}
/* --- 班级同步与导出 --- */
function renderClassSync(k){
  const c=store.course(k.courseId);
  const logs=(store.db.logs||[]).filter(l=>l.desc.includes(k.name)).slice(0,12);
  return `<div class="grid cols2">
    <div class="card"><h3>📤 导出到超星(教师端)</h3>
      <div class="row" style="margin:6px 0"><span class="tag blue" style="min-width:100px;text-align:center">学生名单</span>
        <button class="btn small" onclick="chaoxing.exportWithFormat('students','${k.id}')">导出(CSV/Excel/JSON)</button>
        ${tplBtn('students','模板')}</div>
      <div class="row" style="margin:6px 0"><span class="tag blue" style="min-width:100px;text-align:center">成绩表</span>
        <button class="btn small" onclick="chaoxing.exportWithFormat('grades','${k.id}')">导出(含总评)</button>
        ${tplBtn('grades','模板')}</div>
      <div class="row" style="margin:6px 0"><span class="tag blue" style="min-width:100px;text-align:center">作业成绩</span>
        <button class="btn small" onclick="chaoxing.exportWithFormat('assignments','${k.id}')">导出(多格式)</button>
        ${tplBtn('assignments','模板')}</div>
      <div class="row" style="margin:6px 0"><span class="tag purple" style="min-width:100px;text-align:center">课程资源</span>
        <button class="btn small" onclick="chaoxing.allExport('${k.courseId}')">导出课程全套(知识点/图谱/题库/文档)</button></div>
    </div>
    <div class="card"><h3>📥 从超星导入</h3>
      <div class="row" style="margin:6px 0"><span class="tag orange" style="min-width:100px;text-align:center">学生名单</span>
        <button class="btn small primary" onclick="ImportKit.open('students',{classId:'${k.id}'})">选择文件导入</button>
        <span class="mini">支持 CSV / TSV / Excel / JSON;列:学号,姓名,性别,备注</span></div>
      <div class="row" style="margin:6px 0"><span class="tag orange" style="min-width:100px;text-align:center">成绩</span>
        <button class="btn small primary" onclick="ImportKit.open('grades',{classId:'${k.id}'})">选择文件导入</button>
        <span class="mini">支持 CSV / TSV / Excel / JSON;列:学号,姓名,分项…,总评</span></div>
      <div class="row" style="margin:6px 0"><span class="tag orange" style="min-width:100px;text-align:center">作业成绩</span>
        <button class="btn small primary" onclick="ImportKit.open('assignments',{classId:'${k.id}'})">选择文件导入</button>
        <span class="mini">支持 CSV / TSV / Excel / JSON;列:作业标题,学号,姓名,得分,满分,截止时间</span></div>
    </div>
  </div>
  <div class="card"><h3>🧾 本班同步记录</h3>
    ${logs.length? `<div class="table-wrap"><table><thead><tr><th>时间</th><th>方向</th><th>对象</th><th>说明</th><th>条数</th></tr></thead><tbody>
    ${logs.map(l=>`<tr><td class="mini">${esc(l.time)}</td><td><span class="tag ${l.direction==='export'?'blue':'purple'}">${l.direction==='export'?'导出':'导入'}</span></td>
      <td>${esc(l.type)}</td><td>${esc(l.desc)}</td><td>${l.count}</td></tr>`).join('')}</tbody></table></div>`
    : '<div class="empty">暂无记录</div>'}
  </div>`;
}
/* 班级操作 */
const viewClass = {
  setScore(cid, sid, iid, v){
    const k=store.klass(cid); const s=k.students.find(x=>x.id===sid);
    if(!W('classes',k)){ toast('权限不足'); route(); return; }
    if(v==='') delete s.scores[iid]; else s.scores[iid]=Math.max(0, Number(v)||0);
    store.save(); refreshRowTotals(k);
  },
  setHw(cid, aid, sid, v){
    const k=store.klass(cid); const a=k.assignments.find(x=>x.id===aid);
    if(!W('classes',k)){ toast('权限不足'); return; }
    if(v==='') delete a.scores[sid]; else a.scores[sid]=Math.max(0,Number(v)||0);
    store.save(); toast('已保存');
  },
  setItem(cid, iid, key, v){ const k=store.klass(cid); const it=k.items.find(x=>x.id===iid);
    if(!W('classes',k)){toast('权限不足');return;}
    it[key]=Math.max(0, Number(v)||0); store.save(); toast('已更新成绩项'); route(); },
  addItem(cid){
    const k=store.klass(cid);
    const name=document.getElementById('new-item').value.trim(); if(!name){toast('请填写名称');return;}
    store.addItem(cid,{name, weight:Number(document.getElementById('new-weight').value)||0});
    toast('成绩项已添加'); route();
  },
  delItem(cid,iid){ if(confirm('删除该成绩项及其分数?')){ store.delItem(cid,iid); toast('已删除'); route(); } },
  studentModal(cid, sid){
    const k=store.klass(cid); const s=sid? k.students.find(x=>x.id===sid):null;
    openModal(`<h3>🎓 ${s?'编辑学生':'添加学生'}</h3>
      <div class="grid cols2">
        <div><label>学号</label><input id="s-sno" value="${esc(s?s.sno:'')}"></div>
        <div><label>姓名</label><input id="s-name" value="${esc(s?s.name:'')}"></div>
      </div>
      <div class="grid cols2">
        <div><label>性别</label><select id="s-sex">${['','男','女'].map(x=>`<option ${s&&s.gender===x?'selected':''}>${x}</option>`).join('')}</select></div>
        <div><label>备注</label><input id="s-note" value="${esc(s?s.note||'':'')}"></div>
      </div>
      <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
      <button class="btn primary" onclick="viewClass.saveStudent('${cid}','${sid||''}')">保存</button></div>`);
  },
  saveStudent(cid, sid){
    const data={sno:document.getElementById('s-sno').value.trim(), name:document.getElementById('s-name').value.trim(),
      gender:document.getElementById('s-sex').value, note:document.getElementById('s-note').value.trim()};
    if(!data.name){toast('请填写姓名');return;}
    if(sid){ Object.assign(store.klass(cid).students.find(x=>x.id===sid), data); store.save(); }
    else{ const s=store.addStudent(cid, data); }
    closeModal(); toast('已保存'); route();
  },
  delStudent(cid,sid){ if(confirm('删除该学生及其成绩?')){ store.delStudent(cid,sid); toast('已删除'); route(); } },
  batchModal(cid){
    openModal(`<h3>📋 批量粘贴学生名单</h3>
      <p class="mini">每行一名学生,支持用 空格 / 逗号 / Tab 分隔:学号 姓名 性别</p>
      <textarea id="s-batch" style="min-height:180px" placeholder="2024010201 张小明 男&#10;2024010202 李小红 女"></textarea>
      <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
      <button class="btn primary" onclick="viewClass.doBatch('${cid}')">导入</button></div>`);
  },
  doBatch(cid){
    const k=store.klass(cid);
    const lines=document.getElementById('s-batch').value.split('\n').map(x=>x.trim()).filter(Boolean);
    let n=0;
    lines.forEach(line=>{
      const p=line.split(/[\s,，\t]+/).filter(Boolean);
      if(!p.length) return;
      const hasSno=/^\d{4,}$/.test(p[0]);
      const sno=hasSno? p[0]:''; const name=hasSno? (p[1]||''):p[0]; const sex=(hasSno?p[2]:p[1])||'';
      if(!name) return;
      if(k.students.some(s=>s.sno&&s.sno===sno)||k.students.some(s=>s.name===name)) return;
      k.students.push({id:uid('stu'),sno,name,gender:sex,scores:{}}); n++;
    });
    store.save(); store.log('import','学生名单',`${k.name} 批量粘贴 ${n} 人`,n);
    closeModal(); toast(`已导入 ${n} 名学生`); route();
  },
  hwModal(cid){
    openModal(`<h3>＋ 新增作业</h3>
      <label>作业标题</label><input id="hw-title" placeholder="如:实验三 文件与异常处理">
      <div class="grid cols2"><div><label>满分</label><input id="hw-full" type="number" value="100"></div>
      <div><label>截止时间</label><input id="hw-due" placeholder="2025-12-01"></div></div>
      <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
      <button class="btn primary" onclick="viewClass.saveHw('${cid}')">创建</button></div>`);
  },
  saveHw(cid){
    const title=document.getElementById('hw-title').value.trim(); if(!title){toast('请填写标题');return;}
    store.addAssignment(cid,{title, full:Number(document.getElementById('hw-full').value)||100, due:document.getElementById('hw-due').value.trim()});
    closeModal(); toast('作业已创建'); route();
  },
  delHw(cid,aid){ if(confirm('删除该作业记录?')){ store.delAssignment(cid,aid); route(); } }
};
/* 录入时局部刷新总评单元格(避免整页重绘) */
function refreshRowTotals(k){
  const rows=document.querySelectorAll('.score-table tbody tr');
  rows.forEach((tr,i)=>{ const s=k.students[i]; if(!s) return;
    const cells=tr.querySelectorAll('td'); const last=cells[cells.length-1];
    const tot=calcTotal(k,s); last.innerHTML=`<b style="color:${(tot??0)>=60?'var(--ok)':'var(--danger)'}">${tot??'-'}</b>`;
  });
}

/* ================= 超星互动中心 ================= */
function viewChaoxing(){
  const mine=coursesOfMine();
  const logs=store.db.logs||[];
  return `
  <div class="page-head"><div><h1>🔁 超星互动中心</h1>
    <div class="sub">与超星(学习通)教师端双向互动 — 导入导出即备份;每次操作均写入同步日志</div></div></div>
  <div class="card" style="background:linear-gradient(135deg,#eff6ff,#f5f3ff);border-color:#c7d2fe">
    <div class="row"><b style="font-size:13px">当前工作课程:</b>
      <select id="cx-course" style="width:auto">${mine.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
      <button class="btn small primary" onclick="chaoxing.allExport(document.getElementById('cx-course').value)">📦 一键导出该课程全套资源</button>
      <span class="spacer"></span>
      <button class="btn small" onclick="exporters.fullBackup()">⬇ 全库备份(JSON)</button>
      <button class="btn small" style="display:${auth.role()==='admin'?'':'none'}" onclick="exporters.restore()">⬆ 恢复备份</button>
    </div>
    <p class="mini" style="margin-top:8px">导出方向:知识点目录 / 知识图谱 / 题库 / <b>教学文档包(优先打包教学文档中心中已在线编辑的文档)</b> / 班级名单 / 成绩 / 作业 —— 均可直接用于超星教师端的"导入"入口,同时构成教学信息的离线备份。</p>
  </div>

  <div class="card"><h3>🔄 双向互动一览 — 导出(多格式) / 导入(自动校验) / 模板(可直接下载)</h3>
    <div class="table-wrap"><table><thead><tr>
      <th style="width:122px">数据对象</th><th>超星(学习通)教师端对应入口</th>
      <th style="width:190px">导出</th><th style="width:200px">导入</th><th style="width:215px">模板与说明</th>
    </tr></thead><tbody>
    ${[
      ['学生名单','students','class','我的班级 → 班级管理 → 学生名单 → 导入/导出'],
      ['成绩表','grades','class','我的班级 → 成绩管理 → 导出成绩 / 导入成绩'],
      ['作业成绩','assignments','class','我的班级 → 作业 → 导出成绩 / 导入成绩'],
      ['知识点目录','kpCatalog','course','课程 → 目录 / 资料 → 批量建立'],
      ['题库','bank','course','题库 / 作业库 / 考试库 → 批量导入'],
      ['知识图谱','graph','course','课程图谱 / 知识图谱工具 → 导入'],
      ['教学文档包','documents','course','课程 → 文档 / 资料(大纲/教案/日历)'],
      ['课程包','coursePackage','json','(课程整体迁移与校际共享)'],
      ['专业包','majorPackage','json','教务 / 专业建设数据']
    ].map(([name,tpl,scope,cx])=>`<tr>
      <td><b>${name}</b></td>
      <td class="mini">${esc(cx)}</td>
      <td>${scope==='course'
        ? `<button class="btn small" onclick="chaoxing.exportWithFormat('${tpl}',document.getElementById('cx-course').value)">⬇ 导出</button>`
        : scope==='class'
        ? `<button class="btn small" onclick="chaoxing.exportKindPrompt('${tpl}')">⬇ 导出</button>`
        : `<button class="btn small" onclick="${tpl==='coursePackage'?'exporters.coursePackage(document.getElementById(\'cx-course\').value)':'viewMajors.exportAll()'}">⬇ 导出</button>`}</td>
      <td>${scope==='course'
        ? (tpl==='documents'
            ? `<button class="btn small primary" onclick="viewDoc.importMd()">📥 导入 Markdown</button>`
            : `<button class="btn small primary" onclick="ImportKit.open('${tpl}',{courseId:document.getElementById('cx-course').value})">📥 导入</button>`)
        : scope==='class'
        ? `<button class="btn small primary" onclick="chaoxing.importKindPrompt('${tpl}','${tpl==='students'?'学生名单':tpl==='grades'?'成绩表':'作业成绩'}')">📥 导入</button>`
        : `<button class="btn small primary" onclick="${tpl==='coursePackage'?'ImportKit.open(\'coursePackage\',{})':'ImportKit.open(\'majorPackage\',{})'}">📥 导入</button>`}</td>
      <td>${tplBtn(tpl)}</td></tr>`).join('')}
    </tbody></table></div>
    <p class="mini" style="margin-top:8px">💡 所有导出文件的列名与「数据模板中心」的模板<b>完全一致</b>,因此<b>导出的文件可直接原样再导入</b>;
      Excel 导出还附带「字段说明」工作表。导入支持 <b>CSV / TSV / Excel(.xlsx) / JSON</b>,并会先校验、预览、逐行报错。</p>
  </div>

  <div class="card"><h3>📐 超星格式规范对照(点击「模板」可下载可直接使用的模板与字段说明)</h3>
    <div class="table-wrap"><table><thead><tr><th style="width:120px">数据对象</th><th>字段/列</th><th>说明</th><th style="width:200px">模板</th></tr></thead><tbody>
    ${Object.entries(CX_FORMATS).map(([k,v])=>{const tpl={学生名单:'students',成绩:'grades',知识点目录:'kpCatalog',知识图谱:'graph',题库:'bank',作业:'assignments'}[k];
      return `<tr><td><b>${k}</b></td>
      <td>${(Array.isArray(v.head)?v.head:[v.head]).map(h=>`<code>${esc(h)}</code>`).join(' ')}</td>
      <td class="mini">${esc(v.note)}</td>
      <td>${tpl?tplBtn(tpl):'<span class="mini">—</span>'}</td></tr>`;}).join('')}
    </tbody></table></div>
  </div>

  <div class="card"><h3>🧾 同步日志(${logs.length})<button class="btn small danger" style="float:right" onclick="if(confirm('清空同步日志?')){store.clearLogs();toast('已清空');route();}">清空</button></h3>
    ${logs.length? `<div class="table-wrap"><table><thead><tr><th style="width:160px">时间</th><th style="width:70px">方向</th><th>对象</th><th>说明</th><th style="width:70px">条数</th><th style="width:90px">操作人</th></tr></thead><tbody>
    ${logs.slice(0,60).map(l=>`<tr><td class="mini">${esc(l.time)}</td>
      <td><span class="tag ${l.direction==='export'?'blue':'purple'}">${l.direction==='export'?'导出':'导入'}</span></td>
      <td>${esc(l.type)}</td><td>${esc(l.desc)}</td><td>${l.count}</td><td class="mini">${esc(l.user||'')}</td></tr>`).join('')}
    </tbody></table></div>` : '<div class="empty">暂无同步记录</div>'}
  </div>`;
}
/* 需要选班级的导出/导入 → 弹窗选择 */
function pickClassModal(title, cb){
  const ks=store.db.classes.filter(k=>W('classes',k)||auth.role()==='admin'||coursesOfMine().some(c=>c.id===k.courseId));
  if(!ks.length){ toast('暂无班级,请先创建教学班级'); return; }
  openModal(`<h3>${title}</h3>
    <label>选择教学班级</label>
    <select id="pick-cls">${ks.map(k=>`<option value="${k.id}">${esc(k.name)} · ${esc((store.course(k.courseId)||{}).name||'')}</option>`).join('')}</select>
    <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
    <button class="btn primary" onclick="window._pickCb(document.getElementById('pick-cls').value);closeModal()">确定</button></div>`);
  window._pickCb=cb;
}
/* 班级维度的导出 / 导入(多格式 + 校验预览) */
chaoxing.exportKindPrompt=function(kind){
  const nm={students:'学生名单',grades:'成绩表',assignments:'作业成绩'}[kind]||kind;
  pickClassModal(`📤 导出${nm} — 选择班级`, id=>chaoxing.exportWithFormat(kind,id));
};
chaoxing.importKindPrompt=function(kind, nm){
  pickClassModal(`📥 导入${nm||kind} — 选择目标班级`, id=>ImportKit.open(kind,{classId:id}));
};
chaoxing.exportStudentsPrompt=function(){ chaoxing.exportKindPrompt('students'); };
chaoxing.importStudentsPrompt=function(){ chaoxing.importKindPrompt('students','学生名单'); };
chaoxing.exportGradesPrompt=function(){ chaoxing.exportKindPrompt('grades'); };
chaoxing.importGradesPrompt=function(){ chaoxing.importKindPrompt('grades','成绩表'); };
chaoxing.exportAssignmentsPrompt=function(){ chaoxing.exportKindPrompt('assignments'); };
chaoxing.importAssignmentsPrompt=function(){ chaoxing.importKindPrompt('assignments','作业成绩'); };
chaoxing.exportBankPrompt=function(){
  chaoxing.exportWithFormat('bank', document.getElementById('cx-course').value);
};
