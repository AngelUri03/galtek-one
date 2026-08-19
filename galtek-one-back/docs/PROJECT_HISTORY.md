# PROJECT_HISTORY

Fecha de referencia: 2026-07-20.

Este documento resume la historia tecnica visible del proyecto a partir de git, documentos existentes, estructura del repositorio y logs locales disponibles. No sustituye al historial completo del equipo.

## Fuentes revisadas

- Rama local: `develop`.
- Estado inicial historico de la documentacion base: limpio antes de crear el paquete documental original. En la actualizacion 2026-07-20 el worktree ya tenia cambios de Caja/Ventas/Configuracion en curso.
- Historial git reciente.
- Documentos existentes en `/galtek-one-back/docs/`.
- Estructura de backend, frontend, Tauri y scripts raiz.
- Logs locales en `.codex-logs/`.

No se encontraron transcripciones de conversaciones en `.codex/` o `.agents/`. Los archivos encontrados en `.codex-logs/` son logs de ejecucion/desarrollo, no conversaciones completas.

## Resumen de linea de tiempo

2026-06-10:

- Primer commit visible del proyecto.
- Se establece base inicial de backend, frontend y scripts.

2026-06-18:

- Ajustes de UI en clientes.
- Mejoras de CSS y modales de eliminacion.

2026-06-23:

- Ajustes en compras.
- La pantalla de compras comienza a tomar forma visual y de flujo.

2026-06-27:

- Compras recibe stepper, tarjetas dobles y sugerencias.
- Se consolida una UX de alta de compra, aunque parte del flujo sigue sin persistencia real completa.

2026-07-06:

- Cambios de inventario.
- Se fortalece la relacion entre productos, lotes, estados de stock, umbrales y almacen.

2026-07-07:

- Cambios en proveedores.
- Se agregan/ajustan estructuras avanzadas de proveedor.

2026-07-09:

- Commit `Full proveedores`.
- Se amplia proveedores con backend, DTOs, entidades, servicios, front avanzado, schema y seed.
- Se documenta arquitectura de proveedores en `PRV-ARQ-001.md`.

2026-07-10:

- Commit `Full clientes`.
- Se amplia clientes con backend, DTOs, servicios, pantallas, detalle, filtros, acciones, schema y seed.
- Se documenta arquitectura de clientes en `CLI-ARQ-001.md`.
- Se agrega `LocalDateStringConverter.java`, relevante por errores historicos de parsing de fechas detectados en logs anteriores.

2026-07-13:

- Commit de configuracion, usuarios, roles, overrides y tickets.
- Se agregan migradores de configuracion ticket, empresas, catalogo de permisos, usuarios y permisos.
- Se agregan controladores/DTOs/entidades para configuracion de ticket, empresas, usuarios, roles, permisos y overrides.
- Se conectan pantallas de configuracion: tienda, ticket, usuarios, roles y overrides.

2026-07-13:

- Commit de licenciamiento, activacion y bloqueo de sistema.
- Se agregan `LocalDevice`, controladores de dispositivo, filtros de hardware lock, contexto de dispositivo y pantalla de activacion.
- Se actualizan rutas para requerir activacion.
- Se ajusta configuracion Tauri.

2026-07-13:

- Commit de correccion de redireccion al activar dispositivo.
- Se ajusta `ActivationPage`.

2026-07-13:

- Merge de PR desde rama de licenciamiento/activacion/bloqueo hacia `develop`.

2026-07-19:

- Entrega `VTA-CJA-001`: se crea la base operativa de caja para Ventas.
- Se reutiliza `LocalDevice` como identidad persistente de instalacion/caja fisica, interpretacion que queda corregida posteriormente.
- Se agrega `CajaSesion`, maquina de estados, apertura idempotente y movimiento `OPENING`.
- Se agrega guardia backend para `POST /ventas/crear`.
- Se agrega `CashSessionContext`, `CashSalesGuard`, pantalla de apertura e indicador de caja en Ventas.
- Se documenta el nuevo contexto especifico en `VTA-ARQ-001.md`.

2026-07-19:

- Correccion conceptual `VTA-CJA-001A`.
- `LocalDevice` queda definido como computadora/estacion de venta para licenciamiento, activacion y origen operativo.
- `CajaSesion` queda definido como turno financiero por empresa, instalacion y usuario.
- El cajon metalico no se registra ni se configura en GaltekOne.
- `CajasEntity`, `cashRegisterId`, `id_caja` y `active_cash_register_key` se conservan solo como compatibilidad legacy.
- Apertura, estado actual, guardia de Ventas y ventas nuevas se desacoplan de caja fisica y usan `LocalDevice`/`CajaSesion`.
- Se prepara resumen de turno para corte futuro y se conserva cierre/conciliacion completa fuera de alcance.

2026-07-19:

- Correccion operativa `VTA-CJA-002`.
- Se introduce `SaldoEfectivo` como saldo continuo por empresa e instalacion.
- La apertura deja de capturar `openingAmount` y deja de crear movimiento `OPENING`; el campo legacy queda como snapshot heredado.
- Se agregan inicializacion de saldo, entradas, retiros, cierre/corte, revelado de esperado, incidencias y politica de caja.
- Ventas en efectivo actualiza el saldo continuo con movimiento `CASH_SALE`.
- Ajustes incorpora `Caja y turnos`; Ventas incorpora panel operativo de caja.
- El turno abierto por otro usuario se expone como `OPEN_BY_OTHER_USER`.
- Relevo formal directo/diferido queda con entidad y politica base, pero sin flujo completo de dos usuarios.

2026-07-19:

- Correccion funcional y UX `VTA-CJA-003`.
- Ventas frontend deja de simular exito local y confirma con `POST /ventas/crear`.
- El metodo de pago conserva `idMetodoPago`; efectivo, tarjeta y transferencia pasan por el mismo alta real.
- Tras venta exitosa se refrescan ventas del dia desde backend y `CashSessionContext` para actualizar saldo continuo.
- Backend permite que ventas POS omitan `almacenId`; el descuento FIFO/FEFO consume lotes del almacen real disponible por producto.
- Caja agrega relevo diferido con `RECEIVING_COUNT_REQUIRED` cuando el ultimo turno cerrado de la estacion pertenece a otro usuario y la politica exige conteo entrante.
- La apertura con conteo entrante valida diferencia sin crear movimiento; en continuidad registra incidencia `DEFERRED_HANDOFF_MISMATCH`, en politica estricta bloquea.
- Se crea `/control-caja` como pagina dedicada para resumen, movimientos manuales, revelado y corte; el drawer de Ventas queda como resumen/atajo.
- Se actualizan docs de Ventas/Caja para eliminar el pendiente obsoleto de pago frontend sin backend.

2026-07-20:

- Correccion puntual `VTA-CJA-004A`.
- El resumen rapido de Caja en Ventas se redisenia como panel contextual de turno abierto con responsable, actividad segura, importes protegidos y acciones autorizadas.
- Backend agrega `capabilities` en DTOs de caja y oculta saldos/esperado/arqueo si faltan permisos; el revelado de esperado queda como POST auditado.
- Se agrega `POST /caja/sesiones/actual/preparar-cierre` para calcular preview despues del conteo sin cerrar ni ajustar saldo.
- `Realizar corte` abre un modal reutilizable desde Ventas o `/control-caja`, sin navegar ni perder carrito.
- `Control de caja` y la opcion superior `Caja` se condicionan a `capabilities.canOpenCashControl`; `/control-caja` se conserva como pagina avanzada/admin.

2026-07-20:

- Correccion operativa/UX `VTA-CJA-004B`.
- `/control-caja` se transforma en dashboard operativo con resumen separado de caja fisica, tarjeta esperada, ingresos/retiros de efectivo, ingresos/retiros de tarjeta y conflictos abiertos.
- Movimiento manual permite capturar efectivo o tarjeta; los movimientos electronicos se registran como `CARD_ENTRY`/`CARD_WITHDRAWAL` para auditoria y no afectan `SaldoEfectivo`.
- El historial de caja deja de presentarse como lista plana de registros y pasa a paginar cortes/sesiones con busqueda, rango fecha-hora, filtro por medio y detalle bajo demanda.
- La resolucion de incidencias agrega efectos de caja: recuento historico, recuperacion externa, devolucion externa, reporte sin cambio, entrada manual y salida manual.
- Configuracion `Caja y turnos` recibe ayuda guiada con overlay, foco visual por seccion y explicacion de politica, visibilidad, conteos, incidencias y guardado.

2026-07-20:

- Correccion de apertura con reporte de diferencia.
- `CashOpeningScreen` incorpora flujo para reportar que el efectivo real al iniciar no coincide con el saldo continuo mostrado.
- `POST /caja/sesiones/abrir` acepta `reportOpeningDifference`.
- Si hay diferencia, backend crea `HANDOFF_RECONCILIATION` con categoria `OPENING_OVERAGE` u `OPENING_SHORTAGE`, referencia `CASH_OPENING_DIFFERENCE`, actualiza el saldo operativo vivo y crea `CajaIncidencia` (`OTHER_CASH_DISCREPANCY` o `DEFERRED_HANDOFF_MISMATCH`).
- Se agrega cobertura de `CajaSesionServiceImplTest` para apertura con diferencia reportada.

2026-07-20:

- Correccion `VTA-CJA-005` de apertura reportada con diferencia exacta `0.00`.
- Backend trata el reporte exacto como apertura limpia: no exige motivo, no crea incidencia, no crea `HANDOFF_RECONCILIATION` y no ajusta el saldo continuo.
- `CashOpeningScreen` deja de anunciar incidencia o pedir motivo cuando el conteo visible coincide con el saldo esperado.
- Se agrega prueba de regresion para evitar incidencias y movimientos falsos en apertura exacta.

2026-08-13:

