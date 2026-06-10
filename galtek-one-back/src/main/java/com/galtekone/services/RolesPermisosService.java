package com.galtekone.services;

import com.galtekone.entity.RolesPermisosEntity;

public interface RolesPermisosService extends CommonService<RolesPermisosEntity> {
	
	public RolesPermisosEntity create(RolesPermisosEntity obj, Integer idEmpresa, String user);

}