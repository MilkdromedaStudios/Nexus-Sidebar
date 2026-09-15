(() => {
  'use strict';
  if (window.__nexusControlsAutohideInstalled) return;
  window.__nexusControlsAutohideInstalled = true;

  function install() {
    const N = window.NexusSidebar;
    const controls = N?.root?.querySelector('#nexus-corner-controls');
    if (!N || !controls || controls.dataset.autohideBound === '1') return;
    controls.dataset.autohideBound = '1';

    const originalSchedule = N.scheduleAutoHide?.bind(N);
    if (originalSchedule) {
      N.scheduleAutoHide = delay => {
        if (controls.matches(':hover')) return;
        return originalSchedule(delay);
      };
    }

    controls.addEventListener('pointerenter', () => N.show?.());
    controls.addEventListener('pointerleave', () => N.scheduleAutoHide?.());
    controls.addEventListener('focusin', () => N.show?.());
    controls.addEventListener('focusout', e => {
      if (!controls.contains(e.relatedTarget)) N.scheduleAutoHide?.();
    });
  }

  if (window.NexusSidebar) install();
  document.addEventListener('nexus:ready', install);
})();
