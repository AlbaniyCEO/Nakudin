const CACHE_VERSION = "nakudin-v2";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const CONTENT_CACHE = `${CACHE_VERSION}-content`;
const SHELL = ["/", "/index.html", "/manifest.json", "/brand/nakudin-icon.png", "/brand/nakudin-logo-transparent.png", "/brand/nakudin-og.png"];
const CONTENT_PATHS = [/^\/products\//, /^\/shops\//, /^\/s\//];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => ![SHELL_CACHE, CONTENT_CACHE].includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CONTENT_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CONTENT_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  return cached || (await network) || caches.match("/index.html");
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api")) return;

  if (url.origin !== self.location.origin) {
    // Recently viewed external product/shop images become available offline.
    if (event.request.destination === "image") event.respondWith(cacheFirst(event.request));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  if (CONTENT_PATHS.some((pattern) => pattern.test(url.pathname)) || event.request.destination === "image") {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});
