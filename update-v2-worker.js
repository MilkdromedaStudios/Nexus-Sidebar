'use strict';

const NX_UPDATE_V2_ALARM = 'nexus-update-v2-hourly';
const NX_UPDATE_STATUS = 'nexusUpdateStatus';
const NX_UPDATE_NOTIFIED = 'nexusUpdateNotifiedVersion';
const NX_MANIFEST_API = 'https://api.github.com/repos/MilkdromedaStudios/Nexus-Sidebar/contents/manifest.json?ref=main';
const NX_MANIFEST_RAW = 'https://raw.githubusercontent.com/MilkdromedaStudios/Nexus-Sidebar/main/manifest.json';
const NX_ZIP = 'https://github.com/MilkdromedaStudios/Nexus-Sidebar/archive/refs/heads/main.zip';

const nxUpdateGet = defaults => new Promise(resolve => chrome.storage.local.get(defaults, value => resolve(value || defaults)));
const nxUpdateSet = value => new Promise(resolve => chrome.storage.local.set(value, resolve));

function nxCompareVersions(a, b) {
  const A = String(a || '0').split('.').map(Number);
  const B = String(b || '0').split('.').map(Number);
  for (let i = 0; i < Math.max(A.length, B.length); i++) {
    const x = A[i] || 0, y = B[i] || 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

async function nxFetchRemoteManifest() {
  try {
    const r = await fetch(NX_MANIFEST_API, {
      cache: 'no-store',
      headers: { Accept: 'application/vnd.github+json' }
    });
    if (!r.ok) throw new Error('GitHub API ' + r.status);
    const data = await r.json();
    if (!data?.content) throw new Error('GitHub API returned no manifest content');
    const json = atob(String(data.content).replace(/\s+/g, ''));
    return { manifest: JSON.parse(json), sourceSha: data.sha || '' };
  } catch (apiError) {
    const r = await fetch(NX_MANIFEST_RAW + '?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error(`${apiError.message}; raw GitHub ${r.status}`);
    return { manifest: await r.json(), sourceSha: '' };
  }
}

async function nxCheckUpdate(force = false) {
  const localVersion = chrome.runtime.getManifest().version;
  const saved = await nxUpdateGet({ nexusSettings: {}, [NX_UPDATE_NOTIFIED]: '' });
  if (!force && saved.nexusSettings?.autoUpdateCheck === false) {
    const disabled = { ok: true, localVersion, remoteVersion: localVersion, available: false, disabled: true, checkedAt: Date.now(), url: NX_ZIP };
    await nxUpdateSet({ [NX_UPDATE_STATUS]: disabled });
    return disabled;
  }

  try {
    const remote = await nxFetchRemoteManifest();
    const remoteVersion = String(remote.manifest?.version || '0');
    const available = nxCompareVersions(remoteVersion, localVersion) > 0;
    const status = {
      ok: true,
      localVersion,
      remoteVersion,
      available,
      checkedAt: Date.now(),
      sourceSha: remote.sourceSha,
      url: NX_ZIP
    };
    await nxUpdateSet({ [NX_UPDATE_STATUS]: status });
    await chrome.action.setBadgeText({ text: available ? 'UP' : '' });
    if (available) {
      await chrome.action.setBadgeBackgroundColor({ color: '#d97706' });
      if (saved[NX_UPDATE_NOTIFIED] !== remoteVersion) {
        try {
          await chrome.notifications.create('nexus-update-v2:' + remoteVersion, {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon.png'),
            title: `Nexus v${remoteVersion} is available`,
            message: `Installed folder is v${localVersion}. Download the new source, replace the unpacked folder contents, then reload Nexus.`,
            buttons: [{ title: 'Download source' }],
            priority: 1
          });
          await nxUpdateSet({ [NX_UPDATE_NOTIFIED]: remoteVersion });
        } catch {}
      }
    }
    return status;
  } catch (error) {
    const status = { ok: false, localVersion, available: false, error: error.message, checkedAt: Date.now(), url: NX_ZIP };
    await nxUpdateSet({ [NX_UPDATE_STATUS]: status });
    return status;
  }
}

async function nxEnsureUpdateAlarm() {
  try {
    const existing = await chrome.alarms.get(NX_UPDATE_V2_ALARM);
    if (!existing) await chrome.alarms.create(NX_UPDATE_V2_ALARM, { periodInMinutes: 60 });
  } catch {}
}

function nxOpenExtensions(sendResponse) {
  chrome.tabs.create({ url: 'edge://extensions/' }, tab => {
    if (!chrome.runtime.lastError) return sendResponse({ ok: true, tabId: tab?.id });
    chrome.tabs.create({ url: 'chrome://extensions/' }, fallback => {
      sendResponse(chrome.runtime.lastError ? { ok: false, error: chrome.runtime.lastError.message } : { ok: true, tabId: fallback?.id });
    });
  });
}

chrome.runtime.onInstalled.addListener(() => { nxEnsureUpdateAlarm(); nxCheckUpdate(true); });
chrome.runtime.onStartup.addListener(() => { nxEnsureUpdateAlarm(); nxCheckUpdate(); });
chrome.alarms.onAlarm.addListener(alarm => { if (alarm.name === NX_UPDATE_V2_ALARM) nxCheckUpdate(); });

chrome.notifications.onButtonClicked.addListener((id, buttonIndex) => {
  if (id.startsWith('nexus-update-v2:') && buttonIndex === 0) chrome.tabs.create({ url: NX_ZIP });
});
chrome.notifications.onClicked.addListener(id => {
  if (id.startsWith('nexus-update-v2:')) chrome.tabs.create({ url: NX_ZIP });
});

chrome.runtime.onMessage.addListener((m, _sender, sendResponse) => {
  if (!m?.type) return;
  if (m.type === 'nexus:update-check-v2') {
    nxCheckUpdate(true).then(sendResponse).catch(e => sendResponse({ ok: false, error: e.message }));
    return true;
  }
  if (m.type === 'nexus:update-status-v2') {
    nxUpdateGet({ [NX_UPDATE_STATUS]: null }).then(state => {
      const status = state[NX_UPDATE_STATUS];
      if (status) sendResponse(status);
      else nxCheckUpdate(true).then(sendResponse);
    });
    return true;
  }
  if (m.type === 'nexus:update-download-v2') {
    chrome.tabs.create({ url: NX_ZIP }, tab => sendResponse({ ok: !chrome.runtime.lastError, tabId: tab?.id, error: chrome.runtime.lastError?.message }));
    return true;
  }
  if (m.type === 'nexus:update-open-extensions-v2') {
    nxOpenExtensions(sendResponse);
    return true;
  }
  if (m.type === 'nexus:update-reload-v2') {
    sendResponse({ ok: true });
    setTimeout(() => chrome.runtime.reload(), 120);
    return true;
  }
});

nxEnsureUpdateAlarm();
nxCheckUpdate().catch(() => {});
