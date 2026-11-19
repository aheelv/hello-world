/* 测试体(v3):在源码同作用域执行 */
// 0. 加载
store.load();

// 1. 数据模型 v3
t('专业直接关联课程(含学期)', ()=>{ eq(store.major('mj_bigdata').courses.length,7); eq(store.semesterOf('mj_bigdata','c_ml'),6); });
t('课程群为独立实体且设负责人', ()=>{ eq(store.db.groups.length,4); eq(store.group('g_data').leader,'赵强'); });
t('课程共享:数据库被两专业挂接', ()=>{ eq(store.majorOfCourse('c_db').length,2); eq(store.semesterOf('mj_ecom','c_db'),4); });
t('教学班级与课程关联(新增维度)', ()=>{
  eq(store.db.classes.length,2);
  eq(store.classesOfCourse('c_python').length,1);
  eq(store.classesOfCourse('c_python')[0].name,'大数据2401班');
  eq(store.classesOfCourse('c_python')[0].students.length,6);
});
t('超星同步日志存在', ()=>{ if(!(store.db.logs||[]).length) throw new Error('日志为空'); });

// 2. 迁移
t('v1→v2 迁移', ()=>{
  const v1={majors:[{id:'m1',code:'1',name:'测试专业',desc:'',groups:[{id:'gg',name:'群A',desc:'',courseIds:['cc1']}]}],
    courses:[{id:'cc1',code:'C1',name:'课程一',credit:3,hours:48,chapters:[]}],bank:[],papers:[],templates:[]};
  const m=migrateV1(v1);
  eq(m.groups.length,1); eq(m.majors[0].courses.length,1); eq(m.majors[0].groups,undefined);
});
t('v2→v3 迁移(新增classes/logs/term)', ()=>{
  const v2={majors:[],courses:[],groups:[],bank:[],papers:[],templates:[],settings:{role:'admin',userName:'x'}};
  const m=migrateV2(v2);
  eq(Array.isArray(m.classes),true); eq(Array.isArray(m.logs),true); eq(m.settings.term,'2025-2026-1');
});

// 3. 成绩计算
t('权重总评计算正确', ()=>{
  const k=store.klass('cls_py2401'); const s=k.students.find(x=>x.id==='stu2'); // 95*30+88*20+93*50 = 28.5+17.6+46.5=92.6
  eq(calcTotal(k,s),92.6);
});
t('缺项按 0 计并给出录入进度', ()=>{
  const k=store.klass('cls_py2401');
  const blank={id:'tmp',sno:'x',name:'缺项生',scores:{}};
  eq(calcTotal(k,blank),0); eq(scoreFilled(k,blank),0);
});
t('班级统计(平均/及格率/录入进度/分数段)', ()=>{
  const st=classStats(store.klass('cls_py2401'));
  eq(st.count,6); if(st.avg===null) throw new Error('平均分为空');
  if(st.pass<0||st.pass>100) throw new Error('及格率异常');
  eq(st.completeness,100);
  eq(Object.values(st.dist).reduce((a,b)=>a+b,0),6);
});

// 4. CSV 工具
t('CSV 生成与解析往返', ()=>{
  const csv=toCSV([['学号','姓名'],['2024010101','张,明'],['2024010102','李"雪']]);
  const rows=parseCSV(csv);
  eq(rows.length,3); eq(rows[1][1],'张,明'); eq(rows[2][1],'李"雪');
});

// 5. 超星导入导出(以内存模拟文件读取)
t('超星成绩表回填(按学号匹配)', ()=>{
  const k={id:'k_tmp',name:'临时班',courseId:'c_python',term:'x',teacher:'t',
    items:[{id:'i1',name:'平时成绩',weight:100,full:100}],
    students:[{id:'s1',sno:'9001',name:'甲',scores:{}},{id:'s2',sno:'9002',name:'乙',scores:{}}],assignments:[]};
  store.db.classes.push(k);
  // 模拟导入逻辑(与 chaoxing.importGrades 内的核心一致)
  const rows=parseCSV('学号,姓名,平时成绩,总评\n9001,甲,88,88\n9002,乙,76,76');
  const head=rows[0]; const iSno=head.indexOf('学号');
  let it=k.items[0], n=0;
  rows.slice(1).forEach(r=>{ const s=k.students.find(x=>x.sno===String(r[iSno]).trim()); if(!s) return; s.scores[it.id]=Number(r[2]); n++; });
  eq(n,2); eq(k.students[0].scores.i1,88);
  store.delClass('k_tmp');
});
t('超星学生名单导入字段识别', ()=>{
  const rows=parseCSV('序号,学号,姓名,性别\n1,9101,丙,男');
  const head=rows[0].map(x=>x.trim());
  eq(head.findIndex(h=>/学号/.test(h)),1); eq(head.findIndex(h=>/姓名/.test(h)),2);
});

// 6. 权限(含新增模块)
t('管理员全权', ()=>{ auth.user=()=>({role:'admin',userName:'系统管理员'});
  eq(auth.canW('classes',store.klass('cls_py2401')),true); eq(auth.canSee('chaoxing'),true); });
t('课程负责人仅本人课程班级可写', ()=>{ auth.user=()=>({role:'course_leader',userName:'王伟'});
  eq(auth.canW('classes',store.klass('cls_py2401')),true);
  eq(auth.canW('classes',store.klass('cls_db2301')),false); });
t('课程群负责人:本群课程班级可写', ()=>{ auth.user=()=>({role:'group_leader',userName:'赵强'});
  eq(auth.canW('classes',store.klass('cls_py2401')),true);
  eq(auth.canW('courses',store.course('c_python')),false); });
t('学生不可见班级与超星模块', ()=>{ auth.user=()=>({role:'student',userName:'张同学'});
  eq(auth.canSee('classes'),false); eq(auth.canSee('chaoxing'),false); eq(auth.canExport(),false); });

