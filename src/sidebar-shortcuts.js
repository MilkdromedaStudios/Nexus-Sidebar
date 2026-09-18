(() => {
  'use strict';
  if (window.__nexusSidebarShortcutPickerLoaded) return;
  window.__nexusSidebarShortcutPickerLoaded = true;
  const start = () => setTimeout(install, 60);
  if (window.NexusSidebar) start();
  document.addEventListener('nexus:ready', start, { once:true });

  const CATEGORY = {core:'Command',tabs:'Tabs',workspaces:'Workspaces',planner:'Planner',focus:'Focus',notes:'Notes',capture:'Capture',dev:'Developer',page:'Inspector',library:'Library',system:'System'};
  const ICON = {core:'sparkle',tabs:'history',workspaces:'home',planner:'home',focus:'timer',notes:'home',capture:'sparkle',dev:'sparkle',page:'sparkle',library:'history',system:'settings',profile:'home'};
  const slug = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,52);

  async function install() {
    const N = window.NexusSidebar;
    if (!N || N.__shortcutPickerInstalled) return;
    N.__shortcutPickerInstalled = true;
    const saved = await N.storeGet({ nexusSidebarShortcuts: [] });
    N.sidebarShortcuts = Array.isArray(saved.nexusSidebarShortcuts) ? saved.nexusSidebarShortcuts : [];
    N.shortcutItems = new Map();
    for (const record of N.sidebarShortcuts) register(N, record, false);

    const previousActivate = N.activate?.bind(N);
    if (previousActivate) {
      N.activate = async (item, custom=false) => {
        if (item?.type === 'nexus-shortcut') {
          if (N.isGuest) return N.showMemberPrompt?.('Sidebar shortcuts','Custom feature shortcuts are available after DigitBox sign-in.');
          if (item.toolKey === 'profile') return N.openDigitBoxProfile?.();
          return window.NexusSuite?.openTool?.(item.toolKey || 'core');
        }
        return previousActivate(item, custom);
      };
    }
    installPickerButton(N);
    N.normalizeLayout?.();
    N.renderRail?.();
  }

  function catalog() {
    const featured = [
      { name:'DigitBox Profile', key:'profile', desc:'Account, avatar and profile' },
      { name:'Tabs & Sessions', key:'tabs', desc:'Switch, group and restore tabs' },
      { name:'Workspaces', key:'workspaces', desc:'Saved tab workspaces' },
      { name:'Planner', key:'planner', desc:'Tasks, events and calendar' },
      { name:'Focus Tools', key:'focus', desc:'Timer, history and blockers' },
      { name:'Notes & Clipboard', key:'notes', desc:'Notes, snippets and reading list' },
      { name:'Capture Tools', key:'capture', desc:'Screenshots, picker and ruler' },
      { name:'Developer Tools', key:'dev', desc:'JSON, regex, hashes and CSS' },
      { name:'Page Inspector', key:'page', desc:'Metadata, storage and performance' },
      { name:'Bookmarks & Downloads', key:'library', desc:'Library and recent downloads' },
      { name:'Nexus System', key:'system', desc:'Backups, health and notifications' },
    ];
    const suite = (window.NexusSuite?.features || [])
      .filter(([name,key]) => key !== 'assistant' && !/Nexus Assistant|Nexus AI/i.test(name))
      .map(([name,key]) => ({ name, key, desc:CATEGORY[key] || 'Nexus feature' }));
    const seen = new Set();
    return [...featured, ...suite].filter(item => {
      const id = item.key + ':' + item.name.toLowerCase();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  function recordFor(item) {
    return { id:'shortcut-' + slug(item.key + '-' + item.name), name:item.name, toolKey:item.key, icon:ICON[item.key] || 'sparkle' };
  }

  function register(N, record, persist=true) {
    if (!record?.id || N.shortcutItems.has(record.id)) return;
    const item = { ...record, type:'nexus-shortcut' };
    N.shortcutItems.set(item.id, item);
    if (!N.FEATURES.some(x => x.id === item.id)) N.FEATURES.push(item);
    if (!(N.settings.railLayout || []).includes(item.id)) N.settings.railLayout = [...(N.settings.railLayout || []), item.id];
    N.settings.hiddenIcons = (N.settings.hiddenIcons || []).filter(id => id !== item.id);
    if (persist) save(N);
  }

  function unregister(N, id, persist=true) {
    N.shortcutItems.delete(id);
    const i = N.FEATURES.findIndex(x => x.id === id);
    if (i >= 0) N.FEATURES.splice(i, 1);
    N.settings.railLayout = (N.settings.railLayout || []).filter(x => x !== id);
    N.settings.hiddenIcons = (N.settings.hiddenIcons || []).filter(x => x !== id);
    if (persist) save(N);
  }

  async function save(N) {
    N.sidebarShortcuts = [...N.shortcutItems.values()].map(x => ({ id:x.id,name:x.name,toolKey:x.toolKey,icon:x.icon }));
    await N.storeSet({ nexusSidebarShortcuts:N.sidebarShortcuts, nexusSettings:N.settings });
    N.renderRail?.();
  }

  function installPickerButton(N) {
    const controls = N.root.querySelector('#nexus-corner-controls');
    if (!controls || controls.querySelector('#nexus-shortcut-picker')) return;
    const button = document.createElement('button');
    button.id = 'nexus-shortcut-picker';
    button.className = 'nexus-icon nexus-util';
    button.title = 'Add widgets & shortcuts';
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h6.5V12H4zM13.5 5.5H20V12h-6.5zM4 15h6.5v4H4zM13.5 15H20v4h-6.5z"/><path d="M17 3v5M14.5 5.5h5"/></svg>';
    const hide = controls.querySelector('#nexus-session-hide');
    controls.insertBefore(button, hide || controls.firstChild);
    button.onclick = event => { event.stopPropagation(); toggleMenu(N, button); };
  }

  function toggleMenu(N, anchor) {
    let menu = N.root.querySelector('#nexus-shortcut-menu');
    if (menu && !menu.hidden) { menu.hidden = true; return; }
    if (!menu) {
      menu = document.createElement('section');
      menu.id = 'nexus-shortcut-menu';
      menu.innerHTML = '<header><div><b>Add to sidebar</b><small>Widgets & feature shortcuts</small></div><button data-close>×</button></header><input data-search placeholder="Search Nexus features…"><div class="nexus-shortcut-list"></div>';
      N.root.append(menu);
      menu.querySelector('[data-close]').onclick = () => { menu.hidden = true; };
      menu.querySelector('[data-search]').oninput = () => paintMenu(N, menu);
      menu.addEventListener('pointerdown', event => event.stopPropagation());
    }
    menu.hidden = false;
    paintMenu(N, menu);
    const rect = anchor.getBoundingClientRect();
    menu.style.bottom = Math.max(10, innerHeight - rect.top + 8) + 'px';
    if (N.root.classList.contains('edge-right')) { menu.style.right = '10px'; menu.style.left = 'auto'; }
    else { menu.style.left = '10px'; menu.style.right = 'auto'; }
    setTimeout(() => menu.querySelector('[data-search]')?.focus(), 0);
  }

  function paintMenu(N, menu) {
    const q = menu.querySelector('[data-search]').value.trim().toLowerCase();
    const list = menu.querySelector('.nexus-shortcut-list');
    list.replaceChildren();
    const items = catalog().filter(item => !q || (item.name + ' ' + item.desc + ' ' + item.key).toLowerCase().includes(q)).slice(0, 80);
    for (const item of items) {
      const record = recordFor(item);
      const added = N.shortcutItems.has(record.id);
      const row = document.createElement('button');
      row.className = 'nexus-shortcut-row' + (added ? ' added' : '');
      row.innerHTML = '<span class="nexus-shortcut-row-icon"></span><div><b></b><small></small></div><em></em>';
      row.querySelector('.nexus-shortcut-row-icon').textContent = item.key === 'profile' ? 'DB' : (CATEGORY[item.key] || 'N').slice(0,2).toUpperCase();
      row.querySelector('b').textContent = item.name;
      row.querySelector('small').textContent = item.desc;
      row.querySelector('em').textContent = added ? 'Added' : 'Add';
      row.onclick = async () => {
        if (added) unregister(N, record.id, false); else register(N, record, false);
        await save(N); paintMenu(N, menu);
      };
      list.append(row);
    }
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'nexus-shortcut-empty';
      empty.textContent = 'No matching Nexus feature.';
      list.append(empty);
    }
  }
})();