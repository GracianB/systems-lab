/**
 * Portfolio demo layer. No Flask, no keys.
 * Intercepts /api/chat, drag-and-drop, suggested intents.
 */
(function () {
  const orig = window.fetch.bind(window);
  const EMBED = /(?:\?|&)embed=1(?:&|$)/.test(location.search);
  if (EMBED) document.documentElement.classList.add("demo-embed");

  function replyFor(message, files) {
    const t = (message || "").toLowerCase();
    const names = (files || []).map(function (f) { return f.name; });
    const attach = names.length
      ? "\n\n📎 " + names.join(", ") + " — leído. En el motor real iría al ticket."
      : "";

    if (/enví|envio|pedido|tracking|seguimiento|paquete/.test(t)) {
      return (
        "**Envío GB-4821** · en tránsito.\n\n" +
        "Última lectura: Valencia, 08:14.\n" +
        "ETA: 24–48 h.\n\n" +
        "_Demo. El agente real consultaría la API del carrier._" +
        attach
      );
    }
    if (/manual|factura|invoice|billing|cobro|pago/.test(t)) {
      return (
        "**Factura INV-1904** · emitida.\n\n" +
        "Estado: pagada el 12/08.\n" +
        "PDF listo para reenviar.\n\n" +
        "_Demo. El agente real consultaría facturación._" +
        attach
      );
    }
    if (/ticket|zendesk|reclam|incidencia|queja/.test(t)) {
      return (
        "**Borrador de ticket**\n\n" +
        "Asunto: No puedo acceder a mi cuenta\n" +
        "Prioridad: media\n" +
        "Contexto: este hilo, listo para un humano.\n\n" +
        "Nadie pide que lo cuentes otra vez." +
        attach
      );
    }
    if (/hola|buenas|hey|hi\b/.test(t)) {
      return "Hola. Pregunta por un **envío**, una **factura** o un **ticket**. O suelta un archivo abajo." + attach;
    }
    return (
      "Te leo. En producción consultaría sistemas y, si hace falta, escalaría con este contexto.\n\n" +
      "Prueba: «dónde está mi pedido», «mi factura», «abrir un ticket»." +
      attach
    );
  }

  window.fetch = function (input, init) {
    const url = typeof input === "string" ? input : input && input.url;
    if (url && url.indexOf("/api/chat") !== -1) {
      let payload = {};
      try { payload = JSON.parse((init && init.body) || "{}"); } catch (e) {}
      const text = replyFor(payload.message, window.__BT_FILES);
      window.__BT_FILES = [];
      const bar = document.getElementById("bt-drop-chips");
      if (bar) { bar.innerHTML = ""; bar.hidden = true; }
      return new Promise(function (resolve) {
        window.setTimeout(function () {
          resolve(new Response(JSON.stringify({ reply: text, provider: "demo" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }));
        }, 420);
      });
    }
    if (url && url.indexOf("/api/tts") !== -1) {
      return Promise.resolve(new Response("{}", { status: 501 }));
    }
    return orig(input, init);
  };

  function chips() {
    let bar = document.getElementById("bt-drop-chips");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "bt-drop-chips";
      bar.className = "bt-drop-chips";
      const form = document.getElementById("message-form");
      if (form) form.parentNode.insertBefore(bar, form);
    }
    const files = window.__BT_FILES || [];
    bar.hidden = files.length === 0;
    bar.innerHTML = files.map(function (f, i) {
      return '<span class="bt-chip">' + f.name +
        ' <button type="button" data-rm="' + i + '" aria-label="Quitar">×</button></span>';
    }).join("");
  }

  function suggestions() {
    if (document.getElementById("bt-suggest")) return;
    const list = document.getElementById("chat-messages");
    if (!list) return;
    const wrap = document.createElement("div");
    wrap.id = "bt-suggest";
    wrap.className = "bt-suggest";
    [["Envío", "¿Dónde está mi pedido GB-4821?"],
     ["Factura", "Necesito mi última factura"],
     ["Ticket", "Abre un ticket: no puedo acceder"]].forEach(function (row) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "bt-suggest__btn";
      b.textContent = row[0];
      b.addEventListener("click", function () {
        const input = document.getElementById("message-input");
        const form = document.getElementById("message-form");
        if (!input || !form) return;
        input.value = row[1];
        input.dispatchEvent(new Event("input", { bubbles: true }));
        form.requestSubmit();
      });
      wrap.appendChild(b);
    });
    list.appendChild(wrap);
  }

  window.addEventListener("DOMContentLoaded", function () {
    document.body.classList.add("demo-on");
    if (EMBED) document.body.classList.add("demo-embed");

    const ribbon = document.createElement("p");
    ribbon.className = "demo-ribbon";
    ribbon.textContent = "DEMO · sin claves · arrastra un archivo";
    document.body.appendChild(ribbon);

    const overlay = document.createElement("div");
    overlay.className = "bt-drop-overlay";
    overlay.innerHTML = "<b>Suelta el archivo</b><span>Va al hilo. Un humano cierra.</span>";
    document.body.appendChild(overlay);

    const form = document.getElementById("message-form");
    const area = document.querySelector(".chat-widget__footer") || form;
    const dropRoot = EMBED ? document.body : area;
    if (!dropRoot) return;

    let dragN = 0;
    ["dragenter", "dragover"].forEach(function (ev) {
      dropRoot.addEventListener(ev, function (e) {
        e.preventDefault();
        dragN++;
        document.body.classList.add("is-dropping");
        if (area) area.classList.add("is-drop");
      });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      dropRoot.addEventListener(ev, function (e) {
        e.preventDefault();
        dragN = Math.max(0, dragN - 1);
        if (ev === "drop" || dragN === 0) {
          document.body.classList.remove("is-dropping");
          if (area) area.classList.remove("is-drop");
        }
      });
    });
    dropRoot.addEventListener("drop", function (e) {
      const list = e.dataTransfer && e.dataTransfer.files;
      if (!list || !list.length) return;
      window.__BT_FILES = Array.prototype.slice.call(list);
      chips();
      const input = document.getElementById("message-input");
      if (input && !input.value.trim()) {
        input.value = "Adjunto: " + window.__BT_FILES.map(function (f) { return f.name; }).join(", ");
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    document.addEventListener("click", function (e) {
      const rm = e.target.closest && e.target.closest("[data-rm]");
      if (!rm) return;
      const i = Number(rm.getAttribute("data-rm"));
      window.__BT_FILES.splice(i, 1);
      chips();
    });

    window.setTimeout(function () {
      const widget = document.getElementById("bodytone-chat-widget");
      const btn = document.getElementById("chat-toggle-btn");
      if (EMBED && widget) {
        widget.classList.remove("chat-widget--closed", "chat-widget--maximized");
        widget.classList.add("chat-widget--open");
        const box = document.getElementById("chat-container");
        if (box) {
          box.removeAttribute("inert");
          box.setAttribute("aria-hidden", "false");
        }
        if (btn) btn.setAttribute("aria-expanded", "true");
      } else if (btn) {
        btn.click();
      }
      suggestions();
    }, 200);
  });
})();
