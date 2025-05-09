// Service Worker for UniNeeds Hub
const CACHE_NAME = 'unineeds-cache-v2';

// Assets to cache for offline use
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './icon-192x192.png',
  './icon-512x512.png',
  './placeholder.svg'
];

// Do not cache these URLs - they should always go to the network
const UNCACHEABLE_URLS = [
  '/login',
  '/register',
  '/api/auth',
  'supabase.co',
  'auth/v1',
  'auth/session',
  'auth/token',
  'otkhxrrbiqdutlgfkfdm.supabase.co'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => console.error('Cache open failed:', err))
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          console.log('Service Worker: Deleting old cache', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  event.waitUntil(self.clients.claim());
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Always bypass the cache for certain URLs
  if (UNCACHEABLE_URLS.some(url => event.request.url.includes(url))) {
    // For auth/login/register requests, do not use the service worker cache
    // Just let the browser handle them directly
    return;
  }
  
  // For API requests or Supabase requests, bypass cache completely
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase.co') || 
      event.request.url.includes('/auth/')) {
    return;
  }
  
  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Clone the request - request can only be used once
        const fetchRequest = event.request.clone();
        
        // Make network request
        return fetch(fetchRequest)
          .then((response) => {
            // Check for valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response - it can only be used once
            const responseToCache = response.clone();
            
            // Add response to cache for future
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(err => {
            console.error('Fetch failed:', err);
            // Return a custom offline page or fallback content if available
            // return caches.match('./offline.html');
          });
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Add support for clearing caches on demand
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('Caches cleared successfully');
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      })
    );
  }
});
