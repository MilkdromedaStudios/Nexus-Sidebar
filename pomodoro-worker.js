'use strict';

const POMODORO_ALARM = 'nexus-pomodoro-finish';
const POMODORO_KEY = 'nexusPomodoro';
const DEFAULT_POMODORO = { mode: 'focus', durationSec: 1500, remainingSec: 1500, running: false, endAt: 0 };

const pGet = d => new Promise(r => chrome.storage.local.get(d, v => r(v || d)));
const pSet = v => new Promise(r => chrome.storage.local.set(v, r));

async function getPomodoro() {
  const data = await pGet({ [POMODORO_KEY]: DEFAULT_POMODORO });
  const state = { ...DEFAULT_POMODORO, ...(data[POMODORO_KEY] || {}) };
  if (state.running && state.endAt) {
    state.remainingSec = Math.max(0, (state.endAt - Date.now()) / 1000);
    if (state.remainingSec <= 0) {
      state.running = false;
      state.endAt = 0;
      state.remainingSec = 0;
      await pSet({ [POMODORO_KEY]: state });
    }
  }
  return state;
}

async function savePomodoro(state) {
  await pSet({ [POMODORO_KEY]: state });
  return state;
}

async function schedulePomodoro(state) {
  await chrome.alarms.clear(POMODORO_ALARM);
  if (state.running && state.endAt > Date.now()) {
    await chrome.alarms.create(POMODORO_ALARM, { when: state.endAt });
  }
}

async function startPomodoro() {
  const state = await getPomodoro();
  if (state.running) return state;
  if (!state.remainingSec || state.remainingSec <= 0) state.remainingSec = state.durationSec || 1500;
  state.running = true;
  state.endAt = Date.now() + state.remainingSec * 1000;
  await savePomodoro(state);
  await schedulePomodoro(state);
  return state;
}

async function pausePomodoro() {
  const state = await getPomodoro();
  if (state.running && state.endAt) state.remainingSec = Math.max(0, (state.endAt - Date.now()) / 1000);
  state.running = false;
  state.endAt = 0;
  await chrome.alarms.clear(POMODORO_ALARM);
  return savePomodoro(state);
}

async function resetPomodoro() {
  await chrome.alarms.clear(POMODORO_ALARM);
  return savePomodoro({ ...DEFAULT_POMODORO });
}

async function setPomodoro(minutes, mode) {
  const mins = Math.max(1, Math.min(120, Number(minutes) || 25));
  const durationSec = Math.round(mins * 60);
  await chrome.alarms.clear(POMODORO_ALARM);
  return savePomodoro({ mode: mode === 'break' ? 'break' : 'focus', durationSec, remainingSec: durationSec, running: false, endAt: 0 });
}

async function finishPomodoro() {
  const state = await getPomodoro();
  if (!state.running && state.remainingSec > 0) return;
  const finishedMode = state.mode;
  state.running = false;
  state.endAt = 0;
  state.remainingSec = 0;
  await savePomodoro(state);
  try {
    await chrome.notifications.create('nexus-pomodoro-' + Date.now(), {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon.png'),
      title: finishedMode === 'break' ? 'Break finished' : 'Focus session finished',
      message: finishedMode === 'break' ? 'Ready to focus again?' : 'Nice work. Time for a short break.',
      priority: 2
    });
  } catch {}
}

async function restorePomodoroAlarm() {
  const state = await getPomodoro();
  if (state.running && state.endAt > Date.now()) await schedulePomodoro(state);
  else if (state.running) await finishPomodoro();
}

chrome.runtime.onInstalled.addListener(() => restorePomodoroAlarm());
chrome.runtime.onStartup.addListener(() => restorePomodoroAlarm());
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === POMODORO_ALARM) finishPomodoro();
});

chrome.runtime.onMessage.addListener((m, _sender, sendResponse) => {
  if (!m?.type?.startsWith('nexus:pomodoro-')) return;
  const done = value => sendResponse({ ok: true, state: value });
  const fail = error => sendResponse({ ok: false, error: error?.message || String(error) });
  if (m.type === 'nexus:pomodoro-get') getPomodoro().then(done).catch(fail);
  else if (m.type === 'nexus:pomodoro-start') startPomodoro().then(done).catch(fail);
  else if (m.type === 'nexus:pomodoro-pause') pausePomodoro().then(done).catch(fail);
  else if (m.type === 'nexus:pomodoro-reset') resetPomodoro().then(done).catch(fail);
  else if (m.type === 'nexus:pomodoro-set') setPomodoro(m.minutes, m.mode).then(done).catch(fail);
  else return;
  return true;
});

restorePomodoroAlarm().catch(() => {});
