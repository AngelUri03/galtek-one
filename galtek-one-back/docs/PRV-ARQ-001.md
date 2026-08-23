# PRV-ARQ-001 - MODULO PROVEEDORES

### 1. PROPOSITO DEL DOCUMENTO
- **Documento:** PRV-ARQ-001.
- **Modulo:** Proveedores.
- **Producto:** GaltekOne POS de escritorio para tiendas pequenas y medianas.
- **Audiencia:** Producto, Backend, Frontend, QA, Soporte, analisis funcional y futuros desarrolladores.
- **Estado funcional:** Fuente oficial de verdad para reglas de negocio, alcance, limites, persistencia, auditoria y logica de componentes del modulo.

Este documento define la logica funcional vigente del modulo Proveedores de GaltekOne. Debe usarse como referencia obligatoria antes de modificar frontend, backend, base de datos, pruebas, seed data o documentacion relacionada con proveedores.

Proveedores no es una tabla de contactos. Es el centro de relacion comercial de abastecimiento del negocio. Su objetivo es que el tendero pueda entender rapidamente quien le surte, como pedir, que condiciones existen, que productos puede comprar, que activos del proveedor estan bajo responsabilidad de la tienda, que documentos respaldan la relacion y quien hizo cada cambio.

### 2. PRINCIPIO RECTOR
El modulo Proveedores administra la relacion comercial de abastecimiento.

No registra compras.
No aumenta stock.
No administra lotes.
No reemplaza Reportes.
No debe borrar historia relevante.

La regla mas importante es esta: si un proveedor, producto asociado, activo, documento o registro de auditoria ayuda a explicar una operacion pasada, una responsabilidad actual o una evidencia del negocio, debe conservarse.

### 3. DEFINICIONES FUNCIONALES
- **Proveedor:** Persona, empresa, repartidor, establecimiento o canal que puede abastecer productos, equipo, exhibidores, documentos o condiciones comerciales a la tienda.
- **Relacion comercial:** Conjunto de datos generales, contactos, condiciones, productos asociados, activos prestados, documentos y auditoria que explican como trabaja el negocio con un proveedor.
- **Abastecimiento:** Forma en la que la tienda obtiene mercancia o recursos: entrega a domicilio, ruta, preventa, compra en mostrador, recoleccion por el tendero, WhatsApp, llamada, app o modalidad mixta.
- **Producto asociado:** Relacion comercial entre un proveedor y un producto interno del inventario. No representa compra ni stock.
- **Activo prestado:** Equipo, exhibidor o material fisico del proveedor que esta o estuvo bajo responsabilidad de la tienda.
- **Documento:** Archivo guardado en base de datos que respalda o evidencia una condicion, contrato, comodato, lista, identificacion, catalogo, credito, fotografia o acuerdo.
- **Auditoria:** Evidencia funcional de quien hizo que, cuando, desde donde y que cambio antes/despues.

### 4. ALCANCE INCLUIDO
El modulo Proveedores administra:

- Datos generales del proveedor.
- Estado operativo del proveedor.
- Contactos comerciales y roles.
- Modalidad de abastecimiento.
- Frecuencia, dias y horarios de visita o entrega.
- Anticipacion requerida para recibir pedido.
- Condiciones comerciales.
- Direccion estructurada o zona operativa.
- Productos que puede surtir.
- Estado de la relacion producto-proveedor.
- Historial de costos por proveedor-producto.
- Activos prestados o comodatos.
- Historial operativo de activos.
- Evidencias fotograficas de activos por evento.
- Documentos guardados en base de datos.
- Versiones auditadas de documentos.
- Vista previa y descarga de documentos/evidencias.
- Auditoria consolidada del proveedor y sus subcomponentes.
- Eliminacion segura.
- Desactivacion, archivado y reactivacion.

### 5. ALCANCE EXCLUIDO
Proveedores no debe ejecutar responsabilidades de otros modulos:

- **Compras:** registra entradas normales de mercancia y costos reales de compra.
- **Inventario:** administra stock, lotes, caducidades, ajustes y movimientos.
- **Reportes:** analiza desempeno, gasto, rotacion, rentabilidad y tendencias.
- **Cuentas por pagar:** si existe en el futuro, debe ser un flujo financiero especifico.
- **CRM externo:** Proveedores no sustituye canales externos, solo documenta la relacion.

Regla obligatoria: ninguna accion de Proveedores debe incrementar inventario ni crear una compra.

### 6. TIPOS DE PROVEEDOR SOPORTADOS
El sistema debe soportar proveedores formales e informales sin forzar una estructura corporativa innecesaria.

Tipos funcionales vigentes:

