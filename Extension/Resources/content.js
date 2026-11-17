(function () {
  "use strict";
  if (window.top !== window || window.__glassToast) return;
  window.__glassToast = true;

  var CAP_MS = 30 * 60 * 1000;      // at most one toast per 30 minutes
  var VISIBLE_MS = 9000;            // auto-dismiss (a dismissal, not a refresh)
  var store = (typeof browser !== "undefined" && browser.storage && browser.storage.local) ? browser.storage.local : null;
  var force = window.GNT_FORCE === true; // demo page only

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

  var CSS = [
    ":host{all:initial}",
    "*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}",
    ".toast{width:min(340px,calc(100vw - 24px));padding:16px 16px 14px;color:#F8FAFC;",
    "font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;",
    "background:rgba(17,24,39,0.55);border:1px solid rgba(255,255,255,0.16);border-top:1px solid rgba(255,255,255,0.28);",
    "border-radius:22px;-webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);",
    "box-shadow:0 20px 40px rgba(0,0,0,0.45);opacity:0;transform:translateY(16px);",
    "transition:opacity .35s ease,transform .35s ease}",
    ".toast.in{opacity:1;transform:none}",
    ".label{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#94A3B8;padding-right:48px}",
    ".title{margin:8px 0 4px;font-size:16px;font-weight:600;line-height:1.3}",
    ".desc{margin:0 0 12px;font-size:13px;line-height:1.45;color:#94A3B8}",
    ".row{display:flex;align-items:center;justify-content:space-between;gap:10px}",
    ".partner{font-size:12px;color:#94A3B8}",
    "button{font:600 14px -apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer;touch-action:manipulation;",
    "-webkit-appearance:none;appearance:none;transition:transform .12s ease}",
    "button:active{transform:scale(0.97)}",
    ".code{min-height:44px;padding:0 16px;border-radius:14px;color:#38BDF8;background:rgba(56,189,248,0.12);",
    "border:1px dashed rgba(56,189,248,0.55);letter-spacing:.04em}",
    ".code.ok{color:#6EE7B7;background:rgba(52,211,153,0.18);border:1px solid rgba(52,211,153,0.6)}",
    ".close{position:absolute;top:2px;right:2px;width:44px;height:44px;border:0;background:transparent;color:#94A3B8;font-size:20px}"
  ].join("");

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function show() {
    var perks = window.PERKS; if (!perks || !perks.length) return;
    var perk = perks[Math.floor(Math.random() * perks.length)]; // one pick, per page load

    var host = document.createElement("div");
    host.style.cssText = "all:initial;position:fixed;z-index:2147483647;right:max(12px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));";
    var root = host.attachShadow({ mode: "closed" });
    var style = document.createElement("style"); style.textContent = CSS; root.appendChild(style);

    var t = el("div", "toast"); t.setAttribute("role", "status");
    t.appendChild(el("div", "label", "PARTNER INSIGHT • SPONSORED"));
    t.appendChild(el("div", "title", perk.title));
    t.appendChild(el("p", "desc", perk.description));
    var row = el("div", "row");
    row.appendChild(el("span", "partner", perk.partner));
    var codeBtn = el("button", "code", "Copy code · " + perk.code); codeBtn.type = "button";
    row.appendChild(codeBtn); t.appendChild(row);
    var close = el("button", "close", "✕"); close.type = "button"; close.setAttribute("aria-label", "Dismiss");
    t.appendChild(close);
    root.appendChild(t);
    document.documentElement.appendChild(host);

    var timer = null;
    function dismiss() {
      clearTimeout(timer);
      t.classList.remove("in");
      setTimeout(function () { if (host.parentNode) host.parentNode.removeChild(host); }, 400);
    }
    function arm() { clearTimeout(timer); timer = setTimeout(dismiss, VISIBLE_MS); }

    close.addEventListener("click", dismiss);
    t.addEventListener("touchstart", function () { clearTimeout(timer); }, { passive: true });
    t.addEventListener("touchend", arm, { passive: true });
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

  setTimeout(function () {
    get(["lastToast"]).then(function (r) {
      var now = Date.now();
      if (!force && r.lastToast && now - r.lastToast < CAP_MS) return;
      set({ lastToast: now });
      show();
    });
  }, 1200);
})();
