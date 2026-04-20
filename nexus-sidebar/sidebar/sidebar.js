// ═══════════════════════════════════════════════════════════════
// NEXUS SIDEBAR — Complete Application JS
// Pinnable Nav (max 7) + ⋯ overflow drawer
// ═══════════════════════════════════════════════════════════════
'use strict';

// ─── ALL POSSIBLE PANELS ────────────────────────────────────────
const ALL_PANELS = [
  { id: 'dashboard',   label: 'Home',      icon: '⚡', alwaysAvailable: true },
  { id: 'todo',        label: 'Todo',       icon: '✅' },
  { id: 'notes',       label: 'Notes',      icon: '📝' },
  { id: 'calendar',    label: 'Calendar',   icon: '📅' },
  { id: 'pomodoro',    label: 'Focus',      icon: '🍅' },
  { id: 'bookmarks',   label: 'Bookmarks',  icon: '🔖' },
  { id: 'weather',     label: 'Weather',    icon: '🌤' },
  { id: 'clock',       label: 'Clock',      icon: '⏱' },
  { id: 'calculator',  label: 'Calc',       icon: '🧮' },
  { id: 'habits',      label: 'Habits',     icon: '🏃' },
  { id: 'password',    label: 'Password',   icon: '🔐' },
  { id: 'colorpicker', label: 'Colors',     icon: '🎨' },
  { id: 'converter',   label: 'Convert',    icon: '🔄' },
  { id: 'news',        label: 'News',       icon: '📡' },
];
const SETTINGS_PANEL = { id: 'settings', label: 'Settings', icon: '⚙️' };
const MAX_PINNED = 7;
const DEFAULT_PINNED = ['dashboard','todo','notes','pomodoro','calendar','bookmarks','weather'];
const POMO_RUNTIME_KEY = 'nexusPomoRuntime';

// ─── State ──────────────────────────────────────────────────────
let S = {
  settings: {},
  todos: [], notes: [], habits: [], bookmarks: [], calEvents: [], savedColors: [],
  pinnedPanels: [...DEFAULT_PINNED],
  currentPanel: 'dashboard',
  navDrawerOpen: false,
  // todo
  todoFilter: 'all', todoSort: 'created', todoPriority: 'medium', todoOptionsOpen: false,
  // notes
  currentNoteId: null, noteFolder: 'all',
  // calendar
  calDate: new Date(), calSelectedDate: new Date(), calView: 'month',
  // pomodoro
  pomoMode: 'work', pomoRunning: false, pomoInterval: null,
  pomoTimeLeft: 25*60, pomoSessions: 0, pomoDots: [],
  // stopwatch
  swRunning: false, swElapsed: 0, swInterval: null, swLaps: [],
  // timer
  timerRunning: false, timerRemaining: 0, timerTotal: 0, timerInterval: null,
  // clock
  analogInterval: null,
  worldClocks: ['America/New_York','Europe/London','Asia/Tokyo'],
  // calc
  calcExpr: '', calcResult: '0', calcHistory: [],
  // converter
  convType: 'length',
  // password
  pwdType: 'random', pwdHistory: [],
  // weather
  weatherData: null, weatherCity: '',
  // color
  savedColorsArr: [],
  // news
  newsItems: [],
};

const DEFAULTS = {
  theme:'dark', accentColor:'#6C63FF', fontFamily:'Outfit',
  fontSize:'medium', borderRadius:'rounded', animationSpeed:'normal',
  sidebarWidth:380, blurIntensity:12, bgOpacity:0.85,
  customBgUrl:'', customBgColor:'', showGradientOverlay:true,
  panelSpacing:'normal', iconStyle:'outlined', iconSize:'medium',
  showIconLabels:true, customCSS:'', shadowIntensity:'medium',
  glassStrength:0.15, noiseTexture:true, colorSaturation:100,
  brightnessMod:100, contrastMod:100, customFontUrl:'',
  themeSchedule:false, themeScheduleLight:'07:00', themeScheduleDark:'19:00',
  clockFormat:'12h', showSeconds:true, showDate:true,
  dateFormat:'MMM DD YYYY', showDayOfWeek:true, clockStyle:'digital',
  timezone:'local', showMilliseconds:false, blinkingSeparator:true, showWeekNumber:false,
  pomodoroWork:25, pomodoroShortBreak:5, pomodoroLongBreak:15,
  pomodoroSessionsBeforeLong:4, pomodoroAutoBreak:false, pomodoroAutoWork:false,
  pomodoroSound:'bell', focusModeEnabled:false,
  focusBlockedSites:['facebook.com','twitter.com','reddit.com','youtube.com'],
  dailyGoal:10, showProductivityScore:true, workHoursStart:'09:00', workHoursEnd:'17:00',
  taskPrioritiesEnabled:true, defaultPriority:'medium',
  weatherLocation:'auto', weatherUnit:'fahrenheit', weatherUpdateInterval:30,
  weatherForecastDays:5, windSpeedUnit:'mph', weatherApiKey:'',
  notificationsEnabled:true, notificationSound:'chime', notificationVolume:70,
  todoDueReminders:true, pomodoroNotifications:true, habitReminderTime:'20:00',
  dailySummaryNotification:false, notificationPosition:'top-right', soundTheme:'default',
  quickSites:[
    {name:'Gmail',url:'https://mail.google.com',icon:'📧'},
    {name:'Drive',url:'https://drive.google.com',icon:'📁'},
    {name:'Weather',url:'https://weather.com',icon:'⛅'},
    {name:'YouTube',url:'https://youtube.com',icon:'▶️'},
    {name:'Notion',url:'https://notion.so',icon:'📓'},
    {name:'Spotify',url:'https://open.spotify.com',icon:'🎵'},
    {name:'Twitter',url:'https://twitter.com',icon:'🐦'},
    {name:'Reddit',url:'https://reddit.com',icon:'🤖'},
  ],
  syncEnabled:false, dataRetentionDays:365, anonymousAnalytics:false,
  autoBackupInterval:'weekly', passwordProtect:false, localStorageOnly:true,
  performanceMode:false, hardwareAcceleration:true, lazyLoadWidgets:false,
  debugMode:false, betaFeatures:false, keyboardShortcuts:true,
  openOnNewTab:false, closeOnOutsideClick:false, autoHideSidebar:false,
  sidebarPosition:'right', startupPanel:'dashboard', showGreeting:true, greetingName:'',
  newsFeedUrls:[], customIconPack:'default', searchEngine:'google',
  quickNoteEnabled:true, draggableWidgets:true, showStatusBar:true, compactMode:false,
  totalFocusMinutes:0, totalTasksCompleted:0, currentStreak:0,
  pinnedPanels:[...DEFAULT_PINNED],
};

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
async function init() {
  await loadData();
  applyTheme();
  applyLayoutPreferences();
  buildNav();
  bindAll();
  openPanel(S.settings.startupPanel || 'dashboard');
  startDashClock();
  resumePomodoroIfNeeded();
  if (S.weatherData === null) loadWeather();
  setInterval(() => {
    if (S.currentPanel === 'dashboard') updateDashClock();
    if (S.currentPanel === 'clock') tickDigitalClock();
  }, 1000);
  console.log('🚀 Nexus ready');
}

// ─── Data load/save ─────────────────────────────────────────────
async function loadData() {
  try {
    const d = await chrome.storage.local.get(['nexusSettings','nexusTodos','nexusNotes','nexusHabits','nexusBookmarks','nexusEvents','nexusSavedColors']);
    S.settings    = { ...DEFAULTS, ...(d.nexusSettings || {}) };
    S.todos       = d.nexusTodos    || [];
    S.notes       = d.nexusNotes    || [];
    S.habits      = d.nexusHabits   || defaultHabits();
    S.bookmarks   = d.nexusBookmarks|| defaultBookmarks();
    S.calEvents   = d.nexusEvents   || [];
    S.savedColorsArr = d.nexusSavedColors || [];
  } catch {
    S.settings  = { ...DEFAULTS };
    S.todos     = jl('nexusTodos') || [];
    S.notes     = jl('nexusNotes') || [];
    S.habits    = jl('nexusHabits') || defaultHabits();
    S.bookmarks = jl('nexusBookmarks') || defaultBookmarks();
    S.calEvents = jl('nexusEvents') || [];
    S.savedColorsArr = jl('nexusSavedColors') || [];
  }
  S.pinnedPanels = S.settings.pinnedPanels || [...DEFAULT_PINNED];
  await loadPomoRuntime();
}

async function save(key, val) {
  try { await chrome.storage.local.set({ [key]: val }); }
  catch { localStorage.setItem(key, JSON.stringify(val)); }
}
function jl(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }

function saveSetting(key, val) {
  S.settings[key] = val;
  save('nexusSettings', S.settings);
}

function applyLayoutPreferences() {
  document.documentElement.setAttribute('data-sidebar-position', S.settings.sidebarPosition === 'left' ? 'left' : 'right');
}

async function savePomoRuntime() {
  const runtime = {
    mode: S.pomoMode,
    running: S.pomoRunning,
    timeLeft: S.pomoTimeLeft,
    sessions: S.pomoSessions,
    lastUpdated: Date.now()
  };
  try { await chrome.storage.local.set({ [POMO_RUNTIME_KEY]: runtime }); }
  catch { localStorage.setItem(POMO_RUNTIME_KEY, JSON.stringify(runtime)); }
}

async function loadPomoRuntime() {
  let runtime = null;
  try {
    const d = await chrome.storage.local.get([POMO_RUNTIME_KEY]);
    runtime = d[POMO_RUNTIME_KEY] || null;
  } catch {
    runtime = jl(POMO_RUNTIME_KEY);
  }
  if (!runtime) {
    S.pomoMode = 'work';
    S.pomoRunning = false;
    S.pomoTimeLeft = (S.settings.pomodoroWork || 25) * 60;
    return;
  }
  S.pomoMode = runtime.mode || 'work';
  S.pomoSessions = Number.isFinite(runtime.sessions) ? runtime.sessions : 0;
  S.pomoTimeLeft = Number.isFinite(runtime.timeLeft) ? runtime.timeLeft : pomoSeconds();
  if (runtime.running && runtime.lastUpdated) {
    const elapsed = Math.max(0, Math.floor((Date.now() - runtime.lastUpdated) / 1000));
    S.pomoTimeLeft = Math.max(0, S.pomoTimeLeft - elapsed);
    S.pomoRunning = S.pomoTimeLeft > 0;
  } else {
    S.pomoRunning = false;
  }
}

function resumePomodoroIfNeeded() {
  qs('#pomoTime').textContent = secToMS(S.pomoTimeLeft);
  qs('#pomoSessionLabel').textContent = ({work:'Work Session',short:'Short Break',long:'Long Break'})[S.pomoMode];
  qsa('.pomo-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === S.pomoMode));
  renderPomoRing();
  if (S.pomoRunning) {
    qs('#pomoStart').innerHTML = '⏸ Pause';
    S.pomoInterval = setInterval(tickPomo, 1000);
    savePomoRuntime();
  } else {
    qs('#pomoStart').innerHTML = '▶ Start';
  }
}

// ═══════════════════════════════════════════════════════════════
// THEME / APPLY
// ═══════════════════════════════════════════════════════════════
function applyTheme() {
  const s = S.settings;
  const root = document.documentElement;
  root.setAttribute('data-theme', s.theme);
  root.style.setProperty('--accent', s.accentColor);
  root.style.setProperty('--accent-glow', hexA(s.accentColor, 0.3));
  root.style.setProperty('--accent-light', lighten(s.accentColor, 20));
  root.style.setProperty('--accent-dark', darken(s.accentColor, 20));
  root.style.setProperty('--font-main', `'${s.fontFamily}', sans-serif`);
  root.style.setProperty('--glass-blur', `${s.blurIntensity}px`);
  const rMap = { sharp:{sm:'3px',md:'6px',lg:'10px',xl:'16px'}, rounded:{sm:'6px',md:'10px',lg:'16px',xl:'24px'}, pill:{sm:'20px',md:'24px',lg:'32px',xl:'40px'} };
  const r = rMap[s.borderRadius] || rMap.rounded;
  Object.entries(r).forEach(([k,v]) => root.style.setProperty(`--radius-${k}`, v));
  root.style.fontSize = ({small:'13px',medium:'14px',large:'15px',xl:'16px'})[s.fontSize]||'14px';
  const spd = ({none:'0ms',slow:'400ms',normal:'200ms',fast:'100ms'})[s.animationSpeed]||'200ms';
  root.style.setProperty('--transition', `${spd} cubic-bezier(0.4,0,0.2,1)`);
  if (s.customBgUrl) {
    document.getElementById('nexusBg').style.cssText += `background-image:url(${s.customBgUrl});background-size:cover`;
  }
  if (s.customCSS) {
    let styleEl = document.getElementById('nexusCustomCSS');
    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'nexusCustomCSS'; document.head.appendChild(styleEl); }
    styleEl.textContent = s.customCSS;
  }
  if (s.customFontUrl) {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = s.customFontUrl;
    document.head.appendChild(link);
  }
  applyLayoutPreferences();
}

// ═══════════════════════════════════════════════════════════════
// ★ PINNABLE NAVIGATION SYSTEM ★
// ═══════════════════════════════════════════════════════════════
function buildNav() {
  const rail = document.getElementById('nexusNav');
  rail.innerHTML = `
    <div class="nav-logo" id="navLogo" title="Nexus">
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="url(#lg)"/>
        <path d="M8 10h6l4 12 4-12h6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="16" cy="22" r="2" fill="white"/>
        <defs><linearGradient id="lg" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#6C63FF"/><stop offset="1" stop-color="#FF6B9D"/></linearGradient></defs>
      </svg>
    </div>
    <div class="nav-items" id="navItems"></div>
    <div class="nav-bottom">
      <button class="nav-item" id="navMoreBtn" title="More panels">
        <span class="nav-icon">⋯</span>
        <span class="nav-label">More</span>
      </button>
      <button class="nav-item" id="navSettingsBtn" title="Settings">
        <span class="nav-icon">⚙️</span>
        <span class="nav-label">Settings</span>
      </button>
    </div>
  `;
  renderPinnedNav();
  document.getElementById('navMoreBtn').addEventListener('click', toggleNavDrawer);
  document.getElementById('navSettingsBtn').addEventListener('click', () => openPanel('settings'));
  document.getElementById('navLogo').addEventListener('click', () => openPanel('dashboard'));
}

function renderPinnedNav() {
  const container = document.getElementById('navItems');
  const pinned = S.pinnedPanels.slice(0, MAX_PINNED);
  container.innerHTML = pinned.map(id => {
    const p = ALL_PANELS.find(x => x.id === id);
    if (!p) return '';
    const badge = id === 'todo' ? `<span class="nav-badge" id="todoBadge" style="display:none">0</span>` : '';
    return `
      <button class="nav-item ${S.currentPanel === id ? 'active' : ''}" data-panel="${id}" title="${p.label}">
        <span class="nav-icon">${p.icon}</span>
        <span class="nav-label">${p.label}</span>
        ${badge}
      </button>`;
  }).join('');
  container.querySelectorAll('.nav-item[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => openPanel(btn.dataset.panel));
  });
  updateTodoBadge();

  // Update more-btn badge if current panel is in overflow
  const overflow = ALL_PANELS.filter(p => !pinned.includes(p.id));
  const moreBtn = document.getElementById('navMoreBtn');
  const isOverflowActive = overflow.some(p => p.id === S.currentPanel);
  if (moreBtn) moreBtn.classList.toggle('active', isOverflowActive);
  if (document.getElementById('navSettingsBtn')) {
    document.getElementById('navSettingsBtn').classList.toggle('active', S.currentPanel === 'settings');
  }
}

// ─── Nav Drawer (⋯ overflow) ─────────────────────────────────────
function toggleNavDrawer() {
  S.navDrawerOpen = !S.navDrawerOpen;
  let drawer = document.getElementById('navDrawer');
  if (!S.navDrawerOpen) {
    if (drawer) drawer.remove();
    return;
  }
  drawer = document.createElement('div');
  drawer.id = 'navDrawer';
  drawer.className = 'nav-drawer';
  drawer.innerHTML = buildDrawerHTML();
  document.getElementById('nexusApp').appendChild(drawer);
  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', closeDrawerOutside);
  }, 10);
  drawer.querySelectorAll('.drawer-panel-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openPanel(btn.dataset.panel);
      closeNavDrawer();
    });
  });
  drawer.querySelectorAll('.drawer-pin-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      togglePin(btn.dataset.panel);
    });
  });
}

