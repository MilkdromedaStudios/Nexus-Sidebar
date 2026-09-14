# Storage Migration Plan (V1 -> V2)

## Scope
Migrate V1 flat keys to V2 namespaced keys without deleting legacy keys in the first release.

## Key Mapping
| Legacy Key | V2 Key |
|---|---|
| `onboardingCompleted` | `v2.user.onboarding.completed` |
| `language` | `v2.user.locale` |
| `theme` | `v2.ui.theme` |
| `todos` | `v2.tiles.todo.items` |
| `notes` | `v2.tiles.notes.items` |
| `pomodoroState` | `v2.pomodoro.state` |

## Rollout Steps
1. Run migration at app bootstrap.
2. Write migrated values to V2 keyspace.
3. Record timestamp at `v2.meta.migration.completedAt`.
4. Keep dual-read compatibility during transition window.
5. Remove legacy reads in a later major release.
