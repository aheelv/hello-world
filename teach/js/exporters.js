/* 导入导出 / 模板引擎 / AI 接口 / 教学平台适配器 */
const TYPES = {
  single:{label:'单选题', hasOptions:true},
  multi:{label:'多选题', hasOptions:true},
  judge:{label:'判断题', hasOptions:false},
  blank:{label:'填空题', hasOptions:false},
  short:{label:'简答题', hasOptions:false},
  op:{label:'操作题', hasOptions:false}
};

/* ---------------- 平台适配器(可插拔) ---------------- */
const PlatformAdapter = {
  exportCourse(course, questions){ throw new Error('未实现'); }
};
const ChaoxingAdapter = Object.create(PlatformAdapter);
ChaoxingAdapter.name = '超星(学习通)';
ChaoxingAdapter.exportCourse = function(course, questions){
  return {
    adapter:'chaoxing', version:'1.0', exportedAt:new Date().toISOString(),
    course:{ name:course.name, code:course.code, credit:course.credit, hours:course.hours },
    // 学习通"章节"结构:章 → 节(知识点)
    chapters: course.chapters.map(ch=>({
      title: ch.title, hours: ch.hours,
      sections: ch.kps.map(k=>({ title:k.title, content:k.content }))
    })),
    // 学习通题库导入格式(简化映射,可直接二次加工)
    questionBank: questions.map(q=>({
      questionType: {single:'单选题',multi:'多选题',judge:'判断题',blank:'填空题',short:'简答题',op:'实践题'}[q.type]||'简答题',
      difficulty: q.difficulty, stem: q.stem, options: q.options, answer: q.answer, analysis: q.analysis
    }))
  };
};
const YuketangAdapter = Object.create(PlatformAdapter);
YuketangAdapter.name = '雨课堂(预留)';
YuketangAdapter.exportCourse = function(course, questions){
  return { adapter:'yuketang', note:'预留接口:按雨课堂开放平台格式对接', course:{name:course.name}, chapters:course.chapters.map(c=>c.title) };
};
const PLATFORMS = { chaoxing:ChaoxingAdapter, yuketang:YuketangAdapter };

/* ---------------- 模板注册表 ---------------- */
const TemplateRegistry = {
  all(){ return store.db.templates; },
  render(tpl, course, chapter){
    const c = course;
    const ch = chapter || c.chapters[0] || {title:'',kps:[]};
    const majors = store.majorOfCourse(c.id).map(m=>m.name).join('、')||'未挂接';
    const chaptersTable = c.chapters.map(x=>
      `| ${x.title} | ${x.kps.map(k=>k.title).join('、')||'-'} | ${x.hours} |`).join('\n');
    const calendarRows = c.chapters.map((x,i)=>{
      const per = Math.max(1, Math.ceil(x.hours/4));
      return `| 第${i*per+1}-${(i+1)*per} 周 | ${x.title}(${x.kps.map(k=>k.title).join(';')}) | ${x.hours} | 课后习题 |`;
    }).join('\n');
    const bankRows = store.questions(c.id).map((q,i)=>{
      return `**${i+1}. [${TYPES[q.type].label}·${q.difficulty}]** ${q.stem}\n\n- 参考答案:${q.answer}\n`;
    }).join('\n');
    const kpContents = ch.kps.map(k=>`## ${k.title}\n\n${k.content||'(暂无内容)'}\n`).join('\n---\n\n');
    const map = {
      'course.name':c.name,'course.code':c.code,'course.credit':c.credit,'course.hours':c.hours,
      'course.desc':c.desc,'course.majors':majors,'course.semester':c.semester||1,'course.leader':c.leader||'-',
      'course.objectives':(c.objectives||[]).map((o,i)=>`${i+1}. ${o}`).join('\n'),
      'chapters.table':chaptersTable,'calendar.rows':calendarRows,'bank.rows':bankRows||'(题库为空)',
      'chapter.title':ch.title,
      'chapter.kpTitles':ch.kps.map(k=>k.title).join('、'),
      'chapter.firstKp':ch.kps[0]?ch.kps[0].title:'-',
      'chapter.kpContents':kpContents
    };
    let out = tpl.content;
    for(const k in map) out = out.split('{{'+k+'}}').join(map[k]);
    return out;
  }
};

