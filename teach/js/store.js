/* 数据持久化层 v4:localStorage + 课程群 + 教学班级/成绩 + 超星日志 + 教学文档 */
const STORE_KEY = 'dlufe-kb-v4';
const OLD_KEY = 'dlufe-kb-v3';
const OLD_KEY1 = 'dlufe-kb-v2';
const OLD_KEY2 = 'dlufe-kb-v1';

/* ---------- 教学文档类型(可扩展) ---------- */
const DOC_TYPES = {
  syllabus: {label:'课程大纲', icon:'📘', tplType:'course'},
  calendar: {label:'教学日历', icon:'🗓️', tplType:'course'},
  lesson:   {label:'教案',     icon:'📝', tplType:'chapter'},
  handout:  {label:'讲义',     icon:'📖', tplType:'chapter'},
  exam:     {label:'试卷分析', icon:'📄', tplType:'course'},
  other:    {label:'其他文档', icon:'📃', tplType:'course'}
};
const DOC_TYPE_OF_TPL = {syllabus:'syllabus', calendar:'calendar', lesson:'lesson', handout:'handout', exercise:'other'};

/* ---------- 五类角色与权限矩阵 ---------- */
const ROLES = {
  admin:        {label:'管理员',        icon:'🛡️',  role:'全局管理与数据维护'},
  major_leader: {label:'专业负责人',    icon:'🏛️', role:'专业课程体系与修读计划'},
  group_leader: {label:'课程群负责人',  icon:'🗂️', role:'群内课程衔接与群图谱'},
  course_leader:{label:'课程负责人',    icon:'👩‍🏫', role:'本人课程的教学全流程'},
  student:      {label:'学生',          icon:'🎓',  role:'学习资源只读浏览'}
};
/* 模块权限:'w'=写(含读) 'r'=只读 '-'=不可见 */
const PERM = {
  dashboard: {admin:'w', major_leader:'r', group_leader:'r', course_leader:'r', student:'r'},
  majors:    {admin:'w', major_leader:'w', group_leader:'r', course_leader:'r', student:'r'},
  group:     {admin:'w', major_leader:'w', group_leader:'w', course_leader:'r', student:'r'},
  courses:   {admin:'w', major_leader:'w', group_leader:'r', course_leader:'w', student:'r'},
  classes:   {admin:'w', major_leader:'w', group_leader:'w', course_leader:'w', student:'-'},
  graph:     {admin:'w', major_leader:'r', group_leader:'r', course_leader:'r', student:'r'},
  bank:      {admin:'w', major_leader:'w', group_leader:'r', course_leader:'w', student:'r'},
  papers:    {admin:'w', major_leader:'w', group_leader:'r', course_leader:'w', student:'r'},
  chaoxing:  {admin:'w', major_leader:'w', group_leader:'w', course_leader:'w', student:'-'},
  docs:      {admin:'w', major_leader:'w', group_leader:'w', course_leader:'w', student:'r'},
  docspace:  {admin:'r', major_leader:'r', group_leader:'r', course_leader:'r', student:'r'},
  search:    {admin:'r', major_leader:'r', group_leader:'r', course_leader:'r', student:'r'},
  templates: {admin:'w', major_leader:'r', group_leader:'r', course_leader:'r', student:'-'},
  datatpl:   {admin:'w', major_leader:'r', group_leader:'r', course_leader:'r', student:'-'},
  help:      {admin:'r', major_leader:'r', group_leader:'r', course_leader:'r', student:'r'},
  data:      {admin:'w', major_leader:'r', group_leader:'r', course_leader:'r', student:'-'}
};
const auth = {
  user(){ return store.db.settings || {role:'admin', userName:''}; },
  role(){ return this.user().role || 'admin'; },
  name(){ return this.user().userName || ''; },
  can(module){ return (PERM[module]||{})[this.role()] || '-'; },
  canSee(module){ return this.can(module) !== '-'; },
  canExport(){ return this.role() !== 'student'; },
  /* 知识点/章节维护权限:课程群负责人可维护本群课程,课程负责人维护本人课程 */
  canEditKps(course){
    const r=this.role(), me=this.name();
    if(r==='admin' || r==='major_leader') return true;
    if(r==='course_leader') return !course.leader || !me || course.leader===me;
    if(r==='group_leader') return store.groupsOfCourse(course.id).some(g=>!g.leader || !me || g.leader===me);
    return false;
  },
  /* 数据范围校验:item 为相关对象 */
  canW(module, item){
    if(this.can(module)!=='w') return false;
    const r=this.role(), me=this.name();
    if(r==='admin') return true;
    if(module==='majors') return !item || !item.leader || !me || item.leader===me;
    if(module==='group'){
      if(!item) return true;
      if(r==='group_leader') return !item.leader || !me || item.leader===me;
      if(r==='major_leader'){ const m=store.major(item.majorId); return !m || !m.leader || !me || m.leader===me; }
      return true;
    }
    if(module==='courses' || module==='bank' || module==='papers' || module==='classes' || module==='chaoxing' || module==='docs'){
      if(!item) return true;
      const c = store.course(item.courseId || item.id);
      if(r==='course_leader') return !c || !c.leader || !me || c.leader===me;
      if(r==='group_leader' && (module==='classes' || module==='docs')){
        return !c || store.groupsOfCourse(c.id).some(g=>!g.leader || !me || g.leader===me);
      }
      return true; // major_leader 全部可写
    }
    return true;
  }
};

