package com.galtekone.config;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import javax.sql.DataSource;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Component
@Profile("desktop")
@RequiredArgsConstructor
public class ProveedoresSchemaMigrator {

    private final DataSource dataSource;

    @PostConstruct
    public void migrate() {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("DROP TRIGGER IF EXISTS trg_proveedores_required_insert");
            statement.execute("DROP TRIGGER IF EXISTS trg_proveedores_required_update");
            statement.execute("DROP TRIGGER IF EXISTS trg_proveedor_contacto_required_insert");
            statement.execute("DROP TRIGGER IF EXISTS trg_proveedor_contacto_required_update");

            migrateHistorialCostos(statement);

            for (String sql : sanitizeSql()) {
                statement.execute(sql);
            }

            statement.execute("CREATE INDEX IF NOT EXISTS idx_proveedor_producto_proveedor_empresa ON ProveedorProducto(id_proveedor, id_empresa)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_proveedor_producto_prov_prod_emp ON ProveedorProducto(id_proveedor, id_producto, id_empresa)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_proveedor_activo_proveedor_empresa ON ProveedorActivo(id_proveedor, id_empresa)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_proveedor_activo_hist_activo_empresa ON ProveedorActivoHistorial(id_proveedor_activo, id_empresa)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_historial_costos_prov_prod_emp_fecha ON HistorialCostos(id_proveedor, id_producto, id_empresa, fecha_cambio DESC)");

            statement.execute(proveedorRequiredTrigger("trg_proveedores_required_insert", "INSERT"));
            statement.execute(proveedorRequiredTrigger("trg_proveedores_required_update", "UPDATE"));
            statement.execute(contactoRequiredTrigger("trg_proveedor_contacto_required_insert", "INSERT"));
            statement.execute(contactoRequiredTrigger("trg_proveedor_contacto_required_update", "UPDATE"));
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo preparar el esquema de proveedores", ex);
        }
    }

    private String[] sanitizeSql() {
        return new String[] {
                """
                UPDATE Proveedores
                SET tipo_proveedor = UPPER(REPLACE(REPLACE(TRIM(tipo_proveedor), ' ', '_'), '-', '_'))
                WHERE tipo_proveedor IS NOT NULL AND TRIM(tipo_proveedor) <> ''
                """,
                """
                UPDATE Proveedores
                SET modalidad_abastecimiento = UPPER(REPLACE(REPLACE(TRIM(modalidad_abastecimiento), ' ', '_'), '-', '_'))
                WHERE modalidad_abastecimiento IS NOT NULL AND TRIM(modalidad_abastecimiento) <> ''
                """,
                """
                UPDATE Proveedores
                SET forma_pago_principal = UPPER(REPLACE(REPLACE(TRIM(forma_pago_principal), ' ', '_'), '-', '_'))
                WHERE forma_pago_principal IS NOT NULL AND TRIM(forma_pago_principal) <> ''
                """,
                """
                UPDATE Proveedores
                SET estado_proveedor = UPPER(REPLACE(REPLACE(TRIM(estado_proveedor), ' ', '_'), '-', '_'))
                WHERE estado_proveedor IS NOT NULL AND TRIM(estado_proveedor) <> ''
                """,
                """
                UPDATE Proveedores
                SET tipo_proveedor = 'PROVEEDOR_INFORMAL'
                WHERE tipo_proveedor IS NULL
                   OR TRIM(tipo_proveedor) = ''
                   OR tipo_proveedor NOT IN ('DISTRIBUIDOR_FORMAL', 'PROVEEDOR_INFORMAL', 'ESTABLECIMIENTO_COMPRA')
                """,
                """
                UPDATE Proveedores
                SET modalidad_abastecimiento = 'ENTREGA_DOMICILIO'
                WHERE modalidad_abastecimiento IS NULL
                   OR TRIM(modalidad_abastecimiento) = ''
                   OR modalidad_abastecimiento NOT IN ('ENTREGA_DOMICILIO', 'RECOGE_TENDERO', 'MIXTO')
                """,
                """
                UPDATE Proveedores
                SET forma_pago_principal = CASE WHEN maneja_credito = 1 THEN 'CREDITO' ELSE 'CONTADO' END
                WHERE forma_pago_principal IS NULL
                   OR TRIM(forma_pago_principal) = ''
                   OR forma_pago_principal NOT IN ('CONTADO', 'CREDITO', 'MIXTO')
                """,
                """
                UPDATE Proveedores
                SET estado_proveedor = CASE WHEN estatus = 0 THEN 'INACTIVO' ELSE 'ACTIVO' END
                WHERE estado_proveedor IS NULL
                   OR TRIM(estado_proveedor) = ''
                   OR estado_proveedor NOT IN ('ACTIVO', 'INACTIVO', 'ARCHIVADO')
                """,
                """
                UPDATE Proveedores
                SET razon_social = nombre
                WHERE tipo_proveedor = 'DISTRIBUIDOR_FORMAL'
                  AND (razon_social IS NULL OR TRIM(razon_social) = '')
                  AND rfc IS NOT NULL
                  AND TRIM(rfc) <> ''
                """,
                """
                UPDATE Proveedores
                SET tipo_proveedor = 'PROVEEDOR_INFORMAL'
                WHERE tipo_proveedor = 'DISTRIBUIDOR_FORMAL'
                  AND (rfc IS NULL OR TRIM(rfc) = '' OR LENGTH(TRIM(rfc)) NOT IN (12, 13))
                """,
                "UPDATE Proveedores SET maneja_credito = CASE WHEN forma_pago_principal IN ('CREDITO', 'MIXTO') THEN 1 ELSE 0 END",
                """
                UPDATE Proveedores
                SET dias_credito = 7
                WHERE forma_pago_principal IN ('CREDITO', 'MIXTO')
                  AND (dias_credito IS NULL OR dias_credito <= 0)
                """,
                """
                UPDATE Proveedores
                SET limite_credito = 5000
                WHERE forma_pago_principal IN ('CREDITO', 'MIXTO')
                  AND (limite_credito IS NULL OR limite_credito <= 0)
                """,
                "UPDATE Proveedores SET dias_credito = NULL, limite_credito = NULL WHERE forma_pago_principal = 'CONTADO'",
                """
                UPDATE Proveedores
                SET estado_proveedor = 'ACTIVO',
                    estatus = 1,
                    estado_proveedor_anterior = NULL,
                    ultima_accion_estado = 'REACTIVAR',
                    motivo_cambio_estado = 'Reactivado para permitir eliminacion si fue alta por error',
                    fecha_cambio_estado = STRFTIME('%Y-%m-%d %H:%M:%f', 'now')
                WHERE LOWER(TRIM(nombre)) = 'ejemplo'
                """,
                "UPDATE Proveedores SET estatus = CASE WHEN estado_proveedor = 'ACTIVO' THEN 1 ELSE 0 END",
                "UPDATE Proveedores SET contacto = 'Contacto ' || nombre WHERE contacto IS NULL OR TRIM(contacto) = ''",
                """
                UPDATE Proveedores
                SET telefono = printf('55%08d', id_proveedor)
                WHERE (telefono IS NULL OR TRIM(telefono) = '')
                  AND (correo IS NULL OR TRIM(correo) = '')
                """,
                """
                UPDATE Proveedores
                SET observaciones_abastecimiento = REPLACE(observaciones_abastecimiento, 'se recoge en local', 'preparar pedido para recoleccion en local')
                WHERE observaciones_abastecimiento LIKE '%se recoge en local%'
                """,
                """
                UPDATE ProveedorContacto
                SET rol = 'OTRO'
                WHERE rol IS NULL
                   OR TRIM(rol) = ''
                   OR rol NOT IN ('VENDEDOR', 'REPARTIDOR', 'COBRANZA', 'ATENCION_CLIENTES', 'ENCARGADO', 'OTRO')
                """,
                """
                UPDATE ProveedorContacto
                SET estado_contacto = CASE WHEN estatus = 0 THEN 'INACTIVO' ELSE 'ACTIVO' END
                WHERE estado_contacto IS NULL
                   OR TRIM(estado_contacto) = ''
                   OR estado_contacto NOT IN ('ACTIVO', 'INACTIVO')
                """,
                "UPDATE ProveedorContacto SET estatus = CASE WHEN estado_contacto = 'ACTIVO' THEN 1 ELSE 0 END",
                "UPDATE ProveedorContacto SET contacto_principal = 0 WHERE contacto_principal IS NULL",
                """
                INSERT INTO ProveedorContacto
                (estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion, nombre, rol, telefono, whatsapp, correo, notas, contacto_principal, estado_contacto, id_proveedor, id_empresa)
                SELECT
                  CASE WHEN p.estado_proveedor = 'ACTIVO' THEN 1 ELSE 0 END,
                  STRFTIME('%Y-%m-%d %H:%M:%f', 'now'),
                  STRFTIME('%Y-%m-%d %H:%M:%f', 'now'),
                  'system',
                  'system',
                  COALESCE(NULLIF(TRIM(p.contacto), ''), 'Contacto ' || p.nombre),
                  'VENDEDOR',
                  COALESCE(NULLIF(TRIM(p.telefono), ''), printf('55%08d', p.id_proveedor)),
                  COALESCE(NULLIF(TRIM(p.telefono), ''), printf('55%08d', p.id_proveedor)),
                  COALESCE(NULLIF(TRIM(p.correo), ''), ''),
                  'Contacto principal generado para completar datos obligatorios.',
                  1,
                  CASE WHEN p.estado_proveedor = 'ACTIVO' THEN 'ACTIVO' ELSE 'INACTIVO' END,
                  p.id_proveedor,
                  p.id_empresa
                FROM Proveedores p
                WHERE NOT EXISTS (
                  SELECT 1
                  FROM ProveedorContacto c
                  WHERE c.id_proveedor = p.id_proveedor
                    AND c.id_empresa = p.id_empresa
                    AND c.nombre IS NOT NULL
                    AND TRIM(c.nombre) <> ''
                    AND (
                      COALESCE(TRIM(c.telefono), '') <> ''
                      OR COALESCE(TRIM(c.whatsapp), '') <> ''
                      OR COALESCE(TRIM(c.correo), '') <> ''
                    )
                )
                """,
                """
                UPDATE ProveedorContacto
                SET contacto_principal = 1
                WHERE id_proveedor_contacto IN (
                  SELECT MIN(c.id_proveedor_contacto)
                  FROM ProveedorContacto c
                  GROUP BY c.id_proveedor, c.id_empresa
                  HAVING SUM(CASE WHEN c.contacto_principal = 1 THEN 1 ELSE 0 END) = 0
                )
                """,
                """
                UPDATE Proveedores
                SET
                  contacto = COALESCE((
                    SELECT NULLIF(TRIM(c.nombre), '')
                    FROM ProveedorContacto c
                    WHERE c.id_proveedor = Proveedores.id_proveedor
                      AND c.id_empresa = Proveedores.id_empresa
                      AND c.contacto_principal = 1
                    ORDER BY c.id_proveedor_contacto
                    LIMIT 1
                  ), contacto),
                  telefono = COALESCE((
                    SELECT NULLIF(TRIM(c.telefono), '')
                    FROM ProveedorContacto c
                    WHERE c.id_proveedor = Proveedores.id_proveedor
                      AND c.id_empresa = Proveedores.id_empresa
                      AND c.contacto_principal = 1
                    ORDER BY c.id_proveedor_contacto
                    LIMIT 1
                  ), telefono),
                  correo = COALESCE((
                    SELECT NULLIF(TRIM(c.correo), '')
                    FROM ProveedorContacto c
                    WHERE c.id_proveedor = Proveedores.id_proveedor
                      AND c.id_empresa = Proveedores.id_empresa
                      AND c.contacto_principal = 1
                    ORDER BY c.id_proveedor_contacto
                    LIMIT 1
                  ), correo)
                """,
                """
                UPDATE ProveedorActivo
                SET fecha_entrega = CASE
                  WHEN LENGTH(TRIM(CAST(fecha_entrega AS TEXT))) >= 13
                    THEN DATE(CAST(CAST(fecha_entrega AS INTEGER) / 1000 AS INTEGER), 'unixepoch')
                  ELSE DATE(CAST(fecha_entrega AS INTEGER), 'unixepoch')
                END
                WHERE fecha_entrega IS NOT NULL
                  AND TRIM(CAST(fecha_entrega AS TEXT)) NOT LIKE '%-%'
                  AND CAST(fecha_entrega AS INTEGER) > 1000000000
                """,
                """
                UPDATE ProveedorActivo
                SET fecha_regreso = CASE
                  WHEN LENGTH(TRIM(CAST(fecha_regreso AS TEXT))) >= 13
                    THEN DATE(CAST(CAST(fecha_regreso AS INTEGER) / 1000 AS INTEGER), 'unixepoch')
                  ELSE DATE(CAST(fecha_regreso AS INTEGER), 'unixepoch')
                END
                WHERE fecha_regreso IS NOT NULL
                  AND TRIM(CAST(fecha_regreso AS TEXT)) NOT LIKE '%-%'
                  AND CAST(fecha_regreso AS INTEGER) > 1000000000
                """
        };
    }

    private void migrateHistorialCostos(Statement statement) throws Exception {
        if (!hasTable(statement, "HistorialCostos")) {
            return;
        }

        ensureColumn(statement, "HistorialCostos", "costo_anterior", "NUMERIC(12,2)");
        ensureColumn(statement, "HistorialCostos", "costo_nuevo", "NUMERIC(12,2)");
        ensureColumn(statement, "HistorialCostos", "diferencia", "NUMERIC(12,2)");
        ensureColumn(statement, "HistorialCostos", "motivo", "varchar(500)");
        ensureColumn(statement, "HistorialCostos", "referencia", "varchar(100)");
        ensureColumn(statement, "HistorialCostos", "usuario", "varchar(100)");
        ensureColumn(statement, "HistorialCostos", "fecha_cambio", "timestamp");

        if (hasColumn(statement, "HistorialCostos", "precio_compra")) {
            statement.execute("""
                    UPDATE HistorialCostos
                    SET costo_nuevo = COALESCE(costo_nuevo, precio_compra, 0)
                    WHERE costo_nuevo IS NULL
                    """);
        } else {
            statement.execute("UPDATE HistorialCostos SET costo_nuevo = 0 WHERE costo_nuevo IS NULL");
        }

        statement.execute("""
                UPDATE HistorialCostos
                SET fecha_cambio = COALESCE(fecha_cambio, fecha_creacion, fecha_modificacion, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'))
                WHERE fecha_cambio IS NULL
                """);
        statement.execute("""
                UPDATE HistorialCostos
                SET usuario = COALESCE(NULLIF(TRIM(usuario), ''), NULLIF(TRIM(usuario_modificacion), ''), NULLIF(TRIM(usuario_creacion), ''), 'system')
                WHERE usuario IS NULL OR TRIM(usuario) = ''
                """);
        statement.execute("""
                UPDATE HistorialCostos
                SET motivo = COALESCE(NULLIF(TRIM(motivo), ''), 'Registro de costo')
                WHERE motivo IS NULL OR TRIM(motivo) = ''
                """);
        statement.execute("""
                UPDATE HistorialCostos AS h
                SET costo_anterior = (
                  SELECT prev.costo_nuevo
                  FROM HistorialCostos prev
                  WHERE prev.id_empresa = h.id_empresa
                    AND prev.id_proveedor = h.id_proveedor
                    AND prev.id_producto = h.id_producto
                    AND (
                      prev.fecha_cambio < h.fecha_cambio
                      OR (
                        prev.fecha_cambio = h.fecha_cambio
                        AND prev.id_historial_costos < h.id_historial_costos
                      )
                    )
                  ORDER BY prev.fecha_cambio DESC, prev.id_historial_costos DESC
                  LIMIT 1
                )
                WHERE h.costo_anterior IS NULL
                  AND h.costo_nuevo IS NOT NULL
                """);
        statement.execute("""
                UPDATE HistorialCostos
                SET costo_anterior = costo_nuevo
                WHERE costo_anterior IS NULL
                  AND costo_nuevo IS NOT NULL
                """);
        statement.execute("""
                UPDATE HistorialCostos
                SET diferencia = costo_nuevo - costo_anterior
                WHERE costo_nuevo IS NOT NULL
                  AND costo_anterior IS NOT NULL
                """);
    }

    private void ensureColumn(
            Statement statement,
            String table,
            String column,
            String definition) throws Exception {
        if (!hasColumn(statement, table, column)) {
            statement.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
        }
    }

    private boolean hasColumn(Statement statement, String table, String column) throws Exception {
        try (ResultSet resultSet = statement.executeQuery("PRAGMA table_info(" + table + ")")) {
            while (resultSet.next()) {
                if (column.equalsIgnoreCase(resultSet.getString("name"))) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean hasTable(Statement statement, String table) throws Exception {
        try (ResultSet resultSet = statement.executeQuery(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name = '" + table + "'")) {
            return resultSet.next();
        }
    }

    private String proveedorRequiredTrigger(String name, String operation) {
        return """
                CREATE TRIGGER %s
                BEFORE %s ON Proveedores
                BEGIN
                  SELECT CASE WHEN NEW.nombre IS NULL OR TRIM(NEW.nombre) = '' THEN RAISE(ABORT, 'Proveedor: nombre obligatorio') END;
                  SELECT CASE WHEN NEW.tipo_proveedor IS NULL OR NEW.tipo_proveedor NOT IN ('DISTRIBUIDOR_FORMAL', 'PROVEEDOR_INFORMAL', 'ESTABLECIMIENTO_COMPRA') THEN RAISE(ABORT, 'Proveedor: tipo no valido') END;
                  SELECT CASE WHEN NEW.estado_proveedor IS NULL OR NEW.estado_proveedor NOT IN ('ACTIVO', 'INACTIVO', 'ARCHIVADO') THEN RAISE(ABORT, 'Proveedor: estado no valido') END;
                  SELECT CASE WHEN NEW.modalidad_abastecimiento IS NULL OR NEW.modalidad_abastecimiento NOT IN ('ENTREGA_DOMICILIO', 'RECOGE_TENDERO', 'MIXTO') THEN RAISE(ABORT, 'Proveedor: modalidad no valida') END;
                  SELECT CASE WHEN NEW.forma_pago_principal IS NULL OR NEW.forma_pago_principal NOT IN ('CONTADO', 'CREDITO', 'MIXTO') THEN RAISE(ABORT, 'Proveedor: forma de pago no valida') END;
                  SELECT CASE WHEN NEW.tipo_proveedor = 'DISTRIBUIDOR_FORMAL' AND (NEW.razon_social IS NULL OR TRIM(NEW.razon_social) = '' OR NEW.rfc IS NULL OR TRIM(NEW.rfc) = '' OR LENGTH(TRIM(NEW.rfc)) NOT IN (12, 13)) THEN RAISE(ABORT, 'Proveedor formal: razon social y RFC obligatorios') END;
                  SELECT CASE WHEN NEW.forma_pago_principal IN ('CREDITO', 'MIXTO') AND (NEW.dias_credito IS NULL OR NEW.dias_credito <= 0 OR NEW.limite_credito IS NULL OR NEW.limite_credito <= 0) THEN RAISE(ABORT, 'Proveedor: credito incompleto') END;
                  SELECT CASE WHEN NEW.forma_pago_principal = 'CONTADO' AND (NEW.dias_credito IS NOT NULL OR NEW.limite_credito IS NOT NULL OR NEW.maneja_credito = 1) THEN RAISE(ABORT, 'Proveedor: contado no debe tener credito') END;
                END
                """.formatted(name, operation);
    }

    private String contactoRequiredTrigger(String name, String operation) {
        return """
                CREATE TRIGGER %s
                BEFORE %s ON ProveedorContacto
                BEGIN
                  SELECT CASE WHEN NEW.nombre IS NULL OR TRIM(NEW.nombre) = '' THEN RAISE(ABORT, 'Contacto proveedor: nombre obligatorio') END;
                  SELECT CASE WHEN COALESCE(TRIM(NEW.telefono), '') = '' AND COALESCE(TRIM(NEW.whatsapp), '') = '' AND COALESCE(TRIM(NEW.correo), '') = '' THEN RAISE(ABORT, 'Contacto proveedor: captura telefono, WhatsApp o correo') END;
                END
                """.formatted(name, operation);
    }
}
