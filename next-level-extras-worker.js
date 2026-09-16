'use strict';
const exReply=(send,v)=>{try{send(v)}catch{}};
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
      const payload=JSON.stringify({version:1,savedAt:Date.now(),data:local});
      if(new Blob([payload]).size>90000)return{ok:false,error:'Cloud backup is too large. Export a local backup instead.'};
      await new Promise((resolve,reject)=>chrome.storage.sync.set({nexusCloudBackup:payload},()=>chrome.runtime.lastError?reject(new Error(chrome.runtime.lastError.message)):resolve()));
      return{ok:true,savedAt:Date.now()};
    }
    if(type==='cloud-load'){
      const x=await new Promise(r=>chrome.storage.sync.get({nexusCloudBackup:''},r));
      if(!x.nexusCloudBackup)return{ok:false,error:'No cloud backup found'};
      const payload=JSON.parse(x.nexusCloudBackup);await chrome.storage.local.set(payload.data||{});return{ok:true,savedAt:payload.savedAt||0};
    }
    if(type==='group-unpinned'){
      const tabs=await chrome.tabs.query({currentWindow:true});const ids=tabs.filter(t=>!t.pinned&&t.id).map(t=>t.id);if(ids.length<2)return{ok:false,error:'Need at least two unpinned tabs'};
      const id=await chrome.tabs.group({tabIds:ids});if(chrome.tabGroups)await chrome.tabGroups.update(id,{title:String(m.title||'Nexus Group'),color:'blue',collapsed:false});return{ok:true,groupId:id};
    }
    return{ok:false,error:'Unknown extra action'};
  })().then(v=>exReply(sendResponse,v)).catch(e=>exReply(sendResponse,{ok:false,error:e.message}));
  return true;
});
