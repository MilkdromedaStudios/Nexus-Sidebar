'use strict';

const DIGITBOX = {
  site: 'https://digitbox.dev',
  api: 'https://digitbox.pages.dev',
  login: 'https://digitbox.dev/login?next=/profile',
  profile: 'https://digitbox.dev/profile',
  storageKey: 'nexusDigitBoxAuth',
  websiteStorageKey: 'digitbox-deepforge-auth-v1',
  maxAge: 15 * 1000,
  proGraceAge: 10 * 60 * 1000,
};

const dbGet = defaults => new Promise(resolve => chrome.storage.local.get(defaults, value => resolve(value || defaults)));
const dbSet = value => new Promise(resolve => chrome.storage.local.set(value, resolve));
const dbRemove = key => new Promise(resolve => chrome.storage.local.remove(key, resolve));

function freeEntitlements() {
  return { plan: 'free', features: [], subscriptionStatus: 'none', cancelAtPeriodEnd: false, currentPeriodEnd: null };
}

const PRO_STATUSES = new Set(['active', 'trialing', 'past_due']);

function entitlementLooksPro(value) {
  const entitlements = value && typeof value === 'object' ? value : {};
  const features = Array.isArray(entitlements.features) ? entitlements.features : [];
  const plan = String(entitlements.plan || entitlements.tier || '').toLowerCase();
  const status = String(entitlements.subscriptionStatus || entitlements.status || '').toLowerCase();
  return features.includes('nexus_pro') || plan === 'pro' || PRO_STATUSES.has(status);
}

function normalizeEntitlements(value) {
  const entitlements = value && typeof value === 'object' ? value : freeEntitlements();
  const features = Array.isArray(entitlements.features)
    ? entitlements.features.filter(x => typeof x === 'string')
    : [];
  const pro = entitlementLooksPro(entitlements);
  if (pro && !features.includes('nexus_pro')) features.push('nexus_pro');
  return {
    plan: pro ? 'pro' : 'free',
    features,
    subscriptionStatus: String(entitlements.subscriptionStatus || entitlements.status || 'none'),
    cancelAtPeriodEnd: !!entitlements.cancelAtPeriodEnd,
    currentPeriodEnd: Number(entitlements.currentPeriodEnd) || null,
  };
}

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

  // Authentication is authoritative: only an auth failure signs the user out.
  // Billing/profile failures are handled separately so a brief network hiccup
  // cannot incorrectly turn a real Pro subscriber into Guest mode.
  let account;
  try {
    account = await requestJson('/v1/auth/me', token);
  } catch {
    await dbRemove(DIGITBOX.storageKey);
    broadcast(null);
    return null;
  }

  const saved = (await dbGet({ [DIGITBOX.storageKey]: null }))[DIGITBOX.storageKey];
  const sameSavedToken = saved?.token === token ? saved : null;
  const profile = await requestJson('/v1/profile/me', token).catch(() => ({ user: sameSavedToken?.user || {} }));

  let billing = null;
  let billingError = null;
  for (const delay of [0, 250, 900]) {
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    try {
      billing = await requestJson('/v1/billing/status', token);
      break;
    } catch (error) {
      billingError = error;
    }
  }

  const user = { ...(account?.user || {}), ...(profile?.user || {}) };
  if (!user.id) return null;

  let entitlements;
  let billingCheckedAt = Number(sameSavedToken?.billingCheckedAt || 0);
  let billingReachable = !!billing;
  if (billing) {
    entitlements = normalizeEntitlements(billing.entitlements);
    billingCheckedAt = Date.now();
  } else {
    const savedEntitlements = normalizeEntitlements(sameSavedToken?.entitlements);
    const savedProStillFresh =
      entitlementLooksPro(savedEntitlements) &&
      billingCheckedAt > 0 &&
      Date.now() - billingCheckedAt < DIGITBOX.proGraceAge;
    entitlements = savedProStillFresh ? savedEntitlements : freeEntitlements();
  }

  const auth = {
    token,
    expiresAt: Number(expiresAt) || 0,
    user,
    entitlements: normalizeEntitlements(entitlements),
    checkedAt: Date.now(),
    billingCheckedAt,
    billingReachable,
    billingError: billingError?.message || '',
  };
  await dbSet({ [DIGITBOX.storageKey]: auth });
  broadcast(auth);
  return auth;
}

