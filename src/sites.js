document.addEventListener('nexus:ready', () => {
  const N = window.NexusSidebar;
  const MAX_LIVE_SESSIONS = 2;\n\n  function embedUrl(raw) {\n    try {\n      const u = new URL(raw);\n      if (u.hostname === 'open.spotify.com') {\n        const match = u.pathname.match(/^\\/(track|album|playlist|show|episode)\\/([A-Za-z0-9]+)/);\n        if (match) return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator`;\n      }\n      return u.href;\n    } catch { return raw; }\n  }

  N.destroySite = async id => {
    const s = N.sessions.get(id);
    if (!s) return;
    try {
      s.iframe.src = 'about:blank';
      s.frame.remove();
    } catch {}
    N.sessions.delete(id);
    await N.msg({ type: 'nexus:frame-disable', url: s.item?.url || '' });
  };

  N.showLocal = () => {
    N.body.hidden = false;
    N.sessionsHost.classList.remove('visible');
    for (const s of N.sessions.values()) s.frame.classList.remove('active');
  };

  N.showSite = s => {
    N.body.hidden = true;
    N.sessionsHost.classList.add('visible');
    for (const x of N.sessions.values()) x.frame.classList.toggle('active', x === s);
    s.lastUsed = Date.now();
  };

  async function trimSessions(exceptId) {
    const others = [...N.sessions.entries()]
      .filter(([id]) => id !== exceptId)
      .sort((a, b) => (a[1].lastUsed || 0) - (b[1].lastUsed || 0));
    while (N.sessions.size >= MAX_LIVE_SESSIONS && others.length) {
      const [id] = others.shift();
      await N.destroySite(id);
    }
  }

  N.openSite = async item => {
    let session = N.sessions.get(item.id);
    if (!session) {
      await trimSessions(item.id);
      const ok = await N.msg({ type: 'nexus:frame-enable', url: item.url });
      if (!ok?.ok) {
        N.showLocal();
        N.body.innerHTML = `<div class="nexus-empty">Could not enable the embedded site.<br>${ok?.error || ''}</div>`;
        return;
      }
      if (N.settings.cookieSync) await N.msg({ type: 'nexus:cookie-allow', url: item.url });

      const frame = document.createElement('div');
      frame.className = 'nexus-session';
      const bar = document.createElement('div');
      bar.className = 'nexus-sitebar';
      const host = document.createElement('span');
      host.textContent = new URL(item.url).hostname;

      const external = document.createElement('button');
      external.textContent = '↗';
      external.title = 'Open in browser tab';
      external.onclick = () => N.msg({ type: 'nexus:open-tab', url: item.url });

      const reload = document.createElement('button');
      reload.textContent = '↻';
      reload.title = 'Reload site';

      const close = document.createElement('button');
      close.textContent = '✕';
      close.title = 'End live session';

      const iframe = document.createElement('iframe');
      iframe.src = item.url;
      iframe.name = 'nexus:' + item.id;
      iframe.loading = 'lazy';
      iframe.allow = 'autoplay *; clipboard-read *; clipboard-write *; encrypted-media *; fullscreen *; picture-in-picture *';\n      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';\n      if (framedUrl !== item.url) host.textContent += ' · media player';

      reload.onclick = () => {
        try {
          const current = iframe.src;
          iframe.src = 'about:blank';
          requestAnimationFrame(() => { iframe.src = current; });
        } catch {}
      };
      close.onclick = async () => {
        await N.destroySite(item.id);
        N.closePanelSoft();
      };

      bar.append(host, external, reload, close);
      frame.append(bar, iframe);
      N.sessionsHost.append(frame);
      session = { frame, iframe, item, lastUsed: Date.now() };
      N.sessions.set(item.id, session);
    }
    N.showSite(session);
  };

  N.addSite = async (name, url) => {
    url = String(url || '').trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    try { url = new URL(url).href; } catch { return false; }
    const item = { id: 'site-' + crypto.randomUUID(), name: name.trim() || new URL(url).hostname, url, type: 'web' };
    N.sites.push(item);
    N.settings.railLayout = N.normalizeLayout();
    await N.storeSet({ nexusSites: N.sites, nexusSettings: N.settings });
    N.renderRail();
    return true;
  };

  N.removeSite = async id => {
    await N.destroySite(id);
    N.sites = N.sites.filter(x => x.id !== id);
    N.settings.railLayout = (N.settings.railLayout || []).filter(x => x !== id);
    N.settings.hiddenIcons = (N.settings.hiddenIcons || []).filter(x => x !== id);
    await N.storeSet({ nexusSites: N.sites, nexusSettings: N.settings });
    N.renderRail();
  };
});
