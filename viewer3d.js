import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { clone as skeletonClone } from "three/addons/utils/SkeletonUtils.js";

const canvas=document.getElementById("viewer3d");
const fallback=document.getElementById("fallbackImage");
const loading=document.getElementById("viewerLoading");
const message=document.getElementById("viewerMessage");
const shell=document.getElementById("viewerShell");

const QUATERNIUS_CDN="https://cdn.jsdelivr.net/gh/Bleach4Ever/kid@main/public/models/";
const FALLBACK_MODELS={
  tyrannosaurus:{url:QUATERNIUS_CDN+"trex.glb",kind:"exact",label:"REAL 3D · TYRANNOSAURUS",source:"Quaternius",license:"CC0"},
  triceratops:{url:QUATERNIUS_CDN+"triceratops.glb",kind:"exact",label:"REAL 3D · TRICERATOPS",source:"Quaternius",license:"CC0"},
  stegosaurus:{url:QUATERNIUS_CDN+"stegosaurus.glb",kind:"exact",label:"REAL 3D · STEGOSAURUS",source:"Quaternius",license:"CC0"},
  omniraptor:{url:QUATERNIUS_CDN+"raptor.glb",kind:"proxy",label:"3D RAPTOR-FAMILY REFERENCE",source:"Quaternius",license:"CC0"},
  austroraptor:{url:QUATERNIUS_CDN+"raptor.glb",kind:"proxy",label:"3D RAPTOR-FAMILY REFERENCE",source:"Quaternius",license:"CC0"}
};

// Gobkit added a CC0 Dinosaur Pack in August 2026. The catalogue is fetched
// at runtime so exact species matches can become available without inventing
// a model or silently substituting a different dinosaur.
const GOBKIT_MANIFEST="https://gobkit.com/api/free";
const EXACT_ALIASES={
  tyrannosaurus:["tyrannosaurus","tyrannosaurusrex","trex"],
  allosaurus:["allosaurus"],
  austroraptor:["austroraptor"],
  carnotaurus:["carnotaurus"],
  ceratosaurus:["ceratosaurus"],
  deinosuchus:["deinosuchus"],
  dilophosaurus:["dilophosaurus"],
  herrerasaurus:["herrerasaurus"],
  omniraptor:["omniraptor"],
  pteranodon:["pteranodon"],
  troodon:["troodon"],
  triceratops:["triceratops"],
  stegosaurus:["stegosaurus"],
  diabloceratops:["diabloceratops"],
  kentrosaurus:["kentrosaurus"],
  tenontosaurus:["tenontosaurus"],
  maiasaura:["maiasaura"],
  pachycephalosaurus:["pachycephalosaurus"],
  dryosaurus:["dryosaurus"],
  hypsilophodon:["hypsilophodon"],
  gallimimus:["gallimimus"],
  beipiaosaurus:["beipiaosaurus"]
};
let gobkitPromise=null;
function normName(v){return String(v||"").toLowerCase().replace(/[^a-z0-9]/g,"");}
function getGobkitModels(){
  if(gobkitPromise)return gobkitPromise;
  gobkitPromise=fetch(GOBKIT_MANIFEST,{cache:"no-store"})
    .then(r=>{if(!r.ok)throw new Error("Gobkit manifest "+r.status);return r.json();})
    .then(data=>{
      const all=[];
      for(const pack of (Array.isArray(data.packs)?data.packs:[])){
        const packText=normName(pack.name||pack.id||pack.pack||pack.title);
        if(!packText.includes("dinosaur"))continue;
        for(const m of (Array.isArray(pack.models)?pack.models:[])){
          if(m&&m.url)all.push({...m,__pack:pack});
        }
      }
      return all;
    })
    .catch(err=>{console.warn("[FOGGY 3D] Gobkit catalogue unavailable:",err);return[];});
  return gobkitPromise;
}
async function resolveModel(slug){
  const aliases=EXACT_ALIASES[slug]||[slug];
  const models=await getGobkitModels();
  for(const m of models){
    const keys=[m.name,m.id,m.slug,m.filename,m.url?.split("/").pop()].map(normName);
    if(aliases.some(a=>keys.some(k=>k===a||k===a+"glb"))){
      return{
        url:m.url,kind:"exact",label:"REAL 3D · "+slug.replace(/(^|_)([a-z])/g,(_,p,c)=>c.toUpperCase()),
        source:"Gobkit Dinosaur Pack",license:"CC0",animations:m.animations||m.__pack?.animations||null,
        fps:Number(m.fps||m.__pack?.fps||24),animationMode:"manifest"
      };
    }
  }
  return FALLBACK_MODELS[slug]||null;
}

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:"high-performance"});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(34,1,.05,200);
camera.position.set(9,3.1,11);

