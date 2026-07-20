# CLI-ARQ-001 - MODULO CLIENTES

### 1. PROPOSITO DEL DOCUMENTO
- **Documento:** CLI-ARQ-001.
- **Modulo:** Clientes.
- **Producto:** GaltekOne POS de escritorio para tiendas pequenas y medianas.
- **Audiencia:** Producto, Backend, Frontend, QA, Soporte, analisis funcional y futuros desarrolladores.
- **Estado funcional:** Fuente oficial de verdad para reglas de negocio, alcance, limites, persistencia, auditoria y logica de componentes del modulo.

Este documento define la logica funcional vigente del modulo Clientes de GaltekOne. Debe usarse como referencia obligatoria antes de modificar frontend, backend, base de datos, pruebas, seed data, permisos, reportes, ventas o documentacion relacionada con clientes.

Clientes no es un CRM completo. Es un directorio ligero de compradores frecuentes que permite reconocer a quien compra, guardar datos utiles de contacto, direccion, facturacion opcional, ultimas compras y auditoria basica, sin convertir la venta normal en un flujo pesado.

### 2. PRINCIPIO RECTOR
El modulo Clientes administra compradores identificables sin estorbar la venta.

No debe ser obligatorio para vender.
No reemplaza Ventas.
No reemplaza Facturacion.
No administra cuentas por cobrar.
No debe convertirse en CRM avanzado.
No debe borrar historia comercial relevante.

La regla mas importante es esta: registrar un cliente debe ayudar al negocio a atender mejor a un comprador frecuente, no agregar friccion a la operacion diaria de caja.

### 3. DEFINICIONES FUNCIONALES
- **Cliente:** Persona o negocio que compra de forma identificable en la tienda.
- **Comprador frecuente:** Cliente que conviene reconocer por nombre, alias, telefono, direccion, notas o datos fiscales.
- **Venta normal:** Venta que puede registrarse sin cliente asociado. Debe seguir siendo rapida.
- **Datos fiscales:** RFC, razon social, codigo postal fiscal, correo fiscal, regimen fiscal y uso CFDI capturados para facturacion o referencia fiscal.
- **Ultimas compras:** Resumen reciente de ventas asociadas al cliente, con importe, metodo de pago, estado y detalle de productos.
- **Auditoria:** Evidencia funcional de creacion, edicion, cambio de estado y ventas recientes vinculadas al cliente.
- **Eliminacion segura:** Validacion previa para impedir borrar fisicamente un cliente con ventas, datos fiscales o auditoria relevante.

### 4. ALCANCE INCLUIDO
El modulo Clientes administra:

- Datos generales del cliente.
- Tipo de cliente.
- Estado operativo del cliente.
- Contacto basico.
- Direccion estructurada.
- Datos fiscales opcionales.
- Notas internas.
- Ultimas compras vinculadas.
- Detalle de productos de compras recientes.
- Auditoria basica de alta, edicion y cambio de estado.
- Desactivacion, archivado y reactivacion.
- Revision de eliminacion segura.
- Eliminacion fisica solo para altas sin uso real.
- Consulta multiempresa segura.
- Integracion ligera con Ventas.

### 5. ALCANCE EXCLUIDO
Clientes no debe ejecutar responsabilidades de otros modulos:

- **Ventas:** registra tickets, pagos, descuentos de stock y detalle de venta.
- **Facturacion:** emite CFDI, timbra documentos o administra reglas fiscales avanzadas.
- **Reportes:** analiza consumo, ticket promedio, recurrencia o rentabilidad.
- **Credito/cobranza:** administra saldos, abonos, deuda o cuentas por cobrar.
- **Marketing/CRM:** campanas, promociones, embudos, recordatorios o segmentacion avanzada.
- **Inventario:** no mueve stock ni afecta lotes.

Regla obligatoria: ninguna accion de Clientes debe impedir que una venta normal se registre sin cliente.

### 6. TIPOS DE CLIENTE SOPORTADOS
Tipos vigentes:

- **PERSONA:** comprador individual, vecino, cliente recurrente o consumidor final.
- **NEGOCIO:** comprador que adquiere para negocio, reventa, consumo comercial o facturacion recurrente.

Reglas:

- El tipo por defecto es `PERSONA`.
- El tipo debe normalizarse a mayusculas.
- El frontend debe mostrar etiquetas simples: Persona y Negocio.
- No se deben agregar tipos nuevos sin definir reglas funcionales, filtros, seed data y QA.
- El tipo no debe cambiar el flujo de venta; solo ayuda a organizar y filtrar.

