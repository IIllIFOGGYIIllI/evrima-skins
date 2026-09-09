const CFG=window.FOGGY_SKIN_CONFIG||{};
const API=String(CFG.API_BASE||"").replace(/\/$/,"");
const API_READY=API.startsWith("https://")&&!API.includes("YOUR-RAILWAY");
const SPECIES=[{"name":"Tyrannosaurus","slug":"tyrannosaurus","category":"Apex Carnivore","patterns":3,"image":"https://theisle.ru/assets/species/tyrannosaurus.webp"},{"name":"Allosaurus","slug":"allosaurus","category":"Apex Carnivore","patterns":3,"image":"https://theisle.ru/assets/species/allosaurus.webp"},{"name":"Austroraptor","slug":"austroraptor","category":"Carnivore","patterns":3,"image":"https://theisle.ru/assets/species/austroraptor.webp"},{"name":"Carnotaurus","slug":"carnotaurus","category":"Carnivore","patterns":4,"image":"https://theisle.ru/assets/species/carnotaurus.webp"},{"name":"Ceratosaurus","slug":"ceratosaurus","category":"Carnivore","patterns":3,"image":"https://theisle.ru/assets/species/ceratosaurus.webp"},{"name":"Deinosuchus","slug":"deinosuchus","category":"Aquatic Apex","patterns":3,"image":"https://theisle.ru/assets/species/deinosuchus.webp"},{"name":"Dilophosaurus","slug":"dilophosaurus","category":"Carnivore","patterns":3,"image":"https://theisle.ru/assets/species/dilophosaurus.webp"},{"name":"Herrerasaurus","slug":"herrerasaurus","category":"Carnivore","patterns":3,"image":"https://theisle.ru/assets/species/herrerasaurus.webp"},{"name":"Omniraptor","slug":"omniraptor","category":"Carnivore","patterns":5,"image":"https://theisle.ru/assets/species/omniraptor.webp"},{"name":"Pteranodon","slug":"pteranodon","category":"Flyer","patterns":3,"image":"https://theisle.ru/assets/species/pteranodon.webp"},{"name":"Troodon","slug":"troodon","category":"Carnivore","patterns":3,"image":"https://theisle.ru/assets/species/troodon.webp"},{"name":"Triceratops","slug":"triceratops","category":"Large Herbivore","patterns":3,"image":"https://theisle.ru/assets/species/triceratops.webp"},{"name":"Stegosaurus","slug":"stegosaurus","category":"Large Herbivore","patterns":3,"image":"https://theisle.ru/assets/species/stegosaurus.webp"},{"name":"Diabloceratops","slug":"diabloceratops","category":"Herbivore","patterns":3,"image":"https://theisle.ru/assets/species/diabloceratops.webp"},{"name":"Kentrosaurus","slug":"kentrosaurus","category":"Herbivore","patterns":3,"image":"https://theisle.ru/assets/species/kentrosaurus.webp"},{"name":"Tenontosaurus","slug":"tenontosaurus","category":"Herbivore","patterns":3,"image":"https://theisle.ru/assets/species/tenontosaurus.webp"},{"name":"Maiasaura","slug":"maiasaura","category":"Herbivore","patterns":3,"image":"https://theisle.ru/assets/species/maiasaura.webp"},{"name":"Pachycephalosaurus","slug":"pachycephalosaurus","category":"Herbivore","patterns":4,"image":"https://theisle.ru/assets/species/pachycephalosaurus.webp"},{"name":"Dryosaurus","slug":"dryosaurus","category":"Herbivore","patterns":3,"image":"https://theisle.ru/assets/species/dryosaurus.webp"},{"name":"Hypsilophodon","slug":"hypsilophodon","category":"Herbivore","patterns":3,"image":"https://theisle.ru/assets/species/hypsilophodon.webp"},{"name":"Gallimimus","slug":"gallimimus","category":"Omnivore","patterns":3,"image":"https://theisle.ru/assets/species/gallimimus.webp"},{"name":"Beipiaosaurus","slug":"beipiaosaurus","category":"Omnivore","patterns":3,"image":"https://theisle.ru/assets/species/beipiaosaurus.webp"}];
const PRESETS={"Swamp":{"body":"#283820","markings":"#121A0E","flank":"#52613B","underbelly":"#7A7654","detail":"#172414","eyes":"#E09B27","breed":"#7C8A39","teeth":"#D8CFAC","mouth":"#63262C","claws":"#25221C"},"Melanistic":{"body":"#111216","markings":"#050506","flank":"#252832","underbelly":"#35343A","detail":"#09090B","eyes":"#D18A1E","breed":"#2E3340","teeth":"#CDC4A6","mouth":"#481A20","claws":"#101114"},"Albino":{"body":"#E5DAD1","markings":"#FAF1EB","flank":"#D3C4BF","underbelly":"#FFF6ED","detail":"#BAA8A4","eyes":"#F14A58","breed":"#E3B9BF","teeth":"#F4E9C8","mouth":"#965061","claws":"#C1B0A9"},"Bloodmoon":{"body":"#3C090B","markings":"#A3080C","flank":"#671014","underbelly":"#2D0A0C","detail":"#D41117","eyes":"#FF250F","breed":"#86080D","teeth":"#C0A27D","mouth":"#79070C","claws":"#270708"},"Frost":{"body":"#91AFBA","markings":"#E3F2F5","flank":"#5D8598","underbelly":"#E8F0EC","detail":"#376985","eyes":"#27D7FF","breed":"#76B4CF","teeth":"#EEF0D9","mouth":"#603746","claws":"#5C727A"},"Jungle":{"body":"#284824","markings":"#A0851A","flank":"#3C6429","underbelly":"#827B43","detail":"#132B11","eyes":"#F4BC19","breed":"#739A28","teeth":"#D4C793","mouth":"#651E21","claws":"#221F15"}};

