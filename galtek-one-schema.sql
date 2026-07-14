PRAGMA foreign_keys = ON;

-- Galtek One SQLite schema.
-- Run this before galtek-one-seed.sql. All tables are idempotent.

CREATE TABLE IF NOT EXISTS Almacen (id_almacen integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), direccion varchar(255) not null, nombre varchar(255), id_empresa integer not null, primary key (id_almacen));

CREATE TABLE IF NOT EXISTS Cajas (id_caja integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre varchar(255), tipo varchar(255) not null, id_empresa integer not null, primary key (id_caja));

CREATE TABLE IF NOT EXISTS Categorias (id_categoria integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre varchar(255), id_empresa integer not null, primary key (id_categoria));

CREATE TABLE IF NOT EXISTS Clientes (id_cliente integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), avatar varchar(255), direccion varchar(255), email varchar(255), nombre varchar(255) not null, telefono varchar(255), alias varchar(255), tipo_cliente varchar(255), estado_cliente varchar(255), estado_cliente_anterior varchar(255), ultima_accion_estado varchar(255), motivo_cambio_estado varchar(500), usuario_cambio_estado varchar(255), fecha_cambio_estado timestamp, whatsapp varchar(255), direccion_calle varchar(255), direccion_numero_exterior varchar(255), direccion_numero_interior varchar(255), direccion_colonia varchar(255), direccion_municipio varchar(255), direccion_estado varchar(255), direccion_codigo_postal varchar(255), direccion_referencia varchar(1000), notas_internas varchar(2000), rfc varchar(255), razon_social varchar(255), codigo_postal_fiscal varchar(255), correo_fiscal varchar(255), regimen_fiscal varchar(255), uso_cfdi varchar(255), id_empresa integer, primary key (id_cliente));
ALTER TABLE Clientes ADD COLUMN alias varchar(255);
ALTER TABLE Clientes ADD COLUMN tipo_cliente varchar(255);
ALTER TABLE Clientes ADD COLUMN estado_cliente varchar(255);
ALTER TABLE Clientes ADD COLUMN estado_cliente_anterior varchar(255);
ALTER TABLE Clientes ADD COLUMN ultima_accion_estado varchar(255);
ALTER TABLE Clientes ADD COLUMN motivo_cambio_estado varchar(500);
ALTER TABLE Clientes ADD COLUMN usuario_cambio_estado varchar(255);
ALTER TABLE Clientes ADD COLUMN fecha_cambio_estado timestamp;
ALTER TABLE Clientes ADD COLUMN whatsapp varchar(255);
ALTER TABLE Clientes ADD COLUMN direccion_calle varchar(255);
ALTER TABLE Clientes ADD COLUMN direccion_numero_exterior varchar(255);
ALTER TABLE Clientes ADD COLUMN direccion_numero_interior varchar(255);
ALTER TABLE Clientes ADD COLUMN direccion_colonia varchar(255);
ALTER TABLE Clientes ADD COLUMN direccion_municipio varchar(255);
ALTER TABLE Clientes ADD COLUMN direccion_estado varchar(255);
ALTER TABLE Clientes ADD COLUMN direccion_codigo_postal varchar(255);
ALTER TABLE Clientes ADD COLUMN direccion_referencia varchar(1000);
ALTER TABLE Clientes ADD COLUMN notas_internas varchar(2000);
ALTER TABLE Clientes ADD COLUMN rfc varchar(255);
ALTER TABLE Clientes ADD COLUMN razon_social varchar(255);
ALTER TABLE Clientes ADD COLUMN codigo_postal_fiscal varchar(255);
ALTER TABLE Clientes ADD COLUMN correo_fiscal varchar(255);
ALTER TABLE Clientes ADD COLUMN regimen_fiscal varchar(255);
ALTER TABLE Clientes ADD COLUMN uso_cfdi varchar(255);

CREATE TABLE IF NOT EXISTS CompraDetalle (id_compra_detalle integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), cantidad integer not null, precio_unitario numeric(9,2) not null, subtotal numeric(9,2) not null, id_compra integer not null, id_producto integer not null unique, primary key (id_compra_detalle));

CREATE TABLE IF NOT EXISTS Compras (id_compra integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), fecha_compra timestamp, ticket_proveedor blob not null, total_compra numeric(38,2), id_proveedor integer not null, id_usuario integer not null, id_empresa integer not null, primary key (id_compra));

