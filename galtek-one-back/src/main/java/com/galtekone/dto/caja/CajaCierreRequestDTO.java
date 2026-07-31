package com.galtekone.dto.caja;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class CajaCierreRequestDTO {
    private BigDecimal countedAmount;
    private String discrepancyReason;
    private String notes;
    private String idempotencyKey;
}
