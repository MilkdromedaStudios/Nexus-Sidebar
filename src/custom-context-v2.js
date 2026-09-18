(() => {
  'use strict';
  if (window.__nexusCustomContextV171Loaded) return;
  window.__nexusCustomContextV171Loaded = true;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const defer = () => setTimeout(install, 0);
  if (window.NexusSidebar) defer();
  document.addEventListener('nexus:ready', defer, { once: true });

  function install() {
    const N = window.NexusSidebar;
    if (!N || document.getElementById('nexus-smart-context-v2')) return;

    const menu = document.createElement('div');
    menu.id = 'nexus-smart-context-v2';
    menu.hidden = true;
    document.documentElement.append(menu);

    const bubble = document.createElement('div');
    bubble.id = 'nexus-selection-bubble-v2';
    bubble.hidden = true;
    bubble.innerHTML = '<button data-a="define">Define</button><button data-a="note">Save</button><button data-a="search">Search</button><button data-a="command">Command</button>';
    document.documentElement.append(bubble);

    let currentText = '', currentX = 0, currentY = 0;
    const hide = () => { menu.hidden = true; bubble.hidden = true; };
    const selection = () => String(window.getSelection?.()?.toString() || '').trim();

    async function perform(action) {
      const text = currentText || selection();
      hide();

      if (action === 'define') {
        if (!text) return toast(N, 'Select a word first');
        const r = await N.msg({ type: 'nexus:next:define', word: text });
        return showDefinition(r);
      }
      if (action === 'note') {
        if (text) await N.msg({ type: 'nexus:next:note-add', text, url: location.href, title: document.title });
        else await N.msg({ type: 'nexus:next:reading-add', url: location.href, title: document.title });
        return toast(N, text ? 'Saved to Nexus Notes' : 'Added to Reading List');
      }
      if (action === 'search') {
        const q = text || document.title;
        return N.msg({ type: 'nexus:next:open', url: 'https://www.google.com/search?q=' + encodeURIComponent(q) });
      }
      if (action === 'copy-md') {
        const md = text ? `> ${text.replace(/\n/g, '\n> ')}\n\nSource: ${location.href}` : `[${document.title}](${location.href})`;
        await navigator.clipboard.writeText(md);
        return toast(N, 'Markdown copied');
      }
      if (action === 'copy-url') {
        await navigator.clipboard.writeText(location.href);
        return toast(N, 'Page URL copied');
      }
      if (action === 'focus') {
        await N.msg({ type: 'nexus:next:focus-site', url: location.href, minutes: 25 });
        return toast(N, '25-minute focus started');
      }
      if (action === 'screenshot') return N.msg({ type: 'nexus:next:capture-save', saveAs: true });
      if (action === 'command') return window.NexusCommandV2?.open(text);
    }

    function showMenu(x, y, text) {
      currentText = text;
      currentX = x;
      currentY = y;
      const has = !!text;
      const items = has ? [
        ['define', 'Aa', 'Define selection'],
        ['note', '▣', 'Save to Notes'],
        ['search', '⌕', 'Search web'],
        ['copy-md', '</>', 'Copy as Markdown'],
        ['command', '⌘', 'Use in command palette'],
        ['focus', '◴', 'Focus on this site']
      ] : [
        ['note', '▣', 'Add page to Reading List'],
        ['screenshot', '▧', 'Capture visible page'],
        ['focus', '◴', 'Focus on this site'],
        ['copy-url', '↗', 'Copy page URL'],
        ['command', '⌘', 'Open command palette']
      ];

      menu.innerHTML = `<div class="nxv2-context-head">${has ? esc(text.slice(0, 58)) : esc(document.title || location.hostname)}</div>` +
        items.map(([a, i, n]) => `<button data-a="${a}"><span>${i}</span><b>${esc(n)}</b></button>`).join('');
      menu.hidden = false;
      menu.style.left = Math.min(x, innerWidth - 285) + 'px';
      menu.style.top = Math.min(y, innerHeight - Math.min(380, menu.offsetHeight || 320)) + 'px';
      bubble.hidden = true;
    }

    menu.addEventListener('click', e => {
      const b = e.target.closest('button[data-a]');
      if (b) perform(b.dataset.a);
    });
    bubble.addEventListener('click', e => {
      const b = e.target.closest('button[data-a]');
      if (b) perform(b.dataset.a);
    });

    document.addEventListener('contextmenu', e => {
      if (N.accountLocked || N.root?.contains(e.target) || N.settings.customContextMenu === false) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      showMenu(e.clientX, e.clientY, selection());
    }, true);

    document.addEventListener('mouseup', e => {
      if (N.accountLocked || e.button !== 0 || N.root?.contains(e.target)) return;
      setTimeout(() => {
        if (N.settings.selectionActions === false) return;
        const text = selection();
        if (!text || text.length > 5000) {
          bubble.hidden = true;
          return;
        }
        currentText = text;
        const sel = window.getSelection();
        let rect;
        try { rect = sel.rangeCount ? sel.getRangeAt(0).getBoundingClientRect() : null; } catch {}
        if (!rect) return;
        bubble.hidden = false;
        bubble.style.left = Math.max(6, Math.min(innerWidth - 340, rect.left + rect.width / 2 - 150)) + 'px';
        bubble.style.top = Math.max(6, rect.top - 42) + 'px';
      }, 20);
    }, true);

    document.addEventListener('pointerdown', e => {
      if (!menu.contains(e.target) && !bubble.contains(e.target)) hide();
    }, true);
    window.addEventListener('blur', hide);

    function showDefinition(r) {
      const word = r?.word || currentText || 'Definition';
      const defs = (r?.meanings || []).slice(0, 4);
      menu.innerHTML = `<div class="nxv2-context-head"><b>${esc(word)}</b> ${esc(r?.phonetic || '')}</div>` +
        (r?.ok
          ? defs.map(d => `<div class="nxv2-definition"><small>${esc(d.partOfSpeech)}</small><p>${esc(d.definition)}</p>${d.example ? `<em>${esc(d.example)}</em>` : ''}</div>`).join('')
          : `<div class="nxv2-definition"><p>${esc(r?.error || 'Definition unavailable')}</p></div>`) +
        '<button data-a="command"><span>⌘</span><b>Use in command palette</b></button>';
      menu.hidden = false;
      menu.style.left = Math.min(currentX, innerWidth - 330) + 'px';
      menu.style.top = Math.min(currentY, innerHeight - 360) + 'px';
    }
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
    t._timer = setTimeout(() => t.classList.remove('show'), 1800);
  }
})();