CREATE TABLE IF NOT EXISTS Devoluciones (id_devolucion integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), motivo varchar(255) not null, total_devolucion numeric(9,2) not null, id_empresa integer not null, id_venta integer not null unique, primary key (id_devolucion));

CREATE TABLE IF NOT EXISTS DevolucionesDetalle (id_devolucion_detalle integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), cantidad_devuelta integer, subtotal_devuelto numeric(38,2), id_devolucion integer not null, id_producto integer not null, primary key (id_devolucion_detalle));

CREATE TABLE IF NOT EXISTS Empresas (id_empresa integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), direccion varchar(255) not null, direccion_calle varchar(255), direccion_numero_exterior varchar(60), direccion_numero_interior varchar(60), direccion_colonia varchar(255), direccion_municipio varchar(255), direccion_estado varchar(255), direccion_codigo_postal varchar(30), direccion_referencia varchar(500), fecha_fin date, fecha_inicio date not null, nombre varchar(255), razon_social varchar(255), rfc varchar(255), telefono varchar(255), whatsapp varchar(255), correo varchar(255), horario_operacion varchar(255), horario_config text, horario_lunes_viernes_apertura varchar(10), horario_lunes_viernes_cierre varchar(10), horario_sabado_domingo_apertura varchar(10), horario_sabado_domingo_cierre varchar(10), horario_sabado_domingo_cerrado boolean, horario_notas varchar(255), moneda varchar(10), zona_horaria varchar(80), ticket_mensaje varchar(500), logo_nombre varchar(255), logo_mime_type varchar(100), logo_base64 text, token_licencia varchar(255), id_tipo_suscripcion integer not null, primary key (id_empresa));

CREATE TABLE IF NOT EXISTS ConfiguracionTicket (id_configuracion_ticket integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), id_empresa integer not null, paper_size varchar(10), density varchar(20), font_size varchar(20), separator_style varchar(20), alignment varchar(20), default_printer_name varchar(255), copies integer, auto_print boolean, ask_before_print boolean, allow_reprint boolean, show_logo boolean, footer_message varchar(120), template_json text, primary key (id_configuracion_ticket));
CREATE UNIQUE INDEX IF NOT EXISTS ux_configuracion_ticket_empresa ON ConfiguracionTicket(id_empresa);

ALTER TABLE Empresas ADD COLUMN razon_social varchar(255);
ALTER TABLE Empresas ADD COLUMN rfc varchar(255);
ALTER TABLE Empresas ADD COLUMN telefono varchar(255);
ALTER TABLE Empresas ADD COLUMN whatsapp varchar(255);
ALTER TABLE Empresas ADD COLUMN correo varchar(255);
ALTER TABLE Empresas ADD COLUMN direccion_calle varchar(255);
ALTER TABLE Empresas ADD COLUMN direccion_numero_exterior varchar(60);
ALTER TABLE Empresas ADD COLUMN direccion_numero_interior varchar(60);
ALTER TABLE Empresas ADD COLUMN direccion_colonia varchar(255);
ALTER TABLE Empresas ADD COLUMN direccion_municipio varchar(255);
ALTER TABLE Empresas ADD COLUMN direccion_estado varchar(255);
ALTER TABLE Empresas ADD COLUMN direccion_codigo_postal varchar(30);
ALTER TABLE Empresas ADD COLUMN direccion_referencia varchar(500);
ALTER TABLE Empresas ADD COLUMN horario_operacion varchar(255);
ALTER TABLE Empresas ADD COLUMN horario_config text;
ALTER TABLE Empresas ADD COLUMN horario_lunes_viernes_apertura varchar(10);
ALTER TABLE Empresas ADD COLUMN horario_lunes_viernes_cierre varchar(10);
ALTER TABLE Empresas ADD COLUMN horario_sabado_domingo_apertura varchar(10);
ALTER TABLE Empresas ADD COLUMN horario_sabado_domingo_cierre varchar(10);
ALTER TABLE Empresas ADD COLUMN horario_sabado_domingo_cerrado boolean;
ALTER TABLE Empresas ADD COLUMN horario_notas varchar(255);
ALTER TABLE Empresas ADD COLUMN moneda varchar(10);
ALTER TABLE Empresas ADD COLUMN zona_horaria varchar(80);
ALTER TABLE Empresas ADD COLUMN ticket_mensaje varchar(500);
ALTER TABLE Empresas ADD COLUMN logo_nombre varchar(255);
ALTER TABLE Empresas ADD COLUMN logo_mime_type varchar(100);
ALTER TABLE Empresas ADD COLUMN logo_base64 text;

