const CACHE_NAME = 'day-tracker-v3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Force le Service Worker à s'installer même si les CDNs ont des soucis de réseau
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // On met d'abord en cache nos fichiers locaux qui sont 100% sûrs d'exister
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie intelligente : On vérifie le cache d'abord, sinon on cherche sur le réseau 
// ET on l'enregistre dans le cache pour la prochaine fois sans réseau !
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(e.request).then((networkResponse) => {
        // Enregistre dynamiquement les polices et designs dans le cache
        if (e.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Si vraiment pas d'internet et fichier absent du cache, on renvoie la page d'accueil
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
