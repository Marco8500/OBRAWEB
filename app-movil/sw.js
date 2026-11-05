// Guarda la app en el dispositivo para que abra rápido y funcione sin conexión.
const CACHE = 'obraweb-v1';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png',
  'icons/apple-touch-icon.png', 'icons/icon.svg', 'fonts/Inter-Regular.otf', 'fonts/Inter-Light.otf'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Primero intenta la red (para recibir mejoras); si no hay conexión, usa la copia guardada.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then((r) => {
      if (r.ok && new URL(e.request.url).origin === location.origin) {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return r;
    }).catch(() => caches.match(e.request))
  );
});
