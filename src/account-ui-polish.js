(() => {
  'use strict';
  if (window.__nexusAccountUiPolishLoaded) return;
  window.__nexusAccountUiPolishLoaded = true;

  const start = () => setTimeout(install, 120);
  if (window.NexusSidebar) start();
  document.addEventListener('nexus:ready', start, { once: true });

  function install() {
    const N = window.NexusSidebar;
    if (!N || N.__accountUiPolishInstalled) return;
    N.__accountUiPolishInstalled = true;

    const original = N.renderSettings?.bind(N);
    if (!original) return;

    N.renderSettings = async (...args) => {
      const result = await original(...args);
      polishSettings(N);
      return result;
    };

    if (N.active?.id === 'settings') polishSettings(N);
  }

  function polishSettings(N) {
    const sections = [...N.body.querySelectorAll('.nexus-settings-section')];

    for (const small of N.body.querySelectorAll('.nexus-setting small')) {
      const text = (small.textContent || '').trim();
      if (/^Guest mode: Modern only/i.test(text)) small.textContent = 'Modern';
      else if (/^Guest mode only shows/i.test(text)) small.textContent = 'Manage sidebar icons';
      else if (/^Guest mode includes 1 custom site/i.test(text)) small.textContent = '1 custom site';
      else if (/^Member feature$/i.test(text)) small.textContent = '';
      else if (/^Full Nexus is unlocked$/i.test(text)) small.textContent = '';
      else if (/^Modern theme · 1 custom site/i.test(text)) small.textContent = '';
    }

    for (const row of N.body.querySelectorAll('.nexus-setting')) {
      const label = (row.querySelector('b')?.textContent || '').trim();
      if (label === 'Account status') row.remove();
    }

    const account = sections.find(section => section.querySelector('h3')?.textContent.trim() === 'DigitBox account');
    if (account) {
      const action = [...account.querySelectorAll('.nexus-setting')].find(row => row.querySelector('b')?.textContent.trim() === 'Account');
      if (action) {
        action.querySelector('small')?.remove();
        const button = action.querySelector('button');
        if (button) button.textContent = N.isSignedIn ? 'Open profile' : 'Sign in with DigitBox';
      }
    }

    for (const site of N.body.querySelectorAll('.nexus-site-settings > div')) {
      for (const node of site.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
          node.nodeValue = node.nodeValue.replace(/\s·\smember only/g, '');
        }
      }
    }

    for (const button of N.body.querySelectorAll('button')) {
      if (button.textContent.trim() === 'Guest limit reached') button.textContent = N.isSignedIn ? 'Upgrade to Pro' : 'Sign in to add more';
      if (button.textContent.trim() === 'Sign in to unlock full Nexus') button.textContent = N.isSignedIn ? 'Upgrade to DigitBox Pro' : 'Sign in with DigitBox';
    }
  }
})();
