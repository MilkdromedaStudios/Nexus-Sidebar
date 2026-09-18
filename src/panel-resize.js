(() => {
  'use strict';
  if (window.__nexusPanelResizeLoaded) return;
  window.__nexusPanelResizeLoaded = true;
  const start = () => setTimeout(install, 25);
  if (window.NexusSidebar) start();
  document.addEventListener('nexus:ready', start, { once:true });

  function install() {
    const N = window.NexusSidebar;
    if (!N || N.__panelResizeInstalled) return;
    N.__panelResizeInstalled = true;
    N.settings.panelWidths = N.settings.panelWidths && typeof N.settings.panelWidths === 'object' ? N.settings.panelWidths : {};

    const handle = document.createElement('div');
    handle.id = 'nexus-panel-resizer';
    handle.title = 'Drag to resize this panel';
    N.panel.append(handle);

    N.applyPanelWidth = id => {
      const key = String(id || N.active?.id || 'default');
      const fallback = Math.max(320, Number(N.settings.panelWidth) || 470);
      const saved = Number(N.settings.panelWidths[key]);
      const max = Math.max(340, Math.min(960, innerWidth - 96));
      const width = Math.max(320, Math.min(max, Number.isFinite(saved) && saved > 0 ? saved : fallback));
      N.root.style.setProperty('--nexus-width', width + 'px');
      document.dispatchEvent(new CustomEvent('nexus:panel-resized', { detail:{ id:key, width } }));
      return width;
    };

    const previousActivate = N.activate?.bind(N);
    if (previousActivate) {
      N.activate = async (item, custom=false) => {
        N.applyPanelWidth(item?.id);
        return previousActivate(item, custom);
      };
    }

    let drag = null;
    handle.addEventListener('pointerdown', event => {
      if (!N.active) return;
      event.preventDefault();
      event.stopPropagation();
      handle.setPointerCapture?.(event.pointerId);
      drag = {
        pointerId:event.pointerId,
        x:event.clientX,
        startWidth:N.panel.getBoundingClientRect().width,
        id:String(N.active.id || 'default'),
        right:N.root.classList.contains('edge-right')
      };
      N.root.classList.add('panel-resizing');
    });

    handle.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const delta = event.clientX - drag.x;
      const raw = drag.startWidth + (drag.right ? -delta : delta);
      const max = Math.max(340, Math.min(960, innerWidth - 96));
      const width = Math.round(Math.max(320, Math.min(max, raw)));
      N.root.style.setProperty('--nexus-width', width + 'px');
      drag.widthNow = width;
      document.dispatchEvent(new CustomEvent('nexus:panel-resized', { detail:{ id:drag.id, width } }));
    });

    const finish = async event => {
      if (!drag || (event.pointerId != null && event.pointerId !== drag.pointerId)) return;
      const done = drag;
      drag = null;
      N.root.classList.remove('panel-resizing');
      const width = done.widthNow || Math.round(N.panel.getBoundingClientRect().width);
      N.settings.panelWidths[done.id] = width;
      await N.saveSettings?.();
      document.dispatchEvent(new CustomEvent('nexus:panel-resized', { detail:{ id:done.id, width, saved:true } }));
    };
    handle.addEventListener('pointerup', finish);
    handle.addEventListener('pointercancel', finish);
    handle.addEventListener('dblclick', async () => {
      const id = String(N.active?.id || 'default');
      delete N.settings.panelWidths[id];
      await N.saveSettings?.();
      N.applyPanelWidth(id);
    });
    window.addEventListener('resize', () => N.applyPanelWidth(N.active?.id));
  }
})();