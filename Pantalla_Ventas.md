# Pantalla Ventas
Documento generado desde la hoja Excel **Pantalla Ventas**. Se preserva la estructura funcional, dependencias, responsables, criterios de aceptación y planeación.

# Fase 1. Definir la base de caja

> Estas tareas bloquean todo lo relacionado con apertura, ventas, pagos y cierre.

## 1. VTA-ARQ-001 — Documentar reglas definitivas de caja

| Campo | Valor |
|---|---|
| Capa | Arquitectura |
| Responsable | Angel |
| Tamaño | S |
| Dependencias | Ninguna |

### Descripción

Crear una especificación breve que establezca:
- Existe una sola caja física por instalación.
- Solo puede haber una sesión de caja activa.
- No se puede vender sin una caja abierta.
- La sesión pertenece al usuario que la abrió.
- Otro usuario no puede continuar esa misma caja.
- El mismo usuario o uno superior puede cerrarla.
- A los 30 minutos de inactividad queda pendiente de conciliación.
- El cierre requiere contar efectivo.
- Después del cierre se crea una nueva sesión.
- Las entradas y retiros deben quedar auditados.
- Tarjeta y transferencia no aumentan el efectivo físico.

### Criterios de aceptación

- [x] Todas las reglas están escritas sin contradicciones.
- [x] El equipo las revisó.
- [x] Se definieron los estados de caja.
- [x] Se definieron los permisos necesarios.
- [x] No quedan decisiones ambiguas antes de crear la base de datos.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-17 00:00:00

## 2. VTA-BE-001 — Identificar de forma persistente la caja física

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | S |
| Dependencias | VTA-ARQ-001 |

### Descripción

Cada instalación de GaltekOne generará un identificador único y persistente para representar la caja física.
No debe utilizarse un identificador de hardware frágil. La aplicación generará un UUID durante la primera ejecución y lo conservará en sus datos locales.

Campos mínimos:
- cashRegisterId
- installationId
- name
- status
- createdAt

### Criterios de aceptación

- [ ] La instalación genera un identificador una sola vez.
- [ ] El identificador sobrevive a reinicios.
- [ ] No cambia cuando se cierra sesión.
- [ ] El backend reconoce la caja.
- [ ] Dos instalaciones diferentes no generan la misma identidad.
- [ ] Existe una estrategia documentada para reinstalaciones.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 3. VTA-BE-002 — Crear entidad y migración de sesión de caja

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | VTA-BE-001 |

### Descripción

Crear la tabla que represente cada periodo de responsabilidad de un cajero.

Campos mínimos:
- id
- cashRegisterId
- openedByUserId
- closedByUserId
- openedAt
- lastActivityAt
- closedAt
- openingAmount
- expectedCashAmount
- countedCashAmount
- differenceAmount
- status
- closingReason
- closingNotes
- version

El campo version permitirá controlar actualizaciones concurrentes.

### Criterios de aceptación

- [ ] La migración funciona en una base limpia.
- [ ] La entidad utiliza valores monetarios seguros, no float ni double.
- [ ] Los estados están restringidos.
- [ ] Se impide tener dos sesiones abiertas para la misma caja.
- [ ] Los campos de apertura y cierre tienen auditoría.
- [ ] La migración puede revertirse en desarrollo.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 4. VTA-BE-003 — Crear entidad de movimientos de caja

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | VTA-BE-002 |

### Descripción

Registrar cualquier operación que cambie o explique el efectivo físico.

Tipos iniciales:
- OPENING
- CASH_SALE
- CASH_REFUND
- MANUAL_ENTRY
- MANUAL_WITHDRAWAL
- CLOSING_ADJUSTMENT

Campos mínimos:

- id
- cashSessionId
- type
- amount
- reason
- referenceType
- referenceId
- createdByUserId
- createdAt

### Criterios de aceptación

- [ ] Cada movimiento está ligado a una sesión.
- [ ] No acepta montos negativos.
- [ ] El tipo determina si suma o resta.
- [ ] Las ventas pueden referenciar su movimiento.
- [ ] Los movimientos manuales requieren motivo.
- [ ] No se pueden modificar ni eliminar después de creados.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 5. VTA-BE-004 — Definir permisos de caja

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | S |
| Dependencias | VTA-ARQ-001 |

### Descripción

Agregar permisos independientes:

- CASH_OPEN
- CASH_CLOSE_OWN
- CASH_CLOSE_OTHERS
- CASH_MOVEMENT_ENTRY
- CASH_MOVEMENT_WITHDRAWAL
- CASH_VIEW_SUMMARY
- CASH_VIEW_HISTORY

### Criterios de aceptación

- [ ] Los permisos existen en backend.
- [ ] No dependen únicamente de ocultar botones.
- [ ] Un cajero solo puede cerrar su propia caja.
- [ ] Un superior puede cerrar la de otro usuario.
- [ ] Se documenta qué roles reciben cada permiso.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 6. VTA-BE-005 — Implementar máquina de estados de caja

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | VTA-BE-002 |

### Descripción

Centralizar las transiciones válidas:

Sin sesión → OPEN
OPEN → PENDING_RECONCILIATION
OPEN → CLOSED
PENDING_RECONCILIATION → CLOSED
PENDING_RECONCILIATION → CLOSED_BY_SUPERVISOR
CLOSED → no se modifica

No deben cambiarse estados directamente desde controladores.

### Criterios de aceptación

- [ ] Las transiciones inválidas son rechazadas.
- [ ] Una sesión cerrada es inmutable.
- [ ] Todas las transiciones registran usuario y fecha.
- [ ] Existen pruebas unitarias para cada transición.
- [ ] Dos solicitudes simultáneas no pueden cerrar dos veces la misma caja.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

# Fase 2. Consulta y apertura de caja

## 7. VTA-BE-006 — Consultar el estado actual de la caja

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | S |
| Dependencias | VTA-BE-005 |

### Descripción

Crear un endpoint que informe qué debe mostrar la aplicación al entrar.

