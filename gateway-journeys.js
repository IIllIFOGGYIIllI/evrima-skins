/* Primeval Refuge | private browser-only Gateway journeys, v0.15.0 */
(function(){
  "use strict";
  const STORAGE_PREFIX="primeval_gateway_journeys_v1_";
  const PREF_PREFIX="primeval_gateway_recording_v1_";
  const MAX_JOURNEYS=12,MAX_POINTS=1600,MAX_AGE_MS=7*86400000;
  const GAP_MS=180000,MIN_MOVE_CM=250,MAX_SPEED_CM_S=9500;
  let account="",journeys=[],selectedId="latest",activeId="",recording=true,notify=()=>{},storageIssue=false;

  const el=id=>document.getElementById(id);
  const stamp=()=>Date.now();
  const number=v=>{if(v===null||v===undefined||v==="")return NaN;return Number(v);};
  function validPoint(p){
    return p&&[p.x,p.y,p.z,p.t].every(v=>Number.isFinite(number(v)))&&Number(p.t)>0;
  }
  function cleanJourney(j){
    if(!j||!Array.isArray(j.points))return null;
    const pts=j.points.filter(validPoint).slice(-MAX_POINTS).map(p=>({t:Number(p.t),x:Number(p.x),y:Number(p.y),z:Number(p.z)}));
    if(!pts.length)return null;
    pts.sort((a,b)=>a.t-b.t);
    return {id:String(j.id||pts[0].t).slice(0,96),species:String(j.species||"Dinosaur").slice(0,80),startedAt:pts[0].t,updatedAt:pts[pts.length-1].t,points:pts};
  }
  function load(){
    storageIssue=false;
    if(!account)return[];
    try{
      const raw=JSON.parse(localStorage.getItem(STORAGE_PREFIX+account)||"[]");
      return (Array.isArray(raw)?raw:[]).map(cleanJourney).filter(j=>j&&stamp()-j.updatedAt<MAX_AGE_MS)
        .sort((a,b)=>a.startedAt-b.startedAt).slice(-MAX_JOURNEYS);
    }catch{return[];}
  }
  function persist(){
    if(!account)return;
    try{localStorage.setItem(STORAGE_PREFIX+account,JSON.stringify(journeys));storageIssue=false;}
    catch{storageIssue=true;}
  }
  function setAccount(steam){
    const id=/^\d{17}$/.test(String(steam||""))?String(steam):"";
    if(id===account)return;
    account=id;activeId="";selectedId="latest";journeys=load();
    try{recording=localStorage.getItem(PREF_PREFIX+account)!=="false";}catch{recording=true;}
    updateUi();notify();
  }
  function selectedJourney(){
    if(!journeys.length)return null;
    return selectedId==="latest"?journeys[journeys.length-1]:journeys.find(j=>j.id===selectedId)||journeys[journeys.length-1];
  }
  function makeJourney(species,at){
    const j={id:at+"-"+Math.random().toString(36).slice(2,9),species,startedAt:at,updatedAt:at,points:[]};
    journeys.push(j);journeys=journeys.slice(-MAX_JOURNEYS);activeId=j.id;
    return j;
  }
  function distanceCm(a,b){return Math.hypot(b.x-a.x,b.y-a.y);}
  function journeyDistance(j){
    if(!j)return 0;
    let total=0;
    for(let i=1;i<j.points.length;i++)total+=distanceCm(j.points[i-1],j.points[i]);
    return total;
  }
  function closeJourney(){activeId="";}
  function ingest(steam,data){
    if(!steam)return;
    setAccount(steam);
    if(!recording)return;
    const track=data?.tracking;
    if(!track?.ok||!track?.fresh)return; // transient RCON errors never erase a route
    if(!data.online||!data.player){closeJourney();return;}
    const p=data.player;
    if(String(p.steam||"")!==account)return; // never accept a different account's coordinates
    const x=number(p.location?.x),y=number(p.location?.y),z=number(p.location?.z);
    const at=number(track.lastUpdate||track.polledAt);
    if(![x,y,z,at].every(Number.isFinite)||at<=0||at>stamp()+30000||stamp()-at>30000)return;
    const next={t:at,x,y,z},species=String(p.species||"Dinosaur").slice(0,80);
    let j=journeys.find(item=>item.id===activeId);
    const prev=j?.points.at(-1);
    if(prev){
      const dt=at-prev.t,dist=distanceCm(prev,next);
      if(dt<=0)return; // the same RCON poll must not produce duplicate samples
      if(dt>GAP_MS||species!==j.species||dist/(dt/1000)>MAX_SPEED_CM_S||j.points.length>=MAX_POINTS){
        j=null;activeId="";
      }else if(dist<MIN_MOVE_CM&&dt<60000)return; // stationary: retain occasional checkpoint
    }
    if(!j)j=makeJourney(species,at);
    j.points.push(next);
    j.updatedAt=at;
    persist();updateUi();notify();
  }
  function fmtTime(t){try{return new Date(t).toLocaleString();}catch{return"Unknown";}}
  function duration(j){return Math.max(0,Math.round((j.updatedAt-j.startedAt)/60000));}
  function updateUi(){
    const picker=el("mapJourneySelect"),summary=el("mapJourneySummary"),button=el("mapJourneyRecording");
    if(button){button.textContent=recording?"Pause recording":"Resume recording";button.disabled=!account;button.setAttribute("aria-pressed",String(recording));}
    if(picker){
      picker.replaceChildren();
      const first=document.createElement("option");first.value="latest";first.textContent="Latest journey";picker.append(first);
      for(const j of [...journeys].reverse()){
        const option=document.createElement("option");option.value=j.id;option.textContent=fmtTime(j.startedAt)+" · "+j.species;picker.append(option);
      }
      picker.value=journeys.some(j=>j.id===selectedId)?selectedId:"latest";
      picker.disabled=!account||!journeys.length;
    }
    for(const id of ["mapJourneyExportJson","mapJourneyExportCsv","mapJourneyClear"]){
      const b=el(id);if(b)b.disabled=!account||!journeys.length;
    }
    if(!summary)return;
    if(!account){summary.textContent="Sign in with Steam to see private route history saved on this device.";return;}
    const j=selectedJourney();
    if(!j){summary.textContent=recording?"Recording is ready. Move around in-game to start your first journey.":"Recording paused. Resume to capture a journey.";return;}
    const km=journeyDistance(j)/100000;
    summary.textContent=j.species+" · "+j.points.length+" positions · ~"+km.toFixed(2)+" km · "+duration(j)+" min · "+fmtTime(j.startedAt)+(storageIssue?" · Browser storage unavailable":"");
  }
  function pathSegments(j,fit,project){
    const segments=[];let current=[];
    for(const p of j.points){
      const q=project(fit,p.x,p.y);
      if(!q||!Number.isFinite(q.u)||!Number.isFinite(q.v)||q.u<0||q.v<0||q.u>1||q.v>1){
        if(current.length>1)segments.push(current);current=[];continue;
      }
      current.push([q.u*1000,q.v*1000]);
    }
    if(current.length>1)segments.push(current);
    return segments;
  }
  function renderTrail(fit,project){
    const svg=el("gatewayJourneySvg");
    if(!svg)return;
    svg.replaceChildren();
    if(!account||!fit||typeof project!=="function"||el("mapShowJourney")?.checked===false)return;
    const j=selectedJourney();if(!j)return;
    const ns="http://www.w3.org/2000/svg";
    for(const segment of pathSegments(j,fit,project)){
      const poly=document.createElementNS(ns,"polyline");
      poly.setAttribute("points",segment.map(p=>p.map(v=>v.toFixed(3)).join(",")).join(" "));
      poly.setAttribute("fill","none");poly.setAttribute("class","gateway-journey-line");
      svg.append(poly);
    }
    const q=project(fit,j.points[0].x,j.points[0].y);
    if(q&&q.u>=0&&q.u<=1&&q.v>=0&&q.v<=1){
      const dot=document.createElementNS(ns,"circle");
      dot.setAttribute("cx",(q.u*1000).toFixed(3));dot.setAttribute("cy",(q.v*1000).toFixed(3));
      dot.setAttribute("r","4");dot.setAttribute("class","gateway-journey-start");svg.append(dot);
    }
  }
  function exportSelected(type){
    const j=selectedJourney();if(!j)return;
    const simple={version:1,map:"Gateway",source:"Primeval Refuge private local journey",species:j.species,startedAt:new Date(j.startedAt).toISOString(),updatedAt:new Date(j.updatedAt).toISOString(),unit:"Unreal coordinates (X/Y/Z)",points:j.points};
    const csv=["timestamp_utc,species,world_x,world_y,world_z",...j.points.map(p=>[new Date(p.t).toISOString(),JSON.stringify(j.species),p.x,p.y,p.z].join(","))].join("\r\n");
    const body=type==="csv"?csv:JSON.stringify(simple,null,2);
    const blob=new Blob([body],{type:type==="csv"?"text/csv":"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="Primeval_Refuge_Gateway_Journey_"+j.startedAt+"."+(type==="csv"?"csv":"json");
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function init(callback){
    notify=typeof callback==="function"?callback:()=>{};
    const select=el("mapJourneySelect");
    if(select)select.onchange=()=>{selectedId=select.value;updateUi();notify();};
    const recordingButton=el("mapJourneyRecording");
    if(recordingButton)recordingButton.onclick=()=>{
      if(!account)return;recording=!recording;closeJourney();
      try{localStorage.setItem(PREF_PREFIX+account,String(recording));}catch{}
      updateUi();notify();
    };
    const show=el("mapShowJourney");
    if(show)show.onchange=notify;
    const del=el("mapJourneyClear");
    if(del)del.onclick=()=>{
      if(!account||!journeys.length)return;
      if(!confirm("Permanently clear the Gateway journeys saved in this browser for the signed-in Steam account?"))return;
      journeys=[];closeJourney();selectedId="latest";persist();updateUi();notify();
    };
    const expJson=el("mapJourneyExportJson"),expCsv=el("mapJourneyExportCsv");
    if(expJson)expJson.onclick=()=>exportSelected("json");
    if(expCsv)expCsv.onclick=()=>exportSelected("csv");
    updateUi();
  }
  window.PrimevalJourneys={init,setAccount,ingest,renderTrail,updateUi};
})();