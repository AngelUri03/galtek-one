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
public class UsuariosPermisosSchemaMigrator {

    private final DataSource dataSource;

    @PostConstruct
    public void migrate() {
        try (Connection connection = dataSource.getConnection()) {
            Set<String> columns = readColumns(connection);
            addColumn(connection, columns, "efecto", "varchar(10) not null default 'PERMITIR'");
            addColumn(connection, columns, "motivo", "varchar(500)");
            createLookupIndex(connection);
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo preparar el esquema de UsuariosPermisos", ex);
        }
    }

    private Set<String> readColumns(Connection connection) throws Exception {
        Set<String> columns = new HashSet<>();
        try (Statement statement = connection.createStatement();
             ResultSet resultSet = statement.executeQuery("SELECT * FROM UsuariosPermisos WHERE 1 = 0")) {
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
            statement.execute("ALTER TABLE UsuariosPermisos ADD COLUMN " + column + " " + definition);
            columns.add(key);
        }
    }

    private void createLookupIndex(Connection connection) throws Exception {
        try (Statement statement = connection.createStatement()) {
            statement.execute("""
                    CREATE INDEX IF NOT EXISTS idx_usuarios_permisos_usuario_permiso_estatus
                    ON UsuariosPermisos(id_usuario, id_permiso, estatus)
                    """);
        }
    }
}
