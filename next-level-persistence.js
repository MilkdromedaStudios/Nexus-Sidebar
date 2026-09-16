'use strict';
const NX_BACKUP_ALARM='nexus-auto-backup-daily';
const pget=d=>new Promise(r=>chrome.storage.local.get(d,v=>r(v||d)));
const pset=v=>new Promise(r=>chrome.storage.local.set(v,r));
async function backup(){
  const all=await new Promise(r=>chrome.storage.local.get(null,r));
  delete all.nexusAutomaticBackups;
  const state=await pget({nexusAutomaticBackups:[]});
  const list=Array.isArray(state.nexusAutomaticBackups)?state.nexusAutomaticBackups:[];
  list.unshift({createdAt:Date.now(),data:all});
  await pset({nexusAutomaticBackups:list.slice(0,5)});
}
async function ensureBackupAlarm(){if(!await chrome.alarms.get(NX_BACKUP_ALARM))await chrome.alarms.create(NX_BACKUP_ALARM,{periodInMinutes:1440});}
async function openStartupWorkspace(){
  const s=await pget({nexusWorkspaces:[],nexusStartupWorkspaceLast:0});
  const ws=(s.nexusWorkspaces||[]).find(x=>x.startup);
  if(!ws||Date.now()-(s.nexusStartupWorkspaceLast||0)<300000)return;
  await pset({nexusStartupWorkspaceLast:Date.now()});
  for(const tab of ws.tabs||[]){try{if(/^https?:/.test(tab.url||''))await chrome.tabs.create({url:tab.url,active:false});}catch{}}
}
chrome.alarms.onAlarm.addListener(a=>{if(a.name===NX_BACKUP_ALARM)backup().catch(()=>{});});
chrome.runtime.onInstalled.addListener(()=>{ensureBackupAlarm();backup().catch(()=>{});});
chrome.runtime.onStartup.addListener(()=>{ensureBackupAlarm();backup().catch(()=>{});openStartupWorkspace().catch(()=>{});});
ensureBackupAlarm().catch(()=>{});
