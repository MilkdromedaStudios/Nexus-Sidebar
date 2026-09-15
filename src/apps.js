document.addEventListener('nexus:ready',()=>{
  const N=window.NexusSidebar;
  const getItem=id=>N.FEATURES.find(x=>x.id===id)||N.sites.find(x=>x.id===id);
  const hidden=id=>(N.settings.hiddenIcons||[]).includes(id);
  function saveLayout(){return N.saveSettings()}
  function moveToken(source,target){const a=N.settings.railLayout;const from=a.indexOf(source),to=a.indexOf(target);if(from<0||to<0||from===to)return;a.splice(from,1);const ni=a.indexOf(target);a.splice(ni,0,source);saveLayout();N.renderRail();}
  function draggable(el,token){if(!N.editMode)return;el.draggable=true;el.dataset.token=token;el.classList.add('nexus-draggable');el.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/nexus-token',token);e.dataTransfer.effectAllowed='move';el.classList.add('dragging')});el.addEventListener('dragend',()=>el.classList.remove('dragging'));el.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='move'});el.addEventListener('drop',e=>{e.preventDefault();const src=e.dataTransfer.getData('text/nexus-token');if(src)moveToken(src,token)});}
  function iconButton(item,custom=false){const b=document.createElement('button');b.className='nexus-icon'+(N.active?.id===item.id?' active':'');b.title=N.editMode?`Drag ${item.name}`:item.name;b.append(N.iconNode(item,custom));b.onclick=e=>{if(N.editMode){e.preventDefault();return}N.activate(item,custom)};draggable(b,item.id);return b;}
  function sepHandle(token){const d=document.createElement('button');d.className='nexus-separator-handle';d.title='Drag separator · double-click to remove';d.textContent='⋯';draggable(d,token);d.ondblclick=async()=>{N.settings.railLayout=N.settings.railLayout.filter(x=>x!==token);await saveLayout();N.renderRail()};return d;}
  function makeGroup(){const g=document.createElement('div');g.className='nexus-rail-group';return g;}

  N.addSeparator=async()=>{const a=N.normalizeLayout();if(!a.length)return;const token='sep:'+crypto.randomUUID();let at=a.indexOf(N.active?.id);if(at<0)at=Math.max(0,Math.floor(a.length/2)-1);a.splice(at+1,0,token);N.settings.railLayout=a;await saveLayout();N.renderRail();};
  N.renderRail=()=>{
    N.icons.replaceChildren();const layout=N.normalizeLayout();let group=makeGroup();N.icons.append(group);
    for(const token of layout){
      if(String(token).startsWith('sep:')){if(N.editMode)N.icons.append(sepHandle(token));group=makeGroup();N.icons.append(group);continue;}
      const item=getItem(token);if(!item||hidden(token))continue;group.append(iconButton(item,String(item.id).startsWith('site-')));
    }
    [...N.icons.querySelectorAll('.nexus-rail-group')].forEach(g=>{if(!g.children.length&&!N.editMode)g.remove()});
    N.root.querySelector('#nexus-add-separator').hidden=!N.editMode;N.root.querySelector('#nexus-edit').textContent=N.editMode?'✓':'✎';N.root.querySelector('#nexus-edit').title=N.editMode?'Finish editing':'Edit rail';
  };
  N.closeActive=()=>N.closePanelSoft();
  N.activate=async(item,custom=false)=>{N.runCleanup();N.active=item;N.setHeader(item,custom);N.panel.classList.add('open');N.root.classList.add('rail-visible');N.renderRail();if(item.type==='web'||custom)return N.openSite(item);N.showLocal();N.body.replaceChildren();if(item.id==='launchpad')renderLaunchpad();else if(item.id==='history')renderHistory();else if(item.id==='calculator')renderCalc();else if(item.id==='games')N.renderGames?.();else if(item.id==='settings')N.renderSettings?.();};
  function daily(){const d=new Date();return N.quotes[(d.getDate()+d.getMonth()*31)%N.quotes.length]}
  function renderLaunchpad(){
    const hero=document.createElement('div');hero.className='nexus-hero';const name=N.settings.profileName?`, ${N.settings.profileName}`:'';hero.innerHTML=`<h1>Hello${name}</h1><p>“${daily()}”</p>`;
    const search=document.createElement('form');search.className='nexus-search';search.innerHTML='<input placeholder="Search Google or enter a URL"><button>Go</button>';search.onsubmit=e=>{e.preventDefault();let q=search.querySelector('input').value.trim();if(!q)return;location.href=/^https?:\/\//i.test(q)?q:'https://www.google.com/search?q='+encodeURIComponent(q)};
    const cards=document.createElement('div');cards.className='nexus-dashboard';const time=document.createElement('div');time.className='nexus-card';const weather=document.createElement('div');weather.className='nexus-card';cards.append(time,weather);
    const tick=()=>{const d=new Date();time.innerHTML=`<b>${d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</b><small>${d.toLocaleDateString([],{weekday:'long',month:'short',day:'numeric'})}</small>`};tick();const t=setInterval(tick,1000);N.cleanup.push(()=>clearInterval(t));
    weather.innerHTML='<b>Weather</b><small>Loading…</small>';N.msg({type:'nexus:weather',location:N.settings.weatherLocation||''}).then(r=>{if(r?.ok)weather.innerHTML=`<b>${r.weather.temp}°F · ${r.weather.condition}</b><small>${r.weather.location||'Current area'}</small>`;else weather.querySelector('small').textContent='Unavailable'});
    const qa=document.createElement('div');qa.className='nexus-quick';[['＋','New tab',()=>N.msg({type:'nexus:new-tab'})],['↻','Reload',()=>N.msg({type:'nexus:reload'})],['◷','History',()=>N.activate(N.FEATURES[1])],['＋','Calculator',()=>N.activate(N.FEATURES[3])],['🏎️','F1 race',()=>N.activate(N.FEATURES[4])]].forEach(([i,n,f])=>{const b=document.createElement('button');b.innerHTML=`<b>${i}</b><small>${n}</small>`;b.onclick=f;qa.append(b)});
    const apps=document.createElement('div');apps.className='nexus-appgrid';[...N.FEATURES.filter(x=>x.id!=='launchpad'&&!hidden(x.id)),...N.sites.filter(x=>!hidden(x.id))].forEach(x=>{const b=document.createElement('button');b.append(N.iconNode(x,String(x.id).startsWith('site-')));const s=document.createElement('small');s.textContent=x.name;b.append(s);b.onclick=()=>N.activate(x,String(x.id).startsWith('site-'));apps.append(b)});
    N.body.append(hero,search,cards,qa,apps);
  }
  async function renderHistory(){const input=document.createElement('input');input.className='nexus-wide';input.placeholder='Search history';const list=document.createElement('div');list.className='nexus-list';N.body.append(input,list);const load=async()=>{const r=await N.msg({type:'nexus:history',query:input.value});list.replaceChildren();(r.results||[]).slice(0,60).forEach(x=>{const a=document.createElement('a');a.href=x.url;a.textContent=x.title||x.url;list.append(a)})};input.oninput=load;load();}
  function renderCalc(){N.body.innerHTML='<div class="nexus-calc"><input placeholder="2 * (3 + 4)"><button>=</button><output>0</output></div>';const i=N.body.querySelector('input'),o=N.body.querySelector('output');N.body.querySelector('button').onclick=()=>{try{const s=i.value;if(!/^[0-9+\-*/().%\s]+$/.test(s))throw 0;o.textContent=String(Function('return ('+s+')')())}catch{o.textContent='Error'}};}
  N.renderRail();N.activate(N.FEATURES[0]);
});
