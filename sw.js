const CACHE="social-quiz-v11-3-countdown-exam-r3";
const AUDIO_REVISION="20260920-v11-2";
const ASSETS=["./","./index.html","./styles.css?v=20260926-v11-3-r3","./questions.js?v=20260920-v11-2","./lower-questions.js?v=20260920-v11-2","./weekly-review.js?v=20260920-v11-2","./countdown.js?v=20260926-v11-3-r1","./app.js?v=20260926-v11-3-r3",`./se-correct.mp3?v=${AUDIO_REVISION}`,`./se-wrong.mp3?v=${AUDIO_REVISION}`,"./manifest.webmanifest","./icon-192.png?v=20260920-v11-2","./icon-512.png?v=20260920-v11-2","./apple-touch-icon.png?v=20260920-v11-2"];
ASSETS.push("./map3d/question-links.json","./map3d/question-links-model.mjs","./map3d/question-links.mjs","./map3d/question-links.css","./map3d/linked-map.mjs","./map3d/quiz.json","./map3d/quiz.mjs","./map3d/quiz-model.mjs","./map3d/quiz-store.mjs","./map3d/quiz-home.mjs","./map3d/collections.json","./map3d/collections.mjs","./map3d/collections-model.mjs","./map3d/places.json","./map3d/places.mjs","./map3d/places-model.mjs","./map3d/index.html","./map3d/entry.css","./map3d/map.css","./map3d/map.mjs","./map3d/projection.mjs","./map3d/config.json","./map3d/regions.json","./map3d/SOURCES.md","./map3d/vendor/three.module.js","./map3d/vendor/three.core.js","./map3d/vendor/OrbitControls.js","./map3d/vendor/GLTFLoader.js","./map3d/vendor/utils/BufferGeometryUtils.js");

self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(url=>new Request(url,{cache:"reload"})))).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("social-quiz-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.pathname.endsWith(".mp3")){
    event.respondWith(fetch(new Request(event.request,{cache:"no-store"})).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response}).catch(()=>caches.match(event.request)));
    return;
  }
  const mapPage=new URL("./map3d/index.html",self.registration.scope);
  const mapNavigation=event.request.mode==="navigate"&&url.origin===mapPage.origin&&(url.pathname===mapPage.pathname||url.pathname===mapPage.pathname.replace(/index\.html$/,""));
  // Route parameters select a question in the same static map document, including offline.
  event.respondWith(caches.match(mapNavigation?mapPage.href:event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response}).catch(()=>event.request.mode==="navigate"?caches.match(mapNavigation?mapPage.href:"./index.html"):undefined)));
});
