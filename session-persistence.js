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
  // Capture the persistent state immediately when this script is evaluated,
  // before our code is allowed to save or restore anything.
  let bootSavedABC='',bootSavedAt='';
  try{
    const boot=JSON.parse(localStorage.getItem(KEY)||'null');
    bootSavedABC=boot?.abc||'';bootSavedAt=boot?.savedAt||'';
  }catch(e){}
  let diagnosticOnly=true;

  function getText(){try{
    // On touch/mobile ABC Tools edits the real textarea. Its own helper can
    // still point at the previous tune, so the visible textarea is authoritative.
    const ta=document.getElementById('abc');
    if(ta&&typeof ta.value==='string')return ta.value;
    if(window.gTheCM&&typeof window.gTheCM.getValue==='function')return window.gTheCM.getValue();
    if(typeof getABCEditorText==='function')return getABCEditorText();
    return '';
  }catch(e){return'';}}
  function setText(v){
    const ta=document.getElementById('abc');
    if(ta)ta.value=v;
    if(window.gTheCM&&typeof window.gTheCM.setValue==='function')window.gTheCM.setValue(v);
    else if(typeof setABCEditorText==='function')setABCEditorText(v);
  }
  function save(){if(diagnosticOnly)return;try{const abc=getText();if(!abc.trim()||abc===lastSavedText)return;localStorage.setItem(KEY,JSON.stringify({abc,savedAt:new Date().toISOString()}));lastSavedText=abc;}catch(e){}}

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

  function attachPersistenceWhenReady(){
    // Diagnostic build: deliberately do not restore and do not arm autosave.
    // This lets us observe the untouched localStorage value across a real restart.
    return;
  }

  function titleOf(s){const m=String(s||'').match(/^T:\s*(.*)$/m);return m?m[1].trim():'(kein T:)';}
  function addDiagnostic(){
    if(document.getElementById('abc-session-diagnostic'))return;
    const b=document.createElement('button');
    b.id='abc-session-diagnostic';b.type='button';b.textContent='Start-Diagnose';
    b.style.cssText='position:fixed;right:14px;top:58px;z-index:10000;padding:8px 11px;border-radius:8px;border:1px solid #777;background:#fff;color:#111;font:13px sans-serif;box-shadow:0 1px 5px #0003';
    b.onclick=function(){
      let saved='',savedAt='';
      try{const p=JSON.parse(localStorage.getItem(KEY)||'null');saved=p?.abc||'';savedAt=p?.savedAt||'';}catch(e){}
      const live=getText(),ta=document.getElementById('abc')?.value||'',cm=(window.gTheCM&&typeof window.gTheCM.getValue==='function')?window.gTheCM.getValue():'';
      alert('ABC Tools START-Diagnose (schreibgeschützt)\n\nBeim Scriptstart gespeichert: '+titleOf(bootSavedABC)+'\nStart-Zeitstempel: '+(bootSavedAt||'(keine)')+'\n\nJetzt im Speicher: '+titleOf(saved)+'\nJetzt-Zeitstempel: '+(savedAt||'(keine)')+'\n\nLive getText: '+titleOf(live)+'\nCodeMirror: '+titleOf(cm)+'\nTextarea: '+titleOf(ta)+'\n\nStartup fertig: '+String(window.gCustomInstrumentsInitComplete===true)+'\nIncoming URL: '+String(!!incoming));
    };
    document.body.appendChild(b);
  }
  function start(){addDiagnostic();applyHandoffWhenReady();attachPersistenceWhenReady();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();