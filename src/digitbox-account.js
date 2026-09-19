(() => {
  'use strict';
  if (window.__nexusDigitBoxAccountLoaded) return;
  window.__nexusDigitBoxAccountLoaded = true;

  const LOGIN_URL = 'https://digitbox.dev/login?next=/profile';
  const PROFILE_URL = 'https://digitbox.dev/profile';
  const DIGITBOX_HOSTS = new Set(['digitbox.dev', 'www.digitbox.dev', 'digitbox.pages.dev']);
  let refreshTimer = 0;

  const start = () => setTimeout(install, 30);
  if (window.NexusSidebar) start();
  document.addEventListener('nexus:ready', start, { once: true });

  function install() {
    const N = window.NexusSidebar;
    if (!N || N.__digitBoxAccountInstalled) return;
    N.__digitBoxAccountInstalled = true;

    installProfileButton(N);
    N.showMemberPrompt = (feature = 'Nexus') => openAccountPanel(N, feature);
    N.openDigitBoxProfile = () => N.isGuest ? openAccountPanel(N) : openProfilePanel(N);

    refresh(N, true);
    if (isDigitBoxPage()) {
      const poll = setInterval(async () => {
        await refresh(N, true);
        if (!N.isGuest) clearInterval(poll);
      }, 1500);
      window.addEventListener('pagehide', () => clearInterval(poll), { once: true });
    }

    window.addEventListener('focus', () => refresh(N, true));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(N); });
    chrome.runtime.onMessage.addListener(message => {
      if (message?.type !== 'nexus:digitbox-auth-changed') return;
      applyStatus(N, { ok: true, signedIn: !!message.signedIn, user: message.user || null });
    });

    refreshTimer = setInterval(() => refresh(N), 30 * 1000);
    window.addEventListener('pagehide', () => clearInterval(refreshTimer), { once: true });
  }

  function isDigitBoxPage() {
    const host = location.hostname.toLowerCase();
    return DIGITBOX_HOSTS.has(host) || host.endsWith('.digitbox.pages.dev');
  }

  async function refresh(N, force = false) {
    const status = await N.msg({ type: 'nexus:digitbox-status', force });
    applyStatus(N, status);
    return status;
  }

  function applyStatus(N, status) {
    if (status?.signedIn && status.user) {
      N.isGuest = false;
      N.accountTier = 'member';
      N.digitboxUser = status.user;
    } else {
      N.isGuest = true;
      N.accountTier = 'guest';
      N.digitboxUser = null;
    }

    if (N.isGuest && N.active && !N.canUseItem?.(N.active, String(N.active.id || '').startsWith('site-'))) {
      N.closePanelSoft?.();
    }

    N.apply?.();
    N.renderRail?.();
    paintProfileButton(N);

    if (N.active?.id === 'settings') N.renderSettings?.();
    if (N.active?.id === 'digitbox-profile' || N.active?.id === 'digitbox-account') {
      N.isGuest ? openAccountPanel(N) : openProfilePanel(N);
    }
  }

  function installProfileButton(N) {
    const controls = N.root.querySelector('#nexus-corner-controls');
    if (!controls || controls.querySelector('#nexus-profile-widget')) return;
    const button = document.createElement('button');
    button.id = 'nexus-profile-widget';
    button.className = 'nexus-icon nexus-util';
    button.title = 'DigitBox';
    button.innerHTML = '<span class="nexus-profile-avatar"><span>D</span></span><i class="nexus-profile-status"></i>';
    button.onclick = () => N.isGuest ? openAccountPanel(N) : openProfilePanel(N);
    controls.prepend(button);
    paintProfileButton(N);
  }

  function paintProfileButton(N) {
    const button = N.root.querySelector('#nexus-profile-widget');
    if (!button) return;
    const avatar = button.querySelector('.nexus-profile-avatar');
    const status = button.querySelector('.nexus-profile-status');
    const user = N.digitboxUser;

    button.classList.toggle('guest', !!N.isGuest);
    status?.classList.toggle('connected', !N.isGuest);

    if (N.isGuest || !user) {
      avatar.innerHTML = '<span>D</span>';
      button.title = 'Sign in with DigitBox';
      return;
    }

    button.title = user.displayName || user.email || 'DigitBox';
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

  function openLocalPanel(N, id, title, subtitle) {
    N.runCleanup?.();
    N.applyPanelWidth?.(id);
    N.active = { id, name: title, icon: 'home', type: 'account-local' };
    N.setHeader?.(N.active);
    N.root.querySelector('#nexus-title').textContent = title;
    N.root.querySelector('#nexus-subtitle').textContent = subtitle;
    N.panel.classList.add('open');
    N.root.classList.add('rail-visible');
    N.showLocal?.();
    N.body.replaceChildren();
  }

  function openAccountPanel(N, feature = '') {
    openLocalPanel(N, 'digitbox-account', 'DigitBox', 'Account');
    const wrap = document.createElement('div');
    wrap.className = 'nexus-account-panel';

    const hero = document.createElement('section');
    hero.className = 'nexus-account-profile-card guest-card';
    hero.innerHTML = `
      <div class="nexus-account-avatar-large guest-avatar">D</div>
      <div class="nexus-account-profile-copy">
        <small>DIGITBOX</small>
        <h2>Sign in</h2>
      </div>`;

    if (feature) {
      const requested = document.createElement('section');
      requested.className = 'nexus-member-needed';
      requested.innerHTML = '<b></b><p>Sign in with DigitBox.</p>';
      requested.querySelector('b').textContent = feature;
      wrap.append(hero, requested);
    } else {
      wrap.append(hero);
    }

    const actions = document.createElement('section');
    actions.className = 'nexus-account-actions';
    const login = document.createElement('button');
    login.textContent = 'Sign in with DigitBox';
    login.className = 'primary';
    const check = document.createElement('button');
    check.textContent = 'Check sign-in';
    login.onclick = () => openExternal(N, LOGIN_URL);
    check.onclick = async () => {
      check.disabled = true;
      check.textContent = 'Checking…';
      const status = await refresh(N, true);
      if (status?.signedIn) return;
      check.disabled = false;
      check.textContent = 'Check sign-in';
    };
    actions.append(login, check);

    wrap.append(actions);
    N.body.append(wrap);
  }

  async function openProfilePanel(N) {
    const user = N.digitboxUser;
    if (!user) return openAccountPanel(N);

    openLocalPanel(N, 'digitbox-profile', user.displayName || 'Profile', 'DigitBox');
    const wrap = document.createElement('div');
    wrap.className = 'nexus-account-panel';

    const hero = document.createElement('section');
    hero.className = 'nexus-account-profile-card';
    const role = user.owner ? 'Owner' : user.admin ? 'Admin' : 'Member';
    hero.innerHTML = `
      <div class="nexus-account-avatar-large"></div>
      <div class="nexus-account-profile-copy">
        <small>DIGITBOX</small>
        <h2></h2>
        <p></p>
        <span class="nexus-account-role"></span>
      </div>`;
    hero.querySelector('h2').textContent = user.displayName || 'Player';
    hero.querySelector('p').textContent = user.email || '';
    hero.querySelector('.nexus-account-role').textContent = role;

    const avatarBox = hero.querySelector('.nexus-account-avatar-large');
    if (user.avatarUrl) {
      const img = document.createElement('img');
      img.src = user.avatarUrl;
      img.alt = '';
      avatarBox.append(img);
    } else {
      avatarBox.textContent = String(user.displayName || user.email || 'D').charAt(0).toUpperCase();
    }

    const actions = document.createElement('section');
    actions.className = 'nexus-account-actions';
    const upload = document.createElement('button');
    upload.textContent = 'Change picture';
    const profile = document.createElement('button');
    profile.textContent = 'Open profile';
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
        upload.textContent = 'Change picture';
      }
    };

    profile.onclick = () => openExternal(N, PROFILE_URL);
    remove.onclick = async () => {
      if (!confirm('Remove your DigitBox profile picture?')) return;
      const result = await N.msg({ type: 'nexus:digitbox-avatar-delete' });
      if (result?.ok) {
        N.digitboxUser = result.user || N.digitboxUser;
        paintProfileButton(N);
        openProfilePanel(N);
      }
    };
    actions.append(upload, profile, remove, file);

    wrap.append(hero, actions);
    N.body.append(wrap);
  }

  async function openExternal(N, url) {
    const result = await N.msg({ type: 'nexus:open-tab', url });
    if (result?.ok) return;
    try { window.open(url, '_blank', 'noopener,noreferrer'); } catch {}
  }

  async function prepareAvatar(file) {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Use a PNG, JPG, or WebP image.');
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
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
    return canvas.toDataURL('image/webp', .88);
  }
})();
