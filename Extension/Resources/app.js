(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var api = (typeof browser !== "undefined" && browser.storage && browser.storage.local) ? browser.storage.local : null;

  // ---- Storage: browser.storage.local with localStorage fallback ----
  function load(keys, defaults) {
    return new Promise(function (resolve) {
      var out = Object.assign({}, defaults);
      if (api) {
        try {
          Promise.resolve(api.get(keys)).then(function (r) { resolve(Object.assign(out, r || {})); })
            .catch(function () { resolve(fromLocal(keys, out)); });
          return;
        } catch (e) {}
      }
      resolve(fromLocal(keys, out));
    });
  }
  function fromLocal(keys, out) {
    keys.forEach(function (k) {
      try { var v = localStorage.getItem("gnt_" + k); if (v !== null) out[k] = JSON.parse(v); } catch (e) {}
    });
    return out;
  }
  function save(obj) {
    if (api) { try { Promise.resolve(api.set(obj)).catch(function () {}); } catch (e) {} }
    Object.keys(obj).forEach(function (k) { try { localStorage.setItem("gnt_" + k, JSON.stringify(obj[k])); } catch (e) {} });
  }

  var state = { notes: "", perks: 0, sessions: 0, briefIndex: 0 };

  // ---- Clock, date, greeting ----
  function tick() {
    var d = new Date();
    $("clock").textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    $("date").textContent = d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    var h = d.getHours();
    var g = h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
    $("greeting").textContent = g + " • Focus Mode Ready";
  }

  // ---- Search ----
  $("searchForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var q = $("searchInput").value.trim();
    if (!q) return;
    var isUrl = /^(https?:\/\/)/i.test(q);
    window.location.href = isUrl ? q : "https://www.google.com/search?q=" + encodeURIComponent(q);
  });

  // ---- Briefings ----
  function renderBrief() {
    var list = window.BRIEFINGS, i = state.briefIndex % list.length, b = list[i];
    $("briefCategory").textContent = b.category;
    $("briefTitle").textContent = b.title;
    $("briefSummary").textContent = b.summary;
    $("briefCount").textContent = (i + 1) + " of " + list.length;
  }
  $("nextBrief").addEventListener("click", function () {
    state.briefIndex = (state.briefIndex + 1) % window.BRIEFINGS.length;
    renderBrief();
    save({ briefIndex: state.briefIndex });
  });

  // ---- Pomodoro (countdown tick only; unrelated to the sponsored card) ----
  var DURATION = 25 * 60 * 1000, remaining = DURATION, endAt = 0, handle = null;
  function fmt(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }
  function drawTimer() { $("timer").textContent = fmt(remaining); }
  function stop() { if (handle) { clearInterval(handle); handle = null; } }
  function step() {
    remaining = endAt - Date.now();
    if (remaining <= 0) {
      stop(); remaining = DURATION; drawTimer();
      state.sessions += 1; renderDock(); save({ sessions: state.sessions });
      return;
    }
    drawTimer();
  }
  $("timerStart").addEventListener("click", function () {
    if (handle) return;
    endAt = Date.now() + remaining;
    handle = setInterval(step, 250);
  });
  $("timerPause").addEventListener("click", function () {
    if (!handle) return;
    remaining = endAt - Date.now(); stop(); drawTimer();
  });
  $("timerReset").addEventListener("click", function () { stop(); remaining = DURATION; drawTimer(); });

  // ---- Notes (debounced autosave) ----
  var noteTimer = null;
  $("notes").addEventListener("input", function () {
    $("saveState").textContent = "Saving…";
    clearTimeout(noteTimer);
    noteTimer = setTimeout(function () {
      state.notes = $("notes").value;
      save({ notes: state.notes });
      $("saveState").textContent = "Saved";
    }, 400);
  });

  // ---- Partner perk: one random pick, once, on DOMContentLoaded. No timers. ----
  var perk = null;
  function pickPerk() {
    perk = window.PERKS[Math.floor(Math.random() * window.PERKS.length)];
    $("perkTitle").textContent = perk.title;
    $("perkDesc").textContent = perk.description;
    $("perkPartner").textContent = perk.partner;
    $("copyLabel").textContent = "Copy code · " + perk.code;
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }
  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;font-size:16px;";
      document.body.appendChild(ta);
      ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      ok ? resolve() : reject();
    });
  }
  $("copyCode").addEventListener("click", function () {
    var btn = $("copyCode");
    copyText(perk.code).then(function () {
      btn.classList.add("copied");
      $("copyLabel").textContent = "Copied ✓";
      state.perks += 1; renderDock(); save({ perks: state.perks });
      setTimeout(function () { btn.classList.remove("copied"); $("copyLabel").textContent = "Copy code · " + perk.code; }, 1800);
    }).catch(function () {
      $("copyLabel").textContent = "Press & hold: " + perk.code;
    });
  });

  function renderDock() {
    $("perksCount").textContent = state.perks;
    $("sessionsCount").textContent = state.sessions;
  }

  document.addEventListener("DOMContentLoaded", function () {
    tick(); setInterval(tick, 1000 * 15); // clock only
    drawTimer();
    pickPerk();
    load(["notes", "perks", "sessions", "briefIndex"], state).then(function (s) {
      state = Object.assign(state, s);
      $("notes").value = state.notes || "";
      renderBrief(); renderDock();
    });
  });
})();
