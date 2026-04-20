# 🚀 Nexus Sidebar

A customizable, tile-first productivity sidebar extension for Chromium browsers.

Nexus Sidebar bundles dashboard + utility widgets (todo, notes, pomodoro, weather, bookmarks, etc.) into one side experience with theme controls, quick actions, and persistent local storage.

---

## ✨ Features

- 🧭 **Sidebar app shell** with pinned navigation and panel switching.
- 🏠 **Dashboard** with greeting, clock, quick sites, and mini widgets.
- ✅ **Productivity widgets**: Todo, Notes, Calendar, Pomodoro, Habits.
- 🛠️ **Utility widgets**: Weather, Clock, Calculator, Password, Color, Converter, News.
- 🎨 **Settings system** with theme, layout, behavior, and data controls.
- 💾 **Persistence** using `chrome.storage.local` with local fallback helpers.
- ⚙️ **Background worker** for defaults, alarms, commands, and context menus.
- 🔎 **Global search** support and keyboard shortcut workflows.
- 🌦️ **Weather improvements** (Open-Meteo primary + fallback).
- 📰 **News feed timing improvements** (sorted by publish time, relative + absolute display).

---

## 🧱 Project Structure

```text
nexus-sidebar/
  manifest.json
  background.js
  popup/
    popup.html
  sidebar/
    sidebar.html
    sidebar.css
    sidebar.js
    welcome.html
  icons/
    icon16.svg
    icon32.svg
    icon48.svg
    icon128.svg
  docs/
    README.md
```

---

## 📦 Installation (Unpacked)

### 🌐 Chrome
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `nexus-sidebar/` folder

### 🌀 Edge
1. Open `edge://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `nexus-sidebar/` folder

### 🎮 Opera GX
1. Open `opera://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `nexus-sidebar/` folder

---

## 🏁 Quick Start

1. Click the extension icon to open the popup.
2. Open the sidebar app.
3. Use the left rail to switch panels.
4. Open **Settings** to customize:
   - theme and accent
   - sidebar position and behavior
   - search engine and quick sites
   - widget-specific options
5. Try these first:
   - Add 2–3 Todo tasks ✅
   - Start a Pomodoro session 🍅
   - Set weather location 🌦️
   - Add your favorite bookmarks 🔖

---

## ⌨️ Keyboard Commands

Defined in `manifest.json`:
- Toggle sidebar: `Ctrl+Shift+S`
- Open Todo: `Ctrl+Shift+T`
- Open Notes: `Ctrl+Shift+N`
- Open Pomodoro: `Ctrl+Shift+P`

👉 Shortcuts can be changed from your browser extension shortcut settings page.

---

## 🗃️ Data & Privacy

- Primary storage: `chrome.storage.local`
- Supports export/import from the settings panel
- Data is intended to remain local unless browser sync features are explicitly enabled later
- Keys include: `nexusSettings`, `nexusTodos`, `nexusNotes`, `nexusHabits`, `nexusBookmarks`, etc.

---

## 🌍 Compatibility Notes

- Built as a Chromium extension (Manifest V3).
- Browser APIs differ across Chromium variants (Chrome/Edge/Opera GX).
- Some websites block iframe embedding via CSP / `X-Frame-Options`; those should open in a normal tab fallback.
- Weather and news depend on external data providers, so source-side delays can still happen occasionally.

---

## 🧪 Troubleshooting

If something does not show up correctly:
1. Reload the unpacked extension from the extensions page.
2. Reopen the sidebar tab/panel.
3. Open DevTools for the extension page and check console errors.
4. Confirm permissions in `manifest.json` match the feature you are testing.
5. If weather/news look stale, click refresh buttons and re-check location/feed settings.

---

## 🗺️ Roadmap Ideas

- 🎵 Better persistent mini-iframe behavior for media apps
- 🧩 More custom tile controls and separators
- 🌈 Additional visual themes and animation presets
- 🔄 Optional cloud sync and profile backup

---

## 📌 Version

Current extension version in manifest: **1.0.0**.