### 7. ESTADOS DEL CLIENTE
Estados vigentes:

- **ACTIVO:** cliente disponible para operacion diaria. Puede aparecer en filtros, seleccion y consulta normal.
- **INACTIVO:** cliente temporalmente fuera de uso. Conserva historial y puede reactivarse.
- **ARCHIVADO:** cliente historico que no debe aparecer en operacion normal, pero permanece disponible para consulta.

Reglas:

- Activo implica `estatus=true`.
- Inactivo y archivado implican `estatus=false`.
- Todo cambio de estado requiere motivo.
- El motivo debe tener entre 5 y 500 caracteres.
- El cambio de estado registra estado anterior, estado nuevo, accion, motivo, usuario y fecha.
- Reactivar no borra historial.
- Archivar no borra ventas, datos fiscales ni auditoria.
- La vista principal debe priorizar clientes activos, pero permitir consultar inactivos y archivados.

### 8. DESACTIVAR, ARCHIVAR, REACTIVAR Y ELIMINAR
Las acciones de estado tienen intencion distinta:

- **Desactivar:** pausa operativa. El cliente deja de estar disponible por defecto, pero podria volver pronto.
- **Archivar:** cierre historico. El cliente se conserva para consulta, auditoria o referencia, pero se retira del uso diario.
- **Reactivar:** devuelve el cliente a operacion normal.
- **Eliminar fisicamente:** solo aplica cuando el cliente fue creado por error y no tiene uso relevante.

Reglas:

- Desactivar y archivar conservan toda la informacion.
- Reactivar conserva la trazabilidad previa.
- Eliminar debe ser la accion menos visible y mas protegida.
- Si el usuario no entiende si debe desactivar o archivar, el sistema debe recomendar desactivar para pausas temporales y archivar para historial.
- Si existe cualquier venta, dato fiscal o auditoria relevante, eliminar debe bloquearse.

### 9. ELIMINACION SEGURA DEL CLIENTE
La eliminacion fisica solo procede si el cliente fue creado por error y no tiene uso real.

Debe bloquearse si existe al menos una dependencia:

- Ventas historicas.
- Datos fiscales capturados.
- Auditoria relevante de cambios.
- Cambio de estado registrado.
- Modificaciones asociadas a usuarios.

Flujo correcto:

1. El usuario solicita eliminar fisicamente.
2. Frontend consulta `GET /clientes/{id}/eliminacion-segura`.
3. Backend responde si puede eliminar, dependencias, motivos y accion recomendada.
4. Si hay dependencias, se bloquea eliminar y se recomienda desactivar o archivar.
5. Si no hay dependencias, se permite eliminar con motivo.

Regla: eliminar no debe ser accion visual agresiva ni principal. Debe ser una accion segura, explicada y confirmada.

### 10. PANTALLA PRINCIPAL
La pantalla principal debe funcionar como directorio operativo rapido.

Componentes:

- Header compacto del modulo.
- Boton principal "Agregar cliente".
- Resumen operativo.
- Buscador.
- Filtros.
- Tabla de compradores.
- Paginacion.
- Acciones directas por fila.

Reglas:

- No mostrar subtitulos explicativos innecesarios en el header.
- La pantalla debe cargar rapido incluso en equipos modestos.
- La tabla debe ser clara en escritorio sin scroll lateral normal.
- Las acciones deben ser visibles, pero discretas.
- La venta normal no debe depender de entrar a esta pantalla.
- El frontend no debe inventar datos si backend no los entrega.

### 11. BUSQUEDA Y FILTROS
Busqueda principal:

- Nombre.
- Alias.
- Telefono.
- WhatsApp.
- Correo.
- RFC.
- Razon social.
- Direccion.
- Notas internas.

Filtros vigentes:

- Estado.
- Tipo.
- Con datos fiscales / sin datos fiscales.
- Con direccion / sin direccion.
- Con compras / sin compras.

Reglas:

- La busqueda debe tolerar informacion incompleta.
- Los archivados no deben ser protagonistas por defecto.
- Limpiar filtros debe volver a una vista operativa clara.
- Refrescar no debe romper seleccion ni acciones en curso.
- A largo plazo, busqueda y filtros deben ejecutarse en backend con paginacion real.

