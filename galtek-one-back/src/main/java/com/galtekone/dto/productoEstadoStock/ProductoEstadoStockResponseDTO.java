package com.galtekone.dto.productoEstadoStock;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class ProductoEstadoStockResponseDTO {

    private Integer idProductoEstadoStock;

    private Integer idProducto;
    private String nombreProducto;

    private Integer idEstadoStock;
    private String nombreEstado;

    private BigDecimal minimo;
    private BigDecimal maximo;

}
