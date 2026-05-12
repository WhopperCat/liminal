self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

importScripts('/scramjet/scramjet.all.js');

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const sw = new ScramjetServiceWorker();

// Load config once per SW (re)start rather than on every fetch.
// The ScramjetController's message listener (wired in the constructor above)
// keeps sw.config current after any ctrl.init() call, so this single load
// is the only IDB read needed — even after a browser-killed restart.
const configReady = sw.loadConfig().catch(err => console.error('[scramjet] config load failed:', err));

self.addEventListener('fetch', event => {
  event.respondWith(
    configReady.then(() => {
      if (!sw.config || !sw.route(event)) return fetch(event.request);
      return sw.fetch(event);
    })
  );
});