Debe responder:
- cashRegister
- currentSession
- status
- openedBy
- openedAt
- openingAmount
- lastActivityAt
- canCurrentUserClose
- canCurrentUserResume

### Criterios de aceptación

- [ ] Distingue entre sin caja, abierta, pendiente y cerrada.
- [ ] Respeta la instalación desde la que se consulta.
- [ ] No expone datos sensibles.
- [ ] Funciona después de reiniciar frontend y backend.
- [ ] Tiene pruebas para todos los estados.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 8. VTA-BE-007 — Abrir una sesión de caja

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | VTA-BE-006 |

### Descripción

Crear la operación de apertura.

Solicitud mínima:
- cashRegisterId
- openingAmount
- idempotencyKey

Validaciones:
- El usuario tiene permiso.
- El monto es válido.
- No existe otra sesión activa o pendiente.
- La caja pertenece a la instalación.
-La solicitud no fue procesada antes.

### Criterios de aceptación

- [ ] Crea la sesión en estado OPEN.
- [ ] Crea el movimiento OPENING.
- [ ] Rechaza una segunda apertura.
- [ ] El doble clic no crea dos sesiones.
- [ ] El fondo inicial aparece en el resumen.
- [ ] Existe auditoría.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 9. VTA-BE-008 — Proteger las operaciones de venta sin caja abierta

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | S |
| Dependencias | VTA-BE-007 |

### Descripción

Toda operación que registre una venta debe verificar:

- Existe una sesión OPEN.
- Pertenece a la caja física actual.
- Pertenece al usuario autenticado.
- No está vencida ni pendiente de conciliación.

### Criterios de aceptación

- [ ] No se puede vender sin caja.
- [ ] No se puede vender con caja pendiente.
- [ ] No se puede utilizar la caja de otro usuario.
- [ ] El mensaje de rechazo permite al frontend saber qué pantalla mostrar.
- [ ] La validación es centralizada y reutilizable.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 10. VTA-FE-001 — Crear estado global de caja

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | VTA-BE-006 |

### Descripción

Crear un estado global que conserve:

- cashRegister
- cashSession
- cashStatus
- loading
- error
- permissions

Debe sobrevivir a cambios internos de pantalla y volver a consultar al iniciar la aplicación.

### Criterios de aceptación

- [ ] Cambiar de Ventas a Inventario no reinicia la caja.
- [ ] Recargar la aplicación recupera el estado real.
- [ ] El frontend no inventa el estado de la caja.
- [ ] El estado se actualiza después de abrir, cerrar o expirar.
- [ ] No existen múltiples fuentes de verdad.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 11. VTA-FE-002 — Crear guardia de acceso a Ventas

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | S |
| Dependencias | VTA-FE-001 |

### Descripción

Al entrar a Ventas:

Cargando → consultar caja
Sin sesión → mostrar apertura
OPEN → mostrar punto de venta
PENDING_RECONCILIATION → mostrar conciliación
CLOSED → mostrar apertura

### Criterios de aceptación

- [ ] El catálogo no aparece antes de conocer el estado.
- [ ] Nunca se muestra la pantalla incorrecta por unos segundos.
- [ ] Los errores de red tienen una pantalla propia.
- [ ] Existe acción para reintentar.
- [ ] No se puede saltar la guardia escribiendo una ruta.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 12. VTA-FE-003 — Diseñar pantalla de apertura de caja

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | VTA-BE-007 |

### Descripción

Pantalla dedicada, no modal improvisado.

Debe mostrar:

- Nombre de la caja.
- Usuario responsable.
- Fecha y hora.
- Campo de fondo inicial.
- Teclado numérico.
- Cantidades rápidas.
- Resumen del significado de abrir caja.
- Botón principal Abrir caja.

### Criterios de aceptación

- [ ] Puede operarse completamente con teclado.
- [ ] El monto se muestra como moneda.
- [ ] No acepta valores inválidos.
- [ ] El botón se bloquea mientras procesa.
- [ ] El doble clic no duplica la apertura.
- [ ] Después de abrir entra directamente a Ventas.
- [ ] Funciona en todas las resoluciones objetivo.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 13. VTA-FE-004 — Mostrar estado de caja en la interfaz

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | S |
| Dependencias | VTA-FE-001 |

### Descripción

Mostrar una referencia compacta y permanente:

Caja abierta
Ángel Morales
Desde 09:14 a. m.

Debe permitir acceder al resumen y al cierre según permisos.

### Criterios de aceptación

- [ ] El cajero siempre sabe qué caja utiliza.
- [ ] Muestra al responsable.
- [ ] No ocupa espacio excesivo.
- [ ] Cambia inmediatamente después de abrir o cerrar.
- [ ] Tiene estado visual diferente cuando requiere conciliación.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

# Fase 3. Inactividad, cierre de aplicación y recuperación

## 14. VTA-BE-009 — Registrar actividad de la sesión de caja

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | S |
| Dependencias | VTA-BE-005 |

### Descripción

Descripción

Actualizar lastActivityAt cuando ocurra una acción válida:

- Agregar un producto.
- Consultar catálogo activamente.
- Crear un movimiento.
- Registrar una venta.
- Ejecutar una señal periódica del cliente.

No debe actualizarse por procesos automáticos irrelevantes.

### Criterios de aceptación

- [ ] La última actividad refleja uso real.
- [ ] No genera demasiadas escrituras.
- [ ] La fecha se registra con la zona horaria correcta.
- [ ] Tiene protección contra solicitudes de otra instalación.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 15. VTA-BE-010 — Expirar caja por 30 minutos de inactividad

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | VTA-BE-009 |

### Descripción

Cuando una caja OPEN supera 30 minutos sin actividad:

OPEN → PENDING_RECONCILIATION

La detección puede realizarse mediante tarea programada y también al recibir una nueva solicitud.

### Criterios de aceptación

