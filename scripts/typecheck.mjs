import { spawnSync } from 'node:child_process';
const files = [
  'Nexus-V2/nexus-sidebar-next/src/core/app.js',
  'Nexus-V2/nexus-sidebar-next/src/core/storage.js',
  'Nexus-V2/nexus-sidebar-next/sidebar/sidebar.js',
  'Nexus-V2/nexus-sidebar-next/background.js'
];
for (const f of files) {
  const r = spawnSync(process.execPath, ['--check', f], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log('type/syntax check ok');