function buildDrawerHTML() {
  const pinned = S.pinnedPanels.slice(0, MAX_PINNED);
  const unpinned = ALL_PANELS.filter(p => !pinned.includes(p.id));
  const pinCount = pinned.length;

  const makeRow = (p, isPinned) => `
    <div class="drawer-row ${S.currentPanel === p.id ? 'drawer-row-active' : ''}">
      <button class="drawer-panel-btn" data-panel="${p.id}">
        <span class="drawer-icon">${p.icon}</span>
        <span class="drawer-label">${p.label}</span>
      </button>
      <button class="drawer-pin-btn ${isPinned ? 'pinned' : ''}" data-panel="${p.id}" title="${isPinned ? 'Unpin from sidebar' : pinCount >= MAX_PINNED ? 'Sidebar full (max 7)' : 'Pin to sidebar'}">
        ${isPinned ? '📌' : pinCount >= MAX_PINNED ? '🔒' : '📍'}
      </button>
    </div>`;

  const pinnedRows  = ALL_PANELS.filter(p => pinned.includes(p.id)).map(p => makeRow(p, true)).join('');
  const overflowRows = unpinned.map(p => makeRow(p, false)).join('');

  return `
    <div class="drawer-header">
      <span class="drawer-title">Panels</span>
      <span class="drawer-count">${pinCount}/${MAX_PINNED} pinned</span>
      <button class="drawer-close" id="drawerClose">✕</button>
    </div>
    <div class="drawer-section-label">📌 Pinned to sidebar</div>
    <div class="drawer-list">${pinnedRows || '<div class="drawer-empty">Nothing pinned yet</div>'}</div>
    <div class="drawer-section-label">➕ More panels</div>
    <div class="drawer-list">${overflowRows || '<div class="drawer-empty">All panels pinned!</div>'}</div>
    <div class="drawer-hint">Drag panels to reorder • Max ${MAX_PINNED} pinned</div>
  `;
}

function togglePin(panelId) {
  const pinned = [...S.pinnedPanels];
  const idx = pinned.indexOf(panelId);
  if (idx !== -1) {
    // Unpin — but don't remove if it's the last one or dashboard
    if (panelId === 'dashboard') { showToast('Dashboard cannot be unpinned', 'info'); return; }
    if (pinned.length <= 1) { showToast('At least one panel must stay pinned', 'info'); return; }
    pinned.splice(idx, 1);
    showToast(`${ALL_PANELS.find(p=>p.id===panelId)?.label} unpinned`, 'info');
  } else {
    if (pinned.length >= MAX_PINNED) { showToast(`Sidebar full! Unpin something first (max ${MAX_PINNED})`, 'error'); return; }
    pinned.push(panelId);
    showToast(`${ALL_PANELS.find(p=>p.id===panelId)?.label} pinned to sidebar ✓`, 'success');
  }
  S.pinnedPanels = pinned;
  saveSetting('pinnedPanels', pinned);
  renderPinnedNav();
  // Rebuild drawer in place
  const drawer = document.getElementById('navDrawer');
  if (drawer) {
    drawer.innerHTML = buildDrawerHTML();
    drawer.querySelectorAll('.drawer-panel-btn').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); openPanel(btn.dataset.panel); closeNavDrawer(); });
    });
    drawer.querySelectorAll('.drawer-pin-btn').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); togglePin(btn.dataset.panel); });
    });
    drawer.querySelector('#drawerClose')?.addEventListener('click', closeNavDrawer);
  }
}

function closeNavDrawer() {
  S.navDrawerOpen = false;
  document.getElementById('navDrawer')?.remove();
  document.removeEventListener('click', closeDrawerOutside);
}

function closeDrawerOutside(e) {
  const drawer = document.getElementById('navDrawer');
  const moreBtn = document.getElementById('navMoreBtn');
  if (drawer && !drawer.contains(e.target) && !moreBtn?.contains(e.target)) {
    closeNavDrawer();
  }
}

// ─── Open Panel ──────────────────────────────────────────────────
function openPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(`panel${cap(id)}`);
  if (panel) panel.classList.add('active');
  S.currentPanel = id;
  renderPinnedNav();
  updateHeader(id);
  onOpen(id);
  closeNavDrawer();
}

function updateHeader(id) {
  const map = {
    dashboard:   ['⚡ Dashboard',   ''],
    todo:        ['✅ Todo',         `${S.todos.filter(t=>!t.completed).length} tasks left`],
    notes:       ['📝 Notes',        `${S.notes.length} saved`],
    calendar:    ['📅 Calendar',     fmtDate(new Date())],
    pomodoro:    ['🍅 Pomodoro',     'Stay focused'],
    bookmarks:   ['🔖 Bookmarks',    `${S.bookmarks.length} saved`],
    weather:     ['🌤 Weather',      S.weatherData?.city || ''],
    clock:       ['⏱ Clock',         ''],
    calculator:  ['🧮 Calculator',   ''],
    habits:      ['🏃 Habits',       `${doneHabitsToday()}/${S.habits.length} today`],
    password:    ['🔐 Password',     ''],
    colorpicker: ['🎨 Color Picker', ''],
    converter:   ['🔄 Converter',    ''],
    news:        ['📡 News',         ''],
    settings:    ['⚙️ Settings',     '110+ options'],
  };
  const [title, sub] = map[id] || [cap(id), ''];
  document.getElementById('panelTitle').textContent = title;
  document.getElementById('panelSubtitle').textContent = sub;
}

function onOpen(id) {
  switch(id) {
    case 'dashboard':  renderDashboard(); break;
    case 'todo':       renderTodos(); break;
    case 'notes':      renderNotesList(); break;
    case 'calendar':   renderCalendar(); break;
    case 'pomodoro':   renderPomoTasks(); renderPomoStats(); break;
    case 'bookmarks':  renderBookmarks(); break;
    case 'weather':    if (!S.weatherData) loadWeather(); break;
    case 'clock':      startAnalogClock(); tickDigitalClock(); break;
    case 'calculator': if (!document.querySelector('.calc-btn')) buildCalc(); break;
    case 'habits':     renderHabits(); break;
    case 'password':   generatePassword(); break;
    case 'colorpicker':renderColorPicker(); break;
    case 'converter':  setupConverter('length'); break;
    case 'news':       if (!S.newsItems.length) loadNews(); break;
    case 'settings':   renderSettings(); break;
  }
}

