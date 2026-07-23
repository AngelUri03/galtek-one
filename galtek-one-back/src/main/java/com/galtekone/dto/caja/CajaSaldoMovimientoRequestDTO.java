package com.galtekone.dto.caja;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class CajaSaldoMovimientoRequestDTO {
    private BigDecimal amount;
    private String category;
    private String reason;
    private String referenceType;
    private String referenceId;
    private String movementMedium;
    private String idempotencyKey;
}
