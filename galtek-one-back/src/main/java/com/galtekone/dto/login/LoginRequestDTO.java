package com.galtekone.dto.login;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequestDTO {
	@NotBlank
	private String usuario;
	@NotBlank
	private String password;
}