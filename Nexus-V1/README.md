# Nexus-V1 (Legacy Reference)

This folder is frozen as a **legacy reference only**.

Active implementation and docs moved to:

- `Nexus-V2/nexus-sidebar-next/`

## Load unpacked
1. Open browser extensions page.
2. Enable Developer Mode.
3. Click "Load unpacked".
4. Select `Nexus-V1/nexus-sidebar/`.

## Included
- Full extension source (manifest, background, popup, sidebar, welcome, icons, docs).
- Onboarding flow with language selection (English + Simplified Chinese).
- Weather/news improvements and media activity monitor.


### Sidebar runtime
- Uses a fully custom overlay injected via content scripts (not Chrome sidePanel API).
- Background/popup toggle the overlay through tab message passing.
- Browser internal pages (e.g. chrome://, edge://) do not allow injection and show a graceful notice in popup.