- [ ] La caja cambia de estado al superar 30 minutos.
- [ ] No se cierra financieramente.
- [ ] No permite nuevas ventas.
- [ ] Se registra el motivo INACTIVITY_TIMEOUT.
- [ ] Funciona aunque el frontend esté cerrado.
- [ ] El tiempo se podrá mover después a Configuración.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 16. VTA-BE-011 — Marcar interrupción voluntaria de la aplicación

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | S |
| Dependencias | VTA-BE-005 |

### Descripción

Crear una operación para informar que el usuario:

- Cerró sesión.
- Cerró GaltekOne.
- Cambió de usuario.
- Abandonó voluntariamente la caja sin realizar el cierre.

Debe pasarla a pendiente de conciliación.

### Criterios de aceptación

- [ ] Registra el motivo exacto.
- [ ] No se ejecuta si la caja ya está cerrada.
- [ ] Bloquea nuevas ventas.
- [ ] Guarda fecha y usuario.
- [ ] Es idempotente.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 17. VTA-FE-005 — Implementar señal de actividad

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | S |
| Dependencias | VTA-BE-009 |

### Descripción

Enviar una señal controlada mientras el usuario utiliza el POS.

Debe detenerse cuando:

- Se cierra sesión.
- La caja deja de estar abierta.
- La aplicación pierde autenticación.
- La aplicación se cierra.

### Criterios de aceptación

- [ ] No satura el backend.
- [ ] Se reanuda después de recuperar conexión.
- [ ] No mantiene viva una caja sin interacción real indefinidamente.
- [ ] El estado cambia cuando el backend reporta expiración.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 18. VTA-FE-006 — Proteger cierre de sesión y cierre de aplicación

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | VTA-BE-011 |

### Descripción

Si existe una caja abierta y el usuario intenta salir:

Tienes una caja abierta.

[Cerrar caja ahora]
[Salir y dejar pendiente de conciliación]
[Cancelar]

La opción de cerrar debe ser la recomendada.

### Criterios de aceptación

- [ ] Funciona al cerrar sesión.
- [ ] Funciona al cerrar la ventana.
- [ ] Funciona con atajo del sistema.
- [ ] No promete interceptar apagones o cierres forzados.
- [ ] Informa al backend cuando el cierre es voluntario.
- [ ] El texto explica las consecuencias.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 19. VTA-BE-012 — Consultar información para conciliación

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | VTA-BE-003 |

### Descripción

Devolver el resumen necesario para cerrar una caja pendiente:

- Fondo inicial.
- Ventas en efectivo.
- Entradas.
- Retiros.
- Devoluciones.
- Efectivo esperado.
- Tarjeta.
- Transferencia.
- Usuario responsable.
- Motivo de interrupción.

### Criterios de aceptación

- [ ] Los cálculos salen de movimientos persistidos.
- [ ] Tarjeta y transferencia aparecen separadas.
- [ ] No se confunden ingresos digitales con efectivo.
- [ ] Solo usuarios autorizados pueden consultarlo.
- [ ] Las cifras coinciden con las ventas registradas.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 20. VTA-FE-007 — Diseñar pantalla de conciliación pendiente

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | VTA-BE-012 |

### Descripción

Cuando exista una caja pendiente, bloquear el POS y mostrar:

- Responsable.
- Hora de apertura.
- Última actividad.
- Motivo.
- Efectivo esperado.
- Acción para contar y cerrar.
- Aviso cuando el usuario actual necesita un superior.

### Criterios de aceptación

- [ ] No permite entrar al catálogo.
- [ ] Explica claramente por qué está bloqueada.
- [ ] El usuario correcto puede continuar al cierre.
- [ ] Un usuario sin permiso ve instrucciones claras.
- [ ] No existe forma visual de ignorar la conciliación.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

# Fase 4. Entradas y retiros de efectivo

## 21. VTA-BE-013 — Registrar entrada manual de efectivo

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | S |
| Dependencias | VTA-BE-003 |

### Descripción

Permitir registrar dinero que entra a caja fuera de una venta.

Campos:

- amount
- reason
- notes
- idempotencyKey

### Criterios de aceptación

- [ ] Requiere permiso.
- [ ] Requiere motivo.
- [ ] Aumenta el efectivo esperado.
- [ ] No modifica ventas.
- [ ] Registra responsable y fecha.
- [ ] No duplica el movimiento al reenviar.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 22. VTA-BE-014 — Registrar retiro manual de efectivo

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | S |
| Dependencias | VTA-BE-003 |

### Descripción

Registrar retiros para gastos, resguardo de efectivo u otros conceptos.

Lista cuando
- Requiere permiso y motivo.
- Reduce el efectivo esperado.
- Puede impedir retirar más efectivo del esperado según la regla configurada.
- Registra usuario y fecha.
- No puede modificarse posteriormente.

### Criterios de aceptación

- [ ] Requiere permiso.
- [ ] Requiere motivo.
- [ ] Aumenta el efectivo esperado.
- [ ] No modifica ventas.
- [ ] Registra responsable y fecha.
- [ ] No duplica el movimiento al reenviar.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 23. VTA-BE-015 — Consultar historial de movimientos de la sesión

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | S |
| Dependencias | VTA-BE-013 |

### Descripción

Mostrar cronológicamente:

- Apertura.
- Ventas en efectivo.
- Entradas.
- Retiros.
- Devoluciones.
- Ajustes.

### Criterios de aceptación

- [ ] Tiene paginación.
- [ ] Distingue movimientos automáticos y manuales.
- [ ] Incluye usuario, hora, motivo y referencia.
- [ ] Respeta permisos.
- [ ] El saldo calculado coincide con el esperado.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 24. VTA-FE-008 — Crear modal de entrada o retiro

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | VTA-BE-013 |

### Descripción

Un componente reutilizable para ambas operaciones.

Debe incluir:

- Tipo de movimiento.
- Monto.
- Motivo.
- Nota.
- Resumen de cómo afectará la caja.
- Confirmación explícita.

### Criterios de aceptación

