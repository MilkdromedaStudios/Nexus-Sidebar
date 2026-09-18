(() => {
  'use strict';
  if (window.__nexusDigitBoxAccountLoaded) return;
  window.__nexusDigitBoxAccountLoaded = true;

  const WEBSITE_AUTH_KEY = 'digitbox-deepforge-auth-v1';
  const DIGITBOX_HOSTS = new Set(['digitbox.dev','www.digitbox.dev','digitbox.pages.dev']);
  let refreshTimer = 0;

  const start = () => setTimeout(install, 20);
  if (window.NexusSidebar) start();
  document.addEventListener('nexus:ready', start, { once: true });

  function install() {
    const N = window.NexusSidebar;
    if (!N || N.__digitBoxAccountInstalled) return;
    N.__digitBoxAccountInstalled = true;
    N.accountLocked = true;
    installProfileButton(N);
    wrapNexusActions(N);
    importWebsiteSession(N);
    refresh(N, true);
    window.addEventListener('focus', () => refresh(N));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(N); });
    chrome.runtime.onMessage.addListener(message => {
      if (message?.type !== 'nexus:digitbox-auth-changed') return;
      applyStatus(N, { ok: true, signedIn: !!message.signedIn, user: message.user || null });
    });
    refreshTimer = window.setInterval(() => refresh(N), 5 * 60 * 1000);
    window.addEventListener('pagehide', () => clearInterval(refreshTimer), { once: true });
  }

  function isDigitBoxPage() {
    const host = location.hostname.toLowerCase();
    return DIGITBOX_HOSTS.has(host) || host.endsWith('.digitbox.pages.dev');
  }

  async function importWebsiteSession(N) {
    if (!isDigitBoxPage()) return;
    const send = async () => {
      let raw = '';
      try { raw = localStorage.getItem(WEBSITE_AUTH_KEY) || ''; } catch {}
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (!parsed?.token) return;
        const result = await N.msg({ type: 'nexus:digitbox-import', token: parsed.token, expiresAt: parsed.expiresAt || 0 });
        if (result?.signedIn) applyStatus(N, result);
      } catch {}
    };
    await send();
    window.addEventListener('storage', event => { if (event.key === WEBSITE_AUTH_KEY) send(); });
    window.addEventListener('digitbox:cloud-auth-updated', send);
    setTimeout(send, 900);
  }

  async function refresh(N, force = false) {
    const status = await N.msg({ type: 'nexus:digitbox-status', force });
    applyStatus(N, status);
  }

  function applyStatus(N, status) {
    if (status?.signedIn && status.user) {
      N.digitboxUser = status.user;
      N.accountLocked = false;
      N.root.classList.remove('account-locked');
      removeGate(N);
      paintProfileButton(N);
      return;
    }
    N.digitboxUser = null;
    N.accountLocked = true;
    N.root.classList.add('account-locked');
    N.root.classList.remove('rail-visible', 'session-hidden');
    try { sessionStorage.removeItem('nexus-session-hidden'); } catch {}
    N.panel.classList.remove('open');
    showGate(N);
    paintProfileButton(N);
  }

  function showGate(N) {
    let gate = N.root.querySelector('#nexus-account-gate');
    if (!gate) {
      gate = document.createElement('section');
      gate.id = 'nexus-account-gate';
      gate.innerHTML = `
        <div class="nexus-account-gate-card">
          <div class="nexus-account-mark">N</div>
          <small>NEXUS SIDEBAR</small>
          <h2>Sign in with DigitBox</h2>
          <p>Nexus uses your DigitBox account for your profile, avatar, and extension access.</p>
          <button data-login>Continue to DigitBox</button>
          <button class="secondary" data-check>I've signed in · Check again</button>
          <span>Already signed in? Open any DigitBox page and Nexus will detect it automatically.</span>
        </div>`;
      N.root.append(gate);
      gate.querySelector('[data-login]').onclick = () => N.msg({ type: 'nexus:digitbox-open-login' });
      gate.querySelector('[data-check]').onclick = () => refresh(N, true);
    }
    gate.hidden = false;
  }

  function removeGate(N) {
    const gate = N.root.querySelector('#nexus-account-gate');
    if (gate) gate.hidden = true;
  }

  function installProfileButton(N) {
    const controls = N.root.querySelector('#nexus-corner-controls');
    if (!controls || controls.querySelector('#nexus-profile-widget')) return;
    const button = document.createElement('button');
    button.id = 'nexus-profile-widget';
    button.className = 'nexus-icon nexus-util';
    button.title = 'DigitBox profile';
    button.innerHTML = '<span class="nexus-profile-avatar"><span>N</span></span>';
    button.onclick = () => {
      if (N.accountLocked) return showGate(N);
      openProfilePanel(N);
    };
    controls.prepend(button);
  }

  function paintProfileButton(N) {
    const button = N.root.querySelector('#nexus-profile-widget');
    if (!button) return;
    const avatar = button.querySelector('.nexus-profile-avatar');
    const user = N.digitboxUser;
    if (!user) {
      avatar.innerHTML = '<span>N</span>';
      button.title = 'DigitBox sign-in required';
      return;
    }
    button.title = user.displayName || user.email || 'DigitBox profile';
    if (user.avatarUrl) {
      const img = document.createElement('img');
      img.src = user.avatarUrl;
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      avatar.replaceChildren(img);
    } else {
      const initial = String(user.displayName || user.email || 'D').trim().charAt(0).toUpperCase();
      avatar.innerHTML = '<span></span>';
      avatar.firstElementChild.textContent = initial || 'D';
    }
  }

  async function openProfilePanel(N) {
    const user = N.digitboxUser;
    if (!user) return showGate(N);
    N.runCleanup?.();
    N.active = { id: 'digitbox-profile', name: 'Profile', icon: 'home', type: 'local' };
    N.setHeader?.(N.active);
    N.root.querySelector('#nexus-title').textContent = user.displayName || 'DigitBox Profile';
    N.root.querySelector('#nexus-subtitle').textContent = 'DigitBox account';
    N.panel.classList.add('open');
    N.root.classList.add('rail-visible');
    N.showLocal?.();
    N.body.replaceChildren();

    const wrap = document.createElement('div');
    wrap.className = 'nexus-account-panel';
    const hero = document.createElement('section');
    hero.className = 'nexus-account-profile-card';
    const role = user.owner ? 'Owner' : user.admin ? 'Admin' : 'DigitBox member';
    hero.innerHTML = `
      <div class="nexus-account-avatar-large"></div>
      <div class="nexus-account-profile-copy">
        <small>DIGITBOX ACCOUNT</small>
        <h2></h2>
        <p></p>
        <span class="nexus-account-role"></span>
      </div>`;
    hero.querySelector('h2').textContent = user.displayName || 'Player';
    hero.querySelector('p').textContent = user.email || '';
    hero.querySelector('.nexus-account-role').textContent = role;
    const avatarBox = hero.querySelector('.nexus-account-avatar-large');
    if (user.avatarUrl) {
      const img = document.createElement('img'); img.src = user.avatarUrl; img.alt = ''; avatarBox.append(img);
    } else {
      avatarBox.textContent = String(user.displayName || user.email || 'D').charAt(0).toUpperCase();
    }

    const actions = document.createElement('section');
    actions.className = 'nexus-account-actions';
    const upload = document.createElement('button');
    upload.textContent = 'Change profile picture';
    const open = document.createElement('button');
    open.textContent = 'Open DigitBox profile';
    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Refresh account';
    const remove = document.createElement('button');
    remove.textContent = 'Remove picture';
    remove.className = 'secondary';
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/png,image/jpeg,image/webp';
    file.hidden = true;
    upload.onclick = () => file.click();
    file.onchange = async () => {
      const picked = file.files?.[0];
      if (!picked) return;
      upload.disabled = true;
      upload.textContent = 'Uploading…';
      try {
        const dataUrl = await prepareAvatar(picked);
        const result = await N.msg({ type: 'nexus:digitbox-avatar-upload', dataUrl });
        if (!result?.ok) throw new Error(result?.error || 'Upload failed.');
        N.digitboxUser = result.user || N.digitboxUser;
        paintProfileButton(N);
        openProfilePanel(N);
      } catch (error) {
        alert(error?.message || String(error));
      } finally {
        upload.disabled = false;
        upload.textContent = 'Change profile picture';
      }
    };
    open.onclick = () => N.msg({ type: 'nexus:digitbox-open-profile' });
    refreshButton.onclick = async () => { await refresh(N, true); if (!N.accountLocked) openProfilePanel(N); };
    remove.onclick = async () => {
      if (!confirm('Remove your DigitBox profile picture?')) return;
      const result = await N.msg({ type: 'nexus:digitbox-avatar-delete' });
      if (result?.ok) {
        N.digitboxUser = result.user || N.digitboxUser;
        paintProfileButton(N);
        openProfilePanel(N);
      }
    };
    actions.append(upload, open, refreshButton, remove, file);

    const status = document.createElement('section');
    status.className = 'nexus-account-meta';
    status.innerHTML = '<b>Connected</b><p>Your DigitBox login is required to use Nexus. Nexus re-checks the account automatically and locks if the session expires.</p>';

    wrap.append(hero, actions, status);
    N.body.append(wrap);
  }

  async function prepareAvatar(file) {
    if (!['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('Use a PNG, JPG, or WebP image.');
    if (file.size > 10 * 1024 * 1024) throw new Error('Choose an image smaller than 10 MB.');
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read the image.'));
      reader.onload = () => resolve(String(reader.result || ''));
      reader.readAsDataURL(file);
    });
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not decode the image.'));
      img.src = dataUrl;
    });
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
    const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
    ctx.drawImage(image, (size - w) / 2, (size - h) / 2, w, h);
    return canvas.toDataURL('image/webp', .88);
  }

  function wrapNexusActions(N) {
    if (N.__digitBoxAccountWrapped) return;
    N.__digitBoxAccountWrapped = true;
    const activate = N.activate?.bind(N);
    if (activate) N.activate = (item, custom = false) => N.accountLocked ? showGate(N) : activate(item, custom);
    const show = N.show?.bind(N);
    if (show) N.show = () => N.accountLocked ? showGate(N) : show();
    const bindCommand = () => {
      if (!window.NexusCommandV2?.open || window.NexusCommandV2.__digitBoxWrapped) return false;
      const original = window.NexusCommandV2.open.bind(window.NexusCommandV2);
      window.NexusCommandV2.open = (...args) => N.accountLocked ? showGate(N) : original(...args);
      window.NexusCommandV2.__digitBoxWrapped = true;
      return true;
    };
    if (!bindCommand()) {
      const observer = new MutationObserver(() => { if (bindCommand()) observer.disconnect(); });
      observer.observe(N.root, { childList: true, subtree: true });
    }
  }
})();