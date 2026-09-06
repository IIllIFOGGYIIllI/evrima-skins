import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js";

const canvas = document.getElementById("dino3d");
const loading = document.getElementById("viewerLoading");
const resetButton = document.getElementById("resetView");

if (!canvas) {
  throw new Error("FOGGY 3D preview canvas not found");
}

const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x071012, 0.018);

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
let camDist = 11.5, yaw = -0.38, pitch = 0.06;
const target = new THREE.Vector3(0,0.65,0);

scene.add(new THREE.HemisphereLight(0xc9fffb,0x122021,2.0));
const key = new THREE.DirectionalLight(0xffffff, 3.1);
key.position.set(5,8,6);key.castShadow=true;scene.add(key);
const rim = new THREE.DirectionalLight(0x54e8e2, 2.1);
rim.position.set(-6,3,-6);scene.add(rim);
const fill = new THREE.DirectionalLight(0xffd8ad, 0.8);
fill.position.set(3,2,-5);scene.add(fill);

const floorMat = new THREE.MeshStandardMaterial({color:0x071315,roughness:1,metalness:0});
const floor = new THREE.Mesh(new THREE.CircleGeometry(6.5,64), floorMat);
floor.rotation.x=-Math.PI/2;floor.position.y=-1.55;floor.receiveShadow=true;scene.add(floor);

const shadow = new THREE.Mesh(
  new THREE.CircleGeometry(3.6,64),
  new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.22,depthWrite:false})
);
shadow.rotation.x=-Math.PI/2;shadow.position.y=-1.525;shadow.scale.set(1.7,.65,1);scene.add(shadow);

const materials = {};
const materialKeys=["body","markings","flank","underbelly","detail","eyes","breed","teeth","mouth","claws"];
materialKeys.forEach(k=>{
  materials[k]=new THREE.MeshStandardMaterial({
    color:0xffffff,roughness:k==="eyes"?.22:.72,metalness:k==="eyes"?.05:0,
    emissive:k==="eyes"?0x050505:0x000000,emissiveIntensity:k==="eyes"?.25:0
  });
});
materials.mouth.roughness=.92;
materials.teeth.roughness=.58;
materials.claws.roughness=.48;

const GEOS = {
  sphere: new THREE.SphereGeometry(1,28,16),
  lowSphere: new THREE.SphereGeometry(1,18,10),
  cyl: new THREE.CylinderGeometry(1,1,1,14,1),
  cone: new THREE.ConeGeometry(1,1,14,1),
  box: new THREE.BoxGeometry(1,1,1),
};

let modelRoot = new THREE.Group();
scene.add(modelRoot);

function mesh(geo,mat,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0]){
  const m=new THREE.Mesh(geo,mat);
  m.position.set(...pos);m.scale.set(...scale);m.rotation.set(...rot);
  m.castShadow=true;m.receiveShadow=true;modelRoot.add(m);return m;
}
function ellipsoid(mat,pos,scale,rot=[0,0,0]){return mesh(GEOS.sphere,materials[mat],pos,scale,rot)}
function lowEllipsoid(mat,pos,scale,rot=[0,0,0]){return mesh(GEOS.lowSphere,materials[mat],pos,scale,rot)}
function box(mat,pos,scale,rot=[0,0,0]){return mesh(GEOS.box,materials[mat],pos,scale,rot)}

function limb(mat,a,b,r=.16,r2=null){
  const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),mid=A.clone().add(B).multiplyScalar(.5);
  const len=A.distanceTo(B);
  const geo=r2==null?GEOS.cyl:new THREE.CylinderGeometry(r2,r,1,12,1);
  const m=new THREE.Mesh(geo,materials[mat]);m.position.copy(mid);m.scale.set(r,len,r);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize());
  m.castShadow=true;m.receiveShadow=true;modelRoot.add(m);return m;
}
function spike(mat,base,tip,r=.12){
  const A=new THREE.Vector3(...base),B=new THREE.Vector3(...tip),mid=A.clone().add(B).multiplyScalar(.5),len=A.distanceTo(B);
  const m=new THREE.Mesh(GEOS.cone,materials[mat]);m.position.copy(mid);m.scale.set(r,len,r);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize());
  m.castShadow=true;modelRoot.add(m);return m;
}
function eyePair(x,y,z,sep=.36,size=.07){
  ellipsoid("eyes",[x,y,z+sep],[size,size,size]);
  ellipsoid("eyes",[x,y,z-sep],[size,size,size]);
}
function teethRow(x,y,zStart,zEnd,count=6,scale=.05){
  for(let i=0;i<count;i++){
    const z=THREE.MathUtils.lerp(zStart,zEnd,count===1?.5:i/(count-1));
    spike("teeth",[x,y,z],[x,y-.16,z],scale);
  }
}
function clawsAt(x,y,z,dir=1,count=3,spacing=.10){
  for(let i=0;i<count;i++){
    const zz=z+(i-(count-1)/2)*spacing;
    spike("claws",[x,y,zz],[x+.22*dir,y-.04,zz],.045);
  }
}
function dorsalBands(xs,y,z,scaleX=.08,height=.85,depth=.78){
  xs.forEach((x,i)=>box("markings",[x,y,z],[scaleX,height,depth],[0,0,(i%2?-.12:.12)]));
}
function tailChain(points,mat="body",r=.42){
  for(let i=0;i<points.length-1;i++) limb(mat,points[i],points[i+1],Math.max(.08,r*(1-i/(points.length+1))));
}