- [ ] El retiro se distingue visualmente de la entrada.
- [ ] Tiene teclado numérico.
- [ ] No utiliza colores ambiguos.
- [ ] Bloquea doble envío.
- [ ] Actualiza el resumen al terminar.
- [ ] Muestra el nuevo efectivo esperado.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 25. VTA-FE-009 — Crear historial visual de caja

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | VTA-BE-015 |

### Descripción

Mostrar los movimientos de la sesión actual dentro de un panel lateral o pantalla de resumen.

### Criterios de aceptación

- [ ] Se puede filtrar por tipo.
- [ ] Distingue entradas y salidas.
- [ ] Muestra referencias de ventas.
- [ ] Tiene estado vacío.
- [ ] Tiene carga y error.
- [ ] No confunde el historial con “Ventas de hoy”.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

# Fase 5. Catálogo de la pantalla de Ventas

## 26. VTA-BE-016 — Corregir filtrado por categoría

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | N/A |

### Descripción

Revisar por qué algunas categorías no devuelven productos.

Validar:

- categoryId.
- Productos activos.
- Relación producto-categoría.
- Paginación.
- Sucursal o negocio.
- Consultas que llegan fuera de orden.

### Criterios de aceptación

- [ ] Todas las categorías regresan sus productos correctos.
- [ ] Una categoría vacía responde correctamente.
- [ ] Volver a Todos recupera el catálogo.
- [ ] Existen pruebas con varias categorías.
- [ ] No aparecen productos de otra categoría.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 27. VTA-BE-017 — Crear búsqueda unificada de productos

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | VTA-BE-016 |

### Descripción

Buscar por:

- Nombre.
- SKU.
- Código interno.
- Código de barras.

Prioridad:

1. Coincidencia exacta de código de barras.
2. Coincidencia exacta de SKU.
3. Coincidencia parcial de nombre.

### Criterios de aceptación

- [ ] Ignora diferencias de mayúsculas.
- [ ] Elimina espacios sobrantes.
- [ ] Funciona combinado con categoría.
- [ ] Tiene paginación.
- [ ] Mantiene un tiempo de respuesta aceptable.
- [ ] No devuelve productos inactivos.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 28. VTA-BE-018 — Exponer imágenes optimizadas de productos

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | N/A |

### Descripción

Agregar al producto:

- imageUrl
- thumbnailUrl

Definir:

- Formatos permitidos.
- Peso máximo.
- Imagen de respaldo.
- Miniatura para el catálogo.
- Imagen completa para detalle

### Criterios de aceptación

- [ ] Un producto puede tener imagen.
- [ ] Un producto sin imagen no rompe la interfaz.
- [ ] Las URLs siguen funcionando después de reiniciar el backend.
- [ ] Las miniaturas pesan menos que la imagen original.
- [ ] No se guardan archivos efímeros dentro de Elastic Beanstalk.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 29. VTA-FE-010 — Corregir navegación por categorías

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | VTA-BE-016 |

### Descripción

Corregir:

- Cambio de categoría.
- Reinicio de paginación.
- Solicitudes anteriores que sobrescriben resultados nuevos.
- Scroll horizontal.
- Estado activo.
- Estado vacío.

### Criterios de aceptación

- [ ] Cambiar rápidamente entre categorías no mezcla resultados.
- [ ] Siempre se muestra cuál está seleccionada.
- [ ] El scroll de categorías es usable.
- [ ] Existe botón para regresar a Todos.
- [ ] La interfaz muestra skeleton mientras carga.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 30. VTA-FE-011 — Buscar por nombre, SKU y código de barras

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | VTA-BE-017 |

### Descripción

Cambiar el placeholder a:

Buscar por nombre, SKU o código de barras...

Agregar integración con lector.

### Criterios de aceptación

- [ ] El buscador conserva el foco.
- [ ] Un código exacto puede agregar el producto directamente.
- [ ] Enter no agrega dos veces.
- [ ] Escape limpia la búsqueda.
- [ ] La búsqueda funciona con la categoría activa.
- [ ] Los resultados indican por qué campo coincidieron cuando sea útil.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 31. VTA-FE-012 — Mostrar imágenes en las tarjetas

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | S |
| Dependencias | VTA-BE-018 |

### Descripción

Agregar imagen, skeleton y placeholder a cada producto.

### Criterios de aceptación

- [ ] Las tarjetas no cambian de tamaño mientras carga.
- [ ] La imagen conserva proporción.
- [ ] Una URL rota muestra respaldo.
- [ ] La cuadrícula sigue siendo fluida.
- [ ] La carga diferida funciona.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 32. VTA-FE-013 — Rediseñar detalle de producto

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | VTA-BE-018 |

### Descripción

Mostrar:

- Imagen.
- Nombre.
- SKU.
- Código de barras.
- Categoría.
- Precio.
- Unidad.
- Existencia.
- Descripción.
- Cantidad seleccionada.
- Subtotal.

Eliminar la f residual.

### Criterios de aceptación

- [ ] No aparece texto residual.
- [ ] El botón usa el radio oficial.
- [ ] El contenido tiene una jerarquía clara.
- [ ] Enter agrega el producto.
- [ ] Escape cierra.
- [ ] La existencia limita la cantidad cuando corresponde.
- [ ] El modal usa los mismos componentes que el resto del sistema.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 33. VTA-FE-014 — Crear componente único de cantidad

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | N/A |

### Descripción

Crear un solo componente para:

Tarjetas.
Detalle.
Carrito.
Checkout.

Estados:

- Normal.
- Hover.
- focus-visible.
- Deshabilitado.
- Límite mínimo.
- Límite máximo.
- Cargando.

### Criterios de aceptación

- [ ] El+ y − se ven iguales en todas partes.
- [ ] Desaparece el borde azul nativo.
- [ ] El foco con teclado continúa siendo visible.
- [ ] Soporta unidades enteras y decimales.
- [ ] Evita clics repetidos mientras actualiza.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

# Fase 6. Carrito y cliente

## 34. VTA-FE-015 — Persistir el carrito globalmente

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | N/A |

### Descripción

El carrito debe conservarse:

