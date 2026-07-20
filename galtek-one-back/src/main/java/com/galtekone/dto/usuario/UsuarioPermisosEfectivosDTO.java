package com.galtekone.dto.usuario;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class UsuarioPermisosEfectivosDTO {

    private UsuarioInfo usuario;
    private RolInfo rol;
    private List<PermisoEfectivo> permisos = new ArrayList<>();
    private List<OverrideActivo> overridesActivos = new ArrayList<>();
    private Resumen resumen = new Resumen();

    @Data
    public static class UsuarioInfo {
        private Integer idUsuario;
        private String nombreUsuario;
        private String usuario;
        private String correo;
        private String telefono;
        private String avatarUrl;
        private Boolean activo;
        private Boolean protegido;
    }

    @Data
    public static class RolInfo {
        private Integer idRol;
        private String nombreRol;
        private Boolean protegido;
    }

    @Data
    public static class PermisoEfectivo {
        private Integer idPermiso;
        private String clave;
        private String modulo;
        private String accion;
        private String nombre;
        private String descripcion;
        private Boolean permitidoPorRol;
        private String override;
        private Boolean efectivo;
        private String motivo;
        private String riesgo;
        private Boolean noOverrideable;
        private String usuarioAutorizo;
        private LocalDateTime fechaOverride;
    }

    @Data
    public static class OverrideActivo {
        private Integer idUsuariosPermisos;
        private Integer idPermiso;
        private String clave;
        private String modulo;
        private String nombre;
        private String efecto;
        private String motivo;
        private String riesgo;
        private Boolean noOverrideable;
        private String usuarioAutorizo;
        private LocalDateTime fecha;
    }

    @Data
    public static class Resumen {
        private Integer permisosHeredados = 0;
        private Integer permisosEfectivos = 0;
        private Integer overridesActivos = 0;
        private Integer permitidosPorExcepcion = 0;
        private Integer denegadosPorExcepcion = 0;
        private Integer overridesCriticos = 0;
        private Boolean requiereRolNuevo = false;
    }
}