- **DISTRIBUIDOR_FORMAL:** empresas estructuradas, marcas o mayoristas formales.
- **PROVEEDOR_INFORMAL:** proveedor que atiende por WhatsApp, llamada o trato directo.
- **ESTABLECIMIENTO_COMPRA:** central de abasto, mercado, bodega, cremeria, supermercado, club de precios o lugar donde el tendero va a comprar.
- **ENTREGA_DOMICILIO:** proveedor cuya operacion principal es entregar en tienda.
- **MIXTO:** proveedor que permite entrega, recoleccion o compra directa.

Ejemplos reales: Coca-Cola, Lala, Sabritas, Bimbo, Barcel, repartidores independientes, centrales de abasto, mercados, Aurrera, Sam's, cremerias, bodegas y proveedores que solo atienden por WhatsApp.

### 7. ESTADOS DEL PROVEEDOR
Estados vigentes:

- **ACTIVO:** proveedor disponible para operacion diaria. Puede aparecer en flujos de compra, asociacion de productos y consulta normal.
- **INACTIVO:** proveedor fuera de uso temporal. Conserva historial y puede reactivarse.
- **ARCHIVADO:** relacion historica que no debe aparecer en operacion normal, pero permanece disponible para consulta.

Reglas:

- Activo implica `estatus=true`.
- Inactivo y archivado implican `estatus=false`.
- Todo cambio de estado requiere motivo.
- El cambio de estado registra estado anterior, estado nuevo, accion, motivo, usuario y fecha.
- Reactivar no borra historial.
- Archivar no borra productos, activos, documentos ni auditoria.
- La vista principal debe priorizar activos, pero permitir filtrar inactivos y archivados.

### 8. ELIMINACION SEGURA DEL PROVEEDOR
La eliminacion fisica solo procede si el proveedor fue creado por error y no tiene uso real.

Debe bloquearse si existe al menos una dependencia:

- Compras historicas.
- Contactos.
- Productos asociados.
- Activos prestados.
- Documentos anexos.
- Acuerdos legados en base de datos.
- Auditoria relevante.

Flujo correcto:

1. El usuario solicita eliminar fisicamente.
2. Frontend consulta `GET /proveedores/{id}/eliminacion-segura`.
3. Backend responde si puede eliminar, dependencias y motivos.
4. Si hay dependencias, se bloquea eliminar y se recomienda desactivar o archivar.
5. Si no hay dependencias, se permite eliminar con motivo.

Regla: eliminar no debe ser accion visual agresiva ni principal. Debe ser una accion segura, explicada y confirmada.

### 9. PANTALLA PRINCIPAL
La pantalla principal debe funcionar como centro operativo rapido, no como tabla administrativa generica.

Componentes:

- Header compacto del modulo.
- Boton principal "Agregar proveedor".
- Resumen operativo.
- Buscador.
- Filtros.
- Tabla de relacion comercial.
- Paginacion.
- Acciones directas por fila.

Resumen operativo:

- Total de proveedores.
- Activos.
- Inactivos.
- Archivados.
- Sin productos asociados.
- Con activos prestados.

Reglas:

- No inventar datos falsos en frontend.
- Si backend no entrega un dato exacto, preparar integracion y mostrar estado seguro.
- El resumen debe ayudar a operar, no duplicar reportes.
- La pantalla no debe requerir scroll lateral normal.
- La tabla debe conservar legibilidad en escritorio.
- Los botones internos deben bloquearse durante cargas o acciones criticas.

### 10. BUSQUEDA Y FILTROS
Busqueda principal:

- Nombre del proveedor.
- Contacto.
- Telefono.
- WhatsApp.
- Correo.
- RFC.
- Direccion o zona.

Filtros vigentes:

- Estado.
- Tipo de proveedor.
- Modalidad de abastecimiento.
- Con productos / sin productos.
- Con activos.
- Condicion de pago.

Reglas:

- La busqueda debe ser tolerante a informacion incompleta.
- La vista por defecto no debe mezclar archivados de forma protagonista.
- Limpiar filtros debe volver a una vista operativa clara.
- Refrescar no debe romper seleccion ni acciones en curso.

### 11. TABLA PRINCIPAL
Columnas funcionales:

- Proveedor.
- Tipo.
- Contacto principal.
- Telefono / WhatsApp.
- Modalidad.
- Productos asociados.
- Estado.
- Acciones.

La columna "Ultima actividad" fue removida de la vista principal para reducir scroll lateral y mantener foco operacional.

Acciones visibles prioritarias por fila:

- Ver detalle.
- Editar proveedor.
- Mas acciones.

El menu `Mas acciones` agrupa navegacion secundaria y acciones de estado:

