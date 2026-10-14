// Minimal service worker so the app is installable on Android/desktop.
// v2: never caches; old caches from earlier versions are cleared on activate.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .catch(() => {})
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", () => {
  // Network-first by default: no custom caching, let the browser handle it.
});
