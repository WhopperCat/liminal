/* Axis — app.js */

const $ = id => document.getElementById(id);

const nav         = $('chrome');
const btnBack     = $('btn-back');
const btnFwd      = $('btn-fwd');
const btnReload   = $('btn-reload');
const btnHome     = $('btn-home');
const chromeForm  = $('chrome-form');
const urlBar      = $('url-bar');
const newTab      = $('new-tab');
const searchForm  = $('search-form');
const searchInput = $('search-input');
const statusEl    = $('status');
const tabBarTabs  = $('tab-bar-tabs');
const btnNewTab   = $('btn-new-tab');

const conn = new BareMux.BareMuxConnection('/baremux/worker.js');
const PUBLIC_WISP = 'wss://wisp.mercurywork.shop/wisp/';

// Proxy prefix — must be narrow enough that scramjet's own static files
// (/scramjet/scramjet.all.js etc.) are NOT under this path, otherwise the
// SW intercepts them before they can load and the whole page breaks.
const PROXY_PREFIX = '/scramjet/proxy/';

// ── Tab management ────────────────────────────────────────────────
let tabs = [];
let activeTabId = null;
let nextTabId = 0;

function getActiveTab() {
  return tabs.find(t => t.id === activeTabId) ?? null;
}

function createTabIframe() {
  const iframe = document.createElement('iframe');
  iframe.className = 'proxy-frame';
  iframe.hidden = true;
  iframe.setAttribute('sandbox',
    'allow-same-origin allow-scripts allow-forms allow-popups allow-modals ' +
    'allow-pointer-lock allow-storage-access-by-user-activation ' +
    'allow-orientation-lock allow-presentation'
  );
  document.body.appendChild(iframe);
  return iframe;
}

function openTab(url = null) {
  const id = nextTabId++;
  const iframe = createTabIframe();
  const tab = { id, title: 'New Tab', url: '', iframe, frame: null };
  tabs.push(tab);
  activateTab(id);
  if (url) {
    navigate(url);
  } else {
    searchInput.value = '';
    setTimeout(() => searchInput.focus(), 50);
  }
  return tab;
}

function closeTab(id) {
  const idx = tabs.findIndex(t => t.id === id);
  if (idx === -1) return;
  tabs[idx].iframe.remove();
  tabs.splice(idx, 1);

  if (tabs.length === 0) {
    openTab();
    return;
  }

  if (activeTabId === id) {
    activateTab(tabs[Math.min(idx, tabs.length - 1)].id);
  } else {
    renderTabs();
  }
}

function activateTab(id) {
  for (const t of tabs) t.iframe.hidden = true;
  newTab.hidden = true;

  activeTabId = id;
  const tab = tabs.find(t => t.id === id);
  if (!tab) { renderTabs(); return; }

  if (tab.url) {
    tab.iframe.hidden = false;
    urlBar.value = tab.url;
  } else {
    newTab.hidden = false;
    urlBar.value = '';
    searchInput.value = '';
  }

  renderTabs();
}

const PAGE_ICON = `<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="1" width="10" height="12" rx="1.5"/><line x1="4.5" y1="4.5" x2="9.5" y2="4.5"/><line x1="4.5" y1="7" x2="9.5" y2="7"/><line x1="4.5" y1="9.5" x2="7.5" y2="9.5"/></svg>`;

function renderTabs() {
  tabBarTabs.innerHTML = '';
  for (const tab of tabs) {
    const el = document.createElement('div');
    el.className = 'tab' + (tab.id === activeTabId ? ' active' : '');

    const fav = document.createElement('div');
    fav.className = 'tab-favicon';
    fav.innerHTML = PAGE_ICON;

    const title = document.createElement('span');
    title.className = 'tab-title';
    title.textContent = tab.title;

    const close = document.createElement('button');
    close.className = 'tab-close';
    close.title = 'Close tab';
    close.innerHTML = `<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/></svg>`;
    close.addEventListener('click', e => { e.stopPropagation(); closeTab(tab.id); });

    el.appendChild(fav);
    el.appendChild(title);
    el.appendChild(close);
    el.addEventListener('click', () => activateTab(tab.id));
    tabBarTabs.appendChild(el);
  }
}

// ── URL helpers ───────────────────────────────────────────────────
function toUrl(s) {
  s = s.trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (!s.includes(' ') && /^[a-z0-9-]+(\.[a-z]{2,})(\/.*)?$/i.test(s)) return 'https://' + s;
  return 'https://duckduckgo.com/?q=' + encodeURIComponent(s);
}

// ── Navigation ────────────────────────────────────────────────────
function navigate(url) {
  const ctrl = window.__axisCtrl;
  if (!ctrl) { setStatus('⚠ Proxy not ready.', true); return; }

  const tab = getActiveTab();
  if (!tab) return;

  if (!tab.frame) {
    tab.frame = ctrl.createFrame(tab.iframe);
    tab.frame.addEventListener('urlchange', e => {
      tab.url = e.url;
      if (tab.id === activeTabId) urlBar.value = e.url;
      try {
        const u = new URL(e.url);
        tab.title = u.hostname || 'Loading…';
      } catch (_) {
        tab.title = 'Loading…';
      }
      renderTabs();
    });
  }

  tab.url = url;
  tab.frame.go(url);
  urlBar.value = url;

  try {
    tab.title = new URL(url).hostname || 'Loading…';
  } catch (_) {
    tab.title = 'Loading…';
  }

  newTab.hidden = true;
  tab.iframe.hidden = false;
  renderTabs();
}

