# PRV-ARQ-001 - MODULO PROVEEDORES

### 1. PROPOSITO DEL DOCUMENTO
- **Documento:** PRV-ARQ-001.
- **Modulo:** Proveedores.
- **Producto:** GaltekOne POS de escritorio para tiendas pequenas y medianas.
- **Audiencia:** Producto, Backend, Frontend, QA, Soporte y analisis funcional.
- **Estado funcional:** Fuente de verdad para alcance, reglas de negocio y limites del modulo.

Este documento define las reglas definitivas del modulo Proveedores. Su objetivo es evitar que Proveedores se implemente o se pruebe como una simple tabla de contactos. En GaltekOne, Proveedores representa la relacion comercial de abastecimiento del negocio: quien surte, como se le pide, bajo que condiciones, que productos ofrece, que acuerdos existen, que documentos respaldan la relacion y que activos del proveedor estan asociados al comercio.

### 2. DEFINICION FUNCIONAL
- **Proveedor:** Persona, empresa, repartidor, establecimiento o canal comercial que puede abastecer mercancia, servicios relacionados con abastecimiento o activos comerciales al negocio.
- **Relacion comercial:** Conjunto de datos, contactos, productos asociados, condiciones, acuerdos, documentos, historiales de interaccion y activos que permiten al tendero operar con ese proveedor de forma rapida y confiable.
- **Abastecimiento:** Capacidad de obtener productos para venta o uso operativo. El abastecimiento puede ocurrir por entrega a domicilio, visita programada, compra en establecimiento, pedido por WhatsApp, llamada telefonica, portal, preventa, ruta o compra directa.

La experiencia funcional debe estar optimizada para tiendas reales: poco tiempo, alto volumen de decisiones pequenas, informacion incompleta y necesidad de encontrar rapidamente a quien llamar, que pedir, cuanto cuesta aproximadamente y bajo que condiciones conviene comprar.

### 3. PRINCIPIOS DEL MODULO
1. **Rapidez operativa:** El tendero debe encontrar y usar la informacion del proveedor en segundos.
2. **Claridad comercial:** El modulo debe responder quien surte, que surte, como contactar, cuando visita, que condiciones ofrece y que compromisos existen.
3. **Separacion de responsabilidades:** Proveedores administra relaciones comerciales; no registra compras ni mueve inventario.
4. **Historial protegido:** La informacion vinculada con compras, productos, activos, documentos o acuerdos no debe perderse por eliminaciones fisicas.
5. **Flexibilidad realista:** Debe soportar proveedores formales, informales, mixtos, establecimientos y repartidores independientes.
6. **Experiencia premium y practica:** La interfaz debe sentirse pulida, visualmente clara y de alta calidad, pero siempre al servicio de decisiones rapidas.

### 4. ALCANCE FUNCIONAL INCLUIDO
El modulo Proveedores debe administrar:

- Datos generales del proveedor.
- Tipo y clasificacion del proveedor.
- Canales de contacto y personas relacionadas.
- Condiciones comerciales.
- Productos asociados al proveedor.
- Precios de referencia o compra sugerida por proveedor-producto.
- Dias de visita, rutas, frecuencias y horarios de atencion.
- Formas de pedido: WhatsApp, llamada, visita, preventa, establecimiento, plataforma externa u otro medio.
- Condiciones de entrega: domicilio, recoleccion, entrega mixta, punto de venta o ruta.
- Condiciones de credito, pago y cobranza.
- Acuerdos comerciales: descuentos, bonificaciones, cambios por caducidad, pedido minimo, promociones, exclusividades, condiciones de prestamo o comodato.
- Activos del proveedor en el negocio: enfriadores, refrigeradores, stands, exhibidores, anaqueles, lonas, sombrillas u otros materiales.
- Documentos anexos: contratos, comodatos, listas de precios, catalogos, documentos de credito, evidencias, fotografias y comprobantes.
- Estado operativo del proveedor: activo, inactivo, archivado o bloqueado segun reglas del negocio.
- Observaciones utiles para operacion diaria.

### 5. ALCANCE FUNCIONAL EXCLUIDO
Proveedores no debe ejecutar responsabilidades de otros modulos:

