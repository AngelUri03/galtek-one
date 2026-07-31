package com.galtekone.dto.caja;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class CajaSaldoInicializarRequestDTO {
    private BigDecimal amount;
    private String category;
    private String reason;
    private String idempotencyKey;
}