function isDigitBoxUrl(raw) {
  try {
    const host = new URL(raw || '').hostname.toLowerCase();
    return host === 'digitbox.dev' || host === 'www.digitbox.dev' || host === 'digitbox.pages.dev' || host.endsWith('.digitbox.pages.dev');
  } catch {
    return false;
  }
}

async function importFromDigitBoxTab(tabId) {
  if (!tabId) return null;
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!isDigitBoxUrl(tab?.url)) return null;
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: key => {
        try { return localStorage.getItem(key) || ''; } catch { return ''; }
      },
      args: [DIGITBOX.websiteStorageKey],
    });
    const raw = result?.result;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token) return null;
    return validateToken(parsed.token, parsed.expiresAt);
  } catch {
    return null;
  }
}

async function importFromDigitBoxTabs() {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id || !isDigitBoxUrl(tab.url)) continue;
    const auth = await importFromDigitBoxTab(tab.id);
    if (auth) return auth;
  }
  return null;
}

function signedInStatus(auth) {
  return {
    ok: true,
    signedIn: true,
    user: auth.user,
    entitlements: normalizeEntitlements(auth.entitlements),
    expiresAt: auth.expiresAt || 0,
    billingReachable: auth.billingReachable !== false,
    billingCheckedAt: Number(auth.billingCheckedAt) || 0,
  };
}

async function status(force = false) {
  const saved = (await dbGet({ [DIGITBOX.storageKey]: null }))[DIGITBOX.storageKey];
  if (saved?.token && !force && Date.now() - Number(saved.checkedAt || 0) < DIGITBOX.maxAge) {
    return signedInStatus(saved);
  }
  if (saved?.token) {
    const checked = await validateToken(saved.token, saved.expiresAt);
    if (checked) return signedInStatus(checked);
  }
  const detected = await importFromDigitBoxTabs();
  if (detected) return signedInStatus(detected);
  return { ok: true, signedIn: false, user: null, entitlements: freeEntitlements() };
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
  const message = {
    type: 'nexus:digitbox-auth-changed',
    signedIn: !!auth,
    user: auth?.user || null,
    entitlements: normalizeEntitlements(auth?.entitlements),
  };
  const tabs = await chrome.tabs.query({}).catch(() => []);
  for (const tab of tabs) {
    if (!tab.id || !/^(https?|file):/i.test(tab.url || '')) continue;
    chrome.tabs.sendMessage(tab.id, message, () => void chrome.runtime.lastError);
  }
  try { chrome.runtime.sendMessage(message, () => void chrome.runtime.lastError); } catch {}
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message?.type?.startsWith('nexus:digitbox-') || message.type === 'nexus:digitbox-auth-changed') return;
  (async () => {
    if (message.type === 'nexus:digitbox-status') return status(!!message.force);
    if (message.type === 'nexus:digitbox-import') {
      const auth = await validateToken(message.token, message.expiresAt);
      return { ok: true, signedIn: !!auth, user: auth?.user || null, entitlements: normalizeEntitlements(auth?.entitlements) };
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

async function refreshFromDigitBoxTab(tabId) {
  const auth = await importFromDigitBoxTab(tabId);
  if (!auth) await status(true);
}

function scheduleDigitBoxRefresh(tabId, rawUrl = '') {
  const url = String(rawUrl || '');
  const paymentReturn = /[?&]billing=success(?:&|$)/i.test(url);
  const delays = paymentReturn ? [0, 700, 1800, 4000, 8000, 15000] : [0, 900, 3000];
  for (const delay of delays) {
    setTimeout(() => refreshFromDigitBoxTab(tabId).catch(() => {}), delay);
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const url = changeInfo.url || tab?.url || '';
  if (!isDigitBoxUrl(url)) return;
  if (changeInfo.url || changeInfo.status === 'complete') {
    scheduleDigitBoxRefresh(tabId, url);
  }
});
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (isDigitBoxUrl(tab?.url)) refreshFromDigitBoxTab(tabId).catch(() => {});
});

chrome.runtime.onStartup.addListener(() => status(true).catch(() => {}));
chrome.runtime.onInstalled.addListener(() => status(true).catch(() => {}));
