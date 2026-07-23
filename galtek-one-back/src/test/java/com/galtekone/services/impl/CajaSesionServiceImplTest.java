package com.galtekone.services.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.Set;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.dto.caja.CajaAperturaRequestDTO;
import com.galtekone.dto.caja.CajaEstadoActualDTO;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.CajaIncidenciaTipo;
import com.galtekone.entity.CajaSesionEntity;
import com.galtekone.entity.CajaSesionStatus;
import com.galtekone.entity.CajaPoliticaOperacion;
import com.galtekone.entity.ConfiguracionCajaEntity;
import com.galtekone.entity.LocalDeviceEntity;
import com.galtekone.entity.MovimientoCajaTipo;
import com.galtekone.entity.SaldoEfectivoEntity;
import com.galtekone.entity.UsuariosEntity;
import com.galtekone.repository.CajaSesionRepository;
import com.galtekone.repository.LocalDeviceRepository;
import com.galtekone.repository.MovimientoCajaRepository;
import com.galtekone.repository.SaldoEfectivoRepository;
import com.galtekone.repository.UsuariosRepository;
import com.galtekone.repository.VentasRepository;
import com.galtekone.services.CajaIncidenciaService;
import com.galtekone.services.CajaPermisosResolver;
import com.galtekone.services.CajaSaldoService;
import com.galtekone.services.CajaSesionStateMachine;
import com.galtekone.services.ConfiguracionCajaService;

@ExtendWith(MockitoExtension.class)
class CajaSesionServiceImplTest {

    @Mock
    private CajaSesionRepository cajaSesionRepository;
    @Mock
    private LocalDeviceRepository localDeviceRepository;
    @Mock
    private MovimientoCajaRepository movimientoCajaRepository;
    @Mock
    private VentasRepository ventasRepository;
    @Mock
    private UsuariosRepository usuariosRepository;
    @Mock
    private SaldoEfectivoRepository saldoEfectivoRepository;
    @Mock
    private CajaSesionStateMachine stateMachine;
    @Mock
    private CajaPermisosResolver permisosResolver;
    @Mock
    private CajaSaldoService cajaSaldoService;
    @Mock
    private ConfiguracionCajaService configuracionCajaService;
    @Mock
    private CajaIncidenciaService cajaIncidenciaService;

    @InjectMocks
    private CajaSesionServiceImpl service;

    @BeforeEach
    void setEmpresa() {
        EmpresaContextHolder.setEmpresaId(7);
    }

    @AfterEach
    void clearEmpresa() {
        EmpresaContextHolder.clear();
    }

    @Test
    void activeDeviceWithoutCashRegisterReturnsNoSession() {
        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(7);

        UsuariosEntity usuario = new UsuariosEntity();
        usuario.setIdUsuario(11);
        usuario.setUsuario("angel");
        usuario.setNombreUsuario("Angel Morales");
        usuario.setEmpresa(empresa);

        LocalDeviceEntity device = new LocalDeviceEntity();
        device.setInstallationId("installation-001");
        device.setLicenseToken("valid-token");
        device.setEmpresa(empresa);

        SaldoEfectivoEntity saldo = new SaldoEfectivoEntity();
        saldo.setLocalDevice(device);
        saldo.setEmpresa(empresa);
        saldo.setInitialized(true);
        saldo.setCurrentBalanceSnapshot(java.math.BigDecimal.valueOf(2350).setScale(2));

        ConfiguracionCajaEntity policy = new ConfiguracionCajaEntity();
        policy.setEmpresa(empresa);
        policy.setHandoffPolicy(CajaPoliticaOperacion.CONTINUITY_FIRST);

        when(usuariosRepository.findByUsuarioAndEmpresa_IdEmpresa("angel", 7)).thenReturn(Optional.of(usuario));
        when(localDeviceRepository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.of(device));
        when(configuracionCajaService.getOrCreate(7, "angel")).thenReturn(policy);
        when(saldoEfectivoRepository.findByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndEstatusTrue(
                "installation-001", 7)).thenReturn(Optional.of(saldo));
        when(stateMachine.activeStatuses()).thenReturn(Set.of(
                CajaSesionStatus.OPEN,
                CajaSesionStatus.PENDING_RECONCILIATION));
        when(cajaSesionRepository
                .findFirstByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndStatusInAndEstatusTrueOrderByOpenedAtDesc(
                        eq("installation-001"), eq(7), anyCollection()))
                .thenReturn(Optional.empty());

        CajaEstadoActualDTO dto = service.getEstadoActual("angel");

        assertEquals("NO_SESSION", dto.getStatus());
        assertEquals("CASH_SESSION_NOT_OPEN", dto.getCode());
        assertNotNull(dto.getStation());
        assertEquals("Punto de venta", dto.getStation().getDisplayName());
        assertNull(dto.getCurrentBalance());
        assertFalse(dto.getCapabilities().getCanOpenCashControl());
    }

