// Nexus Sidebar - Background Service Worker
// Handles alarms, context menus, keyboard shortcuts, and side panel management

'use strict';

// ─── Side Panel Setup ────────────────────────────────────────────────────────
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

// ─── Install / Update Handler ─────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await initDefaultSettings();
    chrome.tabs.create({ url: 'sidebar/welcome.html' });
  } else if (details.reason === 'update') {
    await migrateSettings(details.previousVersion);
  }
  setupContextMenus();
  setupAlarms();
});

// ─── Default Settings ─────────────────────────────────────────────────────────
async function initDefaultSettings() {
  const defaults = {
    // Appearance
    theme: 'dark',
    accentColor: '#6C63FF',
    fontFamily: 'Outfit',
    fontSize: 'medium',
    borderRadius: 'rounded',
    animationSpeed: 'normal',
    sidebarWidth: 380,
    blurIntensity: 12,
    bgOpacity: 0.85,
    customBgUrl: '',
    customBgColor: '#0a0a0f',
    showGradientOverlay: true,
    panelSpacing: 'normal',
    iconStyle: 'outlined',
    iconSize: 'medium',
    showIconLabels: false,
    customCSS: '',
    shadowIntensity: 'medium',
    glassStrength: 0.15,
    noiseTexture: true,
    colorSaturation: 100,
    brightnessMod: 100,
    contrastMod: 100,
    customFontUrl: '',
    themeSchedule: false,
    themeScheduleLight: '07:00',
    themeScheduleDark: '19:00',

    // Widgets visibility
    widgetClock: true,
    widgetCalendar: true,
    widgetTodo: true,
    widgetNotes: true,
    widgetWeather: true,
    widgetPomodoro: true,
    widgetBookmarks: true,
    widgetHabits: true,
    widgetCalculator: true,
    widgetNews: false,
    widgetPassword: true,
    widgetColorPicker: true,
    widgetUnitConverter: true,
    widgetWorldClock: false,
    widgetMusicControls: true,
    widgetLayout: 'grid',
    widgetAnimation: true,
    widgetsCollapsed: false,
    widgetBorders: true,
    widgetOrder: ['dashboard','todo','notes','calendar','pomodoro','bookmarks','weather','clock','calculator','habits','password','colorpicker','news','settings'],

    // Clock & Time
    clockFormat: '12h',
    showSeconds: true,
    showDate: true,
    dateFormat: 'MMM DD, YYYY',
    showDayOfWeek: true,
    clockStyle: 'digital',
    timezone: 'local',
    showMilliseconds: false,
    blinkingSeparator: true,
    showWeekNumber: false,

    // Productivity
    pomodoroWork: 25,
    pomodoroShortBreak: 5,
    pomodoroLongBreak: 15,
    pomodoroSessionsBeforeLong: 4,
    pomodoroAutoBreak: false,
    pomodoroAutoWork: false,
    pomodoroSound: 'bell',
    focusModeEnabled: false,
    focusBlockedSites: ['facebook.com', 'twitter.com', 'reddit.com', 'youtube.com'],
    dailyGoal: 10,
    showProductivityScore: true,
    workHoursStart: '09:00',
    workHoursEnd: '17:00',
    taskPrioritiesEnabled: true,
    defaultPriority: 'medium',

    // Weather
    weatherLocation: 'auto',
    weatherUnit: 'fahrenheit',
    weatherUpdateInterval: 30,
    weatherForecastDays: 5,
    windSpeedUnit: 'mph',
    weatherApiKey: '',

    // Notifications
    notificationsEnabled: true,
    notificationSound: 'chime',
    notificationVolume: 70,
    todoDueReminders: true,
    pomodoroNotifications: true,
    habitReminderTime: '20:00',
    dailySummaryNotification: false,
    browserNotificationPermission: true,
    notificationPosition: 'top-right',
    soundTheme: 'default',

    // Quick Launch Sites
    quickSite1: { name: 'Gmail', url: 'https://mail.google.com', icon: '📧' },
    quickSite2: { name: 'Drive', url: 'https://drive.google.com', icon: '📁' },
    quickSite3: { name: 'Weather', url: 'https://weather.com', icon: '⛅' },
    quickSite4: { name: 'YouTube', url: 'https://youtube.com', icon: '▶️' },
    quickSite5: { name: 'Notion', url: 'https://notion.so', icon: '📓' },
    quickSite6: { name: 'Spotify', url: 'https://open.spotify.com', icon: '🎵' },
    quickSite7: { name: 'Twitter', url: 'https://twitter.com', icon: '🐦' },
    quickSite8: { name: 'Reddit', url: 'https://reddit.com', icon: '🤖' },

    // Privacy & Data
    syncEnabled: false,
    dataRetentionDays: 365,
    anonymousAnalytics: false,
    autoBackupInterval: 'weekly',
    passwordProtect: false,
    incognitoDetection: true,
    localStorageOnly: true,

    // Advanced
    performanceMode: false,
    hardwareAcceleration: true,
    lazyLoadWidgets: false,
    debugMode: false,
    betaFeatures: false,
    keyboardShortcuts: true,
    openOnNewTab: false,
    closeOnOutsideClick: false,
    autoHideSidebar: false,
    sidebarPosition: 'right',
    startupPanel: 'dashboard',
    showGreeting: true,
    greetingName: '',
    newsFeedUrls: [],
    habitsList: [],
    customIconPack: 'default',
    searchEngine: 'google',
    quickNoteEnabled: true,
    draggableWidgets: true,
    showStatusBar: true,
    compactMode: false,

    // Internal
    version: '1.0.0',
    installDate: Date.now(),
    totalFocusMinutes: 0,
    totalTasksCompleted: 0,
    currentStreak: 0,
    lastActiveDate: null
  };

  await chrome.storage.local.set({ nexusSettings: defaults, nexusTodos: [], nexusNotes: [], nexusHabits: [] });
}

