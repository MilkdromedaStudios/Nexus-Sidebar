(() => {
  'use strict';
  const install = () => {
    const N = window.NexusSidebar;
    if (!N || N.__nexusAiInstalled) return;
    N.__nexusAiInstalled = true;
    const feature = { id: 'nexus-ai', name: 'Nexus AI', icon: 'sparkle', type: 'local' };
    N.FEATURES.push(feature);
    const allowed = N.canUseItem?.bind(N);
    N.canUseItem = (item, custom) => item?.id === 'nexus-ai' ? true : allowed?.(item, custom);
    const oldActivate = N.activate?.bind(N);
    N.activate = (item, custom) => item?.id === 'nexus-ai' ? render() : oldActivate?.(item, custom);
    if (!N.settings.railLayout.includes('nexus-ai')) {
      N.settings.railLayout.splice(Math.max(0, N.settings.railLayout.indexOf('launchpad') + 1), 0, 'nexus-ai');
      N.saveSettings?.();
    }
    N.renderRail?.();
    function render() {
      N.runCleanup?.();
      N.active = feature;
      N.setHeader(feature);
      N.panel.classList.add('open');
      N.root.classList.add('rail-visible');
      N.showLocal?.();
      N.renderRail?.();
      N.body.replaceChildren();
      const wrap = document.createElement('section');
      wrap.className = 'nexus-ai';
      wrap.innerHTML = '<div class="nexus-ai-top"><strong>✦ Nexus AI</strong><span>Powered by DigitBox AI</span></div><div class="nexus-ai-status" role="status">Connecting…</div><div class="nexus-ai-messages" aria-live="polite"></div><form class="nexus-ai-form"><textarea placeholder="Ask Nexus AI anything…" rows="3" maxlength="16000" aria-label="Message Nexus AI"></textarea><button type="submit">Send</button></form><div class="nexus-ai-links"><a href="https://digitbox.dev/ai" target="_blank" rel="noopener noreferrer">Open on DigitBox</a><a href="https://digitbox.dev/profile#digitbox-pro" target="_blank" rel="noopener noreferrer">Plans</a></div>';
      N.body.append(wrap);
      const info = wrap.querySelector('.nexus-ai-status');
      const log = wrap.querySelector('.nexus-ai-messages');
      const form = wrap.querySelector('form');
      const input = form.querySelector('textarea');
      const button = form.querySelector('button');
      const conversation = [];
      let model = '';
      const message = (role, text) => {
        const el = document.createElement('div');
        el.className = 'nexus-ai-bubble ' + role;
        el.textContent = text;
        log.append(el);
        log.scrollTop = log.scrollHeight;
        return el;
      };
      async function check() {
        const r = await N.msg({ type: 'nexus:ai-status' });
        if (!wrap.isConnected) return;
        if (!r?.ok || !r.signedIn) {
          info.textContent = r?.error || 'Sign in to DigitBox to start chatting.';
          input.disabled = true;
          button.disabled = true;
          const a = document.createElement('a');
          a.href = 'https://digitbox.dev/login?next=/ai';
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = 'Sign in with DigitBox';
          info.append(document.createElement('br'), a);
          return;
        }
        const options = Array.isArray(r.models) ? r.models : [];
        model = r.defaultModel || options[0]?.id || '';
        const limit = r.usage?.remaining;
        info.textContent = (r.plan === 'pro' ? 'DigitBox Pro' : 'DigitBox Free') + (limit == null ? ' · Ready' : ' · ' + limit + ' messages left today');
        input.disabled = !r.configured;
        button.disabled = !r.configured;
        if (!r.configured) info.textContent = 'DigitBox AI is not configured yet.';
      }
      form.addEventListener('submit', async ev => {
        ev.preventDefault();
        const prompt = input.value.trim();
        if (!prompt || button.disabled) return;
        input.value = '';
        conversation.push({ role: 'user', content: prompt });
        message('user', prompt);
        const reply = message('assistant', 'Thinking…');
        button.disabled = true;
        input.disabled = true;
        const response = await N.msg({ type: 'nexus:ai-chat', messages: conversation.slice(-24), model });
        if (!wrap.isConnected) return;
        if (response?.ok) {
          reply.textContent = response.text;
          conversation.push({ role: 'assistant', content: response.text });
        } else {
          reply.textContent = response?.error || 'Could not get a response.';
          conversation.pop();
        }
        button.disabled = false;
        input.disabled = false;
        if (response?.code === 'signed_out') check();
        else if (response?.ok) check();
        input.focus();
      });
      input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
      check();
    }
  };
  if (window.NexusSidebar) install();
  document.addEventListener('nexus:ready', install);
})();
