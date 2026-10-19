// EP Certs offline cache. Bump VERSION when you change any app file.
const VERSION = "ep-certs-v6";
const SHELL = ["./", "index.html", "config.js", "forms.js", "pdf.js", "jspdf.umd.min.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Only the app's own files are cached. Live lookups (Fergus via Google) always go straight to the network.
  if (new URL(e.request.url).origin !== self.location.origin) return;
  // Serve from cache straight away (works with no signal), refresh the cache in the background.
  e.respondWith(caches.open(VERSION).then(async (cache) => {
    const hit = await cache.match(e.request, { ignoreSearch: true });
    // Fall back to the network, then to a plain error, so a failed request never hangs.
    const net = fetch(e.request).then((r) => { if (r && (r.ok || r.type === "opaque")) cache.put(e.request, r.clone()); return r; }).catch(() => hit || Response.error());
    return hit || net;
  }));
});
