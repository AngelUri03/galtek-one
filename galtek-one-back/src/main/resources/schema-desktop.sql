PRAGMA foreign_keys = ON;

-- Galtek One SQLite schema.
-- All tables are idempotent.

CREATE TABLE IF NOT EXISTS Almacen (id_almacen integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), direccion varchar(255) not null, nombre varchar(255), id_empresa integer not null, primary key (id_almacen));

CREATE TABLE IF NOT EXISTS Cajas (id_caja integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre varchar(255), tipo varchar(255) not null, id_empresa integer not null, primary key (id_caja));

CREATE TABLE IF NOT EXISTS CajaSesion (id_caja_sesion integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), id_local_device varchar(36), id_caja integer, id_usuario_abre integer not null, id_usuario_cierra integer, opened_at timestamp not null, last_activity_at timestamp not null, closed_at timestamp, opening_amount numeric(12,2) not null, expected_cash_amount numeric(12,2) not null, closing_expected_cash_amount numeric(12,2), counted_cash_amount numeric(12,2), difference_amount numeric(12,2), status varchar(32) not null, closing_reason varchar(80), closing_notes varchar(500), opening_idempotency_key varchar(120) not null, closing_idempotency_key varchar(120), expected_balance_viewed_before_count boolean, expected_balance_viewed_at timestamp, expected_balance_viewed_by integer, active_cash_register_key varchar(80), active_installation_key varchar(120), active_user_key varchar(80), version bigint, id_empresa integer not null, primary key (id_caja_sesion));

CREATE TABLE IF NOT EXISTS SaldoEfectivo (id_saldo_efectivo integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), id_local_device varchar(36) not null, current_balance_snapshot numeric(12,2) not null, initialized boolean not null, initialized_at timestamp, initialized_by integer, initialization_category varchar(80), initialization_reason varchar(500), initialization_idempotency_key varchar(120), last_movement_at timestamp, version bigint, id_empresa integer not null, primary key (id_saldo_efectivo));

CREATE TABLE IF NOT EXISTS ConfiguracionCaja (id_configuracion_caja integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), handoff_policy varchar(32) not null, require_incoming_count_on_user_change boolean not null, require_outgoing_count boolean not null, allow_continue_with_pending_incident boolean not null, blind_count_enabled boolean not null, expected_balance_visibility_mode varchar(40) not null, version bigint, id_empresa integer not null, primary key (id_configuracion_caja));

CREATE TABLE IF NOT EXISTS ConfiguracionPagos (id_configuracion_pagos integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), terminal_enabled boolean not null, terminal_provider varchar(60) not null, terminal_name varchar(120), terminal_identifier varchar(120), terminal_serial varchar(120), terminal_store_id varchar(120), terminal_account varchar(160), terminales_json text, terminal_priority integer not null, terminal_commission_enabled boolean not null, terminal_commission_percent numeric(7,4) not null, terminal_require_reference boolean not null, cash_rounding_default_enabled boolean not null, card_bank_name varchar(120), card_holder_name varchar(160), card_number varchar(40), card_account varchar(60), card_instructions varchar(220), voucher_issuer varchar(120), voucher_instructions varchar(220), voucher_require_folio boolean not null, voucher_require_authorization boolean not null, transfer_bank_name varchar(120), transfer_account_name varchar(160), transfer_clabe varchar(32), version bigint, id_empresa integer not null, primary key (id_configuracion_pagos));

CREATE TABLE IF NOT EXISTS CajaIncidencia (id_caja_incidencia integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), tipo varchar(40) not null, status varchar(32) not null, id_local_device varchar(36) not null, id_caja_sesion integer, id_movimiento_caja integer, expected_amount numeric(12,2), outgoing_declared_amount numeric(12,2), incoming_declared_amount numeric(12,2), joint_recount_amount numeric(12,2), accepted_amount numeric(12,2), difference_amount numeric(12,2), outgoing_note varchar(500), incoming_note varchar(500), policy_snapshot varchar(40), resolved_at timestamp, resolved_by integer, resolution_category varchar(80), resolution_notes varchar(700), resolution_cash_effect varchar(60), resolution_amount numeric(12,2), resolution_reference varchar(160), id_resolution_movement integer, version bigint, id_empresa integer not null, primary key (id_caja_incidencia));