- Productos asociados.
- Activos prestados.
- Documentos.
- Auditoria.
- Desactivar, archivar o reactivar segun estado.
- Eliminacion segura.

Reglas:

- No saturar la tabla con todos los iconos simultaneos.
- El menu `Mas acciones` no debe ocultar funcionalidad; debe reducir ruido visual y stops de tabulacion.
- La navegacion secundaria tambien debe estar disponible desde el Drawer Workspace del proveedor.
- No mostrar eliminar como boton rojo principal.
- Las acciones deben ser iconos discretos, consistentes y con tooltip.
- Durante carga o accion segura, los botones deben deshabilitarse para evitar dobles operaciones.

### 12. ALTA Y EDICION DE PROVEEDOR
El alta y edicion deben organizarse en secciones, no en un modal simple de pocos campos.

Secciones:

1. Datos generales.
2. Contactos.
3. Abastecimiento.
4. Condiciones comerciales.

Reglas generales:

- Nombre comercial es obligatorio.
- Razon social es opcional.
- RFC es opcional, pero si se captura debe tener formato valido.
- Correo es opcional, pero si se captura debe tener formato valido.
- Telefono/WhatsApp deben aceptar telefono local de 10 digitos o formato internacional con `+` y 11 a 13 digitos.
- Proveedores informales no requieren RFC ni correo.
- Categoria principal usa categorias existentes y permite "Otra".
- Direccion debe capturarse de forma mas detallada que texto libre.
- Deben confirmarse cambios sin guardar.
- Guardar debe mostrar feedback claro.

Campos de direccion:

- Calle.
- No. exterior.
- No. interior.
- Colonia o zona.
- Municipio o ciudad.
- Estado.
- Codigo postal.
- Referencia.

La direccion se persiste como texto estructurado en el campo `direccion`, conservando compatibilidad con datos legados.

### 13. CONTACTOS
Un proveedor puede tener multiples contactos.

Roles vigentes:

- VENDEDOR.
- REPARTIDOR.
- COBRANZA.
- ATENCION_CLIENTES.
- ENCARGADO.
- OTRO.

Reglas:

- Debe poder existir contacto principal.
- Solo un contacto debe operar como principal en la practica visual.
- Contactos pueden tener telefono, WhatsApp y correo.
- Un proveedor informal puede tener solo WhatsApp.
- El contacto principal alimenta la tabla principal cuando aplique.
- Los contactos pertenecen al proveedor y a la empresa.
- Desactivar contacto no elimina proveedor.

### 14. ABASTECIMIENTO
Modalidades vigentes:

- ENTREGA_DOMICILIO.
- RECOGE_TENDERO.
- MIXTO.

Canales o formas de pedido:

- Pedido por WhatsApp.
- Pedido por llamada.
- Pedido por app.
- Visita de ruta.
- Compra en mostrador.

Reglas:

- Se pueden combinar canales.
- La modalidad describe como se obtiene el producto.
- El canal describe como se solicita.
- La compra en mostrador no significa compra registrada; solo indica la dinamica con el proveedor.
- El campo de observaciones de abastecimiento captura detalles practicos, no movimientos de inventario.

### 15. DIAS, HORARIOS Y ANTICIPACION
Dias de visita o entrega:

- Modo semana: permite seleccionar de lunes a domingo.
- Modo mes: permite seleccionar dias 1 a 31.

Horario habitual:

- Rango de horario.
- Hora especifica.
- Sin horario fijo.

Anticipacion requerida:

- Cantidad numerica.
- Unidad: minutos, horas o dias.
- Contexto: entrega recurrente, entrega a domicilio o compra en mostrador.

Reglas:

- No debe ser texto libre sin estructura.
- Debe permitir expresar que un pedido se hace antes de una fecha recurrente.
- Debe permitir expresar espera estimada en mostrador.
- Debe servir para operacion rapida, no para programacion automatica obligatoria.

### 16. CONDICIONES COMERCIALES
Campos funcionales:

- Forma de pago principal: CONTADO, CREDITO o MIXTO.
- Maneja credito.
- Dias de credito.
- Limite de credito.
- Permite devoluciones.
- Cambios por caducidad.
- Bonificaciones.
- Descuentos frecuentes.
- Pedido minimo.
- Costo de envio.
- Notas comerciales.

Reglas:

- Valores monetarios no pueden ser negativos.
- Dias de credito no puede ser negativo.
- Manejar credito no implica cuenta por pagar automatica.
- Notas comerciales explican condiciones practicas, no sustituyen documento formal.
- Tratos formales deben respaldarse como documentos.

### 17. DETALLE DEL PROVEEDOR
El detalle es una vista de consulta, no de edicion.

Debe mostrar:

