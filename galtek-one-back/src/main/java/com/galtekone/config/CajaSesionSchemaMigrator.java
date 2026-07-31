package com.galtekone.config;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import javax.sql.DataSource;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Component
@Profile("desktop")
@RequiredArgsConstructor
public class CajaSesionSchemaMigrator {

    private final DataSource dataSource;

    @PostConstruct
    public void migrate() {
        try (Connection connection = dataSource.getConnection()) {
            migrateLocalDevice(connection);
            createOrMigrateCajaSesion(connection);
            migrateMovimientoCaja(connection);
            migrateVentas(connection);
            createOrMigrateSaldoEfectivo(connection);
            createCajaSupportTables(connection);
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo preparar el esquema operativo de caja", ex);
        }
    }

    private void createOrMigrateCajaSesion(Connection connection) throws Exception {
        try (Statement statement = connection.createStatement()) {
            statement.execute(cajaSesionCreateSql());
        }

        Set<String> columns = readColumns(connection, "CajaSesion");
        addColumn(connection, columns, "CajaSesion", "id_local_device", "varchar(36)");
        addColumn(connection, columns, "CajaSesion", "active_installation_key", "varchar(120)");
        addColumn(connection, columns, "CajaSesion", "closing_expected_cash_amount", "numeric(12,2)");
        addColumn(connection, columns, "CajaSesion", "closing_idempotency_key", "varchar(120)");
        addColumn(connection, columns, "CajaSesion", "expected_balance_viewed_before_count", "boolean");
        addColumn(connection, columns, "CajaSesion", "expected_balance_viewed_at", "timestamp");
        addColumn(connection, columns, "CajaSesion", "expected_balance_viewed_by", "integer");

        migrateLegacyCajaSesionInstallation(connection);

        if (isNotNull(connection, "CajaSesion", "id_caja")) {
            rebuildCajaSesion(connection);
        }

        try (Statement statement = connection.createStatement()) {
            statement.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_caja_sesion_idempotency ON CajaSesion(id_empresa, opening_idempotency_key)");
            statement.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_caja_sesion_closing_idempotency ON CajaSesion(id_empresa, closing_idempotency_key)");
            statement.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_caja_sesion_active_installation ON CajaSesion(active_installation_key)");
            statement.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_caja_sesion_active_user ON CajaSesion(active_user_key)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_caja_sesion_empresa_installation_estado ON CajaSesion(id_empresa, id_local_device, status)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_caja_sesion_empresa_caja_estado ON CajaSesion(id_empresa, id_caja, status)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_caja_sesion_empresa_usuario_estado ON CajaSesion(id_empresa, id_usuario_abre, status)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_caja_sesion_empresa_abierta ON CajaSesion(id_empresa, opened_at)");
        }
    }

    private void migrateMovimientoCaja(Connection connection) throws Exception {
        Set<String> columns = readColumns(connection, "MovimientoCaja");
        addColumn(connection, columns, "MovimientoCaja", "id_caja_sesion", "integer");
        addColumn(connection, columns, "MovimientoCaja", "id_local_device", "varchar(36)");
        addColumn(connection, columns, "MovimientoCaja", "reference_type", "varchar(60)");
        addColumn(connection, columns, "MovimientoCaja", "reference_id", "varchar(80)");
        addColumn(connection, columns, "MovimientoCaja", "category", "varchar(80)");
        addColumn(connection, columns, "MovimientoCaja", "financial_direction", "varchar(20)");
        addColumn(connection, columns, "MovimientoCaja", "idempotency_key", "varchar(120)");
        addColumn(connection, columns, "MovimientoCaja", "balance_before", "numeric(12,2)");
        addColumn(connection, columns, "MovimientoCaja", "balance_after", "numeric(12,2)");

        migrateLegacyMovimientoCajaSesion(connection);
        migrateLegacyMovimientoCajaDevice(connection);

        if (isNotNull(connection, "MovimientoCaja", "id_caja")) {
            rebuildMovimientoCaja(connection);
        }

        try (Statement statement = connection.createStatement()) {
            statement.execute("CREATE INDEX IF NOT EXISTS idx_mov_caja_sesion ON MovimientoCaja(id_caja_sesion)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_mov_caja_caja_empresa ON MovimientoCaja(id_caja, id_empresa)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_mov_caja_device_empresa ON MovimientoCaja(id_local_device, id_empresa)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_mov_caja_idempotency ON MovimientoCaja(id_empresa, idempotency_key)");
        }
    }

