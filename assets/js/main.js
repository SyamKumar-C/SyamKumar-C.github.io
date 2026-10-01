(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.add("js");

  /* ---- Theme: saved choice wins; otherwise follow the system (light if unknown) ---- */
  var THEME_KEY = "theme";
  var themeBtn = document.querySelector(".theme-toggle");
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var systemDark = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var reduceMotion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var fadeTimer;

  function savedTheme() {
    try {
      var t = localStorage.getItem(THEME_KEY);
      return t === "light" || t === "dark" ? t : null;
    } catch (e) { return null; }
  }

  function setTheme(theme) {
    doc.setAttribute("data-theme", theme);
    var dark = theme === "dark";
    themeBtn.setAttribute("aria-pressed", String(dark));
    themeBtn.title = dark ? "Switch to light theme" : "Switch to dark theme";
    if (themeMeta) themeMeta.setAttribute("content", dark ? "#0b0d11" : "#fafbfc");
  }

  // Synchronised colour cross-fade (fallback, and the short reduced-motion version)
  function crossfadeTo(theme) {
    var ms = parseFloat(getComputedStyle(doc).getPropertyValue("--theme-dur")) || 520;
    if (reduceMotion && reduceMotion.matches) ms = 120;
    doc.classList.add("theme-anim");
    void doc.offsetWidth; // commit current colours so every element starts from the same state
    setTheme(theme);
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(function () { doc.classList.remove("theme-anim"); }, ms + 60);
  }

  // Radial reveal from the toggle, rendered by the browser as part of the theme change itself
  function revealTo(theme, origin) {
    var r = origin.getBoundingClientRect();
    var x = r.left + r.width / 2;
    var y = r.top + r.height / 2;
    var max = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    doc.style.setProperty("--vt-x", x + "px");
    doc.style.setProperty("--vt-y", y + "px");
    doc.style.setProperty("--vt-max", Math.ceil(max / 0.7) + "px"); // mask is solid to 70% of radius
    var vt = document.startViewTransition(function () { setTheme(theme); });
    vt.finished.finally(function () {
      doc.style.removeProperty("--vt-x");
      doc.style.removeProperty("--vt-y");
      doc.style.removeProperty("--vt-max");
    });
  }

  function changeTheme(theme, origin) {
    if (theme === doc.getAttribute("data-theme")) return;
    var canReveal = typeof document.startViewTransition === "function" &&
      !(reduceMotion && reduceMotion.matches) && origin;
    if (canReveal) revealTo(theme, origin);
    else crossfadeTo(theme);
  }

  setTheme(doc.getAttribute("data-theme") === "dark" ? "dark" : "light");

  themeBtn.addEventListener("click", function () {
    var next = doc.getAttribute("data-theme") === "dark" ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* not persisted */ }
    changeTheme(next, themeBtn);
  });

  if (systemDark && systemDark.addEventListener) {
    systemDark.addEventListener("change", function (e) {
      if (!savedTheme()) changeTheme(e.matches ? "dark" : "light", null);
    });
  }

  /* ---- Mobile navigation ---- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");
  var desktop = window.matchMedia("(min-width: 1024px)");

  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
  }

  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });
  menu.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });
  desktop.addEventListener("change", function () { setMenu(false); });

  /* ---- Header border on scroll ---- */
  var header = document.querySelector(".site-header");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- Reveal on scroll (with stagger), timeline draw, metric count-up, active nav link ---- */
  var motionOK = !(reduceMotion && reduceMotion.matches);

  // Siblings in a grid reveal one after another
  [".metrics", ".strengths", ".skills", ".timeline"].forEach(function (sel) {
    var group = document.querySelector(sel);
    if (!group) return;
    group.querySelectorAll(":scope > .reveal").forEach(function (el, i) {
      el.style.setProperty("--stagger", Math.min(i, 6) * 80 + "ms");
    });
  });

  function countUp(el) {
    var to = parseFloat(el.getAttribute("data-to"));
    var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
    if (!motionOK || isNaN(to)) return;
    var start = null, dur = 1100;
    el.textContent = (0).toFixed(dec);
    function step(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (to * eased).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = to.toFixed(dec);
    }
    requestAnimationFrame(step);
  }

  function onRevealed(el) {
    el.classList.add("is-visible");
    el.querySelectorAll(".num[data-to]").forEach(countUp);
    // drop the stagger delay once the entrance has played, so hover feels immediate
    setTimeout(function () { el.classList.add("is-settled"); }, 900);
  }

  if ("IntersectionObserver" in window) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          onRevealed(entry.target);
          revealer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach(function (el) { revealer.observe(el); });

    var timeline = document.querySelector(".timeline");
    if (timeline) {
      var drawer = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { timeline.classList.add("is-drawn"); drawer.disconnect(); }
      }, { threshold: 0.15 });
      drawer.observe(timeline);
    }

    var links = {};
    document.querySelectorAll(".nav-links a").forEach(function (a) {
      links[a.getAttribute("href").slice(1)] = a;
    });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = links[entry.target.id];
        if (!link || !entry.isIntersecting) return;
        Object.keys(links).forEach(function (k) {
          links[k].classList.remove("is-active");
          links[k].removeAttribute("aria-current");
        });
        link.classList.add("is-active");
        link.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll("main section[id]").forEach(function (s) { spy.observe(s); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-visible"); });
    var tl = document.querySelector(".timeline");
    if (tl) tl.classList.add("is-drawn");
  }

  /* ---- Live npm metadata (optional; hidden if the request fails) ---- */
  var meta = document.getElementById("npm-meta");
  if (meta && window.fetch) {
    fetch("https://registry.npmjs.org/required-field-marker/latest", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (pkg) {
        if (!pkg || !pkg.version) return;
        meta.textContent = "Latest version: v" + pkg.version;
        meta.hidden = false;
      })
      .catch(function () { /* keep hidden */ });
  }

  /* ---- Footer year ---- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
