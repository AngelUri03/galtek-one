# MODULES_STATUS

Fecha de referencia: 2026-07-20.

Estados usados:

- Terminado funcional: conectado y coherente en frontend/backend, aunque siempre puede requerir QA final.
- Parcial funcional: hay conexion real importante, pero faltan piezas, QA o cierre de flujo.
- En desarrollo: existe UI o backend relevante, pero el flujo principal no esta completo.
- Preparado: existe base tecnica o visual, pero no flujo completo para usuario final.
- Pendiente: planeado o insinuado, sin implementacion suficiente.
- No detectado: no se encontro evidencia clara en codigo.

Regla: si este documento contradice el codigo, priorizar codigo y marcar `pendiente de alinear`.

## Estado visual, teclado, normalizacion y flujo operativo

Valores sugeridos para revisiones futuras:

- Estado visual: Pulido, Aceptable, Requiere pulido, Placeholder, No evaluado.
- Estado de teclado: Completo, Parcial, Deficiente, No aplica, No evaluado.
- Normalizacion de componentes: Completa, Parcial, Deficiente, No aplica, No evaluado.
- Flujo operativo UX: Rapido, Aceptable, Requiere mejora, No aplica, No evaluado.

Nota: esta matriz no reemplaza el estado funcional del resumen ejecutivo. En esta actualizacion documental no se ejecuto QA visual renderizado ni recorrido real con teclado; por eso no se inventan calificaciones de pulido o completitud. Las pantallas mencionadas como referencia visual deben validarse en runtime antes de cambiar su estado.

| Modulo | Visual | Teclado | Componentes | Flujo UX | Nota |
| --- | --- | --- | --- | --- | --- |
| Configuracion | No evaluado | No evaluado | No evaluado | No evaluado | Referencia visual por codigo/historia; QA pendiente. |
| Tienda | No evaluado | No evaluado | No evaluado | No evaluado | Pantalla de referencia; QA pendiente. |
| Usuarios | No evaluado | No evaluado | No evaluado | No evaluado | Pantalla de referencia; QA pendiente. |
| Roles | No evaluado | No evaluado | No evaluado | No evaluado | Pantalla de referencia; QA pendiente. |
| Overrides/permisos por usuario | No evaluado | No evaluado | No evaluado | No evaluado | Pantalla de referencia; QA pendiente. |
| Ticket e impresion | No evaluado | No evaluado | No evaluado | No evaluado | Pantalla de referencia; depende de entorno/impresora. |
| Ventas | No evaluado | No evaluado | No evaluado | No evaluado | Protegida por guardia de turno; requiere QA visual y teclado en runtime. |
| Caja | No evaluado | No evaluado | No evaluado | No evaluado | Saldo continuo, apertura con reporte de diferencia, cierre, movimientos efectivo/tarjeta, historial paginado por cortes y politica conectados; QA runtime pendiente. |
| Inventario | No evaluado | No evaluado | No evaluado | No evaluado | Requiere QA integral con ventas/compras. |
| Compras | No evaluado | No evaluado | No evaluado | No evaluado | Alta de compra sigue parcial/mock segun lectura actual. |
| Proveedores | No evaluado | No evaluado | No evaluado | No evaluado | Referencia visual principal por madurez de codigo/historia; QA pendiente. |
| Clientes | No evaluado | No evaluado | No evaluado | No evaluado | Referencia visual principal por madurez de codigo/historia; QA pendiente. |
| Reportes | No evaluado | No evaluado | No evaluado | No evaluado | Requiere validar filtros, exports y estados. |
| Respaldos/exportaciones | No evaluado | No evaluado | No evaluado | No evaluado | UI presente, integracion real no detectada. |
| Auditoria | No evaluado | No evaluado | No evaluado | No evaluado | Preparado como base/placeholder segun modulo. |
| Metodos de pago | No evaluado | No evaluado | No evaluado | No evaluado | Catalogo usado en ventas; config dedicada pendiente. |
| Facturacion futura | No aplica | No aplica | No aplica | No aplica | Modulo fiscal no detectado. |
| Soporte | No evaluado | No evaluado | No evaluado | No evaluado | Componente visual/local; ruta/backend no detectados. |
| Promociones | No evaluado | No evaluado | No evaluado | No evaluado | UI local; sin backend ni impacto real en ventas detectado. |
| Integraciones | No evaluado | No evaluado | No evaluado | No evaluado | Placeholder. |
| Apariencia | No evaluado | No evaluado | No evaluado | No evaluado | Placeholder/configuracion futura. |
| Notificaciones | No evaluado | No evaluado | No evaluado | No evaluado | Placeholder. |
| Licenciamiento y activacion | No evaluado | No evaluado | No evaluado | No evaluado | Requiere QA de activacion y redireccion. |

