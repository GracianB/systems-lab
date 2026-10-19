# Calidad, evidencia y límites

### Qué se verifica

- Calidad de fuente, sintaxis, componentes imprescindibles, URLs internas, identificadores y presupuestos de tamaño.
- Navegadores Chromium, Firefox y WebKit, incluyendo ventanas móviles.
- Navegación ES/EN, temas, foco, teclado, menú, demos optativas y `prefers-reduced-motion`.
- Capturas antes/después como **ayuda a la revisión humana**. Pasar selectores no garantiza un diseño agradable.
- Cada commit en `main` debe superar la verificación completa antes del despliegue de GitHub Pages.

### Qué NO debe afirmarse

- Una captura de Aigoritmo **no es** un chat público. Aigoritmo sigue en repositorio privado, con ejecución local. Sus proveedores externos dependen de la configuración local.
- El «agente» de soporte responde con datos simulados. No crea tickets, consulta envíos, recibe ficheros ni habla con un backend.
- La demo de RevOps usa datos de muestra y no supone integración con clientes reales.
- Bodytone es una referencia pública de trabajo previo, no prueba automática de métricas internas.
- Un CI verde de este repositorio no demuestra disponibilidad de Vercel, de los sitios externos ni de los motores locales. Para ello se necesitan pruebas propias.

### Checklist de publicación

1. Una PR con motivo y alcance verificables.
2. CI y comparativa visual revisados en claro/oscuro, móvil y escritorio.
3. No secretos, dependencias privadas ni `localhost` como enlaces públicos.
4. Fusionar solo cuando el código y las pruebas coincidan.
5. Confirmar que el workflow Deploy de `main` publica **ese commit**.

[Contrato completo](../RELEASE_CERTIFICATE.md) · [Pruebas](../tests/) · [Workflows](../.github/workflows/) · [Seguridad](../SECURITY.md)