    private void migrateVentas(Connection connection) throws Exception {
        Set<String> columns = readColumns(connection, "Ventas");
        addColumn(connection, columns, "Ventas", "id_caja_sesion", "integer");
        addColumn(connection, columns, "Ventas", "total_original", "numeric(12,2)");
        addColumn(connection, columns, "Ventas", "total_cobrado", "numeric(12,2)");
        addColumn(connection, columns, "Ventas", "redondeo_aplicado", "numeric(12,2)");
        addColumn(connection, columns, "Ventas", "comision_pago", "numeric(12,2)");
        addColumn(connection, columns, "Ventas", "comision_porcentaje", "numeric(7,4)");
        addColumn(connection, columns, "Ventas", "recibido", "numeric(12,2)");
        addColumn(connection, columns, "Ventas", "cambio", "numeric(12,2)");
        addColumn(connection, columns, "Ventas", "referencia_pago", "varchar(120)");
        addColumn(connection, columns, "Ventas", "folio_pago", "varchar(120)");
        addColumn(connection, columns, "Ventas", "pago_verificado", "boolean");

        migrateLegacyVentasSesion(connection);

        if (isNotNull(connection, "Ventas", "id_caja")) {
            rebuildVentas(connection);
        }

        try (Statement statement = connection.createStatement()) {
            statement.execute("CREATE INDEX IF NOT EXISTS idx_ventas_caja_sesion ON Ventas(id_caja_sesion)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_ventas_caja_empresa ON Ventas(id_caja, id_empresa)");
        }
    }

    private void migrateLocalDevice(Connection connection) throws Exception {
        Set<String> columns = readColumns(connection, "LocalDevice");
        addColumn(connection, columns, "LocalDevice", "updated_at", "timestamp");
        addColumn(connection, columns, "LocalDevice", "id_empresa", "integer");
        addColumn(connection, columns, "LocalDevice", "display_name", "varchar(120)");
    }

    private void migrateLegacyCajaSesionInstallation(Connection connection) throws Exception {
        try (Statement statement = connection.createStatement()) {
            statement.execute("""
                    UPDATE CajaSesion
                    SET id_local_device = (
                        SELECT d.installation_id
                        FROM LocalDevice d
                        WHERE d.cash_register_id = CajaSesion.id_caja
                          AND (d.id_empresa = CajaSesion.id_empresa OR d.id_empresa IS NULL)
                        ORDER BY d.created_at
                        LIMIT 1
                    )
                    WHERE id_local_device IS NULL
                      AND id_caja IS NOT NULL
                    """);
            statement.execute("""
                    UPDATE CajaSesion
                    SET id_local_device = (
                        SELECT d.installation_id
                        FROM LocalDevice d
                        ORDER BY d.created_at
                        LIMIT 1
                    )
                    WHERE id_local_device IS NULL
                      AND (SELECT COUNT(*) FROM LocalDevice) = 1
                    """);
            statement.execute("""
                    UPDATE CajaSesion
                    SET active_installation_key = id_empresa || ':INSTALLATION:' || id_local_device,
                        active_cash_register_key = NULL
                    WHERE id_local_device IS NOT NULL
                      AND estatus = 1
                      AND status IN ('OPEN', 'PENDING_RECONCILIATION')
                    """);
        }
    }

    private void migrateLegacyMovimientoCajaSesion(Connection connection) throws Exception {
        try (Statement statement = connection.createStatement()) {
            statement.execute("""
                    UPDATE MovimientoCaja
                    SET id_caja_sesion = (
                        SELECT s.id_caja_sesion
                        FROM CajaSesion s
                        WHERE s.id_empresa = MovimientoCaja.id_empresa
                          AND s.id_caja = MovimientoCaja.id_caja
                          AND s.id_usuario_abre = MovimientoCaja.id_usuario
                          AND s.opened_at <= MovimientoCaja.fecha
                        ORDER BY s.opened_at DESC
                        LIMIT 1
                    )
                    WHERE id_caja_sesion IS NULL
                      AND id_caja IS NOT NULL
                    """);
        }
    }

