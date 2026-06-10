package com.galtekone.dto.login;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDTO {
	
	private String token;
	private String usuario;
	private String nombreUsuario;
	private String rol;
	private String avatarUrl;
	private Integer idEmpresa;
	private String nombreEmpresa;


}