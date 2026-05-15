const CACHE_NAME = 'rrp-cache-v6';
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './offline.html',
  './assets/dealer_rat/Rat_Idle.png',
  './assets/dealer_rat/Rat_Dealing.png',
  './assets/dealer_rat/Rat_Happy.png',
  './assets/dealer_rat/Rat_Smug.png',
  './assets/dealer_rat/Rat_Surprised.png',
  './assets/dealer_rat/Rat_AllIn.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Navigation requests: network-first, fallback to offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => caches.match('./offline.html'))
    );
    return;
  }

  // For other requests, try cache first then network; cache images on the fly
  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached ||
      fetch(event.request).then((response) => {
        try {
          if (event.request.destination === 'image') {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          }
        } catch (e) {
          // ignore
        }
        return response;
      }).catch(() => cached)
    )
  );
});
