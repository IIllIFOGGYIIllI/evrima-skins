const CFG=window.FOGGY_SKIN_CONFIG||{};
const API=String(CFG.API_BASE||"").replace(/\/$/,"");
const API_READY=API.startsWith("https://")&&!API.includes("YOUR-RAILWAY");
const SPECIES=[{"name":"Tyrannosaurus","slug":"tyrannosaurus","category":"Apex Carnivore","patterns":3,"image":"https://theisle.ru/assets/species/tyrannosaurus.webp"},{"name":"Allosaurus","slug":"allosaurus","category":"Apex Carnivore","patterns":3,"image":"https://theisle.ru/assets/species/allosaurus.webp"},{"name":"Austroraptor","slug":"austroraptor","category":"Carnivore","patterns":3,"image":"https://theisle.ru/assets/species/austroraptor.webp"},{"name":"Carnotaurus","slug":"carnotaurus","category":"Carnivore","patterns":4,"image":"https://theisle.ru/assets/species/carnotaurus.webp"},{"name":"Ceratosaurus","slug":"ceratosaurus","category":"Carnivore","patterns":3,"image":"https://theisle.ru/assets/species/ceratosaurus.webp"},{"name":"Deinosuchus","slug":"deinosuchus","category":"Aquatic Apex","patterns":3,"image":"https://theisle.ru/assets/species/deinosuchus.webp"},{"name":"Dilophosaurus","slug":"dilophosaurus","category":"Carnivore","patterns":3,"image":"https://theisle.ru/assets/species/dilophosaurus.webp"},{"name":"Herrerasaurus","slug":"herrerasaurus","category":"Carnivore","patterns":3,"image":"https://theisle.ru/assets/species/herrerasaurus.webp"},{"name":"Omniraptor","slug":"omniraptor","category":"Carnivore","patterns":5,"image":"https://theisle.ru/assets/species/omniraptor.webp"},{"name":"Pteranodon","slug":"pteranodon","category":"Flyer","patterns":3,"image":"https://theisle.ru/assets/species/pteranodon.webp"},{"name":"Troodon","slug":"troodon","category":"Carnivore","patterns":3,"image":"https://theisle.ru/assets/species/troodon.webp"},{"name":"Triceratops","slug":"triceratops","category":"Large Herbivore","patterns":3,"image":"https://theisle.ru/assets/species/triceratops.webp"},{"name":"Stegosaurus","slug":"stegosaurus","category":"Large Herbivore","patterns":3,"image":"https://theisle.ru/assets/species/stegosaurus.webp"},{"name":"Diabloceratops","slug":"diabloceratops","category":"Herbivore","patterns":3,"image":"https://theisle.ru/assets/species/diabloceratops.webp"},{"name":"Kentrosaurus","slug":"kentrosaurus","category":"Herbivore","patterns":3,"image":"https://theisle.ru/assets/species/kentrosaurus.webp"},{"name":"Tenontosaurus","slug":"tenontosaurus","category":"Herbivore","patterns":3,"image":"https://theisle.ru/assets/species/tenontosaurus.webp"},{"name":"Maiasaura","slug":"maiasaura","category":"Herbivore","patterns":3,"image":"https://theisle.ru/assets/species/maiasaura.webp"},{"name":"Pachycephalosaurus","slug":"pachycephalosaurus","category":"Herbivore","patterns":4,"image":"https://theisle.ru/assets/species/pachycephalosaurus.webp"},{"name":"Dryosaurus","slug":"dryosaurus","category":"Herbivore","patterns":3,"image":"https://theisle.ru/assets/species/dryosaurus.webp"},{"name":"Hypsilophodon","slug":"hypsilophodon","category":"Herbivore","patterns":3,"image":"https://theisle.ru/assets/species/hypsilophodon.webp"},{"name":"Gallimimus","slug":"gallimimus","category":"Omnivore","patterns":3,"image":"https://theisle.ru/assets/species/gallimimus.webp"},{"name":"Beipiaosaurus","slug":"beipiaosaurus","category":"Omnivore","patterns":3,"image":"https://theisle.ru/assets/species/beipiaosaurus.webp"}];
const PRESETS={"swamp":{"body":"#1C2914","markings":"#2E401A","flank":"#38471F","underbelly":"#575C33","detail":"#141C0F","eyes":"#E68514","breed":"#4A5C21","teeth":"#ADA37A","mouth":"#401414","claws":"#1A1712"},"melanistic":{"body":"#060608","markings":"#141417","flank":"#0B0B0E","underbelly":"#17171A","detail":"#040405","eyes":"#C7700D","breed":"#1F1F24","teeth":"#B8AD8C","mouth":"#330D0F","claws":"#080809"},"albino":{"body":"#DBD1C7","markings":"#F5E8E0","flank":"#E6DBD4","underbelly":"#FAF0E6","detail":"#C2B0AB","eyes":"#EB2E38","breed":"#DBB8BD","teeth":"#F2E6BF","mouth":"#852E3B","claws":"#BAA8A0"},"bloodmoon":{"body":"#140606","markings":"#750405","flank":"#330608","underbelly":"#1A0909","detail":"#9E090B","eyes":"#F21408","breed":"#590508","teeth":"#B39473","mouth":"#610406","claws":"#140505"},"frost":{"body":"#8CADB8","markings":"#D1E8F0","flank":"#5C8599","underbelly":"#E0EBE8","detail":"#386680","eyes":"#26C7F2","breed":"#7AB3CC","teeth":"#E0E6D1","mouth":"#42242E","claws":"#576B70"},"jungle":{"body":"#1F381A","markings":"#80660F","flank":"#335721","underbelly":"#7A6E33","detail":"#0F210D","eyes":"#F0B00A","breed":"#668A1A","teeth":"#BDB080","mouth":"#4D1414","claws":"#17140D"}};
const CORE=[
{key:"body",label:"Body",desc:"Main body / base colour"},
{key:"markings",label:"Markings",desc:"Pattern / markings colour"},
{key:"flank",label:"Flank",desc:"Sides / flank colour"},
{key:"underbelly",label:"Underbelly",desc:"Belly and throat colour"},
{key:"detail",label:"Detail",desc:"Crest / accent colour"},
{key:"breed",label:"Display / Breed",desc:"Male display region"}];
const DETAIL=[
{key:"eyes",label:"Eyes",desc:"Eye colour"},
{key:"teeth",label:"Teeth",desc:"Teeth material colour"},
{key:"mouth",label:"Mouth",desc:"Mouth interior colour"},
{key:"claws",label:"Claws",desc:"Claw material colour"}];
const SLOTS=[...CORE,...DETAIL];
const DEFAULTS={body:"#6D706B",markings:"#343A35",flank:"#7C8179",underbelly:"#A5A49A",detail:"#49504A",eyes:"#D59B36",breed:"#687A5A",teeth:"#D8CFAC",mouth:"#6B3037",claws:"#333333"};

