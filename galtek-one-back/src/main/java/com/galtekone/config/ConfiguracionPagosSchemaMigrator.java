package com.galtekone.config;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

import javax.sql.DataSource;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Component
@Profile("desktop")
@RequiredArgsConstructor
public class ConfiguracionPagosSchemaMigrator {

    private final DataSource dataSource;

    @PostConstruct
    public void migrate() {
        try (Connection connection = dataSource.getConnection()) {
            try (Statement statement = connection.createStatement()) {
                statement.execute(metodoPagoCreateSql());
                statement.execute(configuracionPagosCreateSql());
            }

            Set<String> methodColumns = readColumns(connection, "MetodoPago");
            addColumn(connection, methodColumns, "MetodoPago", "codigo", "varchar(40)");
            addColumn(connection, methodColumns, "MetodoPago", "tipo", "varchar(40)");
            addColumn(connection, methodColumns, "MetodoPago", "orden", "integer");
            addColumn(connection, methodColumns, "MetodoPago", "visible_pos", "boolean");
            addColumn(connection, methodColumns, "MetodoPago", "requiere_referencia", "boolean");
            addColumn(connection, methodColumns, "MetodoPago", "requiere_verificacion", "boolean");

            Set<String> configColumns = readColumns(connection, "ConfiguracionPagos");
            addColumn(connection, configColumns, "ConfiguracionPagos", "terminal_store_id", "varchar(120)");
            addColumn(connection, configColumns, "ConfiguracionPagos", "terminal_account", "varchar(160)");
            addColumn(connection, configColumns, "ConfiguracionPagos", "terminales_json", "TEXT");
            addColumn(connection, configColumns, "ConfiguracionPagos", "terminal_require_reference", "boolean");
            addColumn(connection, configColumns, "ConfiguracionPagos", "cash_rounding_default_enabled", "boolean");
            addColumn(connection, configColumns, "ConfiguracionPagos", "card_bank_name", "varchar(120)");
            addColumn(connection, configColumns, "ConfiguracionPagos", "card_holder_name", "varchar(160)");
            addColumn(connection, configColumns, "ConfiguracionPagos", "card_number", "varchar(40)");
            addColumn(connection, configColumns, "ConfiguracionPagos", "card_account", "varchar(60)");
            addColumn(connection, configColumns, "ConfiguracionPagos", "card_instructions", "varchar(220)");
            addColumn(connection, configColumns, "ConfiguracionPagos", "voucher_issuer", "varchar(120)");
            addColumn(connection, configColumns, "ConfiguracionPagos", "voucher_instructions", "varchar(220)");
            addColumn(connection, configColumns, "ConfiguracionPagos", "voucher_require_folio", "boolean");
            addColumn(connection, configColumns, "ConfiguracionPagos", "voucher_require_authorization", "boolean");
            addColumn(connection, configColumns, "ConfiguracionPagos", "transfer_bank_name", "varchar(120)");
            addColumn(connection, configColumns, "ConfiguracionPagos", "transfer_account_name", "varchar(160)");
            addColumn(connection, configColumns, "ConfiguracionPagos", "transfer_clabe", "varchar(32)");

            try (Statement statement = connection.createStatement()) {
                statement.execute("""
                        UPDATE MetodoPago
                        SET codigo = CASE
                            WHEN UPPER(nombre) LIKE '%EFECTIVO%' THEN 'EFECTIVO'
                            WHEN UPPER(nombre) LIKE '%TERMINAL%' OR UPPER(nombre) LIKE '%MERCADO%' THEN 'TERMINAL'
                            WHEN UPPER(nombre) LIKE '%TARJETA%' THEN 'TARJETA'
                            WHEN UPPER(nombre) LIKE '%TRANSFER%' OR UPPER(nombre) LIKE '%SPEI%' THEN 'TRANSFERENCIA'
                            WHEN UPPER(nombre) LIKE '%VALE%' THEN 'VALES'
                            ELSE UPPER(REPLACE(TRIM(nombre), ' ', '_'))
                        END
                        WHERE codigo IS NULL OR TRIM(codigo) = ''
                        """);
                statement.execute("""
                        UPDATE MetodoPago
                        SET tipo = CASE
                            WHEN codigo = 'EFECTIVO' THEN 'CASH'
                            WHEN codigo = 'TERMINAL' THEN 'TERMINAL'
                            WHEN codigo = 'TARJETA' THEN 'CARD'
                            WHEN codigo = 'TRANSFERENCIA' THEN 'TRANSFER'
                            WHEN codigo = 'VALES' THEN 'VOUCHER'
                            ELSE 'OTHER'
                        END
                        WHERE tipo IS NULL OR TRIM(tipo) = ''
                        """);
                statement.execute("""
                        UPDATE MetodoPago
                        SET nombre = 'Terminal', codigo = 'TERMINAL', tipo = 'TERMINAL', orden = 1
                        WHERE codigo = 'TARJETA'
                          AND tipo = 'TERMINAL'
                        """);
                statement.execute("UPDATE MetodoPago SET visible_pos = 1 WHERE visible_pos IS NULL");
                statement.execute("""
                        UPDATE MetodoPago
                        SET requiere_referencia = CASE WHEN tipo IN ('TERMINAL', 'CARD', 'VOUCHER') THEN 1 ELSE 0 END
                        WHERE requiere_referencia IS NULL
                        """);
                statement.execute("""
                        UPDATE MetodoPago
                        SET requiere_verificacion = CASE WHEN tipo IN ('TERMINAL', 'CARD', 'VOUCHER') THEN 1 ELSE 0 END
                        WHERE requiere_verificacion IS NULL
                        """);
                statement.execute("""
                        UPDATE MetodoPago
                        SET orden = CASE
                            WHEN tipo = 'TERMINAL' THEN 1
                            WHEN tipo = 'CASH' THEN 2
                            WHEN tipo = 'CARD' THEN 3
                            WHEN tipo = 'VOUCHER' THEN 4
                            ELSE 99
                        END
                        WHERE orden IS NULL
                        """);
                statement.execute("""
                        UPDATE MetodoPago
                        SET estatus = 0, visible_pos = 0
                        WHERE codigo IN ('TRANSFERENCIA', 'OTRO')
                          AND id_empresa IN (
                            SELECT e.id_empresa
                            FROM Empresas e
                            WHERE NOT EXISTS (
                                SELECT 1
                                FROM ConfiguracionPagos c
                                WHERE c.id_empresa = e.id_empresa
                            )
                          )
                        """);
                statement.execute("""
                        INSERT INTO MetodoPago (
                            estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion,
                            nombre, codigo, tipo, orden, visible_pos, requiere_referencia, requiere_verificacion, id_empresa
                        )
                        SELECT 0, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'),
                               'system', 'system', 'Tarjeta', 'TARJETA', 'CARD', 3, 1, 1, 1, e.id_empresa
                        FROM Empresas e
                        WHERE NOT EXISTS (
                            SELECT 1 FROM MetodoPago mp WHERE mp.id_empresa = e.id_empresa AND mp.codigo = 'TARJETA'
                        )
                        """);
                statement.execute("""
                        INSERT INTO ConfiguracionPagos (
                            estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion,
                            terminal_enabled, terminal_provider, terminal_name, terminales_json, terminal_priority,
                            terminal_commission_enabled, terminal_commission_percent, terminal_require_reference,
                            cash_rounding_default_enabled, voucher_require_folio, voucher_require_authorization,
                            version, id_empresa
                        )
                        SELECT 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'),
                               'system', 'system', 1, 'MERCADO_PAGO', 'Mercado Pago',
                               '[{"key":"terminal_1","nombre":"Mercado Pago","provider":"MERCADO_PAGO","enabled":true,"commissionEnabled":true,"commissionPercent":0}]',
                               1, 1, 0, 1, 1, 1, 1, 0, e.id_empresa
                        FROM Empresas e
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM ConfiguracionPagos c
                            WHERE c.id_empresa = e.id_empresa
                        )
                        """);
                statement.execute("""
                        UPDATE ConfiguracionPagos
                        SET terminales_json = '[{"key":"terminal_1","nombre":"Mercado Pago","provider":"MERCADO_PAGO","enabled":true,"commissionEnabled":true,"commissionPercent":0}]'
                        WHERE terminales_json IS NULL OR TRIM(terminales_json) = ''
                        """);
                statement.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_configuracion_pagos_empresa ON ConfiguracionPagos(id_empresa)");
                statement.execute("CREATE INDEX IF NOT EXISTS idx_metodo_pago_empresa_codigo ON MetodoPago(id_empresa, codigo)");
            }
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo preparar el esquema de pagos y terminal", ex);
        }
    }

