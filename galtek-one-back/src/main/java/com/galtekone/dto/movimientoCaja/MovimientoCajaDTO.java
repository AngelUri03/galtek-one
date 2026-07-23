package com.galtekone.dto.movimientoCaja;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.galtekone.dto.caja.CajaEstadoActualDTO;

import lombok.Data;

@Data
public class MovimientoCajaDTO {

    private Integer idMovimientoCaja;

    private Integer idCaja;
    private String nombreCaja;

    private Integer idCajaSesion;
    private LocalDateTime sessionOpenedAt;
    private LocalDateTime sessionClosedAt;
    private CajaEstadoActualDTO.UserInfo sessionResponsibleUser;

    private Integer idUsuario;

    private String tipo;
    private BigDecimal monto;
    private String motivo;
    private String category;
    private String financialDirection;
    private String referenceType;
    private String referenceId;
    private String idempotencyKey;
    private BigDecimal balanceBefore;
    private BigDecimal balanceAfter;
    private LocalDateTime fecha;

}

