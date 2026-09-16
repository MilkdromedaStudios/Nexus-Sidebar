'use strict';

const NX = {
  menus: [
    ['nexus-define','Define "%s"'],
    ['nexus-ask-chatgpt','Ask ChatGPT about "%s"'],
    ['nexus-save-note','Save selection to Nexus Notes'],
    ['nexus-search','Search the web for "%s"'],
    ['nexus-copy-markdown','Copy selection as Markdown quote'],
    ['nexus-focus-site','Focus on this site for 25 minutes']
  ],
  usageAlarm: 'nexus-site-usage-minute'
};

const nxGet = defaults => new Promise(resolve => chrome.storage.local.get(defaults, v => resolve(v || defaults)));
const nxSet = value => new Promise(resolve => chrome.storage.local.set(value, resolve));
const reply = (send, value) => { try { send(value); } catch {} };

async function setupMenus() {
  if (!chrome.contextMenus) return;
  await new Promise(resolve => chrome.contextMenus.removeAll(resolve));
  for (const [id,title] of NX.menus) { try { chrome.contextMenus.create({ id, title, contexts:['selection'] }); } catch {} }
  try {
    chrome.contextMenus.create({ id:'nexus-page-root', title:'Nexus Sidebar', contexts:['page'] });
    chrome.contextMenus.create({ id:'nexus-page-note', parentId:'nexus-page-root', title:'Save page to Reading List', contexts:['page'] });
    chrome.contextMenus.create({ id:'nexus-page-focus', parentId:'nexus-page-root', title:'Start 25-minute focus here', contexts:['page'] });
    chrome.contextMenus.create({ id:'nexus-page-screenshot', parentId:'nexus-page-root', title:'Capture visible page', contexts:['page'] });
  } catch {}
}

