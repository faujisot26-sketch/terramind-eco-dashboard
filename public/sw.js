const CACHE = 'terramind-shell-v1';
const SHELL = ['/', '/manifest.webmanifest', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const page = await fetch('/');
    const html = await page.clone().text();
    await cache.put('/', page);
    await cache.addAll(['/manifest.webmanifest', '/favicon.svg']);
    const assets = [...html.matchAll(/(?:src|href)="([^\"]+\.(?:js|css))"/g)].map((match) => match[1]);
    await Promise.all(assets.map(async (asset) => {
      const response = await fetch(asset);
      if (response.ok) await cache.put(asset, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && (request.destination === 'script' || request.destination === 'style' || request.destination === 'font' || request.destination === 'image')) {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      if (request.mode === 'navigate') return (await caches.match('/')) || Response.error();
      throw error;
    }
  })());
});
