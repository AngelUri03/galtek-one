package com.galtekone.dto.rol;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RolRequestDTO {

	@NotBlank(message = "nombreRol es requerido")
	private String nombreRol;

	@NotNull(message = "estatus es requerido")
	private Boolean estatus;
}