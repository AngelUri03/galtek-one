package com.galtekone.dto.caja;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class CajaCierreResultadoDTO {
    private Integer sessionId;
    private String result;
    private BigDecimal openingBalanceSnapshot;
    private BigDecimal expectedCashAmount;
    private BigDecimal countedCashAmount;
    private BigDecimal differenceAmount;
    private BigDecimal finalBalance;
    private Integer movementId;
    private Integer incidentId;
    private Boolean expectedBalanceViewedBeforeCount;
    private LocalDateTime closedAt;
    private String policyApplied;
}
