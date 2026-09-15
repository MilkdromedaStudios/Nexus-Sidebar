(() => {
  'use strict';
  if (window.top !== window) return;

  const DEFAULTS = {
    dark:true, theme:'modern', edge:'left', railStyle:'floating', iconSize:20, iconGap:5,
    panelWidth:470, panelGap:14, radius:10, autoHide:true, autoHideRail:true,
    autoHideDelay:650, revealWidth:8, profileName:'', weatherLocation:'', customCSS:'',
    cookieSync:true, borderless:false, visibilityMode:'exclude', visibilityPatterns:'',
    accent:'#4f6bed', hiddenIcons:[], railLayout:[], autoUpdateCheck:true
  };
  const FEATURES = [
    {id:'launchpad',name:'Launchpad',icon:'⌂',type:'local'},
    {id:'history',name:'History',icon:'◷',type:'local'},
    {id:'chatgpt',name:'ChatGPT',icon:'✦',type:'web',url:'https://chatgpt.com/'},
    {id:'calculator',name:'Calculator',icon:'＋',type:'local'},
    {id:'games',name:'F1 Racing',icon:'🏎️',type:'local'}
  ];
  const DEFAULT_LAYOUT=['launchpad','history','sep:work','chatgpt','calculator','games'];
  const quotes=['Small steps still move you forward.','Useful beats complicated.','Curiosity turns ordinary days into discoveries.','Good systems make good days easier to repeat.','Consistency compounds long before it looks impressive.','Build something small enough to finish, then improve it.'];
  let booting=false;

  function storeGet(d){return new Promise(r=>chrome.storage.local.get(d,v=>r(v||d)));}
  function storeSet(v){return new Promise(r=>chrome.storage.local.set(v,r));}
  function msg(m){return new Promise(r=>{try{chrome.runtime.sendMessage(m,x=>r(chrome.runtime.lastError?{ok:false,error:chrome.runtime.lastError.message}:(x||{ok:true})));}catch(e){r({ok:false,error:e.message});}});}
  function wildcard(pattern,value){const e=pattern.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*');return new RegExp('^'+e+'$','i').test(value);}
  function allowedByRules(settings){
    const mode=settings.visibilityMode||'exclude'; if(mode==='none')return false;if(mode==='all')return true;
    const rules=String(settings.visibilityPatterns||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    const href=location.href,host=location.hostname; const hit=rules.some(p=>wildcard(p,href)||wildcard(p,host)||wildcard(p,'https://'+host));
    return mode==='include'?hit:!hit;
  }
  function validItemIds(features,sites){return new Set([...features.map(x=>x.id),...sites.map(x=>x.id)]);}
  function normalizeLayout(settings,sites){
    const valid=validItemIds(FEATURES,sites);let layout=Array.isArray(settings.railLayout)&&settings.railLayout.length?[...settings.railLayout]:[...DEFAULT_LAYOUT];
    layout=layout.filter(t=>String(t).startsWith('sep:')||valid.has(t));
    for(const id of valid)if(!layout.includes(id))layout.push(id);
    while(layout.length&&String(layout[0]).startsWith('sep:'))layout.shift();
    const compact=[];for(const t of layout){if(String(t).startsWith('sep:')&&String(compact.at(-1)||'').startsWith('sep:'))continue;compact.push(t)}
    while(compact.length&&String(compact.at(-1)).startsWith('sep:'))compact.pop();
    settings.railLayout=compact;return compact;
  }

  async function boot(force=false){
    if(booting||window.NexusSidebar)return;booting=true;
    try{
      const got=await storeGet({nexusSettings:DEFAULTS,nexusSites:[],nexusGames:{}});const settings={...DEFAULTS,...got.nexusSettings};
      if(!force&&!allowedByRules(settings)){booting=false;return;}
      const sites=got.nexusSites||[];normalizeLayout(settings,sites);
      const N=window.NexusSidebar={settings,sites,games:got.nexusGames||{},FEATURES,storeGet,storeSet,msg,quotes,active:null,sessions:new Map(),cleanup:[],editMode:false};
      const root=document.createElement('div');root.id='nexus-root';root.innerHTML=`
        <div id="nexus-hotzone"></div>
        <aside id="nexus-rail" aria-label="Nexus Sidebar">
          <div id="nexus-icons"></div>
          <div id="nexus-utility" class="nexus-rail-group nexus-utility-group">
            <button class="nexus-icon nexus-util" id="nexus-edit" title="Edit rail">✎</button>
            <button class="nexus-icon nexus-util" id="nexus-add-separator" title="Add separator" hidden>＋</button>
            <button class="nexus-icon nexus-util" id="nexus-settings" title="Settings">⚙</button>
            <button class="nexus-icon nexus-util" id="nexus-session-hide" title="Hide for this session">—</button>
          </div>
        </aside>
        <section id="nexus-panel" aria-label="Nexus panel">
          <header id="nexus-head"><div id="nexus-head-icon">⌂</div><div><b id="nexus-title">Launchpad</b><small id="nexus-subtitle">Nexus Sidebar</small></div><button id="nexus-close" title="Close panel">✕</button></header>
          <div id="nexus-body"></div><div id="nexus-sessions"></div>
        </section>`;
      document.documentElement.append(root);N.root=root;N.rail=root.querySelector('#nexus-rail');N.panel=root.querySelector('#nexus-panel');N.body=root.querySelector('#nexus-body');N.icons=root.querySelector('#nexus-icons');N.sessionsHost=root.querySelector('#nexus-sessions');
      const style=document.createElement('style');style.id='nexus-custom-css';document.documentElement.append(style);N.customStyle=style;
      N.iconNode=(item,custom=false)=>{if(custom||item.type==='web'){const i=document.createElement('img');try{i.src=chrome.runtime.getURL('_favicon/?pageUrl='+encodeURIComponent(item.url)+'&size=32');}catch{}i.onerror=()=>{const s=document.createElement('span');s.textContent=custom?'◫':item.icon;i.replaceWith(s)};return i;}const s=document.createElement('span');s.textContent=item.icon;return s;};
      N.setHeader=(item,custom=false)=>{const h=root.querySelector('#nexus-head-icon');h.replaceChildren(N.iconNode(item,custom));root.querySelector('#nexus-title').textContent=item.name;root.querySelector('#nexus-subtitle').textContent=item.url?new URL(item.url).hostname:'Nexus Sidebar';};
      N.show=()=>{sessionStorage.removeItem('nexus-session-hidden');root.classList.remove('session-hidden');root.classList.add('rail-visible');};
      N.closePanelSoft=()=>{N.panel.classList.remove('open');N.active=null;N.renderRail?.();};
      N.hideRail=()=>{if(!N.panel.classList.contains('open'))root.classList.remove('rail-visible');};
      N.hideSession=()=>{sessionStorage.setItem('nexus-session-hidden','1');N.panel.classList.remove('open');root.classList.add('session-hidden');};
      N.runCleanup=()=>{for(const fn of N.cleanup.splice(0)){try{fn()}catch{}}};
      N.saveSettings=async()=>storeSet({nexusSettings:N.settings});
      N.apply=()=>{const s=N.settings,wasVisible=root.classList.contains('rail-visible');root.className=`${s.dark?'dark':''} theme-${s.theme} edge-${s.edge} ${s.railStyle==='floating'?'floating':''} ${s.borderless?'borderless':''} ${N.editMode?'edit-mode':''}`;if(wasVisible)root.classList.add('rail-visible');if(sessionStorage.getItem('nexus-session-hidden')==='1')root.classList.add('session-hidden');root.style.setProperty('--nexus-icon',s.iconSize+'px');root.style.setProperty('--nexus-gap',s.iconGap+'px');root.style.setProperty('--nexus-width',s.panelWidth+'px');root.style.setProperty('--nexus-panel-gap',s.panelGap+'px');root.style.setProperty('--nexus-radius',s.radius+'px');root.style.setProperty('--nexus-reveal',s.revealWidth+'px');root.style.setProperty('--nexus-accent',s.accent);style.textContent=s.customCSS||'';if(!s.autoHide)root.classList.add('rail-visible');};
      N.normalizeLayout=()=>normalizeLayout(N.settings,N.sites);
      N.apply();

      let timer;const enter=()=>{clearTimeout(timer);N.show();};const leave=()=>{if(!N.settings.autoHide||!N.settings.autoHideRail||N.panel.classList.contains('open')||N.editMode)return;clearTimeout(timer);timer=setTimeout(()=>N.hideRail(),Math.max(100,+N.settings.autoHideDelay||650));};
      root.querySelector('#nexus-hotzone').onmouseenter=enter;N.rail.onmouseenter=enter;N.rail.onmouseleave=leave;
      root.querySelector('#nexus-close').onclick=()=>N.closePanelSoft();
      root.querySelector('#nexus-settings').onclick=()=>N.activate?.({id:'settings',name:'Settings',icon:'⚙',type:'local'});
      root.querySelector('#nexus-session-hide').onclick=N.hideSession;
      root.querySelector('#nexus-edit').onclick=()=>{N.editMode=!N.editMode;N.apply();N.renderRail?.();N.show();};
      root.querySelector('#nexus-add-separator').onclick=()=>N.addSeparator?.();
      const outside=e=>{if(!N.panel.classList.contains('open'))return;if(N.panel.contains(e.target)||N.rail.contains(e.target))return;N.closePanelSoft();};
      document.addEventListener('pointerdown',outside,true);
      document.dispatchEvent(new CustomEvent('nexus:ready'));
    }finally{booting=false;}
  }

  chrome.runtime.onMessage.addListener(m=>{
    if(m?.type!=='nexus:reveal')return;
    if(window.NexusSidebar){window.NexusSidebar.show();return;}
    boot(true).then(()=>window.NexusSidebar?.show());
  });
  boot(false).catch(console.error);
})();
