// Minimal service worker so the app is installable on Android/desktop.
// No fetch handler on purpose: an empty one makes the browser start this worker
// before every request (slower page loads) without caching anything.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
