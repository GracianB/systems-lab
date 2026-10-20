# Arquitectura y estructura del repositorio

**Regla:** el código estático público vive aquí; los motores de OHANA, Vórtice y Aigoritmo pertenecen a sus proyectos independientes.

```text
systems-lab/
├── index.html, 404.html            # documentos publicados
├── main.js, boot.js, i18n.js       # navegación, temas e idiomas
├── cover-canvas.js, styles.css     # campo visual y diseño
├── experience-navigator.js/.css    # búsqueda local y navegación accesible
├── assets/
│   ├── readme-cover.svg           # banner exclusivo del repositorio
│   ├── projects/                  # previews OHANA + Vórtice, claro/oscuro
│   └── aigoritmo/                 # cuatro imágenes aprobadas, sin backend
├── bodytone-chatbot/frontend/      # simulación estática y explícitamente ficticia
├── tests/                         # contratos Node + navegadores Playwright
├── tools/                         # auditorías, servidor de pruebas, build
├── docs/                          # contexto técnico, decisiones, releases
└── .github/workflows/             # PR Quality + Deploy sobre main
```

### Flujo reproducible

`npm ci` → `npm run check` → `npm run test:browser` → `npm run build`.

- `tools/build.mjs` publica solo una lista explícita de archivos en `dist/`, incluyendo los dos módulos de navegación; valida que cada recurso local de `index.html` exista realmente en el artefacto. No se copia ninguna carpeta privada.
- `playwright.config.mjs` es la única configuración de navegador. Los tests comparan interacciones, accesibilidad, errores, recursos, responsive y preferencias.
- El workflow **Quality** comprueba PRs y genera comparativas visuales antes/después; el workflow **Deploy** vuelve a validar `main` y publica el artefacto.
- El campo `cover-canvas.js` se detiene con movimiento reducido, en móviles y cuando la pestaña está oculta. Vórtice se inserta en iframe solo al pulsar «Activar demo».

### Política de organización

Las páginas y recursos referenciados por `index.html` se quedan en su ruta pública para **no romper URLs ya indexadas ni el build**. Los documentos de ingeniería y los historiales no van a la portada; están bajo `docs/`. No se reorganizan rutas de producción únicamente para que el árbol parezca más elegante.

Los cambios en motores externos se prueban y publican en sus respectivos repositorios, no copiando su código dentro de este.

### V2 · Navegación transversal

`experience-navigator.js` se carga como script defer de primera parte. Construye un diálogo de búsqueda con ocho destinos públicos indexados en ES/EN; no hace peticiones de red. Mantiene el foco durante la búsqueda, devuelve el foco a su origen al cerrar y enfoca la sección al navegar internamente. Los enlaces externos conservan semántica nativa de enlace, `target="_blank"` y `rel="noopener noreferrer"`. La UI se integra por CSS con las variables de diseño del sitio y respeta `prefers-reduced-motion`.