function buildTheropod(c){
  ellipsoid("body",[0,.45,0],[2.05*c.bodyLen,.88*c.bodyHt,.72*c.width]);
  ellipsoid("underbelly",[.05,.03,0],[1.75*c.bodyLen,.47*c.bodyHt,.62*c.width]);
  ellipsoid("flank",[.05,.55,.67*c.width],[1.48*c.bodyLen,.52*c.bodyHt,.09]);
  ellipsoid("flank",[.05,.55,-.67*c.width],[1.48*c.bodyLen,.52*c.bodyHt,.09]);

  tailChain([[-1.65*c.bodyLen,.55,0],[-2.65*c.tail,.42,0],[-3.55*c.tail,.28,0],[-4.25*c.tail,.18,0]],"body",.42*c.width);

  limb("body",[1.05,.72,0],[1.65,1.18,0],.38*c.neck);
  ellipsoid("body",[1.92,1.26,0],[.80*c.head, .50*c.headH,.52*c.headW]);
  ellipsoid("body",[2.55,1.20,0],[.62*c.snout,.30*c.headH,.44*c.headW]);
  box("mouth",[2.50,1.03,0],[.72*c.snout,.10,.42*c.headW]);
  teethRow(2.60,1.02,-.34*c.headW,.34*c.headW,6,.045*c.head);
  eyePair(2.10,1.47,0,.39*c.headW,.065*c.eye);

  dorsalBands([-.9,-.35,.2,.75],.75,0,.075,.62*c.bodyHt,.76*c.width);

  const legX=[-.55,.78];
  for(const x of legX){
    limb("body",[x,.16,.43*c.width],[x-.10,-.70,.48*c.width],.24*c.leg);
    limb("body",[x-.10,-.70,.48*c.width],[x+.10,-1.28,.47*c.width],.18*c.leg);
    limb("body",[x,.16,-.43*c.width],[x-.10,-.70,-.48*c.width],.24*c.leg);
    limb("body",[x-.10,-.70,-.48*c.width],[x+.10,-1.28,-.47*c.width],.18*c.leg);
    clawsAt(x+.10,-1.31,.49*c.width,1,3,.10);
    clawsAt(x+.10,-1.31,-.49*c.width,1,3,.10);
  }

  const armX=1.25;
  limb("body",[armX,.83,.40*c.width],[armX+.28,.38,.52*c.width],.10*c.arm);
  limb("body",[armX+.28,.38,.52*c.width],[armX+.52,.24,.56*c.width],.075*c.arm);
  limb("body",[armX,.83,-.40*c.width],[armX+.28,.38,-.52*c.width],.10*c.arm);
  limb("body",[armX+.28,.38,-.52*c.width],[armX+.52,.24,-.56*c.width],.075*c.arm);
  clawsAt(armX+.52,.22,.56*c.width,1,2,.07);clawsAt(armX+.52,.22,-.56*c.width,1,2,.07);

  if(c.horns==="carno"){
    spike("breed",[2.02,1.68,.28],[2.02,2.06,.34],.13);
    spike("breed",[2.02,1.68,-.28],[2.02,2.06,-.34],.13);
  }
  if(c.horns==="cerato") spike("breed",[2.35,1.58,0],[2.58,1.95,0],.14);
  if(c.crests==="dilo"){
    for(const z of [-.19,.19]){
      box("detail",[2.06,1.72,z],[.42,.10,.055],[0,0,.55]);
      box("detail",[2.22,1.87,z],[.34,.08,.055],[0,0,.92]);
    }
  }
  if(c.feathers){
    for(let i=0;i<8;i++){
      const x=-1.4+i*.38;
      spike(i%2?"detail":"breed",[x,.95,.38],[x-.12,1.28,.58],.07);
      spike(i%2?"detail":"breed",[x,.95,-.38],[x-.12,1.28,-.58],.07);
    }
  }
  if(c.pachyTailTuft){
    for(let i=0;i<7;i++) spike("detail",[-3.75,.25,0],[-4.15,.35,(i-3)*.10],.055);
  }
}

