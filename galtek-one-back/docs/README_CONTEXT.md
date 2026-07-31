# README_CONTEXT

Fecha de referencia: 2026-07-20.

Este es el indice de contexto para GaltekOne. Leer primero este archivo antes de pedir o ejecutar cambios en el proyecto.

## Orden recomendado de lectura

1. `README_CONTEXT.md`
2. `AI_CONTEXT.md`
3. `DEVELOPMENT_RULES.md`
4. `CODEX_WORKFLOW.md`
5. Seccion relevante de `MODULES_STATUS.md`
6. Documentos condicionales segun la tarea.

## Estrategia de lectura por niveles

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

Regla de ahorro de tokens:

- Para tareas que afecten varios modulos, leer solo los documentos de esos modulos.
- No leer Clientes, Proveedores y Configuracion como paquete global para cualquier cambio.
- Si el pedido es solo documental, no cargar codigo funcional salvo que sea necesario verificar una afirmacion.

## Indice

| Documento | Para que sirve |
| --- | --- |
| `AI_CONTEXT.md` | Contexto maestro de producto, arquitectura, stack, decisiones y reglas de verdad. |
| `MODULES_STATUS.md` | Estado real detectado por modulo: funcional, parcial, desarrollo, preparado o pendiente. |
| `DEVELOPMENT_RULES.md` | Reglas para modificar backend, frontend, seguridad, permisos, UX, datos y docs. |
| `PROJECT_HISTORY.md` | Historia tecnica reconstruida desde git, docs, estructura y logs disponibles; lectura condicional. |
| `CODEX_WORKFLOW.md` | Flujo de trabajo para Codex u otros agentes IA. |
| `CFG-ARQ-001.md` | Base historica de configuracion, usuarios, roles, permisos, overrides y ticket; lectura condicional. |
| `VTA-ARQ-001.md` | Base operativa de caja, saldo continuo, turnos, cierre, movimientos efectivo/tarjeta y guardia de acceso a Ventas; lectura condicional. |
| `CLI-ARQ-001.md` | Base tecnica de clientes; lectura condicional. |
| `PRV-ARQ-001.md` | Base tecnica de proveedores; lectura condicional. |
| `analisis-arquitectura-backend.md` | Analisis general del backend; lectura condicional. |

## Regla principal

Los documentos son contexto estrategico, no verdad absoluta. Si el codigo real contradice un documento, se prioriza el codigo y se marca la diferencia como `pendiente de alinear`.

## Contexto rapido

- GaltekOne es un POS desktop de GaltekSolution.
- El usuario objetivo son tiendas pequenas y medianas.
- GaltekOne no solo debe funcionar; debe sentirse premium, rapido, claro y confiable.
- El estandar visual es prioridad estrategica, no decoracion adicional.
- La UX debe ser premium tipo Apple Vision aplicada a un POS: limpia, moderna, practica, densa y elegante.
- Debe ser completamente operable con teclado en las pantallas relevantes.
- La tabulacion debe seguir un orden logico y operativo.
- El foco visible debe usar el verde institucional y no bordes azules nativos.
- Los flujos deben minimizar clics, pasos, ventanas y esfuerzo mental.
- Una pantalla que compila pero se siente generica, lenta o inconsistente no esta terminada.
- Prioridad de resoluciones: 1366x768, 1440x900, 1600x900, 1920x1080 y 2560x1440.
- Frontend actual: React con `react-scripts`, no Vite.
- Backend actual: Java 21 + Spring Boot 3.3.4.
- Desktop actual: Tauri 2.
- Base local desktop: SQLite.
- Base de pruebas: H2 cuando aplique.
- Caja/Ventas: leer `VTA-ARQ-001.md`; `LocalDevice` es la computadora/estacion, `SaldoEfectivo` es el saldo continuo, `CajaSesion` es el turno financiero y el historial de caja se consulta por cortes/sesiones paginadas.
- Caja ahora distingue movimientos de efectivo y tarjeta. Los movimientos electronicos quedan auditados, pero no modifican `SaldoEfectivo`.
- Apertura de caja limpia no crea movimiento `OPENING`; apertura con reporte de diferencia crea incidencia y conciliacion de apertura cuando el conteo declarado difiere del saldo heredado.
- Produccion prevista: MySQL, backend en AWS Elastic Beanstalk y frontend en AWS Amplify.
- Permisos: base existente, enforcement completo reservado para fase final.

## Antes de cambiar algo

- Revisar `git status --porcelain`.
- Leer el contexto nucleo y solo los documentos condicionales aplicables.
- Leer codigo real relacionado.
- No tocar codigo funcional si la tarea es documental.
- No revertir cambios ajenos.
- Actualizar docs si el estado real cambia.

## Prompt corto recomendado

```text
Lee primero /galtek-one-back/docs/README_CONTEXT.md. Carga el contexto nucleo: AI_CONTEXT.md, DEVELOPMENT_RULES.md, CODEX_WORKFLOW.md y la seccion relevante de MODULES_STATUS.md. Lee solo los documentos condicionales del modulo afectado. Verifica codigo real antes de cambiar; si docs y codigo difieren, prioriza codigo y marca pendiente de alinear. Manten el estandar visual premium tipo Apple Vision adaptado a POS: componentes normalizados, foco verde, navegacion completa por teclado, tabulacion logica y flujos rapidos. No apliques enforcement final de permisos ni cambies seguridad, endpoints o arquitectura salvo solicitud explicita. No declares QA visual o de teclado sin runtime.
```
