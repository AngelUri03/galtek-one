package com.galtekone.services;

import java.util.List;

import com.galtekone.dto.rol.RolPermisosRequestDTO;
import com.galtekone.dto.rol.RolRequestDTO;
import com.galtekone.dto.rol.RolResponseDTO;
import com.galtekone.entity.RolesEntity;

public interface RolesService extends CommonService<RolesEntity>{

	List<RolResponseDTO> read(Integer idEmpresa);
	
	public RolResponseDTO create(Integer idEmpresa, RolRequestDTO body, String user);
	
	public RolResponseDTO update(Integer idEmpresa, Integer idRol, RolRequestDTO body, String user);
	
	public RolResponseDTO updatePermisos(Integer idEmpresa, Integer idRol, RolPermisosRequestDTO body, String user);
	
	public RolResponseDTO delete(Integer idEmpresa, Integer idRol, String user);
	
}