async function dictionary(word) {
  const clean = String(word || '').trim().split(/\s+/)[0].replace(/[^A-Za-z'-]/g,'').slice(0,60);
  if (!clean) return { ok:false, error:'Select a single word.' };
  try {
    const r = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(clean), { cache:'no-store' });
    if (!r.ok) throw new Error('No definition found');
    const data = await r.json();
    const entry = data?.[0];
    const meanings = (entry?.meanings || []).flatMap(m => (m.definitions || []).slice(0,2).map(d => ({
      partOfSpeech:m.partOfSpeech || '', definition:d.definition || '', example:d.example || ''
    }))).slice(0,6);
    return { ok:true, word:entry?.word || clean, phonetic:entry?.phonetic || entry?.phonetics?.find(x=>x.text)?.text || '', meanings };
  } catch (e) { return { ok:false, word:clean, error:e.message || 'Definition unavailable' }; }
}

async function addNote(text, sourceUrl='', title='') {
  const state = await nxGet({ nexusNotesLibrary: [] });
  const list = Array.isArray(state.nexusNotesLibrary) ? state.nexusNotesLibrary : [];
  const note = { id:crypto.randomUUID(), text:String(text||'').trim(), sourceUrl, title, createdAt:Date.now(), pinned:false };
  list.unshift(note);
  await nxSet({ nexusNotesLibrary:list.slice(0,500) });
  return note;
}
async function addReading(url, title='') {
  const state = await nxGet({ nexusReadingList: [] });
  const list = Array.isArray(state.nexusReadingList) ? state.nexusReadingList : [];
  if (!list.some(x=>x.url===url)) list.unshift({ id:crypto.randomUUID(), url, title:title||url, addedAt:Date.now(), done:false });
  await nxSet({ nexusReadingList:list.slice(0,500) });
}
async function startFocusForSite(url, minutes=25) {
  let host=''; try { host=new URL(url).hostname; } catch {}
  const until=Date.now()+Math.max(1,minutes)*60000;
  await nxSet({ nexusFocusMode:{active:true,mode:'whitelist',allowedHosts:host?[host]:[],blockedHosts:[],until,startedAt:Date.now()} });
  try {
    await chrome.alarms.clear('nexus-pomodoro-finish');
    await nxSet({ nexusPomodoro:{mode:'focus',durationSec:minutes*60,remainingSec:minutes*60,running:true,endAt:until} });
    await chrome.alarms.create('nexus-pomodoro-finish',{when:until});
  } catch {}
  return {host,until};
}
async function captureVisible(tab) {
  try { return {ok:true,dataUrl:await chrome.tabs.captureVisibleTab(tab.windowId,{format:'png'})}; }
  catch(e){ return {ok:false,error:e.message}; }
}

chrome.contextMenus?.onClicked.addListener(async (info, tab) => {
  const text=String(info.selectionText||'').trim();
  if(info.menuItemId==='nexus-define') {
    const result=await dictionary(text); if(tab?.id) chrome.tabs.sendMessage(tab.id,{type:'nexus:show-definition',result},()=>void chrome.runtime.lastError);
  } else if(info.menuItemId==='nexus-ask-chatgpt') {
    if(tab?.id) chrome.tabs.sendMessage(tab.id,{type:'nexus:context-action',action:'ask-chatgpt',text},()=>void chrome.runtime.lastError);
  } else if(info.menuItemId==='nexus-save-note') {
    await addNote(text,tab?.url||'',tab?.title||''); if(tab?.id) chrome.tabs.sendMessage(tab.id,{type:'nexus:toast',text:'Saved to Nexus Notes'},()=>void chrome.runtime.lastError);
  } else if(info.menuItemId==='nexus-search') chrome.tabs.create({url:'https://www.google.com/search?q='+encodeURIComponent(text)});
  else if(info.menuItemId==='nexus-copy-markdown') {
    if(tab?.id) chrome.tabs.sendMessage(tab.id,{type:'nexus:context-action',action:'copy-markdown',text},()=>void chrome.runtime.lastError);
  } else if(info.menuItemId==='nexus-focus-site'||info.menuItemId==='nexus-page-focus') {
    await startFocusForSite(tab?.url||'',25); if(tab?.id) chrome.tabs.sendMessage(tab.id,{type:'nexus:toast',text:'25-minute focus started'},()=>void chrome.runtime.lastError);
  } else if(info.menuItemId==='nexus-page-note') {
    await addReading(tab?.url||'',tab?.title||''); if(tab?.id) chrome.tabs.sendMessage(tab.id,{type:'nexus:toast',text:'Added to Reading List'},()=>void chrome.runtime.lastError);
  } else if(info.menuItemId==='nexus-page-screenshot') {
    const shot=await captureVisible(tab); if(shot.ok) await chrome.downloads.download({url:shot.dataUrl,filename:`Nexus-Screenshot-${Date.now()}.png`,saveAs:true});
  }
});

async function trackUsage(){
  try{
    const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});
    if(!tab?.url||!/^https?:/i.test(tab.url)) return;
    const host=new URL(tab.url).hostname,key=new Date().toISOString().slice(0,10);
    const state=await nxGet({nexusSiteUsage:{}}),usage=state.nexusSiteUsage||{}; usage[key]||={}; usage[key][host]=(usage[key][host]||0)+1;
    const days=Object.keys(usage).sort().slice(-31); await nxSet({nexusSiteUsage:Object.fromEntries(days.map(d=>[d,usage[d]]))});
  }catch{}
}
async function ensureUsageAlarm(){ if(!await chrome.alarms.get(NX.usageAlarm)) await chrome.alarms.create(NX.usageAlarm,{periodInMinutes:1}); }
chrome.alarms.onAlarm.addListener(a=>{if(a.name===NX.usageAlarm)trackUsage();});
chrome.runtime.onInstalled.addListener(()=>{setupMenus();ensureUsageAlarm();});
chrome.runtime.onStartup.addListener(()=>{setupMenus();ensureUsageAlarm();});
setupMenus().catch(()=>{}); ensureUsageAlarm().catch(()=>{});