// 7. 视图渲染(含新增视图)
function renderAll(as){
  auth.user=()=>as;
  const views={教师工作台:viewHome(),专业:viewMajors(),课程群:viewGroup(),课程库:viewCourses(),
    教学班级:viewClasses(),班级详情_名册:viewClassDetail('cls_py2401','students'),
    班级详情_成绩:viewClassDetail('cls_py2401','grades'),班级详情_作业:viewClassDetail('cls_py2401','homework'),
    班级详情_同步:viewClassDetail('cls_py2401','sync'),
    超星中心:viewChaoxing(),图谱:viewGraph(),题库:renderBankList(''),卷库:viewPapers(),模板:viewTemplates(),数据:viewData(),
    教学文档:viewDocs(),文档编辑器:viewDocEditor('doc_py_syllabus'),
    项目文档:viewDocSpace(''),全站检索:viewSearch(),
    课程详情:viewCourseDetail('c_python','kps')};
  for(const k in views){ if(typeof views[k]!=='string'||!views[k].length) throw new Error(k+' 渲染异常'); }
  return views;
}
t('管理员各视图渲染', ()=>{ renderAll({role:'admin',userName:'系统管理员'}); });
t('课程负责人各视图渲染', ()=>{ renderAll({role:'course_leader',userName:'王伟'}); });
t('课程群负责人各视图渲染', ()=>{ renderAll({role:'group_leader',userName:'赵强'}); });
t('学生各视图渲染', ()=>{ renderAll({role:'student',userName:'张同学'}); });
t('班级成绩页含统计数据与录入控件', ()=>{
  auth.user=()=>({role:'admin',userName:'系统管理员'});
  const shell=viewClassDetail('cls_py2401','grades');
  if(!shell.includes('成绩管理')) throw new Error('缺少成绩页签');
  const body=renderGrades(store.klass('cls_py2401'));
  if(!body.includes('平均分')||!body.includes('录入进度')) throw new Error('缺少统计区块');
  if(!body.includes('score-in')) throw new Error('缺少成绩输入框');
  if(!body.includes('score-cards')) throw new Error('缺少手机端卡片录入');
});
t('教师工作台含教学任务进度', ()=>{
  auth.user=()=>({role:'course_leader',userName:'王伟'});
  const h=viewHome();
  if(!h.includes('教学任务进度')) throw new Error('缺少任务进度');
  if(!h.includes('progress')) throw new Error('缺少进度条');
});
t('超星中心列出格式规范与同步日志', ()=>{
  const h=viewChaoxing();
  ['学生名单','成绩','知识点目录','知识图谱','作业','全库备份','同步日志'].forEach(k=>{ if(!h.includes(k)) throw new Error('缺少:'+k); });
});

// 8. 模板与图谱
t('大纲模板含学期/负责人', ()=>{
  auth.user=()=>({role:'admin',userName:'系统管理员'});
  const md=TemplateRegistry.render(store.db.templates.find(x=>x.id==='tpl-syllabus'), store.course('c_python'));
  if(!md.includes('第 2 学期')||!md.includes('王伟')) throw new Error('占位符未填充');
});
t('跨课程衔接识别', ()=>{ if(countCrossLinks(['c_python','c_stat','c_db','c_bigdata','c_ml'])<3) throw new Error('衔接边不足'); });
t('修读进程按学期升序', ()=>{
  const plan=store.planSorted('mj_bigdata').map(x=>x.semester);
  eq(JSON.stringify(plan),JSON.stringify([...plan].sort((a,b)=>a-b)));
});
t('持久化到 v4 键', ()=>{ if(!localStorage.getItem('dlufe-kb-v4')) throw new Error('v4 键不存在'); });

// 9. 路由逐页挂载(捕获运行时异常)
t('全部路由页面渲染+挂载无异常', ()=>{
  auth.user=()=>({role:'admin',userName:'系统管理员'});
  ['dashboard','majors','group','courses','docs','classes','graph','bank','papers','chaoxing','templates','search','docspace','data']
    .forEach(h=>{ location.hash='#/'+h; route(); });
  location.hash='#/doc/doc_py_syllabus'; route();
  location.hash='#/docspace/01'; route();
  location.hash='#/docspace/05'; route();
  location.hash='#/class/cls_py2401/students'; route();
  location.hash='#/class/cls_py2401/grades';  route();
  location.hash='#/class/cls_py2401/homework';route();
  location.hash='#/class/cls_py2401/sync';    route();
  location.hash='#/course/c_python/kps';      route();
  location.hash='#/course/c_python/graph';    route();
  location.hash='#/course/c_python/bank';     route();
  location.hash='#/course/c_python/export';   route();
});
t('无权限路由被拦截并跳回工作台', ()=>{
  auth.user=()=>({role:'student',userName:'张同学'});
  location.hash='#/classes'; route();
  eq(location.hash,'#/dashboard');
});

// ================= 第 4 批:教学文档中心 / 项目文档 / 检索 / 能力补齐 =====================

// 10. 数据迁移与文档实体
t('v3→v4 迁移新增 documents 与版本开关', ()=>{
  const v3={majors:[],courses:[],groups:[],classes:[],logs:[],bank:[],papers:[],templates:[],
    settings:{role:'admin',userName:'x',term:'2025-2026-1'}};
  const m=migrateV3(v3);
  eq(Array.isArray(m.documents),true); eq(m.settings.docAutoVersion,true);
});
t('文档种子数据存在且含来源模板', ()=>{
  eq(store.db.documents.length,3);
  if(!store.document('doc_py_syllabus').sourceTpl) throw new Error('缺少来源模板');
});
t('文档新增/保存(版本快照)/回滚/复制/删除', ()=>{
  auth.user=()=>({role:'admin',userName:'系统管理员'});
  const d=store.addDocument({courseId:'c_python',type:'other',title:'测试文档',content:'v1'});
  store.saveDocument(d.id,{content:'v2'});
  eq(store.document(d.id).versions.length,1);
  eq(store.document(d.id).versions[0].content,'v1');
  store.saveDocument(d.id,{content:'v3'});
  eq(store.document(d.id).versions.length,2);
  store.restoreVersion(d.id,0);
  eq(store.document(d.id).content,'v2');
  const c=store.dupDocument(d.id); if(!c||c.id===d.id) throw new Error('复制失败');
  eq(store.db.documents.filter(x=>x.id===d.id||x.id===c.id).length,2);
  store.delDocument(d.id); store.delDocument(c.id);
  eq(store.document(d.id),undefined);
});
t('由模板生成教学文档(落库可编辑)', ()=>{
  const doc=genDocument('c_python','tpl-syllabus');
  if(!doc||!doc.content.includes('Python程序设计')) throw new Error('生成内容异常');
  eq(doc.type,'syllabus');
  store.delDocument(doc.id);
});
t('docHtml 导出含标题与公式渲染脚本', ()=>{
  const html=docHtml(store.document('doc_py_syllabus'));
  if(!html.includes('教学大纲')) throw new Error('缺少标题');
  if(!html.includes('renderMathInElement')) throw new Error('缺少公式渲染');
});
t('文档转模板(课程名/章节名反填占位符)', ()=>{
  const r=docToTemplateContent(store.document('doc_py_lesson2'));
  if(!r.content.includes('{{course.name}}')) throw new Error('课程名未替换');
  if(!r.content.includes('{{chapter.title}}')) throw new Error('章节名未替换');
  eq(r.type,'chapter');
});
t('教学文档权限:学生只读 / 课程负责人可写', ()=>{
  auth.user=()=>({role:'student',userName:'张同学'});
  eq(auth.can('docs'),'r'); eq(W('docs',store.document('doc_py_syllabus')),false);
  auth.user=()=>({role:'course_leader',userName:'王伟'});
  eq(W('docs',store.document('doc_py_syllabus')),true);
  eq(auth.canSee('docspace'),true); eq(auth.canSee('search'),true);
});

