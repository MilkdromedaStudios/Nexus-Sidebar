# Changelog

All notable changes to Nexus Sidebar are documented in this file.

## [1.1.0] - 2026-04-20

### Added
- New guided welcome flow (`sidebar/welcome.html`) with:
  - bold **WELCOME** first screen,
  - keyboard navigation (`ArrowRight` / `ArrowLeft`),
  - language selection step,
  - onboarding completion persistence.
- Initial Simplified Chinese (`zh-CN`) language support for key sidebar UI labels and greetings.
- Language selector in Settings so users can switch between English and Simplified Chinese.
- Background media activity monitor (audible tab tracking) with optional notifications.
- Popup onboarding redirect: if setup is not completed, opening the extension takes users to welcome flow.

### Changed
- Notification icons in background worker now use SVG paths.
- Default settings now include `language`, `onboardingCompleted`, and `mediaActivityMonitor`.

### Notes
- Browser security policies do not allow guaranteed hidden playback from closed tabs for arbitrary websites.
  This release adds monitoring + notifications for active audible tabs as a practical, cross-site approach.
