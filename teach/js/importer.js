/* ============================================================
   导入校验引擎 (ImportKit)
   流程:读取文件(CSV/TSV/XLSX/JSON) → 列名同义词映射 → 必填/类型校验
        → 预览确认(前若干行 + 逐行错误清单) → 写入数据层 + 记同步日志
   所有对象的解析规则取自 js/schemas.js 的同一份数据字典,保证"模板 = 解析"。
   ============================================================ */

/* ---------- 列名归一化 & 同义词匹配 ---------- */
function _nk(s){
  return String(s??'').trim().toLowerCase()
    .replace(/[\s\u3000]/g,'')
    .replace(/[（）()【】\[\]{}<>《》:：*·.。,，、\/\\|"'`~!！?？;；\-—_]/g,'');
}
/* 枚举同义词(题型/难度/性别/文档类型 + 内部键,保证导出文件可直接再导入) */
const ENUM_ALIAS = {
  '单选题':['单选','单项选择','单选题','single'],'多选题':['多选','多项选择','多选题','multi'],
  '判断题':['判断','对错题','判断题','judge'],'填空题':['填空','填空题','blank'],
  '简答题':['简答','问答','简答题','论述题','short'],'操作题':['操作','实践题','实操题','编程题','操作题','op'],
  '易':['易','简单','容易','低','easy'],'中':['中','中等','一般','中档','normal','medium'],'难':['难','困难','高','较难','hard'],
  '男':['男','男性','m','male'],'女':['女','女性','f','female'],
  '课程大纲':['课程大纲','大纲','教学大纲','syllabus'],'教学日历':['教学日历','日历','授课计划','calendar'],
  '教案':['教案','lesson','教学设计'],'讲义':['讲义','handout','讲稿'],
  '试卷分析':['试卷分析','exam'],'其他文档':['其他','其他文档','other'],
  'course':['course','课程级','课程'],'chapter':['chapter','章节级','章节']
};
function _enumResolve(value, enumList){
  const v=_nk(value); if(!v) return null;
  for(const opt of enumList){
    if(_nk(opt)===v) return opt;
    const al=ENUM_ALIAS[opt]||[];
    if(al.some(a=>_nk(a)===v)) return opt;
  }
  // 前缀匹配兜底("单选A" → 单选题)
  for(const opt of enumList){ if(_nk(opt).startsWith(v)||v.startsWith(_nk(opt))) return opt; }
  return null;
}
/* 表头行 → 字段索引映射 */
function _mapHeader(sc, header){
  const cells=(header||[]).map(x=>String(x??''));
  const used={}, cols=[];
  SchemaKit.tableFields(sc).forEach(f=>{
    if(/[<>\u3010\u3011\[\]]/.test(f.label) || /\[/.test(f.key||'')) return;   // 动态列/JSON 路径字段不参与匹配
    // 候选列名 = 中文列名 + 同义词 + 超星列名 + 内部字段键(使导出的 JSON 可直接再导入)
    const cands=[f.label, ...(f.aliases||[]), f.cx, f.key].filter(Boolean).map(_nk).filter(Boolean);
    let idx=-1;
    for(let i=0;i<cells.length;i++){
      if(used[i]) continue;
      const c=_nk(cells[i]); if(!c) continue;
      if(cands.includes(c)){ idx=i; break; }
    }
    if(idx<0){ // 兜底:包含关系
      for(let i=0;i<cells.length;i++){
        if(used[i]) continue;
        const c=_nk(cells[i]); if(c.length<2) continue;
        if(cands.some(a=>a.length>=2 && (c.includes(a)||a.includes(c)))){ idx=i; break; }
      }
    }
    if(idx>=0){ used[idx]=1; cols.push({i:idx, field:f}); }
    else cols.push({i:-1, field:f});
  });
  // 未匹配列 → 动态列(排除黑名单)
  const dyn=[];
  if(sc.dynamic){
    const ex=(sc.dynamic.exclude||[]).map(_nk);
    cells.forEach((c,i)=>{
      if(used[i]) return;
      const n=_nk(c); if(!n) return;
      if(ex.some(e=>n===e||n.includes(e))) return;
      dyn.push({i, label:String(c).trim()});
    });
  }
  return {cols, dyn, cells};
}
/* 行 → 记录(含校验) */
function _rowsToRecords(sc, rows){
  const TF = SchemaKit.tableFields(sc);
  const plain = f => !(/[<>\[\]]/.test(f.label) || /\[/.test(f.key||''));
  if(!rows || rows.length<2) return {records:[], errors:[{row:0, msg:'文件中没有数据行(仅有表头或空文件)'}], header:[]};
  const header=rows[0];
  const m=_mapHeader(sc, header);
  const missing=TF.filter(f=>f.required && plain(f) && m.cols.find(c=>c.field===f&&c.i<0));
  const records=[], errors=[];
  if(missing.length){
    errors.push({row:0, msg:`缺少必填列:${missing.map(f=>f.label).join('、')}(请使用标准模板,或把表头列名改为 ${missing.map(f=>`"${f.label}"`).join(' / ')})`});
  }
  const enumFields=TF.filter(f=>f.type==='枚举');
  rows.slice(1).forEach((r,ri)=>{
    const lineNo=ri+2;
    const rec={__row:lineNo};
    // 数组值(JSON 中的 options 等)→ 用 " | " 连接,与 CSV 的多选项写法统一
    const cv = v => Array.isArray(v) ? v.map(String).join(' | ') : String(v??'').trim();
    m.cols.forEach(c=>{ rec[c.field.key]= c.i>=0 ? cv(r[c.i]) : ''; });
    m.dyn.forEach(d=>{ rec.__dyn=rec.__dyn||[]; rec.__dyn.push({label:d.label, value:cv(r[d.i])}); });
    // 必填校验
    const miss=[];
    TF.forEach(f=>{ if(f.required && plain(f) && !rec[f.key]) miss.push(f.label); });
    if(miss.length){ errors.push({row:lineNo, msg:`缺少必填内容:${miss.join('、')}`}); return; }
    // 枚举校验
    for(const f of enumFields){
      if(!plain(f)) continue;
      const list=Array.isArray(f.enum)?f.enum:(/题型/.test(f.label)?['单选题','多选题','判断题','填空题','简答题','操作题']
                :/难度/.test(f.label)?['易','中','难']:/性别/.test(f.label)?['男','女']
                :/文档类型/.test(f.label)?['课程大纲','教学日历','教案','讲义','试卷分析','其他文档']
                :/模板类型/.test(f.label)?['course','chapter']:null);
      if(!list) continue;
      const v=rec[f.key]; if(!v) continue;
      const hit=_enumResolve(v,list);
      if(hit) rec[f.key]=hit; else errors.push({row:lineNo, msg:`"${f.label}"取值「${v}」无法识别,应为:${list.join(' / ')}`});
    }
    // 数值校验
    for(const f of TF){
      if(f.type!=='数值' || !plain(f)) continue;
      const v=rec[f.key]; if(!v) continue;
      if(!/^-?\d+(\.\d+)?$/.test(String(v).replace(/[%％]/,''))) errors.push({row:lineNo, msg:`"${f.label}"应为数值,当前为「${v}」`});
    }
    if(!errors.some(e=>e.row===lineNo)) records.push(rec);
  });
  return {records, errors, header, mapped:m.cols, dyn:m.dyn};
}

/* ---------- 各对象的写入规则 ---------- */
function _courseByCode(code){ return store.db.courses.find(c=>(c.code||'')===String(code||'').trim()); }
const APPLY = {
  courseInfo(recs){
    let add=0, upd=0;
    recs.forEach(r=>{
      const c=_courseByCode(r.code);
      const obj={
        credit:r.credit?+r.credit:undefined, hours:r.hours?+r.hours:undefined,
        semester:r.semester?Math.min(8,Math.max(1,+r.semester)):undefined,
        leader:r.leader||undefined, category:r.category||undefined, desc:r.desc||undefined,
        name:r.name||undefined,
        objectives:r.objectives? String(r.objectives).split(/[;\n;；]/).map(s=>s.trim()).filter(Boolean) : undefined
      };
      Object.keys(obj).forEach(k=>obj[k]===undefined&&delete obj[k]);
      if(c){ Object.assign(c,obj); upd++; }
      else { store.addCourse(Object.assign({code:r.code,name:r.name||r.code},obj)); add++; }
    });
    store.save();
    return `新建课程 ${add} 门 / 更新 ${upd} 门`;
  },
  majorPlan(recs){
    const byMajor={};
    recs.forEach(r=>{ const k=r.majorCode+'|'+r.majorName; (byMajor[k]=byMajor[k]||{r,items:[]}).items.push(r); });
    let majors=0, links=0, miss=[];
    Object.values(byMajor).forEach(g=>{
      let m=store.db.majors.find(x=>(x.code||'')===g.r.majorCode || (!x.code && x.name===g.r.majorName));
      if(!m){ m=store.addMajor({code:g.r.majorCode,name:g.r.majorName,leader:g.r.majorLeader||'',desc:'由修读计划模板导入'}); majors++; }
      const list=m.courses.slice();
      g.items.forEach(r=>{
        const c=_courseByCode(r.courseCode);
        if(!c){ miss.push(r.courseCode); return; }
        const sem=Math.min(8,Math.max(1,+(r.semester||1)));
        const ex=list.find(x=>x.courseId===c.id);
        if(ex){ ex.semester=sem; } else list.push({courseId:c.id, semester:sem});
        links++;
      });
      m.courses=list.sort((a,b)=>a.semester-b.semester);
    });
    store.save();
    return `新建专业 ${majors} 个 / 挂接课程 ${links} 条${miss.length?`(未匹配课程代码:${[...new Set(miss)].join('、')})`:''}`;
  },
  chapters(recs){
    let chs=0, upd=0, miss=[];
    recs.forEach(r=>{
      const c=_courseByCode(r.courseCode);
      if(!c){ miss.push(r.courseCode); return; }
      const ex=c.chapters.find(x=>x.title===r.title);
      if(ex){ if(r.hours) ex.hours=+r.hours; upd++; }
      else { store.addChapter(c.id, {title:r.title, hours:r.hours?+r.hours:4, kps:[]}); chs++; }
    });
    // 按"章序号"重排(未带序号的章节保持在末尾原序)
    const spec={};
    recs.forEach(r=>{
      if(!/^\d+$/.test(String(r.chapterNo||''))) return;
      const c=_courseByCode(r.courseCode); if(!c) return;
      (spec[c.id]=spec[c.id]||[]).push({no:+r.chapterNo, title:r.title});
    });
    Object.keys(spec).forEach(cid=>{
      const c=store.course(cid); const rest=c.chapters.slice(); const ordered=[];
      spec[cid].sort((a,b)=>a.no-b.no).forEach(s=>{
        const i=rest.findIndex(x=>x.title===s.title);
        if(i>=0) ordered.push(rest.splice(i,1)[0]);
      });
      if(ordered.length) c.chapters=ordered.concat(rest);
    });
    store.save();
    return `新增章节 ${chs} 个 / 更新 ${upd} 个${miss.length?`(未匹配课程代码:${[...new Set(miss)].join('、')})`:''}`;
  },
  graph(recs){
    let linked=0, miss=0;
    recs.forEach(r=>{
      const s=String(r.source||r.from||'').trim(), t=String(r.target||r.to||'').trim();
      if(!s||!t){ miss++; return; }
      const kpS=store.findKpGlobal(s) || findKpByLabel(s);
      if(!kpS){ miss++; return; }
      let tId = store.findKpGlobal(t) ? t : ((findKpByLabel(t)||{}).kp||{}).id;
      if(!tId){ miss++; return; }
      kpS.kp.links=kpS.kp.links||[];
      if(!kpS.kp.links.includes(tId)){ kpS.kp.links.push(tId); linked++; }
    });
    store.save();
    return `新增知识点关联 ${linked} 条${miss?` / 未匹配 ${miss} 行(请检查节点 id 或名称)`:''}`;
  },
  paper(recs){
    let papers=0, secs=0, hit=0, created=0, miss=[];
    recs.forEach(r=>{
      const c=_courseByCode(r.courseCode);
      if(!c){ miss.push(r.courseCode); return; }
      let p=store.db.papers.find(x=>x.name===r.paperName && x.courseId===c.id);
      if(!p){ p=store.addPaper({name:r.paperName, courseId:c.id, sections:[]}); papers++; }
      let sec=p.sections.find(s=>s.title===r.sectionTitle);
      if(!sec){ sec={title:r.sectionTitle, score:r.sectionScore?+r.sectionScore:5, questionIds:[]}; p.sections.push(sec); secs++; }
      else if(r.sectionScore) sec.score=+r.sectionScore;
      let q=store.db.bank.find(x=>x.courseId===c.id && x.stem===r.stem);
      if(!q){
        if(!r.type) { miss.push(`题干未在题库匹配:「${String(r.stem).slice(0,18)}…」`); return; }
        const typeKey=Object.keys(TYPES).find(t=>TYPES[t].label===r.type)||'short';
        q=store.addQuestion({courseId:c.id, type:typeKey, difficulty:'中', chapter:'', stem:r.stem, options:[], answer:'', analysis:''});
        created++;
      } else hit++;
      if(!sec.questionIds.includes(q.id)) sec.questionIds.push(q.id);
    });
    store.save();
    return `新建试卷 ${papers} 套 / 大题 ${secs} 节；题目匹配 ${hit} 道、自动入库 ${created} 道${miss.length?`；${miss.slice(0,5).join(';')}${miss.length>5?'…':''}`:''}`;
  },
  gradeItems(recs){
    const touched=[];
    let add=0, upd=0, miss=0;
    recs.forEach(r=>{
      let k = r.term ? store.db.classes.find(x=>x.courseId===(_courseByCode(r.courseCode)||{}).id && x.term===r.term)
                     : store.db.classes.find(x=>x.courseId===(_courseByCode(r.courseCode)||{}).id);
      if(!k){ miss++; return; }
      const ex=k.items.find(i=>i.name===r.name);
      if(ex){ ex.weight=+r.weight; if(r.full) ex.full=+r.full; upd++; }
      else { store.addItem(k.id,{name:r.name, weight:+r.weight, full:r.full?+r.full:100}); add++; }
      if(!touched.includes(k.name)) touched.push(k.name);
    });
    store.save();
    return `成绩项:新增 ${add} 项 / 更新权重 ${upd} 项(班级:${touched.join('、')||'—'})${miss?` / 未匹配班级 ${miss} 行`:''}`;
  },
  kpCatalog(recs){
    let addCh=0, addKp=0, skip=0, miss=[];
    recs.forEach(r=>{
      const cid=this.__courseId;
      const c= cid? store.course(cid) : (this.__courseCode? _courseByCode(this.__courseCode) : null);
      if(!c){ return; }
      const chTitle=r.chapter||r.chapterTitle||'未分章';
      let ch=c.chapters.find(x=>x.title===chTitle);
      if(!ch){ ch=store.addChapter(c.id,{title:chTitle,hours:4}); addCh++; }
      if(ch.kps.some(k=>k.title===r.title)){ skip++; return; }
      store.addKp(c.id, ch.id, {title:r.title, content:r.content||''}); addKp++;
    });
    store.save();
    return `新增章节 ${addCh} 个 / 知识点 ${addKp} 条${skip?`(重复跳过 ${skip} 条)`:''}`;
  },
  bank(recs){
    const cid=this.__courseId;
    const c= cid? store.course(cid) : (this.__courseCode? _courseByCode(this.__courseCode): null);
    if(!c) return '未指定课程';
    const exist=store.questions(c.id);
    let n=0, dup=0;
    recs.forEach(r=>{
      const typeKey=Object.keys(TYPES).find(t=>TYPES[t].label===r.type)||'short';
      if(exist.some(q=>q.stem===r.stem && q.type===typeKey)){ dup++; return; }
      const kpName=r.kp||r.kpName||'';
      const kpId=(kpName && c.chapters.flatMap(ch=>ch.kps).find(k=>k.title===kpName)||{}).id||'';
      store.addQuestion({courseId:c.id,type:typeKey,difficulty:r.difficulty||'中',chapter:r.chapter||'',kpId,
        stem:r.stem||'', options:String(r.options||'').split('|').map(s=>s.trim()).filter(Boolean),
        answer:r.answer||'', analysis:r.analysis||''});
      n++;
    });
    return `新增题目 ${n} 道${dup?`(重复跳过 ${dup} 道)`:''}`;
  },
  classes(recs){
    let add=0, skip=0, miss=[];
    recs.forEach(r=>{
      const c=_courseByCode(r.courseCode);
      if(!c){ miss.push(r.courseCode); return; }
      if(store.db.classes.some(k=>k.name===r.name)){ skip++; return; }
      const w=[r.usualW===undefined||r.usualW===''?30:+r.usualW, r.midW===''||r.midW===undefined?20:+r.midW, r.finalW===''||r.finalW===undefined?50:+r.finalW];
      store.addClass({name:r.name, courseId:c.id, term:r.term||store.db.settings.term||'2025-2026-1',
        teacher:r.teacher||store.db.settings.userName||'',
        items:[{id:uid('gi'),name:'平时成绩',weight:w[0],full:100},
               {id:uid('gi'),name:'期中成绩',weight:w[1],full:100},
               {id:uid('gi'),name:'期末成绩',weight:w[2],full:100}], students:[], assignments:[]});
      add++;
    });
    store.save();
    return `新建班级 ${add} 个${skip?`(同名跳过 ${skip})`:''}${miss.length?`(未匹配课程代码:${[...new Set(miss)].join('、')})`:''}`;
  },
  students(recs){
    const k=store.klass(this.__classId); if(!k) return '未选择班级';
    let add=0, upd=0;
    recs.forEach(r=>{
      const ex=k.students.find(s=>(r.sno&&s.sno===r.sno)||(!r.sno&&s.name===r.name));
      if(ex){ if(r.gender) ex.gender=r.gender; if(r.note) ex.note=r.note; upd++; }
      else { k.students.push({id:uid('stu'),sno:r.sno||'',name:r.name||'',gender:r.gender||'',scores:{},note:r.note||''}); add++; }
    });
    store.save();
    return `新增 ${add} 人 / 更新 ${upd} 人`;
  },
  grades(recs){
    const k=store.klass(this.__classId); if(!k) return '未选择班级';
    // 动态列 → 成绩项
    const labels=[];
    recs.forEach(r=>(r.__dyn||[]).forEach(d=>{ if(!labels.includes(d.label)) labels.push(d.label); }));
    const itemOf={};
    labels.forEach(lb=>{
      let it=k.items.find(x=>x.name===lb);
      if(!it) it=store.addItem(this.__classId,{name:lb,weight:0,full:100});
      itemOf[lb]=it;
    });
    let n=0, miss=0;
    recs.forEach(r=>{
      const s=k.students.find(x=>(r.sno&&x.sno===r.sno)||(!r.sno&&r.name===r.name));
      if(!s){ miss++; return; }
      (r.__dyn||[]).forEach(d=>{
        if(d.value==='') return;
        const v=Number(String(d.value).replace(/[%％]/,''));
        if(isFinite(v)) s.scores[itemOf[d.label].id]=v;
      });
      n++;
    });
    store.save();
    return `回填 ${n} 名学生成绩${labels.length?` / 成绩项:${labels.join('、')}`:''}${miss?`(未匹配学生 ${miss} 行)`:''}`;
  },
  assignments(recs){
    const k=store.klass(this.__classId); if(!k) return '未选择班级';
    let n=0, addA=0, miss=0;
    recs.forEach(r=>{
      let a=k.assignments.find(x=>x.title===r.title);
      if(!a){ a=store.addAssignment(this.__classId,{title:r.title, full:r.full?+r.full:100, due:r.due||''}); addA++; }
      const s=k.students.find(x=>(r.sno&&x.sno===r.sno)||(r.name&&x.name===r.name));
      if(!s){ miss++; return; }
      if(r.score!=='' && r.score!==undefined){ a.scores[s.id]=Number(r.score); n++; }
    });
    store.save();
    return `回填 ${n} 条作业成绩 / 新建作业 ${addA} 次${miss?`(未匹配学生 ${miss} 行)`:''}`;
  }
};

/* ---------- 导入流程 UI ---------- */
const ImportKit = {
  _state:null,
  /* 打开导入向导 */
  open(id, opts){
    const sc=SchemaKit.get(id);
    if(!sc){ toast('未知的导入对象'); return; }
    opts=opts||{};
    const needClass = ['students','grades','assignments'].includes(id);
    const needCourse = ['kpCatalog','bank'].includes(id);
    const klassOpts = needClass ? store.db.classes.map(k=>`<option value="${k.id}" ${opts.classId===k.id?'selected':''}>${esc(k.name)} · ${esc((store.course(k.courseId)||{}).name||'')}</option>`).join('') : '';
    const courseOpts = needCourse ? store.db.courses.map(c=>`<option value="${c.id}" ${(opts.courseId||'')===c.id?'selected':''}>${esc(c.name)}${c.code?` (${esc(c.code)})`:''}</option>`).join('') : '';
    openModal(`
      <h3>📥 导入 ${sc.icon||''} ${esc(sc.name)}</h3>
      <p class="mini">${esc(sc.purpose)}</p>
      <div class="import-hint">
        <b>超星对应入口:</b>${esc(sc.chaoxing.entry)}<br>
        <b>支持格式:</b>${sc.formats.map(f=>DF.formats[f]?DF.formats[f].label:f).join(' / ')}　
        <button class="btn small" type="button" onclick="templatesHub.download('${id}','zip')">⬇ 下载标准模板包</button>
        <button class="btn small" type="button" onclick="closeModal();location.hash='#/datatpl/${id}'">📖 查看字段说明</button>
      </div>
      ${needClass?`<label>导入到哪个教学班级</label><select id="imp-cls">${klassOpts||'<option value="">(暂无班级,请先建立班级)</option>'}</select>`:''}
      ${needCourse?`<label>导入到哪门课程</label><select id="imp-course">${courseOpts||'<option value="">(暂无课程)</option>'}</select>`:''}
      <label>① 选择文件(${sc.formats.map(f=>'.'+DF.formats[f].ext).join(' / ')})</label>
      <input type="file" id="imp-file" accept="${DF.accept}">
      <label>② 或直接粘贴内容(CSV / TSV / JSON,含表头行)</label>
      <textarea id="imp-text" style="min-height:120px" placeholder="学号,姓名,性别\n2024010101,张明,男 …"></textarea>
      <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
      <button class="btn primary" onclick="ImportKit.parse()">解析并预览</button></div>`);
    ImportKit._state={id, sc, opts};
  },
  /* 读取 → 校验 → 预览 */
  parse(){
    const st=ImportKit._state; if(!st) return;
    const sc=st.sc;
    const clsEl=document.getElementById('imp-cls'), crsEl=document.getElementById('imp-course');
    const ctx={ __classId: clsEl? clsEl.value : '', __courseId: crsEl? crsEl.value : '' };
    const f=document.getElementById('imp-file').files[0];
    const txt=document.getElementById('imp-text').value.trim();
    const handle = data => {
      if(data.format==='json'){
        const j=data.json;
        const sch=String((j&&j.schema)||'');
        const isTableTpl=/^dlufe-kb\/table-template/.test(sch);
        // 结构化对象(JSON Schema 型)走专属导入
        if(!isTableTpl && (sc.rowShape==='json' || (sch && JSON_IMPORT[st.id]))){ ImportKit.previewJSON(sc, j, ctx); return; }
        const list = Array.isArray(j) ? j
          : (j && (j.questions||j.rows||j.data||j.documents||j.templates||j.nodes)) || null;
        if(!Array.isArray(list)){ toast('该对象的 JSON 应为对象数组,或含 questions/rows/data 数组字段'); return; }
        const {rows}=DF.rowsFromObjects(list);
        ImportKit.preview(sc, rows, ctx, 'json');
        return;
      }
      if(data.format==='md'){
        toast('Markdown 单文件请使用「教学文档」模块右上角的「导入 Markdown」按钮'); return;
      }
      if(!data.rows || !data.rows.length){ toast('文件内容为空'); return; }
      ImportKit.preview(sc, data.rows, ctx, data.format);
    };
    if(f){ DF.readFile(f).then(handle).catch(e=>toast(e.message||'文件读取失败')); return; }
    if(txt){
      if(txt.startsWith('{')||txt.startsWith('[')){
        try{ handle({format:'json', json:JSON.parse(txt)}); }catch(e){ toast('JSON 解析失败'); }
      }else{
        const delim=DF.sniffDelim(txt);
        handle({format:delim==='\t'?'tsv':'csv', rows:DF.parseDelim(txt,delim)});
      }
      return;
    }
    toast('请选择文件或粘贴内容');
  },
  preview(sc, rows, ctx, fmt){
    const {records, errors, mapped, dyn}=_rowsToRecords(sc, rows);
    const head=(rows[0]||[]).map(String);
    const maxShow=8;
    const headCells = head.map(h=>{
      const hit=(mapped||[]).find(m=>m.i>=0 && String(rows[0][m.i])===String(h));
      const isDyn=(dyn||[]).some(d=>String(rows[0][d.i])===String(h));
      return `<th class="${hit?'ok':isDyn?'dyn':'miss'}">${esc(h)}${isDyn?' <span class="mini">(动态列)</span>':''}</th>`;
    }).join('');
    const bodyRows = records.slice(0,maxShow).map(r=>{
      const cells=rows[r.__row-1]||[];
      return `<tr>${head.map((_,i)=>`<td>${esc(cells[i]??'')}</td>`).join('')}</tr>`;
    }).join('');
    const errBox = errors.length ? `
      <div class="import-errors">
        <b>⚠ 发现 ${errors.length} 处问题</b>
        <div class="table-wrap" style="max-height:180px;overflow:auto"><table><thead><tr><th style="width:80px">行号</th><th>问题</th></tr></thead><tbody>
        ${errors.slice(0,40).map(e=>`<tr><td>${e.row?('第 '+e.row+' 行'):'表头'}</td><td>${esc(e.msg)}</td></tr>`).join('')}
        </tbody></table></div>
        ${errors.length>40?`<div class="mini">…另有 ${errors.length-40} 处问题未显示</div>`:''}
        <div class="mini">提示:存在的问题行会被跳过,其余行仍可正常导入。</div>
      </div>` : `<div class="import-ok">✅ 校验通过:共 ${records.length} 条记录,无格式错误</div>`;
    ImportKit._pending={sc, ctx, records, id:ImportKit._state.id, fmt};
    openModal(`
      <h3>🔍 导入预览与校验 — ${esc(sc.name)}</h3>
      <p class="mini">识别格式:<b>${(DF.formats[fmt]||{label:fmt}).label}</b>　可导入记录:<b>${records.length}</b> 条　问题:<b>${errors.length}</b> 处</p>
      ${errBox}
      <div class="table-wrap" style="max-height:260px;overflow:auto;margin-top:10px">
        <table><thead><tr>${headCells}</tr></thead><tbody>${bodyRows||'<tr><td class="empty">无有效数据行</td></tr>'}</tbody></table>
      </div>
      <div class="modal-foot">
        <button class="btn" onclick="closeModal()">取消</button>
        <button class="btn" onclick="ImportKit.open('${ImportKit._state.id}',{classId:'${ctx.__classId}',courseId:'${ctx.__courseId}'})">重新选择文件</button>
        <button class="btn primary" ${records.length?'':'disabled'} onclick="ImportKit.commit()">确认导入 ${records.length} 条</button>
      </div>`);
  },
  previewJSON(sc, obj, ctx){
    ImportKit._pending={sc, ctx, json:obj, id:ImportKit._state.id, fmt:'json'};
    const pretty=DF.json(obj);
    openModal(`
      <h3>🔍 导入预览 — ${esc(sc.name)}</h3>
      <div class="import-ok">✅ JSON 结构已解析,请确认内容后导入</div>
      <pre class="code-preview">${esc(pretty.slice(0,2600))}${pretty.length>2600?'\n…(已截断显示)':''}</pre>
      <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
      <button class="btn" onclick="ImportKit.open('${ImportKit._state.id}',{})">重新选择</button>
      <button class="btn primary" onclick="ImportKit.commitJSON()">确认导入</button></div>`);
  },
  commit(){
    const p=ImportKit._pending; if(!p) return;
    const fn=APPLY[p.id];
    if(!fn){ toast('该对象暂不支持表格导入,请使用 JSON 模板'); return; }
    let msg='';
    try{ msg=fn.call(p.ctx, p.records)||'导入完成'; }
    catch(e){ toast('导入失败:'+(e.message||e)); return; }
    store.log('import', p.sc.name, msg, p.records.length);
    closeModal(); toast(`导入完成 — ${msg}`); if(window.route) route();
  },
  commitJSON(){
    const p=ImportKit._pending; if(!p) return;
    const jsonFn=JSON_IMPORT[p.id];
    if(!jsonFn){ toast('该对象暂不支持 JSON 导入'); return; }
    let msg='';
    try{ msg=jsonFn(p.json, p.ctx)||'导入完成'; }
    catch(e){ toast('导入失败:'+(e.message||e)); return; }
    store.log('import', p.sc.name, msg, 1);
    closeModal(); toast(`导入完成 — ${msg}`); if(window.route) route();
  }
};

/* ---------- JSON 型对象的导入 ---------- */
const JSON_IMPORT = {
  coursePackage(obj){
    if(!String(obj.schema||'').startsWith('dlufe-kb/course')) throw new Error('需 dlufe-kb/course/v1 格式');
    const c=JSON.parse(JSON.stringify(obj.course||{}));
    if(!c.name) throw new Error('课程包缺少 course.name');
    const idMap={}; c.id=uid('c');
    (c.chapters||[]).forEach(ch=>{ const o=ch.id; ch.id=uid('ch'); idMap[o]=ch.id;
      (ch.kps||[]).forEach(k=>{ const ok=k.id; k.id=uid('kp'); idMap[ok]=k.id; }); });
    (c.chapters||[]).forEach(ch=>(ch.kps||[]).forEach(k=>k.links=(k.links||[]).map(l=>idMap[l]).filter(Boolean)));
    c.semester=c.semester||1; c.leader=c.leader||''; c.chapters=c.chapters||[]; c.objectives=c.objectives||[];
    store.db.courses.push(c);
    (obj.bank||[]).forEach(q=>store.db.bank.push(Object.assign({},q,{id:uid('q'),courseId:c.id})));
    (obj.papers||[]).forEach(p=>store.db.papers.push(Object.assign({},p,{id:'p_'+uid('p'),courseId:c.id})));
    store.save();
    return `导入课程《${c.name}》(含 ${(obj.bank||[]).length} 题 / ${(obj.papers||[]).length} 卷)`;
  },
  majorPackage(obj){
    const packs = String(obj.schema||'').startsWith('dlufe-kb/majors') ? (obj.majors||[]) : [obj];
    let majors=0, courses=0, reused=0, groups=0;
    packs.forEach(p=>{
      const m=p.major||{};
      const nM=store.addMajor({name:m.name||'导入专业',code:m.code||'',leader:m.leader||'',desc:m.desc||''}); majors++;
      const codeToCid={};
      (p.courses||[]).forEach(item=>{
        const src=item.course; if(!src) return;
        let cid, exist=(src.code||'')? store.db.courses.find(c=>c.code===src.code): null;
        if(exist){ cid=exist.id; reused++; }
        else{
          const c=JSON.parse(JSON.stringify(src)); c.id=uid('c'); const map={};
          (c.chapters||[]).forEach(ch=>{ const o=ch.id; ch.id=uid('ch'); map[o]=ch.id;
            (ch.kps||[]).forEach(k=>{ const ok=k.id; k.id=uid('kp'); map[ok]=k.id; }); });
          (c.chapters||[]).forEach(ch=>(ch.kps||[]).forEach(k=>k.links=(k.links||[]).map(l=>map[l]).filter(Boolean)));
          store.db.courses.push(c); cid=c.id; courses++;
        }
        nM.courses.push({courseId:cid, semester:Math.min(8,Math.max(1,+item.semester||1))});
        if(src.code) codeToCid[src.code]=cid;
      });
      (p.groups||[]).forEach(g=>{
        store.addGroup({majorId:nM.id, name:g.name||'导入课程群', leader:g.leader||'', desc:g.desc||'',
          courseIds:(g.courseCodes||[]).map(cd=>codeToCid[cd]||((store.db.courses.find(c=>c.code===cd)||{}).id)).filter(Boolean)});
        groups++;
      });
    });
    store.save();
    return `导入专业 ${majors} 个 / 新建课程 ${courses} 门 / 复用已有 ${reused} 门 / 课程群 ${groups} 个`;
  },
  graph(obj){
    const nodes=obj.nodes||[], edges=obj.edges||[];
    let linked=0, miss=0; const nodeMap={};
    nodes.forEach(n=>{
      const kp=store.findKpGlobal(n.id) || (n.label? findKpByLabel(n.label, n.course): null);
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
    store.save();
    return `新增关联 ${linked} 条${miss?` / 未匹配节点 ${miss} 个`:''}`;
  },
  bank(obj){
    const qs=obj.questions||obj;
    if(!Array.isArray(qs)) throw new Error('需 {schema,questions:[…]} 或题目数组');
    let n=0;
    qs.forEach(q=>{
      const typeKey=Object.keys(TYPES).find(t=>TYPES[t].label===q.type||t===q.type)||'short';
      const cid=q.courseId||(store.db.courses[0]||{}).id;
      store.addQuestion(Object.assign({},q,{id:uid('q'),courseId:cid,type:typeKey,
        options:Array.isArray(q.options)?q.options:String(q.options||'').split('|').map(s=>s.trim()).filter(Boolean)}));
      n++;
    });
    return `导入题目 ${n} 道`;
  },
  documents(obj){
    const docs=obj.documents||obj.docs||(Array.isArray(obj)?obj:null);
    if(!Array.isArray(docs)) throw new Error('需 {schema:"dlufe-kb/docs/v1", documents:[…]}');
    let n=0;
    docs.forEach(d=>{
      const c=(d.courseCode? store.db.courses.find(x=>x.code===d.courseCode):null) || store.db.courses[0];
      if(!c) return;
      const type=Object.keys(DOC_TYPES).find(k=>DOC_TYPES[k].label===d.type||k===d.type)||'other';
      let chapterId='';
      if(d.chapterTitle){ const ch=c.chapters.find(x=>x.title===d.chapterTitle); if(ch) chapterId=ch.id; }
      store.addDocument({courseId:c.id, chapterId, type, title:d.title||'导入文档', content:d.content||'', sourceTpl:d.sourceTpl||''});
      n++;
    });
    return `导入教学文档 ${n} 篇`;
  },
  templates(obj){
    const list=obj.templates||obj;
    if(!Array.isArray(list)) throw new Error('需 {schema:"dlufe-kb/templates/v1", templates:[…]}');
    let n=0;
    list.forEach(t=>{ if(t.name&&t.content!==undefined){ store.addTemplate({name:t.name,type:t.type==='chapter'?'chapter':'course',content:t.content}); n++; } });
    return `导入文档模板 ${n} 个`;
  },
  aiResult(obj){
    if(!String(obj.schema||'').startsWith('dlufe-kb-ai')) throw new Error('需 dlufe-kb-ai/v1 格式');
    const course=store.db.courses.find(c=>c.code===obj.courseCode)||store.db.courses[0];
    if(!course) throw new Error('未找到匹配课程');
    let okKp=0, okQ=0;
    (obj.kps||[]).forEach(k=>{
      let ch=course.chapters.find(x=>x.title===(k.chapterTitle||k.chapter));
      if(!ch) ch=store.addChapter(course.id,{title:k.chapterTitle||k.chapter||'AI 新章节',hours:4});
      if(!ch.kps.some(x=>x.title===k.title)){ store.addKp(course.id, ch.id, {title:k.title, content:k.content||''}); okKp++; }
    });
    (obj.questions||[]).forEach(q=>{
      const typeKey=Object.keys(TYPES).find(t=>TYPES[t].label===q.type||t===q.type)||'short';
      const kpId=(course.chapters.flatMap(ch=>ch.kps).find(k=>k.title===(q.kp||q.kpName))||{}).id||'';
      store.addQuestion({courseId:course.id,type:typeKey,difficulty:_enumResolve(q.difficulty,['易','中','难'])||'中',
        chapter:q.chapterTitle||q.chapter||'', kpId, stem:q.stem||'',
        options:Array.isArray(q.options)?q.options:String(q.options||'').split('|').map(s=>s.trim()).filter(Boolean),
        answer:q.answer||'', analysis:q.analysis||''});
      okQ++;
    });
    return `知识点 ${okKp} 条 / 题目 ${okQ} 道 →《${course.name}》`;
  },
  backup(obj){
    if(!obj.courses||!obj.majors) throw new Error('备份文件缺少 courses/majors');
    confirm('恢复备份将覆盖当前全部数据,确定继续?') && (store.db=obj, store.save());
    return '已恢复全库备份';
  }
};
