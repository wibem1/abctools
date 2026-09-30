// Session persistence + ComposeMe / Minimal Composer handoff for the wibem1 fork.
(function(){
  'use strict';
  const KEY='wibem1_abctools_last_session_v1';
  let timer=null,handoffDone=false,lastSaved='';

  function decodeBase64Url(value){
    let s=String(value||'').replace(/-/g,'+').replace(/_/g,'/');
    while(s.length%4)s+='=';
    return Uint8Array.from(atob(s),ch=>ch.charCodeAt(0));
  }
  function incomingPayload(){
    try{
      const q=new URLSearchParams(location.search);
      const abc=q.get('abc');
      if(abc){
        const text=new TextDecoder().decode(decodeBase64Url(abc));
        return text.trim()?{format:'abc',text}:null;
      }
      const musicxml=q.get('musicxml');
      if(musicxml){
        const text=new TextDecoder().decode(decodeBase64Url(musicxml));
        return text.trim()?{format:'musicxml',text}:null;
      }
      const midi=q.get('midi');
      if(midi){
        const bytes=decodeBase64Url(midi);
        return bytes.length?{format:'midi',bytes}:null;
      }
      return null;
    }catch(e){return null;}
  }
  const incoming=incomingPayload();

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
  function importAsFile(payload){
    const input=document.getElementById('selectabcfile');
    if(!input||typeof DataTransfer!=='function')return false;
    let file;
    if(payload.format==='musicxml'){
      file=new File([payload.text],'ComposeMe.musicxml',{type:'application/vnd.recordare.musicxml+xml'});
    }else if(payload.format==='midi'){
      file=new File([payload.bytes],'ComposeMe.mid',{type:'audio/midi'});
    }else return false;
    const transfer=new DataTransfer();
    transfer.items.add(file);
    input.files=transfer.files;
    input.dispatchEvent(new Event('change',{bubbles:true}));
    return true;
  }

  function start(){
    ready(()=>{
      if(incoming && !handoffDone){
        handoffDone=true;
        if(incoming.format==='abc'){
          setText(incoming.text);
          render();
          save();
        }else if(!importAsFile(incoming)){
          console.warn('ABC Tools handoff could not import',incoming.format);
        }
        history.replaceState(null,'',location.pathname+location.hash);
      }else{
        const abc=saved();
        if(abc.trim()){
          setText(abc);
          lastSaved=abc;
          render();
        }
      }

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