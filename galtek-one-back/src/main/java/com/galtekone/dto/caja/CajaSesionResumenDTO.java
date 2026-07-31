package com.galtekone.dto.caja;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class CajaSesionResumenDTO {
    private Integer sessionId;
    private BigDecimal openingBalanceSnapshot;
    private BigDecimal openingAmount;
    private BigDecimal cashSalesAmount;
    private BigDecimal cardSalesAmount;
    private BigDecimal transferSalesAmount;
    private BigDecimal totalSalesAmount;
    private BigDecimal expectedCardAmount;
    private BigDecimal cashEntriesAmount;
    private BigDecimal cashOutflowsAmount;
    private BigDecimal cardEntriesAmount;
    private BigDecimal cardWithdrawalsAmount;
    private BigDecimal manualEntriesAmount;
    private BigDecimal manualWithdrawalsAmount;
    private BigDecimal cashRefundsAmount;
    private BigDecimal expectedCashAmount;
    private Boolean expectedCashVisible;
    private Boolean salesSummaryVisible;
    private Boolean expectedBalanceViewedBeforeCount;
    private Integer salesCount;
    private LocalDateTime openedAt;
    private CajaEstadoActualDTO.UserInfo responsibleUser;
    private CajaEstadoActualDTO.CashCapabilities capabilities;
}
