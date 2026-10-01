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

  // A soft wash of light (or shadow) spreading from the bulb, on top of the colour cross-fade.
  // Purely decorative: the page itself never moves or gets snapshotted.
  var spill = document.createElement("div");
  spill.className = "theme-spill";
  spill.setAttribute("aria-hidden", "true");
  document.body.appendChild(spill);

  function spillFrom(origin, theme) {
    if (!origin || !spill.animate) return;
    var r = origin.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var max = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    spill.style.setProperty("--sx", x + "px");
    spill.style.setProperty("--sy", y + "px");
    spill.style.setProperty("--spill-c", theme === "light" ? "rgba(255, 214, 102, 0.38)" : "rgba(4, 8, 18, 0.42)");
    spill.animate(
      [{ "--spill-r": "0px", opacity: 0 }, { opacity: 1, offset: 0.25 }, { "--spill-r": max * 1.15 + "px", opacity: 0 }],
      { duration: 720, easing: "cubic-bezier(0.4, 0, 0.2, 1)" }
    );
  }

  function changeTheme(theme, origin) {
    if (theme === doc.getAttribute("data-theme")) return;
    if (origin && !(reduceMotion && reduceMotion.matches)) spillFrom(origin, theme);
    crossfadeTo(theme);
  }

  setTheme(doc.getAttribute("data-theme") === "dark" ? "dark" : "light");

  /* ---- Pull-cord lamp: one timeline for the pull, the theme change and the spring back ---- */
  var rig = themeBtn.querySelector(".lamp-rig");
  var cord = themeBtn.querySelector(".lamp-cord");
  var knob = themeBtn.querySelector(".lamp-knob");
  var bulb = themeBtn.querySelector(".lamp-bulb");
  var label = themeBtn.querySelector(".lamp-label");
  var CORD_TOP = 39, CORD_END = 82, KNOB_GAP = 4;
  var pulling = false;           // true while a pull or the first part of its release is playing
  var animId = 0;                // bumping this cancels the running cord animation
  var pose = { s: 0, dx: 0 };    // current cord pose, so a new pull can start from it

  // Cord from the bulb to a knob that can be pulled down (stretch) and sideways (dx).
  function drawCord(stretch, dx, bend, bulbDrop, bulbTilt) {
    var top = CORD_TOP + bulbDrop;
    var endX = 22 + dx, endY = CORD_END + stretch;
    var cx = 22 + dx / 2 + bend, cy = (top + endY) / 2;
    cord.setAttribute("d", "M22 " + top.toFixed(2) + " Q" + cx.toFixed(2) + " " + cy.toFixed(2) + " " + endX.toFixed(2) + " " + endY.toFixed(2));
    knob.setAttribute("cx", endX.toFixed(2));
    knob.setAttribute("cy", (endY + KNOB_GAP).toFixed(2));
    bulb.setAttribute("transform", "translate(0 " + bulbDrop.toFixed(2) + ") rotate(" + bulbTilt.toFixed(2) + " 22 7)");
    label.style.setProperty("--lx", dx.toFixed(2) + "px");
    label.style.setProperty("--ly", stretch.toFixed(2) + "px");
    pose.s = stretch; pose.dx = dx;
  }
  function rest() { drawCord(0, 0, 0, 0, 0); }
  function nextTheme() { return doc.getAttribute("data-theme") === "dark" ? "light" : "dark"; }
  function saveTheme(t) { try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* not persisted */ } }

  // Let go: spring back continuously from wherever the cord was released, with an upward
  // overshoot and a sideways sway that both settle together. The theme switches at release.
  function releaseFrom(s0, x0, next) {
    pulling = true;
    var id = ++animId;
    if (next) { saveTheme(next); changeTheme(next, bulb); }
    var sway = Math.abs(x0) < 3 ? 6 : 0;         // a straight pull still sways a little
    var dropMax = Math.min(s0 * 0.22, 5);
    var elapsed = 0, last = null, TOTAL = 1350, startWall = performance.now();
    function frame(now) {
      if (id !== animId) return;
      // advance by real frame time but never more than ~1/30 s, so a stalled frame
      // (e.g. while the browser snapshots the page for the theme reveal) can't make the cord jump
      if (last !== null) elapsed += Math.min(now - last, 34);
      last = now;
      var r = elapsed / 1000;
      var v = Math.exp(-4.2 * r) * Math.cos(17 * r);           // vertical spring (overshoots up)
      var stretch = s0 * v; if (stretch < 0) stretch *= 0.35;  // cord shortens only a little above rest
      var h = Math.exp(-3.4 * r);
      var dx = x0 * h * Math.cos(12 * r) + sway * h * Math.sin(12 * r);
      var drop = dropMax * v;                                   // bulb bobs with the cord
      drawCord(stretch, dx, -dx * 0.18, drop, -dx * 0.45);
      // the settle can be interrupted after ~450ms of animation, or ~600ms of real time if frames are slow
      if (elapsed > 450 || performance.now() - startWall > 600) pulling = false;
      if (elapsed < TOTAL) requestAnimationFrame(frame);
      else { rest(); pulling = false; }
    }
    requestAnimationFrame(frame);
  }

  // Tap / keyboard: a short automatic pull straight down, then the same release
  function pullLamp(next) {
    pulling = true;
    var id = ++animId;
    var fromS = pose.s, fromX = pose.dx;                         // start from wherever the cord is
    var PULL = 170, elapsed = 0, last = null;
    function frame(now) {
      if (id !== animId) return;
      if (last !== null) elapsed += Math.min(now - last, 34);
      last = now;
      var k = Math.min(elapsed / PULL, 1); k = k * k * (3 - 2 * k);
      var st = fromS + (16 - fromS) * k, x = fromX * (1 - k);
      drawCord(st, x, -x * 0.18, 3.5 * k, -x * 0.45);
      if (k < 1) requestAnimationFrame(frame);
      else releaseFrom(16, 0, next);
    }
    requestAnimationFrame(frame);
  }

  /* Drag: press the cord, pull it down, let go. The cord follows the pointer with rising resistance;
     letting go past the threshold switches the theme, a short pull just springs back. */
  var drag = null, suppressUntil = 0;
  var MAX_STRETCH = 46, SWITCH_AT = 14, TAP_SLOP = 5;

  themeBtn.addEventListener("pointerdown", function (e) {
    if (pulling || (e.pointerType === "mouse" && e.button !== 0)) return;
    if (reduceMotion && reduceMotion.matches) return; // reduced motion: plain tap behaviour only
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, stretch: 0, dx: 0, moved: false };
    animId++;                                                    // grabbing the cord stops any settle
    if (pose.s !== 0 || pose.dx !== 0) rest();
    try { themeBtn.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });

  themeBtn.addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dy = e.clientY - drag.y, dx = e.clientX - drag.x;
    if (!drag.moved && Math.hypot(dx, dy) < TAP_SLOP) return;
    drag.moved = true;
    e.preventDefault();
    var pull = Math.max(dy, 0);
    drag.stretch = MAX_STRETCH * (1 - Math.exp(-pull / 55));      // rubber-band resistance down
    drag.dx = 26 * Math.tanh(dx / 45);                             // and sideways, toward the pointer
    drawCord(drag.stretch, drag.dx, -drag.dx * 0.18, Math.min(drag.stretch * 0.22, 5), -drag.dx * 0.45);
    themeBtn.classList.toggle("is-armed", drag.stretch >= SWITCH_AT);
  });

  function endDrag(e, cancelled) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null;
    themeBtn.classList.remove("is-armed");
    if (!d.moved) return;                 // a tap: let the click handler run the normal pull
    suppressUntil = performance.now() + 400; // a click right after a drag is not a second toggle
    var willSwitch = !cancelled && d.stretch >= SWITCH_AT;
    releaseFrom(d.stretch, d.dx, willSwitch ? nextTheme() : null);
  }
  themeBtn.addEventListener("pointerup", function (e) { endDrag(e, false); });
  themeBtn.addEventListener("pointercancel", function (e) { endDrag(e, true); });

  themeBtn.addEventListener("click", function () {
    if (performance.now() < suppressUntil) return;
    if (pulling) return;
    var next = nextTheme();
    saveTheme(next);
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
