/* Faizul Islam — portfolio behaviour. No dependencies. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  /* --- Nav: border after 8px, mobile overlay, scroll lock ---------------- */
  function initNav() {
    var nav = $(".nav");
    var toggle = $(".nav-toggle");
    var links = document.getElementById("nav-links");
    if (!nav || !toggle || !links) return;

    function onScroll() { nav.classList.toggle("scrolled", window.scrollY > 8); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    function setNav(open) {
      links.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      // The open menu is a full-viewport overlay, so the page behind must not scroll.
      root.classList.toggle("nav-open", open);
    }
    function closeNav() { setNav(false); }

    toggle.addEventListener("click", function () {
      setNav(toggle.getAttribute("aria-expanded") !== "true");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        closeNav();
        toggle.focus();
      }
    });

    // Leaving mobile width with the overlay open would strand it over the desktop nav.
    var mq = window.matchMedia("(max-width: 767px)");
    var onBreak = function (e) { if (!e.matches) closeNav(); };
    if (mq.addEventListener) mq.addEventListener("change", onBreak);
    else if (mq.addListener) mq.addListener(onBreak);
  }

  /* --- Scroll-spy + single moving underline ------------------------------ */
  function initSpy() {
    var links = document.getElementById("nav-links");
    if (!links) return;
    var underline = $(".nav-underline", links);
    var spyLinks = $$('a[href^="#"]', links);
    var sections = spyLinks
      .map(function (a) { return document.querySelector(a.getAttribute("href")); })
      .filter(Boolean);
    if (!("IntersectionObserver" in window) || !sections.length) return;

    var desktop = window.matchMedia("(min-width: 768px)");
    var active = null;

    function moveUnderline(link) {
      if (!underline) return;
      if (!link || !desktop.matches) { underline.style.opacity = "0"; return; }
      underline.style.opacity = "1";
      underline.style.width = link.offsetWidth + "px";
      underline.style.transform = "translateX(" + link.offsetLeft + "px)";
    }

    var ratios = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        ratios[en.target.id] = en.isIntersecting ? en.intersectionRatio : 0;
      });
      var best = null;
      sections.forEach(function (s) {
        if (ratios[s.id] > 0 && (!best || ratios[s.id] > ratios[best.id])) best = s;
      });
      active = null;
      spyLinks.forEach(function (a) {
        var on = !!best && a.getAttribute("href") === "#" + best.id;
        a.classList.toggle("active", on);
        if (on) active = a;
      });
      moveUnderline(active);
    }, { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] });
    sections.forEach(function (s) { spy.observe(s); });

    window.addEventListener("resize", function () { moveUnderline(active); }, { passive: true });
  }

  /* --- Reveal on scroll, with per-child stagger -------------------------- */
  function initReveal() {
    // Group siblings so each set counts its own stagger from zero.
    $$(".grid-2, .grid-3, .grid-also, .timeline, .research-list, .skill-groups, .award-list")
      .forEach(function (group) {
        Array.prototype.slice.call(group.children).forEach(function (el, i) {
          el.style.setProperty("--i", i);
        });
      });

    var items = $$(".reveal");
    var rails = $$(".timeline");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      rails.forEach(function (t) { t.classList.add("drawn"); });
      return;
    }

    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-visible");
        obs.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });

    // Failsafe: anything already on screen (e.g. a deep link) shows without
    // waiting on an observer callback, so content is never stuck hidden.
    var showInView = function () {
      items.forEach(function (el) {
        if (el.classList.contains("is-visible")) return;
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          el.classList.add("is-visible");
          io.unobserve(el);
        }
      });
    };
    showInView();
    window.addEventListener("load", showInView);
    setTimeout(showInView, 1200);

    // Timeline rail draws itself once the timeline enters view.
    if (rails.length) {
      var railIO = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add("drawn");
          obs.unobserve(en.target);
        });
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });
      rails.forEach(function (r) { railIO.observe(r); });
    }
  }

  /* --- Section number count-up (cosmetic) -------------------------------- */
  function initNumbers() {
    var nums = $$(".sec-num");
    if (!nums.length || reduceMotion || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        obs.unobserve(el);
        var target = parseInt(el.getAttribute("data-num"), 10);
        if (isNaN(target)) return;
        var step = 0;
        var pad = function (n) { return (n < 10 ? "0" : "") + n; };
        var tick = function () {
          el.textContent = pad(step);
          if (step++ < target) setTimeout(tick, 300 / (target + 1));
        };
        tick();
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* --- Split headline text into per-word spans --------------------------- */
  function splitWords(el) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          // split on real whitespace only: \s would also match U+00A0 and
          // undo the non-breaking spaces used to prevent orphan lines
          child.nodeValue.split(/([ \t\r\n]+)/).forEach(function (part) {
            if (!part) return;
            if (/^[ \t\r\n]+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var span = document.createElement("span");
            span.className = "w";
            span.textContent = part;
            frag.appendChild(span);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && !child.classList.contains("w")) {
          walk(child);
        }
      });
    };
    walk(el);
  }

  /* --- Hero entrance ------------------------------------------------------ */
  function initHero() {
    var hero = $(".hero");
    if (!hero) return;
    $$(".words").forEach(splitWords);

    var contactH2 = $("#contact .words");

    if (reduceMotion) {
      hero.classList.add("entered");
      $$(".words").forEach(function (h) { h.classList.add("entered"); });
      return;
    }

    var h1 = $("h1.words", hero);
    var words = h1 ? $$(".w", h1) : [];
    words.forEach(function (w, i) { w.style.setProperty("--d", 120 + i * 50 + "ms"); });
    var tail = 120 + words.length * 50;

    var pill = $(".pill", hero);
    if (pill) pill.style.setProperty("--d", "0ms");
    var eyebrow = $(".eyebrow", hero);
    if (eyebrow) eyebrow.style.setProperty("--d", "60ms");
    [$(".tagline", hero), $(".hero-sub", hero), $(".hero-actions", hero), $(".social-row", hero)]
      .forEach(function (el, i) {
        if (el) el.style.setProperty("--d", tail + i * 80 + "ms");
      });

    requestAnimationFrame(function () {
      hero.classList.add("entered");
      if (h1) h1.classList.add("entered");
    });

    // Contact heading reveals word-by-word like the hero.
    if (contactH2) {
      $$(".w", contactH2).forEach(function (w, i) { w.style.setProperty("--d", i * 40 + "ms"); });
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries, obs) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            en.target.classList.add("entered");
            obs.unobserve(en.target);
          });
        }, { threshold: 0.3 });
        io.observe(contactH2);
      } else {
        contactH2.classList.add("entered");
      }
    }
  }

  /* --- Hero canvas: slow drifting data field ----------------------------- */
  function initField() {
    var canvas = $(".hero-field");
    var hero = $(".hero");
    if (!canvas || !hero) return;
    if (reduceMotion || window.matchMedia("(max-width: 767px)").matches) {
      canvas.remove();
      return;
    }
    var ctx = canvas.getContext("2d");
    if (!ctx) { canvas.remove(); return; }

    var dots = [], w = 0, h = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var mouse = { x: -9999, y: -9999 };
    var raf = null, last = 0;

    function size() {
      var r = hero.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.max(30, Math.min(70, Math.round((w * h) / 16000)));
      dots = [];
      for (var i = 0; i < count; i++) {
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          r: 1.5 + Math.random()
        });
      }
    }

    function frame(t) {
      raf = requestAnimationFrame(frame);
      if (t - last < 16) return;            // cap at ~60fps
      last = t;
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        var dx = mouse.x - d.x, dy = mouse.y - d.y;
        var md = Math.sqrt(dx * dx + dy * dy);
        if (md < 160 && md > 0.1) {         // faint attraction toward the cursor
          d.x += (dx / md) * 0.22;
          d.y += (dy / md) * 0.22;
        }
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0) d.x += w; else if (d.x > w) d.x -= w;
        if (d.y < 0) d.y += h; else if (d.y > h) d.y -= h;

        for (var j = i + 1; j < dots.length; j++) {
          var o = dots[j];
          var lx = d.x - o.x, ly = d.y - o.y;
          var ld = Math.sqrt(lx * lx + ly * ly);
          if (ld < 120) {
            ctx.strokeStyle = "rgba(33,150,243," + (0.16 * (1 - ld / 120)).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(o.x, o.y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = "rgba(33,150,243,0.35)";
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    size();
    window.addEventListener("resize", size, { passive: true });
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener("mouseleave", function () { mouse.x = mouse.y = -9999; });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { start(); } else { stop(); } });
      }, { threshold: 0 }).observe(hero);
    } else {
      start();
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { stop(); } else { start(); }
    });
  }

  /* --- Scroll progress + back to top ------------------------------------- */
  function initScrollChrome() {
    var bar = $(".progress-bar");
    var toTop = $(".to-top");
    if (!bar && !toTop) return;
    var ticking = false;

    function update() {
      ticking = false;
      var max = root.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (bar) bar.style.transform = "scaleX(" + pct + ")";
      if (toTop) toTop.classList.toggle("show", window.scrollY > 600);
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();

    if (toTop) {
      toTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      });
    }
  }

  /* --- Card spotlight ----------------------------------------------------- */
  function initSpotlight() {
    if (reduceMotion) return;
    $$(".card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      }, { passive: true });
    });
  }

  /* --- Cursor glow: a soft torch beam that lags behind the pointer ------- */
  function initCursorGlow() {
    var canvas = document.getElementById("cursor-flow");
    if (!canvas) return;
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduceMotion || !fine || window.innerWidth < 768) { canvas.remove(); return; }
    var ctx = canvas.getContext("2d");
    if (!ctx) { canvas.remove(); return; }

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var raw = { x: -999, y: -999 }, pt = { x: -999, y: -999 };
    var seeded = false, lastMove = 0, alpha = 0, raf = null;

    function resize() {
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    window.addEventListener("mousemove", function (e) {
      raw.x = e.clientX; raw.y = e.clientY;
      if (!seeded) { pt.x = raw.x; pt.y = raw.y; seeded = true; }
      lastMove = performance.now();
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
    document.addEventListener("mouseleave", function () { lastMove = 0; });

    function orb(x, y, r, a) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(33,150,243," + a.toFixed(4) + ")");
      g.addColorStop(1, "rgba(33,150,243,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    function step(now) {
      pt.x += (raw.x - pt.x) * 0.18;
      pt.y += (raw.y - pt.y) * 0.18;
      var idle = lastMove ? now - lastMove : Infinity;
      var target = idle > 1200 ? 0 : 1;
      alpha += (target - alpha) * (target ? 0.22 : 0.12);  // ~200ms in, ~400ms out
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (alpha < 0.005) { alpha = 0; raf = null; return; }
      orb(pt.x, pt.y, 110 + Math.sin(now / 3000 * Math.PI * 2) * 6, 0.16 * alpha);
      orb(pt.x, pt.y, 28, 0.22 * alpha);
      raf = requestAnimationFrame(step);
    }
  }

  /* --- Copy email --------------------------------------------------------- */
  function initCopy() {
    var btn = $("[data-copy]");
    if (!btn) return;
    var label = $(".copy-label", btn);
    var original = label ? label.textContent : btn.textContent;
    var timer;

    function done() {
      btn.classList.add("copied");
      if (label) label.textContent = "Copied";
      clearTimeout(timer);
      timer = setTimeout(function () {
        btn.classList.remove("copied");
        if (label) label.textContent = original;
      }, 2000);
    }
    function fallback(value) {
      var ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (err) { /* no-op */ }
      document.body.removeChild(ta);
    }
    btn.addEventListener("click", function () {
      var value = btn.getAttribute("data-copy");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done, function () { fallback(value); });
      } else {
        fallback(value);
      }
    });
  }

  [initNav, initSpy, initHero, initReveal, initNumbers, initField,
   initScrollChrome, initSpotlight, initCursorGlow, initCopy].forEach(function (fn) {
    try { fn(); } catch (err) { /* one broken module must not stop the rest */ }
  });
})();