/* ---------------- 课程导出 ---------------- */
const exporters = {
  coursePackage(cid){ // 完整课程包(含图谱)
    const c = store.course(cid);
    const nodes=[], edges=[];
    c.chapters.forEach(ch=>ch.kps.forEach(k=>{
      nodes.push({id:k.id, label:k.title, chapter:ch.title, course:c.name, content:k.content});
      (k.links||[]).forEach(l=>edges.push({source:k.id,target:l}));
    }));
    const pkg = {
      schema:'dlufe-kb/course/v1', exportedAt:new Date().toISOString(),
      course:{...c},
      graph:{nodes, edges},
      bank: store.questions(cid),
      papers: store.db.papers.filter(p=>p.courseId===cid)
    };
    download(`${c.name}-课程包.json`, JSON.stringify(pkg,null,2), 'application/json');
    toast('课程包已导出(课程+图谱+题库+卷库)');
  },

  graphJson(cid){
    const pkg = this._graphOf(cid);
    download(`${pkg.name}-知识图谱.json`, JSON.stringify({nodes:pkg.nodes,edges:pkg.edges},null,2),'application/json');
    toast('知识图谱 JSON 已导出');
  },
  graphJsonCourses(ids, name){
    const pkg = this._graphOfCourses(ids);
    download(`${name}-知识图谱.json`, JSON.stringify({nodes:pkg.nodes,edges:pkg.edges},null,2),'application/json');
    toast('知识图谱 JSON 已导出');
  },
  /* 通用:按课程 id 集合构建图谱 */
  _graphOfCourses(courseIds){
    const nodes=[],edges=[];
    store.db.courses.filter(c=>courseIds.includes(c.id)).forEach(c=>c.chapters.forEach(ch=>ch.kps.forEach(k=>{
      nodes.push({id:k.id,label:k.title,group:c.name,chapter:ch.title});
      (k.links||[]).forEach(l=>{ if(l) edges.push({source:k.id,target:l}); });
    })));
    return {name:'课程集',nodes,edges};
  },
  _graphOf(cid){
    if(cid) return this._graphOf1(cid);
    const r = this._graphOfCourses(store.db.courses.map(c=>c.id));
    r.name='全部课程'; return r;
  },
  _graphOf1(cid){
    const nodes=[],edges=[];
    const c = store.course(cid);
    c.chapters.forEach(ch=>ch.kps.forEach(k=>{
      nodes.push({id:k.id,label:k.title,group:c.name,chapter:ch.title});
      (k.links||[]).forEach(l=>{ if(l) edges.push({source:k.id,target:l}); });
    }));
    return {name:c.name,nodes,edges};
  },

  tpl(tplId, cid, chId){
    const tpl = store.db.templates.find(t=>t.id===tplId);
    const c = store.course(cid);
    const ch = chId? store.chapter(cid, chId) : (c.chapters[0]||null);
    const md = TemplateRegistry.render(tpl, c, ch);
    download(`${c.name}-${tpl.name}.md`, md, 'text/markdown');
    toast(`${tpl.name} 已导出(Markdown)`);
  },

  bankJson(cid){
    const qs = store.questions(cid);
    const name = cid? store.course(cid).name : '全部课程';
    download(`${name}-题库.json`, JSON.stringify({schema:'dlufe-kb/bank/v1',questions:qs},null,2),'application/json');
    toast('题库 JSON 已导出');
  },
  bankCsv(cid){
    const qs = store.questions(cid);
    const rows = [['题型','难度','章节','题干','选项(|分隔)','答案','解析']];
    qs.forEach(q=>rows.push([TYPES[q.type].label,q.difficulty,q.chapter||'',q.stem,q.options.join(' | '),q.answer,q.analysis]));
    const csv = '\ufeff'+rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n');
    const name = cid? store.course(cid).name : '全部课程';
    download(`${name}-题库.csv`, csv, 'text/csv');
    toast('题库 CSV 已导出(可用 Excel 打开)');
  },
  paper(pid){
    const p = store.paper(pid);
    const c = store.course(p.courseId);
    let md = `# ${p.name}\n\n课程:${c?c.name:'-'}\n\n`;
    let total = 0;
    p.sections.forEach(s=>{
      md += `## ${s.title}\n\n`;
      s.questionIds.forEach((qid,i)=>{
        const q = store.db.bank.find(x=>x.id===qid); if(!q) return;
        total += Number(s.score||0);
        md += `**${i+1}.** ${q.stem}\n\n`;
        q.options.forEach(o=>md+=`- ${o}\n`);
        md += `\n> 答案:${q.answer}\n> 解析:${q.analysis}\n\n`;
      });
    });
    md += `\n---\n总分参考:${total} 分`;
    download(`${p.name}.md`, md, 'text/markdown');
    toast('试卷已导出');
  },

  /* ---------------- AI 接口 ---------------- */
  exportKpsForAI(cid){ // 导出知识点清单供 AI 加工(扩充题目/讲义)
    const c = store.course(cid);
    const list=[];
    c.chapters.forEach(ch=>ch.kps.forEach(k=>list.push({chapterTitle:ch.title,title:k.title,content:k.content})));
    download(`${c.name}-AI加工清单.json`, JSON.stringify({
      schema:'dlufe-kb-ai/v1', courseCode:c.code, kps:list, questions:[],
      _prompt:'可将本清单交给大模型,请其按 dlufe-kb-ai/v1 schema 批量生成题目或讲义,再用"AI 结果导入"回收。'
    },null,2),'application/json');
    toast('AI 加工清单已导出');
  },
  importAIResult(){ // 弹窗:粘贴或选择文件导入 AI 结果
    openModal(`
      <h3>📥 导入 AI 生成结果(dlufe-kb-ai/v1)</h3>
      <p style="color:var(--muted);font-size:12.5px">支持大模型产出的知识点(kps)与题目(questions);知识点按"章节标题"自动归位,题目按题型/难度/知识点挂接。</p>
      <label>选择 JSON 文件</label><input type="file" id="ai-file" accept=".json">
      <label>或直接粘贴 JSON</label>
      <textarea id="ai-text" style="min-height:160px" placeholder='{"schema":"dlufe-kb-ai/v1","courseCode":"BX211001","kps":[...],"questions":[...]}'></textarea>
      <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
      <button class="btn primary" onclick="exporters._doImportAI()">导入</button></div>`);
  },
  _doImportAI(){
    const done = txt=>{
      let data; try{ data=JSON.parse(txt); }catch(e){ toast('JSON 解析失败'); return; }
      if(!String(data.schema||'').startsWith('dlufe-kb-ai')){ toast('Schema 不匹配,需 dlufe-kb-ai/v1'); return; }
      const course = store.db.courses.find(c=>c.code===data.courseCode) || store.db.courses[0];
      if(!course){ toast('未找到匹配课程'); return; }
      let okKp=0, okQ=0;
      (data.kps||[]).forEach(k=>{
        let ch = course.chapters.find(x=>x.title===k.chapterTitle);
        if(!ch){ ch = store.addChapter(course.id,{title:k.chapterTitle||'AI 新章节',hours:4}); }
        if(!ch.kps.some(x=>x.title===k.title)){ store.addKp(course.id, ch.id, {title:k.title, content:k.content||''}); okKp++; }
      });
      (data.questions||[]).forEach(q=>{
        const typeKey = Object.keys(TYPES).find(t=>TYPES[t].label===q.type)||'short';
        const kpId = (course.chapters.flatMap(ch=>ch.kps).find(k=>k.title===q.kp)||{}).id||'';
        store.addQuestion({courseId:course.id,type:typeKey,difficulty:q.difficulty||'中',chapter:q.chapterTitle||'',kpId:kpId,stem:q.stem||'',options:q.options||[],answer:q.answer||'',analysis:q.analysis||''});
        okQ++;
      });
      closeModal(); toast(`AI 导入完成:知识点 ${okKp} 条、题目 ${okQ} 条 →《${course.name}》`);
      if(window.route) route();
    };
    const f = document.getElementById('ai-file').files[0];
    if(f){ const r=new FileReader(); r.onload=()=>done(r.result); r.readAsText(f); }
    else done(document.getElementById('ai-text').value);
  },

  /* ---------------- 教学平台导出 ---------------- */
  exportPlatform(key, cid){
    const c = store.course(cid);
    const adapter = PLATFORMS[key];
    const data = adapter.exportCourse(c, store.questions(cid));
    download(`${c.name}-${adapter.name}适配包.json`, JSON.stringify(data,null,2),'application/json');
    toast(`已按 ${adapter.name} 格式导出`);
  },

  /* ---------------- 全库备份 / 恢复 / 题库导入 ---------------- */
  fullBackup(){
    download(`知识库全量备份-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(store.db,null,2),'application/json');
    toast('全库备份已导出');
  },
  restore(){
    const f=document.createElement('input'); f.type='file'; f.accept='.json';
    f.onchange=()=>{ const r=new FileReader();
      r.onload=()=>{ try{ const db=JSON.parse(r.result);
        if(!db.courses||!db.majors) throw 0;
        store.db=db; store.save(); toast('恢复成功'); location.hash='#/dashboard'; route();
      }catch(e){ toast('备份文件格式不正确'); } };
      r.readAsText(f.files[0]); };
    f.click();
  },
  importBank(){
    // 统一走导入向导:支持 CSV / TSV / Excel(.xlsx) / JSON,并自动校验与预览
    ImportKit.open('bank', {courseId:(store.db.courses[0]||{}).id});
  },
  _doImportBank(){
    const cid = document.getElementById('ib-course').value;
    const add = q=>{ store.addQuestion({courseId:cid,type:q.type||'short',difficulty:q.difficulty||'中',chapter:q.chapter||'',kpId:q.kpId||'',stem:q.stem||'',options:q.options||[],answer:q.answer||'',analysis:q.analysis||''}); return true; };
    const jf = document.getElementById('ib-json').files[0];
    const cf = document.getElementById('ib-csv').files[0];
    let n=0;
    const finish = ()=>{ closeModal(); toast(`题库导入完成:${n} 题`); if(window.route) route(); };
    if(jf){ const r=new FileReader(); r.onload=()=>{ try{ const d=JSON.parse(r.result);
        (d.questions||d||[]).forEach(q=>{ if(add(q)) n++; }); finish();
      }catch(e){ toast('JSON 解析失败'); } }; r.readAsText(jf); return; }
    if(cf){ const r=new FileReader(); r.onload=()=>{ try{
        const lines = r.result.replace(/^\ufeff/,'').split(/\r?\n/).filter(Boolean);
        const typeMap={'单选题':'single','多选题':'multi','判断题':'judge','填空题':'blank','简答题':'short','操作题':'op','实践题':'op'};
        lines.slice(1).forEach(line=>{
          const cells = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map(s=>s.replace(/,$/,'').replace(/^"|"$/g,'').replace(/""/g,'"'))||[];
          if(!cells[3]) return;
          add({type:typeMap[cells[0]]||'short',difficulty:cells[1]||'中',chapter:cells[2],stem:cells[3],
               options:(cells[4]||'').split('|').map(s=>s.trim()).filter(Boolean),answer:cells[5]||'',analysis:cells[6]||''});
          n++;
        });
        finish();
      }catch(e){ toast('CSV 解析失败'); } }; r.readAsText(cf); return; }
    toast('请选择文件');
  }
};
