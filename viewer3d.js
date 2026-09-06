import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { clone as skeletonClone } from "three/addons/utils/SkeletonUtils.js";

const canvas=document.getElementById("viewer3d");
const fallback=document.getElementById("fallbackImage");
const loading=document.getElementById("viewerLoading");
const message=document.getElementById("viewerMessage");
const shell=document.getElementById("viewerShell");

const CDN="https://cdn.jsdelivr.net/gh/Bleach4Ever/kid@main/public/models/";
const MODELS={
  tyrannosaurus:{url:CDN+"trex.glb",kind:"exact",label:"REAL 3D · TYRANNOSAURUS"},
  triceratops:{url:CDN+"triceratops.glb",kind:"exact",label:"REAL 3D · TRICERATOPS"},
  stegosaurus:{url:CDN+"stegosaurus.glb",kind:"exact",label:"REAL 3D · STEGOSAURUS"},
  omniraptor:{url:CDN+"raptor.glb",kind:"proxy",label:"3D RAPTOR-FAMILY REFERENCE"},
  austroraptor:{url:CDN+"raptor.glb",kind:"proxy",label:"3D RAPTOR-FAMILY REFERENCE"}
};

const renderer=new THREE.WebGLRenderer({
  canvas,antialias:true,alpha:true,powerPreference:"high-performance"
});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x0d100d,.018);

const camera=new THREE.PerspectiveCamera(32,1,.05,200);
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;
controls.dampingFactor=.075;
controls.enablePan=false;
controls.minDistance=4;
controls.maxDistance=22;
controls.maxPolarAngle=Math.PI*.62;
controls.minPolarAngle=Math.PI*.12;

const hemi=new THREE.HemisphereLight(0xe8ecdc,0x141a13,1.45);scene.add(hemi);
const key=new THREE.DirectionalLight(0xfff0c8,3.4);key.position.set(6,9,7);key.castShadow=true;scene.add(key);
const rim=new THREE.DirectionalLight(0x83c4c1,1.5);rim.position.set(-7,4,-7);scene.add(rim);
const fill=new THREE.DirectionalLight(0xb7b29e,.55);fill.position.set(2,2,-5);scene.add(fill);

const floorMat=new THREE.MeshStandardMaterial({color:0x20251e,roughness:1,metalness:0});
const floor=new THREE.Mesh(new THREE.CircleGeometry(8,72),floorMat);
floor.rotation.x=-Math.PI/2;floor.position.y=-.025;floor.receiveShadow=true;scene.add(floor);

const loader=new GLTFLoader();
const cache=new Map();
const clock=new THREE.Clock();

let root=null,mixer=null,currentSlug="";
let state=window.FOGGY_VIEWER_STATE||null;
let settings=window.FOGGY_VIEWER_SETTINGS||{
  scene:"studio",background:true,brightness:.82,lighting:.9,idle:true
};

const worldBox=new THREE.Box3();
const modelSize=new THREE.Vector3();
const modelCenter=new THREE.Vector3();
const span=new THREE.Vector3();
const temp=new THREE.Vector3();
const headWorld=new THREE.Vector3();
let longAxis="x",widthAxis="z",headBone=null;
let meshRecords=[];

