self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
importScripts('/scramjet/scramjet.all.js');

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

self.addEventListener('fetch', event => {
  event.respondWith(
    scramjet.loadConfig().then(() => {
      if (scramjet.route(event)) {
        return scramjet.fetch(event);
      }
      return fetch(event.request);
    })
  );
});
