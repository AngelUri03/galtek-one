package com.galtekone.services.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.MetodoPagoEntity;
import com.galtekone.repository.MetodoPagoRepository;
import com.galtekone.services.MetodoPagoService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class MetodoPagoServiceImpl implements MetodoPagoService {

	@Autowired
	private MetodoPagoRepository metodoPagoRepository;

	@Override
	public MetodoPagoEntity create(MetodoPagoEntity obj, String user) {
	    Integer empresaId = EmpresaContextHolder.getEmpresaId();

	    EmpresasEntity empresa = new EmpresasEntity();
	    empresa.setIdEmpresa(empresaId);

	    obj.setEmpresa(empresa); 
	    obj.setUsuarioCreacion(user);

	    return metodoPagoRepository.save(obj);
	}

	@Override
	public List<MetodoPagoEntity> read(Specification<MetodoPagoEntity> specs) {
	    Integer empresaId = EmpresaContextHolder.getEmpresaId();

	    Specification<MetodoPagoEntity> filtroEmpresa = (root, query, cb) ->
	        cb.equal(root.get("empresa").get("idEmpresa"), empresaId);

	    Specification<MetodoPagoEntity> finalSpec = Specification.where(specs).and(filtroEmpresa);

	    return metodoPagoRepository.findAll(finalSpec);
	}

	@Override
	public MetodoPagoEntity update(MetodoPagoEntity obj, String user) {
	    Integer empresaId = EmpresaContextHolder.getEmpresaId();

	    Optional<MetodoPagoEntity> aux = metodoPagoRepository.findById(obj.getIdMetodoPago());

	    if (aux.isEmpty() || !aux.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
	        throw new EntityNotFoundException("Método de pago no encontrado o no pertenece a tu empresa");
	    }

	    MetodoPagoEntity entityToUpdate = aux.get();

	    if (obj.getNombreMetodoPago() != null) {
	        entityToUpdate.setNombreMetodoPago(obj.getNombreMetodoPago());
	    }

	    if (obj.getEstatus() != null) {
	        entityToUpdate.setEstatus(obj.getEstatus());
	    }

	    entityToUpdate.setUsuarioModificacion(user);

	    return metodoPagoRepository.save(entityToUpdate);
	}

	@Override
	public MetodoPagoEntity delete(Integer idMetodoPago, String user) {
	    Integer empresaId = EmpresaContextHolder.getEmpresaId();

	    Optional<MetodoPagoEntity> optional = metodoPagoRepository.findById(idMetodoPago);

	    if (optional.isEmpty() || !optional.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
	        throw new EntityNotFoundException("Método de pago no encontrado o no pertenece a tu empresa");
	    }

	    MetodoPagoEntity entity = optional.get();
	    entity.setUsuarioModificacion(user);

	    metodoPagoRepository.deleteById(idMetodoPago);

	    return entity;
	}


}
