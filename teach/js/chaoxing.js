/* 超星(学习通)双向适配层 + 成绩计算工具 */
/* ---------- 成绩计算 ---------- */
function calcTotal(k, s){
  let sum=0, ws=0;
  (k.items||[]).forEach(it=>{
    const w=Number(it.weight||0); ws+=w;
    const v=s.scores? s.scores[it.id] : undefined;
    if(v!==undefined && v!==null && v!=='') sum += (Number(v)/ (Number(it.full)||100)) * w;
  });
  if(!ws) return null;
  return Math.round(sum*100)/100; // 已按权重归一为百分制
}
function scoreFilled(k, s){
  return (k.items||[]).filter(it=>{ const v=s.scores? s.scores[it.id]:undefined; return v!==undefined && v!==null && v!==''; }).length;
}
function classStats(k){
  const totals=(k.students||[]).map(s=>calcTotal(k,s)).filter(v=>v!==null);
  const itemCount=(k.items||[]).length;
  const filled=(k.students||[]).reduce((a,s)=>a+scoreFilled(k,s),0);
  const total=(k.students||[]).length*itemCount;
  if(!totals.length) return {count:k.students.length, avg:null, max:null, min:null, pass:0, completeness: total? Math.round(filled/total*100):0, filled, total};
  const avg=totals.reduce((a,b)=>a+b,0)/totals.length;
  const pass=totals.filter(v=>v>=60).length;
  return {count:k.students.length, avg:Math.round(avg*100)/100, max:Math.max(...totals), min:Math.min(...totals),
    pass:Math.round(pass/totals.length*100), completeness: total? Math.round(filled/total*100):0, filled, total,
    dist:{'优秀(≥90)':totals.filter(v=>v>=90).length,'良好(80-89)':totals.filter(v=>v>=80&&v<90).length,
          '中等(70-79)':totals.filter(v=>v>=70&&v<80).length,'及格(60-69)':totals.filter(v=>v>=60&&v<70).length,
          '不及格(<60)':totals.filter(v=>v<60).length}};
}
/* ---------- CSV 工具 ---------- */
function toCSV(rows){
  return '\ufeff'+rows.map(r=>r.map(x=>`"${String(x??'').replace(/"/g,'""')}"`).join(',')).join('\n');
}
function parseCSV(text){
  const clean=String(text).replace(/^\ufeff/,'').replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  const rows=[]; let row=[], cur='', q=false;
  for(let i=0;i<clean.length;i++){
    const ch=clean[i];
    if(q){
      if(ch==='"'){ if(clean[i+1]==='"'){cur+='"';i++;} else q=false; } else cur+=ch;
    }else{
      if(ch==='"') q=true;
      else if(ch===','){ row.push(cur); cur=''; }
      else if(ch==='\n'){ row.push(cur); rows.push(row); row=[]; cur=''; }
      else cur+=ch;
    }
  }
  if(cur!==''||row.length){ row.push(cur); rows.push(row); }
  return rows.filter(r=>r.some(c=>String(c).trim()!==''));
}
function pickFile(accept, cb){
  const f=document.createElement('input'); f.type='file'; f.accept=accept;
  f.onchange=()=>{ const r=new FileReader(); r.onload=()=>cb(r.result, f.files[0]); r.readAsText(f.files[0],'utf-8'); };
  f.click();
}
function classOf(id){ return store.klass(id); }

/* ---------- 超星格式规范(界面展示用) ---------- */
const CX_FORMATS = {
  '学生名单':   {head:['学号','姓名','性别','班级'], note:'对应超星"班级管理 → 学生名单"导入模板;按学号去重合并。'},
  '成绩':       {head:['学号','姓名','<各项成绩列…>','总评'], note:'对应超星"成绩管理 → 导出/导入";导入时按学号匹配,分项列名与本班成绩项同名则写入,否则自动新增成绩项。'},
  '知识点目录': {head:['章','节/知识点','内容'], note:'对应超星"课程 → 目录/资料"批量建立;内容支持纯文本(公式以 LaTeX 原样保留)。'},
  '知识图谱':   {head:['nodes[].{id,label,course,chapter}','edges[].{source,target}'], note:'JSON 格式,可导入超星知识图谱工具或 Gephi/Neo4j 做二次分析。'},
  '题库':       {head:['题型','难度','章节','题干','选项(用 | 分隔)','答案','解析'], note:'JSON 保真(含公式);CSV 便于 Excel 批量编辑。'},
  '作业':       {head:['作业标题','学号','姓名','得分','满分','截止时间'], note:'对应超星"作业 → 导出成绩",回填后可做作业分统计分析。'},
  '教学文档':   {head:['Markdown 文档包'], note:'大纲/教案/教学日历/讲义,可直接粘贴进超星文档或另存为 Word/PDF。'},
  '全库备份':   {head:['JSON 全量'], note:'包含专业/课程群/课程/知识点/图谱/题库/卷库/班级/成绩/日志,用于整体迁移与灾备。'}
};

