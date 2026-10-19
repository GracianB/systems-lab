<div align="center">

<a href="https://gracianb.github.io/systems-lab/">
  <img src="./assets/readme-cover.svg" width="100%" alt="Systems Lab: cuatro experiencias, un mismo laboratorio" />
</a>

# Systems Lab

**Juegos · Arte generativo · IA aplicada · Customer Operations**

Una colección de proyectos que puedes **abrir, experimentar y comprobar**. Menos promesas, más producto.

[**Explorar el laboratorio ↗**](https://gracianb.github.io/systems-lab/) · [Modo claro ↗](https://gracianb.github.io/systems-lab/?theme=light) · [Portafolio principal ↗](https://gracianb.github.io/GracianB/)

</div>

---

## Empieza por una experiencia

<table>
<tr>
<td width="50%" valign="top">
<a href="https://gracianb.github.io/project-ohana/"><img src="./assets/projects/ohana.webp" alt="OHANA: isla y personajes jugables" width="100%"></a>

### [OHANA ↗](https://gracianb.github.io/project-ohana/)
**Juega.** Un mundo con diez personajes, evolución, salas y combate. [Código](https://github.com/GracianB/project-ohana).
</td>
<td width="50%" valign="top">
<a href="https://vortex-gilt-xi.vercel.app/"><img src="./assets/projects/vortex-cover-light.svg" alt="Vórtice: campo de órbitas generativas en diseño claro" width="100%"></a>

### [Vórtice ↗](https://vortex-gilt-xi.vercel.app/)
**Experimenta.** Campo WebGL con cuatro movimientos y estados visuales configurables. [Código](https://github.com/GracianB/vortex).
</td>
</tr>
</table>

<table>
<tr>
<td width="50%" valign="top">
<a href="https://gracianb.github.io/systems-lab/#aigoritmo"><img src="./assets/aigoritmo/arcana-poster.jpg" alt="Arcana: una de las cuatro identidades visuales de Aigoritmo" width="100%"></a>

### [Aigoritmo · Showcase ↗](https://gracianb.github.io/systems-lab/#aigoritmo)
**Descubre.** Cuatro identidades: Llama, Qwen, Arcana y Arcano. La app es **privada y local**; la web muestra una presentación visual, no una API ni un chat público.
</td>
<td width="50%" valign="top">
<a href="https://gracianb.github.io/systems-lab/#cs"><img src="./assets/projects/customer-ops.svg" alt="Customer Ops: canales de soporte conectados a un panel de servicio" width="100%"></a>

### [Customer Operations ↗](https://gracianb.github.io/systems-lab/#cs)
**Resuelve.** Caso real de operaciones de soporte y una **simulación local con datos ficticios**. [Help Center de referencia](https://bodytonehelp.zendesk.com/hc/es).
</td>
</tr>
</table>

**También:** [RevOps Studio · demo con datos de ejemplo ↗](https://gracianb.github.io/revops-studio/demo.html). Cutter Studio sigue siendo una herramienta privada, no una demo pública.

## Cómo está construido

| Capa | Implementación |
| --- | --- |
| Sitio | HTML, CSS y JavaScript sin framework; ES/EN; temas claro/oscuro |
| Experiencias | Enlaces directos y carga optativa del iframe de Vórtice y del agente |
| Visual | Campo Canvas con reducción de movimiento y posters específicos por tema |
| Calidad | Node 24, pruebas de contrato, Playwright (Chromium, Firefox, WebKit), comprobaciones de accesibilidad y presupuestos |
| Publicación | GitHub Actions → `dist/` → GitHub Pages; sin publicar código privado |

```bash
npm ci
npm run check
npm run test:browser
npm run build
```

Para ejecutar localmente: `npm start` (normalmente [127.0.0.1:4173](http://127.0.0.1:4173/)).

## Documentación, sin duplicar la portada

[**Arquitectura y estructura**](docs/ARCHITECTURE.md) · [**Calidad y límites de las demos**](docs/QUALITY_AND_BOUNDARIES.md) · [**Releases y decisiones**](docs/RELEASES.md) · [**Seguridad**](SECURITY.md) · [**Historial**](CHANGELOG.md) · [**Acciones CI**](https://github.com/GracianB/systems-lab/actions)

<sub>El código público permite inspeccionar el escaparate. Aigoritmo y Cutter no se publican aquí, ni sus claves, modelos o datos locales. Los despliegues externos se mantienen de forma independiente.</sub>
