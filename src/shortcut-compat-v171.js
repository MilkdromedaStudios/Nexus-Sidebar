(() => {
  'use strict';
  if(window.__nexusShortcutCompatV171)return;
  window.__nexusShortcutCompatV171=true;

  // Register before v17's legacy shortcut listener. Do not preventDefault so
  // Ctrl+Shift+N can return to the browser's normal private-window behavior.
  document.addEventListener('keydown',e=>{
    const ctrl=e.ctrlKey||e.metaKey;
    if(ctrl&&e.shiftKey&&e.key.toLowerCase()==='n')e.stopImmediatePropagation();
  },true);

  const install=()=>setTimeout(()=>{
    const N=window.NexusSidebar;if(!N)return;
    const polish=()=>{
      for(const row of N.body.querySelectorAll('.nx-kbd-list span')){
        if(/Command Palette/i.test(row.textContent||''))row.innerHTML='<kbd>Ctrl</kbd>+<kbd>Space</kbd> Universal Command';
        if(/Nexus Hub/i.test(row.textContent||''))row.innerHTML='<kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>N</kbd> Nexus AI';
      }
    };
    new MutationObserver(polish).observe(N.body,{childList:true,subtree:true});
    polish();
  },0);
  if(window.NexusSidebar)install();
  document.addEventListener('nexus:ready',install,{once:true});
})();