    private void migrateLegacyMovimientoCajaDevice(Connection connection) throws Exception {
        try (Statement statement = connection.createStatement()) {
            statement.execute("""
                    UPDATE MovimientoCaja
                    SET id_local_device = (
                        SELECT s.id_local_device
                        FROM CajaSesion s
                        WHERE s.id_caja_sesion = MovimientoCaja.id_caja_sesion
                    )
                    WHERE id_local_device IS NULL
                      AND id_caja_sesion IS NOT NULL
                    """);
        }
    }

    private void createOrMigrateSaldoEfectivo(Connection connection) throws Exception {
        try (Statement statement = connection.createStatement()) {
            statement.execute(saldoEfectivoCreateSql());
            statement.execute("""
                    INSERT INTO SaldoEfectivo (
                        estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion,
                        id_local_device, current_balance_snapshot, initialized, initialized_at, initialized_by,
                        initialization_category, initialization_reason, initialization_idempotency_key,
                        last_movement_at, version, id_empresa
                    )
                    SELECT 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'),
                           'system', 'system', s.id_local_device,
                           COALESCE(s.expected_cash_amount, s.opening_amount, 0), 1,
                           STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), s.id_usuario_abre,
                           'BALANCE_MIGRATION',
                           'Recuperacion automatica desde sesion de caja vigente',
                           'balance-migration-' || s.id_local_device,
                           STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), 0, s.id_empresa
                    FROM CajaSesion s
                    WHERE s.id_local_device IS NOT NULL
                      AND s.estatus = 1
                      AND s.status IN ('OPEN', 'PENDING_RECONCILIATION')
                      AND NOT EXISTS (
                          SELECT 1
                          FROM SaldoEfectivo se
                          WHERE se.id_empresa = s.id_empresa
                            AND se.id_local_device = s.id_local_device
                      )
                    """);
            statement.execute("""
                    INSERT INTO MovimientoCaja (
                        estatus, fecha_creacion, fecha_modificacion, usuario_creacion, usuario_modificacion,
                        fecha, monto, motivo, tipo, category, financial_direction, reference_type, reference_id,
                        idempotency_key, balance_before, balance_after, id_caja, id_caja_sesion, id_local_device,
                        id_empresa, id_usuario
                    )
                    SELECT 1, STRFTIME('%Y-%m-%d %H:%M:%f', 'now'), STRFTIME('%Y-%m-%d %H:%M:%f', 'now'),
                           'system', 'system', STRFTIME('%Y-%m-%d %H:%M:%f', 'now'),
                           COALESCE(s.expected_cash_amount, s.opening_amount, 0),
                           'Recuperacion automatica de saldo continuo', 'INITIAL_BALANCE',
                           'BALANCE_MIGRATION',
                           CASE WHEN COALESCE(s.expected_cash_amount, s.opening_amount, 0) = 0 THEN 'NONE' ELSE 'IN' END,
                           'CASH_BALANCE_MIGRATION', s.id_local_device,
                           'balance-migration-' || s.id_local_device,
                           0, COALESCE(s.expected_cash_amount, s.opening_amount, 0),
                           s.id_caja, s.id_caja_sesion, s.id_local_device, s.id_empresa, s.id_usuario_abre
                    FROM CajaSesion s
                    WHERE s.id_local_device IS NOT NULL
                      AND s.estatus = 1
                      AND s.status IN ('OPEN', 'PENDING_RECONCILIATION')
                      AND NOT EXISTS (
                          SELECT 1
                          FROM MovimientoCaja m
                          WHERE m.id_empresa = s.id_empresa
                            AND m.idempotency_key = 'balance-migration-' || s.id_local_device
                      )
                    """);
            statement.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_saldo_efectivo_empresa_device ON SaldoEfectivo(id_empresa, id_local_device)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_saldo_efectivo_empresa_device ON SaldoEfectivo(id_empresa, id_local_device)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_saldo_efectivo_empresa_initialized ON SaldoEfectivo(id_empresa, initialized)");
        }
    }