// 11. 项目文档网页化
t('项目文档数据齐全(含 UML mermaid)', ()=>{
  eq(PROJECT_DOCS.length>=5,true);
  const s=PROJECT_DOCS.find(d=>d.id==='02');
  if(!s||!s.md.includes('mermaid')) throw new Error('系统设计缺 UML 图');
});
t('项目文档视图含目录容器与文档列表', ()=>{
  const h=viewDocSpace('01');
  ['需求分析','系统设计','系统完善方案','ds-article','ds-toc'].forEach(k=>{ if(!h.includes(k)) throw new Error('缺少:'+k); });
});
t('mermaid 渲染在无 mermaid 环境下安全降级', ()=>{ renderMermaid({querySelectorAll:()=>[]}); });

// 12. 全站检索
t('全站检索:课程/知识点/文档/题目命中', ()=>{
  if(!searchAll('Python').length) throw new Error('课程检索为空');
  if(!searchAll('方差').some(x=>x.type==='知识点')) throw new Error('知识点检索失败');
  if(!searchAll('教学大纲').some(x=>x.type==='教学文档')) throw new Error('文档检索失败');
  if(!searchAll('斐波那契').some(x=>x.type==='题目')) throw new Error('题目检索失败');
});
t('检索视图渲染', ()=>{ auth.user=()=>({role:'admin',userName:'系统管理员'}); if(!viewSearch().includes('全站检索')) throw new Error('渲染异常'); });

// 13. 模块能力补齐
t('章节排序与复制', ()=>{
  auth.user=()=>({role:'admin',userName:'系统管理员'});
  const c=store.course('c_python'); const first=c.chapters[0].id;
  store.moveChapter('c_python',first,1);
  eq(store.course('c_python').chapters[1].id,first);
  store.moveChapter('c_python',first,-1);
  eq(store.course('c_python').chapters[0].id,first);
  const before=store.course('c_python').chapters.length;
  const copy=store.dupChapter('c_python',first);
  eq(store.course('c_python').chapters.length,before+1);
  if(!copy.title.includes('副本')) throw new Error('复制标题异常');
  store.course('c_python').chapters.pop(); store.save();
});
t('知识点排序', ()=>{
  const ch=store.course('c_python').chapters.find(x=>x.kps.length>1);
  const k0=ch.kps[0].id;
  store.moveKp('c_python',ch.id,k0,1); eq(ch.kps[1].id,k0);
  store.moveKp('c_python',ch.id,k0,-1); eq(ch.kps[0].id,k0);
});
t('模板复制与注册', ()=>{
  const n=store.db.templates.length;
  const t1=store.addTemplate({name:'测试模板',type:'course',content:'# {{course.name}}'});
  eq(store.db.templates.length,n+1);
  const t2=store.dupTemplate(t1.id); eq(store.db.templates.length,n+2);
  store.delTemplate(t1.id); store.delTemplate(t2.id); eq(store.db.templates.length,n);
});
t('专业包导出结构完整', ()=>{
  const pkg=viewMajors._packMajor('mj_bigdata');
  eq(pkg.schema,'dlufe-kb/major/v1');
  eq(pkg.courses.length,7);
  if(!pkg.groups.length) throw new Error('课程群缺失');
  if(!pkg.groups[0].courseCodes) throw new Error('课程群未用课程代码关联');
});
t('随机组卷辅助(洗牌/中文序号)', ()=>{
  eq(cnNum(1),'一'); eq(cnNum(3),'三');
  const b=shuffle([1,2,3,4,5]);
  eq(b.length,5); eq([...b].sort().join(),'1,2,3,4,5');
});
t('试卷预览 HTML 含打印按钮与答案区', ()=>{
  const html=paperHtml(store.paper('p1'));
  if(!html.includes('打印')) throw new Error('缺少打印按钮');
  if(!html.includes('参考答案')) throw new Error('缺少答案区');
});
t('题库增强:预览/批量/知识点筛选', ()=>{
  auth.user=()=>({role:'admin',userName:'系统管理员'});
  const h=renderBankList('c_python');
  ['预览','批量移动到课程','批量删除','全部知识点'].forEach(k=>{ if(!h.includes(k)) throw new Error('缺少:'+k); });
});
t('模板中心含效果预览与导入导出', ()=>{
  const h=viewTemplates();
  ['效果预览','生成文档','导出模板库','导入模板'].forEach(k=>{ if(!h.includes(k)) throw new Error('缺少:'+k); });
});
t('教学文档编辑器含工具栏与实时预览', ()=>{
  auth.user=()=>({role:'course_leader',userName:'王伟'});
  const h=viewDocEditor('doc_py_syllabus');
  ['实时预览','doc-content','doc-toolbar','保存','打印'].forEach(k=>{ if(!h.includes(k)) throw new Error('缺少:'+k); });
});
t('教师工作台与教学文档中心打通', ()=>{
  auth.user=()=>({role:'course_leader',userName:'王伟'});
  const h=viewHome();
  if(!h.includes('文档中心')) throw new Error('缺少文档中心入口');
  if(!h.includes('教学文档')) throw new Error('缺少教学文档任务项');
});

// 14. 交互辅助函数健壮性(无异常)
t('交互辅助函数调用无异常', ()=>{
  auth.user=()=>({role:'admin',userName:'系统管理员'});
  docQuickFilter(); dsFilter('教学'); runSearch();
  viewBank.updSel(); viewBank.toggleAll({checked:true});
  viewDoc.ins('**','**'); viewDoc.onCourse('doc_py_syllabus','c_stat');
  viewTemplates.onTdCourse(); viewDoc.onGenCourse();
  viewClass.updSel&&viewClass.updSel();
  dsFilter(''); docFilterState.kw=''; docFilterState.course=''; docFilterState.type='';
});
t('文档保存写入版本(编辑器保存路径)', ()=>{
  const before=store.document('doc_py_syllabus').versions.length;
  store.saveDocument('doc_py_syllabus',{content:'# 修改后的内容'});
  eq(store.document('doc_py_syllabus').versions.length,before+1);
  store.restoreVersion('doc_py_syllabus',0);
});
t('超星教学文档包优先使用已编辑文档', ()=>{
  auth.user=()=>({role:'admin',userName:'系统管理员'});
  const before=(store.db.logs||[]).length;
  chaoxing.exportDocs('c_python');
  if((store.db.logs||[]).length<=before) throw new Error('未写入同步日志');
  if(!store.db.logs[0].desc.includes('已编辑文档')) throw new Error('未优先使用已编辑文档:'+store.db.logs[0].desc);
});

