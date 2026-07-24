package com.galtekone.services.impl;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
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
	    normalizeMethodMetadata(obj);

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
	    if (obj.getCodigo() != null) {
	    	entityToUpdate.setCodigo(normalizeCode(obj.getCodigo()));
	    }
	    if (obj.getTipo() != null) {
	    	entityToUpdate.setTipo(normalizeType(obj.getTipo()));
	    }
	    if (obj.getOrden() != null) {
	    	entityToUpdate.setOrden(obj.getOrden());
	    }
	    if (obj.getVisiblePos() != null) {
	    	entityToUpdate.setVisiblePos(obj.getVisiblePos());
	    }
	    if (obj.getRequiereReferencia() != null) {
	    	entityToUpdate.setRequiereReferencia(obj.getRequiereReferencia());
	    }
	    if (obj.getRequiereVerificacion() != null) {
	    	entityToUpdate.setRequiereVerificacion(obj.getRequiereVerificacion());
	    }
	    normalizeMethodMetadata(entityToUpdate);

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

	private void normalizeMethodMetadata(MetodoPagoEntity method) {
		if (method.getCodigo() == null || method.getCodigo().isBlank()) {
			method.setCodigo(normalizeCode(method.getNombreMetodoPago()));
		} else {
			method.setCodigo(normalizeCode(method.getCodigo()));
		}
		if (method.getTipo() == null || method.getTipo().isBlank()) {
			method.setTipo(normalizeType(method.getCodigo() != null ? method.getCodigo() : method.getNombreMetodoPago()));
		} else {
			method.setTipo(normalizeType(method.getTipo()));
		}
		if (method.getVisiblePos() == null) {
			method.setVisiblePos(true);
		}
		if (method.getRequiereReferencia() == null) {
			method.setRequiereReferencia(defaultRequiresReference(method.getTipo()));
		}
		if (method.getRequiereVerificacion() == null) {
			method.setRequiereVerificacion(defaultRequiresVerification(method.getTipo()));
		}
	}

	private String normalizeCode(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		String normalized = Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
				.replaceAll("\\p{M}", "")
				.toUpperCase(Locale.ROOT)
				.replaceAll("[^A-Z0-9]+", "_")
				.replaceAll("^_+|_+$", "");
		return normalized.isBlank() ? null : normalized;
	}

	private String normalizeType(String value) {
		String normalized = normalizeCode(value);
		if (normalized == null) {
			return "OTHER";
		}
		if (normalized.contains("EFECTIVO") || normalized.contains("CASH")) {
			return "CASH";
		}
		if (normalized.contains("TERMINAL") || normalized.contains("MERCADO_PAGO")) {
			return "TERMINAL";
		}
		if (normalized.contains("TARJETA") || normalized.contains("CREDITO") || normalized.contains("DEBITO")
				|| normalized.contains("CARD")) {
			return "CARD";
		}
		if (normalized.contains("VALE") || normalized.contains("VOUCHER")) {
			return "VOUCHER";
		}
		return "CARD";
	}

	private boolean defaultRequiresReference(String type) {
		return "TERMINAL".equals(type) || "CARD".equals(type) || "VOUCHER".equals(type);
	}

	private boolean defaultRequiresVerification(String type) {
		return "TERMINAL".equals(type) || "CARD".equals(type) || "VOUCHER".equals(type);
	}


}
