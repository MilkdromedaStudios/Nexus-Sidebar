export const LEGACY_TO_V2_KEYMAP = {
  onboardingCompleted: 'v2.user.onboarding.completed',
  language: 'v2.user.locale',
  theme: 'v2.ui.theme',
  todos: 'v2.tiles.todo.items',
  notes: 'v2.tiles.notes.items',
  pomodoroState: 'v2.pomodoro.state'
};

export async function migrateLegacyStorage(storageApi) {
  const resolvedStorage = storageApi ?? globalThis.chrome?.storage?.local;
  if (!resolvedStorage) return { migrated: 0, missing: true };
  const legacyKeys = Object.keys(LEGACY_TO_V2_KEYMAP);
  const data = await resolvedStorage.get(legacyKeys);
  const patch = {};

  for (const [oldKey, newKey] of Object.entries(LEGACY_TO_V2_KEYMAP)) {
    if (Object.prototype.hasOwnProperty.call(data, oldKey)) {
      patch[newKey] = data[oldKey];
    }
  }

  if (Object.keys(patch).length > 0) await resolvedStorage.set(patch);
  await resolvedStorage.set({ 'v2.meta.migration.completedAt': new Date().toISOString() });

  return { migrated: Object.keys(patch).length, missing: false };
}
