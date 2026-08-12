package com.galtekone.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.galtekone.entity.InventarioMovimientoEntity;

public interface InventarioMovimientoRepository extends JpaRepository<InventarioMovimientoEntity, Integer>,
        JpaSpecificationExecutor<InventarioMovimientoEntity> {

    /**
     * Historial de movimientos de un producto.
     */
    List<InventarioMovimientoEntity> findByProducto_IdProductoOrderByFechaMovimientoDesc(Integer idProducto);

    /**
     * Historial de un lote.
     */
    List<InventarioMovimientoEntity> findByLote_IdLoteOrderByFechaMovimientoDesc(Integer idLote);

    /**
     * Historial de un almacén.
     */
    List<InventarioMovimientoEntity> findByAlmacen_IdAlmacenOrderByFechaMovimientoDesc(Integer idAlmacen);

    /**
     * Historial de un producto dentro de una empresa.
     */
    List<InventarioMovimientoEntity> findByProducto_IdProductoAndEmpresa_IdEmpresaOrderByFechaMovimientoDesc(
            Integer idProducto,
            Integer idEmpresa);

}