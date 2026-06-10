package com.galtekone.dto.compra;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CompraDetalleDTO {
    private Integer idCompraDetalle;
    private Integer idCompra;
    private Integer idProducto;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
}
