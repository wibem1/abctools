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
  function add(){
    if(document.getElementById('minimal-composer-return'))return;
    const b=document.createElement('button');
    b.id='minimal-composer-return';b.type='button';b.textContent='In Minimal Composer öffnen';
    b.title='Aktuelle ABC-Partitur an Minimal Composer übergeben';
    b.style.cssText='position:fixed;right:14px;top:14px;z-index:10000;padding:9px 12px;border-radius:8px;border:1px solid #777;background:#fff;color:#111;font:14px sans-serif;box-shadow:0 1px 5px #0003';
    b.onclick=function(){const abc=currentABC();if(!abc.trim())return;location.href='https://wibem1.github.io/Minimal-Composer/?abc='+encodeURIComponent(encode(abc));};
    document.body.appendChild(b);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add();
})();