CREATE TABLE IF NOT EXISTS EntradasSalidas (id_registro integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), fecha_hora timestamp not null, tipo varchar(255) not null, id_empresa integer not null, id_usuario integer not null, primary key (id_registro));

CREATE TABLE IF NOT EXISTS EstadoStock (id_estado_stock integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre_estado varchar(50) not null, orden integer not null, id_empresa integer not null, primary key (id_estado_stock));

CREATE TABLE IF NOT EXISTS HistorialCostos (id_historial_costos integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), precio_compra integer not null, id_empresa integer not null, id_producto integer not null, id_proveedor integer not null, primary key (id_historial_costos));

CREATE TABLE IF NOT EXISTS Inventario (id_inventario integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), existencia numeric(10,3) not null, fecha_ultima_compra timestamp not null, id_almacen integer not null, id_empresa integer not null, id_producto integer not null, primary key (id_inventario));

CREATE TABLE IF NOT EXISTS Lote (id_lote integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), cantidad numeric(38,2) not null, fecha_caducidad date, id_almacen integer not null, id_empresa integer not null, id_producto integer not null, primary key (id_lote));

CREATE TABLE IF NOT EXISTS MetodoPago (id_metodo_pago integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre varchar(255), id_empresa integer not null, primary key (id_metodo_pago));

CREATE TABLE IF NOT EXISTS MovimientoCaja (id_movimiento_caja integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), fecha timestamp not null, monto numeric(12,2) not null, motivo varchar(255) not null, tipo varchar(10) not null, id_caja integer not null, id_empresa integer not null, id_usuario integer not null, primary key (id_movimiento_caja));

CREATE TABLE IF NOT EXISTS Permisos (id_permiso integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), accion varchar(40), clave varchar(80) not null, descripcion varchar(255), modulo varchar(60) not null, nombre varchar(120) not null, primary key (id_permiso));

CREATE TABLE IF NOT EXISTS ProductoEstadoStock (id_producto_estado_stock integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), maximo numeric(38,2) not null, minimo numeric(38,2) not null, id_empresa integer not null, id_estado_stock integer not null, id_producto integer not null, primary key (id_producto_estado_stock));

CREATE TABLE IF NOT EXISTS Productos (id_producto integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), codigo_barras varchar(255) not null, descripcion varchar(255) not null, direccion varchar(255) not null, es_pesaje boolean not null, imagen varchar(255), nombre varchar(255) not null, precio_venta float not null, id_categoria integer not null, id_empresa integer not null, id_unidad integer not null, primary key (id_producto));

CREATE TABLE IF NOT EXISTS ProveedorProducto (id_proveedor_producto integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), precio_compra float, sku_proveedor varchar(255), ultimo_costo numeric(12,2), fecha_ultimo_costo timestamp, presentacion_compra varchar(255), cantidad_minima numeric(12,3), proveedor_preferido boolean, estado_relacion varchar(255), id_empresa integer not null, id_producto integer not null, id_proveedor integer not null, primary key (id_proveedor_producto));

CREATE TABLE IF NOT EXISTS Proveedores (id_proveedor integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), contacto varchar(255), correo varchar(255), direccion varchar(255), nombre varchar(255) not null, telefono varchar(255), razon_social varchar(255), rfc varchar(255), tipo_proveedor varchar(255), categoria_principal varchar(255), estado_proveedor varchar(255), estado_proveedor_anterior varchar(255), ultima_accion_estado varchar(255), motivo_cambio_estado varchar(500), usuario_cambio_estado varchar(255), fecha_cambio_estado timestamp, notas_internas varchar(2000), modalidad_abastecimiento varchar(255), pedido_whatsapp boolean, pedido_llamada boolean, pedido_app boolean, visita_ruta boolean, compra_mostrador boolean, dias_visita_entrega varchar(255), horario_habitual varchar(255), pedido_minimo numeric(12,2), tiempo_estimado_entrega varchar(255), costo_envio numeric(12,2), observaciones_abastecimiento varchar(2000), forma_pago_principal varchar(255), maneja_credito boolean, dias_credito integer, limite_credito numeric(12,2), permite_devoluciones boolean, cambios_caducidad boolean, bonificaciones boolean, descuentos_frecuentes boolean, notas_comerciales varchar(2000), id_empresa integer not null, primary key (id_proveedor));

