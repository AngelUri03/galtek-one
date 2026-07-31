package com.galtekone.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;

class CajaSesionEntityLifecycleTest {

    @Test
    void activeSessionBuildsScopedUniqueKeys() {
        CajaSesionEntity session = activeSession(CajaSesionStatus.OPEN);

        prepareActiveKeys(session);

        assertEquals("7:INSTALLATION:install-test-01", session.getActiveInstallationKey());
        assertNull(session.getActiveCashRegisterKey());
        assertEquals("7:USER:11", session.getActiveUserKey());
    }

    @Test
    void closedSessionClearsActiveKeys() {
        CajaSesionEntity session = activeSession(CajaSesionStatus.OPEN);
        prepareActiveKeys(session);

        session.setStatus(CajaSesionStatus.CLOSED);
        prepareActiveKeys(session);

        assertNull(session.getActiveInstallationKey());
        assertNull(session.getActiveCashRegisterKey());
        assertNull(session.getActiveUserKey());
    }

    @Test
    void rejectsNegativeOpeningAmount() {
        CajaSesionEntity session = activeSession(CajaSesionStatus.OPEN);
        session.setOpeningAmount(new BigDecimal("-0.01"));

        assertThrows(IllegalArgumentException.class, () -> prepareActiveKeys(session));
    }

    private CajaSesionEntity activeSession(CajaSesionStatus status) {
        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(7);

        LocalDeviceEntity localDevice = new LocalDeviceEntity();
        localDevice.setInstallationId("install-test-01");

        UsuariosEntity user = new UsuariosEntity();
        user.setIdUsuario(11);

        CajaSesionEntity session = new CajaSesionEntity();
        session.setEmpresa(empresa);
        session.setLocalDevice(localDevice);
        session.setOpenedByUser(user);
        session.setStatus(status);
        session.setOpeningAmount(BigDecimal.ZERO);
        session.setExpectedCashAmount(BigDecimal.ZERO);
        session.setOpenedAt(LocalDateTime.now());
        session.setLastActivityAt(LocalDateTime.now());
        session.setOpeningIdempotencyKey("test-key");
        return session;
    }

    private void prepareActiveKeys(CajaSesionEntity session) {
        try {
            Method method = CajaSesionEntity.class.getDeclaredMethod("prepareActiveKeys");
            method.setAccessible(true);
            method.invoke(session);
        } catch (InvocationTargetException ex) {
            Throwable cause = ex.getCause();
            if (cause instanceof RuntimeException runtimeException) {
                throw runtimeException;
            }
            throw new AssertionError(cause);
        } catch (ReflectiveOperationException ex) {
            throw new AssertionError(ex);
        }
    }
}
