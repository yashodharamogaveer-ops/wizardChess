/* Wizard Chess service worker — generated at build time (see vite.config.ts).
   Precaches the whole app (including 3D models) so it works fully offline. */
const VERSION = '__BUILD_VERSION__';
const CACHE = `wizard-chess-${VERSION}`;
const PRECACHE = __PRECACHE_LIST__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Core files first (must succeed), large 3D models after (best effort)
      const core = PRECACHE.filter((u) => !u.includes('/glb/'));
      const heavy = PRECACHE.filter((u) => u.includes('/glb/'));
      await cache.addAll(core);
      await Promise.all(heavy.map((u) => cache.add(u).catch(() => null)));
      const clients = await self.clients.matchAll({ includeUncontrolled: true });
      clients.forEach((c) => c.postMessage({ type: 'OFFLINE_READY' }));
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('wizard-chess-') && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Page navigations: network first, fall back to cached shell when offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // Everything else: cache first, then network (and store)
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
    )
  );
});
