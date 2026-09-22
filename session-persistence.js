// Local session persistence for the wibem1 fork of ABC Tools.
// Keeps the current ABC editor contents across browser/app restarts.
(function(){
  'use strict';
  const KEY='wibem1_abctools_last_session_v1';
  let timer=null;
  function save(cm){
    try{localStorage.setItem(KEY,JSON.stringify({abc:cm.getValue(),savedAt:new Date().toISOString()}));}
    catch(e){console.warn('ABC Tools session autosave failed:',e);}
  }
  function restore(cm){
    try{
      const raw=localStorage.getItem(KEY);
      if(!raw)return false;
      const payload=JSON.parse(raw);
      if(typeof payload.abc!=='string'||!payload.abc.trim())return false;
      if(cm.getValue().trim())return false;
      cm.setValue(payload.abc);
      cm.clearHistory();
      return true;
    }catch(e){console.warn('ABC Tools session restore failed:',e);return false;}
  }
  function attach(){
    const host=document.querySelector('.CodeMirror');
    const cm=host&&host.CodeMirror;
    if(!cm)return false;
    restore(cm);
    cm.on('change',function(){clearTimeout(timer);timer=setTimeout(function(){save(cm);},350);});
    window.addEventListener('pagehide',function(){save(cm);});
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')save(cm);});
    return true;
  }
  function wait(){if(!attach())setTimeout(wait,100);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wait);else wait();
})();