package com.galtekone.dto.caja;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class CajaIncidenciaDTO {
    private Integer id;
    private String type;
    private String status;
    private Integer sessionId;
    private LocalDateTime sessionOpenedAt;
    private LocalDateTime sessionClosedAt;
    private CajaEstadoActualDTO.UserInfo sessionResponsibleUser;
    private BigDecimal expectedAmount;
    private BigDecimal outgoingDeclaredAmount;
    private BigDecimal incomingDeclaredAmount;
    private BigDecimal acceptedAmount;
    private BigDecimal differenceAmount;
    private String policySnapshot;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private CajaEstadoActualDTO.UserInfo resolvedBy;
    private String resolutionCategory;
    private String resolutionNotes;
    private String resolutionCashEffect;
    private BigDecimal resolutionAmount;
    private String resolutionReference;
    private Integer resolutionMovementId;
}
