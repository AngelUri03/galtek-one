package com.galtekone.dto.rol;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RolPermisosRequestDTO {
	
	@NotNull(message = "permisos es requerido")
    private List<Integer> permisos;

}
