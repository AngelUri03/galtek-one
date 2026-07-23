package com.galtekone.dto.caja;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class CajaSesionHistorialDTO {
    private Integer sessionId;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private LocalDateTime latestAt;
    private CajaEstadoActualDTO.UserInfo responsibleUser;
    private String status;
    private Long movementCount;
    private BigDecimal cashInAmount;
    private BigDecimal cashOutAmount;
    private BigDecimal electronicInAmount;
    private BigDecimal electronicOutAmount;
}
