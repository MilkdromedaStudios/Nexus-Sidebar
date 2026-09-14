import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['Nexus-V2/nexus-sidebar-next/src', 'Nexus-V2/nexus-sidebar-next/sidebar'];
const files = [];
for (const root of roots) walk(root, files);

let failed = false;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if (text.includes('\t')) {
    console.error(`Tab character found: ${file}`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log(`lint ok (${files.length} files)`);

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else if (name.endsWith('.js')) out.push(full);
  }
}
