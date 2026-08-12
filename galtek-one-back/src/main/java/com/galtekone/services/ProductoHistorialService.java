package com.galtekone.services;

import java.util.List;

import com.galtekone.entity.ProductoHistorialEntity;

public interface ProductoHistorialService {

    /**
     * Registra un nuevo evento en el historial del producto.
     *
     * @param historial Información del cambio realizado.
     * @return Registro guardado.
     */
    ProductoHistorialEntity registrarEvento(ProductoHistorialEntity historial);

    /**
     * Obtiene el historial completo de un producto.
     *
     * @param idProducto Id del producto.
     * @return Lista de eventos ordenados del más reciente al más antiguo.
     */
    List<ProductoHistorialEntity> obtenerHistorialProducto(Integer idProducto);

    /**
     * Obtiene el historial de un producto dentro de una empresa.
     *
     * @param idProducto Id del producto.
     * @param idEmpresa Id de la empresa.
     * @return Lista de eventos.
     */
    List<ProductoHistorialEntity> obtenerHistorialProducto(Integer idProducto, Integer idEmpresa);

    /**
     * Obtiene los eventos de un tipo específico.
     *
     * @param tipoEvento Tipo de evento.
     * @return Lista de eventos.
     */
    List<ProductoHistorialEntity> obtenerPorTipoEvento(String tipoEvento);

}