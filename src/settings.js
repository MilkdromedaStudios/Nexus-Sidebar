document.addEventListener('nexus:ready',()=>{
  const N=window.NexusSidebar;
  const row=(label,input,small='')=>{const d=document.createElement('label');d.className='nexus-setting';const s=document.createElement('span');s.innerHTML=`<b>${label}</b>${small?`<small>${small}</small>`:''}`;d.append(s,input);return d};
  const input=(type,val)=>{const i=document.createElement('input');i.type=type;if(type==='checkbox')i.checked=!!val;else i.value=val??'';return i};
  N.renderSettings=()=>{N.body.replaceChildren();const s=N.settings;const box=document.createElement('div');box.className='nexus-settings';
    const name=input('text',s.profileName);name.onchange=()=>save('profileName',name.value.trim());box.append(row('Your name',name,'Used in greetings'));
    const theme=document.createElement('select');['neon','fluent','glass','minimal'].forEach(v=>theme.add(new Option(v,v,v===s.theme,v===s.theme)));theme.onchange=()=>save('theme',theme.value);box.append(row('Theme',theme));
    const edge=document.createElement('select');['left','right'].forEach(v=>edge.add(new Option(v,v,v===s.edge,v===s.edge)));edge.onchange=()=>save('edge',edge.value);box.append(row('Side',edge));
    const floating=input('checkbox',s.railStyle==='floating');floating.onchange=()=>save('railStyle',floating.checked?'floating':'bar');box.append(row('Floating icons',floating));
    const border=input('checkbox',s.borderless);border.onchange=()=>save('borderless',border.checked);box.append(row('No borders',border));
    const aut=input('checkbox',s.autoHide);aut.onchange=()=>save('autoHide',aut.checked);box.append(row('Auto-hide',aut));
    [['Auto-hide delay','autoHideDelay',100,2500],['Panel width','panelWidth',340,760],['Panel gap','panelGap',8,64],['Corner radius','radius',0,40],['Icon size','iconSize',16,30],['Reveal zone','revealWidth',4,24]].forEach(([l,k,min,max])=>{const i=input('range',s[k]);i.min=min;i.max=max;i.oninput=()=>save(k,+i.value);box.append(row(l,i))});
    const acc=input('color',s.accent);acc.oninput=()=>save('accent',acc.value);box.append(row('Accent',acc));
    const loc=input('text',s.weatherLocation);loc.onchange=()=>save('weatherLocation',loc.value.trim());box.append(row('Weather location',loc,'Blank = automatic'));
    const cookies=input('checkbox',s.cookieSync);cookies.onchange=()=>save('cookieSync',cookies.checked);box.append(row('Share browser login',cookies,'Allow framed sites to use browser session'));
    const mode=document.createElement('select');[['exclude','Hide on listed sites'],['include','Only show on listed sites'],['all','Show everywhere'],['none','Never show sidebar']].forEach(([v,n])=>mode.add(new Option(n,v,v===s.visibilityMode,v===s.visibilityMode)));mode.onchange=()=>save('visibilityMode',mode.value);box.append(row('Site visibility',mode));
    const patterns=document.createElement('textarea');patterns.rows=5;patterns.value=s.visibilityPatterns||'';patterns.placeholder='youtube.com\n*.google.com\nhttps://example.com/work/*';patterns.onchange=()=>save('visibilityPatterns',patterns.value);box.append(row('Allow/block patterns',patterns,'One wildcard rule per line'));
    const css=document.createElement('textarea');css.rows=8;css.value=s.customCSS||'';css.placeholder='#nexus-panel { ... }';css.oninput=()=>{s.customCSS=css.value;N.customStyle.textContent=css.value;clearTimeout(css._t);css._t=setTimeout(()=>N.saveSettings(),350)};box.append(row('Custom CSS',css,'Loaded last'));
    const sites=document.createElement('div');sites.className='nexus-site-settings';for(const site of N.sites){const d=document.createElement('div');d.textContent=site.name;const b=document.createElement('button');b.textContent='Remove';b.onclick=async()=>{await N.removeSite(site.id);N.renderSettings()};d.append(b);sites.append(d)}const n=input('text',''),u=input('text',''),add=document.createElement('button');n.placeholder='Site name';u.placeholder='https://example.com';add.textContent='Add site';add.onclick=async()=>{if(await N.addSite(n.value,u.value))N.renderSettings()};sites.append(n,u,add);box.append(row('Custom sites',sites));
    N.body.append(box);
    async function save(k,v){s[k]=v;await N.saveSettings();N.apply();}
  };
});
