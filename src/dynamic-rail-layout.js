(() => {
  'use strict';
  if (window.__nexusDynamicRailLayoutLoaded) return;
  window.__nexusDynamicRailLayoutLoaded = true;

  const start = () => setTimeout(install, 80);
  if (window.NexusSidebar) start();
  document.addEventListener('nexus:ready', start, { once:true });

  function install() {
    const N = window.NexusSidebar;
    if (!N || N.__dynamicRailLayoutInstalled) return;
    N.__dynamicRailLayoutInstalled = true;

    const controls = N.root.querySelector('#nexus-corner-controls');
    if (!controls || !N.rail || !N.icons) return;

    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const viewport = Math.max(240, window.innerHeight || document.documentElement.clientHeight || 0);
        const margin = viewport < 500 ? 8 : 10;
        const gap = 10;
        const controlsRect = controls.getBoundingClientRect();

        // Always reserve the complete lower control stack plus a visible gap.
        const lowerBoundary = Math.max(margin + 70, Math.min(viewport - margin, controlsRect.top - gap));
        const available = Math.max(72, lowerBoundary - margin);

        // scrollHeight remains the full icon content height even when the rail itself is constrained.
        const contentHeight = Math.max(46, N.icons.scrollHeight || N.icons.offsetHeight || 46);
        const railHeight = Math.min(contentHeight, available);

        // Prefer visual centering, then push upward only as much as required to avoid the controls.
        const centeredTop = (viewport - railHeight) / 2;
        const maxTop = Math.max(margin, lowerBoundary - railHeight);
        const top = Math.round(Math.max(margin, Math.min(centeredTop, maxTop)));

        N.root.style.setProperty('--nexus-dynamic-rail-top', top + 'px');
        N.root.style.setProperty('--nexus-dynamic-rail-height', Math.floor(available) + 'px');
        N.root.style.setProperty('--nexus-controls-top', Math.round(controlsRect.top) + 'px');
        N.rail.classList.toggle('nexus-rail-scrolls', contentHeight > available + 1);
      });
    };

    N.updateDynamicRailLayout = update;

    const observer = new MutationObserver(update);
    observer.observe(N.icons, { childList:true, subtree:true, attributes:true });
    observer.observe(controls, { childList:true, subtree:true, attributes:true });

    const resizeObserver = typeof ResizeObserver === 'function'
      ? new ResizeObserver(update)
      : null;
    resizeObserver?.observe(N.icons);
    resizeObserver?.observe(controls);

    window.addEventListener('resize', update, { passive:true });
    window.addEventListener('orientationchange', update, { passive:true });

    const oldRender = N.renderRail?.bind(N);
    if (oldRender) {
      N.renderRail = (...args) => {
        const result = oldRender(...args);
        update();
        return result;
      };
    }

    N.cleanup?.push?.(() => {
      observer.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      cancelAnimationFrame(raf);
    });

    update();
    setTimeout(update, 120);
  }
})();