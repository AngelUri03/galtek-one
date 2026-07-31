package com.galtekone.entity;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class MovimientoCajaTipoTest {

    @Test
    void acceptsLegacyAndOperationalTypes() {
        assertTrue(MovimientoCajaTipo.isAllowed("INGRESO"));
        assertTrue(MovimientoCajaTipo.isAllowed("egreso"));
        assertTrue(MovimientoCajaTipo.isAllowed("OPENING"));
        assertTrue(MovimientoCajaTipo.isAllowed("manual_withdrawal"));
    }

    @Test
    void classifiesCashDirection() {
        assertTrue(MovimientoCajaTipo.increasesCash("OPENING"));
        assertTrue(MovimientoCajaTipo.increasesCash("CASH_SALE"));
        assertTrue(MovimientoCajaTipo.increasesCash("INGRESO"));

        assertTrue(MovimientoCajaTipo.decreasesCash("CASH_REFUND"));
        assertTrue(MovimientoCajaTipo.decreasesCash("MANUAL_WITHDRAWAL"));
        assertTrue(MovimientoCajaTipo.decreasesCash("EGRESO"));
    }

    @Test
    void ignoresInvalidTypesForCashDirection() {
        assertFalse(MovimientoCajaTipo.isAllowed(null));
        assertFalse(MovimientoCajaTipo.isAllowed("SALE"));
        assertFalse(MovimientoCajaTipo.increasesCash("SALE"));
        assertFalse(MovimientoCajaTipo.decreasesCash("OPENING"));
    }
}
