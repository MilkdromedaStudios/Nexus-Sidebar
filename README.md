# Nexus Sidebar — Cross-Browser Overlay Sidebar (Opera GX Friendly)

This README captures the expected behavior and implementation direction for the extension, with focus on **Opera GX compatibility**.

## Goal

Build a futuristic, tile-based sidebar that behaves like a **real visual overlay popup** instead of relying on Chrome's side panel UI constraints.

---

## Product requirements (requested behavior)

### 1) Do not depend on Chrome Sidebar API for the core UX
- Primary sidebar UX should **not depend on `chrome.sidePanel`**.
- Reason: portability to Opera GX and better control over layout, animation, and iframe behavior.
- Keep browser-specific integrations optional/fallback.

### 2) Edge-triggered autohide sidebar
- Sidebar is anchored to configurable side: left or right.
- By default it remains hidden (autohide).
- Moving cursor to edge opens **only the slim tile sidebar**, not a full menu.
- Leaving the sidebar area auto-collapses it.

### 3) Tile-first futuristic layout
- Tiles should be spaced (not cramped), modern, and glass-themed.
- Support separators/spacers between tile groups.
- Theme-adaptive tile colors (match browser/site theme where possible).

### 4) Expandable app hub per tile
- Clicking a tile (e.g., Gmail/Weather/Spotify) opens a larger "hub" tile panel.
- Panel content rendered in iframe when allowed.
- Closing the hub shrinks it back to hidden/minimized state.

### 5) Persistent mini-iframes for media/background apps
- For selected custom sites (e.g., Spotify), do not destroy iframe when collapsed.
- Collapse to near-invisible minimal footprint (bottom corner) so media keeps playing.
- Reopen should restore the same iframe/session state quickly.

### 6) Custom pinned sites
- Users can pin their own sites directly into the sidebar.
- Custom sites should appear as tiles (not only on Home/new tab).
- Prefer site-provided icon (`/favicon.ico`, manifest icon, or page icon fallback).

### 7) Search reliability
- "Search everything" should work without requiring keyboard fallback.
- `Ctrl+K` can remain as an additional shortcut, not the only stable path.

### 8) Timer persistence
- Pomodoro timer should not stop on popup exit/collapse.
- Timer state must live in background/service worker + storage, with UI syncing on reopen.

### 9) Layout bug fixes
- Fix greeting clipping ("Good morning" text cut off).
- Ensure responsive spacing and safe text bounds at all supported widths.

### 10) Remove GitHub shortcut
- Remove "Open in GitHub" entry from shipped default UI.

### 11) New tab integration (best effort)
- Add custom new tab experience for Chromium browsers that allow it.
- Opera GX incompatibility is acceptable if it fails silently.
- All core functionality must remain available in sidebar overlay (not new-tab-only).

---

## Technical approach

### Architecture
1. **Content-script overlay shell (primary UI):**
   - Inject sidebar root into pages.
   - Handle edge-hover detection, animations, and glass styling.
2. **Background/service worker (state authority):**
   - Timer, pinned site config, app state, message routing.
3. **Iframe manager:**
   - Pool/reuse iframes for pinned apps.
   - Minimize instead of destroy for persistence scenarios.
4. **Storage + sync strategy:**
   - `chrome.storage.local` for runtime state.
   - `chrome.storage.sync` for user preferences/pins where feasible.

### Compatibility strategy
- Primary UX works with common Chromium extension APIs and DOM overlays.
- Browser-native side panels (Chrome/Opera sidebar APIs) are optional adapters, not required for core behavior.
- Defensive feature detection and graceful degradation for Opera GX differences.

---

## Browser/API notes (research summary)

- Chrome's `chrome.sidePanel` is a Chrome API (MV3, Chrome 114+) and constrains behavior to browser-managed panel UX.
- Opera publishes a list of supported extension APIs and separate Opera-specific sidebar action docs (`opr.sidebarAction`).
- For a consistent Opera GX experience and full custom visuals/edge behavior, an injected overlay approach is more controllable than relying on browser side panel containers.

---

## Definition of done

- [ ] Edge-triggered autohide tile strip works left/right.
- [ ] Tile click opens expandable hub panel.
- [ ] Custom pinned site tiles with fetched site icons.
- [ ] Optional persistent mini-iframe mode keeps audio alive.
- [ ] Pomodoro timer survives UI close/reopen.
- [ ] Search everything works from click + keyboard.
- [ ] Greeting no longer clipped.
- [ ] GitHub quick-link removed.
- [ ] New tab mode added (best effort), no breakage where unsupported.
- [ ] Core feature parity available from sidebar itself.

---

## Notes

Some websites block iframe embedding via `X-Frame-Options` or CSP (`frame-ancestors`). For those, the tile should gracefully fall back to opening in a regular tab/window while preserving sidebar state.