- **No registra compras.** La captura de una entrada normal de mercancia pertenece a Compras.
- **No aumenta stock.** El incremento de inventario ocurre desde Compras o desde reglas explicitas del modulo Inventario.
- **No administra lotes.** Lotes, caducidades y ajustes pertenecen a Inventario.
- **No sustituye reportes.** Analisis profundo de desempeno, compras, rentabilidad, rotacion y tendencias pertenece a Reportes.
- **No sustituye cuentas por pagar.** Si existe un flujo futuro de pagos, abonos o deuda formal, debe documentarse como modulo financiero o extension especifica.
- **No borra historial comercial.** Los registros con dependencia historica deben conservarse mediante baja logica, archivo o desactivacion.

### 6. TIPOS DE PROVEEDOR SOPORTADOS
El modulo debe contemplar al menos los siguientes casos reales:

1. **Proveedor formal:** Empresas con operacion estructurada como Coca-Cola, Lala, Sabritas, Bimbo, Barcel u otras marcas.
2. **Proveedor informal:** Persona o negocio que atiende por WhatsApp, llamada o trato directo, sin contrato formal.
3. **Repartidor independiente:** Persona que surte productos en ruta, por encargo o por visita.
4. **Establecimiento de compra:** Lugares donde el tendero va a comprar: central de abasto, mercado, bodega, cremeria, Aurrera, Sam's, club de precios o mayoreo.
5. **Proveedor a domicilio:** Entrega en tienda, por ruta, preventa o reparto programado.
6. **Proveedor mixto:** Permite tanto entrega a domicilio como recoleccion o compra directa.
7. **Proveedor eventual:** Se usa ocasionalmente para cubrir faltantes, temporadas o emergencias.

El tipo de proveedor no debe limitar el registro; debe ayudar a filtrar, ordenar, entender la relacion y presentar campos relevantes.

### 7. CONTACTOS Y ROLES COMERCIALES
Un proveedor puede tener uno o varios contactos. No debe asumirse que existe una sola persona de contacto.

Contactos esperados:

- Vendedor.
- Preventista.
- Repartidor.
- Cobranza.
- Atencion a clientes.
- Encargado del establecimiento.
- Ejecutivo de cuenta.
- Contacto de credito.
- Contacto de emergencias.
- Contacto generico de WhatsApp o telefono.

Datos minimos recomendados por contacto:

- Nombre o alias operativo.
- Rol del contacto.
- Telefono.
- WhatsApp.
- Correo, si aplica.
- Horario de atencion.
- Notas practicas.
- Indicador de contacto principal.

Regla funcional: si el proveedor es informal y solo existe un numero de WhatsApp o telefono, el sistema debe permitir registrarlo sin exigir estructura corporativa innecesaria.

### 8. DATOS COMERCIALES DEL PROVEEDOR
Proveedores debe permitir documentar la informacion que afecta la operacion de abastecimiento:

- Nombre comercial.
- Razon social, si aplica.
- Alias de busqueda o nombre corto.
- Tipo de proveedor.
- Giro o categoria principal.
- Direccion o zona de atencion.
- Canales de pedido.
- Metodo preferido de contacto.
- Dias de visita o entrega.
- Frecuencia de visita.
- Horarios de atencion.
- Tiempo estimado de entrega.
- Pedido minimo.
- Condiciones de pago.
- Condiciones de credito.
- Politicas de devolucion o cambio.
- Politicas de cambios por caducidad.
- Descuentos o bonificaciones.
- Restricciones comerciales.
- Observaciones internas.
- Estado operativo.

La informacion debe poder capturarse de forma incremental. El tendero no siempre conoce todos los datos al dar de alta un proveedor.

### 9. PRODUCTOS ASOCIADOS
Proveedores puede asociar productos que normalmente surte o puede surtir. Esta asociacion sirve para consulta, planeacion y decision comercial.

Reglas:

- Asociar un producto a un proveedor no debe crear compra.
- Asociar un producto a un proveedor no debe aumentar stock.
- Asociar un producto a un proveedor no debe crear lote.
- El precio asociado debe entenderse como referencia, ultimo precio conocido, precio negociado o precio sugerido, segun la definicion funcional vigente.
- Un producto puede estar asociado a varios proveedores.
- Un proveedor puede estar asociado a varios productos.
- La asociacion debe poder marcarse activa o inactiva sin perder historial.

Ejemplos de uso:

