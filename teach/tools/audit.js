/* ============================================================
   全系统静态审查:在 vm 沙箱中载入站点,渲染各角色全部视图,
   扫描内联事件处理器(onclick/onchange/oninput…)与 hash 路由链接,
   报告"调用了不存在的函数/对象"或"指向不存在路由"的问题。
   用法:node tools/audit.js
   ============================================================ */
const fs=require('fs'), path=require('path'), vm=require('vm');
const dir=path.join(__dirname,'..');
const mem={};
const _el=()=>({appendChild(){},remove(){},innerHTML:'',value:'',style:{},readOnly:false,
  addEventListener(){},dispatchEvent(){},querySelectorAll:()=>[],querySelector:()=>null,
  closest:()=>null,textContent:'',classList:{toggle(){},add(){},remove(){}},dataset:{},focus(){}});
const ctx={
  console, setTimeout, clearTimeout,
  localStorage:{getItem:k=>mem[k]??null,setItem:(k,v)=>{mem[k]=v},removeItem:k=>{delete mem[k]}},
  document:{getElementById:_el, querySelectorAll:()=>[], querySelector:()=>null,
    createElement:()=>({click(){},style:{},appendChild(){}}), addEventListener(){}},
  Blob:class{}, confirm:()=>true, alert:()=>{}, Event:class{constructor(t){this.type=t}}, FileReader:class{},
  TextEncoder, TextDecoder, Response, DecompressionStream, AbortController,
  marked:{parse:t=>t}, echarts:{init:()=>({setOption(){},resize(){}})},
  URL:{createObjectURL:()=>'', revokeObjectURL(){}}, URLSearchParams,
  location:{hash:''}, addEventListener(){}, __mem:mem
};
ctx.window=ctx;
vm.createContext(ctx);
['js/seed.js','js/store.js','js/render.js','js/project-docs.js','js/dataformats.js','js/schemas.js',
 'js/importer.js','js/exporters.js','js/chaoxing.js','js/views.js','js/templates-hub.js','js/views-teach.js',
 'js/documents.js','js/docspace.js','js/search.js','js/help.js','js/main.js']
  .forEach(f=>vm.runInContext(fs.readFileSync(path.join(dir,f),'utf8'), ctx, {filename:f}));
vm.runInContext('store.load();', ctx);

/* 渲染各角色全部视图,汇总 HTML */
const ROLES_LIST=['admin','major_leader','group_leader','course_leader','student'];
const ROLE_NAME={admin:'系统管理员',major_leader:'刘院长',group_leader:'赵强',course_leader:'王伟',student:'张同学'};
const html=[];
ROLES_LIST.forEach(r=>{
  vm.runInContext(`auth.user=()=>({role:${JSON.stringify(r)},userName:${JSON.stringify(ROLE_NAME[r])}})`, ctx);
  const views=vm.runInContext(`(function(){ const o={};
    o.h=viewHome(); o.mj=viewMajors(); o.g=viewGroup(); o.c=viewCourses(); o.d=viewDocs();
    o.cl=viewClasses(); o.gp=viewGraph(); o.b=renderBankList(''); o.p=viewPapers();
    o.cx=viewChaoxing(); o.tp=viewTemplates(); o.dt=viewTemplatesHub(); o.dt2=viewTemplatesHub('bank');
    o.s=viewSearch(); o.ds=viewDocSpace(''); o.data=viewData(); o.help=viewHelp('');
    o.cd=viewCourseDetail('c_python','kps'); o.cld=viewClassDetail('cls_py2401','grades');
    o.ce=viewDocEditor('doc_py_syllabus');
    return o; })()`, ctx);
  Object.entries(views).forEach(([k,v])=>{ if(typeof v==='string') html.push(v); });
});
/* 追加:模态与动态片段(部分交互函数内部生成的弹窗 HTML 不在此扫描,已由 smoke 覆盖) */
const all=html.join('\n');

/* --- 1. 内联事件处理器 --- */
const handlers=new Set();
const reHandler=/on(?:click|change|input|submit|keyup|keydown|focus|blur)\s*=\s*"([^"]*)"/g;
let m;
while((m=reHandler.exec(all))){
  const expr=m[1];
  const roots=new Set();
  const reRoot=/(^|[^.\w$])([A-Za-z_$][\w$]*)\s*[.(]/g;
  let mm; while((mm=reRoot.exec(expr))){
    const name=mm[2];
    if(['if','return','const','let','var','typeof','function','new','this','true','false','null','undefined','Number','String','Math','JSON','Object','Array','encodeURIComponent'].includes(name)) continue;
    roots.add(name);
  }
  roots.forEach(r=>handlers.add(r));
}
const missing=[];
handlers.forEach(name=>{
  let t; try{ t=vm.runInContext('typeof '+name, ctx); }catch(e){ t='undefined'; }
  if(t==='undefined') missing.push(name);
});

/* --- 2. hash 路由链接 --- */
const routes=vm.runInContext('Object.keys(routes)', ctx);
const special=['course','class','doc','docspace'];
const navIds=vm.runInContext('NAV.map(n=>n.id)', ctx);
const known=new Set([...routes,...special,...navIds,'']);
const badHref=new Set();
const reHref=/href="#\/([\w-]*)/g;
while((m=reHref.exec(all))){
  const id=m[1];
  if(!known.has(id)) badHref.add(id);
}

/* --- 3. 报告 --- */
console.log('扫描视图片段:', html.length, '份;内联处理器根标识符:', handlers.size, '个');
if(missing.length){ console.log('\n✗ 未定义的处理器引用:'); [...new Set(missing)].sort().forEach(x=>console.log('  ·',x)); }
else console.log('✓ 内联事件处理器均指向已定义的函数/对象');

if(badHref.size){ console.log('\n✗ 指向未知路由的链接:'); [...badHref].sort().forEach(x=>console.log('  · #/'+x)); }
else console.log('✓ 所有 hash 路由链接均指向有效模块');

console.log('\n路由表:', routes.join(', '));
console.log('已知模块 ID:', navIds.join(', '));
process.exit((missing.length||badHref.size)?1:0);
