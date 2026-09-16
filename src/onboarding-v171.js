(() => {
  'use strict';
  if(window.__nexusOnboardingV171Loaded)return;
  window.__nexusOnboardingV171Loaded=true;
  const defer=()=>setTimeout(install,0);
  if(window.NexusSidebar)defer();
  document.addEventListener('nexus:ready',defer,{once:true});

  function install(){
    const N=window.NexusSidebar;if(!N)return;
    chrome.storage.local.get({nexusTutorialV171:false},st=>{if(!st.nexusTutorialV171)setTimeout(()=>show(N),650);});
  }

  function show(N){
    if(N.root.querySelector('#nexus-tutorial-v171'))return;
    const ov=document.createElement('div');ov.id='nexus-tutorial-v171';
    ov.innerHTML=`
      <div class="nxv2-tutorial-card">
        <div class="nxv2-tutorial-progress"><i></i><i></i><i></i><i></i></div>
        <div class="nxv2-tutorial-pages">
          <section>
            <span class="nxv2-tutorial-icon">⌘</span><h2>Meet the universal command</h2>
            <p>Press <kbd>Ctrl</kbd> + <kbd>Space</kbd> on a normal webpage. Open links, search, calculate, switch tabs, or find any Nexus feature.</p>
            <div class="nxv2-examples"><code>github.com</code><code>24*17</code><code>focus 25</code><code>JSON formatter</code></div>
          </section>
          <section hidden>
            <span class="nxv2-tutorial-icon">Aa</span><h2>Select or right-click</h2>
            <p>Select text for quick actions, or right-click anywhere to use Nexus’s own menu: Define, Ask AI, Notes, Search, Markdown, Focus, screenshots, and more.</p>
            <label><input type="checkbox" data-context checked> Use Nexus custom right-click menu</label>
            <label><input type="checkbox" data-selection checked> Show actions when text is selected</label>
          </section>
          <section hidden>
            <span class="nxv2-tutorial-icon">◐</span><h2>Choose your look</h2>
            <p>Pick a theme and which edge Nexus lives on. You can change this later in Settings or with commands like <code>theme glass</code> and <code>sidebar right</code>.</p>
            <div class="nxv2-theme-grid">${['modern','fluent','glass','minimal','neon'].map(x=>`<button data-theme="${x}">${x}</button>`).join('')}</div>
            <div class="nxv2-side-grid"><button data-side="left">Sidebar left</button><button data-side="right">Sidebar right</button></div>
          </section>
          <section hidden>
            <span class="nxv2-tutorial-icon">✦</span><h2>Nexus is edge-first</h2>
            <p>With auto-hide on, move your cursor all the way to the selected screen edge to reveal Nexus. The trigger strip is only 2 pixels wide.</p>
            <label><input type="checkbox" data-sites checked> Show custom website tabs in the sidebar</label>
            <p class="nxv2-muted">Nexus AI is now the Hub. It handles browser commands locally and hands open-ended AI questions to ChatGPT.</p>
          </section>
        </div>
        <div class="nxv2-tutorial-actions"><button data-skip>Skip</button><div><button data-back disabled>Back</button><button data-next>Next</button></div></div>
      </div>`;
    N.root.append(ov);

    const pages=[...ov.querySelectorAll('.nxv2-tutorial-pages section')],dots=[...ov.querySelectorAll('.nxv2-tutorial-progress i')];let page=0;
    const paint=()=>{pages.forEach((p,i)=>p.hidden=i!==page);dots.forEach((d,i)=>d.classList.toggle('active',i<=page));ov.querySelector('[data-back]').disabled=page===0;ov.querySelector('[data-next]').textContent=page===pages.length-1?'Finish':'Next';};
    const applySites=()=>{
      const show=ov.querySelector('[data-sites]').checked,hidden=new Set(N.settings.hiddenIcons||[]);
      N.settings.showCustomSites=show;
      for(const site of N.sites||[])show?hidden.delete(site.id):hidden.add(site.id);
      N.settings.hiddenIcons=[...hidden];
    };
    const finish=async()=>{
      N.settings.customContextMenu=ov.querySelector('[data-context]').checked;
      N.settings.selectionActions=ov.querySelector('[data-selection]').checked;
      applySites();await N.saveSettings();chrome.storage.local.set({nexusTutorialV171:true});ov.remove();N.renderRail?.();
    };
    ov.querySelector('[data-next]').onclick=()=>page===pages.length-1?finish():(page++,paint());
    ov.querySelector('[data-back]').onclick=()=>{if(page>0)page--;paint();};
    ov.querySelector('[data-skip]').onclick=()=>{chrome.storage.local.set({nexusTutorialV171:true});ov.remove();};
    ov.querySelectorAll('[data-theme]').forEach(b=>b.onclick=async()=>{N.settings.theme=b.dataset.theme;await N.saveSettings();N.apply();});
    ov.querySelectorAll('[data-side]').forEach(b=>b.onclick=async()=>{N.settings.edge=b.dataset.side;await N.saveSettings();N.apply();});
    paint();
  }
})();