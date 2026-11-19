/* 教学文档中心 v1:在线编写与编辑 · 模板生成落库 · 版本 · 导入导出 · 打印
   与模板中心(templates)、课程详情、教师工作台双向打通,构成"模板→文档→导出/打印→反存模板"闭环 */

function docTypeMeta(type){ return DOC_TYPES[type] || DOC_TYPES.other; }
function docWordCount(s){ return String(s||'').replace(/\s/g,'').length; }
const docFilterState = { course:'', type:'', kw:'' };

/* ================= 列表 ================= */
function viewDocs(){
  const {course:courseF, type:typeF} = docFilterState;
  let list = store.db.documents.slice();
  if(courseF) list = list.filter(d=>d.courseId===courseF);
  if(typeF) list = list.filter(d=>d.type===typeF);
  list.sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));
  const canNew = auth.can('docs')==='w';
  const byType={}; store.db.documents.forEach(d=>byType[d.type]=(byType[d.type]||0)+1);
  return `
  <div class="page-head"><div><h1>教学文档</h1>
    <div class="sub">大纲 / 教案 / 教学日历 / 讲义 — 在线编写与编辑,实时预览公式;与模板同源,可随时导出、打印、导入回流</div></div>
    <div class="row">
      <button class="btn" style="display:${canNew?'':'none'}" onclick="viewDoc.genModal()">🧩 从模板生成</button>
      <button class="btn" style="display:${canNew?'':'none'}" onclick="viewDoc.importMd()">📥 导入 Markdown</button>
      <button class="btn primary" style="display:${canNew?'':'none'}" onclick="viewDoc.blankModal()">＋ 新建文档</button>
    </div></div>

  <div class="grid cols4">
    <div class="stat accent"><div class="num">${store.db.documents.length}</div><div class="lbl">文档总数</div></div>
    ${['syllabus','calendar','lesson','handout'].map(t=>`
      <div class="stat"><div class="num">${byType[t]||0}</div><div class="lbl">${docTypeMeta(t).icon} ${docTypeMeta(t).label}</div></div>`).slice(0,3).join('')}
  </div>

  <div class="card">
    <div class="row" style="margin-bottom:10px">
      <select id="d-fc" style="width:auto" onchange="docFilterState.course=this.value;route()">
        <option value="">全部课程</option>${store.db.courses.map(c=>`<option value="${c.id}" ${courseF===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select>
      <select id="d-ft" style="width:auto" onchange="docFilterState.type=this.value;route()">
        <option value="">全部类型</option>${Object.entries(DOC_TYPES).map(([k,v])=>`<option value="${k}" ${typeF===k?'selected':''}>${v.icon} ${v.label}</option>`).join('')}</select>
      <input id="d-kw" placeholder="🔍 搜索标题或内容…" style="width:220px" value="${esc(docFilterState.kw)}" oninput="docFilterState.kw=this.value;docQuickFilter()">
      <div class="spacer"></div>
      <span class="mini">共 ${list.length} 篇</span>
    </div>
    ${list.length? `<div class="table-wrap"><table><thead><tr><th>文档</th><th>课程</th><th>类型</th><th>章节</th><th>更新时间</th><th>字数</th><th style="width:150px">操作</th></tr></thead><tbody id="doc-list">
    ${list.map(d=>{ const c=store.course(d.courseId); const ch=d.chapterId?store.chapter(d.courseId,d.chapterId):null; const m=docTypeMeta(d.type); const kw=(docFilterState.kw||'').toLowerCase();
      return `<tr class="doc-row" data-k="${esc((d.title+' '+(d.content||'')).toLowerCase())}" style="${kw&&!(d.title+' '+(d.content||'')).toLowerCase().includes(kw)?'display:none':''}">
        <td><a href="#/doc/${d.id}" style="color:var(--primary);font-weight:600;text-decoration:none">${esc(d.title)}</a></td>
        <td>${esc(c?c.name:'-')}</td>
        <td><span class="tag blue">${m.icon} ${m.label}</span></td>
        <td class="mini">${esc(ch?ch.title:'-')}</td>
        <td class="mini">${esc(d.updatedAt||'-')}</td>
        <td class="mini">${docWordCount(d.content)}</td>
        <td class="row" style="flex-wrap:nowrap">
          <a class="btn small" href="#/doc/${d.id}" style="text-decoration:none">${W('docs',d)?'编辑':'查看'}</a>
          <button class="btn small" onclick="viewDoc.exportMd('${d.id}')">导出</button>
          <button class="btn small danger" style="display:${W('docs',d)?'':'none'}" onclick="viewDoc.del('${d.id}',1)">删除</button></td></tr>`; }).join('')}
    </tbody></table></div>` : '<div class="empty">暂无文档 — 点右上角「从模板生成」一键产出大纲/教案/日历,或「新建文档」空白编写</div>'}
  </div>`;
}
function docQuickFilter(){
  const kw=(docFilterState.kw||'').toLowerCase();
  document.querySelectorAll('#doc-list .doc-row').forEach(r=>{
    r.style.display = (!kw || (r.dataset.k||'').includes(kw)) ? '' : 'none';
  });
}

/* ================= 编辑器 ================= */
function viewDocEditor(id){
  const d = store.document(id);
  if(!d) return '<div class="card empty">文档不存在或已删除</div>';
  const c = store.course(d.courseId);
  const canW = W('docs', d);
  const m = docTypeMeta(d.type);
  const chapterOpts = c? c.chapters.map(ch=>`<option value="${ch.id}" ${d.chapterId===ch.id?'selected':''}>${esc(ch.title)}</option>`).join('') : '';
  return `
  <div class="crumb"><a href="#/docs" style="color:var(--primary);text-decoration:none">教学文档</a> / ${esc(d.title)}</div>
  <div class="page-head"><div>
    <h1>${m.icon} ${esc(d.title)}</h1>
    <div class="sub">《${esc(c?c.name:'-')}》 · ${m.label} · 更新于 ${esc(d.updatedAt||'-')} · <span id="doc-count">${docWordCount(d.content)}</span> 字${d.sourceTpl?` · 源自模板`:''}</div>
  </div>
    <div class="row">
      <button class="btn small" onclick="location.hash='#/docs'">← 列表</button>
      ${(d.versions&&d.versions.length)?`<button class="btn small" onclick="viewDoc.versionModal('${id}')">🕘 版本历史(${d.versions.length})</button>`:''}
      <button class="btn small" onclick="viewDoc.print('${id}')">🖨 打印/PDF</button>
      <button class="btn small" onclick="viewDoc.exportMd('${id}')">⬇ Markdown</button>
      <button class="btn small" onclick="viewDoc.exportHtml('${id}')">⬇ HTML</button>
      ${canW?`<button class="btn small" onclick="viewDoc.saveAsTpl('${id}')">存为模板</button>
      <button class="btn small" onclick="viewDoc.dup('${id}')">另存副本</button>
      <button class="btn small danger" onclick="viewDoc.del('${id}')">删除</button>
      <button class="btn primary" onclick="viewDoc.save('${id}')">💾 保存</button>`:''}
    </div></div>

  <div class="card doc-meta">
    ${canW? `<div class="grid cols4">
        <div><label>文档标题</label><input id="doc-title" value="${esc(d.title)}"></div>
        <div><label>归属课程</label><select id="doc-course" onchange="viewDoc.onCourse('${id}',this.value)">${store.db.courses.map(x=>`<option value="${x.id}" ${d.courseId===x.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>
        <div><label>文档类型</label><select id="doc-type">${Object.entries(DOC_TYPES).map(([k,v])=>`<option value="${k}" ${d.type===k?'selected':''}>${v.icon} ${v.label}</option>`).join('')}</select></div>
        <div><label>关联章节(教案/讲义)</label><select id="doc-chapter"><option value="">—</option>${chapterOpts}</select></div>
      </div>`
    : `<div class="row"><span class="tag blue">${esc(c?c.name:'-')}</span><span class="tag gray">${m.label}</span>
        <span class="mini">当前角色为只读,可查看与导出文档</span></div>`}
  </div>

  <div class="doc-editor">
    <div class="doc-pane">
      <div class="doc-toolbar">
        ${canW?`
        <button class="tbtn" title="标题" onclick="viewDoc.ins('## ','')">H</button>
        <button class="tbtn" title="加粗" onclick="viewDoc.ins('**','**')"><b>B</b></button>
        <button class="tbtn" title="斜体" onclick="viewDoc.ins('*','*')"><i>I</i></button>
        <button class="tbtn" title="无序列表" onclick="viewDoc.ins('- ','')">•</button>
        <button class="tbtn" title="有序列表" onclick="viewDoc.ins('1. ','')">1.</button>
        <button class="tbtn" title="引用" onclick="viewDoc.ins('> ','')">❝</button>
        <button class="tbtn" title="行内公式" onclick="viewDoc.ins('$','$')">∑</button>
        <button class="tbtn" title="块级公式" onclick="viewDoc.ins('\\n$$\\n','\\n$$\\n')">∫</button>
        <button class="tbtn" title="表格" onclick="viewDoc.ins('\\n| 列1 | 列2 |\\n|---|---|\\n|  |  |\\n','')">▦</button>
        <button class="tbtn" title="代码块" onclick="viewDoc.ins('\\n\`\`\`\\n','\\n\`\`\`\\n')">&lt;/&gt;</button>
        <button class="tbtn" title="图片" onclick="viewDoc.ins('![',' ](图片URL)')">🖼</button>
        <button class="tbtn" title="链接" onclick="viewDoc.ins('[','](URL)')">🔗</button>
        <span class="spacer"></span>`:''}
        <span class="mini">${canW?'Markdown + LaTeX,右侧实时预览(Ctrl/⌘+S 保存)':'只读模式'}</span>
      </div>
      <textarea id="doc-content" class="doc-text" ${canW?'':'readonly'}>${esc(d.content||'')}</textarea>
    </div>
    <div class="doc-pane">
      <div class="doc-toolbar"><b style="font-size:12.5px">👁 实时预览</b><span class="spacer"></span><span class="mini">公式 / 表格 / 图片即时渲染</span></div>
      <div id="doc-preview" class="md doc-preview"></div>
    </div>
  </div>`;
}
function mountDoc(id){
  const d = store.document(id); if(!d) return;
  const ta = document.getElementById('doc-content');
  const pv = document.getElementById('doc-preview');
  if(!ta || !pv) return;
  const render = ()=>{
    pv.innerHTML = R.md(ta.value||'');
    R.typeset(pv);
    const cnt=document.getElementById('doc-count'); if(cnt) cnt.textContent = docWordCount(ta.value);
  };
  render();
  ta.addEventListener('input', ()=>{ clearTimeout(window._docT); window._docT=setTimeout(render,220); });
  ta.addEventListener('keydown', e=>{
    if((e.ctrlKey||e.metaKey) && (e.key==='s'||e.key==='S')){ e.preventDefault(); viewDoc.save(id,true); }
  });
}

/* ================= 编辑器操作 ================= */
const viewDoc = {
  ins(before, after){
    const ta=document.getElementById('doc-content'); if(!ta || ta.readOnly) return;
    const s=ta.selectionStart, e=ta.selectionEnd, v=ta.value, sel=v.slice(s,e);
    const ins=before+(sel||'')+(after||'');
    ta.value=v.slice(0,s)+ins+v.slice(e);
    ta.focus(); ta.selectionStart=ta.selectionEnd=s+ins.length;
    ta.dispatchEvent(new Event('input'));
  },
  save(id, quiet){
    const d=store.document(id); if(!d) return;
    if(!W('docs',d)){ toast('权限不足'); return; }
    const g=x=>document.getElementById(x);
    const patch={
      title:(g('doc-title')?.value||'').trim()||d.title,
      courseId:g('doc-course')?.value||d.courseId,
      type:g('doc-type')?.value||d.type,
      chapterId:g('doc-chapter')?g('doc-chapter').value:'',
      content:g('doc-content').value
    };
    store.saveDocument(id, patch);
    toast(quiet?'已保存(版本快照已生成)':'已保存');
  },
  onCourse(id, cid){
    const c=store.course(cid); const sel=document.getElementById('doc-chapter'); if(!sel) return;
    sel.innerHTML='<option value="">—</option>'+(c?c.chapters.map(ch=>`<option value="${ch.id}">${esc(ch.title)}</option>`).join(''):'');
  },
  exportMd(id){
    const d=store.document(id);
    download(`${d.title}.md`, d.content||'', 'text/markdown');
    store.log('export','教学文档',`导出《${d.title}》(Markdown)`,1);
    toast('Markdown 已导出');
  },
  exportHtml(id){
    const d=store.document(id);
    download(`${d.title}.html`, docHtml(d), 'text/html');
    store.log('export','教学文档',`导出《${d.title}》(HTML)`,1);
    toast('HTML 已导出(可直接打印为 PDF)');
  },
  print(id){
    const d=store.document(id);
    const w=window.open('','_blank');
    if(!w){ toast('浏览器拦截了弹窗,请允许后重试'); return; }
    w.document.open(); w.document.write(docHtml(d)); w.document.close();
    store.log('export','教学文档',`打印《${d.title}》`,1);
    setTimeout(()=>{ try{ w.focus(); w.print(); }catch(e){} }, 700);
  },
  dup(id){
    const copy=store.dupDocument(id); if(!copy) return;
    toast('已另存为副本'); location.hash='#/doc/'+copy.id; route();
  },
  del(id, fromList){
    const d=store.document(id); if(!d) return;
    if(!W('docs',d)){ toast('权限不足'); return; }
    if(confirm(`删除文档《${d.title}》?`)){
      store.delDocument(id); toast('文档已删除');
      if(fromList) route(); else location.hash='#/docs';
    }
  },
  blankModal(){
    openModal(`<h3>＋ 新建教学文档</h3>
      <label>文档标题</label><input id="nd-title" placeholder="如:2025-2026-1 期末复习讲义">
      <div class="grid cols2">
        <div><label>归属课程</label><select id="nd-course">${store.db.courses.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div>
        <div><label>文档类型</label><select id="nd-type">${Object.entries(DOC_TYPES).map(([k,v])=>`<option value="${k}">${v.icon} ${v.label}</option>`).join('')}</select></div>
      </div>
      <label>初始内容(可选,Markdown)</label><textarea id="nd-content" placeholder="# 标题&#10;&#10;正文…"></textarea>
      <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
      <button class="btn primary" onclick="viewDoc.doBlank()">创建并编辑</button></div>`);
  },
  doBlank(){
    const title=document.getElementById('nd-title').value.trim()||'未命名文档';
    const doc=store.addDocument({courseId:document.getElementById('nd-course').value,
      type:document.getElementById('nd-type').value, title, content:document.getElementById('nd-content').value});
    closeModal(); toast('文档已创建'); location.hash='#/doc/'+doc.id;
  },
  genModal(){
    openModal(`<h3>🧩 从模板生成教学文档</h3>
      <p class="mini">选择课程与模板,系统自动填充课程数据生成文档;生成后即可在线编辑、导出与打印。</p>
      <label>课程</label><select id="dg-course" onchange="viewDoc.onGenCourse()">${store.db.courses.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
      <label>模板</label><select id="dg-tpl">${store.db.templates.map(t=>`<option value="${t.id}">${esc(t.name)} · ${t.type==='course'?'课程级':'章节级'}</option>`).join('')}</select>
      <label>关联章节(教案/讲义类模板需要)</label><select id="dg-chapter">${(store.course((store.db.courses[0]||{}).id)||{chapters:[]}).chapters.map(ch=>`<option value="${ch.id}">${esc(ch.title)}</option>`).join('')}</select>
      <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
      <button class="btn primary" onclick="viewDoc.doGen()">生成并编辑</button></div>`);
  },
  onGenCourse(){
    const c=store.course(document.getElementById('dg-course').value);
    const sel=document.getElementById('dg-chapter'); if(!sel) return;
    sel.innerHTML=(c?c.chapters.map(ch=>`<option value="${ch.id}">${esc(ch.title)}</option>`).join(''):'')||'<option value="">(该课程暂无章节)</option>';
  },
  doGen(){
    const cid=document.getElementById('dg-course').value;
    const tplId=document.getElementById('dg-tpl').value;
    const chId=document.getElementById('dg-chapter').value||'';
    const doc=genDocument(cid, tplId, chId);
    if(!doc){ toast('生成失败'); return; }
    closeModal(); toast('文档已生成,可在线编辑'); location.hash='#/doc/'+doc.id;
  },
  importMd(){
    pickFile('.md,.markdown,.txt',(text, file)=>{
      const name=(file&&file.name? file.name.replace(/\.[^.]+$/,''):'导入文档');
      const doc=store.addDocument({courseId:(store.db.courses[0]||{}).id, type:'other', title:name, content:text});
      toast('已导入为教学文档'); location.hash='#/doc/'+doc.id;
    });
  },
  saveAsTpl(id){
    const d=store.document(id);
    const rv=docToTemplateContent(d);
    openModal(`<h3>存为模板</h3>
      <p class="mini">已尝试将课程专属信息(课程名/代码/学期/章节标题)替换为占位符,可继续手工调整。</p>
      <label>模板名称</label><input id="st-name" value="${esc(d.title)} 模板">
      <label>作用级别</label><select id="st-type"><option value="course" ${rv.type==='course'?'selected':''}>课程级</option><option value="chapter" ${rv.type==='chapter'?'selected':''}>章节级</option></select>
      <label>模板内容</label><textarea id="st-content" style="min-height:200px">${esc(rv.content)}</textarea>
      <div class="modal-foot"><button class="btn" onclick="closeModal()">取消</button>
      <button class="btn primary" onclick="viewDoc.doSaveAsTpl()">注册模板</button></div>`);
  },
  doSaveAsTpl(){
    const name=document.getElementById('st-name').value.trim(); if(!name){toast('请填写名称');return;}
    store.addTemplate({name, type:document.getElementById('st-type').value, content:document.getElementById('st-content').value});
    closeModal(); toast('模板已注册,可在模板中心与生成时选用');
  },
  versionModal(id){
    const d=store.document(id);
    openModal(`<h3>🕘 版本历史 — ${esc(d.title)}</h3>
      <p class="mini">每次保存自动生成版本快照(最多保留 20 个)。回滚将把当前内容作为新版本保留。</p>
      ${(d.versions||[]).length? `<div class="table-wrap"><table><thead><tr><th>时间</th><th>字数</th><th style="width:160px">操作</th></tr></thead><tbody>
      ${d.versions.map((v,i)=>`<tr><td class="mini">${esc(v.at||'-')}</td><td class="mini">${docWordCount(v.content)}</td>
        <td><button class="btn small" onclick="viewDoc.viewVersion('${id}',${i})">查看</button>
        <button class="btn small primary" onclick="viewDoc.rollback('${id}',${i})">回滚到此版本</button></td></tr>`).join('')}
      </tbody></table></div>`:'<div class="empty">暂无历史版本</div>'}
      <div class="modal-foot"><button class="btn" onclick="closeModal()">关闭</button></div>`);
  },
  viewVersion(id, idx){
    const d=store.document(id); const v=(d.versions||[])[idx];
    openModal(`<h3>版本预览 · ${esc(v.at||'')}</h3><div class="md" id="ver-view">${R.md(v.content||'')}</div>
      <div class="modal-foot"><button class="btn" onclick="viewDoc.versionModal('${id}')">返回版本列表</button></div>`);
    R.typeset(document.getElementById('ver-view'));
  },
  rollback(id, idx){
    if(!confirm('回滚到该版本?当前内容会被保留为一个新版本。')) return;
    store.restoreVersion(id, idx); closeModal(); toast('已回滚'); route();
  }
};

/* ================= 生成 / 导出辅助 ================= */
function genDocument(cid, tplId, chId){
  const c=store.course(cid); if(!c) return null;
  const tpl=store.db.templates.find(t=>t.id===tplId); if(!tpl) return null;
  const ch = chId? store.chapter(cid,chId) : (c.chapters[0]||null);
  const content=TemplateRegistry.render(tpl, c, ch);
  const key=String(tpl.id).replace(/^tpl-/,'');
  const type=DOC_TYPE_OF_TPL[key] || (tpl.type==='chapter'?'lesson':'other');
  const isChDoc = (type==='lesson'||type==='handout');
  const title=`《${c.name}》${tpl.name}${isChDoc&&ch?' · '+ch.title:''}`;
  return store.addDocument({courseId:cid, chapterId:isChDoc&&ch?ch.id:'', type, title, content, sourceTpl:tplId});
}
function docToTemplateContent(d){
  const c=store.course(d.courseId); const ch=d.chapterId? store.chapter(d.courseId,d.chapterId):null;
  let s=d.content||'';
  if(c){
    s=s.split('《'+c.name+'》').join('《{{course.name}}》');
    s=s.split(c.name).join('{{course.name}}');
    if(c.code) s=s.split(c.code).join('{{course.code}}');
    if(c.leader) s=s.split(c.leader).join('{{course.leader}}');
    s=s.split('第 '+c.semester+' 学期').join('第 {{course.semester}} 学期');
  }
  if(ch&&ch.title) s=s.split(ch.title).join('{{chapter.title}}');
  return {content:s, type:(d.type==='lesson'||d.type==='handout')?'chapter':'course'};
}
function docHtml(d){
  const body=R.md(d.content||'');
  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(d.title)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<style>
body{max-width:860px;margin:32px auto;padding:0 22px 60px;font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif;line-height:1.85;color:#1b2436}
h1{font-size:24px;border-bottom:2px solid #2563eb;padding-bottom:8px}
h2{font-size:19px;margin-top:26px;color:#1e3a8a}
table{border-collapse:collapse;width:100%;margin:12px 0}
th,td{border:1px solid #e6eaf2;padding:8px 11px;text-align:left}
th{background:#f8fafc}
code{background:#f1f5f9;padding:1px 6px;border-radius:5px;font-size:.92em}
pre{background:#0f172a;color:#e2e8f0;padding:14px;border-radius:10px;overflow-x:auto}
pre code{background:none;color:inherit}
blockquote{border-left:3px solid #2563eb;background:#eff5ff;margin:12px 0;padding:8px 14px;border-radius:0 8px 8px 0}
img{max-width:100%}
@media print{body{margin:0}}
</style></head>
<body><article>${body}</article>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"><\/script>
<script>
document.addEventListener('DOMContentLoaded',function(){
  if(window.renderMathInElement){ renderMathInElement(document.body,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false}); }
});
<\/script>
</body></html>`;
}
