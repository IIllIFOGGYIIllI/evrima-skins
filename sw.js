/* Primeval Refuge safe offline shell v0.16.0
 * Only same-origin public static files are cached. No API, Steam, RCON,
 * authentication callback, browser-local history, or private skins are cached.
 */
const CACHE_NAME="primeval-refuge-static-v0160";
const CACHE_PREFIX="primeval-refuge-static-";
const ROOT=new URL("./",self.registration.scope);
const OFFLINE=new URL("./offline.html",ROOT).href;
const PRE_CACHE=["./offline.html","./manifest.json","./pwa-icons/icon-192.png","./pwa-icons/icon-512.png","./pwa-icons/icon-180.png"];
const STATIC_PATHS=new Set([
  "styles.css","brand.css","config.js","app.js","viewer3d.js",
  "evrima-registry.js","gateway-journeys.js","pwa.js",
  "manifest.json","offline.html",
  "pwa-icons/icon-192.png","pwa-icons/icon-512.png","pwa-icons/icon-180.png"
]);
self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>cache.addAll(PRE_CACHE.map(path=>new URL(path,ROOT).href)))
      .then(()=>self.skipWaiting())
  );
});
self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(names=>Promise.all(names
      .filter(name=>name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME)
      .map(name=>caches.delete(name))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin||!url.pathname.startsWith(ROOT.pathname))return;
  if(request.mode==="navigate"){
    // Never cache a navigation or its query parameters (including Steam return flows).
    event.respondWith(fetch(request).catch(async()=>{
      return (await caches.match(OFFLINE))||Response.error();
    }));
    return;
  }
  const relativePath=url.pathname.slice(ROOT.pathname.length);
  if(!STATIC_PATHS.has(relativePath))return;
  // Network-first ensures an installed app gets the latest code without stale auth JS.
  event.respondWith(fetch(request).then(response=>{
    if(response.ok&&response.type==="basic"){
      const copy=response.clone();
      event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)));
    }
    return response;
  }).catch(async()=>{
    return (await caches.match(request))||Response.error();
  }));
});