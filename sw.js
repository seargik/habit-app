const CACHE="habit-app-main-v16";
const ASSETS=[
  "./",
  "./index.html",
  "./styles.css?v=16",
  "./daybook-v4.css?v=16",
  "./migration-v4.js?v=16",
  "./daybook.js?v=16",
  "./compatibility.js?v=16",
  "./app-v4.js?v=16",
  "./progress.js?v=16",
  "./media.js?v=16",
  "./text-export.js?v=16",
  "./progress-summary.js?v=16",
  "./interface.js?v=16",
  "./settings-relations.js?v=16",
  "./i18n-ru.json?v=16",
  "./i18n-de.json?v=16",
  "./i18n-lt.json?v=16",
  "./i18n-es.json?v=16",
  "./i18n-fr.json?v=16",
  "./manifest.webmanifest?v=16",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>(key.startsWith("habit-app-main-")||key.startsWith("life-tracker-"))&&key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET") return;
  const url=new URL(request.url);
  const sameOrigin=url.origin===self.location.origin;
  const appCode=sameOrigin&&(request.mode==="navigate"||request.destination==="document"||request.destination==="script"||request.destination==="style");
  if(appCode){
    event.respondWith(
      fetch(request,{cache:"no-store"})
        .then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response;})
        .catch(()=>caches.match(request).then(cached=>cached||caches.match("./index.html")))
    );
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(sameOrigin&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}return response;})));
});
