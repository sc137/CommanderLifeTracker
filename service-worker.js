const CACHE_VERSION = '0.5.2e';
const CACHE_NAME = `cmdrtrackr-cache-${CACHE_VERSION}`;
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './constants.js',
  './state.js',
  './ui.js',
  './game-actions.js',
  './events.js',
  './settings-controller.js',
  './version.json',
  './manifest.json',
  './resources/logo.png',
  './icon-192.png',
  './icon-512.png'
];

// Install: Cache core assets/app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(
        CORE_ASSETS.map(asset => new Request(asset, { cache: 'reload' }))
      ))
      .catch(err => {
        console.error('[SW] Install cache error:', err);
      })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for app assets so online clients pick up new deploys.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.ok) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        if (event.request.mode === 'navigate') {
          const appShell = await cache.match('./index.html');
          if (appShell) {
            return appShell;
          }
        }

        throw error;
      }
    })
  );
});

// Optional: Listen for message to update service worker immediately
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
