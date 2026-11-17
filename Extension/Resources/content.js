(function () {
  "use strict";
  if (window.top !== window || window.__glassToast) return;
  window.__glassToast = true;

  var CAP_MS = 30 * 60 * 1000;   // at most one toast per 30 minutes
  var VISIBLE_MS = 10000;        // auto-dismiss; pauses while touched or focused
  var force = window.GNT_FORCE === true; // demo page only
  var store = (typeof browser !== "undefined" && browser.storage && browser.storage.local) ? browser.storage.local : null;
  var current = null;            // dismiss() of the toast on screen

  function get(keys) {
    if (!store) return Promise.resolve({});
    try { return Promise.resolve(store.get(keys)).catch(function () { return {}; }); } catch (e) { return Promise.resolve({}); }
  }
  function set(obj) { if (store) { try { Promise.resolve(store.set(obj)).catch(function () {}); } catch (e) {} } }

  function legacyCopy(text) {
    return new Promise(function (res, rej) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;font-size:16px;";
      document.body.appendChild(ta); ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta); ok ? res() : rej();
    });
  }
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }
  function hue(str) { var h = 0; for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360; return h; }

  // Dark tinted glass on purpose: a ~80% dark tint keeps text above 4.5:1 even over a pure white page.
  var CSS = [
    ":host{all:initial}",
    "*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}",
    ".toast{position:relative;width:min(344px,calc(100vw - 24px));padding:14px 16px 14px;color:#F8FAFC;",
    "font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;",
    "background:linear-gradient(180deg,rgba(30,41,59,.78),rgba(15,23,42,.84));",
    "border:1px solid rgba(255,255,255,.18);border-top-color:rgba(255,255,255,.34);border-radius:22px;",
    "-webkit-backdrop-filter:blur(18px) saturate(150%);backdrop-filter:blur(18px) saturate(150%);",
    "box-shadow:0 24px 48px rgba(0,0,0,.45),0 4px 10px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.22),inset 0 -1px 0 rgba(0,0,0,.28),inset 0 0 0 1px rgba(255,255,255,.04);",
    "opacity:0;transform:translateY(14px) scale(.98);",
    "transition:opacity .4s cubic-bezier(.2,.8,.2,1),transform .4s cubic-bezier(.2,.8,.2,1)}",
    ".toast.in{opacity:1;transform:none}",
    ".toast::before{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:0;",
    "background:radial-gradient(120% 90% at 0% 0%,rgba(255,255,255,.20),rgba(255,255,255,0) 52%),",
    "linear-gradient(135deg,rgba(255,255,255,.10) 0%,rgba(255,255,255,0) 40%,rgba(125,211,252,.00) 70%,rgba(125,211,252,.10) 100%)}",
    ".toast::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:0;opacity:.14;mix-blend-mode:overlay;",
    "background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\");background-size:160px 160px}",
    ".head,.title,.desc,.code{position:relative;z-index:1}",
    ".head{display:flex;align-items:center;gap:12px;padding-right:44px}",
    ".badge{flex:none;width:36px;height:36px;border-radius:12px;display:grid;place-items:center;",
    "font:700 16px -apple-system,sans-serif;color:#0B1220;box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 4px 10px rgba(0,0,0,.3)}",
    ".meta{min-width:0}",
    ".label{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#CBD5E1}",
    ".partner{margin-top:2px;font-size:13px;font-weight:600;color:#F8FAFC;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".title{margin:12px 0 4px;font-size:16px;font-weight:600;line-height:1.3;text-shadow:0 1px 2px rgba(0,0,0,.35)}",
    ".desc{margin:0 0 12px;font-size:13px;line-height:1.45;color:#CBD5E1;text-shadow:0 1px 2px rgba(0,0,0,.3)}",
    "button{font:600 14px -apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer;touch-action:manipulation;",
    "-webkit-appearance:none;appearance:none;transition:transform .12s ease,background .2s ease}",
    "button:active{transform:scale(.97)}",
    "button:focus-visible{outline:2px solid #7DD3FC;outline-offset:2px}",
    ".code{width:100%;min-height:44px;padding:0 16px;border-radius:14px;color:#7DD3FC;background:rgba(125,211,252,.12);",
    "border:1px dashed rgba(125,211,252,.6);letter-spacing:.04em}",
    ".code.ok{color:#86EFAC;background:rgba(74,222,128,.16);border:1px solid rgba(134,239,172,.65)}",
    ".close{z-index:2;position:absolute;top:4px;right:4px;width:44px;height:44px;border:0;border-radius:22px;background:transparent;color:#CBD5E1;font-size:18px}",
    "@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.toast{background:rgba(15,23,42,.96)}}",
    "@media (prefers-reduced-transparency:reduce),(prefers-contrast:more){.toast::before,.toast::after{display:none}}",
    "@media (prefers-reduced-transparency:reduce){.toast{background:#0F172A;-webkit-backdrop-filter:none;backdrop-filter:none}}",
    "@media (prefers-contrast:more){.toast{background:#0B1220;border:2px solid #E2E8F0;-webkit-backdrop-filter:none;backdrop-filter:none}",
    ".code{border-style:solid}}",
    "@media (prefers-reduced-motion:reduce){.toast{transform:none;transition:opacity .2s linear}}"
  ].join("");

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function show() {
    var perks = window.PERKS; if (!perks || !perks.length) return;
    if (current) current();
    var perk = perks[Math.floor(Math.random() * perks.length)]; // one pick per page load

    var host = document.createElement("div");
    host.style.cssText = "all:initial;position:fixed;z-index:2147483647;right:calc(12px + env(safe-area-inset-right,0px));bottom:calc(28px + env(safe-area-inset-bottom,0px));";
    var root = host.attachShadow({ mode: "closed" });
    var style = document.createElement("style"); style.textContent = CSS; root.appendChild(style);

    var t = el("div", "toast"); t.setAttribute("role", "status"); t.setAttribute("aria-live", "polite");

    var head = el("div", "head");
    var h = hue(perk.partner);
    var badge = el("div", "badge", perk.partner.charAt(0).toUpperCase());
    badge.style.background = "linear-gradient(135deg,hsl(" + h + ",85%,68%),hsl(" + ((h + 45) % 360) + ",80%,58%))";
    badge.setAttribute("aria-hidden", "true");
    var meta = el("div", "meta");
    meta.appendChild(el("div", "label", "PARTNER INSIGHT • SPONSORED"));
    meta.appendChild(el("div", "partner", perk.partner));
    head.appendChild(badge); head.appendChild(meta); t.appendChild(head);

    t.appendChild(el("div", "title", perk.title));
    t.appendChild(el("p", "desc", perk.description));
    var codeBtn = el("button", "code", "Copy code · " + perk.code); codeBtn.type = "button";
    t.appendChild(codeBtn);
    var close = el("button", "close", "✕"); close.type = "button"; close.setAttribute("aria-label", "Dismiss");
    t.appendChild(close);
    root.appendChild(t);
    document.documentElement.appendChild(host);

    var timer = null, gone = false;
    function dismiss() {
      if (gone) return; gone = true; clearTimeout(timer);
      if (current === dismiss) current = null;
      t.style.transform = ""; t.style.transition = ""; t.classList.remove("in");
      setTimeout(function () { if (host.parentNode) host.parentNode.removeChild(host); }, 450);
    }
    current = dismiss;
    function arm() { clearTimeout(timer); timer = setTimeout(dismiss, VISIBLE_MS); }

    close.addEventListener("click", dismiss);
    t.addEventListener("focusin", function () { clearTimeout(timer); });
    t.addEventListener("focusout", arm);

    // Touch: pause the timer; swipe right to dismiss.
    var x0 = null, dx = 0;
    t.addEventListener("touchstart", function (e) { clearTimeout(timer); x0 = e.touches[0].clientX; dx = 0; }, { passive: true });
    t.addEventListener("touchmove", function (e) {
      if (x0 === null) return;
      dx = Math.max(0, e.touches[0].clientX - x0);
      t.style.transition = "none"; t.style.transform = "translateX(" + dx + "px)"; t.style.opacity = String(Math.max(0.2, 1 - dx / 260));
    }, { passive: true });
    t.addEventListener("touchend", function () {
      x0 = null; t.style.transition = "";
      if (dx > 70) { t.style.opacity = ""; dismiss(); }
      else { t.style.transform = ""; t.style.opacity = ""; arm(); }
    }, { passive: true });

    codeBtn.addEventListener("click", function () {
      copy(perk.code).then(function () {
        codeBtn.classList.add("ok"); codeBtn.textContent = "Copied ✓";
        get(["perks"]).then(function (r) { set({ perks: (r.perks || 0) + 1 }); });
        clearTimeout(timer); timer = setTimeout(dismiss, 2200);
      }).catch(function () { codeBtn.textContent = perk.code; });
    });

    requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.add("in"); }); });
    arm();
  }

  if (force) window.__gntReplay = show;

  setTimeout(function () {
    get(["lastToast"]).then(function (r) {
      var now = Date.now();
      if (!force && r.lastToast && now - r.lastToast < CAP_MS) return;
      set({ lastToast: now });
      show();
    });
  }, 1200);
})();
