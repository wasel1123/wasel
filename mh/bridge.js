/* ===== bridge.js (المحلة): الصفحات السريعة (على GitHub) بتكلم سيرفر واصل (Apps Script) =====
   بيخلي الصفحات تستخدم google.script.run زي ما هي بالظبط، بس الطلب بيروح لـ Api.gs على السيرفر.
   ومرة واحدة بس: بينقل البيانات المحفوظة على الجهاز من الصفحات القديمة (الاسم والرقم ورمز المندوب...). */
(function () {
  var API = "https://script.google.com/macros/s/AKfycbw6vRRRa_9l9K1OvtWcfQXyXBtrCY5wGXSsuSgx0eiUku0smp-Q6TLedPxq1_9blW1T/exec";
  try { window.WASEL_API = API; } catch (e) {}   // لتطبيق أندرويد: يبعت موقع المندوب لنفس السيرفر

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* اللغة لو جاية في الرابط (?lang=ar أو en) تتثبت قبل ما الصفحة تقراها */
  try { var lg = new URLSearchParams(location.search).get("lang"); if (lg === "ar" || lg === "en") ls("wl", lg); } catch (e) {}

  /* أمان: لو السيرفر الجديد مش شغال لأي سبب، الصفحة تتحول لوحدها للصفحة القديمة على Apps Script (فمفيش حاجة تقف) */
  var FB = { "customer.html": "", "courier.html": "page=courier", "track.html": "page=track", "register.html": "page=register",
    "restaurant.html": "page=restaurant", "restaurant-register.html": "page=restaurant-register", "legal.html": "page=terms" };
  function fallback() {
    if (window.__waselFb) return; window.__waselFb = 1;
    var f = (location.pathname.split("/").pop() || "customer.html"), q = FB[f] !== undefined ? FB[f] : "";
    var rest = (location.search || "").replace(/^\?/, "").split("&").filter(function (x) { return x && !/^(page|p)=/.test(x); }).join("&");
    if (f === "legal.html") { try { var pp = new URLSearchParams(location.search).get("p") || "terms-customer"; q = "page=" + ({ "terms-customer": "terms", "privacy-customer": "privacy" }[pp] || pp); } catch (e) {} }
    var qs = [q, rest].filter(Boolean).join("&");
    location.replace(API + (qs ? "?" + qs : ""));
  }

  /* نداء دالة على السيرفر */
  function call(fn, args, ok, bad, uo) {
    var tries = 0;
    function go() {
      tries++;
      fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ fn: fn, args: args }), redirect: "follow", cache: "no-store" })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.e === "not allowed") { fallback(); return; }   // السيرفر لسه من غير Api.gs
          if (d && d.e !== undefined) { if (bad) bad(new Error(d.e), uo); }
          else if (ok) ok(d ? d.r : null, uo);
        })
        .catch(function (err) {
          if (tries < 2 && navigator.onLine !== false) { setTimeout(go, 700); return; }   // محاولة تانية لو النت قطع لحظة
          if (navigator.onLine !== false) { fallback(); return; }   // السيرفر الجديد مش بيرد: نرجع للصفحة القديمة
          if (bad) bad(err, uo);
        });
    }
    go();
  }

  /* نفس شكل google.script.run: withSuccessHandler / withFailureHandler / withUserObject ثم اسم الدالة */
  function runner(ok, bad, uo) {
    return new Proxy({}, {
      get: function (t, k) {
        if (k === "withSuccessHandler") return function (h) { return runner(h, bad, uo); };
        if (k === "withFailureHandler") return function (h) { return runner(ok, h, uo); };
        if (k === "withUserObject") return function (u) { return runner(ok, bad, u); };
        if (typeof k !== "string") return undefined;
        return function () { call(k, Array.prototype.slice.call(arguments), ok, bad, uo); };
      }
    });
  }

  function loc() {
    var p = {}, ps = {};
    try { new URLSearchParams(location.search).forEach(function (v, k) { if (!(k in p)) p[k] = v; (ps[k] = ps[k] || []).push(v); }); } catch (e) {}
    return { parameter: p, parameters: ps, hash: (location.hash || "").replace(/^#/, ""), queryString: (location.search || "").replace(/^\?/, "") };
  }

  window.google = window.google || {};
  window.google.script = {
    run: runner(null, null, undefined),
    url: { getLocation: function (cb) { setTimeout(function () { try { cb(loc()); } catch (e) {} }, 0); } },
    host: { close: function () {}, setHeight: function () {}, setWidth: function () {}, origin: location.origin, editor: { focus: function () {} } }
  };

  /* ===== نقل البيانات مرة واحدة من الصفحات القديمة ===== */
  if (ls("wmig") === "1") return;
  var n = parseInt(ls("wmign") || "0", 10) || 0;
  if (n >= 3) { ls("wmig", "1"); return; }      // 3 محاولات بس، وبعدها نكمل عادي
  ls("wmign", String(n + 1));
  function start() {
    var fr = document.createElement("iframe"), done = false;
    fr.style.cssText = "position:absolute;width:1px;height:1px;border:0;left:-9999px;top:-9999px";
    fr.setAttribute("aria-hidden", "true"); fr.tabIndex = -1;
    function finish(copied) {
      if (done) return; done = true;
      window.removeEventListener("message", onMsg);
      try { fr.parentNode && fr.parentNode.removeChild(fr); } catch (e) {}
      if (copied) { ls("wmig", "1"); location.reload(); }
    }
    function onMsg(e) {
      var host = ""; try { host = new URL(e.origin).hostname; } catch (x) { return; }
      if (!/\.googleusercontent\.com$/.test(host)) return;
      var d = e.data; if (!d || d.wasel !== "mig" || typeof d.data !== "object") return;
      var copied = 0;
      Object.keys(d.data).forEach(function (k) {
        if (k === "wmig" || k === "wmign" || k.length > 40) return;
        if (ls(k) === null) { ls(k, String(d.data[k])); copied++; }
      });
      ls("wmig", "1");
      finish(copied > 0);
    }
    window.addEventListener("message", onMsg);
    fr.src = API + "?page=migrate";
    setTimeout(function () { finish(false); }, 15000);
    (document.body || document.documentElement).appendChild(fr);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
