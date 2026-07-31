package com.galtekone.services;

import java.time.LocalDateTime;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.galtekone.entity.CajaSesionEntity;
import com.galtekone.entity.CajaSesionStatus;
import com.galtekone.entity.UsuariosEntity;

@Component
public class CajaSesionStateMachine {

    private static final Set<CajaSesionStatus> ACTIVE_STATUSES = Set.of(
            CajaSesionStatus.OPEN,
            CajaSesionStatus.PENDING_RECONCILIATION);

    public Set<CajaSesionStatus> activeStatuses() {
        return ACTIVE_STATUSES;
    }

    public void assertCanOpen(boolean hasActiveSessionForCashRegister, boolean hasActiveSessionForUser) {
        if (hasActiveSessionForCashRegister) {
            throw new IllegalStateException("La instalacion ya tiene un turno abierto o pendiente.");
        }
        if (hasActiveSessionForUser) {
            throw new IllegalStateException("El usuario ya tiene un turno de caja abierto o pendiente.");
        }
    }

    public boolean isActive(CajaSesionStatus status) {
        return ACTIVE_STATUSES.contains(status);
    }

    public void transition(CajaSesionEntity session, CajaSesionStatus nextStatus, UsuariosEntity actor,
            String reason, String notes) {
        CajaSesionStatus current = session.getStatus();
        if (!isTransitionAllowed(current, nextStatus)) {
            throw new IllegalStateException("Transicion de turno de caja invalida: " + current + " -> " + nextStatus);
        }

        session.setStatus(nextStatus);
        session.setLastActivityAt(LocalDateTime.now());

        if (nextStatus == CajaSesionStatus.CLOSED || nextStatus == CajaSesionStatus.CLOSED_BY_SUPERVISOR) {
            session.setClosedByUser(actor);
            session.setClosedAt(LocalDateTime.now());
            session.setClosingReason(reason);
            session.setClosingNotes(notes);
        }
    }

    public boolean isTransitionAllowed(CajaSesionStatus current, CajaSesionStatus next) {
        if (current == null || next == null) {
            return false;
        }
        return switch (current) {
            case OPEN -> next == CajaSesionStatus.PENDING_RECONCILIATION || next == CajaSesionStatus.CLOSED;
            case PENDING_RECONCILIATION -> next == CajaSesionStatus.CLOSED
                    || next == CajaSesionStatus.CLOSED_BY_SUPERVISOR;
            case CLOSED, CLOSED_BY_SUPERVISOR -> false;
        };
    }
}