chrome.runtime.onMessage.addListener((m,sender,sendResponse)=>{
  if(!m?.type?.startsWith('nexus:next:')) return;
  const type=m.type.slice('nexus:next:'.length);
  (async()=>{
    if(type==='tabs') { const tabs=await chrome.tabs.query({currentWindow:true}); return {ok:true,tabs:tabs.map(t=>({id:t.id,title:t.title,url:t.url,active:t.active,pinned:t.pinned,muted:t.mutedInfo?.muted,groupId:t.groupId,favIconUrl:t.favIconUrl}))}; }
    if(type==='tab-activate'){await chrome.tabs.update(Number(m.id),{active:true});return{ok:true};}
    if(type==='tab-close'){await chrome.tabs.remove(Number(m.id));return{ok:true};}
    if(type==='tab-pin'){const t=await chrome.tabs.get(Number(m.id));await chrome.tabs.update(t.id,{pinned:!t.pinned});return{ok:true};}
    if(type==='tab-mute'){const t=await chrome.tabs.get(Number(m.id));await chrome.tabs.update(t.id,{muted:!t.mutedInfo?.muted});return{ok:true};}
    if(type==='tab-duplicate'){const t=await chrome.tabs.duplicate(Number(m.id));return{ok:true,tabId:t?.id};}
    if(type==='group-tabs'){const ids=(m.ids||[]).map(Number).filter(Boolean);if(!ids.length)return{ok:false,error:'No tabs selected'};const groupId=await chrome.tabs.group({tabIds:ids});if(chrome.tabGroups)await chrome.tabGroups.update(groupId,{title:String(m.title||'Nexus Group'),color:String(m.color||'blue'),collapsed:false});return{ok:true,groupId};}
    if(type==='recently-closed'){const sessions=await chrome.sessions.getRecentlyClosed({maxResults:20});return{ok:true,sessions:sessions.map(x=>x.tab?{kind:'tab',sessionId:x.tab.sessionId,title:x.tab.title,url:x.tab.url}:{kind:'window',sessionId:x.window?.sessionId,title:`Window · ${x.window?.tabs?.length||0} tabs`})};}
    if(type==='restore-session'){await chrome.sessions.restore(String(m.sessionId||''));return{ok:true};}
    if(type==='top-sites') return {ok:true,sites:await chrome.topSites.get()};
    if(type==='bookmarks'){const q=String(m.query||'').trim();return{ok:true,items:q?await chrome.bookmarks.search(q):await chrome.bookmarks.getTree()};}
    if(type==='bookmark-add'){return{ok:true,item:await chrome.bookmarks.create({title:String(m.title||m.url||'Bookmark'),url:String(m.url||'')})};}
    if(type==='downloads'){const items=await chrome.downloads.search({limit:50,orderBy:['-startTime']});return{ok:true,items:items.map(x=>({id:x.id,filename:x.filename,url:x.url,state:x.state,bytesReceived:x.bytesReceived,totalBytes:x.totalBytes,startTime:x.startTime}))};}
    if(type==='download-open'){chrome.downloads.open(Number(m.id));return{ok:true};}
    if(type==='download-show'){chrome.downloads.show(Number(m.id));return{ok:true};}
    if(type==='capture')return captureVisible(sender.tab||(await chrome.tabs.query({active:true,currentWindow:true}))[0]);
    if(type==='capture-save'){const tab=sender.tab||(await chrome.tabs.query({active:true,currentWindow:true}))[0],shot=await captureVisible(tab);if(!shot.ok)return shot;return{ok:true,id:await chrome.downloads.download({url:shot.dataUrl,filename:`Nexus-Screenshot-${Date.now()}.png`,saveAs:!!m.saveAs})};}
    if(type==='define')return dictionary(m.word);
    if(type==='note-add')return{ok:true,note:await addNote(m.text,m.url,m.title)};
    if(type==='reading-add'){await addReading(m.url,m.title);return{ok:true};}
    if(type==='focus-site')return{ok:true,...await startFocusForSite(m.url||sender.tab?.url||'',Number(m.minutes)||25)};
    if(type==='open'){const t=await chrome.tabs.create({url:String(m.url)});return{ok:true,tabId:t.id};}
    if(type==='notify'){const pref=await nxGet({nexusDoNotDisturb:false});if(pref.nexusDoNotDisturb)return{ok:true,suppressed:true};return{ok:true,id:await chrome.notifications.create('nexus-next-'+Date.now(),{type:'basic',iconUrl:chrome.runtime.getURL('icons/icon.png'),title:String(m.title||'Nexus'),message:String(m.message||''),priority:1})};}
    if(type==='health'){const tabs=await chrome.tabs.query({}),bytes=await chrome.storage.local.getBytesInUse(null),state=await nxGet({nexusPomodoro:null,nexusUpdateStatus:null,nexusNotesLibrary:[],nexusReadingList:[],nexusTasks:[],nexusWorkspaces:[]});return{ok:true,health:{version:chrome.runtime.getManifest().version,tabs:tabs.length,storageBytes:bytes,pomodoro:state.nexusPomodoro,update:state.nexusUpdateStatus,notes:state.nexusNotesLibrary?.length||0,reading:state.nexusReadingList?.length||0,tasks:state.nexusTasks?.length||0,workspaces:state.nexusWorkspaces?.length||0}};}
    if(type==='storage-export'){const all=await new Promise(r=>chrome.storage.local.get(null,r));return{ok:true,data:all};}
    if(type==='storage-import'){if(!m.data||typeof m.data!=='object')return{ok:false,error:'Invalid backup'};await chrome.storage.local.set(m.data);return{ok:true};}
    return{ok:false,error:'Unknown Nexus action'};
  })().then(x=>reply(sendResponse,x)).catch(e=>reply(sendResponse,{ok:false,error:e.message}));
  return true;
});
