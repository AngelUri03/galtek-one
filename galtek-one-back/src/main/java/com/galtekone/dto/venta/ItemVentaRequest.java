package com.galtekone.dto.venta;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ItemVentaRequest {

    private Integer productoId;
    private BigDecimal cantidad;
}
