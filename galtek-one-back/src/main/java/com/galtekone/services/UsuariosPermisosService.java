package com.galtekone.services;

import java.util.List;

import com.galtekone.dto.usuario.UsuarioOverridesRequestDTO;
import com.galtekone.dto.usuario.UsuarioPermisosEfectivosDTO;
import com.galtekone.dto.usuario.UsuariosOverridesResumenDTO;
import com.galtekone.entity.UsuariosPermisosEntity;

public interface UsuariosPermisosService extends CommonService<UsuariosPermisosEntity> {

	UsuariosOverridesResumenDTO getOverridesResumen(Integer idEmpresa, String user);

	UsuarioPermisosEfectivosDTO getPermisosEfectivos(Integer idUsuario, Integer idEmpresa, String user);

	List<UsuarioPermisosEfectivosDTO.OverrideActivo> getOverridesActivos(Integer idUsuario, Integer idEmpresa, String user);

	UsuarioPermisosEfectivosDTO updateOverrides(Integer idUsuario, Integer idEmpresa, UsuarioOverridesRequestDTO body, String user);

	UsuarioPermisosEfectivosDTO deleteOverride(Integer idUsuario, Integer idPermiso, Integer idEmpresa, String user);

}