function buildCroc(){
  ellipsoid("body",[0,.05,0],[2.55,.43,.95]);
  ellipsoid("underbelly",[.05,-.25,0],[2.25,.20,.78]);
  ellipsoid("flank",[.10,.08,.88],[1.95,.30,.08]);ellipsoid("flank",[.10,.08,-.88],[1.95,.30,.08]);
  ellipsoid("body",[2.35,.15,0],[1.05,.40,.78]);ellipsoid("body",[3.18,.10,0],[.72,.26,.62]);
  box("mouth",[3.20,-.03,0],[.80,.09,.55]);teethRow(3.43,.02,-.48,.48,8,.045);
  eyePair(2.56,.45,0,.53,.075);
  tailChain([[-2.2,.05,0],[-3.2,.0,0],[-4.1,-.03,0],[-4.9,-.08,0]],"body",.48);
  dorsalBands([-1.7,-1.1,-.5,.1,.7,1.3,1.9],.42,0,.055,.22,.88);
  for(const x of [-1.25,1.1])for(const side of [-1,1]){
    const z=.75*side;limb("body",[x,-.02,z],[x-.18,-.55,z+(.38*side)],.15);
    limb("body",[x-.18,-.55,z+(.38*side)],[x+.18,-.75,z+(.52*side)],.11);
    clawsAt(x+.18,-.78,z+(.52*side),1,4,.075);
  }
}

function wing(mat, side=1){
  const g=new THREE.BufferGeometry();
  const verts=new Float32Array([
    .35,.65,.18*side,  -.75,.25,2.95*side,  -2.15,.10,4.2*side,
    .35,.65,.18*side,  -2.15,.10,4.2*side,  -1.0,-.2,1.2*side
  ]);
  g.setAttribute("position",new THREE.BufferAttribute(verts,3));g.computeVertexNormals();
  const m=new THREE.Mesh(g,materials[mat]);m.castShadow=true;m.receiveShadow=true;modelRoot.add(m);
}
function buildPteranodon(){
  ellipsoid("body",[0,.30,0],[.95,.36,.34]);ellipsoid("underbelly",[.10,.12,0],[.72,.16,.28]);
  limb("body",[.55,.45,0],[1.08,.72,0],.18);ellipsoid("body",[1.28,.77,0],[.48,.25,.28]);
  box("body",[1.82,.75,0],[.72,.10,.17]);box("mouth",[2.10,.69,0],[.32,.045,.15]);eyePair(1.35,.88,0,.22,.05);
  spike("breed",[1.08,.92,0],[.20,1.24,0],.10);
  wing("flank",1);wing("flank",-1);
  limb("detail",[.20,.55,.18],[ -.8,.35,2.9],.08);limb("detail",[.20,.55,-.18],[-.8,.35,-2.9],.08);
  tailChain([[-.65,.33,0],[-1.25,.28,0],[-1.8,.22,0]],"body",.11);
  limb("body",[.15,.08,.18],[.18,-.65,.34],.07);limb("body",[.15,.08,-.18],[.18,-.65,-.34],.07);
  clawsAt(.18,-.69,.34,1,3,.06);clawsAt(.18,-.69,-.34,1,3,.06);
}