const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.dampingFactor=.07;controls.enablePan=false;
controls.minDistance=4.2;controls.maxDistance=22;controls.target.set(0,1.2,0);
controls.maxPolarAngle=Math.PI*.58;controls.minPolarAngle=Math.PI*.18;

const hemi=new THREE.HemisphereLight(0xe8f0d6,0x172117,1.5);scene.add(hemi);
const key=new THREE.DirectionalLight(0xfff3d0,3.2);key.position.set(6,9,7);key.castShadow=true;scene.add(key);
const rim=new THREE.DirectionalLight(0x91d8ce,1.8);rim.position.set(-7,4,-6);scene.add(rim);
const fill=new THREE.DirectionalLight(0xb8b6a0,.65);fill.position.set(2,2,-6);scene.add(fill);

const environment=new THREE.Group();scene.add(environment);
let ground=null;
function makeEnvironment(){
  environment.clear();
  const groundMat=new THREE.MeshStandardMaterial({color:0x273123,roughness:1,metalness:0});
  ground=new THREE.Mesh(new THREE.CircleGeometry(7.5,64),groundMat);
  ground.rotation.x=-Math.PI/2;ground.position.y=-.04;ground.receiveShadow=true;environment.add(ground);
  // Low-detail scene silhouettes — deliberately secondary to the dinosaur.
  for(let i=0;i<8;i++){
    const a=(i/8)*Math.PI*2,r=5.5+(i%3)*.8;
    const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.45+(i%2)*.22,0),new THREE.MeshStandardMaterial({color:0x30372a,roughness:1}));
    rock.position.set(Math.cos(a)*r,.22,Math.sin(a)*r);rock.scale.y=.55;rock.rotation.set(.2*i,.4*i,.1*i);environment.add(rock);
  }
  for(let i=0;i<7;i++){
    const a=(i/7)*Math.PI*2+.4,r=6.4+(i%2)*.6;
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.10,.15,2.5,7),new THREE.MeshStandardMaterial({color:0x2e291d,roughness:1}));
    trunk.position.set(Math.cos(a)*r,1.25,Math.sin(a)*r);environment.add(trunk);
    const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.8,1),new THREE.MeshStandardMaterial({color:0x203720,roughness:1}));
    crown.position.set(trunk.position.x,2.55,trunk.position.z);crown.scale.set(1.1,.8,1.1);environment.add(crown);
  }
}
makeEnvironment();

const loader=new GLTFLoader();
let root=null,mixer=null,clock=new THREE.Clock(),currentSlug="",currentModelInfo=null;
let modelBox=new THREE.Box3(),modelSize=new THREE.Vector3(),modelCenter=new THREE.Vector3();
let shaderMaterials=[],headBone=null;
let state=window.FOGGY_VIEWER_STATE||null;
let settings=window.FOGGY_VIEWER_SETTINGS||{scene:"jungle",background:true,brightness:.82,lighting:.9,idle:true};

const tmpHead=new THREE.Vector3();
const loaderCache=new Map();