### 12. RESUMEN OPERATIVO
El resumen operativo debe mostrar informacion de accion rapida, no reportes.

Tarjetas vigentes:

- Total.
- Activos.
- Inactivos.
- Archivados.
- Con fiscales.
- Con direccion.

Reglas:

- El resumen debe responder a la informacion cargada.
- Si en el futuro existe paginacion backend, el resumen debe provenir de un endpoint agregado.
- No debe consultar ventas completas para calcular metricas simples.
- No debe mostrar tendencias, graficas o analitica pesada en la pantalla principal.

### 13. TABLA PRINCIPAL
Columnas funcionales:

- Cliente.
- Telefono / WhatsApp.
- Tipo.
- Datos fiscales.
- Ultima compra.
- Estado.
- Acciones.

Acciones directas por fila:

- Ver detalle.
- Editar cliente.
- Ultimas compras.
- Auditoria.
- Desactivar.
- Archivar.
- Reactivar.
- Eliminar si no tiene uso.

Reglas:

- La tabla debe iniciar con 6 filas por pagina.
- Opciones de filas vigentes: 6, 8 y 10.
- Las acciones deben usar iconos con tooltip.
- El boton de eliminar debe comunicar seguridad, no destruccion inmediata.
- Durante cargas o acciones criticas, los botones deben deshabilitarse.
- La paginacion visual actual es aceptable solo con volumen bajo; el objetivo a largo plazo es paginacion backend.

### 14. ALTA Y EDICION DE CLIENTE
El alta y edicion deben usar panel lateral, no una pantalla aislada.

Secciones:

1. Datos generales.
2. Contacto.
3. Direccion opcional.
4. Datos fiscales opcionales.

Reglas:

- Solo nombre es obligatorio a nivel funcional.
- El resto de campos debe facilitar la operacion, no bloquearla.
- Si hay cambios sin guardar, el usuario debe recibir confirmacion antes de cerrar.
- El formulario debe mantener altura, foco y estilos consistentes con Proveedores.
- Los selects deben tener altura equivalente a los inputs.
- El foco de inputs y selects debe usar el verde institucional de GaltekOne.
- Crear y editar deben compartir layout, tamanos, estados y validaciones.

### 15. DATOS GENERALES
Campos:

- Nombre.
- Alias.
- Tipo.
- Estado.
- Notas internas.

Reglas:

- Nombre es obligatorio.
- Nombre se guarda sin espacios extremos.
- Alias es opcional y se guarda como nulo si esta vacio.
- Tipo por defecto: `PERSONA`.
- Estado por defecto: `ACTIVO`.
- Notas internas son de uso operativo y no deben sustituir auditoria formal.
- Notas internas soportan hasta 2000 caracteres.

Ejemplos de notas validas:

- Prefiere WhatsApp.
- Pide ticket siempre.
- Suele comprar para negocio.
- Entregar despues de las 6.
- Solicita factura con frecuencia.

### 16. CONTACTO
Campos:

- Telefono.
- WhatsApp.
- Correo.

Reglas:

- Telefono y WhatsApp son opcionales.
- Si se capturan, deben tener 10 digitos o formato `+` con lada y 10 a 13 digitos.
- El frontend debe remover espacios, guiones y caracteres no numericos.
- El backend debe validar de nuevo para no confiar solo en frontend.
- Correo es opcional.
- Si se captura, debe tener formato valido.
- Correo se normaliza sin espacios extremos y en frontend se recomienda minuscula.

### 17. DIRECCION OPCIONAL
Campos:

- Calle.
- Numero exterior.
- Numero interior.
- Colonia o zona.
- Municipio o ciudad.
- Estado.
- Codigo postal.
- Referencia.
- Direccion legacy.

Reglas:

- La direccion es opcional.
- La direccion estructurada debe construir el texto `direccion` para compatibilidad.
- Codigo postal solo debe aceptar numeros y maximo 5 digitos.
- Referencia debe ayudar a encontrar al cliente, no guardar informacion sensible innecesaria.
- Si no hay direccion estructurada, puede conservarse `direccion` legacy.
- La direccion no debe ser obligatoria para venta ni para alta de cliente.

### 18. DATOS FISCALES OPCIONALES
Campos:

- RFC.
- Razon social.
- Codigo postal fiscal.
- Correo fiscal.
- Regimen fiscal.
- Uso CFDI.

Reglas:

- Los datos fiscales son opcionales.
- Si se captura RFC, debe normalizarse a mayusculas y validar formato.
- RFC debe cumplir patron general: 3 o 4 letras, fecha de 6 digitos y homoclave de 3 caracteres.
- Codigo postal fiscal solo acepta numeros y maximo 5 digitos.
- Correo fiscal debe validar formato si se captura.
- Uso CFDI se normaliza a mayusculas.
- La existencia de datos fiscales bloquea eliminacion fisica.
- Los datos fiscales deben conservarse mientras expliquen ventas, facturacion o relacion comercial.

### 19. DETALLE DEL CLIENTE
El detalle debe mostrar informacion completa sin obligar a editar.

Secciones:

- Hero del cliente.
- Metricas basicas.
- Datos generales.
- Contacto.
- Direccion.
- Datos fiscales.
- Ultimas compras.
- Auditoria.

Reglas:

- El detalle se abre en panel lateral.
- Si el cliente no esta enriquecido, frontend consulta `GET /clientes/{id}`.
- El panel debe soportar skeleton durante carga.
- Campos vacios deben mostrarse como `--` o estado claro.
- El detalle no debe permitir modificaciones directas; para cambios se usa editar.

### 20. ULTIMAS COMPRAS
El modulo Clientes puede consultar compras recientes para contexto rapido.

Contrato vigente:

- `GET /clientes/{id}` entrega `comprasRegistradas`.
- `GET /clientes/{id}` entrega lista `pedidos`.
- Backend consulta las ultimas 5 ventas del cliente por fecha de creacion descendente.
- Cada pedido incluye orden, fecha, total de productos, importe total, metodo de pago, estado y detalle de productos.

Detalle de producto:

- Id de producto.
- Nombre.
- Codigo de barras.
- Unidad.
- Indicador de pesaje.
- Cantidad.
- Precio unitario.
- Subtotal.

Reglas:

- Ultimas compras son contexto, no reporte completo.
- El modal de ultimas compras debe mostrar suficiente detalle para entender que compro.
- Si el usuario necesita historial completo, debe existir flujo futuro con paginacion y filtros.
- No se deben cargar todas las ventas historicas del cliente en la vista principal.
- El conteo total puede ser mayor a las compras mostradas.

### 21. AUDITORIA DEL CLIENTE
Auditoria vigente:

- Alta del cliente.
- Ultima edicion general.
- Cambio de estado.
- Motivo de cambio de estado.
- Usuario que cambio estado.
- Fecha de cambio de estado.
- Compras recientes asociadas como eventos de contexto.

Reglas:

- Auditoria no debe depender solo del frontend.
- El frontend puede construir una linea de tiempo visual con datos actuales, pero la fuente final debe ser backend.
- Todo cambio critico requiere usuario.
- Todo cambio de estado requiere motivo.
- La auditoria debe ayudar a responder quien hizo que, cuando y por que.
- A futuro, debe existir tabla formal de auditoria para acciones, eliminaciones, restauraciones y mantenimiento.

### 22. INTEGRACION CON VENTAS
Clientes se integra con Ventas de forma opcional.

Reglas:

- `CreateVentaRequest.clienteId` puede ser nulo.
- Si `clienteId` existe, Ventas valida que pertenezca a la empresa activa.
- Si el cliente no existe o no pertenece a la empresa, la venta debe fallar.
- Si no hay cliente, la venta debe generarse normalmente.
- El ticket puede incluir DTO minimo del cliente: id, nombre y telefono.
- Registrar una venta no debe editar automaticamente datos del cliente.
- El historial del cliente se obtiene consultando ventas asociadas.

### 23. VALIDACIONES Y NORMALIZACION
Validaciones backend vigentes:

- Cliente obligatorio.
- Nombre obligatorio.
- Email valido si se captura.
- Correo fiscal valido si se captura.
- Telefono valido si se captura.
- WhatsApp valido si se captura.
- RFC valido si se captura.
- Tipo permitido: `PERSONA`, `NEGOCIO`.
- Estado permitido: `ACTIVO`, `INACTIVO`, `ARCHIVADO`.
- Motivo obligatorio para cambio de estado y eliminacion segura.

Normalizaciones:

- Trim de textos.
- Telefonos solo con digitos y prefijo `+` si aplica.
- RFC en mayusculas.
- Uso CFDI en mayusculas.
- Valores vacios segun campo: nulo para datos descriptivos, cadena vacia para algunos contactos.
- Direccion compuesta desde campos estructurados.
- `estatus` sincronizado con `estadoCliente`.

