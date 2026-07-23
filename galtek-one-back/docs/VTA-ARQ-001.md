# VTA-ARQ-001 - CAJA, SALDO CONTINUO Y GUARDIA DE VENTAS

Fecha de referencia: 2026-07-20.

## Proposito

Este documento es el contexto especifico de Caja operativa y su guardia de acceso a Ventas. Aplica cuando una tarea toque Caja, Ventas, Pagos, Cierre, Ticket o movimientos de efectivo/tarjeta.

Correccion `VTA-CJA-002`: Caja usa saldo continuo por estacion. La apertura limpia de turno no captura `openingAmount`, no modifica efectivo y no crea movimiento `OPENING`. El campo `opening_amount` queda como compatibilidad legacy y snapshot del saldo heredado al abrir.

Correccion `VTA-CJA-003`: el flujo frontend de Ventas ya no genera exito local. `Ventas.jsx` llama `POST /ventas/crear`, conserva el carrito ante error, limpia solo tras respuesta real, refresca ventas del dia desde backend y sincroniza `CashSessionContext`. Se agrega `/control-caja` como pagina dedicada; el drawer de Ventas queda como resumen/atajo. El relevo diferido por cambio de usuario puede exigir conteo entrante; la forma de conciliar diferencias queda actualizada por `VTA-CJA-004B`.

Correccion `VTA-CJA-004A`: el resumen rapido de Caja en Ventas es contextual y no reemplaza `/control-caja`. Protege importes financieros desde DTO/backend mediante `capabilities`; `Realizar corte` abre un modal sin navegar y sin desmontar Ventas; `Control de caja` y la opcion superior `Caja` dependen de `canOpenCashControl`.

Correccion `VTA-CJA-004B`: `/control-caja` ahora separa efectivo y tarjeta en captura, resumen e historial. Los movimientos electronicos quedan auditados como `CARD_ENTRY`/`CARD_WITHDRAWAL` y no afectan `SaldoEfectivo`. El historial se consulta por cortes/sesiones paginadas con rango fecha-hora, busqueda y filtro por medio. La apertura con reporte de diferencia crea incidencia y conciliacion `HANDOFF_RECONCILIATION` para alinear el saldo operativo al conteo declarado. Configuracion agrega ayuda guiada para `Caja y turnos`.

Correccion `VTA-CJA-005`: si el usuario entra al flujo de reporte de diferencia al abrir, pero el efectivo contado coincide exactamente con el saldo continuo heredado, la apertura se trata como limpia. No se exige motivo, no se crea incidencia, no se registra `HANDOFF_RECONCILIATION` y no se ajusta el saldo.

## Modelo conceptual vigente

Conceptos separados:

- `LocalDevice`: identifica la computadora/instalacion. Sirve para activacion, licencia, hardware lock y origen operativo.
- `SaldoEfectivo`: snapshot continuo del efectivo esperado por empresa e instalacion.
- `CajaSesion`: representa el turno financiero. Pertenece a empresa, instalacion y usuario.
- `MovimientoCaja`: libro historico inmutable de impactos financieros y registros operativos por sesion.
- Movimientos electronicos: libro historico de ingresos/retiros tarjeta. Se registran para auditoria, pero no modifican efectivo continuo.
- `CajaIncidencia`: diferencias o eventos de caja pendientes de revision/resolucion.
- `ConfiguracionCaja`: politica operativa de cierre, conteo y relevo.
- Cajon metalico: contiene el efectivo real. No se registra, no se activa, no se configura y no se conecta al sistema.

`CajasEntity`, `id_caja`, `LocalDevice.cashRegisterId` y `active_cash_register_key` quedan como compatibilidad legacy. No son fuente de verdad del flujo nuevo.

## Reglas funcionales vigentes