    private void createCajaSupportTables(Connection connection) throws Exception {
        try (Statement statement = connection.createStatement()) {
            statement.execute(configuracionCajaCreateSql());
            statement.execute(cajaIncidenciaCreateSql());
            statement.execute(cajaRelevoCreateSql());
            Set<String> incidenciaColumns = readColumns(connection, "CajaIncidencia");
            addColumn(connection, incidenciaColumns, "CajaIncidencia", "resolution_cash_effect", "varchar(60)");
            addColumn(connection, incidenciaColumns, "CajaIncidencia", "resolution_amount", "numeric(12,2)");
            addColumn(connection, incidenciaColumns, "CajaIncidencia", "resolution_reference", "varchar(160)");
            addColumn(connection, incidenciaColumns, "CajaIncidencia", "id_resolution_movement", "integer");
            statement.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_configuracion_caja_empresa ON ConfiguracionCaja(id_empresa)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_caja_incidencia_empresa_estado ON CajaIncidencia(id_empresa, status)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_caja_incidencia_device_estado ON CajaIncidencia(id_local_device, status)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_caja_incidencia_sesion ON CajaIncidencia(id_caja_sesion)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_caja_relevo_empresa_device_estado ON CajaRelevo(id_empresa, id_local_device, status)");
            statement.execute("CREATE INDEX IF NOT EXISTS idx_caja_relevo_outgoing_session ON CajaRelevo(id_outgoing_session)");
        }
    }

    private void migrateLegacyVentasSesion(Connection connection) throws Exception {
        try (Statement statement = connection.createStatement()) {
            statement.execute("""
                    UPDATE Ventas
                    SET id_caja_sesion = (
                        SELECT s.id_caja_sesion
                        FROM CajaSesion s
                        WHERE s.id_empresa = Ventas.id_empresa
                          AND s.id_caja = Ventas.id_caja
                          AND s.id_usuario_abre = Ventas.id_usuario
                          AND s.opened_at <= Ventas.fecha_creacion
                        ORDER BY s.opened_at DESC
                        LIMIT 1
                    )
                    WHERE id_caja_sesion IS NULL
                      AND id_caja IS NOT NULL
                    """);
        }
    }

    private void rebuildCajaSesion(Connection connection) throws Exception {
        rebuildTable(connection, "CajaSesion", cajaSesionCreateSql(), """
                id_caja_sesion, estatus, fecha_creacion, fecha_modificacion, usuario_creacion,
                usuario_modificacion, id_local_device, id_caja, id_usuario_abre, id_usuario_cierra,
                opened_at, last_activity_at, closed_at, opening_amount, expected_cash_amount,
                closing_expected_cash_amount, counted_cash_amount, difference_amount, status,
                closing_reason, closing_notes, opening_idempotency_key, closing_idempotency_key,
                expected_balance_viewed_before_count, expected_balance_viewed_at, expected_balance_viewed_by,
                active_cash_register_key, active_installation_key, active_user_key, version, id_empresa
                """);
    }

    private void rebuildMovimientoCaja(Connection connection) throws Exception {
        rebuildTable(connection, "MovimientoCaja", movimientoCajaCreateSql(), """
                id_movimiento_caja, estatus, fecha_creacion, fecha_modificacion, usuario_creacion,
                usuario_modificacion, fecha, monto, motivo, tipo, category, financial_direction,
                reference_type, reference_id, idempotency_key, balance_before, balance_after,
                id_caja, id_caja_sesion, id_local_device, id_empresa, id_usuario
                """);
    }

    private void rebuildVentas(Connection connection) throws Exception {
        rebuildTable(connection, "Ventas", ventasCreateSql(), """
                id_venta, estatus, fecha_creacion, fecha_modificacion, usuario_creacion,
                usuario_modificacion, estado, total, total_original, total_cobrado,
                redondeo_aplicado, comision_pago, comision_porcentaje, recibido, cambio,
                referencia_pago, folio_pago, pago_verificado, id_caja, id_caja_sesion,
                id_cliente, id_empresa, id_metodo_pago, id_usuario
                """);
    }

    private void rebuildTable(Connection connection, String table, String createSql, String columns) throws Exception {
        String backup = table + "_legacy_vta_cja_001a";
        if (tableExists(connection, backup)) {
            throw new IllegalStateException("Existe una tabla de respaldo pendiente: " + backup);
        }
        String columnList = columns.replace("\n", " ").replaceAll("\\s+", " ").trim();
        try (Statement statement = connection.createStatement()) {
            statement.execute("ALTER TABLE " + table + " RENAME TO " + backup);
            statement.execute(createSql);
            statement.execute("INSERT INTO " + table + " (" + columnList + ") SELECT " + columnList + " FROM " + backup);
            statement.execute("DROP TABLE " + backup);
        }
    }