/* ============================================================
   数据模板中心与导入校验引擎(第 5 批)
   ============================================================ */

// 15. 数据字典完整性
t('数据字典:每个对象均含用途/超星入口/规则/示例', ()=>{
  if(SCHEMAS.length<15) throw new Error('对象数量不足:'+SCHEMAS.length);
  SCHEMAS.forEach(sc=>{
    if(!sc.name||!sc.purpose) throw new Error(sc.id+' 缺少名称或用途');
    if(!sc.chaoxing||!sc.chaoxing.entry||!sc.chaoxing.format) throw new Error(sc.id+' 缺少超星对接说明');
    if(!sc.rules||!sc.rules.length) throw new Error(sc.id+' 缺少填写规则');
    if(!sc.formats||!sc.formats.length) throw new Error(sc.id+' 缺少格式声明');
    if(sc.rowShape==='json'){ if(!sc.sampleJSON) throw new Error(sc.id+' 缺少 JSON 示例'); }
    else{ if(!sc.sample||!sc.sample.length) throw new Error(sc.id+' 缺少示例数据'); }
    sc.fields.forEach(f=>{
      if(!f.label||!f.desc) throw new Error(sc.id+' 字段 '+f.key+' 缺少说明');
      if(f.example===undefined) throw new Error(sc.id+' 字段 '+f.label+' 缺少示例值');
      if(f.format===undefined) throw new Error(sc.id+' 字段 '+f.label+' 缺少格式要求');
    });
  });
});
t('数据字典:表头与示例数据列数一致', ()=>{
  SCHEMAS.filter(s=>s.rowShape!=='json'||s.altFields).forEach(sc=>{
    const rows=SchemaKit.sampleRows(sc);
    const w=rows[0].length;
    if(!w) throw new Error(sc.id+' 表头为空');
    rows.forEach((r,i)=>{ if(r.length!==w) throw new Error(`${sc.id} 第${i+1}行列数 ${r.length} ≠ 表头 ${w}`); });
  });
});
t('数据字典:字段说明表与说明文档可生成', ()=>{
  SCHEMAS.forEach(sc=>{
    const ft=SchemaKit.fieldTable(sc);
    if(ft.length<2||ft[0].length!==7) throw new Error(sc.id+' 字段说明表结构错误');
    const md=SchemaKit.specMd(sc);
    ['## 一、字段说明','## 二、填写规则','## 三、示例数据','## 四、格式与编码要求'].forEach(k=>{
      if(!md.includes(k)) throw new Error(sc.id+' 说明文档缺少章节:'+k);
    });
  });
});
t('数据字典:模板包 README 含必填与格式要求', ()=>{
  const sc=SchemaKit.get('students');
  const r=templatesHub.readme(sc);
  ['使用说明','使用步骤','必填字段','填写规则','UTF-8'].forEach(k=>{
    if(!r.includes(k)) throw new Error('README 缺少:'+k);
  });
});

// 16. 模板生成(各格式)
t('模板生成:CSV / TSV / JSON / Markdown 可用', ()=>{
  SCHEMAS.forEach(sc=>{
    const base=sc.rowShape==='json'?['json']:['csv','tsv','json','md'];
    base.forEach(f=>{
      const r=templatesHub.build(sc.id,f);
      if(!r||!r.data) throw new Error(sc.id+' 生成 '+f+' 失败');
      if(typeof r.data==='string' && !r.data.length) throw new Error(sc.id+' '+f+' 内容为空');
    });
  });
});
t('模板生成:CSV 内容含表头与示例行', ()=>{
  const r=templatesHub.build('students','csv');
  const rows=DF.parseCSV(r.data);
  eq(rows[0].join(','),'学号,姓名,性别,备注');
  if(rows.length<2) throw new Error('缺少示例行');
  if(!r.data.startsWith('\ufeff')) throw new Error('CSV 缺少 UTF-8 BOM');
});
t('模板生成:全部对象打包(ZIP)含索引', ()=>{
  const md=templatesHub.indexMd();
  SCHEMA_CATS.forEach(c=>{ if(!md.includes(c.label)) throw new Error('索引缺少分类:'+c.label); });
  SCHEMAS.forEach(sc=>{ if(!md.includes(sc.name)) throw new Error('索引缺少对象:'+sc.name); });
});
ta('模板生成:Excel(.xlsx)含数据页与字段说明页且可回读', async ()=>{
  const r=templatesHub.build('bank','xlsx');
  if(!(r.data instanceof Uint8Array)) throw new Error('xlsx 应为二进制');
  const sheets=await DF.xlsxParse(r.data);
  eq(sheets.length,2,'工作表数');
  eq(sheets[0].name,'数据');
  eq(sheets[1].name,'字段说明');
  const rows=sheets[0].rows;
  eq(rows[0].join(','),'题型,难度,章节,知识点,题干,选项,答案,解析');
  if(rows.length<2) throw new Error('数据页缺少示例行');
  if(sheets[1].rows[0][0]!=='列名/字段') throw new Error('说明页表头错误');
});
ta('模板生成:ZIP 模板包可解压且含全部文件', async ()=>{
  const sc=SchemaKit.get('students');
  const base=DF.safeName(sc.name);
  const rows=SchemaKit.sampleRows(sc);
  const zip=DF.zipBuild([
    {name:`${base}_模板.csv`, data:DF.csv(rows)},
    {name:`${base}_模板.xlsx`, data:DF.xlsxBuild([{name:'数据',rows}])},
    {name:'字段说明.md', data:SchemaKit.specMd(sc)},
    {name:'README.txt', data:templatesHub.readme(sc)}
  ]);
  const files=await DF.zipRead(zip);
  ['学生名单_模板.csv','学生名单_模板.xlsx','字段说明.md','README.txt'].forEach(n=>{
    if(!files[n]) throw new Error('模板包缺少文件:'+n);
  });
  const back=await DF.xlsxParse(zip);
});

