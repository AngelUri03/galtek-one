package com.galtekone.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.galtekone.entity.ProductoHistorialEntity;

public interface ProductoHistorialRepository
        extends JpaRepository<ProductoHistorialEntity, Integer>,
                JpaSpecificationExecutor<ProductoHistorialEntity> {

    /**
     * Historial completo de un producto.
     */
    List<ProductoHistorialEntity> findByProducto_IdProductoOrderByFechaEventoDesc(
            Integer idProducto);

    /**
     * Historial de un producto por empresa.
     */
    List<ProductoHistorialEntity> findByProducto_IdProductoAndEmpresa_IdEmpresaOrderByFechaEventoDesc(
            Integer idProducto,
            Integer idEmpresa);

    /**
     * Historial por tipo de evento dentro de una empresa.
     */
    List<ProductoHistorialEntity> findByTipoEventoAndEmpresa_IdEmpresaOrderByFechaEventoDesc(
            String tipoEvento,
            Integer idEmpresa);
}