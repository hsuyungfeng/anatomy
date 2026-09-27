const CACHE_NAME = 'anatomy-v15';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/styles/main.css',
  '/assets/styles/annotator.css',
  '/assets/styles/modal.css',
  '/assets/styles/body-operation-form.css',
  '/assets/styles/odontogram.css',
  '/assets/styles/anatomy-diagrams.css',
  '/assets/scripts/utils.js',
  '/assets/scripts/eye-descriptions.js',
  '/assets/scripts/image-annotator.js',
  '/assets/scripts/disease-form.js',
  '/assets/scripts/body-operation-form.js',
  '/assets/scripts/ocr-handler.js',
  '/assets/scripts/disease-data-migration.js',
  '/assets/scripts/record-manager.js',
  '/assets/scripts/record-statistics.js',
  '/assets/scripts/eye-structure-info.js',
  '/assets/scripts/odontogram.js',
  '/assets/scripts/svg-viewport.js',
  '/assets/scripts/anatomy-mapping.js',
  '/assets/scripts/eye-diagram.js',
  '/assets/scripts/body-map.js',
  '/assets/scripts/app/app-core.js',
  '/assets/scripts/app/app-eye.js',
  '/assets/scripts/app/app-tooth.js',
  '/assets/scripts/app/app-body.js',
  '/assets/scripts/app/app-modal.js',
  '/assets/scripts/app/app-records.js',
  '/assets/scripts/main.js',
  '/data/anatomical-systems.json',
  '/data/body-coordinates.json',
  '/data/body-legacy-map.json',
  '/data/body-systems.json',
  '/data/dental-coordinates.json',
  '/data/disease-categories.json',
  '/data/eye-coordinates.json',
  '/data/eye-image-labels.json',
  '/data/eye-label-mappings.json',
  '/data/tooth-numbering.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/tesseract.js@6',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS_TO_CACHE.map((url) => {
          const req = (url.startsWith('http://') || url.startsWith('https://'))
            ? new Request(url, { mode: 'no-cors' })
            : new Request(url);
          return fetch(req).then((response) => {
            return cache.put(req, response);
          }).catch((err) => {
            console.error('[ServiceWorker] 快取資源失敗:', url, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
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
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isCDN = url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'cdnjs.cloudflare.com';

  // 1. 同源圖片：cache-first（體積大、罕變動）
  if (isSameOrigin && url.pathname.startsWith('/assets/images/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. CDN 資源：cache-first（允許快取 opaque 回應）
  if (isCDN) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. 同源程式碼與資料：network-first（優先取得伺服器最新版本）
  if (isSameOrigin) {
    event.respondWith(
      fetch(request, { cache: 'no-cache' }).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return networkResponse;
      }).catch(async () => {
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }
        if (request.mode === 'navigate') {
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
          return caches.match('/');
        }
        return null;
      })
    );
    return;
  }
});
