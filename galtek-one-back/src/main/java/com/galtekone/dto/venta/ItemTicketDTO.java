package com.galtekone.dto.venta;

import lombok.Data;

import java.math.BigDecimal;
@Data
    public class ItemTicketDTO {

        private Integer idProducto;
        private String nombreProducto;
        private BigDecimal cantidad;
        private BigDecimal precioUnitario;
        private BigDecimal importe;
    }
