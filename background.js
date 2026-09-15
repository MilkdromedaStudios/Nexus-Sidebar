'use strict';
importScripts('service-worker.js', 'pomodoro-worker.js', 'update-monitor.js');

chrome.action.onClicked.addListener(async tab => {
  if (!tab?.id || !/^(https?|file):/i.test(tab.url || '')) return;
  try {
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['styles/refine.css'] });
  } catch {}
});
