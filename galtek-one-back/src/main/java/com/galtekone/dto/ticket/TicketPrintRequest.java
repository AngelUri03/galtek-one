package com.galtekone.dto.ticket;

import java.math.BigDecimal;
import java.util.List;

import lombok.Data;

@Data
public class TicketPrintRequest {
    private String folio;
    private String cajero;
    private String metodoPago;
    private List<Item> items;
    private BigDecimal subtotal;
    private BigDecimal descuento;
    private BigDecimal impuesto;
    private BigDecimal total;
    private BigDecimal recibido;
    private BigDecimal cambio;

    @Data
    public static class Item {
        private String nombre;
        private BigDecimal cantidad;
        private BigDecimal precioUnitario;
        private BigDecimal total;
    }
}
