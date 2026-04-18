const DEFAULT_STATE = {
  customSites: [
    { id: 'gmail', title: 'Gmail', url: 'https://mail.google.com/' },
    { id: 'weather', title: 'Weather', url: 'https://www.msn.com/en-us/weather' },
    { id: 'spotify', title: 'Spotify', url: 'https://open.spotify.com/' }
  ],
  pinnedSiteIds: ['gmail', 'weather', 'spotify'],
  pomodoro: {
    running: false,
    startedAt: null,
    remainingMs: 25 * 60 * 1000
  }
};

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(['customSites', 'pinnedSiteIds', 'pomodoro']);
  const patch = {};
  if (!Array.isArray(current.customSites)) patch.customSites = DEFAULT_STATE.customSites;
  if (!Array.isArray(current.pinnedSiteIds)) patch.pinnedSiteIds = DEFAULT_STATE.pinnedSiteIds;
  if (!current.pomodoro) patch.pomodoro = DEFAULT_STATE.pomodoro;
  if (Object.keys(patch).length) await chrome.storage.local.set(patch);
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'nexus:get-default-state') {
    sendResponse(DEFAULT_STATE);
    return true;
  }

  if (msg?.type === 'nexus:open-search-tab') {
    const q = (msg.query || '').trim();
    chrome.tabs.create({
      url: q ? `https://www.google.com/search?q=${encodeURIComponent(q)}` : 'https://www.google.com/'
    });
    sendResponse({ ok: true });
    return true;
  }

  return undefined;
});
