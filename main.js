(function () {
  const LANG_KEY = "lab-lang";
  const THEME_KEY = "lab-theme";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let currentLang = "es";
  let theme = "dark";

  function pack() {
    return (window.LAB_I18N && (window.LAB_I18N[currentLang] || window.LAB_I18N.es)) || {};
  }

  function applyLang(code, persist) {
    currentLang = code === "en" ? "en" : "es";
    const t = pack();
    document.documentElement.lang = t.htmlLang || currentLang;
    document.documentElement.setAttribute("data-lang", currentLang);
    if (t.title) document.title = t.title;
    $$("[data-i18n]").forEach((el) => {
      const k = el.getAttribute("data-i18n");
      if (t[k]) el.textContent = t[k];
    });
    $$("[data-i18n-html]").forEach((el) => {
      const k = el.getAttribute("data-i18n-html");
      if (t[k]) el.innerHTML = t[k];
    });
    $$("[data-set-lang]").forEach((b) => {
      const on = b.getAttribute("data-set-lang") === currentLang;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("is-active", on);
    });
    if (persist !== false) {
      try { localStorage.setItem(LANG_KEY, currentLang); } catch (e) {}
      const url = new URL(location.href);
      url.searchParams.set("lang", currentLang);
      history.replaceState(null, "", url);
    }
  }

  function applyTheme() {
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f3f0e7" : "#06070a");
    $$("[data-set-theme]").forEach((btn) => {
      const on = btn.getAttribute("data-set-theme") === theme;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
  }

  function setTheme(next, persist) {
    theme = next === "light" ? "light" : "dark";
    if (persist !== false) {
      try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
      const url = new URL(location.href);
      url.searchParams.set("theme", theme);
      history.replaceState(null, "", url);
    }
    applyTheme();
  }

  try {
    const s = localStorage.getItem(LANG_KEY);
    if (s === "en" || s === "es") currentLang = s;
  } catch (e) {}
  try {
    const s = localStorage.getItem(THEME_KEY);
    if (s === "light" || s === "dark") theme = s;
  } catch (e) {}

  const params = new URLSearchParams(location.search);
  if (params.get("lang") === "en" || params.get("lang") === "es") currentLang = params.get("lang");
  if (params.get("theme") === "light" || params.get("theme") === "dark") theme = params.get("theme");

  applyLang(currentLang, false);
  setTheme(theme, false);

  const drawer = document.getElementById("drawer");
  const menuBtn = document.querySelector("[data-menu-toggle]");
  const drawerClose = document.querySelector("[data-drawer-close]");
  let menuOpen = false;
  let menuReturnFocus = menuBtn;

  function setMenu(open) {
    if (!drawer || !menuBtn) return;

    menuOpen = Boolean(open);
    drawer.hidden = !menuOpen;
    drawer.classList.toggle("is-open", menuOpen);
    menuBtn.classList.toggle("is-open", menuOpen);
    drawer.dataset.state = menuOpen ? "open" : "closed";
    menuBtn.setAttribute("aria-expanded", String(menuOpen));
    drawer.setAttribute("aria-hidden", String(!menuOpen));
    document.body.classList.toggle("menu-on", menuOpen);

    if (menuOpen) {
      menuReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : menuBtn;
      const first = drawer.querySelector("a");
      requestAnimationFrame(() => first?.focus());
    } else {
      const target = menuReturnFocus instanceof HTMLElement && menuReturnFocus.isConnected ? menuReturnFocus : menuBtn;
      requestAnimationFrame(() => target?.focus());
    }
  }

  document.addEventListener("click", (e) => {
    const langBtn = e.target.closest("[data-set-lang]");
    if (langBtn) { e.preventDefault(); applyLang(langBtn.getAttribute("data-set-lang")); return; }
    const th = e.target.closest("[data-set-theme]");
    if (th) { e.preventDefault(); setTheme(th.getAttribute("data-set-theme")); return; }
  });

  menuBtn?.addEventListener("click", () => setMenu(!menuOpen));
  drawerClose?.addEventListener("click", () => setMenu(false));
  drawer?.addEventListener("click", (e) => {
    if (e.target === drawer || e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (!menuOpen) return;

    if (e.key === "Escape") {
      e.preventDefault();
      setMenu(false);
      return;
    }

    if (e.key === "Tab") {
      const focusable = [...drawer.querySelectorAll("a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])")];
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* —— contextual navigation —— */
  (function activeSection() {
    const links = [...document.querySelectorAll('.nav a[href^="#"]')];
    if (!links.length || !("IntersectionObserver" in window)) return;
    const sections = links
      .map((link) => ({ link, section: document.querySelector(link.getAttribute("href")) }))
      .filter(({ section }) => section);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting);
      if (!visible.length) return;
      const current = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0].target;
      sections.forEach(({ link, section }) => {
        const active = section === current;
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }, { rootMargin: "-22% 0px -58% 0px", threshold: 0 });
    sections.forEach(({ section }) => observer.observe(section));
  })();

  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".hero-frame, .rail-card, .feat, .cs-hero, .pillars article, .agent-block, .box").forEach((el) => {
      el.classList.add("reveal");
      io.observe(el);
    });
  }

  if (!reduce) {
    const fx = document.querySelector(".fx");
    window.addEventListener("pointermove", (e) => {
      if (!fx || document.hidden) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 28;
      const y = (e.clientY / window.innerHeight - 0.5) * 18;
      fx.style.setProperty("--mx", x.toFixed(1) + "px");
      fx.style.setProperty("--my", y.toFixed(1) + "px");
    }, { passive: true });

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fine) {
      document.querySelectorAll(".feat").forEach((card) => {
        card.addEventListener("pointermove", (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = `translateY(-8px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
        });
        card.addEventListener("pointerleave", () => { card.style.transform = ""; });
      });
    }
  }

})();

/* ══════════════════════════════════════════════════════════════
   PLAY MAX PASS · v=lab-max-1 — additive, self-contained.
   ══════════════════════════════════════════════════════════════ */
(() => {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const lowPower = Number.isFinite(navigator.hardwareConcurrency) && navigator.hardwareConcurrency <= 4;
  const root = document.documentElement;
  const rAF = window.requestAnimationFrame || ((f) => setTimeout(f, 16));

  /* —— 1 · boot —— */
  (function intro() {
    if (!root.classList.contains("intro-on")) return;
    try { sessionStorage.setItem("lab-intro-seen", "1"); } catch (_) {}
    let done = false;
    let timer = 0;
    const events = ["pointerdown", "keydown", "wheel", "touchstart"];

    const finish = () => {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, skip));
      root.classList.add("intro-done");
    };

    const skip = () => finish();

    events.forEach((ev) => {
      const options = ev === "keydown" ? { once: true } : { once: true, passive: true };
      window.addEventListener(ev, skip, options);
    });

    timer = setTimeout(finish, 2100);
  })();

  /* —— 2 · scroll rail —— */
  (function rail() {
    let ticking = false;
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      root.style.setProperty("--sp", (max > 0 ? (h.scrollTop || 0) / max * 100 : 0).toFixed(2) + "%");
      ticking = false;
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; rAF(update); } }, { passive: true });
    update();
  })();

  /* —— 3 · spotlight —— */
  (function spotlight() {
    if (reduce || !fine) return;
    let shown = false;
    window.addEventListener("pointermove", (e) => {
      root.style.setProperty("--sx", (e.clientX / window.innerWidth * 100).toFixed(1) + "%");
      root.style.setProperty("--sy", (e.clientY / window.innerHeight * 100).toFixed(1) + "%");
      if (!shown) { shown = true; document.body.classList.add("has-spot"); }
    }, { passive: true });
  })();

  /* —— 4 · magnetic hero CTAs —— */
  (function magnetic() {
    if (reduce || !fine) return;
    document.querySelectorAll(".hero .actions .btn").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.translate = ((e.clientX - (r.left + r.width / 2)) * 0.25).toFixed(1) + "px " +
          ((e.clientY - (r.top + r.height / 2)) * 0.32).toFixed(1) + "px";
      });
      btn.addEventListener("pointerleave", () => { btn.style.translate = "0px 0px"; });
    });
  })();

  /* —— 5 · ice particle network —— */
  (function net() {
    const canvas = document.querySelector(".fx-net");
    if (!canvas || reduce) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const PAL = [[122,243,255],[122,243,255],[243,212,55],[125,202,165],[246,244,238]];
    let w = 0, h = 0, dpr = 1, parts = [];
    let frameId = 0, running = false, lastFrameAt = 0;
    const frameBudgetMs = lowPower ? 50 : 33;
    const cancelFrame = window.cancelAnimationFrame || clearTimeout;
    const mouse = { x: -9999, y: -9999, active: false };
    function resize() {
      w = window.innerWidth; h = window.innerHeight;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const maxParticles = lowPower ? 54 : 90;
      const count = Math.max(22, Math.min(maxParticles, Math.round(w * h / 26000)));
      parts = [];
      for (let i = 0; i < count; i++) parts.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.32, vy: (Math.random() - 0.5) * 0.32,
        r: Math.random() * 1.5 + 0.7, c: PAL[(Math.random() * PAL.length) | 0]
      });
    }
    const LINK = 126, MLINK = 168;
    function frame(now = performance.now()) {
      if (!running || document.hidden) {
        frameId = 0;
        return;
      }
      if (now - lastFrameAt < frameBudgetMs) {
        frameId = rAF(frame);
        return;
      }
      lastFrameAt = now;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;
        if (mouse.active) {
          const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
          if (d < MLINK && d > 0.1) { p.vx += (dx / d) * 0.007; p.vy += (dy / d) * 0.007; }
        }
        p.vx = Math.max(-0.7, Math.min(0.7, p.vx));
        p.vy = Math.max(-0.7, Math.min(0.7, p.vy));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fillStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},0.9)`; ctx.fill();
        if (mouse.active) {
          const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
          if (d < MLINK) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${(1 - d / MLINK) * 0.5})`;
            ctx.lineWidth = 0.8; ctx.stroke();
          }
        }
      }
      for (let i = 0; i < parts.length; i++)
        for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i], b = parts[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < LINK) {
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${a.c[0]},${a.c[1]},${a.c[2]},${(1 - d / LINK) * 0.28})`;
            ctx.lineWidth = 0.7; ctx.stroke();
          }
        }
      frameId = rAF(frame);
    }

    function start() {
      if (running || document.hidden) return;
      running = true;
      lastFrameAt = 0;
      resize();
      frameId = rAF(frame);
    }

    function stop() {
      running = false;
      if (frameId) cancelFrame(frameId);
      frameId = 0;
    }

    window.addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; }, { passive: true });
    window.addEventListener("pointerleave", () => { mouse.active = false; });
    let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 180); }, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });
    start();
  })();
})();
