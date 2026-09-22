// Adds a small return button without modifying ABC Tools core application code.
(function(){
  'use strict';
  function encode(text){
    const bytes=new TextEncoder().encode(text);let bin='';
    for(const b of bytes)bin+=String.fromCharCode(b);
    return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function currentABC(){
    if(typeof window.getABCEditorText==='function')return window.getABCEditorText();
    if(window.gTheCM&&typeof window.gTheCM.getValue==='function')return window.gTheCM.getValue();
    return document.getElementById('abc')?.value||'';
  }
  function selectedTune(text){
    // ABC Tools may contain a tune book. Transfer one X:-tune only.
    const starts=[];const re=/^X:\s*[^\r\n]+/gm;let m;
    while((m=re.exec(text)))starts.push(m.index);
    if(starts.length<=1)return text;
    let cursor=0;
    try{
      if(window.gTheCM&&typeof window.gTheCM.getCursor==='function'&&typeof window.gTheCM.indexFromPos==='function')
        cursor=window.gTheCM.indexFromPos(window.gTheCM.getCursor());
      else {
        const ta=document.getElementById('abc');
        if(ta&&Number.isFinite(ta.selectionStart))cursor=ta.selectionStart;
      }
    }catch(e){}
    let n=0;for(let i=0;i<starts.length;i++){if(starts[i]<=cursor)n=i;else break;}
    const end=n+1<starts.length?starts[n+1]:text.length;
    return text.slice(starts[n],end).trim();
  }
  function add(){
    if(document.getElementById('minimal-composer-return'))return;
    const b=document.createElement('button');
    b.id='minimal-composer-return';b.type='button';b.textContent='In Minimal Composer öffnen';
    b.title='Aktuelle ABC-Partitur an Minimal Composer übergeben';
    b.style.cssText='position:fixed;right:14px;top:14px;z-index:10000;padding:9px 12px;border-radius:8px;border:1px solid #777;background:#fff;color:#111;font:14px sans-serif;box-shadow:0 1px 5px #0003';
    b.onclick=function(){const abc=selectedTune(currentABC());if(!abc.trim())return;location.href='https://wibem1.github.io/Minimal-Composer/?abc='+encodeURIComponent(encode(abc));};
    document.body.appendChild(b);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add();
})();