/* ===== bridge.js: الصفحات السريعة (على GitHub) بتكلم سيرفر واصل (Apps Script) =====
   بيخلي الصفحات تستخدم google.script.run زي ما هي بالظبط، بس الطلب بيروح لـ Api.gs على السيرفر.
   ومرة واحدة بس: بينقل البيانات المحفوظة على الجهاز من الصفحات القديمة (الاسم والرقم ورمز المندوب...). */
(function () {
  var API = "https://script.google.com/macros/s/AKfycbwmS0DX-pqH17-cKKftKNqjVzD3lMuskpL8MvFKJpfSGt3uyVk5bli1dWeGOq782YbnLg/exec";

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* اللغة لو جاية في الرابط (?lang=ar أو en) تتثبت قبل ما الصفحة تقراها */
  try { var lg = new URLSearchParams(location.search).get("lang"); if (lg === "ar" || lg === "en") ls("wl", lg); } catch (e) {}

  /* نداء دالة على السيرفر */
  function call(fn, args, ok, bad, uo) {
    var tries = 0;
    function go() {
      tries++;
      fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ fn: fn, args: args }), redirect: "follow", cache: "no-store" })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.e !== undefined) { if (bad) bad(new Error(d.e), uo); }
          else if (ok) ok(d ? d.r : null, uo);
        })
        .catch(function (err) {
          if (tries < 2 && navigator.onLine !== false) { setTimeout(go, 700); return; }   // محاولة تانية لو النت قطع لحظة
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