- El saldo continuo debe inicializarse una sola vez por instalacion antes de abrir turnos.
- Abrir turno copia el saldo continuo como snapshot heredado.
- Abrir turno limpio no pide monto editable y no genera `OPENING`.
- Si al abrir el cajero reporta que el efectivo contado no coincide con el saldo continuo heredado, el request envia `reportOpeningDifference=true`, `receivedAmount` y motivo. El backend crea incidencia auditable y, si la diferencia es distinta de cero, movimiento `HANDOFF_RECONCILIATION`.
- Si el conteo reportado coincide exactamente con el saldo heredado, la apertura no se considera reporte financiero: no exige motivo, no crea incidencia, no crea `HANDOFF_RECONCILIATION` y no ajusta saldo.
- La diferencia de apertura reportada ajusta el saldo operativo vivo al conteo aceptado, pero conserva `opening_amount` como snapshot heredado para auditoria.
- Solo puede existir una sesion `OPEN` o `PENDING_RECONCILIATION` por instalacion.
- Un usuario no puede tener mas de una sesion `OPEN` o pendiente.
- No se puede vender sin una sesion `OPEN` de la instalacion activa y del usuario autenticado.
- Otro usuario no puede continuar esa sesion como propia; el estado de respuesta debe ser `OPEN_BY_OTHER_USER`.
- Cerrar sesion de usuario o cerrar la aplicacion no realiza cierre financiero automatico.
- Al volver a abrir GaltekOne, el backend recupera el turno vigente desde la instalacion local.
- Despues del cierre se crea una sesion nueva; no se reabre la anterior.
- `NO_SESSION` es un estado normal de respuesta y debe llevar a apertura de turno.
- `BALANCE_NOT_INITIALIZED` es estado normal previo a la primera configuracion del saldo.
- No existe "caja fisica sin registrar" como estado normal del negocio.
- Solo existe una caja operativa alcanzable por estacion en esta etapa. Cuenta bancaria/destino externo no se configura desde Movimiento manual.

## Calculo financiero

La fuente operacional actual del efectivo esperado es `SaldoEfectivo.currentBalanceSnapshot`.

El saldo continuo cambia por movimientos con direccion financiera:

```text
SALDO_CONTINUO_NUEVO =
    SALDO_CONTINUO_ANTERIOR
  + MOVIMIENTOS_IN
  - MOVIMIENTOS_OUT
```

El resumen de turno se reconstruye desde movimientos de la sesion y excluye `INITIAL_BALANCE` y `OPENING` legacy:

```text
EFECTIVO_ESPERADO_DEL_TURNO =
    SALDO_HEREDADO_DE_APERTURA
  + VENTAS_EN_EFECTIVO
  + ENTRADAS_MANUALES
  - RETIROS_MANUALES
  - DEVOLUCIONES_EN_EFECTIVO
```

El resumen electronico del turno no representa saldo bancario real; solo registra lo informado por el POS/cajero:

```text
TARJETA_ESPERADA_DEL_TURNO =
    VENTAS_CON_TARJETA
  + ENTRADAS_TARJETA_REGISTRADAS
  - RETIROS_TARJETA_REGISTRADOS
```

En corte:

```text
DIFERENCIA = EFECTIVO_CONTADO - EFECTIVO_ESPERADO_CONTINUO
```

En apertura con reporte:

```text
DIFERENCIA_APERTURA =
    EFECTIVO_CONTADO_AL_ABRIR
  - SALDO_CONTINUO_HEREDADO
```

Si `DIFERENCIA_APERTURA` es positiva, se registra conciliacion de entrada (`OPENING_OVERAGE`). Si es negativa, se registra conciliacion de salida (`OPENING_SHORTAGE`). La sesion conserva el saldo heredado como snapshot y opera desde el saldo contado aceptado.

Reglas:

- Usar `BigDecimal` para montos de caja.
- Saldo inicial, entradas y retiros manuales no son ventas.
- Tarjeta y transferencia no aumentan efectivo esperado.
- Tarjeta/electronico si puede registrarse como movimiento manual de auditoria; no modifica `SaldoEfectivo`.
- Una venta en efectivo crea `CASH_SALE` por el total de la venta, no por el importe recibido.
- Cancelaciones/devoluciones no borran movimientos originales; deben generar compensacion cuando aplique.
- Los movimientos permanecen historicos e inmutables.
- Cada movimiento operativo guarda `balance_before`, `balance_after`, `financial_direction`, `category` e `idempotency_key`.
- El saldo continuo no puede quedar negativo.
- Resolver una incidencia dias despues no reescribe el saldo del dia historico; si hay efecto financiero, se registra movimiento de resolucion en el momento de resolver y se conserva la diferencia original.