let state={...DEFAULTS},selected=SPECIES[0],patternIndex=0,skinVariation=1,themeIndex=0,previewMale=true;
let session=localStorage.getItem("foggy_skin_session")||"",me=null;
let history=[],future=[],historyLock=false;
const $=id=>document.getElementById(id);

function toast(m){const t=$("toast");t.textContent=m;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),1600)}
function clean(v){v=String(v||"").trim().replace(/^#/,"").toUpperCase();return /^[0-9A-F]{6}$/.test(v)?"#"+v:null}
function rgb(h){h=clean(h)||"#000000";return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]}
function hx(r,g,b){const q=n=>Math.max(0,Math.min(255,Math.round(n))).toString(16).padStart(2,"0").toUpperCase();return"#"+q(r)+q(g)+q(b)}
function hsl(h,s,l){s/=100;l/=100;const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let r=0,g=0,b=0;if(h<60)[r,g,b]=[c,x,0];else if(h<120)[r,g,b]=[x,c,0];else if(h<180)[r,g,b]=[0,c,x];else if(h<240)[r,g,b]=[0,x,c];else if(h<300)[r,g,b]=[x,0,c];else[r,g,b]=[c,0,x];return hx((r+m)*255,(g+m)*255,(b+m)*255)}
function snapshot(){return{state:{...state},species:selected.slug,patternIndex,skinVariation,themeIndex,previewMale}}
function pushHistory(){if(historyLock)return;history.push(snapshot());if(history.length>40)history.shift();future=[]}
function restore(s){if(!s)return;historyLock=true;state={...DEFAULTS,...s.state};selected=SPECIES.find(x=>x.slug===s.species)||selected;patternIndex=Math.min(Number(s.patternIndex)||0,selected.patterns-1);skinVariation=Number(s.skinVariation)||0;themeIndex=Number(s.themeIndex)||0;previewMale=s.previewMale!==false;$("species").value=selected.slug;$("variation").value=skinVariation;$("theme").value=themeIndex;renderAll();historyLock=false}
function shareCode(){return`FGY2:${selected.slug}:${patternIndex}:${skinVariation}:${themeIndex}:`+SLOTS.map(s=>state[s.key].slice(1)).join("-")}
function renderPalette(){$("palette").innerHTML="";SLOTS.forEach(s=>{const d=document.createElement("div");d.className="chip";d.style.background=state[s.key];d.title=`${s.label} ${state[s.key]}`;$("palette").appendChild(d)});$("shareCode").value=shareCode()}
function setOverlay(id,color){const e=$(id);e.style.backgroundColor=color;e.style.color=color}
function renderPreview(){
  $("previewTitle").textContent=selected.name;$("category").textContent=selected.category;
  const img=$("dinoRender");img.src=selected.image;img.alt=selected.name+" Evrima render";
  const strength=Number($("previewStrength").value)/100;
  document.querySelectorAll(".skin-overlay").forEach(e=>e.style.opacity=String(strength));
  setOverlay("overlayBody",state.body);setOverlay("overlayFlank",state.flank);setOverlay("overlayBelly",state.underbelly);
  setOverlay("overlayMarkings",state.markings);setOverlay("overlayDetail",state.detail);setOverlay("overlayBreed",state.breed);
  $("overlayBreed").style.opacity=previewMale?String(strength):"0";
  $("overlayMarkings").className=`skin-overlay ov-markings pattern-${patternIndex}`;
  const scale=[1.25,1,.75][skinVariation]||1;
  $("overlayMarkings").style.backgroundSize=`${90*scale}px ${75*scale}px`;
  const light=Number($("lighting").value)/100, zoom=Number($("previewZoom").value)/100;
  img.style.filter=`brightness(${light}) saturate(${themeIndex===1?1.18:1}) contrast(${themeIndex===1?1.06:1})`;
  img.style.transform=`scale(${zoom})`;
  renderPalette();
}
function renderPatternButtons(){
  const box=$("patternButtons");box.innerHTML="";
  for(let i=0;i<selected.patterns;i++){const b=document.createElement("button");b.textContent=String(i+1);b.className=i===patternIndex?"active":"";b.onclick=()=>{pushHistory();patternIndex=i;renderPatternButtons();renderPreview()};box.appendChild(b)}
}
function renderColors(){
  SLOTS.forEach(s=>{const p=$("pick-"+s.key),h=$("hex-"+s.key),r=$("rgb-"+s.key);if(p)p.value=state[s.key];if(h)h.value=state[s.key];if(r){const a=rgb(state[s.key]);r.textContent=`RGB ${a[0]}, ${a[1]}, ${a[2]}`}});
}
function renderAll(){renderColors();renderPatternButtons();renderPreview();$("malePreview").classList.toggle("active",previewMale);$("femalePreview").classList.toggle("active",!previewMale)}
function buildSpecies(){
  const groups={};SPECIES.forEach(s=>(groups[s.category]||=[]).push(s));Object.entries(groups).forEach(([cat,list])=>{const g=document.createElement("optgroup");g.label=cat;list.forEach(s=>g.append(new Option(s.name,s.slug)));$("species").append(g)});$("species").value=selected.slug;
}
function buildColorGroup(items,target){
  items.forEach(s=>{const d=document.createElement("div");d.className="color-card";d.innerHTML=`<div class="color-head"><div><div class="color-name">${s.label}</div><div class="color-desc">${s.desc}</div></div></div><div class="picker"><input id="pick-${s.key}" type="color"><input id="hex-${s.key}" class="hex" type="text" maxlength="7"></div><div id="rgb-${s.key}" class="rgb"></div>`;$(target).appendChild(d);
    const p=d.querySelector("input[type=color]"),h=d.querySelector(".hex");
    p.onchange=e=>{pushHistory();state[s.key]=e.target.value.toUpperCase();renderAll()};
    p.oninput=e=>{state[s.key]=e.target.value.toUpperCase();renderAll()};
    h.onchange=e=>{const v=clean(e.target.value);if(v){pushHistory();state[s.key]=v;renderAll()}else{e.target.value=state[s.key];toast("Invalid HEX colour")}};
  });
}
function buildPresets(){Object.entries(PRESETS).forEach(([n,v])=>{const b=document.createElement("button");b.textContent=n[0].toUpperCase()+n.slice(1);b.onclick=()=>{pushHistory();state={...state,...v};renderAll();toast("Preset: "+n)};$("presets").appendChild(b)})}
function natural(){pushHistory();const h=Math.floor(Math.random()*360);state={body:hsl(h,28,31),markings:hsl((h+18)%360,38,18),flank:hsl((h+5)%360,28,38),underbelly:hsl((h+20)%360,18,58),detail:hsl((h+340)%360,34,24),eyes:hsl(Math.floor(Math.random()*360),68,52),breed:hsl((h+30)%360,38,41),teeth:hsl(42,24,76),mouth:hsl(350,42,25),claws:hsl((h+10)%360,10,16)};renderAll()}
function vivid(){pushHistory();const h=Math.floor(Math.random()*360);state={body:hsl(h,75,45),markings:hsl((h+55)%360,88,48),flank:hsl((h+330)%360,70,38),underbelly:hsl((h+30)%360,55,68),detail:hsl((h+180)%360,90,50),eyes:hsl(Math.floor(Math.random()*360),100,58),breed:hsl((h+90)%360,84,46),teeth:hsl(48,45,82),mouth:hsl(345,70,34),claws:hsl((h+210)%360,48,22)};renderAll()}
function db(){try{return JSON.parse(localStorage.getItem("foggy_skin_presets_v50")||"{}")}catch{return{}}}
function refreshSaved(){const d=db(),s=$("saved");s.innerHTML="";const names=Object.keys(d).sort();if(!names.length){s.append(new Option("No saved skins yet",""));return}s.append(new Option("Choose saved skin…",""));names.forEach(n=>s.append(new Option(n,n)))}
function saveSkin(){const n=$("skinName").value.trim()||`${selected.name} Skin`,d=db();d[n]=snapshot();localStorage.setItem("foggy_skin_presets_v50",JSON.stringify(d));refreshSaved();$("saved").value=n;$("skinName").value=n;toast("Skin saved")}
function loadSkin(){const n=$("saved").value,d=db()[n];if(!d)return;pushHistory();restore(d);$("skinName").value=n;toast("Skin loaded")}
function importCode(raw){const m=String(raw||"").match(/^FGY2:([a-z]+):(\d+):(\d+):(\d+):([0-9A-Fa-f]{6}(?:-[0-9A-Fa-f]{6}){9})$/);if(!m){toast("Invalid FGY2 code");return}const sp=SPECIES.find(s=>s.slug===m[1]);if(!sp){toast("Unknown species");return}pushHistory();selected=sp;patternIndex=Math.min(Number(m[2]),sp.patterns-1);skinVariation=Math.min(2,Number(m[3]));themeIndex=Math.min(1,Number(m[4]));const parts=m[5].split("-");SLOTS.forEach((s,i)=>state[s.key]="#"+parts[i].toUpperCase());$("species").value=sp.slug;$("variation").value=skinVariation;$("theme").value=themeIndex;renderAll();toast("Skin code imported")}
async function api(path,opt={}){if(!API_READY)throw Error("Skin API is not configured yet");const headers={...(opt.headers||{})};if(session)headers.Authorization="Bearer "+session;if(opt.body)headers["Content-Type"]="application/json";const r=await fetch(API+path,{...opt,headers});let d={};try{d=await r.json()}catch{}if(!r.ok)throw Error(d.error||`Request failed (${r.status})`);return d}
function readHash(){const h=new URLSearchParams(location.hash.replace(/^#/,"")),t=h.get("session");if(t){session=t;localStorage.setItem("foggy_skin_session",t);history.replaceState(null,"",location.pathname+location.search)}}
async function refreshMe(){if(!API_READY){$("apiStatus").textContent="API not configured";$("apiStatus").className="pill warn";return}try{await api("/health");$("apiStatus").textContent="Skin API online";$("apiStatus").className="pill good"}catch{$("apiStatus").textContent="Skin API unreachable";$("apiStatus").className="pill bad"}if(!session){me=null;$("accountTitle").textContent="Steam not linked";$("accountDetail").textContent="Sign in once. No client download required.";$("steam").textContent="Sign in with Steam";return}try{me=await api("/api/me");$("accountTitle").textContent="Steam linked";$("accountDetail").textContent="SteamID64 "+me.steam;$("steam").textContent="Sign out"}catch{session="";localStorage.removeItem("foggy_skin_session");me=null;refreshMe()}}
async function refreshStatus(){if(!API_READY)return;try{const d=await api("/api/public/status");$("serverStatus").textContent=d.online?"FOGGY server bridge online":"FOGGY server bridge offline";$("serverStatus").className=d.online?"pill good":"pill bad"}catch{$("serverStatus").textContent="Server status unavailable";$("serverStatus").className="pill warn"}}
async function poll(id){const o=$("result");for(let i=0;i<24;i++){await new Promise(r=>setTimeout(r,1000));try{const d=await api("/api/skins/status/"+encodeURIComponent(id));if(d.status==="applied"){o.textContent=d.message||"Skin applied.";o.className="result show ok";return}if(d.status==="failed"){o.textContent=d.message||"Skin apply failed.";o.className="result show err";return}}catch{}}o.textContent="Request reached the bridge but no UE4SS confirmation arrived.";o.className="result show err"}
async function applySkin(){const o=$("result");if(!API_READY){o.textContent="Railway backend is not connected.";o.className="result show err";return}if(!me){location.href=API+"/auth/steam";return}const b=$("apply");b.disabled=true;o.textContent="Sending skin to the server…";o.className="result show";try{const d=await api("/api/skins/apply",{method:"POST",body:JSON.stringify({species:selected.slug,patternIndex,skinVariation,themeIndex,colors:state})});o.textContent="Request queued. Waiting for your server…";poll(d.id)}catch(e){o.textContent=e.message;o.className="result show err"}finally{b.disabled=false}}

buildSpecies();buildColorGroup(CORE,"coreColors");buildColorGroup(DETAIL,"detailColors");buildPresets();refreshSaved();readHash();renderAll();refreshMe();refreshStatus();setInterval(refreshStatus,10000);
$("species").onchange=e=>{pushHistory();selected=SPECIES.find(s=>s.slug===e.target.value)||SPECIES[0];patternIndex=0;renderAll()};
$("randomSpecies").onclick=()=>{pushHistory();selected=SPECIES[Math.floor(Math.random()*SPECIES.length)];patternIndex=0;$("species").value=selected.slug;renderAll()};
$("variation").onchange=e=>{pushHistory();skinVariation=Number(e.target.value);renderAll()};
$("theme").onchange=e=>{pushHistory();themeIndex=Number(e.target.value);renderAll()};
$("malePreview").onclick=()=>{previewMale=true;renderAll()};$("femalePreview").onclick=()=>{previewMale=false;renderAll()};
$("previewStrength").oninput=renderPreview;$("lighting").oninput=renderPreview;$("previewZoom").oninput=renderPreview;
$("natural").onclick=natural;$("vivid").onclick=vivid;$("reset").onclick=()=>{pushHistory();state={...DEFAULTS};patternIndex=0;skinVariation=1;themeIndex=0;$("variation").value=1;$("theme").value=0;renderAll();toast("Skin reset")};
$("save").onclick=saveSkin;$("loadSaved").onclick=loadSkin;$("saved").onchange=()=>{};
$("delete").onclick=()=>{const n=$("saved").value;if(!n)return;const d=db();delete d[n];localStorage.setItem("foggy_skin_presets_v50",JSON.stringify(d));refreshSaved();toast("Skin deleted")};
$("import").onclick=()=>importCode($("shareCode").value);$("copy").onclick=async()=>{try{await navigator.clipboard.writeText(shareCode());toast("Share code copied")}catch{prompt("Copy this code",shareCode())}};
$("undo").onclick=()=>{if(!history.length)return;future.push(snapshot());restore(history.pop())};$("redo").onclick=()=>{if(!future.length)return;history.push(snapshot());restore(future.pop())};
$("apply").onclick=applySkin;$("steam").onclick=()=>{if(me){session="";me=null;localStorage.removeItem("foggy_skin_session");refreshMe()}else if(API_READY)location.href=API+"/auth/steam";else toast("Railway backend is not connected")};
