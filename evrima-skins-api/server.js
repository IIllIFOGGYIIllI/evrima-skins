const http=require("http");
const crypto=require("crypto");

const PORT=Number(process.env.PORT||3000);
const PUBLIC_BASE_URL=String(process.env.PUBLIC_BASE_URL||"").replace(/\/$/,"");
const FRONTEND_URL=String(process.env.FRONTEND_URL||"https://iillifoggyiilli.github.io/evrima-skins/");
const SESSION_SECRET=String(process.env.SESSION_SECRET||"");
const SERVER_BRIDGE_TOKEN=String(process.env.SERVER_BRIDGE_TOKEN||"");
const SERVER_ID=String(process.env.SERVER_ID||"foggy-evrima-pve");

const FIELDS=["body","markings","flank","underbelly","detail","eyes","breed","teeth","mouth","claws"];
const commands=new Map(),order=[];
const libraryCommands=new Map(),libraryOrder=[];
const rate=new Map(),libraryRate=new Map();
let lastHeartbeat=0;

function send(res,status,obj,headers={}){
  if(res.destroyed)return;
  if(res.headersSent){res.destroy();return;}
  const body=Buffer.from(JSON.stringify(obj));
  res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Content-Length":body.length,"Cache-Control":"no-store",...headers});res.end(body);
}
function cors(req,res){const origin=req.headers.origin||"";let allowed=false;try{allowed=origin===new URL(FRONTEND_URL).origin}catch{}if(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin))allowed=true;if(allowed){res.setHeader("Access-Control-Allow-Origin",origin);res.setHeader("Vary","Origin");res.setHeader("Access-Control-Allow-Headers","Authorization, Content-Type");res.setHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS")}}
function bearer(req){const m=String(req.headers.authorization||"").match(/^Bearer\s+(.+)$/i);return m?m[1]:""}
function b64(x){return Buffer.from(x).toString("base64url")}
function signSession(steam){const p=b64(JSON.stringify({steam:String(steam),exp:Date.now()+30*24*60*60*1000}));const s=b64(crypto.createHmac("sha256",SESSION_SECRET).update(p).digest());return p+"."+s}
function verifySession(token){if(!SESSION_SECRET||!token||!token.includes("."))return null;const [p,s]=token.split(".");const expect=b64(crypto.createHmac("sha256",SESSION_SECRET).update(p).digest());const a=Buffer.from(s),b=Buffer.from(expect);if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;let d;try{d=JSON.parse(Buffer.from(p,"base64url").toString("utf8"))}catch{return null}if(!/^\d{17}$/.test(String(d.steam||""))||Number(d.exp||0)<Date.now())return null;return d}
function user(req){return verifySession(bearer(req))}
function serverAuth(req){const t=bearer(req);if(!t||!SERVER_BRIDGE_TOKEN)return false;const a=Buffer.from(t),b=Buffer.from(SERVER_BRIDGE_TOKEN);return a.length===b.length&&crypto.timingSafeEqual(a,b)}
async function readBody(req,limit=128*1024){const chunks=[];let n=0;for await(const c of req){n+=c.length;if(n>limit)throw Error("request too large");chunks.push(c)}return chunks.length?JSON.parse(Buffer.concat(chunks).toString("utf8")):{}}
function cleanHex(v){v=String(v||"").trim().toUpperCase();return /^#[0-9A-F]{6}$/.test(v)?v:null}
const SPECIES_PATTERNS={tyrannosaurus:3,allosaurus:3,austroraptor:3,carnotaurus:4,ceratosaurus:3,deinosuchus:3,dilophosaurus:3,herrerasaurus:3,omniraptor:5,pteranodon:3,troodon:3,triceratops:3,stegosaurus:3,diabloceratops:3,kentrosaurus:3,tenontosaurus:3,maiasaura:3,pachycephalosaurus:4,dryosaurus:3,hypsilophodon:3,gallimimus:3,beipiaosaurus:3};
function cleanName(v){v=String(v||"").replace(/[\r\n\t]/g," ").replace(/\s+/g," ").trim();return v?v.slice(0,48):null}
function cleanUuid(v){v=String(v||"").toLowerCase();return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v)?v:null}
function normalizeLibrarySkin(raw){
  raw=raw&&typeof raw==="object"?raw:{};
  const species=String(raw.species||"").toLowerCase(),count=SPECIES_PATTERNS[species];
  if(!count)return{error:"Unknown species"};
  const name=cleanName(raw.name);if(!name)return{error:"Skin name is required"};
  const id=cleanUuid(raw.id);if(!id)return{error:"Invalid cloud skin ID"};
  const colors={};for(const f of FIELDS){const h=cleanHex(raw.colors&&raw.colors[f]);if(!h)return{error:`Invalid ${f} colour`};colors[f]=h}
  return{skin:{id,name,species,patternIndex:Math.max(0,Math.min(count-1,Math.floor(Number(raw.patternIndex)||0))),skinVariation:Math.max(0,Math.min(2,Math.floor(Number(raw.skinVariation)||0))),themeIndex:0,previewSex:raw.previewSex==="female"?"female":"male",colors}};
}
function prune(){const cutoff=Date.now()-15*60*1000;for(const [id,c] of commands)if(c.createdAt<cutoff)commands.delete(id);while(order.length&&!commands.has(order[0]))order.shift();if(order.length>500)order.splice(0,order.length-500)}
function pruneLibrary(){const cutoff=Date.now()-15*60*1000;for(const [id,c] of libraryCommands)if(c.createdAt<cutoff)libraryCommands.delete(id);while(libraryOrder.length&&!libraryCommands.has(libraryOrder[0]))libraryOrder.shift();if(libraryOrder.length>500)libraryOrder.splice(0,libraryOrder.length-500)}
function queueLibraryCommand(steam,action,payload={},clientVisible=true){const id=crypto.randomUUID(),c={id,steam:String(steam),action,payload,status:"queued",message:"Queued",data:null,clientVisible,createdAt:Date.now(),deliveredAt:0};libraryCommands.set(id,c);libraryOrder.push(id);pruneLibrary();return c}
function allowRate(ip){const now=Date.now(),list=(rate.get(ip)||[]).filter(t=>now-t<60000);if(list.length>=30)return false;list.push(now);rate.set(ip,list);return true}
function allowLibraryRate(ip){const now=Date.now(),list=(libraryRate.get(ip)||[]).filter(t=>now-t<60000);if(list.length>=60)return false;list.push(now);libraryRate.set(ip,list);return true}
function openidUrl(){const ret=PUBLIC_BASE_URL+"/auth/steam/callback",p=new URLSearchParams({"openid.ns":"http://specs.openid.net/auth/2.0","openid.mode":"checkid_setup","openid.return_to":ret,"openid.realm":PUBLIC_BASE_URL,"openid.identity":"http://specs.openid.net/auth/2.0/identifier_select","openid.claimed_id":"http://specs.openid.net/auth/2.0/identifier_select"});return"https://steamcommunity.com/openid/login?"+p}
async function verifySteam(url){const p=new URLSearchParams(url.searchParams);p.set("openid.mode","check_authentication");const r=await fetch("https://steamcommunity.com/openid/login",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:p.toString()});const txt=await r.text();if(!/is_valid\s*:\s*true/i.test(txt))return null;const claimed=url.searchParams.get("openid.claimed_id")||"",m=claimed.match(/\/id\/(\d{17})$/);return m?m[1]:null}