## Estados

Estados persistidos en `CajaSesion`:

- `OPEN`
- `PENDING_RECONCILIATION`
- `CLOSED`
- `CLOSED_BY_SUPERVISOR`

Estados de respuesta:

- `BALANCE_NOT_INITIALIZED`: la estacion aun no tiene saldo continuo inicializado.
- `NO_SESSION`: no existe turno vigente. Es exitoso y normal.
- `RECEIVING_COUNT_REQUIRED`: no existe turno vigente, pero la politica exige conteo entrante porque el ultimo turno cerrado de la estacion pertenece a otro usuario.
- `OPEN`: turno abierto del usuario actual.
- `OPEN_BY_OTHER_USER`: turno abierto en la instalacion, pero pertenece a otro usuario.
- `PENDING_RECONCILIATION`: turno protegido por diferencia pendiente.
- `CLOSED`
- `CLOSED_BY_SUPERVISOR`
- `ERROR`: fallo real de backend, identidad de dispositivo, activacion o comunicacion.

Estados preparados para evoluciones de relevo:

- `HANDOFF_IN_PROGRESS`
- `PENDING_OWNER_REVIEW`
- `SUPERVISOR_REVIEW`

## Identidad de instalacion

La entrega reutiliza la base existente de licenciamiento/desktop:

- `LocalDeviceEntity.installationId`.
- Archivo persistente `%USERPROFILE%/.galtek-one/installation.json`.
- `LocalDeviceIdentityServiceImpl`.
- `DeviceLockState`, activacion y hardware lock.

Reglas:

- El frontend no envia `installationId` ni `cashRegisterId` como fuente de seguridad.
- Backend resuelve la instalacion desde `LocalDeviceRepository`.
- `registerDevice` no crea `CajasEntity`; solo puede nombrar/asociar la estacion.
- `activateDevice` no requiere `cashRegisterId` ni caja configurada.
- El DTO de estado expone `station.installationReference` ofuscado y `station.displayName`.
- `LocalDevice.cashRegisterId` puede conservar datos previos, pero no bloquea Ventas ni apertura.

## Modelo de datos

Entidades principales:

- `SaldoEfectivoEntity`.
- `CajaSesionEntity`.
- `MovimientoCajaEntity`.
- `CajaIncidenciaEntity`.
- `ConfiguracionCajaEntity`.
- `CajaRelevoEntity` como base persistente para relevo formal.

Campos clave de `SaldoEfectivo`:

- `id_local_device`, `id_empresa`.
- `current_balance_snapshot`.
- `initialized`, `initialized_at`, `initialized_by_user_id`.
- Categoria, motivo e idempotencia de inicializacion.
- `last_movement_at`.
- `version`.

Campos clave de `CajaSesion`:

- `localDevice` / `id_local_device`.
- `caja` / `id_caja` legacy opcional.
- Usuario que abre/cierra.
- `opened_at`, `last_activity_at`, `closed_at`.
- `opening_amount` como snapshot heredado legacy.
- `expected_cash_amount`, `closing_expected_cash_amount`, `counted_cash_amount`, `difference_amount`.
- `expected_balance_viewed_before_count`, `expected_balance_viewed_at`, `expected_balance_viewed_by`.
- `status`.
- `opening_idempotency_key`, `closing_idempotency_key`.
- `active_installation_key`, `active_user_key`.
- `active_cash_register_key` legacy.
- `version`.
- Empresa y auditoria de `CommonEntity`.

Concurrencia:

- `@Version` protege actualizaciones optimistas.
- `active_installation_key` y `active_user_key` son claves unicas nulas al cerrar.
- Las operaciones de saldo bloquean la fila de `SaldoEfectivo` por empresa e instalacion.
- La idempotencia por empresa evita doble apertura, doble cierre y doble movimiento por reintento.
- Un conflicto de integridad se traduce a codigo operativo de caja.

## Movimientos de caja

