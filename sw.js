const CACHE_NAME = 'timetable-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/Timetable.css',
  '/Timetable.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache each asset individually with error handling
        return Promise.all(
          ASSETS.map((url) => {
            return fetch(url)
              .then((response) => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return cache.put(url, response);
              })
              .catch((error) => {
                console.warn(`Failed to cache ${url}:`, error);
                // Skip failed requests but continue with others
                return Promise.resolve();
              });
          })
        );
      })
      .then(() => {
        console.log('All assets cached successfully');
        return self.skipWaiting();
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response or fallback to network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Fallback for failed requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});