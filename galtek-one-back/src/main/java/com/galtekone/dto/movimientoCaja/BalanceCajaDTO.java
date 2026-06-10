package com.galtekone.dto.movimientoCaja;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class BalanceCajaDTO {

    private Integer idCaja;
    private String nombreCaja;

    private BigDecimal totalIngresos;
    private BigDecimal totalEgresos;
    private BigDecimal totalVentasEfectivo;
    private BigDecimal totalDevoluciones;
    private BigDecimal saldoFinal;

    private LocalDateTime desde;
    private LocalDateTime hasta;

}