// ── Chrome controls ───────────────────────────────────────────────
btnBack.addEventListener('click', () => getActiveTab()?.frame?.back());
btnFwd.addEventListener('click',  () => getActiveTab()?.frame?.forward());

btnReload.addEventListener('click', () => {
  const tab = getActiveTab();
  if (tab?.url) tab.frame?.reload();
  else initProxy();
});

btnHome.addEventListener('click', () => {
  const tab = getActiveTab();
  if (!tab) return;
  tab.url = '';
  tab.title = 'New Tab';
  tab.iframe.hidden = true;
  newTab.hidden = false;
  urlBar.value = '';
  searchInput.value = '';
  renderTabs();
  setTimeout(() => searchInput.focus(), 50);
});

btnNewTab.addEventListener('click', () => openTab());

chromeForm.addEventListener('submit', e => {
  e.preventDefault();
  const v = urlBar.value.trim();
  if (v) navigate(toUrl(v));
});

urlBar.addEventListener('focus', () => urlBar.select());

// ── New-tab search ────────────────────────────────────────────────
searchForm.addEventListener('submit', e => {
  e.preventDefault();
  const v = searchInput.value.trim();
  if (v) navigate(toUrl(v));
});

// ── WISP check ────────────────────────────────────────────────────
function checkWisp(url) {
  return new Promise(resolve => {
    const ws = new WebSocket(url);
    const done = ok => { clearTimeout(t); try { ws.close(); } catch (_) {} resolve(ok); };
    const t = setTimeout(() => done(false), 2500);
    ws.addEventListener('open',  () => done(true));
    ws.addEventListener('error', () => done(false));
  });
}

// ── Proxy init ────────────────────────────────────────────────────
async function initProxy() {
  if (!('serviceWorker' in navigator)) {
    setStatus('⚠ Service workers not supported.', true);
    return;
  }

  try {
    setStatus('Registering service worker…');

    // Remove any old SW registrations with the wrong scope (e.g. /scramjet/)
    // so they can't hold open IDB connections or intercept static assets.
    for (const reg of await navigator.serviceWorker.getRegistrations()) {
      if (!reg.scope.endsWith(PROXY_PREFIX)) await reg.unregister();
    }

    const reg = await navigator.serviceWorker.register('/sw.js', {
      scope: PROXY_PREFIX,
      updateViaCache: 'none',
    });

    await new Promise((resolve, reject) => {
      if (reg.active) { resolve(); return; }
      const sw = reg.installing || reg.waiting;
      if (!sw) { reject(new Error('No service worker found')); return; }
      sw.addEventListener('statechange', function() {
        if (this.state === 'activated') resolve();
        if (this.state === 'redundant')  reject(new Error('Service worker install failed'));
      });
    });

    // Check for SW updates every 30 min and on tab focus
    setInterval(() => reg.update(), 30 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update();
    });

    setStatus('Setting up transport…');
    const localWisp = `wss://${location.host}/wisp/`;
    const wispUrl   = (await checkWisp(localWisp)) ? localWisp : PUBLIC_WISP;

    await conn.setTransport('/epoxy/index.mjs', [{ wisp: wispUrl }]);
    setStatus('Transport: epoxy');

    setStatus('Starting proxy engine…');
    const { ScramjetController } = $scramjetLoadController();
    const ctrl = new ScramjetController({
      prefix: PROXY_PREFIX,
      files: {
        wasm: '/scramjet/scramjet.wasm.wasm',
        all:  '/scramjet/scramjet.all.js',
        sync: '/scramjet/scramjet.sync.js',
      },
    });

    // If ctrl.init() fails because IDB was previously created without its
    // object stores (race from old /scramjet/ scope), delete it and retry.
    try {
      await ctrl.init();
    } catch (e) {
      if (e.message?.includes('object store') || e.message?.includes('IDBDatabase')) {
        await new Promise(resolve => {
          const r = indexedDB.deleteDatabase('$scramjet');
          r.onsuccess = r.onerror = r.onblocked = () => resolve();
        });
        await ctrl.init();
      } else {
        throw e;
      }
    }

    window.__axisCtrl = ctrl;
    setStatus('');
  } catch (e) {
    console.error('[axis] init failed:', e);
    setStatus('⚠ ' + e.message, true);
  }
}

function setStatus(msg, warn = false) {
  statusEl.textContent = msg;
  statusEl.style.color = warn ? '#f66' : '#555';
}

// ── Boot ──────────────────────────────────────────────────────────
// Auto-update: reload when an existing SW is replaced by a newer one.
// prevController is null on first install, so we skip the reload then.
const prevController = navigator.serviceWorker?.controller ?? null;
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (prevController) window.location.reload();
});

openTab();
initProxy();