const SLOTS=[
{key:"body",label:"Body",desc:"Main body / base colour"},
{key:"markings",label:"Markings",desc:"Pattern / markings colour"},
{key:"flank",label:"Flank",desc:"Sides / flank colour"},
{key:"underbelly",label:"Underbelly",desc:"Belly / throat colour"},
{key:"detail",label:"Detail",desc:"Dorsal / accent region"},
{key:"breed",label:"Display / Breed",desc:"Male display region"},
{key:"eyes",label:"Eyes",desc:"Eye colour"},
{key:"teeth",label:"Teeth",desc:"Teeth material colour"},
{key:"mouth",label:"Mouth",desc:"Mouth interior colour"},
{key:"claws",label:"Claws",desc:"Claw material colour"}];

const DEFAULTS={
body:"#6D706B",markings:"#343A35",flank:"#7C8179",underbelly:"#A5A49A",
detail:"#49504A",breed:"#687A5A",eyes:"#D59B36",teeth:"#D8CFAC",
mouth:"#6B3037",claws:"#333333"
};

const HQ_AVAILABLE=new Set(["allosaurus","beipiaosaurus","carnotaurus","ceratosaurus","deinosuchus","diabloceratops","dilophosaurus","dryosaurus","gallimimus","herrerasaurus","hypsilophodon","kentrosaurus","maiasaura","omniraptor","pachycephalosaurus","pteranodon","stegosaurus","tenontosaurus","triceratops","troodon","tyrannosaurus"]);

let colors={...DEFAULTS};
let selected=SPECIES[0],patternIndex=0,skinVariation=1,themeIndex=0,previewSex="male";
// ThemeIndex is intentionally fixed at 0 in production. Current Evrima
// showed no visible Default/Secondary difference in preview or live gameplay.
let previewMode="skin3d";
let session=localStorage.getItem("foggy_skin_session")||"",me=null;
let history=[],future=[],historyLock=false;
let cloudLibrary={skins:[],lastApplied:null},activeCloudId="",bridgeOnline=false,cloudBusy=false;
const $=id=>document.getElementById(id);

