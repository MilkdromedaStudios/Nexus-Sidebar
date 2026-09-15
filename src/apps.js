document.addEventListener('nexus:ready', () => {
  const N = window.NexusSidebar;
  const getItem = id => N.FEATURES.find(x => x.id === id) || N.sites.find(x => x.id === id);
  const hidden = id => (N.settings.hiddenIcons || []).includes(id);
  const fmt = seconds => {
    const s = Math.max(0, Math.ceil(Number(seconds) || 0));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };
  const remaining = state => state?.running && state.endAt ? Math.max(0, (state.endAt - Date.now()) / 1000) : Math.max(0, state?.remainingSec ?? 1500);

  function saveLayout() { return N.saveSettings(); }
  function moveToken(source, target) {
    const a = N.settings.railLayout;
    const from = a.indexOf(source), to = a.indexOf(target);
    if (from < 0 || to < 0 || from === to) return;
    a.splice(from, 1);
    const ni = a.indexOf(target);
    a.splice(ni, 0, source);
    saveLayout();
    N.renderRail();
  }
  function draggable(el, token) {
    if (!N.editMode) return;
    el.draggable = true;
    el.dataset.token = token;
    el.classList.add('nexus-draggable');
    el.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/nexus-token', token);
      e.dataTransfer.effectAllowed = 'move';
      el.classList.add('dragging');
    });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
    el.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
    el.addEventListener('drop', e => { e.preventDefault(); const src = e.dataTransfer.getData('text/nexus-token'); if (src) moveToken(src, token); });
  }

  function iconButton(item, custom = false) {
    const b = document.createElement('button');
    b.className = 'nexus-icon' + (N.active?.id === item.id ? ' active' : '') + (item.id === 'pomodoro' ? ' nexus-timer-icon' : '');
    b.title = N.editMode ? `Drag ${item.name}` : item.name;
    b.append(N.iconNode(item, custom));
    if (item.id === 'pomodoro') {
      const mini = document.createElement('small');
      mini.className = 'nexus-timer-mini';
      mini.textContent = '25:00';
      b.append(mini);
    }
    b.onclick = e => { if (N.editMode) { e.preventDefault(); return; } N.activate(item, custom); };
    draggable(b, item.id);
    return b;
  }

  N.renderRail = () => {
    N.icons.replaceChildren();
    const group = document.createElement('div');
    group.className = 'nexus-rail-group';
    N.icons.append(group);
    for (const id of N.normalizeLayout()) {
      const item = getItem(id);
      if (!item || hidden(id)) continue;
      group.append(iconButton(item, String(item.id).startsWith('site-')));
    }
    updatePomodoroMini();
  };

  N.closeActive = () => N.closePanelSoft();
  N.activate = async (item, custom = false) => {
    N.runCleanup();
    N.active = item;
    N.setHeader(item, custom);
    N.panel.classList.add('open');
    N.root.classList.add('rail-visible');
    N.renderRail();
    if (item.type === 'web' || custom) return N.openSite(item);
    N.showLocal();
    N.body.replaceChildren();
    if (item.id === 'launchpad') renderLaunchpad();
    else if (item.id === 'history') renderHistory();
    else if (item.id === 'pomodoro') renderPomodoro();
    else if (item.id === 'games') N.renderGames?.();
    else if (item.id === 'settings') N.renderSettings?.();
  };

  function daily() {
    const d = new Date();
    return N.quotes[(d.getDate() + d.getMonth() * 31) % N.quotes.length];
  }

  function renderLaunchpad() {
    const hero = document.createElement('div');
    hero.className = 'nexus-hero';
    const name = N.settings.profileName ? `, ${N.settings.profileName}` : '';
    hero.innerHTML = `<h1>Hello${name}</h1><p>“${daily()}”</p>`;

    const search = document.createElement('form');
    search.className = 'nexus-search';
    search.innerHTML = '<input placeholder="Search Google or enter a URL"><button>Go</button>';
    search.onsubmit = e => {
      e.preventDefault();
      const q = search.querySelector('input').value.trim();
      if (!q) return;
      location.href = /^https?:\/\//i.test(q) ? q : 'https://www.google.com/search?q=' + encodeURIComponent(q);
    };

    const cards = document.createElement('div');
    cards.className = 'nexus-dashboard';
    const time = document.createElement('div'); time.className = 'nexus-card';
    const weather = document.createElement('div'); weather.className = 'nexus-card';
    cards.append(time, weather);
    const tick = () => {
      const d = new Date();
      time.innerHTML = `<b>${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</b><small>${d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</small>`;
    };
    tick();
    const t = setInterval(tick, 1000); N.cleanup.push(() => clearInterval(t));
    weather.innerHTML = '<b>Weather</b><small>Loading…</small>';
    N.msg({ type: 'nexus:weather', location: N.settings.weatherLocation || '' }).then(r => {
      if (r?.ok) weather.innerHTML = `<b>${r.weather.temp}°F · ${r.weather.condition}</b><small>${r.weather.location || 'Current area'}</small>`;
      else weather.querySelector('small').textContent = 'Unavailable';
    });

    const qa = document.createElement('div');
    qa.className = 'nexus-quick';
    [
      ['↻', 'Reload', () => N.msg({ type: 'nexus:reload' })],
      ['◷', 'History', () => N.activate(N.FEATURES.find(x => x.id === 'history'))],
      ['25', 'Focus', () => N.activate(N.FEATURES.find(x => x.id === 'pomodoro'))],
      ['⚑', 'F1 race', () => N.activate(N.FEATURES.find(x => x.id === 'games'))]
    ].forEach(([i, n, f]) => { const b = document.createElement('button'); b.innerHTML = `<b>${i}</b><small>${n}</small>`; b.onclick = f; qa.append(b); });

    const apps = document.createElement('div');
    apps.className = 'nexus-appgrid';
    [...N.FEATURES.filter(x => x.id !== 'launchpad' && !hidden(x.id)), ...N.sites.filter(x => !hidden(x.id))].forEach(x => {
      const b = document.createElement('button'); b.append(N.iconNode(x, String(x.id).startsWith('site-')));
      const s = document.createElement('small'); s.textContent = x.name; b.append(s);
      b.onclick = () => N.activate(x, String(x.id).startsWith('site-')); apps.append(b);
    });
    N.body.append(hero, search, cards, qa, apps);
  }

  async function renderHistory() {
    const input = document.createElement('input'); input.className = 'nexus-wide'; input.placeholder = 'Search history';
    const list = document.createElement('div'); list.className = 'nexus-list'; N.body.append(input, list);
    const load = async () => {
      const r = await N.msg({ type: 'nexus:history', query: input.value }); list.replaceChildren();
      (r.results || []).slice(0, 60).forEach(x => { const a = document.createElement('a'); a.href = x.url; a.textContent = x.title || x.url; list.append(a); });
    };
    input.oninput = load; load();
  }

  async function renderPomodoro() {
    const wrap = document.createElement('div');
    wrap.className = 'nexus-pomodoro';
    wrap.innerHTML = `
      <div class="nexus-pomodoro-clock">25:00</div>
      <div class="nexus-pomodoro-status">Focus session</div>
      <div class="nexus-pomodoro-actions"><button data-toggle>Start</button><button data-reset>Reset</button></div>
      <div class="nexus-pomodoro-presets"><button data-min="25">25 min focus</button><button data-min="5">5 min break</button></div>
      <p>Timer keeps running when the sidebar is closed or you browse to another page. Nexus will notify you when it finishes.</p>`;
    N.body.append(wrap);
    const clock = wrap.querySelector('.nexus-pomodoro-clock');
    const status = wrap.querySelector('.nexus-pomodoro-status');
    const toggle = wrap.querySelector('[data-toggle]');
    let state = null;

    const paint = async () => {
      const r = await N.msg({ type: 'nexus:pomodoro-get' });
      if (!r?.ok) return;
      state = r.state;
      const left = remaining(state);
      clock.textContent = fmt(left);
      status.textContent = state.mode === 'break' ? 'Break' : 'Focus session';
      toggle.textContent = state.running ? 'Pause' : (left <= 0 ? 'Start again' : 'Start');
    };
    toggle.onclick = async () => { await N.msg({ type: state?.running ? 'nexus:pomodoro-pause' : 'nexus:pomodoro-start' }); await paint(); updatePomodoroMini(); };
    wrap.querySelector('[data-reset]').onclick = async () => { await N.msg({ type: 'nexus:pomodoro-reset' }); await paint(); updatePomodoroMini(); };
    wrap.querySelectorAll('[data-min]').forEach(b => b.onclick = async () => { const minutes = Number(b.dataset.min); await N.msg({ type: 'nexus:pomodoro-set', minutes, mode: minutes <= 5 ? 'break' : 'focus' }); await paint(); updatePomodoroMini(); });
    await paint();
    const timer = setInterval(paint, 1000); N.cleanup.push(() => clearInterval(timer));
  }

  async function updatePomodoroMini() {
    const mini = N.root.querySelector('.nexus-timer-mini');
    if (!mini) return;
    try {
      const r = await N.msg({ type: 'nexus:pomodoro-get' });
      if (!r?.ok) return;
      mini.textContent = fmt(remaining(r.state));
      mini.closest('.nexus-icon')?.classList.toggle('timer-running', !!r.state.running);
    } catch {}
  }

  N.renderRail();
  if (!N.settings.autoHide) N.show();
  updatePomodoroMini();
  setInterval(updatePomodoroMini, 1000);
});
