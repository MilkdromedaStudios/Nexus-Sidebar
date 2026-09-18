'use strict';

const WEATHER = 'nexus-weather-hourly';
const UPDATE_ALARM = 'nexus-github-update';
const CACHE = 'nexusWeatherCache';
const UPDATE = 'nexusUpdateStatus';
const PRIORITY = 25000;
const GITHUB = 'https://raw.githubusercontent.com/MilkdromedaStudios/Nexus-Sidebar/main/manifest.json';
const REPO = 'https://github.com/MilkdromedaStudios/Nexus-Sidebar';

const get = d => new Promise(r => chrome.storage.local.get(d, v => r(v || d)));
const set = v => new Promise(r => chrome.storage.local.set(v, r));
const respond = (send, value) => { try { send(value); } catch {} };

async function rules() {
  return chrome.declarativeNetRequest.getSessionRules();
}

function frameHost(rawUrl) {
  const u = new URL(String(rawUrl || ''));
  if (!/^https?:$/.test(u.protocol)) throw new Error('Only HTTP(S) sites can be framed');
  return u.hostname.toLowerCase();
}

async function frameRule(tabId, on, rawUrl = '') {
  const all = await rules();
  let mine = all.filter(r => r.priority === PRIORITY && r.condition?.tabIds?.includes(tabId));

  // v16.0 used one broad rule for every sub-frame in the tab. Remove those rules
  // as soon as this build touches the tab so unrelated websites are never modified.
  const legacy = mine.filter(r => !Array.isArray(r.condition?.requestDomains) || !r.condition.requestDomains.length);
  if (legacy.length) {
    await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: legacy.map(r => r.id) });
    mine = mine.filter(r => !legacy.includes(r));
  }

  if (!on) {
    let targets = mine;
    if (rawUrl) {
      let host;
      try { host = frameHost(rawUrl); } catch { return; }
      targets = mine.filter(r => r.condition?.requestDomains?.includes(host));
    }
    if (targets.length) {
      await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: targets.map(r => r.id) });
    }
    return;
  }

  const host = frameHost(rawUrl);
  if (mine.some(r => r.condition?.requestDomains?.includes(host))) return;

  let id = 100000000 + Math.floor(Math.random() * 800000000);
  const used = new Set(all.map(r => r.id));
  while (used.has(id)) id++;

  await chrome.declarativeNetRequest.updateSessionRules({
    addRules: [{
      id,
      priority: PRIORITY,
      action: {
        type: 'modifyHeaders',
        responseHeaders: [
          { header: 'x-frame-options', operation: 'remove' },
          { header: 'content-security-policy', operation: 'remove' },
          { header: 'permissions-policy', operation: 'remove' }
        ]
      },
      condition: {
        resourceTypes: ['sub_frame'],
        tabIds: [tabId],
        requestDomains: [host]
      }
    }]
  });
}

function pattern(raw) {
  const u = new URL(raw);
  const port = u.port ? ':' + u.port : '';
  return `${u.protocol}//${u.hostname}${port}/*`;
}

async function allowCookies(tab, url) {
  if (!tab?.url) return;
  try {
    await chrome.contentSettings.cookies.set({
      primaryPattern: pattern(url),
      secondaryPattern: pattern(tab.url),
      setting: 'allow',
      scope: tab.incognito ? 'incognito_session_only' : 'regular'
    });
  } catch {}
}

async function weather(location = '') {
  const loc = String(location || '').trim();
  try {
    const r = await fetch('https://wttr.in/' + (loc ? encodeURIComponent(loc) : '') + '?format=j1', { cache: 'no-store' });
    if (!r.ok) throw Error('Weather ' + r.status);
    const d = await r.json();
    const c = d.current_condition?.[0];
    const a = d.nearest_area?.[0];
    if (!c) throw Error('No weather data');
    const w = {
      temp: String(c.temp_F ?? '--'),
      feelsLike: String(c.FeelsLikeF ?? c.temp_F ?? '--'),
      condition: c.weatherDesc?.[0]?.value || 'Current conditions',
      location: [a?.areaName?.[0]?.value, a?.region?.[0]?.value].filter(Boolean).join(', ')
    };
    await set({ [CACHE]: { key: loc.toLowerCase(), updatedAt: Date.now(), weather: w } });
    return { ok: true, weather: w };
  } catch (e) {
    const s = await get({ [CACHE]: null });
    return s[CACHE]?.weather
      ? { ok: true, weather: s[CACHE].weather, stale: true }
      : { ok: false, error: e.message };
  }
}

