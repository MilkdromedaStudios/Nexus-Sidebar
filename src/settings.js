document.addEventListener('nexus:ready',()=>{
  const N=window.NexusSidebar;
  const row=(label,input,small='')=>{const d=document.createElement('label');d.className='nexus-setting';const s=document.createElement('span');s.innerHTML=`<b>${label}</b>${small?`<small>${small}</small>`:''}`;d.append(s,input);return d};
  const input=(type,val)=>{const i=document.createElement('input');i.type=type;if(type==='checkbox')i.checked=!!val;else i.value=val??'';return i};
  const section=(title)=>{const s=document.createElement('section');s.className='nexus-settings-section';const h=document.createElement('h3');h.textContent=title;s.append(h);return s};
  N.renderSettings=async()=>{N.body.replaceChildren();const s=N.settings;const box=document.createElement('div');box.className='nexus-settings';
    const appearance=section('Appearance');
    const name=input('text',s.profileName);name.onchange=()=>save('profileName',name.value.trim());appearance.append(row('Your name',name,'Used in greetings'));
    const theme=document.createElement('select');const themeOptions=N.isGuest?[['modern','Modern']]:[['modern','Modern'],['fluent','Fluent'],['glass','Glass'],['minimal','Minimal'],['neon','Neon']];themeOptions.forEach(([v,n])=>theme.add(new Option(n,v,v===(N.isGuest?'modern':s.theme),v===(N.isGuest?'modern':s.theme))));theme.disabled=!!N.isGuest;theme.onchange=()=>N.isGuest?N.showMemberPrompt?.('Themes','Guest mode uses the Modern theme. Sign in with DigitBox to unlock all themes.'):save('theme',theme.value);appearance.append(row('Theme',theme,N.isGuest?'Guest mode: Modern only · sign in for more themes':'Glow is only used by Neon'));
    const edge=document.createElement('select');['left','right'].forEach(v=>edge.add(new Option(v,v,v===s.edge,v===s.edge)));edge.onchange=()=>save('edge',edge.value);appearance.append(row('Sidebar side',edge));
    const border=input('checkbox',s.borderless);border.onchange=()=>save('borderless',border.checked);appearance.append(row('No borders',border));
    [['Panel gap','panelGap',6,48],['Corner radius','radius',0,20],['Icon size','iconSize',16,30],['Reveal zone','revealWidth',4,24]].forEach(([l,k,min,max])=>{const i=input('range',s[k]);i.min=min;i.max=max;i.oninput=()=>save(k,+i.value);appearance.append(row(l,i))});
    const acc=input('color',s.accent);acc.oninput=()=>save('accent',acc.value);appearance.append(row('Accent',acc));box.append(appearance);

    const behavior=section('Behavior');
    const aut=input('checkbox',s.autoHide);aut.onchange=()=>save('autoHide',aut.checked);behavior.append(row('Auto-hide sidebar',aut,'Open panels stay open until you close them or click outside'));
    const delay=input('range',s.autoHideDelay);delay.min=100;delay.max=2500;delay.oninput=()=>save('autoHideDelay',+delay.value);behavior.append(row('Hide delay',delay));
    const loc=input('text',s.weatherLocation);loc.onchange=()=>save('weatherLocation',loc.value.trim());behavior.append(row('Weather location',loc,'Blank = automatic'));
    const cookies=input('checkbox',s.cookieSync);cookies.onchange=()=>save('cookieSync',cookies.checked);behavior.append(row('Share browser login',cookies,'Allow framed sites to use the browser session'));
    const mode=document.createElement('select');[['exclude','Hide on listed sites'],['include','Only show on listed sites'],['all','Show everywhere'],['none','Never show automatically']].forEach(([v,n])=>mode.add(new Option(n,v,v===s.visibilityMode,v===s.visibilityMode)));mode.onchange=()=>save('visibilityMode',mode.value);behavior.append(row('Site visibility',mode,'The toolbar button can always recover Nexus on the current tab'));
    const patterns=document.createElement('textarea');patterns.rows=5;patterns.value=s.visibilityPatterns||'';patterns.placeholder='youtube.com\n*.google.com\nhttps://example.com/work/*';patterns.onchange=()=>save('visibilityPatterns',patterns.value);behavior.append(row('Allow/block patterns',patterns,'One wildcard rule per line'));box.append(behavior);

    const icons=section('Sidebar icons');
    const list=document.createElement('div');list.className='nexus-icon-visibility';for(const item of [...N.FEATURES,...N.sites].filter(x=>N.canUseItem?.(x,String(x.id||'').startsWith('site-')))){const lab=document.createElement('label');const cb=input('checkbox',!(s.hiddenIcons||[]).includes(item.id));cb.onchange=async()=>{const set=new Set(s.hiddenIcons||[]);cb.checked?set.delete(item.id):set.add(item.id);s.hiddenIcons=[...set];await N.saveSettings();N.renderRail();};lab.append(cb,document.createTextNode(item.name));list.append(lab)}icons.append(row('Visible icons',list,N.isGuest?'Guest mode only shows basic icons and your first custom site':'Hide and Settings stay in the bottom-left controls'));
    const railActions=document.createElement('div');railActions.className='nexus-inline-actions';
    const edit=document.createElement('button');edit.textContent=N.editMode?'Finish reordering':'Reorder icons';edit.onclick=()=>{N.editMode=!N.editMode;N.apply();N.renderRail();N.renderSettings();};
    const reset=document.createElement('button');reset.textContent='Reset order';reset.onclick=async()=>{s.railLayout=[];await N.saveSettings();N.renderRail();N.renderSettings();};
    railActions.append(edit,reset);icons.append(row('Icon order',railActions,'Reorder mode only lets you drag the existing icons.'));

    const shortcutSettings=document.createElement('div');shortcutSettings.className='nexus-shortcut-settings';
    const manager=N.sidebarShortcutManager;
    if(N.isGuest){
      const locked=document.createElement('div');locked.className='nexus-shortcut-empty';locked.textContent='Sign in with DigitBox to add feature shortcuts to the sidebar.';shortcutSettings.append(locked);
    }else if(manager){
      const addRow=document.createElement('div');addRow.className='nexus-shortcut-add-row';
      const select=document.createElement('select');
      const placeholder=new Option('Choose a widget or feature…','');placeholder.disabled=true;placeholder.selected=true;select.add(placeholder);
      for(const item of manager.catalog().filter(x=>!x.added)){
        const option=new Option(item.name,item.id);
        option.title=item.desc||'';
        select.add(option);
      }
      const addShortcut=document.createElement('button');addShortcut.type='button';addShortcut.textContent='Add';addShortcut.disabled=true;
      select.onchange=()=>{addShortcut.disabled=!select.value;};
      addShortcut.onclick=async()=>{if(!select.value)return;if(await manager.add(select.value))N.renderSettings();};
      addRow.append(select,addShortcut);
      shortcutSettings.append(addRow);

      const added=document.createElement('div');added.className='nexus-shortcut-added';
      const current=manager.added();
      if(!current.length){
        const empty=document.createElement('div');empty.className='nexus-shortcut-empty';empty.textContent='No extra feature shortcuts added.';
        added.append(empty);
      }else{
        for(const item of current){
          const line=document.createElement('div');line.className='nexus-shortcut-added-row';
          const name=document.createElement('span');name.textContent=item.name;
          const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';
          remove.onclick=async()=>{if(await manager.remove(item.id))N.renderSettings();};
          line.append(name,remove);added.append(line);
        }
      }
      shortcutSettings.append(added);
    }else{
      const loading=document.createElement('div');loading.className='nexus-shortcut-empty';loading.textContent='Feature shortcuts are still loading.';
      shortcutSettings.append(loading);
    }
    icons.append(row('Add feature shortcut',shortcutSettings,N.isGuest?'Member feature':'Choose a widget or Nexus feature to place directly on the sidebar.'));
    box.append(icons);

    const updates=section('Updates');
    const auto=input('checkbox',s.autoUpdateCheck!==false);auto.onchange=()=>save('autoUpdateCheck',auto.checked);updates.append(row('Check GitHub automatically',auto,'Checks for a newer Nexus version every 6 hours'));
    const status=document.createElement('div');status.className='nexus-update-status';status.textContent='Checking GitHub…';const actions=document.createElement('div');actions.className='nexus-inline-actions';const check=document.createElement('button');check.textContent='Check now';const open=document.createElement('button');open.textContent='Open GitHub';actions.append(check,open);updates.append(row('GitHub update',status,'Unpacked extensions cannot silently reinstall themselves; Edge Store builds update through Edge'),row('Update actions',actions));
    const refreshStatus=async(force=false)=>{const r=await N.msg({type:force?'nexus:update-check':'nexus:update-status'});status.textContent=r?.available?`v${r.remoteVersion} available · installed v${r.localVersion}`:`Up to date · v${r?.localVersion||chrome.runtime.getManifest().version}`;status.classList.toggle('available',!!r?.available)};check.onclick=()=>refreshStatus(true);open.onclick=()=>N.msg({type:'nexus:update-open'});refreshStatus();box.append(updates);

    const custom=section('Custom sites & CSS');
    const sites=document.createElement('div');sites.className='nexus-site-settings';for(const [index,site] of N.sites.entries()){const d=document.createElement('div');d.textContent=site.name+(N.isGuest&&index>0?' · member only':'');const b=document.createElement('button');b.textContent='Remove';b.onclick=async()=>{await N.removeSite(site.id);N.renderSettings()};d.append(b);sites.append(d)}const n=input('text',''),u=input('text',''),add=document.createElement('button');n.placeholder='Site name';u.placeholder='https://example.com';add.textContent=N.isGuest&&N.sites.length>=1?'Guest limit reached':'Add site';add.disabled=!!(N.isGuest&&N.sites.length>=1);add.onclick=async()=>{if(await N.addSite(n.value,u.value))N.renderSettings()};sites.append(n,u,add);custom.append(row('Custom sites',sites,N.isGuest?'Guest mode includes 1 custom site · sign in for unlimited sites':'Sites are added here, not from the sidebar'));
    const css=document.createElement('textarea');css.rows=8;css.value=s.customCSS||'';css.placeholder='#nexus-panel { ... }';css.disabled=!!N.isGuest;css.oninput=()=>{if(N.isGuest)return; s.customCSS=css.value;N.customStyle.textContent=css.value;clearTimeout(css._t);css._t=setTimeout(()=>N.saveSettings(),350)};custom.append(row('Custom CSS',css,N.isGuest?'Sign in with DigitBox to use Custom CSS':'Loaded last'));box.append(custom);
    const account=section('DigitBox account');
    const accountStatus=document.createElement('div');accountStatus.className='nexus-update-status';accountStatus.textContent=N.isGuest?'Guest mode · basic features only':`Connected · ${N.digitboxUser?.displayName||N.digitboxUser?.email||'DigitBox member'}`;
    const accountAction=document.createElement('button');accountAction.textContent=N.isGuest?'Sign in to unlock full Nexus':'Open profile';accountAction.onclick=()=>N.isGuest?N.msg({type:'nexus:open-tab',url:'https://digitbox.dev/login?next=/profile'}):N.openDigitBoxProfile?.();
    account.append(row('Account status',accountStatus,N.isGuest?'Modern theme · 1 custom site · Launchpad · History · Bookmarks':'Full Nexus is unlocked'),row('Account',accountAction));
    box.prepend(account);
    N.body.append(box);
    async function save(k,v){s[k]=v;await N.saveSettings();N.apply();}
  };
});