// 17. 导入校验引擎:模板直接可用(核心)
t('导入解析:每个表格模板均可零错误解析', ()=>{
  SCHEMAS.filter(s=>s.rowShape!=='json'||s.altFields).forEach(sc=>{
    const rows=SchemaKit.sampleRows(sc);
    const res=_rowsToRecords(sc, rows);
    if(res.errors.length) throw new Error(`${sc.id} 模板自身校验失败:${res.errors.map(e=>e.row+':'+e.msg).join(' | ')}`);
    eq(res.records.length, rows.length-1, sc.id+' 记录数');
  });
});
t('导入解析:CSV 往返一致(导出即可再导入)', ()=>{
  ['students','bank','classes','kpCatalog','gradeItems'].forEach(id=>{
    const sc=SchemaKit.get(id);
    const rows=SchemaKit.sampleRows(sc);
    const back=DF.parseCSV(DF.csv(rows));
    const res=_rowsToRecords(sc, back);
    if(res.errors.length) throw new Error(id+' CSV 往返后校验失败:'+res.errors.map(e=>e.msg).join('|'));
    eq(res.records.length, rows.length-1, id+' CSV 往返记录数');
  });
});
t('导入解析:TSV 与 Excel 复制粘贴内容均可解析', ()=>{
  const rows=SchemaKit.sampleRows(SchemaKit.get('students'));
  const back=DF.parseDelim(DF.tsv(rows),'\t');
  const res=_rowsToRecords(SchemaKit.get('students'), back);
  eq(res.errors.length,0);
  eq(res.records.length,rows.length-1);
});
t('导入解析:列顺序可任意调换(按列名识别)', ()=>{
  const rows=[['备注','姓名','学号','性别'],['','张明','2024010101','男']];
  const res=_rowsToRecords(SchemaKit.get('students'), rows);
  eq(res.errors.length,0,'列乱序应仍可解析');
  eq(res.records[0].sno,'2024010101');
  eq(res.records[0].name,'张明');
});
t('导入解析:超星同义词列名可识别', ()=>{
  const rows=[['账号','名字','性别','班级'],['2024010102','李雪','女','大数据2401班']];
  const res=_rowsToRecords(SchemaKit.get('students'), rows);
  eq(res.errors.length,0,'超星列名应可识别');
  eq(res.records[0].sno,'2024010102');
});
t('导入解析:缺必填列/缺必填值/非法枚举均被拦截', ()=>{
  const r1=_rowsToRecords(SchemaKit.get('students'), [['姓名','性别'],['张明','男']]);
  if(!r1.errors.length) throw new Error('缺必填列未拦截');
  const r2=_rowsToRecords(SchemaKit.get('students'), [['学号','姓名'],['','']]);
  if(!r2.errors.length) throw new Error('缺必填值未拦截');
  const r3=_rowsToRecords(SchemaKit.get('bank'), [['题型','难度','题干','答案'],['选择题','中','题干','A']]);
  if(!r3.errors.some(e=>/题型/.test(e.msg))) throw new Error('非法题型未拦截');
  const r4=_rowsToRecords(SchemaKit.get('classes'), [['班级名称','课程代码','平时成绩权重'],['A班','BX211001','三十']]);
  if(!r4.errors.some(e=>/权重/.test(e.msg))) throw new Error('非法数值未拦截');
});
t('导入解析:动态列(成绩项)自动识别且排除总评', ()=>{
  const rows=SchemaKit.sampleRows(SchemaKit.get('grades'));
  const res=_rowsToRecords(SchemaKit.get('grades'), rows);
  if(!res.dyn||res.dyn.length!==3) throw new Error('动态列识别数错误:'+(res.dyn||[]).length);
  const labels=res.dyn.map(d=>d.label);
  ['平时成绩','期中成绩','期末成绩'].forEach(l=>{ if(!labels.includes(l)) throw new Error('缺少成绩项列:'+l); });
  if(labels.includes('总评')) throw new Error('总评应被排除');
});
t('导入解析:内部键 JSON 可直接再导入(导出→导入往返)', ()=>{
  const sc=SchemaKit.get('students');
  const obj={sno:'2024099999',name:'测试同学',gender:'男',note:'往返测试'};
  const {rows}=DF.rowsFromObjects([obj]);
  const res=_rowsToRecords(sc, rows);
  eq(res.errors.length,0);
  eq(res.records[0].sno,'2024099999');
});