    @Test
    void openSessionOwnedByAnotherUserReturnsExplicitState() {
        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(7);

        UsuariosEntity usuario = new UsuariosEntity();
        usuario.setIdUsuario(11);
        usuario.setUsuario("angel");
        usuario.setNombreUsuario("Angel Morales");
        usuario.setEmpresa(empresa);

        UsuariosEntity owner = new UsuariosEntity();
        owner.setIdUsuario(12);
        owner.setUsuario("cajero");
        owner.setNombreUsuario("Cajero Turno");
        owner.setEmpresa(empresa);

        LocalDeviceEntity device = new LocalDeviceEntity();
        device.setInstallationId("installation-001");
        device.setLicenseToken("valid-token");
        device.setEmpresa(empresa);

        SaldoEfectivoEntity saldo = new SaldoEfectivoEntity();
        saldo.setLocalDevice(device);
        saldo.setEmpresa(empresa);
        saldo.setInitialized(true);
        saldo.setCurrentBalanceSnapshot(BigDecimal.valueOf(900).setScale(2));

        ConfiguracionCajaEntity policy = new ConfiguracionCajaEntity();
        policy.setEmpresa(empresa);
        policy.setHandoffPolicy(CajaPoliticaOperacion.CONTINUITY_FIRST);

        CajaSesionEntity session = new CajaSesionEntity();
        session.setIdCajaSesion(44);
        session.setEmpresa(empresa);
        session.setLocalDevice(device);
        session.setOpenedByUser(owner);
        session.setStatus(CajaSesionStatus.OPEN);
        session.setOpenedAt(LocalDateTime.now().minusHours(1));
        session.setOpeningBalanceSnapshot(BigDecimal.valueOf(900).setScale(2));
        session.setExpectedCashAmount(BigDecimal.valueOf(900).setScale(2));

        when(usuariosRepository.findByUsuarioAndEmpresa_IdEmpresa("angel", 7)).thenReturn(Optional.of(usuario));
        when(localDeviceRepository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.of(device));
        when(configuracionCajaService.getOrCreate(7, "angel")).thenReturn(policy);
        when(saldoEfectivoRepository.findByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndEstatusTrue(
                "installation-001", 7)).thenReturn(Optional.of(saldo));
        when(stateMachine.activeStatuses()).thenReturn(Set.of(
                CajaSesionStatus.OPEN,
                CajaSesionStatus.PENDING_RECONCILIATION));
        when(cajaSesionRepository
                .findFirstByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndStatusInAndEstatusTrueOrderByOpenedAtDesc(
                        eq("installation-001"), eq(7), anyCollection()))
                .thenReturn(Optional.of(session));

        CajaEstadoActualDTO dto = service.getEstadoActual("angel");

        assertEquals("OPEN_BY_OTHER_USER", dto.getStatus());
        assertEquals("CASH_SESSION_OWNED_BY_OTHER", dto.getCode());
        assertEquals(false, dto.getCanCurrentUserResume());
        assertEquals("Cajero Turno", dto.getCurrentSession().getOpenedBy().getName());
        assertNull(dto.getCurrentBalance());
        assertNull(dto.getCurrentSession().getExpectedCashAmount());
        assertFalse(dto.getCurrentSession().getExpectedCashVisible());
    }