function status(kind,label){
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
function disposeRoot(){
  if(!root)return;
  scene.remove(root);
  root.traverse(o=>{
    if((o.isMesh||o.isSkinnedMesh)&&o.geometry?.userData?.foggyClone)o.geometry.dispose();
    if(o.material){
      const mats=Array.isArray(o.material)?o.material:[o.material];
      mats.forEach(m=>{if(m?.userData?.foggyClone)m.dispose();});
    }
  });
  root=null;mixer=null;meshRecords=[];headBone=null;
}
function modelInfo(slug){return MODELS[slug]||null;}
function detailClass(mesh){
  const names=[mesh.name];
  const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  mats.forEach(m=>names.push(m?.name||""));
  const s=names.join(" ").toLowerCase();
  if(s.includes("eye"))return"eyes";
  if(s.includes("teeth")||s.includes("tooth"))return"teeth";
  if(s.includes("mouth")||s.includes("tongue")||s.includes("gum"))return"mouth";
  if(s.includes("claw")||s.includes("nail")||s.includes("talon"))return"claws";
  return null;
}
function findHead(object){
  let first=null;
  object.traverse(o=>{
    if(!o.isBone)return;
    const n=String(o.name||"").toLowerCase();
    if(!first&&(n.includes("head")||n.includes("skull")||n.includes("neck3")||n.includes("neck_03")))first=o;
  });
  return first;
}
function cloneMaterial(m){
  const c=(m&&m.isMaterial)?m.clone():new THREE.MeshStandardMaterial();
  c.userData.foggyClone=true;
  c.vertexColors=true;
  if(c.color)c.color.set(0xffffff);
  if("map" in c)c.map=null;
  if("emissiveMap" in c)c.emissiveMap=null;
  if(c.emissive)c.emissive.set(0x000000);
  if("metalness" in c)c.metalness=0;
  if("roughness" in c)c.roughness=Math.max(.48,c.roughness??.78);
  c.transparent=false;
  c.opacity=1;
  c.depthWrite=true;
  c.side=THREE.FrontSide;
  c.needsUpdate=true;
  return c;
}
function prepareMeshes(){
  meshRecords=[];
  root.traverse(o=>{
    if(!o.isMesh&&!o.isSkinnedMesh)return;
    o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;
    o.geometry=o.geometry.clone();
    o.geometry.userData.foggyClone=true;
    if(!o.geometry.attributes.normal)o.geometry.computeVertexNormals();
    const dc=detailClass(o);
    if(Array.isArray(o.material))o.material=o.material.map(cloneMaterial);
    else o.material=cloneMaterial(o.material);
    meshRecords.push({mesh:o,detail:dc});
  });
}
function fitModel(){
  root.updateMatrixWorld(true);
  worldBox.setFromObject(root);worldBox.getSize(modelSize);
  const maxDim=Math.max(modelSize.x,modelSize.y,modelSize.z)||1;
  root.scale.setScalar(6.3/maxDim);
  root.updateMatrixWorld(true);
  worldBox.setFromObject(root);worldBox.getCenter(modelCenter);
  root.position.x-=modelCenter.x;
  root.position.z-=modelCenter.z;
  root.position.y-=worldBox.min.y;
  root.updateMatrixWorld(true);
  worldBox.setFromObject(root);worldBox.getSize(modelSize);worldBox.getCenter(modelCenter);
  span.copy(modelSize);
  longAxis=modelSize.x>=modelSize.z?"x":"z";
  widthAxis=longAxis==="x"?"z":"x";
  controls.target.set(0,Math.max(.7,modelSize.y*.43),0);
  setViewMode(state?.mode||"3d",true);
}
function smoothstep(a,b,x){
  const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
  return t*t*(3-2*t);
}
function mixColor(a,b,t){
  return a.clone().lerp(b,Math.max(0,Math.min(1,t)));
}
function patternValue(qLong,qWidth,qY){
  const variation=Number(state?.skinVariation)||0;
  const idx=Number(state?.patternIndex)||0;
  const f=[10,6.5,4.2][Math.max(0,Math.min(2,variation))];
  let v=0;
  if(idx===0){
    v=.5+.5*Math.sin((qLong*1.15+qWidth*.22)*Math.PI*2*f);
  }else if(idx===1){
    const x=(qLong*f)%1-.5,y=(qWidth*f*.78)%1-.5;
    v=1-smoothstep(.12,.37,Math.hypot(x,y));
  }else if(idx===2){
    v=.5+.5*Math.sin((qLong*1.55-qWidth*.55)*Math.PI*2*(f*.72)+Math.sin(qLong*f*3));
  }else if(idx===3){
    v=Math.abs(Math.sin(qLong*Math.PI*f)*Math.sin((qWidth+.17)*Math.PI*f*.82));
  }else{
    v=Math.abs(Math.sin((qLong+qWidth*.7)*Math.PI*f*1.2));
  }
  return smoothstep(.46,.72,v);
}
function solidColorForDetail(detail){
  const c=state?.colors||{};
  const h=c[detail]||"#FFFFFF";
  return new THREE.Color(h);
}
function sampleSkinColor(qx,qy,qz,wp){
  const c=state?.colors||{};
  let col=new THREE.Color(c.body||"#6D706B");
  const under=new THREE.Color(c.underbelly||"#A5A49A");
  const flank=new THREE.Color(c.flank||"#7C8179");
  const markings=new THREE.Color(c.markings||"#343A35");
  const detail=new THREE.Color(c.detail||"#49504A");
  const breed=new THREE.Color(c.breed||"#687A5A");

  const qLong=longAxis==="x"?qx:qz;
  const qWidth=widthAxis==="x"?qx:qz;
  const side=Math.abs(qWidth-.5)*2;

  const belly=(1-smoothstep(.16,.44,qy))*(1-.25*side);
  col=mixColor(col,under,belly*.92);

  const flankBand=smoothstep(.28,.43,qy)*(1-smoothstep(.68,.84,qy));
  col=mixColor(col,flank,flankBand*(.38+.45*side));

  const markRegion=smoothstep(.34,.49,qy)*(1-smoothstep(.88,.98,qy));
  const mark=patternValue(qLong,qWidth,qy)*markRegion;
  col=mixColor(col,markings,mark*.88);

  const dorsal=smoothstep(.74,.96,qy);
  col=mixColor(col,detail,dorsal*.42);

  if((state?.previewSex||"male")==="male"&&headBone){
    const d=wp.distanceTo(headWorld)/Math.max(modelSize.x,modelSize.y,modelSize.z);
    const headMask=1-smoothstep(.035,.18,d);
    col=mixColor(col,breed,headMask*.72);
  }

  if(Number(state?.themeIndex)===1){
    const hsl={h:0,s:0,l:0};col.getHSL(hsl);
    col.setHSL((hsl.h+.035)%1,Math.min(1,hsl.s*1.08),Math.min(1,hsl.l*1.03));
  }
  return col;
}
function recolor(){
  if(!root||!state)return;
  root.updateMatrixWorld(true);
  worldBox.setFromObject(root);worldBox.getSize(modelSize);span.copy(modelSize);
  if(headBone)headBone.getWorldPosition(headWorld);

  for(const rec of meshRecords){
    const mesh=rec.mesh,pos=mesh.geometry.attributes.position;
    if(!pos)continue;
    const arr=new Float32Array(pos.count*3);
    const solid=rec.detail?solidColorForDetail(rec.detail):null;
    for(let i=0;i<pos.count;i++){
      temp.fromBufferAttribute(pos,i);
      mesh.localToWorld(temp);
      let col=solid;
      if(!col){
        const qx=(temp.x-worldBox.min.x)/Math.max(.0001,span.x);
        const qy=(temp.y-worldBox.min.y)/Math.max(.0001,span.y);
        const qz=(temp.z-worldBox.min.z)/Math.max(.0001,span.z);
        col=sampleSkinColor(qx,qy,qz,temp);
      }
      arr[i*3]=col.r;arr[i*3+1]=col.g;arr[i*3+2]=col.b;
    }
    mesh.geometry.setAttribute("color",new THREE.BufferAttribute(arr,3));
    mesh.geometry.attributes.color.needsUpdate=true;
    const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    mats.forEach(m=>{m.vertexColors=true;m.needsUpdate=true;});
  }
}
function startAnimation(gltf){
  mixer=null;
  if(!gltf.animations?.length)return;
  mixer=new THREE.AnimationMixer(root);
  const clip=gltf.animations.find(a=>/idle/i.test(a.name))||gltf.animations[0];
  mixer.clipAction(clip).reset().setLoop(THREE.LoopRepeat,Infinity).play();
}
function setViewMode(mode,force=false){
  if(!root)return;
  mode=mode==="2d"?"2d":"3d";
  shell.classList.toggle("mode-2d",mode==="2d");
  controls.enabled=mode==="3d";
  const h=Math.max(.7,modelSize.y*.43);
  const dist=Math.max(7.2,Math.max(modelSize.x,modelSize.z)*1.22);
  controls.target.set(0,h,0);

  if(mode==="2d"){
    // Fixed side-on live render. It is still the same coloured mesh, so every
    // colour/pattern change appears in both 2D and 3D views.
    if(longAxis==="x")camera.position.set(0,h,dist);
    else camera.position.set(dist,h,0);
    camera.fov=27;
  }else{
    if(longAxis==="x")camera.position.set(dist*.72,h+modelSize.y*.12,dist);
    else camera.position.set(dist,h+modelSize.y*.12,dist*.72);
    camera.fov=32;
  }
  camera.updateProjectionMatrix();controls.update();
}
function loadGLTF(url){
  if(cache.has(url))return cache.get(url);
  const p=new Promise((resolve,reject)=>loader.load(url,resolve,undefined,reject));
  cache.set(url,p);return p;
}
async function loadSpecies(next){
  state=next||state;if(!state)return;
  const slug=state.species?.slug||state.species||"tyrannosaurus";
  fallback.src=state.fallbackImage||state.species?.image||"";
  if(state.mode==="hq"){
    canvas.style.visibility="hidden";
    fallback.style.display="none";
    showLoading(false);showMessage("");
    return;
  }
  canvas.style.visibility="visible";
  const info=modelInfo(slug);

  if(!info){
    currentSlug=slug;disposeRoot();canvas.style.display="none";fallback.style.display="block";
    showLoading(false);
    showMessage("Exact licensed 3D model not added for this species yet. Showing the Evrima reference rather than a fake substitute.");
    status("fallback","EVRIMA REFERENCE · 3D PENDING");return;
  }

  if(slug===currentSlug&&root){
    canvas.style.display="block";fallback.style.display="none";showMessage("");
    recolor();setViewMode(state.mode||"3d");return;
  }

  currentSlug=slug;disposeRoot();
  canvas.style.display="block";fallback.style.display="none";showMessage("");
  showLoading(true,"Loading "+(state.species?.name||slug)+"…");status("loading","LOADING 3D…");

  try{
    const gltf=await loadGLTF(info.url);
    root=skeletonClone(gltf.scene);root.name="FOGGY_DinosaurPreview";
    scene.add(root);
    root.traverse(o=>{if(o.isMesh||o.isSkinnedMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
    headBone=findHead(root);
    fitModel();
    prepareMeshes();
    root.updateMatrixWorld(true);
    recolor();
    startAnimation(gltf);
    setViewMode(state.mode||"3d",true);
    showLoading(false);status(info.kind,info.label);
  }catch(err){
    console.error("[FOGGY Preview]",err);
    disposeRoot();canvas.style.display="none";fallback.style.display="block";showLoading(false);
    showMessage("3D model failed to load. Showing the Evrima reference image instead.");
    status("error","3D LOAD FAILED · REFERENCE SHOWN");
  }
}
function applyEnvironment(next){
  settings={...settings,...(next||{})};
  const mode=settings.scene||"studio";
  shell.className="viewer-shell scene-"+mode+(state?.mode==="2d"?" mode-2d":"");
  shell.style.filter=`brightness(${settings.brightness||1})`;
  key.intensity=3.4*(settings.lighting||1);
  rim.intensity=1.5*(settings.lighting||1);
  hemi.intensity=1.45*(settings.lighting||1);
  fill.intensity=.55*(settings.lighting||1);
  floor.visible=settings.background!==false;
  const cfg={
    jungle:{floor:0x1b281b,fog:0x111b14},
    lagoon:{floor:0x173134,fog:0x10252a},
    studio:{floor:0x22231e,fog:0x0c0e0b},
    night:{floor:0x10161a,fog:0x081018}
  }[mode];
  floorMat.color.setHex(cfg.floor);scene.fog=new THREE.FogExp2(cfg.fog,.018);
}
function resize(){
  const r=canvas.getBoundingClientRect();
  const w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}

window.addEventListener("resize",resize);
window.addEventListener("foggy:viewer-state",e=>{
  const prevSlug=state?.species?.slug||state?.species;
  const prevMode=state?.mode;
  state=e.detail;
  const nextSlug=state?.species?.slug||state?.species;
  if(state.mode==="hq"){
    canvas.style.visibility="hidden";fallback.style.display="none";showLoading(false);showMessage("");return;
  }
  canvas.style.visibility="visible";
  if(nextSlug!==prevSlug||!root||prevMode==="hq")loadSpecies(state);
  else{recolor();if(state.mode!==prevMode)setViewMode(state.mode);}
});
window.addEventListener("foggy:viewer-settings",e=>applyEnvironment(e.detail));
window.addEventListener("foggy:viewer-reset",()=>{if(root)setViewMode(state?.mode||"3d",true);});

resize();applyEnvironment(settings);
setTimeout(()=>{if(window.FOGGY_VIEWER_STATE)loadSpecies(window.FOGGY_VIEWER_STATE);},50);

function animate(){
  requestAnimationFrame(animate);
  resize();controls.update();
  const dt=Math.min(clock.getDelta(),.05);
  if(mixer&&settings.idle!==false)mixer.update(dt);
  renderer.render(scene,camera);
}
animate();
