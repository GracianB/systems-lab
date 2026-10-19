# P30 · Systems Lab: cinco fases de simplificación

## Objetivo
Llegar al proyecto antes. Mantener la identidad azul hielo, el contenido bilingüe y las evidencias sin saturar con seis tarjetas extras, métricas repetidas ni una segunda portada.

## Fase 1 · Explorador único
- Una portada y cuatro enlaces directos: OHANA, Vórtice, Aigoritmo y Customer Ops.
- Sin carrusel de estadísticas, rail duplicado ni CTA que remite al mismo punto.

## Fase 2 · Proyectos
- OHANA: vista ilustrativa y entrada a la experiencia real.
- Vórtice: una sola vista previa, iframe WebGL únicamente al activarse y control Detener.
- Aigoritmo: cuatro personajes, aviso de ejecución local, sin vínculo a 127.0.0.1.
- RevOps: demo pública con datos de muestra y código público, sin declararla integración comercial en producción.
- Cutter: desarrollo privado, sin enlace al código.

## Fase 3 · Operaciones
- Bodytone y su Help Center público son la prueba real; alcance y métricas del equipo correctamente atribuidos.
- Demo de agente separada en un disclosure accesible; se identifica expresamente como simulación sin backend.
- Fuera párrafos repetidos y esquemas redundantes.

## Fase 4 · Limpieza y accesibilidad
- Eliminar motor abandonado .fx-net y scroll rail ornamental.
- Detener requestAnimationFrame del cover bajo 768 px, al ocultarse la pestaña, al salir del viewport o al preferirse movimiento reducido.
- Corregir evento del campo: escucha el contenedor, pues el canvas es decorativo y no intercepta clics de navegación.
- Traducir todas las claves de ambos idiomas y retirar textos huérfanos.

## Fase 5 · Calidad y release
- Única configuración Playwright .mjs, invocada explícitamente.
- E2E en Chromium, Firefox, WebKit y emulación móvil. App local simulada, enlaces, ES/EN, foco, temas y overflow.
- CI de comparación visual independiente: dos builds locales, 16 capturas de pantalla y un informe HTML con medidas reales antes/después.
- Revisión humana obligatoria del informe visual. Sin afirmar aprobación estética automática.

## Condición de publicación
El PR permanece independiente de main hasta que Quality y comparación visual se completen y se inspeccionen las capturas. Tras fusionar: Deploy verde y smoke público confirmado. No fusionar con tests fallidos.

## Cierre técnico adicional · P32

- Retirar selectores CSS demostrablemente abandonados de la portada anterior. No introducir nuevas animaciones ni secciones.
- Evitar que Quality y Deploy ejecuten exactamente la misma matriz sobre cada push a main; Quality sigue siendo obligatorio en las PR, Deploy vuelve a verificar antes de publicar.
- No alterar rutas, HTML ni JS de usuario en esta fase; repetir los checks de navegador y contrastar capturas como validación de que el CSS eliminado no era necesario.