`MovimientoCaja` es el libro historico del turno. Cuando el tipo afecta efectivo, tambien es la fuente de cambios del saldo continuo.

Tipos operativos:

- `INITIAL_BALANCE`
- `CASH_SALE`
- `CASH_REFUND`
- `MANUAL_ENTRY`
- `MANUAL_WITHDRAWAL`
- `CARD_ENTRY`
- `CARD_WITHDRAWAL`
- `CLOSING_RECONCILIATION`
- `HANDOFF_RECONCILIATION`
- `INCIDENT_ADJUSTMENT`

Compatibilidad legacy:

- `OPENING` permanece permitido solo para lectura/migracion historica.
- `INGRESO` se interpreta como entrada.
- `EGRESO` se interpreta como retiro.
- `id_caja` puede existir en movimientos historicos, pero el flujo nuevo usa `id_local_device` e `id_caja_sesion`.

Reglas actuales:

- La inicializacion de saldo crea `INITIAL_BALANCE`.
- La apertura limpia no crea movimiento.
- La apertura con diferencia real reportada crea `HANDOFF_RECONCILIATION` categoria `OPENING_OVERAGE` u `OPENING_SHORTAGE` y `CajaIncidencia` tipo `OTHER_CASH_DISCREPANCY` o `DEFERRED_HANDOFF_MISMATCH` segun el contexto.
- El reporte con diferencia exacta `0.00` se normaliza como apertura limpia para evitar ruido de auditoria financiera.
- Una venta en efectivo crea `CASH_SALE`.
- Ventas con tarjeta o transferencia no crean movimiento de efectivo.
- Entradas/retiros manuales en efectivo crean `MANUAL_ENTRY` o `MANUAL_WITHDRAWAL` y actualizan `SaldoEfectivo`.
- Entradas/retiros manuales por tarjeta crean `CARD_ENTRY` o `CARD_WITHDRAWAL`, se muestran en historial y resumen electronico, pero no actualizan `SaldoEfectivo`.
- Cierre con diferencia crea `CLOSING_RECONCILIATION` y una `CajaIncidencia`.
- Resolucion de incidencia puede crear `INCIDENT_ADJUSTMENT` cuando el efecto elegido implica entrada/salida de efectivo.
- `PUT` y `DELETE` de movimientos quedan bloqueados para mantener historico inmutable.
- El balance legacy por `idCaja` se conserva temporalmente.

## Endpoints

`GET /caja/estado-actual`

- Resuelve empresa desde JWT/contexto.
- Resuelve usuario desde header `user`.
- Resuelve instalacion desde `LocalDevice`.
- Devuelve `CajaEstadoActualDTO` con `station`, `currentSession`, `status`, `policy`, `incomingCount`, `balanceInitialized`, `currentBalance`, `pendingIncidentCount`, permisos operativos, `code`, `message`, `lastSyncAt`.
- Incluye `capabilities` calculadas por backend: resumen basico, ventas, esperado, revelado, control avanzado, cierre, movimientos, historial e incidencias.
- `currentBalance`, `currentSession.openingBalanceSnapshot`, `currentSession.expectedCashAmount` e `incomingCount.expectedAmount` solo se devuelven con `CASH_VIEW_EXPECTED_BALANCE` o compatibilidad `CAJA_VER_ARQUEO`.
- `pendingIncidentCount` solo se devuelve si el usuario puede revisar incidencias.
- Sin saldo devuelve `BALANCE_NOT_INITIALIZED`.
- Sin turno devuelve `NO_SESSION` / `CASH_SESSION_NOT_OPEN` con HTTP exitoso.
- Si no hay turno y el ultimo turno cerrado fue de otro usuario, la politica puede devolver `RECEIVING_COUNT_REQUIRED` con `incomingCount.previousCashier` y `incomingCount.expectedAmount` solo si el usuario puede ver esperado.
- Turno ajeno devuelve `OPEN_BY_OTHER_USER`.

`POST /caja/saldo/inicializar`

- Body: `amount`, `category`, `reason`, `idempotencyKey`.
- Crea `SaldoEfectivo` inicializado y movimiento `INITIAL_BALANCE`.
- No abre turno automaticamente.
- Rechaza inicializacion duplicada.

