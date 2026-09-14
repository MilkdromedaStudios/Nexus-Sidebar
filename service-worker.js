'use strict';
const WEATHER='nexus-weather-hourly', CACHE='nexusWeatherCache', PRIORITY=25000;
const get=d=>new Promise(r=>chrome.storage.local.get(d,v=>r(v||d))), set=v=>new Promise(r=>chrome.storage.local.set(v,r));
const respond=(s,v)=>{try{s(v)}catch{}};
async function rules(){return await chrome.declarativeNetRequest.getSessionRules()}
async function frameRule(tabId,on){const all=await rules(),mine=all.filter(r=>r.priority===PRIORITY&&r.condition?.tabIds?.includes(tabId));if(!on){if(mine.length)await chrome.declarativeNetRequest.updateSessionRules({removeRuleIds:mine.map(x=>x.id)});return}if(mine.length)return;let id=100000000+Math.floor(Math.random()*800000000);const used=new Set(all.map(x=>x.id));while(used.has(id))id++;await chrome.declarativeNetRequest.updateSessionRules({addRules:[{id,priority:PRIORITY,action:{type:'modifyHeaders',responseHeaders:[{header:'x-frame-options',operation:'remove'},{header:'content-security-policy',operation:'remove'}]},condition:{resourceTypes:['sub_frame'],tabIds:[tabId]}}]})}
function pattern(raw){const u=new URL(raw),port=u.port?':'+u.port:'';return `${u.protocol}//${u.hostname}${port}/*`}
async function allowCookies(tab,url){if(!tab?.url)return;try{await chrome.contentSettings.cookies.set({primaryPattern:pattern(url),secondaryPattern:pattern(tab.url),setting:'allow',scope:tab.incognito?'incognito_session_only':'regular'})}catch{}}
async function weather(location=''){const loc=String(location||'').trim();try{const r=await fetch('https://wttr.in/'+(loc?encodeURIComponent(loc):'')+'?format=j1',{cache:'no-store'});if(!r.ok)throw Error('Weather '+r.status);const d=await r.json(),c=d.current_condition?.[0],a=d.nearest_area?.[0];if(!c)throw Error('No weather data');const w={temp:String(c.temp_F??'--'),feelsLike:String(c.FeelsLikeF??c.temp_F??'--'),condition:c.weatherDesc?.[0]?.value||'Current conditions',location:[a?.areaName?.[0]?.value,a?.region?.[0]?.value].filter(Boolean).join(', ')};await set({[CACHE]:{key:loc.toLowerCase(),updatedAt:Date.now(),weather:w}});return{ok:true,weather:w}}catch(e){const s=await get({[CACHE]:null});return s[CACHE]?.weather?{ok:true,weather:s[CACHE].weather,stale:true}:{ok:false,error:e.message}}}
async function ensureAlarm(){try{if(!await chrome.alarms.get(WEATHER))await chrome.alarms.create(WEATHER,{periodInMinutes:60})}catch{}}
chrome.runtime.onInstalled.addListener(()=>{ensureAlarm();weather()});chrome.runtime.onStartup.addListener(ensureAlarm);chrome.alarms.onAlarm.addListener(a=>{if(a.name===WEATHER)weather()});ensureAlarm();
chrome.action.onClicked.addListener(async tab=>{if(!tab?.id||!/^(https?|file):/i.test(tab.url||''))return;chrome.tabs.sendMessage(tab.id,{type:'nexus:show'},async()=>{if(!chrome.runtime.lastError)return;try{await chrome.scripting.insertCSS({target:{tabId:tab.id},files:['styles/base.css','styles/themes.css']});await chrome.scripting.executeScript({target:{tabId:tab.id},files:['src/core.js','src/sites.js','src/apps.js','src/games.js','src/settings.js']});}catch{}})});
chrome.tabs.onRemoved.addListener(id=>frameRule(id,false).catch(()=>{}));
chrome.runtime.onMessage.addListener((m,s,sendResponse)=>{if(!m?.type)return;const tabId=s.tab?.id;
  if(m.type==='nexus:show'){chrome.tabs.sendMessage(tabId,{type:'nexus:reveal'});return}
  if(m.type==='nexus:history'){chrome.history.search({text:String(m.query||''),startTime:0,maxResults:100},x=>respond(sendResponse,{ok:true,results:x||[]}));return true}
  if(m.type==='nexus:new-tab'){chrome.tabs.create({},t=>respond(sendResponse,{ok:true,tabId:t?.id}));return true}
  if(m.type==='nexus:reload'){if(tabId)chrome.tabs.reload(tabId,{},()=>respond(sendResponse,{ok:true}));return true}
  if(m.type==='nexus:open-tab'){try{const u=new URL(m.url);if(!/^https?:$/.test(u.protocol))throw 0;chrome.tabs.create({url:u.href},t=>respond(sendResponse,{ok:true,tabId:t?.id}))}catch{respond(sendResponse,{ok:false,error:'Invalid URL'})}return true}
  if(m.type==='nexus:weather'){(async()=>{const loc=String(m.location||'').trim(),s=await get({[CACHE]:null}),c=s[CACHE];if(c?.weather&&c.key===loc.toLowerCase()&&Date.now()-c.updatedAt<3600000)return{ok:true,weather:c.weather,cached:true};return weather(loc)})().then(x=>respond(sendResponse,x));return true}
  if(m.type==='nexus:frame-enable'){if(!tabId){respond(sendResponse,{ok:false});return}frameRule(tabId,true).then(()=>respond(sendResponse,{ok:true})).catch(e=>respond(sendResponse,{ok:false,error:e.message}));return true}
  if(m.type==='nexus:frame-disable'){if(!tabId){respond(sendResponse,{ok:true});return}frameRule(tabId,false).then(()=>respond(sendResponse,{ok:true}));return true}
  if(m.type==='nexus:cookie-allow'){allowCookies(s.tab,String(m.url||'')).then(()=>respond(sendResponse,{ok:true}));return true}
});