function toast(m){
  const t=$("toast");t.textContent=m;t.classList.add("show");
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),1700);
}
function cleanHex(v){
  v=String(v||"").trim().replace(/^#/,"").toUpperCase();
  return /^[0-9A-F]{6}$/.test(v)?"#"+v:null;
}
function rgb(h){
  h=cleanHex(h)||"#000000";
  return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
}
function rgbHex(r,g,b){
  const q=n=>Math.max(0,Math.min(255,Math.round(n))).toString(16).padStart(2,"0").toUpperCase();
  return "#"+q(r)+q(g)+q(b);
}
function hsl(h,s,l){
  s/=100;l/=100;
  const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
  let r=0,g=0,b=0;
  if(h<60)[r,g,b]=[c,x,0];else if(h<120)[r,g,b]=[x,c,0];
  else if(h<180)[r,g,b]=[0,c,x];else if(h<240)[r,g,b]=[0,x,c];
  else if(h<300)[r,g,b]=[x,0,c];else[r,g,b]=[c,0,x];
  return rgbHex((r+m)*255,(g+m)*255,(b+m)*255);
}
function snapshot(){
  return{colors:{...colors},species:selected.slug,patternIndex,skinVariation,themeIndex,previewSex};
}
function pushHistory(){
  if(historyLock)return;
  history.push(snapshot());if(history.length>40)history.shift();future=[];
}
function restore(s){
  if(!s)return;
  historyLock=true;
  colors={...DEFAULTS,...s.colors};
  selected=SPECIES.find(x=>x.slug===s.species)||selected;
  patternIndex=Math.min(Number(s.patternIndex)||0,selected.patterns-1);
  skinVariation=Math.min(2,Math.max(0,Number(s.skinVariation)||0));
  themeIndex=0;
  previewSex=s.previewSex==="female"?"female":"male";
  $("species").value=selected.slug;
  renderAll();
  historyLock=false;
}
function shareCode(){
  return `FGY2:${selected.slug}:${patternIndex}:${skinVariation}:${themeIndex}:`+
    SLOTS.map(s=>colors[s.key].slice(1)).join("-");
}
function viewerState(){
  return{
    species:{...selected},
    colors:{...colors},
    patternIndex,skinVariation,themeIndex,previewSex,
    enabled:true,
    mode:previewMode,
    fallbackImage:selected.image
  };
}
function viewerSettings(){
  return{
    scene:$("sceneSelect").value,
    background:$("backgroundEnabled").checked,
    brightness:Number($("backdropBrightness").value)/100,
    lighting:Number($("lighting").value)/100,
    idle:$("idleEnabled").checked
  };
}
function emitViewer(){
  window.FOGGY_VIEWER_STATE=viewerState();
  window.FOGGY_VIEWER_SETTINGS=viewerSettings();
  window.dispatchEvent(new CustomEvent("foggy:viewer-state",{detail:window.FOGGY_VIEWER_STATE}));
  window.dispatchEvent(new CustomEvent("foggy:viewer-settings",{detail:window.FOGGY_VIEWER_SETTINGS}));
}
function renderPalette(){
  const bar=$("paletteBar");bar.innerHTML="";
  SLOTS.forEach(s=>{
    const d=document.createElement("div");d.className="palette-chip";d.style.background=colors[s.key];
    d.title=`${s.label} ${colors[s.key]}`;bar.appendChild(d);
  });
  $("shareCode").value=shareCode();
}
function renderPatternButtons(){
  const box=$("patternButtons");box.innerHTML="";
  for(let i=0;i<selected.patterns;i++){
    const b=document.createElement("button");b.textContent=String(i+1);b.classList.toggle("active",i===patternIndex);
    b.onclick=()=>{pushHistory();patternIndex=i;renderAll();};
    box.appendChild(b);
  }
}
function renderSegmented(){
  document.querySelectorAll("#variationButtons button").forEach(b=>b.classList.toggle("active",Number(b.dataset.value)===skinVariation));
  document.querySelectorAll("#sexButtons button").forEach(b=>b.classList.toggle("active",b.dataset.value===previewSex));
}
function renderColors(){
  SLOTS.forEach(s=>{
    const p=$("pick-"+s.key),h=$("hex-"+s.key),r=$("rgb-"+s.key);
    if(p)p.value=colors[s.key];if(h)h.value=colors[s.key];
    if(r){const [a,b,c]=rgb(colors[s.key]);r.textContent=`RGB ${a}, ${b}, ${c}`;}
  });
}
function renderPreviewMode(){
  if(previewMode==="hq"&&!HQ_AVAILABLE.has(selected.slug))previewMode="skin3d";
  document.querySelectorAll("[data-preview-mode]").forEach(b=>{
    const mode=b.dataset.previewMode;
    b.classList.toggle("active",mode===previewMode);
    b.disabled=mode==="hq"&&!HQ_AVAILABLE.has(selected.slug);
  });
  $("viewerShell").classList.toggle("mode-hq",previewMode==="hq");
  const title=$("fidelityTitle"),text=$("fidelityText");
  if(previewMode==="hq"){
    title.textContent="Evrima-source 3D preview";
    text.textContent="Species-specific Evrima-source model with the researched pattern/RAC/normal compositing pipeline. Pattern variation still applies in-game; its exact browser transform is intentionally not guessed.";
    $("viewerHint").textContent="Drag to rotate · wheel to zoom";
  }else if(previewMode==="skin3d"){
    title.textContent="Evrima colour-map 3D";
    text.textContent="Same verified species model and source pattern maps, rendered as an interactive browser preview. No generic dinosaur proxy is used.";
    $("viewerHint").textContent="Drag to rotate · wheel to zoom";
  }else{
    title.textContent="Evrima side view";
    text.textContent="Fixed side-on view of the same verified species model and composited skin.";
    $("viewerHint").textContent="Fixed side-on skin preview";
  }
}
function renderAll(){
  $("previewTitle").textContent=selected.name;$("viewerSpecies").textContent=selected.name;
  $("categoryBadge").textContent=selected.category;$("species").value=selected.slug;
  $("referenceImage").src=selected.image;$("referenceImage").alt=selected.name+" Evrima reference";
  renderPatternButtons();renderSegmented();renderColors();renderPalette();renderPreviewMode();emitViewer();
}
function buildSpecies(){
  const groups={};
  SPECIES.forEach(s=>(groups[s.category]||=[]).push(s));
  Object.entries(groups).forEach(([cat,list])=>{
    const g=document.createElement("optgroup");g.label=cat;
    list.forEach(s=>g.append(new Option(s.name,s.slug)));$("species").append(g);
  });
}
function buildColors(){
  SLOTS.forEach(s=>{
    const card=document.createElement("div");card.className="color-card";
    card.innerHTML=`<div><div class="color-name">${s.label}</div><div class="color-desc">${s.desc}</div><div id="rgb-${s.key}" class="rgb"></div></div>
      <input id="pick-${s.key}" type="color">
      <input id="hex-${s.key}" class="hex-input" maxlength="7">`;
    $("colors").append(card);
    const pick=card.querySelector("input[type=color]"),hex=card.querySelector(".hex-input");
    let startValue=colors[s.key];
    pick.addEventListener("pointerdown",()=>{startValue=colors[s.key];});
    pick.addEventListener("input",e=>{colors[s.key]=e.target.value.toUpperCase();renderAll();});
    pick.addEventListener("change",()=>{if(startValue!==colors[s.key]){history.push({...snapshot(),colors:{...colors,[s.key]:startValue}});future=[];}});
    hex.addEventListener("change",e=>{
      const v=cleanHex(e.target.value);
      if(!v){e.target.value=colors[s.key];toast("Invalid HEX colour");return;}
      if(v!==colors[s.key])pushHistory();colors[s.key]=v;renderAll();
    });
  });
}
function buildPresets(){
  Object.entries(PRESETS).forEach(([name,preset])=>{
    const b=document.createElement("button");b.textContent=name;
    b.onclick=()=>{pushHistory();colors={...colors,...preset};renderAll();toast(name+" preset");};
    $("presets").append(b);
  });
}
function naturalize(){
  pushHistory();const h=Math.floor(Math.random()*360);
  colors={
    body:hsl(h,24+Math.random()*16,27+Math.random()*10),
    markings:hsl((h+12)%360,34+Math.random()*18,13+Math.random()*10),
    flank:hsl((h+5)%360,22+Math.random()*17,34+Math.random()*12),
    underbelly:hsl((h+18)%360,15+Math.random()*12,53+Math.random()*12),
    detail:hsl((h+345)%360,32+Math.random()*18,19+Math.random()*10),
    breed:hsl((h+35)%360,36+Math.random()*24,38+Math.random()*13),
    eyes:hsl(Math.floor(Math.random()*360),72,54),
    teeth:hsl(42,24,78),mouth:hsl(350,46,27),claws:hsl((h+5)%360,9,15)
  };renderAll();
}
function randomize(){
  pushHistory();const h=Math.floor(Math.random()*360),rnd=()=>Math.floor(Math.random()*360);
  colors={
    body:hsl(h,72,44),markings:hsl((h+60)%360,90,48),flank:hsl((h+330)%360,68,39),
    underbelly:hsl((h+25)%360,48,67),detail:hsl((h+175)%360,87,48),breed:hsl((h+90)%360,82,47),
    eyes:hsl(rnd(),100,57),teeth:hsl(48,42,83),mouth:hsl(345,68,34),claws:hsl((h+210)%360,45,22)
  };renderAll();
}
function savedDb(){
  try{return JSON.parse(localStorage.getItem("foggy_skin_presets_v60")||"{}");}catch{return{};}
}
function refreshSaved(){
  const d=savedDb(),sel=$("savedSkins");sel.innerHTML="";
  const names=Object.keys(d).sort();
  if(!names.length){sel.append(new Option("No saved skins yet",""));return;}
  sel.append(new Option("Choose saved skin…",""));names.forEach(n=>sel.append(new Option(n,n)));
}
async function saveSkin(){
  const n=$("skinName").value.trim()||`${selected.name} Skin`,d=savedDb();
  d[n]=snapshot();localStorage.setItem("foggy_skin_presets_v60",JSON.stringify(d));
  refreshSaved();$("savedSkins").value=n;$("skinName").value=n;
  if(me){toast("Saved locally · syncing Steam library");await saveCurrentCloud(false);}else toast("Saved in this browser");
}
function loadSaved(){
  const n=$("savedSkins").value,d=savedDb()[n];if(!d)return;
  activeCloudId="";pushHistory();restore(d);$("skinName").value=n;toast("Browser backup loaded");
}
function importCode(raw){
  const m=String(raw||"").trim().match(/^FGY2:([a-z]+):(\d+):(\d+):(\d+):([0-9A-Fa-f]{6}(?:-[0-9A-Fa-f]{6}){9})$/);
  if(!m){toast("Invalid FGY2 code");return;}
  const sp=SPECIES.find(s=>s.slug===m[1]);if(!sp){toast("Unknown species");return;}
  activeCloudId="";pushHistory();selected=sp;patternIndex=Math.min(Number(m[2]),sp.patterns-1);
  skinVariation=Math.min(2,Number(m[3]));themeIndex=0;
  const p=m[5].split("-");SLOTS.forEach((s,i)=>colors[s.key]="#"+p[i].toUpperCase());
  renderAll();toast("Skin imported");
}

const API_TIMEOUT_MS=8000;
async function api(path,opt={}){
  if(!API_READY)throw Error("Skin API is not configured");
  const headers={...(opt.headers||{})};if(session)headers.Authorization="Bearer "+session;
  if(opt.body)headers["Content-Type"]="application/json";

  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),API_TIMEOUT_MS);
  try{
    const r=await fetch(API+path,{...opt,headers,signal:controller.signal});let d={};
    try{d=await r.json();}catch{}
    if(!r.ok)throw Error(d.error||`Request failed (${r.status})`);
    return d;
  }catch(e){
    if(e?.name==="AbortError")throw Error("Skin API timed out");
    throw e;
  }finally{
    clearTimeout(timer);
  }
}
const CLOUD_CACHE_KEY="foggy_cloud_library_cache_v1",CLOUD_QUEUE_KEY="foggy_cloud_sync_queue_v1";
function cloudUuid(){return crypto?.randomUUID?crypto.randomUUID():"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==="x"?r:(r&3|8);return v.toString(16)});}
function cloudSnapshot(id=activeCloudId||cloudUuid(),name=$("skinName").value.trim()||`${selected.name} Skin`){return{id,name,species:selected.slug,patternIndex,skinVariation,themeIndex:0,previewSex,colors:{...colors}};}
function cloudCacheRead(){try{const d=JSON.parse(localStorage.getItem(CLOUD_CACHE_KEY)||"null");return d&&me&&d.steam===me.steam?d:null}catch{return null}}
function cloudCacheWrite(data){if(!me)return;localStorage.setItem(CLOUD_CACHE_KEY,JSON.stringify({steam:me.steam,skins:data.skins||[],lastApplied:data.lastApplied||null,cachedAt:Date.now()}));}
function cloudQueueRead(){try{return JSON.parse(localStorage.getItem(CLOUD_QUEUE_KEY)||"[]")}catch{return[]}}
function cloudQueueWrite(q){localStorage.setItem(CLOUD_QUEUE_KEY,JSON.stringify(q.slice(-30)));}
function queueCloudSave(skin){const q=cloudQueueRead().filter(x=>x.id!==skin.id);q.push({id:skin.id,skin,queuedAt:Date.now()});cloudQueueWrite(q);}
function removeQueuedCloudSave(id){cloudQueueWrite(cloudQueueRead().filter(x=>x.id!==id));}
function setCloudStatus(text,kind=""){const e=$("cloudLibraryStatus");if(!e)return;e.textContent=text;e.className="section-sub "+kind;}
function renderCloudLibrary(){
  const sel=$("cloudSkins");if(!sel)return;const keep=sel.value;sel.innerHTML="";
  const skins=[...(cloudLibrary.skins||[])].sort((a,b)=>(Number(Boolean(b.favorite))-Number(Boolean(a.favorite)))||(Number(b.updatedAt||0)-Number(a.updatedAt||0)));
  if(!skins.length){sel.append(new Option(me?"No Steam-linked skins yet":"Sign in with Steam",""));}
  else{sel.append(new Option("Choose Steam skin…",""));skins.forEach(s=>sel.append(new Option(`${s.favorite?"★ ":""}${s.name} · ${s.species}`,s.id)));}
  if(skins.some(s=>s.id===keep))sel.value=keep;
  const chosen=skins.find(s=>s.id===sel.value);$("favoriteCloud").textContent=chosen?.favorite?"★ Favourited":"☆ Favourite";
  $("loadLastApplied").disabled=!cloudLibrary.lastApplied?.skin;
}
function loadCachedCloudLibrary(){const c=cloudCacheRead();if(!c)return false;cloudLibrary={skins:Array.isArray(c.skins)?c.skins:[],lastApplied:c.lastApplied||null};renderCloudLibrary();setCloudStatus(`Cached Steam library · ${cloudLibrary.skins.length} skin${cloudLibrary.skins.length===1?"":"s"}`,"warn");return true;}
async function pollLibrary(id,timeout=35){
  for(let i=0;i<timeout;i++){
    await new Promise(r=>setTimeout(r,850));let d;
    try{d=await api("/api/library/status/"+encodeURIComponent(id));}catch(e){if(i===timeout-1)throw e;continue;}
    if(d.status==="completed")return d;
    if(d.status==="failed")throw Error(d.message||"Cloud library operation failed");
  }
  throw Error("Cloud library did not confirm in time");
}
async function cloudOp(action,payload={}){const d=await api("/api/library/op",{method:"POST",body:JSON.stringify({action,...payload})});return pollLibrary(d.id);}
async function refreshCloudLibrary(silent=false){
  if(!me){cloudLibrary={skins:[],lastApplied:null};renderCloudLibrary();setCloudStatus("Sign in with Steam to sync saved skins","");return false;}
  if(!bridgeOnline){if(!loadCachedCloudLibrary())setCloudStatus("Bridge offline · browser backups still work","bad");return false;}
  if(cloudBusy)return false;cloudBusy=true;if(!silent)setCloudStatus("Loading Steam library…","warn");
  try{const r=await cloudOp("list");cloudLibrary={skins:Array.isArray(r.data?.skins)?r.data.skins:[],lastApplied:r.data?.lastApplied||null};cloudCacheWrite(cloudLibrary);renderCloudLibrary();setCloudStatus(`Steam-linked · ${cloudLibrary.skins.length}/50 skins`,"good");return true;}
  catch(e){if(!loadCachedCloudLibrary())setCloudStatus(bridgeOnline?e.message:"Bridge offline · browser backups still work","bad");return false;}
  finally{cloudBusy=false;}
}
async function saveCurrentCloud(showToast=true){
  if(!me){if(showToast)toast("Sign in with Steam first");return false;}
  const skin=cloudSnapshot();activeCloudId=skin.id;queueCloudSave(skin);
  if(!bridgeOnline){if(showToast)toast("Saved locally · cloud sync queued");setCloudStatus("Cloud save queued · bridge offline","warn");return false;}
  try{const r=await cloudOp("save",{skin});removeQueuedCloudSave(skin.id);if(r.data?.name)$("skinName").value=r.data.name;if(showToast)toast("Saved to Steam library");await refreshCloudLibrary(true);return true;}
  catch(e){if(showToast)toast(bridgeOnline?"Cloud save queued for retry":"Saved locally · cloud sync queued");setCloudStatus("Cloud save queued · browser backup is safe","warn");return false;}
}
async function flushCloudQueue(){
  if(!me||!bridgeOnline||cloudBusy)return;const q=cloudQueueRead();if(!q.length)return;
  for(const item of q.slice(0,10)){try{await cloudOp("save",{skin:item.skin});removeQueuedCloudSave(item.id);}catch{return;}}
  await refreshCloudLibrary(true);
}
function selectedCloud(){return (cloudLibrary.skins||[]).find(s=>s.id===$("cloudSkins").value)||null;}
function loadCloudSkin(skin,id=""){if(!skin)return;activeCloudId=id||"";pushHistory();restore(skin);$("skinName").value=skin.name||`${selected.name} Skin`;toast(id?"Steam skin loaded":"Last applied skin loaded");}
async function mutateCloud(action,payload,success){
  if(!me){toast("Sign in with Steam first");return false;}if(!bridgeOnline){toast("FOGGY server bridge is offline");return false;}
  try{await cloudOp(action,payload);if(success)toast(success);await refreshCloudLibrary(true);return true;}catch(e){toast(e.message);return false;}
}
async function renameCloudSkin(){const s=selectedCloud();if(!s)return toast("Choose a Steam skin first");const name=prompt("Rename Steam skin",s.name);if(!name?.trim())return;await mutateCloud("rename",{id:s.id,name:name.trim()},"Cloud skin renamed");}
async function duplicateCloudSkin(){const s=selectedCloud();if(!s)return toast("Choose a Steam skin first");const newId=cloudUuid(),name=(s.name+" Copy").slice(0,48);if(await mutateCloud("duplicate",{id:s.id,newId,name},"Cloud skin duplicated")){activeCloudId=newId;$("cloudSkins").value=newId;}}
async function deleteCloudSkin(){const s=selectedCloud();if(!s)return toast("Choose a Steam skin first");if(!confirm(`Delete “${s.name}” from your Steam library?`))return;if(await mutateCloud("delete",{id:s.id},"Cloud skin deleted")&&activeCloudId===s.id)activeCloudId="";}
async function favoriteCloudSkin(){const s=selectedCloud();if(!s)return toast("Choose a Steam skin first");await mutateCloud("favorite",{id:s.id,favorite:!s.favorite},s.favorite?"Removed from favourites":"Added to favourites");}

function readAuthHash(){
  const h=new URLSearchParams(location.hash.replace(/^#/,"")),t=h.get("session");
  if(t){session=t;localStorage.setItem("foggy_skin_session",t);history.replaceState(null,"",location.pathname+location.search);}
}
async function refreshMe(){
  if(!API_READY){$("apiStatus").textContent="API not configured";$("apiStatus").className="status warn";setCloudStatus("Cloud library unavailable","bad");return;}
  try{await api("/health");$("apiStatus").textContent="Skin API online";$("apiStatus").className="status good";}
  catch{$("apiStatus").textContent="Skin API unreachable";$("apiStatus").className="status bad";}
  if(!session){me=null;cloudLibrary={skins:[],lastApplied:null};activeCloudId="";renderCloudLibrary();setCloudStatus("Sign in with Steam to sync saved skins","");$("accountTitle").textContent="Steam not linked";$("accountDetail").textContent="Sign in once. No client files or commands required.";$("steamButton").textContent="Sign in with Steam";return;}
  try{me=await api("/api/me");$("accountTitle").textContent="Steam linked";$("accountDetail").textContent="SteamID64 "+me.steam;$("steamButton").textContent="Sign out";loadCachedCloudLibrary();refreshCloudLibrary(true);}
  catch{session="";localStorage.removeItem("foggy_skin_session");me=null;refreshMe();}
}
let statusRefreshBusy=false;
async function refreshServerStatus(){
  if(!API_READY||statusRefreshBusy)return;
  statusRefreshBusy=true;
  try{
    const d=await api("/api/public/status");
    const was=bridgeOnline;bridgeOnline=Boolean(d.online);
    $("serverStatus").textContent=bridgeOnline?"FOGGY server bridge online":"FOGGY server bridge offline";
    $("serverStatus").className=bridgeOnline?"status good":"status bad";
    if(bridgeOnline&&!was&&me){flushCloudQueue().then(()=>refreshCloudLibrary(true));}
  }catch{
    bridgeOnline=false;$("serverStatus").textContent="Bridge status unavailable";
    $("serverStatus").className="status warn";
  }finally{
    statusRefreshBusy=false;
  }
}
async function pollApply(id){
  const o=$("result");
  for(let i=0;i<24;i++){
    await new Promise(r=>setTimeout(r,1000));
    try{const d=await api("/api/skins/status/"+encodeURIComponent(id));
      if(d.status==="applied"){o.textContent=d.message||"Skin applied.";o.className="result show ok";setTimeout(()=>refreshCloudLibrary(true),1500);return;}
      if(d.status==="failed"){o.textContent=d.message||"Skin apply failed.";o.className="result show err";return;}
    }catch{}
  }
  o.textContent="Request reached the web API but no UE4SS confirmation arrived.";o.className="result show err";
}
async function applySkin(){
  const o=$("result");
  if(!API_READY){o.textContent="Railway backend is not connected.";o.className="result show err";return;}
  if(!me){location.href=API+"/auth/steam";return;}
  const b=$("apply");b.disabled=true;o.textContent="Sending skin to your server…";o.className="result show";
  try{
    const d=await api("/api/skins/apply",{method:"POST",body:JSON.stringify({
      species:selected.slug,patternIndex,skinVariation,themeIndex:0,colors
    })});
    o.textContent="Request queued. Waiting for the Evrima server…";pollApply(d.id);
  }catch(e){o.textContent=e.message;o.className="result show err";}
  finally{b.disabled=false;}
}


buildSpecies();buildColors();buildPresets();refreshSaved();renderCloudLibrary();readAuthHash();renderAll();refreshMe();refreshServerStatus();
setInterval(refreshServerStatus,10000);

$("species").onchange=e=>{pushHistory();selected=SPECIES.find(s=>s.slug===e.target.value)||SPECIES[0];patternIndex=0;renderAll();};
$("randomSpecies").onclick=()=>{pushHistory();selected=SPECIES[Math.floor(Math.random()*SPECIES.length)];patternIndex=0;renderAll();};
document.querySelectorAll("#variationButtons button").forEach(b=>b.onclick=()=>{pushHistory();skinVariation=Number(b.dataset.value);renderAll();});
document.querySelectorAll("#sexButtons button").forEach(b=>b.onclick=()=>{previewSex=b.dataset.value;renderAll();});
$("naturalize").onclick=naturalize;$("randomize").onclick=randomize;
$("resetSkin").onclick=()=>{pushHistory();colors={...DEFAULTS};patternIndex=0;skinVariation=1;themeIndex=0;renderAll();toast("Skin reset");};
$("saveSkin").onclick=saveSkin;$("loadSaved").onclick=loadSaved;
$("deleteSaved").onclick=()=>{const n=$("savedSkins").value;if(!n)return;const d=savedDb();delete d[n];localStorage.setItem("foggy_skin_presets_v60",JSON.stringify(d));refreshSaved();toast("Browser backup deleted");};
$("refreshCloud").onclick=()=>refreshCloudLibrary(false);$("saveCloud").onclick=()=>saveCurrentCloud(true);
$("loadCloud").onclick=()=>{const s=selectedCloud();if(s)loadCloudSkin(s,s.id);else toast("Choose a Steam skin first");};
$("favoriteCloud").onclick=favoriteCloudSkin;$("renameCloud").onclick=renameCloudSkin;$("duplicateCloud").onclick=duplicateCloudSkin;$("deleteCloud").onclick=deleteCloudSkin;
$("loadLastApplied").onclick=()=>{const s=cloudLibrary.lastApplied?.skin;if(s)loadCloudSkin(s,"");else toast("No last applied skin recorded yet");};
$("cloudSkins").onchange=renderCloudLibrary;
$("copyCode").onclick=async()=>{try{await navigator.clipboard.writeText(shareCode());toast("Share code copied");}catch{prompt("Copy this code",shareCode());}};
$("importCode").onclick=()=>importCode($("shareCode").value);
$("undo").onclick=()=>{if(!history.length)return;future.push(snapshot());restore(history.pop());};
$("redo").onclick=()=>{if(!future.length)return;history.push(snapshot());restore(future.pop());};
$("apply").onclick=applySkin;
$("steamButton").onclick=()=>{if(me){session="";me=null;localStorage.removeItem("foggy_skin_session");refreshMe();}else if(API_READY)location.href=API+"/auth/steam";else toast("Railway backend is not connected");};

function emitSettings(){
  $("brightnessValue").textContent=$("backdropBrightness").value+"%";
  $("lightingValue").textContent=$("lighting").value+"%";
  $("viewerShell").className="viewer-shell scene-"+$("sceneSelect").value;
  window.FOGGY_VIEWER_SETTINGS=viewerSettings();
  window.dispatchEvent(new CustomEvent("foggy:viewer-settings",{detail:window.FOGGY_VIEWER_SETTINGS}));
}
["sceneSelect","backgroundEnabled","backdropBrightness","lighting","idleEnabled"].forEach(id=>$(id).addEventListener("input",emitSettings));
document.querySelectorAll("[data-preview-mode]").forEach(b=>b.onclick=()=>{
  if(b.disabled)return;
  previewMode=b.dataset.previewMode;
  renderAll();
});
$("resetCamera").onclick=()=>window.dispatchEvent(new CustomEvent("foggy:viewer-reset"));
emitSettings();

window.addEventListener("foggy:model-status",e=>{
  const d=e.detail||{},badge=$("modelBadge");
  badge.textContent=d.label||"Preview";
  badge.className="chip-label "+(d.kind==="exact"?"model-exact":d.kind==="proxy"?"model-proxy":d.kind==="error"?"model-error":d.kind==="loading"?"model-loading":"model-fallback");
});

