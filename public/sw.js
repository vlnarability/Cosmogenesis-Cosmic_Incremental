// Cosmogenesis — Service Worker
// Caches the app shell for offline play.
//
// CACHE-STRATEGY:
//   - Navigation requests (HTML pages): network-first, fall back to cache.
//     Ensures players see the latest deployment on reload but can still
//     play offline if the network fails.
//   - Hashed assets (/_next/static/*): cache-first. Safe because the
//     hash in the filename changes whenever the content changes, so a
//     stale cache hit is impossible.
//   - Unhashed static assets (/.svg, /.png, /.ico, etc.): network-first,
//     fall back to cache. PREVENTS the bug where a broken SVG deployed
//     in one commit got cached by the service worker and then served
//     forever — even after the SVG was fixed in a later commit. With
//     network-first, the browser always tries the network first; the
//     cache is only used as a fallback when the network fails.
//
// CACHE-INVALIDATION: bump CACHE_VERSION below to invalidate ALL old
// caches across all users on the next visit. The activate handler
// deletes any cache whose name doesn't match the current version.
//
// FIXES (vs the original sw.js):
//   - response.ok check before caching (don't cache 404/500s permanently)
//   - cache.put wrapped in event.waitUntil (response can't be GC'd
//     before the cache write completes)
//   - network-first strategy for unhashed assets (no more stale SVGs)
//   - CACHE_VERSION bump from v2 → v3 to flush the old broken cache

const CACHE_VERSION = "cosmogenesis-v3";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Assets to precache on install. Only hashed/stable assets belong here.
// Unhashed assets (icon.svg, icon-transparent.svg, etc.) are fetched
// network-first at runtime so they always reflect the latest deployment.
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/robots.txt",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      // Use individually-put + catch — addAll fails atomically if any
      // single request fails, which would break the entire install.
      .then((cache) =>
        Promise.all(
          PRECACHE_URLS.map((url) =>
            fetch(url, { cache: "no-cache" })
              .then((res) => {
                if (!res.ok) throw new Error(`Pre-cache failed for ${url}: ${res.status}`);
                return cache.put(url, res);
              })
              .catch((e) => {
                // eslint-disable-next-line no-console
                console.warn(`[SW] precache skip: ${url}`, e);
              })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            // Delete ANY cache from a previous version (cosmogenesis-* or
            // the older evolution-idle-* naming) so the new code path
            // takes over cleanly.
            .filter(
              (name) =>
                (name.startsWith("cosmogenesis-") || name.startsWith("evolution-idle-")) &&
                name !== STATIC_CACHE &&
                name !== RUNTIME_CACHE
            )
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Helper: cache a response safely. Checks response.ok AND wraps the
// cache.put in waitUntil so the response can't be garbage-collected
// before the cache write finishes. Both were bugs in the original sw.js.
function cacheResponseSafe(event, cache, request, response) {
  if (!response || !response.ok || response.type === "opaque") return response;
  // Clone before caching — the original response is returned to the page.
  event.waitUntil(cache.put(request, response.clone()));
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests.
  if (request.method !== "GET") return;

  // Skip cross-origin requests.
  if (url.origin !== self.location.origin) return;

  // Skip Next.js HMR/dev requests.
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;
  if (url.pathname.includes("hot-update")) return;

  // --- Navigation requests (HTML pages): network-first ---
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cacheResponseSafe(event, cache, request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // --- Hashed assets (/_next/static/*): cache-first ---
  // Safe because the hash in the filename changes whenever the content
  // changes, so a stale cache hit is impossible.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (!response || !response.ok) return response;
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cacheResponseSafe(event, cache, request, copy));
          return response;
        });
      })
    );
    return;
  }

  // --- Unhashed static assets (.svg, .png, .ico, .woff2, etc.):
  // NETWORK-FIRST, fall back to cache. ---
  // FIX-STALE-SVG: the original sw.js used cache-first here, which
  // meant once a broken SVG was cached (e.g., the icon-transparent.svg
  // with the mismatched tag from commit 5030a76), the service worker
  // kept serving the broken version FOREVER — even after the fix in
  // commit 1cf3c76. Network-first ensures the browser always tries the
  // network first; the cache is only used when the network fails.
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|webmanifest)$/)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || !response.ok) {
            // Network returned non-OK (e.g., 404). Don't cache it.
            // Fall back to cache if available.
            if (response && !response.ok) {
              return caches.match(request).then((cached) => cached || response);
            }
            return response;
          }
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cacheResponseSafe(event, cache, request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // --- Default: network-first, fall back to cache ---
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || !response.ok) return response;
        const copy = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cacheResponseSafe(event, cache, request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Handle messages from the page (e.g., manual cache clear).
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