## Resumen ejecutivo

| Modulo | Estado | Lectura rapida |
| --- | --- | --- |
| Configuracion | Parcial funcional | Varias secciones reales y otras placeholders. |
| Tienda | Parcial funcional | Conectada a empresa actual, falta QA/cierre total. |
| Usuarios | Parcial funcional | CRUD, password, avatar y estados; falta enforcement final de permisos. |
| Roles | Parcial funcional | Base conectada con permisos; falta enforcement final. |
| Overrides/permisos por usuario | Parcial funcional | Base tecnica existe; enforcement global pendiente. |
| Ticket e impresion | Parcial funcional | Configuracion e impresion detectadas; depende de entorno/dispositivo. |
| Ventas | Parcial funcional | Protegida por turno de caja; frontend ya persiste venta principal con `POST /ventas/crear` y refresca caja/ventas del dia. |
| Caja | Parcial funcional | Saldo continuo por instalacion, apertura con reporte de diferencia, resumenes efectivo/tarjeta, corte modal, control avanzado, movimientos manuales por medio, incidencias, resolucion con efecto de caja e historial paginado por cortes. |
| Inventario | Parcial funcional | Flujo amplio conectado; requiere QA integral con ventas/compras. |
| Compras | En desarrollo | Historial/sugerencias conectadas; nueva compra sigue parcial/mock. |
| Proveedores | Parcial funcional | Uno de los modulos mas avanzados; requiere QA final. |
| Clientes | Parcial funcional | Muy avanzado; requiere QA final y revisar fechas historicas. |
| Reportes | Parcial funcional | Datos reales parciales; exports/filtros no todos completos. |
| Respaldos/exportaciones | Pendiente | UI presente, integracion real no detectada. |
| Auditoria | Preparado | Auditoria por campos/modulo, sin modulo global central. |
| Metodos de pago | Preparado | Backend/catalogo usado en ventas, sin config dedicada completa. |
| Facturacion futura | Pendiente | Campos fiscales existen, modulo fiscal no detectado. |
| Soporte | Preparado | Componente visual/local; ruta/backend no detectados. |
| Promociones | En desarrollo | UI local; sin backend ni impacto real en ventas detectado. |
| Integraciones | Pendiente | Placeholder de configuracion. |
| Apariencia | Preparado | Placeholder; algunas preferencias visuales viven en tienda/ticket. |
| Notificaciones | Pendiente | Placeholder de configuracion. |

## Configuracion

Estado: Parcial funcional.

Frontend detectado:

- `Ajustes.jsx`
- `configuracionSections.js`
- `ConfTienda.jsx`
- `TicketConfig.jsx`
- `AjustesCaja.jsx`
- `AjustesUsuarios.jsx`
- Componentes de roles, permisos y overrides.

Backend detectado:

- `EmpresasController`
- `ConfiguracionTicketController`
- `ConfiguracionCajaController`
- `UsuariosController`
- `RolesController`
- `RolesPermisosController`
- `PermisosController`
- `UsuariosPermisosController`

Que funciona:

- El hub de ajustes existe.
- Tienda, ticket, caja y turnos, usuarios, roles y overrides tienen conexion real parcial.
- Se detectan estados `functional`, `coming`, `development` y acciones rapidas.
- El header de seccion puede refrescar secciones conectadas y abrir ayuda guiada cuando la seccion la define.
- `Caja y turnos` consume `GET/PUT /configuracion/caja` y muestra ayuda guiada para explicar politica, conteo, visibilidad y guardado.

Que esta parcial:

- Varias tarjetas siguen como `coming`.
- Exportaciones/respaldo esta desconectado.
- No todo lo mostrado en configuracion representa un flujo backend completo.

