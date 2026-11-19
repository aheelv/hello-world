/* ============================================================
   通用数据格式引擎 (Data Formats)
   — 支持 CSV / TSV / JSON / XLSX / Markdown 的生成与解析
   — 自带 ZIP 写入(用于 .xlsx 与"模板包"打包),不依赖任何外部库
   — 解析 .xlsx 使用浏览器原生 DecompressionStream,不可用时安全降级
   ============================================================ */
const DF = {};

/* ---------- 文本编码 ---------- */
const _enc = typeof TextEncoder!=='undefined' ? new TextEncoder() : null;
const _dec = typeof TextDecoder!=='undefined' ? new TextDecoder('utf-8') : null;
function u8encode(str){
  const s = String(str??'');
  if(_enc) return _enc.encode(s);
  // 兜底:手写 UTF-8 编码
  const out=[]; for(let i=0;i<s.length;i++){
    let c=s.charCodeAt(i);
    if(c<0x80) out.push(c);
    else if(c<0x800){ out.push(0xC0|(c>>6), 0x80|(c&63)); }
    else if(c<0xD800||c>=0xE000){ out.push(0xE0|(c>>12), 0x80|((c>>6)&63), 0x80|(c&63)); }
    else { const c2=s.charCodeAt(++i); const cp=0x10000+(((c&0x3FF)<<10)|(c2&0x3FF)); out.push(0xF0|(cp>>18),0x80|((cp>>12)&63),0x80|((cp>>6)&63),0x80|(cp&63)); }
  }
  return new Uint8Array(out);
}
function u8decode(u8){
  if(_dec) return _dec.decode(u8);
  let s=''; for(let i=0;i<u8.length;i++) s+=String.fromCharCode(u8[i]);
  try{ return decodeURIComponent(escape(s)); }catch(e){ return s; }
}
function concatU8(list){
  const n=list.reduce((a,b)=>a+b.length,0); const out=new Uint8Array(n); let o=0;
  list.forEach(b=>{ out.set(b,o); o+=b.length; }); return out;
}

/* ---------- CRC32 + ZIP(store, 不压缩) ---------- */
const CRC_TABLE=(()=>{ const t=new Uint32Array(256);
  for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1); t[n]=c>>>0; }
  return t; })();
