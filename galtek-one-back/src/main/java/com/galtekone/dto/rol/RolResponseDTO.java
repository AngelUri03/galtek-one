package com.galtekone.dto.rol;

import java.util.List;
import lombok.Data;

@Data
public class RolResponseDTO {
	private Integer idRol;
	private String nombreRol;
	private Boolean estatus;
	private Integer idEmpresa;
	private List<PermisoDTO> permisos;

	@Data
	public static class PermisoDTO {
		private Integer idPermiso;
		private String nombre;
		private String clave;

		public PermisoDTO(Integer idPermiso, String nombre, String clave) {
			this.idPermiso = idPermiso;
			this.nombre = nombre;
			this.clave = clave;
		}
	}
}