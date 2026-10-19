/* V2: accessible project navigator. No external requests or dependencies. */
(() => {
  const options = [
    { name: 'OHANA', note: 'Juego · personajes y salas', en: 'Game · characters and rooms', href: '#juegos', terms: 'game play juego' },
    { name: 'Vórtice', note: 'Arte generativo · WebGL', en: 'Generative art · WebGL', href: '#vortex-live', terms: 'particles field campo visual' },
    { name: 'Aigoritmo', note: 'IA local · cuatro identidades', en: 'Local AI · four identities', href: '#aigoritmo', terms: 'arcana arcano qwen llama tarot' },
    { name: 'Customer Ops', note: 'Automatización de soporte', en: 'Support automation', href: '#cs', terms: 'customer data support' },
    { name: 'RevOps Studio', note: 'Analítica · revenue operations', en: 'Analytics · revenue operations', href: 'https://gracianb.github.io/revops-studio/demo.html', terms: 'dashboard data pipeline' },
    { name: 'GitHub', note: 'Código y documentación', en: 'Source and documentation', href: 'https://github.com/GracianB/systems-lab', terms: 'source repository' }
  ];
  const css = `
    .lab-command-launch{position:fixed;right:clamp(12px,3vw,30px);bottom:clamp(12px,3vw,28px);z-index:45;display:flex;align-items:center;gap:12px;padding:12px 16px;border:1px solid var(--line-strong);border-radius:100px;background:var(--surface);color:var(--ink);box-shadow:var(--shadow-sm);font:700 12px var(--mono);cursor:pointer;transition:transform .2s,border-color .2s}
    .lab-command-launch:hover{transform:translateY(-3px);border-color:var(--ice)}
    .lab-command-launch kbd{border:1px solid var(--line);border-radius:5px;padding:3px 6px;color:var(--muted)}
    .lab-command-overlay{position:fixed;inset:0;z-index:150;display:grid;place-items:start center;padding:clamp(45px,11vh,125px) 16px 16px;background:rgba(0,6,13,.72);backdrop-filter:blur(10px)}
    .lab-command-overlay[hidden]{display:none}
    .lab-command-box{width:min(100%,590px);max-height:min(78vh,640px);display:flex;flex-direction:column;padding:12px;border:1px solid var(--line-strong);border-radius:18px;background:var(--surface);box-shadow:0 25px 100px rgba(0,0,0,.35);color:var(--ink)}
    .lab-command-head{display:flex;align-items:center;gap:10px;padding:6px 9px 15px;border-bottom:1px solid var(--line)}
    .lab-command-input{min-width:0;flex:1;border:0;outline:none;background:transparent;color:var(--ink);font:500 17px var(--sans)}
    .lab-command-exit{border:1px solid var(--line);border-radius:6px;padding:6px 9px;font:700 11px var(--mono);cursor:pointer}
    .lab-command-results{overflow:auto;overscroll-behavior:contain;padding:8px 0}
    .lab-command-item{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;border-radius:10px;padding:13px 14px;cursor:pointer;color:var(--ink)}
    .lab-command-item:hover,.lab-command-item[aria-selected=true]{background:var(--ice-dim)}
    .lab-command-item strong{display:block;font:700 15px var(--sans)}
    .lab-command-item small{display:block;color:var(--muted);margin-top:3px;font:12px var(--sans)}
    .lab-command-item .lab-arrow{color:var(--ice);font-size:22px}
    .lab-command-empty,.lab-command-foot{padding:14px;color:var(--muted);font:12px var(--sans)}
    .lab-command-foot{border-top:1px solid var(--line)}
    @media(max-width:520px){.lab-command-launch kbd{display:none}.lab-command-launch{padding:10px 13px}.lab-command-overlay{padding-top:16vh}}
    @media(prefers-reduced-motion:reduce){.lab-command-launch{transition:none}.lab-command-overlay{backdrop-filter:none}}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  const launch = document.createElement('button');
  launch.type = 'button';
  launch.className = 'lab-command-launch';
  launch.innerHTML = '<span aria-hidden="true">⌕</span><span class="lab-command-label">Explorar</span><kbd>Ctrl K</kbd>';
  const overlay = document.createElement('div');
  overlay.className = 'lab-command-overlay';
  overlay.hidden = true;
  overlay.innerHTML = '<section class="lab-command-box" role="dialog" aria-modal="true" aria-labelledby="lab-command-title"><div class="lab-command-head"><span aria-hidden="true">⌕</span><input class="lab-command-input" type="search" autocomplete="off" spellcheck="false" aria-label="Buscar proyectos" placeholder="Buscar una experiencia…"><button type="button" class="lab-command-exit" aria-label="Cerrar">ESC</button></div><div class="lab-command-results" role="listbox" aria-label="Resultados"></div><div class="lab-command-foot" id="lab-command-title">↑ ↓ navegar · Enter abrir · ESC cerrar</div></section>';
  document.body.append(launch, overlay);
  const input = overlay.querySelector('input');
  const results = overlay.querySelector('.lab-command-results');
  const closeButton = overlay.querySelector('.lab-command-exit');
  let selected = 0;
  let shown = options;
  let returnFocus = launch;
  const isEn = () => document.documentElement.lang.startsWith('en');
  const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function render() {
    const query = normalize(input.value.trim());
    shown = options.filter(o => normalize([o.name,o.note,o.en,o.terms].join(' ')).includes(query));
    selected = Math.min(selected, Math.max(0,shown.length-1));
    results.replaceChildren();
    shown.forEach((item,index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lab-command-item';
      button.setAttribute('role','option');
      button.setAttribute('aria-selected',String(index===selected));
      const description = document.createElement('span');
      const title = document.createElement('strong');
      title.textContent = item.name;
      const note = document.createElement('small');
      note.textContent = isEn() ? item.en : item.note;
      description.append(title,note);
      const arrow = document.createElement('span');
      arrow.className = 'lab-arrow';
      arrow.textContent = '↗';
      arrow.setAttribute('aria-hidden','true');
      button.append(description,arrow);
      button.addEventListener('mouseenter',()=>{selected=index;syncSelected()});
      button.addEventListener('click',()=>activate(item));
      results.append(button);
    });
    if(!shown.length){const empty=document.createElement('p');empty.className='lab-command-empty';empty.textContent=isEn()?'No matching projects.':'No hay proyectos coincidentes.';results.append(empty)}
  }
  function syncSelected(){results.querySelectorAll('[role="option"]').forEach((el,i)=>el.setAttribute('aria-selected',String(i===selected)));results.querySelectorAll('[role="option"]')[selected]?.scrollIntoView({block:'nearest'})}
  function activate(item){close();if(item.href.startsWith('#')){document.querySelector(item.href)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});history.replaceState(null,'',item.href)}else{window.open(item.href,'_blank','noopener,noreferrer')}}
  function open(){returnFocus=document.activeElement instanceof HTMLElement?document.activeElement:launch;overlay.hidden=false;document.body.style.overflow='hidden';launch.setAttribute('aria-expanded','true');input.value='';selected=0;render();input.focus()}
  function close(){overlay.hidden=true;document.body.style.overflow='';launch.setAttribute('aria-expanded','false');returnFocus?.focus()}
  launch.setAttribute('aria-haspopup','dialog');
  launch.setAttribute('aria-expanded','false');
  launch.addEventListener('click',open);
  closeButton.addEventListener('click',close);
  overlay.addEventListener('pointerdown',event=>{if(event.target===overlay)close()});
  input.addEventListener('input',()=>{selected=0;render()});
  overlay.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();close()}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();selected=(selected+(event.key==='ArrowDown'?1:-1)+shown.length)%Math.max(1,shown.length);syncSelected()}
    if(event.key==='Enter'&&shown.length){event.preventDefault();activate(shown[selected])}
    if(event.key==='Tab'){const elements=[input,closeButton,...results.querySelectorAll('button')];const next=elements.indexOf(document.activeElement)+(event.shiftKey?-1:1);if(next<0||next>=elements.length){event.preventDefault();elements[(next+elements.length)%elements.length].focus()}}
  });
  document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();overlay.hidden?open():close()}});
  new MutationObserver(()=>{launch.querySelector('.lab-command-label').textContent=isEn()?'Explore':'Explorar';input.placeholder=isEn()?'Find a project…':'Buscar una experiencia…';input.setAttribute('aria-label',isEn()?'Search projects':'Buscar proyectos');if(!overlay.hidden)render()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