CREATE TABLE IF NOT EXISTS ProveedorContacto (id_proveedor_contacto integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre varchar(255) not null, rol varchar(255), telefono varchar(255), whatsapp varchar(255), correo varchar(255), notas varchar(2000), contacto_principal boolean, estado_contacto varchar(255), id_proveedor integer not null, id_empresa integer not null, primary key (id_proveedor_contacto));

CREATE TABLE IF NOT EXISTS ProveedorActivo (id_proveedor_activo integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre varchar(255) not null, tipo varchar(255), numero_serie varchar(255), fecha_entrega date, fecha_regreso date, estado_fisico varchar(255), ubicacion_tienda varchar(255), condiciones_prestamo varchar(2000), deposito_garantia numeric(12,2), estado_activo_prestado varchar(255), notas varchar(2000), id_proveedor integer not null, id_empresa integer not null, primary key (id_proveedor_activo));

ALTER TABLE ProveedorActivo ADD COLUMN fecha_regreso date;

CREATE TABLE IF NOT EXISTS ProveedorActivoHistorial (id_proveedor_activo_historial integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), tipo_evento varchar(255) not null, estado_anterior varchar(255), estado_nuevo varchar(255), descripcion varchar(2000), detalle_anterior varchar(4000), detalle_nuevo varchar(4000), fecha_evento timestamp, evidencia_nombre varchar(255), evidencia_mime_type varchar(255), evidencia_base64 text, evidencia_tamano_bytes integer, id_proveedor_activo integer not null, id_proveedor integer not null, id_empresa integer not null, primary key (id_proveedor_activo_historial));

ALTER TABLE ProveedorActivoHistorial ADD COLUMN evidencia_nombre varchar(255);
ALTER TABLE ProveedorActivoHistorial ADD COLUMN evidencia_mime_type varchar(255);
ALTER TABLE ProveedorActivoHistorial ADD COLUMN evidencia_base64 text;
ALTER TABLE ProveedorActivoHistorial ADD COLUMN evidencia_tamano_bytes integer;
ALTER TABLE ProveedorActivoHistorial ADD COLUMN detalle_anterior varchar(4000);
ALTER TABLE ProveedorActivoHistorial ADD COLUMN detalle_nuevo varchar(4000);

CREATE TABLE IF NOT EXISTS ProveedorActivoEvidencia (id_proveedor_activo_evidencia integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), evidencia_nombre varchar(255), evidencia_mime_type varchar(255), evidencia_base64 text, evidencia_tamano_bytes integer, id_proveedor_activo_historial integer not null, id_empresa integer not null, primary key (id_proveedor_activo_evidencia));

CREATE TABLE IF NOT EXISTS ProveedorDocumento (id_proveedor_documento integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre varchar(255) not null, tipo varchar(255), ruta_documento varchar(255), archivo_nombre varchar(255), mime_type varchar(255), tamano_bytes integer, archivo_base64 text, descripcion varchar(2000), estado_documento varchar(255), id_proveedor integer not null, id_proveedor_activo integer, id_empresa integer not null, primary key (id_proveedor_documento));

ALTER TABLE ProveedorDocumento ADD COLUMN archivo_nombre varchar(255);
ALTER TABLE ProveedorDocumento ADD COLUMN archivo_base64 text;

CREATE TABLE IF NOT EXISTS ProveedorDocumentoHistorial (id_proveedor_documento_historial integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), id_proveedor_documento integer not null, id_proveedor integer not null, tipo_evento varchar(255) not null, descripcion varchar(2000), detalle_anterior varchar(4000), detalle_nuevo varchar(4000), fecha_evento timestamp, archivo_anterior_nombre varchar(255), archivo_anterior_mime_type varchar(255), archivo_anterior_tamano_bytes integer, archivo_anterior_base64 text, archivo_nuevo_nombre varchar(255), archivo_nuevo_mime_type varchar(255), archivo_nuevo_tamano_bytes integer, archivo_nuevo_base64 text, id_empresa integer not null, primary key (id_proveedor_documento_historial));

CREATE TABLE IF NOT EXISTS ProveedorAcuerdo (id_proveedor_acuerdo integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), tipo varchar(255), descripcion varchar(2000) not null, fecha_inicio date, fecha_vigencia date, estado_acuerdo varchar(255), notas varchar(2000), id_proveedor integer not null, id_proveedor_documento integer, id_empresa integer not null, primary key (id_proveedor_acuerdo));

