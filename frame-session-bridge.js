(() => {'use strict';if(window.top===window||!/^https?:$/.test(location.protocol))return;try{chrome.runtime.sendMessage({type:'nexus:cookie-allow',url:location.href})}catch{}})();