function cmp(a, b) {
  const A = String(a).split('.').map(Number);
  const B = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(A.length, B.length); i++) {
    const x = A[i] || 0;
    const y = B[i] || 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

async function checkUpdate(force = false) {
  const localVersion = chrome.runtime.getManifest().version;
  const settings = (await get({ nexusSettings: {} })).nexusSettings || {};
  if (!force && settings.autoUpdateCheck === false) {
    return { ok: true, localVersion, available: false, disabled: true };
  }
  try {
    const r = await fetch(GITHUB + '?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw Error('GitHub ' + r.status);
    const m = await r.json();
    const remoteVersion = String(m.version || '0');
    const available = cmp(remoteVersion, localVersion) > 0;
    const status = { ok: true, localVersion, remoteVersion, available, checkedAt: Date.now(), url: REPO };
    await set({ [UPDATE]: status });
    await chrome.action.setBadgeText({ text: available ? 'UP' : '' });
    if (available) await chrome.action.setBadgeBackgroundColor({ color: '#d97706' });
    return status;
  } catch (e) {
    const status = { ok: false, localVersion, available: false, error: e.message, checkedAt: Date.now(), url: REPO };
    await set({ [UPDATE]: status });
    return status;
  }
}

async function ensureAlarms() {
  try {
    if (!await chrome.alarms.get(WEATHER)) await chrome.alarms.create(WEATHER, { periodInMinutes: 60 });
    if (!await chrome.alarms.get(UPDATE_ALARM)) await chrome.alarms.create(UPDATE_ALARM, { periodInMinutes: 360 });
  } catch {}
}

chrome.runtime.onInstalled.addListener(() => {
  ensureAlarms();
  weather();
  checkUpdate(true);
});
chrome.runtime.onStartup.addListener(() => {
  ensureAlarms();
  checkUpdate();
});
chrome.alarms.onAlarm.addListener(a => {
  if (a.name === WEATHER) weather();
  if (a.name === UPDATE_ALARM) checkUpdate();
});
ensureAlarms();

chrome.action.onClicked.addListener(async tab => {
  if (!tab?.id || !/^(https?|file):/i.test(tab.url || '')) return;
  chrome.tabs.sendMessage(tab.id, { type: 'nexus:reveal' }, async () => {
    if (!chrome.runtime.lastError) return;
    try {
      await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['styles/base.css', 'styles/themes.css'] });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['src/core.js', 'src/sites.js', 'src/apps.js', 'src/games.js', 'src/settings.js'] });
      chrome.tabs.sendMessage(tab.id, { type: 'nexus:reveal' }, () => void chrome.runtime.lastError);
    } catch {}
  });
});

chrome.tabs.onRemoved.addListener(id => {
  frameRule(id, false).catch(() => {});
});

chrome.runtime.onMessage.addListener((m, s, sendResponse) => {
  if (!m?.type) return;
  const tabId = s.tab?.id;

  if (m.type === 'nexus:history') {
    chrome.history.search({ text: String(m.query || ''), startTime: 0, maxResults: 100 }, x => respond(sendResponse, { ok: true, results: x || [] }));
    return true;
  }
  if (m.type === 'nexus:new-tab') {
    chrome.tabs.create({}, t => respond(sendResponse, { ok: true, tabId: t?.id }));
    return true;
  }
  if (m.type === 'nexus:reload') {
    if (tabId) chrome.tabs.reload(tabId, {}, () => respond(sendResponse, { ok: true }));
    else respond(sendResponse, { ok: false, error: 'No active tab' });
    return true;
  }
  if (m.type === 'nexus:open-tab') {
    try {
      const u = new URL(m.url);
      if (!/^https?:$/.test(u.protocol)) throw 0;
      chrome.tabs.create({ url: u.href }, t => respond(sendResponse, { ok: true, tabId: t?.id }));
    } catch {
      respond(sendResponse, { ok: false, error: 'Invalid URL' });
    }
    return true;
  }
  if (m.type === 'nexus:weather') {
    (async () => {
      const loc = String(m.location || '').trim();
      const state = await get({ [CACHE]: null });
      const cached = state[CACHE];
      if (cached?.weather && cached.key === loc.toLowerCase() && Date.now() - cached.updatedAt < 3600000) {
        return { ok: true, weather: cached.weather, cached: true };
      }
      return weather(loc);
    })().then(x => respond(sendResponse, x));
    return true;
  }
  if (m.type === 'nexus:frame-enable') {
    if (!tabId) {
      respond(sendResponse, { ok: false, error: 'No host tab' });
      return true;
    }
    frameRule(tabId, true, String(m.url || ''))
      .then(() => respond(sendResponse, { ok: true }))
      .catch(e => respond(sendResponse, { ok: false, error: e.message }));
    return true;
  }
  if (m.type === 'nexus:frame-disable') {
    if (!tabId) {
      respond(sendResponse, { ok: true });
      return true;
    }
    frameRule(tabId, false, String(m.url || ''))
      .then(() => respond(sendResponse, { ok: true }))
      .catch(e => respond(sendResponse, { ok: false, error: e.message }));
    return true;
  }
  if (m.type === 'nexus:cookie-allow') {
    allowCookies(s.tab, String(m.url || '')).then(() => respond(sendResponse, { ok: true }));
    return true;
  }
  if (m.type === 'nexus:update-check') {
    checkUpdate(true).then(x => respond(sendResponse, x));
    return true;
  }
  if (m.type === 'nexus:update-status') {
    get({ [UPDATE]: null }).then(x => respond(sendResponse, x[UPDATE] || { ok: true, localVersion: chrome.runtime.getManifest().version, available: false }));
    return true;
  }
  if (m.type === 'nexus:update-open') {
    chrome.tabs.create({ url: REPO }, () => respond(sendResponse, { ok: true }));
    return true;
  }
});
