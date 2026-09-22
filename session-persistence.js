// Local session persistence + handoff receiver for the wibem1 fork of ABC Tools.
(function(){
  'use strict';
  const KEY='wibem1_abctools_last_session_v1';
  const HANDOFF='abc';
  let timer=null;
  function save(cm){try{localStorage.setItem(KEY,JSON.stringify({abc:cm.getValue(),savedAt:new Date().toISOString()}));}catch(e){console.warn('ABC Tools session autosave failed:',e);}}
  function incomingABC(){
    try{
      const p=new URLSearchParams(location.search), encoded=p.get(HANDOFF);
      if(!encoded)return null;
      const text=decodeURIComponent(escape(atob(encoded.replace(/-/g,'+').replace(/_/g,'/'))));
      return text.trim()?text:null;
    }catch(e){console.warn('ABC Tools handoff decode failed:',e);return null;}
  }
  function restore(cm){
    try{
      const incoming=incomingABC();
      if(incoming){
        cm.setValue(incoming); cm.clearHistory(); save(cm);
        history.replaceState(null,'',location.pathname+location.hash);
        return true;
      }
      const raw=localStorage.getItem(KEY); if(!raw)return false;
      const payload=JSON.parse(raw);
      if(typeof payload.abc!=='string'||!payload.abc.trim()||cm.getValue().trim())return false;
      cm.setValue(payload.abc); cm.clearHistory(); return true;
    }catch(e){console.warn('ABC Tools session restore failed:',e);return false;}
  }
  function attach(){
    const host=document.querySelector('.CodeMirror'),cm=host&&host.CodeMirror;if(!cm)return false;
    restore(cm);
    cm.on('change',function(){clearTimeout(timer);timer=setTimeout(function(){save(cm);},350);});
    window.addEventListener('pagehide',function(){save(cm);});
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')save(cm);});
    return true;
  }
  function wait(){if(!attach())setTimeout(wait,100);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait);else wait();
})();