// 18. 各对象写入(APPLY)真实生效
t('导入写入:课程基本信息(新建+更新)', ()=>{
  const n0=store.db.courses.length;
  const msg=APPLY.courseInfo([{code:'BX219999',name:'导入测试课程',credit:'2',hours:'32',semester:'4',leader:'测试老师'}]);
  eq(store.db.courses.length,n0+1,'应新建课程');
  store.save();
});
t('导入写入:专业修读计划(建专业+挂课程+学期)', ()=>{
  const rows=[['120199T','导入测试专业','测试院长','BX219999','3']];
  const {records,errors}=_rowsToRecords(SchemaKit.get('majorPlan'), [SchemaKit.headers(SchemaKit.get('majorPlan')), ...rows]);
  eq(errors.length,0);
  APPLY.majorPlan(records);
  const m=store.db.majors.find(x=>x.code==='120199T');
  if(!m) throw new Error('专业未创建');
  eq(m.courses.length,1);
  eq(m.courses[0].semester,3);
  store.save();
});
t('导入写入:章节结构(建章+按序重排)', ()=>{
  const c=store.db.courses.find(x=>x.code==='BX219999');
  const rows=[['BX219999','2','第2章 测试章','6'],['BX219999','1','第1章 测试章','4']];
  const {records}=_rowsToRecords(SchemaKit.get('chapters'), [SchemaKit.headers(SchemaKit.get('chapters')), ...rows]);
  APPLY.chapters(records);
  eq(c.chapters.length,2);
  eq(c.chapters[0].title,'第1章 测试章','应按章序号重排');
  eq(c.chapters[1].hours,6);
});
t('导入写入:知识点目录(自动建章+去重)', ()=>{
  const c=store.db.courses.find(x=>x.code==='BX219999');
  const rows=[['第1章 测试章','测试知识点A','内容A'],['第1章 测试章','测试知识点A','内容A(重复)'],['第2章 测试章','测试知识点B','$x^2$']];
  const {records}=_rowsToRecords(SchemaKit.get('kpCatalog'), [SchemaKit.headers(SchemaKit.get('kpCatalog')), ...rows]);
  APPLY.kpCatalog.call({__courseId:c.id}, records);
  eq(c.chapters[0].kps.length,1,'重复知识点应跳过');
  eq(c.chapters[1].kps.length,1);
});
t('导入写入:题库(题干去重)', ()=>{
  const c=store.db.courses.find(x=>x.code==='BX219999');
  const rows=SchemaKit.sampleRows(SchemaKit.get('bank'));
  const {records}=_rowsToRecords(SchemaKit.get('bank'), rows);
  const before=store.questions(c.id).length;
  APPLY.bank.call({__courseId:c.id}, records);
  eq(store.questions(c.id).length-before,3,'应新增 3 道题');
});
t('导入写入:教学班级(权重)+学生名单+成绩+作业', ()=>{
  const rows=[SchemaKit.headers(SchemaKit.get('classes')),
    ['导入测试班A','BX219999','2025-2026-1','测试老师','30','20','50']];
  const {records}=_rowsToRecords(SchemaKit.get('classes'), rows);
  APPLY.classes(records);
  const k=store.db.classes.find(x=>x.name==='导入测试班A');
  if(!k) throw new Error('班级未创建');
  eq(k.items.length,3);
  eq(k.items[0].weight,30);
  // 学生
  const sRows=[['2024010101','张明','男',''],['2024010102','李雪','女','']];
  const sRes=_rowsToRecords(SchemaKit.get('students'), [SchemaKit.headers(SchemaKit.get('students')), ...sRows]);
  APPLY.students.call({__classId:k.id}, sRes.records);
  eq(k.students.length,2);
  // 成绩(动态列)
  const gRows=SchemaKit.sampleRows(SchemaKit.get('grades'));
  const gRes=_rowsToRecords(SchemaKit.get('grades'), gRows);
  APPLY.grades.call({__classId:k.id}, gRes.records);
  const stu=k.students.find(s=>s.sno==='2024010101');
  if(!stu) throw new Error('成绩导入应新增学生?');
  eq(k.items.length,3,'成绩项应与已有同名项复用,不新增');
  const usual=k.items.find(i=>i.name==='平时成绩');
  eq(stu.scores[usual.id],88);
  if(calcTotal(k,stu)===null) throw new Error('总评计算失败');
  // 作业
  const aRows=SchemaKit.sampleRows(SchemaKit.get('assignments'));
  const aRes=_rowsToRecords(SchemaKit.get('assignments'), aRows);
  APPLY.assignments.call({__classId:k.id}, aRes.records);
  if(!k.assignments.length) throw new Error('作业未创建');
});
t('导入写入:成绩项权重调整', ()=>{
  const k=store.db.classes.find(x=>x.name==='导入测试班A');
  const rows=[['BX219999','2025-2026-1','平时成绩','45','100']];
  const {records}=_rowsToRecords(SchemaKit.get('gradeItems'), [SchemaKit.headers(SchemaKit.get('gradeItems')), ...rows]);
  APPLY.gradeItems(records);
  eq(k.items.find(i=>i.name==='平时成绩').weight,45);
});
t('导入写入:试卷结构(题干匹配题库)', ()=>{
  const c=store.db.courses.find(x=>x.code==='BX219999');
  const rows=SchemaKit.sampleRows(SchemaKit.get('paper')).map((r,i)=>i===0?r:['BX219999',r[1],r[2],r[3],r[4],r[5]]);
  const {records}=_rowsToRecords(SchemaKit.get('paper'), rows);
  const before=store.db.papers.length;
  APPLY.paper(records);
  eq(store.db.papers.length-before,1,'应新建 1 套试卷');
  const p=store.db.papers[store.db.papers.length-1];
  eq(p.sections.length,2,'应有 2 个大题');
});
t('导入写入:知识图谱两列表(按 id 建关联)', ()=>{
  const c=store.db.courses.find(x=>x.code==='BX219999');
  const ch=c.chapters[0];
  const kp1=store.addKp(c.id, ch.id, {title:'图谱节点1'});
  const kp2=store.addKp(c.id, ch.id, {title:'图谱节点2'});
  const rows=[['kp_py11','kp_py12'],[kp1.id,kp2.id]];
  const {records}=_rowsToRecords(SchemaKit.get('graph'), [SchemaKit.headers(SchemaKit.get('graph')), ...rows]);
  APPLY.graph(records);
  if(!(kp1.links||[]).includes(kp2.id)) throw new Error('关联未建立');
});
t('导入写入:JSON 型对象(课程包/专业包/AI结果/文档/模板)', ()=>{
  const sc=SchemaKit.get('coursePackage');
  const before=store.db.courses.length;
  JSON_IMPORT.coursePackage(sc.sampleJSON);
  eq(store.db.courses.length,before+1,'课程包应新增课程');
  const aiBefore=store.questions('BX211001').length;
  JSON_IMPORT.aiResult(JSON.parse(JSON.stringify(store.db.courses.find(c=>c.code==='BX211001')?SchemaKit.get('aiResult').sampleJSON:SchemaKit.get('aiResult').sampleJSON)));
  if(store.questions().length<=0) throw new Error('AI 结果导入失败');
  const dBefore=store.db.documents.length;
  JSON_IMPORT.documents(SchemaKit.get('documents').sampleJSON);
  eq(store.db.documents.length,dBefore+2,'应导入 2 篇文档');
  const tBefore=store.db.templates.length;
  JSON_IMPORT.templates(SchemaKit.get('templates').sampleJSON);
  eq(store.db.templates.length,tBefore+1);
});