`GET /caja/saldo/resumen`

- Devuelve saldo continuo actual, estado de inicializacion, categoria/motivo y fecha de ultimo movimiento.
- `currentBalance` se devuelve solo con `CASH_VIEW_EXPECTED_BALANCE` o `CAJA_VER_ARQUEO`; si no, llega `null` con `currentBalanceVisible=false`.

`POST /caja/saldo/entradas`

- Body: `amount`, `category`, `reason`, `movementMedium`, `referenceType`, `referenceId`, `idempotencyKey`.
- Requiere turno `OPEN` del usuario actual.
- Requiere permiso `CASH_MOVEMENT_ENTRY` o compatibilidad `CAJA_ENTRADA_EFECTIVO`.
- Con `movementMedium=CASH` o vacio crea entrada de efectivo y actualiza saldo continuo.
- Con `movementMedium=CARD`/`ELECTRONIC` crea registro electronico y no actualiza saldo continuo.

`POST /caja/saldo/retiros`

- Body: `amount`, `category`, `reason`, `movementMedium`, `referenceType`, `referenceId`, `idempotencyKey`.
- Requiere turno `OPEN` del usuario actual.
- Requiere permiso `CASH_MOVEMENT_WITHDRAWAL` o compatibilidad `CAJA_RETIRO_EFECTIVO`.
- Con `movementMedium=CASH` o vacio crea retiro de efectivo y no permite saldo continuo negativo.
- Con `movementMedium=CARD`/`ELECTRONIC` crea registro electronico y no actualiza saldo continuo.

`POST /caja/sesiones/abrir`

- Body: `idempotencyKey`, opcionalmente `receivedAmount`, `receivingDiscrepancyReason` y `reportOpeningDifference`.
- No recibe `openingAmount`, `cashRegisterId` ni `cajaId`.
- Valida permiso local `CASH_OPEN` o compatibilidad `CAJA_ABRIR`.
- Requiere `SaldoEfectivo` inicializado.
- Rechaza doble apertura por instalacion o por usuario.
- Es idempotente para reintentos del mismo usuario e instalacion.
- En una transaccion crea sesion `OPEN` con snapshot heredado.
- Apertura limpia: sin `receivedAmount` y sin `reportOpeningDifference`, solo crea sesion con snapshot heredado.
- Apertura con reporte: si `reportOpeningDifference=true`, requiere conteo. Solo si la diferencia contra el saldo heredado es distinta de cero requiere motivo, crea incidencia y registra `HANDOFF_RECONCILIATION` con referencia `CASH_OPENING_DIFFERENCE`.
- Relevo con conteo entrante: compara `receivedAmount` contra el saldo continuo heredado. Si difiere, en politica continua abre, registra incidencia y conciliacion de apertura; en politica estricta bloquea para revision supervisada.

`GET /caja/sesiones/actual/resumen`

- Prepara el resumen para corte.
- Separa total vendido, efectivo, tarjeta y transferencia.
- Separa saldo heredado, entradas, retiros, devoluciones y efectivo esperado.
- Incluye `expectedCashVisible`, `salesSummaryVisible` y `capabilities`.
- Oculta saldo heredado, entradas, retiros, devoluciones y efectivo esperado si el usuario no tiene `CASH_VIEW_EXPECTED_BALANCE` o `CAJA_VER_ARQUEO`.
- Oculta total vendido/tarjeta/transferencia si el usuario no tiene `CASH_VIEW_SALES_SUMMARY`.
- Incluye `expectedCardAmount`, `cardEntriesAmount` y `cardWithdrawalsAmount` para mostrar lo cobrado/registrado en tarjeta sin exponer saldo bancario real.
- `CASH_REVEAL_EXPECTED_BALANCE` no revela importes por GET; debe usarse el endpoint auditado de revelado.

`GET /caja/sesiones/historial`