    private String metodoPagoCreateSql() {
        return """
                CREATE TABLE IF NOT EXISTS MetodoPago (
                    id_metodo_pago integer,
                    estatus boolean,
                    fecha_creacion timestamp,
                    fecha_modificacion timestamp,
                    usuario_creacion varchar(255),
                    usuario_modificacion varchar(255),
                    nombre varchar(255),
                    codigo varchar(40),
                    tipo varchar(40),
                    orden integer,
                    visible_pos boolean,
                    requiere_referencia boolean,
                    requiere_verificacion boolean,
                    id_empresa integer not null,
                    primary key (id_metodo_pago)
                )
                """;
    }

    private String configuracionPagosCreateSql() {
        return """
                CREATE TABLE IF NOT EXISTS ConfiguracionPagos (
                    id_configuracion_pagos integer,
                    estatus boolean,
                    fecha_creacion timestamp,
                    fecha_modificacion timestamp,
                    usuario_creacion varchar(255),
                    usuario_modificacion varchar(255),
                    terminal_enabled boolean not null,
                    terminal_provider varchar(60) not null,
                    terminal_name varchar(120),
                    terminal_identifier varchar(120),
                    terminal_serial varchar(120),
                    terminal_store_id varchar(120),
                    terminal_account varchar(160),
                    terminales_json TEXT,
                    terminal_priority integer not null,
                    terminal_commission_enabled boolean not null,
                    terminal_commission_percent numeric(7,4) not null,
                    terminal_require_reference boolean not null,
                    cash_rounding_default_enabled boolean not null,
                    card_bank_name varchar(120),
                    card_holder_name varchar(160),
                    card_number varchar(40),
                    card_account varchar(60),
                    card_instructions varchar(220),
                    voucher_issuer varchar(120),
                    voucher_instructions varchar(220),
                    voucher_require_folio boolean not null,
                    voucher_require_authorization boolean not null,
                    transfer_bank_name varchar(120),
                    transfer_account_name varchar(160),
                    transfer_clabe varchar(32),
                    version bigint,
                    id_empresa integer not null,
                    primary key (id_configuracion_pagos)
                )
                """;
    }

    private Set<String> readColumns(Connection connection, String table) throws Exception {
        Set<String> columns = new HashSet<>();
        try (Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery("SELECT * FROM " + table + " WHERE 1 = 0")) {
            ResultSetMetaData metaData = resultSet.getMetaData();
            for (int index = 1; index <= metaData.getColumnCount(); index += 1) {
                columns.add(metaData.getColumnName(index).toLowerCase(Locale.ROOT));
            }
        }
        return columns;
    }

    private void addColumn(Connection connection, Set<String> columns, String table, String column,
            String definition) throws Exception {
        String key = column.toLowerCase(Locale.ROOT);
        if (columns.contains(key)) {
            return;
        }

        try (Statement statement = connection.createStatement()) {
            statement.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
            columns.add(key);
        }
    }
}
