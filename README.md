# Nexus Sidebar (Clean PR)

This repository is organized for a clean review path.

Primary extension path:
- `Nexus-V1/nexus-sidebar/`

---

## Functions & Description

Nexus Sidebar is a tile-first productivity extension for Chromium browsers.

### Core functions
- Dashboard with greeting, stats, quick sites, and mini widgets
- Todo / Notes / Calendar / Pomodoro productivity workflow
- Bookmarks / Weather / Clock / Calculator / Habits tools
- Password generator / Color picker / Unit converter / News panel
- Theme and layout customization from Settings
- Background worker support for alarms, notifications, context menus, and commands
- Onboarding welcome flow with language selection (English + Simplified Chinese)

### Description
- The app runs as a sidebar-focused extension UI with persistent local storage.
- `Nexus-V1/nexus-sidebar/sidebar/` contains main UI (`sidebar.html`, `sidebar.css`, `sidebar.js`).
- `Nexus-V1/nexus-sidebar/background.js` manages background lifecycle tasks.

---

## Installation

### Load unpacked (Chrome / Edge / Opera GX)
1. Open extensions page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Opera GX: `opera://extensions`
2. Enable **Developer Mode**.
3. Click **Load unpacked**.
4. Select: `Nexus-V1/nexus-sidebar/`.

---

## Other Stuff

### Keyboard shortcuts (default)
- Toggle sidebar: `Ctrl+Shift+S`
- Open Todo: `Ctrl+Shift+T`
- Open Notes: `Ctrl+Shift+N`
- Open Pomodoro: `Ctrl+Shift+P`

### Data & storage
- Uses `chrome.storage.local` for settings and app data.
- Settings include language, onboarding completion, and media monitor options.

### Troubleshooting
- Reload unpacked extension after updates.
- If onboarding reappears unexpectedly, check `onboardingCompleted` in local storage data.
- Validate manifest and JS syntax if needed:
  - `node --check Nexus-V1/nexus-sidebar/sidebar/sidebar.js`
  - `node --check Nexus-V1/nexus-sidebar/background.js`

### Changelog
- See `CHANGELOG.md` for release history.
