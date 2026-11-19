// Dragonnet 1.8.3 : service worker du site (écrit par scripts/build-site.mjs, ne pas modifier à la main)
const V = "dragonnet-1.8.3";
const PRE = ['/jouer/', '/manifest.webmanifest', '/icone-192.png', '/icone-512.png', '/icone-180.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(PRE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('dragonnet-') && k !== V).map(k => caches.delete(k))))
  .then(() => self.clients.claim())); });
const keep = (r, res) => { if (res && res.ok && res.type === 'basic'){ const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)).catch(() => {}); } return res; };
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || r.headers.has('range')) return;
  const u = new URL(r.url); if (u.origin !== location.origin || u.pathname === '/version.json' || u.pathname === '/sw.js') return;
  if (r.mode === 'navigate'){ e.respondWith(fetch(r).then(res => keep(r, res)).catch(() => caches.match(r, { ignoreSearch:true }).then(m => m || caches.match('/jouer/')))); return; }
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => keep(r, res))));
});
