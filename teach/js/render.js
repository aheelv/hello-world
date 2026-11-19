/* Markdown + KaTeX 公式渲染 & UI 工具 */
const R = {
  md(text){
    if(!text) return '';
    const html = marked.parse(text, {breaks:true});
    return html;
  },
  // 渲染并触发 KaTeX(需 katex auto-render 已加载)
  typeset(el){
    if(window.renderMathInElement){
      try{
        renderMathInElement(el, {
          delimiters:[
            {left:'$$',right:'$$',display:true},
            {left:'$',right:'$',display:false},
            {left:'\\(',right:'\\)',display:false},
            {left:'\\[',right:'\\]',display:true}
          ],
          throwOnError:false
        });
      }catch(e){}
    }
  }
};

function toast(msg){
  const t=document.getElementById('toast');
  const d=document.createElement('div'); d.className='toast-item'; d.textContent=msg;
  t.appendChild(d); setTimeout(()=>d.remove(), 2600);
}

function openModal(html){
  const root=document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-mask" onclick="if(event.target===this)closeModal()"><div class="modal">${html}</div></div>`;
  R.typeset(root);
}
function closeModal(){ document.getElementById('modal-root').innerHTML=''; }

function download(filename, content, mime){
  const blob = new Blob([content], {type:(mime||'text/plain')+';charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  a.click(); URL.revokeObjectURL(a.href);
}
const esc = s => String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
