package com.galtekone.dto.pagos;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class MetodoPagoConfigDTO {
    private Integer idMetodoPago;
    private String nombre;
    private String nombreMetodoPago;
    private String codigo;
    private String tipo;
    private Integer orden;
    private Boolean estatus;
    private Boolean visiblePos;
    private Boolean requiereReferencia;
    private Boolean requiereVerificacion;
    private BigDecimal comisionPorcentaje;
    private String terminalProvider;
    private String terminalNombre;
    private String cuentaDestino;
}