CREATE TABLE IF NOT EXISTS CajaRelevo (id_caja_relevo integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), id_local_device varchar(36) not null, id_outgoing_session integer, id_incoming_session integer, id_outgoing_user integer, id_incoming_user integer, handoff_type varchar(24) not null, status varchar(40) not null, policy_snapshot varchar(40), expected_cash_snapshot numeric(12,2), outgoing_declared_amount numeric(12,2), outgoing_counted_at timestamp, incoming_declared_amount numeric(12,2), incoming_counted_at timestamp, joint_recount_amount numeric(12,2), joint_recount_at timestamp, accepted_amount numeric(12,2), accepted_at timestamp, outgoing_note varchar(500), incoming_note varchar(500), outgoing_confirmed boolean, incoming_confirmed boolean, outgoing_confirmation_at timestamp, incoming_confirmation_at timestamp, difference_outgoing_vs_expected numeric(12,2), difference_incoming_vs_outgoing numeric(12,2), difference_accepted_vs_expected numeric(12,2), id_incident integer, version bigint, id_empresa integer not null, primary key (id_caja_relevo));

CREATE TABLE IF NOT EXISTS Categorias (id_categoria integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre varchar(255), id_empresa integer not null, primary key (id_categoria));

CREATE TABLE IF NOT EXISTS Clientes (id_cliente integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), avatar varchar(255), direccion varchar(255), email varchar(255), nombre varchar(255) not null, telefono varchar(255), alias varchar(255), tipo_cliente varchar(255), estado_cliente varchar(255), estado_cliente_anterior varchar(255), ultima_accion_estado varchar(255), motivo_cambio_estado varchar(500), usuario_cambio_estado varchar(255), fecha_cambio_estado timestamp, whatsapp varchar(255), direccion_calle varchar(255), direccion_numero_exterior varchar(255), direccion_numero_interior varchar(255), direccion_colonia varchar(255), direccion_municipio varchar(255), direccion_estado varchar(255), direccion_codigo_postal varchar(255), direccion_referencia varchar(1000), notas_internas varchar(2000), rfc varchar(255), razon_social varchar(255), codigo_postal_fiscal varchar(255), correo_fiscal varchar(255), regimen_fiscal varchar(255), uso_cfdi varchar(255), id_empresa integer, primary key (id_cliente));

CREATE TABLE IF NOT EXISTS CompraDetalle (id_compra_detalle integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), cantidad integer not null, precio_unitario numeric(9,2) not null, subtotal numeric(9,2) not null, id_compra integer not null, id_producto integer not null unique, primary key (id_compra_detalle));

CREATE TABLE IF NOT EXISTS Compras (id_compra integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), fecha_compra timestamp, ticket_proveedor blob not null, total_compra numeric(38,2), id_proveedor integer not null, id_usuario integer not null, id_empresa integer not null, primary key (id_compra));

CREATE TABLE IF NOT EXISTS Devoluciones (id_devolucion integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), motivo varchar(255) not null, total_devolucion numeric(9,2) not null, id_empresa integer not null, id_venta integer not null unique, primary key (id_devolucion));

CREATE TABLE IF NOT EXISTS DevolucionesDetalle (id_devolucion_detalle integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), cantidad_devuelta integer, subtotal_devuelto numeric(38,2), id_devolucion integer not null, id_producto integer not null, primary key (id_devolucion_detalle));

