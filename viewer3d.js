import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { clone as skeletonClone } from "three/addons/utils/SkeletonUtils.js";
import { EVRIMA_MODELS, SHARED } from "./evrima-registry.js?v=081";

const CFG=window.FOGGY_SKIN_CONFIG||{};
const API=String(CFG.API_BASE||"").replace(/\/$/,"");
const API_READY=API.startsWith("https://")&&!API.includes("YOUR-RAILWAY");
const ASSET_TIMEOUT_MS=30000;
const MAX_TEX=2048;

const canvas=document.getElementById("viewer3d");
const fallback=document.getElementById("fallbackImage");
const loading=document.getElementById("viewerLoading");
const message=document.getElementById("viewerMessage");
const shell=document.getElementById("viewerShell");

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:"high-performance"});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.99;
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(40,1,.1,200);
camera.position.set(-19.33,.89,-.02);
const controls=new OrbitControls(camera,canvas);
controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.075;
controls.minDistance=8;controls.maxDistance=40;

// These values follow the researched public IslePilot viewer port. The PI
// factor compensates for modern Three.js physically-correct light units.
const L=Math.PI;
const ambient=new THREE.AmbientLight(0xffffff,.7*L);scene.add(ambient);
const hemi=new THREE.HemisphereLight(0xcfe3ff,0x3a2f28,.6*L);scene.add(hemi);
const key=new THREE.DirectionalLight(0xfff2e6,2.4*L);key.position.set(6,10,6);scene.add(key);
const fill=new THREE.DirectionalLight(0xbcd4ff,.7*L);fill.position.set(-6,4,-6);scene.add(fill);

const gltfLoader=new GLTFLoader();
const clock=new THREE.Clock();
const gltfCache=new Map();
const imageCache=new Map();
const skinCache=new Map();
const CACHE_MAX=8;

let root=null,mixer=null,currentSlug="",currentMode="",currentEntry=null;
let skinMat=null,eyeMat=null,mapTex=null,normalTex=null;
let state=window.FOGGY_VIEWER_STATE||null;
let settings=window.FOGGY_VIEWER_SETTINGS||{scene:"studio",background:true,brightness:.82,lighting:.9,idle:true};
let generation=0,skinTimer=0;

function emitStatus(kind,label){window.dispatchEvent(new CustomEvent("foggy:model-status",{detail:{kind,label}}));}
function showLoading(on,text="Loading Evrima preview…"){
  if(text)loading.querySelector("span").textContent=text;
  loading.classList.toggle("hidden",!on);
}
function showMessage(text){message.textContent=text||"";message.classList.toggle("show",Boolean(text));}
function clearSource(){document.getElementById("modelSource")?.remove();}
function showSource(){
  clearSource();
  const a=document.createElement("a");a.id="modelSource";a.className="model-source";
  a.href="https://github.com/toantranct/theisle-overlay";a.target="_blank";a.rel="noopener";
  a.textContent="Evrima viewer asset registry source";shell.appendChild(a);
}
function proxyUrl(url){return API+"/api/assets?url="+encodeURIComponent(url);}
async function fetchAsset(url){
  if(!API_READY)throw Error("Railway asset proxy is not configured");
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),ASSET_TIMEOUT_MS);
  try{
    const r=await fetch(proxyUrl(url),{signal:controller.signal,cache:"force-cache"});
    if(!r.ok)throw Error(`asset ${r.status}: ${url.split("/").pop()}`);
    return await r.arrayBuffer();
  }catch(e){if(e?.name==="AbortError")throw Error("Evrima asset request timed out");throw e;}
  finally{clearTimeout(timer);}
}
function remember(map,key,value){
  if(map.size>=CACHE_MAX&&!map.has(key))map.delete(map.keys().next().value);
  map.set(key,value);return value;
}
function loadGltf(entry){
  if(gltfCache.has(entry.name))return gltfCache.get(entry.name);
  const p=(async()=>gltfLoader.parseAsync(await fetchAsset(entry.glbModel),""))();
  p.catch(()=>gltfCache.delete(entry.name));return remember(gltfCache,entry.name,p);
}
async function decodeImage(url){
  const buf=await fetchAsset(url),bitmap=await createImageBitmap(new Blob([buf]));
  const scale=Math.min(1,MAX_TEX/Math.max(bitmap.width,bitmap.height));
  const w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale));
  const c=document.createElement("canvas");c.width=w;c.height=h;
  const ctx=c.getContext("2d",{willReadFrequently:true});ctx.drawImage(bitmap,0,0,w,h);bitmap.close();
  return ctx.getImageData(0,0,w,h);
}
function loadImageData(url){
  if(!url)return Promise.resolve(null);
  if(imageCache.has(url))return imageCache.get(url);
  const p=decodeImage(url);p.catch(()=>imageCache.delete(url));return remember(imageCache,url,p);
}
function toCanvas(img){const c=document.createElement("canvas");c.width=img.width;c.height=img.height;c.getContext("2d").putImageData(img,0,0);return c;}
function sampleWrapped(img,x,y){const xi=((x%img.width)+img.width)%img.width,yi=((y%img.height)+img.height)%img.height;return(yi*img.width+xi)*4;}
function hexRgb(hex){const n=parseInt(String(hex||"#000000").replace("#",""),16);return[(n>>16)&255,(n>>8)&255,n&255];}

