/* Systems Lab V2 · Progressive, keyboard-friendly experience navigator.
   All targets are public destinations or in-page sections. No network, tracking or storage. */
(() => {
  if (!document.body || document.querySelector('[data-lab-command-root]')) return;
  const entries = [
    { key:'ohana', title:'OHANA', es:'Jugar · 10 personajes, salas y combate', en:'Play · 10 characters, rooms and combat', category:'PLAY', href:'#juegos', words:'ohana videojuego juego game play isla evolution evolucion' },
    { key:'vortex', title:'VÓRTICE', es:'Experimentar · arte generativo WebGL', en:'Explore · generative WebGL art', category:'LIVE', href:'#vortex-live', words:'vortice vortex webgl particles particulas visual generativo field campo' },
    { key:'aigoritmo', title:'AIGORITMO', es:'Conocer · cuatro identidades de IA local', en:'Meet · four local AI identities', category:'LOCAL', href:'#aigoritmo', words:'ia ai llama qwen arcana arcano modelos chat privado private' },
    { key:'customer', title:'BODYTONE SUPPORT OS', es:'Comprobar · operaciones y soporte reales', en:'Inspect · real customer operations', category:'CASE', href:'#cs', words:'customer success ops zendesk help center tickets support' },
    { key:'agent', title:'AGENTE DE SOPORTE', es:'Probar · simulación con datos ficticios', en:'Try · fictional support simulation', category:'DEMO', href:'#agente', words:'bot agente chatbot envio shipping factura invoice ticket simulacion agent' },
    { key:'revops', title:'REVOPS STUDIO', es:'Explorar · demo pública con datos de ejemplo', en:'Explore · public demo with sample data', category:'DEMO', href:'https://gracianb.github.io/revops-studio/demo.html', words:'revenue analytics pipeline dashboard forecast datos analitica' },
    { key:'source', title:'CÓDIGO Y ARQUITECTURA', es:'Examinar · repositorio y documentación', en:'Inspect · source and documentation', category:'SOURCE', href:'https://github.com/GracianB/systems-lab', words:'github code codigo readme architecture tests pruebas ci' },
    { key:'hub', title:'GRACIANB', es:'Volver · portfolio y otros universos', en:'Return · portfolio and other worlds', category:'HUB', href:'https://gracianb.github.io/GracianB/', words:'portfolio home inicio universo yoga professional deck' }
  ];
  const root = document.createElement('div');
  root.dataset.labCommandRoot = '';
  const launch = document.createElement('button');
  launch.type = 'button';
  launch.className = 'lab-command-launch';
  launch.setAttribute('aria-controls','lab-command-overlay');
  launch.setAttribute('aria-expanded','false');
  launch.setAttribute('aria-haspopup','dialog');
  launch.innerHTML = '<span class="lab-command-symbol" aria-hidden="true">⌕</span><span class="lab-command-label">Explorar</span><kbd aria-hidden="true">Ctrl K</kbd>';
  const overlay = document.createElement('div');
  overlay.className = 'lab-command-overlay';
  overlay.id = 'lab-command-overlay';
  overlay.hidden = true;
  overlay.innerHTML = '<section class="lab-command-box" role="dialog" aria-modal="true" aria-labelledby="lab-command-title" aria-describedby="lab-command-description"><div class="lab-command-top"><span class="lab-command-kicker">SYSTEMS LAB / INDEX</span><button type="button" class="lab-command-exit" aria-label="Cerrar buscador">ESC <span aria-hidden="true">×</span></button></div><h2 id="lab-command-title">¿Qué quieres explorar?</h2><p id="lab-command-description" class="lab-command-description">Busca un proyecto, una tecnología o una experiencia.</p><div class="lab-command-search"><span aria-hidden="true">⌕</span><input class="lab-command-input" type="search" role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded="true" aria-controls="lab-command-results" autocomplete="off" spellcheck="false" placeholder="Buscar proyectos…"></div><div id="lab-command-results" class="lab-command-results" role="listbox" aria-label="Proyectos"></div><div class="lab-command-foot"><span class="lab-command-count" aria-live="polite">08 destinos</span><span class="lab-command-hint">↑ ↓ seleccionar · Enter abrir · Esc cerrar</span></div></section>';
  root.append(launch,overlay);
  document.body.append(root);
  const input = overlay.querySelector('.lab-command-input');
  const results = overlay.querySelector('.lab-command-results');
  const closeButton = overlay.querySelector('.lab-command-exit');
  const title = overlay.querySelector('#lab-command-title');
  const description = overlay.querySelector('#lab-command-description');
  const count = overlay.querySelector('.lab-command-count');
  const hint = overlay.querySelector('.lab-command-hint');
  let matched = entries;
  let selected = 0;
  let returnFocus = launch;
  let previousOverflow = '';
  const isEn = () => document.documentElement.lang.toLowerCase().startsWith('en');
  const normalize = v => String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
  const reduced = () => {try{return typeof matchMedia==='function' && matchMedia('(prefers-reduced-motion: reduce)').matches}catch{return true}};
  const isInternal = url => url.startsWith('#');
  function localize() {
    const english = isEn();
    launch.querySelector('.lab-command-label').textContent=english?'Explore':'Explorar';
    launch.setAttribute('aria-label',english?'Explore projects (Ctrl K)':'Explorar proyectos (Ctrl K)');
    title.textContent=english?'Where do you want to go?':'¿Qué quieres explorar?';
    description.textContent=english?'Search a project, technology or experience.':'Busca un proyecto, una tecnología o una experiencia.';
    closeButton.setAttribute('aria-label',english?'Close search':'Cerrar buscador');
    input.placeholder=english?'Search projects…':'Buscar proyectos…';
    input.setAttribute('aria-label',english?'Search projects':'Buscar proyectos');
    results.setAttribute('aria-label',english?'Projects':'Proyectos');
    hint.textContent=english?'↑ ↓ select · Enter open · Esc close':'↑ ↓ seleccionar · Enter abrir · Esc cerrar';
    if (!overlay.hidden) render();
  }
  function setActive(index) {
    selected=Math.max(0,Math.min(index,matched.length-1));
    [...results.querySelectorAll('[role="option"]')].forEach((el,i)=>{
      const on = i===selected;
      el.setAttribute('aria-selected',String(on));
      el.classList.toggle('is-active',on);
      if (on) {
        input.setAttribute('aria-activedescendant',el.id);
        el.scrollIntoView({block:'nearest',behavior:'instant'});
      }
    });
    if (!matched.length) input.removeAttribute('aria-activedescendant');
  }
  function render() {
    const words=normalize(input.value.trim()).split(/\s+/).filter(Boolean);
    matched=entries.filter(e=>words.every(term=>normalize([e.title,e.es,e.en,e.category,e.words].join(' ')).includes(term)));
    results.replaceChildren();
    const english=isEn();
    matched.forEach((entry,index)=>{
      const row=document.createElement('a');
      row.className='lab-command-item';
      row.id='lab-command-option-'+entry.key;
      row.setAttribute('role','option');
      row.setAttribute('aria-selected',String(index===selected));
      row.href=entry.href;
      row.tabIndex=-1;
      if (!isInternal(entry.href)){row.target='_blank';row.rel='noopener noreferrer'}
      const badge=document.createElement('span');
      badge.className='lab-command-type';
      badge.textContent=entry.category;
      const content=document.createElement('span');
      content.className='lab-command-copy';
      const name=document.createElement('strong');
      name.textContent=entry.title;
      const subtitle=document.createElement('small');
      subtitle.textContent=english?entry.en:entry.es;
      content.append(name,subtitle);
      const arrow=document.createElement('span');
      arrow.className='lab-command-arrow';
      arrow.setAttribute('aria-hidden','true');
      arrow.textContent=isInternal(entry.href)?'↘':'↗';
      row.append(badge,content,arrow);
      row.addEventListener('pointermove',()=>setActive(index));
      row.addEventListener('click',(event)=>{
        if (!isInternal(entry.href)){close(false);return}
        event.preventDefault();activate(entry);
      });
      results.append(row);
    });
    if (!matched.length){
      const empty=document.createElement('p');
      empty.className='lab-command-empty';
      empty.textContent=english?'Nothing found. Try another word.':'Nada por aquí. Prueba otra palabra.';
      results.append(empty);
    }
    count.textContent=matched.length+' '+(english?'destinations':'destinos');
    setActive(Math.min(selected,matched.length-1));
  }
  function activate(entry) {
    if(!entry)return;
    if(!isInternal(entry.href)){
      const anchor=results.querySelectorAll('[role="option"]')[selected];
      anchor?.click();
      return;
    }
    const section=document.querySelector(entry.href);
    close(false);
    if(!section)return;
    history.replaceState(null,'',entry.href);
    if(entry.href==='#agente' && section.tagName==='DETAILS')section.open=true;
    section.scrollIntoView({block:'start',behavior:reduced()?'instant':'smooth'});
    section.setAttribute('tabindex','-1');
    section.focus({preventScroll:true});
  }
  function open() {
    if (!overlay.hidden)return;
    returnFocus=document.activeElement instanceof HTMLElement?document.activeElement:launch;
    previousOverflow=document.body.style.overflow;
    overlay.hidden=false;
    document.body.style.overflow='hidden';
    launch.setAttribute('aria-expanded','true');
    input.value='';
    selected=0;
    localize();
    render();
    input.focus();
  }
  function close(restore=true) {
    if (overlay.hidden)return;
    overlay.hidden=true;
    document.body.style.overflow=previousOverflow;
    launch.setAttribute('aria-expanded','false');
    input.removeAttribute('aria-activedescendant');
    if(restore && returnFocus?.isConnected)returnFocus.focus();
  }
  launch.addEventListener('click',open);
  closeButton.addEventListener('click',()=>close());
  overlay.addEventListener('pointerdown',event=>{if(event.target===overlay)close()});
  input.addEventListener('input',()=>{selected=0;render()});
  overlay.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();close();return}
    if(event.key==='ArrowDown' || event.key==='ArrowUp'){
      event.preventDefault();
      if(matched.length)setActive((selected+(event.key==='ArrowDown'?1:-1)+matched.length)%matched.length);
      input.focus();
      return;
    }
    if(event.key==='Enter' && matched.length && !event.isComposing && (event.target===input || event.target.closest?.('[role="option"]'))){event.preventDefault();activate(matched[selected]);return}
    if(event.key==='Tab'){
      const focusable=[input,...results.querySelectorAll('a'),closeButton];
      const index=focusable.indexOf(document.activeElement);
      if(index<0 || (event.shiftKey&&index===0) || (!event.shiftKey&&index===focusable.length-1)){
        event.preventDefault();
        focusable[event.shiftKey?focusable.length-1:0]?.focus();
      }
    }
  });
  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey) && event.key.toLowerCase()==='k' && !event.altKey){
      event.preventDefault();overlay.hidden?open():close();return;
    }
    if(event.key==='Escape' && !overlay.hidden){event.preventDefault();close()}
  });
  if(typeof MutationObserver==='function'){
    new MutationObserver(()=>localize()).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  }
  localize();
})();