/* مدرستي — عاملُ الخدمة: هيكلُ التطبيقِ من الذاكرة، والبياناتُ من الشبكةِ أوّلاً */
var V = 'madrasa-v2';
var SHELL = ['/madrasa/', '/madrasa/index.html', '/madrasa/css/madrasa.css?v=2', '/madrasa/js/fb.js?v=2', '/madrasa/js/charts.js?v=2', '/madrasa/js/app.js?v=2', '/madrasa/manifest.webmanifest',
  '/admin/js/gh-api.js', '/img/logo-cream.svg', '/img/logo-dark.svg', '/fonts/sakkal-400.woff2', '/fonts/sakkal-700.woff2', '/fonts/poster-700.woff2', '/fonts/poster-900.woff2', '/nav/nav.js', '/nav/nav.css'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(V).then(function (c) { return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () { }); })); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; /* فايرستور وGitHub لا تُلمَس */
  if (u.pathname.indexOf('/madrasa/data/') === 0 || u.pathname.indexOf('/madrasa/prep/') === 0) {
    /* الشبكةُ أوّلاً ثمّ الذاكرة */
    e.respondWith(fetch(e.request).then(function (r) { var cp = r.clone(); caches.open(V).then(function (c) { c.put(e.request, cp); }); return r; }).catch(function () { return caches.match(e.request); }));
    return;
  }
  /* الهيكل: الذاكرةُ أوّلاً مع تحديثٍ في الخلفية */
  e.respondWith(caches.match(e.request, { ignoreSearch: false }).then(function (hit) {
    var net = fetch(e.request).then(function (r) { if (r && r.ok) { var cp = r.clone(); caches.open(V).then(function (c) { c.put(e.request, cp); }); } return r; }).catch(function () { return hit; });
    return hit || net;
  }));
});