CREATE TABLE IF NOT EXISTS Empresas (id_empresa integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), direccion varchar(255) not null, direccion_calle varchar(255), direccion_numero_exterior varchar(60), direccion_numero_interior varchar(60), direccion_colonia varchar(255), direccion_municipio varchar(255), direccion_estado varchar(255), direccion_codigo_postal varchar(30), direccion_referencia varchar(500), fecha_fin date, fecha_inicio date not null, nombre varchar(255), razon_social varchar(255), rfc varchar(255), telefono varchar(255), whatsapp varchar(255), correo varchar(255), horario_operacion varchar(255), horario_config text, horario_lunes_viernes_apertura varchar(10), horario_lunes_viernes_cierre varchar(10), horario_sabado_domingo_apertura varchar(10), horario_sabado_domingo_cierre varchar(10), horario_sabado_domingo_cerrado boolean, horario_notas varchar(255), moneda varchar(10), zona_horaria varchar(80), ticket_mensaje varchar(500), logo_nombre varchar(255), logo_mime_type varchar(100), logo_base64 text, token_licencia varchar(255), id_tipo_suscripcion integer not null, primary key (id_empresa));

CREATE TABLE IF NOT EXISTS ConfiguracionTicket (id_configuracion_ticket integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), id_empresa integer not null, paper_size varchar(10), density varchar(20), font_size varchar(20), separator_style varchar(20), alignment varchar(20), default_printer_name varchar(255), copies integer, auto_print boolean, ask_before_print boolean, allow_reprint boolean, show_logo boolean, footer_message varchar(120), template_json text, primary key (id_configuracion_ticket));
CREATE UNIQUE INDEX IF NOT EXISTS ux_configuracion_ticket_empresa ON ConfiguracionTicket(id_empresa);

CREATE TABLE IF NOT EXISTS EntradasSalidas (id_registro integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), fecha_hora timestamp not null, tipo varchar(255) not null, id_empresa integer not null, id_usuario integer not null, primary key (id_registro));

CREATE TABLE IF NOT EXISTS EstadoStock (id_estado_stock integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre_estado varchar(50) not null, orden integer not null, id_empresa integer not null, primary key (id_estado_stock));

CREATE TABLE IF NOT EXISTS HistorialCostos (id_historial_costos integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), precio_compra integer not null, id_empresa integer not null, id_producto integer not null, id_proveedor integer not null, primary key (id_historial_costos));

CREATE TABLE IF NOT EXISTS Inventario (id_inventario integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), existencia numeric(10,3) not null, fecha_ultima_compra timestamp not null, id_almacen integer not null, id_empresa integer not null, id_producto integer not null, primary key (id_inventario));

CREATE TABLE IF NOT EXISTS Lote (id_lote integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), cantidad numeric(38,2) not null, fecha_caducidad date, id_almacen integer not null, id_empresa integer not null, id_producto integer not null, primary key (id_lote));

CREATE TABLE IF NOT EXISTS MetodoPago (id_metodo_pago integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre varchar(255), codigo varchar(40), tipo varchar(40), orden integer, visible_pos boolean, requiere_referencia boolean, requiere_verificacion boolean, id_empresa integer not null, primary key (id_metodo_pago));

CREATE TABLE IF NOT EXISTS MovimientoCaja (id_movimiento_caja integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), fecha timestamp not null, monto numeric(12,2) not null, motivo varchar(500) not null, tipo varchar(30) not null, category varchar(80), financial_direction varchar(20), reference_type varchar(60), reference_id varchar(80), idempotency_key varchar(120), balance_before numeric(12,2), balance_after numeric(12,2), id_caja integer, id_caja_sesion integer, id_local_device varchar(36), id_empresa integer not null, id_usuario integer not null, primary key (id_movimiento_caja));

CREATE TABLE IF NOT EXISTS Permisos (id_permiso integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), accion varchar(40), clave varchar(80) not null, descripcion varchar(255), modulo varchar(60) not null, nombre varchar(120) not null, primary key (id_permiso));

CREATE TABLE IF NOT EXISTS ProductoEstadoStock (id_producto_estado_stock integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), maximo numeric(38,2) not null, minimo numeric(38,2) not null, id_empresa integer not null, id_estado_stock integer not null, id_producto integer not null, primary key (id_producto_estado_stock));

