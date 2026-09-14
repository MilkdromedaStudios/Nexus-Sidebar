# Edge Behavior Manual Scenarios

## Left-position sidebar
1. In Settings, set `sidebarPosition` to `left`.
2. Move pointer to left edge trigger zone.
3. Verify rail appears (`state-rail-open`) and main panel content remains hidden.
4. Click any tile in rail.
5. Verify panel expands (`state-panel-open`) and selected panel renders.
6. Move mouse away from app when `autoHideSidebar=true`.
7. Verify rail + panel collapse (`state-closed`).

## Right-position sidebar
1. In Settings, set `sidebarPosition` to `right`.
2. Move pointer to right edge trigger zone.
3. Verify rail appears (`state-rail-open`) and content does not expand prematurely.
4. Click outside app when `closeOnOutsideClick=true`.
5. Verify sidebar collapses (`state-closed`).

## Regression checks
- Hovering the *non-configured* edge must not open rail.
- Edge hover must never auto-open content panel without a tile click.
