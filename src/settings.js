document.addEventListener('nexus:ready',()=>{
  const N=window.NexusSidebar;
  const row=(label,input,small='')=>{const d=document.createElement('label');d.className='nexus-setting';const s=document.createElement('span');s.innerHTML=`<b>${label}</b>${small?`<small>${small}</small>`:''}`;d.append(s,input);return d};
  const input=(type,val)=>{const i=document.createElement('input');i.type=type;if(type==='checkbox')i.checked=!!val;else i.value=val??'';return i};
  const section=(title)=>{const s=document.createElement('section');s.className='nexus-settings-section';const h=document.createElement('h3');h.textContent=title;s.append(h);return s};
  N.renderSettings=async()=>{N.body.replaceChildren();const s=N.settings;const box=document.createElement('div');box.className='nexus-settings';
    const appearance=section('Appearance');
    const name=input('text',s.profileName);name.onchange=()=>save('profileName',name.value.trim());appearance.append(row('Your name',name,'Used in greetings'));
    const theme=document.createElement('select');[['modern','Modern'],['fluent','Fluent'],['glass','Glass'],['minimal','Minimal'],['neon','Neon']].forEach(([v,n])=>theme.add(new Option(n,v,v===s.theme,v===s.theme)));theme.onchange=()=>save('theme',theme.value);appearance.append(row('Theme',theme,'Glow is only used by Neon'));
    const edge=document.createElement('select');['left','right'].forEach(v=>edge.add(new Option(v,v,v===s.edge,v===s.edge)));edge.onchange=()=>save('edge',edge.value);appearance.append(row('Sidebar side',edge));
    const border=input('checkbox',s.borderless);border.onchange=()=>save('borderless',border.checked);appearance.append(row('No borders',border));
    [['Panel width','panelWidth',340,760],['Panel gap','panelGap',6,48],['Corner radius','radius',0,20],['Icon size','iconSize',16,30],['Reveal zone','revealWidth',4,24]].forEach(([l,k,min,max])=>{const i=input('range',s[k]);i.min=min;i.max=max;i.oninput=()=>save(k,+i.value);appearance.append(row(l,i))});
    const acc=input('color',s.accent);acc.oninput=()=>save('accent',acc.value);appearance.append(row('Accent',acc));box.append(appearance);

    const behavior=section('Behavior');
    const aut=input('checkbox',s.autoHide);aut.onchange=()=>save('autoHide',aut.checked);behavior.append(row('Auto-hide sidebar',aut,'Open panels stay open until you close them or click outside'));
    const delay=input('range',s.autoHideDelay);delay.min=100;delay.max=2500;delay.oninput=()=>save('autoHideDelay',+delay.value);behavior.append(row('Hide delay',delay));
    const loc=input('text',s.weatherLocation);loc.onchange=()=>save('weatherLocation',loc.value.trim());behavior.append(row('Weather location',loc,'Blank = automatic'));
    const cookies=input('checkbox',s.cookieSync);cookies.onchange=()=>save('cookieSync',cookies.checked);behavior.append(row('Share browser login',cookies,'Allow framed sites to use the browser session'));
    const mode=document.createElement('select');[['exclude','Hide on listed sites'],['include','Only show on listed sites'],['all','Show everywhere'],['none','Never show automatically']].forEach(([v,n])=>mode.add(new Option(n,v,v===s.visibilityMode,v===s.visibilityMode)));mode.onchange=()=>save('visibilityMode',mode.value);behavior.append(row('Site visibility',mode,'The toolbar button can always recover Nexus on the current tab'));
    const patterns=document.createElement('textarea');patterns.rows=5;patterns.value=s.visibilityPatterns||'';patterns.placeholder='youtube.com\n*.google.com\nhttps://example.com/work/*';patterns.onchange=()=>save('visibilityPatterns',patterns.value);behavior.append(row('Allow/block patterns',patterns,'One wildcard rule per line'));box.append(behavior);

    const icons=section('Sidebar icons');
    const list=document.createElement('div');list.className='nexus-icon-visibility';for(const item of [...N.FEATURES,...N.sites]){const lab=document.createElement('label');const cb=input('checkbox',!(s.hiddenIcons||[]).includes(item.id));cb.onchange=async()=>{const set=new Set(s.hiddenIcons||[]);cb.checked?set.delete(item.id):set.add(item.id);s.hiddenIcons=[...set];await N.saveSettings();N.renderRail();};lab.append(cb,document.createTextNode(item.name));list.append(lab)}icons.append(row('Visible icons',list,'Hide and Settings stay in the bottom-left controls'));
    const railActions=document.createElement('div');railActions.className='nexus-inline-actions';
    const edit=document.createElement('button');edit.textContent=N.editMode?'Finish reordering':'Reorder icons';edit.onclick=()=>{N.editMode=!N.editMode;N.apply();N.renderRail();N.renderSettings();};
    const reset=document.createElement('button');reset.textContent='Reset order';reset.onclick=async()=>{s.railLayout=[];await N.saveSettings();N.renderRail();N.renderSettings();};
    railActions.append(edit,reset);icons.append(row('Icon order',railActions,'Reorder mode only lets you drag the existing icons. There is no add button.'));box.append(icons);

    const updates=section('Updates');
    const auto=input('checkbox',s.autoUpdateCheck!==false);auto.onchange=()=>save('autoUpdateCheck',auto.checked);updates.append(row('Check GitHub automatically',auto,'Checks for a newer Nexus version every 6 hours'));
    const status=document.createElement('div');status.className='nexus-update-status';status.textContent='Checking GitHub…';const actions=document.createElement('div');actions.className='nexus-inline-actions';const check=document.createElement('button');check.textContent='Check now';const open=document.createElement('button');open.textContent='Open GitHub';actions.append(check,open);updates.append(row('GitHub update',status,'Unpacked extensions cannot silently reinstall themselves; Edge Store builds update through Edge'),row('Update actions',actions));
    const refreshStatus=async(force=false)=>{const r=await N.msg({type:force?'nexus:update-check':'nexus:update-status'});status.textContent=r?.available?`v${r.remoteVersion} available · installed v${r.localVersion}`:`Up to date · v${r?.localVersion||chrome.runtime.getManifest().version}`;status.classList.toggle('available',!!r?.available)};check.onclick=()=>refreshStatus(true);open.onclick=()=>N.msg({type:'nexus:update-open'});refreshStatus();box.append(updates);

    const custom=section('Custom sites & CSS');
    const sites=document.createElement('div');sites.className='nexus-site-settings';for(const site of N.sites){const d=document.createElement('div');d.textContent=site.name;const b=document.createElement('button');b.textContent='Remove';b.onclick=async()=>{await N.removeSite(site.id);N.renderSettings()};d.append(b);sites.append(d)}const n=input('text',''),u=input('text',''),add=document.createElement('button');n.placeholder='Site name';u.placeholder='https://example.com';add.textContent='Add site';add.onclick=async()=>{if(await N.addSite(n.value,u.value))N.renderSettings()};sites.append(n,u,add);custom.append(row('Custom sites',sites,'Sites are added here, not from the sidebar'));
    const css=document.createElement('textarea');css.rows=8;css.value=s.customCSS||'';css.placeholder='#nexus-panel { ... }';css.oninput=()=>{s.customCSS=css.value;N.customStyle.textContent=css.value;clearTimeout(css._t);css._t=setTimeout(()=>N.saveSettings(),350)};custom.append(row('Custom CSS',css,'Loaded last'));box.append(custom);
    N.body.append(box);
    async function save(k,v){s[k]=v;await N.saveSettings();N.apply();}
  };
});
