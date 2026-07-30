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
public class EmpresasSchemaMigrator {

    private final DataSource dataSource;

    @PostConstruct
    public void migrate() {
        try (Connection connection = dataSource.getConnection()) {
            Set<String> columns = readColumns(connection);
            addColumn(connection, columns, "razon_social", "varchar(255)");
            addColumn(connection, columns, "rfc", "varchar(255)");
            addColumn(connection, columns, "telefono", "varchar(255)");
            addColumn(connection, columns, "whatsapp", "varchar(255)");
            addColumn(connection, columns, "correo", "varchar(255)");
            addColumn(connection, columns, "direccion_calle", "varchar(255)");
            addColumn(connection, columns, "direccion_numero_exterior", "varchar(60)");
            addColumn(connection, columns, "direccion_numero_interior", "varchar(60)");
            addColumn(connection, columns, "direccion_colonia", "varchar(255)");
            addColumn(connection, columns, "direccion_municipio", "varchar(255)");
            addColumn(connection, columns, "direccion_estado", "varchar(255)");
            addColumn(connection, columns, "direccion_codigo_postal", "varchar(30)");
            addColumn(connection, columns, "direccion_referencia", "varchar(500)");
            addColumn(connection, columns, "horario_operacion", "varchar(255)");
            addColumn(connection, columns, "horario_config", "text");
            addColumn(connection, columns, "horario_lunes_viernes_apertura", "varchar(10)");
            addColumn(connection, columns, "horario_lunes_viernes_cierre", "varchar(10)");
            addColumn(connection, columns, "horario_sabado_domingo_apertura", "varchar(10)");
            addColumn(connection, columns, "horario_sabado_domingo_cierre", "varchar(10)");
            addColumn(connection, columns, "horario_sabado_domingo_cerrado", "boolean");
            addColumn(connection, columns, "horario_notas", "varchar(255)");
            addColumn(connection, columns, "moneda", "varchar(10)");
            addColumn(connection, columns, "zona_horaria", "varchar(80)");
            addColumn(connection, columns, "ticket_mensaje", "varchar(500)");
            addColumn(connection, columns, "logo_nombre", "varchar(255)");
            addColumn(connection, columns, "logo_mime_type", "varchar(100)");
            addColumn(connection, columns, "logo_base64", "text");
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo preparar el esquema de Empresas", ex);
        }
    }

    private Set<String> readColumns(Connection connection) throws Exception {
        Set<String> columns = new HashSet<>();
        try (Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery("SELECT * FROM Empresas WHERE 1 = 0")) {
            ResultSetMetaData metaData = resultSet.getMetaData();
            for (int index = 1; index <= metaData.getColumnCount(); index += 1) {
                columns.add(metaData.getColumnName(index).toLowerCase(Locale.ROOT));
            }
        }
        return columns;
    }

    private void addColumn(Connection connection, Set<String> columns, String column, String definition) throws Exception {
        String key = column.toLowerCase(Locale.ROOT);
        if (columns.contains(key)) {
            return;
        }

        try (Statement statement = connection.createStatement()) {
            statement.execute("ALTER TABLE Empresas ADD COLUMN " + column + " " + definition);
            columns.add(key);
        }
    }
}
