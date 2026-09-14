import { bootstrapSidebarApp } from '../Nexus-V2/nexus-sidebar-next/src/core/app.js';
const modules = await bootstrapSidebarApp({ smoke: true });
if (!Array.isArray(modules) || modules.length < 8 - 1) process.exit(1);
console.log(`smoke ok (${modules.length} modules)`);