// ═══════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════════════
function bindAll() {
  // Header buttons
  document.getElementById('btnQuickNote').addEventListener('click', openQuickNote);
  document.getElementById('btnNotifications').addEventListener('click', () => showToast('No new notifications 🔔', 'info'));
  document.getElementById('globalSearch').addEventListener('focus', openSearchOverlay);
  document.getElementById('globalSearch').addEventListener('click', openSearchOverlay);
  document.getElementById('searchBar').addEventListener('click', openSearchOverlay);

  // Search overlay
  qs('#closeSearchOverlay').addEventListener('click', closeSearchOverlay);
  qs('#globalSearchModal').addEventListener('input', e => doSearch(e.target.value));
  qs('#globalSearchModal').addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const first = qs('#searchResults .search-result-item');
    if (first) {
      first.click();
      return;
    }
    const q = qs('#globalSearchModal').value.trim();
    if (q) {
      openWebSearch(q);
      closeSearchOverlay();
    }
  });
  qs('#searchOverlay').addEventListener('click', e => { if (e.target.id === 'searchOverlay') closeSearchOverlay(); });

  // Quick note
  qs('#closeQuickNote').addEventListener('click', () => qs('#quickNoteOverlay').style.display='none');
  qs('#saveQuickNote').addEventListener('click', saveQuickNote);
  qs('#copyQuickNote').addEventListener('click', () => { navigator.clipboard.writeText(qs('#quickNoteText').value); showToast('Copied!','success'); });

  // TODO
  qs('#newTodoInput').addEventListener('keydown', e => e.key==='Enter' && addTodo());
  qs('#addTodoBtn').addEventListener('click', addTodo);
  qs('#quickAddTodo').addEventListener('keydown', e => e.key==='Enter' && quickAddTodo());
  qs('#quickAddTodoBtn').addEventListener('click', quickAddTodo);
  qs('#toggleTodoOpts').addEventListener('click', toggleTodoOpts);
  qs('#clearCompletedTodos').addEventListener('click', clearDone);
  qs('#todoSort').addEventListener('change', e => { S.todoSort = e.target.value; renderTodos(); });
  qsa('.filter-btn').forEach(b => b.addEventListener('click', () => { qsa('.filter-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active'); S.todoFilter=b.dataset.filter; renderTodos(); }));
  qsa('.prio-btn').forEach(b => b.addEventListener('click', () => { qsa('.prio-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active'); S.todoPriority=b.dataset.p; }));

  // Notes
  qs('#newNoteBtn').addEventListener('click', newNote);
  qs('#notesSearchInput').addEventListener('input', e => renderNotesList(e.target.value));
  qs('#noteContentArea').addEventListener('input', () => { noteWordCount(); autoSaveNote(); });
  qs('#noteTitleInput').addEventListener('input', autoSaveNote);
  qsa('.fmt-btn').forEach(b => b.addEventListener('click', () => { const cmd=b.dataset.cmd; if(cmd){ if(cmd.startsWith('formatBlock:')) document.execCommand('formatBlock',false,cmd.split(':')[1]); else document.execCommand(cmd,false,null); qs('#noteContentArea').focus(); } }));
  qs('#deleteNoteBtn').addEventListener('click', deleteNote);
  qs('#pinNoteBtn').addEventListener('click', pinNote);
  qs('#shareNoteBtn').addEventListener('click', exportNote);
  qsa('.folder-btn').forEach(b => { if(b.dataset.folder) b.addEventListener('click', () => { qsa('.folder-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active'); S.noteFolder=b.dataset.folder; renderNotesList(); }); });
  qs('#insertCodeBlock').addEventListener('click', () => document.execCommand('insertHTML',false,'<pre><code>code here</code></pre>'));
  qs('#insertCheckbox').addEventListener('click', () => document.execCommand('insertHTML',false,'☐ '));
  qs('#insertLink').addEventListener('click', () => { const url=prompt('URL:'); if(url) document.execCommand('createLink',false,url); });

  // Calendar
  qs('#calPrev').addEventListener('click', () => navCal(-1));
  qs('#calNext').addEventListener('click', () => navCal(1));
  qs('#calToday').addEventListener('click', () => { S.calDate=new Date(); S.calSelectedDate=new Date(); renderCalendar(); });
  qsa('.cal-view-btn').forEach(b => b.addEventListener('click', () => { qsa('.cal-view-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active'); S.calView=b.dataset.view; renderCalendar(); }));
  qs('#addEventBtn').addEventListener('click', openEventModal);
  qs('#saveEventBtn').addEventListener('click', saveEvent);
  qs('#cancelEventBtn').addEventListener('click', () => qs('#addEventModal').style.display='none');

  // Pomodoro
  qs('#pomoStart').addEventListener('click', togglePomo);
  qs('#pomoReset').addEventListener('click', resetPomo);
  qs('#pomoSkip').addEventListener('click', skipPomo);
  qsa('.pomo-tab').forEach(t => t.addEventListener('click', () => { qsa('.pomo-tab').forEach(x=>x.classList.remove('active')); t.classList.add('active'); S.pomoMode=t.dataset.mode; resetPomo(); savePomoRuntime(); }));

  // Bookmarks
  qs('#addBookmarkBtn').addEventListener('click', addBookmark);
  qs('#bmSearch').addEventListener('input', e => renderBookmarks(e.target.value));
  qsa('.bm-view').forEach(b => b.addEventListener('click', () => { qsa('.bm-view').forEach(x=>x.classList.remove('active')); b.classList.add('active'); renderBookmarks(); }));

  // Weather
  qs('#weatherSearchBtn').addEventListener('click', () => loadWeather(qs('#weatherSearchInput').value));
  qs('#weatherSearchInput').addEventListener('keydown', e => e.key==='Enter' && loadWeather(e.target.value));
  qs('#weatherGeoBtn').addEventListener('click', geoWeather);
  qs('#weatherRefreshBtn').addEventListener('click', () => loadWeather(S.weatherCity||''));

  // Clock tabs
  qsa('.clock-tab').forEach(t => t.addEventListener('click', () => {
    qsa('.clock-tab').forEach(x=>x.classList.remove('active'));
    qsa('.clock-view').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    qs(`#clock${cap(t.dataset.tab)}`)?.classList.add('active');
    if(t.dataset.tab==='analog') startAnalogClock();
    if(t.dataset.tab==='world') renderWorldClocks();
  }));
  qs('#swStartStop').addEventListener('click', toggleSW);
  qs('#swLap').addEventListener('click', lapSW);
  qs('#swReset').addEventListener('click', resetSW);
  qs('#timerStartStop').addEventListener('click', toggleTimer);
  qs('#timerReset').addEventListener('click', resetTimer);
  qsa('.timer-preset').forEach(b => b.addEventListener('click', () => timerPreset(+b.dataset.sec)));
  qs('#addWorldClockBtn').addEventListener('click', addWorldClock);

  // Habits
  qs('#addHabitBtn').addEventListener('click', () => qs('#addHabitModal').style.display='flex');
  qs('#saveHabitBtn').addEventListener('click', saveHabit);
  qs('#cancelHabitBtn').addEventListener('click', () => qs('#addHabitModal').style.display='none');

  // Password
  qs('#generatePwdBtn').addEventListener('click', generatePassword);
  qs('#pwdGenBtn').addEventListener('click', generatePassword);
  qs('#pwdCopyBtn').addEventListener('click', copyPwd);
  qs('#pwdLength').addEventListener('input', e => { qs('#pwdLengthVal').textContent=e.target.value; generatePassword(); });
  ['pwdUpper','pwdLower','pwdNumbers','pwdSymbols','pwdExcludeSimilar','pwdExcludeAmbiguous'].forEach(id => qs('#'+id)?.addEventListener('change', generatePassword));
  qsa('.type-btn').forEach(b => b.addEventListener('click', () => { qsa('.type-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active'); S.pwdType=b.dataset.type; qs('#passphraseOpts').style.display=b.dataset.type==='passphrase'?'flex':'none'; generatePassword(); }));
  qs('#clearPwdHistory').addEventListener('click', () => { S.pwdHistory=[]; renderPwdHistory(); });
  qs('#wordCount')?.addEventListener('input', e => { qs('#wordCountVal').textContent=e.target.value; generatePassword(); });

  // Color
  qs('#cpColorInput').addEventListener('input', e => updateColor(e.target.value));
  qs('#cpHex').addEventListener('input', e => { if(/^#[0-9a-f]{6}$/i.test(e.target.value)) updateColor(e.target.value); });
  qs('#cpSaveColor').addEventListener('click', saveColor);
  qs('#cpGetComplementary').addEventListener('click', ()=>showHarmonies('comp'));
  qs('#cpGetTriadic').addEventListener('click', ()=>showHarmonies('tri'));
  qs('#cpGetAnalogous').addEventListener('click', ()=>showHarmonies('ana'));
  qs('#cpGetShades').addEventListener('click', ()=>showHarmonies('shades'));
  qs('#ccBg').addEventListener('input', checkContrast);
  qs('#ccFg').addEventListener('input', checkContrast);

  // Converter
  qsa('.conv-tab').forEach(t => t.addEventListener('click', () => { qsa('.conv-tab').forEach(x=>x.classList.remove('active')); t.classList.add('active'); setupConverter(t.dataset.type); }));
  qs('#convFrom').addEventListener('input', doConvert);
  qs('#convFromUnit').addEventListener('change', doConvert);
  qs('#convToUnit').addEventListener('change', doConvert);
  qs('#convSwap').addEventListener('click', swapConvert);

  // News
  qs('#newsRefreshBtn').addEventListener('click', loadNews);
  qsa('.news-cat').forEach(b => b.addEventListener('click', () => { qsa('.news-cat').forEach(x=>x.classList.remove('active')); b.classList.add('active'); }));

  // Quick sites edit
  qs('#editQuickSites').addEventListener('click', editQuickSites);

  // Focus mode
  qs('#exitFocusMode').addEventListener('click', exitFocus);

  // Global keys
  document.addEventListener('keydown', globalKeys);

  // Close modals on overlay click
  qsa('.modal-overlay').forEach(m => m.addEventListener('click', e => { if(e.target===m) m.style.display='none'; }));

  // Event color options
  buildColorOptions('eventColors');
  buildColorOptions('habitColors');
}

function globalKeys(e) {
  if ((e.ctrlKey||e.metaKey) && e.key==='k') { e.preventDefault(); openSearchOverlay(); }
  if (e.key==='Escape') { closeSearchOverlay(); closeNavDrawer(); qs('#quickNoteOverlay').style.display='none'; qsa('.modal-overlay').forEach(m=>m.style.display='none'); }
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
let dashClockInterval = null;
function startDashClock() {
  updateDashClock();
  dashClockInterval = setInterval(updateDashClock, 1000);
}
function updateDashClock() {
  const now = new Date();
  const fmt = S.settings.clockFormat === '12h';
  let h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (fmt) h = h % 12 || 12;
  const timeStr = `${pad(h)}:${pad(m)}${S.settings.showSeconds ? ':'+pad(s) : ''}`;
  const el = qs('#dcTime');
  if (el) el.textContent = timeStr + (fmt ? ` ${ampm}` : '');
  const dateEl = qs('#dcDate');
  if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', {weekday:'long',month:'long',day:'numeric',year:'numeric'});
}

function renderDashboard() {
  updateDashClock();
  const hour = new Date().getHours();
  const greeting = hour<12?'☀️ Good morning':hour<17?'🌤 Good afternoon':hour<21?'🌙 Good evening':'🌟 Good night';
  const name = S.settings.greetingName ? `, ${S.settings.greetingName}` : '';
  const gmEl = qs('#greetingMsg'); if (gmEl) gmEl.textContent = `${greeting}${name}!`;
  const gdEl = qs('#greetingDate'); if (gdEl) gdEl.textContent = new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  const pending = S.todos.filter(t=>!t.completed).length;
  const snEl = qs('#statTasksNum'); if(snEl) snEl.textContent = pending;
  const sfEl = qs('#statFocusNum'); if(sfEl) sfEl.textContent = S.settings.totalFocusMinutes||0;
  const ssEl = qs('#statStreakNum'); if(ssEl) ssEl.textContent = bestStreak();
  renderDashTodos();
  renderQuickSites();
  renderWeekChart();
  updateDashMinis();
}

function renderDashTodos() {
  const el = qs('#dashTodoList'); if(!el) return;
  const top5 = S.todos.filter(t=>!t.completed).slice(0,5);
  if (!top5.length) { el.innerHTML='<div class="empty-state">No tasks yet — add one below! ✨</div>'; return; }
  el.innerHTML = top5.map(t => `
    <div class="todo-item ${t.completed?'completed':''}">
      <div class="todo-check" onclick="toggleTodo(${t.id})">${t.completed?'✓':''}</div>
      <div class="todo-body"><div class="todo-text">${esc(t.text)}</div></div>
      <div class="todo-prio-dot prio-${t.priority||'medium'}"></div>
    </div>`).join('');
}

function renderQuickSites() {
  const el = qs('#quickSiteGrid'); if(!el) return;
  const sites = S.settings.quickSites || [];
  el.innerHTML = sites.slice(0,8).map((s,i)=>`
    <a href="${esc(s.url)}" target="_blank" class="quick-site" title="${esc(s.name)}">
      <span class="qs-icon">${s.icon||'🌐'}</span>
      <span class="qs-name">${esc(s.name)}</span>
    </a>`).join('');
}

function renderWeekChart() {
  const el = qs('#weekChart'); if(!el) return;
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today = new Date().getDay();
  const counts = days.map((_,i) => {
    const d = new Date(); d.setDate(d.getDate()-(today-i));
    const ds = d.toDateString();
    return S.todos.filter(t => t.completed && new Date(t.completedAt||0).toDateString()===ds).length;
  });
  const max = Math.max(...counts, 1);
  el.innerHTML = days.map((d,i)=>`
    <div class="week-bar ${i===today?'today':''}">
      <div class="week-bar-fill" style="height:${Math.max(3,counts[i]/max*50)}px"></div>
      <span class="week-bar-label">${d[0]}</span>
    </div>`).join('');
}

function updateDashMinis() {
  if (S.weatherData) {
    const wIcon = qs('#dashWeatherIcon'); if(wIcon) wIcon.textContent = S.weatherData.icon||'🌤';
    const wTemp = qs('#dashTemp'); if(wTemp) wTemp.textContent = S.weatherData.temp + '°';
    const wDesc = qs('#dashWeatherDesc'); if(wDesc) wDesc.textContent = S.weatherData.description||'';
  }
  const habEl = qs('#dashHabitVal'); if(habEl) habEl.textContent = `${doneHabitsToday()}/${S.habits.length}`;
  const dots = []; for(let i=0;i<4;i++) dots.push(i<S.pomoSessions%4?'●':'○');
  const dotsEl = qs('#dashPomoDots'); if(dotsEl) dotsEl.textContent = dots.join('');
  const dashMiniCards = qsa('.dash-mini-card');
  dashMiniCards.forEach(c => { c.style.cursor='pointer'; c.addEventListener('click', () => { const map={'dashWeatherMini':'weather','dashPomodoroMini':'pomodoro','dashHabitMini':'habits'}; openPanel(map[c.id]||'dashboard'); }, {once:true}); });
}

// ═══════════════════════════════════════════════════════════════
// TODO
// ═══════════════════════════════════════════════════════════════
function addTodo() {
  const inp = qs('#newTodoInput');
  const text = inp.value.trim();
  if (!text) return;
  const todo = {
    id: Date.now(),
    text,
    completed: false,
    priority: S.todoPriority || 'medium',
    dueDate: qs('#todoDueDate').value ? new Date(qs('#todoDueDate').value).getTime() : null,
    category: qs('#todoCategoryInput').value.trim() || '',
    notes: qs('#todoNotesInput').value.trim() || '',
    createdAt: Date.now(),
    completedAt: null,
  };
  S.todos.unshift(todo);
  save('nexusTodos', S.todos);
  inp.value=''; qs('#todoDueDate').value=''; qs('#todoCategoryInput').value=''; qs('#todoNotesInput').value='';
  renderTodos();
  updateTodoBadge();
  showToast('Task added ✅','success');
}

function quickAddTodo() {
  const inp = qs('#quickAddTodo');
  const text = inp.value.trim(); if(!text) return;
  S.todos.unshift({ id:Date.now(), text, completed:false, priority:'medium', createdAt:Date.now() });
  save('nexusTodos', S.todos);
  inp.value='';
  renderDashTodos();
  updateTodoBadge();
  showToast('Task added ✅','success');
}

window.toggleTodo = function(id) {
  const t = S.todos.find(x=>x.id===id); if(!t) return;
  t.completed = !t.completed;
  t.completedAt = t.completed ? Date.now() : null;
  if (t.completed) { S.settings.totalTasksCompleted = (S.settings.totalTasksCompleted||0)+1; save('nexusSettings', S.settings); }
  save('nexusTodos', S.todos);
  renderTodos(); renderDashTodos(); updateTodoBadge();
};

window.deleteTodo = function(id) {
  S.todos = S.todos.filter(t=>t.id!==id);
  save('nexusTodos', S.todos);
  renderTodos(); updateTodoBadge();
};

function clearDone() { S.todos=S.todos.filter(t=>!t.completed); save('nexusTodos',S.todos); renderTodos(); updateTodoBadge(); showToast('Completed tasks cleared','info'); }

function toggleTodoOpts() {
  S.todoOptionsOpen = !S.todoOptionsOpen;
  qs('#addTodoOptions').classList.toggle('visible', S.todoOptionsOpen);
  qs('#toggleTodoOpts').textContent = S.todoOptionsOpen ? '− Less options' : '+ More options';
}

function renderTodos() {
  let todos = [...S.todos];
  if (S.todoFilter==='active') todos = todos.filter(t=>!t.completed);
  else if (S.todoFilter==='completed') todos = todos.filter(t=>t.completed);
  else if (S.todoFilter==='priority') todos = todos.filter(t=>!t.completed && (t.priority==='high'||t.priority==='critical'));
  switch(S.todoSort) {
    case 'due': todos.sort((a,b)=>(a.dueDate||Infinity)-(b.dueDate||Infinity)); break;
    case 'priority': const po={critical:0,high:1,medium:2,low:3}; todos.sort((a,b)=>(po[a.priority]||2)-(po[b.priority]||2)); break;
    case 'alpha': todos.sort((a,b)=>a.text.localeCompare(b.text)); break;
    default: todos.sort((a,b)=>b.createdAt-a.createdAt);
  }
  const el = qs('#todoList'); if(!el) return;
  if (!todos.length) { el.innerHTML='<div class="empty-state">Nothing here! 🎉</div>'; }
  else el.innerHTML = todos.map(t => todoItemHTML(t)).join('');
  const done = S.todos.filter(t=>t.completed).length;
  const total = S.todos.length;
  const pct = total ? Math.round(done/total*100) : 0;
  const pf = qs('#todoProgressFill'); if(pf) pf.style.width=pct+'%';
  const pl = qs('#todoProgressLabel'); if(pl) pl.textContent=`${done} / ${total} completed`;
  updateTodoBadge();
}

function todoItemHTML(t) {
  const overdue = t.dueDate && !t.completed && t.dueDate < Date.now();
  return `<div class="todo-item ${t.completed?'completed':''}" data-id="${t.id}">
    <div class="todo-check" onclick="toggleTodo(${t.id})">${t.completed?'✓':''}</div>
    <div class="todo-body">
      <div class="todo-text">${esc(t.text)}</div>
      <div class="todo-meta">
        <span class="todo-prio-dot prio-${t.priority||'medium'}"></span>
        ${t.dueDate?`<span class="todo-due${overdue?' overdue':''}">📅 ${fmtDue(t.dueDate)}</span>`:''}
        ${t.category?`<span class="todo-category">${esc(t.category)}</span>`:''}
        ${t.notes?`<span class="todo-due" title="${esc(t.notes)}">💬</span>`:''}
      </div>
    </div>
    <div class="todo-actions-inline">
      <button class="todo-action-btn" onclick="deleteTodo(${t.id})" title="Delete">🗑</button>
    </div>
  </div>`;
}

function updateTodoBadge() {
  const count = S.todos.filter(t=>!t.completed).length;
  const badge = qs('#todoBadge');
  if (badge) { badge.style.display = count>0?'flex':'none'; badge.textContent = count>99?'99+':count; }
  try { chrome.runtime.sendMessage({ action:'setBadge', text: count>0?String(count):'', color:'#6C63FF' }); } catch{}
}

// ═══════════════════════════════════════════════════════════════
// NOTES
// ═══════════════════════════════════════════════════════════════
function newNote() {
  const note = { id:Date.now(), title:'Untitled Note', content:'', createdAt:Date.now(), updatedAt:Date.now(), color:'#6C63FF', pinned:false, folder:'inbox' };
  S.notes.unshift(note);
  save('nexusNotes', S.notes);
  S.currentNoteId = note.id;
  renderNotesList();
  loadNoteInEditor(note);
  qs('#noteTitleInput').focus();
}

function renderNotesList(search='') {
  let notes = [...S.notes];
  if (S.noteFolder==='pinned') notes = notes.filter(n=>n.pinned);
  else if (S.noteFolder!=='all') notes = notes.filter(n=>n.folder===S.noteFolder);
  if (search) notes = notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()));
  notes.sort((a,b) => (b.pinned?1:0)-(a.pinned?1:0) || b.updatedAt-a.updatedAt);
  const el = qs('#notesList'); if(!el) return;
  if (!notes.length) { el.innerHTML='<div class="empty-state" style="margin:12px">No notes found</div>'; return; }
  el.innerHTML = notes.map(n => `
    <div class="note-card ${n.id===S.currentNoteId?'active':''}" onclick="openNote(${n.id})" data-id="${n.id}">
      ${n.pinned?'<span style="font-size:10px">📌</span>':''}
      <div class="nc-title">${esc(n.title)}</div>
      <div class="nc-preview">${stripHTML(n.content).slice(0,80)}</div>
      <div class="nc-date">${relTime(n.updatedAt)}</div>
    </div>`).join('');
  if (!S.currentNoteId && notes.length) openNote(notes[0].id);
}

window.openNote = function(id) {
  const note = S.notes.find(n=>n.id===id); if(!note) return;
  S.currentNoteId = id;
  loadNoteInEditor(note);
  qsa('.note-card').forEach(c=>c.classList.toggle('active',+c.dataset.id===id));
};

function loadNoteInEditor(note) {
  qs('#noteTitleInput').value = note.title;
  qs('#noteContentArea').innerHTML = note.content;
  noteWordCount();
  qs('#noteLastSaved').textContent = `Saved ${relTime(note.updatedAt)}`;
}

let noteAutoSaveTimer = null;
function autoSaveNote() {
  clearTimeout(noteAutoSaveTimer);
  noteAutoSaveTimer = setTimeout(saveNoteNow, 800);
}

function saveNoteNow() {
  if (!S.currentNoteId) return;
  const note = S.notes.find(n=>n.id===S.currentNoteId); if(!note) return;
  note.title = qs('#noteTitleInput').value || 'Untitled Note';
  note.content = qs('#noteContentArea').innerHTML;
  note.updatedAt = Date.now();
  save('nexusNotes', S.notes);
  qs('#noteLastSaved').textContent = 'Saved just now';
  qsa('.note-card').forEach(c => { if(+c.dataset.id===S.currentNoteId) { c.querySelector('.nc-title').textContent=note.title; c.querySelector('.nc-preview').textContent=stripHTML(note.content).slice(0,80); } });
}

function deleteNote() {
  if (!S.currentNoteId) return;
  if (!confirm('Delete this note?')) return;
  S.notes = S.notes.filter(n=>n.id!==S.currentNoteId);
  S.currentNoteId = null;
  save('nexusNotes', S.notes);
  qs('#noteTitleInput').value=''; qs('#noteContentArea').innerHTML='';
  renderNotesList();
  showToast('Note deleted','info');
}

function pinNote() {
  const note = S.notes.find(n=>n.id===S.currentNoteId); if(!note) return;
  note.pinned = !note.pinned; save('nexusNotes', S.notes);
  renderNotesList(); showToast(note.pinned?'Note pinned 📌':'Note unpinned','success');
}

function exportNote() {
  const note = S.notes.find(n=>n.id===S.currentNoteId); if(!note) return;
  const blob = new Blob([`# ${note.title}\n\n${stripHTML(note.content)}`], {type:'text/markdown'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${note.title}.md`; a.click();
}

function noteWordCount() {
  const text = stripHTML(qs('#noteContentArea').innerHTML);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  qs('#noteWordCount').textContent = `${words} words`;
  qs('#noteCharCount').textContent = `${text.length} chars`;
}

// ═══════════════════════════════════════════════════════════════
// CALENDAR
// ═══════════════════════════════════════════════════════════════
function navCal(dir) {
  if (S.calView==='month') S.calDate.setMonth(S.calDate.getMonth()+dir);
  else if (S.calView==='week') S.calDate.setDate(S.calDate.getDate()+dir*7);
  else S.calDate.setDate(S.calDate.getDate()+dir);
  renderCalendar();
}

function renderCalendar() {
  qs('#calMonthYear').textContent = S.calDate.toLocaleDateString('en-US',{month:'long',year:'numeric'});
  const grid = qs('#calendarGrid'); if(!grid) return;
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let html = days.map(d=>`<div class="cal-day-header">${d}</div>`).join('');
  const first = new Date(S.calDate.getFullYear(), S.calDate.getMonth(), 1);
  const last  = new Date(S.calDate.getFullYear(), S.calDate.getMonth()+1, 0);
  const startDOW = first.getDay();
  const today = new Date();
  for (let i=0;i<startDOW;i++) {
    const d = new Date(first); d.setDate(d.getDate()-startDOW+i);
    html += `<div class="cal-day other-month" onclick="selectDay('${d.toISOString()}')">${d.getDate()}</div>`;
  }
  for (let d=1;d<=last.getDate();d++) {
    const date = new Date(S.calDate.getFullYear(), S.calDate.getMonth(), d);
    const isToday = date.toDateString()===today.toDateString();
    const isSel = date.toDateString()===S.calSelectedDate.toDateString();
    const hasEv = S.calEvents.some(e=>new Date(e.start).toDateString()===date.toDateString());
    html += `<div class="cal-day${isToday?' today':''}${isSel&&!isToday?' selected':''}${hasEv?' has-events':''}" onclick="selectDay('${date.toISOString()}')">${d}</div>`;
  }
  grid.innerHTML = html;
  renderDayEvents(S.calSelectedDate);
}

window.selectDay = function(iso) {
  S.calSelectedDate = new Date(iso);
  renderCalendar();
};

function renderDayEvents(date) {
  const label = qs('#calSelectedDay'); if(label) label.textContent = date.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  const el = qs('#calEventsContainer'); if(!el) return;
  const evs = S.calEvents.filter(e=>new Date(e.start).toDateString()===date.toDateString());
  if (!evs.length) { el.innerHTML='<div class="empty-state">No events. Add one!</div>'; return; }
  el.innerHTML = evs.map(e=>`
    <div class="cal-event-item" style="border-left-color:${e.color||'var(--accent)'}">
      <div>
        <div class="cal-event-title">${esc(e.title)}</div>
        ${e.location?`<div class="cal-event-time">📍 ${esc(e.location)}</div>`:''}
      </div>
      <div class="cal-event-time">${e.start?fmtTime(new Date(e.start)):''}</div>
    </div>`).join('');
}

function openEventModal() {
  const now = new Date(); const end = new Date(now.getTime()+3600000);
  qs('#eventStart').value = toDatetimeLocal(now);
  qs('#eventEnd').value = toDatetimeLocal(end);
  qs('#addEventModal').style.display='flex';
}

function saveEvent() {
  const title = qs('#eventTitle').value.trim(); if(!title) { showToast('Please enter a title','error'); return; }
  S.calEvents.push({ id:Date.now(), title, start:qs('#eventStart').value, end:qs('#eventEnd').value, location:qs('#eventLocation').value, description:qs('#eventDesc').value, color:qs('.ev-color-opt.selected')?.style.background||'var(--accent)' });
  save('nexusEvents', S.calEvents);
  qs('#addEventModal').style.display='none';
  qs('#eventTitle').value=''; qs('#eventLocation').value=''; qs('#eventDesc').value='';
  renderCalendar(); showToast('Event saved 📅','success');
}

// ═══════════════════════════════════════════════════════════════
// POMODORO
// ═══════════════════════════════════════════════════════════════
function pomoSeconds() {
  const s = S.settings;
  return ({ work:s.pomodoroWork, short:s.pomodoroShortBreak, long:s.pomodoroLongBreak })[S.pomoMode]*60;
}

function togglePomo() {
  if (S.pomoRunning) {
    S.pomoRunning=false; clearInterval(S.pomoInterval);
    qs('#pomoStart').innerHTML='▶ Start';
  } else {
    S.pomoRunning=true;
    qs('#pomoStart').innerHTML='⏸ Pause';
    S.pomoInterval = setInterval(tickPomo, 1000);
  }
  savePomoRuntime();
}

function tickPomo() {
  S.pomoTimeLeft--;
  savePomoRuntime();
  renderPomoRing();
  if (S.pomoTimeLeft<=0) { pomoComplete(); }
}

function pomoComplete() {
  S.pomoRunning=false; clearInterval(S.pomoInterval);
  qs('#pomoStart').innerHTML='▶ Start';
  if (S.pomoMode==='work') {
    S.pomoSessions++;
    S.settings.totalFocusMinutes = (S.settings.totalFocusMinutes||0) + S.settings.pomodoroWork;
    save('nexusSettings', S.settings);
    const sesLabel = `${fmtTime(new Date())} — ${S.settings.pomodoroWork}min work`;
    const hist = qs('#pomoHistoryList');
    if (hist) hist.insertAdjacentHTML('afterbegin', `<div class="sw-lap"><span>🍅 ${sesLabel}</span><span class="text-green">Done</span></div>`);
    showToast('🍅 Pomodoro complete! Take a break','success');
    if (S.settings.pomodoroAutoBreak) {
      const longBreak = S.pomoSessions % S.settings.pomodoroSessionsBeforeLong === 0;
      S.pomoMode = longBreak ? 'long' : 'short';
      qsa('.pomo-tab').forEach(t=>{t.classList.toggle('active',t.dataset.mode===S.pomoMode);});
      resetPomo(); if(S.settings.pomodoroAutoWork) togglePomo();
    }
  } else {
    showToast('Break over — back to work! 💪','info');
    if (S.settings.pomodoroAutoWork) { S.pomoMode='work'; qsa('.pomo-tab').forEach(t=>t.classList.toggle('active',t.dataset.mode==='work')); resetPomo(); togglePomo(); }
  }
  renderPomoStats();
  updateDashMinis();
}

function resetPomo() {
  S.pomoRunning=false; clearInterval(S.pomoInterval);
  S.pomoTimeLeft = pomoSeconds();
  qs('#pomoStart').innerHTML='▶ Start';
  qs('#pomoTime').textContent = secToMS(S.pomoTimeLeft);
  qs('#pomoSessionLabel').textContent = ({work:'Work Session',short:'Short Break',long:'Long Break'})[S.pomoMode];
  renderPomoRing();
  savePomoRuntime();
}

function skipPomo() { pomoComplete(); }

function renderPomoRing() {
  const el = qs('#pomoTime'); if(el) el.textContent = secToMS(S.pomoTimeLeft);
  const total = pomoSeconds();
  const pct = S.pomoTimeLeft / total;
  const circ = 2*Math.PI*88;
  const ring = qs('#pomoRingProgress');
  if (ring) ring.style.strokeDashoffset = circ*(1-pct);
}

function renderPomoTasks() {
  const sel = qs('#pomoCurrentTask'); if(!sel) return;
  const pending = S.todos.filter(t=>!t.completed);
  sel.innerHTML = `<option value="">Select a task (optional)</option>` + pending.map(t=>`<option value="${t.id}">${esc(t.text.slice(0,40))}</option>`).join('');
}

function renderPomoStats() {
  const today = new Date().toDateString();
  qs('#psToday').textContent = S.pomoSessions;
  qs('#psTotal').textContent = Math.floor((S.settings.totalFocusMinutes||0)/S.settings.pomodoroWork)||0;
  qs('#psFocusTime').textContent = (S.settings.totalFocusMinutes||0)+'m';
  qs('#psStreak').textContent = bestStreak();
  renderPomoDots();
}

function renderPomoDots() {
  const el = qs('#pomoSessions'); if(!el) return;
  const max = S.settings.pomodoroSessionsBeforeLong;
  el.innerHTML = Array.from({length:max},(_,i)=>`<div class="pomo-dot${i<S.pomoSessions%max?' completed':''}"></div>`).join('');
}

// ═══════════════════════════════════════════════════════════════
// BOOKMARKS
// ═══════════════════════════════════════════════════════════════
function renderBookmarks(search='') {
  const el = qs('#bmGrid'); if(!el) return;
  let bms = [...S.bookmarks];
  if (search) bms = bms.filter(b=>b.title.toLowerCase().includes(search.toLowerCase())||b.url.toLowerCase().includes(search.toLowerCase()));
  const activeView = qs('.bm-view.active')?.dataset.view||'grid';
  el.className = `bm-grid${activeView==='list'?' list-view':activeView==='compact'?' compact-view':''}`;
  if (!bms.length) { el.innerHTML='<div class="empty-state" style="grid-column:1/-1">No bookmarks yet. Add some!</div>'; return; }
  el.innerHTML = bms.map(b=>`
    <a href="${esc(b.url)}" target="_blank" class="bm-card" title="${esc(b.title)}">
      <img class="bm-favicon" src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(b.url).hostname)}&sz=32" onerror="this.style.display='none'" alt="" loading="lazy"/>
      <div class="bm-title">${esc(b.title)}</div>
      ${activeView!=='compact'?`<div class="bm-url">${esc(b.url.replace(/^https?:\/\//,'').slice(0,30))}</div>`:''}
      <button class="bm-delete" onclick="event.preventDefault();deleteBookmark(${b.id})">✕</button>
    </a>`).join('');
}

window.deleteBookmark = function(id) {
  S.bookmarks = S.bookmarks.filter(b=>b.id!==id);
  save('nexusBookmarks', S.bookmarks);
  renderBookmarks();
};

function addBookmark() {
  const url = prompt('Bookmark URL:'); if(!url) return;
  const title = prompt('Bookmark name:') || new URL(url).hostname;
  S.bookmarks.unshift({ id:Date.now(), title, url, favicon:'', folder:'general', tags:[], createdAt:Date.now() });
  save('nexusBookmarks', S.bookmarks);
  renderBookmarks(); showToast('Bookmark added 🔖','success');
}

// ═══════════════════════════════════════════════════════════════
// WEATHER (Open-Meteo primary, wttr.in fallback)
// ═══════════════════════════════════════════════════════════════
function weatherCodeToIcon(code, isDay=true) {
  const map = {
    0: isDay ? '☀️' : '🌙',
    1: isDay ? '🌤' : '🌙',
    2: '⛅',
    3: '☁️',
    45: '🌫',
    48: '🌫',
    51: '🌦', 53: '🌦', 55: '🌧',
    56: '🌨', 57: '🌨',
    61: '🌦', 63: '🌧', 65: '🌧',
    66: '🌨', 67: '🌨',
    71: '🌨', 73: '❄️', 75: '❄️', 77: '❄️',
    80: '🌦', 81: '🌧', 82: '🌧',
    85: '🌨', 86: '🌨',
    95: '⛈', 96: '⛈', 99: '⛈'
  };
  return map[code] || '🌤';
}

function weatherCodeToDesc(code) {
  const map = {
    0:'Clear sky', 1:'Mainly clear', 2:'Partly cloudy', 3:'Overcast',
    45:'Fog', 48:'Depositing rime fog',
    51:'Light drizzle', 53:'Drizzle', 55:'Dense drizzle',
    56:'Freezing drizzle', 57:'Heavy freezing drizzle',
    61:'Slight rain', 63:'Rain', 65:'Heavy rain',
    66:'Freezing rain', 67:'Heavy freezing rain',
    71:'Slight snow', 73:'Snow', 75:'Heavy snow', 77:'Snow grains',
    80:'Rain showers', 81:'Rain showers', 82:'Violent rain showers',
    85:'Snow showers', 86:'Heavy snow showers',
    95:'Thunderstorm', 96:'Thunderstorm with hail', 99:'Heavy thunderstorm with hail'
  };
  return map[code] || 'Unknown';
}

function parseLatLon(text='') {
  const m = String(text).trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = Number(m[1]), lon = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

async function geocodeOpenMeteo(query) {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`, { cache: 'no-store' });
  const d = await r.json();
  const g = d?.results?.[0];
  if (!g) return null;
  return { lat:g.latitude, lon:g.longitude, name:[g.name,g.admin1,g.country].filter(Boolean).join(', ') };
}

