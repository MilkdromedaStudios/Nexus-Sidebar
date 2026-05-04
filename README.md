# Nexus Sidebar (Active: Modular V2 Path)

This repository now routes active implementation and docs to:

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
- The app runs as a fully custom in-page overlay sidebar renderer with persistent local storage.
- `Nexus-V1/nexus-sidebar/sidebar/` contains main UI (`sidebar.html`, `sidebar.css`, `sidebar.js`).
- `Nexus-V1/nexus-sidebar/background.js` manages background lifecycle tasks.

---

Legacy reference (frozen, no active feature work):

- `Nexus-V1/nexus-sidebar/`

### Changelog
- See `CHANGELOG.md` for release history.


### Sidebar runtime
- Uses a fully custom overlay injected via content scripts (not Chrome sidePanel API).
- Background/popup toggle the overlay through tab message passing.
- Browser internal pages (e.g. chrome://, edge://) do not allow injection and show a graceful notice in popup.
