self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open('rancangcam-v1').then(function (cache) {
      return cache.addAll([
        '/camera.html',
        '/viewer.html',
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
        'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'
      ]).catch(err => {
        console.error('Cache addAll failed:', err);
      });
    })
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    })
  );
});
