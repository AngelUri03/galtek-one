package com.galtekone.config;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.util.List;

import javax.sql.DataSource;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Component
@Profile("desktop")
@RequiredArgsConstructor
public class PermisosCatalogMigrator {

    private record PermissionSeed(String action, String key, String description, String module, String name) {}

    private static final List<PermissionSeed> PERMISSIONS = List.of(
        new PermissionSeed("VER", "VENTAS_VER", "Consultar pantalla e historial de ventas", "VENTAS", "Ver ventas"),
        new PermissionSeed("CREAR", "VENTAS_CREAR", "Registrar ventas y pagos", "VENTAS", "Crear ventas"),
        new PermissionSeed("CANCELAR", "VENTAS_CANCELAR", "Cancelar ventas y registrar devoluciones", "VENTAS", "Cancelar ventas"),
        new PermissionSeed("VER", "INVENTARIO_VER", "Consultar existencias, lotes y alertas", "INVENTARIO", "Ver inventario"),
        new PermissionSeed("EDITAR", "INVENTARIO_EDITAR", "Crear productos y ajustar stock", "INVENTARIO", "Editar inventario"),
        new PermissionSeed("VER", "CLIENTES_VER", "Consultar clientes", "CLIENTES", "Ver clientes"),
        new PermissionSeed("EDITAR", "CLIENTES_EDITAR", "Crear y editar clientes", "CLIENTES", "Editar clientes"),
        new PermissionSeed("VER", "COMPRAS_VER", "Consultar compras y proveedores", "COMPRAS", "Ver compras"),
        new PermissionSeed("CREAR", "COMPRAS_CREAR", "Registrar compras y costos", "COMPRAS", "Crear compras"),
        new PermissionSeed("VER", "REPORTES_VER", "Consultar reportes financieros", "REPORTES", "Ver reportes"),
        new PermissionSeed("ADMIN", "CONFIG_USUARIOS", "Administrar usuarios, roles y permisos", "CONFIGURACION", "Administrar usuarios"),
        new PermissionSeed("EDITAR", "CONFIG_TIENDA", "Configurar tienda, cajas y parametros", "CONFIGURACION", "Configurar tienda"),
        new PermissionSeed("VER", "CAJA_VER", "Consultar balance y movimientos de caja", "CAJA", "Ver caja"),
        new PermissionSeed("EDITAR", "CAJA_MOVIMIENTOS", "Registrar ingresos y egresos manuales", "CAJA", "Movimientos de caja"),
        new PermissionSeed("DESCUENTO", "VENTAS_APLICAR_DESCUENTO", "Autorizar descuentos durante la venta", "VENTAS", "Aplicar descuentos"),
        new PermissionSeed("PRECIO_EDITAR", "VENTAS_CAMBIAR_PRECIO", "Modificar precio manualmente durante la venta", "VENTAS", "Cambiar precio"),
        new PermissionSeed("DEVOLUCION", "VENTAS_DEVOLUCION", "Registrar devoluciones de productos vendidos", "VENTAS", "Procesar devoluciones"),
        new PermissionSeed("REIMPRIMIR_TICKET", "VENTAS_REIMPRIMIR_TICKET", "Reimprimir comprobantes de venta", "VENTAS", "Reimprimir ticket"),
        new PermissionSeed("VER", "VENTAS_VER_HISTORIAL", "Consultar ventas anteriores", "VENTAS", "Ver historial de ventas"),
        new PermissionSeed("CLIENTE", "VENTAS_SELECCIONAR_CLIENTE", "Asignar cliente a una venta", "VENTAS", "Seleccionar cliente"),
        new PermissionSeed("ABRIR", "CAJA_ABRIR", "Iniciar turno operativo de caja", "CAJA", "Abrir turno"),
        new PermissionSeed("CERRAR", "CAJA_CERRAR_PROPIA", "Cerrar la caja del usuario actual", "CAJA", "Cerrar caja propia"),
        new PermissionSeed("CERRAR", "CAJA_CERRAR_AJENA", "Cerrar caja operada por otro usuario", "CAJA", "Cerrar caja ajena"),
        new PermissionSeed("ENTRADA", "CAJA_ENTRADA_EFECTIVO", "Registrar ingresos manuales de efectivo", "CAJA", "Entrada de efectivo"),
        new PermissionSeed("RETIRO", "CAJA_RETIRO_EFECTIVO", "Registrar retiros manuales de efectivo", "CAJA", "Retiro de efectivo"),
        new PermissionSeed("ARQUEO", "CAJA_VER_ARQUEO", "Consultar conteos y diferencias de caja", "CAJA", "Ver arqueo"),
        new PermissionSeed("AJUSTAR", "CAJA_AJUSTAR_DIFERENCIA", "Corregir diferencias de arqueo", "CAJA", "Ajustar diferencia"),
        new PermissionSeed("OPEN", "CASH_OPEN", "Abrir turno operativo de caja", "CAJA", "Abrir turno"),
        new PermissionSeed("CLOSE_OWN", "CASH_CLOSE_OWN", "Cerrar la sesion de caja propia", "CAJA", "Cerrar caja propia"),
        new PermissionSeed("CLOSE_OTHERS", "CASH_CLOSE_OTHERS", "Cerrar o conciliar una sesion de otro usuario", "CAJA", "Cerrar caja de otros"),
        new PermissionSeed("ENTRY", "CASH_MOVEMENT_ENTRY", "Registrar entradas manuales de efectivo", "CAJA", "Entrada manual"),
        new PermissionSeed("WITHDRAWAL", "CASH_MOVEMENT_WITHDRAWAL", "Registrar retiros manuales de efectivo", "CAJA", "Retiro manual"),
        new PermissionSeed("SUMMARY", "CASH_VIEW_SUMMARY", "Consultar resumen operativo de caja", "CAJA", "Ver resumen de caja"),
        new PermissionSeed("HISTORY", "CASH_VIEW_HISTORY", "Consultar historial de sesiones y movimientos de caja", "CAJA", "Ver historial de caja"),
        new PermissionSeed("SUMMARY", "CASH_VIEW_SALES_SUMMARY", "Consultar ventas y movimientos sin revelar efectivo esperado", "CAJA", "Ver resumen de ventas"),
        new PermissionSeed("MOVEMENTS", "CASH_VIEW_MOVEMENTS", "Consultar movimientos operativos de caja", "CAJA", "Ver movimientos de caja"),
        new PermissionSeed("EXPECTED", "CASH_VIEW_EXPECTED_BALANCE", "Consultar efectivo esperado de caja", "CAJA", "Ver efectivo esperado"),
        new PermissionSeed("REVEAL", "CASH_REVEAL_EXPECTED_BALANCE", "Revelar efectivo esperado con auditoria", "CAJA", "Revelar efectivo esperado"),
        new PermissionSeed("INCIDENTS", "CASH_REVIEW_INCIDENTS", "Revisar incidencias de caja pendientes", "CAJA", "Revisar incidencias"),
        new PermissionSeed("RESOLVE", "CASH_RESOLVE_DISCREPANCY", "Resolver discrepancias e incidencias de caja", "CAJA", "Resolver discrepancias"),
        new PermissionSeed("POLICY", "CASH_MANAGE_POLICY", "Configurar politica de caja y turnos", "CAJA", "Gestionar politica de caja"),
        new PermissionSeed("CREAR", "INVENTARIO_CREAR_PRODUCTO", "Dar de alta productos en inventario", "INVENTARIO", "Crear producto"),
        new PermissionSeed("EDITAR", "INVENTARIO_EDITAR_PRODUCTO", "Modificar datos generales de productos", "INVENTARIO", "Editar producto"),
        new PermissionSeed("PRECIO_EDITAR", "INVENTARIO_EDITAR_PRECIO", "Modificar precios de venta", "INVENTARIO", "Editar precio"),
        new PermissionSeed("COSTO_VER", "INVENTARIO_VER_COSTOS", "Consultar costos y margen base", "INVENTARIO", "Ver costos"),
        new PermissionSeed("AJUSTAR", "INVENTARIO_AJUSTE_STOCK", "Corregir existencias manualmente", "INVENTARIO", "Ajustar stock"),
        new PermissionSeed("AJUSTAR", "INVENTARIO_AJUSTE_POSITIVO", "Aumentar existencias manualmente", "INVENTARIO", "Ajuste positivo"),
        new PermissionSeed("AJUSTAR", "INVENTARIO_AJUSTE_NEGATIVO", "Disminuir existencias manualmente", "INVENTARIO", "Ajuste negativo"),
        new PermissionSeed("ARCHIVAR", "INVENTARIO_ARCHIVAR_PRODUCTO", "Ocultar producto sin borrar historial", "INVENTARIO", "Archivar producto"),
        new PermissionSeed("ELIMINAR", "INVENTARIO_ELIMINAR_SIN_USO", "Eliminar productos sin movimientos", "INVENTARIO", "Eliminar producto sin uso"),
        new PermissionSeed("IMPORTAR", "INVENTARIO_IMPORTAR", "Cargar datos masivos de productos", "INVENTARIO", "Importar inventario"),
        new PermissionSeed("EXPORTAR", "INVENTARIO_EXPORTAR", "Exportar datos de inventario", "INVENTARIO", "Exportar inventario"),
        new PermissionSeed("CONFIRMAR", "COMPRAS_CONFIRMAR", "Confirmar recepcion y afectar inventario", "COMPRAS", "Confirmar compras"),
        new PermissionSeed("CANCELAR", "COMPRAS_CANCELAR", "Cancelar compras registradas", "COMPRAS", "Cancelar compras"),
        new PermissionSeed("DEVOLUCION", "COMPRAS_DEVOLVER", "Registrar devoluciones a proveedores", "COMPRAS", "Devolver compra"),
        new PermissionSeed("COSTO_VER", "COMPRAS_VER_COSTOS", "Consultar costos dentro de compras", "COMPRAS", "Ver costos de compra"),
        new PermissionSeed("PAGO", "COMPRAS_GESTIONAR_PAGO", "Administrar pagos a proveedores", "COMPRAS", "Gestionar pagos"),
        new PermissionSeed("CREAR", "COMPRAS_ALTA_RAPIDA_PRODUCTO", "Crear productos desde compras", "COMPRAS", "Alta rapida de producto"),
        new PermissionSeed("CREAR", "COMPRAS_ALTA_RAPIDA_PROVEEDOR", "Crear proveedores desde compras", "COMPRAS", "Alta rapida de proveedor"),
        new PermissionSeed("VER", "PROVEEDORES_VER", "Consultar directorio de proveedores", "PROVEEDORES", "Ver proveedores"),
        new PermissionSeed("EDITAR", "PROVEEDORES_CREAR_EDITAR", "Modificar datos de proveedores", "PROVEEDORES", "Crear y editar proveedores"),
        new PermissionSeed("PRODUCTOS", "PROVEEDORES_PRODUCTOS", "Relacionar productos con proveedores", "PROVEEDORES", "Gestionar productos"),
        new PermissionSeed("ACTIVOS", "PROVEEDORES_ACTIVOS", "Activar o desactivar proveedores", "PROVEEDORES", "Gestionar activos"),
        new PermissionSeed("DOCUMENTOS", "PROVEEDORES_DOCUMENTOS", "Administrar documentos asociados", "PROVEEDORES", "Documentos de proveedores"),
        new PermissionSeed("AUDITORIA", "PROVEEDORES_VER_AUDITORIA", "Consultar historial de cambios", "PROVEEDORES", "Ver auditoria"),
        new PermissionSeed("ARCHIVAR", "PROVEEDORES_ARCHIVAR", "Sacar proveedor de operacion sin borrar historial", "PROVEEDORES", "Archivar proveedor"),
        new PermissionSeed("ELIMINAR", "PROVEEDORES_ELIMINAR_SEGURO", "Eliminar solo si no rompe historial", "PROVEEDORES", "Eliminar proveedor seguro"),
        new PermissionSeed("EDITAR", "CLIENTES_CREAR_EDITAR", "Modificar datos generales de clientes", "CLIENTES", "Crear y editar clientes"),
        new PermissionSeed("FISCALES", "CLIENTES_VER_FISCALES", "Consultar datos fiscales de clientes", "CLIENTES", "Ver fiscales"),
        new PermissionSeed("FISCALES", "CLIENTES_EDITAR_FISCALES", "Modificar datos fiscales de clientes", "CLIENTES", "Editar fiscales"),
        new PermissionSeed("HISTORIAL", "CLIENTES_VER_COMPRAS", "Consultar historial de compras del cliente", "CLIENTES", "Ver compras del cliente"),
        new PermissionSeed("ARCHIVAR", "CLIENTES_ARCHIVAR", "Sacar cliente de operacion sin borrar historial", "CLIENTES", "Archivar cliente"),
        new PermissionSeed("ELIMINAR", "CLIENTES_ELIMINAR_SEGURO", "Eliminar solo si no rompe historial", "CLIENTES", "Eliminar cliente seguro"),
        new PermissionSeed("VENTAS", "REPORTES_VENTAS", "Consultar reportes de ventas", "REPORTES", "Reportes de ventas"),
        new PermissionSeed("COMPRAS", "REPORTES_COMPRAS", "Consultar reportes de compras", "REPORTES", "Reportes de compras"),
        new PermissionSeed("BALANCE", "REPORTES_BALANCE", "Consultar balance general", "REPORTES", "Balance operativo"),
        new PermissionSeed("UTILIDAD", "REPORTES_VER_UTILIDAD", "Consultar utilidad y margen", "REPORTES", "Ver utilidad"),
        new PermissionSeed("EXPORTAR", "REPORTES_EXPORTAR", "Exportar informacion de reportes", "REPORTES", "Exportar reportes"),
        new PermissionSeed("VER", "CONFIG_VER", "Consultar ajustes del sistema", "CONFIGURACION", "Ver configuracion"),
        new PermissionSeed("VER", "CONFIG_USUARIOS_VER", "Consultar usuarios del sistema", "CONFIGURACION", "Ver usuarios"),
        new PermissionSeed("USUARIOS", "CONFIG_USUARIOS_GESTIONAR", "Crear, editar o desactivar usuarios", "CONFIGURACION", "Gestionar usuarios"),
        new PermissionSeed("RESET_PASSWORD", "CONFIG_USUARIOS_PASSWORD", "Generar password temporal para usuarios", "CONFIGURACION", "Restablecer password"),
        new PermissionSeed("VER", "CONFIG_ROLES_VER", "Consultar roles y permisos asignados", "CONFIGURACION", "Ver roles"),
        new PermissionSeed("ROLES", "CONFIG_ROLES_GESTIONAR", "Crear, editar o desactivar roles", "CONFIGURACION", "Gestionar roles"),
        new PermissionSeed("ROLES", "CONFIG_ROLES_PERMISOS", "Asignar permisos existentes a roles", "CONFIGURACION", "Gestionar permisos de roles"),
        new PermissionSeed("OVERRIDES", "CONFIG_OVERRIDES_GESTIONAR", "Autorizar permisos especiales por usuario", "CONFIGURACION", "Gestionar overrides"),
        new PermissionSeed("EDITAR", "CONFIG_CAJA_EDITAR", "Modificar reglas de caja", "CONFIGURACION", "Editar caja"),
        new PermissionSeed("EDITAR", "CONFIG_PAGOS_EDITAR", "Modificar metodos de pago y terminal", "CONFIGURACION", "Editar pagos"),
        new PermissionSeed("EDITAR", "CONFIG_TICKET_EDITAR", "Modificar formato de ticket", "CONFIGURACION", "Editar ticket"),
        new PermissionSeed("EDITAR", "CONFIG_INVENTARIO_EDITAR", "Modificar configuracion de inventario", "CONFIGURACION", "Editar reglas de inventario"),
        new PermissionSeed("EDITAR", "CONFIG_COMPRAS_EDITAR", "Modificar configuracion de compras", "CONFIGURACION", "Editar reglas de compras"),
        new PermissionSeed("EDITAR", "CONFIG_CLIENTES_EDITAR", "Modificar configuracion de clientes", "CONFIGURACION", "Editar reglas de clientes"),
        new PermissionSeed("EDITAR", "CONFIG_PROVEEDORES_EDITAR", "Modificar configuracion de proveedores", "CONFIGURACION", "Editar reglas de proveedores"),
        new PermissionSeed("RESPALDO", "CONFIG_RESPALDOS", "Generar y borrar respaldos", "CONFIGURACION", "Gestionar respaldos"),
        new PermissionSeed("RESTAURAR", "CONFIG_RESTAURAR_RESPALDO", "Restaurar informacion desde respaldo", "CONFIGURACION", "Restaurar respaldo"),
        new PermissionSeed("AUDITORIA", "CONFIG_AUDITORIA_VER", "Consultar bitacora de acciones", "CONFIGURACION", "Ver auditoria"),
        new PermissionSeed("VER", "FACTURACION_VER_DATOS", "Consultar datos de facturacion", "FACTURACION", "Ver datos fiscales"),
        new PermissionSeed("EDITAR", "FACTURACION_EDITAR_DATOS", "Modificar datos de facturacion", "FACTURACION", "Editar datos fiscales"),
        new PermissionSeed("EXPORTAR", "FACTURACION_EXPORTAR_INFO", "Exportar datos fiscales", "FACTURACION", "Exportar informacion fiscal")
    );