CREATE TABLE IF NOT EXISTS Productos (id_producto integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), codigo_barras varchar(255) not null, descripcion varchar(255) not null, direccion varchar(255) not null, es_pesaje boolean not null, imagen varchar(255), nombre varchar(255) not null, precio_venta float not null, id_categoria integer not null, id_empresa integer not null, id_unidad integer not null, primary key (id_producto));

CREATE TABLE IF NOT EXISTS ProveedorProducto (id_proveedor_producto integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), precio_compra float, sku_proveedor varchar(255), ultimo_costo numeric(12,2), fecha_ultimo_costo timestamp, presentacion_compra varchar(255), cantidad_minima numeric(12,3), proveedor_preferido boolean, estado_relacion varchar(255), id_empresa integer not null, id_producto integer not null, id_proveedor integer not null, primary key (id_proveedor_producto));

CREATE TABLE IF NOT EXISTS Proveedores (id_proveedor integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), contacto varchar(255), correo varchar(255), direccion varchar(255), nombre varchar(255) not null, telefono varchar(255), razon_social varchar(255), rfc varchar(255), tipo_proveedor varchar(255), categoria_principal varchar(255), estado_proveedor varchar(255), estado_proveedor_anterior varchar(255), ultima_accion_estado varchar(255), motivo_cambio_estado varchar(500), usuario_cambio_estado varchar(255), fecha_cambio_estado timestamp, notas_internas varchar(2000), modalidad_abastecimiento varchar(255), pedido_whatsapp boolean, pedido_llamada boolean, pedido_app boolean, visita_ruta boolean, compra_mostrador boolean, dias_visita_entrega varchar(255), horario_habitual varchar(255), pedido_minimo numeric(12,2), tiempo_estimado_entrega varchar(255), costo_envio numeric(12,2), observaciones_abastecimiento varchar(2000), forma_pago_principal varchar(255), maneja_credito boolean, dias_credito integer, limite_credito numeric(12,2), permite_devoluciones boolean, cambios_caducidad boolean, bonificaciones boolean, descuentos_frecuentes boolean, notas_comerciales varchar(2000), id_empresa integer not null, primary key (id_proveedor));

CREATE TABLE IF NOT EXISTS ProveedorContacto (id_proveedor_contacto integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre varchar(255) not null, rol varchar(255), telefono varchar(255), whatsapp varchar(255), correo varchar(255), notas varchar(2000), contacto_principal boolean, estado_contacto varchar(255), id_proveedor integer not null, id_empresa integer not null, primary key (id_proveedor_contacto));

CREATE TABLE IF NOT EXISTS ProveedorActivo (id_proveedor_activo integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre varchar(255) not null, tipo varchar(255), numero_serie varchar(255), fecha_entrega date, fecha_regreso date, estado_fisico varchar(255), ubicacion_tienda varchar(255), condiciones_prestamo varchar(2000), deposito_garantia numeric(12,2), estado_activo_prestado varchar(255), notas varchar(2000), id_proveedor integer not null, id_empresa integer not null, primary key (id_proveedor_activo));

CREATE TABLE IF NOT EXISTS ProveedorActivoHistorial (id_proveedor_activo_historial integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), tipo_evento varchar(255) not null, estado_anterior varchar(255), estado_nuevo varchar(255), descripcion varchar(2000), detalle_anterior varchar(4000), detalle_nuevo varchar(4000), fecha_evento timestamp, evidencia_nombre varchar(255), evidencia_mime_type varchar(255), evidencia_base64 text, evidencia_tamano_bytes integer, id_proveedor_activo integer not null, id_proveedor integer not null, id_empresa integer not null, primary key (id_proveedor_activo_historial));

