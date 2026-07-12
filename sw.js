// 競馬 期待値ボックス - service worker (ホスティング時のみ有効)
const C = 'ev-box-v9';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // data.js / auto.js / results.js は network-first（最新の買い目・検証ログを優先、オフライン時はキャッシュ）
  if (url.pathname.endsWith('data.js') || url.pathname.endsWith('auto.js') || url.pathname.endsWith('results.js')) {
    e.respondWith(
      fetch(e.request)
        .then(r => { const copy = r.clone(); caches.open(C).then(c => c.put(e.request, copy)); return r; })
        .catch(() => caches.match(e.request))
    );
  } else {
    // それ以外はcache-first
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
