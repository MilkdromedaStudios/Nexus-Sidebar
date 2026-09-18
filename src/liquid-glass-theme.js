(() => {
  'use strict';
  if (window.__nexusLiquidGlassThemeLoaded) return;
  window.__nexusLiquidGlassThemeLoaded = true;

  const defer = () => setTimeout(install, 0);
  if (window.NexusSidebar) defer();
  document.addEventListener('nexus:ready', defer, { once: true });

  function install() {
    const N = window.NexusSidebar;
    if (!N || N.__liquidGlassThemeInstalled) return;
    N.__liquidGlassThemeInstalled = true;

    const state = {
      initialized: false,
      initializing: false,
      active: false,
      syncRaf: 0,
      lenses: new Map()
    };

    N.root.setAttribute('data-liquid-ignore', '');
    createLens('rail');
    createLens('panel');
    createLens('controls');

    const originalApply = N.apply?.bind(N);
    if (originalApply) {
      N.apply = (...args) => {
        const result = originalApply(...args);
        queueSync();
        return result;
      };
    }

    if (typeof N.renderSettings === 'function') {
      const originalSettings = N.renderSettings.bind(N);
      N.renderSettings = async (...args) => {
        await originalSettings(...args);
        addThemeOption();
      };
    }

    installThemeCommand();
    new MutationObserver(queueSync).observe(N.root, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true
    });
    window.addEventListener('resize', queueSync, { passive: true });
    queueSync();

    function createLens(kind) {
      const lens = document.createElement('div');
      lens.className = 'nexus-liquidgl-lens';
      lens.dataset.kind = kind;
      lens.dataset.liquidIgnore = '';
      document.documentElement.append(lens);
      state.lenses.set(kind, lens);
    }

    function addThemeOption() {
      const appearance = [...N.body.querySelectorAll('.nexus-settings-section')]
        .find(node => node.querySelector('h3')?.textContent === 'Appearance');
      if (!appearance) return;
      const select = [...appearance.querySelectorAll('select')][0];
      if (!select) return;
      if (![...select.options].some(o => o.value === 'liquid-glass')) {
        select.add(new Option('Liquid Glass', 'liquid-glass'));
      }
      select.value = N.settings.theme;
    }

    function installThemeCommand() {
      const bind = () => {
        const palette = N.root.querySelector('#nexus-universal-command-v2');
        const input = palette?.querySelector('input');
        const results = palette?.querySelector('.nxv2-command-results');
        if (!input || !results || input.dataset.liquidGlassBound === '1') return false;
        input.dataset.liquidGlassBound = '1';
        let row = null;
        const update = () => {
          const q = input.value.trim().toLowerCase();
          const match = /^(?:theme\s+)?(?:liquid[ -]?glass|liquidgl)$/.test(q);
          if (!match) {
            row?.remove();
            row = null;
            return;
          }
          if (!row) {
            row = document.createElement('button');
            row.className = 'nxv2-command-result strong';
            row.innerHTML = '<span>THEME</span><div><b>Use Liquid Glass</b><small>WebGPU / WebGL refraction</small></div>';
            row.onclick = async () => {
              N.settings.theme = 'liquid-glass';
              await N.saveSettings();
              N.apply();
              palette.hidden = true;
            };
            results.prepend(row);
          }
        };
        input.addEventListener('input', () => setTimeout(update, 0));
        update();
        return true;
      };
      if (!bind()) {
        const obs = new MutationObserver(() => { if (bind()) obs.disconnect(); });
        obs.observe(N.root, { childList: true, subtree: true });
      }
    }

    function queueSync() {
      cancelAnimationFrame(state.syncRaf);
      state.syncRaf = requestAnimationFrame(syncTheme);
    }

    async function syncTheme() {
      state.syncRaf = 0;
      const should = N.settings.theme === 'liquid-glass' && !N.root.classList.contains('session-hidden');
      state.active = should;
      if (!should) {
        hideLenses();
        pauseRenderer();
        return;
      }

      syncLensGeometry();
      if (!state.initialized && !state.initializing) await initializeLiquidGL();
      resumeRenderer();
      syncLensGeometry();
    }

    function sourceFor(kind) {
      if (kind === 'rail') return N.rail;
      if (kind === 'panel') return N.panel;
      return N.root.querySelector('#nexus-corner-controls');
    }

    function syncLensGeometry() {
      for (const [kind, lens] of state.lenses) {
        const source = sourceFor(kind);
        if (!source) continue;
        const style = getComputedStyle(source);
        const rect = source.getBoundingClientRect();
        let visible = state.active && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0.02;
        if (kind === 'panel') visible = visible && N.panel.classList.contains('open');
        if (kind === 'rail') visible = visible && N.root.classList.contains('rail-visible');
        if (rect.width < 2 || rect.height < 2) visible = false;
        lens.style.display = visible ? 'block' : 'none';
        if (!visible) continue;
        lens.style.left = `${rect.left}px`;
        lens.style.top = `${rect.top}px`;
        lens.style.width = `${rect.width}px`;
        lens.style.height = `${rect.height}px`;
        lens.style.borderRadius = style.borderRadius || (kind === 'panel' ? `${N.settings.radius || 10}px` : '10px');
      }
      document.documentElement.style.setProperty('--nexus-liquid-panel-radius', `${N.settings.radius || 10}px`);
    }

    async function initializeLiquidGL() {
      state.initializing = true;
      try {
        if (document.readyState === 'loading') {
          await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
        }
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (typeof window.liquidGL !== 'function') {
          console.warn('Nexus Liquid Glass: vendored LiquidGL did not load; CSS fallback remains active.');
          return;
        }
        syncLensGeometry();
        window.liquidGL({
          target: '.nexus-liquidgl-lens',
          snapshot: 'body',
          engine: 'auto',
          resolution: 1.0,
          refraction: 0.012,
          aberration: 0.018,
          bevelDepth: 0.075,
          bevelWidth: 0.16,
          frost: 2,
          shadow: true,
          specular: true,
          reveal: 'none',
          tilt: false,
          magnify: 1.008
        });
        state.initialized = true;
        const renderer = window.__liquidGLRenderer__;
        renderer?.captureSnapshot?.();
      } catch (error) {
        console.warn('Nexus Liquid Glass initialization failed; using CSS fallback.', error);
      } finally {
        state.initializing = false;
      }
    }

    function pauseRenderer() {
      const renderer = window.__liquidGLRenderer__;
      if (!renderer || !renderer._rafId || renderer.useExternalTicker) return;
      cancelAnimationFrame(renderer._rafId);
      renderer._rafId = null;
    }

    function resumeRenderer() {
      if (!state.initialized || !state.active) return;
      const renderer = window.__liquidGLRenderer__;
      if (!renderer || renderer._rafId || renderer.useExternalTicker) return;
      renderer.captureSnapshot?.();
      const loop = () => {
        if (!state.active) {
          renderer._rafId = null;
          return;
        }
        syncLensGeometry();
        renderer.render();
        renderer._rafId = requestAnimationFrame(loop);
      };
      renderer._rafId = requestAnimationFrame(loop);
    }

    function hideLenses() {
      for (const lens of state.lenses.values()) lens.style.display = 'none';
    }
  }
})();
