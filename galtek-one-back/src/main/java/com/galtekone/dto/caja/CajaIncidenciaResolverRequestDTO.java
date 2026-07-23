package com.galtekone.dto.caja;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class CajaIncidenciaResolverRequestDTO {
    private String resolutionCategory;
    private String resolutionNotes;
    private String resolutionCashEffect;
    private BigDecimal resolutionAmount;
    private String resolutionReference;
    private String idempotencyKey;
}