- Requiere permiso de historial/movimientos segun capacidades.
- Params: `desde`, `hasta`, `q`, `medium`, `sessionId`, `page`, `size`, `sort`, `direction`.
- `desde` y `hasta` aceptan fecha simple o fecha-hora; si un extremo esta vacio no hay limite por ese lado.
- Rechaza rango donde `desde` es mayor que `hasta`.
- Devuelve pagina de `CajaSesionHistorialDTO`, no todos los movimientos.
- Cada registro representa un corte/sesion con responsable, inicio, fin, ultimo movimiento, conteos de movimientos, totales de efectivo y totales electronicos.
- El detalle de movimientos de cada sesion se carga bajo demanda desde `GET /movimiento-caja`.

`POST /caja/sesiones/actual/revelar-efectivo-esperado`

- Requiere `CASH_REVEAL_EXPECTED_BALANCE`, `CASH_VIEW_EXPECTED_BALANCE` o compatibilidad `CAJA_VER_ARQUEO`.
- Marca en la sesion que el esperado se vio antes del conteo.
- Devuelve resumen con efectivo esperado visible.

`POST /caja/sesiones/actual/preparar-cierre`

- Body: `countedAmount`, opcionalmente `discrepancyReason`, `notes`, `idempotencyKey`.
- Requiere turno `OPEN`.
- Requiere `CASH_CLOSE_OWN` para turno propio o `CASH_CLOSE_OTHERS` para turno ajeno.
- Calcula efectivo esperado y diferencia despues de recibir el conteo.
- Devuelve preview de cierre con esperado, contado, diferencia, desglose y si el motivo es obligatorio.
- No cierra sesion, no ajusta saldo y no crea incidencia.

`POST /caja/sesiones/actual/cerrar`

- Body: `countedAmount`, `discrepancyReason`, `notes`, `idempotencyKey`.
- Requiere turno `OPEN`.
- Requiere `CASH_CLOSE_OWN` para turno propio o `CASH_CLOSE_OTHERS` para turno ajeno.
- Calcula diferencia contra `SaldoEfectivo.currentBalanceSnapshot`.
- Si hay diferencia, requiere motivo.
- En politica `STRICT_SUPERVISED`, si el usuario no puede resolver diferencias, pasa a `PENDING_RECONCILIATION`.
- En politica continua, ajusta saldo con `CLOSING_RECONCILIATION`, cierra sesion y crea incidencia.

`GET /caja/incidencias`

- Lista incidencias de caja por empresa.
- Requiere permiso de revision.

`POST /caja/incidencias/{id}/resolver`

- Body: `resolutionCategory`, `resolutionNotes`, `resolutionCashEffect`, `resolutionAmount`, `resolutionReference`, `idempotencyKey`.
- Marca incidencia como resuelta/descartada segun request.
- Requiere permiso de resolucion.
- `resolutionCashEffect=HISTORICAL_RECOUNT`: si faltaba efectivo crea entrada; si sobraba crea salida; documenta recuento corregido.
- `resolutionCashEffect=EXTERNAL_RECOVERY`: recuperacion externa de faltante; crea entrada.
- `resolutionCashEffect=EXTERNAL_RETURN`: devolucion externa de sobrante; crea salida.
- `resolutionCashEffect=REPORT_ONLY` o `NO_CASH_CHANGE`: resuelve sin tocar saldo vivo.
- `resolutionCashEffect=CASH_IN` o `CASH_OUT`: ajuste manual explicito.
- Cuando el efecto implica movimiento, se crea `INCIDENT_ADJUSTMENT` con referencia `CASH_INCIDENT`.

`GET /configuracion/caja`

- Devuelve politica de caja por empresa o default efectivo.

`PUT /configuracion/caja`

- Actualiza politica de caja.
- Requiere `CASH_MANAGE_POLICY` o `CONFIG_CAJA_EDITAR`.

`POST /ventas/crear`

- Usa `CajaOperacionGuard`.
- Requiere sesion `OPEN` de la instalacion actual y del usuario autenticado.
- Si el request trae `cajaId`, se trata como legacy y no decide la caja.
- La venta nueva se asocia a `CajaSesion`.
- Si el metodo es efectivo, crea `MovimientoCaja` tipo `CASH_SALE` y actualiza saldo continuo.
- Si `almacenId` viene nulo, el descuento de lotes consume FIFO/FEFO del inventario real disponible por producto en la empresa, actualizando cada almacen consumido. Esto permite que el POS venda carritos con productos de distintos almacenes sin pedir seleccion manual.