    @Test
    void openingWithReportedDifferenceCreatesIncident() {
        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(7);

        UsuariosEntity usuario = new UsuariosEntity();
        usuario.setIdUsuario(11);
        usuario.setUsuario("angel");
        usuario.setNombreUsuario("Angel Morales");
        usuario.setEmpresa(empresa);

        LocalDeviceEntity device = new LocalDeviceEntity();
        device.setInstallationId("installation-001");
        device.setLicenseToken("valid-token");
        device.setEmpresa(empresa);

        SaldoEfectivoEntity saldo = new SaldoEfectivoEntity();
        saldo.setLocalDevice(device);
        saldo.setEmpresa(empresa);
        saldo.setInitialized(true);
        saldo.setCurrentBalanceSnapshot(new BigDecimal("1400.00"));

        ConfiguracionCajaEntity policy = new ConfiguracionCajaEntity();
        policy.setEmpresa(empresa);
        policy.setHandoffPolicy(CajaPoliticaOperacion.CONTINUITY_FIRST);

        CajaAperturaRequestDTO request = new CajaAperturaRequestDTO();
        request.setIdempotencyKey("cash-opening-report-test");
        request.setReceivedAmount(new BigDecimal("1375.50"));
        request.setReceivingDiscrepancyReason("Conteo fisico de apertura");
        request.setReportOpeningDifference(true);

        when(usuariosRepository.findByUsuarioAndEmpresa_IdEmpresa("angel", 7)).thenReturn(Optional.of(usuario));
        when(permisosResolver.hasAny(eq(usuario), any(String[].class))).thenReturn(true);
        when(localDeviceRepository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.of(device));
        when(localDeviceRepository.findByInstallationIdForUpdate("installation-001")).thenReturn(Optional.of(device));
        when(cajaSaldoService.requireInitializedBalance(device, 7)).thenReturn(saldo);
        when(configuracionCajaService.getOrCreate(7, "angel")).thenReturn(policy);
        when(cajaSesionRepository.findByOpeningIdempotencyKeyAndEmpresa_IdEmpresaAndEstatusTrue(
                "cash-opening-report-test", 7)).thenReturn(Optional.empty());
        when(stateMachine.activeStatuses()).thenReturn(Set.of(
                CajaSesionStatus.OPEN,
                CajaSesionStatus.PENDING_RECONCILIATION));
        when(cajaSesionRepository
                .findFirstByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndStatusInAndEstatusTrueOrderByOpenedAtDesc(
                        eq("installation-001"), eq(7), anyCollection()))
                .thenReturn(Optional.empty());
        when(cajaSesionRepository
                .findFirstByOpenedByUser_IdUsuarioAndEmpresa_IdEmpresaAndStatusInAndEstatusTrueOrderByOpenedAtDesc(
                        eq(11), eq(7), anyCollection()))
                .thenReturn(Optional.empty());
        when(cajaSesionRepository
                .findFirstByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndEstatusTrueOrderByOpenedAtDesc(
                        "installation-001", 7))
                .thenReturn(Optional.empty());
        when(cajaSesionRepository.saveAndFlush(any(CajaSesionEntity.class))).thenAnswer(invocation -> {
            CajaSesionEntity session = invocation.getArgument(0);
            session.setIdCajaSesion(77);
            return session;
        });
        when(saldoEfectivoRepository.findByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndEstatusTrue(
                "installation-001", 7)).thenReturn(Optional.of(saldo));
        when(cajaIncidenciaService.countPendingForDevice("installation-001", 7)).thenReturn(1L);

        CajaEstadoActualDTO dto = service.abrir(request, "angel");

        assertEquals("OPEN", dto.getStatus());
        verify(cajaSaldoService).registrarMovimientoContinuo(
                eq(device),
                any(CajaSesionEntity.class),
                eq(usuario),
                eq(MovimientoCajaTipo.HANDOFF_RECONCILIATION),
                eq("OUT"),
                eq(new BigDecimal("24.50")),
                eq("OPENING_SHORTAGE"),
                eq("Conteo fisico de apertura"),
                eq("CASH_OPENING_DIFFERENCE"),
                eq("77"),
                eq("cash-open-difference-cash-opening-report-test"),
                eq("angel"));
        verify(cajaIncidenciaService).crearIncidencia(
                eq(CajaIncidenciaTipo.OTHER_CASH_DISCREPANCY),
                eq(device),
                any(CajaSesionEntity.class),
                isNull(),
                eq(new BigDecimal("1400.00")),
                isNull(),
                eq(new BigDecimal("1375.50")),
                eq(new BigDecimal("1375.50")),
                eq(new BigDecimal("-24.50")),
                isNull(),
                eq("Conteo fisico de apertura"),
                eq(CajaPoliticaOperacion.CONTINUITY_FIRST.name()),
                eq("angel"));
    }

