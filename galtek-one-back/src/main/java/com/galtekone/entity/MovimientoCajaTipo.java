package com.galtekone.entity;

import java.util.Set;

public enum MovimientoCajaTipo {
    INITIAL_BALANCE,
    OPENING,
    CASH_SALE,
    CASH_REFUND,
    CARD_ENTRY,
    CARD_WITHDRAWAL,
    MANUAL_ENTRY,
    MANUAL_WITHDRAWAL,
    CLOSING_ADJUSTMENT,
    CLOSING_RECONCILIATION,
    HANDOFF_RECONCILIATION,
    INCIDENT_ADJUSTMENT;

    private static final Set<String> ADDITIVE_TYPES = Set.of(
            INITIAL_BALANCE.name(),
            OPENING.name(),
            CASH_SALE.name(),
            MANUAL_ENTRY.name(),
            "INGRESO");

    private static final Set<String> SUBTRACTIVE_TYPES = Set.of(
            CASH_REFUND.name(),
            MANUAL_WITHDRAWAL.name(),
            "EGRESO");

    private static final Set<String> DIRECTION_REQUIRED_TYPES = Set.of(
            CLOSING_ADJUSTMENT.name(),
            CLOSING_RECONCILIATION.name(),
            HANDOFF_RECONCILIATION.name(),
            INCIDENT_ADJUSTMENT.name());

    private static final Set<String> ELECTRONIC_TYPES = Set.of(
            CARD_ENTRY.name(),
            CARD_WITHDRAWAL.name());

    public static boolean isAllowed(String value) {
        if (value == null) {
            return false;
        }
        String normalized = value.trim().toUpperCase();
        if ("INGRESO".equals(normalized) || "EGRESO".equals(normalized)) {
            return true;
        }
        try {
            MovimientoCajaTipo.valueOf(normalized);
            return true;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    public static boolean increasesCash(String value) {
        return ADDITIVE_TYPES.contains(normalize(value));
    }

    public static boolean decreasesCash(String value) {
        return SUBTRACTIVE_TYPES.contains(normalize(value));
    }

    public static boolean requiresExplicitDirection(String value) {
        return DIRECTION_REQUIRED_TYPES.contains(normalize(value));
    }

    public static boolean allowsZeroAmount(String value) {
        String normalized = normalize(value);
        return INITIAL_BALANCE.name().equals(normalized) || OPENING.name().equals(normalized);
    }

    public static boolean affectsCash(String value) {
        return !ELECTRONIC_TYPES.contains(normalize(value));
    }

    public static boolean isElectronic(String value) {
        return ELECTRONIC_TYPES.contains(normalize(value));
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase();
    }
}
