// Session persistence + Minimal Composer handoff for the wibem1 fork.
(function(){
  'use strict';
  const KEY='wibem1_abctools_last_session_v1';
  let timer=null,handoffDone=false,lastSaved='';

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

  // Use ABC Tools' own editor API. This is essential because the active editor
  // may be the textarea or CodeMirror depending on ABC Tools' current mode.
  function getText(){
    try{
      return typeof window.getABCEditorText==='function'
        ? (window.getABCEditorText()||'')
        : (document.getElementById('abc')?.value||'');
    }catch(e){return'';}
  }
  function setText(v){
    try{
      if(typeof window.setABCEditorText==='function') window.setABCEditorText(v);
      else {
        const ta=document.getElementById('abc');
        if(ta) ta.value=v;
      }
    }catch(e){}
  }
  function render(){
    try{if(typeof window.RenderAsync==='function')window.RenderAsync(true,null);}catch(e){}
  }
  function save(){
    try{
      const abc=getText();
      if(!abc.trim() || abc===lastSaved)return;
      localStorage.setItem(KEY,JSON.stringify({abc,savedAt:new Date().toISOString()}));
      lastSaved=abc;
    }catch(e){}
  }
  function saved(){
    try{return JSON.parse(localStorage.getItem(KEY)||'null')?.abc||'';}catch(e){return'';}
  }
  function ready(fn){
    if(window.gCustomInstrumentsInitComplete===true &&
       typeof window.getABCEditorText==='function' &&
       typeof window.setABCEditorText==='function' &&
       typeof window.RenderAsync==='function') fn();
    else setTimeout(()=>ready(fn),100);
  }
  function titleOf(v){
    const m=String(v||'').match(/^T:\\s*(.+)$/m);
    return m?m[1].trim():'(kein T:)';
  }
  function storedText(){
    try{return JSON.parse(localStorage.getItem(KEY)||'null')?.abc||'';}catch(e){return'';}
  }
  function addPersistenceDiagnostic(){
    const b=document.createElement('button');
    b.type='button';
    b.textContent='Speicher-Diagnose';
    b.style.cssText='position:fixed;right:8px;bottom:8px;z-index:2147483647;padding:8px 10px';
    b.onclick=()=>{
      const rows=[];
      document.querySelectorAll('textarea,input,[contenteditable="true"],.CodeMirror').forEach((el,i)=>{
        let v='';
        try{
          if(el.CodeMirror&&typeof el.CodeMirror.getValue==='function')v=el.CodeMirror.getValue();
          else if(typeof el.value==='string')v=el.value;
          else v=el.innerText||el.textContent||'';
        }catch(e){}
        const cs=getComputedStyle(el);
        const visible=cs.display!=='none'&&cs.visibility!=='hidden'&&el.getClientRects().length>0;
        rows.push(
          (i+1)+'. '+el.tagName+
          ' id='+(el.id||'-')+
          ' class='+(String(el.className||'-').slice(0,40))+
          ' sichtbar='+(visible?'ja':'nein')+
          ' -> '+titleOf(v)
        );
      });
      alert(
        'ABC-Tools-Editor: '+titleOf(getText())+'\\n'+
        'Gespeicherte Session: '+titleOf(storedText())+'\\n'+
        'Identisch: '+(getText()===storedText()?'ja':'nein')+'\\n\\n'+
        'EDITOR-ELEMENTE:\\n'+rows.join('\\n')
      );
    };
    document.body.appendChild(b);
  }

  function start(){
    addPersistenceDiagnostic();
    ready(()=>{
      if(incoming && !handoffDone){
        handoffDone=true;
        setText(incoming);
        render();
        save();
        history.replaceState(null,'',location.pathname+location.hash);
      }else{
        const abc=saved();
        if(abc.trim()){
          setText(abc);
          lastSaved=abc;
          render();
        }
      }

      // ABC Tools imports can replace editor content programmatically without
      // emitting DOM input/change events. Poll the official editor API so the
      // currently active editor is always persisted.
      let lastSeen=getText();
      setInterval(()=>{
        const now=getText();
        if(now!==lastSeen){
          lastSeen=now;
          clearTimeout(timer);
          timer=setTimeout(save,250);
        }
      },400);

      const ta=document.getElementById('abc');
      if(ta){
        ta.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(save,250);});
        ta.addEventListener('change',save);
      }
      window.addEventListener('pagehide',save);
      document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save();});
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();