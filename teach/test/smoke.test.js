/* 冒烟测试加载器:模拟浏览器全局后,在同一作用域执行源码与测试体 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const dir=path.join(__dirname,'..');
// ---- 浏览器桩(沙箱上下文) ----
const mem={};
const _mkEl=id=>({id,appendChild(){},remove(){},innerHTML:'',value:'',style:{},readOnly:false,
  addEventListener(){},dispatchEvent(){},querySelectorAll:()=>[],querySelector:()=>null,
  closest:()=>null,textContent:'',classList:{toggle(){},add(){},remove(){}},dataset:{},focus(){}});
const _els={};
const _el=id=>(_els[id]||(_els[id]=_mkEl(id)));
const ctx={
  console, setTimeout, clearTimeout,
  localStorage:{getItem:k=>mem[k]??null,setItem:(k,v)=>{mem[k]=v},removeItem:k=>{delete mem[k]}},
  document:{getElementById:_el, querySelectorAll:()=>[], querySelector:()=>null,
    createElement:()=>({click(){},style:{},appendChild(){}}), addEventListener(){}},
  Blob:class{}, confirm:()=>true, alert:()=>{}, Event:class{constructor(t){this.type=t}}, FileReader:class{},
  TextEncoder, TextDecoder, Response, DecompressionStream, AbortController,
  marked:{parse:t=>t},
  echarts:{init:()=>({setOption(){},resize(){}})},
  URL:{createObjectURL:()=>'', revokeObjectURL(){}}, URLSearchParams,
  location:{hash:''}, addEventListener(){}, __mem:mem,
  /* 只读文件助手:供测试校验 index.html 与本地库是否就位 */
  __readFile:p=>fs.readFileSync(path.join(dir,p),'utf8'),
  __exists:p=>fs.existsSync(path.join(dir,p)),
  __listDir:p=>fs.readdirSync(path.join(dir,p)),
};
ctx.window=ctx;
vm.createContext(ctx);
// 注入测试助手
vm.runInContext(`
  var __pass=0, __fail=0, __async=[];
  function t(name, fn){ try{ fn(); console.log('PASS',name); __pass++; }catch(e){ console.log('FAIL',name,'→',e.message); __fail++; } }
  function ta(name, fn){ __async.push([name,fn]); }
  function eq(a,b,msg){ if(a!==b) throw new Error((msg||'eq')+': 期望 '+b+', 实际 '+a); }
`, ctx);
// 依次执行源码
['js/seed.js','js/store.js','js/render.js','js/project-docs.js',
 'js/dataformats.js','js/schemas.js','js/importer.js',
 'js/exporters.js','js/chaoxing.js',
 'js/views.js','js/templates-hub.js','js/views-teach.js','js/documents.js','js/docspace.js','js/search.js','js/help.js','js/main.js']
  .forEach(f=>vm.runInContext(fs.readFileSync(path.join(dir,f),'utf8'), ctx, {filename:f}));
// 执行测试体
vm.runInContext(fs.readFileSync(path.join(__dirname,'smoke.tests.inc.js'),'utf8'), ctx);
// 执行异步测试体
(async()=>{
  const list=vm.runInContext('__async', ctx);
  for(const [name,fn] of list){
    try{ await fn(); vm.runInContext('__pass++', ctx); console.log('PASS',name); }
    catch(e){ vm.runInContext('__fail++', ctx); console.log('FAIL',name,'→',e.message); }
  }
  const r=vm.runInContext('({p:__pass,f:__fail})', ctx);
  console.log(`\n结果: ${r.p} 通过, ${r.f} 失败`);
  process.exit(r.f?1:0);
})();