- Al cambiar de pantalla.
- Al abrir Ventas de hoy.
- Al cerrar un modal.
- Ante una recarga controlada.
- Ante un error temporal.

### Criterios de aceptación

- [ ] Cambiar a Inventario no lo vacía.
- [ ] Regresar a Ventas lo recupera.
- [ ] Solo se limpia después de una venta confirmada o una cancelación explícita.
- [ ] Se advierte antes de cerrar con productos.
- [ ] No conserva datos de otro usuario sin autorización.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 35. VTA-BE-019 — Calcular el carrito en backend

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | VTA-BE-017 |

### Descripción

Crear una operación de cotización que reciba productos y cantidades y devuelva:

- Precio vigente.
- Subtotal.
- Impuestos.
- Descuentos.
- Total.
- Disponibilidad.
- Advertencias.

### Criterios de aceptación

- [ ] El frontend no decide el total final.
- [ ] Detecta productos inactivos.
- [ ] Detecta precios modificados.
- [ ] Detecta stock insuficiente.
- [ ] Utiliza reglas monetarias uniformes.
- [ ] La misma entrada siempre produce el mismo cálculo mientras no cambien los datos.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 36. VTA-FE-016 — Integrar carrito con cotización autoritativa

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | VTA-BE-019 |

### Descripción

Actualizar totales utilizando la respuesta del backend.

### Criterios de aceptación

- [ ] Muestra estados de actualización.
- [ ] No parpadean los totales.
- [ ] Informa cuando cambió un precio.
- [ ] Informa cuando ya no existe suficiente stock.
- [ ] Evita confirmar mientras los totales están desactualizados.
- [ ] Mantiene una experiencia rápida.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 37. VTA-BE-020 — Buscar clientes para venta

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | S |
| Dependencias | N/A |

### Descripción

Buscar por:

- Nombre.
- Teléfono.
- Correo.
- Código de cliente.

### Criterios de aceptación

- [ ] Responde rápidamente.
- [ ] Tiene límite de resultados.
- [ ] No devuelve clientes inactivos.
- [ ] Respeta el negocio actual.
- [ ] Maneja búsquedas parciales.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 38. VTA-BE-021 — Registrar cliente rápido

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | VTA-BE-020 |

### Descripción

Permitir alta mínima durante una venta:

name
phone opcional
email opcional

### Criterios de aceptación

- [ ] No exige información administrativa innecesaria.
- [ ] Detecta posibles duplicados.
- [ ] Devuelve inmediatamente el cliente creado.
- [ ] Registra quién lo creó.
- [ ] Aplica las mismas validaciones del módulo de Clientes.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 39. VTA-FE-017 — Crear paso previo de selección de cliente

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | VTA-BE-020 |

### Descripción

Primer paso del checkout:

Cliente → Método de pago → Confirmación

Debe permitir:

Buscar.
Seleccionar.
Registrar rápido.
Continuar sin cliente.
Cambiar selección.

### Criterios de aceptación

- [ ] No se pierde el carrito.
- [ ] El buscador recibe foco automáticamente.
- [ ] Puede operarse con teclado.
- [ ] Continuar sin cliente es claro.
- [ ] El cliente seleccionado aparece durante todo el checkout.
- [ ] La nueva alta queda seleccionada automáticamente.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

# Fase 7. Configuración y selección de pago

## 40. VTA-BE-022 — Crear contrato de configuración de pagos

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | N/A |

### Descripción

Aunque la pantalla administrativa se construirá después, Ventas necesita consultar:

- cashEnabled
- cardEnabled
- transferEnabled
- cardTerminals
- cardFeeType
- cardFeeValue
- cardFeePaidByCustomer
- transferAccount
- transferReferenceRequired

### Criterios de aceptación

- [ ] Ventas recibe únicamente configuraciones del negocio actual.
- [ ] Existen valores predeterminados seguros.
- [ ] Puede deshabilitar tarjeta o transferencia.
- [ ] La configuración no está escrita directamente en frontend.
- [ ] Queda registrada como pendiente la futura pantalla administrativa.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 41. VTA-FE-018 — Rediseñar selector de método de pago

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | VTA-BE-022 |

### Descripción

Mostrar únicamente:

Efectivo.
Tarjeta.
Transferencia.

Cada opción será una tarjeta con:

- Icono.
- Nombre.
- Descripción.
- Atajo.
- Estado habilitado.

### Criterios de aceptación

- [ ] No aparecen vales ni crédito.
- [ ] Los métodos deshabilitados no se pueden seleccionar.
- [ ] El diseño utiliza degradados y estilo de GaltekOne.
- [ ] No aparecen bordes azules nativos.
- [ ] Teclas 1, 2 y 3 seleccionan el método.
- [ ] Escape regresa al paso de cliente.
- [ ] Opciones vienen de base de datos

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

# Fase 8. Registro transaccional de la venta

## 42. VTA-BE-023 — Definir contrato de creación de venta

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | VTA-BE-019 |

### Descripción

Solicitud mínima:

- cashSessionId
- customerId opcional
- items
- payment
- idempotencyKey

No debe recibir como confiables los totales calculados por frontend.

### Criterios de aceptación

- [ ] El contrato distingue cada método.
- [ ] Tiene validaciones claras.
- [ ] Soporta cliente nulo.
- [ ] Rechaza productos o cantidades inválidas.
- [ ] Incluye clave de idempotencia.
- [ ] Está documentado.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 43. VTA-BE-024 — Crear persistencia transaccional de venta

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | VTA-BE-023 |

### Descripción

En una sola transacción:

1. Validar caja.
2. Validar usuario.
3. Recalcular productos.
4. Validar existencia.
5. Crear venta.
6. Crear detalle.
7. Crear pago.
8. Crear movimientos de inventario.
9. Crear movimiento de caja cuando aplique.
10. Registrar auditoría."

### Criterios de aceptación