Que falta:

- Cerrar pagos, notificaciones, apariencia, auditoria, integraciones y respaldo.
- QA visual en resoluciones desktop objetivo.
- Alinear por completo `CFG-ARQ-001.md` contra codigo actual.

## Tienda

Estado: Parcial funcional.

Frontend detectado:

- `ConfTienda.jsx`.

Backend detectado:

- `EmpresasController`.
- Endpoints `/empresas/actual` GET/PUT.

Entidades/tablas detectadas:

- `EmpresasEntity`.
- Tabla `Empresas`.

Que funciona:

- La pantalla de tienda consume empresa actual.
- Permite guardar datos de empresa actual.
- Tiene `refresh` expuesto para recarga desde ajustes.

Que falta:

- QA de validaciones y datos fiscales.
- Alinear documentacion vieja que trataba tienda como no conectada.
- Revisar impacto futuro en tickets, reportes y facturacion.

## Usuarios

Estado: Parcial funcional.

Frontend detectado:

- `AjustesUsuarios.jsx`.
- Modales/paneles asociados a usuario.

Backend detectado:

- `UsuariosController`.
- Servicios y entidades de usuarios.

Endpoints relevantes:

- `GET /usuarios`
- `POST /usuarios`
- `PUT /usuarios/{id}`
- `PUT /usuarios/{id}/password`
- `PUT /usuarios/me/password`
- `POST /usuarios/{id}/imagen`
- `PUT /usuarios/{id}/activar`
- `PUT /usuarios/{id}/desactivar`
- `DELETE /usuarios/{id}`

Que funciona:

- Listado, alta, edicion, activacion/desactivacion, password y avatar tienen endpoints detectados.
- Password usa cifrado RSA en frontend y soporte backend.

Que esta parcial:

- Falta enforcement completo de permisos por decision estrategica.
- Falta QA con roles limitados y overrides.

## Roles

Estado: Parcial funcional.

Backend detectado:

- `RolesController`
- `RolesPermisosController`
- `PermisosController`

Entidades/tablas detectadas:

- `RolesEntity`
- `RolesPermisosEntity`
- `PermisosEntity`

Que funciona:

- Existen roles y permisos catalogados.
- Existen endpoints para relacionar roles con permisos.

Que esta parcial:

- El control efectivo por pantalla/accion/backend queda pendiente para fase final.

Que falta:

- Matriz final de permisos por modulo critico.
- Pruebas con usuarios no admin.

## Overrides/permisos por usuario

Estado: Parcial funcional.

Backend detectado:

- `UsuariosController`
- `UsuariosPermisosController`

Endpoints relevantes:

- `GET /usuarios/overrides`
- `GET /usuarios/{id}/permisos-efectivos`
- `GET /usuarios/{id}/overrides`
- `PUT /usuarios/{id}/overrides`
- `DELETE /usuarios/{id}/overrides/{idPermiso}`

Que funciona:

- La base para permisos efectivos y overrides por usuario existe.

Decision vigente:

- No aplicar bloqueo real total todavia.
- No eliminar permisos ni rehacer roles.
- Dejar referencias listas para fase final.

## Ticket e impresion

Estado: Parcial funcional.

Frontend detectado:

- `TicketConfig.jsx`.
- Componentes de preview/configuracion rapida.
- `ticketService`.

Backend detectado:

- `TicketController`.
- `ConfiguracionTicketController`.

Endpoints relevantes:

- `GET /ticket/impresoras`
- `POST /ticket/imprimir`
- `GET /configuracion/ticket`
- `PUT /configuracion/ticket`
- `POST /configuracion/ticket/restaurar-base`

Que funciona:

- Configuracion de ticket esta conectada.
- Impresoras e impresion tienen backend detectado.

Que esta parcial:

- Requiere validacion con impresoras reales y entorno desktop.
- El exito depende de drivers/sistema operativo.

## Ventas

Estado: Parcial funcional.

Frontend detectado:

- `Ventas.jsx`.
- Componentes de carrito, pago e impresion.

Backend detectado:

- `VentasController`.
- `VentaDetalleController`.
- `VentasServiceImpl`.

Endpoints relevantes:

- `GET /ventas`
- `POST /ventas/crear`
- Endpoints de productos, categorias, clientes y metodos de pago.

Que funciona:

- La pantalla carga productos, categorias y metodos de pago desde backend.
- La confirmacion de pago llama `POST /ventas/crear`; el exito local solo ocurre tras respuesta real.
- Despues de vender refresca ventas del dia desde `GET /ventas` y sincroniza `CashSessionContext`.
- Backend tiene flujo para generar venta, validar producto/lote, crear detalle y descontar stock.
- Si el POS no envia `almacenId`, backend descuenta lotes por producto desde el almacen real disponible.
- La ruta `/ventas` consulta caja antes de renderizar catalogo/carrito.
- Backend protege `POST /ventas/crear` con `CajaOperacionGuard` por instalacion y usuario.

Que esta parcial:

- Impresion de ticket existe como pieza aparte.
- El historial visual de ventas del dia usa datos backend; los detalles completos dependen del ticket recien generado o de endpoints futuros de detalle.
- El indicador de caja abre resumen rapido; el corte se puede hacer en modal contextual sin salir de Ventas. `/control-caja` queda como pagina avanzada/admin.

Que falta:

- Ticket, impresion y reimpresion end-to-end con venta real.
- Cliente seleccionado en venta cuando se incorpore al flujo comercial.
- Pruebas de descuento de inventario por lotes.

## Caja

Estado: Parcial funcional.

Documento base:

- `VTA-ARQ-001.md`.

Backend detectado:

- `CajasController`.
- `MovimientoCajaController`.
- `CajaSesionController`.
- `CajaSesionServiceImpl`.
- `CajaSesionStateMachine`.
- `CajaOperacionGuard`.
- `CajaSaldoController`.
- `CajaIncidenciaController`.
- `ConfiguracionCajaController`.

Endpoints relevantes:

- CRUD de cajas legacy.
- `GET /caja/estado-actual`.
- `GET /caja/saldo/resumen`.
- `POST /caja/saldo/inicializar`.
- `POST /caja/saldo/entradas`.
- `POST /caja/saldo/retiros`.
- `POST /caja/sesiones/abrir`.
- `GET /caja/sesiones/historial`.
- `GET /caja/sesiones/actual/resumen`.
- `POST /caja/sesiones/actual/revelar-efectivo-esperado`.
- `POST /caja/sesiones/actual/preparar-cierre`.
- `POST /caja/sesiones/actual/cerrar`.
- `GET /caja/incidencias`.
- `POST /caja/incidencias/{id}/resolver`.
- `GET /configuracion/caja`.
- `PUT /configuracion/caja`.
- `GET /movimiento-caja`.
- `GET /movimiento-caja/balance/{idCaja}` legacy.
- `POST /movimiento-caja`.

Que funciona:

- La sesion de caja se resuelve desde la instalacion activa y el usuario autenticado.
- Consulta de estado de turno para la instalacion actual.
- Inicializacion unica de saldo continuo con `INITIAL_BALANCE`.
- Apertura limpia sin captura de monto y sin movimiento `OPENING`; `opening_amount` queda como snapshot legacy.
- Apertura con reporte de diferencia: captura conteo/motivo solo cuando hay diferencia real, crea incidencia y registra `HANDOFF_RECONCILIATION` cuando el conteo no coincide con el saldo heredado.
- Apertura con conteo exacto `0.00` de diferencia queda como apertura limpia, sin motivo obligatorio, incidencia, conciliacion ni ajuste de saldo.
- Conteo entrante diferido cuando el ultimo turno cerrado de la estacion pertenece a otro usuario y la politica lo exige; la diferencia continua queda auditada y conciliada.
- Cierre/corte contra saldo continuo, con ajuste `CLOSING_RECONCILIATION` e incidencia cuando hay diferencia.
- Entradas y retiros manuales de efectivo actualizan saldo continuo.
- Entradas y retiros manuales de tarjeta se registran como `CARD_ENTRY`/`CARD_WITHDRAWAL` y no modifican saldo de efectivo.
- Resolucion de incidencias permite recuento historico, recuperacion externa, devolucion externa, reporte sin cambio, entrada o salida manual.
- Configuracion de politica de caja en Ajustes, con ayuda guiada para explicar secciones y opciones.
- El drawer de Ventas muestra resumen rapido contextual, responsable del turno, actividad segura, revelado auditado opcional y acciones autorizadas.
- `Realizar corte` abre modal sin navegar desde Ventas y reutiliza preview/cierre backend.
- Pagina `/control-caja` queda como control avanzado/admin para resumen, revelado, movimientos manuales, incidencias y acceso al mismo corte.
- Historial de caja consulta cortes/sesiones paginados con rango fecha-hora, busqueda, filtro por medio y detalle de movimientos bajo demanda.
- Resumen superior de `/control-caja` distingue caja fisica, tarjeta esperada, ingresos/retiros de efectivo, ingresos/retiros tarjeta y conflictos.
- Backend devuelve `capabilities` y oculta importes sensibles en DTOs si faltan permisos; el frontend solo representa esas banderas.
- Restriccion de una sesion activa o pendiente por instalacion y por usuario.
- Turno ajeno se comunica como `OPEN_BY_OTHER_USER`.
- Movimientos de caja quedan historicos e inmutables para update/delete.
- Ventas queda bloqueada si no existe sesion `OPEN` del usuario actual.

