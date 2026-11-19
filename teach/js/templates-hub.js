/* ============================================================
   数据模板中心 (templatesHub)
   系统内所有导入导出对象的"可下载模板 + 字段说明 + 示例数据"统一入口
   模板由 js/schemas.js 的数据字典实时生成 → 与导入解析规则严格一致
   ============================================================ */

const DIR_LABEL = {both:'导入 + 导出', import:'仅导入', export:'仅导出'};

/* ---------- 视图:模板中心总览 ---------- */
function viewTemplatesHub(id, query){
  if(id) return viewTemplatesHub.detail(id);
  const cats=SCHEMA_CATS;
  return `
  <div class="page-head"><div><h1>📋 数据模板中心</h1>
    <div class="sub">系统内所有导入导出功能点均已提供可直接使用的标准模板 — 每个模板附带字段含义、必填项、格式要求与示例数据</div></div>
    <div class="row">
      <button class="btn" style="display:${auth.canExport()?'':'none'}" onclick="templatesHub.downloadAll()">⬇ 下载全部模板(ZIP)</button>
    </div></div>

  <div class="card" style="background:linear-gradient(135deg,#eff6ff,#f5f3ff);border-color:#c7d2fe">
    <h3>🧭 怎么用</h3>
    <div class="steps">
      <div class="step"><span class="n">1</span><b>下载模板</b><div class="mini">在下方找到要导入的对象,点击「模板包(ZIP)」或单独下载 CSV / Excel / JSON。</div></div>
      <div class="step"><span class="n">2</span><b>填写数据</b><div class="mini">保留第 1 行表头不动,从第 2 行开始填写;示例行可删除。</div></div>
      <div class="step"><span class="n">3</span><b>导入</b><div class="mini">在对应模块点击「导入」,选择文件 → 系统自动校验并预览 → 确认导入。</div></div>
      <div class="step"><span class="n">4</span><b>修错</b><div class="mini">校验会逐行指出问题(缺列/缺必填/取值非法/类型错误),修正后重试即可。</div></div>
    </div>
  </div>

  <div class="card"><h3>📐 支持的格式与适用场景</h3>
    <div class="table-wrap"><table><thead><tr><th style="width:120px">格式</th><th style="width:260px">适用场景</th><th>编码与注意事项</th></tr></thead><tbody>
    ${Object.entries(DF.formats).map(([k,v])=>`<tr>
      <td><b>${v.label}</b><div class="mini">.${v.ext}</div></td>
      <td class="mini">${esc(v.note)}</td>
      <td class="mini">${k==='csv'||k==='tsv'?'<b>必须 UTF-8</b>;Excel 请"另存为 → CSV UTF-8(逗号分隔)"。含逗号/换行的单元格用英文双引号包裹。':k==='xlsx'?'模板 Excel 含两页:第 1 页「数据」填写、第 2 页「字段说明」查阅。':'JSON 请勿改动字段名;公式用 LaTeX 原样书写。'}</td></tr>`).join('')}
    </tbody></table></div>
    <p class="mini" style="margin-top:8px">💡 <b>与超星(学习通)对接</b>:凡标注「超星对应入口」的模板,其列名已按超星教师端导入模板命名,可直接把超星的导出文件改名为本模板后导入,或反向导入超星。</p>
  </div>

  <div class="card"><h3>🔍 查找模板</h3>
    <div class="row"><input id="dh-kw" placeholder="输入对象名称,如 成绩 / 题库 / 名册 / 图谱…" oninput="templatesHub.search(this.value)"></div>
  </div>

  ${cats.map(cat=>{
    const list=SCHEMAS.filter(s=>s.cat===cat.id);
    if(!list.length) return '';
    return `
    <div class="dth-cat" data-cat="${cat.id}">
      <h2 class="sec-title">${cat.icon} ${cat.label}<span class="mini"> — ${esc(cat.desc)}</span></h2>
      <div class="grid cols2">
        ${list.map(sc=>`
        <div class="card dth-card" data-name="${esc(sc.name)} ${esc(sc.purpose)}">
          <div class="row" style="margin-bottom:4px">
            <h3 style="margin:0">${sc.icon||''} ${esc(sc.name)}</h3>
            <span class="spacer"></span>
            <span class="tag ${sc.direction==='export'?'gray':sc.direction==='import'?'orange':'blue'}">${DIR_LABEL[sc.direction]}</span>
          </div>
          <p class="mini" style="min-height:32px">${esc(sc.purpose)}</p>
          <div class="mini" style="margin:6px 0"><b>超星入口:</b>${esc(sc.chaoxing.entry)}</div>
          <div class="mini" style="margin:6px 0"><b>格式:</b>${sc.formats.map(f=>`<span class="chip-fmt">${(DF.formats[f]||{label:f}).label}</span>`).join('')}</div>
          <div class="row" style="margin-top:8px">
            ${sc.direction!=='import'?`<button class="btn small" style="display:${auth.canExport()?'':'none'}" onclick="templatesHub.download('${sc.id}','zip')">⬇ 模板包(ZIP)</button>`:''}
            <button class="btn small ${sc.direction==='import'?'primary':''}" onclick="location.hash='#/datatpl/${sc.id}'">📖 字段说明</button>
          </div>
        </div>`).join('')}
      </div>
    </div>`;
  }).join('')}

  <div class="card" id="dh-empty" style="display:none"><div class="empty">没有匹配的模板,请换个关键词</div></div>`;
}
viewTemplatesHub.search = function(kw){
  const k=String(kw||'').trim().toLowerCase();
  let shown=0;
  document.querySelectorAll('.dth-card').forEach(el=>{
    const hit=!k || el.dataset.name.toLowerCase().includes(k) || el.textContent.toLowerCase().includes(k);
    el.style.display=hit?'':'none'; if(hit) shown++;
  });
  document.querySelectorAll('.dth-cat').forEach(sec=>{
    const any=[...sec.querySelectorAll('.dth-card')].some(el=>el.style.display!=='none');
    sec.style.display=any?'':'none';
  });
  document.getElementById('dh-empty').style.display = shown?'none':'block';
};

