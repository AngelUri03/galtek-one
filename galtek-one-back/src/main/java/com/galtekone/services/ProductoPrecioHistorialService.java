package com.galtekone.services;

import java.util.List;

import com.galtekone.entity.ProductoPrecioHistorialEntity;

public interface ProductoPrecioHistorialService {

    /**
     * Registra un cambio de precio de un producto.
     *
     * @param historial Información del cambio de precio.
     * @return Registro guardado.
     */
    ProductoPrecioHistorialEntity registrarCambioPrecio(ProductoPrecioHistorialEntity historial);

    /**
     * Obtiene el historial de precios de un producto.
     *
     * @param idProducto Id del producto.
     * @return Lista de cambios ordenados del más reciente al más antiguo.
     */
    List<ProductoPrecioHistorialEntity> obtenerHistorialPrecios(Integer idProducto);

    /**
     * Obtiene el historial de precios de un producto dentro de una empresa.
     *
     * @param idProducto Id del producto.
     * @param idEmpresa Id de la empresa.
     * @return Lista de cambios.
     */
    List<ProductoPrecioHistorialEntity> obtenerHistorialPrecios(Integer idProducto, Integer idEmpresa);

}