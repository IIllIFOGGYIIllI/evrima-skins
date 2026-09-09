import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { clone as skeletonClone } from "three/addons/utils/SkeletonUtils.js";

const canvas=document.getElementById("viewer3d");
const fallback=document.getElementById("fallbackImage");
const loading=document.getElementById("viewerLoading");
const message=document.getElementById("viewerMessage");
const shell=document.getElementById("viewerShell");

const EVRIMA_CDN="https://islepilot.eu/cdn/skinviewer/";
const SOURCE_URL="https://github.com/toantranct/theisle-overlay";
const MODEL_TIMEOUT_MS=18000;

function speciesModel(folder,file,label,framing={}){
  return {
    url:`${EVRIMA_CDN}${folder}/${file}`,
    label,
    source:"IslePilot / theisle-overlay Evrima viewer assets",
    sourceUrl:SOURCE_URL,
    exact:true,
    framing
  };
}

const EVRIMA_MODELS={
  tyrannosaurus:speciesModel("Tyrannosaurus","Tyrannosaurus.glb","EVRIMA 3D · TYRANNOSAURUS",{lift:0.02,zoom:1.0}),
  allosaurus:speciesModel("Allo","Allosaurus.glb","EVRIMA 3D · ALLOSAURUS",{lift:0.02,zoom:1.0}),
  austroraptor:speciesModel("Austro","Austroraptor.glb","EVRIMA 3D · AUSTRORAPTOR",{lift:0.0,zoom:1.0}),
  carnotaurus:speciesModel("Carno","Carnotaurus.glb","EVRIMA 3D · CARNOTAURUS",{lift:0.03,zoom:1.0}),
  ceratosaurus:speciesModel("Cera","Ceratosaurus.glb","EVRIMA 3D · CERATOSAURUS",{lift:0.02,zoom:1.0}),
  deinosuchus:speciesModel("Deino","Deinosuchus.glb","EVRIMA 3D · DEINOSUCHUS",{lift:-0.12,zoom:0.92}),
  dilophosaurus:speciesModel("Dilo","Dilophosaurus.glb","EVRIMA 3D · DILOPHOSAURUS",{lift:0.04,zoom:1.02}),
  herrerasaurus:speciesModel("Herrera","Herrerasaurus.glb","EVRIMA 3D · HERRERASAURUS",{lift:0.02,zoom:1.0}),
  omniraptor:speciesModel("Omni","Omniraptor.glb","EVRIMA 3D · OMNIRAPTOR",{lift:0.02,zoom:1.02}),
  pteranodon:speciesModel("Pter","Pteranodon.glb","EVRIMA 3D · PTERANODON",{lift:0.06,zoom:1.08}),
  troodon:speciesModel("Troodon","Troodon.glb","EVRIMA 3D · TROODON",{lift:0.04,zoom:1.04}),
  triceratops:speciesModel("Triceratops","Triceratops.glb","EVRIMA 3D · TRICERATOPS",{lift:0.01,zoom:0.98}),
  stegosaurus:speciesModel("Stego","Stegosaurus.glb","EVRIMA 3D · STEGOSAURUS",{lift:0.02,zoom:0.98}),
  diabloceratops:speciesModel("Dibble","Diabloceratops.glb","EVRIMA 3D · DIABLOCERATOPS",{lift:0.02,zoom:1.0}),
  kentrosaurus:speciesModel("Kentro","Kentrosaurus.glb","EVRIMA 3D · KENTROSAURUS",{lift:0.02,zoom:1.0}),
  tenontosaurus:speciesModel("Teno","Tenontosaurus.glb","EVRIMA 3D · TENONTOSAURUS",{lift:0.02,zoom:0.98}),
  maiasaura:speciesModel("Maiasaura","Maiasaura.glb","EVRIMA 3D · MAIASAURA",{lift:0.02,zoom:0.96}),
  pachycephalosaurus:speciesModel("Pachy","Pachycephalosaurus.glb","EVRIMA 3D · PACHYCEPHALOSAURUS",{lift:0.04,zoom:1.04}),
  dryosaurus:speciesModel("Dryo","Dryosaurus.glb","EVRIMA 3D · DRYOSAURUS",{lift:0.05,zoom:1.08}),
  hypsilophodon:speciesModel("Hypsi","Hypsilophodon.glb","EVRIMA 3D · HYPSILOPHODON",{lift:0.06,zoom:1.08}),
  gallimimus:speciesModel("Galli","Gallimimus.glb","EVRIMA 3D · GALLIMIMUS",{lift:0.03,zoom:1.02}),
  beipiaosaurus:speciesModel("Beipi","Beipiaosaurus.glb","EVRIMA 3D · BEIPIAOSAURUS",{lift:0.03,zoom:1.02})
};

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:"high-performance"});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.1;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x0d100d,.018);

