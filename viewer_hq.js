/* FOGGY Evrima Skin Studio v0.7.0 - High-detail Sketchfab preview layer
   Uses public Sketchfab models under CC BY and the official Sketchfab Viewer API.
   It does not download or redistribute the model files. */
(function(){
  "use strict";

  const frame=document.getElementById("hqFrame");
  const wrap=document.getElementById("hqViewerWrap");
  const loading=document.getElementById("hqLoading");
  const unavailable=document.getElementById("hqUnavailable");
  const credit=document.getElementById("hqCredit");
  if(!frame||!wrap)return;

  const MODELS={
    tyrannosaurus:{
      uid:"3cace8c9907f438689ceb0a536563786",
      label:"HQ 3D · TYRANNOSAURUS",
      title:"Tyrannosaurus Rex",
      creator:"Senoba",
      url:"https://sketchfab.com/3d-models/tyrannosaurus-rex-3cace8c9907f438689ceb0a536563786",
      license:"CC BY"
    },
    triceratops:{
      uid:"87527079bad44917ab1b98a456b46c7e",
      label:"HQ 3D · TRICERATOPS",
      title:"Triceratops dinosaur",
      creator:"wojciechmiedziocha",
      url:"https://sketchfab.com/3d-models/triceratops-dinosaur-87527079bad44917ab1b98a456b46c7e",
      license:"CC BY"
    },
    carnotaurus:{
      uid:"6ef88bc006ff47fd8aa38d8d084c2551",
      label:"HQ 3D · CARNOTAURUS",
      title:"Carnotaurus",
      creator:"Heshweshwe",
      url:"https://sketchfab.com/3d-models/carnotaurus-6ef88bc006ff47fd8aa38d8d084c2551",
      license:"CC BY"
    },
    deinosuchus:{
      uid:"704eb8d8d8fd4b56ab133f2d1e37586d",
      label:"HQ 3D · DEINOSUCHUS",
      title:"Deinosuchus",
      creator:"Paleo Modelist",
      url:"https://sketchfab.com/3d-models/deinosuchus-704eb8d8d8fd4b56ab133f2d1e37586d",
      license:"CC BY"
    },
    dilophosaurus:{
      uid:"d09b3aa874db4e1cbf29a14797ca351f",
      label:"HQ 3D · DILOPHOSAURUS",
      title:"Dilophosaurus",
      creator:"Marcel Schanz",
      url:"https://sketchfab.com/3d-models/dilophosaurus-d09b3aa874db4e1cbf29a14797ca351f",
      license:"CC BY"
    },
    pteranodon:{
      uid:"7d7683df41d1405283f160e81a5dff1b",
      label:"HQ 3D · PTERANODON",
      title:"Pteranodon (Animated)",
      creator:"Chistodrako._.",
      url:"https://sketchfab.com/3d-models/pteranodon-animated-7d7683df41d1405283f160e81a5dff1b",
      license:"CC BY"
    },
    pachycephalosaurus:{
      uid:"a98d7ea155514fba8b4a082a4354aa14",
      label:"HQ 3D · PACHYCEPHALOSAURUS",
      title:"Pachycephalosaurus",
      creator:"kenchoo",
      url:"https://sketchfab.com/3d-models/pachycephalosaurus-a98d7ea155514fba8b4a082a4354aa14",
      license:"CC BY"
    }
  };

  let api=null,currentSlug="",materials=[],state=null,settings=null,loadToken=0,applyTimer=null;
  let envState=null;

  const status=(kind,label)=>window.dispatchEvent(new CustomEvent("foggy:hq-status",{detail:{kind,label}}));

  function hexRgb(hex){
    hex=String(hex||"#FFFFFF").replace("#","");
    if(!/^[0-9A-Fa-f]{6}$/.test(hex))hex="FFFFFF";
    return[
      parseInt(hex.slice(0,2),16)/255,
      parseInt(hex.slice(2,4),16)/255,
      parseInt(hex.slice(4,6),16)/255
    ];
  }
  function mix(a,b,t){return[a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t,a[2]*(1-t)+b[2]*t];}
  function compositeBody(c){
    let x=hexRgb(c.body);
    x=mix(x,hexRgb(c.flank),.15);
    x=mix(x,hexRgb(c.underbelly),.09);
    x=mix(x,hexRgb(c.markings),.10);
    x=mix(x,hexRgb(c.detail),.04);
    return x;
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
    if(/crest|display|horn|plate|spike|dorsal/.test(n))return"detail";
    return"body";
  }
  function setChannelColor(ch,color){
    if(!ch)return;
    ch.enable=true;
    ch.color=[color[0],color[1],color[2]];
    if("factor" in ch && (typeof ch.factor==="number"||ch.factor==null))ch.factor=1;
  }
  function tintMaterial(m){
    if(!m||!m.channels||!state?.colors)return m;
    const cls=classify(m.name);
    let color;
    if(cls==="body")color=compositeBody(state.colors);
    else color=hexRgb(state.colors[cls]||state.colors.body);

    setChannelColor(m.channels.AlbedoPBR,color);
    setChannelColor(m.channels.DiffusePBR,color);
    setChannelColor(m.channels.DiffuseColor,color);

    // Keep original textures, normal maps and roughness. The colour multiplies the texture.
    return m;
  }
  function applyMaterialsNow(){
    if(!api||!materials.length||!state||state.mode!=="hq")return;
    let changed=0;
    materials.forEach(m=>{
      try{api.setMaterial(tintMaterial(m));changed++;}catch(e){console.warn("[FOGGY HQ] material",e);}
    });
    status("ready",`HQ 3D · ${changed} MATERIAL${changed===1?"":"S"}`);
  }
  function scheduleMaterials(){
    clearTimeout(applyTimer);
    applyTimer=setTimeout(applyMaterialsNow,85);
  }
  function chooseIdle(){
    if(!api)return;
    api.getAnimations((err,anims)=>{
      if(err||!Array.isArray(anims)||!anims.length)return;
      const idle=anims.find(a=>/idle|stand|breath/i.test(String(a[1]||"")))||anims[0];
      if(idle?.[0])api.setCurrentAnimationByUID(idle[0],()=>{api.setCycleMode("loopOne");applyIdleSetting();});
    });
  }
  function applyIdleSetting(){
    if(!api)return;
    try{
      if(settings?.idle===false)api.pause();
      else api.play();
    }catch{}
  }
  function sceneColor(){
    switch(settings?.scene){
      case"lagoon":return[0.055,0.15,0.17];
      case"jungle":return[0.055,0.10,0.065];
      case"night":return[0.018,0.028,0.05];
      default:return[0.035,0.04,0.032];
    }
  }
  function applyEnvironment(){
    if(!api||state?.mode!=="hq")return;
    try{api.setBackground({color:settings?.background===false?[0.015,0.017,0.014]:sceneColor()});}catch{}
    try{
      const exposure=Math.max(.25,Math.min(1.5,Number(settings?.brightness)||.82));
      const lightIntensity=Math.max(.35,Math.min(1.4,Number(settings?.lighting)||.9));
      if(envState&&envState.uid)api.setEnvironment({...envState,exposure,lightIntensity});
    }catch{}
    applyIdleSetting();
  }
  function clearViewer(){
    materials=[];api=null;
    frame.src="about:blank";
  }
  function showCredit(info){
    if(!info){credit.textContent="";credit.removeAttribute("href");return;}
    credit.textContent=`Model: ${info.creator} · ${info.license} · Sketchfab`;
    credit.href=info.url;
  }
  function setLoading(on,text){
    if(text)loading.querySelector("span").textContent=text;
    loading.classList.toggle("hidden",!on);
  }
  function unsupported(slug){
    setLoading(false);
    unavailable.textContent="No higher-detail licensed model is configured for this species yet. Use Skin Map 3D or Skin 2D instead.";
    unavailable.classList.add("show");
    showCredit(null);
    status("error","HQ 3D UNAVAILABLE");
  }
  function loadHQ(next){
    state=next||state;
    if(!state||state.mode!=="hq"){wrap.style.display="none";return;}
    wrap.style.display="block";
    const slug=state.species?.slug||state.species;
    const info=MODELS[slug];
    if(!info){unsupported(slug);return;}
    unavailable.classList.remove("show");
    showCredit(info);

    if(slug===currentSlug&&api){applyMaterialsNow();applyEnvironment();return;}
    currentSlug=slug;
    const token=++loadToken;
    clearViewer();
    setLoading(true,"Loading "+(state.species?.name||slug)+" high-detail model…");
    status("loading","HQ 3D LOADING…");

    if(typeof window.Sketchfab!=="function"){
      setLoading(false);unavailable.textContent="Sketchfab Viewer API failed to load.";unavailable.classList.add("show");
      status("error","HQ VIEWER API FAILED");return;
    }

    const client=new window.Sketchfab("1.12.1",frame);
    client.init(info.uid,{
      autostart:1,preload:1,camera:0,autospin:0,dnt:1,
      ui_controls:0,ui_infos:0,ui_help:0,ui_settings:0,ui_vr:0,ui_ar:0,ui_stop:0,
      ui_watermark:1,ui_hint:0,ui_inspector:0,ui_fullscreen:1,
      success:function(nextApi){
        if(token!==loadToken)return;
        api=nextApi;
        api.start(function(){
          api.addEventListener("viewerready",function(){
            if(token!==loadToken)return;
            setLoading(false);
            try{api.setTextureQuality("hd");}catch{}
            try{api.setShadingStyle("pbr",{type:"lit"});}catch{}
            try{api.setFov(36);}catch{}
            try{api.getEnvironment((err,e)=>{if(!err&&e){envState=e;applyEnvironment();}});}catch{}
            api.getMaterialList(function(err,list){
              if(!err&&Array.isArray(list)){
                materials=list;
                applyMaterialsNow();
              }else status("ready",info.label);
            });
            chooseIdle();
            applyEnvironment();
            status("ready",info.label);
          });
        });
      },
      error:function(){
        if(token!==loadToken)return;
        setLoading(false);
        unavailable.textContent="The high-detail model could not be loaded. Switch to Skin Map 3D.";
        unavailable.classList.add("show");
        status("error","HQ 3D LOAD FAILED");
      }
    });
  }

  window.addEventListener("foggy:viewer-state",e=>{
    const prevMode=state?.mode,prevSlug=state?.species?.slug||state?.species;
    state=e.detail;
    const slug=state?.species?.slug||state?.species;
    if(state.mode!=="hq"){wrap.style.display="none";return;}
    wrap.style.display="block";
    if(prevMode!=="hq"||slug!==prevSlug||!api)loadHQ(state);
    else scheduleMaterials();
  });

  window.addEventListener("foggy:viewer-settings",e=>{
    settings=e.detail||settings;
    applyEnvironment();
  });

  window.addEventListener("foggy:viewer-reset",()=>{
    if(state?.mode!=="hq"||!api)return;
    try{api.recenterCamera();}catch{}
  });

  setTimeout(()=>{
    state=window.FOGGY_VIEWER_STATE||state;
    settings=window.FOGGY_VIEWER_SETTINGS||settings;
    if(state?.mode==="hq")loadHQ(state);
  },120);
})();