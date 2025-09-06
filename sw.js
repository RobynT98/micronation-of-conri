/* sw.js — Micronation of Conri */
const CACHE_NAME = "conri-micronation-v8";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

/* Hjälpare */
const isAssetURL = (req) => {
  const url = new URL(req.url);
  // samma origin + matchar våra ASSETS (tar bort origin)
  if (url.origin !== self.location.origin) return false;
  const path = url.pathname.endsWith("/") ? "./" : `.${url.pathname}`;
  return ASSETS.includes(path);
};

/* Cache-strategier */
async function cacheFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req, { ignoreSearch: true });
  if (cached) return cached;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone());
  return res;
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetch(req);
    // cacha bara same-origin och ok-svar
    if (res && res.ok && new URL(req.url).origin === self.location.origin) {
      cache.put(req, res.clone());
    }
    return res;
  } catch {
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;
    // Navigationsfallback -> index.html
    if (req.mode === "navigate") {
      const fallback = await cache.match("./index.html");
      if (fallback) return fallback;
    }
    throw new Error("Offline and no cache");
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // låt POST/PUT gå direkt

  // Statiska assets: cache-first, allt annat: network-first
  event.respondWith(isAssetURL(request) ? cacheFirst(request) : networkFirst(request));
});

/* Valfritt: möjliggör snabb aktivering via message */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
