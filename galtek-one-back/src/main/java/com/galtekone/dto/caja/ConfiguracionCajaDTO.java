package com.galtekone.dto.caja;

import lombok.Data;

@Data
public class ConfiguracionCajaDTO {
    private String handoffPolicy;
    private Boolean requireIncomingCountOnUserChange;
    private Boolean requireOutgoingCount;
    private Boolean allowContinueWithPendingIncident;
    private Boolean blindCountEnabled;
    private String expectedBalanceVisibilityMode;
}
