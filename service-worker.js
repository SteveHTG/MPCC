// ── Morning Pride — MP Composite Crafter PWA ─────────────────────────────────
// Service Worker v1.0 — Cache-first, fully offline capable
// Update CACHE_NAME whenever you redeploy to force clients to refresh.

const CACHE_NAME = 'mp-crafter-v1';

const FILES_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './mp-logo.svg',
];

// ── Install: pre-cache all app files ─────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching app files');
      return cache.addAll(FILES_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ─────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first strategy ───────────────────────────────────────────────
// Serve from cache instantly; fall back to network if not cached.
self.addEventListener('fetch', event => {
  // Only handle GET requests for same-origin resources
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Serve from cache — works offline
        return cached;
      }
      // Not in cache — try network, then cache the response for next time
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        return response;
      }).catch(() => {
        // Offline and not cached — return the main app page as fallback
        return caches.match('./index.html');
      });
    })
  );
});
