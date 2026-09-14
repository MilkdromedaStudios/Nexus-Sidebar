document.addEventListener('nexus:ready',()=>{
  const N=window.NexusSidebar;
  N.destroySite=async id=>{const s=N.sessions.get(id);if(!s)return;try{s.iframe.src='about:blank';s.frame.remove();}catch{}N.sessions.delete(id);await N.msg({type:'nexus:frame-disable'});};
  N.showLocal=()=>{N.body.hidden=false;N.sessionsHost.classList.remove('visible');for(const s of N.sessions.values())s.frame.classList.remove('active');};
  N.showSite=s=>{N.body.hidden=true;N.sessionsHost.classList.add('visible');for(const x of N.sessions.values())x.frame.classList.toggle('active',x===s);};
  N.openSite=async item=>{
    let session=N.sessions.get(item.id);
    if(!session){
      const ok=await N.msg({type:'nexus:frame-enable'}); if(!ok?.ok){N.body.innerHTML=`<div class="nexus-empty">Could not enable site frame.<br>${ok?.error||''}</div>`;return;}
      if(N.settings.cookieSync)await N.msg({type:'nexus:cookie-allow',url:item.url});
      const frame=document.createElement('div');frame.className='nexus-session';
      const bar=document.createElement('div');bar.className='nexus-sitebar';const host=document.createElement('span');host.textContent=new URL(item.url).hostname;const reload=document.createElement('button');reload.textContent='↻';const close=document.createElement('button');close.textContent='✕';
      const iframe=document.createElement('iframe');iframe.src=item.url;iframe.allow='autoplay; clipboard-read; clipboard-write; encrypted-media; fullscreen; picture-in-picture';iframe.referrerPolicy='strict-origin-when-cross-origin';
      reload.onclick=()=>{try{iframe.src=iframe.src}catch{}};close.onclick=async()=>{await N.destroySite(item.id);N.active=null;N.panel.classList.remove('open');N.renderRail();};bar.append(host,reload,close);frame.append(bar,iframe);N.sessionsHost.append(frame);session={frame,iframe,item};N.sessions.set(item.id,session);
    }
    N.showSite(session);
  };
  N.addSite=async(name,url)=>{url=String(url||'').trim();if(!/^https?:\/\//i.test(url))url='https://'+url;try{url=new URL(url).href}catch{return false}const item={id:'site-'+crypto.randomUUID(),name:name.trim()||new URL(url).hostname,url,type:'web'};N.sites.push(item);await N.storeSet({nexusSites:N.sites});N.renderRail();return true;};
  N.removeSite=async id=>{await N.destroySite(id);N.sites=N.sites.filter(x=>x.id!==id);await N.storeSet({nexusSites:N.sites});N.renderRail();};
});