UPDATE ProveedorAcuerdo
SET id_proveedor_documento = NULL
WHERE id_proveedor_documento IN (
  SELECT id_proveedor_documento
  FROM ProveedorDocumento
  WHERE archivo_base64 IS NULL OR TRIM(archivo_base64) = ''
);

DELETE FROM ProveedorDocumento
WHERE archivo_base64 IS NULL OR TRIM(archivo_base64) = '';

CREATE TABLE IF NOT EXISTS Roles (id_rol integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre_rol varchar(255), id_empresa integer not null, primary key (id_rol));

CREATE TABLE IF NOT EXISTS RolesPermisos (id_roles_permisos integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), id_permiso integer not null, id_rol integer not null, primary key (id_roles_permisos));

CREATE TABLE IF NOT EXISTS Sesion (id varchar(36) not null, created_at timestamp, expires_at timestamp, last_activity timestamp, revoked boolean, username varchar(255), primary key (id));

CREATE TABLE IF NOT EXISTS TipoSuscripcion (id_tipo_suscripcion integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre varchar(255), primary key (id_tipo_suscripcion));

CREATE TABLE IF NOT EXISTS Unidades (id_unidad integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre varchar(255), primary key (id_unidad));

CREATE TABLE IF NOT EXISTS Usuarios (id_usuario integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), activo integer not null, requiere_cambio_password boolean not null default 0, avatarUrl LONGTEXT, correo_usuario varchar(255), nombre_usuario varchar(255), password varchar(255) not null, telefono_usuario varchar(255) not null, usuario varchar(255) not null, id_empresa integer not null, id_rol integer not null, primary key (id_usuario));

CREATE TABLE IF NOT EXISTS UsuariosPermisos (id_usuarios_permisos integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), efecto varchar(10) not null, motivo varchar(180), id_permiso integer not null, id_usuario integer not null, primary key (id_usuarios_permisos));

CREATE TABLE IF NOT EXISTS VentaDetalle (id_venta_detalle integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), cantidad numeric(10,3) not null, precio_unitario float, subtotal float, id_empresa integer not null, id_producto integer not null, id_venta integer not null, primary key (id_venta_detalle));



CREATE TABLE IF NOT EXISTS Ventas (id_venta integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), estado varchar(255) not null, total float not null, id_caja integer not null, id_cliente integer, id_empresa integer not null, id_metodo_pago integer not null, id_usuario integer not null, primary key (id_venta));

CREATE INDEX IF NOT EXISTS idx_mov_caja_caja_empresa on MovimientoCaja (id_caja, id_empresa);

CREATE INDEX IF NOT EXISTS idx_mov_caja_empresa_fecha on MovimientoCaja (id_empresa, fecha);

CREATE TABLE IF NOT EXISTS LocalDevice (installation_id varchar(36) not null, cash_register_id integer, cpu_hash varchar(64), motherboard_hash varchar(64), mac_hash varchar(64), disk_hash varchar(255), license_token varchar(2500), created_at timestamp, primary key (installation_id));

UPDATE Empresas SET fecha_inicio = SUBSTR(fecha_inicio, 1, 10) WHERE fecha_inicio IS NOT NULL AND LENGTH(fecha_inicio) > 10;
UPDATE Empresas SET fecha_fin = SUBSTR(fecha_fin, 1, 10) WHERE fecha_fin IS NOT NULL AND LENGTH(fecha_fin) > 10;
UPDATE Lote SET fecha_caducidad = SUBSTR(fecha_caducidad, 1, 10) WHERE fecha_caducidad IS NOT NULL AND LENGTH(fecha_caducidad) > 10;
UPDATE ProveedorActivo SET fecha_entrega = SUBSTR(fecha_entrega, 1, 10) WHERE fecha_entrega IS NOT NULL AND LENGTH(fecha_entrega) > 10;
UPDATE ProveedorActivo SET fecha_regreso = SUBSTR(fecha_regreso, 1, 10) WHERE fecha_regreso IS NOT NULL AND LENGTH(fecha_regreso) > 10;
UPDATE ProveedorAcuerdo SET fecha_inicio = SUBSTR(fecha_inicio, 1, 10) WHERE fecha_inicio IS NOT NULL AND LENGTH(fecha_inicio) > 10;
UPDATE ProveedorAcuerdo SET fecha_vigencia = SUBSTR(fecha_vigencia, 1, 10) WHERE fecha_vigencia IS NOT NULL AND LENGTH(fecha_vigencia) > 10;
