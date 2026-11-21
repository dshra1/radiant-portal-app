// Service worker: makes the app installable and shows phone alerts.
// v3: never caches; old caches from earlier versions are cleared on activate. Adds phone alerts (Web Push).
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

self.addEventListener("push", (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch {
    d = { title: "SiteYantra", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(d.title || "SiteYantra", {
      body: d.body || "",
      icon: "/app-icon-192.png",
      badge: "/app-icon-192.png",
      tag: d.tag || undefined,
      renotify: Boolean(d.tag),
      data: { url: d.url || "/" },
    }),
  );
});

// Tapping an alert opens that page in the app (reusing an open window when there is one).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (new URL(w.url).origin === self.location.origin && "focus" in w) {
          return w.navigate(url).then((x) => (x || w).focus()).catch(() => w.focus());
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
