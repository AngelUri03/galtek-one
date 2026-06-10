package com.galtekone.services.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.entity.VentaDetalleEntity;
import com.galtekone.repository.VentaDetalleRepository;
import com.galtekone.services.VentaDetalleService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class VentaDetalleServiceImpl implements VentaDetalleService {
	
	@Autowired
	private VentaDetalleRepository ventaDetalleRepository;

	@Override
	public VentaDetalleEntity create(VentaDetalleEntity obj, String user) {
		// TODO Auto-generated method stub\
		obj.setUsuarioCreacion(user);
		return ventaDetalleRepository.save(obj);
	}

	@Override
	public List<VentaDetalleEntity> read(Specification<VentaDetalleEntity> specs) {
		// TODO Auto-generated method stub
		List<VentaDetalleEntity> resp = ventaDetalleRepository.findAll(Specification.where(specs));
		return resp;
	}

	@Override
	public VentaDetalleEntity update(VentaDetalleEntity obj, String user) {
		// TODO Auto-generated method stub
		Optional<VentaDetalleEntity> aux = ventaDetalleRepository.findById(obj.getIdVentaDetalle());
		if (aux.isEmpty()) {
			throw new EntityNotFoundException("Detalle de venta no encontrado con ID: " + obj.getIdVentaDetalle());
		}
		VentaDetalleEntity entityToUpdate = aux.get();
		
		if(obj.getVenta() != null) {
			entityToUpdate.setVenta(obj.getVenta());
		}
		if(obj.getProducto() != null) {
			entityToUpdate.setProducto(obj.getProducto());
		}
		if(obj.getCantidad() != null) {
			entityToUpdate.setCantidad(obj.getCantidad());
		}
		if(obj.getPrecioUnitario() != null) {
			entityToUpdate.setPrecioUnitario(obj.getPrecioUnitario());
		}
		if(obj.getSubtotal() != null) {
			entityToUpdate.setSubtotal(obj.getSubtotal());
		}
		entityToUpdate.setUsuarioModificacion(user);
		return ventaDetalleRepository.save(entityToUpdate);
	
	}

	@Override
	public VentaDetalleEntity delete(Integer idVentaDetalle, String user) {
		// TODO Auto-generated method stub
		Optional<VentaDetalleEntity> optional = ventaDetalleRepository.findById(idVentaDetalle);
		if(optional.isEmpty()) {
			throw new EntityNotFoundException("Detalle de venta no encontrada con ID: " + idVentaDetalle);
		}
		VentaDetalleEntity entity = optional.get();
		entity.setUsuarioModificacion(user);
		ventaDetalleRepository.deleteById(idVentaDetalle);
		return entity;
	}

}