- [ ] Un fallo revierte todo.
- [ ] No existen ventas sin detalles.
- [ ] No se descuenta inventario sin venta.
- [ ] No se registra pago sin venta.
- [ ] La caja debe estar OPEN.
- [ ] Tiene pruebas de rollback.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 44. VTA-BE-025 — Implementar idempotencia de ventas

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | VTA-BE-024 |

### Descripción

Evitar ventas duplicadas por:

- Doble clic.
- Enter repetido.
- Timeout.
- Reintento del frontend.
- Pérdida momentánea de conexión.

### Criterios de aceptación

- [ ] La misma clave devuelve la misma venta.
- [ ] No vuelve a descontar inventario.
- [ ] No crea otro movimiento de caja.
- [ ] Funciona con solicitudes simultáneas.
- [ ] Existe prueba de concurrencia.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 45. VTA-BE-026 — Guardar fotografía histórica de productos

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | VTA-BE-024 |

### Descripción

El detalle de la venta conservará:

- Nombre.
- SKU.
- Unidad.
- Precio.
- Impuesto.
- Descuento.

Aunque el producto se modifique después.

### Criterios de aceptación

- [ ] Una venta antigua no cambia al editar el producto.
- [ ] El ticket conserva los datos originales.
- [ ] Los reportes históricos son consistentes.
- [ ] Las cantidades y montos usan precisión correcta.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 46. VTA-BE-027 — Registrar pago en efectivo

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | S |
| Dependencias | VTA-BE-024 |

### Descripción

Guardar:

- amountDue
- amountReceived
- changeGiven

Crear el movimiento correspondiente en caja.

### Criterios de aceptación

- [ ] Rechaza un recibido insuficiente.
- [ ] Calcula cambio en backend.
- [ ] Solo suma el total de la venta al efectivo esperado.
- [ ] No suma el dinero recibido completo.
- [ ] El movimiento referencia la venta.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 47. VTA-BE-028 — Registrar pago con terminal externa

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | VTA-BE-022 |

### Descripción

Guardar:

terminalId
baseAmount
customerFee
terminalChargeAmount
estimatedTerminalFee
estimatedNetDeposit
reference

### Criterios de aceptación

- [ ] Calcula la comisión según configuración.
- [ ] Distingue quién absorbe la comisión.
- [ ] No aumenta el efectivo físico.
- [ ] Registra el depósito esperado.
- [ ] Conserva la configuración utilizada en esa venta.
- [ ] No recalcula ventas históricas si cambia la comisión.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 48. VTA-BE-029 — Registrar pago por transferencia

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | S |
| Dependencias | VTA-BE-022 |

### Descripción

Guardar:

amount
reference
accountId
confirmedBy
confirmedAt

### Criterios de aceptación

- [ ] Respeta si la referencia es obligatoria.
- [ ] No aumenta el efectivo físico.
- [ ] Conserva la cuenta utilizada.
- [ ] Registra quién confirmó el pago.
- [ ] La transferencia aparece separada en reportes.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

# Fase 9. Interfaces de cobro

## 49. VTA-FE-019 — Diseñar pago en efectivo

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | VTA-BE-027 |

### Descripción

Título:

Pago en efectivo

Mostrar:

- Lista o resumen de productos.
- Cliente.
- Total.
- Campo recibido.
- Cantidades rápidas calculadas.
- Teclado numérico.
- Cambio.
- Botón Confirmar pago en efectivo.

### Criterios de aceptación

- [ ] El cambio tiene alta jerarquía visual.
- [ ] Las cantidades rápidas dependen del total.
- [ ] Enter confirma solo si todo es válido.
- [ ] El tick decorativo desaparece.
- [ ] El botón se bloquea durante el guardado.
- [ ] Un error no borra el carrito.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 50. VTA-FE-020 — Diseñar pago con tarjeta

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | VTA-BE-028 |

### Descripción

Mostrar claramente:

Subtotal original
Cargo configurado
Total que debe cobrarse en la terminal
Terminal seleccionada
Referencia opcional u obligatoria

Texto operativo:

Cobra este importe en la terminal externa y confirma cuando la operación haya sido aprobada.

### Criterios de aceptación

- [ ] El cajero sabe exactamente cuánto capturar en la terminal.
- [ ] Se explica que GaltekOne no ejecuta el cobro.
- [ ] Puede seleccionar terminal cuando exista más de una.
- [ ] El cargo está desglosado.
- [ ] El botón dice Confirmar cobro con tarjeta.
- [ ] No afecta el efectivo físico.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 51. VTA-FE-021 — Diseñar pago por transferencia

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | VTA-BE-029 |

### Descripción

Mostrar:

Total.
Resumen de productos.
Cliente.
Banco.
Beneficiario.
Cuenta o últimos dígitos.
Referencia.
Aviso de confirmación manual.

### Criterios de aceptación

- [ ] Solo aparece cuando está habilitada.
- [ ] La referencia respeta la configuración.
- [ ] El botón dice Confirmar transferencia recibida.
- [ ] Se advierte al cajero que debe verificar el depósito.
- [ ] No afecta el efectivo físico.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 52. VTA-FE-022 — Crear estado de confirmación y recuperación

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | VTA-BE-025 |

### Descripción

Estados:

Preparando venta
Registrando venta
Verificando resultado
Venta confirmada
No fue posible determinar el resultado

Ante timeout, consultar por la clave de idempotencia antes de reintentar.

### Criterios de aceptación

- [ ] Nunca limpia el carrito antes de tener confirmación.
- [ ] No muestra un error genérico si la venta pudo haberse registrado.
- [ ] Puede recuperar una venta después de un timeout.
- [ ] No permite otro clic mientras verifica.
- [ ] Los mensajes son comprensibles para un cajero.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

# Fase 10. Ventas del turno

## 53. VTA-BE-030 — Crear resumen del turno actual

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | VTA-BE-024 |

### Descripción

Devolver:

Número de ventas.
Total vendido.
Efectivo.
Tarjeta.
Transferencia.
Comisiones.
Depósito neto esperado.
Cancelaciones.
Ticket promedio.

### Criterios de aceptación

