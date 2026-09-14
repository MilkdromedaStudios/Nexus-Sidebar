(() => {
  'use strict';
  if (window.top !== window || window.NexusSidebar) return;

  const DEFAULTS = {
    dark:true, theme:'neon', edge:'left', railStyle:'bar', iconSize:20, iconGap:4,
    panelWidth:470, panelGap:22, radius:22, autoHide:true, autoHidePanel:true,
    autoHideRail:true, autoHideDelay:500, revealWidth:10, profileName:'',
    weatherLocation:'', customCSS:'', cookieSync:true, borderless:false,
    visibilityMode:'exclude', visibilityPatterns:'', accent:'#7c5cff'
  };
  const FEATURES = [
    {id:'launchpad',name:'Launchpad',icon:'🚀',type:'local'},
    {id:'history',name:'History',icon:'🕘',type:'local'},
    {id:'chatgpt',name:'ChatGPT',icon:'✦',type:'web',url:'https://chatgpt.com/'},
    {id:'calculator',name:'Calculator',icon:'🧮',type:'local'},
    {id:'games',name:'Games',icon:'🎮',type:'local'}
  ];
  const quotes = ['Small steps still move you forward.','Useful beats complicated.','Curiosity turns ordinary days into discoveries.','Good systems make good days easier to repeat.','Consistency compounds long before it looks impressive.','Build something small enough to finish, then improve it.'];

  function storeGet(d){return new Promise(r=>chrome.storage.local.get(d,v=>r(v||d)));}
  function storeSet(v){return new Promise(r=>chrome.storage.local.set(v,r));}
  function msg(m){return new Promise(r=>{try{chrome.runtime.sendMessage(m,x=>r(chrome.runtime.lastError?{ok:false,error:chrome.runtime.lastError.message}:(x||{ok:true})));}catch(e){r({ok:false,error:e.message});}});}
  function wildcard(pattern,value){const e=pattern.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*');return new RegExp('^'+e+'$','i').test(value);}
  function visible(settings){
    const mode=settings.visibilityMode||'exclude'; if(mode==='none')return false;if(mode==='all')return true;
    const rules=String(settings.visibilityPatterns||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    const href=location.href,host=location.hostname; const hit=rules.some(p=>wildcard(p,href)||wildcard(p,host)||wildcard(p,'https://'+host));
    return mode==='include'?hit:!hit;
  }

  async function boot(){
    const got=await storeGet({nexusSettings:DEFAULTS,nexusSites:[],nexusGames:{}}); const settings={...DEFAULTS,...got.nexusSettings};
    if(!visible(settings))return;
    const N=window.NexusSidebar={settings,sites:got.nexusSites||[],games:got.nexusGames||{},FEATURES,storeGet,storeSet,msg,quotes,active:null,sessions:new Map(),cleanup:[]};
    const root=document.createElement('div');root.id='nexus-root';root.innerHTML=`<div id="nexus-hotzone"></div><aside id="nexus-rail"><div id="nexus-icons"></div><div class="nexus-sep"></div><button class="nexus-icon" id="nexus-settings" title="Settings">⚙️</button></aside><section id="nexus-panel"><header id="nexus-head"><div id="nexus-head-icon">🚀</div><div><b id="nexus-title">Launchpad</b><small id="nexus-subtitle">Nexus Sidebar</small></div><button id="nexus-close">✕</button></header><div id="nexus-body"></div><div id="nexus-sessions"></div></section>`;
    document.documentElement.append(root); N.root=root;N.rail=root.querySelector('#nexus-rail');N.panel=root.querySelector('#nexus-panel');N.body=root.querySelector('#nexus-body');N.icons=root.querySelector('#nexus-icons');N.sessionsHost=root.querySelector('#nexus-sessions');
    const style=document.createElement('style');style.id='nexus-custom-css';document.documentElement.append(style);N.customStyle=style;

    N.iconNode=(item,custom=false)=>{if(custom||item.type==='web'){const i=document.createElement('img');try{i.src=chrome.runtime.getURL('_favicon/?pageUrl='+encodeURIComponent(item.url)+'&size=32');}catch{}i.onerror=()=>{const s=document.createElement('span');s.textContent=custom?'🌐':item.icon;i.replaceWith(s)};return i;}const s=document.createElement('span');s.textContent=item.icon;return s;};
    N.setHeader=(item,custom=false)=>{const h=root.querySelector('#nexus-head-icon');h.replaceChildren(N.iconNode(item,custom));root.querySelector('#nexus-title').textContent=item.name;root.querySelector('#nexus-subtitle').textContent=item.url?new URL(item.url).hostname:'Nexus Sidebar';};
    N.show=()=>{root.classList.add('rail-visible');if(N.active)N.panel.classList.add('open');};
    N.hide=()=>{if(settings.autoHidePanel)N.panel.classList.remove('open');if(settings.autoHideRail)root.classList.remove('rail-visible');};
    let timer;const enter=()=>{clearTimeout(timer);N.show();};const leave=()=>{if(!settings.autoHide)return;clearTimeout(timer);timer=setTimeout(()=>N.hide(),Math.max(100,+settings.autoHideDelay||500));};
    root.querySelector('#nexus-hotzone').onmouseenter=enter;N.rail.onmouseenter=enter;N.panel.onmouseenter=enter;N.rail.onmouseleave=leave;N.panel.onmouseleave=leave;
    root.querySelector('#nexus-close').onclick=()=>N.closeActive?.();root.querySelector('#nexus-settings').onclick=()=>N.activate?.({id:'settings',name:'Settings',icon:'⚙️',type:'local'});
    N.saveSettings=async()=>storeSet({nexusSettings:N.settings});
    N.apply=()=>{const s=N.settings;root.className=`${s.dark?'dark':''} theme-${s.theme} edge-${s.edge} ${s.railStyle==='floating'?'floating':''} ${s.borderless?'borderless':''}`;root.style.setProperty('--nexus-icon',s.iconSize+'px');root.style.setProperty('--nexus-gap',s.iconGap+'px');root.style.setProperty('--nexus-width',s.panelWidth+'px');root.style.setProperty('--nexus-panel-gap',s.panelGap+'px');root.style.setProperty('--nexus-radius',s.radius+'px');root.style.setProperty('--nexus-reveal',s.revealWidth+'px');root.style.setProperty('--nexus-accent',s.accent);style.textContent=s.customCSS||'';if(!s.autoHide)root.classList.add('rail-visible');};
    N.apply(); chrome.runtime.onMessage.addListener(m=>{if(m?.type==='nexus:reveal')N.show();}); document.dispatchEvent(new CustomEvent('nexus:ready'));
  }
  boot().catch(console.error);
})();
