'use strict';
importScripts('service-worker.js', 'pomodoro-worker.js', 'update-monitor.js', 'next-level-worker.js');

chrome.action.onClicked.addListener(async tab => {
  if (!tab?.id || !/^(https?|file):/i.test(tab.url || '')) return;
  try {
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['styles/refine.css', 'styles/controls-autohide.css', 'styles/nexus-suite.css'] });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['src/update-ui.js', 'src/controls-autohide.js', 'src/nexus-suite.js'] });
  } catch {}
});
