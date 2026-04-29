self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

importScripts('/scramjet/scramjet.all.js');

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const sw = new ScramjetServiceWorker();

self.addEventListener('fetch', event => {
  event.respondWith(
    sw.loadConfig()
      .catch(() => {})
      .then(() => {
        if (sw.route(event)) return sw.fetch(event);
        return fetch(event.request);
      })
  );
});
