/* Standalone portfolio simulation. No API, credentials, uploads or voice permissions. */
(() => {
  const texts = {
    es: { disclaimer:'Simulación local · datos ficticios', reset:'Reiniciar', label:'Tu consulta', placeholder:'¿Dónde está mi pedido?', send:'Enviar ↗', welcome:'Hola. Prueba una consulta de envío, factura o ticket. Los datos son ficticios y no se conecta con ningún servicio real.', shipping:'Envío', invoice:'Factura', ticket:'Ticket', replies:['Pedido DEMO-4821\nEstado: en tránsito. Entrega estimada: 24–48 horas.\n\nSimulación: no se ha consultado ningún transportista.', 'Factura DEMO-1904\nEstado: pagada.\n\nSimulación: no se ha generado ni enviado una factura.', 'Borrador de ticket\nPrioridad: media. Contexto: esta conversación.\n\nSimulación: no se ha creado ningún ticket real.'], fallback:'Prueba una consulta de envío, factura o ticket. Esta demo muestra el flujo; no accede a sistemas reales.' },
    en: { disclaimer:'Local simulation · fictional data', reset:'Reset', label:'Your question', placeholder:'Where is my order?', send:'Send ↗', welcome:'Hello. Try a shipping, invoice or ticket question. All data is fictional and no real service is contacted.', shipping:'Shipping', invoice:'Invoice', ticket:'Ticket', replies:['Order DEMO-4821\nStatus: in transit. Estimated delivery: 24–48 hours.\n\nSimulation: no carrier has been contacted.', 'Invoice DEMO-1904\nStatus: paid.\n\nSimulation: no invoice has been generated or sent.', 'Ticket draft\nPriority: medium. Context: this conversation.\n\nSimulation: no real ticket has been created.'], fallback:'Try a shipping, invoice or ticket question. This demo shows the flow without accessing live systems.' }
  };
  const params = new URLSearchParams(location.search);
  let lang = params.get('lang') === 'en' ? 'en' : 'es';
  const root = document.documentElement;
  const list = document.getElementById('messages');
  const input = document.getElementById('message');
  function add(text, sender) { const p = document.createElement('p'); p.className = 'message ' + sender; p.textContent = text; list.append(p); const scroll = () => { list.scrollTop = list.scrollHeight; }; if (document.readyState === 'complete') scroll(); else window.addEventListener('load', scroll, { once: true }); }
  function reset() { list.replaceChildren(); add(texts[lang].welcome, 'agent'); input.value = ''; }
  let initialized = false;
  function settings(nextLang, theme) {
    const previousLang = lang;
    lang = nextLang === 'en' ? 'en' : 'es'; root.lang = lang; root.dataset.theme = theme === 'light' ? 'light' : 'dark';
    const t = texts[lang]; for (const [id,key] of [['disclaimer','disclaimer'],['reset','reset'],['input-label','label'],['send','send']]) document.getElementById(id).textContent = t[key];
    document.getElementById('agent-name').textContent = lang === 'en' ? 'Sample support agent' : 'Agente de ejemplo';
    input.placeholder = t.placeholder; list.setAttribute('aria-label', lang === 'en' ? 'Conversation' : 'Conversación');
    document.querySelectorAll('[data-intent]').forEach((b) => b.textContent = t[b.dataset.intent]);
    if (!initialized || previousLang !== lang) reset();
    initialized = true;
  }
  function send(value, intent) {
    if (!value.trim()) return;
    add(value.slice(0, 1000), 'user'); const t = texts[lang];
    const index = intent ? ['shipping','invoice','ticket'].indexOf(intent) : /env[ií]|pedido|order|shipping|tracking/i.test(value) ? 0 : /factura|invoice|billing/i.test(value) ? 1 : /ticket|incidencia|issue/i.test(value) ? 2 : -1;
    add(index >= 0 ? t.replies[index] : t.fallback, 'agent'); input.value = ''; input.focus();
  }
  document.getElementById('form').addEventListener('submit', (e) => { e.preventDefault(); send(input.value); });
  document.querySelectorAll('[data-intent]').forEach((b) => b.addEventListener('click', () => send(texts[lang][b.dataset.intent], b.dataset.intent)));
  document.getElementById('reset').addEventListener('click', reset);
  window.addEventListener('message', (e) => {
    const u = new URL(location.href);
    if (e.origin !== u.origin || e.source !== window.parent || e.data?.type !== 'lab-settings') return;
    settings(e.data.lang, e.data.theme);
  });
  settings(lang, params.get('theme'));
})();
