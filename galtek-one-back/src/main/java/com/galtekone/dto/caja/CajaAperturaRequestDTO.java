package com.galtekone.dto.caja;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class CajaAperturaRequestDTO {
    private String idempotencyKey;
    private BigDecimal receivedAmount;
    private String receivingDiscrepancyReason;
    private Boolean reportOpeningDifference;
}
