/* Faizul Islam — portfolio behaviour. No dependencies. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Nav: shadow/border after 8px of scroll --------------------------- */
  var nav = document.querySelector(".nav");
  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* --- Mobile nav ------------------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");

  var root = document.documentElement;

  function setNav(open) {
    links.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    // The open menu is a full-viewport overlay, so the page behind it must not scroll.
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
  var mobileQuery = window.matchMedia("(max-width: 767px)");
  var onBreakpoint = function (e) { if (!e.matches) closeNav(); };
  if (mobileQuery.addEventListener) mobileQuery.addEventListener("change", onBreakpoint);
  else if (mobileQuery.addListener) mobileQuery.addListener(onBreakpoint);

  /* --- Scroll-spy ------------------------------------------------------- */
  var spyLinks = Array.prototype.slice.call(
    links.querySelectorAll('a[href^="#"]')
  );
  var sections = spyLinks
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var visible = {};
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          visible[entry.target.id] = entry.isIntersecting
            ? entry.intersectionRatio
            : 0;
        });
        var best = null;
        sections.forEach(function (s) {
          if (visible[s.id] > 0 && (!best || visible[s.id] > visible[best.id])) {
            best = s;
          }
        });
        spyLinks.forEach(function (a) {
          a.classList.toggle(
            "active",
            !!best && a.getAttribute("href") === "#" + best.id
          );
        });
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    );
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* --- Reveal on scroll ------------------------------------------------- */
  var revealables = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || reduceMotion) {
    Array.prototype.forEach.call(revealables, function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var reveal = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    Array.prototype.forEach.call(revealables, function (el) {
      reveal.observe(el);
    });

    // Failsafe: anything already on screen (e.g. a deep link to #work) is shown
    // without waiting on an observer callback, so content is never stuck hidden.
    var showInView = function () {
      Array.prototype.forEach.call(revealables, function (el) {
        if (el.classList.contains("is-visible")) return;
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          el.classList.add("is-visible");
          reveal.unobserve(el);
        }
      });
    };
    showInView();
    window.addEventListener("load", showInView);
    setTimeout(showInView, 1200);
  }

  /* --- Copy email ------------------------------------------------------- */
  var copyBtn = document.querySelector("[data-copy]");
  if (copyBtn) {
    var original = copyBtn.textContent;
    var timer;
    copyBtn.addEventListener("click", function () {
      var value = copyBtn.getAttribute("data-copy");
      var done = function () {
        copyBtn.textContent = "Copied";
        clearTimeout(timer);
        timer = setTimeout(function () {
          copyBtn.textContent = original;
        }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done, fallback);
      } else {
        fallback();
      }
      function fallback() {
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
    });
  }
})();
