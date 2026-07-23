package com.galtekone.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import com.galtekone.entity.CajaSesionEntity;
import com.galtekone.entity.CajaSesionStatus;
import com.galtekone.entity.UsuariosEntity;

class CajaSesionStateMachineTest {

    private final CajaSesionStateMachine stateMachine = new CajaSesionStateMachine();

    @Test
    void allowsOnlyExpectedTransitions() {
        assertTrue(stateMachine.isTransitionAllowed(CajaSesionStatus.OPEN, CajaSesionStatus.PENDING_RECONCILIATION));
        assertTrue(stateMachine.isTransitionAllowed(CajaSesionStatus.OPEN, CajaSesionStatus.CLOSED));
        assertTrue(stateMachine.isTransitionAllowed(CajaSesionStatus.PENDING_RECONCILIATION, CajaSesionStatus.CLOSED));
        assertTrue(stateMachine.isTransitionAllowed(CajaSesionStatus.PENDING_RECONCILIATION,
                CajaSesionStatus.CLOSED_BY_SUPERVISOR));

        assertFalse(stateMachine.isTransitionAllowed(CajaSesionStatus.OPEN, CajaSesionStatus.CLOSED_BY_SUPERVISOR));
        assertFalse(stateMachine.isTransitionAllowed(CajaSesionStatus.CLOSED, CajaSesionStatus.OPEN));
        assertFalse(stateMachine.isTransitionAllowed(CajaSesionStatus.CLOSED_BY_SUPERVISOR, CajaSesionStatus.OPEN));
        assertFalse(stateMachine.isTransitionAllowed(null, CajaSesionStatus.OPEN));
    }

    @Test
    void transitionToClosedMarksActorAndTimestamps() {
        CajaSesionEntity session = new CajaSesionEntity();
        session.setStatus(CajaSesionStatus.OPEN);
        UsuariosEntity actor = new UsuariosEntity();
        actor.setIdUsuario(14);

        stateMachine.transition(session, CajaSesionStatus.CLOSED, actor, "END_OF_SHIFT", "Sin diferencia");

        assertEquals(CajaSesionStatus.CLOSED, session.getStatus());
        assertSame(actor, session.getClosedByUser());
        assertNotNull(session.getClosedAt());
        assertNotNull(session.getLastActivityAt());
        assertEquals("END_OF_SHIFT", session.getClosingReason());
        assertEquals("Sin diferencia", session.getClosingNotes());
    }

    @Test
    void rejectsInvalidTransitionsAndDuplicateActiveSessions() {
        CajaSesionEntity closedSession = new CajaSesionEntity();
        closedSession.setStatus(CajaSesionStatus.CLOSED);

        assertThrows(IllegalStateException.class,
                () -> stateMachine.transition(closedSession, CajaSesionStatus.OPEN, new UsuariosEntity(), null, null));
        assertThrows(IllegalStateException.class, () -> stateMachine.assertCanOpen(true, false));
        assertThrows(IllegalStateException.class, () -> stateMachine.assertCanOpen(false, true));
    }
}
