'use strict';
let nexusLabelWrite=false;
chrome.storage.onChanged.addListener((changes,area)=>{
  if(area!=='local'||nexusLabelWrite||!changes.nexusPomodoro?.newValue)return;
  const timer=changes.nexusPomodoro.newValue;
  if(timer.mode!=='focus'||timer.label)return;
  chrome.storage.local.get({nexusFocusDefaultLabel:'Focus'},state=>{
    const current={...timer,label:String(state.nexusFocusDefaultLabel||'Focus').slice(0,60)};
    nexusLabelWrite=true;
    chrome.storage.local.set({nexusPomodoro:current},()=>{nexusLabelWrite=false;});
  });
});