`GET /movimiento-caja`

- Soporta lectura legacy sin paginacion, pero la UI nueva debe usar paginacion.
- Params especiales: `page`, `size`, `sort`, `direction`, `desde`, `hasta`, `q`, `sessionId`, `movementMedium`.
- `movementMedium=CASH` excluye `CARD_ENTRY` y `CARD_WITHDRAWAL`.
- `movementMedium=CARD`/`ELECTRONIC` devuelve solo movimientos electronicos.
- `desde`/`hasta` aceptan fecha simple o fecha-hora.

## Permisos

Claves de caja relevantes:

- `CASH_OPEN`
- `CASH_CLOSE_OWN`
- `CASH_CLOSE_OTHERS`
- `CASH_MOVEMENT_ENTRY`
- `CASH_MOVEMENT_WITHDRAWAL`
- `CASH_VIEW_SUMMARY`
- `CASH_VIEW_HISTORY`
- `CASH_VIEW_SALES_SUMMARY`
- `CASH_VIEW_MOVEMENTS`
- `CASH_VIEW_EXPECTED_BALANCE`
- `CASH_REVEAL_EXPECTED_BALANCE`
- `CASH_REVIEW_INCIDENTS`
- `CASH_RESOLVE_DISCREPANCY`
- `CASH_MANAGE_POLICY`

Aplicado ahora:

- Apertura, cierre, entradas, retiros, revelado esperado, incidencias y politica validan permisos especificos o compatibilidad legacy.
- Ventas valida propietario, empresa, instalacion y estado para vender.
- DTOs de caja ocultan importes sensibles en backend; el frontend solo representa `capabilities` y banderas de visibilidad.

Pendiente general:

- Enforcement global por pantalla, accion, ruta y endpoint de todos los modulos.

## Frontend

Piezas agregadas/actualizadas:

- `CashSessionContext.jsx`: fuente de verdad de turno y saldo.
- `cashSessionService.js`: cliente de endpoints.
- `cashSessionUtils.js`: estados, dinero, idempotencia y keypad.
- `CashSalesGuard.jsx`: guardia de `/ventas`.
- `CashBalanceSetupScreen.jsx`: inicializacion de saldo continuo.
- `CashOpeningScreen.jsx`: dashboard de apertura; prioridad a abrir turno y opcion de reportar diferencia inicial.
- `CashOpeningScreen.jsx`: si backend devuelve `RECEIVING_COUNT_REQUIRED` o el usuario reporta diferencia, captura conteo y calcula diferencia cuando el esperado es visible; solo exige motivo cuando la diferencia visible es real.
- `CashNumericKeypad.jsx`.
- `CashStatusIndicator.jsx`.
- `CashControlDrawer.jsx`: resumen rapido contextual, responsable del turno, actividad segura, revelado auditado opcional y accesos autorizados.
- `CashClosingDialog.jsx`: modal reutilizable de corte con captura de conteo, preview backend y confirmacion de cierre.
- `CashControlPage.jsx`: pagina dedicada `/control-caja` para control avanzado: resumen de efectivo/tarjeta, movimientos manuales por medio, incidencias, historial por cortes paginado, filtros fecha-hora y acceso al mismo modal de cierre.
- `CashPendingReconciliationState.jsx`.
- `CashSession.css`.
- `AjustesCaja.jsx`: politica de caja y turnos en Configuracion; incluye selecciones/toggles de politica y participa en ayuda guiada de `Ajustes.jsx`.
- `Ventas.jsx`: crea venta real con `POST /ventas/crear`, refresca ventas del dia desde backend y sincroniza caja tras exito.
- `ConfirmarPagoModal` y pagos hijos: conservan `idMetodoPago`; efectivo, tarjeta y transferencia no disparan exito local.

Reglas:

