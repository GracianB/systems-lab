/* Optional browser features never own startup. */
const mediaMatches = (query) => {
  try { return typeof window.matchMedia === "function" && window.matchMedia(query).matches; }
  catch { return false; }
};
const scheduleFrame = (callback) => typeof window.requestAnimationFrame === "function"
  ? window.requestAnimationFrame(callback) : window.setTimeout(callback, 16);
function persistURL(key, value) {
  try { const url = new URL(location.href); url.searchParams.set(key, value); history.replaceState(null, "", url); }
  catch { /* Sandboxed embeds retain working controls. */ }
}
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

  const vortexWindow = $("#vortex-window");
  const vortexStart = $("[data-vortex-start]");
  const vortexStop = $("[data-vortex-stop]");
  vortexStart?.addEventListener("click", () => {
    if (!vortexWindow || vortexWindow.querySelector("iframe")) return;
    const frame = document.createElement("iframe");
    frame.src = "https://vortex-gilt-xi.vercel.app/";
    frame.title = "Vórtice — live interactive particle field";
    frame.allow = "fullscreen";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    vortexWindow.append(frame);
    vortexWindow.classList.add("is-running");
    vortexStart.hidden = true;
    vortexStop.hidden = false;
    frame.focus();
  });
  vortexStop?.addEventListener("click", () => {
    vortexWindow?.querySelector("iframe")?.remove();
    vortexWindow?.classList.remove("is-running");
    vortexStop.hidden = true;
    vortexStart.hidden = false;
    vortexStart.focus();
  });

  function syncAgent() {
    const frame = document.querySelector(".agent-stage iframe");
    if (frame) frame.contentWindow?.postMessage({ type: "lab-settings", lang: currentLang, theme }, location.origin);
  }
  document.querySelector(".agent-stage iframe")?.addEventListener("load", syncAgent);
  // Opt-in loading: WebKit may indefinitely defer a loading="lazy" iframe inside
  // a closed <details>. Assign the real src only after the visitor expands it.
  const agentDisclosure = document.querySelector("#agente");
  const agentFrame = agentDisclosure?.querySelector("iframe[data-src]");
  function loadAgentFrame() {
    if (!agentFrame?.dataset.src) return;
    agentFrame.src = agentFrame.dataset.src;
    agentFrame.removeAttribute("data-src");
  }
  function openAgent() {
    if (agentDisclosure?.open) loadAgentFrame();
  }
  // The click is the explicit user intent; load immediately instead of relying
  // exclusively on a delayed toggle event in a busy Firefox/WebKit process.
  const agentSummary = agentDisclosure?.querySelector("summary");
  agentSummary?.addEventListener("click", () => {
    if (!agentDisclosure.open) loadAgentFrame();
  });
  agentDisclosure?.addEventListener("toggle", openAgent);
  // A direct /#agente link is an intentional request to open this optional demo.
  function openLinkedAgent() {
    if (location.hash === "#agente" && agentDisclosure) {
      agentDisclosure.open = true;
      openAgent();
    }
  }
  window.addEventListener("hashchange", openLinkedAgent);
  openLinkedAgent();
  openAgent();

  function applyLang(code, persist) {
    currentLang = code === "en" ? "en" : "es";
    const t = pack();
    $("[data-menu-toggle]")?.setAttribute("aria-label", t.menu || "Menu");
    syncAgent();
    const labels = currentLang === "en" ? ["Main navigation", "Experience explorer", "Dark theme", "Light theme", "Close menu", "Customer support agent demo"] : ["Navegación principal", "Explorador de experiencias", "Tema oscuro", "Tema claro", "Cerrar menú", "Demo de agente de soporte"];
    [".nav", ".cover-atlas", '[data-set-theme="dark"]', '[data-set-theme="light"]', "[data-drawer-close]"].forEach((selector, i) => $(selector)?.setAttribute("aria-label", labels[i]));
    $(".agent-stage iframe")?.setAttribute("title", labels[5]);
    const labelsByLanguage = currentLang === "en"
      ? ["Language", "Theme", "Mobile navigation", "Ecosystem"]
      : ["Idioma", "Tema", "Navegación móvil", "Ecosistema"];
    $$(".topbar-actions .seg").forEach((group, index) =>
      group.setAttribute("aria-label", labelsByLanguage[index]));
    $(".drawer-panel")?.setAttribute("aria-label", labelsByLanguage[2]);
    $(".foot-links")?.setAttribute("aria-label", labelsByLanguage[3]);
    $$(".topbar-actions [data-set-theme]").forEach((button) => {
      button.title = button.dataset.setTheme === "dark" ? labels[2] : labels[3];
    });
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
      persistURL("lang", currentLang);
    }
  }

  function applyTheme() {
    syncAgent();
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f5f7fa" : "#06080d");
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
      persistURL("theme", theme);
    }
    // Apply synchronously: startup and rapid toggles cannot depend on an animation.
    if (persist !== false && window.innerWidth >= 900 && typeof document.startViewTransition === "function" && !mediaMatches("(prefers-reduced-motion: reduce)")) {
      try {
        const transition = document.startViewTransition(() => applyTheme());
        transition.updateCallbackDone?.catch(() => applyTheme());
        transition.finished?.catch(() => {});
      } catch { applyTheme(); }
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

    if (open) menuReturnFocus = menuBtn; // Pointer activation in WebKit may not focus the toggle.
    menuOpen = Boolean(open);
    drawer.hidden = !menuOpen;
    drawer.classList.toggle("is-open", menuOpen);
    menuBtn.classList.toggle("is-open", menuOpen);
    drawer.dataset.state = menuOpen ? "open" : "closed";
    menuBtn.setAttribute("aria-expanded", String(menuOpen));
    drawer.setAttribute("aria-hidden", String(!menuOpen));
    document.body.classList.toggle("menu-on", menuOpen);
    document.querySelectorAll(".topbar, main, .foot").forEach((el) => { el.inert = menuOpen; });

    if (menuOpen) {
      const first = drawer.querySelector("a");
      // Keep user-initiated focus inside the drawer if it moved before RAF.
      // WebKit can execute this frame after the user has already focused a link.
      scheduleFrame(() => {
        if (!menuOpen || drawer.contains(document.activeElement)) return;
        first?.focus();
      });
    } else {
      const target = menuReturnFocus instanceof HTMLElement && menuReturnFocus.isConnected ? menuReturnFocus : menuBtn;
      scheduleFrame(() => {
        if (!menuOpen) target?.focus();
      });
    }
  }

  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
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
      const drawerLinks = [...drawer.querySelectorAll("a[href]")].filter(link => link.getClientRects().length);
      const lastDrawerLink = drawerLinks.at(-1);
      if (!e.shiftKey && document.activeElement === lastDrawerLink && drawerClose) { e.preventDefault(); drawerClose.focus(); return; }
      if (e.shiftKey && document.activeElement === drawerClose && lastDrawerLink) { e.preventDefault(); lastDrawerLink.focus(); return; }
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

  const reduce = mediaMatches("(prefers-reduced-motion: reduce)");

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
    document.querySelectorAll(".hero-frame, .cover-node, .feat, .cs-hero, .lab-more-card, .agent-block").forEach((el) => {
      el.classList.add("reveal");
      io.observe(el);
    });
  }


})();
