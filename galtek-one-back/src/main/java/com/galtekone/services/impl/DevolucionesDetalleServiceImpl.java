package com.galtekone.services.impl;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.entity.DevolucionesDetalleEntity;
import com.galtekone.entity.DevolucionesEntity;
import com.galtekone.entity.ProductosEntity;
import com.galtekone.repository.DevolucionesDetalleRepository;
import com.galtekone.repository.DevolucionesRepository;
import com.galtekone.repository.ProductosRepository;
import com.galtekone.services.DevolucionesDetalleService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class DevolucionesDetalleServiceImpl implements DevolucionesDetalleService {

    @Autowired
    private DevolucionesDetalleRepository devolucionesDetalleRepository;

    @Autowired
    private DevolucionesRepository devolucionesRepository;

    @Autowired
    private ProductosRepository productosRepository;

    @Override
    public DevolucionesDetalleEntity create(DevolucionesDetalleEntity obj, String user) {
    	Integer idDevolucion = obj.getDevolucion().getIdDevolucion();
        DevolucionesEntity devolucion = devolucionesRepository.findById(idDevolucion)
                .orElseThrow(() -> new EntityNotFoundException("Devolución no encontrada con ID: " + idDevolucion));
        obj.setDevolucion(devolucion);

        Integer idProducto = obj.getProducto().getIdProducto();
        ProductosEntity producto = productosRepository.findById(idProducto)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado con ID: " + idProducto));
        obj.setProducto(producto);

        obj.setUsuarioCreacion(user);
        obj.setUsuarioModificacion(user);

        return devolucionesDetalleRepository.save(obj);
    }
    
    @Override
    public List<DevolucionesDetalleEntity> read(Specification<DevolucionesDetalleEntity> specs) {
        return devolucionesDetalleRepository.findAll(Specification.where(specs));
    }

    @Override
    public DevolucionesDetalleEntity update(DevolucionesDetalleEntity obj, String user) {
        Optional<DevolucionesDetalleEntity> optional = devolucionesDetalleRepository.findById(obj.getIdDevolucionDetalle());

        if (optional.isEmpty()) {
            throw new EntityNotFoundException("Detalle de devolución no encontrado con ID: " + obj.getIdDevolucionDetalle());
        }

        DevolucionesDetalleEntity entityToUpdate = optional.get();

        if (obj.getProducto() != null && obj.getProducto().getIdProducto() != null) {
            ProductosEntity producto = productosRepository.findById(obj.getProducto().getIdProducto())
                    .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));
            entityToUpdate.setProducto(producto);
        }

        if (obj.getDevolucion() != null && obj.getDevolucion().getIdDevolucion() != null) {
            DevolucionesEntity devolucion = devolucionesRepository.findById(obj.getDevolucion().getIdDevolucion())
                    .orElseThrow(() -> new EntityNotFoundException("Devolución no encontrada"));
            entityToUpdate.setDevolucion(devolucion);
        }

        if (obj.getCantidad() != null) {
            entityToUpdate.setCantidad(obj.getCantidad());
        }

        if (obj.getSubtotal() != null) {
            entityToUpdate.setSubtotal(obj.getSubtotal());
        }

        entityToUpdate.setUsuarioModificacion(user);

        return devolucionesDetalleRepository.save(entityToUpdate);
    }

    @Override
    public DevolucionesDetalleEntity delete(Integer id, String user) {
        Optional<DevolucionesDetalleEntity> optional = devolucionesDetalleRepository.findById(id);

        if (optional.isEmpty()) {
            throw new EntityNotFoundException("Detalle de devolución no encontrado con ID: " + id);
        }

        DevolucionesDetalleEntity entity = optional.get();
        entity.setUsuarioModificacion(user);

        devolucionesDetalleRepository.deleteById(id);

        return entity;
    }
}