function setStatus(kind,label){
  window.dispatchEvent(new CustomEvent("foggy:model-status",{detail:{kind,label}}));
}
function showLoading(on,text="Loading dinosaur model…"){
  if(text)loading.querySelector("span").textContent=text;
  loading.classList.toggle("hidden",!on);
}
function showMessage(text){
  message.textContent=text||"";message.classList.toggle("show",Boolean(text));
}
function disposeRoot(){
  if(!root)return;
  scene.remove(root);
  root.traverse(o=>{
    if(o.material && o.material.userData && o.material.userData.foggyClone)o.material.dispose();
  });
  root=null;mixer=null;shaderMaterials=[];headBone=null;
}
function findHeadBone(object){
  let best=null;
  object.traverse(o=>{
    if(!o.isBone)return;
    const n=String(o.name||"").toLowerCase();
    if(!best && (n.includes("head")||n==="skull"||n.includes("neck_03")||n.includes("neck3")))best=o;
  });
  return best;
}
function smoothMaterials(object){
  object.traverse(o=>{
    if(!o.isMesh&&!o.isSkinnedMesh)return;
    if(o.geometry && !o.geometry.attributes.normal) o.geometry.computeVertexNormals();
    o.castShadow=true;o.receiveShadow=true;
  });
}
function classifyDetail(name){
  name=String(name||"").toLowerCase();
  if(name.includes("eye"))return"eyes";
  if(name.includes("teeth")||name.includes("tooth"))return"teeth";
  if(name.includes("mouth")||name.includes("tongue")||name.includes("gum"))return"mouth";
  if(name.includes("claw")||name.includes("nail")||name.includes("talon"))return"claws";
  return null;
}
function addSkinShader(mesh,baseMaterial,detailClass){
  const mat=(baseMaterial&&baseMaterial.isMaterial?baseMaterial.clone():new THREE.MeshStandardMaterial());
  mat.userData.foggyClone=true;
  mat.roughness=detailClass==="eyes"?.22:Math.max(.48,mat.roughness??.76);
  mat.metalness=0;
  if(!mat.color)mat.color=new THREE.Color(0xffffff);
  mat.color.set(0xffffff);
  mat.flatShading=false;
  mat.needsUpdate=true;

  mat.onBeforeCompile=shader=>{
    const U={
      body:{value:new THREE.Color("#6D706B")},markings:{value:new THREE.Color("#343A35")},
      flank:{value:new THREE.Color("#7C8179")},belly:{value:new THREE.Color("#A5A49A")},
      detail:{value:new THREE.Color("#49504A")},breed:{value:new THREE.Color("#687A5A")},
      eyes:{value:new THREE.Color("#D59B36")},teeth:{value:new THREE.Color("#D8CFAC")},
      mouth:{value:new THREE.Color("#6B3037")},claws:{value:new THREE.Color("#333333")},
      min:{value:new THREE.Vector3(-1,-1,-1)},max:{value:new THREE.Vector3(1,1,1)},
      head:{value:new THREE.Vector3(1,1,1)},pattern:{value:0},variation:{value:1},
      theme:{value:0},sex:{value:1},strength:{value:1},detailClass:{value:detailClass?1:0}
    };
    shader.uniforms.uFoggyBody=U.body;shader.uniforms.uFoggyMarkings=U.markings;
    shader.uniforms.uFoggyFlank=U.flank;shader.uniforms.uFoggyBelly=U.belly;
    shader.uniforms.uFoggyDetail=U.detail;shader.uniforms.uFoggyBreed=U.breed;
    shader.uniforms.uFoggyEyes=U.eyes;shader.uniforms.uFoggyTeeth=U.teeth;
    shader.uniforms.uFoggyMouth=U.mouth;shader.uniforms.uFoggyClaws=U.claws;
    shader.uniforms.uFoggyMin=U.min;shader.uniforms.uFoggyMax=U.max;shader.uniforms.uFoggyHead=U.head;
    shader.uniforms.uFoggyPattern=U.pattern;shader.uniforms.uFoggyVariation=U.variation;
    shader.uniforms.uFoggyTheme=U.theme;shader.uniforms.uFoggySex=U.sex;shader.uniforms.uFoggyStrength=U.strength;
    shader.uniforms.uFoggyDetailClass={value:detailClass==="eyes"?1:detailClass==="teeth"?2:detailClass==="mouth"?3:detailClass==="claws"?4:0};

    shader.vertexShader=shader.vertexShader.replace(
      "#include <common>",
      "#include <common>\\nvarying vec3 vFoggyWorld;"
    );
    shader.vertexShader=shader.vertexShader.replace(
      "#include <project_vertex>",
      "vFoggyWorld=(modelMatrix*vec4(transformed,1.0)).xyz;\\n#include <project_vertex>"
    );

    shader.fragmentShader=shader.fragmentShader.replace(
      "#include <common>",
`#include <common>
varying vec3 vFoggyWorld;
uniform vec3 uFoggyBody,uFoggyMarkings,uFoggyFlank,uFoggyBelly,uFoggyDetail,uFoggyBreed;
uniform vec3 uFoggyEyes,uFoggyTeeth,uFoggyMouth,uFoggyClaws;
uniform vec3 uFoggyMin,uFoggyMax,uFoggyHead;
uniform float uFoggyPattern,uFoggyVariation,uFoggyTheme,uFoggySex,uFoggyStrength,uFoggyDetailClass;

float foggyHash(vec2 p){
  return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);
}
float foggyPattern(vec3 q){
  float f=mix(11.0,4.5,clamp(uFoggyVariation/2.0,0.0,1.0));
  float p=0.0;
  if(uFoggyPattern<0.5){
    p=smoothstep(.22,.78,.5+.5*sin((q.x*1.1+q.z*.22)*f*6.283));
  }else if(uFoggyPattern<1.5){
    vec2 cell=floor(vec2(q.x,q.z)*f);
    vec2 uv=fract(vec2(q.x,q.z)*f)-.5;
    float d=length(uv+vec2((foggyHash(cell)-.5)*.28,(foggyHash(cell+3.7)-.5)*.28));
    p=1.0-smoothstep(.18,.38,d);
  }else if(uFoggyPattern<2.5){
    p=smoothstep(.35,.72,.5+.5*sin((q.x*1.5-q.z*.5)*f*4.2+sin(q.x*f*2.0)));
  }else if(uFoggyPattern<3.5){
    float a=sin(q.x*f*5.4)+sin(q.z*f*4.1)+sin((q.x+q.z)*f*2.4);
    p=smoothstep(.35,1.15,a);
  }else{
    float a=sin(q.x*f*6.0)*sin(q.z*f*5.0);
    p=smoothstep(.05,.62,abs(a));
  }
  return p;
}
vec3 foggySkin(vec3 wp){
  vec3 span=max(uFoggyMax-uFoggyMin,vec3(.001));
  vec3 q=clamp((wp-uFoggyMin)/span,0.0,1.0);
  vec3 col=uFoggyBody;

  float belly=1.0-smoothstep(.18,.43,q.y);
  col=mix(col,uFoggyBelly,belly*.94);

  float flank=smoothstep(.30,.48,q.y)*(1.0-smoothstep(.64,.82,q.y));
  col=mix(col,uFoggyFlank,flank*.55);

  float mark=foggyPattern(q);
  float markRegion=smoothstep(.31,.47,q.y)*(1.0-smoothstep(.88,.98,q.y));
  col=mix(col,uFoggyMarkings,mark*markRegion*.82);

  float dorsal=smoothstep(.70,.94,q.y)*(1.0-belly);
  col=mix(col,uFoggyDetail,dorsal*.38);

  float headRadius=length((wp-uFoggyHead)/span);
  float display=(1.0-smoothstep(.04,.20,headRadius))*smoothstep(.54,.90,q.y)*uFoggySex;
  col=mix(col,uFoggyBreed,display*.82);

  // Tiny tonal breakup makes the untextured CC0 mesh read more like skin under PBR light.
  float grain=(foggyHash(floor((q.xz+q.yy*.31)*48.0))-.5)*.07;
  col*=1.0+grain;
  if(uFoggyTheme>.5) col=mix(col,col.bgr,0.07);
  return clamp(col,0.0,1.0);
}`
    );

    shader.fragmentShader=shader.fragmentShader.replace(
      "#include <map_fragment>",
`#include <map_fragment>
vec3 foggyTarget=foggySkin(vFoggyWorld);
if(uFoggyDetailClass>0.5&&uFoggyDetailClass<1.5)foggyTarget=uFoggyEyes;
else if(uFoggyDetailClass>1.5&&uFoggyDetailClass<2.5)foggyTarget=uFoggyTeeth;
else if(uFoggyDetailClass>2.5&&uFoggyDetailClass<3.5)foggyTarget=uFoggyMouth;
else if(uFoggyDetailClass>3.5)foggyTarget=uFoggyClaws;
diffuseColor.rgb=mix(diffuseColor.rgb,foggyTarget,uFoggyStrength);`
    );

    mat.userData.foggyShader=shader;
    mat.userData.foggyUniforms=U;
    updateOneMaterial(mat);
  };
  mesh.material=mat;shaderMaterials.push(mat);
}
function applyMaterials(object){
  shaderMaterials=[];
  object.traverse(o=>{
    if(!o.isMesh&&!o.isSkinnedMesh)return;
    const detail=classifyDetail((o.name||"")+" "+(o.material?.name||""));
    if(Array.isArray(o.material)){
      o.material=o.material.map(m=>{
        const holder={material:null};
        const cloneMesh={...o,material:m};
        // Array-material meshes are uncommon in this pack. Preserve first material behaviour.
        const c=m.clone();c.userData.foggyClone=true;return c;
      });
    }else addSkinShader(o,o.material,detail);
  });
}
function updateBounds(){
  if(!root)return;
  root.updateMatrixWorld(true);modelBox.setFromObject(root);
  modelBox.getSize(modelSize);modelBox.getCenter(modelCenter);
  shaderMaterials.forEach(mat=>{
    const u=mat.userData.foggyUniforms;if(!u)return;
    u.min.value.copy(modelBox.min);u.max.value.copy(modelBox.max);
  });
}
function updateHead(){
  if(!headBone)return;
  headBone.getWorldPosition(tmpHead);
  shaderMaterials.forEach(mat=>{const u=mat.userData.foggyUniforms;if(u)u.head.value.copy(tmpHead);});
}
function updateOneMaterial(mat){
  const u=mat.userData.foggyUniforms;if(!u||!state)return;
  const c=state.colors||{};
  for(const [k,target] of Object.entries({
    body:u.body,markings:u.markings,flank:u.flank,underbelly:u.belly,detail:u.detail,
    breed:u.breed,eyes:u.eyes,teeth:u.teeth,mouth:u.mouth,claws:u.claws
  })) if(c[k]) target.value.set(c[k]);
  u.pattern.value=Number(state.patternIndex)||0;u.variation.value=Number(state.skinVariation)||0;
  u.theme.value=Number(state.themeIndex)||0;u.sex.value=state.previewSex==="female"?0:1;u.strength.value=1;
}
function updateMaterials(){shaderMaterials.forEach(updateOneMaterial);}
function fitModel(){
  if(!root)return;
  updateBounds();
  const maxDim=Math.max(modelSize.x,modelSize.y,modelSize.z)||1;
  const scale=6.6/maxDim;root.scale.multiplyScalar(scale);
  root.updateMatrixWorld(true);modelBox.setFromObject(root);modelBox.getCenter(modelCenter);modelBox.getSize(modelSize);
  root.position.x-=modelCenter.x;root.position.z-=modelCenter.z;root.position.y-=modelBox.min.y;
  root.updateMatrixWorld(true);updateBounds();
  controls.target.set(0,Math.max(.8,modelSize.y*.42),0);
  const dist=Math.max(7.6,Math.max(modelSize.x,modelSize.z)*1.25);
  camera.position.set(dist*.78,Math.max(2.6,modelSize.y*.55),dist);
  controls.update();
}
function startAnimation(gltf,info){
  mixer=null;
  if(!gltf.animations||!gltf.animations.length)return;
  mixer=new THREE.AnimationMixer(root);
  let clip=gltf.animations.find(a=>/idle/i.test(a.name));
  if(!clip&&info&&Array.isArray(info.animations)&&gltf.animations[0]){
    const idle=info.animations.find(a=>String(a.name||"").toLowerCase()==="idle");
    if(idle&&Number.isFinite(Number(idle.from))&&Number.isFinite(Number(idle.to))){
      clip=THREE.AnimationUtils.subclip(
        gltf.animations[0],
        "FOGGY_Idle",
        Number(idle.from),
        Number(idle.to)+1,
        Number(info.fps)||24
      );
    }
  }
  clip=clip||gltf.animations[0];
  const action=mixer.clipAction(clip);action.reset().setLoop(THREE.LoopRepeat,Infinity).play();
}
async function loadGLTF(url){
  if(loaderCache.has(url))return loaderCache.get(url);
  const p=new Promise((resolve,reject)=>loader.load(url,resolve,undefined,reject));
  loaderCache.set(url,p);return p;
}
async function loadSpecies(next){
  state=next||state;if(!state)return;
  const slug=state.species?.slug||state.species||"tyrannosaurus";
  fallback.src=state.fallbackImage||state.species?.image||"";
  if(!state.enabled){
    disposeRoot();canvas.style.display="none";fallback.style.display="block";
    showLoading(false);showMessage("");setStatus("fallback","2D REFERENCE");return;
  }
  const info=await resolveModel(slug);
  if(!info){
    disposeRoot();canvas.style.display="none";fallback.style.display="block";
    showLoading(false);
    showMessage("A licensed species-specific 3D model has not been added for this dinosaur yet. Showing the exact Evrima species reference instead — no fake geometry.");
    setStatus("fallback","EVRIMA REFERENCE · EXACT 3D PENDING");return;
  }
  if(slug===currentSlug&&root){
    canvas.style.display="block";fallback.style.display="none";showMessage("");updateMaterials();return;
  }
  currentSlug=slug;currentModelInfo=info;disposeRoot();
  canvas.style.display="block";fallback.style.display="none";showMessage("");
  showLoading(true,"Loading "+(state.species?.name||slug)+" 3D model…");setStatus("loading","LOADING 3D…");
  try{
    const gltf=await loadGLTF(info.url);
    // Clone scene graph enough for a single active model.
    root=skeletonClone(gltf.scene);root.name="FOGGY_DinosaurPreview";
    scene.add(root);smoothMaterials(root);headBone=findHeadBone(root);applyMaterials(root);
    fitModel();startAnimation(gltf,info);updateMaterials();updateHead();
    showLoading(false);setStatus(info.kind,info.label);
  }catch(err){
    console.error("[FOGGY 3D]",err);
    disposeRoot();canvas.style.display="none";fallback.style.display="block";showLoading(false);
    showMessage("The 3D model could not load. The exact Evrima species reference is being used instead.");
    setStatus("error","3D LOAD FAILED · REFERENCE SHOWN");
  }
}
function setEnvironment(next){
  settings={...settings,...(next||{})};
  shell.className="viewer-shell scene-"+(settings.scene||"jungle");
  shell.style.filter=`brightness(${settings.brightness||1})`;
  key.intensity=3.2*(settings.lighting||1);rim.intensity=1.8*(settings.lighting||1);
  hemi.intensity=1.5*(settings.lighting||1);fill.intensity=.65*(settings.lighting||1);
  environment.visible=settings.background!==false;
  if(!ground)return;
  const mode=settings.scene||"jungle";
  const cfg={
    jungle:{ground:0x273123,fog:0x17231a},
    lagoon:{ground:0x1f3838,fog:0x1d3c40},
    studio:{ground:0x24251f,fog:0x121411},
    night:{ground:0x11191a,fog:0x09111b}
  }[mode];
  ground.material.color.setHex(cfg.ground);
  scene.fog=new THREE.FogExp2(cfg.fog,.025);
}
function resize(){
  const r=canvas.getBoundingClientRect(),w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
window.addEventListener("resize",resize);
window.addEventListener("foggy:viewer-state",e=>{state=e.detail;loadSpecies(state);});
window.addEventListener("foggy:viewer-settings",e=>setEnvironment(e.detail));
window.addEventListener("foggy:viewer-reset",()=>{if(root)fitModel();});

resize();setEnvironment(settings);
if(window.FOGGY_VIEWER_STATE)loadSpecies(window.FOGGY_VIEWER_STATE);
else setTimeout(()=>{if(window.FOGGY_VIEWER_STATE)loadSpecies(window.FOGGY_VIEWER_STATE);},100);

function animate(){
  requestAnimationFrame(animate);resize();controls.update();
  const dt=Math.min(clock.getDelta(),.05);
  if(mixer&&settings.idle!==false)mixer.update(dt);
  if(root){root.updateMatrixWorld(true);updateHead();}
  renderer.render(scene,camera);
}
animate();