async function reverseGeocodeOpenMeteo(lat, lon) {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&format=json`, { cache: 'no-store' });
  const d = await r.json();
  const g = d?.results?.[0];
  if (!g) return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  return [g.name,g.admin1,g.country].filter(Boolean).join(', ');
}

function getPositionOnce(timeoutMs=8000) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
    const to = setTimeout(() => reject(new Error('Location timeout')), timeoutMs);
    navigator.geolocation.getCurrentPosition(pos => {
      clearTimeout(to);
      resolve(pos);
    }, err => {
      clearTimeout(to);
      reject(err);
    }, { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 });
  });
}

async function loadWeather(city='') {
  S.weatherCity = city || S.settings.weatherLocation || 'auto';
  const loc = S.weatherCity || 'auto';
  qs('#weatherLoading').style.display='flex'; qs('#weatherContent').style.display='none';
  try {
    let lat, lon, placeName = '';
    const parsed = parseLatLon(loc);
    if (parsed) {
      lat = parsed.lat; lon = parsed.lon;
      placeName = await reverseGeocodeOpenMeteo(lat, lon);
    } else if (loc === 'auto') {
      const pos = await getPositionOnce();
      lat = pos.coords.latitude; lon = pos.coords.longitude;
      placeName = await reverseGeocodeOpenMeteo(lat, lon);
    } else {
      const geo = await geocodeOpenMeteo(loc);
      if (!geo) throw new Error('Location not found');
      lat = geo.lat; lon = geo.lon; placeName = geo.name;
    }

    const useCelsius = S.settings.weatherUnit === 'celsius';
    const tempUnit = useCelsius ? 'celsius' : 'fahrenheit';
    const windUnit = useCelsius ? 'kmh' : 'mph';
    const visUnit = useCelsius ? 'km' : 'miles';
    const dailyTempUnit = useCelsius ? '&temperature_unit=celsius' : '&temperature_unit=fahrenheit';
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,is_day,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&wind_speed_unit=${windUnit}&visibility_unit=${visUnit}${dailyTempUnit}`,
      { cache: 'no-store' }
    );
    const d = await r.json();
    const cur = d.current;
    if (!cur) throw new Error('Weather unavailable');
    S.weatherData = {
      temp: Math.round(cur.temperature_2m),
      feels: Math.round(cur.apparent_temperature),
      desc: weatherCodeToDesc(cur.weather_code),
      icon: weatherCodeToIcon(cur.weather_code, !!cur.is_day),
      city: `${placeName} · Updated ${new Date(cur.time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}`,
      humidity: Math.round(cur.relative_humidity_2m),
      windspeed: Math.round(cur.wind_speed_10m),
      visibility: Math.round((cur.visibility || 0) / (useCelsius ? 1000 : 1609.34)),
      forecast: (d.daily?.time || []).slice(0,5).map((date, idx) => ({
        date,
        icon: weatherCodeToIcon(d.daily.weather_code?.[idx], true),
        high: Math.round(d.daily.temperature_2m_max?.[idx]),
        low: Math.round(d.daily.temperature_2m_min?.[idx]),
      }))
    };
    renderWeather();
  } catch(e) {
    await loadWeatherFallbackWttr(loc);
  }
}

async function loadWeatherFallbackWttr(loc='auto') {
  try {
    const query = loc==='auto' ? '' : loc;
    const url = `https://wttr.in/${encodeURIComponent(query)}?format=j1`;
    const r = await fetch(url, { cache: 'no-store' });
    const d = await r.json();
    const cur = d.current_condition?.[0];
    if (!cur) throw new Error('Fallback failed');
    const useCelsius = S.settings.weatherUnit==='celsius';
    const temp = useCelsius ? cur.temp_C : cur.temp_F;
    const feels = useCelsius ? cur.FeelsLikeC : cur.FeelsLikeF;
    const desc = cur.weatherDesc?.[0]?.value || 'Unknown';
    const icon = desc.toLowerCase().includes('rain') ? '🌧' : desc.toLowerCase().includes('cloud') ? '☁️' : '🌤';
    const areas = d.nearest_area?.[0];
    const areaName = areas?.areaName?.[0]?.value || '';
    const country = areas?.country?.[0]?.value || '';
    S.weatherData = {
      temp, feels, desc, icon,
      city: `${areaName}, ${country} · Updated ${new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}`,
      humidity: cur.humidity, windspeed: useCelsius ? cur.windspeedKmph : cur.windspeedMiles, visibility: cur.visibility,
      forecast: d.weather?.slice(0,5).map(day=>({ date:day.date, icon:'🌤', high:useCelsius?day.maxtempC:day.maxtempF, low:useCelsius?day.mintempC:day.mintempF }))
    };
    renderWeather();
  } catch {
    qs('#weatherLoading').innerHTML='<p>Could not load weather. Check your connection.</p>';
  }
}

function renderWeather() {
  const w = S.weatherData; if(!w) return;
  qs('#weatherLoading').style.display='none'; qs('#weatherContent').style.display='block';
  qs('#wIconLarge').textContent=w.icon; qs('#wTemp').textContent=w.temp; qs('#wUnit').textContent=S.settings.weatherUnit==='celsius'?'°C':'°F';
  qs('#wDesc').textContent=w.desc; qs('#wLocation').textContent=w.city;
  qs('#wHumidity').textContent=w.humidity+'%'; qs('#wWind').textContent=w.windspeed+(S.settings.weatherUnit==='celsius'?' km/h':' mph');
  qs('#wVis').textContent=w.visibility+'km'; qs('#wFeelsLike').textContent=w.feels+'°';
  if (w.forecast && qs('#wForecast')) {
    qs('#wForecast').innerHTML = w.forecast.map(d=>`
      <div class="forecast-day">
        <div class="fd-day">${new Date(d.date).toLocaleDateString('en-US',{weekday:'short'})}</div>
        <div class="fd-icon">${d.icon}</div>
        <div class="fd-high">${d.high}°</div>
        <div class="fd-low">${d.low}°</div>
      </div>`).join('');
  }
  updateDashMinis();
}

function geoWeather() {
  if (!navigator.geolocation) { showToast('Geolocation not supported','error'); return; }
  navigator.geolocation.getCurrentPosition(pos => {
    loadWeather(`${pos.coords.latitude},${pos.coords.longitude}`);
  }, ()=>showToast('Location denied','error'));
}