Que esta parcial:

- Relevo directo formal de dos usuarios sigue pendiente.
- Detalle comercial profundo de ventas dentro del historial de caja sigue pendiente.
- `CajasEntity`, `cashRegisterId` e `idCaja` permanecen como compatibilidad legacy y no son fuente de verdad del flujo nuevo.
- QA visual/teclado y runtime no deben marcarse como validados sin ejecucion real.

## Inventario

Estado: Parcial funcional.

Frontend detectado:

- `Inventario.jsx`.
- Componentes de productos, lotes, filtros, alertas y ajustes.

Backend detectado:

- `InventarioController`.
- `ProductosController`.
- `LotesController`.
- `AlmacenController`.
- `UnidadesController`.
- `EstadoStockController`.
- `ProductoEstadoStockController`.
- `EntradasSalidasController`.

Que funciona:

- Carga catalogos y datos de inventario.
- Maneja productos, lotes, estados, almacenes, unidades y umbrales.
- Tiene relacion directa con stock usado por ventas.

Que esta parcial:

- Requiere QA integral con ventas, compras y reportes.
- Confirmar performance y paginacion real en inventarios grandes.

## Compras

Estado: En desarrollo.

Frontend detectado:

- `NuevaCompra.jsx`.
- `HistorialCompras.jsx`.
- `PanelSugerencias.jsx`.

Backend detectado:

- `ComprasController`.
- `CompraDetalleController`.

Que funciona:

- Historial de compras consume backend.
- Detalles de compra consumen backend.
- Sugerencias usan inventario real.

Que esta parcial:

- Nueva compra detectada usa datos mock/locales en partes clave.
- Guardado de compra no esta completamente conectado al backend en el flujo revisado.

Que falta:

- Persistir compra y detalle desde UI.
- Actualizar inventario/lotes segun compra.
- Validar proveedor, pagos, impuestos y permisos.

## Proveedores

Estado: Parcial funcional.

Documento base:

- `PRV-ARQ-001.md`.

Frontend detectado:

- Pantallas y secciones avanzadas de proveedores.
- Contactos, productos, activos, documentos, auditoria/historial.

Backend detectado:

- `ProveedoresController`.
- Entidades/servicios/repositorios para proveedor, contacto, producto, activos, documentos, historial y acuerdos.

Que funciona:

- CRUD y estado de proveedores.
- Eliminacion segura.
- Subrecursos avanzados.
- Documentacion tecnica amplia.

Que esta parcial:

- Requiere QA final antes de llamarlo terminado productivo.
- Algunas estructuras legacy deben mantenerse con cuidado y no promoverse sin revisar frontend actual.

## Clientes

Estado: Parcial funcional.

Documento base:

- `CLI-ARQ-001.md`.

Frontend detectado:

- Listado, filtros, tabla, resumen, editor, detalle y componentes avanzados.

Backend detectado:

- `ClientesController`.
- Servicios, DTOs y entidades de clientes.

Que funciona:

- CRUD y detalle.
- Estados y acciones de cliente.
- Eliminacion segura.
- Campos comerciales/fiscales.

