package com.galtekone.dto.venta;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateVentaRequest {

    private Integer clienteId;
    private Integer metodoPagoId;
    @Deprecated
    private Integer cajaId;
    private Integer almacenId;
    private List<ItemVentaRequest> productos;
    private BigDecimal totalOriginal;
    private BigDecimal totalCobrado;
    private Boolean redondeoActivo;
    private BigDecimal redondeoAplicado;
    private BigDecimal comisionMonto;
    private BigDecimal comisionPorcentaje;
    private BigDecimal recibido;
    private BigDecimal cambio;
    private String referencia;
    private String folio;
    private String terminalKey;
    private Boolean pagoVerificado;
}