- Resumen general.
- Contactos.
- Abastecimiento.
- Condiciones comerciales.
- Productos asociados.
- Activos prestados.
- Documentos.
- Auditoria resumida.

Reglas:

- Puede tener accesos de navegacion interna a Productos asociados, Activos prestados, Documentos y Auditoria.
- Estos accesos no editan directamente; cambian la vista del mismo Drawer Workspace.
- No debe registrar compras.
- No debe modificar stock.
- No debe duplicar reportes.
- Debe mostrar TODO lo capturado relevante.
- Debe estar pegado a la parte superior del dialog/panel para evitar cortes inferiores.
- Debe ser visualmente premium, claro y legible.

### 18. PRODUCTOS ASOCIADOS
La seccion Productos asociados muestra la relacion entre proveedor y productos internos.

Campos de la relacion:

- Producto interno.
- SKU interno.
- SKU del proveedor.
- Ultimo costo.
- Fecha del ultimo costo.
- Presentacion de compra.
- Cantidad minima.
- Proveedor preferido.
- Estado de relacion.

Estados:

- ACTIVA.
- INACTIVA.
- ARCHIVADA.

Reglas:

- No se crean productos desde esta pantalla.
- No se crean compras.
- No se incrementa stock.
- No se modifican lotes.
- No se modifica Inventario directamente.
- La relacion solo documenta que el proveedor puede surtir ese producto.
- Un producto puede tener varios proveedores.
- Un proveedor puede surtir varios productos.
- Desactivar relacion no elimina historial.
- Reactivar relacion vuelve a marcarla operativa.

Acciones permitidas:

- Abrir producto en Inventario si existe ruta/patron.
- Abrir referencia a Compras si existe ruta/patron.
- Ver historial de costos.
- Desactivar o reactivar relacion.

Regla UX vigente:

- Productos asociados se muestra como vista interna del Drawer Workspace del proveedor, no como mega-modal.

### 19. HISTORIAL DE COSTOS
El historial de costos registra cambios de costo relacionados con un proveedor y un producto.

Reglas:

- Se registra cuando cambia el ultimo costo de la relacion proveedor-producto.
- Se consulta desde Proveedores por proveedor-producto.
- No reemplaza el costo real de una compra.
- No debe mover inventario.
- No debe recalcular reportes por si mismo.
- Sirve para saber cuanto ha costado historicamente un producto con ese proveedor.

Persistencia:

- Tabla: `HistorialCostos`.
- Relaciona empresa, proveedor y producto.
- Conserva precio de compra, usuario y fecha.

### 20. ACTIVOS PRESTADOS
Los activos prestados representan equipo, exhibidores o materiales que el proveedor entrega a la tienda.

Tipos vigentes:

- ENFRIADOR.
- REFRIGERADOR.
- STAND.
- ANAQUEL.
- EXHIBIDOR.
- LONA.
- SOMBRILLA.
- BASCULA.
- OTRO.

Campos:

- Nombre.
- Tipo.
- Numero de serie.
- Fecha de entrega.
- Fecha de regreso.
- Estado fisico.
- Ubicacion en tienda.
- Condiciones del prestamo.
- Deposito o garantia.
- Estado operativo del activo.
- Notas.

Reglas:

- Activos prestados se muestra como vista interna del Drawer Workspace del proveedor, no como mega-modal.
- Agregar o editar activo navega a una vista dedicada dentro del mismo drawer.
- Fecha de entrega, una vez registrada, no debe modificarse.
- Fecha de regreso puede modificarse, pero debe quedar auditada.
- Nombre, tipo y numero de serie pueden editarse.
- Estado fisico no se modifica desde edicion simple; se modifica por incidente o cambio de estado.
- Ubicacion en tienda no se modifica desde edicion simple; se modifica por incidente o cambio de estado.
- Un activo debe conservar historial aunque el proveedor se inactive o archive.
- Un proveedor con activos no debe eliminarse fisicamente.

### 21. FLUJO DE ESTADOS DE ACTIVOS
Estados operativos:

- RECIBIDO.
- EN_TIENDA.
- EN_EXHIBICION.
- RETIRADO_DANO.
- REPARACION.
- DEVUELTO.
- PERDIDO.
- INACTIVO.

Transiciones permitidas:

- RECIBIDO -> EN_TIENDA, EN_EXHIBICION, RETIRADO_DANO, DEVUELTO.
- EN_TIENDA -> EN_EXHIBICION, RETIRADO_DANO, REPARACION, DEVUELTO, PERDIDO.
- EN_EXHIBICION -> EN_TIENDA, RETIRADO_DANO, REPARACION, DEVUELTO, PERDIDO.
- RETIRADO_DANO -> REPARACION, EN_TIENDA, EN_EXHIBICION, DEVUELTO, PERDIDO.
- REPARACION -> EN_TIENDA, EN_EXHIBICION, DEVUELTO, PERDIDO.
- DEVUELTO -> RECIBIDO, EN_TIENDA.
- PERDIDO -> RECIBIDO, EN_TIENDA.
- INACTIVO -> RECIBIDO, EN_TIENDA, EN_EXHIBICION.

