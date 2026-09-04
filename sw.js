const CACHE_NAME = "freq-cache-v1";

const PRECACHE_URLS = [
  "./",
  "index.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "favicon-16.png",
  "favicon-32.png",
  "apple-touch-icon.png",
];

self.addEventListener("install", event=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event=>{
  event.waitUntil(
    caches.keys().then(names=>
      Promise.all(
        names.filter(name=>name!==CACHE_NAME).map(name=>caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Cache primeiro (abre instantâneo/offline), atualiza em segundo plano (stale-while-revalidate).
// Só cuida de pedidos same-origin — CDNs externos (GSAP, jsPDF, Google Fonts) ficam de fora.
self.addEventListener("fetch", event=>{
  const req = event.request;
  if(req.method !== "GET") return;
  if(new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache=>{
      const cached = await cache.match(req);
      const networkFetch = fetch(req).then(res=>{
        if(res && res.status===200) cache.put(req, res.clone());
        return res;
      }).catch(()=>cached);

      return cached || networkFetch;
    })
  );
});