function buildCeratopsian(diablo=false){
  ellipsoid("body",[-.25,.30,0],[2.10,.86,.88]);ellipsoid("underbelly",[-.12,-.12,0],[1.72,.39,.72]);
  ellipsoid("flank",[-.10,.38,.83],[1.55,.49,.08]);ellipsoid("flank",[-.10,.38,-.83],[1.55,.49,.08]);
  tailChain([[-1.9,.35,0],[-2.8,.30,0],[-3.55,.24,0]],"body",.36);
  limb("body",[1.18,.48,0],[1.72,.82,0],.42);
  ellipsoid("body",[1.83,.76,0],[.78,.55,.58]);box("mouth",[2.35,.55,0],[.50,.20,.40]);
  eyePair(1.92,.94,0,.42,.065);
  const frill=new THREE.Mesh(new THREE.CylinderGeometry(.95,.95,.18,22),materials.detail);
  frill.position.set(1.35,1.10,0);frill.rotation.z=Math.PI/2;frill.castShadow=true;modelRoot.add(frill);
  if(diablo){
    spike("breed",[1.45,1.58,.50],[.75,2.18,.78],.16);spike("breed",[1.45,1.58,-.50],[.75,2.18,-.78],.16);
    spike("breed",[2.18,1.06,.24],[2.70,1.40,.32],.13);spike("breed",[2.18,1.06,-.24],[2.70,1.40,-.32],.13);
  }else{
    spike("breed",[2.05,1.05,.27],[2.75,1.52,.34],.14);spike("breed",[2.05,1.05,-.27],[2.75,1.52,-.34],.14);
    spike("breed",[2.47,.92,0],[2.92,1.12,0],.12);
  }
  dorsalBands([-.9,-.3,.3,.85],.72,0,.07,.38,.84);
  for(const x of [-1.05,.80])for(const side of [-1,1]){
    const z=.55*side;limb("body",[x,.05,z],[x,-.78,.62*side],.25);limb("body",[x,-.78,.62*side],[x+.10,-1.28,.60*side],.21);clawsAt(x+.1,-1.31,.60*side,1,3,.09);
  }
}

function buildStegosaur(kentro=false){
  ellipsoid("body",[-.25,.40,0],[2.20,.84,.86]);ellipsoid("underbelly",[-.1,-.02,0],[1.85,.38,.72]);
  ellipsoid("flank",[-.15,.48,.80],[1.70,.48,.08]);ellipsoid("flank",[-.15,.48,-.80],[1.70,.48,.08]);
  tailChain([[-1.85,.45,0],[-2.8,.30,0],[-3.75,.15,0],[-4.45,.10,0]],"body",.32);
  limb("body",[1.22,.55,0],[1.77,.68,0],.32);ellipsoid("body",[2.05,.65,0],[.52,.33,.39]);box("mouth",[2.38,.52,0],[.36,.13,.30]);eyePair(2.05,.79,0,.29,.05);
  const plateCount=kentro?7:9;
  for(let i=0;i<plateCount;i++){
    const x=-1.45+i*(2.7/(plateCount-1));
    const h=(kentro?.32:.58)*(1-Math.abs(i-(plateCount-1)/2)/(plateCount+1))+.22;
    if(kentro) spike("detail",[x,1.05,0],[x-.08,1.05+h,.02],.10);
    else{
      const p=new THREE.Mesh(new THREE.ConeGeometry(.28,h,4),materials.detail);p.position.set(x,1.03+h/2,0);p.rotation.y=Math.PI/4;p.castShadow=true;modelRoot.add(p);
    }
  }
  dorsalBands([-.9,-.3,.35,.9],.66,0,.055,.34,.82);
  for(const x of [-1.05,.82])for(const side of [-1,1]){
    const z=.53*side;limb("body",[x,.05,z],[x,-.72,.59*side],.23);limb("body",[x,-.72,.59*side],[x+.08,-1.25,.58*side],.18);clawsAt(x+.08,-1.28,.58*side,1,3,.08);
  }
  const tailX=-4.10;
  for(const side of [-1,1]){
    spike("breed",[tailX,.16,.08*side],[tailX-.62,.66,.55*side],.11);
    spike("breed",[tailX-.18,.10,.10*side],[tailX-.78,-.05,.62*side],.11);
  }
}

