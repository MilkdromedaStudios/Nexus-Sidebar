(() => {
  'use strict';
  if (window.__nexusUpdateUiInstalled) return;
  window.__nexusUpdateUiInstalled = true;

  const ZIP = 'https://github.com/MilkdromedaStudios/Nexus-Sidebar/archive/refs/heads/main.zip';

  function install() {
    const N = window.NexusSidebar;
    if (!N || N.__updateUiWrapped || typeof N.renderSettings !== 'function') return;
    N.__updateUiWrapped = true;
    const original = N.renderSettings;

    N.renderSettings = async (...args) => {
      await original(...args);
      const section = [...N.body.querySelectorAll('.nexus-settings-section')]
        .find(node => node.querySelector('h3')?.textContent === 'Updates');
      if (!section) return;

      section.replaceChildren();
      const heading = document.createElement('h3');
      heading.textContent = 'Updates';
      section.append(heading);

      const row = (label, control, small = '') => {
        const line = document.createElement('label');
        line.className = 'nexus-setting';
        const text = document.createElement('span');
        text.innerHTML = `<b>${label}</b>${small ? `<small>${small}</small>` : ''}`;
        line.append(text, control);
        return line;
      };

      const auto = document.createElement('input');
      auto.type = 'checkbox';
      auto.checked = N.settings.autoUpdateCheck !== false;
      auto.onchange = async () => {
        N.settings.autoUpdateCheck = auto.checked;
        await N.saveSettings();
        if (auto.checked) refresh(true);
        else refresh(false);
      };
      section.append(row('Automatic update checks', auto, 'Checks GitHub hourly. Unpacked extensions cannot install updates by themselves.'));

      const status = document.createElement('div');
      status.className = 'nexus-update-status';
      status.textContent = 'Checking GitHub…';
      section.append(row('Version status', status, 'Nexus will show an UP badge and a browser notification when a newer GitHub build is found.'));

      const actions = document.createElement('div');
      actions.className = 'nexus-inline-actions';
      const check = document.createElement('button');
      check.textContent = 'Check now';
      const download = document.createElement('button');
      download.textContent = 'Download latest ZIP';
      const github = document.createElement('button');
      github.textContent = 'Open GitHub';
      actions.append(check, download, github);
      section.append(row('Update actions', actions, 'After downloading, replace the unpacked folder and reload Nexus from the browser Extensions page.'));

      async function refresh(force = false) {
        const r = await N.msg({ type: force ? 'nexus:update-check' : 'nexus:update-status' });
        if (!r?.ok) {
          status.textContent = `Check failed${r?.error ? ' · ' + r.error : ''}`;
          status.classList.remove('available');
          return;
        }
        const local = r.localVersion || chrome.runtime.getManifest().version;
        const remote = r.remoteVersion || local;
        const checked = r.checkedAt ? new Date(r.checkedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'not checked yet';
        if (r.available) {
          status.textContent = `Update available · installed v${local} · latest v${remote} · checked ${checked}`;
          status.classList.add('available');
          download.textContent = `Download v${remote}`;
        } else {
          status.textContent = `${r.disabled ? 'Automatic checks off' : 'Up to date'} · v${local} · checked ${checked}`;
          status.classList.remove('available');
          download.textContent = 'Download latest ZIP';
        }
      }

      check.onclick = () => refresh(true);
      download.onclick = () => N.msg({ type: 'nexus:open-tab', url: ZIP });
      github.onclick = () => N.msg({ type: 'nexus:update-open' });
      refresh(false);
    };
  }

  if (window.NexusSidebar) install();
  else document.addEventListener('nexus:ready', install, { once: true });
})();
