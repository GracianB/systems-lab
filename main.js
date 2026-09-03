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
    document.querySelectorAll(".feat, .cs-hero, .pillars article, .agent-block, .box").forEach((el) => {
      el.classList.add("reveal");
      io.observe(el);
    });
  }

  window.LAB_GAS = GAS;
  window.LAB_ZENDESK = ZENDESK;
})();
