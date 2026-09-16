'use strict';

const POMODORO_ALARM = 'nexus-pomodoro-finish';
const POMODORO_KEY = 'nexusPomodoro';
const HISTORY_KEY = 'nexusFocusHistory';
const PREFS_KEY = 'nexusPomodoroPrefs';
const NOTICE_KEY = 'nexusNotificationLog';
const DEFAULT_POMODORO = { mode:'focus', durationSec:1500, remainingSec:1500, running:false, endAt:0, label:'Focus' };
const DEFAULT_PREFS = { shortBreakMinutes:5, longBreakMinutes:15, longBreakEvery:4, silent:false, sound:'default', autoSuggestBreak:true };
const pGet = d => new Promise(r => chrome.storage.local.get(d, v => r(v || d)));
const pSet = v => new Promise(r => chrome.storage.local.set(v, r));

async function getPomodoro() {
  const data = await pGet({ [POMODORO_KEY]: DEFAULT_POMODORO });
  const state = { ...DEFAULT_POMODORO, ...(data[POMODORO_KEY] || {}) };
  if (state.running && state.endAt) {
    state.remainingSec = Math.max(0, (state.endAt - Date.now()) / 1000);
    if (state.remainingSec <= 0) {
      state.running = false; state.endAt = 0; state.remainingSec = 0;
      await pSet({ [POMODORO_KEY]: state });
    }
  }
  return state;
}
async function savePomodoro(state) { await pSet({ [POMODORO_KEY]: state }); return state; }
async function schedulePomodoro(state) { await chrome.alarms.clear(POMODORO_ALARM); if (state.running && state.endAt > Date.now()) await chrome.alarms.create(POMODORO_ALARM, { when: state.endAt }); }
async function startPomodoro() { const state=await getPomodoro(); if(state.running)return state; if(!state.remainingSec||state.remainingSec<=0)state.remainingSec=state.durationSec||1500;state.running=true;state.endAt=Date.now()+state.remainingSec*1000;await savePomodoro(state);await schedulePomodoro(state);return state; }
async function pausePomodoro() { const state=await getPomodoro(); if(state.running&&state.endAt)state.remainingSec=Math.max(0,(state.endAt-Date.now())/1000);state.running=false;state.endAt=0;await chrome.alarms.clear(POMODORO_ALARM);return savePomodoro(state); }
async function resetPomodoro() { await chrome.alarms.clear(POMODORO_ALARM); return savePomodoro({ ...DEFAULT_POMODORO }); }
async function setPomodoro(minutes, mode, label='') { const mins=Math.max(1,Math.min(180,Number(minutes)||25)),durationSec=Math.round(mins*60);await chrome.alarms.clear(POMODORO_ALARM);return savePomodoro({mode:mode==='break'?'break':'focus',durationSec,remainingSec:durationSec,running:false,endAt:0,label:String(label|| (mode==='break'?'Break':'Focus')).slice(0,60)}); }