/* ---------- 导出:本系统 → 超星 ---------- */
const chaoxing = {
  /* 学生名单 */
  exportStudents(cid){
    const k=classOf(cid); if(!k) return;
    const rows=[['学号','姓名','性别','班级']];
    k.students.forEach(s=>rows.push([s.sno,s.name,s.gender,k.name]));
    download(`${k.name}-学生名单(超星).csv`, toCSV(rows),'text/csv');
    store.log('export','学生名单',`导出 ${k.name} 名册`,k.students.length); toast('学生名单已导出(超星格式)'); route();
  },
  importStudents(cid){
    pickFile('.csv,.txt',(text)=>{
      const k=classOf(cid); const rows=parseCSV(text);
      if(!rows.length){toast('文件为空');return;}
      let head=rows[0].map(x=>String(x).trim());
      const iSno=head.findIndex(h=>/学号|账号|工号/.test(h)), iName=head.findIndex(h=>/姓名|名字/.test(h));
      const iSex=head.findIndex(h=>/性别/.test(h)), iCls=head.findIndex(h=>/班级/.test(h));
      const body=(iSno>=0||iName>=0)? rows.slice(1):rows;
      let add=0, upd=0;
      body.forEach(r=>{
        const sno=iSno>=0?String(r[iSno]||'').trim():'';
        const name=iName>=0?String(r[iName]||'').trim():String(r[0]||'').trim();
        if(!name && !sno) return;
        const exist=k.students.find(s=>(sno&&s.sno===sno)||(!sno&&s.name===name));
        if(exist){ if(iSex>=0) exist.gender=String(r[iSex]||'').trim(); upd++; }
        else{ k.students.push({id:uid('stu'),sno,name,gender:iSex>=0?String(r[iSex]||'').trim():'',scores:{}}); add++; }
      });
      store.save(); store.log('import','学生名单',`${k.name} 新增 ${add} 人 / 更新 ${upd} 人`,add+upd);
      toast(`导入完成:新增 ${add} 人,更新 ${upd} 人`); route();
    });
  },
  /* 成绩 */
  exportGrades(cid){
    const k=classOf(cid); if(!k) return;
    const rows=[['学号','姓名',...k.items.map(i=>i.name),'总评']];
    k.students.forEach(s=>rows.push([s.sno,s.name,...k.items.map(i=>s.scores[i.id]??''),calcTotal(k,s)??'']));
    download(`${k.name}-成绩表(超星).csv`, toCSV(rows),'text/csv');
    store.log('export','成绩',`导出 ${k.name} 成绩表(含分项与总评)`,k.students.length); toast('成绩表已导出(超星成绩导入格式)'); route();
  },
  importGrades(cid){
    pickFile('.csv,.txt',(text)=>{
      const k=classOf(cid); const rows=parseCSV(text);
      if(rows.length<2){toast('文件内容不足');return;}
      const head=rows[0].map(x=>String(x).trim());
      const iSno=head.findIndex(h=>/学号|账号/.test(h)), iName=head.findIndex(h=>/姓名/.test(h));
      // 分项列:排除学号/姓名/序号/总评/班级
      const itemCols=[];
      head.forEach((h,i)=>{ if(i===iSno||i===iName) return;
        if(/序号|总评|总分|班级|学号|姓名/.test(h)) return;
        let it=k.items.find(x=>x.name===h);
        if(!it){ it=store.addItem(cid,{name:h,weight:0,full:100}); }
        itemCols.push({i, it});
      });
      let n=0;
      rows.slice(1).forEach(r=>{
        const sno=iSno>=0?String(r[iSno]||'').trim():'';
        const name=iName>=0?String(r[iName]||'').trim():'';
        const s=k.students.find(x=>(sno&&x.sno===sno)||(!sno&&x.name===name));
        if(!s) return;
        itemCols.forEach(({i,it})=>{ const v=String(r[i]??'').trim(); if(v!=='') s.scores[it.id]=Number(v); });
        n++;
      });
      store.save(); store.log('import','成绩',`${k.name} 回填 ${n} 名学生成绩`,n);
      toast(`成绩导入完成:${n} 名学生`); route();
    });
  },
  /* 知识点目录 */
  exportKpCatalog(cid){
    const c=store.course(cid); if(!c) return;
    const rows=[['章','节/知识点','内容']];
    c.chapters.forEach(ch=>ch.kps.forEach(kp=>rows.push([ch.title,kp.title,(kp.content||'').replace(/\n/g,' ')])));
    download(`${c.name}-知识点目录(超星).csv`, toCSV(rows),'text/csv');
    store.log('export','知识点目录',`导出《${c.name}》章节知识点`,rows.length-1); toast('知识点目录已导出'); route();
  },
  importKpCatalog(cid){
    pickFile('.csv,.txt',(text)=>{
      const c=store.course(cid); const rows=parseCSV(text);
      if(rows.length<2){toast('文件内容不足');return;}
      let addCh=0, addKp=0;
      rows.slice(1).forEach(r=>{
        const chTitle=String(r[0]||'').trim(), kpTitle=String(r[1]||'').trim(), content=String(r[2]||'').trim();
        if(!kpTitle) return;
        let ch=c.chapters.find(x=>x.title===chTitle);
        if(!ch){ ch=store.addChapter(cid,{title:chTitle||'未分章',hours:4}); addCh++; }
        if(!ch.kps.some(k=>k.title===kpTitle)){ store.addKp(cid,ch.id,{title:kpTitle,content}); addKp++; }
      });
      store.log('import','知识点目录',`《${c.name}》新增章节 ${addCh} / 知识点 ${addKp}`,addKp);
      toast(`导入完成:章节 ${addCh},知识点 ${addKp}`); route();
    });
  },
  /* 作业 */
  exportAssignments(cid){
    const k=classOf(cid); if(!k) return;
    const rows=[['作业标题','学号','姓名','得分','满分','截止时间']];
    k.assignments.forEach(a=>k.students.forEach(s=>rows.push([a.title,s.sno,s.name,a.scores[s.id]??'',a.full,a.due])));
    download(`${k.name}-作业成绩(超星).csv`, toCSV(rows),'text/csv');
    store.log('export','作业',`导出 ${k.name} 作业成绩(${k.assignments.length} 次作业)`,rows.length-1); toast('作业成绩已导出'); route();
  },
  importAssignments(cid){
    pickFile('.csv,.txt',(text)=>{
      const k=classOf(cid); const rows=parseCSV(text);
      if(rows.length<2){toast('文件内容不足');return;}
      const head=rows[0].map(x=>String(x).trim());
      const iT=head.findIndex(h=>/作业|标题/.test(h)), iSno=head.findIndex(h=>/学号/.test(h)), iName=head.findIndex(h=>/姓名/.test(h));
      const iScore=head.findIndex(h=>/得分|成绩/.test(h)), iFull=head.findIndex(h=>/满分/.test(h)), iDue=head.findIndex(h=>/截止/.test(h));
      let n=0;
      rows.slice(1).forEach(r=>{
        const title=String(r[iT>=0?iT:0]||'').trim(); if(!title) return;
        let a=k.assignments.find(x=>x.title===title);
        if(!a){ a=store.addAssignment(cid,{title, full:iFull>=0?Number(r[iFull])||100:100, due:iDue>=0?String(r[iDue]||''):''}); }
        const sno=iSno>=0?String(r[iSno]||'').trim():'';
        const name=iName>=0?String(r[iName]||'').trim():'';
        const s=k.students.find(x=>(sno&&x.sno===sno)||(!sno&&x.name===name)); if(!s) return;
        const v=iScore>=0?String(r[iScore]??'').trim():'';
        if(v!==''){ a.scores[s.id]=Number(v); n++; }
      });
      store.save(); store.log('import','作业',`${k.name} 作业成绩回填 ${n} 条`,n);
      toast(`作业导入完成:${n} 条成绩`); route();
    });
  },
  /* 图谱 */
  exportGraphChaoxing(cid){
    const pkg = cid? exporters._graphOf(cid) : exporters._graphOf('');
    download(`知识图谱-超星适配.json`, JSON.stringify({platform:'chaoxing', type:'knowledge-graph', nodes:pkg.nodes, edges:pkg.edges},null,2),'application/json');
    store.log('export','知识图谱',`导出图谱 节点${pkg.nodes.length}/边${pkg.edges.length}`,pkg.nodes.length); toast('知识图谱已导出'); route();
  },
  importGraphChaoxing(){
    pickFile('.json',(text)=>{
      let data; try{ data=JSON.parse(text); }catch(e){ toast('JSON 解析失败'); return; }
      const nodes=data.nodes||[], edges=data.edges||[];
      let linked=0, miss=0, nodeMap={};
      nodes.forEach(n=>{
        const kp=store.findKpGlobal(n.id) || findKpByLabel(n.label, n.course);
        if(kp) nodeMap[n.id]=kp.kp.id; else miss++;
      });
      edges.forEach(e=>{
        const s=nodeMap[e.source]||e.source, t=nodeMap[e.target]||e.target;
        const kp=store.findKpGlobal(s);
        if(kp && store.findKpGlobal(t)){
          kp.kp.links=kp.kp.links||[];
          if(!kp.kp.links.includes(t)){ kp.kp.links.push(t); linked++; }
        }
      });
      store.save(); store.log('import','知识图谱',`图谱合并:新增关联 ${linked} 条,未匹配节点 ${miss}`,linked);
      toast(`图谱导入完成:新增关联 ${linked} 条${miss?`,未匹配 ${miss} 个节点`:''}`); route();
    });
  },
  /* 教学文档包:优先打包「教学文档中心」中已编辑落库的文档,无则用模板现场渲染 */
  exportDocs(cid){
    const c=store.course(cid); if(!c) return;
    const parts=[];
    const docs=store.documentsOfCourse(cid);
    let n=0;
    if(docs.length){
      parts.push(`# 《${c.name}》教学文档集\n\n> 共 ${docs.length} 篇:由教学文档中心在线编写/修订后导出。\n`);
      docs.forEach(d=>{
        const label=(typeof docTypeMeta!=='undefined'? docTypeMeta(d.type).label : d.type);
        parts.push(`\n\n<!-- ══════ ${label}:${d.title} ══════ -->\n\n`+(d.content||''));
        n++;
      });
    }else{
      store.db.templates.filter(t=>t.type==='course').forEach(t=>{
        parts.push(`\n\n<!-- ══════ ${t.name} ══════ -->\n\n`+TemplateRegistry.render(t,c,c.chapters[0]));
        n++;
      });
      store.db.templates.filter(t=>t.type==='chapter').forEach(t=>{
        c.chapters.forEach(ch=>{ parts.push(`\n\n<!-- ══════ ${t.name}:${ch.title} ══════ -->\n\n`+TemplateRegistry.render(t,c,ch)); n++; });
      });
    }
    download(`${c.name}-教学文档包.md`, parts.join('\n'), 'text/markdown');
    store.log('export','教学文档',`生成《${c.name}》教学文档包(${docs.length?'已编辑文档'+docs.length+'篇':'模板渲染'+n+'份'})`,n);
    toast(docs.length? `已导出教学文档包(${docs.length} 篇)` : '教学文档包已导出(可粘贴至超星文档)'); route();
  },
  /* 导出/导入总入口 */
  allExport(cid){
    if(!cid){ toast('请先选择课程'); return; }
    this.exportKpCatalog(cid); this.exportGraphChaoxing(cid);
    setTimeout(()=>exporters.bankJson(cid), 400);
    setTimeout(()=>this.exportDocs(cid), 800);
    const ks=store.classesOfCourse(cid);
    ks.forEach((k,i)=>{ setTimeout(()=>this.exportStudents(k.id), 1200+i*500); setTimeout(()=>this.exportGrades(k.id), 1500+i*500); });
    toast(`已开始导出《${store.course(cid).name}》全部资源(知识点/图谱/题库/文档/班级成绩)`);
  }
};
/* 按标题+课程名匹配知识点(图谱导入容错) */
function findKpByLabel(label, courseName){
  for(const c of store.db.courses){
    if(courseName && c.name!==courseName) continue;
    for(const ch of c.chapters){ const kp=ch.kps.find(k=>k.title===label); if(kp) return {course:c, chapter:ch, kp}; }
  }
  return null;
}