- Tarea `UX-DS-001`.
- Se define la gramatica oficial de superficies de GaltekOne: pagina como modulo, drawer como contexto, navegacion interna como profundidad, modal como accion puntual y toast como resultado.
- Proveedores deja de usar el mega-modal avanzado para Productos, Activos, Documentos y Auditoria.
- Se introduce `WorkspaceDrawer`/`ModalSurface` como base reusable de overlays y se aplica `ProveedorWorkspaceDrawer` con pila interna.
- Agregar/editar activo y agregar/editar documento pasan a vistas internas del mismo drawer.
- La tabla de Proveedores reduce acciones visibles a Ver, Editar y `Mas acciones`.
- Inventario queda documentado para seguir el patron futuro `Inventario -> Producto -> Lotes -> Nuevo lote` dentro de un solo Drawer Workspace.

## Historia por area

### Backend

El backend evoluciono hacia una arquitectura clasica por capas:

- Controller.
- Service interface.
- Service implementation.
- Repository.
- Entity.
- DTO.
- Mapper.
- Specification.

El analisis backend original sigue siendo util, pero debe alinearse con cambios posteriores:

- El perfil desktop usa SQLite.
- El perfil productivo usa MySQL.
- La seguridad ya incluye licenciamiento/hardware lock.
- CORS no esta abierto globalmente en el codigo actual.
- El enforcement completo de permisos todavia esta pendiente por decision estrategica.

### Frontend

El frontend se mantiene en React con `react-scripts`, no Vite. La navegacion principal vive en `AppRouter` y el cliente HTTP en `APIfetch`.

Se han construido pantallas avanzadas para clientes, proveedores, inventario, ventas, compras, configuracion y reportes, con diferentes niveles de conexion real al backend.

### Desktop

El producto tiene compatibilidad real con Tauri 2. La aplicacion desktop apunta a backend local en `127.0.0.1:18080/GaltekOne` y frontend en `localhost:3000` durante desarrollo.

El bundle desktop incluye recursos de backend y JRE, por lo que cualquier cambio de rutas, puertos o perfiles debe revisarse con cuidado.

### Base de datos

Hay scripts SQL raiz para schema y seed. El esquema contiene tablas para ventas, compras, clientes, proveedores, inventario, usuarios, roles, permisos, ticket, caja, dispositivos locales y varias relaciones auxiliares.

No se detecto Flyway o Liquibase como estrategia formal de migraciones. Existen migradores propios en codigo para algunas areas de configuracion, permisos y usuarios.

## Logs locales revisados

Archivos detectados:

- `.codex-logs/clientes-dev.log`
- `.codex-logs/galtek-dev.log`

Hallazgos historicos:

- Logs de 2026-07-07 y 2026-07-09 muestran errores HTTP 500 en clientes/proveedores relacionados con parsing de fechas SQLite.
- Se observaron excepciones `java.sql.SQLException: Error parsing date` y valores tipo `2026-03-10` que no coincidieron con formato timestamp esperado.
- El commit posterior de clientes agrego `LocalDateStringConverter.java`, por lo que este hallazgo queda como historico y `pendiente de confirmar` si ya quedo completamente corregido en todos los flujos.

## Decisiones tecnicas consolidadas

- Monorepo con backend, frontend y desktop.
- Backend Java/Spring Boot.
- Frontend React con `react-scripts`.
- Tauri 2 para escritorio.
- SQLite para desktop local.
- MySQL para produccion.
- AWS como objetivo de despliegue: Elastic Beanstalk para backend y Amplify para frontend.
- Experiencia desktop premium para POS, no mobile-first.
- Roles/permisos/overrides se conservan, pero el enforcement completo se aplicara al final del desarrollo completo.

## Decision estrategica de experiencia

- Diseno premium y coherencia visual son requisitos de producto.
- Navegacion completa por teclado es requisito operativo del POS.
- Los flujos deben minimizar pasos, clics, ventanas y cambios de contexto.
- Las pantallas no se consideran terminadas solo porque compilan.
- Cualquier cambio frontend debe respetar el estandar visual, de teclado y velocidad definido en `AI_CONTEXT.md` y `DEVELOPMENT_RULES.md`.

## Riesgos historicos

- Diferencias entre documentacion y codigo en configuracion.
- Varias pantallas visualmente avanzadas aun tienen partes locales/mock.
- Ventas ya llama `POST /ventas/crear`; el riesgo vigente es QA end-to-end de ticket, impresion, cliente seleccionado e inventario en escenarios amplios.
- Compras tiene historial conectado, pero alta de compra detectada sigue parcialmente local/mock.
- Caja ya tiene saldo continuo, apertura con reporte de diferencia, guardia de Ventas, cierre/corte, entradas/retiros efectivo/tarjeta, incidencias, resolucion con efecto de caja e historial paginado por cortes; relevo formal directo y QA visual/teclado completo siguen pendientes.
- Respaldos/exportaciones tienen UI, pero no integracion real detectada.
- No hay evidencia de pruebas automatizadas amplias para los modulos principales.

## Criterio para futuras actualizaciones

Cada vez que se complete un modulo o se modifique arquitectura, actualizar:

- `AI_CONTEXT.md`
- `MODULES_STATUS.md`
- `PROJECT_HISTORY.md`
- Documento especifico del modulo si existe.

Si la historia en git contradice una suposicion previa, conservar el dato historico y marcarlo como `pendiente de alinear`.
