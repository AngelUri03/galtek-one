package com.galtekone.services.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.entity.TipoSuscripcionEntity;
import com.galtekone.repository.TipoSuscripcionRepository;
import com.galtekone.services.TipoSuscripcionService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class TipoSuscripcionServiceImpl implements TipoSuscripcionService {

	@Autowired
	private TipoSuscripcionRepository tipoSuscripcionRepository;

	@Override
	public TipoSuscripcionEntity create(TipoSuscripcionEntity obj, String user) {
		obj.setUsuarioCreacion(user);
		return tipoSuscripcionRepository.save(obj);
	}

	@Override
	public List<TipoSuscripcionEntity> read(Specification<TipoSuscripcionEntity> specs) {
		List<TipoSuscripcionEntity> resp = tipoSuscripcionRepository.findAll(Specification.where(specs));
		return resp;
	}

	@Override
	public TipoSuscripcionEntity update(TipoSuscripcionEntity obj, String user) {
		Optional<TipoSuscripcionEntity> aux = tipoSuscripcionRepository.findById(obj.getIdTipoSuscripcion());

		if (aux.isEmpty()) {
			throw new EntityNotFoundException("Suscripcion no encontrada con ID: " + obj.getIdTipoSuscripcion());
		}

		TipoSuscripcionEntity entityToUpdate = aux.get();

		if (obj.getNombreTipoSuscripcion() != null) {
			entityToUpdate.setNombreTipoSuscripcion(obj.getNombreTipoSuscripcion());
		}
		
		if (obj.getEstatus() != null) {
			entityToUpdate.setEstatus(obj.getEstatus());
		}

		entityToUpdate.setUsuarioModificacion(user);

		return tipoSuscripcionRepository.save(entityToUpdate);
	}

	@Override
	public TipoSuscripcionEntity delete(Integer idTipoSuscripcion, String user) {
	    Optional<TipoSuscripcionEntity> optional = tipoSuscripcionRepository.findById(idTipoSuscripcion);

	    if (optional.isEmpty()) {
	        throw new EntityNotFoundException("Suscripcion no encontrada con ID: " + idTipoSuscripcion);
	    }

	    TipoSuscripcionEntity entity = optional.get();
	    entity.setUsuarioModificacion(user);
	    tipoSuscripcionRepository.deleteById(idTipoSuscripcion);

	    return entity;
	}


}
