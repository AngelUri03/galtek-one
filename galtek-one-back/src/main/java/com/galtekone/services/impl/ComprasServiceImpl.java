package com.galtekone.services.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.ComprasEntity;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.ProveedoresEntity;
import com.galtekone.entity.UsuariosEntity;
import com.galtekone.repository.ComprasRepository;
import com.galtekone.repository.ProveedoresRepository;
import com.galtekone.repository.UsuariosRepository;
import com.galtekone.services.ComprasService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class ComprasServiceImpl implements ComprasService {

	@Autowired
	private ComprasRepository comprasRepository;

	@Autowired
	private ProveedoresRepository proveedoresRepository;

	@Autowired
	private UsuariosRepository usuariosRepository;

	@Override
	public ComprasEntity create(ComprasEntity obj, String user) {
	    Integer empresaId = EmpresaContextHolder.getEmpresaId();

	    Integer idProveedor = obj.getIdProveedor().getIdProveedor();
	    Integer idUsuario = obj.getIdUsuario().getIdUsuario();

	    ProveedoresEntity proveedorReal = proveedoresRepository.findById(idProveedor)
	        .orElseThrow(() -> new EntityNotFoundException("Proveedor no encontrado con ID: " + idProveedor));

	    if (!proveedorReal.getEmpresa().getIdEmpresa().equals(empresaId)) {
	        throw new EntityNotFoundException("El proveedor no pertenece a la empresa actual");
	    }

	    UsuariosEntity usuarioReal = usuariosRepository.findById(idUsuario)
	        .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado con ID: " + idUsuario));

	    if (!usuarioReal.getEmpresa().getIdEmpresa().equals(empresaId)) {
	        throw new EntityNotFoundException("El usuario no pertenece a la empresa actual");
	    }

	    // Asignar empresa desde contexto
	    EmpresasEntity empresa = new EmpresasEntity();
	    empresa.setIdEmpresa(empresaId);

	    obj.setIdProveedor(proveedorReal);
	    obj.setIdUsuario(usuarioReal);
	    obj.setEmpresa(empresa);
	    obj.setUsuarioCreacion(user);

	    return comprasRepository.save(obj);
	}

	@Override
	public List<ComprasEntity> read(Specification<ComprasEntity> specs) {
		Integer empresaId = EmpresaContextHolder.getEmpresaId();

		Specification<ComprasEntity> filtroEmpresa = (root, query, cb) ->
			cb.equal(root.get("empresa").get("idEmpresa"), empresaId);

		Specification<ComprasEntity> finalSpec = Specification.where(specs).and(filtroEmpresa);

		return comprasRepository.findAll(finalSpec);
	}

	@Override
	public ComprasEntity update(ComprasEntity obj, String user) {
		Integer empresaId = EmpresaContextHolder.getEmpresaId();

		Optional<ComprasEntity> optional = comprasRepository.findById(obj.getIdCompra());

		if (optional.isEmpty() || !optional.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
			throw new EntityNotFoundException("Compra no encontrada o no pertenece a tu empresa");
		}

		ComprasEntity entityToUpdate = optional.get();

		if (obj.getIdProveedor() != null && obj.getIdProveedor().getIdProveedor() != null) {
			ProveedoresEntity proveedorReal = proveedoresRepository.findById(
					obj.getIdProveedor().getIdProveedor())
					.orElseThrow(() -> new EntityNotFoundException("Proveedor no encontrado"));
			entityToUpdate.setIdProveedor(proveedorReal);
		}

		if (obj.getIdUsuario() != null && obj.getIdUsuario().getIdUsuario() != null) {
			UsuariosEntity usuarioReal = usuariosRepository.findById(
					obj.getIdUsuario().getIdUsuario())
					.orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
			entityToUpdate.setIdUsuario(usuarioReal);
		}

		if (obj.getTotalCompra() != null) {
			entityToUpdate.setTotalCompra(obj.getTotalCompra());
		}

		if (obj.getFechaCompra() != null) {
			entityToUpdate.setFechaCompra(obj.getFechaCompra());
		}

		if (obj.getTicketProveedor() != null) {
			entityToUpdate.setTicketProveedor(obj.getTicketProveedor());
		}

		entityToUpdate.setUsuarioModificacion(user);

		return comprasRepository.save(entityToUpdate);
	}

	@Override
	public ComprasEntity delete(Integer idCompra, String user) {
		Integer empresaId = EmpresaContextHolder.getEmpresaId();

		Optional<ComprasEntity> optional = comprasRepository.findById(idCompra);

		if (optional.isEmpty() || !optional.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
			throw new EntityNotFoundException("Compra no encontrada o no pertenece a tu empresa");
		}

		ComprasEntity entity = optional.get();
		entity.setUsuarioModificacion(user);
		comprasRepository.deleteById(idCompra);

		return entity;
	}
}