# Auditoría de GitHub · Systems Lab

Lectura realizada el **19/10/2026**. Estos ajustes pertenecen a la configuración del repositorio, no al código y **no se cambian al editar este documento**.

| Ajuste visible | Estado comprobado | Criterio para V1 |
| --- | --- | --- |
| Visibilidad | Público | Mantener público: el sitio es un escaparate |
| Rama base | `main` | Mantener |
| Homepage | `https://gracianb.github.io/systems-lab/` | Correcta |
| Topics | `canvas`, `customer-success`, `demo`, `github-pages`, `portfolio`, `webgl` | Añadir opcionalmente `automation`, `creative-coding`, `ai-showcase` si reflejan mejor el contenido |
| Issues | Activadas | Útil para defectos reproducibles |
| Wiki / Projects | Activados | Opcional desactivar si se usan `docs/` y PRs como fuentes principales |
| Squash merge | Permitido | Mantener para un histórico limpio |
| Borrado automático de ramas al fusionar | Desactivado | **Recomendado activarlo** en Settings → General → Pull Requests tras verificar permisos |
| Quality | Workflow de PR | Comprobar ejecución antes de fusionar |
| Pages | GitHub Actions | Mantener construcción acotada a `dist/` |

### Seguridad y operaciones

- Evitar volver pública la carpeta de código o medios locales de **Aigoritmo**, cuyo repositorio independiente es privado.
- El commit de la PR debe coincidir con el commit de ejecución del despliegue de `main`.
- Revisar Settings → Branches/Rules → `main`: exigir Quality antes de fusionar, si los permisos y el plan lo permiten. La lectura de protección no estuvo disponible para esta auditoría; **no se afirma que esté habilitada**.
- GitHub Actions: mantener `permissions: contents: read` en calidad; Pages recibe solo los permisos mínimos para su deploy.
- No confundir una recomendación de Settings con un cambio aplicado. En esta intervención solo se editan archivos y PRs mediante el conector.

Los ajustes de cuenta, reglas y repositorio no pueden mutarse desde las acciones de GitHub disponibles aquí; requieren revisión en GitHub Settings.