// ═══════════════════════════════════════════════════════════════
// CLOCK
// ═══════════════════════════════════════════════════════════════
function tickDigitalClock() {
  const now = new Date();
  const fmt12 = S.settings.clockFormat==='12h';
  let h=now.getHours(), m=now.getMinutes(), s=now.getSeconds();
  const ampm = h>=12?'PM':'AM';
  if (fmt12) h=h%12||12;
  const timeStr = `${pad(h)}:${pad(m)}${S.settings.showSeconds?':'+pad(s):''}`;
  const tEl=qs('#digitalTime'); if(tEl) tEl.textContent=timeStr;
  const aEl=qs('#digitalAmPm'); if(aEl) aEl.textContent=fmt12?ampm:'';
  const dEl=qs('#digitalDate'); if(dEl) dEl.textContent=now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const wEl=qs('#digitalWeek'); if(wEl) wEl.textContent='Week '+getWeekNum(now);
}

function startAnalogClock() {
  clearInterval(S.analogInterval);
  S.analogInterval = setInterval(drawAnalog, 1000);
  drawAnalog();
}

function drawAnalog() {
  const canvas = qs('#analogClock'); if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W=canvas.width, H=canvas.height, cx=W/2, cy=H/2, r=cx-10;
  const isDark = !['light'].includes(S.settings.theme);
  ctx.clearRect(0,0,W,H);
  // Face
  ctx.beginPath(); ctx.arc(cx,cy,r,0,2*Math.PI);
  ctx.fillStyle=isDark?'#1e1e2e':'#f5f5fa'; ctx.fill();
  ctx.strokeStyle='rgba(108,99,255,0.3)'; ctx.lineWidth=2; ctx.stroke();
  // Hour marks
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6;
    const x1=cx+Math.sin(a)*(r-10),y1=cy-Math.cos(a)*(r-10);
    const x2=cx+Math.sin(a)*(r-4),y2=cy-Math.cos(a)*(r-4);
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
    ctx.strokeStyle=isDark?'rgba(255,255,255,0.3)':'rgba(0,0,0,0.3)'; ctx.lineWidth=2; ctx.stroke();
  }
  const now=new Date();
  const hr=(now.getHours()%12+now.getMinutes()/60)*Math.PI/6;
  const mn=(now.getMinutes()+now.getSeconds()/60)*Math.PI/30;
  const sc=now.getSeconds()*Math.PI/30;
  const hand=(a,len,w,col)=>{ctx.save();ctx.translate(cx,cy);ctx.rotate(a);ctx.beginPath();ctx.moveTo(0,6);ctx.lineTo(0,-len);ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.stroke();ctx.restore();};
  hand(hr,r*0.55,4,isDark?'#e8e8f0':'#1a1a2e');
  hand(mn,r*0.75,3,isDark?'#e8e8f0':'#1a1a2e');
  hand(sc,r*0.82,1.5,S.settings.accentColor||'#6C63FF');
  ctx.beginPath(); ctx.arc(cx,cy,4,0,2*Math.PI); ctx.fillStyle=S.settings.accentColor||'#6C63FF'; ctx.fill();
}

// Stopwatch
function toggleSW() {
  S.swRunning = !S.swRunning;
  qs('#swStartStop').textContent = S.swRunning ? '⏸ Pause' : '▶ Resume';
  if (S.swRunning) {
    const start = Date.now()-S.swElapsed;
    S.swInterval = setInterval(()=>{S.swElapsed=Date.now()-start; qs('#swDisplay').textContent=msToHMS(S.swElapsed);},33);
  } else clearInterval(S.swInterval);
}
function lapSW() {
  if(!S.swRunning&&!S.swElapsed) return;
  const lapEl=qs('#swLaps');
  S.swLaps.push(S.swElapsed);
  if(lapEl) lapEl.insertAdjacentHTML('afterbegin',`<div class="sw-lap"><span>Lap ${S.swLaps.length}</span><span>${msToHMS(S.swElapsed)}</span></div>`);
}
function resetSW() { clearInterval(S.swInterval); S.swRunning=false; S.swElapsed=0; S.swLaps=[]; qs('#swDisplay').textContent='00:00:00.000'; qs('#swStartStop').textContent='▶ Start'; const l=qs('#swLaps');if(l)l.innerHTML=''; }

// Timer
function timerPreset(s) { resetTimer(); S.timerTotal=s; S.timerRemaining=s; qs('#timerDisplay').textContent=secToMS(s); }
function toggleTimer() {
  S.timerRunning = !S.timerRunning;
  qs('#timerStartStop').textContent = S.timerRunning ? '⏸ Pause' : '▶ Start';
  if (S.timerRunning) {
    if (!S.timerRemaining) {
      const h=+qs('#timerHours').value||0, m=+qs('#timerMinutes').value||25, s=+qs('#timerSeconds').value||0;
      S.timerTotal = h*3600+m*60+s;
      S.timerRemaining = S.timerTotal;
    }
    S.timerInterval = setInterval(()=>{
      S.timerRemaining--;
      qs('#timerDisplay').textContent=secToMS(S.timerRemaining);
      if(S.timerRemaining<=0){ clearInterval(S.timerInterval); S.timerRunning=false; showToast('⏰ Timer done!','success'); qs('#timerStartStop').textContent='▶ Start'; try{chrome.notifications.create({type:'basic',iconUrl:'../icons/icon128.png',title:'Nexus Timer',message:qs('#timerLabel').value||'Timer finished!'});}catch{} }
    },1000);
  } else clearInterval(S.timerInterval);
}
function resetTimer() { clearInterval(S.timerInterval); S.timerRunning=false; S.timerRemaining=0; qs('#timerStartStop').textContent='▶ Start'; qs('#timerDisplay').textContent=secToMS(0); }

// World Clocks
function renderWorldClocks() {
  const el=qs('#worldClocksList'); if(!el) return;
  el.innerHTML = S.worldClocks.map(tz=>{
    let t; try{ t=new Date().toLocaleTimeString('en-US',{timeZone:tz,hour:'2-digit',minute:'2-digit',second:'2-digit'}); }catch{ t='N/A'; }
    return `<div class="sw-lap"><span>${tz.split('/').pop().replace('_',' ')}</span><span>${t}</span></div>`;
  }).join('');
  // Populate timezone selector
  const sel=qs('#worldClockTz'); if(!sel||sel.options.length>1) return;
  const zones=['America/New_York','America/Los_Angeles','America/Chicago','America/Denver','Europe/London','Europe/Paris','Europe/Berlin','Europe/Moscow','Asia/Dubai','Asia/Kolkata','Asia/Tokyo','Asia/Shanghai','Asia/Singapore','Australia/Sydney','Pacific/Auckland'];
  sel.innerHTML=zones.map(z=>`<option value="${z}">${z.replace('_',' ')}</option>`).join('');
}

function addWorldClock() {
  const tz=qs('#worldClockTz').value; if(!tz||S.worldClocks.includes(tz)) return;
  S.worldClocks.push(tz); renderWorldClocks();
}

// ═══════════════════════════════════════════════════════════════
// CALCULATOR
// ═══════════════════════════════════════════════════════════════
function buildCalc() {
  const buttons = [
    ['C','±','%','÷'],['7','8','9','×'],['4','5','6','−'],['1','2','3','+'],['0','.','⌫','=']
  ];
  const grid=qs('#calcGrid'); if(!grid) return;
  grid.innerHTML = buttons.flat().map(b=>{
    const cls = b==='='?'equals':b==='C'?'clear':['+','−','×','÷','%','±'].includes(b)?'operator':b==='0'?'zero':'';
    return `<button class="calc-btn ${cls}${b==='0'?' zero':''}" data-val="${b}">${b}</button>`;
  }).join('');
  grid.querySelectorAll('.calc-btn').forEach(btn=>btn.addEventListener('click',()=>calcPress(btn.dataset.val)));

  // Scientific mode
  qsa('.calc-tab').forEach(t=>t.addEventListener('click',()=>{
    qsa('.calc-tab').forEach(x=>x.classList.remove('active')); t.classList.add('active');
    if(t.dataset.tab==='scientific') buildScientificCalc();
    else if(t.dataset.tab==='standard') buildCalc();
    else renderCalcHistory();
  }));
}

function buildScientificCalc() {
  const grid=qs('#calcGrid'); if(!grid) return;
  const btns=['sin','cos','tan','log','ln','√','x²','x³','π','e','(',')','^','10^x','n!','1/x','|x|','C','⌫','='];
  grid.style.gridTemplateColumns='repeat(5,1fr)';
  grid.innerHTML=btns.map(b=>`<button class="calc-btn ${['='].includes(b)?'equals':['C','⌫'].includes(b)?'clear':'operator'}" data-val="${b}">${b}</button>`).join('');
  grid.querySelectorAll('.calc-btn').forEach(btn=>btn.addEventListener('click',()=>sciCalcPress(btn.dataset.val)));
}

function calcPress(val) {
  const rd=qs('#calcResult'), ex=qs('#calcExpression'); if(!rd) return;
  if(val==='C'){S.calcExpr='';S.calcResult='0';rd.textContent='0';ex.textContent='';return;}
  if(val==='⌫'){S.calcExpr=S.calcExpr.slice(0,-1);rd.textContent=S.calcExpr||'0';return;}
  if(val==='='){
    try{
      let expr=S.calcExpr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
      const result=Function('"use strict";return ('+expr+')')();
      ex.textContent=S.calcExpr+' =';
      S.calcResult=String(+result.toFixed(10));
      rd.textContent=S.calcResult;
      S.calcHistory.unshift({expr:S.calcExpr,result:S.calcResult});
      S.calcHistory=S.calcHistory.slice(0,20);
      S.calcExpr=S.calcResult;
    }catch{rd.textContent='Error';}
    return;
  }
  if(val==='±'){S.calcExpr=S.calcExpr.startsWith('-')?S.calcExpr.slice(1):'-'+S.calcExpr;}
  else S.calcExpr+=val;
  rd.textContent=S.calcExpr;
}

function sciCalcPress(val) {
  const rd=qs('#calcResult'); if(!rd) return;
  const cur=parseFloat(S.calcResult)||0;
  const map={'sin':Math.sin,'cos':Math.cos,'tan':Math.tan,'log':Math.log10,'ln':Math.log,'√':Math.sqrt,'x²':x=>x*x,'x³':x=>x*x*x,'|x|':Math.abs,'1/x':x=>1/x,'10^x':x=>Math.pow(10,x),'n!':x=>{let f=1;for(let i=2;i<=x;i++)f*=i;return f;}};
  if(val==='π'){S.calcExpr='3.141592653589793';rd.textContent=S.calcExpr;return;}
  if(val==='e'){S.calcExpr='2.718281828459045';rd.textContent=S.calcExpr;return;}
  if(map[val]){const r=map[val](cur);S.calcResult=String(+r.toFixed(10));rd.textContent=S.calcResult;return;}
  calcPress(val);
}

function renderCalcHistory() {
  const grid=qs('#calcGrid'); if(!grid) return;
  grid.style.gridTemplateColumns='1fr';
  grid.innerHTML = S.calcHistory.length ? S.calcHistory.map(h=>`<div class="sw-lap"><span>${h.expr}</span><span>${h.result}</span></div>`).join('') : '<div class="empty-state">No history yet</div>';
}

// ═══════════════════════════════════════════════════════════════
// HABITS
// ═══════════════════════════════════════════════════════════════
function renderHabits() {
  const el=qs('#habitsList'); if(!el) return;
  const today=new Date().toDateString();
  const done=doneHabitsToday();
  qs('#hCompletedToday').textContent=done; qs('#hTotalHabits').textContent=S.habits.length;
  qs('#hBestStreak').textContent=Math.max(0,...S.habits.map(h=>h.streak||0));
  if(!S.habits.length){el.innerHTML='<div class="empty-state">No habits yet. Build a routine! 🏃</div>';return;}
  el.innerHTML=S.habits.map(h=>{
    const isd=h.completedDates?.includes(today);
    return `<div class="habit-item ${isd?'completed':''}">
      <span class="habit-icon">${h.icon||'⭐'}</span>
      <div class="habit-info">
        <div class="habit-name">${esc(h.name)}</div>
        <div class="habit-streak">🔥 ${h.streak||0} day streak ${h.goal?'· '+h.goal:''}</div>
        <div class="habit-progress-mini"><div class="habit-progress-fill" style="width:${isd?100:0}%;background:${h.color||'var(--accent)'}"></div></div>
      </div>
      <button class="habit-check-btn" onclick="toggleHabit(${h.id})" ${isd?'disabled':''}>
        ${isd?'✓':'○'}
      </button>
    </div>`;
  }).join('');
}

window.toggleHabit = function(id) {
  const h=S.habits.find(x=>x.id===id); if(!h) return;
  const today=new Date().toDateString();
  if(!h.completedDates) h.completedDates=[];
  if(h.completedDates.includes(today)) return;
  h.completedDates.push(today);
  h.streak=(h.streak||0)+1;
  save('nexusHabits',S.habits);
  renderHabits(); showToast(`${h.name} done! 🎉 Streak: ${h.streak}`,'success');
};

function saveHabit() {
  const name=qs('#habitName').value.trim(); if(!name){showToast('Enter habit name','error');return;}
  S.habits.push({ id:Date.now(), name, icon:qs('#habitIcon').value||'⭐', color:qs('.ev-color-opt.selected')?.style.background||'#6C63FF', streak:0, completedDates:[], frequency:qs('#habitFreq').value, goal:qs('#habitGoal').value, category:qs('#habitCategory').value, createdAt:Date.now() });
  save('nexusHabits',S.habits);
  qs('#addHabitModal').style.display='none'; qs('#habitName').value=''; qs('#habitIcon').value=''; qs('#habitGoal').value='';
  renderHabits(); showToast('Habit added 🏃','success');
}

function doneHabitsToday() { const today=new Date().toDateString(); return S.habits.filter(h=>h.completedDates?.includes(today)).length; }

// ═══════════════════════════════════════════════════════════════
// PASSWORD GENERATOR
// ═══════════════════════════════════════════════════════════════
const WORDS=['apple','brave','cloud','dance','eagle','flame','grace','happy','ivory','jewel','karma','light','magic','noble','ocean','peace','quiet','royal','storm','truth','ultra','vivid','width','xenon','young','zesty','amber','blaze','crisp','dream'];

