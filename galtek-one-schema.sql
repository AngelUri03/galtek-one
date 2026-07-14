PRAGMA foreign_keys = ON;

-- Galtek One SQLite schema.
-- Run this before galtek-one-seed.sql. All tables are idempotent.

CREATE TABLE IF NOT EXISTS Almacen (id_almacen integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), direccion varchar(255) not null, nombre varchar(255), id_empresa integer not null, primary key (id_almacen));

CREATE TABLE IF NOT EXISTS Cajas (id_caja integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre varchar(255), tipo varchar(255) not null, id_empresa integer not null, primary key (id_caja));

CREATE TABLE IF NOT EXISTS Categorias (id_categoria integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre varchar(255), id_empresa integer not null, primary key (id_categoria));

CREATE TABLE IF NOT EXISTS Clientes (id_cliente integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), avatar varchar(255), direccion varchar(255), email varchar(255), nombre varchar(255), telefono varchar(255), id_empresa integer, primary key (id_cliente));

CREATE TABLE IF NOT EXISTS CompraDetalle (id_compra_detalle integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), cantidad integer not null, precio_unitario numeric(9,2) not null, subtotal numeric(9,2) not null, id_compra integer not null, id_producto integer not null unique, primary key (id_compra_detalle));

CREATE TABLE IF NOT EXISTS Compras (id_compra integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), fecha_compra timestamp, ticket_proveedor blob not null, total_compra numeric(38,2), id_proveedor integer not null, id_usuario integer not null, id_empresa integer not null, primary key (id_compra));

CREATE TABLE IF NOT EXISTS Devoluciones (id_devolucion integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), motivo varchar(255) not null, total_devolucion numeric(9,2) not null, id_empresa integer not null, id_venta integer not null unique, primary key (id_devolucion));

CREATE TABLE IF NOT EXISTS DevolucionesDetalle (id_devolucion_detalle integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), cantidad_devuelta integer, subtotal_devuelto numeric(38,2), id_devolucion integer not null, id_producto integer not null, primary key (id_devolucion_detalle));

CREATE TABLE IF NOT EXISTS Empresas (id_empresa integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), direccion varchar(255) not null, fecha_fin date, fecha_inicio date not null, nombre varchar(255), token_licencia varchar(255), id_tipo_suscripcion integer not null, primary key (id_empresa));

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

CREATE TABLE IF NOT EXISTS ProveedorProducto (id_proveedor_producto integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), precio_compra float not null, id_empresa integer not null, id_producto integer not null, id_proveedor integer not null, primary key (id_proveedor_producto));

CREATE TABLE IF NOT EXISTS Proveedores (id_proveedor integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), contacto varchar(255) not null, correo varchar(255) not null, direccion varchar(255) not null, nombre varchar(255), telefono varchar(255) not null, id_empresa integer not null, primary key (id_proveedor));

CREATE TABLE IF NOT EXISTS Roles (id_rol integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre_rol varchar(255), id_empresa integer not null, primary key (id_rol));

CREATE TABLE IF NOT EXISTS RolesPermisos (id_roles_permisos integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), id_permiso integer not null, id_rol integer not null, primary key (id_roles_permisos));

CREATE TABLE IF NOT EXISTS Sesion (id varchar(36) not null, created_at timestamp, expires_at timestamp, last_activity timestamp, revoked boolean, username varchar(255), primary key (id));

CREATE TABLE IF NOT EXISTS TipoSuscripcion (id_tipo_suscripcion integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre varchar(255), primary key (id_tipo_suscripcion));

CREATE TABLE IF NOT EXISTS Unidades (id_unidad integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre varchar(255), primary key (id_unidad));

CREATE TABLE IF NOT EXISTS Usuarios (id_usuario integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), activo integer not null, avatarUrl LONGTEXT, correo_usuario varchar(255), nombre_usuario varchar(255), password varchar(255) not null, telefono_usuario varchar(255) not null, usuario varchar(255) not null, id_empresa integer not null, id_rol integer not null, primary key (id_usuario));

CREATE TABLE IF NOT EXISTS UsuariosPermisos (id_usuarios_permisos integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), efecto varchar(10) not null, motivo varchar(180), id_permiso integer not null, id_usuario integer not null, primary key (id_usuarios_permisos));

CREATE TABLE IF NOT EXISTS VentaDetalle (id_venta_detalle integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), cantidad numeric(10,3) not null, precio_unitario float, subtotal float, id_empresa integer not null, id_producto integer not null, id_venta integer not null, primary key (id_venta_detalle));



CREATE TABLE IF NOT EXISTS Ventas (id_venta integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), estado varchar(255) not null, total float not null, id_caja integer not null, id_cliente integer, id_empresa integer not null, id_metodo_pago integer not null, id_usuario integer not null, primary key (id_venta));

CREATE INDEX IF NOT EXISTS idx_mov_caja_caja_empresa on MovimientoCaja (id_caja, id_empresa);

CREATE INDEX IF NOT EXISTS idx_mov_caja_empresa_fecha on MovimientoCaja (id_empresa, fecha);

CREATE TABLE IF NOT EXISTS LocalDevice (installation_id varchar(36) not null, cash_register_id integer, cpu_hash varchar(64), motherboard_hash varchar(64), mac_hash varchar(64), disk_hash varchar(255), license_token varchar(2500), created_at timestamp, primary key (installation_id));
