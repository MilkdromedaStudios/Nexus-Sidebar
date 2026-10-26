'use strict';
// Nexus AI: use the existing validated DigitBox session in the extension worker.
// Never return the account token to content scripts.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!['nexus:ai-status', 'nexus:ai-chat'].includes(message?.type)) return;
  (async () => {
    const auth = await status(true);
    if (!auth?.signedIn) return { ok: false, code: 'signed_out', error: 'Sign in to DigitBox to use Nexus AI.' };
    const saved = (await dbGet({ [DIGITBOX.storageKey]: null }))[DIGITBOX.storageKey];
    if (!saved?.token) return { ok: false, code: 'signed_out', error: 'Sign in to DigitBox first.' };
    const chat = message.type === 'nexus:ai-chat';
    const incoming = Array.isArray(message.messages) ? message.messages : [];
    if (chat && (!incoming.length || incoming.length > 24 || incoming.some(m => !['user', 'assistant', 'system'].includes(m?.role) || typeof m?.content !== 'string' || m.content.length > 16000))) {
      return { ok: false, error: 'Invalid or oversized conversation.' };
    }
    const response = await fetch(DIGITBOX.api + (chat ? '/api/ai/chat' : '/api/ai/status'), {
      method: chat ? 'POST' : 'GET',
      headers: { Authorization: 'Bearer ' + saved.token, Accept: 'application/json', ...(chat ? { 'Content-Type': 'application/json' } : {}) },
      ...(chat ? { body: JSON.stringify({ messages: incoming, model: String(message.model || '').slice(0, 100), surface: 'digitbox' }) } : {}),
      cache: 'no-store'
    });
    if (!chat) {
      const body = await response.json().catch(() => ({}));
      return { ok: response.ok, ...body, error: response.ok ? undefined : body.error || 'Could not load AI status.' };
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return { ok: false, code: body.code, error: body.error || 'DigitBox AI could not answer.' };
    }
    const raw = await response.text();
    let text = '';
    for (const block of raw.split(/\r?\n\r?\n/)) {
      for (const line of block.split(/\r?\n/)) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        try { text += JSON.parse(data)?.choices?.[0]?.delta?.content || ''; } catch {}
      }
    }
    return text ? { ok: true, text, remaining: response.headers.get('X-AI-Remaining') } : { ok: false, error: 'The AI returned an empty response.' };
  })().then(sendResponse).catch(err => sendResponse({ ok: false, error: err?.message || 'AI request failed.' }));
  return true;
});
