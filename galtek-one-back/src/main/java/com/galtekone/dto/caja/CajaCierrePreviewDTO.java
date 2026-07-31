package com.galtekone.dto.caja;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class CajaCierrePreviewDTO {
    private Integer sessionId;
    private BigDecimal openingBalanceSnapshot;
    private BigDecimal cashSalesAmount;
    private BigDecimal cardSalesAmount;
    private BigDecimal manualEntriesAmount;
    private BigDecimal manualWithdrawalsAmount;
    private BigDecimal cashRefundsAmount;
    private BigDecimal totalSalesAmount;
    private BigDecimal expectedCashAmount;
    private BigDecimal countedCashAmount;
    private BigDecimal differenceAmount;
    private Boolean discrepancyReasonRequired;
    private Boolean expectedBalanceViewedBeforeCount;
    private Integer salesCount;
    private String result;
    private String policyApplied;
    private LocalDateTime openedAt;
    private CajaEstadoActualDTO.UserInfo responsibleUser;
}