Que esta parcial:

- Requiere QA final.
- Logs historicos mostraron problemas de parsing de fechas; revisar que converters actuales cubran todos los casos.

## Reportes

Estado: Parcial funcional.

Frontend detectado:

- `ReporteVentas`.
- `ReporteCompras`.
- `ReporteBalance`.

Backend detectado:

- `ReporteFinancieroController`.
- Servicios de ventas/compras/detalle.

Que funciona:

- Reporte de balance consume ganancias desde backend.
- Reporte de ventas consume ventas.
- Reporte de compras consume compras y detalle.

Que esta parcial:

- Algunos filtros usan catalogos hardcoded.
- Descargas/exportaciones detectadas muestran toast o comportamiento temporal.

Que falta:

- Export real.
- Filtros 100% backend/catalogo.
- QA con rangos de fechas y datos grandes.

## Respaldos/exportaciones

Estado: Pendiente.

Frontend detectado:

- `ExportarDatos.jsx`.

Que funciona:

- Existe UI de seleccion/opciones.

Que falta:

- Backend o servicio real de respaldo/exportacion.
- Handler real de ejecucion.
- Seguridad, permisos y rutas de archivos.

## Auditoria

Estado: Preparado.

Que existe:

- Campos de auditoria en `CommonEntity`.
- Auditoria/historial visible en modulos como proveedores/clientes.
- Placeholder de configuracion para auditoria.

Que falta:

- Modulo global de auditoria.
- Tabla/eventos centralizados si se decide implementarlo.
- Permisos y reportes de auditoria.

## Metodos de pago

Estado: Preparado.

Backend detectado:

- `MetodoPagoController`.
- `MetodoPagoEntity`.

Que funciona:

- Catalogo usado por ventas.

Que falta:

- Configuracion dedicada completa en ajustes.
- Reglas por metodo, terminales, comisiones o integraciones.

## Facturacion futura

Estado: Pendiente.

Que existe:

- Campos fiscales en clientes y empresa.
- Estructura de ventas/reportes que podria alimentar facturacion futura.

No detectado:

- Modulo fiscal/CFDI completo.
- Endpoints de timbrado.
- Integracion PAC.

## Soporte

Estado: Preparado.

Frontend detectado:

- `Soporte.jsx`.

Que existe:

- Componente visual/local con tickets o elementos de soporte.

Que falta:

- Ruta principal detectada en `AppRouter`.
- Backend de soporte.
- Persistencia real.

## Promociones

Estado: En desarrollo.

Frontend detectado:

- `Promociones.jsx`.

Que existe:

- UI local para promociones.

Que falta:

- Backend.
- Aplicacion real de promociones en ventas.
- Reglas de vigencia, productos, clientes y descuentos.

## Integraciones

Estado: Pendiente.

Que existe:

- Placeholder en configuracion.

Que falta:

- Definicion de integraciones objetivo.
- Backend, credenciales, permisos y monitoreo.

## Apariencia

Estado: Preparado.

Que existe:

- Placeholder en configuracion.
- Algunas decisiones visuales viven en tienda/ticket y estilos generales.

Que falta:

- Modulo real de preferencias de apariencia.
- Persistencia por empresa/usuario si se decide implementar.

## Notificaciones

Estado: Pendiente.

Que existe:

- Placeholder en configuracion.

Que falta:

- Modelo de notificaciones.
- Backend.
- UI real.
- Reglas de inventario, ventas, compras o soporte.

## Licenciamiento y activacion

Estado: Parcial funcional.

Frontend detectado:

- `DeviceContext`.
- `ActivationPage`.
- `RequireActivation`.

Backend detectado:

- `LocalDeviceController`.
- `HardwareLockFilter`.
- `DeviceLockState`.

Endpoints relevantes:

- `/device/identity`
- `/device/activate`
- `/device/register`

Que funciona:

- Hay identidad de dispositivo y activacion local.
- Hay bloqueo por hardware.
- `LocalDevice` representa la computadora/estacion; no registra un cajon metalico ni crea `CajasEntity` para Ventas.

Que esta parcial:

- Revisar exposicion exacta de `/device/register` contra reglas de seguridad actuales.
- QA completo de activacion, bloqueo y redireccion en desktop.
