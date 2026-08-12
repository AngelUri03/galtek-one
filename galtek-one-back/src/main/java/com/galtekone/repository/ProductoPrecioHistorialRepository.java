package com.galtekone.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.galtekone.entity.ProductoPrecioHistorialEntity;

public interface ProductoPrecioHistorialRepository
        extends JpaRepository<ProductoPrecioHistorialEntity, Integer>,
                JpaSpecificationExecutor<ProductoPrecioHistorialEntity> {

    /**
     * Historial de precios de un producto.
     */
    List<ProductoPrecioHistorialEntity> findByProducto_IdProductoOrderByFechaEventoDesc(Integer idProducto);

    /**
     * Historial de precios por empresa.
     */
    List<ProductoPrecioHistorialEntity> findByProducto_IdProductoAndEmpresa_IdEmpresaOrderByFechaEventoDesc(
            Integer idProducto,
            Integer idEmpresa);

}