package com.galtekone.dto.venta;

import com.galtekone.dto.cliente.ClienteDTO;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
@Data
public class TicketVentaResponse {

    private Integer idVenta;
    private String folio;
    private LocalDateTime fecha;
    private ClienteDTO cliente;
    private List<ItemTicketDTO> items;
    private BigDecimal subtotal;
    private BigDecimal IVA;
    private BigDecimal total;
    private BigDecimal totalOriginal;
    private BigDecimal totalCobrado;
    private BigDecimal redondeoAplicado;
    private BigDecimal comisionMonto;
    private BigDecimal comisionPorcentaje;
    private BigDecimal recibido;
    private BigDecimal cambio;
    private String referencia;
    private String folioPago;
    private Boolean pagoVerificado;
    private String metodoPago;
    private String usuarioAtendio;
    private String mensaje;

}
