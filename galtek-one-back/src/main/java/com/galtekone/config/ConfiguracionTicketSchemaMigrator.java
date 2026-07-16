package com.galtekone.config;

import java.sql.Connection;
import java.sql.Statement;

import javax.sql.DataSource;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;

@Component
@Profile("desktop")
@RequiredArgsConstructor
public class ConfiguracionTicketSchemaMigrator {

    private final DataSource dataSource;

    @PostConstruct
    public void migrate() {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement()) {
            statement.execute("""
                    CREATE TABLE IF NOT EXISTS ConfiguracionTicket (
                        id_configuracion_ticket integer primary key autoincrement,
                        estatus boolean,
                        fecha_creacion timestamp,
                        fecha_modificacion timestamp,
                        usuario_creacion varchar(255),
                        usuario_modificacion varchar(255),
                        id_empresa integer not null,
                        paper_size varchar(10),
                        density varchar(20),
                        font_size varchar(20),
                        font_family varchar(30),
                        line_spacing varchar(20),
                        margin_size varchar(20),
                        separator_style varchar(20),
                        alignment varchar(20),
                        default_printer_name varchar(255),
                        copies integer,
                        auto_print boolean,
                        ask_before_print boolean,
                        allow_reprint boolean,
                        show_logo boolean,
                        footer_message varchar(120),
                        template_json text,
                        foreign key(id_empresa) references Empresas(id_empresa)
                    )
                    """);

            statement.execute("""
                    CREATE UNIQUE INDEX IF NOT EXISTS ux_configuracion_ticket_empresa
                    ON ConfiguracionTicket(id_empresa)
                    """);

            addColumnIfMissing(statement, "font_family varchar(30)");
            addColumnIfMissing(statement, "line_spacing varchar(20)");
            addColumnIfMissing(statement, "margin_size varchar(20)");
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo preparar el esquema de ConfiguracionTicket", ex);
        }
    }

    private void addColumnIfMissing(Statement statement, String definition) {
        try {
            statement.execute("ALTER TABLE ConfiguracionTicket ADD COLUMN " + definition);
        } catch (Exception ignored) {
            // SQLite reports duplicate column names when the migration already ran.
        }
    }
}
