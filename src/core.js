(() => {
  'use strict';
  if (window.top !== window) return;

  const DEFAULTS = {
    dark: true, theme: 'modern', edge: 'left', railStyle: 'floating', iconSize: 20, iconGap: 5,
    panelWidth: 470, panelGap: 14, radius: 10, autoHide: true, autoHideRail: true,
    autoHideDelay: 650, revealWidth: 8, profileName: '', weatherLocation: '', customCSS: '',
    cookieSync: true, borderless: false, visibilityMode: 'exclude', visibilityPatterns: '',
    accent: '#4f6bed', hiddenIcons: [], railLayout: [], autoUpdateCheck: true
  };

  const FEATURES = [
    { id: 'launchpad', name: 'Launchpad', icon: 'home', type: 'local' },
    { id: 'history', name: 'History', icon: 'history', type: 'local' },
    { id: 'bookmarks', name: 'Bookmarks', icon: 'bookmark', type: 'local' },
    { id: 'chatgpt', name: 'ChatGPT', icon: 'sparkle', type: 'web', url: 'https://chatgpt.com/' },
    { id: 'pomodoro', name: 'Focus Timer', icon: 'timer', type: 'local' },
    { id: 'games', name: 'F1 Racing', icon: 'flag', type: 'local' }
  ];

  const DEFAULT_LAYOUT = ['launchpad', 'history', 'bookmarks', 'chatgpt', 'pomodoro', 'games'];
  const quotes = [
    'Small steps still move you forward.',
    'Useful beats complicated.',
    'Curiosity turns ordinary days into discoveries.',
    'Good systems make good days easier to repeat.',
    'Consistency compounds long before it looks impressive.',
    'Build something small enough to finish, then improve it.'
  ];

  const ICONS = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.7 12 3.8l8.5 6.9v8.5a1.8 1.8 0 0 1-1.8 1.8H5.3a1.8 1.8 0 0 1-1.8-1.8z"/><path d="M9 21v-6.5h6V21"/></svg>',
    history: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.7 7.7V3.8m0 0h3.9M4 4.1A9 9 0 1 1 3.2 15"/><path d="M12 7.2V12l3.2 2"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.2 3.5h11.6v17l-5.8-3.8-5.8 3.8z"/></svg>',
    timer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 2.8h6M12 6a7.5 7.5 0 1 1-7.5 7.5A7.5 7.5 0 0 1 12 6Z"/><path d="M12 9.2v4.5l3 1.8M17.3 5.7l1.5-1.5"/></svg>',
    flag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4m0 1h10.7l-1.5 3 1.5 3H5"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5c.8 4.5 3 6.7 7.5 7.5-4.5.8-6.7 3-7.5 7.5-.8-4.5-3-6.7-7.5-7.5 4.5-.8 6.7-3 7.5-7.5Z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.6 3.4h4.8l.6 2.3a7.4 7.4 0 0 1 1.7 1l2.3-.7 2.4 4.1-1.7 1.6c.1.4.1.8.1 1.3s0 .9-.1 1.3l1.7 1.6-2.4 4.1-2.3-.7a7.4 7.4 0 0 1-1.7 1l-.6 2.3H9.6L9 20.3a7.4 7.4 0 0 1-1.7-1L5 20l-2.4-4.1 1.7-1.6a8.5 8.5 0 0 1 0-2.6L2.6 10 5 5.9l2.3.7a7.4 7.4 0 0 1 1.7-1z"/><circle cx="12" cy="13" r="2.7"/></svg>',
    hide: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.3-5.2 9-5.2S21 12 21 12s-3.3 5.2-9 5.2S3 12 3 12Z"/><circle cx="12" cy="12" r="2.2"/><path d="m4 4 16 16"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>'
  };

  let booting = false;
  function storeGet(d) { return new Promise(r => chrome.storage.local.get(d, v => r(v || d))); }
  function storeSet(v) { return new Promise(r => chrome.storage.local.set(v, r)); }
  function msg(m) { return new Promise(r => { try { chrome.runtime.sendMessage(m, x => r(chrome.runtime.lastError ? { ok: false, error: chrome.runtime.lastError.message } : (x || { ok: true }))); } catch (e) { r({ ok: false, error: e.message }); } }); }
  function wildcard(pattern, value) { const e = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*'); return new RegExp('^' + e + '$', 'i').test(value); }
  function allowedByRules(settings) {
    const mode = settings.visibilityMode || 'exclude';
    if (mode === 'none') return false;
    if (mode === 'all') return true;
    const rules = String(settings.visibilityPatterns || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    const href = location.href, host = location.hostname;
    const hit = rules.some(p => wildcard(p, href) || wildcard(p, host) || wildcard(p, 'https://' + host));
    return mode === 'include' ? hit : !hit;
  }
  function normalizeLayout(settings, sites) {
    const valid = new Set([...FEATURES.map(x => x.id), ...sites.map(x => x.id)]);
    let layout = Array.isArray(settings.railLayout) && settings.railLayout.length ? [...settings.railLayout] : [...DEFAULT_LAYOUT];
    layout = layout.filter(id => valid.has(id));
    for (const id of valid) if (!layout.includes(id)) layout.push(id);
    settings.railLayout = layout;
    return layout;
  }

  async function boot(force = false) {
    if (booting || window.NexusSidebar) return;
    booting = true;
    try {
      const got = await storeGet({ nexusSettings: DEFAULTS, nexusSites: [], nexusGames: {} });
      const settings = { ...DEFAULTS, ...got.nexusSettings };
      if (!force && !allowedByRules(settings)) return;
      const sites = got.nexusSites || [];
      normalizeLayout(settings, sites);
      const N = window.NexusSidebar = { settings, sites, games: got.nexusGames || {}, FEATURES, storeGet, storeSet, msg, quotes, active: null, sessions: new Map(), cleanup: [], editMode: false, isGuest: true, accountTier: 'guest', digitboxUser: null };
      N.guestCustomSiteId = () => N.sites?.[0]?.id || '';
      N.canUseItem = (item, custom = false) => {
        if (!N.isGuest) return true;
        if (!item) return false;
        if (item.type === 'account-local' || ['launchpad', 'history', 'bookmarks', 'settings', 'digitbox-account', 'digitbox-profile'].includes(item.id)) return true;
        const isCustom = custom || String(item.id || '').startsWith('site-');
        return isCustom && item.id === N.guestCustomSiteId();
      };

      const root = document.createElement('div');
      root.id = 'nexus-root';
      root.innerHTML = `
        <div id="nexus-hotzone"></div>
        <aside id="nexus-rail" aria-label="Nexus Sidebar"><div id="nexus-icons"></div></aside>
        <div id="nexus-corner-controls" aria-label="Nexus controls">
          <button class="nexus-icon nexus-util" id="nexus-session-hide" title="Hide Nexus for this tab">${ICONS.hide}</button>
          <button class="nexus-icon nexus-util" id="nexus-settings" title="Nexus settings">${ICONS.settings}</button>
        </div>
        <section id="nexus-panel" aria-label="Nexus panel">
          <header id="nexus-head"><div id="nexus-head-icon"></div><div><b id="nexus-title">Nexus</b><small id="nexus-subtitle">Sidebar</small></div><button id="nexus-close" title="Close panel">${ICONS.close}</button></header>
          <div id="nexus-body"></div><div id="nexus-sessions"></div>
        </section>`;

      document.documentElement.append(root);
      N.root = root; N.rail = root.querySelector('#nexus-rail'); N.panel = root.querySelector('#nexus-panel'); N.body = root.querySelector('#nexus-body'); N.icons = root.querySelector('#nexus-icons'); N.sessionsHost = root.querySelector('#nexus-sessions');
      const hotzone = root.querySelector('#nexus-hotzone');
      const style = document.createElement('style'); style.id = 'nexus-custom-css'; document.documentElement.append(style); N.customStyle = style;
      let hideTimer = 0;
      const cancelHide = () => { clearTimeout(hideTimer); hideTimer = 0; };

      N.iconNode = (item, custom = false) => {
        if (custom || item.type === 'web') {
          const i = document.createElement('img');
          try { i.src = chrome.runtime.getURL('_favicon/?pageUrl=' + encodeURIComponent(item.url) + '&size=32'); } catch {}
          i.onerror = () => { const s = document.createElement('span'); s.className = 'nexus-line-icon'; s.innerHTML = ICONS[item.icon] || ICONS.sparkle; i.replaceWith(s); };
          return i;
        }
        const s = document.createElement('span'); s.className = 'nexus-line-icon'; s.innerHTML = ICONS[item.icon] || ICONS.sparkle; return s;
      };
      N.setHeader = (item, custom = false) => {
        const h = root.querySelector('#nexus-head-icon'); h.replaceChildren(N.iconNode(item, custom));
        root.querySelector('#nexus-title').textContent = item.name;
        root.querySelector('#nexus-subtitle').textContent = item.url ? new URL(item.url).hostname : 'Nexus Sidebar';
      };
      N.show = () => { cancelHide(); sessionStorage.removeItem('nexus-session-hidden'); root.classList.remove('session-hidden'); root.classList.add('rail-visible'); };
      N.hideRail = () => { cancelHide(); if (!N.panel.classList.contains('open')) root.classList.remove('rail-visible'); };
      N.scheduleAutoHide = (delay = N.settings.autoHideDelay) => {
        cancelHide();
        if (!N.settings.autoHide || !N.settings.autoHideRail || N.panel.classList.contains('open') || N.editMode) return;
        hideTimer = setTimeout(() => {
          hideTimer = 0;
          if (N.panel.classList.contains('open') || N.editMode || N.rail.matches(':hover') || hotzone.matches(':hover')) return;
          N.hideRail();
        }, Math.max(100, Number(delay) || 650));
      };
      N.closePanelSoft = () => { N.panel.classList.remove('open'); N.active = null; N.renderRail?.(); N.scheduleAutoHide(); };
      N.hideSession = () => {
        if (!confirm('Hide Nexus for this tab until the page is reloaded?')) return;
        cancelHide(); sessionStorage.setItem('nexus-session-hidden', '1'); N.panel.classList.remove('open'); root.classList.add('session-hidden');
      };
      N.runCleanup = () => { for (const fn of N.cleanup.splice(0)) { try { fn(); } catch {} } };
      N.saveSettings = async () => storeSet({ nexusSettings: N.settings });
      N.apply = () => {
        const s = N.settings, wasVisible = root.classList.contains('rail-visible');
        const activeTheme = N.isGuest ? 'modern' : s.theme;
        root.className = `${s.dark ? 'dark' : ''} theme-${activeTheme} edge-${s.edge} ${s.railStyle === 'floating' ? 'floating' : ''} ${s.borderless ? 'borderless' : ''} ${N.editMode ? 'edit-mode' : ''} ${s.edgeRevealOnly ? 'nexus-edge-only' : ''} ${N.isGuest ? 'account-guest' : 'account-member'}`;
        if (wasVisible) root.classList.add('rail-visible');
        if (sessionStorage.getItem('nexus-session-hidden') === '1') root.classList.add('session-hidden');
        root.style.setProperty('--nexus-icon', s.iconSize + 'px'); root.style.setProperty('--nexus-gap', s.iconGap + 'px'); root.style.setProperty('--nexus-width', s.panelWidth + 'px'); root.style.setProperty('--nexus-panel-gap', s.panelGap + 'px'); root.style.setProperty('--nexus-radius', s.radius + 'px'); root.style.setProperty('--nexus-reveal', s.revealWidth + 'px'); root.style.setProperty('--nexus-accent', s.accent); style.textContent = N.isGuest ? '' : (s.customCSS || '');
        if (!s.autoHide) root.classList.add('rail-visible'); else N.scheduleAutoHide();
      };
      N.normalizeLayout = () => normalizeLayout(N.settings, N.sites);
      N.apply();

      const enter = () => N.show(), leave = () => N.scheduleAutoHide();
      hotzone.addEventListener('pointerenter', enter); hotzone.addEventListener('pointerleave', leave); N.rail.addEventListener('pointerenter', enter); N.rail.addEventListener('pointerleave', leave); N.panel.addEventListener('pointerenter', cancelHide); N.panel.addEventListener('pointerleave', leave);
      root.querySelector('#nexus-close').onclick = () => N.closePanelSoft();
      root.querySelector('#nexus-settings').onclick = () => N.activate?.({ id: 'settings', name: 'Settings', icon: 'settings', type: 'local' });
      root.querySelector('#nexus-session-hide').onclick = N.hideSession;
      const outside = e => { if (!N.panel.classList.contains('open')) return; if (N.panel.contains(e.target) || N.rail.contains(e.target) || root.querySelector('#nexus-corner-controls').contains(e.target)) return; N.closePanelSoft(); };
      document.addEventListener('pointerdown', outside, true);
      document.dispatchEvent(new CustomEvent('nexus:ready'));
    } finally { booting = false; }
  }

  chrome.runtime.onMessage.addListener(m => {
    if (m?.type !== 'nexus:reveal') return;
    if (window.NexusSidebar) { window.NexusSidebar.show(); window.NexusSidebar.scheduleAutoHide?.(1800); return; }
    boot(true).then(() => { window.NexusSidebar?.show(); window.NexusSidebar?.scheduleAutoHide?.(1800); });
  });
  boot(false).catch(console.error);
})();
