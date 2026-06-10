package com.galtekone.services.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.CajasEntity;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.repository.CajasRepository;
import com.galtekone.services.CajasService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class CajasServiceImpl implements CajasService {

	@Autowired
	private CajasRepository cajasRepository;

	@Override
	public CajasEntity create(CajasEntity obj, String user) {
		Integer empresaId = EmpresaContextHolder.getEmpresaId();
		EmpresasEntity empresa = new EmpresasEntity();
		empresa.setIdEmpresa(empresaId);
		obj.setEmpresa(empresa);
		obj.setUsuarioCreacion(user);
		return cajasRepository.save(obj);
	}

	@Override
	public List<CajasEntity> read(Specification<CajasEntity> specs) {
		Integer empresaId = EmpresaContextHolder.getEmpresaId();

		Specification<CajasEntity> filtroEmpresa = (root, query, cb) ->
			cb.equal(root.get("empresa").get("idEmpresa"), empresaId);

		Specification<CajasEntity> finalSpec = Specification.where(specs).and(filtroEmpresa);

		return cajasRepository.findAll(finalSpec);
	}

	@Override
	public CajasEntity update(CajasEntity obj, String user) {
		Integer empresaId = EmpresaContextHolder.getEmpresaId();

		Optional<CajasEntity> optional = cajasRepository.findById(obj.getIdCaja());

		if (optional.isEmpty() || !optional.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
			throw new EntityNotFoundException("Caja no encontrada o no pertenece a tu empresa");
		}

		CajasEntity entityToUpdate = optional.get();

		if (obj.getNombreCaja() != null) {
			entityToUpdate.setNombreCaja(obj.getNombreCaja());
		}

		if (obj.getTipo() != null) {
			entityToUpdate.setTipo(obj.getTipo());
		}

		if (obj.getEstatus() != null) {
			entityToUpdate.setEstatus(obj.getEstatus());
		}

		entityToUpdate.setUsuarioModificacion(user);

		return cajasRepository.save(entityToUpdate);
	}

	@Override
	public CajasEntity delete(Integer idCaja, String user) {
		Integer empresaId = EmpresaContextHolder.getEmpresaId();

		Optional<CajasEntity> optional = cajasRepository.findById(idCaja);

		if (optional.isEmpty() || !optional.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
			throw new EntityNotFoundException("Caja no encontrada o no pertenece a tu empresa");
		}

		CajasEntity entity = optional.get();
		entity.setUsuarioModificacion(user);
		cajasRepository.deleteById(idCaja);

		return entity;
	}
}