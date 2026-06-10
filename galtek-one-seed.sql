PRAGMA foreign_keys = ON;

-- Galtek One desktop demo seed.
-- Usuario inicial: admin
-- Password inicial: admin123
--
-- Este seed es idempotente: usa IDs fijos de demo e INSERT OR REPLACE /
-- INSERT OR IGNORE para poder ejecutarse varias veces sin duplicar datos.

INSERT OR REPLACE INTO TipoSuscripcion
(id_tipo_suscripcion, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, nombre)
VALUES
(1, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Local escritorio');

INSERT OR REPLACE INTO Empresas
(id_empresa, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, direccion, fecha_inicio, fecha_fin, nombre, token_licencia, id_tipo_suscripcion)
VALUES
(1, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system',
 'Av. Comercio 245, Col. Centro, CDMX', STRFTIME('%Y-%m-%d 00:00:00.000', 'now', '-180 day'), NULL,
 'Abarrotes La Esquina - Demo Galtek One', 'LOCAL-DESKTOP-DEMO', 1);

INSERT OR REPLACE INTO Roles
(id_rol, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, nombre_rol, id_empresa)
VALUES
(20, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Administrador', 1),
(21, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Vendedor', 1),
(22, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Cajero', 1),
(23, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Supervisor', 1),
(24, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Invitado', 1);

INSERT OR REPLACE INTO Permisos
(id_permiso, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, accion, clave, descripcion, modulo, nombre)
VALUES
(1, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'VER', 'VENTAS_VER', 'Consultar pantalla e historial de ventas', 'VENTAS', 'Ver ventas'),
(2, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'CREAR', 'VENTAS_CREAR', 'Registrar ventas y pagos', 'VENTAS', 'Crear ventas'),
(3, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'CANCELAR', 'VENTAS_CANCELAR', 'Cancelar ventas y registrar devoluciones', 'VENTAS', 'Cancelar ventas'),
(4, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'VER', 'INVENTARIO_VER', 'Consultar existencias, lotes y alertas', 'INVENTARIO', 'Ver inventario'),
(5, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'EDITAR', 'INVENTARIO_EDITAR', 'Crear productos y ajustar stock', 'INVENTARIO', 'Editar inventario'),
(6, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'VER', 'CLIENTES_VER', 'Consultar clientes', 'CLIENTES', 'Ver clientes'),
(7, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'EDITAR', 'CLIENTES_EDITAR', 'Crear y editar clientes', 'CLIENTES', 'Editar clientes'),
(8, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'VER', 'COMPRAS_VER', 'Consultar compras y proveedores', 'COMPRAS', 'Ver compras'),
(9, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'CREAR', 'COMPRAS_CREAR', 'Registrar compras y costos', 'COMPRAS', 'Crear compras'),
(10, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'VER', 'REPORTES_VER', 'Consultar reportes financieros', 'REPORTES', 'Ver reportes'),
(11, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'ADMIN', 'CONFIG_USUARIOS', 'Administrar usuarios, roles y permisos', 'CONFIGURACION', 'Administrar usuarios'),
(12, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'EDITAR', 'CONFIG_TIENDA', 'Configurar tienda, cajas y parametros', 'CONFIGURACION', 'Configurar tienda'),
(13, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'VER', 'CAJA_VER', 'Consultar balance y movimientos de caja', 'CAJA', 'Ver caja'),
(14, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'EDITAR', 'CAJA_MOVIMIENTOS', 'Registrar ingresos y egresos manuales', 'CAJA', 'Movimientos de caja');

DELETE FROM RolesPermisos WHERE id_roles_permisos BETWEEN 1 AND 200;

INSERT OR REPLACE INTO RolesPermisos
(id_roles_permisos, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, id_permiso, id_rol)
SELECT id, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', permiso, rol
FROM (
  SELECT 1 id, 20 rol, 1 permiso UNION ALL SELECT 2,20,2 UNION ALL SELECT 3,20,3 UNION ALL SELECT 4,20,4
  UNION ALL SELECT 5,20,5 UNION ALL SELECT 6,20,6 UNION ALL SELECT 7,20,7 UNION ALL SELECT 8,20,8
  UNION ALL SELECT 9,20,9 UNION ALL SELECT 10,20,10 UNION ALL SELECT 11,20,11 UNION ALL SELECT 12,20,12
  UNION ALL SELECT 13,20,13 UNION ALL SELECT 14,20,14
  UNION ALL SELECT 21,21,1 UNION ALL SELECT 22,21,2 UNION ALL SELECT 23,21,4 UNION ALL SELECT 24,21,6
  UNION ALL SELECT 25,21,7
  UNION ALL SELECT 31,22,1 UNION ALL SELECT 32,22,2 UNION ALL SELECT 33,22,6 UNION ALL SELECT 34,22,13
  UNION ALL SELECT 35,22,14
  UNION ALL SELECT 41,23,1 UNION ALL SELECT 42,23,2 UNION ALL SELECT 43,23,3 UNION ALL SELECT 44,23,4
  UNION ALL SELECT 45,23,5 UNION ALL SELECT 46,23,8 UNION ALL SELECT 47,23,9 UNION ALL SELECT 48,23,10
  UNION ALL SELECT 49,23,13 UNION ALL SELECT 50,23,14
  UNION ALL SELECT 61,24,1
);

INSERT OR REPLACE INTO Usuarios
(id_usuario, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, activo, avatarUrl, correo_usuario, nombre_usuario, password, telefono_usuario, usuario, id_empresa, id_rol)
VALUES
(1, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 1, NULL, 'admin@galtek.one', 'Administrador General', '$2a$10$3zgQSqcbCOao5yOcqPx0U.s3KzHHHMqzYiWg8eNRJ3lXkzF0GkHy.', '5555550001', 'admin', 1, 20),
(2, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 1, NULL, 'caja1@galtek.one', 'Laura Martinez', '$2a$10$3zgQSqcbCOao5yOcqPx0U.s3KzHHHMqzYiWg8eNRJ3lXkzF0GkHy.', '5555550002', 'caja1', 1, 22),
(3, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 1, NULL, 'ventas@galtek.one', 'Diego Ramirez', '$2a$10$3zgQSqcbCOao5yOcqPx0U.s3KzHHHMqzYiWg8eNRJ3lXkzF0GkHy.', '5555550003', 'vendedor', 1, 21),
(4, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 1, NULL, 'supervisor@galtek.one', 'Sofia Hernandez', '$2a$10$3zgQSqcbCOao5yOcqPx0U.s3KzHHHMqzYiWg8eNRJ3lXkzF0GkHy.', '5555550004', 'supervisor', 1, 23);

INSERT OR REPLACE INTO UsuariosPermisos
(id_usuarios_permisos, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, efecto, motivo, id_permiso, id_usuario)
VALUES
(1, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'DENEGAR', 'Cajero sin acceso a configuracion de usuarios', 11, 2),
(2, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'PERMITIR', 'Supervisor autorizado para devoluciones', 3, 4);

INSERT OR REPLACE INTO MetodoPago
(id_metodo_pago, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, nombre, id_empresa)
VALUES
(1, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'EFECTIVO', 1),
(2, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'TARJETA', 1),
(3, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'TRANSFERENCIA', 1);

INSERT OR REPLACE INTO Unidades
(id_unidad, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, nombre)
VALUES
(1, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'pz'),
(2, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'kg'),
(3, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'lt'),
(4, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'ml'),
(5, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'g'),
(6, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'paquete'),
(7, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'caja'),
(8, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'bolsa');

INSERT OR REPLACE INTO Categorias
(id_categoria, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, nombre, id_empresa)
VALUES
(1, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Abarrotes basicos', 1),
(2, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Enlatados y conservas', 1),
(3, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Bebidas', 1),
(4, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Lacteos y refrigerados', 1),
(5, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Panaderia y tortillas', 1),
(6, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Botanas y snacks', 1),
(7, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Dulceria', 1),
(8, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Limpieza del hogar', 1),
(9, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Higiene personal', 1),
(10, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Frutas y verduras', 1),
(11, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Carnes y embutidos', 1),
(12, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Congelados', 1),
(13, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Farmacia basica', 1),
(14, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Mascotas', 1),
(15, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Papeleria', 1),
(16, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Ferreteria ligera', 1),
(17, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Desechables', 1),
(18, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Bebes', 1);

INSERT OR REPLACE INTO Almacen
(id_almacen, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, direccion, nombre, id_empresa)
VALUES
(1, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Area de venta', 'Piso de venta', 1),
(2, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Bodega trasera', 'Bodega principal', 1),
(3, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Zona fria', 'Refrigerador y congelador', 1);

INSERT OR REPLACE INTO Cajas
(id_caja, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, nombre, tipo, id_empresa)
VALUES
(1, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Caja principal', 'Mostrador', 1),
(2, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Caja rapida', 'Mostrador express', 1);

INSERT OR REPLACE INTO EstadoStock
(id_estado_stock, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, nombre_estado, orden, id_empresa)
VALUES
(1, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'AGOTADO', 1, 1),
(2, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'CRITICO', 2, 1),
(3, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'BAJO', 3, 1),
(4, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'OPTIMO', 4, 1),
(5, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'SOBREINVENTARIO', 5, 1);

INSERT OR REPLACE INTO Proveedores
(id_proveedor, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, contacto, correo, direccion, nombre, telefono, id_empresa)
VALUES
(1, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Martha Gomez', 'ventas@abarrotescentral.mx', 'Central de abasto nave A-12', 'Abarrotes Central', '5551001001', 1),
(2, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Ivan Ruiz', 'pedidos@bebidasmetro.mx', 'Bodega 45, Parque Industrial Norte', 'Bebidas Metropolitanas', '5551001002', 1),
(3, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Diana Trejo', 'contacto@lapradera.mx', 'Carretera Lechera km 8', 'Lacteos La Pradera', '5551001003', 1),
(4, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Raul Ortega', 'facturacion@trigal.mx', 'Calle Molino 18', 'Panificadora El Trigal', '5551001004', 1),
(5, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Nora Salas', 'ventas@mayabotanas.mx', 'Av. Industria Dulce 77', 'Botanas y Dulces Maya', '5551001005', 1),
(6, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Oscar Leon', 'mayoreo@hogarplus.mx', 'Bodega 3, Limpieza Sur', 'Limpieza y Hogar Plus', '5551001006', 1),
(7, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Patricia Mora', 'pedidos@higienetotal.mx', 'Privada Salud 204', 'Higiene Total', '5551001007', 1),
(8, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Jorge Rivas', 'compras@frutassan miguel.mx', 'Mercado de productores local 9', 'Frutas y Verduras San Miguel', '5551001008', 1),
(9, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Elena Padilla', 'pedidos@carnesnorte.mx', 'Camara fria 12', 'Carnes Frias del Norte', '5551001009', 1),
(10, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Luis Tapia', 'ventas@polarcongelados.mx', 'Cedis congelados anden 4', 'Congelados Polar', '5551001010', 1),
(11, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Silvia Cano', 'mayoreo@farmabasica.mx', 'Av. Salud 500', 'Farma Basica', '5551001011', 1),
(12, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Mario Flores', 'ventas@mascotasamigas.mx', 'Parque Industrial Poniente 7', 'Mascotas Amigas', '5551001012', 1),
(13, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Claudia Vega', 'pedidos@papeleriaescolar.mx', 'Calle Utiles 31', 'Papeleria Escolar', '5551001013', 1),
(14, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Tomas Ibarra', 'contacto@ferreexpress.mx', 'Av. Herramientas 80', 'Ferreteria Express', '5551001014', 1),
(15, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Rocio Campos', 'ventas@desechablesluna.mx', 'Bodega plasticos 6', 'Desechables Luna', '5551001015', 1),
(16, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 'Ana Beltran', 'pedidos@bebefeliz.mx', 'Av. Cuidado 16', 'Distribuidora Bebe Feliz', '5551001016', 1);

INSERT OR REPLACE INTO Clientes
(id_cliente, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, avatar, direccion, email, nombre, telefono, id_empresa)
VALUES
(1, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', NULL, 'Calle Fresno 14', 'maria.lopez@example.com', 'Maria Lopez', '5552000001', 1),
(2, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', NULL, 'Av. Norte 221', 'carlos.mendez@example.com', 'Carlos Mendez', '5552000002', 1),
(3, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', NULL, 'Privada Olivo 9', 'lucia.perez@example.com', 'Lucia Perez', '5552000003', 1),
(4, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', NULL, 'Calle Roble 51', 'jorge.santos@example.com', 'Jorge Santos', '5552000004', 1),
(5, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', NULL, 'Av. Reforma 88', 'paola.diaz@example.com', 'Paola Diaz', '5552000005', 1),
(6, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', NULL, 'Calle Mango 102', 'ricardo.nava@example.com', 'Ricardo Nava', '5552000006', 1),
(7, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', NULL, 'Andador Cedro 2', 'karla.ruiz@example.com', 'Karla Ruiz', '5552000007', 1),
(8, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', NULL, 'Calle Sur 72', 'fernando.cruz@example.com', 'Fernando Cruz', '5552000008', 1),
(9, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', NULL, 'Av. Hidalgo 11', 'monica.reyes@example.com', 'Monica Reyes', '5552000009', 1),
(10, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', NULL, 'Calle Lago 60', 'hector.arias@example.com', 'Hector Arias', '5552000010', 1),
(11, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', NULL, 'Calle Palma 5', 'natalia.soto@example.com', 'Natalia Soto', '5552000011', 1),
(12, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', NULL, 'Av. Central 30', 'adrian.luna@example.com', 'Adrian Luna', '5552000012', 1);

DROP TABLE IF EXISTS seed_productos;
CREATE TEMP TABLE seed_productos (
  id_producto INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  codigo_barras TEXT NOT NULL,
  id_unidad INTEGER NOT NULL,
  es_pesaje INTEGER NOT NULL,
  precio_venta REAL NOT NULL,
  id_categoria INTEGER NOT NULL,
  ubicacion TEXT NOT NULL,
  existencia REAL NOT NULL,
  punto_reorden REAL NOT NULL,
  maximo REAL NOT NULL,
  id_proveedor INTEGER NOT NULL,
  precio_compra REAL NOT NULL,
  caducidad_dias INTEGER,
  id_almacen INTEGER NOT NULL
);

INSERT INTO seed_productos VALUES
(1,'Arroz Morelos 1 kg','Bolsa de arroz Morelos 1 kg','750100000001',1,0,34.50,1,'A1-01',58,18,120,1,25.00,540,1),
(2,'Frijol negro 900 g','Bolsa de frijol negro 900 g','750100000002',1,0,39.90,1,'A1-02',42,16,100,1,29.00,540,1),
(3,'Azucar estandar 1 kg','Azucar estandar empacada 1 kg','750100000003',1,0,31.50,1,'A1-03',66,20,130,1,23.00,720,1),
(4,'Sal fina 1 kg','Sal de mesa fina 1 kg','750100000004',1,0,18.00,1,'A1-04',73,15,140,1,11.50,900,1),
(5,'Aceite vegetal 850 ml','Aceite vegetal comestible 850 ml','750100000005',1,0,49.00,1,'A1-05',35,12,80,1,38.00,360,1),
(6,'Pasta espagueti 200 g','Pasta seca espagueti 200 g','750100000006',1,0,13.50,1,'A1-06',88,25,160,1,8.50,720,1),
(7,'Harina de trigo 1 kg','Harina de trigo todo uso 1 kg','750100000007',1,0,27.50,1,'A1-07',31,10,70,1,20.00,360,1),
(8,'Avena hojuelas 400 g','Avena en hojuelas 400 g','750100000008',1,0,29.90,1,'A1-08',27,10,60,1,21.00,360,1),
(9,'Atun en agua 140 g','Lata de atun en agua 140 g','750100000009',1,0,22.50,2,'A2-01',64,20,130,1,16.50,720,1),
(10,'Sardina en tomate 425 g','Lata de sardina en salsa de tomate 425 g','750100000010',1,0,34.00,2,'A2-02',22,8,60,1,25.00,720,1),
(11,'Chiles jalapenos 380 g','Lata de chiles jalapenos en rajas 380 g','750100000011',1,0,24.90,2,'A2-03',41,12,90,1,18.50,720,1),
(12,'Pure de tomate 210 g','Pure de tomate condimentado 210 g','750100000012',1,0,12.50,2,'A2-04',95,25,180,1,8.00,720,1),
(13,'Elote dorado lata 220 g','Granos de elote dorado en lata 220 g','750100000013',1,0,18.90,2,'A2-05',33,10,80,1,13.50,720,1),
(14,'Frijoles refritos 430 g','Lata de frijoles refritos 430 g','750100000014',1,0,21.90,2,'A2-06',46,15,100,1,15.50,720,1),
(15,'Champinones lata 186 g','Champinones rebanados en lata 186 g','750100000015',1,0,28.90,2,'A2-07',18,8,55,1,21.00,720,1),
(16,'Verduras mixtas lata 220 g','Verduras mixtas en lata 220 g','750100000016',1,0,17.50,2,'A2-08',39,12,90,1,12.50,720,1),
(17,'Agua natural 1 L','Botella de agua natural 1 litro','750100000017',1,0,15.00,3,'B1-01',118,40,240,2,9.00,365,1),
(18,'Agua natural 5 L','Garrafon desechable de agua 5 litros','750100000018',1,0,39.00,3,'B1-02',34,12,80,2,27.00,365,1),
(19,'Refresco cola 600 ml','Refresco sabor cola 600 ml','750100000019',1,0,19.00,3,'B1-03',92,30,180,2,13.50,240,1),
(20,'Refresco cola 2 L','Refresco sabor cola 2 litros','750100000020',1,0,39.50,3,'B1-04',57,20,130,2,29.00,240,1),
(21,'Jugo naranja 1 L','Jugo sabor naranja 1 litro','750100000021',1,0,31.00,3,'B1-05',26,10,80,2,22.00,180,1),
(22,'Nectar mango 413 ml','Nectar sabor mango 413 ml','750100000022',1,0,15.50,3,'B1-06',74,22,150,2,10.50,240,1),
(23,'Suero oral 625 ml','Bebida hidratante sabor fresa 625 ml','750100000023',1,0,25.00,3,'B1-07',19,8,70,2,18.00,240,1),
(24,'Bebida energetica 473 ml','Bebida energetica lata 473 ml','750100000024',1,0,32.00,3,'B1-08',28,10,90,2,23.00,240,1),
(25,'Leche entera 1 L','Leche entera ultrapasteurizada 1 litro','750100000025',1,0,28.50,4,'R1-01',44,18,110,3,22.00,35,3),
(26,'Leche deslactosada 1 L','Leche deslactosada 1 litro','750100000026',1,0,31.50,4,'R1-02',36,14,90,3,24.00,35,3),
(27,'Yogurt natural 1 kg','Yogurt natural familiar 1 kg','750100000027',1,0,46.00,4,'R1-03',20,8,55,3,35.00,28,3),
(28,'Yogurt bebible 220 g','Yogurt bebible fresa 220 g','750100000028',1,0,13.50,4,'R1-04',63,20,130,3,9.50,25,3),
(29,'Queso panela kg','Queso panela a granel por kilogramo','750100000029',2,1,118.00,4,'R1-05',8.5,3,25,3,88.00,20,3),
(30,'Crema acida 450 ml','Crema acida pasteurizada 450 ml','750100000030',1,0,34.00,4,'R1-06',24,8,70,3,25.00,25,3),
(31,'Mantequilla 90 g','Barra de mantequilla 90 g','750100000031',1,0,22.00,4,'R1-07',27,10,70,3,16.00,60,3),
(32,'Huevo blanco 12 pz','Paquete de huevo blanco con 12 piezas','750100000032',6,0,48.00,4,'R1-08',21,8,60,3,37.00,20,3),
(33,'Pan blanco 680 g','Pan blanco de caja 680 g','750100000033',1,0,48.50,5,'P1-01',29,10,80,4,36.00,18,1),
(34,'Tortilla de maiz kg','Tortilla de maiz por kilogramo','750100000034',2,1,24.00,5,'P1-02',42,15,100,4,17.00,5,1),
(35,'Bolillo pieza','Bolillo fresco pieza','750100000035',1,0,3.50,5,'P1-03',96,35,180,4,2.00,2,1),
(36,'Pan dulce pieza','Pan dulce surtido pieza','750100000036',1,0,9.00,5,'P1-04',64,25,150,4,5.50,3,1),
(37,'Galleta Maria 170 g','Paquete de galleta Maria 170 g','750100000037',1,0,16.90,5,'P1-05',55,18,120,4,11.50,240,1),
(38,'Galleta sandwich 120 g','Galleta tipo sandwich 120 g','750100000038',1,0,14.90,5,'P1-06',49,16,110,4,10.00,240,1),
(39,'Pan molido 210 g','Bolsa de pan molido 210 g','750100000039',1,0,18.50,5,'P1-07',24,8,70,4,12.00,180,1),
(40,'Tostadas horneadas 200 g','Paquete de tostadas horneadas 200 g','750100000040',1,0,24.50,5,'P1-08',34,12,90,4,17.00,180,1),
(41,'Papas fritas 45 g','Bolsa de papas fritas 45 g','750100000041',1,0,18.00,6,'S1-01',86,28,170,5,12.00,180,1),
(42,'Papas fritas familiar 160 g','Bolsa familiar de papas fritas 160 g','750100000042',1,0,49.00,6,'S1-02',35,12,90,5,35.00,180,1),
(43,'Cacahuates salados 180 g','Bolsa de cacahuates salados 180 g','750100000043',1,0,25.00,6,'S1-03',31,10,80,5,17.00,240,1),
(44,'Palomitas microondas','Paquete de palomitas para microondas','750100000044',1,0,16.50,6,'S1-04',52,16,120,5,11.00,240,1),
(45,'Chicharron de harina 120 g','Bolsa de chicharron de harina 120 g','750100000045',1,0,20.00,6,'S1-05',28,10,80,5,13.50,180,1),
(46,'Totopos 280 g','Bolsa de totopos de maiz 280 g','750100000046',1,0,34.50,6,'S1-06',22,8,70,5,24.00,180,1),
(47,'Pretzels 100 g','Bolsa de pretzels 100 g','750100000047',1,0,19.90,6,'S1-07',17,6,50,5,13.00,240,1),
(48,'Semillas mixtas 150 g','Mezcla de semillas y nueces 150 g','750100000048',1,0,42.00,6,'S1-08',15,6,45,5,30.00,180,1),
(49,'Chocolate barra 45 g','Barra de chocolate 45 g','750100000049',1,0,18.50,7,'D1-01',73,24,150,5,12.00,300,1),
(50,'Gomitas enchiladas 100 g','Bolsa de gomitas enchiladas 100 g','750100000050',1,0,17.00,7,'D1-02',61,20,130,5,10.50,300,1),
(51,'Paleta caramelo pieza','Paleta de caramelo pieza','750100000051',1,0,5.00,7,'D1-03',140,50,260,5,2.80,365,1),
(52,'Chicle paquete 5 pz','Paquete de chicles 5 piezas','750100000052',6,0,7.50,7,'D1-04',112,40,220,5,4.00,365,1),
(53,'Mazapan pieza','Mazapan de cacahuate pieza','750100000053',1,0,8.00,7,'D1-05',91,30,190,5,4.80,365,1),
(54,'Bombon bolsa 200 g','Bolsa de bombon 200 g','750100000054',1,0,24.00,7,'D1-06',37,12,90,5,16.00,365,1),
(55,'Dulce tamarindo 20 pz','Caja de dulces de tamarindo 20 piezas','750100000055',7,0,32.00,7,'D1-07',18,6,55,5,22.00,365,1),
(56,'Gelatina polvo 120 g','Sobre de gelatina en polvo 120 g','750100000056',1,0,13.50,7,'D1-08',44,14,100,5,8.50,720,1),
(57,'Cloro 950 ml','Botella de cloro 950 ml','750100000057',1,0,18.00,8,'L1-01',52,16,120,6,11.00,720,1),
(58,'Detergente polvo 1 kg','Bolsa de detergente en polvo 1 kg','750100000058',1,0,38.00,8,'L1-02',40,14,100,6,27.00,720,1),
(59,'Suavizante 850 ml','Suavizante para ropa 850 ml','750100000059',1,0,32.50,8,'L1-03',23,8,70,6,23.00,720,1),
(60,'Jabon trastes 750 ml','Jabon liquido para trastes 750 ml','750100000060',1,0,34.00,8,'L1-04',27,9,75,6,24.00,720,1),
(61,'Limpiador multiusos 1 L','Limpiador multiusos aroma citrico 1 L','750100000061',1,0,29.00,8,'L1-05',31,10,80,6,20.00,720,1),
(62,'Fibra esponja paquete','Paquete de fibra esponja 2 piezas','750100000062',6,0,16.00,8,'L1-06',45,16,110,6,10.00,NULL,1),
(63,'Bolsas basura 20 pz','Rollo de bolsas para basura 20 piezas','750100000063',6,0,28.00,8,'L1-07',36,12,90,6,19.00,NULL,1),
(64,'Servitoallas rollo','Rollo de toalla de cocina','750100000064',1,0,26.50,8,'L1-08',30,10,85,6,18.00,NULL,1),
(65,'Shampoo 750 ml','Shampoo familiar 750 ml','750100000065',1,0,58.00,9,'H1-01',21,8,65,7,43.00,900,1),
(66,'Jabon tocador 150 g','Jabon de tocador 150 g','750100000066',1,0,18.00,9,'H1-02',75,25,150,7,11.50,900,1),
(67,'Papel higienico 4 rollos','Paquete papel higienico 4 rollos','750100000067',6,0,42.00,9,'H1-03',38,14,100,7,31.00,NULL,1),
(68,'Pasta dental 100 ml','Pasta dental familiar 100 ml','750100000068',1,0,34.50,9,'H1-04',29,10,80,7,24.00,900,1),
(69,'Desodorante aerosol 150 ml','Desodorante aerosol 150 ml','750100000069',1,0,48.00,9,'H1-05',17,7,55,7,36.00,900,1),
(70,'Toallas femeninas 10 pz','Paquete de toallas femeninas 10 piezas','750100000070',6,0,36.00,9,'H1-06',26,10,75,7,26.00,900,1),
(71,'Rastrillos 3 pz','Paquete de rastrillos desechables 3 piezas','750100000071',6,0,29.90,9,'H1-07',22,8,65,7,20.00,NULL,1),
(72,'Gel antibacterial 250 ml','Gel antibacterial 250 ml','750100000072',1,0,24.50,9,'H1-08',33,12,90,7,16.00,720,1),
(73,'Manzana roja kg','Manzana roja a granel por kilogramo','750100000073',2,1,48.00,10,'F1-01',18.5,8,60,8,34.00,10,1),
(74,'Platano kg','Platano tabasco por kilogramo','750100000074',2,1,24.00,10,'F1-02',26,10,80,8,15.00,7,1),
(75,'Tomate saladet kg','Tomate saladet por kilogramo','750100000075',2,1,32.00,10,'F1-03',14.5,8,60,8,21.00,8,1),
(76,'Cebolla blanca kg','Cebolla blanca por kilogramo','750100000076',2,1,28.00,10,'F1-04',19,8,65,8,18.00,14,1),
(77,'Papa blanca kg','Papa blanca por kilogramo','750100000077',2,1,26.00,10,'F1-05',35,12,90,8,17.00,21,1),
(78,'Aguacate hass kg','Aguacate hass por kilogramo','750100000078',2,1,82.00,10,'F1-06',6.5,3,25,8,60.00,6,1),
(79,'Limon kg','Limon sin semilla por kilogramo','750100000079',2,1,34.00,10,'F1-07',12,6,45,8,22.00,12,1),
(80,'Lechuga romana pieza','Lechuga romana pieza','750100000080',1,0,19.00,10,'F1-08',18,8,50,8,12.00,5,1),
(81,'Jamon de pavo kg','Jamon de pavo a granel por kilogramo','750100000081',2,1,148.00,11,'C1-01',9,4,30,9,110.00,18,3),
(82,'Salchicha pavo 500 g','Paquete salchicha de pavo 500 g','750100000082',1,0,42.00,11,'C1-02',25,10,70,9,31.00,25,3),
(83,'Chorizo 400 g','Chorizo fresco paquete 400 g','750100000083',1,0,55.00,11,'C1-03',18,7,55,9,40.00,18,3),
(84,'Tocino 250 g','Tocino ahumado 250 g','750100000084',1,0,64.00,11,'C1-04',14,6,45,9,47.00,18,3),
(85,'Pollo entero kg','Pollo entero fresco por kilogramo','750100000085',2,1,72.00,11,'C1-05',18,8,55,9,52.00,7,3),
(86,'Carne molida kg','Carne molida de res por kilogramo','750100000086',2,1,142.00,11,'C1-06',7,4,30,9,105.00,5,3),
(87,'Queso manchego kg','Queso manchego rebanado por kilogramo','750100000087',2,1,168.00,11,'C1-07',5.5,3,25,9,126.00,20,3),
(88,'Pierna pavo rebanada kg','Pierna de pavo rebanada por kilogramo','750100000088',2,1,132.00,11,'C1-08',6.5,3,25,9,96.00,18,3),
(89,'Helado vainilla 1 L','Helado sabor vainilla 1 litro','750100000089',1,0,58.00,12,'G1-01',18,8,55,10,42.00,120,3),
(90,'Hielo bolsa 5 kg','Bolsa de hielo 5 kg','750100000090',8,0,36.00,12,'G1-02',24,10,70,10,22.00,60,3),
(91,'Verduras congeladas 500 g','Bolsa de verduras congeladas 500 g','750100000091',1,0,44.00,12,'G1-03',16,6,50,10,32.00,180,3),
(92,'Nuggets pollo 700 g','Nuggets de pollo congelados 700 g','750100000092',1,0,89.00,12,'G1-04',11,5,35,10,66.00,180,3),
(93,'Pizza congelada individual','Pizza congelada individual','750100000093',1,0,54.00,12,'G1-05',15,6,45,10,39.00,180,3),
(94,'Papas congeladas 1 kg','Papas prefritas congeladas 1 kg','750100000094',1,0,62.00,12,'G1-06',12,5,40,10,46.00,180,3),
(95,'Hamburguesa carne 4 pz','Caja de hamburguesa de carne 4 piezas','750100000095',7,0,98.00,12,'G1-07',8,4,30,10,72.00,180,3),
(96,'Paleta hielo pieza','Paleta de hielo sabor fruta pieza','750100000096',1,0,12.00,12,'G1-08',42,18,100,10,7.00,90,3),
(97,'Paracetamol 500 mg','Caja paracetamol 500 mg 10 tabletas','750100000097',7,0,28.00,13,'M1-01',21,8,65,11,18.00,720,1),
(98,'Ibuprofeno 400 mg','Caja ibuprofeno 400 mg 10 tabletas','750100000098',7,0,36.00,13,'M1-02',18,7,55,11,24.00,720,1),
(99,'Alcohol 250 ml','Alcohol antiseptico 250 ml','750100000099',1,0,24.00,13,'M1-03',27,10,80,11,15.00,720,1),
(100,'Curitas 20 pz','Caja de venditas adhesivas 20 piezas','750100000100',7,0,22.00,13,'M1-04',19,8,60,11,14.00,900,1),
(101,'Agua oxigenada 250 ml','Agua oxigenada 250 ml','750100000101',1,0,18.00,13,'M1-05',23,9,70,11,11.50,720,1),
(102,'Algodon 100 g','Bolsa de algodon 100 g','750100000102',1,0,21.00,13,'M1-06',16,7,55,11,13.50,NULL,1),
(103,'Suero vida oral sobre','Sobre de suero vida oral','750100000103',1,0,9.00,13,'M1-07',72,24,150,11,5.00,720,1),
(104,'Termometro digital','Termometro digital basico','750100000104',1,0,89.00,13,'M1-08',7,3,25,11,62.00,NULL,1),
(105,'Croquetas perro 2 kg','Bolsa de croquetas para perro 2 kg','750100000105',1,0,118.00,14,'K1-01',18,6,45,12,86.00,360,1),
(106,'Croquetas gato 1 kg','Bolsa de croquetas para gato 1 kg','750100000106',1,0,84.00,14,'K1-02',16,6,42,12,61.00,360,1),
(107,'Arena gato 4 kg','Bolsa de arena para gato 4 kg','750100000107',1,0,72.00,14,'K1-03',20,8,50,12,51.00,NULL,1),
(108,'Sobre perro carne','Sobre alimento humedo perro carne','750100000108',1,0,18.00,14,'K1-04',62,20,130,12,11.00,360,1),
(109,'Sobre gato salmon','Sobre alimento humedo gato salmon','750100000109',1,0,17.00,14,'K1-05',58,20,130,12,10.50,360,1),
(110,'Premios perro 100 g','Premios para perro 100 g','750100000110',1,0,32.00,14,'K1-06',19,8,60,12,22.00,360,1),
(111,'Shampoo mascota 500 ml','Shampoo para mascota 500 ml','750100000111',1,0,54.00,14,'K1-07',12,5,35,12,39.00,720,1),
(112,'Bolsa residuos mascota','Rollo de bolsas para residuos mascota','750100000112',1,0,28.00,14,'K1-08',24,8,70,12,18.00,NULL,1),
(113,'Cuaderno profesional','Cuaderno profesional cuadro chico','750100000113',1,0,34.00,15,'E1-01',37,12,90,13,23.00,NULL,1),
(114,'Plumas azul 3 pz','Paquete plumas tinta azul 3 piezas','750100000114',6,0,18.00,15,'E1-02',48,16,110,13,11.00,NULL,1),
(115,'Lapiz HB 4 pz','Paquete lapiz HB 4 piezas','750100000115',6,0,16.00,15,'E1-03',44,15,100,13,9.50,NULL,1),
(116,'Goma blanca pieza','Goma blanca escolar pieza','750100000116',1,0,7.00,15,'E1-04',68,24,140,13,3.50,NULL,1),
(117,'Cinta adhesiva','Cinta adhesiva transparente','750100000117',1,0,14.00,15,'E1-05',30,10,80,13,8.50,NULL,1),
(118,'Pegamento barra 20 g','Pegamento en barra 20 g','750100000118',1,0,18.00,15,'E1-06',27,10,80,13,11.00,NULL,1),
(119,'Cartulina blanca pieza','Cartulina blanca pieza','750100000119',1,0,8.00,15,'E1-07',80,30,160,13,4.00,NULL,1),
(120,'Marcador permanente','Marcador permanente negro','750100000120',1,0,22.00,15,'E1-08',23,8,65,13,14.00,NULL,1),
(121,'Pilas AA 4 pz','Paquete de pilas AA 4 piezas','750100000121',6,0,64.00,16,'F2-01',20,8,55,14,47.00,NULL,1),
(122,'Foco LED 9W','Foco LED luz calida 9W','750100000122',1,0,39.00,16,'F2-02',26,10,70,14,27.00,NULL,1),
(123,'Extension electrica 3 m','Extension electrica domestica 3 metros','750100000123',1,0,89.00,16,'F2-03',9,4,30,14,64.00,NULL,1),
(124,'Cinta aislante','Rollo de cinta aislante negra','750100000124',1,0,18.00,16,'F2-04',31,10,80,14,10.50,NULL,1),
(125,'Encendedor pieza','Encendedor domestico pieza','750100000125',1,0,12.00,16,'F2-05',58,20,120,14,6.50,NULL,1),
(126,'Candado 30 mm','Candado metalico 30 mm','750100000126',1,0,49.00,16,'F2-06',11,5,35,14,34.00,NULL,1),
(127,'Pegamento instantaneo','Pegamento instantaneo tubo 3 g','750100000127',1,0,22.00,16,'F2-07',21,8,60,14,14.50,NULL,1),
(128,'Guantes trabajo par','Par de guantes de trabajo','750100000128',1,0,42.00,16,'F2-08',14,6,45,14,29.00,NULL,1),
(129,'Vasos desechables 25 pz','Paquete vasos desechables 25 piezas','750100000129',6,0,24.00,17,'Z1-01',44,15,100,15,16.00,NULL,1),
(130,'Platos desechables 20 pz','Paquete platos desechables 20 piezas','750100000130',6,0,28.00,17,'Z1-02',36,12,90,15,19.00,NULL,1),
(131,'Cubiertos desechables 25 pz','Paquete cubiertos desechables 25 piezas','750100000131',6,0,19.00,17,'Z1-03',40,14,100,15,12.00,NULL,1),
(132,'Servilletas 250 pz','Paquete de servilletas 250 piezas','750100000132',6,0,31.00,17,'Z1-04',33,12,90,15,21.00,NULL,1),
(133,'Papel aluminio 7 m','Rollo papel aluminio 7 metros','750100000133',1,0,26.00,17,'Z1-05',25,10,70,15,17.00,NULL,1),
(134,'Pelicula plastica 20 m','Rollo pelicula plastica 20 metros','750100000134',1,0,29.00,17,'Z1-06',18,8,55,15,19.00,NULL,1),
(135,'Popotes 50 pz','Paquete popotes 50 piezas','750100000135',6,0,16.00,17,'Z1-07',50,18,120,15,9.00,NULL,1),
(136,'Charola unicel 20 pz','Paquete charola unicel 20 piezas','750100000136',6,0,34.00,17,'Z1-08',22,8,65,15,23.00,NULL,1),
(137,'Panal etapa 3 40 pz','Paquete panal bebe etapa 3 40 piezas','750100000137',6,0,189.00,18,'BB1-01',9,4,30,16,145.00,NULL,1),
(138,'Toallas humedas bebe','Paquete toallas humedas bebe 80 piezas','750100000138',6,0,42.00,18,'BB1-02',24,8,70,16,29.00,NULL,1),
(139,'Formula infantil 400 g','Formula infantil lata 400 g','750100000139',1,0,168.00,18,'BB1-03',8,4,25,16,128.00,540,1),
(140,'Aceite bebe 200 ml','Aceite para bebe 200 ml','750100000140',1,0,49.00,18,'BB1-04',13,5,40,16,35.00,900,1),
(141,'Shampoo bebe 400 ml','Shampoo para bebe 400 ml','750100000141',1,0,56.00,18,'BB1-05',15,6,45,16,40.00,900,1),
(142,'Crema rozaduras 60 g','Crema para rozaduras 60 g','750100000142',1,0,74.00,18,'BB1-06',11,5,35,16,54.00,720,1),
(143,'Biberon 8 oz','Biberon plastico 8 oz','750100000143',1,0,69.00,18,'BB1-07',10,4,30,16,49.00,NULL,1),
(144,'Papilla fruta 113 g','Papilla sabor fruta 113 g','750100000144',1,0,19.00,18,'BB1-08',34,12,90,16,12.50,360,1);

INSERT OR REPLACE INTO Productos
(id_producto, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, codigo_barras, descripcion, direccion, es_pesaje, imagen, nombre, precio_venta, id_categoria, id_empresa, id_unidad)
SELECT
  id_producto, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system',
  codigo_barras, descripcion, ubicacion, es_pesaje, NULL, nombre, precio_venta, id_categoria, 1, id_unidad
FROM seed_productos;

INSERT OR REPLACE INTO Inventario
(id_inventario, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, existencia, fecha_ultima_compra, id_almacen, id_empresa, id_producto)
SELECT
  id_producto, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system',
  existencia, STRFTIME('%Y-%m-%d %H:%M:%f', 'now', '-3 day'), id_almacen, 1, id_producto
FROM seed_productos;

INSERT OR REPLACE INTO Lote
(id_lote, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, cantidad, fecha_caducidad, id_almacen, id_empresa, id_producto)
SELECT
  id_producto, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system',
  existencia,
  CASE WHEN caducidad_dias IS NULL THEN NULL ELSE STRFTIME('%Y-%m-%d 00:00:00.000', 'now', '+' || caducidad_dias || ' day') END,
  id_almacen, 1, id_producto
FROM seed_productos;

DELETE FROM ProductoEstadoStock WHERE id_empresa = 1 AND id_producto BETWEEN 1 AND 144;

INSERT OR REPLACE INTO ProductoEstadoStock
(id_producto_estado_stock, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, maximo, minimo, id_empresa, id_estado_stock, id_producto)
SELECT id_producto * 10 + 1, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 0, 0, 1, 1, id_producto
FROM seed_productos
UNION ALL
SELECT id_producto * 10 + 2, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', ROUND(punto_reorden * 0.35, 2), 0.001, 1, 2, id_producto
FROM seed_productos
UNION ALL
SELECT id_producto * 10 + 3, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', punto_reorden, ROUND(punto_reorden * 0.35 + 0.001, 3), 1, 3, id_producto
FROM seed_productos
UNION ALL
SELECT id_producto * 10 + 4, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', maximo, ROUND(punto_reorden + 0.001, 3), 1, 4, id_producto
FROM seed_productos
UNION ALL
SELECT id_producto * 10 + 5, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system', 999999, ROUND(maximo + 0.001, 3), 1, 5, id_producto
FROM seed_productos;

INSERT OR REPLACE INTO ProveedorProducto
(id_proveedor_producto, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, precio_compra, id_empresa, id_producto, id_proveedor)
SELECT
  id_producto, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 'system', 'system',
  precio_compra, 1, id_producto, id_proveedor
FROM seed_productos;

INSERT OR REPLACE INTO HistorialCostos
(id_historial_costos, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, precio_compra, id_empresa, id_producto, id_proveedor)
SELECT
  id_producto, 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now', '-45 day'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now', '-45 day'), 'system', 'system',
  CAST(ROUND(precio_compra, 0) AS INTEGER), 1, id_producto, id_proveedor
FROM seed_productos;

DROP TABLE IF EXISTS seed_compra_header;
CREATE TEMP TABLE seed_compra_header (
  id_compra INTEGER PRIMARY KEY,
  id_proveedor INTEGER NOT NULL,
  id_usuario INTEGER NOT NULL,
  fecha_compra TEXT NOT NULL
);

INSERT INTO seed_compra_header VALUES
(1, 1, 4, STRFTIME('%Y-%m-%d %H:%M:%f', 'now', '-28 day')),
(2, 2, 4, STRFTIME('%Y-%m-%d %H:%M:%f', 'now', '-24 day')),
(3, 3, 4, STRFTIME('%Y-%m-%d %H:%M:%f', 'now', '-20 day')),
(4, 4, 4, STRFTIME('%Y-%m-%d %H:%M:%f', 'now', '-16 day')),
(5, 6, 4, STRFTIME('%Y-%m-%d %H:%M:%f', 'now', '-12 day')),
(6, 8, 4, STRFTIME('%Y-%m-%d %H:%M:%f', 'now', '-8 day')),
(7, 9, 4, STRFTIME('%Y-%m-%d %H:%M:%f', 'now', '-5 day')),
(8, 15, 4, STRFTIME('%Y-%m-%d %H:%M:%f', 'now', '-2 day'));

DROP TABLE IF EXISTS seed_compra_line;
CREATE TEMP TABLE seed_compra_line (
  id_compra_detalle INTEGER PRIMARY KEY,
  id_compra INTEGER NOT NULL,
  id_producto INTEGER NOT NULL,
  cantidad INTEGER NOT NULL
);

INSERT INTO seed_compra_line VALUES
(1,1,1,36),(2,1,2,24),(3,1,3,40),(4,1,4,48),(5,1,5,18),(6,1,6,60),(7,1,7,20),(8,1,8,18),
(9,2,17,72),(10,2,18,24),(11,2,19,60),(12,2,20,36),(13,2,21,24),(14,2,22,48),(15,2,23,24),(16,2,24,24),
(17,3,25,36),(18,3,26,30),(19,3,27,18),(20,3,28,48),(21,3,29,8),(22,3,30,24),(23,3,31,24),(24,3,32,24),
(25,4,33,24),(26,4,34,30),(27,4,35,120),(28,4,36,90),(29,4,37,40),(30,4,38,36),(31,4,39,24),(32,4,40,24),
(33,5,57,36),(34,5,58,24),(35,5,59,18),(36,5,60,18),(37,5,61,24),(38,5,62,36),(39,5,63,30),(40,5,64,24),
(41,6,73,22),(42,6,74,30),(43,6,75,18),(44,6,76,20),(45,6,77,32),(46,6,78,8),(47,6,79,14),(48,6,80,20),
(49,7,81,8),(50,7,82,24),(51,7,83,18),(52,7,84,12),(53,7,85,18),(54,7,86,7),(55,7,87,5),(56,7,88,6),
(57,8,129,36),(58,8,130,30),(59,8,131,36),(60,8,132,30),(61,8,133,20),(62,8,134,18),(63,8,135,40),(64,8,136,20);

DELETE FROM CompraDetalle WHERE id_producto BETWEEN 1 AND 144;

INSERT OR REPLACE INTO Compras
(id_compra, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, fecha_compra, ticket_proveedor, total_compra, id_proveedor, id_usuario, id_empresa)
SELECT
  h.id_compra, 1, h.fecha_compra, h.fecha_compra, 'system', 'system', h.fecha_compra,
  CAST('TICKET-COMPRA-' || h.id_compra AS BLOB),
  ROUND(SUM(l.cantidad * p.precio_compra), 2),
  h.id_proveedor, h.id_usuario, 1
FROM seed_compra_header h
JOIN seed_compra_line l ON l.id_compra = h.id_compra
JOIN seed_productos p ON p.id_producto = l.id_producto
GROUP BY h.id_compra;

INSERT OR REPLACE INTO CompraDetalle
(id_compra_detalle, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, cantidad, precio_unitario, subtotal, id_compra, id_producto)
SELECT
  l.id_compra_detalle, 1, h.fecha_compra, h.fecha_compra, 'system', 'system',
  l.cantidad, p.precio_compra, ROUND(l.cantidad * p.precio_compra, 2), l.id_compra, l.id_producto
FROM seed_compra_line l
JOIN seed_compra_header h ON h.id_compra = l.id_compra
JOIN seed_productos p ON p.id_producto = l.id_producto;

DROP TABLE IF EXISTS seed_venta_header;
CREATE TEMP TABLE seed_venta_header (
  id_venta INTEGER PRIMARY KEY,
  id_usuario INTEGER NOT NULL,
  id_caja INTEGER NOT NULL,
  id_cliente INTEGER,
  id_metodo_pago INTEGER NOT NULL,
  estado TEXT NOT NULL,
  fecha_venta TEXT NOT NULL
);

INSERT INTO seed_venta_header VALUES
(1,2,1,1,1,'COMPLETADA',STRFTIME('%Y-%m-%d %H:%M:%f','now','-14 day','+10 hour')),
(2,2,1,2,2,'COMPLETADA',STRFTIME('%Y-%m-%d %H:%M:%f','now','-13 day','+12 hour')),
(3,3,2,NULL,1,'COMPLETADA',STRFTIME('%Y-%m-%d %H:%M:%f','now','-12 day','+9 hour')),
(4,2,1,3,3,'COMPLETADA',STRFTIME('%Y-%m-%d %H:%M:%f','now','-11 day','+17 hour')),
(5,3,2,4,1,'COMPLETADA',STRFTIME('%Y-%m-%d %H:%M:%f','now','-10 day','+11 hour')),
(6,2,1,5,1,'DEVUELTA PARCIAL',STRFTIME('%Y-%m-%d %H:%M:%f','now','-9 day','+13 hour')),
(7,3,2,NULL,2,'COMPLETADA',STRFTIME('%Y-%m-%d %H:%M:%f','now','-8 day','+18 hour')),
(8,2,1,6,1,'COMPLETADA',STRFTIME('%Y-%m-%d %H:%M:%f','now','-7 day','+8 hour')),
(9,2,1,7,4,'COMPLETADA',STRFTIME('%Y-%m-%d %H:%M:%f','now','-6 day','+15 hour')),
(10,3,2,8,1,'COMPLETADA',STRFTIME('%Y-%m-%d %H:%M:%f','now','-5 day','+19 hour')),
(11,2,1,NULL,2,'COMPLETADA',STRFTIME('%Y-%m-%d %H:%M:%f','now','-4 day','+10 hour')),
(12,4,1,9,3,'COMPLETADA',STRFTIME('%Y-%m-%d %H:%M:%f','now','-4 day','+17 hour')),
(13,2,2,10,1,'COMPLETADA',STRFTIME('%Y-%m-%d %H:%M:%f','now','-3 day','+12 hour')),
(14,3,2,11,1,'COMPLETADA',STRFTIME('%Y-%m-%d %H:%M:%f','now','-3 day','+20 hour')),
(15,2,1,12,2,'COMPLETADA',STRFTIME('%Y-%m-%d %H:%M:%f','now','-2 day','+9 hour')),
(16,3,2,NULL,1,'COMPLETADA',STRFTIME('%Y-%m-%d %H:%M:%f','now','-2 day','+16 hour')),
(17,2,1,1,5,'COMPLETADA',STRFTIME('%Y-%m-%d %H:%M:%f','now','-1 day','+11 hour')),
(18,3,2,2,1,'COMPLETADA',STRFTIME('%Y-%m-%d %H:%M:%f','now','-1 day','+18 hour')),
(19,2,1,NULL,2,'COMPLETADA',STRFTIME('%Y-%m-%d %H:%M:%f','now','-6 hour')),
(20,4,1,3,1,'COMPLETADA',STRFTIME('%Y-%m-%d %H:%M:%f','now','-2 hour'));

DROP TABLE IF EXISTS seed_venta_line;
CREATE TEMP TABLE seed_venta_line (
  id_venta_detalle INTEGER PRIMARY KEY,
  id_venta INTEGER NOT NULL,
  id_producto INTEGER NOT NULL,
  cantidad REAL NOT NULL
);

INSERT INTO seed_venta_line VALUES
(1,1,1,2),(2,1,5,1),(3,1,17,3),(4,1,35,8),(5,1,73,1.2),
(6,2,20,2),(7,2,25,4),(8,2,32,1),(9,2,41,3),
(10,3,19,4),(11,3,51,6),(12,3,52,3),(13,3,57,1),
(14,4,29,0.75),(15,4,30,1),(16,4,33,1),(17,4,67,1),
(18,5,34,2.5),(19,5,75,1.8),(20,5,76,1.2),(21,5,85,2.1),
(22,6,23,2),(23,6,24,1),(24,6,49,4),(25,6,50,2),
(26,7,89,2),(27,7,90,1),(28,7,92,1),(29,7,96,5),
(30,8,65,1),(31,8,68,2),(32,8,72,1),(33,8,103,4),
(34,9,105,1),(35,9,108,6),(36,9,109,4),(37,9,112,1),
(38,10,73,1.5),(39,10,74,2),(40,10,78,0.8),(41,10,80,2),
(42,11,81,0.5),(43,11,82,2),(44,11,84,1),(45,11,87,0.4),
(46,12,121,1),(47,12,122,2),(48,12,125,3),(49,12,127,1),
(50,13,129,2),(51,13,132,1),(52,13,135,1),(53,13,136,1),
(54,14,137,1),(55,14,138,2),(56,14,139,1),(57,14,144,6),
(58,15,9,3),(59,15,12,5),(60,15,14,2),(61,15,16,3),
(62,16,37,3),(63,16,38,2),(64,16,43,2),(65,16,54,1),
(66,17,113,2),(67,17,114,2),(68,17,115,1),(69,17,118,2),
(70,18,58,1),(71,18,59,1),(72,18,60,1),(73,18,63,1),
(74,19,21,2),(75,19,22,4),(76,19,26,2),(77,19,28,6),
(78,20,2,1),(79,20,3,1),(80,20,4,1),(81,20,6,4),(82,20,7,1),(83,20,8,1);

INSERT OR REPLACE INTO Ventas
(id_venta, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, estado, total, id_caja, id_cliente, id_empresa, id_metodo_pago, id_usuario)
SELECT
  h.id_venta, 1, h.fecha_venta, h.fecha_venta, 'system', 'system', h.estado,
  ROUND(SUM(l.cantidad * p.precio_venta), 2),
  h.id_caja, h.id_cliente, 1, h.id_metodo_pago, h.id_usuario
FROM seed_venta_header h
JOIN seed_venta_line l ON l.id_venta = h.id_venta
JOIN seed_productos p ON p.id_producto = l.id_producto
GROUP BY h.id_venta;

INSERT OR REPLACE INTO VentaDetalle
(id_venta_detalle, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, cantidad, precio_unitario, subtotal, id_empresa, id_producto, id_venta)
SELECT
  l.id_venta_detalle, 1, h.fecha_venta, h.fecha_venta, 'system', 'system',
  l.cantidad, p.precio_venta, ROUND(l.cantidad * p.precio_venta, 2), 1, l.id_producto, l.id_venta
FROM seed_venta_line l
JOIN seed_venta_header h ON h.id_venta = l.id_venta
JOIN seed_productos p ON p.id_producto = l.id_producto;

INSERT OR REPLACE INTO Devoluciones
(id_devolucion, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, motivo, total_devolucion, id_empresa, id_venta)
VALUES
(1, 1, STRFTIME('%Y-%m-%d %H:%M:%f','now','-9 day','+14 hour'), STRFTIME('%Y-%m-%d %H:%M:%f','now','-9 day','+14 hour'), 'system', 'system', 'Cliente regreso una bebida sin abrir', 50.00, 1, 6);

INSERT OR REPLACE INTO DevolucionesDetalle
(id_devolucion_detalle, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, cantidad_devuelta, subtotal_devuelto, id_devolucion, id_producto)
VALUES
(1, 1, STRFTIME('%Y-%m-%d %H:%M:%f','now','-9 day','+14 hour'), STRFTIME('%Y-%m-%d %H:%M:%f','now','-9 day','+14 hour'), 'system', 'system', 2, 50.00, 1, 23);

INSERT OR REPLACE INTO MovimientoCaja
(id_movimiento_caja, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, fecha, monto, motivo, tipo, id_caja, id_empresa, id_usuario)
VALUES
(1, 1, STRFTIME('%Y-%m-%d %H:%M:%f','now','-14 day','+8 hour'), STRFTIME('%Y-%m-%d %H:%M:%f','now','-14 day','+8 hour'), 'system', 'system', STRFTIME('%Y-%m-%d %H:%M:%f','now','-14 day','+8 hour'), 1500.00, 'Fondo inicial caja principal', 'INGRESO', 1, 1, 2),
(2, 1, STRFTIME('%Y-%m-%d %H:%M:%f','now','-14 day','+8 hour'), STRFTIME('%Y-%m-%d %H:%M:%f','now','-14 day','+8 hour'), 'system', 'system', STRFTIME('%Y-%m-%d %H:%M:%f','now','-14 day','+8 hour'), 800.00, 'Fondo inicial caja rapida', 'INGRESO', 2, 1, 3),
(3, 1, STRFTIME('%Y-%m-%d %H:%M:%f','now','-10 day','+21 hour'), STRFTIME('%Y-%m-%d %H:%M:%f','now','-10 day','+21 hour'), 'system', 'system', STRFTIME('%Y-%m-%d %H:%M:%f','now','-10 day','+21 hour'), 950.00, 'Retiro parcial a boveda', 'EGRESO', 1, 1, 4),
(4, 1, STRFTIME('%Y-%m-%d %H:%M:%f','now','-8 day','+20 hour'), STRFTIME('%Y-%m-%d %H:%M:%f','now','-8 day','+20 hour'), 'system', 'system', STRFTIME('%Y-%m-%d %H:%M:%f','now','-8 day','+20 hour'), 120.00, 'Reposicion cambio monedas', 'INGRESO', 2, 1, 4),
(5, 1, STRFTIME('%Y-%m-%d %H:%M:%f','now','-6 day','+19 hour'), STRFTIME('%Y-%m-%d %H:%M:%f','now','-6 day','+19 hour'), 'system', 'system', STRFTIME('%Y-%m-%d %H:%M:%f','now','-6 day','+19 hour'), 240.00, 'Compra menor bolsas y limpieza', 'EGRESO', 1, 1, 2),
(6, 1, STRFTIME('%Y-%m-%d %H:%M:%f','now','-3 day','+21 hour'), STRFTIME('%Y-%m-%d %H:%M:%f','now','-3 day','+21 hour'), 'system', 'system', STRFTIME('%Y-%m-%d %H:%M:%f','now','-3 day','+21 hour'), 1250.00, 'Retiro parcial a boveda', 'EGRESO', 2, 1, 4),
(7, 1, STRFTIME('%Y-%m-%d %H:%M:%f','now','-1 day','+20 hour'), STRFTIME('%Y-%m-%d %H:%M:%f','now','-1 day','+20 hour'), 'system', 'system', STRFTIME('%Y-%m-%d %H:%M:%f','now','-1 day','+20 hour'), 300.00, 'Cambio adicional fin de semana', 'INGRESO', 1, 1, 4),
(8, 1, STRFTIME('%Y-%m-%d %H:%M:%f','now','-2 hour'), STRFTIME('%Y-%m-%d %H:%M:%f','now','-2 hour'), 'system', 'system', STRFTIME('%Y-%m-%d %H:%M:%f','now','-2 hour'), 85.00, 'Gasto de mensajeria local', 'EGRESO', 1, 1, 2);

INSERT OR REPLACE INTO EntradasSalidas
(id_registro, estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, fecha_hora, tipo, id_empresa, id_usuario)
VALUES
(1, 1, STRFTIME('%Y-%m-%d %H:%M:%f','now','-2 day','+8 hour'), STRFTIME('%Y-%m-%d %H:%M:%f','now','-2 day','+8 hour'), 'system', 'system', STRFTIME('%Y-%m-%d %H:%M:%f','now','-2 day','+8 hour'), 'ENTRADA', 1, 2),
(2, 1, STRFTIME('%Y-%m-%d %H:%M:%f','now','-2 day','+17 hour'), STRFTIME('%Y-%m-%d %H:%M:%f','now','-2 day','+17 hour'), 'system', 'system', STRFTIME('%Y-%m-%d %H:%M:%f','now','-2 day','+17 hour'), 'SALIDA', 1, 2),
(3, 1, STRFTIME('%Y-%m-%d %H:%M:%f','now','-1 day','+9 hour'), STRFTIME('%Y-%m-%d %H:%M:%f','now','-1 day','+9 hour'), 'system', 'system', STRFTIME('%Y-%m-%d %H:%M:%f','now','-1 day','+9 hour'), 'ENTRADA', 1, 3),
(4, 1, STRFTIME('%Y-%m-%d %H:%M:%f','now','-1 day','+18 hour'), STRFTIME('%Y-%m-%d %H:%M:%f','now','-1 day','+18 hour'), 'system', 'system', STRFTIME('%Y-%m-%d %H:%M:%f','now','-1 day','+18 hour'), 'SALIDA', 1, 3),
(5, 1, STRFTIME('%Y-%m-%d %H:%M:%f','now','-8 hour'), STRFTIME('%Y-%m-%d %H:%M:%f','now','-8 hour'), 'system', 'system', STRFTIME('%Y-%m-%d %H:%M:%f','now','-8 hour'), 'ENTRADA', 1, 2),
(6, 1, STRFTIME('%Y-%m-%d %H:%M:%f','now','-7 hour'), STRFTIME('%Y-%m-%d %H:%M:%f','now','-7 hour'), 'system', 'system', STRFTIME('%Y-%m-%d %H:%M:%f','now','-7 hour'), 'ENTRADA', 1, 4),
(7, 1, STRFTIME('%Y-%m-%d %H:%M:%f','now','-1 hour'), STRFTIME('%Y-%m-%d %H:%M:%f','now','-1 hour'), 'system', 'system', STRFTIME('%Y-%m-%d %H:%M:%f','now','-1 hour'), 'SALIDA', 1, 2),
(8, 1, STRFTIME('%Y-%m-%d %H:%M:%f','now','-30 minute'), STRFTIME('%Y-%m-%d %H:%M:%f','now','-30 minute'), 'system', 'system', STRFTIME('%Y-%m-%d %H:%M:%f','now','-30 minute'), 'SALIDA', 1, 4);

-- Compatibility fixes for databases created before timestamps included fractional seconds.
UPDATE TipoSuscripcion SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE TipoSuscripcion SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE Empresas SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE Empresas SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE Roles SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE Roles SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE Permisos SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE Permisos SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE RolesPermisos SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE RolesPermisos SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE Usuarios SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE Usuarios SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE UsuariosPermisos SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE UsuariosPermisos SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE MetodoPago SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE MetodoPago SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE Unidades SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE Unidades SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE Categorias SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE Categorias SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE Almacen SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE Almacen SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE Cajas SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE Cajas SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE EstadoStock SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE EstadoStock SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE Proveedores SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE Proveedores SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE Clientes SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE Clientes SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE Productos SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE Productos SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE Inventario SET fecha_ultima_compra = fecha_ultima_compra || '.000' WHERE fecha_ultima_compra IS NOT NULL AND LENGTH(fecha_ultima_compra) = 19;
UPDATE Inventario SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE Inventario SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE Lote SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE Lote SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE ProductoEstadoStock SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE ProductoEstadoStock SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE ProveedorProducto SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE ProveedorProducto SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE HistorialCostos SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE HistorialCostos SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE Compras SET fecha_compra = fecha_compra || '.000' WHERE fecha_compra IS NOT NULL AND LENGTH(fecha_compra) = 19;
UPDATE Compras SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE Compras SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE CompraDetalle SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE CompraDetalle SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE Ventas SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE Ventas SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE VentaDetalle SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE VentaDetalle SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE Devoluciones SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE Devoluciones SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE DevolucionesDetalle SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE DevolucionesDetalle SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE MovimientoCaja SET fecha = fecha || '.000' WHERE fecha IS NOT NULL AND LENGTH(fecha) = 19;
UPDATE MovimientoCaja SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE MovimientoCaja SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;
UPDATE EntradasSalidas SET fecha_hora = fecha_hora || '.000' WHERE fecha_hora IS NOT NULL AND LENGTH(fecha_hora) = 19;
UPDATE EntradasSalidas SET fecha_creacion = fecha_creacion || '.000' WHERE fecha_creacion IS NOT NULL AND LENGTH(fecha_creacion) = 19;
UPDATE EntradasSalidas SET fecha_modificacion = fecha_modificacion || '.000' WHERE fecha_modificacion IS NOT NULL AND LENGTH(fecha_modificacion) = 19;

UPDATE Empresas SET fecha_inicio = fecha_inicio || ' 00:00:00.000' WHERE fecha_inicio IS NOT NULL AND LENGTH(fecha_inicio) = 10;
UPDATE Empresas SET fecha_fin = fecha_fin || ' 00:00:00.000' WHERE fecha_fin IS NOT NULL AND LENGTH(fecha_fin) = 10;
UPDATE Lote SET fecha_caducidad = fecha_caducidad || ' 00:00:00.000' WHERE fecha_caducidad IS NOT NULL AND LENGTH(fecha_caducidad) = 10;

DROP TABLE IF EXISTS seed_venta_line;
DROP TABLE IF EXISTS seed_venta_header;
DROP TABLE IF EXISTS seed_compra_line;
DROP TABLE IF EXISTS seed_compra_header;
DROP TABLE IF EXISTS seed_productos;


