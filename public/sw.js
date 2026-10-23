// Cosmogenesis — Service Worker
// Caches the app shell for offline play
// Uses a cache-first strategy for static assets and network-first for the main page

const CACHE_VERSION = "cosmogenesis-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Assets to precache on install
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/icon.svg",
  "/robots.txt",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) =>
            (name.startsWith("cosmogenesis-") || name.startsWith("evolution-idle-")) &&
            name !== STATIC_CACHE && name !== RUNTIME_CACHE
          )
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip Next.js HMR/dev requests
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;
  if (url.pathname.includes("hot-update")) return;

  // For navigation requests (HTML pages), try network first, fall back to cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // For static assets (_next/static, images, etc.), cache first
  if (url.pathname.startsWith("/_next/static/") || url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff2?)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        });
      })
    );
    return;
  }

  // Default: network first, fall back to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Handle messages from the page (e.g., manual cache clear)
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
