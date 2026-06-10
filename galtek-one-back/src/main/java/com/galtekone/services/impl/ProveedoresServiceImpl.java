package com.galtekone.services.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.ProveedoresEntity;
import com.galtekone.repository.ProveedoresRepository;
import com.galtekone.services.ProveedoresService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class ProveedoresServiceImpl implements ProveedoresService {

	@Autowired
	private ProveedoresRepository proveedoresRepository;

	@Override
	public ProveedoresEntity create(ProveedoresEntity obj, String user) {

	    Integer empresaId = EmpresaContextHolder.getEmpresaId();

	    EmpresasEntity empresa = new EmpresasEntity();
	    empresa.setIdEmpresa(empresaId);

	    obj.setEmpresa(empresa); 
	    obj.setUsuarioCreacion(user);

	    return proveedoresRepository.save(obj);
	}

	@Override
	public List<ProveedoresEntity> read(Specification<ProveedoresEntity> specs) {
	    Integer empresaId = EmpresaContextHolder.getEmpresaId();

	    Specification<ProveedoresEntity> filtroEmpresa = (root, query, cb) ->
	        cb.equal(root.get("empresa").get("idEmpresa"), empresaId);

	    Specification<ProveedoresEntity> finalSpec = Specification.where(specs).and(filtroEmpresa);

	    return proveedoresRepository.findAll(finalSpec);
	}

	@Override
	public ProveedoresEntity update(ProveedoresEntity obj, String user) {
	    Integer empresaId = EmpresaContextHolder.getEmpresaId();

	    Optional<ProveedoresEntity> aux = proveedoresRepository.findById(obj.getIdProveedor());

	    if (aux.isEmpty() || !aux.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
	        throw new EntityNotFoundException("Proveedor no encontrado o no pertenece a tu empresa");
	    }

	    ProveedoresEntity entityToUpdate = aux.get();

	    if (obj.getNombreProveedor() != null) {
	        entityToUpdate.setNombreProveedor(obj.getNombreProveedor());
	    }

	    if (obj.getEstatus() != null) {
	        entityToUpdate.setEstatus(obj.getEstatus());
	    }

	    if (obj.getContacto() != null) {
	        entityToUpdate.setContacto(obj.getContacto());
	    }

	    if (obj.getCorreo() != null) {
	        entityToUpdate.setCorreo(obj.getCorreo());
	    }

	    if (obj.getDireccion() != null) {
	        entityToUpdate.setDireccion(obj.getDireccion());
	    }

	    if (obj.getTelefono() != null) {
	        entityToUpdate.setTelefono(obj.getTelefono());
	    }

	    entityToUpdate.setUsuarioModificacion(user);

	    return proveedoresRepository.save(entityToUpdate);
	}

	@Override
	public ProveedoresEntity delete(Integer idProveedor, String user) {
		Integer empresaId = EmpresaContextHolder.getEmpresaId();

		Optional<ProveedoresEntity> optional = proveedoresRepository.findById(idProveedor);

		if (optional.isEmpty() || !optional.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
			throw new EntityNotFoundException("Proveedor no encontrado o no pertenece a tu empresa");
		}


		ProveedoresEntity entity = optional.get();
		entity.setUsuarioModificacion(user);
		proveedoresRepository.deleteById(idProveedor);

		return entity;
	}
}