function generatePassword() {
  const len=+qs('#pwdLength').value||16;
  let pwd='';
  switch(S.pwdType) {
    case 'passphrase': {
      const wc=+qs('#wordCount')?.value||4, sep=qs('#wordSeparator')?.value||'-';
      const ws=[]; for(let i=0;i<wc;i++) ws.push(WORDS[Math.floor(Math.random()*WORDS.length)]);
      pwd=ws.join(sep); break;
    }
    case 'pin': pwd=Array.from({length:len},()=>Math.floor(Math.random()*10)).join(''); break;
    case 'memorable': {
      const consonants='bcdfghjklmnpqrstvwxyz',vowels='aeiou';
      for(let i=0;i<len;i++) pwd+=i%2===0?consonants[Math.floor(Math.random()*consonants.length)]:vowels[Math.floor(Math.random()*vowels.length)];
      break;
    }
    default: {
      let chars='';
      const u=qs('#pwdUpper')?.checked, l=qs('#pwdLower')?.checked, n=qs('#pwdNumbers')?.checked, sym=qs('#pwdSymbols')?.checked;
      if(u) chars+='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if(l) chars+='abcdefghijklmnopqrstuvwxyz';
      if(n) chars+='0123456789';
      if(sym) chars+='!@#$%^&*()_+-=[]{}|;:,.<>?';
      if(qs('#pwdExcludeSimilar')?.checked) chars=chars.replace(/[iIlL0O]/g,'');
      if(qs('#pwdExcludeAmbiguous')?.checked) chars=chars.replace(/[{}[\]()/\\'"`,;:.~!@#$%^]/g,'');
      if(!chars) chars='abcdefghijklmnopqrstuvwxyz';
      for(let i=0;i<len;i++) pwd+=chars[Math.floor(Math.random()*chars.length)];
    }
  }
  qs('#pwdOutput').textContent=pwd;
  showPwdStrength(pwd);
}

function showPwdStrength(pwd) {
  let score=0;
  if(pwd.length>=8)score++; if(pwd.length>=12)score++; if(pwd.length>=16)score++;
  if(/[A-Z]/.test(pwd))score++; if(/[a-z]/.test(pwd))score++; if(/[0-9]/.test(pwd))score++; if(/[^a-zA-Z0-9]/.test(pwd))score++;
  const levels=['','Weak 😬','Fair 🤔','Good 👍','Strong 💪','Very Strong 🔒','Excellent 🛡'];
  const colors=['','#ff4444','#ff8800','#ffcc00','#88cc00','#00cc66','#00ff88'];
  const idx=Math.min(score,6);
  qs('#pwdStrengthFill').style.width=`${idx/6*100}%`;
  qs('#pwdStrengthFill').style.background=colors[idx];
  qs('#pwdStrengthLabel').textContent=levels[idx]||'–';
}

function copyPwd() {
  const pwd=qs('#pwdOutput').textContent;
  navigator.clipboard.writeText(pwd);
  S.pwdHistory.unshift({pwd,date:Date.now()});
  S.pwdHistory=S.pwdHistory.slice(0,10);
  renderPwdHistory();
  showToast('Password copied! 🔐','success');
}

function renderPwdHistory() {
  const el=qs('#pwdHistoryList'); if(!el) return;
  el.innerHTML=S.pwdHistory.map(h=>`<div class="pwd-hist-item"><span style="font-size:11px">${h.pwd.slice(0,28)}${h.pwd.length>28?'…':''}</span><button class="pwd-hist-copy" onclick="navigator.clipboard.writeText('${h.pwd.replace(/'/g,"\\'")}');showToast('Copied!','success')">📋</button></div>`).join('');
}

// ═══════════════════════════════════════════════════════════════
// COLOR PICKER
// ═══════════════════════════════════════════════════════════════
let _currentColor='#6C63FF';
function renderColorPicker() { updateColor(_currentColor); renderSavedColors(); renderPalettes(); checkContrast(); }

function updateColor(hex) {
  _currentColor=hex;
  qs('#cpColorInput').value=hex;
  qs('#cpHex').value=hex;
  const [r,g,b]=hexToRgb(hex);
  qs('#cpRgb').value=`${r}, ${g}, ${b}`;
  const [h,s,l]=rgbToHsl(r,g,b);
  qs('#cpHsl').value=`${h}°, ${s}%, ${l}%`;
  const [c,m,y,k]=rgbToCmyk(r,g,b);
  qs('#cpCmyk').value=`${c}%, ${m}%, ${y}%, ${k}%`;
  buildPreviewStrip(hex);
}

function buildPreviewStrip(hex) {
  const el=qs('#cpPreviewStrip'); if(!el) return;
  const shades=[];
  for(let i=0;i<=10;i++) shades.push(i<5?lighten(hex,(5-i)*12):darken(hex,(i-5)*12));
  el.innerHTML=shades.map(c=>`<div class="cp-swatch" style="background:${c}" title="${c}" onclick="updateColor('${c}')"></div>`).join('');
}

function saveColor() {
  S.savedColorsArr.unshift(_currentColor); S.savedColorsArr=S.savedColorsArr.slice(0,20);
  save('nexusSavedColors',S.savedColorsArr); renderSavedColors(); showToast('Color saved 🎨','success');
}

function renderSavedColors() {
  const el=qs('#cpSavedColors'); if(!el) return;
  el.innerHTML=S.savedColorsArr.map(c=>`<div class="cp-saved-swatch" style="background:${c}" title="${c}" onclick="updateColor('${c}')"></div>`).join('');
}

function renderPalettes() {
  const el=qs('#cpPaletteList'); if(!el) return;
  const palettes=[
    {name:'Purple Haze',colors:['#6C63FF','#a78bfa','#c4b5fd','#ede9fe','#4c1d95']},
    {name:'Sunset',colors:['#ff6b6b','#feca57','#ff9ff3','#ff6b9d','#c44569']},
    {name:'Ocean',colors:['#0abde3','#48dbfb','#00d2d3','#01aaa4','#006266']},
    {name:'Forest',colors:['#2ecc71','#27ae60','#1e8449','#145a32','#a9dfbf']},
    {name:'Retrowave',colors:['#ff00cc','#00ccff','#7700cc','#ff0066','#330066']},
    {name:'Dracula',colors:['#bd93f9','#ff79c6','#8be9fd','#50fa7b','#f1fa8c']},
    {name:'Nord',colors:['#88c0d0','#81a1c1','#5e81ac','#a3be8c','#bf616a']},
    {name:'Pastel',colors:['#ffc0cb','#c8b4e3','#b4c8e3','#b4e3c8','#e3c8b4']},
  ];
  el.innerHTML=palettes.map(p=>`
    <div style="margin-bottom:10px">
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">${p.name}</div>
      <div style="display:flex;gap:4px">${p.colors.map(c=>`<div class="cp-saved-swatch" style="background:${c}" onclick="updateColor('${c}')" title="${c}"></div>`).join('')}</div>
    </div>`).join('');
}

function showHarmonies(type) {
  const [r,g,b]=hexToRgb(_currentColor);
  const [h,s,l]=rgbToHsl(r,g,b);
  let cols=[];
  switch(type){
    case 'comp': cols=[hslToHex((h+180)%360,s,l)]; break;
    case 'tri':  cols=[hslToHex((h+120)%360,s,l),hslToHex((h+240)%360,s,l)]; break;
    case 'ana':  cols=[hslToHex((h+30)%360,s,l),hslToHex((h+60)%360,s,l),hslToHex((h-30+360)%360,s,l)]; break;
    case 'shades': for(let i=1;i<=6;i++) cols.push(hslToHex(h,s,Math.max(5,l-i*10))); break;
  }
  const el=qs('#cpResultStrip'); if(!el) return;
  el.innerHTML=cols.map(c=>`<div class="cp-saved-swatch" style="background:${c};width:32px;height:32px" title="${c}" onclick="updateColor('${c}')"></div>`).join('');
}

function checkContrast() {
  const bg=qs('#ccBg').value, fg=qs('#ccFg').value;
  const ratio=contrastRatio(bg,fg);
  const el=qs('#ccResult'); if(!el) return;
  el.style.background=bg; el.style.color=fg;
  el.textContent=`${ratio}:1 ${ratio>=7?'AAA ✓':ratio>=4.5?'AA ✓':ratio>=3?'AA Large ⚠':'Fail ✗'}`;
}

// ═══════════════════════════════════════════════════════════════
// UNIT CONVERTER
// ═══════════════════════════════════════════════════════════════
const UNITS = {
  length:   {m:1,km:0.001,mi:0.000621371,ft:3.28084,yd:1.09361,cm:100,mm:1000,nm:1e9,in:39.3701,'light-year':1.057e-16},
  weight:   {kg:1,g:1000,lb:2.20462,oz:35.274,t:0.001,mg:1e6,µg:1e9,stone:0.157473},
  temp:     {celsius:1,fahrenheit:1,kelvin:1},
  area:     {'m²':1,'km²':1e-6,'mi²':3.861e-7,'ft²':10.7639,'acre':0.000247,'ha':0.0001,'cm²':10000},
  volume:   {'l':1,'ml':1000,'m³':0.001,'gal(US)':0.264172,'fl oz':33.814,'cup':4.22675,'tbsp':67.628,'tsp':202.884,'pt':2.11338,'qt':1.05669},
  speed:    {'m/s':1,'km/h':3.6,'mph':2.23694,'knot':1.94384,'ft/s':3.28084,'mach':0.00291545},
  time:     {second:1,minute:1/60,hour:1/3600,day:1/86400,week:1/604800,month:1/2.628e6,year:1/3.156e7,millisecond:1000,nanosecond:1e9,decade:1/3.156e8},
  data:     {'bit':1,'byte':0.125,'KB':0.000122,'MB':1.19e-7,'GB':1.16e-10,'TB':1.14e-13,'KiB':0.000122,'MiB':1.19e-7,'GiB':1.16e-10,'TiB':1.14e-13},
  angle:    {degree:1,radian:0.0174533,gradian:1.11111,turn:0.00277778,'arc-minute':60,'arc-second':3600},
  pressure: {Pa:1,kPa:0.001,MPa:1e-6,bar:1e-5,psi:0.000145038,atm:9.869e-6,mmHg:0.00750062,torr:0.00750062},
  energy:   {J:1,kJ:0.001,cal:0.239006,kcal:0.000239,'Wh':0.000277778,'kWh':2.778e-7,'eV':6.242e18,'BTU':0.000947817},
  currency: {USD:1,EUR:0.92,GBP:0.79,JPY:149.5,CNY:7.24,INR:83.2,CAD:1.36,AUD:1.53,CHF:0.89,KRW:1325},
};

function setupConverter(type) {
  S.convType=type;
  const units=Object.keys(UNITS[type]||UNITS.length);
  const fromSel=qs('#convFromUnit'), toSel=qs('#convToUnit');
  if(!fromSel||!toSel) return;
  fromSel.innerHTML=toSel.innerHTML=units.map(u=>`<option value="${u}">${u}</option>`).join('');
  toSel.selectedIndex=1;
  doConvert();
}

function doConvert() {
  const val=parseFloat(qs('#convFrom').value);
  const from=qs('#convFromUnit').value, to=qs('#convToUnit').value;
  const type=S.convType;
  if(isNaN(val)){qs('#convTo').value=''; return;}
  let result;
  if(type==='temp'){
    if(from==='celsius'&&to==='fahrenheit') result=val*9/5+32;
    else if(from==='fahrenheit'&&to==='celsius') result=(val-32)*5/9;
    else if(from==='celsius'&&to==='kelvin') result=val+273.15;
    else if(from==='kelvin'&&to==='celsius') result=val-273.15;
    else if(from==='fahrenheit'&&to==='kelvin') result=(val-32)*5/9+273.15;
    else if(from==='kelvin'&&to==='fahrenheit') result=(val-273.15)*9/5+32;
    else result=val;
  } else {
    const factors=UNITS[type];
    result=val/factors[from]*factors[to];
  }
  const fmtd=+result.toPrecision(8);
  qs('#convTo').value=fmtd;
  qs('#convFormula').textContent=`${val} ${from} = ${fmtd} ${to}`;
  renderQuickConvert(val, from, type);
}

function renderQuickConvert(val, from, type) {
  const el=qs('#convQuickResults'); if(!el) return;
  const allUnits=Object.keys(UNITS[type]||{});
  const results=allUnits.filter(u=>u!==from).slice(0,6).map(u=>{
    let r; const factors=UNITS[type];
    if(type==='temp'){r=val;}else r=val/factors[from]*factors[u];
    return `<div class="conv-quick-row"><span class="cqr-unit">${u}</span><span class="cqr-val">${+r.toPrecision(6)}</span></div>`;
  }).join('');
  el.innerHTML=results;
}

function swapConvert() {
  const fromSel=qs('#convFromUnit'), toSel=qs('#convToUnit'), fromVal=qs('#convFrom');
  const tmp=fromSel.value; fromSel.value=toSel.value; toSel.value=tmp;
  fromVal.value=qs('#convTo').value;
  doConvert();
}

// ═══════════════════════════════════════════════════════════════
// NEWS
// ═══════════════════════════════════════════════════════════════
async function loadNews() {
  const el=qs('#newsFeed'); if(!el) return;
  el.innerHTML='<div class="spinner" style="margin:40px auto"></div>';
  const feeds=S.settings.newsFeedUrls?.length ? S.settings.newsFeedUrls : ['https://feeds.bbci.co.uk/news/rss.xml','https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml'];
  const items=[];
  for(const url of feeds.slice(0,3)){
    try{
      const r=await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&api_key=&count=10`);
      const d=await r.json();
      if(d.items) {
        items.push(...d.items.slice(0,8).map(i=>{
          const ts = Date.parse(i.pubDate || i.isoDate || '');
          return { title:i.title, url:i.link, source:d.feed?.title||'News', date:i.pubDate, timestamp:Number.isFinite(ts)?ts:null };
        }));
      }
    }catch{}
  }
  items.sort((a,b)=>(b.timestamp||0)-(a.timestamp||0));
  S.newsItems=items;
  if(!items.length){el.innerHTML='<div class="empty-state">No news loaded. Add RSS feed URLs in Settings → News Feed URLs</div>';return;}
  el.innerHTML=items.map(i=>`
    <a class="news-item" href="${esc(i.url)}" target="_blank">
      <div class="ni-title">${esc(i.title)}</div>
      <div style="display:flex;justify-content:space-between;margin-top:5px">
        <span class="ni-source">${esc(i.source)}</span>
        <span class="ni-date">${formatNewsTime(i)}</span>
      </div>
    </a>`).join('');
}

function formatNewsTime(item) {
  if (!item?.timestamp) return item?.date ? String(item.date) : 'Unknown time';
  const relative = relTime(item.timestamp);
  const absolute = new Date(item.timestamp).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  return `${relative} · ${absolute}`;
}

// ═══════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════
function openSearchOverlay() {
  qs('#searchOverlay').style.display='flex';
  const topSearch = qs('#globalSearch');
  const modalSearch = qs('#globalSearchModal');
  if (topSearch?.value && modalSearch) modalSearch.value = topSearch.value;
  if (modalSearch?.value) doSearch(modalSearch.value);
  setTimeout(()=>modalSearch?.focus(),50);
}
function closeSearchOverlay() { qs('#searchOverlay').style.display='none'; qs('#globalSearch').value=''; qs('#globalSearchModal').value=''; }

function doSearch(q) {
  const el=qs('#searchResults'); if(!el) return;
  if(q.length<2){el.innerHTML='';return;}
  const results=[];
  S.todos.filter(t=>t.text.toLowerCase().includes(q.toLowerCase())).forEach(t=>results.push({icon:'✅',text:t.text,sub:'Todo',action:()=>openPanel('todo')}));
  S.notes.filter(n=>n.title.toLowerCase().includes(q.toLowerCase())||n.content.toLowerCase().includes(q.toLowerCase())).forEach(n=>results.push({icon:'📝',text:n.title,sub:'Note',action:()=>{openPanel('notes');setTimeout(()=>openNote(n.id),100);}}));
  S.bookmarks.filter(b=>b.title.toLowerCase().includes(q.toLowerCase())||b.url.toLowerCase().includes(q.toLowerCase())).forEach(b=>results.push({icon:'🔖',text:b.title,sub:b.url,action:()=>window.open(b.url,'_blank')}));
  ALL_PANELS.filter(p=>p.label.toLowerCase().includes(q.toLowerCase())).forEach(p=>results.push({icon:p.icon,text:p.label,sub:'Panel',action:()=>openPanel(p.id)}));
  if(!results.length){el.innerHTML='<div class="empty-state">No results found</div>';return;}
  el.innerHTML=results.slice(0,12).map((r,i)=>`<div class="search-result-item" data-idx="${i}"><span class="sri-type">${r.icon}</span><div><div class="sri-text">${esc(r.text)}</div><div class="sri-sub">${esc(r.sub)}</div></div></div>`).join('');
  el.querySelectorAll('.search-result-item').forEach((item,i)=>item.addEventListener('click',()=>{results[i].action();closeSearchOverlay();}));
}

function openWebSearch(query) {
  const q = encodeURIComponent(query);
  const engine = S.settings.searchEngine || 'google';
  const url = {
    google: `https://www.google.com/search?q=${q}`,
    bing: `https://www.bing.com/search?q=${q}`,
    duckduckgo: `https://duckduckgo.com/?q=${q}`,
    brave: `https://search.brave.com/search?q=${q}`,
    ecosia: `https://www.ecosia.org/search?q=${q}`,
    startpage: `https://www.startpage.com/do/search?q=${q}`,
    kagi: `https://kagi.com/search?q=${q}`,
    perplexity: `https://www.perplexity.ai/search?q=${q}`,
  }[engine] || `https://www.google.com/search?q=${q}`;
  window.open(url, '_blank');
}

// ═══════════════════════════════════════════════════════════════
// QUICK NOTE
// ═══════════════════════════════════════════════════════════════
function openQuickNote() { qs('#quickNoteOverlay').style.display='flex'; setTimeout(()=>qs('#quickNoteText').focus(),50); }

function saveQuickNote() {
  const text=qs('#quickNoteText').value.trim(); if(!text) return;
  S.notes.unshift({id:Date.now(),title:'Quick Note',content:text,createdAt:Date.now(),updatedAt:Date.now(),color:'#6C63FF',pinned:false,folder:'inbox'});
  save('nexusNotes',S.notes);
  qs('#quickNoteOverlay').style.display='none'; qs('#quickNoteText').value='';
  showToast('Note saved 📝','success');
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS (110+ options)
// ═══════════════════════════════════════════════════════════════
function renderSettings() {
  const el=qs('#settingsEmbed'); if(!el) return;
  const s=S.settings;
  el.innerHTML=`
  <div class="settings-container">
    <!-- ── APPEARANCE ── -->
    <div class="settings-group">
      <div class="sg-header">🎨 Appearance</div>

      <div class="s-item"><label>Theme</label>
        <select data-key="theme" class="s-select">
          ${['dark','light','glass','glass-dark','retrowave','neon','ocean','forest','nord','dracula'].map(t=>`<option value="${t}" ${s.theme===t?'selected':''}>${cap(t)}</option>`).join('')}
        </select>
      </div>

      <div class="s-item"><label>Accent Color</label>
        <div style="display:flex;gap:8px;align-items:center">
          <input type="color" data-key="accentColor" value="${s.accentColor}" class="s-color" />
          <div class="accent-presets">
            ${['#6C63FF','#FF6B9D','#00d2d3','#ff6b6b','#4ecdc4','#ffd93d','#ff00cc','#00ff88'].map(c=>`<div class="accent-preset" style="background:${c}" onclick="quickAccent('${c}')"></div>`).join('')}
          </div>
        </div>
      </div>

      <div class="s-item"><label>Font Family</label>
        <select data-key="fontFamily" class="s-select">
          ${['Outfit','Space Mono','Syne','Inter','Roboto Mono','Fira Code','JetBrains Mono','Nunito','Poppins','DM Sans'].map(f=>`<option value="${f}" ${s.fontFamily===f?'selected':''}>${f}</option>`).join('')}
        </select>
      </div>

      <div class="s-item"><label>Custom Font URL</label><input type="url" data-key="customFontUrl" value="${s.customFontUrl||''}" class="s-input" placeholder="https://fonts.googleapis.com/css2?..." /></div>

      <div class="s-item"><label>Font Size</label>
        <select data-key="fontSize" class="s-select">
          ${['small','medium','large','xl'].map(f=>`<option value="${f}" ${s.fontSize===f?'selected':''}>${cap(f)}</option>`).join('')}
        </select>
      </div>

      <div class="s-item"><label>Border Radius</label>
        <select data-key="borderRadius" class="s-select">
          ${['sharp','rounded','pill'].map(r=>`<option value="${r}" ${s.borderRadius===r?'selected':''}>${cap(r)}</option>`).join('')}
        </select>
      </div>

      <div class="s-item"><label>Animation Speed</label>
        <select data-key="animationSpeed" class="s-select">
          ${['none','fast','normal','slow'].map(a=>`<option value="${a}" ${s.animationSpeed===a?'selected':''}>${cap(a)}</option>`).join('')}
        </select>
      </div>

      <div class="s-item"><label>Glass Blur (px)</label><input type="range" data-key="blurIntensity" min="0" max="30" value="${s.blurIntensity}" class="s-range" /></div>
      <div class="s-item"><label>Glass Strength</label><input type="range" data-key="glassStrength" min="0" max="1" step="0.05" value="${s.glassStrength}" class="s-range" /></div>
      <div class="s-item"><label>Color Saturation (%)</label><input type="range" data-key="colorSaturation" min="0" max="200" value="${s.colorSaturation}" class="s-range" /></div>
      <div class="s-item"><label>Brightness Modifier (%)</label><input type="range" data-key="brightnessMod" min="50" max="150" value="${s.brightnessMod}" class="s-range" /></div>
      <div class="s-item"><label>Shadow Intensity</label>
        <select data-key="shadowIntensity" class="s-select">
          ${['none','light','medium','heavy'].map(v=>`<option value="${v}" ${s.shadowIntensity===v?'selected':''}>${cap(v)}</option>`).join('')}
        </select>
      </div>
      <div class="s-item"><label>Panel Spacing</label>
        <select data-key="panelSpacing" class="s-select">
          ${['compact','normal','spacious'].map(v=>`<option value="${v}" ${s.panelSpacing===v?'selected':''}>${cap(v)}</option>`).join('')}
        </select>
      </div>
      <div class="s-item"><label>Icon Style</label>
        <select data-key="iconStyle" class="s-select">
          ${['outlined','filled','duotone','rounded'].map(v=>`<option value="${v}" ${s.iconStyle===v?'selected':''}>${cap(v)}</option>`).join('')}
        </select>
      </div>
      <div class="s-item toggle-item"><label>Show Icon Labels</label><label class="toggle"><input type="checkbox" data-key="showIconLabels" ${s.showIconLabels?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Noise Texture</label><label class="toggle"><input type="checkbox" data-key="noiseTexture" ${s.noiseTexture?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Compact Mode</label><label class="toggle"><input type="checkbox" data-key="compactMode" ${s.compactMode?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Show Status Bar</label><label class="toggle"><input type="checkbox" data-key="showStatusBar" ${s.showStatusBar?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item"><label>Custom Background URL</label><input type="url" data-key="customBgUrl" value="${s.customBgUrl||''}" class="s-input" placeholder="https://..." /></div>
      <div class="s-item"><label>Custom Background Color</label><input type="color" data-key="customBgColor" value="${s.customBgColor||'#0a0a0f'}" class="s-color" /></div>
      <div class="s-item toggle-item"><label>Gradient Overlay</label><label class="toggle"><input type="checkbox" data-key="showGradientOverlay" ${s.showGradientOverlay?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item"><label>Theme Schedule (auto switch)</label><label class="toggle"><input type="checkbox" data-key="themeSchedule" ${s.themeSchedule?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item"><label>Light theme from</label><input type="time" data-key="themeScheduleLight" value="${s.themeScheduleLight}" class="s-input short" /></div>
      <div class="s-item"><label>Dark theme from</label><input type="time" data-key="themeScheduleDark" value="${s.themeScheduleDark}" class="s-input short" /></div>
      <div class="s-item"><label>Custom CSS</label><textarea data-key="customCSS" class="s-textarea" placeholder="/* custom styles */">${s.customCSS||''}</textarea></div>
    </div>

    <!-- ── SIDEBAR LAYOUT ── -->
    <div class="settings-group">
      <div class="sg-header">📐 Sidebar Layout</div>
      <div class="s-item"><label>Startup Panel</label>
        <select data-key="startupPanel" class="s-select">
          ${ALL_PANELS.map(p=>`<option value="${p.id}" ${s.startupPanel===p.id?'selected':''}>${p.icon} ${p.label}</option>`).join('')}
        </select>
      </div>
      <div class="s-item"><label>Sidebar Position</label>
        <select data-key="sidebarPosition" class="s-select">
          ${['left','right'].map(v=>`<option value="${v}" ${s.sidebarPosition===v?'selected':''}>${cap(v)}</option>`).join('')}
        </select>
      </div>
      <div class="s-item toggle-item"><label>Draggable Widgets</label><label class="toggle"><input type="checkbox" data-key="draggableWidgets" ${s.draggableWidgets?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Widget Borders</label><label class="toggle"><input type="checkbox" data-key="widgetBorders" ${s.widgetBorders?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Widget Animations</label><label class="toggle"><input type="checkbox" data-key="widgetAnimation" ${s.widgetAnimation?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Auto-hide Sidebar</label><label class="toggle"><input type="checkbox" data-key="autoHideSidebar" ${s.autoHideSidebar?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Close on Outside Click</label><label class="toggle"><input type="checkbox" data-key="closeOnOutsideClick" ${s.closeOnOutsideClick?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Open on New Tab</label><label class="toggle"><input type="checkbox" data-key="openOnNewTab" ${s.openOnNewTab?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Keyboard Shortcuts</label><label class="toggle"><input type="checkbox" data-key="keyboardShortcuts" ${s.keyboardShortcuts?'checked':''}/><span class="toggle-slider"></span></label></div>
    </div>

    <!-- ── GREETING & IDENTITY ── -->
    <div class="settings-group">
      <div class="sg-header">👤 Identity & Greeting</div>
      <div class="s-item toggle-item"><label>Show Greeting</label><label class="toggle"><input type="checkbox" data-key="showGreeting" ${s.showGreeting?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item"><label>Your Name</label><input type="text" data-key="greetingName" value="${s.greetingName||''}" class="s-input" placeholder="What should we call you?" /></div>
    </div>

    <!-- ── CLOCK ── -->
    <div class="settings-group">
      <div class="sg-header">⏱ Clock</div>
      <div class="s-item"><label>Clock Format</label>
        <select data-key="clockFormat" class="s-select">
          <option value="12h" ${s.clockFormat==='12h'?'selected':''}>12h (AM/PM)</option>
          <option value="24h" ${s.clockFormat==='24h'?'selected':''}>24h</option>
        </select>
      </div>
      <div class="s-item toggle-item"><label>Show Seconds</label><label class="toggle"><input type="checkbox" data-key="showSeconds" ${s.showSeconds?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Show Date</label><label class="toggle"><input type="checkbox" data-key="showDate" ${s.showDate?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Show Day of Week</label><label class="toggle"><input type="checkbox" data-key="showDayOfWeek" ${s.showDayOfWeek?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Show Week Number</label><label class="toggle"><input type="checkbox" data-key="showWeekNumber" ${s.showWeekNumber?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Blinking Separator</label><label class="toggle"><input type="checkbox" data-key="blinkingSeparator" ${s.blinkingSeparator?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Show Milliseconds</label><label class="toggle"><input type="checkbox" data-key="showMilliseconds" ${s.showMilliseconds?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item"><label>Clock Style</label>
        <select data-key="clockStyle" class="s-select">
          ${['digital','analog','both'].map(v=>`<option value="${v}" ${s.clockStyle===v?'selected':''}>${cap(v)}</option>`).join('')}
        </select>
      </div>
    </div>

    <!-- ── POMODORO ── -->
    <div class="settings-group">
      <div class="sg-header">🍅 Pomodoro</div>
      <div class="s-item"><label>Work Duration (min)</label><input type="number" data-key="pomodoroWork" value="${s.pomodoroWork}" min="1" max="120" class="s-input short" /></div>
      <div class="s-item"><label>Short Break (min)</label><input type="number" data-key="pomodoroShortBreak" value="${s.pomodoroShortBreak}" min="1" max="60" class="s-input short" /></div>
      <div class="s-item"><label>Long Break (min)</label><input type="number" data-key="pomodoroLongBreak" value="${s.pomodoroLongBreak}" min="1" max="60" class="s-input short" /></div>
      <div class="s-item"><label>Sessions before Long Break</label><input type="number" data-key="pomodoroSessionsBeforeLong" value="${s.pomodoroSessionsBeforeLong}" min="1" max="12" class="s-input short" /></div>
      <div class="s-item toggle-item"><label>Auto-start Break</label><label class="toggle"><input type="checkbox" data-key="pomodoroAutoBreak" ${s.pomodoroAutoBreak?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Auto-start Work</label><label class="toggle"><input type="checkbox" data-key="pomodoroAutoWork" ${s.pomodoroAutoWork?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item"><label>Timer Sound</label>
        <select data-key="pomodoroSound" class="s-select">
          ${['bell','chime','gong','ding','buzz','none'].map(v=>`<option value="${v}" ${s.pomodoroSound===v?'selected':''}>${cap(v)}</option>`).join('')}
        </select>
      </div>
      <div class="s-item toggle-item"><label>Focus Mode</label><label class="toggle"><input type="checkbox" data-key="focusModeEnabled" ${s.focusModeEnabled?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item"><label>Daily Goal (sessions)</label><input type="number" data-key="dailyGoal" value="${s.dailyGoal}" min="1" max="20" class="s-input short" /></div>
      <div class="s-item toggle-item"><label>Show Productivity Score</label><label class="toggle"><input type="checkbox" data-key="showProductivityScore" ${s.showProductivityScore?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item"><label>Work Hours Start</label><input type="time" data-key="workHoursStart" value="${s.workHoursStart}" class="s-input short" /></div>
      <div class="s-item"><label>Work Hours End</label><input type="time" data-key="workHoursEnd" value="${s.workHoursEnd}" class="s-input short" /></div>
    </div>

    <!-- ── TASKS ── -->
    <div class="settings-group">
      <div class="sg-header">✅ Tasks</div>
      <div class="s-item toggle-item"><label>Task Priorities</label><label class="toggle"><input type="checkbox" data-key="taskPrioritiesEnabled" ${s.taskPrioritiesEnabled?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item"><label>Default Priority</label>
        <select data-key="defaultPriority" class="s-select">
          ${['low','medium','high','critical'].map(v=>`<option value="${v}" ${s.defaultPriority===v?'selected':''}>${cap(v)}</option>`).join('')}
        </select>
      </div>
      <div class="s-item toggle-item"><label>Due Date Reminders</label><label class="toggle"><input type="checkbox" data-key="todoDueReminders" ${s.todoDueReminders?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Quick Note Enabled</label><label class="toggle"><input type="checkbox" data-key="quickNoteEnabled" ${s.quickNoteEnabled?'checked':''}/><span class="toggle-slider"></span></label></div>
    </div>

    <!-- ── WEATHER ── -->
    <div class="settings-group">
      <div class="sg-header">🌤 Weather</div>
      <div class="s-item"><label>Default Location</label><input type="text" data-key="weatherLocation" value="${s.weatherLocation||''}" class="s-input" placeholder="City name or 'auto'" /></div>
      <div class="s-item"><label>Temperature Unit</label>
        <select data-key="weatherUnit" class="s-select">
          <option value="fahrenheit" ${s.weatherUnit==='fahrenheit'?'selected':''}>Fahrenheit (°F)</option>
          <option value="celsius" ${s.weatherUnit==='celsius'?'selected':''}>Celsius (°C)</option>
        </select>
      </div>
      <div class="s-item"><label>Wind Speed Unit</label>
        <select data-key="windSpeedUnit" class="s-select">
          <option value="mph" ${s.windSpeedUnit==='mph'?'selected':''}>MPH</option>
          <option value="kmh" ${s.windSpeedUnit==='kmh'?'selected':''}>KM/H</option>
          <option value="knots" ${s.windSpeedUnit==='knots'?'selected':''}>Knots</option>
        </select>
      </div>
      <div class="s-item"><label>Forecast Days (1-7)</label><input type="number" data-key="weatherForecastDays" value="${s.weatherForecastDays}" min="1" max="7" class="s-input short" /></div>
      <div class="s-item"><label>Update Interval (min)</label><input type="number" data-key="weatherUpdateInterval" value="${s.weatherUpdateInterval}" min="5" max="180" class="s-input short" /></div>
      <div class="s-item"><label>OpenWeatherMap API Key</label><input type="text" data-key="weatherApiKey" value="${s.weatherApiKey||''}" class="s-input" placeholder="Optional — for premium data" /></div>
    </div>

    <!-- ── NOTIFICATIONS ── -->
    <div class="settings-group">
      <div class="sg-header">🔔 Notifications</div>
      <div class="s-item toggle-item"><label>Enable Notifications</label><label class="toggle"><input type="checkbox" data-key="notificationsEnabled" ${s.notificationsEnabled?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item"><label>Notification Sound</label>
        <select data-key="notificationSound" class="s-select">
          ${['chime','bell','ding','pop','none'].map(v=>`<option value="${v}" ${s.notificationSound===v?'selected':''}>${cap(v)}</option>`).join('')}
        </select>
      </div>
      <div class="s-item"><label>Volume (%)</label><input type="range" data-key="notificationVolume" min="0" max="100" value="${s.notificationVolume}" class="s-range" /></div>
      <div class="s-item toggle-item"><label>Pomodoro Notifications</label><label class="toggle"><input type="checkbox" data-key="pomodoroNotifications" ${s.pomodoroNotifications?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Habit Reminders</label><label class="toggle"><input type="checkbox" data-key="habitReminders" ${s.habitReminders?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item"><label>Habit Reminder Time</label><input type="time" data-key="habitReminderTime" value="${s.habitReminderTime}" class="s-input short" /></div>
      <div class="s-item toggle-item"><label>Daily Summary</label><label class="toggle"><input type="checkbox" data-key="dailySummaryNotification" ${s.dailySummaryNotification?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item"><label>Sound Theme</label>
        <select data-key="soundTheme" class="s-select">
          ${['default','nature','minimal','retro','space'].map(v=>`<option value="${v}" ${s.soundTheme===v?'selected':''}>${cap(v)}</option>`).join('')}
        </select>
      </div>
    </div>

    <!-- ── QUICK SITES ── -->
    <div class="settings-group">
      <div class="sg-header">🚀 Quick Launch Sites</div>
      <p style="font-size:11px;color:var(--text-muted);margin-bottom:10px">Customize the 8 quick-launch sites shown on your dashboard</p>
      ${(s.quickSites||[]).slice(0,8).map((site,i)=>`
        <div class="s-item" style="gap:6px;flex-wrap:wrap">
          <span style="font-size:11px;color:var(--text-muted);width:20px">${i+1}.</span>
          <input type="text" class="s-input short qs-icon-inp" data-qs-idx="${i}" data-qs-field="icon" value="${esc(site.icon||'')}" placeholder="Icon" style="width:50px" />
          <input type="text" class="s-input qs-name-inp" data-qs-idx="${i}" data-qs-field="name" value="${esc(site.name)}" placeholder="Name" style="flex:1;min-width:80px" />
          <input type="url" class="s-input qs-url-inp" data-qs-idx="${i}" data-qs-field="url" value="${esc(site.url)}" placeholder="URL" style="flex:2;min-width:120px" />
        </div>`).join('')}
      <button onclick="saveQuickSiteSettings()" class="primary-btn" style="margin-top:8px">Save Sites</button>
    </div>

    <!-- ── NEWS FEEDS ── -->
    <div class="settings-group">
      <div class="sg-header">📡 News Feed URLs</div>
      <p style="font-size:11px;color:var(--text-muted);margin-bottom:8px">Add RSS/Atom feed URLs, one per line</p>
      <textarea data-key="newsFeedUrls_raw" class="s-textarea" placeholder="https://feeds.bbci.co.uk/news/rss.xml&#10;https://...">${(s.newsFeedUrls||[]).join('\n')}</textarea>
      <button onclick="saveNewsFeedUrls()" class="action-btn" style="margin-top:6px">Save Feed URLs</button>
    </div>

    <!-- ── SEARCH ── -->
    <div class="settings-group">
      <div class="sg-header">🔍 Search</div>
      <div class="s-item"><label>Search Engine</label>
        <select data-key="searchEngine" class="s-select">
          ${['google','bing','duckduckgo','brave','ecosia','startpage','kagi','perplexity'].map(v=>`<option value="${v}" ${s.searchEngine===v?'selected':''}>${cap(v)}</option>`).join('')}
        </select>
      </div>
    </div>

    <!-- ── PRIVACY & DATA ── -->
    <div class="settings-group">
      <div class="sg-header">🔒 Privacy & Data</div>
      <div class="s-item toggle-item"><label>Sync Across Devices</label><label class="toggle"><input type="checkbox" data-key="syncEnabled" ${s.syncEnabled?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Local Storage Only</label><label class="toggle"><input type="checkbox" data-key="localStorageOnly" ${s.localStorageOnly?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Anonymous Analytics</label><label class="toggle"><input type="checkbox" data-key="anonymousAnalytics" ${s.anonymousAnalytics?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Password Protect</label><label class="toggle"><input type="checkbox" data-key="passwordProtect" ${s.passwordProtect?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Incognito Detection</label><label class="toggle"><input type="checkbox" data-key="incognitoDetection" ${s.incognitoDetection?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item"><label>Data Retention (days)</label><input type="number" data-key="dataRetentionDays" value="${s.dataRetentionDays}" min="1" max="3650" class="s-input short" /></div>
      <div class="s-item"><label>Auto Backup</label>
        <select data-key="autoBackupInterval" class="s-select">
          ${['never','daily','weekly','monthly'].map(v=>`<option value="${v}" ${s.autoBackupInterval===v?'selected':''}>${cap(v)}</option>`).join('')}
        </select>
      </div>
    </div>

    <!-- ── ADVANCED ── -->
    <div class="settings-group">
      <div class="sg-header">⚡ Advanced</div>
      <div class="s-item toggle-item"><label>Performance Mode</label><label class="toggle"><input type="checkbox" data-key="performanceMode" ${s.performanceMode?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Hardware Acceleration</label><label class="toggle"><input type="checkbox" data-key="hardwareAcceleration" ${s.hardwareAcceleration?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Lazy Load Widgets</label><label class="toggle"><input type="checkbox" data-key="lazyLoadWidgets" ${s.lazyLoadWidgets?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Beta Features</label><label class="toggle"><input type="checkbox" data-key="betaFeatures" ${s.betaFeatures?'checked':''}/><span class="toggle-slider"></span></label></div>
      <div class="s-item toggle-item"><label>Debug Mode</label><label class="toggle"><input type="checkbox" data-key="debugMode" ${s.debugMode?'checked':''}/><span class="toggle-slider"></span></label></div>
    </div>

    <!-- ── DATA MANAGEMENT ── -->
    <div class="settings-group">
      <div class="sg-header">💾 Data Management</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <button onclick="exportData()" class="action-btn">📤 Export All Data</button>
        <button onclick="importDataFile()" class="action-btn">📥 Import Data</button>
        <button onclick="clearAllData()" class="action-btn" style="color:var(--red);border-color:var(--red)">🗑 Clear All Data</button>
        <button onclick="resetSettings()" class="action-btn">↺ Reset Settings</button>
      </div>
      <div style="margin-top:10px;font-size:11px;color:var(--text-muted)">
        ${S.todos.length} todos · ${S.notes.length} notes · ${S.habits.length} habits · ${S.bookmarks.length} bookmarks
      </div>
    </div>

    <!-- ── ABOUT ── -->
    <div class="settings-group" style="text-align:center;padding-bottom:20px">
      <div class="sg-header">ℹ About</div>
      <div class="nav-logo" style="margin:12px auto;width:48px;height:48px">
        <svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="url(#lg2)"/><path d="M8 10h6l4 12 4-12h6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="22" r="2" fill="white"/><defs><linearGradient id="lg2" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#6C63FF"/><stop offset="1" stop-color="#FF6B9D"/></linearGradient></defs></svg>
      </div>
      <p style="font-size:15px;font-weight:800;font-family:var(--font-display)">Nexus Sidebar</p>
      <p style="font-size:12px;color:var(--text-muted)">Version 1.0.0 · Built for Opera GX & Chrome</p>
      <p style="font-size:11px;color:var(--text-muted);margin-top:6px">Your ultimate productivity companion</p>
      <div style="margin-top:12px;display:flex;justify-content:center;gap:8px">
        <a href="#" class="action-btn" onclick="showToast('Thank you! 🙏','success')">❤️ Rate Extension</a>
      </div>
    </div>
  </div>`;

  // Bind settings inputs
  el.querySelectorAll('[data-key]').forEach(inp => {
    const key=inp.dataset.key;
    inp.addEventListener('change', () => {
      if (inp.type==='checkbox') { saveSetting(key, inp.checked); applyTheme(); }
      else if (inp.type==='range') { saveSetting(key, parseFloat(inp.value)); applyTheme(); }
      else { saveSetting(key, inp.value); applyTheme(); }
    });
    if (inp.type==='color') inp.addEventListener('input', () => { saveSetting(key, inp.value); applyTheme(); });
    if (inp.tagName==='INPUT'&&inp.type!=='checkbox'&&inp.type!=='range'&&inp.type!=='color') {
      inp.addEventListener('input', () => { saveSetting(key, inp.value); applyTheme(); });
    }
  });
}

window.quickAccent = function(c) { saveSetting('accentColor',c); applyTheme(); };
window.saveQuickSiteSettings = function() {
  const sites=[];
  qsa('.qs-icon-inp').forEach((inp,i)=>{
    sites.push({ icon:inp.value, name:qsa('.qs-name-inp')[i]?.value||'', url:qsa('.qs-url-inp')[i]?.value||'' });
  });
  saveSetting('quickSites', sites); renderQuickSites(); showToast('Quick sites saved!','success');
};
window.saveNewsFeedUrls = function() {
  const raw=qs('[data-key="newsFeedUrls_raw"]')?.value||'';
  const urls=raw.split('\n').map(u=>u.trim()).filter(Boolean);
  saveSetting('newsFeedUrls',urls); showToast('Feed URLs saved!','success');
};
window.exportData = function() {
  const d={settings:S.settings,todos:S.todos,notes:S.notes,habits:S.habits,bookmarks:S.bookmarks,events:S.calEvents,exportDate:Date.now(),version:'1.0.0'};
  const blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='nexus-backup.json'; a.click();
  showToast('Data exported!','success');
};
window.importDataFile = function() {
  const input=document.createElement('input'); input.type='file'; input.accept='.json';
  input.onchange=async e=>{
    const file=e.target.files[0]; if(!file) return;
    try{
      const text=await file.text(); const d=JSON.parse(text);
      if(d.todos) S.todos=d.todos; if(d.notes) S.notes=d.notes;
      if(d.habits) S.habits=d.habits; if(d.bookmarks) S.bookmarks=d.bookmarks;
      if(d.settings) S.settings={...DEFAULTS,...d.settings};
      save('nexusTodos',S.todos); save('nexusNotes',S.notes); save('nexusHabits',S.habits); save('nexusBookmarks',S.bookmarks); save('nexusSettings',S.settings);
      applyTheme(); showToast('Data imported! ✓','success');
    }catch{showToast('Invalid file','error');}
  };
  input.click();
};
window.clearAllData = function() {
  if(!confirm('Clear ALL data? This cannot be undone!')) return;
  S.todos=[]; S.notes=[]; S.habits=defaultHabits(); S.bookmarks=defaultBookmarks();
  save('nexusTodos',[]); save('nexusNotes',[]); save('nexusHabits',S.habits); save('nexusBookmarks',S.bookmarks);
  renderTodos(); renderNotesList(); renderHabits(); renderBookmarks();
  showToast('All data cleared','info');
};
window.resetSettings = function() {
  if(!confirm('Reset all settings to defaults?')) return;
  S.settings={...DEFAULTS}; save('nexusSettings',S.settings); applyTheme(); renderSettings(); showToast('Settings reset','info');
};

// Color helpers
function buildColorOptions(containerId) {
  const el=qs('#'+containerId); if(!el) return;
  const colors=['#6C63FF','#FF6B9D','#4ecdc4','#ffd93d','#ff6b6b','#45aaf2','#fd9644','#26de81','#a29bfe','#fd79a8','#00b894','#e17055'];
  el.innerHTML=colors.map(c=>`<div class="ev-color-opt" style="background:${c}" onclick="selectColor(this,'${containerId}')"></div>`).join('');
}
window.selectColor = function(el, containerId) { qs('#'+containerId+' .ev-color-opt.selected')?.classList.remove('selected'); el.classList.add('selected'); };

// Quick sites edit
function editQuickSites() { openPanel('settings'); setTimeout(()=>{ const el=qs('.settings-container'); if(el) el.querySelector('[data-key="quickSites"]')?.scrollIntoView({behavior:'smooth'}); },200); }
function exitFocus() { qs('#focusOverlay').style.display='none'; }

// ═══════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════
window.showToast = function(msg, type='info') {
  const tc=qs('#toastContainer'); if(!tc) return;
  const toast=document.createElement('div');
  toast.className=`toast ${type}`;
  toast.textContent=msg;
  tc.appendChild(toast);
  setTimeout(()=>{toast.style.opacity='0'; toast.style.transform='translateX(20px)'; setTimeout(()=>toast.remove(),300);},2800);
};

// ═══════════════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════════════
const qs  = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);
const cap = s => s?s[0].toUpperCase()+s.slice(1):'';
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const pad = n => String(n).padStart(2,'0');
const stripHTML = h => h.replace(/<[^>]*>/g,'');
const fmtDate = d => d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
const fmtTime = d => d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
const fmtDue  = ts => { const d=new Date(ts); return d.toLocaleDateString('en-US',{month:'short',day:'numeric'})+' '+fmtTime(d); };
const secToMS = s => { const m=Math.floor(s/60); return `${pad(m)}:${pad(s%60)}`; };
const msToHMS = ms => { const t=Math.floor(ms/1000); const h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60,ms2=Math.floor((ms%1000)/10); return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms2)}`; };
const toDatetimeLocal = d => { const p=n=>pad(n); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
const getWeekNum = d => { const j=new Date(d.getFullYear(),0,1); return Math.ceil((((d-j)/86400000)+j.getDay()+1)/7); };
function relTime(ts) {
  if (!Number.isFinite(ts)) return '';
  const s=Math.floor((Date.now()-ts)/1000);
  if (Math.abs(s) < 60) return 'just now';
  if (s < 0) {
    const f = Math.abs(s);
    if (f < 3600) return `in ${Math.floor(f/60)}m`;
    if (f < 86400) return `in ${Math.floor(f/3600)}h`;
    return `in ${Math.floor(f/86400)}d`;
  }
  if(s<3600)return`${Math.floor(s/60)}m ago`;
  if(s<86400)return`${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}
function bestStreak() { return Math.max(0,...S.habits.map(h=>h.streak||0), S.settings.currentStreak||0); }
function doneHabitsToday2() { return doneHabitsToday(); }

// Color math
function hexToRgb(hex){ const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return [r,g,b]; }
function rgbToHsl(r,g,b){ r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b);let h,s,l=(max+min)/2;if(max===min){h=s=0;}else{const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break;}h/=6;}return[Math.round(h*360),Math.round(s*100),Math.round(l*100)];}
function rgbToCmyk(r,g,b){ r/=255;g/=255;b/=255;const k=1-Math.max(r,g,b);if(k===1)return[0,0,0,100];const c=(1-r-k)/(1-k),m=(1-g-k)/(1-k),y=(1-b-k)/(1-k);return[Math.round(c*100),Math.round(m*100),Math.round(y*100),Math.round(k*100)];}
function hslToHex(h,s,l){ s/=100;l/=100;const a=s*Math.min(l,1-l);const f=n=>{const k=(n+h/30)%12;const c=l-a*Math.max(Math.min(k-3,9-k,1),-1);return Math.round(255*c).toString(16).padStart(2,'0');}; return `#${f(0)}${f(8)}${f(4)}`;}
function hexA(hex,a){ const [r,g,b]=hexToRgb(hex); return `rgba(${r},${g},${b},${a})`;}
function lighten(hex,amt){ const [r,g,b]=hexToRgb(hex); return `#${[r,g,b].map(c=>Math.min(255,c+amt*2.55).toString(16).padStart(2,'0')).join('')}`;}
function darken(hex,amt){ const [r,g,b]=hexToRgb(hex); return `#${[r,g,b].map(c=>Math.max(0,c-amt*2.55).toString(16).padStart(2,'0')).join('')}`;}
function contrastRatio(bg,fg){ const lum=h=>{const [r,g,b]=hexToRgb(h).map(c=>{c/=255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);});return 0.2126*r+0.7152*g+0.0722*b;}; const l1=lum(bg),l2=lum(fg);const [hi,lo]=l1>l2?[l1,l2]:[l2,l1];return +((hi+0.05)/(lo+0.05)).toFixed(2);}

