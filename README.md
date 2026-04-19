# ✨ Welcome to Nexus Sidebar

> A futuristic, glassy, tile-based productivity sidebar built for Chromium browsers — with strong focus on Opera GX compatibility.

Nexus is designed to feel like a **living UI layer** on top of the webpage: fast, modern, and useful without being cramped.

---

## 🚀 Features (Top Highlights)

### 🎯 Core experience
- Tile-first sidebar with modern spacing and visual clarity.
- Glass/futuristic theme direction.
- Sidebar position support (left/right).
- Fast panel navigation across productivity tools.

### 🧠 Productivity tools included
- Dashboard
- Todo
- Notes
- Calendar
- Pomodoro / Focus
- Bookmarks
- Weather
- Clock
- Calculator
- Habits
- Password tools
- Color picker & converter
- News feed
- Settings

### ✅ Requested behavior tracked in this project
- Avoid hard dependency on Chrome-only side panel UX for core behavior.
- Edge-triggered autohide sidebar behavior.
- Expandable tile hub interactions.
- Custom pinned sites (including favicon-first display strategy).
- Search reliability improvements (`Search everything` + `Ctrl+K`).
- Pomodoro persistence across close/reopen.
- Greeting/header layout clipping fixes.
- Remove GitHub shortcut from default UI.
- Best-effort new tab integration while keeping full sidebar functionality.

---

## 🛠 Installation

### Load as unpacked extension (Chrome / Edge / Opera GX)
1. Clone or download this repository.
2. Open your browser extension page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Opera GX: `opera://extensions`
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the folder: `nexus-sidebar/`

### After install
- Open the extension popup from the toolbar.
- Open the sidebar and start customizing panels/settings.
- Configure search engine, quick sites, and theme in Settings.

---

## 🌐 Browser compatibility notes

- `chrome.sidePanel` is Chrome-specific and browser-managed.
- Opera has its own extension API surface (including `opr.sidebarAction`).
- Nexus aims to keep core UX portable via standard Chromium extension patterns and graceful feature detection.

---

## 🧩 Architecture at a glance

- **UI Layer:** `nexus-sidebar/sidebar/`
  - `sidebar.html`
  - `sidebar.css`
  - `sidebar.js`
- **Background Worker:** `nexus-sidebar/background.js`
- **Manifest:** `nexus-sidebar/manifest.json`
- **Popup:** `nexus-sidebar/popup/popup.html`

---

## 📌 Roadmap / Definition of done

- [ ] Edge-triggered autohide tile strip works smoothly on left/right.
- [ ] Tile click opens larger contextual hub panel.
- [ ] Custom pinned site tiles with site icons.
- [ ] Optional persistent mini-iframe mode for media continuity.
- [ ] Pomodoro timer state survives UI lifecycle.
- [ ] Search is reliable without keyboard-only fallback.
- [ ] Greeting text no longer clips.
- [ ] New tab mode (best-effort) without breaking unsupported browsers.

---

## ⚠️ Practical iframe note

Some sites block iframe embedding via `X-Frame-Options` or CSP (`frame-ancestors`).
When that happens, Nexus should gracefully fall back to opening that destination in a tab/window while preserving extension state.

---

## 💜 Welcome message

Thanks for building with Nexus.
If you're iterating UX ideas (tiles, separators, mini-hubs, edge behavior), this repo is structured so you can move quickly and keep polishing the experience.
