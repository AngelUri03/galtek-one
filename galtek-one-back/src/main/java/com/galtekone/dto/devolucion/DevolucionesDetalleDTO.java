package com.galtekone.dto.devolucion;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DevolucionesDetalleDTO {
    private Integer idDevolucionDetalle;
    private Integer idDevolucion;
    private Integer idProducto;
    private Integer cantidad;
    private BigDecimal subtotal;
}
