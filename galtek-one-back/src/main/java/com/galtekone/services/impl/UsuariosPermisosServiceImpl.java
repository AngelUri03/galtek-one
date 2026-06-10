package com.galtekone.services.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.entity.UsuariosPermisosEntity;
import com.galtekone.repository.UsuariosPermisosRepository;
import com.galtekone.services.UsuariosPermisosService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class UsuariosPermisosServiceImpl implements UsuariosPermisosService {

	@Autowired
	private UsuariosPermisosRepository usuariosPermisosRepository;

	@Override
	public UsuariosPermisosEntity create(UsuariosPermisosEntity obj, String user) {
		obj.setUsuarioCreacion(user);
		return usuariosPermisosRepository.save(obj);
	}

	@Override
	public List<UsuariosPermisosEntity> read(Specification<UsuariosPermisosEntity> specs) {
		return usuariosPermisosRepository.findAll(Specification.where(specs));
	}

	@Override
	public UsuariosPermisosEntity update(UsuariosPermisosEntity obj, String user) {
		Optional<UsuariosPermisosEntity> aux = usuariosPermisosRepository.findById(obj.getIdUsuariosPermisos());

		if (aux.isEmpty()) {
			throw new EntityNotFoundException("Registro UsuariosPermisos no encontrado con ID: " + obj.getIdUsuariosPermisos());
		}

		UsuariosPermisosEntity entityToUpdate = aux.get();

		if (obj.getUsuario() != null) {
			entityToUpdate.setUsuario(obj.getUsuario());
		}
		if (obj.getPermiso() != null) {
			entityToUpdate.setPermiso(obj.getPermiso());
		}
		if (obj.getEfecto() != null) {
			entityToUpdate.setEfecto(obj.getEfecto());
		}
		if (obj.getMotivo() != null) {
			entityToUpdate.setMotivo(obj.getMotivo());
		}

		entityToUpdate.setUsuarioModificacion(user);

		return usuariosPermisosRepository.save(entityToUpdate);
	}

	@Override
	public UsuariosPermisosEntity delete(Integer idUsuariosPermisos, String user) {
		Optional<UsuariosPermisosEntity> optional = usuariosPermisosRepository.findById(idUsuariosPermisos);

		if (optional.isEmpty()) {
			throw new EntityNotFoundException("Registro UsuariosPermisos no encontrado con ID: " + idUsuariosPermisos);
		}

		UsuariosPermisosEntity entity = optional.get();
		entity.setUsuarioModificacion(user);
		usuariosPermisosRepository.deleteById(idUsuariosPermisos);

		return entity;
	}

}