package com.galtekone.services.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.TipoSuscripcionEntity;
import com.galtekone.repository.EmpresasRepository;
import com.galtekone.repository.TipoSuscripcionRepository;
import com.galtekone.services.EmpresasService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class EmpresasServiceImpl implements EmpresasService {

	@Autowired
	private EmpresasRepository empresasRepository;
	
	@Autowired
	private TipoSuscripcionRepository TipoSuscripcionRepository;

	@Override
	public EmpresasEntity create(EmpresasEntity obj, String user) {

		Integer idTipo = obj.getTipoSuscripcion().getIdTipoSuscripcion();

	    TipoSuscripcionEntity tipoReal = TipoSuscripcionRepository.findById(idTipo)
	        .orElseThrow(() -> new EntityNotFoundException("Tipo de suscripción no encontrado con ID: " + idTipo));

	    obj.setTipoSuscripcion(tipoReal);

	    obj.setUsuarioCreacion(user);
	    return empresasRepository.save(obj);
	}


	@Override
	public List<EmpresasEntity> read(Specification<EmpresasEntity> specs) {
		List<EmpresasEntity> resp = empresasRepository.findAll(Specification.where(specs));
		return resp;
	}

	@Override
	public EmpresasEntity update(EmpresasEntity obj, String user) {
	    Optional<EmpresasEntity> optional = empresasRepository.findById(obj.getIdEmpresa());

	    if (optional.isEmpty()) {
	        throw new EntityNotFoundException("Empresa no encontrada con ID: " + obj.getIdEmpresa());
	    }

	    EmpresasEntity entityToUpdate = optional.get();

	    if (obj.getNombreEmpresa() != null) {
	        entityToUpdate.setNombreEmpresa(obj.getNombreEmpresa());
	    }
	    if (obj.getDireccion() != null) {
	        entityToUpdate.setDireccion(obj.getDireccion());
	    }
	    if (obj.getFechaInicio() != null) {
	        entityToUpdate.setFechaInicio(obj.getFechaInicio());
	    }
	    if (obj.getFechaFin() != null) {
	        entityToUpdate.setFechaFin(obj.getFechaFin());
	    }
	    if (obj.getTokenLicencia() != null) {
	        entityToUpdate.setTokenLicencia(obj.getTokenLicencia());
	    }
	    if (obj.getTipoSuscripcion() != null && obj.getTipoSuscripcion().getIdTipoSuscripcion() != null) {
	        TipoSuscripcionEntity tipoReal = TipoSuscripcionRepository.findById(
	            obj.getTipoSuscripcion().getIdTipoSuscripcion())
	            .orElseThrow(() -> new EntityNotFoundException("Tipo de suscripción no encontrado"));
	        entityToUpdate.setTipoSuscripcion(tipoReal);
	    }

	    entityToUpdate.setUsuarioModificacion(user);

	    return empresasRepository.save(entityToUpdate);
	}


	@Override
	public EmpresasEntity delete(Integer idEmpresa, String user) {
	    Optional<EmpresasEntity> optional = empresasRepository.findById(idEmpresa);

	    if (optional.isEmpty()) {
	        throw new EntityNotFoundException("Empresa no encontrada con ID: " + idEmpresa);
	    }

	    EmpresasEntity entity = optional.get();
	    entity.setUsuarioModificacion(user);
	    empresasRepository.deleteById(idEmpresa);

	    return entity;
	}


}