CREATE TABLE IF NOT EXISTS ProveedorActivoEvidencia (id_proveedor_activo_evidencia integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), evidencia_nombre varchar(255), evidencia_mime_type varchar(255), evidencia_base64 text, evidencia_tamano_bytes integer, id_proveedor_activo_historial integer not null, id_empresa integer not null, primary key (id_proveedor_activo_evidencia));

CREATE TABLE IF NOT EXISTS ProveedorDocumento (id_proveedor_documento integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre varchar(255) not null, tipo varchar(255), ruta_documento varchar(255), archivo_nombre varchar(255), mime_type varchar(255), tamano_bytes integer, archivo_base64 text, descripcion varchar(2000), estado_documento varchar(255), id_proveedor integer not null, id_proveedor_activo integer, id_empresa integer not null, primary key (id_proveedor_documento));

CREATE TABLE IF NOT EXISTS ProveedorDocumentoHistorial (id_proveedor_documento_historial integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), id_proveedor_documento integer not null, id_proveedor integer not null, tipo_evento varchar(255) not null, descripcion varchar(2000), detalle_anterior varchar(4000), detalle_nuevo varchar(4000), fecha_evento timestamp, archivo_anterior_nombre varchar(255), archivo_anterior_mime_type varchar(255), archivo_anterior_tamano_bytes integer, archivo_anterior_base64 text, archivo_nuevo_nombre varchar(255), archivo_nuevo_mime_type varchar(255), archivo_nuevo_tamano_bytes integer, archivo_nuevo_base64 text, id_empresa integer not null, primary key (id_proveedor_documento_historial));

CREATE TABLE IF NOT EXISTS ProveedorAcuerdo (id_proveedor_acuerdo integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), tipo varchar(255), descripcion varchar(2000) not null, fecha_inicio date, fecha_vigencia date, estado_acuerdo varchar(255), notas varchar(2000), id_proveedor integer not null, id_proveedor_documento integer, id_empresa integer not null, primary key (id_proveedor_acuerdo));

CREATE TABLE IF NOT EXISTS Roles (id_rol integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre_rol varchar(255), id_empresa integer not null, primary key (id_rol));

CREATE TABLE IF NOT EXISTS RolesPermisos (id_roles_permisos integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), id_permiso integer not null, id_rol integer not null, primary key (id_roles_permisos));

CREATE TABLE IF NOT EXISTS Sesion (id varchar(36) not null, created_at timestamp, expires_at timestamp, last_activity timestamp, revoked boolean, username varchar(255), primary key (id));

CREATE TABLE IF NOT EXISTS TipoSuscripcion (id_tipo_suscripcion integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre varchar(255), primary key (id_tipo_suscripcion));

CREATE TABLE IF NOT EXISTS Unidades (id_unidad integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), nombre varchar(255), primary key (id_unidad));

CREATE TABLE IF NOT EXISTS Usuarios (id_usuario integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), activo integer not null, requiere_cambio_password boolean not null default 0, avatarUrl LONGTEXT, correo_usuario varchar(255), nombre_usuario varchar(255), password varchar(255) not null, telefono_usuario varchar(255) not null, usuario varchar(255) not null, id_empresa integer not null, id_rol integer not null, primary key (id_usuario));

CREATE TABLE IF NOT EXISTS UsuariosPermisos (id_usuarios_permisos integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), efecto varchar(10) not null, motivo varchar(180), id_permiso integer not null, id_usuario integer not null, primary key (id_usuarios_permisos));

CREATE TABLE IF NOT EXISTS VentaDetalle (id_venta_detalle integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), cantidad numeric(10,3) not null, precio_unitario float, subtotal float, id_empresa integer not null, id_producto integer not null, id_venta integer not null, primary key (id_venta_detalle));

CREATE TABLE IF NOT EXISTS Ventas (id_venta integer, estatus boolean, fecha_creacion timestamp, fecha_modificacion timestamp, usuario_creacion varchar(255), usuario_modificacion varchar(255), estado varchar(255) not null, total float not null, id_caja integer, id_caja_sesion integer, id_cliente integer, id_empresa integer not null, id_metodo_pago integer not null, id_usuario integer not null, primary key (id_venta));

