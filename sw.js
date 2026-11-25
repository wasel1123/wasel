/* ===== sw.js: يخلي صفحات واصل تفتح على طول من الموبايل (v2) =====
   الصفحات وbridge.js: من النت الأول عشان أي تحديث يوصل من أول فتحة (ولو النت بطيء أو مقطوع: آخر نسخة محفوظة).
   الصور والأيقونات: من المحفوظ فورًا وبتتحدث في الخلفية. البيانات (الطلبات وغيره) مش بتتحفظ هنا خالص. */
var C = "wasel-fast-v2";
self.addEventListener("install", function (e) { self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== C; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
function fresh(r) { var p = new URL(r.url).pathname; return r.mode === "navigate" || /\.(html|js)$/.test(p) || /\/$/.test(p); }
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET") return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  e.respondWith(caches.open(C).then(function (c) {
    return c.match(r).then(function (hit) {
      var net = fetch(r).then(function (res) { if (res && res.ok) c.put(r, res.clone()); return res; });
      if (!fresh(r)) return hit ? (net.catch(function () {}), hit) : net;
      return new Promise(function (ok) {
        var done = false, t = hit ? setTimeout(function () { if (!done) { done = true; ok(hit); } }, 2500) : 0;
        net.then(function (res) { if (!done) { done = true; clearTimeout(t); ok(res); } })
           .catch(function () { if (!done) { done = true; clearTimeout(t); ok(hit || Response.error()); } });
      });
    });
  }));
});