const camera=new THREE.PerspectiveCamera(32,1,.05,200);
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.dampingFactor=.075;controls.enablePan=false;
controls.minDistance=3.5;controls.maxDistance=24;
controls.maxPolarAngle=Math.PI*.63;controls.minPolarAngle=Math.PI*.10;

const hemi=new THREE.HemisphereLight(0xe9edde,0x121711,1.5);scene.add(hemi);
const key=new THREE.DirectionalLight(0xfff0c9,3.5);key.position.set(6,9,7);key.castShadow=true;scene.add(key);
const rim=new THREE.DirectionalLight(0x82c2bf,1.55);rim.position.set(-7,4,-7);scene.add(rim);
const fill=new THREE.DirectionalLight(0xbab4a0,.58);fill.position.set(2,2,-5);scene.add(fill);

const floorMat=new THREE.MeshStandardMaterial({color:0x20251e,roughness:1,metalness:0});
const floor=new THREE.Mesh(new THREE.CircleGeometry(8,72),floorMat);
floor.rotation.x=-Math.PI/2;floor.position.y=-.025;floor.receiveShadow=true;scene.add(floor);

const loader=new GLTFLoader();
const cache=new Map();
const clock=new THREE.Clock();

let root=null,mixer=null,currentKey="";
let state=window.FOGGY_VIEWER_STATE||null;
let settings=window.FOGGY_VIEWER_SETTINGS||{scene:"studio",background:true,brightness:.82,lighting:.9,idle:true};
let mode="skin3d";
let meshRecords=[],headBone=null,currentInfo=null;
let modelBox=new THREE.Box3(),modelSize=new THREE.Vector3(),modelCenter=new THREE.Vector3();
let longAxis="x",widthAxis="z";
const temp=new THREE.Vector3(),headWorld=new THREE.Vector3();

