/**
 * Pages demo: the Flask backend is not public.
 * Intercept /api/chat with canned CS replies, enable drag-and-drop files.
 */
(function () {
  const orig = window.fetch.bind(window);

  function replyFor(message, files) {
    const t = (message || "").toLowerCase();
    const attach =
      files && files.length
        ? "\n\nAdjunto recibido: " + files.map((f) => f.name).join(", ") + "."
        : "";
    if (/enví|envio|pedido|tracking|seguimiento/.test(t)) {
      return "Demo · envíos: consultaría la API de transporte y te daría el estado. Aquí no hay claves, así que no llamo al carrier." + attach;
    }
    if (/manual|repuesto|repuestos|producto|stock|disponib/.test(t)) {
      return "Demo · producto: buscaría en el catálogo y el CSV de manuales. El motor real está en Flask + RAG." + attach;
    }
    if (/ticket|zendesk|reclam|incidencia/.test(t)) {
      return "Demo · ticket: abriría el caso en Zendesk con el contexto de este chat. Prueba pública: bodytonehelp.zendesk.com/hc/es" + attach;
    }
    if (/hola|buenas|hey/.test(t)) {
      return "Hola. Widget en modo demo. Pregunta por un envío, un manual o un ticket — o suelta un archivo aquí." + attach;
    }
    return "Demo · el agente real consulta RAG, envíos, productos y Zendesk. Esta página es el widget; el backend no está publicado (sin claves)." + attach;
  }

  window.fetch = function (input, init) {
    const url = typeof input === "string" ? input : input && input.url;
    if (url && url.indexOf("/api/chat") !== -1) {
      let payload = {};
      try {
        payload = JSON.parse((init && init.body) || "{}");
      } catch (e) {
        payload = {};
      }
      const text = replyFor(payload.message, window.__BT_FILES);
      return new Promise(function (resolve) {
        window.setTimeout(function () {
          resolve(
            new Response(JSON.stringify({ reply: text, provider: "demo" }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }, 480);
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
    bar.innerHTML = files
      .map(function (f) {
        return '<span class="bt-chip">' + f.name + "</span>";
      })
      .join("");
  }

  window.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("message-form");
    const area = document.querySelector(".chat-widget__footer") || form;
    if (!area) return;

    ["dragenter", "dragover"].forEach(function (ev) {
      area.addEventListener(ev, function (e) {
        e.preventDefault();
        area.classList.add("is-drop");
      });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      area.addEventListener(ev, function (e) {
        e.preventDefault();
        area.classList.remove("is-drop");
      });
    });
    area.addEventListener("drop", function (e) {
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

    window.setTimeout(function () {
      const btn = document.getElementById("chat-toggle-btn");
      if (btn) btn.click();
    }, 400);
  });
})();