const ZONES=[
  {key:"breed",ref:[255,0,0],threshold:.42},
  {key:"underbelly",ref:[0,255,0],threshold:.42},
  {key:"flank",ref:[0,1,245],threshold:.42},
  {key:"body",ref:[0,255,241],threshold:.42},
  {key:"markings",ref:[255,0,255],threshold:.6},
  {key:"detail",ref:[255,255,0],threshold:.42}
];
const BRIGHTNESS=.55,RAC_STRENGTH=.85;

function compositeMap(pattern,colors,tmc,rac){
  pattern=new ImageData(new Uint8ClampedArray(pattern.data),pattern.width,pattern.height);
  const zones=ZONES.map(z=>({...z,color:hexRgb(colors[z.key]).map(c=>c*BRIGHTNESS)}));
  const teeth=hexRgb(colors.teeth),mouth=hexRgb(colors.mouth),claws=hexRgb(colors.claws),d=pattern.data;
  const scaleT=tmc&&(tmc.width!==pattern.width||tmc.height!==pattern.height);
  const scaleR=rac&&(rac.width!==pattern.width||rac.height!==pattern.height);
  for(let i=0;i<d.length;i+=4){
    let r=d[i],g=d[i+1],b=d[i+2],best=-1,bestDist=Infinity;
    for(let z=0;z<zones.length;z++){
      const ref=zones[z].ref,dr=(r-ref[0])/255,dg=(g-ref[1])/255,db=(b-ref[2])/255,dist=dr*dr+dg*dg+db*db;
      if(dist<bestDist){bestDist=dist;best=z;}
    }
    if(best>=0&&bestDist<=zones[best].threshold)[r,g,b]=zones[best].color;
    const px=(i/4)%pattern.width,py=Math.floor(i/4/pattern.width);
    if(tmc){
      const j=scaleT?sampleWrapped(tmc,Math.floor(px/pattern.width*tmc.width),Math.floor(py/pattern.height*tmc.height)):i;
      const tr=tmc.data[j]/255,tg=tmc.data[j+1]/255,tb=tmc.data[j+2]/255;
      if(tr>0){r=r*(1-tr)+teeth[0]*tr;g=g*(1-tr)+teeth[1]*tr;b=b*(1-tr)+teeth[2]*tr;}
      if(tg>0){r=r*(1-tg)+mouth[0]*tg;g=g*(1-tg)+mouth[1]*tg;b=b*(1-tg)+mouth[2]*tg;}
      if(tb>0){r=r*(1-tb)+claws[0]*tb;g=g*(1-tb)+claws[1]*tb;b=b*(1-tb)+claws[2]*tb;}
    }
    if(rac){
      const j=scaleR?sampleWrapped(rac,Math.floor(px/pattern.width*rac.width),Math.floor(py/pattern.height*rac.height)):i;
      const f=1-RAC_STRENGTH*(1-(rac.data[j+1]/255)*(rac.data[j+2]/255));r*=f;g*=f;b*=f;
    }
    d[i]=r;d[i+1]=g;d[i+2]=b;d[i+3]=255;
  }
  return toCanvas(pattern);
}
function compositeNormal(base,detail,detailScale){
  base=new ImageData(new Uint8ClampedArray(base.data),base.width,base.height);const d=base.data;
  for(let i=0;i<d.length;i+=4){
    const px=(i/4)%base.width,py=Math.floor(i/4/base.width);
    const j=sampleWrapped(detail,Math.floor(px/base.width*detail.width*detailScale),Math.floor(py/base.height*detail.height*detailScale));
    const bx=d[i]/255*2-1,by=d[i+1]/255*2-1,bz=d[i+2]/255*2-1,dx=detail.data[j]/255*2-1,dy=detail.data[j+1]/255*2-1;
    let nx=bx+dx,ny=by+dy,nz=Math.max(bz,.01),len=Math.sqrt(nx*nx+ny*ny+nz*nz)||1;nx/=len;ny/=len;nz/=len;
    d[i]=(nx+1)/2*255;d[i+1]=(ny+1)/2*255;d[i+2]=(nz+1)/2*255;
  }return toCanvas(base);
}
function statePatternKey(entry){const requested=String((Number(state?.patternIndex)||0)+1);return entry.patterns[requested]?requested:Object.keys(entry.patterns)[0];}
function skinKey(entry){return `${entry.name}|${statePatternKey(entry)}|${Object.values(state?.colors||{}).join(",")}`;}
async function buildSkin(entry){
  const key=skinKey(entry);if(skinCache.has(key))return skinCache.get(key);
  const p=(async()=>{
    const pk=statePatternKey(entry),patternUrl=entry.patterns[pk];
    // The public viewer port documents per-pattern TMC masks. The registry also
    // carries a generic maskMap for some species, which is used only as a
    // fallback when no per-pattern mask exists.
    const tmcUrl=entry.patternMasks?.[pk]||entry.maskMap||null;
    const [pattern,tmc,rac,normal,detail]=await Promise.all([
      loadImageData(patternUrl),tmcUrl?loadImageData(tmcUrl).catch(()=>null):null,
      loadImageData(entry.racMap).catch(()=>null),loadImageData(entry.normalMap).catch(()=>null),
      loadImageData(SHARED.detailNormal).catch(()=>null)
    ]);
    return{map:compositeMap(pattern,state.colors,tmc,rac),normal:normal&&detail?compositeNormal(normal,detail,entry.detailScale||12):(normal?toCanvas(normal):null)};
  })();
  p.catch(()=>skinCache.delete(key));return remember(skinCache,key,p);
}
function disposeMaterialTextures(){mapTex?.dispose();normalTex?.dispose();skinMat?.dispose();eyeMat?.dispose();mapTex=normalTex=skinMat=eyeMat=null;}
function disposeRoot(){if(root){scene.remove(root);root=null;}mixer=null;disposeMaterialTextures();}
function makeMaterials(skin){
  mapTex=new THREE.CanvasTexture(skin.map);mapTex.flipY=false;mapTex.colorSpace=THREE.SRGBColorSpace;
  normalTex=skin.normal?new THREE.CanvasTexture(skin.normal):null;if(normalTex)normalTex.flipY=false;
  skinMat=new THREE.MeshStandardMaterial({map:mapTex,normalMap:normalTex,normalScale:new THREE.Vector2(1,1),roughness:.95,metalness:0,envMapIntensity:.4,side:THREE.DoubleSide});
  const ec=new THREE.Color(state.colors.eyes);eyeMat=new THREE.MeshStandardMaterial({color:ec,emissive:ec.clone().multiplyScalar(.4),roughness:.35,metalness:0});
}
function applyMaterials(model){
  model.traverse(obj=>{
    if(!obj.isMesh)return;
    const originals=Array.isArray(obj.material)?obj.material:[obj.material];
    const mapped=originals.map(m=>/eye|iris|pupil/i.test(m?.name||"")?eyeMat:skinMat);
    obj.material=Array.isArray(obj.material)?mapped:mapped[0];
  });
}
function startAnimation(gltf){
  mixer=null;if(!gltf.animations?.length)return;
  mixer=new THREE.AnimationMixer(root);
  const clip=currentEntry?.previewClip?(gltf.animations.find(a=>a.name===currentEntry.previewClip)||gltf.animations[0]):gltf.animations[0];
  mixer.clipAction(clip).play();
}
function setCamera(mode){
  controls.enabled=mode!=="2d";controls.target.set(0,0,0);
  if(mode==="2d")camera.position.set(-19.33,.89,-.02);else camera.position.set(-19.33,.89,-.02);
  camera.fov=40;camera.updateProjectionMatrix();controls.update();
}
async function buildScene(){
  const gen=++generation,slug=state?.species?.slug||state?.species||"tyrannosaurus",entry=EVRIMA_MODELS[slug];
  fallback.src=state?.fallbackImage||state?.species?.image||"";
  currentMode=state?.mode==="2d"?"2d":state?.mode==="hq"?"hq":"skin3d";
  if(!entry){
    disposeRoot();currentSlug=slug;currentEntry=null;canvas.style.display="none";fallback.style.display="block";showLoading(false);
    showMessage(slug==="austroraptor"?"Austroraptor does not have a verified public Evrima 3D asset in the researched registry yet. A proxy model is deliberately not used.":"No verified Evrima 3D asset is configured for this species.");
    emitStatus("fallback","EVRIMA REFERENCE · EXACT 3D PENDING");clearSource();return;
  }
  currentEntry=entry;currentSlug=slug;canvas.style.display="block";fallback.style.display="none";showMessage("");
  showLoading(true,`Loading ${entry.name} Evrima assets…`);emitStatus("loading","LOADING EVRIMA ASSETS…");
  try{
    const [gltf,skin]=await Promise.all([loadGltf(entry),buildSkin(entry)]);if(gen!==generation)return;
    disposeRoot();currentEntry=entry;currentSlug=slug;currentMode=state?.mode==="2d"?"2d":state?.mode==="hq"?"hq":"skin3d";
    makeMaterials(skin);root=skeletonClone(gltf.scene);root.name="FOGGY_EvrimaPreview";applyMaterials(root);
    root.scale.setScalar(entry.glbScale);root.position.set(...entry.glbPosition);root.rotation.set(0,-Math.PI/6,0);scene.add(root);
    startAnimation(gltf);setCamera(currentMode);showLoading(false);showSource();
    const pattern=Number(state.patternIndex||0)+1;emitStatus("exact",`EVRIMA SOURCE 3D · PATTERN ${pattern}`);
  }catch(e){
    if(gen!==generation)return;console.error("[FOGGY Evrima Preview]",e);disposeRoot();canvas.style.display="none";fallback.style.display="block";showLoading(false);
    showMessage("The Evrima asset request failed. This build requires the Railway v0.6.0 asset proxy; showing the reference image instead.");emitStatus("error","EVRIMA ASSET LOAD FAILED");
  }
}
async function refreshSkinOnly(){
  if(!root||!currentEntry)return buildScene();
  const gen=++generation;showLoading(true,"Updating Evrima skin texture…");
  try{
    const skin=await buildSkin(currentEntry);if(gen!==generation)return;
    disposeMaterialTextures();makeMaterials(skin);applyMaterials(root);showLoading(false);
    emitStatus("exact",`EVRIMA SOURCE 3D · PATTERN ${Number(state.patternIndex||0)+1}`);
  }catch(e){if(gen!==generation)return;console.error("[FOGGY Evrima Skin]",e);showLoading(false);showMessage("Skin texture update failed; the last successful preview is still displayed.");}
}
function scheduleSkin(){clearTimeout(skinTimer);skinTimer=setTimeout(refreshSkinOnly,120);}
function applyEnvironment(next){
  settings={...settings,...(next||{})};const sc=settings.scene||"studio";
  shell.className="viewer-shell scene-"+sc+(currentMode==="hq"?" mode-hq":currentMode==="2d"?" mode-2d":"");
  shell.style.filter=`brightness(${settings.brightness||1})`;
  const ls=settings.lighting||1;ambient.intensity=.7*L*ls;hemi.intensity=.6*L*ls;key.intensity=2.4*L*ls;fill.intensity=.7*L*ls;
}
function resize(){const r=canvas.getBoundingClientRect(),w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}

window.addEventListener("resize",resize);
window.addEventListener("foggy:viewer-state",e=>{
  const oldSlug=state?.species?.slug||state?.species,oldMode=state?.mode,oldPattern=state?.patternIndex;
  state=e.detail;const slug=state?.species?.slug||state?.species;
  if(slug!==oldSlug||state.mode!==oldMode||!root)buildScene();else scheduleSkin();
});
window.addEventListener("foggy:viewer-settings",e=>applyEnvironment(e.detail));
window.addEventListener("foggy:viewer-reset",()=>setCamera(currentMode));
resize();applyEnvironment(settings);
setTimeout(()=>{if(window.FOGGY_VIEWER_STATE){state=window.FOGGY_VIEWER_STATE;buildScene();}},60);
function animate(){requestAnimationFrame(animate);resize();controls.update();const dt=Math.min(clock.getDelta(),.05);if(mixer&&settings.idle!==false)mixer.update(dt);renderer.render(scene,camera);}animate();
