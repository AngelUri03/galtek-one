package com.galtekone.dto.caja;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class CajaEstadoActualDTO {
    private StationInfo station;
    private CashSessionInfo currentSession;
    private String status;
    private Boolean canCurrentUserClose;
    private Boolean canCurrentUserResume;
    private CashCapabilities capabilities;
    private Boolean requiresReconciliation;
    private Boolean balanceInitialized;
    private Boolean requiresReceivingCount;
    private Long pendingIncidentCount;
    private BigDecimal currentBalance;
    private String policy;
    private IncomingCountInfo incomingCount;
    private String code;
    private String message;
    private LocalDateTime lastSyncAt;

    @Data
    public static class StationInfo {
        private String installationReference;
        private String displayName;
        private String status;
    }

    @Data
    public static class CashSessionInfo {
        private Integer id;
        private String status;
        private UserInfo openedBy;
        private LocalDateTime openedAt;
        private BigDecimal openingBalanceSnapshot;
        private BigDecimal openingAmount;
        private BigDecimal expectedCashAmount;
        private Boolean expectedCashVisible;
        private Boolean expectedBalanceViewedBeforeCount;
        private LocalDateTime lastActivityAt;
    }

    @Data
    public static class IncomingCountInfo {
        private Boolean required;
        private BigDecimal expectedAmount;
        private UserInfo previousCashier;
        private LocalDateTime previousClosedAt;
        private String policy;
    }

    @Data
    public static class UserInfo {
        private Integer id;
        private String username;
        private String name;
        private String role;
        private String avatarUrl;
    }

    @Data
    public static class CashCapabilities {
        private Boolean canViewBasicSummary;
        private Boolean canViewSalesSummary;
        private Boolean canViewExpectedBalance;
        private Boolean canRevealExpectedBalance;
        private Boolean canOpenCashControl;
        private Boolean canCloseCurrentSession;
        private Boolean canCloseOwnSession;
        private Boolean canCloseOtherSession;
        private Boolean canViewMovements;
        private Boolean canViewHistory;
        private Boolean canReviewIncidents;
    }
}