// ─── Settings Migration ────────────────────────────────────────────────────────
async function migrateSettings(prevVersion) {
  // Future migration logic
  console.log(`Migrated from ${prevVersion} to 1.0.0`);
}

// ─── Context Menus ─────────────────────────────────────────────────────────────
function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'nexus-add-todo',
      title: 'Add to Nexus Todo',
      contexts: ['selection']
    });
    chrome.contextMenus.create({
      id: 'nexus-add-note',
      title: 'Save to Nexus Notes',
      contexts: ['selection']
    });
    chrome.contextMenus.create({
      id: 'nexus-add-bookmark',
      title: 'Add to Nexus Bookmarks',
      contexts: ['page', 'link']
    });
    chrome.contextMenus.create({
      id: 'nexus-separator',
      type: 'separator',
      contexts: ['selection', 'page', 'link']
    });
    chrome.contextMenus.create({
      id: 'nexus-open',
      title: 'Open Nexus Sidebar',
      contexts: ['page']
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case 'nexus-add-todo':
      await addTodoFromContext(info.selectionText, tab);
      break;
    case 'nexus-add-note':
      await addNoteFromContext(info.selectionText, tab);
      break;
    case 'nexus-add-bookmark':
      await addBookmarkFromContext(info, tab);
      break;
    case 'nexus-open':
      chrome.sidePanel.open({ tabId: tab.id });
      break;
  }
});

async function addTodoFromContext(text, tab) {
  const data = await chrome.storage.local.get('nexusTodos');
  const todos = data.nexusTodos || [];
  todos.push({
    id: Date.now(),
    text: text.slice(0, 200),
    completed: false,
    priority: 'medium',
    createdAt: Date.now(),
    source: tab.url
  });
  await chrome.storage.local.set({ nexusTodos: todos });
  showBadgeFlash();
}

async function addNoteFromContext(text, tab) {
  const data = await chrome.storage.local.get('nexusNotes');
  const notes = data.nexusNotes || [];
  notes.unshift({
    id: Date.now(),
    title: `Note from ${new URL(tab.url).hostname}`,
    content: text,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    color: '#6C63FF',
    pinned: false,
    folder: 'inbox'
  });
  await chrome.storage.local.set({ nexusNotes: notes });
}

async function addBookmarkFromContext(info, tab) {
  const data = await chrome.storage.local.get('nexusBookmarks');
  const bookmarks = data.nexusBookmarks || [];
  bookmarks.unshift({
    id: Date.now(),
    title: info.linkText || tab.title,
    url: info.linkUrl || tab.url,
    favicon: `https://www.google.com/s2/favicons?domain=${new URL(info.linkUrl || tab.url).hostname}&sz=32`,
    createdAt: Date.now(),
    folder: 'general',
    tags: []
  });
  await chrome.storage.local.set({ nexusBookmarks: bookmarks });
}

// ─── Alarms ────────────────────────────────────────────────────────────────────
function setupAlarms() {
  chrome.alarms.create('nexus-check-todos', { periodInMinutes: 5 });
  chrome.alarms.create('nexus-check-habits', { periodInMinutes: 60 });
  chrome.alarms.create('nexus-daily-summary', {
    when: getNextTime('20:00'),
    periodInMinutes: 1440
  });
  chrome.alarms.create('nexus-theme-schedule', { periodInMinutes: 1 });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    case 'nexus-check-todos':
      await checkDueTodos();
      break;
    case 'nexus-check-habits':
      await checkHabitReminders();
      break;
    case 'nexus-daily-summary':
      await sendDailySummary();
      break;
    case 'nexus-theme-schedule':
      await checkThemeSchedule();
      break;
  }
});

async function checkDueTodos() {
  const { nexusTodos, nexusSettings } = await chrome.storage.local.get(['nexusTodos', 'nexusSettings']);
  if (!nexusSettings?.todoDueReminders) return;
  const now = Date.now();
  const upcoming = (nexusTodos || []).filter(t =>
    !t.completed && t.dueDate && t.dueDate - now < 3600000 && t.dueDate > now
  );
  if (upcoming.length > 0) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: `⏰ ${upcoming.length} task${upcoming.length > 1 ? 's' : ''} due soon`,
      message: upcoming.map(t => t.text).join(', ').slice(0, 100)
    });
  }
}

