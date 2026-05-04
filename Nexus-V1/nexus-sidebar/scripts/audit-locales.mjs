#!/usr/bin/env node
import fs from 'fs';
const file = fs.readFileSync('Nexus-V1/nexus-sidebar/sidebar/sidebar.js','utf8');
const keys = [...file.matchAll(/tr\('([^']+)'/g)].map(m=>m[1]);
const unique=[...new Set(keys)];
const i18nBlock = file.match(/const I18N = (\{[\s\S]*?\n\};)/);
const raw = i18nBlock[1].replace(/;\s*$/, '');
const I18N = Function(`return (${raw})`)();
const get=(o,p)=>p.split('.').reduce((a,k)=>a&&a[k],o);
let missing=0;
for (const lang of ['en','zh-CN']) for (const k of unique) if (get(I18N[lang],k)===undefined){console.log(`[missing] ${lang}: ${k}`);missing++;}
if (!missing) console.log(`OK: ${unique.length} keys covered in en + zh-CN`);
process.exit(missing?1:0);
