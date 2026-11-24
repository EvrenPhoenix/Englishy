/* Englishy service worker. The cache version and precache list are injected at build time by vite.config.ts.
   The cache prefix keeps the product's original name so caches from earlier versions are still cleaned up. */
const VERSION = __VERSION__;
const CACHE = `linguanest-${VERSION}`;
const PRECACHE = __PRECACHE__;

self.addEventListener("install", (event) => {
  // Precache the app shell and all lessons/grammar/vocabulary bundles so learning works offline.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("linguanest-") && k !== CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// The page asks before activating a new version, so learners are never interrupted mid-lesson.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Never cache API responses (AI replies, status). They may be personal and must stay fresh.
  if (url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          return res;
        } catch {
          const cache = await caches.open(CACHE);
          return (
            (await cache.match("/", { ignoreVary: true })) ||
            (await cache.match("/offline", { ignoreVary: true })) ||
            Response.error()
          );
        }
      })(),
    );
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    // Hashed, immutable build files: cache first.
    event.respondWith(
      caches.match(req, { ignoreVary: true }).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Other static files (icons, manifest): stale-while-revalidate.
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req, { ignoreVary: true });
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => hit);
      return hit || network;
    }),
  );
});