/* ============================================================
   多格式导出与模板入口(与「数据模板中心」共用同一份数据字典)
   ============================================================ */
/* 统一的"选择导出格式"弹窗 */
function pickExportFormat(baseName, rows, opts){
  opts=opts||{};
  if(!auth.canExport()){ toast('当前角色无导出权限'); return; }
  const fmts=(opts.formats||['csv','xlsx','tsv','json']).filter(f=>DF.formats[f]);
  openModal(`
    <h3>⬇ 导出「${esc(opts.title||baseName)}」</h3>
    <p class="mini">${esc(opts.hint||'选择导出格式。表格类数据推荐 Excel 或 CSV;需要公式或程序处理时用 JSON。')}</p>
    <div class="fmt-grid">
      ${fmts.map(f=>`<button class="fmt-card" onclick="chaoxing._doExport('${f}')">
        <b>${DF.formats[f].label}</b><div class="mini">${esc(DF.formats[f].note)}</div></button>`).join('')}
    </div>
    ${opts.tplId?`<p class="mini" style="margin-top:8px">📋 导出的文件<b>可直接作为导入模板复用</b>;
      <a href="#/datatpl/${opts.tplId}" onclick="closeModal()">查看「${esc(SchemaKit.get(opts.tplId)?SchemaKit.get(opts.tplId).name:opts.tplId)}」字段说明 →</a></p>`:''}
    <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button></div>`);
  chaoxing._pendingExport={baseName, rows, opts};
}
chaoxing._doExport = function(fmt){
  const p=chaoxing._pendingExport; if(!p) return;
  const {baseName, rows, opts}=p;
  try{
    const sheets=[{name:(opts.sheet||'数据'), rows}];
    if(opts.spec) sheets.push({name:'字段说明', rows:opts.spec});   // 导出文件自带字段说明页
    if(fmt==='xlsx')     DF.downloadBytes(`${baseName}.xlsx`, DF.xlsxBuild(sheets), DF.formats.xlsx.mime);
    else if(fmt==='json')DF.downloadBytes(`${baseName}.json`, DF.u8encode(DF.json(opts.json||DF.objectsFromRows(rows))), DF.formats.json.mime);
    else if(fmt==='tsv') DF.downloadBytes(`${baseName}.tsv`, DF.u8encode(DF.tsv(rows)), DF.formats.tsv.mime);
    else                 DF.downloadBytes(`${baseName}.csv`, DF.u8encode(DF.csv(rows)), DF.formats.csv.mime);
    if(opts.log) store.log('export', opts.log.type, opts.log.desc, opts.log.count);
    toast(`${baseName}.${(DF.formats[fmt]||{ext:fmt}).ext} 已导出`);
  }catch(e){ toast('导出失败:'+(e.message||e)); }
  closeModal(); if(window.route) route();
};
/* 模板下载按钮(供各页面复用) */
function tplBtn(id, label){
  const sc=SchemaKit.get(id); if(!sc) return '';
  return `<button class="btn small" onclick="templatesHub.download('${id}','zip')" title="下载可直接使用的模板(CSV/Excel/JSON+字段说明)">⬇ ${esc(label||(sc.name+'模板'))}</button>
    <button class="btn small" onclick="location.hash='#/datatpl/${id}'" title="查看字段含义与示例">📖 说明</button>`;
}
/* 导入按钮:统一走 ImportKit(多格式 + 校验预览) */
function impBtn(id, label, ctx){
  const sc=SchemaKit.get(id); if(!sc) return '';
  return `<button class="btn small primary" onclick="ImportKit.open('${id}',${JSON.stringify(ctx||{}).replace(/"/g,'&quot;')})">📥 ${esc(label||('导入'+sc.name))}</button>`;
}

