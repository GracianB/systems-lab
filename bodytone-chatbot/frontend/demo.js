/* Standalone portfolio simulation. No API, credentials, uploads or voice permissions. */
(() => {
  const MAX_FILES = 5;
  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  const texts = {
    es: { disclaimer:'Simulación local · datos ficticios', reset:'Reiniciar', label:'Tu consulta', placeholder:'¿Dónde está mi pedido?', send:'Enviar ↗', files:'Adjuntar archivos', welcome:'Hola. Prueba una consulta de envío, factura o ticket. Los datos son ficticios y los archivos permanecen en tu dispositivo.', shipping:'Envío', invoice:'Factura', ticket:'Ticket', replies:['Pedido DEMO-4821\nEstado: en tránsito. Entrega estimada: 24–48 horas.\n\nSimulación: no se ha consultado ningún transportista.', 'Factura DEMO-1904\nEstado: pagada.\n\nSimulación: no se ha generado ni enviado una factura.', 'Borrador de ticket\nPrioridad: media. Contexto: esta conversación.\n\nSimulación: no se ha creado ningún ticket real.'], fallback:'Prueba una consulta de envío, factura o ticket. Esta demo muestra el flujo; no accede a sistemas reales.', filesStatus:' archivos seleccionados. Permanecen en tu dispositivo.', rejected:'Archivo rechazado: máximo 5 archivos de 10 MB; PDF, imágenes, texto, CSV o JSON.' },
    en: { disclaimer:'Local simulation · fictional data', reset:'Reset', label:'Your question', placeholder:'Where is my order?', send:'Send ↗', files:'Attach files', welcome:'Hello. Try a shipping, invoice or ticket question. All data is fictional and files stay on your device.', shipping:'Shipping', invoice:'Invoice', ticket:'Ticket', replies:['Order DEMO-4821\nStatus: in transit. Estimated delivery: 24–48 hours.\n\nSimulation: no carrier has been contacted.', 'Invoice DEMO-1904\nStatus: paid.\n\nSimulation: no invoice has been generated or sent.', 'Ticket draft\nPriority: medium. Context: this conversation.\n\nSimulation: no real ticket has been created.'], fallback:'Try a shipping, invoice or ticket question. This demo shows the flow without accessing live systems.', filesStatus:' files selected. They stay on your device.', rejected:'File rejected: up to 5 files of 10 MB; PDF, images, text, CSV or JSON.' }
  };
  const params = new URLSearchParams(location.search);
  let lang = params.get('lang') === 'en' ? 'en' : 'es';
  const root = document.documentElement;
  const list = document.getElementById('messages');
  const input = document.getElementById('message');
  let attached = [];
  function add(text, sender) { const p = document.createElement('p'); p.className = 'message ' + sender; p.textContent = text; list.append(p); list.scrollTop = list.scrollHeight; }
  function reset() { list.replaceChildren(); add(texts[lang].welcome, 'agent'); attached = []; document.getElementById('files').value = ''; document.getElementById('file-status').textContent = ''; }
  let initialized = false;
  function settings(nextLang, theme) {
    const previousLang = lang;
    lang = nextLang === 'en' ? 'en' : 'es'; root.lang = lang; root.dataset.theme = theme === 'light' ? 'light' : 'dark';
    const t = texts[lang]; for (const [id,key] of [['disclaimer','disclaimer'],['reset','reset'],['input-label','label'],['send','send'],['files-label','files']]) document.getElementById(id).textContent = t[key];
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
  document.getElementById('files').addEventListener('change', (e) => {
    const files = [...e.target.files]; attached = files.filter((f) => f.size <= MAX_FILE_BYTES && /\.(pdf|png|jpe?g|webp|txt|csv|json)$/i.test(f.name)).slice(0, MAX_FILES);
    document.getElementById('file-status').textContent = files.length !== attached.length ? texts[lang].rejected : attached.length + texts[lang].filesStatus;
  });
  window.addEventListener('message', (e) => {
    const u = new URL(location.href);
    if (e.origin !== u.origin || e.source !== window.parent || e.data?.type !== 'lab-settings') return;
    settings(e.data.lang, e.data.theme);
  });
  settings(lang, params.get('theme'));
})();
