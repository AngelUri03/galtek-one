package com.galtekone.services;

import java.util.List;

import com.galtekone.dto.usuario.UsuariosResponseDTO;
import com.galtekone.entity.UsuariosEntity;

public interface UsuariosService extends CommonService<UsuariosEntity>{
	
	List<UsuariosResponseDTO.RolUsuarios> getUsuariosRol(Integer idEmpresa);

	UsuariosEntity updatePassword(Integer idUsuario, String encryptedPassword, String user);

	UsuariosEntity changeOwnPassword(String user, String encryptedPassword);

	UsuariosEntity updateAvatar(Integer idUsuario, String contentType, byte[] bytes, String user);

	UsuariosEntity activar(Integer idUsuario, String user);

	UsuariosEntity desactivar(Integer idUsuario, String user);

}
