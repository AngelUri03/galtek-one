package com.galtekone.services;

import java.util.List;

import com.galtekone.entity.InventarioMovimientoEntity;

public interface InventarioMovimientoService {

    /**
     * Registra un nuevo movimiento de inventario.
     *
     * @param movimiento Movimiento a registrar.
     * @return Movimiento registrado.
     */
    InventarioMovimientoEntity registrarMovimiento(InventarioMovimientoEntity movimiento);

    /**
     * Obtiene el historial completo de movimientos de un producto.
     *
     * @param idProducto Id del producto.
     * @return Lista de movimientos.
     */
    List<InventarioMovimientoEntity> obtenerMovimientosProducto(Integer idProducto);

    /**
     * Obtiene el historial de movimientos de un lote.
     *
     * @param idLote Id del lote.
     * @return Lista de movimientos.
     */
    List<InventarioMovimientoEntity> obtenerMovimientosLote(Integer idLote);

    /**
     * Obtiene el historial de movimientos de un almacén.
     *
     * @param idAlmacen Id del almacén.
     * @return Lista de movimientos.
     */
    List<InventarioMovimientoEntity> obtenerMovimientosAlmacen(Integer idAlmacen);

    /**
     * Obtiene el historial de movimientos de un producto dentro de una empresa.
     *
     * @param idProducto Id del producto.
     * @param idEmpresa Id de la empresa.
     * @return Lista de movimientos.
     */
    List<InventarioMovimientoEntity> obtenerMovimientosProducto(Integer idProducto, Integer idEmpresa);

}