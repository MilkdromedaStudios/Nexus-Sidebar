(() => {
  if (window.__nexusOverlayInitialized) return;
  window.__nexusOverlayInitialized = true;

  const state = { open: false, edge: 'right', autohide: true };
  const root = document.createElement('div');
  root.id = 'nexus-overlay-root';
  const panel = document.createElement('iframe');
  panel.id = 'nexus-overlay-panel';
  panel.src = chrome.runtime.getURL('sidebar/sidebar.html');
  panel.setAttribute('title', 'Nexus Sidebar');
  const trigger = document.createElement('div');
  trigger.id = 'nexus-overlay-trigger';

  root.appendChild(panel);
  document.documentElement.appendChild(root);
  document.documentElement.appendChild(trigger);

  function applyEdge(edge) {
    state.edge = edge === 'left' ? 'left' : 'right';
    root.classList.toggle('nexus-left', state.edge === 'left');
    root.classList.toggle('nexus-right', state.edge === 'right');
    trigger.classList.toggle('nexus-left', state.edge === 'left');
    trigger.classList.toggle('nexus-right', state.edge === 'right');
  }

  function setOpen(next) {
    state.open = !!next;
    root.classList.toggle('open', state.open);
  }

  trigger.addEventListener('mouseenter', () => setOpen(true));
  document.addEventListener('mousemove', (e) => {
    if (!state.autohide || !state.open) return;
    const rect = panel.getBoundingClientRect();
    const outside = e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom;
    if (outside) setOpen(false);
  });

  chrome.storage.local.get('nexusSettings', ({ nexusSettings }) => {
    const settings = nexusSettings || {};
    state.autohide = settings.autoHideSidebar !== false;
    applyEdge(settings.sidebarPosition || 'right');
  });

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.action !== 'nexusOverlayControl') return;
    if (msg.command === 'toggle') setOpen(!state.open);
    if (msg.command === 'open') setOpen(true);
    if (msg.command === 'close') setOpen(false);
    sendResponse({ ok: true, open: state.open });
  });
})();
