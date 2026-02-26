const CACHE_NAME = 'anatomy-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/styles/main.css',
  '/assets/styles/annotator.css',
  '/assets/styles/modal.css',
  '/assets/styles/body-operation-form.css',
  '/assets/scripts/utils.js',
  '/assets/scripts/main.js',
  '/assets/scripts/record-manager.js',
  '/assets/scripts/record-statistics.js',
  '/assets/scripts/disease-form.js',
  '/data/anatomical-systems.json',
  '/data/disease-categories.json'
];

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] 安裝中...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] 快取資源');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] 啟動中...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] 刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    }).catch(() => {
      return caches.match('/index.html');
    })
  );
});