- Saber que proveedor surte un producto.
- Comparar proveedores para un producto.
- Recordar precio de compra aproximado.
- Identificar proveedor alternativo si el principal no atiende.
- Sugerir proveedor al iniciar una compra.

### 10. ACUERDOS COMERCIALES
Los acuerdos comerciales representan condiciones pactadas o entendidas con el proveedor. Pueden ser formales o informales.

Tipos de acuerdos:

- Credito.
- Dias de pago.
- Limite de credito.
- Pedido minimo.
- Descuento por volumen.
- Bonificacion.
- Cambio por caducidad.
- Cambio por producto danado.
- Promocion temporal.
- Exclusividad.
- Prestamo o comodato de activo.
- Condiciones de exhibicion.
- Condiciones de entrega.
- Condiciones de devolucion.

Reglas:

- Los acuerdos deben tener vigencia cuando aplique.
- Un acuerdo vencido no debe eliminarse automaticamente; debe conservarse para consulta historica.
- Los acuerdos deben poder archivarse o desactivarse.
- Si un acuerdo afecta compras, el modulo Compras puede consultarlo, pero no debe modificarlo sin una regla explicita.
- Si un acuerdo afecta reportes, Reportes debe consumir la informacion sin redefinir la regla.

### 11. ACTIVOS PRESTADOS O COMODATADOS
El modulo debe soportar activos del proveedor ubicados en la tienda o bajo responsabilidad del negocio.

Ejemplos:

- Enfriadores.
- Refrigeradores.
- Stands.
- Exhibidores.
- Anaqueles.
- Lonas.
- Sombrillas.
- Charolas.
- Material POP.
- Equipo temporal de temporada.

Datos recomendados:

- Tipo de activo.
- Descripcion.
- Identificador, serie o placa, si existe.
- Estado fisico.
- Fecha de entrega.
- Fecha de devolucion esperada, si aplica.
- Condiciones de uso.
- Responsable o contacto del proveedor.
- Ubicacion dentro de la tienda.
- Evidencias fotograficas.
- Documento de comodato relacionado.
- Estado: activo, devuelto, danado, perdido, retirado o archivado.

Regla funcional: un proveedor con activos asociados no debe eliminarse fisicamente. La relacion debe conservarse para proteger responsabilidades y evidencia.

### 12. DOCUMENTOS Y ANEXOS
El modulo debe permitir relacionar documentos que respalden o faciliten la operacion con el proveedor.

Tipos de documento:

- Contrato.
- Comodato.
- Lista de precios.
- Catalogo.
- Documento de credito.
- Identificacion o datos fiscales, si aplica.
- Evidencia fotografica.
- Comprobante de entrega de activo.
- Conversacion o captura relevante.
- Carta, convenio o acuerdo.

Reglas:

- Los documentos deben pertenecer a un proveedor.
- Un documento puede relacionarse con un acuerdo, activo o producto asociado si aplica.
- Debe conservarse metadato minimo: nombre, tipo, fecha, observacion y usuario que lo registro.
- Los documentos no deben perderse por desactivar o archivar un proveedor.
- El modulo no debe depender de documentos obligatorios para proveedores informales.

### 13. ESTADOS DEL PROVEEDOR
Estados funcionales esperados:

- **Activo:** Disponible para consulta, asociacion de productos y uso operativo.
- **Inactivo:** No se usa actualmente, pero conserva historial y puede reactivarse.
- **Archivado:** Relacion historica que ya no debe aparecer por defecto en operacion diaria.
- **Bloqueado o restringido:** Proveedor que no debe usarse temporalmente por deuda, conflicto, calidad, incumplimiento u otra causa interna.

Reglas:

- La vista operativa debe priorizar proveedores activos.
- Inactivos y archivados deben seguir disponibles mediante filtros.
- Reactivar un proveedor debe conservar su informacion historica.
- El cambio de estado debe registrar usuario y fecha de modificacion.
- La eliminacion fisica solo puede permitirse si no existen compras historicas, productos asociados, activos, documentos, acuerdos u otra relacion de negocio.

### 14. REGLAS DE ELIMINACION Y CONSERVACION
Regla central: un proveedor con historia o dependencias comerciales no debe eliminarse fisicamente.

Debe bloquearse la eliminacion fisica cuando exista al menos una de estas condiciones:

- Compras historicas.
- Productos asociados.
- Activos asociados.
- Documentos anexos.
- Acuerdos comerciales.
- Evidencias.
- Referencias en reportes, auditoria, movimientos o configuraciones.
- Cualquier relacion que sea necesaria para explicar una operacion pasada.

Acciones permitidas:

- Desactivar.
- Archivar.
- Marcar como restringido.
- Editar datos no historicos.
- Agregar observaciones.
- Reactivar, si el negocio lo permite.

Si se permite eliminacion fisica para un proveedor sin dependencias, debe tratarse como caso excepcional y no como flujo principal.

### 15. RELACION CON OTROS MODULOS
#### Compras
- Registra entradas normales de mercancia.
- Puede seleccionar proveedor.
- Puede consultar productos asociados, condiciones o precios de referencia.
- Es responsable de cantidades compradas, costo real de la compra y documento de compra.
- Es el modulo que puede disparar incremento de inventario cuando la compra se confirme.

#### Inventario
- Administra stock, lotes, caducidades y ajustes.
- Puede consultar proveedor asociado para trazabilidad o referencia.
- No debe delegar movimientos de stock al modulo Proveedores.

#### Reportes
- Analiza compras por proveedor, frecuencia, gasto, rentabilidad, rotacion, desempeno y comparativos.
- Puede usar datos de Proveedores como dimension de analisis.
- No debe redefinir datos maestros del proveedor.

#### Productos
- Define el catalogo de productos.
- Puede exponer asociaciones proveedor-producto.
- No debe convertir la asociacion en compra o stock.

#### Configuracion / Seguridad
- Define permisos de acceso, roles y visibilidad si aplica.
- Puede controlar quien crea, edita, archiva o consulta documentos sensibles.

### 16. EXPERIENCIA DE USUARIO ESPERADA
La experiencia de Proveedores debe reflejar el objetivo del producto: rapidez, claridad, utilidad real y perfeccion visual.

La vista principal debe permitir:

- Buscar por nombre, alias, contacto, telefono, WhatsApp, producto, categoria o tipo.
- Filtrar por activo, inactivo, archivado, tipo, forma de entrega, dia de visita o categoria.
- Identificar rapidamente proveedor, contacto principal, forma de pedido y estado.
- Abrir acciones rapidas: llamar, WhatsApp, editar, ver productos, ver acuerdos, ver activos, ver documentos.
- Distinguir proveedores de ruta, establecimientos y proveedores mixtos.
- Evitar saturacion visual: mostrar lo esencial primero y permitir profundidad progresiva.

La ficha del proveedor debe organizarse en secciones claras:

- Resumen.
- Contactos.
- Productos.
- Condiciones y acuerdos.
- Activos.
- Documentos.
- Historial o notas.

El estilo visual debe ser premium y pulido, pero nunca debe sacrificar legibilidad, velocidad o eficiencia de captura.

### 17. REGLAS DE CAPTURA Y VALIDACION
Reglas generales:

- El nombre comercial o alias debe ser obligatorio.
- Debe existir al menos un medio de contacto o una direccion/ubicacion util.
- El sistema debe permitir proveedores informales sin correo.
- El sistema debe permitir establecimientos donde no hay contacto personal definido.
- La direccion puede representar domicilio, zona de entrega, sucursal o lugar de compra.
- Los campos corporativos no deben bloquear el alta de proveedores informales.
- Debe prevenirse duplicidad evidente por nombre, telefono o alias, sin impedir casos legitimos.
- Los datos sensibles o documentos deben respetar permisos.

Validaciones sugeridas:

- Telefono y WhatsApp deben aceptar formatos locales comunes.
- Correo debe validarse solo si se captura.
- Pedido minimo, limite de credito y precios deben ser numericos cuando existan.
- Fechas de vigencia no deben ser inconsistentes.
- Estados inactivos o archivados deben requerir motivo cuando aplique.

### 18. CONSULTA, BUSQUEDA Y FILTROS
Busquedas esperadas:

- Nombre comercial.
- Alias.
- Contacto.
- Telefono.
- WhatsApp.
- Correo.
- Direccion.
- Producto asociado.
- Tipo de proveedor.
- Dia de visita.
- Estado.

Filtros esperados:

- Activos.
- Inactivos.
- Archivados.
- Formales.
- Informales.
- Repartidores.
- Establecimientos.
- Entrega a domicilio.
- Recoleccion o compra directa.
- Mixtos.
- Con credito.
- Con activos.
- Con documentos.
- Con acuerdos vigentes.

La busqueda debe priorizar resultados utiles para operacion diaria. Por defecto, la vista no debe mezclar proveedores archivados con proveedores activos salvo que el usuario lo solicite.

### 19. AUDITORIA Y MULTI-EMPRESA
Reglas:

- Toda informacion de Proveedores pertenece a una empresa.
- Un usuario no debe consultar ni modificar proveedores de otra empresa.
- Las altas, modificaciones, cambios de estado, documentos, acuerdos y activos deben conservar auditoria de usuario y fecha.
- La baja logica o archivo debe registrar quien la hizo y cuando.
- La informacion historica debe permanecer disponible para trazabilidad y soporte.

### 20. CRITERIOS DE ACEPTACION FUNCIONAL
El modulo se considera correctamente definido cuando cumple estos criterios:

1. Permite representar proveedores formales, informales, repartidores, establecimientos y proveedores mixtos.
2. Permite registrar mas de un contacto con roles comerciales diferentes.
3. Permite asociar productos sin crear compras ni mover inventario.
4. Permite documentar condiciones, acuerdos, credito, descuentos, pedido minimo, visitas y cambios por caducidad.
5. Permite registrar activos prestados o comodatos.
6. Permite anexar documentos y evidencias.
7. Mantiene separacion clara con Compras, Inventario y Reportes.
8. Evita eliminacion fisica cuando existe historial o dependencias.
9. Permite desactivar, archivar o restringir proveedores sin perder informacion.
10. Permite busqueda y filtros utiles para el dia a dia de una tienda.
11. Soporta captura incompleta pero operativamente suficiente.
12. Mantiene datos aislados por empresa.

### 21. CRITERIOS DE QA
QA debe validar el modulo desde escenarios reales de tienda, no solo desde CRUD basico.

Escenarios minimos:

1. Alta de proveedor formal con varios contactos.
2. Alta de proveedor informal con solo WhatsApp.
3. Alta de establecimiento de compra sin contacto personal.
4. Alta de repartidor independiente.
5. Alta de proveedor mixto con entrega y recoleccion.
6. Asociacion de producto a proveedor sin crear compra ni stock.
7. Registro de precio de referencia sin alterar costo historico de compras.
8. Registro de acuerdo de credito.
9. Registro de cambio por caducidad.
10. Registro de activo prestado con evidencia.
11. Registro de documento anexo.
12. Desactivacion de proveedor con productos asociados.
13. Intento de eliminacion fisica de proveedor con dependencias.
14. Reactivacion de proveedor inactivo.
15. Busqueda por telefono, contacto, producto y tipo.
16. Filtro de archivados fuera de la vista principal.
17. Validacion de aislamiento por empresa.

### 22. REGLAS PARA IMPLEMENTACION FUTURA
Las implementaciones futuras deben respetar estas reglas:

- No convertir Proveedores en un flujo de compras.
- No mover stock desde Proveedores.
- No eliminar fisicamente registros con dependencias.
- No exigir correo, razon social o campos corporativos a proveedores informales.
- No ocultar historial por cambios de estado.
- No duplicar analitica que pertenece a Reportes.
- No guardar acuerdos, activos o documentos como texto plano unico si requieren consulta, filtros o trazabilidad.
- No mezclar productos asociados con entradas reales de mercancia.
- No asumir que el proveedor siempre entrega; a veces el tendero compra en establecimiento.

### 23. RESUMEN EJECUTIVO
Proveedores es el centro de administracion de relaciones de abastecimiento de GaltekOne. Debe ayudar al tendero a saber quien le surte, como pedir, que condiciones existen, que productos puede comprar, que activos tiene prestados y que documentos respaldan la relacion.

La regla mas importante es la separacion de responsabilidades: Proveedores administra la relacion comercial; Compras registra entradas de mercancia; Inventario controla stock, lotes y ajustes; Reportes analiza desempeno.

Un proveedor con historia comercial no se borra: se desactiva, archiva o restringe. Esta regla protege la trazabilidad del negocio y evita perdida de informacion relevante para compras, inventario, auditoria, soporte y analisis.