### 24. MULTI-EMPRESA Y SEGURIDAD
Clientes es modulo multiempresa.

Reglas:

- Toda consulta debe limitarse a `EmpresaContextHolder.getEmpresaId()`.
- Un usuario no debe leer, editar, desactivar, archivar, reactivar ni eliminar clientes de otra empresa.
- `findByIdClienteAndEmpresa_IdEmpresa` es el patron obligatorio para detalle y acciones por id.
- Ventas debe validar cliente contra empresa activa antes de asociarlo.
- El header `user` identifica al usuario que ejecuta acciones auditables.
- La respuesta de error no debe filtrar informacion de otra empresa.

### 25. PERSISTENCIA Y TABLAS PRINCIPALES
Tabla principal:

- `Clientes`.

Campos clave:

- `id_cliente`.
- `nombre`.
- `alias`.
- `tipo_cliente`.
- `estado_cliente`.
- `estado_cliente_anterior`.
- `ultima_accion_estado`.
- `motivo_cambio_estado`.
- `usuario_cambio_estado`.
- `fecha_cambio_estado`.
- `email`.
- `telefono`.
- `whatsapp`.
- `direccion`.
- `direccion_calle`.
- `direccion_numero_exterior`.
- `direccion_numero_interior`.
- `direccion_colonia`.
- `direccion_municipio`.
- `direccion_estado`.
- `direccion_codigo_postal`.
- `direccion_referencia`.
- `notas_internas`.
- `rfc`.
- `razon_social`.
- `codigo_postal_fiscal`.
- `correo_fiscal`.
- `regimen_fiscal`.
- `uso_cfdi`.
- `avatar`.
- `id_empresa`.
- Campos comunes: `estatus`, `fecha_creacion`, `fecha_modificacion`, `usuario_creacion`, `usuario_modificacion`.

Relaciones:

- Cliente pertenece a Empresa.
- Cliente puede tener muchas Ventas.
- Ventas puede tener cliente nulo.

Indices recomendados para crecimiento:

- `Clientes(id_empresa, estado_cliente, nombre)`.
- `Clientes(id_empresa, tipo_cliente, nombre)`.
- `Clientes(id_empresa, rfc)`.
- `Ventas(id_empresa, id_cliente, fecha_creacion)`.

### 26. BACKEND - CONTRATO FUNCIONAL
Controlador:

- `ClientesController`.

Endpoints vigentes:

- `GET /clientes`
- `POST /clientes`
- `PUT /clientes/{id}`
- `PUT /clientes/{id}/desactivar`
- `PUT /clientes/{id}/archivar`
- `PUT /clientes/{id}/reactivar`
- `GET /clientes/{id}/eliminacion-segura`
- `DELETE /clientes/{id}`
- `GET /clientes/{id}`

Reglas por endpoint:

- `GET /clientes` devuelve clientes filtrados por empresa y filtros dinamicos.
- `POST /clientes` crea cliente, normaliza datos, asigna empresa y usuario creador.
- `PUT /clientes/{id}` actualiza datos permitidos del cliente.
- Acciones de estado cambian estado y requieren motivo.
- Eliminacion segura revisa dependencias antes de borrar.
- `GET /clientes/{id}` entrega detalle enriquecido y ultimas compras.
- Los errores de validacion deben responder `400`.
- Cliente no encontrado debe responder `404`.
- Eliminacion bloqueada debe responder `409`.

### 27. DTOs Y RESPUESTAS
DTOs vigentes:

- `ClienteDTO`.
- `ClienteConPedidosDTO`.
- `PedidoClienteDTO`.
- `DetallePedidoClienteDTO`.

`ClienteDTO` se usa para respuestas ligeras, especialmente ticket de venta:

- `idCliente`.
- `nombre`.
- `telefono`.

`ClienteConPedidosDTO` se usa para detalle:

- Datos completos del cliente.
- Auditoria basica.
- `comprasRegistradas`.
- `pedidos`.

`PedidoClienteDTO` representa una venta reciente:

- Numero de orden.
- Fecha.
- Productos totales.
- Importe total.
- Metodo de pago.
- Estado.
- Productos.

`DetallePedidoClienteDTO` representa productos de la venta:

