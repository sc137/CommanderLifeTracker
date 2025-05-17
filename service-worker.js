const CACHE_VERSION = 'v1.0.0'; // Update this to force cache refresh
const CACHE_NAME = `cmdrtrackr-cache-${CACHE_VERSION}`;
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  // Add your icons here:
  '/icon-192.png',
  '/icon-512.png'
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
  const req = event.request;
  const url = new URL(req.url);

  // Network First for API calls (adjust path as needed)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then(response => {
          // Optionally cache API responses here
          return response;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Cache First for core assets
  if (CORE_ASSETS.includes(url.pathname) || url.origin === location.origin) {
    event.respondWith(
      caches.match(req)
        .then(cached => cached || fetch(req))
        .catch(err => {
          console.error('[SW] Fetch error:', err);
          // Fallback: return offline page or a minimal response
          if (req.destination === 'document') {
            return caches.match('/index.html');
          }
        })
    );
    return;
  }

  // Default: try network, fallback to cache
  event.respondWith(
    fetch(req)
      .catch(() => caches.match(req))
  );
});

// Optional: Listen for message to update service worker immediately
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});