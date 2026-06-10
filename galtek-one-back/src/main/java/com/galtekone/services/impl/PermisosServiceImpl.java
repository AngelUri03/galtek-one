package com.galtekone.services.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.entity.PermisosEntity;
import com.galtekone.repository.PermisosRepository;
import com.galtekone.services.PermisosService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class PermisosServiceImpl implements PermisosService {

	@Autowired
	private PermisosRepository permisosRepository;

	@Override
	public PermisosEntity create(PermisosEntity obj, String user) {
		obj.setUsuarioCreacion(user);
		return permisosRepository.save(obj);
	}

	@Override
	public List<PermisosEntity> read(Specification<PermisosEntity> specs) {
		return permisosRepository.findAll(Specification.where(specs));
	}

	@Override
	public PermisosEntity update(PermisosEntity obj, String user) {
		Optional<PermisosEntity> aux = permisosRepository.findById(obj.getIdPermiso());

		if (aux.isEmpty()) {
			throw new EntityNotFoundException("Permiso no encontrado con ID: " + obj.getIdPermiso());
		}

		PermisosEntity entityToUpdate = aux.get();

		if (obj.getClave() != null) {
			entityToUpdate.setClave(obj.getClave());
		}
		if (obj.getNombre() != null) {
			entityToUpdate.setNombre(obj.getNombre());
		}
		if (obj.getDescripcion() != null) {
			entityToUpdate.setDescripcion(obj.getDescripcion());
		}
		if (obj.getModulo() != null) {
			entityToUpdate.setModulo(obj.getModulo());
		}
		if (obj.getAccion() != null) {
			entityToUpdate.setAccion(obj.getAccion());
		}

		entityToUpdate.setUsuarioModificacion(user);

		return permisosRepository.save(entityToUpdate);
	}

	@Override
	public PermisosEntity delete(Integer idPermiso, String user) {
		Optional<PermisosEntity> optional = permisosRepository.findById(idPermiso);

		if (optional.isEmpty()) {
			throw new EntityNotFoundException("Permiso no encontrado con ID: " + idPermiso);
		}

		PermisosEntity entity = optional.get();
		entity.setUsuarioModificacion(user);
		permisosRepository.deleteById(idPermiso);

		return entity;
	}
	
}