// Stale-while-revalidate for all same-origin GETs: instant loads and offline play,
// while every visit refreshes the cache in the background, so an engine fix shipped
// to /engine/v1/ reaches all games on the next open. mw0un1ud is stamped at build time.
const CACHE = 'imake-mw0un1ud';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// On localhost (dev) never serve from cache, or edits would show up one reload late.
// To test offline behavior locally, open http://127.0.0.1:5173 instead.
const DEV = self.location.hostname === 'localhost';

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (DEV || req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached ?? network;
    }),
  );
});