/* ---------- 各对象的导出构建(行列与模板一致) ---------- */
const CX_ROWS = {
  students(cid){ const k=classOf(cid); const sc=SchemaKit.get('students');
    return [SchemaKit.headers(sc), ...k.students.map(s=>[s.sno,s.name,s.gender||'',s.note||''])]; },
  grades(cid){ const k=classOf(cid); const sc=SchemaKit.get('grades');
    return [SchemaKit.headers(sc), ...k.students.map(s=>[s.sno,s.name,...k.items.map(i=>s.scores[i.id]??''),calcTotal(k,s)??''])]; },
  assignments(cid){ const k=classOf(cid); const sc=SchemaKit.get('assignments');
    const rows=[SchemaKit.headers(sc)];
    k.assignments.forEach(a=>k.students.forEach(s=>rows.push([a.title,s.sno,s.name,a.scores[s.id]??'',a.full,a.due||''])));
    return rows; },
  kpCatalog(cid){ const c=store.course(cid); const sc=SchemaKit.get('kpCatalog');
    const rows=[SchemaKit.headers(sc)];
    c.chapters.forEach(ch=>ch.kps.forEach(kp=>rows.push([ch.title,kp.title,(kp.content||'').replace(/\n/g,' ')])));
    return rows; },
  bank(cid){ const sc=SchemaKit.get('bank');
    const rows=[SchemaKit.headers(sc)];
    store.questions(cid).forEach(q=>rows.push([TYPES[q.type].label,q.difficulty,q.chapter||'',
      (store.findKpGlobal(q.kpId)||{kp:{}}).kp.title||'',q.stem,(q.options||[]).join(' | '),q.answer,q.analysis||'']));
    return rows; },
  graph(cid){ const sc=SchemaKit.get('graph');
    const pkg=exporters._graphOf(cid||'');
    const rows=[SchemaKit.headers(sc)];
    pkg.edges.forEach(e=>rows.push([e.source,e.target]));
    return rows; }
};
/* 统一导出入口:kind + 目标(课程或班级) */
chaoxing.exportWithFormat = function(kind, id){
  if(!auth.canExport()){ toast('当前角色无导出权限'); return; }
  const meta={
    students:{tpl:'students',sheet:'学生名单',title:'学生名单',needClass:true},
    grades:{tpl:'grades',sheet:'成绩表',title:'成绩表',needClass:true},
    assignments:{tpl:'assignments',sheet:'作业成绩',title:'作业成绩',needClass:true},
    kpCatalog:{tpl:'kpCatalog',sheet:'知识点目录',title:'知识点目录',needClass:false},
    bank:{tpl:'bank',sheet:'题库',title:'题库',needClass:false},
    graph:{tpl:'graph',sheet:'知识图谱',title:'知识图谱',needClass:false}
  }[kind];
  if(!meta){ toast('未知的导出对象'); return; }
  const sc=SchemaKit.get(meta.tpl);
  const rows=CX_ROWS[kind](id);
  const baseName = meta.needClass ? `${store.klass(id).name}-${meta.title}` : `${(store.course(id)||{name:'全部课程'}).name}-${meta.title}`;
  const json = kind==='bank' ? {schema:'dlufe-kb/bank/v1', questions:store.questions(id)}
             : kind==='graph' ? {platform:'chaoxing', type:'knowledge-graph', nodes:exporters._graphOf(id||'').nodes, edges:exporters._graphOf(id||'').edges}
             : DF.objectsFromRows(rows);
  pickExportFormat(baseName, rows, {
    title:meta.title, sheet:meta.sheet, tplId:meta.tpl,
    formats: kind==='graph'?['csv','xlsx','json']:['csv','xlsx','tsv','json'],
    spec: kind==='graph'?null:SchemaKit.fieldTable(sc),
    json,
    log:{ type:sc.name, desc:`导出${baseName}(${rows.length-1} 条)`, count:rows.length-1 }
  });
};
