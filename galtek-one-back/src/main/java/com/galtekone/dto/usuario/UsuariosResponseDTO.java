package com.galtekone.dto.usuario;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class UsuariosResponseDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RolUsuarios {
        private String rol;
        private List<UsuarioItem> usuarios = new ArrayList<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsuarioItem {
        private String nombreUsuario;
        private String usuario;
        private String avatarUrl;
    }
}