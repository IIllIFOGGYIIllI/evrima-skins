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
const rate=new Map();
let lastHeartbeat=0;

function send(res,status,obj,headers={}){const body=Buffer.from(JSON.stringify(obj));res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Content-Length":body.length,"Cache-Control":"no-store",...headers});res.end(body)}
function cors(req,res){const origin=req.headers.origin||"";let allowed=false;try{allowed=origin===new URL(FRONTEND_URL).origin}catch{}if(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin))allowed=true;if(allowed){res.setHeader("Access-Control-Allow-Origin",origin);res.setHeader("Vary","Origin");res.setHeader("Access-Control-Allow-Headers","Authorization, Content-Type");res.setHeader("Access-Control-Allow-Methods","GET, POST, OPTIONS")}}
function bearer(req){const m=String(req.headers.authorization||"").match(/^Bearer\s+(.+)$/i);return m?m[1]:""}
function b64(x){return Buffer.from(x).toString("base64url")}
function signSession(steam){const p=b64(JSON.stringify({steam:String(steam),exp:Date.now()+30*24*60*60*1000}));const s=b64(crypto.createHmac("sha256",SESSION_SECRET).update(p).digest());return p+"."+s}
function verifySession(token){if(!SESSION_SECRET||!token||!token.includes("."))return null;const [p,s]=token.split(".");const expect=b64(crypto.createHmac("sha256",SESSION_SECRET).update(p).digest());const a=Buffer.from(s),b=Buffer.from(expect);if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;let d;try{d=JSON.parse(Buffer.from(p,"base64url").toString("utf8"))}catch{return null}if(!/^\d{17}$/.test(String(d.steam||""))||Number(d.exp||0)<Date.now())return null;return d}
function user(req){return verifySession(bearer(req))}
function serverAuth(req){const t=bearer(req);if(!t||!SERVER_BRIDGE_TOKEN)return false;const a=Buffer.from(t),b=Buffer.from(SERVER_BRIDGE_TOKEN);return a.length===b.length&&crypto.timingSafeEqual(a,b)}
async function readBody(req,limit=128*1024){const chunks=[];let n=0;for await(const c of req){n+=c.length;if(n>limit)throw Error("request too large");chunks.push(c)}return chunks.length?JSON.parse(Buffer.concat(chunks).toString("utf8")):{}}
function cleanHex(v){v=String(v||"").trim().toUpperCase();return /^#[0-9A-F]{6}$/.test(v)?v:null}
function prune(){const cutoff=Date.now()-15*60*1000;for(const [id,c] of commands)if(c.createdAt<cutoff)commands.delete(id);while(order.length&&!commands.has(order[0]))order.shift();if(order.length>500)order.splice(0,order.length-500)}
function allowRate(ip){const now=Date.now(),list=(rate.get(ip)||[]).filter(t=>now-t<60000);if(list.length>=30)return false;list.push(now);rate.set(ip,list);return true}
function openidUrl(){const ret=PUBLIC_BASE_URL+"/auth/steam/callback",p=new URLSearchParams({"openid.ns":"http://specs.openid.net/auth/2.0","openid.mode":"checkid_setup","openid.return_to":ret,"openid.realm":PUBLIC_BASE_URL,"openid.identity":"http://specs.openid.net/auth/2.0/identifier_select","openid.claimed_id":"http://specs.openid.net/auth/2.0/identifier_select"});return"https://steamcommunity.com/openid/login?"+p}
async function verifySteam(url){const p=new URLSearchParams(url.searchParams);p.set("openid.mode","check_authentication");const r=await fetch("https://steamcommunity.com/openid/login",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:p.toString()});const txt=await r.text();if(!/is_valid\s*:\s*true/i.test(txt))return null;const claimed=url.searchParams.get("openid.claimed_id")||"",m=claimed.match(/\/id\/(\d{17})$/);return m?m[1]:null}