Reglas:

- No se puede cambiar a un mismo estado.
- No se puede hacer una transicion fuera del flujo permitido.
- DEVUELTO y PERDIDO son estados finales para `estatus=false`.
- Cambiar estado puede actualizar estado fisico, ubicacion y fecha de regreso.
- Todo cambio de estado genera historial con antes/despues.

### 22. INCIDENTES DE ACTIVOS
Un incidente documenta algo relevante del activo sin cambiar necesariamente su estado operativo.

Usos:

- Rayones.
- Golpes.
- Fallas.
- Evidencia de mal uso.
- Cambio de estado fisico.
- Cambio de ubicacion por responsabilidad interna.
- Observaciones de entrega/recepcion.

Reglas:

- El detalle del incidente es obligatorio.
- Puede actualizar estado fisico.
- Puede actualizar ubicacion.
- Puede incluir evidencias fotograficas.
- No debe usarse edicion simple para ocultar cambios relevantes.
- El incidente conserva antes/despues, usuario, fecha y evidencia.

### 23. EVIDENCIAS DE ACTIVOS
Las evidencias son imagenes asociadas a un evento de historial del activo.

Reglas:

- Son opcionales.
- Puede haber multiples evidencias por evento.
- Maximo 6 evidencias por evento.
- Cada evidencia maximo 10 MB.
- Formatos permitidos: JPG, PNG y WebP.
- Se guardan en base de datos como base64, no en almacenamiento temporal.
- Deben poder previsualizarse.
- Deben poder descargarse.
- Deben conservarse aunque el activo, documento o proveedor se archive.

### 24. DOCUMENTOS
Documentos es el componente formal para respaldar contratos, comodatos, listas, evidencias y acuerdos.

Tipos vigentes:

- CONTRATO.
- COMODATO.
- LISTA_PRECIOS.
- CATALOGO.
- EVIDENCIA.
- DOCUMENTO_CREDITO.
- IDENTIFICACION.
- OTRO.

Estados:

- ACTIVO.
- INACTIVO.
- ARCHIVADO.

Reglas:

- Documentos se muestra como vista interna del Drawer Workspace del proveedor, no como mega-modal.
- Agregar o editar documento navega a una vista dedicada dentro del mismo drawer.
- Todo documento debe pertenecer a un proveedor.
- El activo relacionado no es obligatorio.
- Actualmente los documentos se guardan sin activo relacionado por defecto.
- No puede existir un documento sin archivo.
- No debe guardarse en almacenamiento temporal.
- El archivo se guarda en base de datos como base64.
- El nombre funcional lo captura el usuario.
- El formato se detecta automaticamente.
- El tamano se calcula, no se captura manualmente.
- Al archivar, conserva historial y archivo.
- Si esta inactivo, no permite editar, descargar ni versionar; solo consultar historial, reactivar o archivar definitivamente.
- Si esta archivado, queda como historial definitivo: no permite editar, descargar, versionar ni reactivar; solo consultar historial.
- Archivar es una salida definitiva y debe pedirse con confirmacion disenada.
- El estado del documento no se edita desde metadatos; se gestiona desde un flujo dedicado con confirmaciones.

Formatos permitidos:

- PDF.
- JPG.
- PNG.
- WebP.
- XLSX.
- XLS.
- CSV.
- DOCX.
- DOC.
- PPTX.
- PPT.
- TXT.

Limite:

- Maximo 25 MB por documento.

### 25. VERSIONES DE DOCUMENTOS
Un documento no debe permitir reemplazar archivo desde edicion normal.

Reglas:

- Edicion normal solo cambia metadatos: nombre, tipo, descripcion y estado.
- El archivo original queda protegido.
- Para subir una version firmada, corregida o actualizada se usa "Nueva version".
- Nueva version requiere motivo obligatorio.
- Nueva version requiere archivo obligatorio.
- El historial conserva archivo anterior y archivo nuevo.
- El usuario puede previsualizar version anterior y nueva antes de descargar.
- El historial registra quien hizo el cambio y fecha/hora.

Justificacion:

Cambiar un archivo sin traza podria ocultar contratos, comodatos o evidencias anteriores. Por eso todo reemplazo debe ser versionado y auditable.

### 26. VISTA PREVIA Y DESCARGA DE DOCUMENTOS
Reglas:

- Todo documento guardado en base de datos debe poder descargarse.
- PDF e imagenes deben tener vista previa visual.
- CSV y texto deben tener vista previa de contenido.
- Word, Excel y PowerPoint deben tener una vista previa informativa y descarga del archivo original.
- El usuario debe poder previsualizar archivos actuales y versiones historicas.

### 27. ACUERDOS COMERCIALES
El componente visual independiente de Acuerdos queda fuera de la experiencia vigente.

Regla vigente:

- Los tratos importantes deben registrarse como condiciones comerciales del proveedor o como documentos.
- Un contrato, comodato, acuerdo de credito, lista de precios firmada, convenio, carta o evidencia se captura en Documentos.
- La tabla y endpoints de `ProveedorAcuerdo` pueden existir por compatibilidad o legado, pero no son fuente operacional principal mientras no exista una especificacion nueva.
- No se debe reintroducir el componente Acuerdos en frontend sin una decision funcional nueva.

Ejemplos:

- "Credito a 7 dias" -> condicion comercial y, si hay respaldo, documento de credito.
- "Cambio por caducidad" -> condicion comercial y evidencia/documento si aplica.
- "Prestamo de enfriador con compra minima" -> activo prestado + comodato/documento.
- "Descuento por caja" -> lista de precios o documento.
- "Entrega lunes y jueves" -> abastecimiento.

### 28. AUDITORIA
Auditoria es un componente importante y no debe tratarse como nota secundaria.

Debe mostrar:

- Proveedor.
- Contactos.
- Productos asociados.
- Costos.
- Activos.
- Documentos.
- Estados.
- Incidentes.
- Versiones de documentos.
- Antes y despues cuando exista.
- Usuario.
- Fecha y hora.
- Origen del evento.
- Accion o estado resultante.

Reglas:

- La vista de detalle muestra resumen compacto.
- La vista interna de auditoria en Drawer Workspace muestra trazabilidad completa.
- El historial de costos se carga bajo demanda al abrir auditoria para no hacer pesada la pantalla principal.
- Auditoria no debe permitir editar.
- Auditoria debe ayudar al dueno a confiar en el sistema y detectar modificaciones relevantes.
- No debe poder maquillarse informacion critica sin dejar rastro.

### 29. MULTI-EMPRESA Y SEGURIDAD
Reglas:

- Toda informacion de Proveedores pertenece a una empresa.
- El backend debe filtrar por empresa activa.
- No se puede consultar proveedor de otra empresa.
- No se puede modificar subrecurso de proveedor de otra empresa.
- Documentos y evidencias deben respetar permisos.
- Las acciones peligrosas deben validar en backend, no solo frontend.

Campos de auditoria comunes:

- `fecha_creacion`.
- `fecha_modificacion`.
- `usuario_creacion`.
- `usuario_modificacion`.
- `estatus`.
- `id_empresa`.

### 30. PERSISTENCIA Y TABLAS PRINCIPALES
Tablas funcionales vigentes:

- `Proveedores`: datos generales, abastecimiento, condiciones y estado.
- `ProveedorContacto`: contactos y roles comerciales.
- `ProveedorProducto`: relacion proveedor-producto.
- `HistorialCostos`: historial de costos proveedor-producto.
- `ProveedorActivo`: activos prestados.
- `ProveedorActivoHistorial`: movimientos, incidentes y cambios de activos.
- `ProveedorActivoEvidencia`: imagenes asociadas a historial de activos.
- `ProveedorDocumento`: documentos guardados en base de datos.
- `ProveedorDocumentoHistorial`: cambios, archivo anterior/nuevo y versiones.
- `ProveedorAcuerdo`: legado/no protagonista en UI vigente.

Reglas:

- No crear tablas paralelas si ya existe entidad/repository/servicio.
- No almacenar documentos o evidencias en rutas temporales.
- No borrar historiales al archivar.
- No romper compatibilidad con datos existentes.

### 31. BACKEND - CONTRATO FUNCIONAL
Arquitectura obligatoria:

Controller -> Service interface -> ServiceImplement -> Repository.

Endpoints principales:

- `GET /proveedores`
- `GET /proveedores/page`
- `GET /proveedores/paginado`
- `GET /proveedores/{id}`
- `POST /proveedores`
- `PUT /proveedores/{id}`
- `PUT /proveedores/{id}/desactivar`
- `PUT /proveedores/{id}/archivar`
- `PUT /proveedores/{id}/reactivar`
- `GET /proveedores/{id}/eliminacion-segura`
- `DELETE /proveedores/{id}`

Subrecursos:

- `GET/POST/PUT/DELETE /proveedores/{id}/contactos`
- `GET/POST/PUT/DELETE /proveedores/{id}/productos`
- `GET /proveedores/{id}/productos/{idProveedorProducto}/historial-costos`
- `GET/POST/PUT/DELETE /proveedores/{id}/activos`
- `PUT /proveedores/{id}/activos/{idActivo}/estado`
- `POST /proveedores/{id}/activos/{idActivo}/incidentes`
- `GET/POST/PUT/DELETE /proveedores/{id}/documentos`
- `PUT /proveedores/{id}/documentos/{idDocumento}/version`

Reglas:

- Backend debe validar todo estado, tipo, formato, empresa y dependencia.
- Frontend no es fuente de seguridad.
- Delete fisico solo se permite con politica limpia.
- Archivar/desactivar deben conservar historial.

### 32. FRONTEND - COMPONENTES Y RESPONSABILIDAD
Componentes vigentes:

- `Proveedores.jsx`: orquestacion de pagina, carga, filtros, acciones seguras y Drawer Workspace.
- `ProveedoresSummary.jsx`: resumen operativo.
- `ProveedoresFilters.jsx`: busqueda y filtros.
- `ProveedoresTable.jsx`: tabla principal con acciones visibles prioritarias y menu `Mas acciones`.
- `ProveedorEditorPanel.jsx`: alta/edicion por secciones.
- `ProveedorWorkspaceDrawer.jsx`: pila interna de vistas del proveedor en un solo drawer fisico.
- `ProveedorDetailPanel.jsx`: vista de consulta completa reutilizable como contenido del workspace.
- `ProveedorProductosSection.jsx`: relacion producto-proveedor.
- `ProveedorProductoCostHistory.jsx`: historial de costos.
- `ProveedorActivosSection.jsx`: gestion de activos y vista de formulario reutilizable.
- `ProveedorActivoStateModal.jsx`: cambio de estado de activo.
- `ProveedorActivoIncidentModal.jsx`: incidente de activo.
- `ProveedorActivoEvidencePicker.jsx`: evidencias fotograficas.
- `ProveedorActivoHistoryModal.jsx`: historial del activo reutilizable como contenido interno y fallback modal.
- `ProveedorDocumentosSection.jsx`: documentos, preview, descarga, versionado, historial y vista de formulario reutilizable.
- `ProveedorAuditSection.jsx`: auditoria consolidada.
- `ProveedorAdvancedShared.jsx`: controles compartidos de secciones avanzadas.
- `../common/OverlaySurfaces.jsx`: base reusable para `WorkspaceDrawer` y `ModalSurface`.
- `proveedoresUtils.js`: normalizacion, filtros, payload de proveedor/contacto.
- `proveedorAdvancedUtils.js`: opciones, payloads y helpers avanzados.
- `proveedorEditorUtils.js`: telefono, correo, direccion, dias, horario y anticipacion.

Reglas:

- No crear archivos gigantes innecesarios.
- Separar logicas por componente.
- No meter todo en el detalle.
- El detalle consulta; la navegacion secundaria vive dentro del Drawer Workspace.
- Los modales especificos quedan reservados para acciones puntuales o previews justificadas.
- Mantener estilos en `src/style/components/Proveedores/Proveedores.css`.
- No usar CSS global innecesario.
- No introducir azul de Prime sin justificacion.

### 33. UX Y DISEÑO
La experiencia debe sentirse premium, limpia, rapida y practica.

Reglas visuales:

- Estilo GaltekOne.
- Verde de marca como color operativo.
- Sin borde azul nativo.
- Sin botones rojos agresivos como accion principal.
- Skeletons durante carga.
- Estado vacio por seccion.
- Estado sin resultados.
- Estado de error con reintento.
- Feedback claro al guardar.
- Botones compactos con icono y tooltip.
- Texto largo no debe romper layout.
- Paginacion compacta para evitar scroll innecesario.
- Los modales deben alinearse arriba cuando su contenido pueda crecer.

### 34. REGLAS DE SEED Y DATOS DE PRUEBA
El seed debe incluir variedad suficiente para probar:

- Proveedores activos, inactivos y archivados.
- Proveedores con y sin productos.
- Proveedores con activos.
- Activos con historial.
- Activos con evidencias.
- Documentos activos y archivados.
- Documentos con version nueva.
- Productos con historial de costos amplio.
- Productos con historial minimo.
- Contactos con distintos roles.

Regla: el seed de desarrollo puede simular escenarios, pero la base local no debe sobrescribirse silenciosamente si el usuario ya esta trabajando con datos persistentes.

### 35. QA FUNCIONAL MINIMO
QA debe validar escenarios reales:

1. Alta de proveedor informal sin RFC ni correo.
2. Alta de proveedor formal con razon social y RFC.
3. Validacion de telefono local y telefono con `+`.
4. Validacion de correo opcional.
5. Categoria existente y categoria "Otra".
6. Direccion estructurada con No. exterior e interior.
7. Dias de visita por semana.
8. Dias de visita por mes.
9. Horario por rango.
10. Hora especifica.
11. Anticipacion por horas/dias/minutos.
12. Condiciones de credito.
13. Tabla sin ultima actividad.
14. Acciones directas sin menu de mas opciones.
15. Desactivar proveedor con motivo.
16. Archivar proveedor con motivo.
17. Reactivar proveedor con motivo.
18. Intentar eliminar proveedor con dependencias.
19. Ver detalle solo consulta.
20. Ver productos asociados sin crear compra.
21. Ver historial de costos.
22. Desactivar y reactivar relacion producto-proveedor.
23. Agregar activo con evidencias opcionales.
24. Cambiar estado de activo con evidencia.
25. Registrar incidente sin cambiar estado operativo.
26. Ver historial de activo con antes/despues.
27. Agregar documento con archivo obligatorio.
28. Rechazar documento sin archivo.
29. Previsualizar PDF.
30. Previsualizar imagen.
31. Previsualizar CSV/texto.
32. Descargar Word/Excel/PowerPoint.
33. Registrar nueva version de documento con motivo.
34. Ver historial de documento con archivo anterior/nuevo.
35. Desactivar, reactivar y archivar documento con sus bloqueos.
36. Abrir auditoria y verificar eventos de todos los componentes.
37. Confirmar que ninguna accion de Proveedores aumenta stock.
38. Confirmar que ninguna accion de Proveedores crea compra.
39. Confirmar aislamiento por empresa.

### 36. REGLAS DE NO REGRESION
No se debe reintroducir:

- Tabla simple de contactos como concepto central.
- Modal pequeno de 4 campos para alta completa.
- Boton rojo de eliminar como accion principal.
- Eliminacion fisica sin revision backend.
- Acuerdos como seccion visual independiente sin nueva especificacion.
- Documentos sin archivo.
- Reemplazo de archivo sin nueva version auditada.
- Edicion directa de estado fisico o ubicacion de activos sin historial.
- Acciones escondidas en "mas opciones" si son esenciales.
- Scroll lateral innecesario en pantalla principal.
- Azul de Prime en focus/chips/checkboxes.
- Datos falsos calculados solo para llenar UI.

### 37. RESUMEN EJECUTIVO
Proveedores es el modulo que protege y ordena la relacion de abastecimiento de la tienda.

Su valor no esta en guardar nombres, sino en conservar contexto operativo: quien surte, como se pide, que productos maneja, que costo historico ha tenido, que equipo presto, que documentos existen y quien modifico cada cosa.

La informacion historica debe conservarse. La operacion debe ser rapida. La interfaz debe ser limpia. La logica debe impedir que un usuario destruya evidencias, historiales o relaciones comerciales por error.

### 38. CONTEXTO IA RELACIONADO - 2026-07-20
Este documento se conserva como base tecnica condicional del modulo Proveedores. Leerlo solo para Proveedores, abastecimiento o relaciones directamente vinculadas.

Cuando aplique, leer junto con el contexto nucleo definido en `README_CONTEXT.md`:

- `README_CONTEXT.md`
- `AI_CONTEXT.md`
- `DEVELOPMENT_RULES.md`
- `CODEX_WORKFLOW.md`
- La seccion relevante de `MODULES_STATUS.md`

Leer `PROJECT_HISTORY.md` solo si se necesitan cambios anteriores, decisiones historicas, commits o actualizar documentacion.

Todo cambio visual o de interaccion en este modulo debe respetar el estandar visual, de navegacion por teclado y velocidad operativa definido en `AI_CONTEXT.md` y `DEVELOPMENT_RULES.md`.

Regla de lectura: si el codigo actual contradice este documento, priorizar el codigo y marcar la diferencia como `pendiente de alinear`.

Notas de alineacion:

- Proveedores sigue siendo uno de los modulos mas avanzados del sistema, pero debe mantenerse como `Parcial funcional` hasta QA final.
- Las estructuras de acuerdos/proveedor detectadas en backend deben tratarse con cuidado. No promover acuerdos como seccion visual principal sin especificacion nueva y revision del frontend actual.
- Conservar eliminacion segura, historial, documentos versionados y trazabilidad como reglas de no regresion.
- Actualizacion documental 2026-07-20: los cambios recientes se concentraron en Caja/Ventas/Configuracion. No se detecto cambio funcional nuevo en Proveedores durante esta actualizacion; conservar este documento como contexto condicional vigente.