const https=require("https");
const fs=require("fs");
const fsp=require("fs/promises");
const os=require("os");
const path=require("path");
const {Transform}=require("stream");
const {pipeline}=require("stream/promises");

const ASSET_HOST="islepilot.eu";
const ASSET_PREFIX="/cdn/skinviewer/";
const ASSET_MAX_BYTES=64*1024*1024;
const ASSET_IDLE_TIMEOUT_MS=30000;
const ASSET_CACHE_ROOT=process.env.ASSET_CACHE_DIR
  ?path.resolve(String(process.env.ASSET_CACHE_DIR))
  :path.join(os.tmpdir(),"foggy-evrima-skin-assets");
const assetInflight=new Map();
const assetProgress=new Map();
let assetQueue=Promise.resolve();

function assetSource(raw){
  try{
    const u=new URL(String(raw||""));
    if(u.protocol!=="https:"||u.hostname!==ASSET_HOST||u.username||u.password||u.search)return null;
    if(!u.pathname.startsWith(ASSET_PREFIX)||!/[.](?:glb|png|webp)$/i.test(u.pathname))return null;
    const rawRel=u.pathname.slice(ASSET_PREFIX.length);
    const parts=rawRel.split("/").map(seg=>decodeURIComponent(seg));
    if(!parts.length||parts.some(seg=>!seg||seg==="."||seg===".."||seg.includes("\\")||seg.includes("/")||seg.includes("\0")))return null;
    u.hash="";
    return{url:u,key:parts.join("/"),parts};
  }catch{return null}
}
function assetType(file){
  if(/[.]glb$/i.test(file))return"model/gltf-binary";
  if(/[.]png$/i.test(file))return"image/png";
  if(/[.]webp$/i.test(file))return"image/webp";
  return"application/octet-stream";
}
function assetError(message,code="ASSET_UPSTREAM"){
  const e=new Error(message);e.code=code;return e;
}
function setAssetProgress(info,patch){
  const prev=assetProgress.get(info.key)||{key:info.key,state:"queued",received:0,total:0,startedAt:Date.now(),updatedAt:Date.now()};
  const next={...prev,...patch,updatedAt:Date.now()};
  assetProgress.set(info.key,next);
  return next;
}
function pruneAssetProgress(){
  const cutoff=Date.now()-15*60*1000;
  for(const [key,p] of assetProgress)if((p.updatedAt||0)<cutoff)assetProgress.delete(key);
}
async function assetStatus(info){
  pruneAssetProgress();
  const hit=await cachedAsset(info);
  if(hit)return{state:"cached",key:info.key,received:hit.size,total:hit.size,size:hit.size,cacheRootPersistent:Boolean(process.env.ASSET_CACHE_DIR)};
  const p=assetProgress.get(info.key);
  if(p)return{state:p.state||"queued",key:info.key,received:Number(p.received||0),total:Number(p.total||0),startedAt:p.startedAt||null,updatedAt:p.updatedAt||null,cacheRootPersistent:Boolean(process.env.ASSET_CACHE_DIR)};
  return{state:"not-cached",key:info.key,received:0,total:0,cacheRootPersistent:Boolean(process.env.ASSET_CACHE_DIR)};
}
async function cachedAsset(info){
  const dest=path.join(ASSET_CACHE_ROOT,...info.parts);
  try{
    const st=await fsp.stat(dest);
    if(st.isFile()&&st.size>0&&st.size<=ASSET_MAX_BYTES)return{path:dest,size:st.size,cache:"HIT"};
  }catch{}
  return null;
}
function openAssetStream(url,redirects=0){
  return new Promise((resolve,reject)=>{
    const req=https.request(url,{method:"GET",headers:{Accept:"*/*","User-Agent":"theisle-overlay/2.0 (your-dino panel reader; personal use)"}},resp=>{
      const status=Number(resp.statusCode||0);
      if([301,302,303,307,308].includes(status)&&resp.headers.location){
        resp.resume();
        if(redirects>=3)return reject(assetError("Too many asset redirects","ASSET_REDIRECT"));
        let next;try{next=new URL(resp.headers.location,url)}catch{return reject(assetError("Invalid asset redirect","ASSET_REDIRECT"))}
        const checked=assetSource(next.toString());
        if(!checked)return reject(assetError("Blocked asset redirect","ASSET_REDIRECT"));
        return openAssetStream(checked.url,redirects+1).then(resolve,reject);
      }
      if(status<200||status>=300){resp.resume();return reject(assetError(`Evrima asset upstream ${status}`,status===404?"ASSET_404":"ASSET_UPSTREAM"));}
      const declared=Number(resp.headers["content-length"]||0);
      if(declared>ASSET_MAX_BYTES){resp.resume();return reject(assetError("Evrima asset too large","ASSET_TOO_LARGE"));}
      resolve({resp,declared});
    });
    req.setTimeout(ASSET_IDLE_TIMEOUT_MS,()=>req.destroy(assetError("Evrima asset upstream stalled","ASSET_TIMEOUT")));
    req.on("error",reject);
    req.end();
  });
}
async function downloadAsset(info,dest){
  await fsp.mkdir(path.dirname(dest),{recursive:true});
  const tmp=dest+".part";
  await fsp.rm(tmp,{force:true}).catch(()=>{});
  let received=0;
  try{
    setAssetProgress(info,{state:"connecting",received:0,total:0,startedAt:Date.now(),error:null});
    const {resp,declared}=await openAssetStream(info.url);
    setAssetProgress(info,{state:"downloading",received:0,total:Number(declared||0)});
    const limiter=new Transform({
      transform(chunk,enc,cb){
        received+=chunk.length;
        setAssetProgress(info,{state:"downloading",received,total:Number(declared||0)});
        if(received>ASSET_MAX_BYTES)return cb(assetError("Evrima asset too large","ASSET_TOO_LARGE"));
        cb(null,chunk);
      }
    });
    await pipeline(resp,limiter,fs.createWriteStream(tmp,{flags:"w"}));
    if(received<=0)throw assetError("Evrima asset was empty","ASSET_UPSTREAM");
    await fsp.rename(tmp,dest);
    setAssetProgress(info,{state:"cached",received,total:received,size:received});
    return{path:dest,size:received,cache:"MISS"};
  }catch(e){
    setAssetProgress(info,{state:"failed",received,error:String(e?.message||e)});
    await fsp.rm(tmp,{force:true}).catch(()=>{});
    throw e;
  }
}
async function ensureAsset(info){
  const hit=await cachedAsset(info);
  if(hit){setAssetProgress(info,{state:"cached",received:hit.size,total:hit.size,size:hit.size});return hit;}
  if(assetInflight.has(info.key))return assetInflight.get(info.key);
  const dest=path.join(ASSET_CACHE_ROOT,...info.parts);
  setAssetProgress(info,{state:"queued",received:0,total:0,startedAt:Date.now(),error:null});
  const task=assetQueue.then(async()=>{
    const secondHit=await cachedAsset(info);
    if(secondHit){setAssetProgress(info,{state:"cached",received:secondHit.size,total:secondHit.size,size:secondHit.size});return secondHit;}
    return downloadAsset(info,dest);
  });
  // Keep all first-time CDN downloads sequential, matching the researched
  // native viewer's cache warmer so large models/textures never compete.
  assetQueue=task.catch(()=>{});
  assetInflight.set(info.key,task);
  try{return await task}finally{assetInflight.delete(info.key)}
}
async function serveAssetFile(res,fileInfo,info){
  if(res.destroyed)return;
  const headers={
    "Content-Type":assetType(info.parts.at(-1)),
    "Content-Length":fileInfo.size,
    "Cache-Control":"public, max-age=604800, stale-while-revalidate=2592000",
    "X-Content-Type-Options":"nosniff",
    "X-FOGGY-Asset-Cache":fileInfo.cache
  };
  res.writeHead(200,headers);
  try{await pipeline(fs.createReadStream(fileInfo.path),res)}catch(e){
    if(!res.destroyed)throw e;
  }
}
async function proxyAsset(url,res){
  const info=assetSource(url.searchParams.get("url"));
  if(!info)return send(res,400,{error:"Invalid Evrima asset URL"});
  try{
    const fileInfo=await ensureAsset(info);
    return await serveAssetFile(res,fileInfo,info);
  }catch(e){
    console.error("[FOGGY API] asset failed",info.key,e?.code||"",e?.message||e);
    if(res.destroyed)return;
    if(e?.code==="ASSET_404")return send(res,404,{error:"Evrima asset not found"});
    if(e?.code==="ASSET_TOO_LARGE")return send(res,413,{error:"Evrima asset too large"});
    if(e?.code==="ASSET_TIMEOUT")return send(res,504,{error:"Evrima asset CDN stalled; retry the preview"});
    return send(res,502,{error:"Evrima asset CDN temporarily unavailable"});
  }
}

