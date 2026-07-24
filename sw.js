/* RetroScaffale service worker.
 *
 * Strategy:
 *  - HTML / JS / CSS  -> network-first (always get the latest code when online,
 *    fall back to cache when offline). This prevents a stale script from being
 *    served next to a fresh page, which would break newly added UI.
 *  - icons / manifest -> cache-first (rarely change, fast + offline).
 *
 * Bump CACHE whenever the shell changes so old caches are cleared on activate.
 */
const CACHE = "retroscaffale-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./data.js",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function putInCache(req, res) {
  if (res && res.ok && res.type === "basic") {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isDoc = req.mode === "navigate";
  const isCode = /\.(?:js|css)$/.test(url.pathname);

  if (isDoc || isCode) {
    // network-first, cache fallback (offline)
    e.respondWith(
      fetch(req)
        .then((res) => putInCache(req, res))
        .catch(() => caches.match(req).then(
          (cached) => cached || (isDoc ? caches.match("./index.html") : undefined)
        ))
    );
    return;
  }

  // cache-first for images / manifest / everything else
  e.respondWith(
    caches.match(req).then((cached) =>
      cached || fetch(req).then((res) => putInCache(req, res))
    )
  );
});
