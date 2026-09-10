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
let publishedMine=[],sharedPublicationItem=null;
let communityPublic=[],communityFavorites=new Set(),communityBusy=false,communityTagFilter="";
const APPLY_HISTORY_KEY="foggy_apply_history_v1";
let activeApplyId="",activeApplyData=null,applyPollToken=0,applyBusy=false;
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
    if(!r.ok){const e=Error(d.error||`Request failed (${r.status})`);e.status=r.status;e.data=d;throw e;}
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
function cleanCloudTags(raw){
  const values=Array.isArray(raw)?raw:String(raw||"").split(",");
  const out=[],seen=new Set();
  for(let v of values){
    v=String(v||"").replace(/[\r\n\t]/g," ").replace(/\s+/g," ").trim().slice(0,20);
    if(!v)continue;const key=v.toLowerCase();if(seen.has(key))continue;seen.add(key);out.push(v);if(out.length>=8)break;
  }
  return out;
}
function cleanVisibility(v){v=String(v||"private").toLowerCase();return["private","unlisted","public"].includes(v)?v:"private";}
function cloudSnapshot(id=activeCloudId||cloudUuid(),name=$("skinName").value.trim()||`${selected.name} Skin`){
  const existing=(cloudLibrary.skins||[]).find(s=>s.id===id);
  return{id,name,species:selected.slug,patternIndex,skinVariation,themeIndex:0,previewSex,colors:{...colors},
    tags:cleanCloudTags(existing?.tags||[]),visibility:cleanVisibility(existing?.visibility),favorite:Boolean(existing?.favorite)};
}
function cloudCacheRead(){try{const d=JSON.parse(localStorage.getItem(CLOUD_CACHE_KEY)||"null");return d&&me&&d.steam===me.steam?d:null}catch{return null}}
function cloudCacheWrite(data){if(!me)return;localStorage.setItem(CLOUD_CACHE_KEY,JSON.stringify({steam:me.steam,skins:data.skins||[],lastApplied:data.lastApplied||null,cachedAt:Date.now()}));}
function cloudQueueRead(){try{return JSON.parse(localStorage.getItem(CLOUD_QUEUE_KEY)||"[]")}catch{return[]}}
function cloudQueueWrite(q){localStorage.setItem(CLOUD_QUEUE_KEY,JSON.stringify(q.slice(-30)));}
function queueCloudSave(skin){const q=cloudQueueRead().filter(x=>x.id!==skin.id);q.push({id:skin.id,skin,queuedAt:Date.now()});cloudQueueWrite(q);}
function removeQueuedCloudSave(id){cloudQueueWrite(cloudQueueRead().filter(x=>x.id!==id));}
function setCloudStatus(text,kind=""){const e=$("cloudLibraryStatus");if(!e)return;e.textContent=text;e.className="section-sub "+kind;}
function cloudFilteredSkins(){
  let skins=[...(cloudLibrary.skins||[])];
  const q=String($("cloudSearch")?.value||"").trim().toLowerCase();
  const species=String($("cloudSpeciesFilter")?.value||"");
  const favOnly=$("cloudFavoritesOnly")?.classList.contains("active");
  if(q)skins=skins.filter(s=>[s.name,s.species,...(Array.isArray(s.tags)?s.tags:[])].some(v=>String(v||"").toLowerCase().includes(q)));
  if(species)skins=skins.filter(s=>s.species===species);
  if(favOnly)skins=skins.filter(s=>Boolean(s.favorite));
  const sort=$("cloudSort")?.value||"updated";
  skins.sort((a,b)=>{
    if(sort==="name")return String(a.name||"").localeCompare(String(b.name||""),undefined,{sensitivity:"base"});
    if(sort==="species")return String(a.species||"").localeCompare(String(b.species||""))||String(a.name||"").localeCompare(String(b.name||""));
    return (Number(Boolean(b.favorite))-Number(Boolean(a.favorite)))||(Number(b.updatedAt||0)-Number(a.updatedAt||0));
  });
  return skins;
}
function renderCloudMeta(){
  const s=selectedCloud(),tags=$("cloudTags"),vis=$("cloudVisibility");
  if(tags){tags.value=(s?.tags||[]).join(", ");tags.disabled=!s;}
  if(vis){vis.value=cleanVisibility(s?.visibility);vis.disabled=!s;}
  if($("saveCloudMeta"))$("saveCloudMeta").disabled=!s;
}
function renderCloudLibrary(){
  const sel=$("cloudSkins");if(!sel)return;const keep=sel.value;sel.innerHTML="";
  const all=[...(cloudLibrary.skins||[])],skins=cloudFilteredSkins();
  if(!skins.length){sel.append(new Option(me?(all.length?"No skins match these filters":"No Steam-linked skins yet"):"Sign in with Steam",""));}
  else{sel.append(new Option("Choose Steam skin…",""));skins.forEach(s=>sel.append(new Option(`${s.favorite?"★ ":""}${s.name} · ${s.species}${s.tags?.length?" · "+s.tags.slice(0,2).join("/"):""}`,s.id)));}
  if(skins.some(s=>s.id===keep))sel.value=keep;
  const chosen=all.find(s=>s.id===sel.value);$("favoriteCloud").textContent=chosen?.favorite?"★ Favourited":"☆ Favourite";
  $("loadLastApplied").disabled=!cloudLibrary.lastApplied?.skin;
  if($("cloudCount"))$("cloudCount").textContent=`Showing ${skins.length} of ${all.length} Steam skin${all.length===1?"":"s"}`;
  renderCloudMeta();
  renderPublishingSources();
}
function buildCloudFilters(){
  const sel=$("cloudSpeciesFilter");if(!sel)return;
  const keep=sel.value;sel.innerHTML="";sel.append(new Option("All species",""));
  SPECIES.forEach(s=>sel.append(new Option(s.name,s.slug)));
  if([...sel.options].some(o=>o.value===keep))sel.value=keep;
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
function loadCloudSkin(skin,id=""){if(!skin)return;activeCloudId=id||"";pushHistory();restore(skin);$("skinName").value=skin.name||`${selected.name} Skin`;renderCloudMeta();toast(id?"Steam skin loaded":"Last applied skin loaded");}
async function mutateCloud(action,payload,success){
  if(!me){toast("Sign in with Steam first");return false;}if(!bridgeOnline){toast("Primeval Refuge server bridge is offline");return false;}
  try{await cloudOp(action,payload);if(success)toast(success);await refreshCloudLibrary(true);return true;}catch(e){toast(e.message);return false;}
}
async function renameCloudSkin(){const s=selectedCloud();if(!s)return toast("Choose a Steam skin first");const name=prompt("Rename Steam skin",s.name);if(!name?.trim())return;await mutateCloud("rename",{id:s.id,name:name.trim()},"Cloud skin renamed");}
async function duplicateCloudSkin(){const s=selectedCloud();if(!s)return toast("Choose a Steam skin first");const newId=cloudUuid(),name=(s.name+" Copy").slice(0,48);if(await mutateCloud("duplicate",{id:s.id,newId,name},"Cloud skin duplicated")){activeCloudId=newId;$("cloudSkins").value=newId;}}
async function deleteCloudSkin(){const s=selectedCloud();if(!s)return toast("Choose a Steam skin first");if(!confirm(`Delete “${s.name}” from your Steam library?`))return;if(await mutateCloud("delete",{id:s.id},"Cloud skin deleted")&&activeCloudId===s.id)activeCloudId="";}
async function favoriteCloudSkin(){const s=selectedCloud();if(!s)return toast("Choose a Steam skin first");await mutateCloud("favorite",{id:s.id,favorite:!s.favorite},s.favorite?"Removed from favourites":"Added to favourites");}



function skinExportPayload(s){
  return{
    id:s.id||cloudUuid(),name:String(s.name||"Saved Skin"),species:s.species,patternIndex:Number(s.patternIndex)||0,
    skinVariation:Number(s.skinVariation)||0,themeIndex:0,previewSex:s.previewSex==="female"?"female":"male",
    colors:{...s.colors},favorite:Boolean(s.favorite),tags:cleanCloudTags(s.tags||[]),visibility:cleanVisibility(s.visibility),
    createdAt:Number(s.createdAt||0),updatedAt:Number(s.updatedAt||0)
  };
}
function downloadJson(filename,data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function safeFileName(v){return String(v||"skin").replace(/[^a-z0-9._-]+/gi,"_").replace(/^_+|_+$/g,"").slice(0,60)||"skin";}
function exportSelectedCloud(){
  const s=selectedCloud();if(!s)return toast("Choose a Steam skin first");
  downloadJson(`Primeval_Refuge_${safeFileName(s.name)}.json`,{format:"FOGGY_EVRIMA_SKIN",version:1,exportedAt:Date.now(),skin:skinExportPayload(s)});
  toast("Skin exported");
}
function exportCloudLibrary(){
  if(!me)return toast("Sign in with Steam first");
  const skins=(cloudLibrary.skins||[]).map(skinExportPayload);
  downloadJson("Primeval_Refuge_Evrima_Skin_Library.json",{format:"FOGGY_EVRIMA_SKIN_LIBRARY",version:1,exportedAt:Date.now(),skins});
  toast(`${skins.length} skin${skins.length===1?"":"s"} exported`);
}
function normalizeImportedSkin(raw){
  raw=raw&&typeof raw==="object"?raw:null;if(!raw)throw Error("Invalid skin entry");
  const species=String(raw.species||"").toLowerCase(),sp=SPECIES.find(s=>s.slug===species);if(!sp)throw Error(`Unknown species: ${species||"missing"}`);
  const name=String(raw.name||`${sp.name} Skin`).replace(/[\r\n\t]/g," ").replace(/\s+/g," ").trim().slice(0,48);if(!name)throw Error("Imported skin name is empty");
  const p=Number(raw.patternIndex),v=Number(raw.skinVariation);
  if(!Number.isInteger(p)||p<0||p>=sp.patterns)throw Error(`${name}: invalid pattern`);
  if(!Number.isInteger(v)||v<0||v>2)throw Error(`${name}: invalid variation`);
  const c={};for(const slot of SLOTS){const h=cleanHex(raw.colors?.[slot.key]);if(!h)throw Error(`${name}: invalid ${slot.label} colour`);c[slot.key]=h;}
  return{id:cloudUuid(),name,species,patternIndex:p,skinVariation:v,themeIndex:0,previewSex:raw.previewSex==="female"?"female":"male",colors:c,
    favorite:Boolean(raw.favorite),tags:cleanCloudTags(raw.tags||[]),visibility:cleanVisibility(raw.visibility)};
}
async function importCloudFile(file){
  if(!me)return toast("Sign in with Steam first");
  if(!bridgeOnline)return toast("Primeval Refuge server bridge is offline");
  if(!file)return;
  if(file.size>512*1024)return toast("Import file is too large");
  let parsed;try{parsed=JSON.parse(await file.text());}catch{return toast("Import file is not valid JSON");}
  let raw=[];
  if(Array.isArray(parsed))raw=parsed;
  else if(Array.isArray(parsed?.skins))raw=parsed.skins;
  else if(parsed?.skin)raw=[parsed.skin];
  else if(parsed?.species&&parsed?.colors)raw=[parsed];
  else return toast("No skins found in import file");
  if(!raw.length)return toast("Import file contains no skins");
  if(raw.length>50)return toast("Import supports up to 50 skins at once");
  let skins;try{skins=raw.map(normalizeImportedSkin);}catch(e){return toast(e.message);}
  try{
    setCloudStatus(`Importing ${skins.length} skin${skins.length===1?"":"s"}…`,"warn");
    const r=await cloudOp("import",{skins});
    await refreshCloudLibrary(true);
    const imported=Number(r.data?.imported||0),skipped=Number(r.data?.skipped||0);
    toast(`Imported ${imported}${skipped?` · skipped ${skipped} duplicate${skipped===1?"":"s"}`:""}`);
  }catch(e){toast(e.message);setCloudStatus(e.message,"bad");}
}
async function saveCloudMetadata(){
  const s=selectedCloud();if(!s)return toast("Choose a Steam skin first");
  const tags=cleanCloudTags($("cloudTags").value),visibility=cleanVisibility($("cloudVisibility").value);
  if(await mutateCloud("metadata",{id:s.id,tags,visibility},"Cloud metadata saved"))renderCloudMeta();
}



const APP_PAGES=new Set(["studio","library","community","publishing"]);
function currentPageFromUrl(){const q=new URLSearchParams(location.search),p=q.get("view");return APP_PAGES.has(p)?p:(q.get("published")?"community":"studio");}
function setAppPage(page,writeUrl=true){
  if(!APP_PAGES.has(page))page="studio";
  document.querySelectorAll("[data-app-page]").forEach(el=>el.classList.toggle("active",el.dataset.appPage===page));
  document.querySelectorAll(".app-tabs [data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  if(writeUrl){const u=new URL(location.href);u.searchParams.set("view",page);history.replaceState(null,"",u.pathname+u.search);}
  if(page==="studio")setTimeout(()=>window.dispatchEvent(new Event("resize")),20);
  if(page==="publishing"&&me)refreshPublishedMine(true);
  if(page==="community")refreshCommunity(true);
}
function cleanPublishDescription(v){return String(v||"").replace(/[\r\t]/g," ").replace(/\n{3,}/g,"\n\n").trim().slice(0,240);}
function selectedPublishSource(){return (cloudLibrary.skins||[]).find(s=>s.id===$("publishSource")?.value)||null;}
function selectedPublished(){return publishedMine.find(x=>x.id===$("publishedSkins")?.value)||null;}
function setPublishStatus(text,tone=""){const el=$("publishStatus");if(!el)return;el.textContent=text;el.className="section-sub "+(tone?"publishing-"+tone:"");}
function renderPublishingSources(){
  const sel=$("publishSource");if(!sel)return;const keep=sel.value;sel.innerHTML="";
  const skins=[...(cloudLibrary.skins||[])].sort((a,b)=>String(a.name||"").localeCompare(String(b.name||"")));
  if(!skins.length)sel.append(new Option(me?"No Steam skins yet":"Sign in with Steam",""));
  else{sel.append(new Option("Choose Steam skin…",""));skins.forEach(s=>sel.append(new Option(`${s.name} · ${s.species}`,s.id)));}
  if(skins.some(s=>s.id===keep))sel.value=keep;
  renderPublishSourceMeta(false);
}
function renderPublishSourceMeta(fill=false){
  const s=selectedPublishSource(),box=$("publishSourceMeta");if(!box)return;
  if(!s){box.textContent="Choose a Steam-library skin. Publishing copies its current design into a separate immutable snapshot.";return;}
  const tags=(s.tags||[]).join(", ")||"No tags";
  box.textContent=`${s.species} · Pattern ${Number(s.patternIndex||0)+1} · Variation ${["Small","Medium","Large"][Number(s.skinVariation)||0]}\nTags: ${tags}\nPrivate library ID remains hidden from public viewers.`;
  if(fill){$("publishTitle").value=s.name||"";$("publishVisibility").value=["public","unlisted"].includes(s.visibility)?s.visibility:"public";}
}
async function pollCommunity(id){
  for(let i=0;i<35;i++){await new Promise(r=>setTimeout(r,650));const d=await api("/api/library/status/"+encodeURIComponent(id));if(d.status==="completed")return d;if(d.status==="failed")throw Error(d.message||"Publishing operation failed");}
  throw Error("Publishing operation timed out. Refresh and check My Published Skins.");
}
async function communityOp(action,payload={}){const d=await api("/api/community/op",{method:"POST",body:JSON.stringify({action,...payload})});return pollCommunity(d.id);}
function renderPublishedMine(){
  const sel=$("publishedSkins");if(!sel)return;const keep=sel.value;sel.innerHTML="";
  const items=[...publishedMine].sort((a,b)=>Number(b.updatedAt||0)-Number(a.updatedAt||0));
  if(!items.length)sel.append(new Option("No published skins yet",""));
  else{sel.append(new Option("Choose published skin…",""));items.forEach(x=>sel.append(new Option(`${x.published?x.visibility==="public"?"● ":"◌ ":"○ "}${x.title} · v${x.snapshotVersion||1}`,x.id)));}
  if(items.some(x=>x.id===keep))sel.value=keep;
  $("publishedCount").textContent=`${items.filter(x=>x.published).length} active · ${items.length} total`;
  renderPublishedDetails(false);
}
function renderPublishedDetails(fill=false){
  const x=selectedPublished(),box=$("publishedDetails");if(!box)return;
  if(!x){box.textContent="Select a published entry to manage it.";return;}
  const state=x.published?`${x.visibility.toUpperCase()} · live snapshot`:`UNPUBLISHED`;
  box.textContent=`${state}\n${x.snapshot?.species||"unknown"} · Pattern ${Number(x.snapshot?.patternIndex||0)+1} · Snapshot v${x.snapshotVersion||1}\nLast updated ${new Date(Number(x.updatedAt||Date.now())).toLocaleString()}`;
  if(fill){$("publishTitle").value=x.title||"";$("publishDescription").value=x.description||"";$("publishVisibility").value=["public","unlisted"].includes(x.visibility)?x.visibility:"public";if(x.sourceSkinId&&[...$("publishSource").options].some(o=>o.value===x.sourceSkinId))$("publishSource").value=x.sourceSkinId;renderPublishSourceMeta(false);}
}
async function refreshPublishedMine(silent=true){
  if(!me){publishedMine=[];renderPublishedMine();setPublishStatus("Sign in with Steam to publish","");return false;}
  if(!bridgeOnline){setPublishStatus("Server bridge offline — published data is safely stored locally on the server","warn");return false;}
  try{const r=await communityOp("mine");publishedMine=Array.isArray(r.data?.items)?r.data.items:[];renderPublishedMine();setPublishStatus(`Publishing ready · ${publishedMine.filter(x=>x.published).length}/20 active`,"good");if(!silent)toast("Published skins refreshed");return true;}catch(e){setPublishStatus(e.message,"bad");if(!silent)toast(e.message);return false;}
}
async function publishSourceSkin(){
  const s=selectedPublishSource();if(!s)return toast("Choose a Steam-library skin first");
  const title=String($("publishTitle").value||s.name||"").trim().slice(0,48),description=cleanPublishDescription($("publishDescription").value),visibility=$("publishVisibility").value;
  if(!title)return toast("Published title is required");
  try{setPublishStatus("Publishing immutable snapshot…","warn");const r=await communityOp("publish",{sourceSkinId:s.id,title,description,visibility});await refreshCloudLibrary(true);await refreshPublishedMine(true);if(r.data?.item?.id){$("publishedSkins").value=r.data.item.id;renderPublishedDetails(true);}toast(r.data?.republished?"Skin republished":"Skin published");}catch(e){setPublishStatus(e.message,"bad");toast(e.message);}
}
async function updatePublishedSnapshot(){
  const x=selectedPublished();if(!x)return toast("Choose a published skin first");
  const title=String($("publishTitle").value||x.title||"").trim().slice(0,48),description=cleanPublishDescription($("publishDescription").value),visibility=$("publishVisibility").value;
  try{setPublishStatus("Updating published snapshot…","warn");await communityOp("update",{id:x.id,title,description,visibility});await refreshCloudLibrary(true);await refreshPublishedMine(true);$("publishedSkins").value=x.id;renderPublishedDetails(true);toast("Published snapshot updated");}catch(e){setPublishStatus(e.message,"bad");toast(e.message);}
}
async function unpublishSelected(){const x=selectedPublished();if(!x)return toast("Choose a published skin first");if(!confirm(`Unpublish “${x.title}”? Its public/unlisted link will stop working.`))return;try{await communityOp("unpublish",{id:x.id});await refreshCloudLibrary(true);await refreshPublishedMine(true);toast("Skin unpublished");}catch(e){toast(e.message);}}
async function deletePublishedSelected(){const x=selectedPublished();if(!x)return toast("Choose a published skin first");if(!confirm(`Delete published record “${x.title}”? This does not delete your Steam-library skin.`))return;try{await communityOp("delete",{id:x.id});await refreshCloudLibrary(true);await refreshPublishedMine(true);toast("Published record deleted");}catch(e){toast(e.message);}}
function publishedLink(id){const u=new URL(location.href);u.search="";u.searchParams.set("published",id);u.searchParams.set("view","community");u.hash="";return u.toString();}
async function copyPublishedShareLink(){const x=selectedPublished();if(!x||!x.published)return toast("Choose an active published skin first");const link=publishedLink(x.id);try{await navigator.clipboard.writeText(link);toast(x.visibility==="unlisted"?"Unlisted link copied":"Public link copied");}catch{prompt("Copy this link",link);}}
function previewCommunitySnapshot(item){if(!item?.snapshot)return;pushHistory();restore(item.snapshot);$("skinName").value=item.title||item.snapshot.name||"Published Skin";setAppPage("studio",true);toast("Published snapshot opened in Studio preview");}
function renderSharedPublication(item){
  sharedPublicationItem=item||null;
  const oldBox=$("sharedPublication"),newBox=$("sharedCommunity");
  if(oldBox){oldBox.hidden=!item;if(item){$("sharedPublicationTitle").textContent=item.title||"Shared skin";$("sharedPublicationDescription").textContent=item.description||"No description provided.";const tags=(item.snapshot?.tags||[]).join(", ")||"No tags";$("sharedPublicationMeta").textContent=`${item.snapshot?.species||"unknown"} · Pattern ${Number(item.snapshot?.patternIndex||0)+1} · ${item.visibility}\nTags: ${tags} · Snapshot v${item.snapshotVersion||1}`;}}
  if(newBox){newBox.hidden=!item;if(item){$("sharedCommunityTitle").textContent=item.title||"Shared skin";$("sharedCommunityDescription").textContent=item.description||"No description provided.";$("sharedCommunityVisibility").textContent=`${String(item.visibility||"public").toUpperCase()} · Snapshot v${item.snapshotVersion||1}`;const tags=(item.snapshot?.tags||[]).join(", ")||"No tags";$("sharedCommunityMeta").textContent=`${item.snapshot?.species||"unknown"} · Pattern ${Number(item.snapshot?.patternIndex||0)+1} · ${["Small","Medium","Large"][Number(item.snapshot?.skinVariation)||0]} variation\nTags: ${tags}`;}}
}
async function loadSharedPublicationFromUrl(){
  const q=new URLSearchParams(location.search),id=q.get("published");if(!id){renderSharedPublication(null);return;}
  try{const d=await api("/api/community/item/"+encodeURIComponent(id));renderSharedPublication(d.item);if(q.get("view")!=="publishing")setAppPage("community",false);}catch(e){renderSharedPublication(null);toast(e.message);}
}

function communitySpeciesName(slug){return SPECIES.find(s=>s.slug===slug)?.name||String(slug||"Unknown");}
function communityScore(x){return Number(x.saveCount||0)*3+Number(x.favoriteCount||0)*2;}
function buildCommunitySpecies(){const sel=$("communitySpecies");if(!sel)return;const keep=sel.value;sel.innerHTML="";sel.append(new Option("All species",""));SPECIES.forEach(s=>sel.append(new Option(s.name,s.slug)));if([...sel.options].some(o=>o.value===keep))sel.value=keep;}
function communityFiltered(){
  let items=[...communityPublic];const q=String($("communitySearch")?.value||"").trim().toLowerCase(),species=$("communitySpecies")?.value||"",fav=$("communityFavoritesOnly")?.classList.contains("active"),sort=$("communitySort")?.value||"new";
  if(q)items=items.filter(x=>[x.title,x.description,x.snapshot?.species,...(x.snapshot?.tags||[])].some(v=>String(v||"").toLowerCase().includes(q)));
  if(species)items=items.filter(x=>x.snapshot?.species===species);if(communityTagFilter)items=items.filter(x=>(x.snapshot?.tags||[]).some(t=>String(t).toLowerCase()===communityTagFilter));if(fav)items=items.filter(x=>communityFavorites.has(x.id));
  if(sort==="featured")items=items.filter(x=>Boolean(x.featured)).sort((a,b)=>communityScore(b)-communityScore(a)||Number(b.updatedAt||0)-Number(a.updatedAt||0));
  else if(sort==="popular")items.sort((a,b)=>communityScore(b)-communityScore(a)||Number(b.favoriteCount||0)-Number(a.favoriteCount||0)||Number(b.updatedAt||0)-Number(a.updatedAt||0));
  else if(sort==="updated")items.sort((a,b)=>Number(b.updatedAt||0)-Number(a.updatedAt||0));
  else items.sort((a,b)=>Number(b.publishedAt||0)-Number(a.publishedAt||0));
  return items;
}
function renderCommunityTags(){
  const host=$("communityTags");if(!host)return;const counts=new Map();communityPublic.forEach(x=>(x.snapshot?.tags||[]).forEach(t=>{const k=String(t||"").trim();if(k)counts.set(k,(counts.get(k)||0)+1)}));host.innerHTML="";
  [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,18).forEach(([tag,count])=>{const b=document.createElement("button");b.type="button";b.className="community-tag"+(communityTagFilter===tag.toLowerCase()?" active":"");b.textContent=`${tag} · ${count}`;b.onclick=()=>{communityTagFilter=communityTagFilter===tag.toLowerCase()?"":tag.toLowerCase();renderCommunity();};host.append(b);});
}
function communityPalette(snapshot){return SLOTS.map(s=>`<span style="background:${snapshot?.colors?.[s.key]||"#111111"}"></span>`).join("");}
function communityCard(x){
  const article=document.createElement("article");article.className="panel community-card";article.dataset.id=x.id;const fav=communityFavorites.has(x.id),tags=(x.snapshot?.tags||[]).slice(0,6),date=new Date(Number(x.publishedAt||x.updatedAt||Date.now())).toLocaleDateString();
  article.innerHTML=`<div class="community-card-head"><div><div class="community-species">${escapeHtml(communitySpeciesName(x.snapshot?.species))}</div><h3>${escapeHtml(x.title||"Community skin")}</h3></div>${x.featured?'<span class="community-featured-mark">FEATURED</span>':''}</div><div class="community-palette">${communityPalette(x.snapshot)}</div><p class="community-description">${escapeHtml(x.description||"No description provided.")}</p><div class="community-card-tags">${tags.map(t=>`<span>${escapeHtml(t)}</span>`).join("")}</div><div class="community-card-meta"><span>Pattern ${Number(x.snapshot?.patternIndex||0)+1} · ${["S","M","L"][Number(x.snapshot?.skinVariation)||0]}</span><span class="community-stats"><span>↓ ${Number(x.saveCount||0)}</span><span>★ ${Number(x.favoriteCount||0)}</span><span>${escapeHtml(date)}</span></span></div><div class="community-actions"><button data-action="preview">Preview</button><button class="community-apply primary" data-action="apply">Apply</button><button class="community-save" data-action="save">Save to Library</button><button class="${fav?'favourited':''}" data-action="favorite">${fav?'★ Favourited':'☆ Favourite'}</button><button data-action="link">Copy link</button></div>`;
  article.querySelector('[data-action="preview"]').onclick=()=>openCommunityInStudio(x,false);article.querySelector('[data-action="apply"]').onclick=()=>openCommunityInStudio(x,true);article.querySelector('[data-action="save"]').onclick=()=>saveCommunityToLibrary(x.id);article.querySelector('[data-action="favorite"]').onclick=()=>toggleCommunityFavorite(x.id,!fav);article.querySelector('[data-action="link"]').onclick=()=>copyCommunityLink(x.id);return article;
}
function renderCommunity(){
  const host=$("communityGrid");if(!host)return;const items=communityFiltered();host.innerHTML="";renderCommunityTags();const mode=$("communitySort")?.value||"new";$("communitySummary").textContent=`${items.length} of ${communityPublic.length} public skin${communityPublic.length===1?"":"s"}${mode==="featured"&&items.length===0?" · no featured skins yet":""}`;
  if(!items.length){const e=document.createElement("div");e.className="community-empty";e.textContent=mode==="featured"?"No featured community skins yet. Featured curation is prepared for the moderation pass.":"No community skins match these filters.";host.append(e);return;}items.forEach(x=>host.append(communityCard(x)));
}
async function refreshCommunity(silent=false){
  if(communityBusy)return;communityBusy=true;if(!silent)$("communitySummary").textContent="Refreshing community catalogue…";
  try{const d=await api("/api/community/public");communityPublic=Array.isArray(d.items)?d.items:[];renderCommunity();if(me&&bridgeOnline){communityOp("favorites").then(r=>{communityFavorites=new Set(Array.isArray(r.data?.ids)?r.data.ids:[]);renderCommunity();}).catch(()=>{});}if(!silent)toast("Community refreshed");}
  catch(e){$("communitySummary").textContent=e.message;renderCommunity();if(!silent)toast(e.message);}finally{communityBusy=false;}
}
function openCommunityInStudio(item,applyNow=false){if(!item?.snapshot)return;activeCloudId="";pushHistory();restore(item.snapshot);$("skinName").value=item.title||`${communitySpeciesName(item.snapshot.species)} Community Skin`;setAppPage("studio",true);toast(applyNow?"Community skin loaded · sending Apply":"Community skin opened in Studio");if(applyNow)setTimeout(()=>applySkin(),120);}
async function saveCommunityToLibrary(id){
  if(!me){location.href=API+"/auth/steam";return;}if(!bridgeOnline)return toast("Primeval Refuge server bridge is offline");
  try{const r=await communityOp("save",{id});if(r.data?.item)upsertCommunityLocal(r.data.item);await refreshCloudLibrary(true);renderCommunity();toast(r.data?.duplicate?"That design is already in My Library":"Community skin saved to My Library");}catch(e){toast(e.message);}
}
async function toggleCommunityFavorite(id,favorite){
  if(!me){location.href=API+"/auth/steam";return;}if(!bridgeOnline)return toast("Primeval Refuge server bridge is offline");
  try{const r=await communityOp("favorite",{id,favorite});favorite?communityFavorites.add(id):communityFavorites.delete(id);if(r.data?.item)upsertCommunityLocal(r.data.item);renderCommunity();toast(favorite?"Added to community favourites":"Removed from community favourites");}catch(e){toast(e.message);}
}
function upsertCommunityLocal(item){const i=communityPublic.findIndex(x=>x.id===item?.id);if(i>=0)communityPublic[i]={...communityPublic[i],...item};else if(item?.visibility==="public")communityPublic.push(item);}
async function copyCommunityLink(id){const link=publishedLink(id);try{await navigator.clipboard.writeText(link);toast("Community link copied");}catch{prompt("Copy this link",link);}}


const APPLY_STAGE_ORDER=["sending","queued","delivered","accepted","applied"];
function applyHistoryRead(){try{const d=JSON.parse(localStorage.getItem(APPLY_HISTORY_KEY)||"[]");return Array.isArray(d)?d:[]}catch{return[]}}
function applyHistoryWrite(items){localStorage.setItem(APPLY_HISTORY_KEY,JSON.stringify(items.slice(0,12)))}
function mergeApplyHistory(item){
  if(!item?.id)return;
  const items=applyHistoryRead(),i=items.findIndex(x=>x.id===item.id);
  const next={...(i>=0?items[i]:{}),...item,updatedAt:Date.now()};
  if(i>=0)items.splice(i,1);items.unshift(next);applyHistoryWrite(items);renderApplyHistory();
}
function fmtApplyTime(ms){if(!ms)return"";try{return new Date(ms).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}catch{return""}}
function stageRank(status,d){
  if(status==="sending")return 0;
  if(status==="queued")return 1;
  if(status==="delivered")return 2;
  if(status==="accepted")return 3;
  if(status==="applied")return 4;
  const t=d?.timeline||{};
  if(t.acceptedAt)return 3;if(t.deliveredAt)return 2;if(t.queuedAt||d?.createdAt)return 1;return 0;
}
function applyStageNote(d){
  if(!d)return"No Apply request yet.";
  const s=d.status;
  if(s==="sending")return"Sending the skin to Railway…";
  if(s==="queued")return d.bridgeOnline===false?"Railway received it, but the Primeval Refuge bridge is offline or restarting.":"Railway received the request. Waiting for the Primeval Refuge bridge.";
  if(s==="delivered")return"Primeval Refuge bridge received the request and is handing it to the server-side skin worker.";
  if(s==="accepted")return d.bridgeOnline===false?"The request reached the server, but the bridge is now offline or restarting. Waiting for final UE4SS confirmation.":"UE4SS handoff confirmed. Waiting for your live dinosaur to be found and the skin operation to finish.";
  if(s==="applied")return d.message||"Skin applied successfully.";
  if(s==="failed")return d.message||"The server-side skin operation failed.";
  if(s==="superseded")return d.message||"A newer Apply request replaced this one.";
  return d.message||"Waiting for status…";
}
function renderApplyStatus(d){
  if(!d)return;
  activeApplyData=d;
  const panel=$("applyLive");panel.classList.add("show");
  const terminal=d.status==="failed"||d.status==="superseded";
  const rank=stageRank(d.status,d);
  document.querySelectorAll("#applySteps .apply-step").forEach((el,i)=>{
    el.classList.remove("done","active","failed");
    if(terminal&&i===rank)el.classList.add("failed");
    else if(i<rank||(d.status==="applied"&&i<=rank))el.classList.add("done");
    else if(i===rank&&d.status!=="applied")el.classList.add("active");
  });
  $("applyLiveTitle").textContent=d.status==="applied"?"Apply complete":d.status==="failed"?"Apply failed":d.status==="superseded"?"Apply superseded":"Live Apply status";
  $("applyLiveTime").textContent=fmtApplyTime(d.completedAt||d.updatedAt||d.createdAt);
  $("applyLiveNote").textContent=applyStageNote(d);
  mergeApplyHistory({
    id:d.id||activeApplyId,species:d.species||selected.slug,patternIndex:Number(d.patternIndex??patternIndex),
    status:d.status,message:d.message||"",createdAt:d.createdAt||Date.now(),completedAt:d.completedAt||0,
    bridgeOnline:d.bridgeOnline
  });
}
function renderApplyHistory(){
  const box=$("applyHistoryList");if(!box)return;
  const items=applyHistoryRead().slice(0,8);box.innerHTML="";
  if(!items.length){
    const empty=document.createElement("div");empty.className="apply-history-meta";empty.textContent="No Apply requests recorded in this browser yet.";box.appendChild(empty);return;
  }
  for(const item of items){
    const row=document.createElement("div");row.className="apply-history-item";
    const main=document.createElement("div");main.className="apply-history-main";
    const title=document.createElement("span");title.className="apply-history-title";
    const sp=SPECIES.find(s=>s.slug===item.species);title.textContent=`${sp?.name||item.species||"Dinosaur"} · Pattern ${Number(item.patternIndex||0)+1}`;
    const meta=document.createElement("span");meta.className="apply-history-meta";
    meta.textContent=`${fmtApplyTime(item.createdAt)}${item.message?" · "+item.message:""}`;
    main.append(title,meta);
    const badge=document.createElement("span");badge.className="apply-history-badge "+(item.status==="applied"?"ok":item.status==="failed"||item.status==="superseded"?"err":"wait");
    badge.textContent=String(item.status||"pending").replace(/^./,c=>c.toUpperCase());
    row.append(main,badge);box.appendChild(row);
  }
}
async function refreshApplyHistory(silent=true){
  renderApplyHistory();
  if(!me||!API_READY)return;
  try{
    const d=await api("/api/skins/recent");
    for(const r of [...(d.requests||[])].reverse())mergeApplyHistory(r);
    if(!silent)toast("Apply history refreshed");
  }catch(e){if(!silent)toast(e.message);}
}

function readAuthHash(){
  const h=new URLSearchParams(location.hash.replace(/^#/,"")),t=h.get("session"),discord=h.get("discord"),auth=h.get("auth");
  if(t){session=t;localStorage.setItem("foggy_skin_session",t);}
  if(discord==="linked")toast("Discord linked to this Steam account");
  else if(discord==="conflict")toast("Discord or Steam is already linked to another account");
  else if(discord==="expired")toast("Discord link expired. Run /link again in Discord");
  else if(discord==="failed")toast("Steam verification failed");
  else if(auth==="failed")toast("Steam sign-in failed");
  if(t||discord||auth)history.replaceState(null,"",location.pathname+location.search);
}
async function refreshMe(){
  if(!API_READY){$("apiStatus").textContent="API not configured";$("apiStatus").className="status warn";setCloudStatus("Cloud library unavailable","bad");return;}
  try{await api("/health");$("apiStatus").textContent="Skin API online";$("apiStatus").className="status good";}
  catch{$("apiStatus").textContent="Skin API unreachable";$("apiStatus").className="status bad";}
  if(!session){me=null;cloudLibrary={skins:[],lastApplied:null};activeCloudId="";publishedMine=[];renderCloudLibrary();renderPublishedMine();setCloudStatus("Sign in with Steam to sync saved skins","");setPublishStatus("Sign in with Steam to publish","");$("accountTitle").textContent="Steam not linked";$("accountDetail").textContent="Sign in once. No client files or commands required.";$("steamButton").textContent="Sign in with Steam";return;}
  try{me=await api("/api/me");$("accountTitle").textContent=me.discord?"Steam + Discord linked":"Steam linked";const discordLabel=me.discord?(me.discord.displayName||me.discord.username||me.discord.id):"Not linked";$("accountDetail").textContent="SteamID64 "+me.steam+" • Discord: "+discordLabel;$("steamButton").textContent="Sign out";loadCachedCloudLibrary();refreshCloudLibrary(true);refreshApplyHistory(true);refreshPublishedMine(true);}
  catch{session="";localStorage.removeItem("foggy_skin_session");me=null;refreshMe();}
}
let statusRefreshBusy=false;
async function refreshServerStatus(){
  if(!API_READY||statusRefreshBusy)return;
  statusRefreshBusy=true;
  try{
    const d=await api("/api/public/status");
    const was=bridgeOnline;bridgeOnline=Boolean(d.online);
    $("serverStatus").textContent=bridgeOnline?"Primeval Refuge bridge online":"Primeval Refuge bridge offline";
    $("serverStatus").className=bridgeOnline?"status good":"status bad";
    if(bridgeOnline&&!was&&me){flushCloudQueue().then(()=>refreshCloudLibrary(true));refreshPublishedMine(true);}
  }catch{
    bridgeOnline=false;$("serverStatus").textContent="Bridge status unavailable";
    $("serverStatus").className="status warn";
  }finally{
    statusRefreshBusy=false;
  }
}
function setApplyBusy(on){applyBusy=Boolean(on);const b=$("apply");if(b)b.disabled=applyBusy;}
async function pollApply(id){
  const token=++applyPollToken,o=$("result");setApplyBusy(true);
  try{
    for(let i=0;i<125&&token===applyPollToken;i++){
      await new Promise(r=>setTimeout(r,1000));
      try{
        const d=await api("/api/skins/status/"+encodeURIComponent(id));
        renderApplyStatus(d);
        if(d.status==="applied"){
          o.textContent=d.message||"Skin applied.";o.className="result show ok";
          setTimeout(()=>refreshCloudLibrary(true),1500);refreshApplyHistory(true);return;
        }
        if(d.status==="failed"||d.status==="superseded"){
          o.textContent=d.message||(d.status==="superseded"?"A newer Apply request replaced this one.":"Skin apply failed.");
          o.className="result show err";refreshApplyHistory(true);return;
        }
        o.textContent=applyStageNote(d);o.className="result show";
      }catch(e){
        if(i>8){o.textContent="Status check interrupted. The server still owns this request; waiting for confirmation…";o.className="result show";}
      }
    }
    if(token!==applyPollToken)return;
    o.textContent="No final confirmation arrived before the safety window ended. Refresh Recent Apply requests before retrying.";
    o.className="result show";refreshApplyHistory(true);
  }finally{if(token===applyPollToken)setApplyBusy(false);}
}
async function applySkin(){
  const o=$("result");
  if(applyBusy){toast("An Apply request is already in progress");return;}
  if(!API_READY){o.textContent="Railway backend is not connected.";o.className="result show err";return;}
  if(!me){location.href=API+"/auth/steam";return;}
  if(!bridgeOnline){o.textContent="Primeval Refuge server bridge is offline or the server is restarting.";o.className="result show err";return;}
  setApplyBusy(true);
  const clientNonce=cloudUuid(),localId="sending-"+Date.now();activeApplyId=localId;
  renderApplyStatus({id:localId,status:"sending",species:selected.slug,patternIndex,createdAt:Date.now(),bridgeOnline});
  o.textContent="Sending skin to Railway…";o.className="result show";
  const body=JSON.stringify({clientNonce,species:selected.slug,patternIndex,skinVariation,themeIndex:0,colors});
  try{
    let d;
    try{d=await api("/api/skins/apply",{method:"POST",body});}
    catch(e){
      if(e.message==="Skin API timed out"){await new Promise(r=>setTimeout(r,700));d=await api("/api/skins/apply",{method:"POST",body});}
      else throw e;
    }
    activeApplyId=d.id;
    const first={...d,id:d.id,status:d.status||"queued",species:d.species||selected.slug,patternIndex:Number(d.patternIndex??patternIndex),createdAt:d.createdAt||Date.now(),bridgeOnline:true};
    renderApplyStatus(first);
    o.textContent=d.deduplicated?"Recovered the existing Apply request. Waiting for the server…":"Railway received the skin request. Waiting for the Primeval Refuge bridge…";
    pollApply(d.id);
  }catch(e){
    if(e.status===409&&e.data?.active?.id){
      const d=e.data.active;activeApplyId=d.id;renderApplyStatus(d);
      o.textContent="Your previous Apply request is still in progress. Resuming its status instead of creating a duplicate.";o.className="result show";
      pollApply(d.id);return;
    }
    renderApplyStatus({id:localId,status:"failed",species:selected.slug,patternIndex,createdAt:Date.now(),completedAt:Date.now(),message:e.message,bridgeOnline});
    o.textContent=e.message;o.className="result show err";setApplyBusy(false);
  }
}


buildSpecies();buildColors();buildPresets();buildCloudFilters();buildCommunitySpecies();refreshSaved();renderCloudLibrary();renderPublishedMine();renderApplyHistory();readAuthHash();renderAll();setAppPage(currentPageFromUrl(),false);refreshMe();refreshServerStatus();loadSharedPublicationFromUrl();refreshCommunity(true);
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
$("cloudSearch").addEventListener("input",renderCloudLibrary);
$("cloudSpeciesFilter").onchange=renderCloudLibrary;
$("cloudSort").onchange=renderCloudLibrary;
$("cloudFavoritesOnly").onclick=()=>{$("cloudFavoritesOnly").classList.toggle("active");$("cloudFavoritesOnly").textContent=$("cloudFavoritesOnly").classList.contains("active")?"★ Favourites only":"☆ Favourites only";renderCloudLibrary();};
$("clearCloudFilters").onclick=()=>{$("cloudSearch").value="";$("cloudSpeciesFilter").value="";$("cloudSort").value="updated";$("cloudFavoritesOnly").classList.remove("active");$("cloudFavoritesOnly").textContent="☆ Favourites only";renderCloudLibrary();};
$("saveCloudMeta").onclick=saveCloudMetadata;
$("exportCloud").onclick=exportSelectedCloud;
$("exportCloudAll").onclick=exportCloudLibrary;
$("importCloud").onclick=()=>$("cloudImportFile").click();
$("cloudImportFile").onchange=async e=>{const f=e.target.files?.[0];e.target.value="";if(f)await importCloudFile(f);};
document.querySelectorAll(".app-tabs [data-page]").forEach(b=>b.onclick=()=>setAppPage(b.dataset.page,true));
$("communitySearch").addEventListener("input",renderCommunity);$("communitySpecies").onchange=renderCommunity;$("communitySort").onchange=renderCommunity;$("refreshCommunity").onclick=()=>refreshCommunity(false);
$("communityFavoritesOnly").onclick=()=>{$("communityFavoritesOnly").classList.toggle("active");$("communityFavoritesOnly").textContent=$("communityFavoritesOnly").classList.contains("active")?"★ My favourites":"☆ My favourites";renderCommunity();};
$("communityClear").onclick=()=>{$("communitySearch").value="";$("communitySpecies").value="";$("communitySort").value="new";$("communityFavoritesOnly").classList.remove("active");$("communityFavoritesOnly").textContent="☆ My favourites";communityTagFilter="";renderCommunity();};
$("sharedCommunityPreview").onclick=()=>sharedPublicationItem&&openCommunityInStudio(sharedPublicationItem,false);$("sharedCommunityApply").onclick=()=>sharedPublicationItem&&openCommunityInStudio(sharedPublicationItem,true);$("sharedCommunitySave").onclick=()=>sharedPublicationItem&&saveCommunityToLibrary(sharedPublicationItem.id);
$("publishSource").onchange=()=>renderPublishSourceMeta(true);
$("publishedSkins").onchange=()=>renderPublishedDetails(true);
$("refreshPublished").onclick=()=>refreshPublishedMine(false);
$("publishNew").onclick=publishSourceSkin;
$("updatePublished").onclick=updatePublishedSnapshot;
$("unpublishSkin").onclick=unpublishSelected;
$("deletePublished").onclick=deletePublishedSelected;
$("copyPublishedLink").onclick=copyPublishedShareLink;
$("previewPublished").onclick=()=>{const x=selectedPublished();if(x)previewCommunitySnapshot(x);else toast("Choose a published skin first");};
$("previewSharedPublication").onclick=()=>previewCommunitySnapshot(sharedPublicationItem);
$("copyCode").onclick=async()=>{try{await navigator.clipboard.writeText(shareCode());toast("Share code copied");}catch{prompt("Copy this code",shareCode());}};
$("importCode").onclick=()=>importCode($("shareCode").value);
$("undo").onclick=()=>{if(!history.length)return;future.push(snapshot());restore(history.pop());};
$("redo").onclick=()=>{if(!future.length)return;history.push(snapshot());restore(future.pop());};
$("apply").onclick=applySkin;
$("refreshApplyHistory").onclick=()=>refreshApplyHistory(false);
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

