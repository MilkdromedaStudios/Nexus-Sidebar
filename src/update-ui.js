(() => {
  'use strict';
  if (window.__nexusUpdateUiInstalled) return;
  window.__nexusUpdateUiInstalled = true;

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
        refresh(true);
      };
      section.append(row(
        'Automatic update checks',
        auto,
        'Checks GitHub once per hour. Unpacked extensions cannot overwrite their own installed folder.'
      ));

      const status = document.createElement('div');
      status.className = 'nexus-update-status';
      status.textContent = 'Checking GitHub…';
      section.append(row(
        'Version status',
        status,
        'Compares the version loaded by Edge/Chrome with the manifest currently on GitHub main.'
      ));

      const notice = document.createElement('div');
      notice.className = 'nexus-update-status';
      notice.textContent = 'Unpacked update steps: download → extract/replace the folder Edge is using → click Reload Nexus.';
      section.append(row(
        'How unpacked updates work',
        notice,
        'Downloading a ZIP by itself does not change the extension folder already loaded in the browser.'
      ));

      const actions = document.createElement('div');
      actions.className = 'nexus-inline-actions';
      const check = document.createElement('button');
      check.textContent = 'Check now';
      const download = document.createElement('button');
      download.textContent = 'Download latest ZIP';
      const reload = document.createElement('button');
      reload.textContent = 'Reload Nexus';
      const extensions = document.createElement('button');
      extensions.textContent = 'Extensions page';
      actions.append(check, download, reload, extensions);
      section.append(row(
        'Update actions',
        actions,
        'Reload Nexus re-reads whatever files are currently in the unpacked folder.'
      ));

      async function refresh(force = false) {
        const r = await N.msg({ type: force ? 'nexus:update-check-v2' : 'nexus:update-status-v2' });
        if (!r?.ok) {
          status.textContent = `Check failed${r?.error ? ' · ' + r.error : ''}`;
          status.classList.remove('available');
          return;
        }
        const local = r.localVersion || chrome.runtime.getManifest().version;
        const remote = r.remoteVersion || local;
        const checked = r.checkedAt
          ? new Date(r.checkedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
          : 'not checked yet';

        if (r.available) {
          status.textContent = `Update available · browser loaded v${local} · GitHub has v${remote} · checked ${checked}`;
          status.classList.add('available');
          download.textContent = `Download v${remote}`;
        } else if (r.disabled) {
          status.textContent = `Automatic checks off · browser loaded v${local}`;
          status.classList.remove('available');
          download.textContent = 'Download latest ZIP';
        } else {
          status.textContent = `Up to date · browser loaded v${local} · GitHub v${remote} · checked ${checked}`;
          status.classList.remove('available');
          download.textContent = 'Download latest ZIP';
        }
      }

      check.onclick = () => refresh(true);
      download.onclick = () => N.msg({ type: 'nexus:update-download-v2' });
      reload.onclick = async () => {
        reload.disabled = true;
        reload.textContent = 'Reloading…';
        await N.msg({ type: 'nexus:update-reload-v2' });
      };
      extensions.onclick = () => N.msg({ type: 'nexus:update-open-extensions-v2' });
      refresh(false);
    };
  }

  if (window.NexusSidebar) install();
  else document.addEventListener('nexus:ready', install, { once: true });
})();