package com.galtekone.dto.usuario;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class UsuariosOverridesResumenDTO {

    private List<UsuarioOverrideItem> usuarios = new ArrayList<>();
    private Resumen resumen = new Resumen();

    @Data
    public static class UsuarioOverrideItem {
        private Integer idUsuario;
        private String nombreUsuario;
        private String usuario;
        private String correo;
        private String telefono;
        private String avatarUrl;
        private Boolean activo;
        private Integer idRol;
        private String nombreRol;
        private Boolean rolProtegido;
        private Integer permisosHeredados = 0;
        private Integer overridesActivos = 0;
        private Integer overridesPermitidos = 0;
        private Integer overridesDenegados = 0;
        private Integer overridesCriticos = 0;
        private List<String> permisosOverride = new ArrayList<>();
    }

    @Data
    public static class Resumen {
        private Integer usuariosActivos = 0;
        private Integer usuariosConOverrides = 0;
        private Integer overridesActivos = 0;
        private Integer permitidosPorExcepcion = 0;
        private Integer denegadosPorExcepcion = 0;
        private Integer overridesCriticos = 0;
    }
}