const ASSET_HOST="islepilot.eu";
const ASSET_PREFIX="/cdn/skinviewer/";
const ASSET_MAX_BYTES=64*1024*1024;
function assetSource(raw){
  try{
    const u=new URL(String(raw||""));
    if(u.protocol!=="https:"||u.hostname!==ASSET_HOST||u.username||u.password)return null;
    if(!u.pathname.startsWith(ASSET_PREFIX)||!/[.](?:glb|png|webp)$/i.test(u.pathname))return null;
    u.hash="";return u;
  }catch{return null}
}
async function proxyAsset(url,res){
  const src=assetSource(url.searchParams.get("url"));
  if(!src)return send(res,400,{error:"Invalid Evrima asset URL"});
  let upstream;
  try{upstream=await fetch(src,{headers:{Accept:"*/*","User-Agent":"FOGGY-Evrima-Skin-Studio/0.8.1"},signal:AbortSignal.timeout(25000)})}
  catch(e){console.error("[FOGGY API] asset upstream failed",src.pathname,e);return send(res,502,{error:"Evrima asset upstream unavailable"})}
  if(!upstream.ok)return send(res,upstream.status===404?404:502,{error:`Evrima asset upstream ${upstream.status}`});
  const declared=Number(upstream.headers.get("content-length")||0);
  if(declared>ASSET_MAX_BYTES)return send(res,413,{error:"Evrima asset too large"});
  const body=Buffer.from(await upstream.arrayBuffer());
  if(body.length>ASSET_MAX_BYTES)return send(res,413,{error:"Evrima asset too large"});
  const headers={
    "Content-Type":upstream.headers.get("content-type")||"application/octet-stream",
    "Content-Length":body.length,
    "Cache-Control":"public, max-age=86400, stale-while-revalidate=604800",
    "X-Content-Type-Options":"nosniff"
  };
  const etag=upstream.headers.get("etag"),last=upstream.headers.get("last-modified");
  if(etag)headers.ETag=etag;if(last)headers["Last-Modified"]=last;
  res.writeHead(200,headers);res.end(body);
}

const app=http.createServer(async(req,res)=>{
  cors(req,res);if(req.method==="OPTIONS"){res.writeHead(204);return res.end()}
  const url=new URL(req.url,PUBLIC_BASE_URL||`http://${req.headers.host||"localhost"}`);
  try{
    if(req.method==="GET"&&url.pathname==="/health")return send(res,200,{ok:true,service:"FOGGY Evrima Skin API",version:"0.6.0"});
    if(req.method==="GET"&&url.pathname==="/auth/steam"){if(!PUBLIC_BASE_URL||!SESSION_SECRET)return send(res,503,{error:"Steam auth is not configured"});res.writeHead(302,{Location:openidUrl(),"Cache-Control":"no-store"});return res.end()}
    if(req.method==="GET"&&url.pathname==="/auth/steam/callback"){const steam=await verifySteam(url);if(!steam){res.writeHead(302,{Location:FRONTEND_URL+"#auth=failed"});return res.end()}res.writeHead(302,{Location:FRONTEND_URL+"#session="+encodeURIComponent(signSession(steam)),"Cache-Control":"no-store"});return res.end()}
    if(req.method==="GET"&&url.pathname==="/api/me"){const u=user(req);if(!u)return send(res,401,{error:"Steam sign-in required"});return send(res,200,{steam:u.steam})}
    if(req.method==="GET"&&url.pathname==="/api/public/status")return send(res,200,{server:SERVER_ID,online:Date.now()-lastHeartbeat<15000,lastHeartbeat:lastHeartbeat||null});
    if(req.method==="GET"&&url.pathname==="/api/assets")return proxyAsset(url,res);

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

    if(req.method==="GET"&&url.pathname==="/api/server/commands"){
      if(!serverAuth(req))return send(res,401,{error:"Invalid server bridge token"});
      prune();const now=Date.now(),out=[];
      for(const id of order){const c=commands.get(id);if(!c)continue;if(c.status==="queued"||(c.status==="delivered"&&now-c.deliveredAt>10000)){c.status="delivered";c.deliveredAt=now;out.push({id:c.id,steam:c.steam,species:c.species,patternIndex:c.patternIndex,skinVariation:c.skinVariation,themeIndex:c.themeIndex,colors:c.colors});if(out.length>=25)break}}
      return send(res,200,{commands:out})
    }
    if(req.method==="POST"&&url.pathname==="/api/server/ack"){
      if(!serverAuth(req))return send(res,401,{error:"Invalid server bridge token"});
      const b=await readBody(req);for(const id of Array.isArray(b.ids)?b.ids:[]){const c=commands.get(String(id));if(c&&c.status==="delivered"){c.status="accepted";c.message="Delivered to FOGGY server bridge"}}return send(res,200,{ok:true})
    }
    if(req.method==="POST"&&url.pathname==="/api/server/result"){
      if(!serverAuth(req))return send(res,401,{error:"Invalid server bridge token"});
      const b=await readBody(req),c=commands.get(String(b.id||""));if(c&&(!b.steam||String(b.steam)===c.steam)){c.status=b.ok?"applied":"failed";c.message=String(b.message||(b.ok?"Skin applied":"Skin apply failed")).slice(0,300)}return send(res,200,{ok:true})
    }
    if(req.method==="POST"&&url.pathname==="/api/server/heartbeat"){
      if(!serverAuth(req))return send(res,401,{error:"Invalid server bridge token"});lastHeartbeat=Date.now();return send(res,200,{ok:true,server:SERVER_ID})
    }
    return send(res,404,{error:"Not found"})
  }catch(e){console.error("[FOGGY API]",e);return send(res,500,{error:"Internal server error"})}
});
app.listen(PORT,()=>console.log(`[FOGGY API] listening on :${PORT}`));