- [ ] Se basa en la sesión de caja, no en estado frontend.
- [ ] Sobrevive a cambios de pantalla.
- [ ] Se actualiza después de cada venta.
- [ ] Usa la zona horaria del negocio.
- [ ] No incluye ventas de otra sesión.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 54. VTA-BE-031 — Listar ventas del turno

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | S |
| Dependencias | VTA-BE-030 |

### Descripción

Cada elemento debe mostrar:

Folio.
Hora.
Cliente.
Productos resumidos.
Método.
Total.
Estado.

### Criterios de aceptación

- [ ] Tiene paginación.
- [ ] Ordena de la más reciente a la más antigua.
- [ ] Respeta permisos.
- [ ] Permite consultar el detalle.
- [ ] Identifica ventas canceladas.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 55. VTA-FE-023 — Rediseñar panel Ventas del turno

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | S |
| Dependencias | VTA-BE-030 |

### Descripción

Cambiar “Ventas hoy” por:

Ventas del turno

Mostrar:

Resumen.
Desglose por método.
Lista.
Ver detalle.
Reimprimir.

### Criterios de aceptación

- [ ] No vuelve a cero al navegar.
- [ ] Se actualiza después de una venta.
- [ ] No bloquea innecesariamente la pantalla.
- [ ] Escape lo cierra.
- [ ] El botón cerrar usa focus-visible de GaltekOne.
- [ ] El carrito se conserva.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

# Fase 11. Cierre de caja

## 56. VTA-BE-032 — Calcular vista previa de cierre

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | VTA-BE-030 |

### Descripción

Calcular:

Fondo inicial
+ ventas en efectivo
+ entradas
- retiros
- devoluciones
= efectivo esperado

Mostrar aparte:

Tarjeta bruta.
Comisiones.
Depósito neto.
Transferencias.
Total general vendido.

### Criterios de aceptación

- [ ] Todos los valores pueden rastrearse a movimientos.
- [ ] La fórmula está probada.
- [ ] No mezcla dinero digital con efectivo.
- [ ] Incluye caja abierta y pendiente.
- [ ] No permite cerrar una sesión ya cerrada.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 57. VTA-BE-033 — Cerrar caja propia

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | VTA-BE-032 |

### Descripción

Recibir:

- countedCashAmount
- closingNotes
- idempotencyKey

Calcular la diferencia y cerrar.

### Criterios de aceptación

- [ ] Solo el responsable puede cerrar su caja.
- [ ] Requiere permiso.
- [ ] Guarda contado, esperado y diferencia.
- [ ] Solicita observación cuando la diferencia supere la tolerancia.
- [ ] Cierra también una caja pendiente.
- [ ] No puede ejecutarse dos veces.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 58. VTA-BE-034 — Cerrar caja como superior

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | S |
| Dependencias | VTA-BE-033 |

### Descripción

Permitir que un usuario superior cierre la sesión de otro.

Debe guardar:

Responsable original.
Usuario que cerró.
Motivo.
Notas.
Estado CLOSED_BY_SUPERVISOR.

### Criterios de aceptación

- [ ] Requiere permiso especial.
- [ ] El motivo es obligatorio.
- [ ] El cierre queda claramente auditado.
- [ ] No sustituye al responsable original.
- [ ] Aparece diferente en historial y reportes.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 59. VTA-FE-024 — Diseñar flujo de cierre de caja

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | VTA-BE-032 |

### Descripción

Flujo:

Resumen → Conteo → Diferencia → Confirmación → Caja cerrada

Mostrar:

Efectivo esperado.
Campo de efectivo contado.
Diferencia.
Desglose.
Notas.
Aviso cuando cierra un superior.

### Criterios de aceptación

- [ ] Puede operarse con teclado.
- [ ] La diferencia se actualiza al escribir.
- [ ] No oculta los ingresos digitales.
- [ ] Pide confirmación final.
- [ ] Después del cierre bloquea Ventas.
- [ ] Ofrece Abrir nueva caja.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 60. VTA-FE-025 — Abrir una nueva sesión después del cierre

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | S |
| Dependencias | VTA-FE-024 |

### Descripción

Después de cerrar:

Caja cerrada correctamente

[Abrir nueva caja]
[Salir]

El botón regresa al flujo de apertura y crea otra sesión.

### Criterios de aceptación

- [ ] No modifica la sesión anterior.
- [ ] Puede abrirla el mismo usuario u otro después de autenticarse.
- [ ] Los datos anteriores no se arrastran.
- [ ] El fondo inicial debe capturarse nuevamente.
- [ ] El historial conserva ambas sesiones.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

# Fase 12. Resultado, ticket e impresión

## 61. VTA-BE-035 — Crear modelo de datos para ticket

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | M |
| Dependencias | VTA-BE-034 |

### Descripción

Devolver:

Datos del negocio.
Folio.
Fecha.
Caja.
Cajero.
Cliente.
Productos.
Totales.
Método.
Cambio o referencia.
Mensaje configurable.

### Criterios de aceptación

- [ ] Usa la fotografía histórica.
- [ ] Funciona para los tres métodos.
- [ ] No depende de datos actuales del producto.
- [ ] Está preparado para 58 y 80 mm.
- [ ] El mensaje para el cliente es configurable.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 62. VTA-FE-026 — Crear pantalla Venta completada

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | VTA-BE-035 |

### Descripción

Pantalla dirigida al cajero:

Venta completada
Folio
Total
Método
Cliente
Cambio o referencia

Acciones:

Nueva venta.
Imprimir ticket.
Ver detalle.
Reimprimir

### Criterios de aceptación

- [ ] Ya no utiliza “Gracias por su compra” como mensaje al cajero.
- [ ] La acción principal es Nueva venta.
- [ ] El cambio es muy visible en efectivo.
- [ ] La tarjeta muestra terminal y referencia.
- [ ] La transferencia muestra cuenta y referencia.
- [ ] El carrito se limpia solamente al llegar aquí.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 63. VTA-DESK-001 — Integrar impresión de ticket

