// Simple local session persistence + Minimal Composer handoff for the wibem1 fork.
(function(){
  'use strict';
  const KEY='wibem1_abctools_last_session_v1';
  let timer=null,handoffDone=false;

  function decodeIncoming(){
    try{
      let s=new URLSearchParams(location.search).get('abc'); if(!s)return null;
      s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4)s+='=';
      const bytes=Uint8Array.from(atob(s),ch=>ch.charCodeAt(0));
      const text=new TextDecoder().decode(bytes);
      return text.trim()?text:null;
    }catch(e){return null;}
  }
  const incoming=decodeIncoming();

  // Read-only startup diagnostics. Capture state before our restore/handoff code runs.
  let bootStored='', bootStoredAt='', bootTextarea='';
  try{
    const b=JSON.parse(localStorage.getItem(KEY)||'null');
    bootStored=b?.abc||''; bootStoredAt=b?.savedAt||'';
  }catch(e){}
  try{bootTextarea=document.getElementById('abc')?.value||'';}catch(e){}
  function titleOf(v){
    const m=String(v||'').match(/^T:\\s*(.+)$/m);
    return m?m[1].trim():'(kein T:)';
  }
  function addStartDiagnostic(){
    const b=document.createElement('button');
    b.type='button'; b.textContent='Start-Diagnose';
    b.style.cssText='position:fixed;right:8px;bottom:8px;z-index:2147483647;padding:8px 10px';
    b.onclick=()=>{
      let nowStored='',nowAt='';
      try{const n=JSON.parse(localStorage.getItem(KEY)||'null');nowStored=n?.abc||'';nowAt=n?.savedAt||'';}catch(e){}
      let sw='nein';
      try{sw=navigator.serviceWorker?.controller?'ja':'nein';}catch(e){}
      alert(
        'Beim Scriptstart localStorage: '+titleOf(bootStored)+'\\n'+
        'Start-Zeitstempel: '+(bootStoredAt||'(keiner)')+'\\n'+
        'Textfeld beim Scriptstart: '+titleOf(bootTextarea)+'\\n\\n'+
        'Jetzt localStorage: '+titleOf(nowStored)+'\\n'+
        'Jetzt-Zeitstempel: '+(nowAt||'(keiner)')+'\\n'+
        'Jetzt sichtbares Textfeld: '+titleOf(getText())+'\\n'+
        'Incoming ABC: '+(incoming?'ja':'nein')+'\\n'+
        'Service Worker Controller: '+sw
      );
    };
    document.body.appendChild(b);
  }

  function textarea(){return document.getElementById('abc');}
  function getText(){return textarea()?.value||'';}
  function setText(v){
    const ta=textarea(); if(ta)ta.value=v;
    if(typeof window.setABCEditorText==='function'){
      try{window.setABCEditorText(v);}catch(e){}
    }
  }
  function render(){
    try{if(typeof window.RenderAsync==='function')window.RenderAsync(true,null);}catch(e){}
  }
  function save(){
    try{
      const abc=getText();
      if(abc.trim())localStorage.setItem(KEY,JSON.stringify({abc,savedAt:new Date().toISOString()}));
    }catch(e){}
  }
  function saved(){
    try{return JSON.parse(localStorage.getItem(KEY)||'null')?.abc||'';}catch(e){return'';}
  }
  function ready(fn){
    if(window.gCustomInstrumentsInitComplete===true && textarea() && typeof window.RenderAsync==='function')fn();
    else setTimeout(()=>ready(fn),100);
  }

  function start(){
    addStartDiagnostic();
    ready(()=>{
      if(incoming && !handoffDone){
        handoffDone=true;
        setText(incoming); render(); save();
        history.replaceState(null,'',location.pathname+location.hash);
      }else if(!incoming){
        const abc=saved();
        if(abc.trim()){setText(abc);render();}
      }

      const ta=textarea();
      ta.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(save,300);});
      ta.addEventListener('change',save);

      // File/MIDI imports can replace textarea.value programmatically without
      // firing input/change, so compare the visible textarea periodically.
      let last=getText();
      setInterval(()=>{
        const now=getText();
        if(now!==last){last=now;save();}
      },500);

      window.addEventListener('pagehide',save);
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save();});
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();