function crc32(u8){ let c=0xFFFFFFFF; for(let i=0;i<u8.length;i++) c=CRC_TABLE[(c^u8[i])&0xFF]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
function dosDateTime(d){
  return { time:((d.getHours()&31)<<11)|((d.getMinutes()&63)<<5)|((d.getSeconds()/2)&31),
           date:(((d.getFullYear()-1980)&127)<<9)|(((d.getMonth()+1)&15)<<5)|(d.getDate()&31) };
}
/* entries: [{name, data:string|Uint8Array}] → Uint8Array(zip) */
function zipBuild(entries){
  const dt=dosDateTime(new Date());
  const locals=[], centrals=[]; let offset=0;
  entries.forEach(e=>{
    const nameU8=u8encode(e.name);
    const data= e.data instanceof Uint8Array ? e.data : u8encode(e.data);
    const crc=crc32(data);
    const lh=new Uint8Array(30+nameU8.length); const lv=new DataView(lh.buffer);
    lv.setUint32(0,0x04034b50,true); lv.setUint16(4,20,true); lv.setUint16(6,0x0800,true);
    lv.setUint16(8,0,true); lv.setUint16(10,dt.time,true); lv.setUint16(12,dt.date,true);
    lv.setUint32(14,crc,true); lv.setUint32(18,data.length,true); lv.setUint32(22,data.length,true);
    lv.setUint16(26,nameU8.length,true); lv.setUint16(28,0,true); lh.set(nameU8,30);
    locals.push(lh,data);
    const cd=new Uint8Array(46+nameU8.length); const cv=new DataView(cd.buffer);
    cv.setUint32(0,0x02014b50,true); cv.setUint16(4,20,true); cv.setUint16(6,20,true);
    cv.setUint16(8,0x0800,true); cv.setUint16(10,0,true);
    cv.setUint16(12,dt.time,true); cv.setUint16(14,dt.date,true);
    cv.setUint32(16,crc,true); cv.setUint32(20,data.length,true); cv.setUint32(24,data.length,true);
    cv.setUint16(28,nameU8.length,true); cv.setUint16(30,0,true); cv.setUint16(32,0,true);
    cv.setUint16(34,0,true); cv.setUint16(36,0,true); cv.setUint32(38,0,true);
    cv.setUint32(42,offset,true); cd.set(nameU8,46);
    centrals.push(cd);
    offset += lh.length + data.length;
  });
  const cdSize=centrals.reduce((a,b)=>a+b.length,0);
  const eocd=new Uint8Array(22); const ev=new DataView(eocd.buffer);
  ev.setUint32(0,0x06054b50,true); ev.setUint16(8,entries.length,true); ev.setUint16(10,entries.length,true);
  ev.setUint32(12,cdSize,true); ev.setUint32(16,offset,true);
  return concatU8(locals.concat(centrals,[eocd]));
}

/* ---------- CSV / TSV ---------- */
function cellText(v){ return v===null||v===undefined ? '' : String(v); }
function csvQuote(v, delim){
  const s=cellText(v);
  return (s.includes('"')||s.includes(delim)||s.includes('\n')||s.includes('\r'))
    ? '"'+s.replace(/"/g,'""')+'"' : s;
}
/* rows: 二维数组 → CSV 文本(BOM,Excel 中文友好) */
DF.csv = function(rows, opts){
  const o = Object.assign({delim:',', bom:true, eol:'\r\n'}, opts||{});
  const body = rows.map(r=>r.map(v=>csvQuote(v,o.delim)).join(o.delim)).join(o.eol);
  return (o.bom?'\ufeff':'') + body + o.eol;
};
DF.tsv = function(rows, opts){ return DF.csv(rows, Object.assign({delim:'\t'}, opts||{})); };

/* 文本 → 二维数组(支持引号转义、CRLF、BOM) */
DF.parseDelim = function(text, delim){
  const clean=String(text).replace(/^\ufeff/,'').replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  const rows=[]; let row=[], cur='', q=false;
  for(let i=0;i<clean.length;i++){
    const ch=clean[i];
    if(q){
      if(ch==='"'){ if(clean[i+1]==='"'){ cur+='"'; i++; } else q=false; }
      else cur+=ch;
    }else{
      if(ch==='"' && cur==='') q=true;
      else if(ch===delim){ row.push(cur); cur=''; }
      else if(ch==='\n'){ row.push(cur); rows.push(row); row=[]; cur=''; }
      else cur+=ch;
    }
  }
  if(cur!==''||row.length){ row.push(cur); rows.push(row); }
  return rows.filter(r=>r.some(c=>String(c).trim()!==''));
};
DF.parseCSV = t=>DF.parseDelim(t,',');
DF.parseTSV = t=>DF.parseDelim(t,'\t');
/* 自动判别分隔符(看表头行里逗号/制表符哪个多) */
DF.sniffDelim = function(text){
  const head=String(text).replace(/^\ufeff/,'').split(/\r?\n/)[0]||'';
  return (head.split('\t').length > head.split(',').length) ? '\t' : ',';
};

/* ---------- JSON ---------- */
DF.json = function(obj){ return JSON.stringify(obj,null,2); };
/* 对象数组 → {headers, rows} */
DF.rowsFromObjects = function(list){
  const headers=[]; const seen={};
  list.forEach(o=>Object.keys(o||{}).forEach(k=>{ if(!seen[k]){ seen[k]=1; headers.push(k); } }));
  const rows=[headers].concat(list.map(o=>headers.map(h=>o?o[h]:'')));
  return {headers, rows};
};
DF.objectsFromRows = function(rows, headers){
  const h=(headers||rows[0]||[]).map(x=>String(x).trim());
  return rows.slice(1).map(r=>{ const o={}; h.forEach((k,i)=>{ if(k) o[k]=r[i]===undefined?'':r[i]; }); return o; });
};

/* ---------- Markdown ---------- */
DF.mdTable = function(rows){
  if(!rows.length) return '';
  const head=rows[0], body=rows.slice(1);
  const fmt = v=>cellText(v).replace(/\|/g,'\\|').replace(/\n/g,'<br>');
  return [`| ${head.map(fmt).join(' | ')} |`,`| ${head.map(()=>'---').join(' | ')} |`]
    .concat(body.map(r=>`| ${head.map((_,i)=>fmt(r[i])).join(' | ')} |`)).join('\n');
};

/* ---------- XLSX(真实 OOXML,单/多工作表,内联字符串) ---------- */
function xmlEsc(s){
  return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&apos;').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'');
}
function colRef(n){ let s=''; n=+n+1; while(n>0){ const m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=Math.floor((n-1)/26); } return s; }
function sheetName(name, i){
  let n=String(name||('Sheet'+(i+1))).replace(/[\\\/\?\*\[\]:]/g,'-').slice(0,31);
  return n||('Sheet'+(i+1));
}
/* sheets: [{name, rows:[[v,...]]}] → Uint8Array(xlsx) */
DF.xlsxBuild = function(sheets){
  const used={};
  const names = sheets.map((sh,i)=>{
    let n=sheetName(sh.name,i); let k=n, c=2;
    while(used[k]){ k=sheetName(n.slice(0,28)+'_'+(c++),i); }
    used[k]=1; return k;
  });
  const sheetXml = sheets.map(sh=>{
    const rows = (sh.rows||[]).map((r,ri)=>{
      const cells = (r||[]).map((v,ci)=>{
        if(v===null||v===undefined||v==='') return '';
        const ref=colRef(ci)+(ri+1);
        if(typeof v==='number' && isFinite(v)) return `<c r="${ref}"><v>${v}</v></c>`;
        return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`;
      }).join('');
      return `<row r="${ri+1}">${cells}</row>`;
    }).join('');
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`;
  });
  const entries=[
    {name:'[Content_Types].xml', data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`},
    {name:'_rels/.rels', data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
    {name:'xl/workbook.xml', data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((n,i)=>`<sheet name="${xmlEsc(n)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`},
    {name:'xl/_rels/workbook.xml.rels', data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}</Relationships>`}
  ];
  sheetXml.forEach((x,i)=>entries.push({name:`xl/worksheets/sheet${i+1}.xml`, data:x}));
  return zipBuild(entries);
};

/* ---------- ZIP 读取 ---------- */
function findEOCD(u8){
  for(let i=u8.length-22;i>=Math.max(0,u8.length-66000);i--){
    if(u8[i]===0x50&&u8[i+1]===0x4b&&u8[i+2]===0x05&&u8[i+3]===0x06) return i;
  }
  return -1;
}
async function inflateRaw(u8, method){
  if(method===0) return u8;
  if(typeof DecompressionStream==='undefined') throw new Error('当前浏览器不支持解压 xlsx,请另存为 CSV 后导入');
  const ds=new DecompressionStream('deflate-raw');
  const stream=new Blob([u8]).stream().pipeThrough(ds);
  const buf=await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}
/* Uint8Array(zip) → {name: Uint8Array} */
DF.zipRead = async function(u8){
  const eocd=findEOCD(u8); if(eocd<0) throw new Error('不是有效的 ZIP/XLSX 文件');
  const ev=new DataView(u8.buffer, u8.byteOffset);
  const count=ev.getUint16(eocd+10,true), cdOff=ev.getUint32(eocd+16,true);
  const out={}; let p=cdOff;
  for(let i=0;i<count;i++){
    if(ev.getUint32(p,true)!==0x02014b50) break;
    const method=ev.getUint16(p+10,true);
    const compSize=ev.getUint32(p+20,true);
    const nameLen=ev.getUint16(p+28,true), extraLen=ev.getUint16(p+30,true), cmtLen=ev.getUint16(p+32,true);
    const lho=ev.getUint32(p+42,true);
    const name=u8decode(u8.subarray(p+46,p+46+nameLen));
    // 本地头:定位数据起点
    const lNameLen=ev.getUint16(lho+26,true), lExtraLen=ev.getUint16(lho+28,true);
    const start=lho+30+lNameLen+lExtraLen;
    const raw=u8.subarray(start,start+compSize);
    try{ out[name]= await inflateRaw(raw, method); }catch(e){ out[name]=null; }
    p += 46+nameLen+extraLen+cmtLen;
  }
  return out;
};
/* xlsx → [{name, rows}] */
DF.xlsxParse = async function(u8){
  const files=await DF.zipRead(u8);
  const dec = b => b? u8decode(b):'';
  // 共享字符串
  const shared=[];
  const ssXml = files['xl/sharedStrings.xml'] ? dec(files['xl/sharedStrings.xml']) : '';
  if(ssXml){
    const sis = ssXml.match(/<si[\s\S]*?<\/si>/g)||[];
    sis.forEach(si=>{
      const ts = si.match(/<t[^>]*>([\s\S]*?)<\/t>/g)||[];
      shared.push(ts.map(t=>unescXml(t.replace(/<[^>]+>/g,''))).join(''));
    });
  }
  // 工作表名(按 workbook.xml 的 r:id 顺序)
  const wb = files['xl/workbook.xml'] ? dec(files['xl/workbook.xml']) : '';
  const names=(wb.match(/<sheet [^>]*name="([^"]*)"/g)||[]).map(m=>unescXml((m.match(/name="([^"]*)"/)||[])[1]||''));
  const sheetFiles=Object.keys(files).filter(k=>/^xl\/worksheets\/sheet\d+\.xml$/.test(k))
    .sort((a,b)=>(+a.match(/(\d+)/)[1])-(+b.match(/(\d+)/)[1]));
  const sheets=sheetFiles.map((f,si)=>{
    const xml=dec(files[f]);
    const rows=[];
    (xml.match(/<row[^>]*>[\s\S]*?<\/row>/g)||[]).forEach(rowXml=>{
      const rn=+(rowXml.match(/<row[^>]*r="(\d+)"/)||[])[1]||rows.length+1;
      const arr=[];
      (rowXml.match(/<c[^>]*\/>|<c[^>]*>[\s\S]*?<\/c>/g)||[]).forEach(c=>{
        const ref=(c.match(/r="([A-Z]+)\d+"/)||[])[1]||'A';
        let ci=0; for(let i=0;i<ref.length;i++) ci=ci*26+(ref.charCodeAt(i)-64);
        ci-=1;
        const t=(c.match(/t="([^"]+)"/)||[])[1];
        let val='';
        if(t==='inlineStr'){ val=(c.match(/<t[^>]*>([\s\S]*?)<\/t>/)||[])[1]||''; val=unescXml(val); }
        else if(t==='s'){ const idx=+((c.match(/<v>([\s\S]*?)<\/v>/)||[])[1]||-1); val= shared[idx]!==undefined? shared[idx]:''; }
        else { val=unescXml((c.match(/<v>([\s\S]*?)<\/v>/)||[])[1]||''); }
        while(arr.length<ci) arr.push('');
        arr[ci]=val;
      });
      while(rows.length<rn-1) rows.push([]);
      rows[rn-1]=arr;
    });
    return {name:names[si]||('Sheet'+(si+1)), rows:rows.filter(r=>r.some(c=>String(c).trim()!==''))};
  });
  return sheets;
};
function unescXml(s){
  return String(s).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"')
    .replace(/&apos;/g,"'").replace(/&#(\d+);/g,(m,d)=>String.fromCharCode(+d)).replace(/&amp;/g,'&');
}

/* ---------- 格式探测与统一读取 ---------- */
DF.formats = {
  csv: {label:'CSV', ext:'csv', mime:'text/csv', note:'通用表格,Excel/WPS 可直接打开,UTF-8 带 BOM 保证中文不乱码'},
  tsv: {label:'TSV/制表符', ext:'tsv', mime:'text/tab-separated-values', note:'从 Excel 直接复制粘贴即可得到,适合含大量逗号的文本'},
  xlsx:{label:'Excel(.xlsx)', ext:'xlsx', mime:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', note:'双工作表:第 1 页数据、第 2 页字段说明'},
  json:{label:'JSON', ext:'json', mime:'application/json', note:'结构最完整,支持公式、多层级对象,推荐用于课程包/题库/图谱'},
  md:  {label:'Markdown', ext:'md', mime:'text/markdown', note:'文档型内容(大纲/教案/讲义),可直接粘贴到超星文档'}
};
DF.detect = function(filename, mime){
  const n=String(filename||'').toLowerCase();
  if(n.endsWith('.xlsx')||n.endsWith('.xls')) return 'xlsx';
  if(n.endsWith('.csv')) return 'csv';
  if(n.endsWith('.tsv')||n.endsWith('.txt')) return 'tsv';
  if(n.endsWith('.json')) return 'json';
  if(n.endsWith('.md')||n.endsWith('.markdown')) return 'md';
  const m=String(mime||'');
  if(/sheet|excel/.test(m)) return 'xlsx';
  if(/json/.test(m)) return 'json';
  if(/tab-separated/.test(m)) return 'tsv';
  return 'csv';
};
DF.accept = '.csv,.tsv,.txt,.json,.xlsx,.xls';
/* 统一读取:File → {format, rows?, sheets?, json?, text?} */
DF.readFile = function(file){
  return new Promise((resolve,reject)=>{
    const fmt=DF.detect(file.name, file.type);
    if(fmt==='xlsx'){
      const r=new FileReader();
      r.onload=()=>{ DF.xlsxParse(new Uint8Array(r.result))
        .then(sheets=>resolve({format:'xlsx', sheets, rows:(sheets[0]||{rows:[]}).rows}))
        .catch(e=>reject(e)); };
      r.onerror=()=>reject(new Error('文件读取失败'));
      r.readAsArrayBuffer(file);
      return;
    }
    const r=new FileReader();
    r.onload=()=>{
      const text=String(r.result||'');
      if(fmt==='json'){
        try{ resolve({format:'json', json:JSON.parse(text), text}); }
        catch(e){ reject(new Error('JSON 解析失败:请检查是否为合法 JSON(注意中英文引号与结尾逗号)')); }
        return;
      }
      if(fmt==='md'){ resolve({format:'md', text, rows:[[text]]}); return; }
      if(fmt==='tsv' && DF.sniffDelim(text)==='\t') resolve({format:'tsv', text, rows:DF.parseTSV(text)});
      else resolve({format:fmt==='tsv'?'csv':fmt, text, rows:DF.parseCSV(text)});
    };
    r.onerror=()=>reject(new Error('文件读取失败'));
    r.readAsText(file,'utf-8');
  });
};

/* ---------- 统一下载 ---------- */
function downloadBytes(filename, bytes, mime){
  const blob=new Blob([bytes], {type:mime||'application/octet-stream'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=filename;
  a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 3000);
}
function safeName(s){ return String(s||'模板').replace(/[\\\/:*?"<>|]/g,'-').replace(/\s+/g,' ').trim().slice(0,60); }
function today(){ return new Date().toISOString().slice(0,10); }

Object.assign(DF, { u8encode, u8decode, concatU8, crc32, zipBuild, downloadBytes, safeName, today, xmlEsc, colRef });
