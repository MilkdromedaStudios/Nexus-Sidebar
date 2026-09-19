(() => {
  'use strict';

  const D = {
    searchEngine: 'google', customSearch: '', clock24: false,
    bgType: 'gradient', bgUrl: '', bgData: '', speed: 45, density: 70, bright: 90,
    solid: '#080a12', ga: '#0b1020', gb: '#24123f', dim: 14,
    accent: '#7c5cff', opacity: 54, blur: 18, radius: 14, cols: 3,
    widgets: { tasks: true, focus: true, notes: true, links: true, weather: true, quote: false },
    links: 'GitHub | https://github.com\nChatGPT | https://chatgpt.com\nGmail | https://mail.google.com',
    css: ''
  };

  const SEARCH = {
    google: 'https://www.google.com/search?q=',
    bing: 'https://www.bing.com/search?q=',
    duckduckgo: 'https://duckduckgo.com/?q=',
    brave: 'https://search.brave.com/search?q=',
    ecosia: 'https://www.ecosia.org/search?q=',
    startpage: 'https://www.startpage.com/sp/search?query='
  };
  const Q = [
    'Small steps still move you forward.',
    'Useful beats complicated.',
    'Curiosity turns ordinary days into discoveries.',
    'Good systems make good days easier to repeat.',
    'Consistency compounds long before it looks impressive.',
    'Build something small enough to finish, then improve it.'
  ];

  const $ = id => document.getElementById(id);
  const get = d => new Promise(r => chrome.storage.local.get(d, v => r(v || d)));
  const set = v => new Promise(r => chrome.storage.local.set(v, r));
  const msg = m => new Promise(r => chrome.runtime.sendMessage(m, x => r(chrome.runtime.lastError ? { ok: false } : (x || { ok: true }))));

  let c = { ...D };
  let shared = {};
  let focus = { seconds: 1500, running: false, last: 0 };
  let tasks = [];
  let notes = '';
  let focusTimer = 0;
  let noteTimer = 0;
  let raf = 0;
  let stars = [];
  let accountUser = null;
  let signedIn = false;
  let guestMode = true;
  let initialized = false;
  let initializing = false;

  function hasPro(entitlements) {
    return Array.isArray(entitlements?.features) && entitlements.features.includes('nexus_pro');
  }

  async function checkDigitBox(force = false) {
    const status = await msg({ type: 'nexus:digitbox-status', force });
    signedIn = !!status?.signedIn;
    accountUser = signedIn ? (status.user || null) : null;
    guestMode = !(signedIn && hasPro(status?.entitlements));
    document.body.classList.toggle('guest-mode', guestMode);
    paintAccountBanner();
    return !guestMode;
  }

  function paintAccountBanner() {
    let banner = document.getElementById('newtab-account-banner');
    if (!guestMode) {
      banner?.remove();
      return;
    }
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'newtab-account-banner';
      document.body.append(banner);
    }

    if (signedIn) {
      banner.innerHTML = '<div><b>DigitBox Free</b><span>Search + bookmarks are available. DigitBox Pro unlocks tasks, focus, notes, weather, customization, and full Nexus.</span></div><button>Upgrade to Pro</button>';
      banner.querySelector('button').onclick = async () => {
        const url = 'https://digitbox.dev/profile#digitbox-pro';
        const result = await msg({ type: 'nexus:open-tab', url });
        if (!result?.ok) window.open(url, '_blank', 'noopener,noreferrer');
      };
    } else {
      banner.innerHTML = '<div><b>Guest mode</b><span>Search + bookmarks are available. Sign in with DigitBox to use your account.</span></div><button>Sign in with DigitBox</button>';
      banner.querySelector('button').onclick = async () => {
        const url = 'https://digitbox.dev/login?next=/profile';
        const result = await msg({ type: 'nexus:open-tab', url });
        if (!result?.ok) window.open(url, '_blank', 'noopener,noreferrer');
      };
    }
  }

  function hello() {
    const h = new Date().getHours();
    const p = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    const name = accountUser?.displayName || shared.profileName;
    return name ? `${p}, ${name}` : p;
  }

  function clock() {
    const d = new Date();
    $('clock').textContent = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: !c.clock24 });
    $('date').textContent = d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    $('greet').textContent = hello();
  }

  function appearance() {
    const view = guestMode ? D : c;
    const r = document.documentElement.style;
    r.setProperty('--a', view.accent);
    r.setProperty('--glass', (view.opacity / 100).toFixed(2));
    r.setProperty('--blur', view.blur + 'px');
    r.setProperty('--r', view.radius + 'px');
    r.setProperty('--cols', guestMode ? 1 : view.cols);
    $('dim').style.background = `rgba(0,0,0,${view.dim / 100})`;
    $('custom-css').textContent = guestMode ? '' : (c.css || '');
  }

  function url(v) {
    v = String(v || '').trim();
    if (!v) return '';
    if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
    try { return new URL(v).href; } catch { return ''; }
  }

  function queryUrl(q) {
    q = q.trim();
    if (/^https?:\/\//i.test(q)) return q;
    if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(q) && !q.includes(' ')) return 'https://' + q;
    if (c.searchEngine === 'custom' && c.customSearch.includes('{q}')) {
      return c.customSearch.replaceAll('{q}', encodeURIComponent(q));
    }
    return (SEARCH[c.searchEngine] || SEARCH.google) + encodeURIComponent(q);
  }

  function background() {
    const view = guestMode ? D : c;
    cancelAnimationFrame(raf);
    $('stars').style.display = 'none';
    $('bg').style.display = 'none';

    if (view.bgType === 'stars') {
      startStars();
      return;
    }
    if (view.bgType === 'solid') {
      $('bg').style.cssText = `display:block;background:${view.solid}`;
      return;
    }
    if (view.bgType === 'image') {
      const source = view.bgData || view.bgUrl;
      if (source) $('bg').style.cssText = `display:block;background:url("${source.replace(/"/g, '')}") center/cover no-repeat`;
      else $('bg').style.cssText = `display:block;background:linear-gradient(135deg,${view.ga},${view.gb})`;
      return;
    }
    $('bg').style.cssText = `display:block;background:linear-gradient(135deg,${view.ga},${view.gb})`;
  }

  function startStars() {
    const cv = $('stars');
    const x = cv.getContext('2d', { alpha: false });
    cv.style.display = 'block';
    if (!stars.length) {
      stars = Array.from({ length: 360 }, () => ({ x: (Math.random() - .5) * 2, y: (Math.random() - .5) * 2, z: Math.random() }));
    }

    let last = performance.now();
    let width = 0;
    let height = 0;
    let scale = 1;

    function size() {
      const d = Math.min(devicePixelRatio || 1, 2);
      if (width === innerWidth && height === innerHeight && scale === d) return;
      width = innerWidth;
      height = innerHeight;
      scale = d;
      cv.width = Math.max(1, Math.floor(width * scale));
      cv.height = Math.max(1, Math.floor(height * scale));
      cv.style.width = width + 'px';
      cv.style.height = height + 'px';
      x.setTransform(scale, 0, 0, scale, 0, 0);
    }

    function draw(n) {
      const dt = Math.min(.04, (n - last) / 1000);
      last = n;
      size();
      x.fillStyle = '#080a12';
      x.fillRect(0, 0, width, height);
      const count = Math.floor(stars.length * Math.min(1.55, c.density / 100));
      const cx = width / 2;
      const cy = height / 2;
      for (let i = 0; i < count; i++) {
        const s = stars[i % stars.length];
        s.z -= dt * .17 * c.speed / 100;
        if (s.z < .015) {
          s.x = (Math.random() - .5) * 2;
          s.y = (Math.random() - .5) * 2;
          s.z = 1;
        }
        const px = cx + s.x / s.z * cx * .8;
        const py = cy + s.y / s.z * cy * .8;
        if (px < -10 || px > width + 10 || py < -10 || py > height + 10) continue;
        const rr = Math.max(.35, (1 - s.z) * 1.9);
        x.globalAlpha = Math.min(1, (1 - s.z) * c.bright / 100);
        x.fillStyle = '#fff';
        x.beginPath();
        x.arc(px, py, rr, 0, Math.PI * 2);
        x.fill();
      }
      x.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
  }

  function widget(title, wide = false) {
    const a = document.createElement('article');
    a.className = 'widget' + (wide ? ' wide' : '');
    const h = document.createElement('h4');
    h.textContent = title;
    a.append(h);
    return a;
  }

  function addTask(text) {
    text = String(text || '').trim();
    if (!text) return;
    tasks.unshift({ id: crypto.randomUUID(), text, done: false, createdAt: Date.now() });
    set({ nexusTasks: tasks });
    renderWidgets();
  }

  function tasksWidget() {
    const a = widget('Today', true);
    const list = document.createElement('div');
    list.className = 'task-list';
    const sorted = [...tasks].sort((x, y) => Number(x.done) - Number(y.done) || y.createdAt - x.createdAt);
    if (!sorted.length) {
      const empty = document.createElement('div');
      empty.className = 'task-empty';
      empty.textContent = 'Nothing queued. Add one small next step above.';
      list.append(empty);
    }
    sorted.slice(0, 10).forEach(t => {
      const row = document.createElement('label');
      row.className = 'task-row' + (t.done ? ' done' : '');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!t.done;
      const text = document.createElement('span');
      text.textContent = t.text;
      const del = document.createElement('button');
      del.className = 'delete';
      del.type = 'button';
      del.textContent = '×';
      del.title = 'Delete task';
      cb.onchange = () => {
        t.done = cb.checked;
        set({ nexusTasks: tasks });
        renderWidgets();
      };
      del.onclick = e => {
        e.preventDefault();
        tasks = tasks.filter(x => x.id !== t.id);
        set({ nexusTasks: tasks });
        renderWidgets();
      };
      row.append(cb, text, del);
      list.append(row);
    });

    const footer = document.createElement('div');
    footer.className = 'task-footer';
    const left = document.createElement('span');
    left.textContent = `${tasks.filter(t => !t.done).length} remaining`;
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.textContent = 'Clear done';
    clear.disabled = !tasks.some(t => t.done);
    clear.onclick = () => {
      tasks = tasks.filter(t => !t.done);
      set({ nexusTasks: tasks });
      renderWidgets();
    };
    footer.append(left, clear);
    a.append(list, footer);
    $('widgets').append(a);
  }

  function focusWidget() {
    const a = widget('Focus');
    const b = document.createElement('div');
    b.className = 'big';
    const sub = document.createElement('div');
    sub.className = 'sub';
    sub.textContent = '25-minute focus block';
    const actions = document.createElement('div');
    actions.className = 'focus-actions';
    const toggle = document.createElement('button');
    const reset = document.createElement('button');
    reset.textContent = 'Reset';
    actions.append(toggle, reset);
    a.append(b, sub, actions);
    $('widgets').append(a);

    function paint() {
      const sec = Math.max(0, Math.ceil(focus.seconds));
      b.textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
      toggle.textContent = focus.running ? 'Pause' : 'Start';
    }

    function runTimer() {
      clearInterval(focusTimer);
      if (!focus.running) return;
      focusTimer = setInterval(() => {
        if (!focus.running) return;
        const n = Date.now();
        focus.seconds = Math.max(0, focus.seconds - (n - focus.last) / 1000);
        focus.last = n;
        if (!focus.seconds) focus.running = false;
        paint();
        set({ nexusFocus: focus });
        if (!focus.running) clearInterval(focusTimer);
      }, 1000);
    }

    toggle.onclick = () => {
      focus.running = !focus.running;
      focus.last = Date.now();
      paint();
      runTimer();
      set({ nexusFocus: focus });
    };
    reset.onclick = () => {
      focus = { seconds: 1500, running: false, last: 0 };
      clearInterval(focusTimer);
      paint();
      set({ nexusFocus: focus });
    };
    paint();
    runTimer();
  }

  function notesWidget() {
    const a = widget('Scratch notes');
    const area = document.createElement('textarea');
    area.className = 'notes';
    area.placeholder = 'Ideas, reminders, links…';
    area.value = notes;
    area.oninput = () => {
      notes = area.value;
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => set({ nexusNotes: notes }), 250);
    };
    a.append(area);
    $('widgets').append(a);
  }

  function linksWidget() {
    const a = widget('Quick links');
    const q = document.createElement('div');
    q.className = 'quick';
    String(c.links || '').split(/\r?\n/).forEach(line => {
      const [n, ...r] = line.split('|');
      const u = url(r.join('|'));
      if (n?.trim() && u) {
        const l = document.createElement('a');
        l.href = u;
        l.textContent = n.trim();
        q.append(l);
      }
    });
    a.append(q);
    $('widgets').append(a);
  }

  function weatherWidget() {
    const a = widget('Weather');
    const big = document.createElement('div');
    big.className = 'big';
    big.textContent = '…';
    const sub = document.createElement('div');
    sub.className = 'sub';
    sub.textContent = 'Loading';
    a.append(big, sub);
    $('widgets').append(a);
    msg({ type: 'nexus:weather', location: shared.weatherLocation || '' }).then(r => {
      if (r?.ok) {
        big.textContent = `${r.weather.temp}°F`;
        sub.textContent = `${r.weather.condition} · ${r.weather.location || 'Current area'}`;
      } else {
        big.textContent = '—';
        sub.textContent = 'Weather unavailable';
      }
    });
  }

  function quoteWidget() {
    const a = widget('Daily thought');
    const d = new Date();
    const big = document.createElement('div');
    big.className = 'big';
    big.style.fontSize = '18px';
    big.textContent = `“${Q[(d.getDate() + d.getMonth() * 31) % Q.length]}”`;
    a.append(big);
    $('widgets').append(a);
  }

  async function bookmarksWidget() {
    const a = widget('Bookmarks', true);
    const list = document.createElement('div');
    list.className = 'quick';
    a.append(list);
    $('widgets').append(a);
    const r = await msg({ type: 'nexus:next:bookmarks', query: '' });
    const flat = [];
    const walk = items => (items || []).forEach(x => { if (x.url) flat.push(x); if (x.children) walk(x.children); });
    walk(r?.items || []);
    flat.slice(0, 18).forEach(x => {
      const link = document.createElement('a');
      link.href = x.url;
      link.textContent = x.title || x.url;
      list.append(link);
    });
    if (!list.children.length) {
      const empty = document.createElement('div');
      empty.className = 'task-empty';
      empty.textContent = 'No bookmarks yet.';
      list.append(empty);
    }
  }

  function renderWidgets() {
    $('widgets').replaceChildren();
    if (guestMode) {
      bookmarksWidget();
      return;
    }
    if (c.widgets.tasks) tasksWidget();
    if (c.widgets.focus) focusWidget();
    if (c.widgets.notes) notesWidget();
    if (c.widgets.links) linksWidget();
    if (c.widgets.weather) weatherWidget();
    if (c.widgets.quote) quoteWidget();
  }

  function bind(id, key, type = 'value', after = () => {}) {
    const e = $(id);
    if (type === 'checked') e.checked = !!c[key];
    else e.value = c[key] ?? '';
    e.oninput = e.onchange = async () => {
      c[key] = type === 'checked' ? e.checked : type === 'number' ? +e.value : e.value;
      await set({ nexusNewtab: c });
      after();
    };
  }

  function prefs() {
    bind('p-engine', 'searchEngine');
    bind('p-custom', 'customSearch');
    bind('p-24', 'clock24', 'checked', clock);
    bind('p-bgtype', 'bgType', 'value', background);
    bind('p-bgurl', 'bgUrl', 'value', background);
    bind('p-speed', 'speed', 'number');
    bind('p-density', 'density', 'number');
    bind('p-bright', 'bright', 'number');
    bind('p-solid', 'solid', 'value', background);
    bind('p-ga', 'ga', 'value', background);
    bind('p-gb', 'gb', 'value', background);
    bind('p-dim', 'dim', 'number', appearance);
    bind('p-accent', 'accent', 'value', appearance);
    bind('p-opacity', 'opacity', 'number', appearance);
    bind('p-blur', 'blur', 'number', appearance);
    bind('p-radius', 'radius', 'number', appearance);
    bind('p-cols', 'cols', 'number', appearance);

    $('p-name').value = shared.profileName || '';
    $('p-name').onchange = () => {
      shared.profileName = $('p-name').value.trim();
      set({ nexusSettings: { ...shared } });
      clock();
    };
    $('p-weather').value = shared.weatherLocation || '';
    $('p-weather').onchange = () => {
      shared.weatherLocation = $('p-weather').value.trim();
      set({ nexusSettings: { ...shared } });
      renderWidgets();
    };

    [['w-tasks', 'tasks'], ['w-focus', 'focus'], ['w-notes', 'notes'], ['w-links', 'links'], ['w-weather', 'weather'], ['w-quote', 'quote']].forEach(([id, k]) => {
      $(id).checked = !!c.widgets[k];
      $(id).onchange = () => {
        c.widgets[k] = $(id).checked;
        set({ nexusNewtab: c });
        renderWidgets();
      };
    });

    $('p-links').value = c.links;
    $('p-links').onchange = () => {
      c.links = $('p-links').value;
      set({ nexusNewtab: c });
      renderWidgets();
    };
    $('p-css').value = c.css;
    $('p-css').oninput = () => {
      c.css = $('p-css').value;
      appearance();
      set({ nexusNewtab: c });
    };
    $('p-file').onchange = e => {
      const f = e.target.files?.[0];
      if (!f || f.size > 4e6) return;
      const r = new FileReader();
      r.onload = () => {
        c.bgData = String(r.result);
        c.bgType = 'image';
        $('p-bgtype').value = 'image';
        set({ nexusNewtab: c });
        background();
      };
      r.readAsDataURL(f);
    };
  }

  async function init() {
    if (initialized || initializing) return;
    initializing = true;
    await checkDigitBox(true);
    initialized = true;
    initializing = false;
    const v = await get({ nexusNewtab: D, nexusSettings: {}, nexusFocus: null, nexusTasks: [], nexusNotes: '' });
    c = { ...D, ...v.nexusNewtab, widgets: { ...D.widgets, ...v.nexusNewtab?.widgets } };
    if (c.bgType === 'site') c.bgType = 'gradient';
    shared = v.nexusSettings || {};
    focus = v.nexusFocus || focus;
    tasks = Array.isArray(v.nexusTasks) ? v.nexusTasks : [];
    notes = String(v.nexusNotes || '');

    if (focus.running && focus.last) {
      focus.seconds = Math.max(0, focus.seconds - (Date.now() - focus.last) / 1000);
      focus.last = Date.now();
      if (!focus.seconds) focus.running = false;
    }

    appearance();
    background();
    clock();
    setInterval(clock, 1000);
    renderWidgets();
    prefs();
    $('customize').onclick = () => $('prefs').classList.add('open');
    $('prefs-close').onclick = () => $('prefs').classList.remove('open');
    $('search').onsubmit = e => {
      e.preventDefault();
      const q = $('query').value.trim();
      if (q) location.href = queryUrl(q);
    };
    $('quick-task').onsubmit = e => {
      e.preventDefault();
      const input = $('quick-task-input');
      addTask(input.value);
      input.value = '';
      input.focus();
    };

    $('engine').onclick = () => {
      const a = ['google', 'bing', 'duckduckgo', 'brave', 'ecosia', 'startpage'];
      const i = a.indexOf(c.searchEngine);
      c.searchEngine = a[(i + 1 + a.length) % a.length];
      $('p-engine').value = c.searchEngine;
      $('engine').textContent = c.searchEngine[0].toUpperCase();
      $('engine').title = `Search with ${c.searchEngine}`;
      set({ nexusNewtab: c });
    };
    $('engine').textContent = c.searchEngine[0].toUpperCase();
    $('engine').title = `Search with ${c.searchEngine}`;

    $('reset').onclick = () => {
      if (confirm('Reset new-tab workspace settings? Tasks and notes will be kept.')) {
        set({ nexusNewtab: D });
        location.reload();
      }
    };

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        $('query').focus();
        $('query').select();
      }
      if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) {
        e.preventDefault();
        $('query').focus();
      }
    });
  }

  const recheckAccount = async () => {
    const wasGuest = guestMode;
    await checkDigitBox(true);
    if (!initialized) return init();
    if (wasGuest !== guestMode) {
      appearance();
      background();
      clock();
      renderWidgets();
    }
  };
  chrome.runtime.onMessage.addListener(message => {
    if (message?.type !== 'nexus:digitbox-auth-changed') return;
    const wasGuest = guestMode;
    signedIn = !!message.signedIn;
    accountUser = signedIn ? (message.user || null) : null;
    guestMode = !(signedIn && hasPro(message.entitlements));
    document.body.classList.toggle('guest-mode', guestMode);
    paintAccountBanner();
    if (initialized && wasGuest !== guestMode) {
      appearance();
      background();
      clock();
      renderWidgets();
    } else if (initialized) {
      clock();
    }
  });
  window.addEventListener('focus', recheckAccount);
  setInterval(recheckAccount, 30 * 1000);
  init();
})();