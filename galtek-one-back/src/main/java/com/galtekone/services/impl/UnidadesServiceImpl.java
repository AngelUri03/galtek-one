package com.galtekone.services.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.entity.UnidadesEntity;
import com.galtekone.repository.UnidadesRepository;
import com.galtekone.services.UnidadesService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class UnidadesServiceImpl implements UnidadesService {

	@Autowired
	private UnidadesRepository unidadesRepository;

	@Override
	public UnidadesEntity create(UnidadesEntity obj, String user) {
		obj.setUsuarioCreacion(user);
		return unidadesRepository.save(obj);
	}

	@Override
	public List<UnidadesEntity> read(Specification<UnidadesEntity> specs) {
		List<UnidadesEntity> resp = unidadesRepository.findAll(Specification.where(specs));
		return resp;
	}

	@Override
	public UnidadesEntity update(UnidadesEntity obj, String user) {
		Optional<UnidadesEntity> aux = unidadesRepository.findById(obj.getIdUnidad());

		if (aux.isEmpty()) {
			throw new EntityNotFoundException("Unidad no encontrado con ID: " + obj.getIdUnidad());
		}

		UnidadesEntity entityToUpdate = aux.get();

		if (obj.getNombreUnidad() != null) {
			entityToUpdate.setNombreUnidad(obj.getNombreUnidad());
		}
		
		if (obj.getEstatus() != null) {
			entityToUpdate.setEstatus(obj.getEstatus());
		}

		entityToUpdate.setUsuarioModificacion(user);

		return unidadesRepository.save(entityToUpdate);
	}

	@Override
	public UnidadesEntity delete(Integer idUnidad, String user) {
	    Optional<UnidadesEntity> optional = unidadesRepository.findById(idUnidad);

	    if (optional.isEmpty()) {
	        throw new EntityNotFoundException("Unidad no encontrado con ID: " + idUnidad);
	    }

	    UnidadesEntity entity = optional.get();
	    entity.setUsuarioModificacion(user);
	    unidadesRepository.deleteById(idUnidad);

	    return entity;
	}


}