async function logNotice(title,message){const s=await pGet({[NOTICE_KEY]:[]});const list=Array.isArray(s[NOTICE_KEY])?s[NOTICE_KEY]:[];list.unshift({id:crypto.randomUUID(),title,message,createdAt:Date.now(),read:false});await pSet({[NOTICE_KEY]:list.slice(0,100)});}
async function finishPomodoro() {
  const state=await getPomodoro(); if(!state.running&&state.remainingSec>0)return;
  const finishedMode=state.mode, durationSec=state.durationSec||0, label=state.label|| (finishedMode==='break'?'Break':'Focus');
  const data=await pGet({[HISTORY_KEY]:[],[PREFS_KEY]:DEFAULT_PREFS,nexusDoNotDisturb:false});
  const history=Array.isArray(data[HISTORY_KEY])?data[HISTORY_KEY]:[],prefs={...DEFAULT_PREFS,...(data[PREFS_KEY]||{})};
  history.unshift({id:crypto.randomUUID(),mode:finishedMode,durationSec,label,finishedAt:Date.now()});
  const trimmed=history.slice(0,500);
  state.running=false;state.endAt=0;state.remainingSec=0;
  if(finishedMode==='focus'&&prefs.autoSuggestBreak){const today=new Date().toDateString(),count=trimmed.filter(x=>x.mode==='focus'&&new Date(x.finishedAt).toDateString()===today).length;const long=count>0&&count%Math.max(1,prefs.longBreakEvery||4)===0;state.suggestedBreakMinutes=long?(prefs.longBreakMinutes||15):(prefs.shortBreakMinutes||5);}
  await pSet({[POMODORO_KEY]:state,[HISTORY_KEY]:trimmed});
  const title=finishedMode==='break'?'Break finished':'Focus session finished',message=finishedMode==='break'?'Ready to focus again?':state.suggestedBreakMinutes?`Nice work. Suggested break: ${state.suggestedBreakMinutes} minutes.`:'Nice work. Time for a short break.';
  await logNotice(title,message);
  if(!data.nexusDoNotDisturb&&!prefs.silent){try{await chrome.notifications.create('nexus-pomodoro-'+Date.now(),{type:'basic',iconUrl:chrome.runtime.getURL('icons/icon.png'),title,message,priority:2});}catch{}}
}
async function restorePomodoroAlarm(){const state=await getPomodoro();if(state.running&&state.endAt>Date.now())await schedulePomodoro(state);else if(state.running)await finishPomodoro();}
async function getHistorySummary(){const d=await pGet({[HISTORY_KEY]:[]}),h=d[HISTORY_KEY]||[],days={};for(const x of h.filter(x=>x.mode==='focus')){const k=new Date(x.finishedAt).toISOString().slice(0,10);days[k]=(days[k]||0)+1;}let streak=0,day=new Date();while(days[day.toISOString().slice(0,10)]){streak++;day=new Date(day.getTime()-86400000);}return{history:h.slice(0,100),today:days[new Date().toISOString().slice(0,10)]||0,streak};}

chrome.runtime.onInstalled.addListener(()=>restorePomodoroAlarm());
chrome.runtime.onStartup.addListener(()=>restorePomodoroAlarm());
chrome.alarms.onAlarm.addListener(a=>{if(a.name===POMODORO_ALARM)finishPomodoro();});
chrome.runtime.onMessage.addListener((m,_sender,sendResponse)=>{
  if(!m?.type?.startsWith('nexus:pomodoro-'))return;
  const done=value=>sendResponse({ok:true,state:value}),fail=e=>sendResponse({ok:false,error:e?.message||String(e)});
  if(m.type==='nexus:pomodoro-get')getPomodoro().then(done).catch(fail);
  else if(m.type==='nexus:pomodoro-start')startPomodoro().then(done).catch(fail);
  else if(m.type==='nexus:pomodoro-pause')pausePomodoro().then(done).catch(fail);
  else if(m.type==='nexus:pomodoro-reset')resetPomodoro().then(done).catch(fail);
  else if(m.type==='nexus:pomodoro-set')setPomodoro(m.minutes,m.mode,m.label).then(done).catch(fail);
  else if(m.type==='nexus:pomodoro-history')getHistorySummary().then(x=>sendResponse({ok:true,...x})).catch(fail);
  else if(m.type==='nexus:pomodoro-prefs-get')pGet({[PREFS_KEY]:DEFAULT_PREFS}).then(x=>sendResponse({ok:true,prefs:{...DEFAULT_PREFS,...x[PREFS_KEY]}})).catch(fail);
  else if(m.type==='nexus:pomodoro-prefs-set')pSet({[PREFS_KEY]:{...DEFAULT_PREFS,...(m.prefs||{})}}).then(()=>sendResponse({ok:true})).catch(fail);
  else return;
  return true;
});
restorePomodoroAlarm().catch(()=>{});
