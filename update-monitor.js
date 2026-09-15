'use strict';

const NEXUS_UPDATE_ALARM = 'nexus-update-monitor-hourly';
const NEXUS_UPDATE_STATUS = 'nexusUpdateStatus';
const NEXUS_UPDATE_NOTIFIED = 'nexusUpdateNotifiedVersion';
const NEXUS_REMOTE_MANIFEST = 'https://raw.githubusercontent.com/MilkdromedaStudios/Nexus-Sidebar/main/manifest.json';
const NEXUS_UPDATE_ZIP = 'https://github.com/MilkdromedaStudios/Nexus-Sidebar/archive/refs/heads/main.zip';

const updateGet = defaults => new Promise(resolve => chrome.storage.local.get(defaults, value => resolve(value || defaults)));
const updateSet = value => new Promise(resolve => chrome.storage.local.set(value, resolve));

function compareVersions(a, b) {
  const A = String(a).split('.').map(Number);
  const B = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(A.length, B.length); i++) {
    const x = A[i] || 0;
    const y = B[i] || 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

async function monitorNexusUpdate(force = false) {
  const localVersion = chrome.runtime.getManifest().version;
  const saved = await updateGet({ nexusSettings: {}, [NEXUS_UPDATE_NOTIFIED]: '' });
  if (!force && saved.nexusSettings?.autoUpdateCheck === false) return;

  try {
    const response = await fetch(NEXUS_REMOTE_MANIFEST + '?t=' + Date.now(), { cache: 'no-store' });
    if (!response.ok) throw new Error('GitHub ' + response.status);
    const manifest = await response.json();
    const remoteVersion = String(manifest.version || '0');
    const available = compareVersions(remoteVersion, localVersion) > 0;
    const status = {
      ok: true,
      localVersion,
      remoteVersion,
      available,
      checkedAt: Date.now(),
      url: NEXUS_UPDATE_ZIP
    };
    await updateSet({ [NEXUS_UPDATE_STATUS]: status });
    await chrome.action.setBadgeText({ text: available ? 'UP' : '' });
    if (available) {
      await chrome.action.setBadgeBackgroundColor({ color: '#d97706' });
      if (saved[NEXUS_UPDATE_NOTIFIED] !== remoteVersion) {
        try {
          await chrome.notifications.create('nexus-update:' + remoteVersion, {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon.png'),
            title: `Nexus Sidebar v${remoteVersion} is available`,
            message: `Installed: v${localVersion}. Download the latest ZIP, then reload the unpacked extension.`,
            buttons: [{ title: 'Download update' }],
            priority: 1
          });
          await updateSet({ [NEXUS_UPDATE_NOTIFIED]: remoteVersion });
        } catch {}
      }
    }
    return status;
  } catch (error) {
    const status = { ok: false, localVersion, available: false, error: error.message, checkedAt: Date.now(), url: NEXUS_UPDATE_ZIP };
    await updateSet({ [NEXUS_UPDATE_STATUS]: status });
    return status;
  }
}

async function ensureNexusUpdateAlarm() {
  try {
    const existing = await chrome.alarms.get(NEXUS_UPDATE_ALARM);
    if (!existing) await chrome.alarms.create(NEXUS_UPDATE_ALARM, { periodInMinutes: 60 });
  } catch {}
}

chrome.runtime.onInstalled.addListener(() => {
  ensureNexusUpdateAlarm();
  monitorNexusUpdate(true);
});
chrome.runtime.onStartup.addListener(() => {
  ensureNexusUpdateAlarm();
  monitorNexusUpdate();
});
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === NEXUS_UPDATE_ALARM) monitorNexusUpdate();
});
chrome.notifications.onClicked.addListener(id => {
  if (id.startsWith('nexus-update:')) chrome.tabs.create({ url: NEXUS_UPDATE_ZIP });
});
chrome.notifications.onButtonClicked.addListener((id, buttonIndex) => {
  if (id.startsWith('nexus-update:') && buttonIndex === 0) chrome.tabs.create({ url: NEXUS_UPDATE_ZIP });
});

ensureNexusUpdateAlarm();
monitorNexusUpdate().catch(() => {});