- `/ventas` no renderiza catalogo/carrito mientras el turno esta cargando, pendiente, abierto por otro usuario, sin saldo inicial o en error.
- `BALANCE_NOT_INITIALIZED` muestra configuracion de saldo inicial.
- `NO_SESSION`, `CLOSED` y `CLOSED_BY_SUPERVISOR` muestran apertura sin monto y accion secundaria para reportar diferencia inicial.
- `RECEIVING_COUNT_REQUIRED` muestra apertura con conteo entrante.
- `PENDING_RECONCILIATION` bloquea POS con estado informativo.
- `OPEN_BY_OTHER_USER` bloquea POS con propietario visible.
- `OPEN` del usuario actual renderiza Ventas actual.
- El chip de caja abre resumen rapido. `Realizar corte` abre modal sobre Ventas, sin navegar ni perder carrito.
- El boton `Control de caja` del resumen rapido y la opcion superior `Caja` solo aparecen si backend devuelve `capabilities.canOpenCashControl`.
- `/control-caja` se conserva como pagina avanzada/admin y tambien condiciona acceso con capacidades de backend.
- El texto normal sin turno es "Inicia tu turno"; no se muestra error de caja fisica registrada.
- En `/control-caja`, los contadores superiores priorizan caja fisica, tarjeta esperada, ingresos/retiros efectivo, ingresos/retiros tarjeta y conflictos abiertos.
- El historial muestra numero de cortes/sesiones, no numero total de movimientos, para evitar cargar miles de registros desde el inicio.

## Migracion de datos

`CajaSesionSchemaMigrator` en perfil desktop:

- Agrega columnas de `id_local_device`, `active_installation_key` y snapshot/revelado/cierre.
- Agrega columnas financieras a `MovimientoCaja`: instalacion, categoria, direccion, idempotencia, balance before/after.
- Crea `SaldoEfectivo`, `ConfiguracionCaja`, `CajaIncidencia` y `CajaRelevo`.
- Intenta asociar sesiones legacy desde `LocalDevice.cash_register_id` cuando hay relacion clara.
- Usa la unica instalacion local si solo existe una y la asociacion no es ambigua.
- Conserva `id_caja`, `active_cash_register_key`, `cash_register_id` y tablas legacy.
- Relaja `id_caja` en `CajaSesion`, `MovimientoCaja` y `Ventas` para que no bloquee el flujo nuevo.
- Agrega `id_caja_sesion` a `Ventas`.
- Migra balance inicial por instalacion desde sesiones abiertas/pendientes cuando aplica y genera `INITIAL_BALANCE` idempotente.
- No duplica movimientos `OPENING`.
- Si no puede inferir una asociacion legacy, conserva los datos sin inventarla.

## Relevo y custodia

Implementado:

- Politica `ConfiguracionCaja.handoffPolicy`.
- Bloqueo de turno ajeno con `OPEN_BY_OTHER_USER`.
- Relevo diferido despues de cierre: si el siguiente usuario es distinto y la politica exige conteo entrante, el estado es `RECEIVING_COUNT_REQUIRED`.
- Conteo entrante contra saldo continuo.
- Diferencia entrante en politica continua crea incidencia `DEFERRED_HANDOFF_MISMATCH` y conciliacion `HANDOFF_RECONCILIATION` para que el saldo operativo vivo arranque desde el conteo aceptado.
- Conteo/cierre con custodia auditable por usuario, saldo esperado y diferencia.
- Incidencias de diferencia de cierre.
- Tablas base de `CajaRelevo` para formalizar handoff directo/diferido.

Parcial:

- El relevo formal directo de dos usuarios aun no tiene endpoint/UI completa.
- Operativamente, el cambio seguro actual es cerrar/cortar el turno y que el nuevo usuario abra uno nuevo con saldo heredado continuo.

## QA

Verificado en esta entrega:

- Backend: `./mvnw.cmd -Dtest=CajaSesionServiceImplTest test`.
- Frontend: `npm run build`.

No declarar QA visual, teclado o resoluciones si no se ejecuto runtime con navegador/app.

Pendientes funcionales fuera de este bloque:

- Handoff directo formal de dos usuarios.
- Ticket, impresion y reimpresion end-to-end.
- Ventas del turno con detalle comercial completo en pagina de caja/historial dedicado.
- Enforcement global final de permisos.
