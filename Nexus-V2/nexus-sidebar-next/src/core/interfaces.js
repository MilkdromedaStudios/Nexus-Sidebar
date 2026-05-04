/** @typedef {{id:string,name:string,init:(ctx:any)=>void}} SidebarModule */

/** @returns {SidebarModule[]} */
export function moduleRegistry() {
  return [];
}