/* ---------- v2 → v3 迁移:新增教学班级 / 同步日志 / 学期设置 ---------- */
function migrateV2(old){
  const db = JSON.parse(JSON.stringify(old));
  db.classes = db.classes || [];
  db.logs = db.logs || [];
  db.settings = Object.assign({role:'admin', userName:'系统管理员', term:'2025-2026-1'}, db.settings||{});
  delete db.aiExports;
  return db;
}

/* ---------- v3 → v4 迁移:新增教学文档实体 ---------- */
function migrateV3(old){
  const db = migrateV2(old);
  db.documents = db.documents || [];
  db.settings.docAutoVersion = db.settings.docAutoVersion !== false;
  return db;
}

/* ---------- v1 → v2 迁移 ---------- */function migrateV1(old){
  const db = JSON.parse(JSON.stringify(old));
  db.groups = [];
  db.majors.forEach(m=>{
    const ids = new Set();
    if(m.groups){
      m.groups.forEach(g=>{
        db.groups.push({id:g.id, majorId:m.id, name:g.name, desc:g.desc||'', leader:'', courseIds:g.courseIds||[]});
        g.courseIds.forEach(c=>ids.add(c));
      });
      delete m.groups;
    }
    m.leader = m.leader||'';
    m.courses = [...ids].map(cid=>({courseId:cid, semester:(db.courses.find(c=>c.id===cid)||{}).semester||1}));
  });
  db.courses.forEach(c=>{ c.semester=c.semester||1; c.leader=c.leader||''; });
  db.settings = Object.assign({role:'admin', userName:'系统管理员'}, db.settings||{});
  return db;
}

/* 学期展示格式化:2025-2026-1 → 2025-2026 学年 · 第一学期 */
function fmtTerm(t){
  const m=/^(\d{4})-(\d{4})-([12])$/.exec(String(t||'').trim());
  if(!m) return String(t||'');
  return `${m[1]}-${m[2]} 学年 · 第${m[3]==='1'?'一':'二'}学期`;
}