CREATE INDEX IF NOT EXISTS idx_mov_caja_caja_empresa on MovimientoCaja (id_caja, id_empresa);

CREATE INDEX IF NOT EXISTS idx_mov_caja_empresa_fecha on MovimientoCaja (id_empresa, fecha);

CREATE INDEX IF NOT EXISTS idx_mov_caja_sesion on MovimientoCaja (id_caja_sesion);

CREATE INDEX IF NOT EXISTS idx_mov_caja_device_empresa on MovimientoCaja (id_local_device, id_empresa);

CREATE INDEX IF NOT EXISTS idx_mov_caja_idempotency on MovimientoCaja (id_empresa, idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS uk_saldo_efectivo_empresa_device on SaldoEfectivo (id_empresa, id_local_device);

CREATE INDEX IF NOT EXISTS idx_saldo_efectivo_empresa_device on SaldoEfectivo (id_empresa, id_local_device);

CREATE INDEX IF NOT EXISTS idx_saldo_efectivo_empresa_initialized on SaldoEfectivo (id_empresa, initialized);

CREATE UNIQUE INDEX IF NOT EXISTS uk_configuracion_caja_empresa on ConfiguracionCaja (id_empresa);

CREATE UNIQUE INDEX IF NOT EXISTS uk_configuracion_pagos_empresa on ConfiguracionPagos (id_empresa);

CREATE INDEX IF NOT EXISTS idx_metodo_pago_empresa_codigo on MetodoPago (id_empresa, codigo);

CREATE INDEX IF NOT EXISTS idx_caja_incidencia_empresa_estado on CajaIncidencia (id_empresa, status);

CREATE INDEX IF NOT EXISTS idx_caja_incidencia_device_estado on CajaIncidencia (id_local_device, status);

CREATE INDEX IF NOT EXISTS idx_caja_incidencia_sesion on CajaIncidencia (id_caja_sesion);

CREATE INDEX IF NOT EXISTS idx_caja_relevo_empresa_device_estado on CajaRelevo (id_empresa, id_local_device, status);

CREATE INDEX IF NOT EXISTS idx_caja_relevo_outgoing_session on CajaRelevo (id_outgoing_session);

CREATE UNIQUE INDEX IF NOT EXISTS uk_caja_sesion_idempotency on CajaSesion (id_empresa, opening_idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS uk_caja_sesion_closing_idempotency on CajaSesion (id_empresa, closing_idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS uk_caja_sesion_active_installation on CajaSesion (active_installation_key);

CREATE UNIQUE INDEX IF NOT EXISTS uk_caja_sesion_active_user on CajaSesion (active_user_key);

CREATE INDEX IF NOT EXISTS idx_caja_sesion_empresa_installation_estado on CajaSesion (id_empresa, id_local_device, status);

CREATE INDEX IF NOT EXISTS idx_caja_sesion_empresa_caja_estado on CajaSesion (id_empresa, id_caja, status);

CREATE INDEX IF NOT EXISTS idx_caja_sesion_empresa_usuario_estado on CajaSesion (id_empresa, id_usuario_abre, status);

CREATE INDEX IF NOT EXISTS idx_caja_sesion_empresa_abierta on CajaSesion (id_empresa, opened_at);

CREATE INDEX IF NOT EXISTS idx_ventas_caja_sesion on Ventas (id_caja_sesion);

CREATE INDEX IF NOT EXISTS idx_ventas_caja_empresa on Ventas (id_caja, id_empresa);

CREATE TABLE IF NOT EXISTS LocalDevice (installation_id varchar(36) not null, display_name varchar(120), cash_register_id integer, cpu_hash varchar(64), motherboard_hash varchar(64), mac_hash varchar(64), disk_hash varchar(255), license_token varchar(2500), created_at timestamp, updated_at timestamp, id_empresa integer, primary key (installation_id));