async function checkHabitReminders() {
  const { nexusSettings } = await chrome.storage.local.get('nexusSettings');
  if (!nexusSettings?.notificationsEnabled) return;
  // Habit checking logic
}

async function sendDailySummary() {
  const { nexusSettings, nexusTodos } = await chrome.storage.local.get(['nexusSettings', 'nexusTodos']);
  if (!nexusSettings?.dailySummaryNotification) return;
  const completed = (nexusTodos || []).filter(t => {
    const today = new Date();
    const taskDate = new Date(t.completedAt);
    return t.completed && taskDate.toDateString() === today.toDateString();
  });
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: '📊 Nexus Daily Summary',
    message: `Today: ${completed.length} tasks completed. Keep it up!`
  });
}

async function checkThemeSchedule() {
  const { nexusSettings } = await chrome.storage.local.get('nexusSettings');
  if (!nexusSettings?.themeSchedule) return;
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`;
  const lightTime = nexusSettings.themeScheduleLight;
  const darkTime = nexusSettings.themeScheduleDark;
  const isLightHours = currentTime >= lightTime && currentTime < darkTime;
  const targetTheme = isLightHours ? 'light' : 'dark';
  if (nexusSettings.theme !== targetTheme) {
    nexusSettings.theme = targetTheme;
    await chrome.storage.local.set({ nexusSettings });
    chrome.runtime.sendMessage({ action: 'themeChanged', theme: targetTheme }).catch(() => {});
  }
}

// ─── Keyboard Commands ─────────────────────────────────────────────────────────
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  switch (command) {
    case 'toggle-sidebar':
      chrome.sidePanel.open({ tabId: tab.id });
      break;
    case 'open-todo':
      chrome.sidePanel.open({ tabId: tab.id });
      chrome.runtime.sendMessage({ action: 'openPanel', panel: 'todo' }).catch(() => {});
      break;
    case 'open-notes':
      chrome.sidePanel.open({ tabId: tab.id });
      chrome.runtime.sendMessage({ action: 'openPanel', panel: 'notes' }).catch(() => {});
      break;
    case 'open-pomodoro':
      chrome.sidePanel.open({ tabId: tab.id });
      chrome.runtime.sendMessage({ action: 'openPanel', panel: 'pomodoro' }).catch(() => {});
      break;
  }
});

// ─── Message Handler ────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case 'getSettings':
      chrome.storage.local.get('nexusSettings').then(d => sendResponse(d.nexusSettings));
      return true;
    case 'saveSettings':
      chrome.storage.local.set({ nexusSettings: msg.settings }).then(() => sendResponse({ ok: true }));
      return true;
    case 'clearAllData':
      chrome.storage.local.clear().then(() => {
        initDefaultSettings().then(() => sendResponse({ ok: true }));
      });
      return true;
    case 'exportData':
      exportAllData().then(data => sendResponse({ data }));
      return true;
    case 'importData':
      importAllData(msg.data).then(() => sendResponse({ ok: true }));
      return true;
    case 'openSidePanel':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) chrome.sidePanel.open({ tabId: tabs[0].id });
        sendResponse({ ok: true });
      });
      return true;
    case 'setBadge':
      chrome.action.setBadgeText({ text: msg.text || '' });
      chrome.action.setBadgeBackgroundColor({ color: msg.color || '#6C63FF' });
      sendResponse({ ok: true });
      return true;
  }
});

async function exportAllData() {
  const keys = ['nexusSettings','nexusTodos','nexusNotes','nexusHabits','nexusBookmarks','nexusTimerHistory'];
  const data = await chrome.storage.local.get(keys);
  return { ...data, exportDate: Date.now(), version: '1.0.0' };
}

async function importAllData(data) {
  const { exportDate, version, ...storageData } = data;
  await chrome.storage.local.set(storageData);
}

// ─── Badge Helpers ─────────────────────────────────────────────────────────────
let badgeFlashTimeout;
function showBadgeFlash() {
  chrome.action.setBadgeText({ text: '✓' });
  chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
  clearTimeout(badgeFlashTimeout);
  badgeFlashTimeout = setTimeout(() => {
    chrome.action.setBadgeText({ text: '' });
  }, 2000);
}

function getNextTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target.getTime();
}

// ─── Storage Change Listener ───────────────────────────────────────────────────
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.nexusTodos) {
    const todos = changes.nexusTodos.newValue || [];
    const pending = todos.filter(t => !t.completed).length;
    if (pending > 0) {
      chrome.action.setBadgeText({ text: String(pending) });
      chrome.action.setBadgeBackgroundColor({ color: '#6C63FF' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }
});

console.log('🚀 Nexus Sidebar background worker initialized');
