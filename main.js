(function () {
  const GAS = "https://script.google.com/macros/s/AKfycbxcStxaVuy72iZNs6isCJ49ixX4I51Gal4N8QidqY3etF-z7ksos5hrvtcIMnzf0mc/exec";
  const ZENDESK = "https://bodytonehelp.zendesk.com/hc/es";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  function lang() {
    return document.documentElement.getAttribute("data-lang") || "es";
  }
  function t(key) {
    const pack = window.LAB_I18N[lang()] || window.LAB_I18N.es;
    return pack[key] || key;
  }
  function applyLang(code) {
    const pack = window.LAB_I18N[code] || window.LAB_I18N.es;
    document.documentElement.lang = pack.htmlLang;
    document.documentElement.setAttribute("data-lang", code);
    document.title = pack.title;
    $$("[data-i18n]").forEach((el) => {
      const k = el.getAttribute("data-i18n");
      if (pack[k]) el.textContent = pack[k];
    });
    $$("[data-i18n-html]").forEach((el) => {
      const k = el.getAttribute("data-i18n-html");
      if (pack[k]) el.innerHTML = pack[k];
    });
    $$("[data-set-lang]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-set-lang") === code));
    });
    try { localStorage.setItem("lab-lang", code); } catch (e) {}
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
    const rows = MATCHES[lang()] || MATCHES.es;
    $("#out-find").textContent = name + "\n\n" + rows.map((r) => r.s.padEnd(10) + r.n).join("\n") + "\n\nHITL: persona decide. Fuentes internas no publicadas.";
  }

  function outreach() {
    const seg = $("#q-seg").value;
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
    const d = (drafts[lang()] || drafts.es)[seg] || drafts.es.saas;
    $("#out-mail").textContent = "SEGMENT " + seg + "\nSTATUS draft · waiting human\n\n" + d + "\n\n[ Revisar ]  [ Editar ]  [ Descartar ]\nNada se envía desde esta demo.";
  }

  const MANT = {
    cinta: { es: "Cinta de correr", en: "Treadmill", prev: 3.5, corr: 5 },
    bici: { es: "Bici indoor", en: "Indoor bike", prev: 2, corr: 3.5 },
    fuerza: { es: "Máquina de fuerza", en: "Strength unit", prev: 1.5, corr: 4 }
  };

  function maint() {
    const m = MANT[$("#q-machine").value] || MANT.cinta;
    const kind = $("#q-kind").value;
    const hours = kind === "preventivo" ? m.prev : m.corr;
    const L = lang() === "en";
    const name = L ? m.en : m.es;
    const k = L
      ? (kind === "preventivo" ? "preventive" : "corrective")
      : kind;
    $("#out-mant").textContent = [
      (L ? "EQUIPMENT  " : "EQUIPO     ") + name,
      (L ? "VISIT      " : "VISITA     ") + k,
      (L ? "SAMPLE HRS " : "HORAS DEMO ") + hours + " h",
      "",
      L ? "Checklist: safety · wear · firmware · next slot" : "Checklist: seguridad · desgaste · firmware · próxima ventana",
      L ? "Sample hours — not Bodytone rates." : "Horas de ejemplo — no son tarifas Bodytone."
    ].join("\n");
  }

  document.addEventListener("click", (e) => {
    const langBtn = e.target.closest("[data-set-lang]");
    if (langBtn) applyLang(langBtn.getAttribute("data-set-lang"));
    if (e.target.closest("[data-run='find']")) finder();
    if (e.target.closest("[data-run='mail']")) outreach();
    if (e.target.closest("[data-run='mant']")) maint();
  });

  const saved = (function () { try { return localStorage.getItem("lab-lang"); } catch (e) { return null; } })() || "es";
  applyLang(saved);
  window.LAB_GAS = GAS;
  window.LAB_ZENDESK = ZENDESK;
})();
