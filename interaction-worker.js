'use strict';

const NX_V171_COMMAND='open-nexus-command';

async function removeLegacyNexusMenus(){
  try{await new Promise(resolve=>chrome.contextMenus.removeAll(resolve));}catch{}
}
async function sendCommandToActiveTab(query=''){
  try{
    const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});
    if(!tab?.id||!/^(https?|file):/i.test(tab.url||''))return false;
    return await new Promise(resolve=>{
      chrome.tabs.sendMessage(tab.id,{type:'nexus:open-command-v2',query},()=>resolve(!chrome.runtime.lastError));
    });
  }catch{return false;}
}
chrome.commands?.onCommand.addListener(command=>{if(command===NX_V171_COMMAND)sendCommandToActiveTab();});
function purgeLegacyMenus(){
  removeLegacyNexusMenus();
  setTimeout(removeLegacyNexusMenus,250);
  setTimeout(removeLegacyNexusMenus,1000);
}
chrome.runtime.onInstalled.addListener(purgeLegacyMenus);
chrome.runtime.onStartup.addListener(purgeLegacyMenus);
purgeLegacyMenus();