function buildOrnithopod(c={}){
  ellipsoid("body",[-.15,.43,0],[1.82*c.len,.74*c.ht,.68*c.w]);
  ellipsoid("underbelly",[-.05,.06,0],[1.48*c.len,.34*c.ht,.57*c.w]);
  ellipsoid("flank",[-.1,.48,.64*c.w],[1.34*c.len,.42*c.ht,.07]);ellipsoid("flank",[-.1,.48,-.64*c.w],[1.34*c.len,.42*c.ht,.07]);
  tailChain([[-1.55*c.len,.48,0],[-2.55*c.tail,.40,0],[-3.45*c.tail,.30,0],[-4.05*c.tail,.24,0]],"body",.32*c.w);
  limb("body",[1.05,.66,0],[1.55,.95,0],.26);ellipsoid("body",[1.79,1.01,0],[.55*c.head,.38*c.head,.40*c.head]);box("mouth",[2.18,.86,0],[.38*c.head,.15,.31*c.head]);eyePair(1.88,1.15,0,.31*c.head,.055);
  dorsalBands([-.8,-.2,.4,.95],.72,0,.06,.45*c.ht,.63*c.w);
  for(const x of [-.75,.72]){
    for(const side of [-1,1]){
      const z=.38*c.w*side;limb("body",[x,.13,z],[x-.05,-.70,.44*c.w*side],.19*c.leg);limb("body",[x-.05,-.70,.44*c.w*side],[x+.12,-1.27,.43*c.w*side],.15*c.leg);clawsAt(x+.12,-1.30,.43*c.w*side,1,3,.075);
    }
  }
  if(c.dome){
    ellipsoid("breed",[1.68,1.30,0],[.40,.28,.36]);
    for(const side of [-1,1])spike("detail",[1.48,1.25,.31*side],[1.25,1.38,.43*side],.055);
  }
  if(c.feathers){
    for(let i=0;i<10;i++){
      const x=-1.2+i*.28;
      spike(i%2?"detail":"breed",[x,.91,.32],[x-.08,1.20,.49],.055);
      spike(i%2?"detail":"breed",[x,.91,-.32],[x-.08,1.20,-.49],.055);
    }
  }
}

const THEROPODS={
  tyrannosaurus:{bodyLen:1.10,bodyHt:1.05,width:1.06,tail:1.05,neck:1.05,head:1.25,headH:1.18,headW:1.10,snout:1.05,leg:1.15,arm:.55,eye:1},
  allosaurus:{bodyLen:1.05,bodyHt:.96,width:.96,tail:1.12,neck:1.12,head:1.02,headH:.92,headW:.92,snout:1.10,leg:1.12,arm:1.05,eye:1.05,feathers:false},
  austroraptor:{bodyLen:.92,bodyHt:.82,width:.78,tail:1.15,neck:1.05,head:.78,headH:.78,headW:.72,snout:1.12,leg:1.02,arm:1.10,eye:1.10,feathers:true},
  carnotaurus:{bodyLen:1.00,bodyHt:.92,width:.90,tail:1.04,neck:.88,head:.90,headH:.94,headW:.94,snout:.88,leg:1.12,arm:.42,eye:.95,horns:"carno"},
  ceratosaurus:{bodyLen:.98,bodyHt:.90,width:.91,tail:1.07,neck:.94,head:.92,headH:.91,headW:.90,snout:.95,leg:1.06,arm:.86,eye:1,horns:"cerato"},
  dilophosaurus:{bodyLen:.86,bodyHt:.76,width:.74,tail:1.14,neck:1.10,head:.78,headH:.82,headW:.72,snout:1.12,leg:1.04,arm:.94,eye:1.1,crests:"dilo"},
  herrerasaurus:{bodyLen:.80,bodyHt:.72,width:.68,tail:1.09,neck:1.06,head:.72,headH:.72,headW:.66,snout:.93,leg:.98,arm:.95,eye:1.08},
  omniraptor:{bodyLen:.80,bodyHt:.70,width:.65,tail:1.17,neck:1.00,head:.66,headH:.70,headW:.64,snout:.85,leg:1.04,arm:1.14,eye:1.18,feathers:true},
  troodon:{bodyLen:.63,bodyHt:.62,width:.54,tail:1.04,neck:1.10,head:.58,headH:.66,headW:.58,snout:.62,leg:.92,arm:.88,eye:1.42,feathers:true}
};

