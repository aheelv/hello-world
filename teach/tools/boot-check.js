/* 启动检查:按 index.html 的脚本顺序在沙箱中真实执行,捕获运行时错误 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dir = path.join(__dirname, '..');
const files = ['js/seed.js','js/store.js','js/render.js','js/project-docs.js',
  'js/dataformats.js','js/schemas.js','js/importer.js','js/exporters.js','js/chaoxing.js',
  'js/views.js','js/templates-hub.js','js/views-teach.js','js/documents.js','js/docspace.js',
  'js/search.js','js/help.js','js/main.js'];

const sandbox = {};
sandbox.window = sandbox;
sandbox.self = sandbox;
sandbox.globalThis = sandbox;
sandbox.console = console;
sandbox.setTimeout = setTimeout;
sandbox.clearTimeout = clearTimeout;
sandbox.setInterval = setInterval;
sandbox.clearInterval = clearInterval;
sandbox.requestAnimationFrame = (cb)=>setTimeout(cb,0);
sandbox.addEventListener = (ev,fn)=>{ (sandbox.__ev= sandbox.__ev||{})[ev]=fn; };
sandbox.removeEventListener = ()=>{};
sandbox.navigator = {userAgent:'node', clipboard:{writeText:async()=>{}}};
sandbox.location = {hash:'#/home', href:'http://localhost/index.html', reload(){}};
function fakeEl(id){ return { id, innerHTML:'', style:{}, dataset:{}, tagName:'DIV',
  classList:{add(){},remove(){},toggle(){},contains(){return false;}},
  setAttribute(){}, getAttribute(){return null;}, appendChild(){}, addEventListener(){}, click(){},
  querySelectorAll(){return [];}, querySelector(){return null;}, insertAdjacentHTML(){} }; }
const _els = {};
sandbox.URLSearchParams = URLSearchParams;
sandbox.document = {
  body:{classList:{add(){},remove(){},toggle(){}},appendChild(){},dataset:{}},
  head:{appendChild(){}},
  documentElement:{style:{setProperty(){},}},
  getElementById(id){ return _els[id] || (_els[id]=fakeEl(id)); },
  querySelector(sel){ return fakeEl(sel); },
  querySelectorAll(){ return []; },
  createElement(){ return fakeEl('new'); },
  addEventListener(ev,fn){ (sandbox.__ev= sandbox.__ev||{})[ev]=fn; },
  removeEventListener(){}, cookie:'', execCommand(){}
};
sandbox.localStorage = (()=>{ const m={}; return {getItem:k=>k in m?m[k]:null,setItem:(k,v)=>m[k]=String(v),removeItem:k=>delete m[k],clear(){for(const k in m)delete m[k];}}; })();
sandbox.alert = ()=>{};
sandbox.confirm = ()=>true;
sandbox.prompt = ()=>null;
sandbox.toast = ()=>{};
if (!process.env.NO_CDN) {
  sandbox.marked = { parse:(s)=>String(s) };
  sandbox.katex = { render(){}, renderToString:()=>'' };
  sandbox.mermaid = { initialize(){}, render:async()=>({svg:''}) };
}
sandbox.echarts = process.env.NO_CDN ? undefined : { init:()=>({setOption(){},resize(){},dispose(){}}) };
sandbox.TextEncoder = TextEncoder;
sandbox.TextDecoder = TextDecoder;
sandbox.Response = class { constructor(b){ this._b=b; } get body(){ return { getReader(){ return { read:async()=>({done:true,value:undefined}) }; } }; } async text(){ return ''; } };
sandbox.URL = URL;
sandbox.Blob = class { constructor(){ } };
sandbox.FileReader = class { readAsArrayBuffer(){} readAsText(){} };
sandbox.URL.createObjectURL = ()=>'blob:x';
sandbox.URL.revokeObjectURL = ()=>{};
if (typeof sandbox.window.dispatchEvent !== 'function') sandbox.window.dispatchEvent = ()=>{};

const ctx = vm.createContext(sandbox);

let failed = false;
for (const f of files) {
  const code = fs.readFileSync(path.join(dir, f), 'utf8');
  try {
    vm.runInContext(code, ctx, { filename: f });
    console.log('  载入 OK  ', f);
  } catch (e) {
    failed = true;
    console.log('  !! 载入失败', f, '=>', e && e.message);
    console.log('      ', (e && e.stack || '').split('\n').slice(0,4).join('\n       '));
  }
}

// 尝试真实启动:触发 DOMContentLoaded(与浏览器一致)
console.log('\n--- 尝试启动 (DOMContentLoaded) ---');
try {
  if (sandbox.__ev && typeof sandbox.__ev['DOMContentLoaded']==='function') {
    sandbox.__ev['DOMContentLoaded']();
    console.log('  DOMContentLoaded 执行成功');
    const main = sandbox.document.getElementById('main');
    console.log('  main.innerHTML 长度 =', (main.innerHTML||'').length);
    if (!main.innerHTML) { failed = true; console.log('  !! main 为空 —— 首页未渲染'); }
  } else { failed = true; console.log('  !! DOMContentLoaded 未注册'); }
} catch (e) {
  failed = true;
  console.log('  !! 启动抛错 =>', e && e.message);
  console.log('     ', (e && e.stack || '').split('\n').slice(0,6).join('\n      '));
}

console.log(failed ? '\n=== 结果:存在启动错误 ===' : '\n=== 结果:启动正常 ===');
process.exit(failed ? 1 : 0);
