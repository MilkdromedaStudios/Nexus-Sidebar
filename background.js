'use strict';
importScripts('service-worker.js', 'pomodoro-worker.js', 'update-v2-worker.js', 'next-level-worker.js', 'next-level-extras-worker.js', 'next-level-persistence.js', 'next-level-label-worker.js', 'interaction-worker.js');

chrome.action.onClicked.addListener(async tab => {
  if (!tab?.id || !/^(https?|file):/i.test(tab.url || '')) return;
  try {
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['styles/refine.css', 'styles/controls-autohide.css', 'styles/nexus-suite.css', 'styles/interaction-v2.css', 'styles/v1711-fixes.css'] });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['src/update-ui.js', 'src/controls-autohide.js', 'src/interaction-command.js', 'src/shortcut-compat-v171.js', 'src/nexus-suite.js', 'src/nexus-suite-enhancements.js', 'src/custom-context-v2.js', 'src/onboarding-v171.js', 'src/v1711-fixes.js'] });
  } catch {}
});
