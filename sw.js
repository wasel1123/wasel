/* ===== sw.js: يخلي صفحات واصل تفتح على طول من الموبايل =====
   بيعرض آخر نسخة محفوظة فورًا، وفي نفس الوقت بيجيب الجديدة من GitHub للمرة الجاية.
   البيانات نفسها (الطلبات وغيره) مش بتتحفظ هنا، دي دايمًا بتيجي من السيرفر مباشرة. */
var C = "wasel-fast-v1";
self.addEventListener("install", function (e) { self.skipWaiting(); });
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== C; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET") return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin) return;          // السيرفر والخطوط وغيره: من غير تدخل
  e.respondWith(caches.open(C).then(function (c) {
    return c.match(r).then(function (hit) {
      var net = fetch(r, { cache: "no-cache" }).then(function (res) { if (res && res.ok) c.put(r, res.clone()); return res; }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
