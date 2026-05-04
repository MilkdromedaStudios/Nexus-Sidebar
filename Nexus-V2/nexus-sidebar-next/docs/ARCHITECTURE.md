# Nexus Sidebar Next Architecture

- `src/core`: bootstrap, module contracts, storage migration.
- `src/overlay`: shell and layout orchestration.
- `src/tiles`: tile registry and tile runtime.
- `src/iframes`: isolated external views.
- `src/search`: unified command/search surface.
- `src/pomodoro`: timer state and actions.
- `src/settings`: preferences domain.
- `src/i18n`: locale loading and string lookup.

All modules expose explicit `init*Module(context)` interfaces.
