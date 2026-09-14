import { initOverlayModule } from '../overlay/index.js';
import { initTilesModule } from '../tiles/index.js';
import { initIframesModule } from '../iframes/index.js';
import { initSearchModule } from '../search/index.js';
import { initPomodoroModule } from '../pomodoro/index.js';
import { initSettingsModule } from '../settings/index.js';
import { initI18nModule } from '../i18n/index.js';
import { migrateLegacyStorage } from './storage.js';

const moduleInitializers = [
  initOverlayModule,
  initTilesModule,
  initIframesModule,
  initSearchModule,
  initPomodoroModule,
  initSettingsModule,
  initI18nModule
];

export async function bootstrapSidebarApp(context = {}) {
  await migrateLegacyStorage();
  return moduleInitializers.map((init) => init(context));
}
