package com.galtekone.dto.pagos;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class TerminalPagoConfigDTO {
    private String key;
    private String nombre;
    private String provider;
    private String identifier;
    private String serial;
    private String storeId;
    private String account;
    private Boolean enabled;
    private Boolean commissionEnabled;
    private BigDecimal commissionPercent;
}