// Default data
function defaultHabits(){return[{id:1,name:'Meditation',icon:'🧘',color:'#6C63FF',streak:0,completedDates:[],frequency:'daily',category:'mindfulness',goal:'10 min',createdAt:Date.now()},{id:2,name:'Exercise',icon:'🏃',color:'#4ecdc4',streak:0,completedDates:[],frequency:'daily',category:'fitness',goal:'30 min',createdAt:Date.now()},{id:3,name:'Read',icon:'📚',color:'#f7b731',streak:0,completedDates:[],frequency:'daily',category:'learning',goal:'20 pages',createdAt:Date.now()},{id:4,name:'Drink Water',icon:'💧',color:'#45aaf2',streak:0,completedDates:[],frequency:'daily',category:'health',goal:'8 glasses',createdAt:Date.now()},{id:5,name:'Gratitude',icon:'📓',color:'#fd9644',streak:0,completedDates:[],frequency:'daily',category:'mindfulness',goal:'3 items',createdAt:Date.now()}];}
function defaultBookmarks(){return[{id:1,title:'Gmail',url:'https://mail.google.com',favicon:'',folder:'general',tags:[],createdAt:Date.now()},{id:2,title:'Spotify',url:'https://open.spotify.com',favicon:'',folder:'media',tags:[],createdAt:Date.now()},{id:3,title:'YouTube',url:'https://youtube.com',favicon:'',folder:'general',tags:[],createdAt:Date.now()},{id:4,title:'MDN Docs',url:'https://developer.mozilla.org',favicon:'',folder:'dev',tags:[],createdAt:Date.now()}];}

// Alarm check
function checkAlarms(){ /* Future: due-todo checks, habit reminders */ }

// Start!
document.addEventListener('DOMContentLoaded', init);