- Producto.
- Codigo.
- Unidad.
- Pesaje.
- Cantidad.
- Precio.
- Subtotal.

Regla: las respuestas de detalle deben ser suficientes para el modal de ultimas compras, pero no deben crecer hasta cargar todo el historial.

### 28. FRONTEND - COMPONENTES Y RESPONSABILIDAD
Componentes principales:

- `Clientes.jsx`: orquesta carga, estado local, filtros, acciones seguras y modales.
- `ClientesSummary.jsx`: resumen operativo.
- `ClientesFilters.jsx`: busqueda, filtros y refresco.
- `ClientesTable.jsx`: tabla, paginacion visual y acciones por fila.
- `ClienteEditorPanel.jsx`: alta y edicion.
- `ClienteDetailPanel.jsx`: detalle lateral.
- `ClienteAdvancedModals.jsx`: modal de ultimas compras y auditoria.
- `ClienteAuditSection.jsx`: linea de tiempo de auditoria.
- `clientesUtils.js`: normalizacion, validaciones, opciones, formateo y payloads.

Reglas frontend:

- El componente raiz no debe contener reglas duplicadas que pertenezcan a backend.
- Los utils deben centralizar normalizacion visual.
- Los modales avanzados deben recibir cliente ya enriquecido cuando sea necesario.
- Acciones criticas deben deshabilitar botones durante carga.
- Los errores deben mostrarse con toast claro.
- La UI debe conservar estilo visual alineado con Proveedores.

### 29. UX Y DISENO
Principios de UX:

- Rapido.
- Ligero.
- Claro.
- Sin friccion para vender.
- Sin parecer CRM empresarial.

Reglas visuales:

- Header compacto.
- Boton primario claro.
- Verde institucional en foco, estados activos y acciones principales.
- Inputs y selects con alturas consistentes.
- Tipografia consistente con Proveedores.
- Modales de ultimas compras y auditoria similares a los de Proveedores.
- Paginacion con opciones 6, 8 y 10.
- Iconos con tooltip.
- Estados vacios utiles.

Reglas de interaccion:

- Si no hay clientes, invitar a agregar sin sugerir que es obligatorio.
- Si no hay compras, mostrar estado vacio claro.
- Si eliminacion esta bloqueada, explicar motivos y recomendar desactivar o archivar.
- Si hay cambios sin guardar, confirmar antes de cerrar.

### 30. RENDIMIENTO Y CRECIMIENTO
Clientes debe seguir siendo agil despues de meses o anos de uso.

Riesgos actuales:

- `GET /clientes` devuelve lista completa.
- El frontend filtra y pagina en memoria.
- La vista enriquece detalles si la lista tiene hasta 80 clientes.
- Las ultimas compras consultan detalle por cliente seleccionado.

Reglas de evolucion:

- Implementar paginacion backend antes de que el modulo dependa de miles de clientes.
- Mover busqueda y filtros principales al backend.
- Mantener detalle bajo demanda.
- No cargar historial completo de ventas en la pantalla principal.
- No calcular reportes desde Clientes.
- Agregar indices antes de crecimiento real.
- Usar DTOs de lista mas pequenos que el detalle.

Objetivo:

- Entrada al modulo menor a un segundo en equipos modestos.
- Tabla usable con miles de clientes mediante paginacion real.
- Detalle y modales cargados solo bajo demanda.

### 31. HISTORIAL, RESPALDOS Y RETENCION
Clientes debe respetar la politica general de mantenimiento del sistema.

Reglas:

- Ventas asociadas al cliente no se borran desde Clientes.
- Datos fiscales no deben eliminarse automaticamente por limpieza operativa.
- Auditoria critica debe conservarse segun politica legal y de negocio.
- Historial operativo ligero puede tener retencion configurable.
- Acciones de mantenimiento deben quedar auditadas.
- Restaurar respaldo debe conservar consistencia entre Clientes y Ventas.

Politica sugerida:

- Acciones generales y sesiones: 3 meses por defecto.
- Logs tecnicos: 30 a 90 dias.
- Auditoria de negocio: minimo 12 meses y preferentemente mas segun configuracion.
- Ventas, compras, fiscales y documentos de soporte: no limpiar con reglas operativas cortas.

Regla: ninguna limpieza automatica debe romper la capacidad de explicar una venta historica asociada a un cliente.

### 32. REGLAS DE SEED Y DATOS DE PRUEBA
Seed vigente:

- Permisos `CLIENTES_VER` y `CLIENTES_EDITAR`.
- Clientes demo con tipos `PERSONA` y `NEGOCIO`.
- Estados demo: activo, inactivo y archivado.
- Datos fiscales en algunos clientes.
- Direcciones estructuradas.
- Notas internas.
- Ventas demo asociadas a clientes.

Reglas:

- Seed debe ser idempotente.
- No duplicar clientes si se ejecuta varias veces.
- Mantener al menos un cliente con datos fiscales.
- Mantener al menos un cliente sin datos fiscales.
- Mantener al menos un cliente inactivo.
- Mantener al menos un cliente archivado.
- Mantener ventas asociadas para probar ultimas compras.

### 33. QA FUNCIONAL MINIMO
Casos obligatorios:

- Crear cliente con solo nombre.
- Crear cliente persona con contacto.
- Crear cliente negocio con datos fiscales.
- Validar email invalido.
- Validar telefono invalido.
- Validar RFC invalido.
- Editar direccion estructurada y verificar `direccion`.
- Desactivar cliente con motivo valido.
- Bloquear desactivacion sin motivo.
- Archivar cliente con motivo valido.
- Reactivar cliente con motivo valido.
- Revisar eliminacion segura de cliente sin uso.
- Bloquear eliminacion segura de cliente con ventas.
- Bloquear eliminacion segura de cliente con datos fiscales.
- Consultar detalle de cliente.
- Consultar ultimas compras con productos.
- Consultar auditoria.
- Verificar que venta puede generarse sin cliente.
- Verificar que venta con cliente de otra empresa falla.

### 34. QA VISUAL MINIMO
Casos visuales:

- Header sin subtitulo innecesario.
- Buscador alineado con filtros.
- Selects con altura igual a inputs.
- Foco verde en inputs y selects.
- Tabla sin scroll lateral normal en escritorio.
- Paginacion visible y alineada.
- Opciones de filas: 6, 8, 10.
- Panel de alta y edicion con mismo estilo de Proveedores.
- Modal de ultimas compras con productos visibles.
- Modal de auditoria con linea de tiempo legible.
- Estados vacios claros.
- Botones deshabilitados durante carga.

### 35. REGLAS DE NO REGRESION
No se debe romper:

- Venta sin cliente.
- Venta con cliente opcional.
- Multiempresa.
- Motivo obligatorio en cambios de estado.
- Bloqueo de eliminacion con dependencias.
- Datos fiscales opcionales.
- Direccion opcional.
- Ultimas compras como detalle bajo demanda.
- Auditoria visible.
- Estilos alineados con Proveedores.
- Paginacion 6, 8 y 10.

No se debe introducir:

- Cliente obligatorio en POS.
- CRM pesado.
- Reportes completos dentro de Clientes.
- Eliminacion fisica sin revision backend.
- Filtros que oculten datos sin posibilidad de recuperarlos.
- Cargas completas de ventas historicas para una tabla simple.

### 36. ROADMAP CONTROLADO
Mejoras futuras recomendadas:

1. Paginacion backend para `GET /clientes`.
2. Endpoint de resumen agregado para tarjetas.
3. Busqueda backend por texto normalizado.
4. Indices compuestos para clientes y ventas por cliente.
5. Auditoria formal en tabla central.
6. Historial completo de compras con paginacion.
7. Exportacion ligera de clientes.
8. Deteccion de duplicados por telefono, WhatsApp, RFC o nombre similar.
9. Politicas de retencion conectadas a Configuracion.
10. Permisos mas finos para eliminar, archivar y ver datos fiscales.

Regla: cada mejora debe implementarse sin convertir el alta de cliente ni la venta diaria en flujo pesado.

### 37. RESUMEN EJECUTIVO
Clientes es el directorio ligero de compradores frecuentes de GaltekOne.

Su valor no esta en capturar mucha informacion, sino en guardar la informacion correcta sin frenar la caja: nombre, contacto, direccion opcional, fiscales opcionales, ultimas compras, estado y auditoria.

El modulo debe permitir reconocer clientes utiles, consultar que compraron recientemente, conservar trazabilidad y proteger historial comercial. Al mismo tiempo, debe respetar que muchas ventas seguiran siendo anonimas o de publico general.

La regla final es simple: Clientes debe hacer mas humana y ordenada la venta recurrente, no hacer mas lenta la venta normal.
