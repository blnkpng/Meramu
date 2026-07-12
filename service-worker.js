const CACHE_NAME = 'meramu-shell-v1.31.0';
const APP_VERSION = '1.31.0';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/master.css?v=1.31.0',
  './assets/js/config.js?v=1.31.0',
  './assets/js/api.js?v=1.31.0',
  './assets/js/app.js?v=1.31.0',
  './assets/images/logo-meramu.png',
  './assets/icons/favicon-64.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        const results = await Promise.allSettled(
          APP_SHELL.map((url) => cache.add(url))
        );
        const failed = results.filter((result) => result.status === 'rejected');
        if (failed.length === APP_SHELL.length) {
          throw new Error('App shell MERAMU gagal disimpan.');
        }
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('meramu-shell-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'GET_VERSION') {
    event.source?.postMessage({
      type: 'MERAMU_VERSION',
      version: APP_VERSION,
      cacheName: CACHE_NAME
    });
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(event.request));
    return;
  }

  if (url.searchParams.get('v') === APP_VERSION) {
    event.respondWith(cacheFirstVersioned(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetchWithTimeout(request, 6000);
    if (response?.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put('./index.html', response.clone());
    }
    return response;
  } catch {
    return (await caches.match('./index.html')) ||
      (await caches.match('./')) ||
      new Response(
        '<!doctype html><html lang="id"><meta charset="utf-8"><title>MERAMU Offline</title><body><h1>MERAMU sedang offline</h1><p>Hubungkan internet lalu buka kembali aplikasi.</p></body></html>',
        {headers: {'Content-Type': 'text/html;charset=utf-8'}}
      );
  }
}

async function cacheFirstVersioned(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response?.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response?.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || networkPromise;
}

function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(request, {
    cache: 'no-store',
    signal: controller.signal
  }).finally(() => clearTimeout(timeout));
}