    private final DataSource dataSource;

    @PostConstruct
    public void migrate() {
        try (Connection connection = dataSource.getConnection()) {
            boolean originalAutoCommit = connection.getAutoCommit();
            connection.setAutoCommit(false);
            try {
                insertMissingPermissions(connection);
                ensureAdministratorHasAllPermissions(connection);
                ensureDefaultCashRolePermissions(connection);
                connection.commit();
            } catch (Exception ex) {
                connection.rollback();
                throw ex;
            } finally {
                connection.setAutoCommit(originalAutoCommit);
            }
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo preparar el catalogo de permisos", ex);
        }
    }

    private void insertMissingPermissions(Connection connection) throws Exception {
        String sql = """
            INSERT INTO Permisos
            (estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, accion, clave, descripcion, modulo, nombre)
            SELECT 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'),
                   'system', 'system', ?, ?, ?, ?, ?
            WHERE NOT EXISTS (SELECT 1 FROM Permisos WHERE clave = ?)
            """;

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            for (PermissionSeed permission : PERMISSIONS) {
                statement.setString(1, permission.action());
                statement.setString(2, permission.key());
                statement.setString(3, permission.description());
                statement.setString(4, permission.module());
                statement.setString(5, permission.name());
                statement.setString(6, permission.key());
                statement.addBatch();
            }
            statement.executeBatch();
        }
    }

    private void ensureAdministratorHasAllPermissions(Connection connection) throws Exception {
        String sql = """
            INSERT INTO RolesPermisos
            (estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, id_permiso, id_rol)
            SELECT 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'),
                   'system', 'system', p.id_permiso, r.id_rol
            FROM Roles r
            CROSS JOIN Permisos p
            WHERE UPPER(r.nombre_rol) IN ('ADMINISTRADOR', 'ADMIN')
              AND NOT EXISTS (
                  SELECT 1
                  FROM RolesPermisos rp
                  WHERE rp.id_rol = r.id_rol
                    AND rp.id_permiso = p.id_permiso
              )
            """;

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.executeUpdate();
        }
    }

    private void ensureDefaultCashRolePermissions(Connection connection) throws Exception {
        assignPermissions(connection,
                List.of("VENDEDOR"),
                List.of("CASH_OPEN", "CASH_CLOSE_OWN", "CASH_VIEW_SUMMARY", "CASH_VIEW_SALES_SUMMARY"));

        assignPermissions(connection,
                List.of("CAJERO"),
                List.of("CASH_OPEN", "CASH_CLOSE_OWN", "CASH_VIEW_SUMMARY", "CASH_VIEW_HISTORY",
                        "CASH_VIEW_SALES_SUMMARY", "CASH_VIEW_MOVEMENTS"));

        assignPermissions(connection,
                List.of("SUPERVISOR"),
                List.of("CASH_OPEN", "CASH_CLOSE_OWN", "CASH_CLOSE_OTHERS", "CASH_MOVEMENT_ENTRY",
                        "CASH_MOVEMENT_WITHDRAWAL", "CASH_VIEW_SUMMARY", "CASH_VIEW_HISTORY",
                        "CASH_VIEW_SALES_SUMMARY", "CASH_VIEW_MOVEMENTS", "CASH_VIEW_EXPECTED_BALANCE",
                        "CASH_REVEAL_EXPECTED_BALANCE", "CASH_REVIEW_INCIDENTS", "CASH_RESOLVE_DISCREPANCY",
                        "CASH_MANAGE_POLICY"));
    }

    private void assignPermissions(Connection connection, List<String> roleNames, List<String> permissionKeys)
            throws Exception {
        String roleNamesSql = roleNames.stream().map(value -> "?").reduce((a, b) -> a + "," + b).orElse("?");
        String keysSql = permissionKeys.stream().map(value -> "?").reduce((a, b) -> a + "," + b).orElse("?");
        String sql = """
            INSERT INTO RolesPermisos
            (estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, id_permiso, id_rol)
            SELECT 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'),
                   'system', 'system', p.id_permiso, r.id_rol
            FROM Roles r
            JOIN Permisos p ON UPPER(p.clave) IN (__KEYS__)
            WHERE UPPER(r.nombre_rol) IN (__ROLES__)
              AND NOT EXISTS (
                  SELECT 1
                  FROM RolesPermisos rp
                  WHERE rp.id_rol = r.id_rol
                    AND rp.id_permiso = p.id_permiso
              )
            """.replace("__KEYS__", keysSql).replace("__ROLES__", roleNamesSql);

        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            int index = 1;
            for (String key : permissionKeys) {
                statement.setString(index++, key.toUpperCase());
            }
            for (String roleName : roleNames) {
                statement.setString(index++, roleName.toUpperCase());
            }
            statement.executeUpdate();
        }
    }
}
