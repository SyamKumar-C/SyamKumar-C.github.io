(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.add("js");

  /* ---- Theme: saved choice wins; otherwise follow the system (light if unknown) ---- */
  var THEME_KEY = "theme";
  var themeBtn = document.querySelector(".lamp");
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
    themeBtn.title = dark ? "Pull to switch to light theme" : "Pull to switch to dark theme";
    if (themeMeta) themeMeta.setAttribute("content", dark ? "#0b0d11" : "#f7f5f1");
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

  /* ---- Pull-cord lamp: one timeline for the pull, the theme change and the spring back ---- */
  var rig = themeBtn.querySelector(".lamp-rig");
  var cord = themeBtn.querySelector(".lamp-cord");
  var knob = themeBtn.querySelector(".lamp-knob");
  var bulb = themeBtn.querySelector(".lamp-bulb");
  var label = themeBtn.querySelector(".lamp-label");
  var CORD_TOP = 39, CORD_END = 82, KNOB_GAP = 4;
  var pulling = false;

  function drawCord(stretch, bend, bulbDrop, bulbTilt) {
    var top = CORD_TOP + bulbDrop;
    var end = CORD_END + stretch;
    var midY = (top + end) / 2;
    cord.setAttribute("d", "M22 " + top.toFixed(2) + " Q" + (22 + bend).toFixed(2) + " " + midY.toFixed(2) + " 22 " + end.toFixed(2));
    knob.setAttribute("cy", (end + KNOB_GAP).toFixed(2));
    bulb.setAttribute("transform", "translate(0 " + bulbDrop.toFixed(2) + ") rotate(" + bulbTilt.toFixed(2) + " 22 7)");
    label.style.setProperty("--ly", stretch.toFixed(2) + "px");
  }

  function pullLamp(next) {
    pulling = true;
    var PULL = 170, TOTAL = 950, switched = false, t0 = null;
    function frame(now) {
      if (t0 === null) t0 = now;
      var t = now - t0;
      var stretch, bend, drop, tilt, swing;
      if (t < PULL) {
        // pull: cord stretches, bows slightly and drags the bulb down
        var k = t / PULL; k = k * k * (3 - 2 * k);
        stretch = 16 * k; bend = 5 * k; drop = 3.5 * k; tilt = -3 * k; swing = 0;
      } else {
        if (!switched) { switched = true; changeTheme(next, bulb); }
        // release: damped spring back with a little sideways swing
        var r = (t - PULL) / 1000;
        var spring = Math.exp(-r * 7.5) * Math.cos(r * 24);
        stretch = 16 * spring;
        drop = 3.5 * Math.max(spring, 0);
        swing = 7 * Math.exp(-r * 5.5) * Math.sin(r * 15);
        bend = 5 * spring - swing * 0.9;
        tilt = swing * 0.6;
      }
      drawCord(stretch, bend, drop, tilt);
      rig.style.setProperty("--swing", swing.toFixed(2) + "deg");
      if (t < TOTAL) requestAnimationFrame(frame);
      else { drawCord(0, 0, 0, 0); rig.style.setProperty("--swing", "0deg"); pulling = false; }
    }
    requestAnimationFrame(frame);
  }

  themeBtn.addEventListener("click", function () {
    if (pulling) return;
    var next = doc.getAttribute("data-theme") === "dark" ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* not persisted */ }
    if (reduceMotion && reduceMotion.matches) changeTheme(next, null);
    else pullLamp(next);
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


  /* ---- Gentle parallax on the hero illustration cards ---- */
  var art = document.querySelector(".hero-art");
  var finePointer = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (art && finePointer && !(reduceMotion && reduceMotion.matches)) {
    var cards = art.querySelectorAll("[data-depth]");
    var hero = document.querySelector(".hero");
    var raf = 0, mx = 0, my = 0;
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0;
        cards.forEach(function (c) {
          var d = parseFloat(c.getAttribute("data-depth")) || 10;
          c.style.setProperty("--px", (-mx * d).toFixed(1) + "px");
          c.style.setProperty("--py", (-my * d).toFixed(1) + "px");
        });
      });
    });
    hero.addEventListener("pointerleave", function () {
      cards.forEach(function (c) { c.style.removeProperty("--px"); c.style.removeProperty("--py"); });
    });
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
