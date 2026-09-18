'use strict';

const DIGITBOX = {
  site: 'https://digitbox.dev',
  api: 'https://digitbox.pages.dev',
  login: 'https://digitbox.dev/login?next=/profile',
  profile: 'https://digitbox.dev/profile',
  storageKey: 'nexusDigitBoxAuth',
  websiteStorageKey: 'digitbox-deepforge-auth-v1',
  maxAge: 5 * 60 * 1000,
};

const dbGet = defaults => new Promise(resolve => chrome.storage.local.get(defaults, value => resolve(value || defaults)));
const dbSet = value => new Promise(resolve => chrome.storage.local.set(value, resolve));
const dbRemove = key => new Promise(resolve => chrome.storage.local.remove(key, resolve));

async function requestJson(path, token) {
  const response = await fetch(DIGITBOX.api + path, {
    method: 'GET',
    headers: { Accept: 'application/json', Authorization: 'Bearer ' + token },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || ('DigitBox request failed: ' + response.status));
  return body;
}

async function validateToken(token, expiresAt = 0) {
  token = String(token || '').trim();
  if (!token) return null;
  if (Number(expiresAt) && Number(expiresAt) <= Date.now()) return null;
  try {
    const account = await requestJson('/v1/auth/me', token);
    const profile = await requestJson('/v1/profile/me', token).catch(() => ({ user: {} }));
    const user = { ...(account?.user || {}), ...(profile?.user || {}) };
    if (!user.id) return null;
    const auth = { token, expiresAt: Number(expiresAt) || 0, user, checkedAt: Date.now() };
    await dbSet({ [DIGITBOX.storageKey]: auth });
    broadcast(auth);
    return auth;
  } catch {
    await dbRemove(DIGITBOX.storageKey);
    broadcast(null);
    return null;
  }
}

async function importFromDigitBoxTabs() {
  const tabs = await chrome.tabs.query({});
  const candidates = tabs.filter(tab => {
    try {
      const host = new URL(tab.url || '').hostname.toLowerCase();
      return host === 'digitbox.dev' || host === 'www.digitbox.dev' || host === 'digitbox.pages.dev' || host.endsWith('.digitbox.pages.dev');
    } catch { return false; }
  });
  for (const tab of candidates) {
    if (!tab.id) continue;
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: key => {
          try { return localStorage.getItem(key) || ''; } catch { return ''; }
        },
        args: [DIGITBOX.websiteStorageKey],
      });
      const raw = result?.result;
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!parsed?.token) continue;
      const auth = await validateToken(parsed.token, parsed.expiresAt);
      if (auth) return auth;
    } catch {}
  }
  return null;
}

async function status(force = false) {
  const saved = (await dbGet({ [DIGITBOX.storageKey]: null }))[DIGITBOX.storageKey];
  if (saved?.token && !force && Date.now() - Number(saved.checkedAt || 0) < DIGITBOX.maxAge) {
    return { ok: true, signedIn: true, user: saved.user, expiresAt: saved.expiresAt || 0 };
  }
  if (saved?.token) {
    const checked = await validateToken(saved.token, saved.expiresAt);
    if (checked) return { ok: true, signedIn: true, user: checked.user, expiresAt: checked.expiresAt || 0 };
  }
  const detected = await importFromDigitBoxTabs();
  if (detected) return { ok: true, signedIn: true, user: detected.user, expiresAt: detected.expiresAt || 0 };
  return { ok: true, signedIn: false, user: null };
}

async function uploadAvatar(dataUrl) {
  const saved = (await dbGet({ [DIGITBOX.storageKey]: null }))[DIGITBOX.storageKey];
  if (!saved?.token) throw new Error('Sign in to DigitBox first.');
  const match = String(dataUrl || '').match(/^data:(image\/(?:png|jpeg|webp));base64,/i);
  if (!match) throw new Error('Use a PNG, JPG, or WebP image.');
  const source = await fetch(dataUrl);
  const bytes = await source.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > 4 * 1024 * 1024) throw new Error('Profile images must be 4 MB or smaller.');
  const response = await fetch(DIGITBOX.api + '/v1/profile/avatar', {
    method: 'PUT',
    headers: { Authorization: 'Bearer ' + saved.token, 'Content-Type': match[1].toLowerCase() },
    body: bytes,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || ('Avatar upload failed: ' + response.status));
  const auth = await validateToken(saved.token, saved.expiresAt);
  return { ok: true, user: auth?.user || saved.user };
}

async function deleteAvatar() {
  const saved = (await dbGet({ [DIGITBOX.storageKey]: null }))[DIGITBOX.storageKey];
  if (!saved?.token) throw new Error('Sign in to DigitBox first.');
  const response = await fetch(DIGITBOX.api + '/v1/profile/avatar', {
    method: 'DELETE',
    headers: { Accept: 'application/json', Authorization: 'Bearer ' + saved.token },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || ('Avatar delete failed: ' + response.status));
  const auth = await validateToken(saved.token, saved.expiresAt);
  return { ok: true, user: auth?.user || saved.user };
}

async function broadcast(auth) {
  const tabs = await chrome.tabs.query({}).catch(() => []);
  for (const tab of tabs) {
    if (!tab.id || !/^(https?|file):/i.test(tab.url || '')) continue;
    chrome.tabs.sendMessage(tab.id, {
      type: 'nexus:digitbox-auth-changed',
      signedIn: !!auth,
      user: auth?.user || null,
    }, () => void chrome.runtime.lastError);
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message?.type?.startsWith('nexus:digitbox-')) return;
  (async () => {
    if (message.type === 'nexus:digitbox-status') return status(!!message.force);
    if (message.type === 'nexus:digitbox-import') {
      const auth = await validateToken(message.token, message.expiresAt);
      return { ok: true, signedIn: !!auth, user: auth?.user || null };
    }
    if (message.type === 'nexus:digitbox-open-login') {
      const tab = await chrome.tabs.create({ url: DIGITBOX.login });
      return { ok: true, tabId: tab.id };
    }
    if (message.type === 'nexus:digitbox-open-profile') {
      const tab = await chrome.tabs.create({ url: DIGITBOX.profile });
      return { ok: true, tabId: tab.id };
    }
    if (message.type === 'nexus:digitbox-avatar-upload') return uploadAvatar(message.dataUrl);
    if (message.type === 'nexus:digitbox-avatar-delete') return deleteAvatar();
    return { ok: false, error: 'Unknown DigitBox account action.' };
  })().then(sendResponse).catch(error => sendResponse({ ok: false, error: error?.message || String(error) }));
  return true;
});

chrome.runtime.onStartup.addListener(() => status(true).catch(() => {}));
chrome.runtime.onInstalled.addListener(() => status(true).catch(() => {}));
