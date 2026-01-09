// public/service-worker.js

const CACHE_VERSION = 'v2'; // كل ما تعملي Deploy غيري الرقم
const CACHE_NAME = `enas-clinic-${CACHE_VERSION}`;

const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install: Cache required files
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Activate: Delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Network First (always fetch new code first)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // التحقق من أن الطلب GET فقط و scheme هو http/https
  const isGetRequest = request.method === 'GET';
  const isHttpRequest = url.protocol === 'http:' || url.protocol === 'https:';
  const isSameOrigin = url.origin === self.location.origin;

  // تجنب تخزين طلبات POST، PUT، DELETE أو schemes غير مدعومة
  if (!isGetRequest || !isHttpRequest) {
    event.respondWith(fetch(request));
    return;
  }

  // تجنب تخزين طلبات Firebase API (هذه تحتاج دائماً أن تكون fresh)
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis.com')) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // التحقق من أن الـ response صالح قبل التخزين
        if (response && response.status === 200 && response.type === 'basic' && isSameOrigin) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cloned).catch((err) => {
              // تجاهل أخطاء التخزين بصمت
              console.debug('Cache put failed (this is OK):', err);
            });
          });
        }
        return response;
      })
      .catch(() => {
        // عند فشل الشبكة، حاول جلب من الـ cache
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || new Response('Offline', { status: 503 });
        });
      })
  );
});
