/* Primeval Refuge optional install helper — web v0.16.0.
 * Installation is user-initiated. Browser-only routes never send private data to a service worker.
 */
(()=>{
  "use strict";
  const button=document.getElementById("pwaInstallButton");
  const help=document.getElementById("pwaInstallHelp");
  const helpText=document.getElementById("pwaInstallHelpText");
  const dismiss=document.getElementById("pwaInstallDismiss");
  let pendingPrompt=null;

  const standalone=()=>window.matchMedia?.("(display-mode: standalone)")?.matches||navigator.standalone===true;
  const isiOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  function update(){
    if(!button)return;
    button.hidden=standalone();
    if(standalone()&&help)help.hidden=true;
  }
  function advise(message){
    if(!help||!helpText)return;
    helpText.textContent=message;
    help.hidden=false;
  }

  window.addEventListener("beforeinstallprompt",event=>{
    event.preventDefault();
    pendingPrompt=event;
    update();
  });
  window.addEventListener("appinstalled",()=>{
    pendingPrompt=null;
    update();
  });
  window.matchMedia?.("(display-mode: standalone)")?.addEventListener?.("change",update);

  button?.addEventListener("click",async()=>{
    if(standalone())return;
    if(pendingPrompt){
      const event=pendingPrompt;
      pendingPrompt=null;
      try{
        await event.prompt();
        await event.userChoice;
      }catch{
        advise("Open your browser menu and choose Install app. You can keep using the website normally.");
      }
      update();
      return;
    }
    if(isiOS()){
      advise("On iPhone or iPad: open the browser Share menu, select Add to Home Screen, then confirm Add. The app opens from your Home Screen.");
    }else{
      advise("On Chrome or Edge: open the browser menu and select Install Primeval Refuge or Install app. On other browsers, use Add to Home Screen where available.");
    }
  });
  dismiss?.addEventListener("click",()=>{if(help)help.hidden=true;});
  update();

  if("serviceWorker" in navigator&&location.protocol==="https:"){
    window.addEventListener("load",()=>{
      navigator.serviceWorker.register("./sw.js",{scope:"./",updateViaCache:"none"})
        .catch(error=>{console.warn("[Primeval PWA] Offline shell registration unavailable:",error?.message||error);});
    },{once:true});
  }
})();