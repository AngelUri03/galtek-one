package com.galtekone.dto.usuario;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class UsuarioOverridesRequestDTO {

    private List<OverrideItem> overrides = new ArrayList<>();

    @Data
    public static class OverrideItem {
        private Integer idPermiso;
        private String efecto;
        private String motivo;
    }
}
