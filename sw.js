const CACHE = 'tomas-surfer-v8';

// Borrar todos los caches viejos al activar
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first: siempre intenta la red, cache solo como fallback offline
self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (
    url.includes('firebase') ||
    url.includes('googleapis') ||
    url.includes('gstatic.com/firebasejs')
  ) return;

  e.respondWith(
    fetch(e.request).then(response => {
      if (response.ok && e.request.method === 'GET') {
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return response;
    }).catch(() => caches.match(e.request))
  );
});
