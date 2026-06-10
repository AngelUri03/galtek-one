package com.galtekone.services.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.entity.RolesPermisosEntity;
import com.galtekone.repository.RolesPermisosRepository;
import com.galtekone.services.RolesPermisosService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class RolesPermisosServiceImpl implements RolesPermisosService {

	@Autowired
	private RolesPermisosRepository rolesPermisosRepository;

	@Override
	public RolesPermisosEntity create(RolesPermisosEntity obj, String user) {
		obj.setUsuarioCreacion(user);
		return rolesPermisosRepository.save(obj);
	}
	
	@Override
	public RolesPermisosEntity create(RolesPermisosEntity obj, Integer idEmpresa, String user) {
		obj.setUsuarioCreacion(user);
		return rolesPermisosRepository.save(obj);
	}

	@Override
	public List<RolesPermisosEntity> read(Specification<RolesPermisosEntity> specs) {
		return rolesPermisosRepository.findAll(Specification.where(specs));
	}

	@Override
	public RolesPermisosEntity update(RolesPermisosEntity obj, String user) {
		Optional<RolesPermisosEntity> aux = rolesPermisosRepository.findById(obj.getIdRolesPermisos());

		if (aux.isEmpty()) {
			throw new EntityNotFoundException("Registro RolesPermisos no encontrado con ID: " + obj.getIdRolesPermisos());
		}

		RolesPermisosEntity entityToUpdate = aux.get();

		if (obj.getRol() != null) {
			entityToUpdate.setRol(obj.getRol());
		}
		if (obj.getPermiso() != null) {
			entityToUpdate.setPermiso(obj.getPermiso());
		}
		if (obj.getEstatus() != null) {
			entityToUpdate.setEstatus(obj.getEstatus());
		}

		entityToUpdate.setUsuarioModificacion(user);

		return rolesPermisosRepository.save(entityToUpdate);
	}

	@Override
	public RolesPermisosEntity delete(Integer idRolesPermisos, String user) {
		Optional<RolesPermisosEntity> optional = rolesPermisosRepository.findById(idRolesPermisos);

		if (optional.isEmpty()) {
			throw new EntityNotFoundException("Registro RolesPermisos no encontrado con ID: " + idRolesPermisos);
		}

		RolesPermisosEntity entity = optional.get();
		entity.setUsuarioModificacion(user);
		rolesPermisosRepository.deleteById(idRolesPermisos);

		return entity;
	}
	
}