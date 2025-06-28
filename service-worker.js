const CACHE_VERSION = 'v1.0.1'; // Update this to force cache refresh
const CACHE_NAME = `cmdrtrackr-cache-${CACHE_VERSION}`;
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './state.js',
  './ui.js',
  './events.js',
  './manifest.json',
  // Add your icons here:
  './icon-192.png',
  './icon-512.png'
];

// Install: Cache core assets/app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
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

// Fetch: Cache First for core, Network First for API, fallback to cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

// Optional: Listen for message to update service worker immediately
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