const app=http.createServer(async(req,res)=>{
  cors(req,res);if(req.method==="OPTIONS"){res.writeHead(204);return res.end()}
  const url=new URL(req.url,PUBLIC_BASE_URL||`http://${req.headers.host||"localhost"}`);
  try{
    if(req.method==="GET"&&url.pathname==="/health")return send(res,200,{ok:true,service:"FOGGY Evrima Skin API",version:"0.7.0"});
    if(req.method==="GET"&&url.pathname==="/auth/steam"){if(!PUBLIC_BASE_URL||!SESSION_SECRET)return send(res,503,{error:"Steam auth is not configured"});res.writeHead(302,{Location:openidUrl(),"Cache-Control":"no-store"});return res.end()}
    if(req.method==="GET"&&url.pathname==="/auth/steam/callback"){const steam=await verifySteam(url);if(!steam){res.writeHead(302,{Location:FRONTEND_URL+"#auth=failed"});return res.end()}res.writeHead(302,{Location:FRONTEND_URL+"#session="+encodeURIComponent(signSession(steam)),"Cache-Control":"no-store"});return res.end()}
    if(req.method==="GET"&&url.pathname==="/api/me"){const u=user(req);if(!u)return send(res,401,{error:"Steam sign-in required"});return send(res,200,{steam:u.steam})}
    if(req.method==="GET"&&url.pathname==="/api/public/status")return send(res,200,{server:SERVER_ID,online:Date.now()-lastHeartbeat<15000,lastHeartbeat:lastHeartbeat||null});
    if(req.method==="GET"&&url.pathname==="/api/assets")return await proxyAsset(url,res);
    if(req.method==="GET"&&url.pathname==="/api/assets/status"){
      const info=assetSource(url.searchParams.get("url"));
      if(!info)return send(res,400,{error:"Invalid Evrima asset URL"});
      return send(res,200,await assetStatus(info));
    }

    if(req.method==="POST"&&url.pathname==="/api/skins/apply"){
      const u=user(req);if(!u)return send(res,401,{error:"Steam sign-in required"});
      if(!allowRate(req.socket.remoteAddress||"unknown"))return send(res,429,{error:"Too many skin requests. Try again in a minute."});
      const b=await readBody(req),colors={};
      for(const f of FIELDS){const h=cleanHex(b.colors&&b.colors[f]);if(!h)return send(res,400,{error:`Invalid ${f} colour`});colors[f]=h.slice(1)}
      const id=crypto.randomUUID();
      for(const old of commands.values())if(old.steam===u.steam&&!["applied","failed"].includes(old.status)){old.status="superseded";old.message="Superseded by a newer request"}
      const species=String(b.species||"").toLowerCase();
      const patternIndex=Math.max(0,Math.min(4,Math.floor(Number(b.patternIndex)||0)));
      const skinVariation=Math.max(0,Math.min(2,Math.floor(Number(b.skinVariation)||0)));
      const themeIndex=Math.max(0,Math.min(1,Math.floor(Number(b.themeIndex)||0)));
      const c={id,steam:u.steam,server:SERVER_ID,species,patternIndex,skinVariation,themeIndex,colors,status:"queued",message:"Queued",createdAt:Date.now(),deliveredAt:0};
      commands.set(id,c);order.push(id);prune();return send(res,202,{ok:true,id,status:c.status})
    }
    const sm=url.pathname.match(/^\/api\/skins\/status\/([0-9a-f-]+)$/i);
    if(req.method==="GET"&&sm){const u=user(req);if(!u)return send(res,401,{error:"Steam sign-in required"});const c=commands.get(sm[1]);if(!c||c.steam!==u.steam)return send(res,404,{error:"Skin request not found"});return send(res,200,{id:c.id,status:c.status,message:c.message,createdAt:c.createdAt})}

    if(req.method==="POST"&&url.pathname==="/api/library/op"){
      const u=user(req);if(!u)return send(res,401,{error:"Steam sign-in required"});
      if(!allowLibraryRate(req.socket.remoteAddress||"unknown"))return send(res,429,{error:"Too many library requests. Try again in a minute."});
      const b=await readBody(req),action=String(b.action||"").toLowerCase(),payload={};
      if(action==="list"){}
      else if(action==="save"){
        const n=normalizeLibrarySkin(b.skin);if(n.error)return send(res,400,{error:n.error});payload.skin=n.skin;
      }else if(action==="rename"){
        payload.id=cleanUuid(b.id);payload.name=cleanName(b.name);if(!payload.id||!payload.name)return send(res,400,{error:"Invalid rename request"});
      }else if(action==="delete"){
        payload.id=cleanUuid(b.id);if(!payload.id)return send(res,400,{error:"Invalid cloud skin ID"});
      }else if(action==="favorite"){
        payload.id=cleanUuid(b.id);payload.favorite=Boolean(b.favorite);if(!payload.id)return send(res,400,{error:"Invalid cloud skin ID"});
      }else if(action==="duplicate"){
        payload.id=cleanUuid(b.id);payload.newId=cleanUuid(b.newId);payload.name=cleanName(b.name);if(!payload.id||!payload.newId||!payload.name)return send(res,400,{error:"Invalid duplicate request"});
      }else return send(res,400,{error:"Unsupported library action"});
      const c=queueLibraryCommand(u.steam,action,payload,true);return send(res,202,{ok:true,id:c.id,status:c.status});
    }
    const lm=url.pathname.match(/^\/api\/library\/status\/([0-9a-f-]+)$/i);
    if(req.method==="GET"&&lm){
      const u=user(req);if(!u)return send(res,401,{error:"Steam sign-in required"});
      const c=libraryCommands.get(lm[1]);if(!c||c.steam!==u.steam||!c.clientVisible)return send(res,404,{error:"Library request not found"});
      return send(res,200,{id:c.id,status:c.status,message:c.message,data:c.status==="completed"?c.data:null,createdAt:c.createdAt});
    }

    if(req.method==="GET"&&url.pathname==="/api/server/commands"){
      if(!serverAuth(req))return send(res,401,{error:"Invalid server bridge token"});
      prune();pruneLibrary();const now=Date.now(),out=[],libraryOut=[];
      for(const id of order){const c=commands.get(id);if(!c)continue;if(c.status==="queued"||(c.status==="delivered"&&now-c.deliveredAt>10000)){c.status="delivered";c.deliveredAt=now;out.push({id:c.id,steam:c.steam,species:c.species,patternIndex:c.patternIndex,skinVariation:c.skinVariation,themeIndex:c.themeIndex,colors:c.colors});if(out.length>=25)break}}
      for(const id of libraryOrder){const c=libraryCommands.get(id);if(!c)continue;if(c.status==="queued"||(c.status==="delivered"&&now-c.deliveredAt>10000)){c.status="delivered";c.deliveredAt=now;libraryOut.push({id:c.id,steam:c.steam,action:c.action,...c.payload});if(libraryOut.length>=25)break}}
      return send(res,200,{commands:out,libraryCommands:libraryOut})
    }
    if(req.method==="POST"&&url.pathname==="/api/server/ack"){
      if(!serverAuth(req))return send(res,401,{error:"Invalid server bridge token"});
      const b=await readBody(req);for(const id of Array.isArray(b.ids)?b.ids:[]){const c=commands.get(String(id));if(c&&c.status==="delivered"){c.status="accepted";c.message="Delivered to FOGGY server bridge"}}return send(res,200,{ok:true})
    }
    if(req.method==="POST"&&url.pathname==="/api/server/result"){
      if(!serverAuth(req))return send(res,401,{error:"Invalid server bridge token"});
      const b=await readBody(req),c=commands.get(String(b.id||""));
      if(c&&(!b.steam||String(b.steam)===c.steam)){
        c.status=b.ok?"applied":"failed";c.message=String(b.message||(b.ok?"Skin applied":"Skin apply failed")).slice(0,300);
        if(b.ok)queueLibraryCommand(c.steam,"recordapplied",{skin:{id:crypto.randomUUID(),name:`${c.species} Last Applied`,species:c.species,patternIndex:c.patternIndex,skinVariation:c.skinVariation,themeIndex:0,previewSex:"male",colors:Object.fromEntries(Object.entries(c.colors).map(([k,v])=>[k,"#"+String(v).replace(/^#/,"")]))}},false);
      }
      return send(res,200,{ok:true})
    }
    if(req.method==="POST"&&url.pathname==="/api/server/library/result"){
      if(!serverAuth(req))return send(res,401,{error:"Invalid server bridge token"});
      const b=await readBody(req),c=libraryCommands.get(String(b.id||""));
      if(c&&(!b.steam||String(b.steam)===c.steam)){
        c.status=b.ok?"completed":"failed";c.message=String(b.message||(b.ok?"Library updated":"Library operation failed")).slice(0,300);c.data=b.ok&&b.data!==undefined?b.data:null;
      }
      return send(res,200,{ok:true})
    }
    if(req.method==="POST"&&url.pathname==="/api/server/heartbeat"){
      if(!serverAuth(req))return send(res,401,{error:"Invalid server bridge token"});lastHeartbeat=Date.now();return send(res,200,{ok:true,server:SERVER_ID})
    }
    return send(res,404,{error:"Not found"})
  }catch(e){console.error("[FOGGY API]",e);return send(res,500,{error:"Internal server error"})}
});
app.listen(PORT,()=>console.log(`[FOGGY API] listening on :${PORT}`));
