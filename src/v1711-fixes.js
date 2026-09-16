(() => {
  'use strict';
  if (window.__nexusV1711FixesLoaded) return;
  window.__nexusV1711FixesLoaded = true;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const later = () => setTimeout(install, 30);
  if (window.NexusSidebar) later();
  document.addEventListener('nexus:ready', later, { once: true });

  function install() {
    const N = window.NexusSidebar;
    if (!N || N.__v1711FixesInstalled) return;
    N.__v1711FixesInstalled = true;

    removeAIHub(N);
    installSettingsToggles(N);
    installDirectCalculator(N);
    scrubAIResults(N);

    setTimeout(() => removeAIHub(N), 250);
  }

  function removeAIHub(N) {
    for (let i = N.FEATURES.length - 1; i >= 0; i--) {
      if (N.FEATURES[i]?.id === 'nexus-hub') N.FEATURES.splice(i, 1);
    }
    N.settings.railLayout = (N.settings.railLayout || []).filter(id => id !== 'nexus-hub');
    N.settings.hiddenIcons = [...new Set([...(N.settings.hiddenIcons || []), 'nexus-hub'])];

    if (!N.__v1711ActivateWrapped && typeof N.activate === 'function') {
      N.__v1711ActivateWrapped = true;
      const previous = N.activate.bind(N);
      N.activate = (item, custom = false) => item?.id === 'nexus-hub'
        ? window.NexusCommandV2?.open('')
        : previous(item, custom);
    }

    if (window.NexusCommandV2) {
      window.NexusCommandV2.assistant = () => window.NexusCommandV2.open('');
      window.NexusCommandV2.ask = text => window.NexusCommandV2.open(String(text || ''));
    }

    if (N.active?.id === 'nexus-hub') N.closePanelSoft?.();
    N.saveSettings?.();
    N.renderRail?.();
  }

  function installSettingsToggles(N) {
    if (N.__v1711SettingsWrapped || typeof N.renderSettings !== 'function') return;
    N.__v1711SettingsWrapped = true;
    const original = N.renderSettings.bind(N);

    N.renderSettings = async (...args) => {
      await original(...args);
      const behavior = [...N.body.querySelectorAll('.nexus-settings-section')]
        .find(x => x.querySelector('h3')?.textContent === 'Behavior');
      if (!behavior || behavior.querySelector('[data-v1711-context-setting]')) return;

      const makeRow = (label, control, small) => {
        const row = document.createElement('label');
        row.className = 'nexus-setting';
        const text = document.createElement('span');
        text.innerHTML = `<b>${esc(label)}</b><small>${esc(small)}</small>`;
        row.append(text, control);
        return row;
      };

      const context = document.createElement('input');
      context.type = 'checkbox';
      context.checked = N.settings.customContextMenu !== false;
      context.onchange = async () => {
        N.settings.customContextMenu = context.checked;
        await N.saveSettings();
      };
      const contextRow = makeRow(
        'Nexus right-click menu',
        context,
        'Off restores the normal browser/page right-click menu.'
      );
      contextRow.dataset.v1711ContextSetting = '1';
      behavior.append(contextRow);

      const selection = document.createElement('input');
      selection.type = 'checkbox';
      selection.checked = N.settings.selectionActions !== false;
      selection.onchange = async () => {
        N.settings.selectionActions = selection.checked;
        await N.saveSettings();
      };
      behavior.append(makeRow(
        'Selection quick actions',
        selection,
        'Show the small Define / Save / Search actions after selecting text.'
      ));
    };
  }

  function installDirectCalculator(N) {
    const bind = () => {
      const palette = N.root.querySelector('#nexus-universal-command-v2');
      const box = palette?.querySelector('.nxv2-command-box');
      const input = box?.querySelector('input');
      const results = box?.querySelector('.nxv2-command-results');
      if (!box || !input || !results || input.dataset.v1711CalcBound === '1') return false;
      input.dataset.v1711CalcBound = '1';

      const live = document.createElement('button');
      live.type = 'button';
      live.className = 'nxv1711-calc-live';
      live.hidden = true;
      live.innerHTML = '<span>CALC</span><b></b><small>Click to copy result</small>';
      box.insertBefore(live, results);

      let last = '';
      const paint = () => {
        const answer = calculate(input.value);
        if (answer === null) {
          live.hidden = true;
          last = '';
          return;
        }
        last = answer;
        live.querySelector('b').textContent = `= ${answer}`;
        live.hidden = false;
      };
      input.addEventListener('input', paint);
      input.addEventListener('keyup', paint);
      live.onclick = async () => {
        if (!last) return;
        try { await navigator.clipboard.writeText(last); } catch {}
        toast(N, `Copied ${last}`);
      };
      paint();
      return true;
    };

    if (!bind()) {
      const observer = new MutationObserver(() => { if (bind()) observer.disconnect(); });
      observer.observe(N.root, { childList: true, subtree: true });
    }
  }

  function scrubAIResults(N) {
    const clean = () => {
      const results = N.root.querySelector('#nexus-universal-command-v2 .nxv2-command-results');
      if (!results) return;
      for (const row of results.querySelectorAll('.nxv2-command-result')) {
        const text = row.textContent || '';
        if (/Nexus Assistant|Nexus AI|Open Nexus AI/i.test(text)) row.remove();
      }
    };
    const observer = new MutationObserver(clean);
    observer.observe(N.root, { childList: true, subtree: true });
    clean();
  }

  function calculate(raw) {
    let q = String(raw || '').trim();
    if (!q) return null;
    if (q.startsWith('=')) q = q.slice(1).trim();
    q = q.replace(/[×x]/g, '*').replace(/÷/g, '/');

    const percent = q.match(/^(-?\d+(?:\.\d+)?)\s*%\s+of\s+(-?\d+(?:\.\d+)?)$/i);
    if (percent) return cleanNumber(Number(percent[1]) / 100 * Number(percent[2]));

    const names = {
      pi: 'Math.PI', sqrt: 'Math.sqrt', abs: 'Math.abs', round: 'Math.round',
      floor: 'Math.floor', ceil: 'Math.ceil', sin: 'Math.sin', cos: 'Math.cos',
      tan: 'Math.tan', log: 'Math.log10', ln: 'Math.log'
    };
    q = q.replace(/\^/g, '**');
    for (const [name, replacement] of Object.entries(names)) {
      const re = name === 'pi' ? /\bpi\b/gi : new RegExp(`\\b${name}\\s*(?=\\()`, 'gi');
      q = q.replace(re, replacement);
    }

    const stripped = q.replace(/Math\.(?:PI|sqrt|abs|round|floor|ceil|sin|cos|tan|log10|log)/g, '');
    if (!/[+\-*/()%]|\*\*/.test(q)) return null;
    if (!/^[0-9eE+\-*/().,%\s]*$/.test(stripped)) return null;

    try {
      const value = Function(`"use strict"; return (${q});`)();
      return Number.isFinite(value) ? cleanNumber(value) : null;
    } catch {
      return null;
    }
  }

  function cleanNumber(n) {
    if (Math.abs(n) >= 1e12) return n.toExponential(8);
    return String(Number(n.toFixed(12)));
  }

  function toast(N, text) {
    let t = N.root.querySelector('.nx-toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'nx-toast';
      N.root.append(t);
    }
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 1600);
  }
})();