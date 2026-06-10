package com.galtekone.services;

import java.util.List;

import com.galtekone.dto.usuario.UsuariosResponseDTO;
import com.galtekone.entity.UsuariosEntity;

public interface UsuariosService extends CommonService<UsuariosEntity>{
	
	List<UsuariosResponseDTO.RolUsuarios> getUsuariosRol(Integer idEmpresa);

}
