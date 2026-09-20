const CACHE="social-quiz-v11-2";
const AUDIO_REVISION="20260920-v11-2";
const ASSETS=["./","./index.html","./styles.css?v=20260920-v11-2","./questions.js?v=20260920-v11-2","./lower-questions.js?v=20260920-v11-2","./weekly-review.js?v=20260920-v11-2","./app.js?v=20260920-v11-2",`./se-correct.mp3?v=${AUDIO_REVISION}`,`./se-wrong.mp3?v=${AUDIO_REVISION}`,"./manifest.webmanifest","./icon-192.png?v=20260920-v11-2","./icon-512.png?v=20260920-v11-2","./apple-touch-icon.png?v=20260920-v11-2"];

self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("social-quiz-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.pathname.endsWith(".mp3")){
    event.respondWith(fetch(new Request(event.request,{cache:"no-store"})).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response}).catch(()=>caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response}).catch(()=>event.request.mode==="navigate"?caches.match("./index.html"):undefined)));
});