function emitStatus(kind,label){
  window.dispatchEvent(new CustomEvent("foggy:model-status",{detail:{kind,label}}));
}
function showLoading(on,text="Loading dinosaur model…"){
  if(text)loading.querySelector("span").textContent=text;
  loading.classList.toggle("hidden",!on);
}
function showMessage(text){
  message.textContent=text||"";
  message.classList.toggle("show",Boolean(text));
}
function clearSource(){document.getElementById("modelSource")?.remove();}
function showSource(info){
  clearSource();
  if(!info?.sourceUrl)return;
  const a=document.createElement("a");
  a.id="modelSource";a.className="model-source";a.href=info.sourceUrl;
  a.target="_blank";a.rel="noopener";a.textContent=info.source||"3D model source";
  shell.appendChild(a);
}
function disposeRoot(){
  if(!root)return;
  scene.remove(root);
  root.traverse(o=>{
    if(o.material){
      const ms=Array.isArray(o.material)?o.material:[o.material];
      ms.forEach(m=>{if(m?.userData?.foggyClone)m.dispose();});
    }
    if(o.geometry?.userData?.foggyClone)o.geometry.dispose();
  });
  root=null;mixer=null;meshRecords=[];headBone=null;currentInfo=null;
}
function findHead(object){
  let found=null;
  object.traverse(o=>{
    if(found||!o.isBone)return;
    const n=String(o.name||"").toLowerCase();
    if(n.includes("head")||n.includes("skull")||n.includes("neck3")||n.includes("neck_03"))found=o;
  });
  return found;
}
function classify(name){
  const n=String(name||"").toLowerCase();
  if(/eye|iris|pupil/.test(n))return"eyes";
  if(/tooth|teeth|fang/.test(n))return"teeth";
  if(/mouth|tongue|gum|oral/.test(n))return"mouth";
  if(/claw|nail|talon/.test(n))return"claws";
  if(/belly|underbelly|ventral|underside/.test(n))return"underbelly";
  if(/flank|side/.test(n))return"flank";
  if(/mark|stripe|pattern|spot/.test(n))return"markings";
  if(/crest|display|plate|spike|dorsal|horn/.test(n))return"detail";
  return"body";
}
function cloneMaterial(m,preserveTexture){
  const c=m?.isMaterial?m.clone():new THREE.MeshStandardMaterial();
  c.userData.foggyClone=true;
  c.userData.baseColor=(c.color?.clone?.()||new THREE.Color(0xffffff));
  c.vertexColors=!preserveTexture;
  c.transparent=false;c.opacity=1;c.depthWrite=true;c.side=THREE.FrontSide;
  if("metalness" in c)c.metalness=Math.min(.14,c.metalness??0);
  if("roughness" in c)c.roughness=Math.max(.46,c.roughness??.74);
  if(!preserveTexture){
    if(c.color)c.color.set(0xffffff);
    if("map" in c)c.map=null;
  }
  c.needsUpdate=true;
  return c;
}
function prepareMeshes(preserveTexture){
  meshRecords=[];
  root.traverse(o=>{
    if(!o.isMesh&&!o.isSkinnedMesh)return;
    o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;
    if(!preserveTexture){
      o.geometry=o.geometry.clone();o.geometry.userData.foggyClone=true;
      if(!o.geometry.attributes.normal)o.geometry.computeVertexNormals();
    }
    const names=[o.name];
    const mats=Array.isArray(o.material)?o.material:[o.material];
    mats.forEach(m=>names.push(m?.name||""));
    const cls=classify(names.join(" "));
    o.material=Array.isArray(o.material)?o.material.map(m=>cloneMaterial(m,preserveTexture)):cloneMaterial(o.material,preserveTexture);
    meshRecords.push({mesh:o,cls,preserveTexture});
  });
}
function fitModel(){
  root.updateMatrixWorld(true);
  modelBox.setFromObject(root);modelBox.getSize(modelSize);
  const maxDim=Math.max(modelSize.x,modelSize.y,modelSize.z)||1;
  const fit=(currentInfo?.framing?.zoom||1)*6.45;
  root.scale.setScalar(fit/maxDim);
  root.updateMatrixWorld(true);
  modelBox.setFromObject(root);modelBox.getCenter(modelCenter);
  root.position.x-=modelCenter.x;root.position.z-=modelCenter.z;root.position.y-=modelBox.min.y;
  root.position.y+=Math.max(-0.4,Math.min(0.6,(currentInfo?.framing?.lift||0)*modelSize.y));
  root.updateMatrixWorld(true);
  modelBox.setFromObject(root);modelBox.getSize(modelSize);modelBox.getCenter(modelCenter);
  longAxis=modelSize.x>=modelSize.z?"x":"z";widthAxis=longAxis==="x"?"z":"x";
  setCamera(mode,true);
}
function smoothstep(a,b,x){const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}
function mixColor(a,b,t){return a.clone().lerp(b,Math.max(0,Math.min(1,t)));}
function patternValue(qLong,qWidth){
  const variation=Number(state?.skinVariation)||0,idx=Number(state?.patternIndex)||0;
  const f=[10,6.5,4.2][Math.max(0,Math.min(2,variation))];
  let v=0;
  if(idx===0)v=.5+.5*Math.sin((qLong*1.15+qWidth*.22)*Math.PI*2*f);
  else if(idx===1){const x=(qLong*f)%1-.5,y=(qWidth*f*.78)%1-.5;v=1-smoothstep(.12,.37,Math.hypot(x,y));}
  else if(idx===2)v=.5+.5*Math.sin((qLong*1.55-qWidth*.55)*Math.PI*2*(f*.72)+Math.sin(qLong*f*3));
  else if(idx===3)v=Math.abs(Math.sin(qLong*Math.PI*f)*Math.sin((qWidth+.17)*Math.PI*f*.82));
  else v=Math.abs(Math.sin((qLong+qWidth*.7)*Math.PI*f*1.2));
  return smoothstep(.46,.72,v);
}
function skinColor(qx,qy,qz,wp){
  const c=state?.colors||{};
  let col=new THREE.Color(c.body||"#6D706B");
  const under=new THREE.Color(c.underbelly||"#A5A49A"),flank=new THREE.Color(c.flank||"#7C8179");
  const markC=new THREE.Color(c.markings||"#343A35"),detail=new THREE.Color(c.detail||"#49504A");
  const breed=new THREE.Color(c.breed||"#687A5A");
  const qLong=longAxis==="x"?qx:qz,qWidth=widthAxis==="x"?qx:qz;
  const side=Math.abs(qWidth-.5)*2;
  const belly=(1-smoothstep(.16,.44,qy))*(1-.25*side);col=mixColor(col,under,belly*.92);
  const band=smoothstep(.28,.43,qy)*(1-smoothstep(.68,.84,qy));col=mixColor(col,flank,band*(.38+.45*side));
  const mark=patternValue(qLong,qWidth)*smoothstep(.34,.49,qy)*(1-smoothstep(.88,.98,qy));col=mixColor(col,markC,mark*.88);
  col=mixColor(col,detail,smoothstep(.74,.96,qy)*.42);
  if((state?.previewSex||"male")==="male"&&headBone){
    const d=wp.distanceTo(headWorld)/Math.max(modelSize.x,modelSize.y,modelSize.z);
    col=mixColor(col,breed,(1-smoothstep(.035,.18,d))*.72);
  }
  return col;
}
function tintHQ(){
  if(!state)return;
  const c=state.colors||{};
  const composite=()=>{
    let x=new THREE.Color(c.body||"#6D706B");
    x.lerp(new THREE.Color(c.flank||"#7C8179"),.14);
    x.lerp(new THREE.Color(c.underbelly||"#A5A49A"),.07);
    x.lerp(new THREE.Color(c.markings||"#343A35"),.08);
    return x;
  };
  meshRecords.forEach(rec=>{
    const tint=rec.cls==="body"?composite():new THREE.Color(c[rec.cls]||c.body||"#FFFFFF");
    const mats=Array.isArray(rec.mesh.material)?rec.mesh.material:[rec.mesh.material];
    mats.forEach(m=>{
      if(!m?.color)return;
      const base=m.userData.baseColor?.clone?.()||new THREE.Color(1,1,1);
      const strength=rec.cls==="body"?.78:.9;
      const target=base.clone().multiply(tint);
      m.color.copy(base).lerp(target,strength);m.needsUpdate=true;
    });
  });
}
function recolorSkinMap(){
  if(!root||!state)return;
  root.updateMatrixWorld(true);modelBox.setFromObject(root);modelBox.getSize(modelSize);
  if(headBone)headBone.getWorldPosition(headWorld);
  for(const rec of meshRecords){
    const mesh=rec.mesh,pos=mesh.geometry.attributes.position;if(!pos)continue;
    const solid=["eyes","teeth","mouth","claws"].includes(rec.cls)?new THREE.Color(state.colors?.[rec.cls]||"#FFFFFF"):null;
    const arr=new Float32Array(pos.count*3);
    for(let i=0;i<pos.count;i++){
      temp.fromBufferAttribute(pos,i);mesh.localToWorld(temp);
      let col=solid;
      if(!col){
        const qx=(temp.x-modelBox.min.x)/Math.max(.0001,modelSize.x);
        const qy=(temp.y-modelBox.min.y)/Math.max(.0001,modelSize.y);
        const qz=(temp.z-modelBox.min.z)/Math.max(.0001,modelSize.z);
        col=skinColor(qx,qy,qz,temp);
      }
      arr[i*3]=col.r;arr[i*3+1]=col.g;arr[i*3+2]=col.b;
    }
    mesh.geometry.setAttribute("color",new THREE.BufferAttribute(arr,3));
    mesh.geometry.attributes.color.needsUpdate=true;
    const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    mats.forEach(m=>{m.vertexColors=true;m.needsUpdate=true;});
  }
}
function updateColours(){if(!root)return;if(mode==="hq")tintHQ();else recolorSkinMap();}
function startAnimation(gltf){
  mixer=null;if(!gltf.animations?.length)return;
  mixer=new THREE.AnimationMixer(root);
  const clip=gltf.animations.find(a=>/idle|stand|breath/i.test(a.name))||gltf.animations[0];
  mixer.clipAction(clip).reset().setLoop(THREE.LoopRepeat,Infinity).play();
}
function setCamera(nextMode){
  if(!root)return;
  const fixed=nextMode==="2d";controls.enabled=!fixed;
  const h=Math.max(.7,modelSize.y*.43),dist=Math.max(7.1,Math.max(modelSize.x,modelSize.z)*1.24);
  controls.target.set(0,h,0);
  if(fixed){
    if(longAxis==="x")camera.position.set(0,h,dist);else camera.position.set(dist,h,0);
    camera.fov=27;
  }else{
    if(longAxis==="x")camera.position.set(dist*.72,h+modelSize.y*.1,dist);
    else camera.position.set(dist,h+modelSize.y*.1,dist*.72);
    camera.fov=32;
  }
  camera.updateProjectionMatrix();controls.update();
}
function loadGLTF(url){
  if(cache.has(url))return cache.get(url);
  const p=new Promise((resolve,reject)=>{
    let settled=false;
    const finish=(fn,value)=>{if(settled)return;settled=true;clearTimeout(timer);fn(value);};
    const timer=setTimeout(()=>{cache.delete(url);finish(reject,new Error("3D model load timed out"));},MODEL_TIMEOUT_MS);
    loader.load(url,gltf=>finish(resolve,gltf),undefined,err=>{cache.delete(url);finish(reject,err);});
  });
  cache.set(url,p);return p;
}
async function loadCurrent(){
  if(!state)return;
  const slug=state.species?.slug||state.species||"tyrannosaurus";
  mode=state.mode==="hq"?"hq":state.mode==="2d"?"2d":"skin3d";
  fallback.src=state.fallbackImage||state.species?.image||"";

  let info=EVRIMA_MODELS[slug];
  if(!info){
    disposeRoot();canvas.style.display="none";fallback.style.display="block";showLoading(false);
    showMessage("No species model is configured for this dinosaur yet. Showing the Evrima reference.");
    emitStatus("fallback","EVRIMA REFERENCE · MODEL PENDING");clearSource();return;
  }

  const keyId=mode+"|"+slug+"|"+info.url;
  if(root&&keyId===currentKey){
    canvas.style.display="block";fallback.style.display="none";updateColours();setCamera(mode);return;
  }

  currentKey=keyId;disposeRoot();clearSource();currentInfo=info;
  canvas.style.display="block";fallback.style.display="none";
  showLoading(true,`Loading ${(state.species?.name||slug)} ${mode==="hq"?"HQ 3D":"preview"}…`);
  emitStatus("loading","LOADING EVRIMA 3D…");

  try{
    const gltf=await loadGLTF(info.url);
    root=skeletonClone(gltf.scene);root.name="FOGGY_DinosaurPreview";scene.add(root);
    headBone=findHead(root);prepareMeshes(mode==="hq");fitModel();root.updateMatrixWorld(true);
    updateColours();startAnimation(gltf);setCamera(mode);showLoading(false);showMessage("");showSource(info);
    emitStatus("exact",mode==="hq"?info.label:info.label.replace("EVRIMA 3D","SKIN MAP 3D"));
  }catch(err){
    console.error("[FOGGY Preview]",err);
    disposeRoot();canvas.style.display="none";fallback.style.display="block";showLoading(false);
    showMessage("3D model failed to load. Showing the Evrima reference for this species.");
    emitStatus("error","3D LOAD FAILED · REFERENCE SHOWN");
  }
}
function applyEnvironment(next){
  settings={...settings,...(next||{})};
  const sc=settings.scene||"studio";
  shell.className="viewer-shell scene-"+sc+(mode==="hq"?" mode-hq":mode==="2d"?" mode-2d":"");
  shell.style.filter=`brightness(${settings.brightness||1})`;
  key.intensity=3.5*(settings.lighting||1);rim.intensity=1.55*(settings.lighting||1);
  hemi.intensity=1.5*(settings.lighting||1);fill.intensity=.58*(settings.lighting||1);
  floor.visible=settings.background!==false;
  const cfg={
    jungle:{floor:0x1b281b,fog:0x111b14},lagoon:{floor:0x173134,fog:0x10252a},
    studio:{floor:0x22231e,fog:0x0c0e0b},night:{floor:0x10161a,fog:0x081018}
  }[sc];
  floorMat.color.setHex(cfg.floor);scene.fog=new THREE.FogExp2(cfg.fog,.018);
}
function resize(){
  const r=canvas.getBoundingClientRect(),w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}

window.addEventListener("resize",resize);
window.addEventListener("foggy:viewer-state",e=>{
  const prevSlug=state?.species?.slug||state?.species,prevMode=state?.mode;
  state=e.detail;const slug=state?.species?.slug||state?.species;
  if(slug!==prevSlug||state.mode!==prevMode||!root)loadCurrent();else updateColours();
});
window.addEventListener("foggy:viewer-settings",e=>applyEnvironment(e.detail));
window.addEventListener("foggy:viewer-reset",()=>{if(root)setCamera(mode);});

resize();applyEnvironment(settings);
setTimeout(()=>{if(window.FOGGY_VIEWER_STATE){state=window.FOGGY_VIEWER_STATE;loadCurrent();}},50);

function animate(){
  requestAnimationFrame(animate);resize();controls.update();
  const dt=Math.min(clock.getDelta(),.05);
  if(mixer&&settings.idle!==false)mixer.update(dt);
  renderer.render(scene,camera);
}
animate();
