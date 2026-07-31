package com.galtekone.dto.caja;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class CajaSaldoResumenDTO {
    private Boolean initialized;
    private BigDecimal currentBalance;
    private Boolean currentBalanceVisible;
    private LocalDateTime initializedAt;
    private CajaEstadoActualDTO.UserInfo initializedBy;
    private String initializationCategory;
    private LocalDateTime lastMovementAt;
    private CajaEstadoActualDTO.StationInfo station;
}