    @Test
    void openingWithReportedZeroDifferenceDoesNotCreateIncidentOrMovement() {
        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(7);

        UsuariosEntity usuario = new UsuariosEntity();
        usuario.setIdUsuario(11);
        usuario.setUsuario("angel");
        usuario.setNombreUsuario("Angel Morales");
        usuario.setEmpresa(empresa);

        LocalDeviceEntity device = new LocalDeviceEntity();
        device.setInstallationId("installation-001");
        device.setLicenseToken("valid-token");
        device.setEmpresa(empresa);

        SaldoEfectivoEntity saldo = new SaldoEfectivoEntity();
        saldo.setLocalDevice(device);
        saldo.setEmpresa(empresa);
        saldo.setInitialized(true);
        saldo.setCurrentBalanceSnapshot(new BigDecimal("1400.00"));

        ConfiguracionCajaEntity policy = new ConfiguracionCajaEntity();
        policy.setEmpresa(empresa);
        policy.setHandoffPolicy(CajaPoliticaOperacion.CONTINUITY_FIRST);

        CajaAperturaRequestDTO request = new CajaAperturaRequestDTO();
        request.setIdempotencyKey("cash-opening-exact-test");
        request.setReceivedAmount(new BigDecimal("1400.00"));
        request.setReportOpeningDifference(true);

        when(usuariosRepository.findByUsuarioAndEmpresa_IdEmpresa("angel", 7)).thenReturn(Optional.of(usuario));
        when(permisosResolver.hasAny(eq(usuario), any(String[].class))).thenReturn(true);
        when(localDeviceRepository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.of(device));
        when(localDeviceRepository.findByInstallationIdForUpdate("installation-001")).thenReturn(Optional.of(device));
        when(cajaSaldoService.requireInitializedBalance(device, 7)).thenReturn(saldo);
        when(configuracionCajaService.getOrCreate(7, "angel")).thenReturn(policy);
        when(cajaSesionRepository.findByOpeningIdempotencyKeyAndEmpresa_IdEmpresaAndEstatusTrue(
                "cash-opening-exact-test", 7)).thenReturn(Optional.empty());
        when(stateMachine.activeStatuses()).thenReturn(Set.of(
                CajaSesionStatus.OPEN,
                CajaSesionStatus.PENDING_RECONCILIATION));
        when(cajaSesionRepository
                .findFirstByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndStatusInAndEstatusTrueOrderByOpenedAtDesc(
                        eq("installation-001"), eq(7), anyCollection()))
                .thenReturn(Optional.empty());
        when(cajaSesionRepository
                .findFirstByOpenedByUser_IdUsuarioAndEmpresa_IdEmpresaAndStatusInAndEstatusTrueOrderByOpenedAtDesc(
                        eq(11), eq(7), anyCollection()))
                .thenReturn(Optional.empty());
        when(cajaSesionRepository
                .findFirstByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndEstatusTrueOrderByOpenedAtDesc(
                        "installation-001", 7))
                .thenReturn(Optional.empty());
        when(cajaSesionRepository.saveAndFlush(any(CajaSesionEntity.class))).thenAnswer(invocation -> {
            CajaSesionEntity session = invocation.getArgument(0);
            session.setIdCajaSesion(78);
            return session;
        });
        when(saldoEfectivoRepository.findByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndEstatusTrue(
                "installation-001", 7)).thenReturn(Optional.of(saldo));

        CajaEstadoActualDTO dto = service.abrir(request, "angel");

        assertEquals("OPEN", dto.getStatus());
        verify(cajaSaldoService, never()).registrarMovimientoContinuo(
                any(),
                any(),
                any(),
                any(),
                any(),
                any(),
                any(),
                any(),
                any(),
                any(),
                any(),
                any());
        verify(cajaIncidenciaService, never()).crearIncidencia(
                any(),
                any(),
                any(),
                any(),
                any(),
                any(),
                any(),
                any(),
                any(),
                any(),
                any(),
                any(),
                any());
    }
}