    private String cajaSesionCreateSql() {
        return """
                CREATE TABLE IF NOT EXISTS CajaSesion (
                    id_caja_sesion integer,
                    estatus boolean,
                    fecha_creacion timestamp,
                    fecha_modificacion timestamp,
                    usuario_creacion varchar(255),
                    usuario_modificacion varchar(255),
                    id_local_device varchar(36),
                    id_caja integer,
                    id_usuario_abre integer not null,
                    id_usuario_cierra integer,
                    opened_at timestamp not null,
                    last_activity_at timestamp not null,
                    closed_at timestamp,
                    opening_amount numeric(12,2) not null,
                    expected_cash_amount numeric(12,2) not null,
                    closing_expected_cash_amount numeric(12,2),
                    counted_cash_amount numeric(12,2),
                    difference_amount numeric(12,2),
                    status varchar(32) not null,
                    closing_reason varchar(80),
                    closing_notes varchar(500),
                    opening_idempotency_key varchar(120) not null,
                    closing_idempotency_key varchar(120),
                    expected_balance_viewed_before_count boolean,
                    expected_balance_viewed_at timestamp,
                    expected_balance_viewed_by integer,
                    active_cash_register_key varchar(80),
                    active_installation_key varchar(120),
                    active_user_key varchar(80),
                    version bigint,
                    id_empresa integer not null,
                    primary key (id_caja_sesion)
                )
                """;
    }

    private String movimientoCajaCreateSql() {
        return """
                CREATE TABLE IF NOT EXISTS MovimientoCaja (
                    id_movimiento_caja integer,
                    estatus boolean,
                    fecha_creacion timestamp,
                    fecha_modificacion timestamp,
                    usuario_creacion varchar(255),
                    usuario_modificacion varchar(255),
                    fecha timestamp not null,
                    monto numeric(12,2) not null,
                    motivo varchar(500) not null,
                    tipo varchar(30) not null,
                    category varchar(80),
                    financial_direction varchar(20),
                    reference_type varchar(60),
                    reference_id varchar(80),
                    idempotency_key varchar(120),
                    balance_before numeric(12,2),
                    balance_after numeric(12,2),
                    id_caja integer,
                    id_caja_sesion integer,
                    id_local_device varchar(36),
                    id_empresa integer not null,
                    id_usuario integer not null,
                    primary key (id_movimiento_caja)
                )
                """;
    }

    private String saldoEfectivoCreateSql() {
        return """
                CREATE TABLE IF NOT EXISTS SaldoEfectivo (
                    id_saldo_efectivo integer,
                    estatus boolean,
                    fecha_creacion timestamp,
                    fecha_modificacion timestamp,
                    usuario_creacion varchar(255),
                    usuario_modificacion varchar(255),
                    id_local_device varchar(36) not null,
                    current_balance_snapshot numeric(12,2) not null,
                    initialized boolean not null,
                    initialized_at timestamp,
                    initialized_by integer,
                    initialization_category varchar(80),
                    initialization_reason varchar(500),
                    initialization_idempotency_key varchar(120),
                    last_movement_at timestamp,
                    version bigint,
                    id_empresa integer not null,
                    primary key (id_saldo_efectivo)
                )
                """;
    }

    private String configuracionCajaCreateSql() {
        return """
                CREATE TABLE IF NOT EXISTS ConfiguracionCaja (
                    id_configuracion_caja integer,
                    estatus boolean,
                    fecha_creacion timestamp,
                    fecha_modificacion timestamp,
                    usuario_creacion varchar(255),
                    usuario_modificacion varchar(255),
                    handoff_policy varchar(32) not null,
                    require_incoming_count_on_user_change boolean not null,
                    require_outgoing_count boolean not null,
                    allow_continue_with_pending_incident boolean not null,
                    blind_count_enabled boolean not null,
                    expected_balance_visibility_mode varchar(40) not null,
                    version bigint,
                    id_empresa integer not null,
                    primary key (id_configuracion_caja)
                )
                """;
    }

