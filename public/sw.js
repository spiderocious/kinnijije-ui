/*
 * The service worker that makes KinniJije installable — and NOTHING ELSE.
 *
 * WHY IT EXISTS: a browser will not offer "Install app" without a registered
 * service worker that has a `fetch` handler. That is the entire reason this
 * file is here.
 *
 * WHY IT CACHES NOTHING, deliberately: caching is what makes a PWA serve a
 * stale build after a deploy, and the fix for that is a cache-versioning
 * strategy nobody wants to debug while shipping daily. So every request goes
 * straight to the network, exactly as it would without a worker. Pushing an
 * update works the same way it does today.
 *
 * WHEN CACHING IS WANTED LATER, the shape is: version a cache name, add an
 * `install` step that precaches the shell, serve cache-first for hashed assets
 * only, and never cache `index.html` or `/api/*`. Do not add it by sprinkling
 * `cache.put` into the handler below.
 */

/**
 * Take over immediately rather than waiting for every tab to close.
 *
 * Safe precisely BECAUSE nothing is cached: there is no old bundle for a new
 * worker to keep serving, so skipping the wait cannot pin somebody to a stale
 * build.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  /**
   * Clear anything a PREVIOUS version of this worker cached.
   *
   * If a caching worker was ever shipped, its caches would otherwise outlive
   * it and keep answering requests this worker passes through — a stale build
   * with no worker left to blame. Cheap insurance, and a no-op in the normal
   * case.
   */
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

/**
 * A fetch handler is REQUIRED for installability, so this is the minimum
 * honest one: hand the request to the network untouched.
 *
 * Not calling `event.respondWith` at all is what makes this a pass-through —
 * the browser handles the request exactly as it normally would, including
 * range requests, redirects and streaming, none of which a naive
 * `fetch(event.request)` proxy preserves correctly.
 */
self.addEventListener('fetch', () => {
  // Intentionally empty. See above.
});
