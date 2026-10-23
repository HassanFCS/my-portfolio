// Small enhancements only: theme toggle, mobile nav, scroll-spy, reveal, year.
(function () {
  "use strict";
  var root = document.documentElement;

  // --- theme ---
  var toggle = document.querySelector(".theme-toggle");
  function currentTheme() {
    var set = root.getAttribute("data-theme");
    if (set) return set;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  }

  // --- mobile nav ---
  var navToggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");
  if (navToggle && menu) {
    navToggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        menu.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // --- scroll-spy ---
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav-menu a[href^='#']"));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute("href")); }).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id); });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  // --- reveal on scroll ---
  // Progressive enhancement: elements fade in as they enter the viewport.
  // A scroll fallback and a timed safety net guarantee nothing stays hidden.
  var targets = Array.prototype.slice.call(document.querySelectorAll(
    ".section-title, .engagement, .project, .skill-group, .edu li, .certs li, #about .lede"
  ));
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced && targets.length) {
    targets.forEach(function (el) { el.classList.add("reveal"); });
    var pending = targets.slice();
    function show(el) { el.classList.add("in"); pending = pending.filter(function (p) { return p !== el; }); }
    function check() {
      var limit = window.innerHeight * 1.1;
      pending.slice().forEach(function (el) { if (el.getBoundingClientRect().top < limit) show(el); });
      if (!pending.length) window.removeEventListener("scroll", onScroll);
    }
    var ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { ticking = false; check(); });
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { show(entry.target); io.unobserve(entry.target); }
        });
      }, { rootMargin: "0px 0px 10% 0px", threshold: 0 });
      targets.forEach(function (el) { io.observe(el); });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    check();
    setTimeout(function () { pending.slice().forEach(show); }, 2500);
  }

  // --- year ---
  var y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
})();
