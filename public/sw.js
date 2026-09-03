// Minimal service worker so the app is installable on Android/desktop.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // Network-first by default: no custom caching, let the browser handle it.
});
