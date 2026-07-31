# CODEX_WORKFLOW

Fecha de referencia: 2026-07-20.

Este documento define como debe trabajar Codex u otro agente IA dentro de GaltekOne.

## Regla permanente

Antes de modificar codigo, documentacion o comportamiento en GaltekOne, leer solo el contexto necesario.

Contexto nucleo obligatorio para cualquier tarea:

- `README_CONTEXT.md`
- `AI_CONTEXT.md`
- `DEVELOPMENT_RULES.md`
- `CODEX_WORKFLOW.md`
- La seccion relevante de `MODULES_STATUS.md`

Contexto condicional:

- `CFG-ARQ-001.md` solo para Configuracion, Tienda, Usuarios, Roles, Overrides, Ticket o secciones de Ajustes.
- `VTA-ARQ-001.md` solo para Caja, Ventas, Pagos, Cierre, Ticket o movimientos de efectivo/tarjeta.
- `CLI-ARQ-001.md` solo para Clientes o integraciones que afecten Clientes.
- `PRV-ARQ-001.md` solo para Proveedores, abastecimiento o relaciones directamente vinculadas.
- `analisis-arquitectura-backend.md` cuando la tarea modifique backend, seguridad, persistencia, servicios, entidades o endpoints.
- `PROJECT_HISTORY.md` cuando sea necesario conocer cambios anteriores, decisiones historicas, commits o actualizar documentacion.

Para tareas que afecten varios modulos, leer solo los documentos de esos modulos. No cargar Clientes, Proveedores y Configuracion como paquete global si la tarea no los toca.

Orden recomendado:

1. `README_CONTEXT.md`
2. `AI_CONTEXT.md`
3. `DEVELOPMENT_RULES.md`
4. `CODEX_WORKFLOW.md`
5. Seccion relevante de `MODULES_STATUS.md`
6. Documentos condicionales segun la tarea

Si el codigo contradice los documentos, priorizar el codigo y dejar la diferencia marcada como `pendiente de alinear`.

## Inicio de sesion de trabajo

1. Revisar el pedido exacto del usuario.
2. Identificar si es documentacion, codigo, UI, backend, datos, seguridad o build.
3. Leer contexto nucleo y documentos condicionales aplicables.
4. Revisar `git status --porcelain`.
5. Revisar archivos reales relacionados con el cambio.
6. Detectar si hay cambios del usuario en el worktree.
7. No revertir cambios ajenos.

## Antes de modificar documentacion

- Confirmar que la tarea permite tocar documentacion.
- No modificar codigo funcional.
- Si se actualiza estado de modulos, revisar codigo real y no solo docs.
- Si un dato viene de git/logs y no de codigo actual, marcarlo como historico.

## Antes de modificar backend

- Leer controller, service interface, service implementation, entity, repository, DTO y mapper relacionados.
- Revisar endpoints en `src/API/api.js` si el frontend los consume.
- Revisar seguridad si el endpoint es nuevo o critico.
- Revisar `idEmpresa`, estatus logico y auditoria.
- Revisar scripts SQL si hay cambio de persistencia.

## Antes de modificar frontend

- Revisar `AppRouter`.
- Revisar `src/API/api.js`.
- Revisar `src/API/APIfetch.js`.
- Revisar componentes hermanos.
- Revisar estilos existentes.
- Revisar pantallas maduras: Proveedores, Clientes, Configuracion, Tienda, Usuarios, Roles, Overrides y Ticket/impresion.
- Revisar patrones de layout, tarjetas, tablas, filtros, botones, modales, drawers, foco, sombras y colores.
- Revisar patrones de skeletons, estados vacios, errores, reintento y feedback de guardado.
- Revisar orden de tabulacion esperado y flujo completo con teclado.
- Revisar resoluciones desktop objetivo antes de cerrar cambios visuales importantes.
- Mantener `react-scripts`.
- Mantener compatibilidad Tauri.
- No limitarse a hacer que funcione: entregar una experiencia visualmente pulida, coherente, premium, rapida, intuitiva y completamente operable con teclado.

## Antes de modificar permisos

Decision vigente:

- No aplicar enforcement completo hasta fase final de desarrollo.
- No eliminar base de permisos.
- No rehacer roles.
- No bloquear falsamente flujos actuales.
- Dejar preparada la referencia para permisos futuros.

Si el usuario pide enforcement, documentar claramente alcance, rutas, endpoints, pantallas y pruebas.

## Durante el trabajo

- Hacer cambios pequenos y coherentes con patrones existentes.
- No introducir arquitectura nueva sin necesidad.
- No inventar endpoints.
- No inventar estados funcionales.
- No usar datos mock donde ya existe backend real.
- Marcar `pendiente de alinear` cuando haya divergencia.
- Mantener el foco desktop-first y POS.

## Protocolo de evidencia y validacion

Niveles de verificacion que deben reportarse sin mezclarlos:

- Revisado en documentacion.
- Revisado en codigo.
- Build o compilacion verificada.
- Verificado funcionalmente en runtime.
- Verificado visualmente en runtime.
- Verificado con teclado en runtime.
- No verificado.

Reglas:

- No declarar una pantalla "perfecta", "pulida", "completa" o "validada" basandose solo en lectura de codigo.
- Un build exitoso no demuestra calidad visual ni navegacion por teclado.
- Para declarar QA visual, abrir y recorrer las pantallas en ejecucion.
- Para declarar QA de teclado, completar el flujo principal sin mouse.
- Si no se pudo ejecutar la aplicacion, indicar expresamente que quedo sin verificar.
- Diferenciar observaciones de codigo de resultados observados en runtime.
- No inventar resoluciones probadas.
- No inventar comportamiento de impresoras, Tauri, modales o componentes.

## Despues del trabajo

Para documentacion:

- Ejecutar `git diff --check`.
- Revisar `git diff --stat`.
- Confirmar que solo se tocaron documentos.

Para codigo:

- Ejecutar pruebas/build razonables segun el area.
- Reportar cualquier prueba no ejecutada.
- Actualizar docs si el estado real cambio.

Para frontend:

- Reportar que cambio funcionalmente.
- Reportar que mejoro visualmente.
- Reportar que componentes normalizo.
- Reportar que patron existente reutilizo.
- Reportar que resoluciones valido.
- Reportar que estados visuales probo.
- Reportar como funciona el flujo con teclado.
- Reportar que orden de tabulacion valido.
- Reportar como manejo el foco.
- Reportar como se comportan modales, drawers y popovers.
- Reportar si queda algun pendiente visual, de UX o de teclado.
- Referenciar el `QA visual obligatorio` y el `QA de teclado obligatorio` de `DEVELOPMENT_RULES.md`.

Formato minimo de verificacion para una tarea frontend:

- Documentacion revisada: si/no.
- Codigo revisado: si/no.
- Build ejecutado: si/no y resultado.
- Runtime ejecutado: si/no.
- Resoluciones verificadas realmente.
- Flujo con teclado verificado: si/no.
- Pendientes no comprobados.

## Reglas para revisar git y conversaciones

Git:

- Usar `git status --porcelain` para detectar cambios.
- Usar `git log --oneline --decorate --date=short --pretty=format:"%h %ad %an %s"` para historia rapida.
- Usar `git log --stat --name-only` cuando se necesite entender alcance de commits.

Conversaciones/logs:

- Si existen transcripciones reales, leerlas antes de reconstruir contexto.
- Si solo existen logs de ejecucion, documentar que no son conversaciones.
- No inventar decisiones de conversacion no visibles.

## Plantilla reusable de prompt

Usa esta plantilla para futuras sesiones:

```text
Trabaja en GaltekOne. Antes de modificar, lee el contexto nucleo: /galtek-one-back/docs/README_CONTEXT.md, /galtek-one-back/docs/AI_CONTEXT.md, /galtek-one-back/docs/DEVELOPMENT_RULES.md, /galtek-one-back/docs/CODEX_WORKFLOW.md y la seccion relevante de /galtek-one-back/docs/MODULES_STATUS.md. Lee documentos condicionales solo si aplican al modulo o tipo de cambio: CFG-ARQ-001 para Configuracion/Tienda/Usuarios/Roles/Overrides/Ticket/Ajustes, VTA-ARQ-001 para Caja/Ventas/Pagos/Cierre/Ticket/movimientos, CLI-ARQ-001 para Clientes, PRV-ARQ-001 para Proveedores/abastecimiento, analisis-arquitectura-backend.md para backend/seguridad/persistencia/servicios/entidades/endpoints y PROJECT_HISTORY.md solo si se necesita historia, commits, decisiones previas o actualizar documentacion. Usa esos documentos como contexto base, pero verifica el codigo real antes de actuar. Si el codigo contradice la documentacion, prioriza el codigo y marca la diferencia como pendiente de alinear. Manten compatibilidad con React react-scripts, Spring Boot, Tauri 2, SQLite desktop, MySQL prod y H2 en pruebas. La app es un POS desktop premium de GaltekSolution para tiendas pequenas y medianas. Da prioridad maxima al estandar visual no negociable: experiencia premium tipo Apple Vision adaptada a POS, componentes normalizados, verde institucional, sombras suaves, foco verde, navegacion completa por teclado, tabulacion logica y flujos rapidos. No apliques enforcement final de permisos salvo que se pida explicitamente; conserva roles, permisos y overrides preparados para la fase final. No declares QA visual ni QA de teclado sin runtime.
```

## Respuesta final esperada de Codex

Al terminar una tarea, Codex debe reportar:

- Que cambio.
- En que archivos.
- Que verifico.
- Que no pudo verificar, si aplica.
- Si quedan pendientes reales.

No debe dar por terminado un modulo solo porque la documentacion fue creada.

Si la tarea toco frontend, tambien debe reportar el resultado del checklist visual, el checklist de teclado, resoluciones revisadas, manejo de foco y cualquier pendiente de UX.
