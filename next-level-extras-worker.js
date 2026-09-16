'use strict';
const exReply=(send,v)=>{try{send(v)}catch{}};
const syncGet=keys=>new Promise(r=>chrome.storage.sync.get(keys,r));
const syncSet=obj=>new Promise((resolve,reject)=>chrome.storage.sync.set(obj,()=>chrome.runtime.lastError?reject(new Error(chrome.runtime.lastError.message)):resolve()));
const syncRemove=keys=>new Promise(r=>chrome.storage.sync.remove(keys,r));
chrome.runtime.onMessage.addListener((m,sender,sendResponse)=>{
  if(!m?.type?.startsWith('nexus:extra:'))return;
  const type=m.type.slice('nexus:extra:'.length);
  (async()=>{
    if(type==='headers'){
      const url=String(m.url||sender.tab?.url||'');
      if(!/^https?:/i.test(url))return{ok:false,error:'HTTP(S) pages only'};
      const r=await fetch(url,{method:'HEAD',cache:'no-store',credentials:'include'});
      return{ok:true,status:r.status,statusText:r.statusText,headers:Object.fromEntries(r.headers.entries())};
    }
    if(type==='cloud-save'){
      const local=await new Promise(r=>chrome.storage.local.get(['nexusSettings','nexusSites','nexusSnippets','nexusWorkspaces','nexusTasks','nexusEvents'],r));
      const savedAt=Date.now(),payload=JSON.stringify({version:1,savedAt,data:local});
      if(new Blob([payload]).size>85000)return{ok:false,error:'Cloud backup is too large. Export a local backup instead.'};
      const old=await syncGet({nexusCloudMeta:null}),oldCount=Number(old.nexusCloudMeta?.chunks||0);
      const chunks=[];for(let i=0;i<payload.length;i+=7000)chunks.push(payload.slice(i,i+7000));
      const obj={nexusCloudMeta:{version:1,savedAt,chunks:chunks.length}};chunks.forEach((chunk,i)=>obj['nexusCloudChunk'+i]=chunk);
      await syncSet(obj);
      if(oldCount>chunks.length)await syncRemove(Array.from({length:oldCount-chunks.length},(_,i)=>'nexusCloudChunk'+(i+chunks.length)));
      return{ok:true,savedAt};
    }
    if(type==='cloud-load'){
      const all=await syncGet(null),meta=all.nexusCloudMeta;
      if(!meta?.chunks)return{ok:false,error:'No cloud backup found'};
      let raw='';for(let i=0;i<meta.chunks;i++)raw+=all['nexusCloudChunk'+i]||'';
      if(!raw)return{ok:false,error:'Cloud backup is incomplete'};
      const payload=JSON.parse(raw);await chrome.storage.local.set(payload.data||{});return{ok:true,savedAt:payload.savedAt||meta.savedAt||0};
    }
    if(type==='group-unpinned'){
      const tabs=await chrome.tabs.query({currentWindow:true});const ids=tabs.filter(t=>!t.pinned&&t.id).map(t=>t.id);if(ids.length<2)return{ok:false,error:'Need at least two unpinned tabs'};
      const id=await chrome.tabs.group({tabIds:ids});if(chrome.tabGroups)await chrome.tabGroups.update(id,{title:String(m.title||'Nexus Group'),color:'blue',collapsed:false});return{ok:true,groupId:id};
    }
    return{ok:false,error:'Unknown extra action'};
  })().then(v=>exReply(sendResponse,v)).catch(e=>exReply(sendResponse,{ok:false,error:e.message}));
  return true;
});
