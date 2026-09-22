// Local session persistence + Minimal Composer handoff for the wibem1 fork of ABC Tools.
(function(){
  'use strict';
  const KEY='wibem1_abctools_last_session_v1';
  let timer=null,attached=false,handoffDone=false,lastSavedText='';

  function decodeIncoming(){
    try{
      let s=new URLSearchParams(location.search).get('abc'); if(!s)return null;
      s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4)s+='=';
      const bytes=Uint8Array.from(atob(s),ch=>ch.charCodeAt(0));
      const text=new TextDecoder().decode(bytes);
      return text.trim()?text:null;
    }catch(e){console.warn('ABC Tools handoff decode failed:',e);return null;}
  }
  const incoming=decodeIncoming();

  function getText(){try{
    if(window.gTheCM&&typeof window.gTheCM.getValue==='function')return window.gTheCM.getValue();
    if(typeof getABCEditorText==='function')return getABCEditorText();
    return document.getElementById('abc')?.value||'';
  }catch(e){return'';}}
  function setText(v){if(typeof setABCEditorText==='function')setABCEditorText(v);else{const ta=document.getElementById('abc');if(ta)ta.value=v;}}
  function save(){try{const abc=getText();if(!abc.trim()||abc===lastSavedText)return;localStorage.setItem(KEY,JSON.stringify({abc,savedAt:new Date().toISOString()}));lastSavedText=abc;}catch(e){}}

  function applyHandoffWhenReady(){
    if(!incoming||handoffDone)return;
    // ABC Tools has its own asynchronous startup. Do not inject before it has
    // finished clearing/restoring its editor, otherwise startup overwrites us.
    if(window.gCustomInstrumentsInitComplete!==true || typeof window.RenderAsync!=='function'){
      setTimeout(applyHandoffWhenReady,100); return;
    }
    handoffDone=true;
    setText(incoming);
    try{window.gIsFromShare=false;window.gIsDirty=true;window.gABCFromFile=true;}catch(e){}
    save();
    window.RenderAsync(true,null,function(){
      try{if(typeof window.DoMinimize==='function')window.DoMinimize();}catch(e){}
    });
    history.replaceState(null,'',location.pathname+location.hash);
  }

  function attachPersistence(){
    if(attached)return;
    const cm=window.gTheCM,ta=document.getElementById('abc');
    if(!cm&&!ta){setTimeout(attachPersistence,100);return;}
    attached=true;
    if(!incoming && !getText().trim()){
      try{const p=JSON.parse(localStorage.getItem(KEY)||'null');if(p&&p.abc){setText(p.abc);if(typeof window.RenderAsync==='function')window.RenderAsync(true,null);}}catch(e){}
    }
    if(cm&&typeof cm.on==='function')cm.on('change',()=>{clearTimeout(timer);timer=setTimeout(save,350);});
    else ta.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(save,350);});
    // Programmatic file loads in ABC Tools do not reliably emit an input event
    // on the original textarea. Poll the live editor as a safety net.
    setInterval(save,750);
    window.addEventListener('pagehide',save);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save();});
  }

  function start(){attachPersistence();applyHandoffWhenReady();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();