function clearModel(){
  scene.remove(modelRoot);
  modelRoot.traverse(o=>{if(o.isMesh && o.geometry && !Object.values(GEOS).includes(o.geometry)) o.geometry.dispose()});
  modelRoot=new THREE.Group();scene.add(modelRoot);
}
function buildSpecies(slug){
  clearModel();
  if(THEROPODS[slug]) buildTheropod(THEROPODS[slug]);
  else if(slug==="deinosuchus") buildCroc();
  else if(slug==="pteranodon") buildPteranodon();
  else if(slug==="triceratops") buildCeratopsian(false);
  else if(slug==="diabloceratops") buildCeratopsian(true);
  else if(slug==="stegosaurus") buildStegosaur(false);
  else if(slug==="kentrosaurus") buildStegosaur(true);
  else if(slug==="pachycephalosaurus") buildOrnithopod({len:.72,ht:.78,w:.70,tail:.95,head:.92,leg:.96,dome:true});
  else if(slug==="tenontosaurus") buildOrnithopod({len:1.02,ht:.94,w:.94,tail:1.20,head:.88,leg:1.06});
  else if(slug==="maiasaura") buildOrnithopod({len:1.06,ht:1.00,w:1.00,tail:1.05,head:.98,leg:1.05});
  else if(slug==="dryosaurus") buildOrnithopod({len:.63,ht:.68,w:.56,tail:1.00,head:.72,leg:.93});
  else if(slug==="hypsilophodon") buildOrnithopod({len:.50,ht:.55,w:.48,tail:.86,head:.66,leg:.78});
  else if(slug==="gallimimus") buildOrnithopod({len:.86,ht:.84,w:.58,tail:1.10,head:.62,leg:1.20});
  else if(slug==="beipiaosaurus") buildOrnithopod({len:.72,ht:.72,w:.62,tail:.82,head:.68,leg:.90,feathers:true});
  else buildTheropod(THEROPODS.tyrannosaurus);
  modelRoot.position.y=.10;
  fitCamera(slug);
}
function fitCamera(slug){
  const small=["hypsilophodon","troodon","dryosaurus","beipiaosaurus"].includes(slug);
  const wide=["pteranodon","deinosuchus"].includes(slug);
  camDist=wide?13.5:small?9.2:11.5;
  yaw=-.38;pitch=.06;updateCamera();
}
function updateMaterials(colors={}){
  materialKeys.forEach(k=>{
    if(colors[k]) materials[k].color.set(colors[k]);
  });
  if(colors.eyes){
    materials.eyes.emissive.set(colors.eyes).multiplyScalar(.08);
  }
}
function updateCamera(){
  const cp=Math.cos(pitch);
  camera.position.set(
    target.x + Math.sin(yaw)*camDist*cp,
    target.y + Math.sin(pitch)*camDist,
    target.z + Math.cos(yaw)*camDist*cp
  );
  camera.lookAt(target);
}
function resize(){
  const rect=canvas.getBoundingClientRect();
  const w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));
  const dpr=Math.min(window.devicePixelRatio||1,2);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
}

let dragging=false,lastX=0,lastY=0,moved=false;
canvas.addEventListener("pointerdown",e=>{dragging=true;moved=false;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener("pointermove",e=>{
  if(!dragging)return;
  const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;
  if(Math.abs(dx)+Math.abs(dy)>2)moved=true;
  yaw-=dx*.008;pitch=Math.max(-.35,Math.min(.45,pitch-dy*.006));updateCamera();
});
canvas.addEventListener("pointerup",()=>dragging=false);
canvas.addEventListener("pointercancel",()=>dragging=false);
canvas.addEventListener("wheel",e=>{e.preventDefault();camDist=Math.max(7.0,Math.min(17.0,camDist+e.deltaY*.012));updateCamera()},{passive:false});
resetButton?.addEventListener("click",()=>fitCamera((window.FOGGY_SKIN_PREVIEW_STATE||{}).species||"tyrannosaurus"));

window.addEventListener("foggy:skin-preview",e=>{
  const d=e.detail||{};
  if(d.species && d.species!==window.__foggy3dSpecies){
    window.__foggy3dSpecies=d.species;buildSpecies(d.species);
  }
  updateMaterials(d.colors||{});
});
window.addEventListener("resize",resize);

const initial=window.FOGGY_SKIN_PREVIEW_STATE||{
  species:"tyrannosaurus",
  colors:{body:"#6D706B",markings:"#343A35",flank:"#7C8179",underbelly:"#A5A49A",detail:"#49504A",eyes:"#D59B36",breed:"#687A5A",teeth:"#D8CFAC",mouth:"#6B3037",claws:"#333333"}
};
window.__foggy3dSpecies=initial.species;
buildSpecies(initial.species);
updateMaterials(initial.colors);
updateCamera();
if(loading)loading.remove();

const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  resize();
  const dt=Math.min(clock.getDelta(),.05);
  if(!dragging && !moved) modelRoot.rotation.y += dt*.035;
  renderer.render(scene,camera);
}
animate();

window.FOGGY_3D={
  rebuild:buildSpecies,
  setColors:updateMaterials,
  reset:()=>fitCamera(window.__foggy3dSpecies||"tyrannosaurus")
};
