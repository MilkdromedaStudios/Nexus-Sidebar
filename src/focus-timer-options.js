(() => {
  'use strict';
  if (window.__nexusFocusTimerOptionsLoaded) return;
  window.__nexusFocusTimerOptionsLoaded = true;

  const get = defaults => new Promise(resolve => chrome.storage.local.get(defaults, value => resolve(value || defaults)));
  const set = value => new Promise(resolve => chrome.storage.local.set(value, resolve));
  const defer = () => setTimeout(install, 0);
  if (window.NexusSidebar) defer();
  document.addEventListener('nexus:ready', defer, { once: true });

  function install() {
    const N = window.NexusSidebar;
    if (!N || N.__focusTimerOptionsInstalled) return;
    N.__focusTimerOptionsInstalled = true;

    // Focus Timer is timer-only by default. Users can explicitly link it to
    // the site blocker when they want a strict focus session.
    const originalMsg = N.msg.bind(N);
    N.msg = async message => {
      if (message?.type !== 'nexus:next:focus-site') return originalMsg(message);

      const pref = await get({
        nexusTimerSiteBlocking: false,
        nexusFocusDefaultLabel: 'Focus'
      });
      if (pref.nexusTimerSiteBlocking !== false) return originalMsg(message);

      const minutes = Math.max(1, Math.min(180, Number(message.minutes) || 25));
      // Clear any blocker state left by an older strict-focus session.
      await set({
        nexusFocusMode: {
          active: false,
          mode: 'timer-only',
          allowedHosts: [],
          blockedHosts: [],
          until: 0,
          startedAt: Date.now()
        }
      });

      const configured = await originalMsg({
        type: 'nexus:pomodoro-set',
        minutes,
        mode: 'focus',
        label: pref.nexusFocusDefaultLabel || 'Focus'
      });
      if (configured?.ok === false) return configured;
      const started = await originalMsg({ type: 'nexus:pomodoro-start' });
      return {
        ...(started || {}),
        ok: started?.ok !== false,
        timerOnly: true,
        blocking: false,
        until: started?.state?.endAt || (Date.now() + minutes * 60000)
      };
    };

    wrapSettings(N);
    installFocusPanelControl(N);
  }

  function settingRow(label, control, small = '') {
    const line = document.createElement('label');
    line.className = 'nexus-setting';
    const text = document.createElement('span');
    const strong = document.createElement('b');
    strong.textContent = label;
    text.append(strong);
    if (small) {
      const hint = document.createElement('small');
      hint.textContent = small;
      text.append(hint);
    }
    line.append(text, control);
    return line;
  }

  function wrapSettings(N) {
    if (typeof N.renderSettings !== 'function' || N.__focusSettingsWrapped) return;
    N.__focusSettingsWrapped = true;
    const original = N.renderSettings.bind(N);
    N.renderSettings = async (...args) => {
      await original(...args);
      const behavior = [...N.body.querySelectorAll('.nexus-settings-section')]
        .find(node => node.querySelector('h3')?.textContent === 'Behavior');
      if (!behavior || behavior.querySelector('[data-nexus-timer-blocking]')) return;

      const state = await get({ nexusTimerSiteBlocking: false });
      const toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.checked = state.nexusTimerSiteBlocking === true;
      toggle.dataset.nexusTimerBlocking = '1';
      toggle.onchange = async () => {
        await set({ nexusTimerSiteBlocking: toggle.checked });
        if (!toggle.checked) {
          await set({ nexusFocusMode: { active: false, mode: 'timer-only', allowedHosts: [], blockedHosts: [], until: 0, startedAt: Date.now() } });
        }
      };
      behavior.append(settingRow(
        'Block sites during Focus Timer',
        toggle,
        'Off = Pomodoro only. On = starting a Focus Timer also activates the focus-site blocker.'
      ));
    };
  }

  function installFocusPanelControl(N) {
    let timer = 0;
    const enhance = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        if (N.root.querySelector('#nexus-title')?.textContent !== 'Focus') return;
        const wrap = N.body.querySelector('.nexus-next-wrap');
        if (!wrap || wrap.querySelector('[data-nexus-focus-blocking-control]')) return;

        const state = await get({ nexusTimerSiteBlocking: false });
        const section = document.createElement('section');
        section.className = 'nx-section';
        section.dataset.nexusFocusBlockingControl = '1';
        section.innerHTML = '<div class="nx-section-head"><b>Timer behavior</b><small>Choose whether Pomodoro also blocks sites</small></div>';
        const row = document.createElement('div');
        row.className = 'nx-row';
        const copy = document.createElement('div');
        copy.className = 'nx-grow';
        copy.innerHTML = '<b>Block sites while the timer runs</b><small>Leave this off for a normal timer with notifications and history only.</small>';
        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.checked = state.nexusTimerSiteBlocking === true;
        toggle.onchange = async () => {
          await set({ nexusTimerSiteBlocking: toggle.checked });
          if (!toggle.checked) {
            await set({ nexusFocusMode: { active: false, mode: 'timer-only', allowedHosts: [], blockedHosts: [], until: 0, startedAt: Date.now() } });
          }
        };
        row.append(copy, toggle);
        section.append(row);
        wrap.prepend(section);
      }, 60);
    };

    new MutationObserver(enhance).observe(N.body, { childList: true, subtree: true });
    new MutationObserver(enhance).observe(N.root.querySelector('#nexus-title'), { childList: true, subtree: true, characterData: true });
    enhance();
  }
})();
