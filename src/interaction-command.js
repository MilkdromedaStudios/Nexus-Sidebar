(() => {
  'use strict';
  if (window.__nexusCommandV171Loaded) return;
  window.__nexusCommandV171Loaded = true;

  const FEATURE_COMMANDS = [
    ['Command palette','core'],['Universal search','core'],['Tab switcher','tabs'],['Tab groups panel','tabs'],['Recently closed tabs','tabs'],
    ['Pinned workspaces','workspaces'],['Workspace profiles','workspaces'],['Per-workspace sidebar layout','workspaces'],['Workspace color themes','workspaces'],['Workspace startup rules','workspaces'],
    ['Mini calendar widget','planner'],['Today agenda widget','planner'],['Quick event creation','planner'],['Task list widget','planner'],['Recurring tasks','planner'],
    ['Task priorities','planner'],['Task due dates','planner'],['Task snooze','planner'],['Task completion history','planner'],['Daily productivity summary','planner'],
    ['Better Pomodoro presets','focus'],['Long break mode','focus'],['Pomodoro session count','focus'],['Focus streaks','focus'],['Custom timer labels','focus'],
    ['Timer sound choices','focus'],['Silent timer mode','focus'],['Fullscreen focus mode','focus'],['Focus history chart','focus'],['Automatic break suggestions','focus'],
    ['Site blocker','focus'],['Temporary blocker','focus'],['Delay-before-opening mode','focus'],['Daily site limits','focus'],['Blocked-page motivational message','focus'],
    ['Whitelist mode','focus'],['Focus-linked blocking','focus'],['Distraction counter','focus'],['Just this once override','focus'],['Focus session website presets','focus'],
    ['Clipboard history','notes'],['Pinned clipboard snippets','notes'],['Quick text snippets','notes'],['Snippet categories','notes'],['One-click copy buttons','notes'],
    ['Markdown preview','notes'],['Quick notes','notes'],['Page notes','notes'],['Selected-text capture','notes'],['Quote collector','notes'],
    ['Screenshot tool','capture'],['Selection screenshot','capture'],['Full-page screenshot','capture'],['Screenshot annotation','capture'],['Screenshot clipboard copy','capture'],
    ['Quick image crop','capture'],['Color picker','capture'],['Pixel ruler','capture'],['Page dimensions inspector','page'],['Quick QR generator','capture'],
    ['Developer toolbox widget','dev'],['JSON formatter','dev'],['JSON validator','dev'],['Base64 encoder/decoder','dev'],['URL encoder/decoder','dev'],
    ['Regex tester','dev'],['Timestamp converter','dev'],['UUID generator','dev'],['Hash generator','dev'],['Lorem ipsum generator','dev'],
    ['JavaScript scratchpad','dev'],['CSS playground','dev'],['DOM inspector shortcut','page'],['Page metadata viewer','page'],['HTTP header viewer','page'],
    ['Cookie viewer','page'],['LocalStorage viewer','page'],['SessionStorage viewer','page'],['Resource count panel','page'],['Page performance snapshot','page'],
    ['Downloads panel','library'],['Download progress indicator','library'],['Download search','library'],['Bookmark manager','library'],['Bookmark quick-add','library'],
    ['Bookmark folders','library'],['Reading list','notes'],['Archive completed reads','notes'],['Favorite-site shortcuts','library'],['Smart shortcuts','library'],
    ['Notification center','system'],['Do Not Disturb mode','system'],['Keyboard shortcut editor','system'],['Context menu integration','system'],['Per-site sidebar rules','system'],
    ['Cloud settings export/import','system'],['Automatic local backup','system'],['Update changelog panel','system'],['Extension health page','system'],['Nexus Assistant','assistant']
  ];
  const CATEGORY_LABEL = {tabs:'Tabs & Sessions',workspaces:'Workspaces',planner:'Planner',focus:'Focus',notes:'Notes & Clipboard',capture:'Capture',dev:'Developer Tools',page:'Page Inspector',library:'Library',system:'System'};
  const CAR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14.5 5.6 9.8A2.6 2.6 0 0 1 8.1 8h7.8a2.6 2.6 0 0 1 2.5 1.8l1.6 4.7"/><path d="M3.5 14.5h17v4.2H3.5z"/><circle cx="7" cy="18.8" r="1.5"/><circle cx="17" cy="18.8" r="1.5"/><path d="M6 14.5h12M8.2 11h7.6"/></svg>';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  document.addEventListener('keydown', e => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && !e.shiftKey && e.key.toLowerCase() === 'k') {
      e.stopImmediatePropagation();
      return;
    }
    if (ctrl && !e.shiftKey && e.code === 'Space') {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (window.NexusCommandV2) window.NexusCommandV2.open();
      else window.__nexusOpenCommandWhenReady = true;
    }
  }, true);

  const deferInstall=()=>setTimeout(install,0);
  if (window.NexusSidebar) deferInstall();
  document.addEventListener('nexus:ready', deferInstall, {once:true});

  function install(){
    const N=window.NexusSidebar;
    if(!N||N.__commandV171Installed)return;
    N.__commandV171Installed=true;
    const legacyActivate=N.activate.bind(N);
    const hub=N.FEATURES.find(x=>x.id==='nexus-hub');
    if(hub)hub.name='Nexus AI';

    installGameFix(N);
    installCustomSitePreference(N);
    buildCommand(N,legacyActivate,hub);
    if(hub){
      const current=N.activate.bind(N);
      N.activate=async(item,custom=false)=>item?.id==='nexus-hub'?window.NexusCommandV2.assistant():current(item,custom);
    }
    chrome.runtime.onMessage.addListener(m=>{if(m?.type==='nexus:open-command-v2')window.NexusCommandV2?.open(String(m.query||''));});
    N.settings.edgeRevealOnly=true;
    N.root.classList.add('nexus-edge-only');
    N.renderRail?.();
    if(window.__nexusOpenCommandWhenReady){window.__nexusOpenCommandWhenReady=false;setTimeout(()=>window.NexusCommandV2.open(),50);}
  }

  function installGameFix(N){
    const old=N.iconNode.bind(N);
    N.iconNode=(item,custom=false)=>{
      if(item?.id==='games'){
        const s=document.createElement('span');s.className='nexus-line-icon nexus-car-icon';s.innerHTML=CAR_SVG;return s;
      }
      return old(item,custom);
    };
    const game=N.FEATURES.find(x=>x.id==='games');if(game){game.name='F1 Racing';game.icon='car';}
    if(!N.__cleanupCloseWrapped){
      N.__cleanupCloseWrapped=true;
      const close=N.closePanelSoft?.bind(N);N.closePanelSoft=()=>{N.runCleanup?.();return close?.();};
      const hide=N.hideSession?.bind(N);N.hideSession=()=>{N.runCleanup?.();return hide?.();};
    }
    const polish=()=>{for(const small of N.body.querySelectorAll('.nexus-quick small')){if(!/f1 race/i.test(small.textContent||''))continue;const icon=small.closest('button')?.querySelector('b');if(icon&&!icon.querySelector('svg')){icon.innerHTML=CAR_SVG;icon.classList.add('nexus-quick-car');}}};
    new MutationObserver(polish).observe(N.body,{childList:true,subtree:true});polish();
  }

  function buildCommand(N,legacyActivate,hub){
    let ov=N.root.querySelector('#nexus-universal-command-v2');
    if(!ov){ov=document.createElement('div');ov.id='nexus-universal-command-v2';ov.hidden=true;ov.innerHTML='<div class="nxv2-command-box"><div class="nxv2-command-top"><span class="nxv2-spark">✦</span><input autocomplete="off" spellcheck="false" placeholder="Type a command, URL, search, calculation, or Nexus feature…"><kbd>Ctrl Space</kbd></div><div class="nxv2-command-hint">Examples: github.com · 24*17 · theme glass · sidebar right · focus 25 · bookmarks</div><div class="nxv2-command-results"></div></div>';N.root.append(ov);}
    const input=ov.querySelector('input'),results=ov.querySelector('.nxv2-command-results');let items=[],active=0,paintToken=0;

    const close=()=>{ov.hidden=true;results.replaceChildren();items=[];active=0;};
    const open=(query='')=>{if(N.active?.id==='games')N.runCleanup?.();ov.hidden=false;N.show?.();input.value=query;paint(query);setTimeout(()=>input.focus(),0);};
    const add=(kind,title,sub,run,strong=false)=>items.push({kind,title,sub,run,strong});
    const select=i=>{active=Math.max(0,Math.min(items.length-1,i));[...results.querySelectorAll('.nxv2-command-result')].forEach((el,n)=>el.classList.toggle('active',n===active));results.querySelector('.active')?.scrollIntoView({block:'nearest'});};
    const categoryName=k=>CATEGORY_LABEL[k]||(k==='assistant'?'Nexus AI':'Nexus');

    async function openCategory(key){
      close();
      if(key==='assistant'||key==='core')return assistant();
      if(!hub)return;
      await legacyActivate(hub);
      setTimeout(()=>{const label=CATEGORY_LABEL[key];const card=[...N.body.querySelectorAll('.nx-card')].find(x=>x.querySelector('b')?.textContent===label);card?.click();},0);
    }

    function localCommand(q){
      if(!q)return null;const low=q.toLowerCase().trim();
      const theme=low.match(/^theme\s+(modern|fluent|glass|minimal|neon)$/);if(theme)return{title:`Use ${theme[1]} theme`,sub:'Quick theme',run:async()=>{N.settings.theme=theme[1];await N.saveSettings();N.apply();toast(N,`${theme[1]} theme applied`);}};
      const side=low.match(/^(?:sidebar|side)\s+(left|right)$/);if(side)return{title:`Move sidebar to the ${side[1]}`,sub:'Quick layout',run:async()=>{N.settings.edge=side[1];await N.saveSettings();N.apply();toast(N,`Sidebar moved ${side[1]}`);}};
      const focus=low.match(/^(?:focus|pomodoro)(?:\s+(\d+))?$/);if(focus){const minutes=Math.min(120,Math.max(1,Number(focus[1]||25)));return{title:`Start ${minutes}-minute focus`,sub:location.hostname,run:()=>N.msg({type:'nexus:next:focus-site',url:location.href,minutes}).then(()=>toast(N,`${minutes}-minute focus started`))};}
      const search=low.match(/^(?:search|google)\s+(.+)$/);if(search)return{title:`Search for “${search[1]}”`,sub:'Google',run:()=>N.msg({type:'nexus:next:open',url:'https://www.google.com/search?q='+encodeURIComponent(search[1])})};
      if(/^(settings|preferences)$/.test(low))return{title:'Open Nexus Settings',run:()=>N.activate({id:'settings',name:'Settings',icon:'settings',type:'local'})};
      if(/^(hide|hide nexus)$/.test(low))return{title:'Hide Nexus for this tab',run:()=>N.hideSession?.()};
      if(/^(assistant|ai|nexus ai)$/.test(low))return{title:'Open Nexus AI',run:()=>assistant()};
      const cats={'tabs':'tabs','tab switcher':'tabs','workspaces':'workspaces','workspace':'workspaces','planner':'planner','tasks':'planner','calendar':'planner','notes':'notes','clipboard':'notes','capture':'capture','screenshots':'capture','developer tools':'dev','dev tools':'dev','page inspector':'page','bookmarks':'library','downloads':'library','library':'library','system':'system','health':'system'};
      if(cats[low])return{title:`Open ${categoryName(cats[low])}`,run:()=>openCategory(cats[low])};
      return null;
    }

    async function paint(query=''){
      const token=++paintToken;items=[];active=0;const q=query.trim();
      const calc=calculate(q);if(calc!==null)add('CALC',`${q} = ${calc}`,'Copy result',()=>navigator.clipboard.writeText(String(calc)),true);
      const url=asUrl(q.replace(/^open\s+/i,''));if(url)add('OPEN',`Open ${url.replace(/^https?:\/\//,'')}`,url,()=>N.msg({type:'nexus:next:open',url}),true);
      const cmd=localCommand(q);if(cmd)add('COMMAND',cmd.title,cmd.sub||'',cmd.run,true);
      if(q)add('SEARCH',`Search the web for “${q}”`,'Google',()=>N.msg({type:'nexus:next:open',url:'https://www.google.com/search?q='+encodeURIComponent(q)}));
      const matches=(q?FEATURE_COMMANDS.filter(([n])=>n.toLowerCase().includes(q.toLowerCase())):FEATURE_COMMANDS.slice(0,12)).slice(0,16);
      matches.forEach(([name,key])=>add('NEXUS',name,categoryName(key),()=>openCategory(key)));
      if(q.length>=2){
        const [tabs,hist,bm]=await Promise.all([N.msg({type:'nexus:next:tabs'}),N.msg({type:'nexus:history',query:q}),N.msg({type:'nexus:next:bookmarks',query:q})]);if(token!==paintToken)return;
        (tabs.tabs||[]).filter(t=>((t.title||'')+' '+(t.url||'')).toLowerCase().includes(q.toLowerCase())).slice(0,5).forEach(t=>add('TAB',t.title||'Untitled tab',t.url||'',()=>N.msg({type:'nexus:next:tab-activate',id:t.id})));
        (hist.results||[]).slice(0,4).forEach(x=>add('HISTORY',x.title||x.url,x.url||'',()=>{location.href=x.url;}));
        flattenBookmarks(bm.items||[]).filter(x=>x.url).slice(0,4).forEach(x=>add('BOOKMARK',x.title||x.url,x.url,()=>N.msg({type:'nexus:next:open',url:x.url})));
      }
      results.replaceChildren();items.slice(0,30).forEach((it,i)=>{const b=document.createElement('button');b.className='nxv2-command-result'+(i===0?' active':'')+(it.strong?' strong':'');b.innerHTML=`<span>${esc(it.kind)}</span><div><b>${esc(it.title)}</b><small>${esc(it.sub||'')}</small></div>`;b.onclick=async()=>{close();await it.run();};results.append(b);});
    }

    input.oninput=()=>paint(input.value);
    input.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();close();}else if(e.key==='ArrowDown'){e.preventDefault();select(active+1);}else if(e.key==='ArrowUp'){e.preventDefault();select(active-1);}else if(e.key==='Enter'){e.preventDefault();const it=items[active]||items[0];if(it){close();it.run();}}};
    ov.addEventListener('pointerdown',e=>{if(e.target===ov)close();});

    async function assistant(prefill=''){
      N.runCleanup?.();N.active={id:'nexus-hub',name:'Nexus AI',icon:'sparkle',type:'local'};N.setHeader?.(N.active);const sub=N.root.querySelector('#nexus-subtitle');if(sub)sub.textContent='Browser assistant · commands + ChatGPT handoff';N.panel.classList.add('open');N.root.classList.add('rail-visible');N.showLocal?.();N.body.replaceChildren();
      const wrap=document.createElement('div');wrap.className='nxv2-assistant';wrap.innerHTML='<div class="nxv2-ai-hero"><span class="nxv2-ai-orb">✦</span><div><h2>Nexus AI</h2><p>Tell me what you want to do. I can control Nexus, search, open sites, calculate, change the UI, or hand an open-ended question to ChatGPT.</p></div></div><div class="nxv2-ai-thread"><div class="nxv2-ai-msg assistant"><b>Nexus</b><p>Try “open github.com”, “24*17”, “theme glass”, “sidebar right”, “start 45 minute focus”, “open notes”, or ask me a question.</p></div></div><div class="nxv2-ai-compose"><textarea rows="2" placeholder="Ask Nexus or enter a browser command…"></textarea><button>Send</button></div><div class="nxv2-ai-quick"><button data-q="theme glass">Glass theme</button><button data-q="sidebar right">Move right</button><button data-q="focus 25">Focus 25</button><button data-q="tabs">Tabs</button><button data-q="notes">Notes</button></div>';N.body.append(wrap);
      const area=wrap.querySelector('textarea'),thread=wrap.querySelector('.nxv2-ai-thread');
      const append=(who,text)=>{const d=document.createElement('div');d.className=`nxv2-ai-msg ${who}`;d.innerHTML=`<b>${who==='user'?'You':'Nexus'}</b><p>${esc(text)}</p>`;thread.append(d);thread.scrollTop=thread.scrollHeight;};
      const run=async text=>{const raw=String(text||'').trim();if(!raw)return;append('user',raw);area.value='';const calc=calculate(raw);if(calc!==null){append('assistant',`The answer is ${calc}.`);return;}const candidate=raw.replace(/^open\s+/i,'');const url=asUrl(candidate);if(url&&(/^open\s+/i.test(raw)||raw.includes('.'))){append('assistant',`Opening ${url.replace(/^https?:\/\//,'')}.`);await N.msg({type:'nexus:next:open',url});return;}const cmd=localCommand(raw);if(cmd){append('assistant',cmd.title+'.');await cmd.run();return;}const f=bestFeature(raw);if(f){append('assistant',`Opening ${f[0]}.`);await openCategory(f[1]);return;}if(/^(search|google)\s+/i.test(raw)){const q=raw.replace(/^(search|google)\s+/i,'');append('assistant',`Searching for “${q}”.`);await N.msg({type:'nexus:next:open',url:'https://www.google.com/search?q='+encodeURIComponent(q)});return;}append('assistant','This is an open-ended AI question. I’ll open ChatGPT and copy your prompt so it is ready to paste.');try{await navigator.clipboard.writeText(raw);}catch{}const chat=N.FEATURES.find(x=>x.id==='chatgpt');if(chat)setTimeout(()=>N.activate(chat),180);};
      wrap.querySelector('.nxv2-ai-compose button').onclick=()=>run(area.value);area.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();run(area.value);}});wrap.querySelectorAll('.nxv2-ai-quick button').forEach(b=>b.onclick=()=>run(b.dataset.q));if(prefill){area.value=prefill;setTimeout(()=>run(prefill),80);}else setTimeout(()=>area.focus(),50);
    }

    function bestFeature(q){const words=q.toLowerCase().split(/\s+/).filter(Boolean);const scored=FEATURE_COMMANDS.map(x=>[x,words.reduce((n,w)=>n+(x[0].toLowerCase().includes(w)?1:0),0)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);return scored[0]?.[0]||null;}
    window.NexusCommandV2={open,close,ask:text=>assistant(String(text||'')),assistant,category:openCategory};
  }

  function installCustomSitePreference(N){
    if(N.__customSitePreferenceWrapped)return;N.__customSitePreferenceWrapped=true;
    const render=N.renderRail?.bind(N);if(!render)return;
    N.renderRail=()=>{if(N.settings.showCustomSites===false){const hidden=new Set(N.settings.hiddenIcons||[]);for(const site of N.sites||[])hidden.add(site.id);N.settings.hiddenIcons=[...hidden];}return render();};
  }

  function calculate(raw){let q=String(raw||'').trim();if(!q)return null;if(q.startsWith('='))q=q.slice(1).trim();const pct=q.match(/^(-?\d+(?:\.\d+)?)%\s+of\s+(-?\d+(?:\.\d+)?)$/i);if(pct)return cleanNumber(Number(pct[1])/100*Number(pct[2]));q=q.replace(/\^/g,'**').replace(/\bpi\b/gi,'Math.PI').replace(/\bsqrt\s*\(/gi,'Math.sqrt(').replace(/\babs\s*\(/gi,'Math.abs(').replace(/\bround\s*\(/gi,'Math.round(');const stripped=q.replace(/Math\.(?:PI|sqrt|abs|round)/g,'');if(!/[+\-*/()%]|\*\*/.test(q)||!/^[0-9eE+\-*/().,%\s]*$/.test(stripped))return null;try{const value=Function('"use strict";return ('+q+')')();return Number.isFinite(value)?cleanNumber(value):null;}catch{return null;}}
  function cleanNumber(n){return Math.abs(n)>=1e12?n.toExponential(6):Number(n.toFixed(10)).toString();}
  function asUrl(raw){const s=String(raw||'').trim();if(!s||/\s/.test(s))return'';try{if(/^https?:\/\//i.test(s))return new URL(s).href;if(/^(?:localhost|\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?(?:\/.*)?$/i.test(s))return'http://'+s;if(/^(?:[\w-]+\.)+[a-z]{2,}(?::\d+)?(?:\/.*)?$/i.test(s))return'https://'+s;}catch{}return'';}
  function flattenBookmarks(items){const out=[];const walk=a=>(a||[]).forEach(x=>{out.push(x);if(x.children)walk(x.children);});walk(items);return out;}
  function toast(N,text){let t=N.root.querySelector('.nx-toast');if(!t){t=document.createElement('div');t.className='nx-toast';N.root.append(t);}t.textContent=text;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),1800);}
})();