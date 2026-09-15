(function () {
  const GAS = "https://script.google.com/macros/s/AKfycbxcStxaVuy72iZNs6isCJ49ixX4I51Gal4N8QidqY3etF-z7ksos5hrvtcIMnzf0mc/exec";
  const ZENDESK = "https://bodytonehelp.zendesk.com/hc/es";
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

  const MATCHES = {
    es: [
      { n: "Ana Ruiz · CS Lead · Murcia", s: "88  HITL" },
      { n: "Ana M. Ruiz · Ops · Valencia", s: "71" },
      { n: "A. Ruiz · otro sector", s: "54" }
    ],
    en: [
      { n: "Ana Ruiz · CS Lead · Murcia", s: "88  HITL" },
      { n: "Ana M. Ruiz · Ops · Valencia", s: "71" },
      { n: "A. Ruiz · other sector", s: "54" }
    ]
  };

  function finder() {
    const name = ($("#q-name") && $("#q-name").value.trim()) || "Ana Ruiz";
    const rows = MATCHES[currentLang] || MATCHES.es;
    const out = $("#out-find");
    if (!out) return;
    out.textContent = name + "\n\n" + rows.map((r) => r.s.padEnd(10) + r.n).join("\n") + "\n\nHITL: persona decide. Fuentes internas no publicadas.";
  }

  function outreach() {
    const sel = $("#q-seg");
    if (!sel || !$("#out-mail")) return;
    const seg = sel.value;
    const drafts = {
      es: {
        saas: "Hola {nombre},\nVi que el equipo de CS escala el mismo tipo de ticket cada pico de demanda.\nSi os encaja, os enseño un agente que consulta Zendesk y solo escala con contexto.\n¿10 min esta semana?",
        gym: "Hola {nombre},\nEn gimnasios el cuello no es el catálogo: es presupuesto + mantenimiento + incidencia.\nMonté un help center y un motor de reglas para eso. Si quieres verlo en 10 min, dime."
      },
      en: {
        saas: "Hi {name},\nI keep seeing CS teams hit the same ticket type at every peak.\nHappy to show an agent that reads Zendesk and only escalates with context.\n10 minutes this week?",
        gym: "Hi {name},\nFor gyms the bottleneck is not the catalogue — it's quote + maintenance + incident.\nI shipped a help center and a rules engine for that. 10 min walkthrough if useful."
      }
    };
    const d = (drafts[currentLang] || drafts.es)[seg] || drafts.es.saas;
    $("#out-mail").textContent = "SEGMENT " + seg + "\nSTATUS draft · waiting human\n\n" + d + "\n\n[ Revisar ]  [ Editar ]  [ Descartar ]\nNada se envía desde esta demo.";
  }

  const MANT = {
    cinta: { es: "Cinta de correr", en: "Treadmill", prev: 3.5, corr: 5 },
    bici: { es: "Bici indoor", en: "Indoor bike", prev: 2, corr: 3.5 },
    fuerza: { es: "Máquina de fuerza", en: "Strength unit", prev: 1.5, corr: 4 }
  };

  function maint() {
    if (!$("#q-machine") || !$("#out-mant")) return;
    const m = MANT[$("#q-machine").value] || MANT.cinta;
    const kind = $("#q-kind").value;
    const hours = kind === "preventivo" ? m.prev : m.corr;
    const L = currentLang === "en";
    const name = L ? m.en : m.es;
    const k = L ? (kind === "preventivo" ? "preventive" : "corrective") : kind;
    $("#out-mant").textContent = [
      (L ? "EQUIPMENT  " : "EQUIPO     ") + name,
      (L ? "VISIT      " : "VISITA     ") + k,
      (L ? "SAMPLE HRS " : "HORAS DEMO ") + hours + " h",
      "",
      L ? "Checklist: safety · wear · firmware · next slot" : "Checklist: seguridad · desgaste · firmware · próxima ventana",
      L ? "Sample hours — not Bodytone rates." : "Horas de ejemplo — no son tarifas Bodytone."
    ].join("\n");
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
  function setMenu(open) {
    if (!drawer || !menuBtn) return;
    drawer.hidden = !open;
    drawer.classList.toggle("is-open", open);
    menuBtn.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-on", open);
    if (open) {
      const first = drawer.querySelector("a");
      requestAnimationFrame(() => first?.focus());
    }
  }

  document.addEventListener("click", (e) => {
    const langBtn = e.target.closest("[data-set-lang]");
    if (langBtn) { e.preventDefault(); applyLang(langBtn.getAttribute("data-set-lang")); return; }
    const th = e.target.closest("[data-set-theme]");
    if (th) { e.preventDefault(); setTheme(th.getAttribute("data-set-theme")); return; }
    if (e.target.closest("[data-run='find']")) finder();
    if (e.target.closest("[data-run='mail']")) outreach();
    if (e.target.closest("[data-run='mant']")) maint();
  });

  menuBtn?.addEventListener("click", () => setMenu(drawer.hidden));
  drawer?.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      if (!fx) return;
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

  window.LAB_GAS = GAS;
  window.LAB_ZENDESK = ZENDESK;
})();

/* ══════════════════════════════════════════════════════════════
   PLAY MAX PASS · v=lab-max-1 — additive, self-contained.
   ══════════════════════════════════════════════════════════════ */
(() => {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const root = document.documentElement;
  const rAF = window.requestAnimationFrame || ((f) => setTimeout(f, 16));

  /* —— 1 · boot —— */
  (function intro() {
    if (!root.classList.contains("intro-on")) return;
    try { sessionStorage.setItem("lab-intro-seen", "1"); } catch (_) {}
    let done = false;
    const finish = () => { if (done) return; done = true; root.classList.add("intro-done"); };
    const timer = setTimeout(finish, 2100);
    const skip = () => { clearTimeout(timer); finish(); };
    ["pointerdown", "keydown", "wheel", "touchstart"].forEach((ev) =>
      window.addEventListener(ev, skip, { once: true, passive: true }));
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
    const mouse = { x: -9999, y: -9999, active: false };
    function resize() {
      w = window.innerWidth; h = window.innerHeight;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(28, Math.min(90, Math.round(w * h / 22000)));
      parts = [];
      for (let i = 0; i < count; i++) parts.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.32, vy: (Math.random() - 0.5) * 0.32,
        r: Math.random() * 1.5 + 0.7, c: PAL[(Math.random() * PAL.length) | 0]
      });
    }
    const LINK = 126, MLINK = 168;
    function frame() {
      if (document.hidden) { rAF(frame); return; }
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
      rAF(frame);
    }
    window.addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; }, { passive: true });
    window.addEventListener("pointerleave", () => { mouse.active = false; });
    let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 180); }, { passive: true });
    resize();
    rAF(frame);
  })();
})();