// 19. 模板中心视图
t('模板中心视图:总览与详情均可渲染', ()=>{
  auth.user=()=>({role:'admin',userName:'系统管理员'});
  const h=viewTemplatesHub('');
  SCHEMA_CATS.forEach(c=>{ if(!h.includes(c.label)) throw new Error('总览缺少分类:'+c.label); });
  SCHEMAS.forEach(sc=>{ if(!h.includes(sc.name)) throw new Error('总览缺少对象:'+sc.name); });
  ['下载全部模板','支持的格式与适用场景','怎么用'].forEach(k=>{ if(!h.includes(k)) throw new Error('缺少:'+k); });
  SCHEMAS.forEach(sc=>{
    const d=viewTemplatesHub(sc.id);
    if(!d.includes(sc.name)) throw new Error(sc.id+' 详情缺少名称');
    if(sc.rowShape!=='json'||sc.altFields){ if(!d.includes('填写规则')) throw new Error(sc.id+' 详情缺少填写规则'); }
    if(!d.includes('超星')) throw new Error(sc.id+' 详情缺少超星对接');
  });
  const g=viewTemplatesHub('graph');
  ['表 1 · 表格格式字段','表 2 · JSON 结构字段'].forEach(k=>{ if(!g.includes(k)) throw new Error('图谱详情缺少:'+k); });
});
t('模板中心视图:路由与权限接入', ()=>{
  auth.user=()=>({role:'admin',userName:'系统管理员'});
  if(!auth.canSee('datatpl')) throw new Error('管理员应可见数据模板');
  location.hash='#/datatpl'; route();
  location.hash='#/datatpl/students'; route();
  auth.user=()=>({role:'student',userName:'张同学'});
  if(auth.canSee('datatpl')) throw new Error('学生不应可见数据模板');
  auth.user=()=>({role:'course_leader',userName:'王伟'});
  if(!auth.canSee('datatpl')) throw new Error('课程负责人应可见数据模板');
  auth.user=()=>({role:'admin',userName:'系统管理员'});
});
t('导入向导:弹窗可打开且含模板入口', ()=>{
  auth.user=()=>({role:'admin',userName:'系统管理员'});
  ImportKit.open('students',{classId:'cls_py2401'});
  ImportKit.open('bank',{courseId:'c_python'});
  ImportKit.open('graph',{});
  ImportKit.open('coursePackage',{});
});
t('导入向导:预览可渲染(含错误提示)', ()=>{
  const sc=SchemaKit.get('students');
  ImportKit._state={id:'students',sc,opts:{}};
  ImportKit.preview(sc, SchemaKit.sampleRows(sc), {__classId:'cls_py2401',__courseId:''}, 'csv');
  ImportKit.preview(sc, [['学号'],['']], {__classId:'cls_py2401',__courseId:''}, 'csv');
  ImportKit.previewJSON(SchemaKit.get('graph'), SchemaKit.get('graph').sampleJSON, {});
});
t('导出即可当模板复用:题库导出列与模板表头一致', ()=>{
  const sc=SchemaKit.get('bank');
  eq(SchemaKit.headers(sc).join(','),'题型,难度,章节,知识点,题干,选项,答案,解析');
  const rows=[SchemaKit.headers(sc), ...sc.sample.map(r=>r.slice())];
  const back=DF.parseCSV(DF.csv(rows));
  eq(back[0].join(','),SchemaKit.headers(sc).join(','),'CSV 表头应完全一致');
});
t('数据字典覆盖:全部导入导出功能点均有模板', ()=>{
  // 与系统内实际导入导出点一一对应
  const required=['students','grades','assignments','gradeItems','classes','kpCatalog','chapters','bank',
    'paper','graph','courseInfo','majorPlan','documents','coursePackage','majorPackage','templates',
    'aiChecklist','aiResult','backup'];
  required.forEach(id=>{ if(!SchemaKit.get(id)) throw new Error('缺少模板对象:'+id); });
});

