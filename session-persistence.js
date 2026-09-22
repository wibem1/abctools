// Local session persistence + handoff receiver for the wibem1 fork of ABC Tools.
(function(){
  'use strict';
  const KEY='wibem1_abctools_last_session_v1', HANDOFF='abc';
  let timer=null, attached=false;
  function editor(){
    if(window.gTheCM&&typeof window.gTheCM.getValue==='function')return window.gTheCM;
    const ta=document.getElementById('abc');
    return ta?{getValue:()=>ta.value,setValue:v=>{ta.value=v;ta.dispatchEvent(new Event('input',{bubbles:true}));},clearHistory:()=>{},on:(ev,fn)=>ta.addEventListener('input',fn)}:null;
  }
  function save(ed){try{localStorage.setItem(KEY,JSON.stringify({abc:ed.getValue(),savedAt:new Date().toISOString()}));}catch(e){console.warn('ABC Tools session autosave failed:',e);}}
  function decodeIncoming(){
    try{
      const encoded=new URLSearchParams(location.search).get(HANDOFF); if(!encoded)return null;
      let s=encoded.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4)s+='=';
      const bytes=Uint8Array.from(atob(s),ch=>ch.charCodeAt(0));
      const text=new TextDecoder().decode(bytes);
      return text.trim()?text:null;
    }catch(e){console.warn('ABC Tools handoff decode failed:',e);return null;}
  }
  function setAndRender(ed,text){
    ed.setValue(text); if(ed.clearHistory)ed.clearHistory(); save(ed);
    // ABC Tools normally renders on editor changes; explicitly request its standard render path as fallback.
    try{if(typeof window.RenderABC==='function')window.RenderABC();}catch(e){}
  }
  function restore(ed){
    const incoming=decodeIncoming();
    if(incoming){
      setAndRender(ed,incoming);
      history.replaceState(null,'',location.pathname+location.hash);
      return true;
    }
    try{
      const raw=localStorage.getItem(KEY); if(!raw||ed.getValue().trim())return false;
      const payload=JSON.parse(raw); if(typeof payload.abc!=='string'||!payload.abc.trim())return false;
      setAndRender(ed,payload.abc); return true;
    }catch(e){console.warn('ABC Tools session restore failed:',e);return false;}
  }
  function attach(){
    if(attached)return true;
    const ed=editor(); if(!ed)return false;
    attached=true; restore(ed);
    ed.on('change',function(){clearTimeout(timer);timer=setTimeout(()=>save(ed),350);});
    window.addEventListener('pagehide',()=>save(ed));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save(ed);});
    return true;
  }
  function wait(){if(!attach())setTimeout(wait,100);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait);else wait();
})();