| Campo | Valor |
|---|---|
| Capa | Aplicación de escritorio |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | VTA-BE-035 |

### Descripción

Implementar:

Impresora configurada.
Papel de 58 u 80 mm.
Número de copias.
Corte cuando esté disponible.
Reintento.
Error controlado.

### Criterios de aceptación

- [ ] Una falla de impresión no revierte la venta.
- [ ] El cajero puede reintentar.
- [ ] El sistema informa qué impresora utilizó.
- [ ] No abre diálogos innecesarios del sistema.
- [ ] Funciona en Windows.
- [ ] Queda preparado el comportamiento para Linux.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 64. VTA-BE-036 — Auditar reimpresiones

| Campo | Valor |
|---|---|
| Capa | Backend |
| Responsable | Paco |
| Tamaño | S |
| Dependencias | VTA-BE-035 |

### Descripción

Registrar:

saleId
printedBy
printedAt
reason opcional
copyNumber

### Criterios de aceptación

- [ ] La primera impresión y reimpresiones se distinguen.
- [ ] Respeta permisos.
- [ ] No modifica la venta.
- [ ] Puede consultarse en auditoría.
- [ ] La reimpresión conserva el contenido histórico.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

# Fase 13. Perfección visual y agilidad

## 65. VTA-UX-001 — Crear tokens visuales oficiales

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | N/A |

### Descripción

Centralizar:

border-radius
spacing
shadows
focus-ring
transitions
colors
disabled states
overlay
modal widths

### Criterios de aceptación

- [ ] Ningún modal define radios arbitrarios.
- [ ] Todos los botones utilizan variantes.
- [ ] Los colores tienen propósito semántico.
- [ ] Los estados deshabilitados conservan legibilidad.
- [ ] Existe una página para visualizar los componentes.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 66. VTA-UX-002 — Eliminar focos azules nativos correctamente

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | S |
| Dependencias | VTA-UX-001 |

### Descripción

Reemplazar los bordes azules de:

Taches.
+ y −.
Confirmar pago.
Selector de método.
Inputs.
Botones de icono.

No se debe utilizar outline: none sin sustitución.

### Criterios de aceptación

- [ ] Con mouse no aparece el borde azul.
- [ ] Con teclado aparece el foco oficial de GaltekOne.
- [ ] El foco tiene contraste suficiente.
- [ ] Ningún elemento pierde accesibilidad.
- [ ] Se revisaron todos los modales de Ventas.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 67. VTA-UX-003 — Implementar atajos de teclado

| Campo | Valor |
|---|---|
| Capa | Frontend |
| Responsable | Toño |
| Tamaño | M |
| Dependencias | N/A |

### Descripción

Propuesta inicial:

F2       Buscar producto
F4       Seleccionar cliente
F8       Cobrar
1        Efectivo
2        Tarjeta
3        Transferencia
Enter    Acción principal
Escape   Volver o cerrar
Delete   Eliminar producto seleccionado

### Criterios de aceptación

- [ ] Los atajos se muestran discretamente.
- [ ] No interfieren con campos de texto.
- [ ] Funcionan en todos los pasos.
- [ ] Escape no borra información sin confirmación.
- [ ] Existe ayuda visible.
- [ ] Se prueban con teclado completo y compacto.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 68. VTA-UX-004 — Validar resoluciones de escritorio

| Campo | Valor |
|---|---|
| Capa | QA |
| Responsable | Enrique |
| Tamaño | M |
| Dependencias | TODO |

### Descripción

Probar:

1366×768.
1440×900.
1600×900.
1920×1080.
2560×1440.

### Criterios de aceptación

- [ ] El carrito nunca queda fuera de pantalla.
- [ ] Los modales caben sin cortar acciones.
- [ ] Las categorías siguen siendo navegables.
- [ ] La cuadrícula adapta sus columnas.
- [ ] No hay textos cortados.
- [ ] No aparece scroll horizontal general.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 69. VTA-QA-001 — Pruebas integrales de caja

| Campo | Valor |
|---|---|
| Capa | QA |
| Responsable | Enrique |
| Tamaño | M |
| Dependencias | TODO |

### Descripción

Escenarios mínimos
- Abrir con fondo.
- Intentar abrir dos veces.
- Cambiar de usuario.
- Cerrar sesión con caja abierta.
- Expirar por 30 minutos.
- Cerrar por el mismo usuario.
- Cerrar por superior.
- Entrada de efectivo.
- Retiro.
- Diferencia positiva.
- Diferencia negativa.
- Nueva apertura después del cierre.

### Criterios de aceptación

- [ ] Todos los escenarios tienen evidencia.
- [ ] No existen diferencias de cálculo.
- [ ] Se verificó la auditoría.
- [ ] No puede venderse en estados bloqueados.
- [ ] Los bugs encontrados se convierten en Issues separados.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00

## 70. VTA-QA-002 — Pruebas integrales de venta

| Campo | Valor |
|---|---|
| Capa | QA |
| Responsable | Enrique |
| Tamaño | M |
| Dependencias | TODO |

### Descripción

Escenarios mínimos
- Nombre.
- SKU.
- Código de barras.
- Categorías.
- Producto sin imagen.
- Producto sin stock.
- Cliente existente.
- Cliente nuevo.
- Sin cliente.
- Efectivo exacto.
- Efectivo con cambio.
- Tarjeta con comisión.
- Transferencia.
- Doble clic.
- Timeout.
- Error de impresión.
- Navegación entre pantallas.
- Reinicio de aplicación.
- Ventas del turno.
- Carrito persistente.

### Criterios de aceptación

- [ ] El flujo completo puede operarse sin mouse.
- [ ] Ninguna venta se duplica.
- [ ] El inventario se descuenta una sola vez.
- [ ] Los totales coinciden.
- [ ] El resumen del turno coincide con las ventas.
- [ ] Los errores son comprensibles.

### Planeación

- Inicio: 2026-06-10 00:00:00
- Fin: 2026-06-10 00:00:00