// 17. 首页改版 / 使用说明 / 学期可改
t('首页:含使用说明入口与可修改的学期选择器', ()=>{
  auth.user=()=>({role:'course_leader',userName:'王伟'});
  const h=viewHome();
  ['使用说明','当前学期','hero-select','快捷入口','教学任务进度'].forEach(k=>{
    if(!h.includes(k)) throw new Error('首页缺少:'+k);
  });
  if(!/#\/help/.test(h)) throw new Error('使用说明应链接到 #/help');
  if(!/<select class="hero-select"/.test(h)) throw new Error('缺少学期下拉');
  if(!/viewHome\.setTerm\(/.test(h)) throw new Error('学期下拉未绑定修改方法');
  if(!SCHEMA_CATS.length) throw new Error('数据字典未加载');
});
t('首页:快捷入口只含当前角色可见模块', ()=>{
  auth.user=()=>({role:'student',userName:'张同学'});
  const s=viewHome();
  if(/quick-card[^>]*href="#\/classes"/.test(s)) throw new Error('学生首页不应出现教学班级入口');
  if(/quick-card[^>]*href="#\/chaoxing"/.test(s)) throw new Error('学生首页不应出现超星入口');
  auth.user=()=>({role:'admin',userName:'系统管理员'});
  const a=viewHome();
  ['#/classes','#/chaoxing','#/datatpl'].forEach(x=>{ if(!a.includes('href="'+x+'"')) throw new Error('管理员首页缺少入口:'+x); });
});
t('首页:学生与教师视角差异化', ()=>{
  auth.user=()=>({role:'student',userName:'张同学'});
  const s=viewHome();
  if(s.includes('待录成绩项')) throw new Error('学生不应看到待录成绩项');
  if(s.includes('viewHome.genDoc(')) throw new Error('学生不应看到生成大纲按钮');
  if(s.includes('viewHome.newClass(')) throw new Error('学生不应看到开课班级按钮');
  if(!s.includes('课程资源')) throw new Error('学生首页应显示课程资源');
  auth.user=()=>({role:'course_leader',userName:'王伟'});
  const t2=viewHome();
  if(!t2.includes('待录成绩项')) throw new Error('教师首页应显示待录成绩项');
  if(!t2.includes('我的班级与成绩录入')) throw new Error('教师首页应显示班级录入');
});
t('学期:可修改并写日志 + termList 含标准学期', ()=>{
  auth.user=()=>({role:'admin',userName:'系统管理员'});
  store.setTerm('2025-2026-2');
  eq(store.db.settings.term,'2025-2026-2');
  const logs=store.db.logs||[];
  if(!logs.some(l=>l.type==='学期设置')) throw new Error('切换学期应写同步日志');
  const list=store.termList();
  if(!list.includes('2025-2026-2')) throw new Error('termList 应含当前学期');
  if(!list.some(x=>/^\d{4}-\d{4}-[12]$/.test(x))) throw new Error('termList 应含标准学期编码');
  store.setTerm('2025-2026-1'); // 复位
});
t('学期:fmtTerm 中文格式化', ()=>{
  eq(fmtTerm('2025-2026-1'),'2025-2026 学年 · 第一学期');
  eq(fmtTerm('2025-2026-2'),'2025-2026 学年 · 第二学期');
  eq(fmtTerm('自定义'),'自定义');
});
t('教学班级:学期筛选不改写全局学期设置', ()=>{
  auth.user=()=>({role:'admin',userName:'系统管理员'});
  store.setTerm('2025-2026-1');
  // 模拟选择"全部学期"→应走 URL 参数,不动 settings.term
  viewClasses.setTermFilter('');
  eq(store.db.settings.term,'2025-2026-1','筛选不应清空全局学期');
  const h=viewClasses([], {term:''});
  if(!h.includes('全部学期')) throw new Error('班级页缺少全部学期选项');
  const h2=viewClasses([], {term:'2025-2026-1'});
  if(!h2.includes('2025-2026-1')) throw new Error('班级页应含学期选项');
});
t('使用说明:五类角色页面均可渲染且内容完整', ()=>{
  ['admin','major_leader','group_leader','course_leader','student'].forEach(r=>{
    const h=viewHelp(r);
    if(typeof h!=='string'||h.length<400) throw new Error(r+' 使用说明渲染异常');
    ['推荐工作流','常见问题','核心职责','模块可见性'].forEach(k=>{ if(!h.includes(k)) throw new Error(r+' 缺少:'+k); });
    if(!h.includes(ROLES[r].label)) throw new Error(r+' 缺少角色名');
  });
});
t('使用说明:默认展示当前角色并可查看他人', ()=>{
  auth.user=()=>({role:'group_leader',userName:'赵强'});
  const h=viewHelp('');
  if(!h.includes('课程群负责人')) throw new Error('默认应展示当前角色指南');
  const s=viewHelp('student');
  if(!s.includes('学生')) throw new Error('应可查看学生指南');
  if(!s.includes('正在查看本人指南')&&!s.includes('您当前是')) throw new Error('查看他人指南应有提示');
});
t('使用说明:路由与权限接入', ()=>{
  ['admin','major_leader','group_leader','course_leader','student'].forEach(r=>{
    auth.user=()=>({role:r,userName:'x'});
    if(!auth.canSee('help')) throw new Error(r+' 应可见使用说明');
  });
  auth.user=()=>({role:'admin',userName:'系统管理员'});
  location.hash='#/help'; route();
  location.hash='#/help/student'; route();
});
t('导航:模块均含描述且使用说明在列', ()=>{
  NAV.forEach(n=>{ if(!n.desc) throw new Error('导航缺少描述:'+n.id); });
  if(!NAV.some(n=>n.id==='help')) throw new Error('导航应含使用说明');
  const icons=NAV.map(n=>n.icon);
  eq(new Set(icons).size,icons.length,'导航图标不应重复');
});
t('清理:已移除废弃的 viewDashboard 死代码', ()=>{
  if(typeof viewDashboard!=='undefined') throw new Error('viewDashboard 应已移除');
  if(typeof mountDashboard!=='undefined') throw new Error('mountDashboard 应已移除');
  if(typeof viewHome!=='function'||typeof viewHelp!=='function') throw new Error('首页/使用说明应存在');
});

// 18. 白屏根治:第三方库本地化 + 渲染兜底(回归测试)
t('白屏根治:index.html 不再依赖任何外部 CDN', ()=>{
  const html=__readFile('index.html');
  const bad=/https?:\/\/(cdn\.jsdelivr|unpkg|cdnjs|cdn\.bootcdn|lib\.baomitu)[^"']*/g;
  const hits=html.match(bad);
  if(hits) throw new Error('仍存在外部 CDN 引用: '+hits.join(', '));
  if(/<script[^>]+src="https?:/.test(html)) throw new Error('index.html 仍有外部 http(s) 脚本');
  if(/<link[^>]+href="https?:/.test(html)) throw new Error('index.html 仍有外部 http(s) 样式');
});
t('白屏根治:index.html 引用的本地资源全部真实存在', ()=>{
  const html=__readFile('index.html');
  const refs=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1])
    .filter(s=>!/^https?:|^#|^data:|^mailto:/.test(s));
  if(!refs.length) throw new Error('未解析到任何本地资源引用');
  const missing=refs.filter(r=>!__exists(r));
  if(missing.length) throw new Error('引用的本地文件缺失: '+missing.join(', '));
  ['libs/echarts.min.js','libs/marked.min.js','libs/katex/katex.min.js','libs/katex/katex.min.css']
    .forEach(f=>{ if(!__exists(f)) throw new Error('核心库缺失: '+f); });
});
t('白屏根治:katex 字体已随样式本地化(20 个 woff2)', ()=>{
  const fonts=__listDir('libs/katex/fonts').filter(f=>/\.woff2$/.test(f));
  if(fonts.length<20) throw new Error('katex 字体不完整, 实际 '+fonts.length+' 个');
  const css=__readFile('libs/katex/katex.min.css');
  if(!/url\(fonts\//.test(css)) throw new Error('katex 样式未指向本地 fonts/ 目录');
});
t('白屏根治:mermaid 按需加载而不在首屏阻塞', ()=>{
  const html=__readFile('index.html');
  if(/libs\/mermaid\.min\.js/.test(html)) throw new Error('mermaid 不应在 index.html 首屏加载');
  if(!__exists('libs/mermaid.min.js')) throw new Error('本地 mermaid 库缺失');
  if(typeof ensureMermaid!=='function') throw new Error('缺少 ensureMermaid 按需加载器');
  // 已有全局 mermaid 时应直接复用,不注入脚本
  const p=ensureMermaid();
  if(!p||typeof p.then!=='function') throw new Error('ensureMermaid 应返回 Promise');
  eq(renderMermaid(null) instanceof Promise, true, 'renderMermaid 应返回 Promise');
});
t('白屏根治:route 有异常兜底,单视图报错不致整页空白', ()=>{
  const src=__readFile('js/main.js');
  if(!/function route\(\)\{[\s\S]*?try\{[\s\S]*?routeInner\(\)[\s\S]*?\}catch/.test(src))
    throw new Error('route() 缺少 try/catch 兜底');
  if(!/function routeInner\(\)/.test(src)) throw new Error('缺少 routeInner()');
  if(!/页面渲染出错/.test(src)) throw new Error('兜底提示文案缺失');
  // 动态验证:构造一个必然抛错的视图,主区域应出现兜底卡片而非空白
  const _bak=routes.dashboard;
  routes.dashboard=()=>{ throw new Error('boom'); };
  const main=document.getElementById('main');
  location.hash='#/dashboard'; route();
  eq(/页面渲染出错/.test(main.innerHTML), true, '异常视图应显示兜底卡片');
  routes.dashboard=_bak;
  location.hash='#/dashboard'; route();
  if(!main.innerHTML.length) throw new Error('恢复正常后首页应有内容');
});
t('白屏根治:启动流程容错(store/nav 失败仍渲染路由)', ()=>{
  const src=__readFile('js/main.js');
  const boot=src.slice(src.indexOf("DOMContentLoaded"));
  if(!/try\{ store\.load\(\)/.test(boot)) throw new Error('store.load 未做容错');
  if(!/try\{ initNav\(\)/.test(boot)) throw new Error('initNav 未做容错');
  if(!/route\(\);/.test(boot)) throw new Error('启动末尾应始终调用 route()');
});
