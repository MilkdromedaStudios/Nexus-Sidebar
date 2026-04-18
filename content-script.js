(() => {
  if (window.__nexusSidebarInitialized) return;
  window.__nexusSidebarInitialized = true;

  const SIDEBAR_ID = 'nexus-glass-sidebar-root';
  const HOVER_ZONE_WIDTH = 10;

  const state = {
    open: false,
    query: '',
    sites: [],
    pinnedIds: [],
    frames: new Map(),
    activeFrameId: null,
    pomodoro: {
      running: false,
      startedAt: null,
      remainingMs: 25 * 60 * 1000
    },
    pomodoroTick: null
  };

  const el = {};

  function buildDOM() {
    const root = document.createElement('aside');
    root.id = SIDEBAR_ID;
    root.innerHTML = `
      <div class="nexus-hover-zone" aria-hidden="true"></div>
      <div class="nexus-sidebar" role="complementary" aria-label="Nexus Sidebar">
        <header class="nexus-header">
          <div>
            <div class="nexus-greeting" id="nexusGreeting">Good morning</div>
            <div class="nexus-sub">Your floating command center</div>
          </div>
          <button class="nexus-close" id="nexusClose" title="Close sidebar">✕</button>
        </header>

        <section class="nexus-search-wrap">
          <input id="nexusSearch" class="nexus-search" placeholder="Search everything… (Ctrl/Cmd+K)" />
          <button id="nexusSearchBtn" class="nexus-btn">Search</button>
        </section>

        <section class="nexus-tiles" id="nexusTiles"></section>

        <section class="nexus-pomo">
          <div class="nexus-pomo-title">Pomodoro</div>
          <div class="nexus-pomo-time" id="nexusPomodoroTime">25:00</div>
          <div class="nexus-row">
            <button id="nexusPomoStart" class="nexus-btn">Start</button>
            <button id="nexusPomoPause" class="nexus-btn nexus-btn-muted">Pause</button>
            <button id="nexusPomoReset" class="nexus-btn nexus-btn-muted">Reset</button>
          </div>
        </section>

        <section class="nexus-custom">
          <div class="nexus-row nexus-between">
            <div class="nexus-pomo-title">Pinned sites</div>
            <button id="nexusAddSite" class="nexus-btn nexus-btn-muted">+ Add</button>
          </div>
          <div id="nexusPinnedSites" class="nexus-pinned"></div>
        </section>
      </div>
      <div id="nexusFrameDock" class="nexus-frame-dock"></div>
    `;

    document.documentElement.appendChild(root);

    el.root = root;
    el.hoverZone = root.querySelector('.nexus-hover-zone');
    el.sidebar = root.querySelector('.nexus-sidebar');
    el.searchInput = root.querySelector('#nexusSearch');
    el.searchBtn = root.querySelector('#nexusSearchBtn');
    el.tiles = root.querySelector('#nexusTiles');
    el.close = root.querySelector('#nexusClose');
    el.frameDock = root.querySelector('#nexusFrameDock');
    el.greeting = root.querySelector('#nexusGreeting');
    el.pomoTime = root.querySelector('#nexusPomodoroTime');
    el.pomoStart = root.querySelector('#nexusPomoStart');
    el.pomoPause = root.querySelector('#nexusPomoPause');
    el.pomoReset = root.querySelector('#nexusPomoReset');
    el.addSite = root.querySelector('#nexusAddSite');
    el.pinnedSites = root.querySelector('#nexusPinnedSites');
  }

  function updateGreeting() {
    const hour = new Date().getHours();
    let message = 'Good evening';
    if (hour < 12) message = 'Good morning';
    else if (hour < 18) message = 'Good afternoon';
    el.greeting.textContent = message;
  }

  async function initState() {
    const fallback = await chrome.runtime.sendMessage({ type: 'nexus:get-default-state' }).catch(() => null);
    const store = await chrome.storage.local.get(['customSites', 'pinnedSiteIds', 'pomodoro']);
    state.sites = Array.isArray(store.customSites) ? store.customSites : fallback?.customSites || [];
    state.pinnedIds = Array.isArray(store.pinnedSiteIds) ? store.pinnedSiteIds : fallback?.pinnedSiteIds || [];
    state.pomodoro = store.pomodoro || fallback?.pomodoro || state.pomodoro;
  }

  function formatMs(ms) {
    const sec = Math.max(0, Math.ceil(ms / 1000));
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function renderPomodoro() {
    let remaining = state.pomodoro.remainingMs;
    if (state.pomodoro.running && state.pomodoro.startedAt) {
      remaining -= Date.now() - state.pomodoro.startedAt;
      if (remaining <= 0) {
        remaining = 0;
        state.pomodoro.running = false;
      }
    }
    el.pomoTime.textContent = formatMs(remaining);
  }

  async function persistPomodoro() {
    await chrome.storage.local.set({ pomodoro: state.pomodoro });
  }

  function startPomodoroTicking() {
    if (state.pomodoroTick) clearInterval(state.pomodoroTick);
    state.pomodoroTick = setInterval(renderPomodoro, 250);
  }

  function stopPomodoroTicking() {
    if (state.pomodoro.running && state.pomodoro.startedAt) {
      state.pomodoro.remainingMs -= Date.now() - state.pomodoro.startedAt;
      state.pomodoro.startedAt = null;
      state.pomodoro.running = false;
      persistPomodoro();
    }
    if (state.pomodoroTick) {
      clearInterval(state.pomodoroTick);
      state.pomodoroTick = null;
    }
    renderPomodoro();
  }

  function faviconFor(url) {
    try {
      const u = new URL(url);
      return `${u.origin}/favicon.ico`;
    } catch {
      return '';
    }
  }

  function filteredSites() {
    const q = state.query.trim().toLowerCase();
    if (!q) return state.sites;
    return state.sites.filter((site) => site.title.toLowerCase().includes(q) || site.url.toLowerCase().includes(q));
  }

  function openSearch() {
    const q = el.searchInput.value;
    chrome.runtime.sendMessage({ type: 'nexus:open-search-tab', query: q });
  }

  function ensureFrame(site) {
    const existing = state.frames.get(site.id);
    if (existing) return existing;

    const shell = document.createElement('div');
    shell.className = 'nexus-mini-shell';
    shell.dataset.siteId = site.id;

    const header = document.createElement('div');
    header.className = 'nexus-mini-header';
    header.innerHTML = `<span>${site.title}</span>`;

    const miniBtn = document.createElement('button');
    miniBtn.className = 'nexus-mini-btn';
    miniBtn.textContent = '–';

    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'nexus-mini-btn';
    restoreBtn.textContent = '▢';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'nexus-mini-btn';
    closeBtn.textContent = '✕';

    header.append(miniBtn, restoreBtn, closeBtn);

    const frame = document.createElement('iframe');
    frame.src = site.url;
    frame.className = 'nexus-mini-frame';
    frame.loading = 'eager';
    frame.referrerPolicy = 'no-referrer';

    shell.append(header, frame);
    el.frameDock.appendChild(shell);

    miniBtn.addEventListener('click', () => shell.classList.add('is-minimized'));
    restoreBtn.addEventListener('click', () => {
      shell.classList.remove('is-minimized');
      setActiveFrame(site.id);
    });
    closeBtn.addEventListener('click', () => {
      shell.remove();
      state.frames.delete(site.id);
      if (state.activeFrameId === site.id) state.activeFrameId = null;
      renderPinnedSites();
    });

    state.frames.set(site.id, shell);
    return shell;
  }

  function setActiveFrame(siteId) {
    state.activeFrameId = siteId;
    for (const [id, shell] of state.frames.entries()) {
      shell.classList.toggle('is-active', id === siteId);
      if (id === siteId) shell.classList.remove('is-minimized');
    }
  }

  function renderPinnedSites() {
    el.pinnedSites.innerHTML = '';
    state.pinnedIds
      .map((id) => state.sites.find((s) => s.id === id))
      .filter(Boolean)
      .forEach((site) => {
        const button = document.createElement('button');
        button.className = 'nexus-site-btn';
        button.innerHTML = `<img alt="" src="${faviconFor(site.url)}" /><span>${site.title}</span>`;
        button.title = site.url;
        button.addEventListener('click', () => {
          const shell = ensureFrame(site);
          shell.classList.remove('is-minimized');
          setActiveFrame(site.id);
        });
        el.pinnedSites.appendChild(button);
      });
  }

  async function persistSites() {
    await chrome.storage.local.set({ customSites: state.sites, pinnedSiteIds: state.pinnedIds });
  }

  function renderTiles() {
    el.tiles.innerHTML = '';
    filteredSites().forEach((site) => {
      const tile = document.createElement('button');
      tile.className = 'nexus-tile';
      tile.innerHTML = `<img alt="" src="${faviconFor(site.url)}" /><span>${site.title}</span>`;
      tile.addEventListener('click', () => {
        if (!state.pinnedIds.includes(site.id)) {
          state.pinnedIds.push(site.id);
          persistSites();
          renderPinnedSites();
        }
        const shell = ensureFrame(site);
        setActiveFrame(site.id);
        shell.classList.remove('is-minimized');
      });
      el.tiles.appendChild(tile);
    });
  }

  function openSidebar() {
    state.open = true;
    el.root.classList.add('is-open');
    startPomodoroTicking();
  }

  function closeSidebar() {
    state.open = false;
    el.root.classList.remove('is-open');
    stopPomodoroTicking();
  }

  function wireEvents() {
    el.hoverZone.addEventListener('mouseenter', openSidebar);
    el.close.addEventListener('click', closeSidebar);

    document.addEventListener('mousemove', (evt) => {
      if (evt.clientX <= HOVER_ZONE_WIDTH) openSidebar();
      if (state.open && evt.clientX > 460) closeSidebar();
    });

    document.addEventListener('click', (evt) => {
      if (!state.open) return;
      if (el.sidebar.contains(evt.target) || el.frameDock.contains(evt.target)) return;
      closeSidebar();
    });

    el.searchInput.addEventListener('input', () => {
      state.query = el.searchInput.value;
      renderTiles();
    });

    el.searchBtn.addEventListener('click', openSearch);
    el.searchInput.addEventListener('keydown', (evt) => {
      if (evt.key === 'Enter') {
        evt.preventDefault();
        openSearch();
      }
    });

    document.addEventListener('keydown', (evt) => {
      if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === 'k') {
        evt.preventDefault();
        openSidebar();
        el.searchInput.focus();
      }
    });

    el.pomoStart.addEventListener('click', async () => {
      if (!state.pomodoro.running) {
        state.pomodoro.startedAt = Date.now();
        state.pomodoro.running = true;
        await persistPomodoro();
        renderPomodoro();
      }
    });

    el.pomoPause.addEventListener('click', async () => {
      if (state.pomodoro.running && state.pomodoro.startedAt) {
        state.pomodoro.remainingMs -= Date.now() - state.pomodoro.startedAt;
        state.pomodoro.startedAt = null;
        state.pomodoro.running = false;
        await persistPomodoro();
        renderPomodoro();
      }
    });

    el.pomoReset.addEventListener('click', async () => {
      state.pomodoro = { running: false, startedAt: null, remainingMs: 25 * 60 * 1000 };
      await persistPomodoro();
      renderPomodoro();
    });

    el.addSite.addEventListener('click', async () => {
      const title = prompt('Site name (e.g. Spotify):');
      if (!title) return;
      const url = prompt('Site URL (https://...):');
      if (!url) return;
      const id = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      state.sites.push({ id, title: title.trim(), url: url.trim() });
      if (!state.pinnedIds.includes(id)) state.pinnedIds.push(id);
      await persistSites();
      renderTiles();
      renderPinnedSites();
    });

    window.addEventListener('blur', closeSidebar);
    window.addEventListener('beforeunload', stopPomodoroTicking);
  }

  async function boot() {
    buildDOM();
    updateGreeting();
    await initState();
    renderTiles();
    renderPinnedSites();
    renderPomodoro();
    wireEvents();
  }

  boot();
})();