    private String cajaIncidenciaCreateSql() {
        return """
                CREATE TABLE IF NOT EXISTS CajaIncidencia (
                    id_caja_incidencia integer,
                    estatus boolean,
                    fecha_creacion timestamp,
                    fecha_modificacion timestamp,
                    usuario_creacion varchar(255),
                    usuario_modificacion varchar(255),
                    tipo varchar(40) not null,
                    status varchar(32) not null,
                    id_local_device varchar(36) not null,
                    id_caja_sesion integer,
                    id_movimiento_caja integer,
                    expected_amount numeric(12,2),
                    outgoing_declared_amount numeric(12,2),
                    incoming_declared_amount numeric(12,2),
                    joint_recount_amount numeric(12,2),
                    accepted_amount numeric(12,2),
                    difference_amount numeric(12,2),
                    outgoing_note varchar(500),
                    incoming_note varchar(500),
                    policy_snapshot varchar(40),
                    resolved_at timestamp,
                    resolved_by integer,
                    resolution_category varchar(80),
                    resolution_notes varchar(700),
                    resolution_cash_effect varchar(60),
                    resolution_amount numeric(12,2),
                    resolution_reference varchar(160),
                    id_resolution_movement integer,
                    version bigint,
                    id_empresa integer not null,
                    primary key (id_caja_incidencia)
                )
                """;
    }

    private String cajaRelevoCreateSql() {
        return """
                CREATE TABLE IF NOT EXISTS CajaRelevo (
                    id_caja_relevo integer,
                    estatus boolean,
                    fecha_creacion timestamp,
                    fecha_modificacion timestamp,
                    usuario_creacion varchar(255),
                    usuario_modificacion varchar(255),
                    id_local_device varchar(36) not null,
                    id_outgoing_session integer,
                    id_incoming_session integer,
                    id_outgoing_user integer,
                    id_incoming_user integer,
                    handoff_type varchar(24) not null,
                    status varchar(40) not null,
                    policy_snapshot varchar(40),
                    expected_cash_snapshot numeric(12,2),
                    outgoing_declared_amount numeric(12,2),
                    outgoing_counted_at timestamp,
                    incoming_declared_amount numeric(12,2),
                    incoming_counted_at timestamp,
                    joint_recount_amount numeric(12,2),
                    joint_recount_at timestamp,
                    accepted_amount numeric(12,2),
                    accepted_at timestamp,
                    outgoing_note varchar(500),
                    incoming_note varchar(500),
                    outgoing_confirmed boolean,
                    incoming_confirmed boolean,
                    outgoing_confirmation_at timestamp,
                    incoming_confirmation_at timestamp,
                    difference_outgoing_vs_expected numeric(12,2),
                    difference_incoming_vs_outgoing numeric(12,2),
                    difference_accepted_vs_expected numeric(12,2),
                    id_incident integer,
                    version bigint,
                    id_empresa integer not null,
                    primary key (id_caja_relevo)
                )
                """;
    }

    private String ventasCreateSql() {
        return """
                CREATE TABLE IF NOT EXISTS Ventas (
                    id_venta integer,
                    estatus boolean,
                    fecha_creacion timestamp,
                    fecha_modificacion timestamp,
                    usuario_creacion varchar(255),
                    usuario_modificacion varchar(255),
                    estado varchar(255) not null,
                    total float not null,
                    total_original numeric(12,2),
                    total_cobrado numeric(12,2),
                    redondeo_aplicado numeric(12,2),
                    comision_pago numeric(12,2),
                    comision_porcentaje numeric(7,4),
                    recibido numeric(12,2),
                    cambio numeric(12,2),
                    referencia_pago varchar(120),
                    folio_pago varchar(120),
                    pago_verificado boolean,
                    id_caja integer,
                    id_caja_sesion integer,
                    id_cliente integer,
                    id_empresa integer not null,
                    id_metodo_pago integer not null,
                    id_usuario integer not null,
                    primary key (id_venta)
                )
                """;
    }

    private boolean tableExists(Connection connection, String table) throws Exception {
        try (Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery(
                     "SELECT name FROM sqlite_master WHERE type = 'table' AND name = '" + table + "'")) {
            return resultSet.next();
        }
    }

    private boolean isNotNull(Connection connection, String table, String column) throws Exception {
        return readColumnInfo(connection, table)
                .getOrDefault(column.toLowerCase(Locale.ROOT), new ColumnInfo(false))
                .notNull();
    }

    private Map<String, ColumnInfo> readColumnInfo(Connection connection, String table) throws Exception {
        Map<String, ColumnInfo> columns = new HashMap<>();
        try (Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery("PRAGMA table_info(" + table + ")")) {
            while (resultSet.next()) {
                String name = resultSet.getString("name").toLowerCase(Locale.ROOT);
                boolean notNull = resultSet.getInt("notnull") == 1;
                columns.put(name, new ColumnInfo(notNull));
            }
        }
        return columns;
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

    private record ColumnInfo(boolean notNull) {}
}
