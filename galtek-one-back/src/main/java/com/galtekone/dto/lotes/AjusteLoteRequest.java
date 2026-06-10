package com.galtekone.dto.lotes;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class AjusteLoteRequest {
    private Integer idLote;
    private BigDecimal delta;
    private String motivo;
}
