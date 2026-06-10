package com.galtekone.services.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.CompraDetalleEntity;
import com.galtekone.entity.ComprasEntity;
import com.galtekone.entity.ProductosEntity;
import com.galtekone.repository.CompraDetalleRepository;
import com.galtekone.repository.ComprasRepository;
import com.galtekone.repository.ProductosRepository;
import com.galtekone.services.CompraDetalleService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class CompraDetalleServiceImpl implements CompraDetalleService {

	@Autowired
	private CompraDetalleRepository compraDetalleRepository;

	@Autowired
	private ComprasRepository comprasRepository;

	@Autowired
	private ProductosRepository productosRepository;

//	@Override
//	public CompraDetalleEntity create(CompraDetalleEntity obj, String user) {
//		Integer empresaId = EmpresaContextHolder.getEmpresaId();
//
//		if (obj.getCompra() == null || obj.getCompra().getIdCompra() == null) {
//			throw new IllegalArgumentException("Debe especificar una compra válida");
//		}
//
//		ComprasEntity compra = comprasRepository.findById(obj.getCompra().getIdCompra())
//			.orElseThrow(() -> new EntityNotFoundException("Compra no encontrada con ID: " + obj.getCompra().getIdCompra()));
//
//		if (!compra.getEmpresa().getIdEmpresa().equals(empresaId)) {
//			throw new EntityNotFoundException("La compra no pertenece a la empresa actual");
//		}
//
//		obj.setCompra(compra);
//
//		if (obj.getProducto() == null || obj.getProducto().getIdProducto() == null) {
//			throw new IllegalArgumentException("Debe especificar un producto válido");
//		}
//
//		ProductosEntity producto = productosRepository.findById(obj.getProducto().getIdProducto())
//			.orElseThrow(() -> new EntityNotFoundException("Producto no encontrado con ID: " + obj.getProducto().getIdProducto()));
//
//		obj.setProducto(producto);
//		obj.setUsuarioCreacion(user);
//
//		return compraDetalleRepository.save(obj);
//	}

	@Override
	public CompraDetalleEntity create(CompraDetalleEntity obj, String user) {
	    Integer empresaId = EmpresaContextHolder.getEmpresaId();

	    // Validar compra
	    if (obj.getCompra() == null || obj.getCompra().getIdCompra() == null) {
	        throw new IllegalArgumentException("Debe especificar una compra válida");
	    }

	    ComprasEntity compra = comprasRepository.findById(obj.getCompra().getIdCompra())
	        .orElseThrow(() -> new EntityNotFoundException("Compra no encontrada con ID: " + obj.getCompra().getIdCompra()));

	    if (!compra.getEmpresa().getIdEmpresa().equals(empresaId)) {
	        throw new EntityNotFoundException("La compra no pertenece a la empresa actual");
	    }

	    obj.setCompra(compra);

	    // Validar producto
	    if (obj.getProducto() == null || obj.getProducto().getIdProducto() == null) {
	        throw new IllegalArgumentException("Debe especificar un producto válido");
	    }

	    ProductosEntity producto = productosRepository.findById(obj.getProducto().getIdProducto())
	        .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado con ID: " + obj.getProducto().getIdProducto()));

	    if (!producto.getEmpresa().getIdEmpresa().equals(empresaId)) {
	        throw new EntityNotFoundException("El producto no pertenece a la empresa actual");
	    }

	    obj.setProducto(producto);
	    obj.setUsuarioCreacion(user);

	    return compraDetalleRepository.save(obj);
	}
	
	
	@Override
	public List<CompraDetalleEntity> read(Specification<CompraDetalleEntity> specs) {
		Integer empresaId = EmpresaContextHolder.getEmpresaId();

		Specification<CompraDetalleEntity> filtroEmpresa = (root, query, cb) ->
			cb.equal(root.get("compra").get("empresa").get("idEmpresa"), empresaId);

		Specification<CompraDetalleEntity> finalSpec = Specification.where(specs).and(filtroEmpresa);

		return compraDetalleRepository.findAll(finalSpec);
	}

//	@Override
//	public CompraDetalleEntity update(CompraDetalleEntity obj, String user) {
//		Integer empresaId = EmpresaContextHolder.getEmpresaId();
//
//		Optional<CompraDetalleEntity> optional = compraDetalleRepository.findById(obj.getIdCompraDetalle());
//
//		if (optional.isEmpty()) {
//			throw new EntityNotFoundException("Detalle de compra no encontrado con ID: " + obj.getIdCompraDetalle());
//		}
//
//		CompraDetalleEntity entityToUpdate = optional.get();
//
//		if (!entityToUpdate.getCompra().getEmpresa().getIdEmpresa().equals(empresaId)) {
//			throw new EntityNotFoundException("El detalle no pertenece a la empresa actual");
//		}
//
//		if (obj.getCompra() != null && obj.getCompra().getIdCompra() != null) {
//			ComprasEntity compra = comprasRepository.findById(obj.getCompra().getIdCompra())
//				.orElseThrow(() -> new EntityNotFoundException("Compra no encontrada con ID: " + obj.getCompra().getIdCompra()));
//
//			if (!compra.getEmpresa().getIdEmpresa().equals(empresaId)) {
//				throw new EntityNotFoundException("La compra no pertenece a la empresa actual");
//			}
//
//			entityToUpdate.setCompra(compra);
//		}
//
//		if (obj.getProducto() != null && obj.getProducto().getIdProducto() != null) {
//			ProductosEntity producto = productosRepository.findById(obj.getProducto().getIdProducto())
//				.orElseThrow(() -> new EntityNotFoundException("Producto no encontrado con ID: " + obj.getProducto().getIdProducto()));
//			entityToUpdate.setProducto(producto);
//		}
//
//		if (obj.getCantidad() != null) {
//			entityToUpdate.setCantidad(obj.getCantidad());
//		}
//		if (obj.getPrecioUnitario() != null) {
//			entityToUpdate.setPrecioUnitario(obj.getPrecioUnitario());
//		}
//		if (obj.getSubtotal() != null) {
//			entityToUpdate.setSubtotal(obj.getSubtotal());
//		}
//		if (obj.getEstatus() != null) {
//			entityToUpdate.setEstatus(obj.getEstatus());
//		}
//
//		entityToUpdate.setUsuarioModificacion(user);
//
//		return compraDetalleRepository.save(entityToUpdate);
//	}
	
	@Override
	public CompraDetalleEntity update(CompraDetalleEntity obj, String user) {
	    Integer empresaId = EmpresaContextHolder.getEmpresaId();

	    Optional<CompraDetalleEntity> optional = compraDetalleRepository.findById(obj.getIdCompraDetalle());

	    if (optional.isEmpty()) {
	        throw new EntityNotFoundException("Detalle de compra no encontrado con ID: " + obj.getIdCompraDetalle());
	    }

	    CompraDetalleEntity entityToUpdate = optional.get();

	    // Validar que el detalle original pertenece a la empresa
	    if (!entityToUpdate.getCompra().getEmpresa().getIdEmpresa().equals(empresaId)) {
	        throw new EntityNotFoundException("El detalle no pertenece a la empresa actual");
	    }

	    // Validar y asignar nueva compra (si se actualiza)
	    if (obj.getCompra() != null && obj.getCompra().getIdCompra() != null) {
	        ComprasEntity compra = comprasRepository.findById(obj.getCompra().getIdCompra())
	            .orElseThrow(() -> new EntityNotFoundException("Compra no encontrada con ID: " + obj.getCompra().getIdCompra()));

	        if (!compra.getEmpresa().getIdEmpresa().equals(empresaId)) {
	            throw new EntityNotFoundException("La compra no pertenece a la empresa actual");
	        }

	        entityToUpdate.setCompra(compra);
	    }

	    // Validar y asignar nuevo producto (si se actualiza)
	    if (obj.getProducto() != null && obj.getProducto().getIdProducto() != null) {
	        ProductosEntity producto = productosRepository.findById(obj.getProducto().getIdProducto())
	            .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado con ID: " + obj.getProducto().getIdProducto()));

	        if (!producto.getEmpresa().getIdEmpresa().equals(empresaId)) {
	            throw new EntityNotFoundException("El producto no pertenece a la empresa actual");
	        }

	        entityToUpdate.setProducto(producto);
	    }

	    if (obj.getCantidad() != null) {
	        entityToUpdate.setCantidad(obj.getCantidad());
	    }
	    if (obj.getPrecioUnitario() != null) {
	        entityToUpdate.setPrecioUnitario(obj.getPrecioUnitario());
	    }
	    if (obj.getSubtotal() != null) {
	        entityToUpdate.setSubtotal(obj.getSubtotal());
	    }
	    if (obj.getEstatus() != null) {
	        entityToUpdate.setEstatus(obj.getEstatus());
	    }

	    entityToUpdate.setUsuarioModificacion(user);

	    return compraDetalleRepository.save(entityToUpdate);
	}

	@Override
	public CompraDetalleEntity delete(Integer idCompraDetalle, String user) {
		Integer empresaId = EmpresaContextHolder.getEmpresaId();

		Optional<CompraDetalleEntity> optional = compraDetalleRepository.findById(idCompraDetalle);

		if (optional.isEmpty()) {
			throw new EntityNotFoundException("Detalle de compra no encontrado con ID: " + idCompraDetalle);
		}

		CompraDetalleEntity entity = optional.get();

		if (!entity.getCompra().getEmpresa().getIdEmpresa().equals(empresaId)) {
			throw new EntityNotFoundException("El detalle no pertenece a la empresa actual");
		}

		entity.setUsuarioModificacion(user);
		compraDetalleRepository.deleteById(idCompraDetalle);

		return entity;
	}
}