/* ---------- 视图:单个对象详情(字段说明 + 规则 + 示例) ---------- */
viewTemplatesHub.detail = function(id){
  const sc=SchemaKit.get(id);
  if(!sc) return `<div class="card empty">未找到该模板,<a href="#/datatpl">返回模板中心</a></div>`;
  const ft=SchemaKit.fieldTable(sc);
  const canDL=auth.canExport();
  const isJSON=sc.rowShape==='json';
  const tableFmts = (!isJSON || sc.altFields) ? sc.formats : ['json'];
  return `
  <div class="page-head"><div>
    <div class="mini"><a href="#/datatpl">← 返回数据模板中心</a></div>
    <h1>${sc.icon||''} ${esc(sc.name)}</h1>
    <div class="sub">${esc(sc.purpose)}</div></div>
    <div class="row">
      ${sc.direction!=='import'?`<button class="btn" style="display:${canDL?'':'none'}" onclick="templatesHub.download('${sc.id}','zip')">⬇ 模板包(ZIP)</button>`:''}
      <button class="btn" style="display:${canDL?'':'none'}" onclick="templatesHub.download('${sc.id}','md')">📄 字段说明(MD)</button>
      ${sc.direction!=='export'?`<button class="btn primary" style="display:${canDL?'':'none'}" onclick="templatesHub.startImport('${sc.id}')">📥 立即导入</button>`:''}
    </div></div>

  <div class="grid cols2">
    <div class="card"><h3>🏫 超星(学习通)对接</h3>
      <table class="kv"><tbody>
        <tr><th>对应入口</th><td>${esc(sc.chaoxing.entry)}</td></tr>
        <tr><th>推荐格式</th><td>${esc(sc.chaoxing.format)}</td></tr>
        <tr><th>本系统方向</th><td><span class="tag ${sc.direction==='export'?'gray':sc.direction==='import'?'orange':'blue'}">${DIR_LABEL[sc.direction]}</span></td></tr>
        <tr><th>支持格式</th><td>${sc.formats.map(f=>`<span class="chip-fmt">${(DF.formats[f]||{label:f}).label}</span>`).join('')}</td></tr>
      </tbody></table>
    </div>
    <div class="card"><h3>⬇ 下载模板(可直接使用)</h3>
      <div class="row" style="flex-wrap:wrap;gap:8px">
        ${sc.direction!=='import'?`<button class="btn small primary" ${canDL?'':'disabled'} onclick="templatesHub.download('${sc.id}','zip')">📦 模板包(ZIP·最全)</button>`:''}
        ${sc.formats.filter(f=>tableFmts.includes(f)).map(f=>`<button class="btn small" ${canDL?'':'disabled'} onclick="templatesHub.download('${sc.id}','${f}')">${(DF.formats[f]||{label:f}).label}</button>`).join('')}
        <button class="btn small" ${canDL?'':'disabled'} onclick="templatesHub.download('${sc.id}','md')">字段说明(含示例)</button>
      </div>
      <p class="mini" style="margin-top:8px">模板包内含:<b>CSV</b> + <b>TSV</b> + <b>Excel(.xlsx,含字段说明第二页)</b> + <b>JSON</b> + <b>字段说明.md</b> + <b>README.txt</b>,下载后解压即可直接用。</p>
    </div>
  </div>

  <div class="card"><h3>📖 字段字典(含义 · 必填 · 类型 · 格式要求 · 示例 · 超星对应列)</h3>
    ${sc.altFields?`<p class="mini" style="margin-bottom:8px">本对象支持两种结构:<b>表格格式(CSV / Excel)</b> 使用下方表 1 的简化两列结构;<b>JSON</b> 使用表 2 的完整结构。</p>
      <h4 style="font-size:13px;margin:6px 0">表 1 · 表格格式字段</h4>`:''}
    <div class="table-wrap"><table><thead><tr>
      <th style="width:130px">列名/字段</th><th>含义</th><th style="width:78px">必填</th>
      <th style="width:76px">类型</th><th style="width:190px">格式要求</th><th style="width:150px">示例</th><th style="width:110px">超星对应列</th>
    </tr></thead><tbody>
    ${(sc.altFields||sc.fields).map(f=>`<tr>
      <td><b>${esc(f.label)}</b>${f.aliases&&f.aliases.length?`<div class="mini">别名:${f.aliases.map(esc).join(' / ')}</div>`:''}</td>
      <td class="mini">${esc(f.desc||'')}</td>
      <td>${f.required?'<span class="tag red">必填</span>':'<span class="tag gray">选填</span>'}</td>
      <td class="mini">${esc(f.type||'文本')}</td>
      <td class="mini">${esc(f.format||'—')}</td>
      <td class="mini">${esc(f.example===undefined?'':(typeof f.example==='object'?JSON.stringify(f.example):String(f.example)))}</td>
      <td class="mini">${esc(f.cx||'—')}</td></tr>`).join('')}
    ${sc.dynamic?`<tr><td><b>${esc(sc.dynamic.label)}</b></td><td class="mini" colspan="5">${esc(sc.dynamic.desc)}<div class="mini">排除列:${sc.dynamic.exclude.map(e=>`<code>${esc(e)}</code>`).join(' ')}</div></td><td class="mini">各分项列</td></tr>`:''}
    </tbody></table></div>
    ${sc.altFields?`
      <h4 style="font-size:13px;margin:14px 0 6px">表 2 · JSON 结构字段(完整版)</h4>
      <div class="table-wrap"><table><thead><tr>
        <th style="width:170px">字段</th><th>含义</th><th style="width:78px">必填</th><th style="width:76px">类型</th><th style="width:220px">格式要求</th><th style="width:180px">示例</th>
      </tr></thead><tbody>
      ${sc.fields.map(f=>`<tr>
        <td><code style="font-size:11.5px">${esc(f.key)}</code><div class="mini">${esc(f.label)}</div></td>
        <td class="mini">${esc(f.desc||'')}</td>
        <td>${f.required?'<span class="tag red">必填</span>':'<span class="tag gray">选填</span>'}</td>
        <td class="mini">${esc(f.type||'文本')}</td>
        <td class="mini">${esc(f.format||'—')}</td>
        <td class="mini">${esc(f.example===undefined?'':(typeof f.example==='object'?JSON.stringify(f.example):String(f.example)))}</td></tr>`).join('')}
      </tbody></table></div>`:''}
  </div>

  <div class="card"><h3>✅ 填写规则(格式要求)</h3>
    <ol class="rule-list">${sc.rules.map(r=>`<li>${esc(r)}</li>`).join('')}</ol>
    <div class="import-hint" style="margin-top:10px">
      <b>通用编码要求:</b>
      <ul style="margin:6px 0 0 18px">
        <li>CSV / TSV <b>必须使用 UTF-8</b> 编码;用 Excel 保存请选「CSV UTF-8(逗号分隔)」,否则中文会乱码。</li>
        <li>单元格内容含逗号、引号或换行时,用英文双引号把整个单元格括起来,内部引号写成两个("")。</li>
        <li>直接从 Excel 复制粘贴得到的是制表符分隔内容,可另存为 .tsv 上传,系统会自动识别分隔符。</li>
        <li>表头行必须保留;列的<b>顺序可以任意调整</b>(系统按列名识别),但列名不要改写。</li>
      </ul>
    </div>
  </div>

  <div class="card"><h3>📊 示例数据${isJSON?'(JSON)':'(可直接作为模板首行填写参考)'}</h3>
    ${isJSON?`<pre class="code-preview">${esc(DF.json(sc.sampleJSON||{}))}</pre>`:''}
    ${(!isJSON||sc.altFields)?`${sc.altFields?'<h4 style="font-size:13px;margin:12px 0 6px">表格格式示例(CSV / Excel)</h4>':''}
      <div class="table-wrap"><table><thead><tr>${(SchemaKit.sampleRows(sc)[0]||[]).map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${SchemaKit.sampleRows(sc).slice(1).map(r=>`<tr>${r.map(c=>`<td class="mini">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:''}
    <div class="row" style="margin-top:8px">
      <button class="btn small" onclick="templatesHub.copySample('${sc.id}')">📋 复制示例数据</button>
      ${sc.direction!=='export'?`<button class="btn small primary" onclick="templatesHub.startImport('${sc.id}')">📥 用这个模板导入</button>`:''}
    </div>
  </div>`;
};

/* ---------- 模板生成与下载 ---------- */
const templatesHub = {
  /* 生成对象的一份模板数据(按格式) */
  build(id, fmt){
    const sc=SchemaKit.get(id);
    const isJSON=sc.rowShape==='json';
    const rows=SchemaKit.sampleRows(sc);
    if(fmt==='csv')  return {data:DF.csv(rows), mime:DF.formats.csv.mime, ext:'csv'};
    if(fmt==='tsv')  return {data:DF.tsv(rows), mime:DF.formats.tsv.mime, ext:'tsv'};
    if(fmt==='json'){
      const payload = isJSON ? (sc.sampleJSON||{})
        : {schema:'dlufe-kb/table-template/v1', object:id, name:sc.name, generatedAt:new Date().toISOString(),
           columns:SchemaKit.headers(sc), rows:DF.objectsFromRows(rows)};
      return {data:DF.json(payload), mime:DF.formats.json.mime, ext:'json'};
    }
    if(fmt==='xlsx'){
      const sheets=[{name:'数据', rows}];
      if(!isJSON) sheets.push({name:'字段说明', rows:SchemaKit.fieldTable(sc)});
      return {data:DF.xlsxBuild(sheets), mime:DF.formats.xlsx.mime, ext:'xlsx'};
    }
    if(fmt==='md')  return {data:SchemaKit.specMd(sc), mime:'text/markdown', ext:'md'};
    return null;
  },
  download(id, fmt){
    if(!auth.canExport()){ toast('当前角色无导出权限'); return; }
    const sc=SchemaKit.get(id); if(!sc) return;
    const base=DF.safeName(sc.name);
    if(fmt==='zip'){ this.downloadZip(sc); return; }
    const r=this.build(id, fmt);
    if(!r){ toast('不支持的格式'); return; }
    if(r.data instanceof Uint8Array) DF.downloadBytes(`${base}_模板.${r.ext}`, r.data, r.mime);
    else DF.downloadBytes(`${base}_模板.${r.ext}`, DF.u8encode(r.data), r.mime);
    toast(`${sc.name} — ${(DF.formats[fmt]||{label:fmt}).label} 模板已下载`);
  },
  /* 模板包:CSV + TSV + XLSX + JSON + 字段说明MD + README */
  downloadZip(sc){
    const base=DF.safeName(sc.name);
    const isJSON=sc.rowShape==='json';
    const hasTable=!isJSON || !!sc.altFields;       // JSON 型对象若带简化表结构,同样打包表格版
    const rows=SchemaKit.sampleRows(sc);
    const entries=[];
    if(hasTable){
      entries.push({name:`${base}_模板.csv`, data:DF.csv(rows)});
      entries.push({name:`${base}_模板.tsv`, data:DF.tsv(rows)});
      entries.push({name:`${base}_模板.xlsx`, data:DF.xlsxBuild([{name:'数据',rows},{name:'字段说明',rows:SchemaKit.fieldTable(sc)}])});
      entries.push({name:`${base}_模板.json`, data:DF.json({schema:'dlufe-kb/table-template/v1', object:sc.id, name:sc.name, columns:SchemaKit.headers(sc), rows:DF.objectsFromRows(rows)})});
    }
    if(isJSON){ entries.push({name:`${base}_完整模板.json`, data:DF.json(sc.sampleJSON||{})}); }
    entries.push({name:'字段说明.md', data:SchemaKit.specMd(sc)});
    entries.push({name:'README.txt', data:this.readme(sc)});
    DF.downloadBytes(`${base}_导入导出模板包.zip`, DF.zipBuild(entries), 'application/zip');
    toast(`${sc.name} 模板包已下载(含 ${entries.length} 个文件)`);
  },
  readme(sc){
    const L=[];
    L.push(`${sc.name} — 导入导出模板包 使用说明`);
    L.push('='.repeat(48));
    L.push('');
    L.push(`【用途】${sc.purpose}`);
    L.push(`【方向】${DIR_LABEL[sc.direction]}`);
    L.push(`【超星对应入口】${sc.chaoxing.entry}`);
    L.push(`【超星推荐格式】${sc.chaoxing.format}`);
    L.push('');
    L.push('【包内文件】');
    if(sc.rowShape!=='json' || sc.altFields){
      L.push(`  · ${sc.name}_模板.csv    — 通用表格模板(UTF-8 带 BOM,Excel 双击可开)`);
      L.push(`  · ${sc.name}_模板.tsv    — 制表符分隔版(适合含逗号的文本)`);
      L.push(`  · ${sc.name}_模板.xlsx   — Excel 模板(第1页"数据"填写 / 第2页"字段说明")`);
      L.push(`  · ${sc.name}_模板.json   — 对象数组版(结构化,便于程序处理)`);
    }
    if(sc.rowShape==='json'){
      L.push(`  · ${sc.name}_完整模板.json — 完整结构化 JSON 模板(含全部字段与示例)`);
    }else{
      L.push(`  · ${sc.name}_模板.json   — 对象数组版(结构化,便于程序处理)`);
    }
    L.push('  · 字段说明.md         — 完整字段字典与填写规则');
    L.push('  · README.txt          — 本文件');
    L.push('');
    L.push('【使用步骤】');
    L.push('  1) 打开任意模板文件,保留第 1 行表头,从第 2 行开始填写;示例行可删除。');
    L.push('  2) 编码必须为 UTF-8(Excel 另存为 "CSV UTF-8(逗号分隔)")。');
    L.push('  3) 在系统的对应模块点击「导入」,选择文件 → 系统自动校验并预览 → 确认导入。');
    L.push('  4) 若校验报错,按提示修正后重新导入(错误行会被跳过,不影响其他行)。');
    L.push('');
    L.push('【必填字段】');
    sc.fields.filter(f=>f.required).forEach(f=>L.push(`  · ${f.label} — ${f.desc||''}`));
    L.push('');
    L.push('【填写规则】');
    sc.rules.forEach((r,i)=>L.push(`  ${i+1}. ${r}`));
    L.push('');
    L.push('本模板由系统数据字典自动生成,与系统导入解析规则一致。');
    return L.join('\r\n');
  },
  /* 全部模板打包(按对象分目录) */
  downloadAll(){
    if(!auth.canExport()){ toast('当前角色无导出权限'); return; }
    const entries=[];
    SCHEMAS.forEach(sc=>{
      const dir=DF.safeName(SCHEMA_CATS.find(c=>c.id===sc.cat).label)+'/'+DF.safeName(sc.name)+'/';
      const base=DF.safeName(sc.name);
      if(sc.rowShape==='json'){
        entries.push({name:dir+base+'_模板.json', data:DF.json(sc.sampleJSON||{})});
      }else{
        const rows=SchemaKit.sampleRows(sc);
        entries.push({name:dir+base+'_模板.csv', data:DF.csv(rows)});
        entries.push({name:dir+base+'_模板.xlsx', data:DF.xlsxBuild([{name:'数据',rows},{name:'字段说明',rows:SchemaKit.fieldTable(sc)}])});
        entries.push({name:dir+base+'_模板.json', data:DF.json({schema:'dlufe-kb/table-template/v1', object:sc.id, name:sc.name, columns:SchemaKit.headers(sc), rows:DF.objectsFromRows(rows)})});
      }
      entries.push({name:dir+'字段说明.md', data:SchemaKit.specMd(sc)});
    });
    entries.push({name:'总目录.md', data:this.indexMd()});
    DF.downloadBytes(`数据模板中心_全部模板_${DF.today()}.zip`, DF.zipBuild(entries), 'application/zip');
    toast(`已打包 ${SCHEMAS.length} 个对象的模板(共 ${entries.length} 个文件)`);
  },
  indexMd(){
    const L=['# 数据模板中心 — 全部模板索引','','> 每个对象对应系统内一个导入导出功能点,均已提供可直接使用的模板与字段说明。',''];
    SCHEMA_CATS.forEach(cat=>{
      L.push(`## ${cat.icon} ${cat.label}`);
      L.push('');
      L.push(cat.desc);
      L.push('');
      L.push('| 对象 | 方向 | 支持格式 | 超星对应入口 |');
      L.push('| --- | --- | --- | --- |');
      SCHEMAS.filter(s=>s.cat===cat.id).forEach(sc=>{
        L.push(`| ${sc.name} | ${DIR_LABEL[sc.direction]} | ${sc.formats.map(f=>(DF.formats[f]||{label:f}).label).join(' / ')} | ${String(sc.chaoxing.entry).replace(/\|/g,'/')} |`);
      });
      L.push('');
    });
    return L.join('\n');
  },
  copySample(id){
    const sc=SchemaKit.get(id);
    const txt = sc.rowShape==='json' ? DF.json(sc.sampleJSON||{}) : DF.tsv(SchemaKit.sampleRows(sc));
    const done=()=>toast('示例数据已复制(可直接粘贴到 Excel)');
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done).catch(()=>fallbackCopy(txt,done));
    else fallbackCopy(txt,done);
  },
  startImport(id){
    const sc=SchemaKit.get(id);
    if(sc.direction==='export'){ toast('该对象仅支持导出'); return; }
    if(id==='backup'){ exporters.restore(); return; }
    if(id==='aiChecklist'){ toast('该对象仅支持导出'); return; }
    if(id==='documents'){ viewDoc.importMd(); return; }
    if(id==='templates'){ viewTemplates.importTemplates(); return; }
    ImportKit.open(id, {});
  }
};
/* 剪贴板兜底(HTTP 环境或旧浏览器) */
function fallbackCopy(text, done){
  try{
    const ta=document.createElement('textarea');
    ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); done();
  }catch(e){ toast('复制失败,请手动选择文本'); }
}