const store = {
  db: null,
  load(){
    try{
      const raw = localStorage.getItem(STORE_KEY);
      if(raw){ this.db = JSON.parse(raw); }
      else if(localStorage.getItem(OLD_KEY)){ this.db = migrateV3(JSON.parse(localStorage.getItem(OLD_KEY))); }
      else if(localStorage.getItem(OLD_KEY1)){ this.db = migrateV3(migrateV2(JSON.parse(localStorage.getItem(OLD_KEY1)))); }
      else if(localStorage.getItem(OLD_KEY2)){ this.db = migrateV3(migrateV2(migrateV1(JSON.parse(localStorage.getItem(OLD_KEY2))))); }
      else{ this.db = JSON.parse(JSON.stringify(SEED)); }
    }catch(e){ this.db = JSON.parse(JSON.stringify(SEED)); }
    if(!this.db.settings) this.db.settings={role:'admin', userName:'系统管理员', term:'2025-2026-1'};
    if(!this.db.settings.term) this.db.settings.term='2025-2026-1';
    if(this.db.settings.docAutoVersion===undefined) this.db.settings.docAutoVersion=true;
    if(!this.db.groups) this.db.groups=[];
    if(!this.db.classes) this.db.classes=[];
    if(!this.db.logs) this.db.logs=[];
    if(!this.db.documents) this.db.documents=[];
    this.save();
    return this.db;
  },
  save(){ localStorage.setItem(STORE_KEY, JSON.stringify(this.db)); },
  reset(){ [STORE_KEY,OLD_KEY,OLD_KEY1,OLD_KEY2].forEach(k=>localStorage.removeItem(k)); this.load(); },

  /* ---- 基础查找 ---- */
  major(id){ return this.db.majors.find(m=>m.id===id); },
  course(id){ return this.db.courses.find(c=>c.id===id); },
  group(id){ return this.db.groups.find(g=>g.id===id); },
  groupsOfMajor(mid){ return this.db.groups.filter(g=>g.majorId===mid); },
  groupsOfCourse(cid){ return this.db.groups.filter(g=>g.courseIds.includes(cid)); },
  majorOfCourse(cid){ return this.db.majors.filter(m=>m.courses.some(x=>x.courseId===cid)); },
  semesterOf(mid, cid){ const m=this.major(mid); const x=m&&m.courses.find(x=>x.courseId===cid); return x?x.semester:(this.course(cid)||{}).semester||1; },
  chapter(cid, chId){ const c=this.course(cid); return c && c.chapters.find(x=>x.id===chId); },
  kp(cid, chId, kpId){ const ch=this.chapter(cid,chId); return ch && ch.kps.find(k=>k.id===kpId); },
  findKpGlobal(kpId){
    for(const c of this.db.courses) for(const ch of c.chapters){ const kp=ch.kps.find(k=>k.id===kpId); if(kp) return {course:c, chapter:ch, kp}; }
    return null;
  },
  questions(cid){ return this.db.bank.filter(q=>!cid||q.courseId===cid); },
  paper(id){ return this.db.papers.find(p=>p.id===id); },
  planSorted(mid){ const m=this.major(mid); return [...(m?m.courses:[])].sort((a,b)=>a.semester-b.semester); },

  /* ---- 专业 ---- */
  addMajor(data){ const m={id:uid('mj'),code:'',name:'新专业',desc:'',leader:'',courses:[],...data}; this.db.majors.push(m); this.save(); return m; },
  delMajor(id){
    this.db.majors = this.db.majors.filter(m=>m.id!==id);
    this.db.groups = this.db.groups.filter(g=>g.majorId!==id); // 其课程群一并移除(课程实体保留)
    this.save();
  },
  setMajorCourses(mid, list){ const m=this.major(mid); m.courses=list; this.save(); },

  /* ---- 课程群(独立实体) ---- */
  addGroup(data){ const g={id:uid('g'),majorId:'',name:'',desc:'',leader:'',courseIds:[],...data}; this.db.groups.push(g); this.save(); return g; },
  delGroup(gid){ this.db.groups=this.db.groups.filter(g=>g.id!==gid); this.save(); },
  groupToggleCourse(gid, cid){
    const g=this.group(gid);
    g.courseIds = g.courseIds.includes(cid)? g.courseIds.filter(x=>x!==cid) : [...g.courseIds, cid];
    this.save();
  },

  /* ---- 课程 ---- */
  addCourse(data){ const c={id:uid('c'),code:'',name:'新课程',credit:3,hours:48,semester:1,leader:'',category:'',desc:'',objectives:[],chapters:[],...data}; this.db.courses.push(c); this.save(); return c; },
  delCourse(id){
    this.db.courses = this.db.courses.filter(c=>c.id!==id);
    this.db.majors.forEach(m=>m.courses=m.courses.filter(x=>x.courseId!==id));
    this.db.groups.forEach(g=>g.courseIds=g.courseIds.filter(x=>x!==id));
    this.db.bank = this.db.bank.filter(q=>q.courseId!==id);
    this.db.papers = this.db.papers.filter(p=>p.courseId!==id);
    this.save();
  },

  /* ---- 章节 / 知识点 ---- */
  addChapter(cid, data){ const c=this.course(cid); const ch={id:uid('ch'),title:'新章节',hours:4,kps:[],...data}; c.chapters.push(ch); this.save(); return ch; },
  delChapter(cid, chId){ const c=this.course(cid); c.chapters=c.chapters.filter(ch=>ch.id!==chId); this.save(); },
  addKp(cid, chId, data){ const ch=this.chapter(cid,chId); const kp={id:uid('kp'),title:'新知识点',content:'',links:[],...data}; ch.kps.push(kp); this.save(); return kp; },
  delKp(cid, chId, kpId){
    const ch=this.chapter(cid,chId); ch.kps=ch.kps.filter(k=>k.id!==kpId);
    this.db.courses.forEach(c=>c.chapters.forEach(x=>x.kps.forEach(k=>k.links=(k.links||[]).filter(l=>l!==kpId))));
    this.save();
  },

  /* ---- 题库 / 卷库 ---- */
  addQuestion(data){ const q={id:uid('q'),courseId:'',type:'single',difficulty:'中',chapter:'',kpId:'',stem:'',options:[],answer:'',analysis:'',...data}; this.db.bank.push(q); this.save(); return q; },
  delQuestion(id){ this.db.bank=this.db.bank.filter(q=>q.id!==id);
    this.db.papers.forEach(p=>p.sections.forEach(s=>s.questionIds=s.questionIds.filter(x=>x!==id))); this.save(); },
  addPaper(data){ const p={id:'p_'+uid('p'),name:'新试卷',courseId:'',sections:[],...data}; this.db.papers.push(p); this.save(); return p; },
  delPaper(id){ this.db.papers=this.db.papers.filter(p=>p.id!==id); this.save(); },

  /* ---- 教学班级 / 学生 / 成绩 / 作业 ---- */
  klass(id){ return this.db.classes.find(c=>c.id===id); },
  classesOfCourse(cid){ return this.db.classes.filter(c=>!cid||c.courseId===cid); },
  classesOfTeacher(name){ return this.db.classes.filter(c=>!name||c.teacher===name); },
  addClass(data){ const k={id:uid('cls'),name:'新班级',courseId:(this.db.courses[0]||{}).id,term:this.db.settings.term||'2025-2026-1',
    teacher:this.db.settings.userName||'',items:[
      {id:uid('gi'),name:'平时成绩',weight:30,full:100},
      {id:uid('gi'),name:'期中成绩',weight:20,full:100},
      {id:uid('gi'),name:'期末成绩',weight:50,full:100}],students:[],assignments:[],...data};
    this.db.classes.push(k); this.save(); return k; },
  delClass(id){ this.db.classes=this.db.classes.filter(c=>c.id!==id); this.save(); },
  addStudent(cid, data){ const k=this.klass(cid); const s={id:uid('stu'),sno:'',name:'',gender:'',scores:{},note:'',...data}; k.students.push(s); this.save(); return s; },
  delStudent(cid, sid){ const k=this.klass(cid); k.students=k.students.filter(s=>s.id!==sid);
    k.assignments.forEach(a=>{ delete a.scores[sid]; }); this.save(); },
  addItem(cid, data){ const k=this.klass(cid); const it={id:uid('gi'),name:'新成绩项',weight:0,full:100,...data}; k.items.push(it); this.save(); return it; },
  delItem(cid, iid){ const k=this.klass(cid); k.items=k.items.filter(i=>i.id!==iid);
    k.students.forEach(s=>{ delete s.scores[iid]; }); this.save(); },
  addAssignment(cid, data){ const k=this.klass(cid); const a={id:uid('as'),title:'新作业',full:100,due:'',scores:{},...data}; k.assignments.push(a); this.save(); return a; },
  delAssignment(cid, aid){ const k=this.klass(cid); k.assignments=k.assignments.filter(a=>a.id!==aid); this.save(); },

  /* ---- 超星同步日志(备份可追溯) ---- */
  log(direction, type, desc, count){
    this.db.logs = this.db.logs||[];
    this.db.logs.unshift({id:uid('lg'), time:new Date().toLocaleString('zh-CN'), direction, type, desc, count:count||0, user:this.db.settings.userName||''});
    if(this.db.logs.length>300) this.db.logs.length=300;
    this.save();
  },
  clearLogs(){ this.db.logs=[]; this.save(); },

  /* ---- 系统设置(当前学期) ---- */
  setTerm(t){
    t=String(t||'').trim(); if(!t) return false;
    const old=this.db.settings.term||'';
    if(old===t) return false;
    this.db.settings.term=t;
    this.log('setting','学期设置',`当前学期:${old||'—'} → ${t}`);
    this.save();
    return true;
  },
  /* 可选学期列表:标准学年区间 + 已有班级学期 + 当前学期,按时间倒序 */
  termList(){
    const set=new Set();
    const y=new Date().getFullYear();
    for(let i=-2;i<=2;i++){ const a=y+i; set.add(`${a}-${a+1}-1`); set.add(`${a}-${a+1}-2`); }
    (this.db.classes||[]).forEach(k=>k.term && set.add(String(k.term)));
    if(this.db.settings && this.db.settings.term) set.add(this.db.settings.term);
    return [...set].filter(Boolean).sort().reverse();
  },

  /* ---- 教学文档(在线编写与编辑) ---- */
  documents(courseId){ return this.db.documents.filter(d=>!courseId||d.courseId===courseId); },
  documentsOfCourse(cid){ return this.db.documents.filter(d=>d.courseId===cid).sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||'')); },
  document(id){ return this.db.documents.find(d=>d.id===id); },
  addDocument(data){
    const now=new Date().toLocaleString('zh-CN');
    const d={id:uid('doc'), courseId:(this.db.courses[0]||{}).id, chapterId:'', type:'other',
      title:'新建文档', content:'', sourceTpl:'', createdAt:now, updatedAt:now, versions:[], ...data};
    this.db.documents.push(d); this.save(); return d;
  },
  saveDocument(id, patch){
    const d=this.document(id); if(!d) return;
    if(patch.content!==undefined && patch.content!==d.content){
      if(this.db.settings.docAutoVersion!==false){
        d.versions=d.versions||[];
        d.versions.unshift({at:d.updatedAt, content:d.content});
        if(d.versions.length>20) d.versions.length=20;
      }
    }
    Object.assign(d, patch, {updatedAt:new Date().toLocaleString('zh-CN')});
    this.save(); return d;
  },
  restoreVersion(id, idx){
    const d=this.document(id); const v=(d.versions||[])[idx]; if(!v) return;
    d.versions.unshift({at:d.updatedAt, content:d.content});
    d.content=v.content; d.updatedAt=new Date().toLocaleString('zh-CN'); this.save();
  },
  delDocument(id){ this.db.documents=this.db.documents.filter(d=>d.id!==id); this.save(); },
  dupDocument(id){
    const d=this.document(id); if(!d) return null;
    const now=new Date().toLocaleString('zh-CN');
    const copy=JSON.parse(JSON.stringify(d));
    copy.id=uid('doc'); copy.title=d.title+' (副本)'; copy.createdAt=now; copy.updatedAt=now; copy.versions=[];
    this.db.documents.push(copy); this.save(); return copy;
  },

  /* ---- 模板增强 ---- */
  addTemplate(data){ const t={id:uid('tpl'),name:'新模板',type:'course',content:'',...data}; this.db.templates.push(t); this.save(); return t; },
  delTemplate(id){ this.db.templates=this.db.templates.filter(t=>t.id!==id); this.save(); },
  dupTemplate(id){
    const t=this.db.templates.find(x=>x.id===id); if(!t) return null;
    const copy={...JSON.parse(JSON.stringify(t)), id:uid('tpl'), name:t.name+' (副本)'};
    this.db.templates.push(copy); this.save(); return copy;
  },

  /* ---- 通用排序 / 复制辅助 ---- */
  move(arr, idx, dir){
    const j=idx+dir; if(j<0||j>=arr.length) return false;
    [arr[idx],arr[j]]=[arr[j],arr[idx]]; this.save(); return true;
  },
  moveChapter(cid, chId, dir){ const c=this.course(cid); const i=c.chapters.findIndex(x=>x.id===chId); if(i<0) return false; return this.move(c.chapters,i,dir); },
  moveKp(cid, chId, kpId, dir){ const ch=this.chapter(cid,chId); const i=ch.kps.findIndex(x=>x.id===kpId); if(i<0) return false; return this.move(ch.kps,i,dir); },
  moveItem(cid, iid, dir){ const k=this.klass(cid); const i=k.items.findIndex(x=>x.id===iid); if(i<0) return false; return this.move(k.items,i,dir); },
  dupChapter(cid, chId){
    const ch=this.chapter(cid,chId); if(!ch) return null;
    const idMap={};
    const copy=JSON.parse(JSON.stringify(ch));
    copy.id=uid('ch'); copy.title=ch.title+' (副本)';
    copy.kps.forEach(k=>{ const old=k.id; k.id=uid('kp'); idMap[old]=k.id; });
    copy.kps.forEach(k=>k.links=(k.links||[]).map(l=>idMap[l]).filter(Boolean)); // 仅保留副本内部关联
    const c=this.course(cid); c.chapters.push(copy); this.save(); return copy;
  }
};
