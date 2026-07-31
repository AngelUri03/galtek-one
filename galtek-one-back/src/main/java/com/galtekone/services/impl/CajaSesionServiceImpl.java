package com.galtekone.services.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.dto.caja.CajaAperturaRequestDTO;
import com.galtekone.dto.caja.CajaCierrePreviewDTO;
import com.galtekone.dto.caja.CajaCierreRequestDTO;
import com.galtekone.dto.caja.CajaCierreResultadoDTO;
import com.galtekone.dto.caja.CajaEstadoActualDTO;
import com.galtekone.dto.caja.CajaSesionHistorialDTO;
import com.galtekone.dto.caja.CajaSesionResumenDTO;
import com.galtekone.entity.CajaIncidenciaEntity;
import com.galtekone.entity.CajaIncidenciaTipo;
import com.galtekone.entity.CajaPoliticaOperacion;
import com.galtekone.entity.CajaSesionEntity;
import com.galtekone.entity.CajaSesionStatus;
import com.galtekone.entity.ConfiguracionCajaEntity;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.LocalDeviceEntity;
import com.galtekone.entity.MovimientoCajaEntity;
import com.galtekone.entity.MovimientoCajaTipo;
import com.galtekone.entity.SaldoEfectivoEntity;
import com.galtekone.entity.UsuariosEntity;
import com.galtekone.entity.VentasEntity;
import com.galtekone.repository.CajaSesionRepository;
import com.galtekone.repository.LocalDeviceRepository;
import com.galtekone.repository.MovimientoCajaRepository;
import com.galtekone.repository.SaldoEfectivoRepository;
import com.galtekone.repository.UsuariosRepository;
import com.galtekone.repository.VentasRepository;
import com.galtekone.services.CajaIncidenciaService;
import com.galtekone.services.CajaPermisosResolver;
import com.galtekone.services.CajaSaldoService;
import com.galtekone.services.CajaSesionService;
import com.galtekone.services.CajaSesionStateMachine;
import com.galtekone.services.ConfiguracionCajaService;
import com.galtekone.utils.CajaOperacionException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CajaSesionServiceImpl implements CajaSesionService {

    private static final String STATUS_NO_SESSION = "NO_SESSION";
    private static final String STATUS_ERROR = "ERROR";
    private static final String STATUS_BALANCE_NOT_INITIALIZED = "BALANCE_NOT_INITIALIZED";
    private static final String STATUS_OPEN_BY_OTHER_USER = "OPEN_BY_OTHER_USER";
    private static final String STATUS_RECEIVING_COUNT_REQUIRED = "RECEIVING_COUNT_REQUIRED";
    private static final String DEFAULT_STATION_NAME = "Punto de venta";
    private static final Set<String> ELECTRONIC_MOVEMENT_TYPES = Set.of(
            MovimientoCajaTipo.CARD_ENTRY.name(),
            MovimientoCajaTipo.CARD_WITHDRAWAL.name());

    private final CajaSesionRepository cajaSesionRepository;
    private final LocalDeviceRepository localDeviceRepository;
    private final MovimientoCajaRepository movimientoCajaRepository;
    private final VentasRepository ventasRepository;
    private final UsuariosRepository usuariosRepository;
    private final SaldoEfectivoRepository saldoEfectivoRepository;
    private final CajaSesionStateMachine stateMachine;
    private final CajaPermisosResolver permisosResolver;
    private final CajaSaldoService cajaSaldoService;
    private final ConfiguracionCajaService configuracionCajaService;
    private final CajaIncidenciaService cajaIncidenciaService;

    @Override
    @Transactional(readOnly = true)
    public CajaEstadoActualDTO getEstadoActual(String user) {
        Integer empresaId = requireEmpresaId();
        UsuariosEntity usuario = findUsuario(user, empresaId);
        ResolvedInstallation resolved = resolveInstallation(empresaId, false);

        if (resolved.errorCode() != null) {
            return buildErrorState(resolved.errorCode(), resolved.message());
        }

        return buildState(resolved.device(), usuario, null, null);
    }

    @Override
    @Transactional
    public CajaEstadoActualDTO abrir(CajaAperturaRequestDTO request, String user) {
        Integer empresaId = requireEmpresaId();
        UsuariosEntity usuario = findUsuario(user, empresaId);
        String idempotencyKey = normalizeIdempotencyKey(request != null ? request.getIdempotencyKey() : null);

        if (!permisosResolver.hasAny(usuario, "CASH_OPEN", "CAJA_ABRIR")) {
            throw new CajaOperacionException("CASH_OPEN_FORBIDDEN",
                    "El usuario no tiene permiso para abrir turno de caja.", HttpStatus.FORBIDDEN);
        }

        ResolvedInstallation resolved = resolveInstallation(empresaId, true);
        LocalDeviceEntity device = lockAndPrepareDevice(resolved.device(), empresaId);
        SaldoEfectivoEntity saldo = cajaSaldoService.requireInitializedBalance(device, empresaId);
        BigDecimal openingBalanceSnapshot = scale(saldo.getCurrentBalanceSnapshot());

        var processed = cajaSesionRepository
                .findByOpeningIdempotencyKeyAndEmpresa_IdEmpresaAndEstatusTrue(idempotencyKey, empresaId);
        if (processed.isPresent()) {
            CajaSesionEntity existing = processed.get();
            boolean sameUser = existing.getOpenedByUser().getIdUsuario().equals(usuario.getIdUsuario());
            boolean sameInstallation = existing.getLocalDevice() != null
                    && device.getInstallationId().equals(existing.getLocalDevice().getInstallationId());
            if (!sameUser || !sameInstallation) {
                throw new CajaOperacionException("CASH_IDEMPOTENCY_CONFLICT",
                        "La llave de idempotencia ya fue usada en otro turno.", HttpStatus.CONFLICT);
            }
            return buildState(device, usuario, existing, "CASH_OPEN_IDEMPOTENT");
        }

        var activeByInstallation = cajaSesionRepository
                .findFirstByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndStatusInAndEstatusTrueOrderByOpenedAtDesc(
                        device.getInstallationId(), empresaId, stateMachine.activeStatuses());
        var activeByUser = cajaSesionRepository
                .findFirstByOpenedByUser_IdUsuarioAndEmpresa_IdEmpresaAndStatusInAndEstatusTrueOrderByOpenedAtDesc(
                        usuario.getIdUsuario(), empresaId, stateMachine.activeStatuses());

        if (activeByInstallation.isPresent()) {
            CajaSesionEntity active = activeByInstallation.get();
            String code = active.getOpenedByUser().getIdUsuario().equals(usuario.getIdUsuario())
                    ? "CASH_SESSION_ALREADY_OPEN"
                    : "CASH_SESSION_OWNED_BY_OTHER";
            throw new CajaOperacionException(code,
                    "La instalacion ya tiene un turno abierto o pendiente.", HttpStatus.CONFLICT);
        }

        if (activeByUser.isPresent()) {
            throw new CajaOperacionException("CASH_USER_ALREADY_HAS_SESSION",
                    "El usuario ya tiene un turno de caja abierto o pendiente.", HttpStatus.CONFLICT);
        }

        ConfiguracionCajaEntity policy = configuracionCajaService.getOrCreate(empresaId, user);
        CajaSesionEntity lastSession = findLastSessionForDevice(device, empresaId);
        boolean requiresIncomingCount = requiresIncomingCount(policy, lastSession, usuario);
        BigDecimal receivedAmount = null;
        BigDecimal incomingDifference = BigDecimal.ZERO;
        boolean hasIncomingDifference = false;
        String incomingReason = request != null ? trimToNull(request.getReceivingDiscrepancyReason()) : null;

        boolean reportsOpeningDifference = request != null && Boolean.TRUE.equals(request.getReportOpeningDifference());
        boolean hasDeclaredOpeningCount = request != null && request.getReceivedAmount() != null;
        if (requiresIncomingCount || reportsOpeningDifference || hasDeclaredOpeningCount) {
            receivedAmount = request != null ? request.getReceivedAmount() : null;
            if (receivedAmount == null) {
                throw new CajaOperacionException("CASH_RECEIVING_COUNT_REQUIRED",
                        reportsOpeningDifference
                                ? "Captura el efectivo real contado antes de reportar la diferencia."
                                : "Captura el efectivo recibido antes de abrir este relevo.",
                        HttpStatus.CONFLICT);
            }
            receivedAmount = scale(receivedAmount);
            if (receivedAmount.signum() < 0) {
                throw new CajaOperacionException("CASH_RECEIVING_COUNT_INVALID",
                        "El efectivo recibido no puede ser negativo.", HttpStatus.BAD_REQUEST);
            }
            incomingDifference = receivedAmount.subtract(openingBalanceSnapshot).setScale(2, RoundingMode.HALF_UP);
            hasIncomingDifference = incomingDifference.signum() != 0;
            if (hasIncomingDifference) {
                if (incomingReason == null) {
                    throw new CajaOperacionException("CASH_RECEIVING_DIFFERENCE_REASON_REQUIRED",
                            "Captura el motivo de la diferencia de apertura.", HttpStatus.BAD_REQUEST);
                }
                if (policy.getHandoffPolicy() == CajaPoliticaOperacion.STRICT_SUPERVISED) {
                    throw new CajaOperacionException("CASH_INCOMING_COUNT_MISMATCH",
                            "La politica estricta requiere revision supervisada antes de abrir con diferencia.",
                            HttpStatus.CONFLICT);
                }
            }
        }

        stateMachine.assertCanOpen(false, false);

        LocalDateTime now = LocalDateTime.now();
        EmpresasEntity empresa = empresaRef(empresaId);

        CajaSesionEntity session = new CajaSesionEntity();
        session.setLocalDevice(device);
        session.setOpenedByUser(usuario);
        session.setOpenedAt(now);
        session.setLastActivityAt(now);
        session.setOpeningBalanceSnapshot(openingBalanceSnapshot);
        session.setExpectedCashAmount(openingBalanceSnapshot);
        session.setStatus(CajaSesionStatus.OPEN);
        session.setOpeningIdempotencyKey(idempotencyKey);
        session.setEmpresa(empresa);
        session.setUsuarioCreacion(user);

        try {
            session = cajaSesionRepository.saveAndFlush(session);
        } catch (DataIntegrityViolationException ex) {
            throw new CajaOperacionException("CASH_OPEN_CONCURRENT_CONFLICT",
                    "La instalacion o el usuario ya tienen un turno activo.", HttpStatus.CONFLICT);
        }

        MovimientoCajaEntity openingReconciliation = null;
        if (receivedAmount != null && hasIncomingDifference) {
            openingReconciliation = cajaSaldoService.registrarMovimientoContinuo(
                    device,
                    session,
                    usuario,
                    MovimientoCajaTipo.HANDOFF_RECONCILIATION,
                    incomingDifference.signum() > 0 ? "IN" : "OUT",
                    incomingDifference.abs(),
                    incomingDifference.signum() > 0 ? "OPENING_OVERAGE" : "OPENING_SHORTAGE",
                    incomingReason,
                    "CASH_OPENING_DIFFERENCE",
                    String.valueOf(session.getIdCajaSesion()),
                    "cash-open-difference-" + idempotencyKey,
                    user);
        }

        if (receivedAmount != null && hasIncomingDifference) {
            cajaIncidenciaService.crearIncidencia(
                    requiresIncomingCount
                            ? CajaIncidenciaTipo.DEFERRED_HANDOFF_MISMATCH
                            : CajaIncidenciaTipo.OTHER_CASH_DISCREPANCY,
                    device,
                    session,
                    openingReconciliation,
                    openingBalanceSnapshot,
                    null,
                    receivedAmount,
                    receivedAmount,
                    incomingDifference,
                    null,
                    incomingReason,
                    policy.getHandoffPolicy().name(),
                    user);
        }

        return buildState(device, usuario, session, "CASH_OPENED");
    }

    @Override
    @Transactional(readOnly = true)
    public CajaSesionEntity requireOpenSessionForCurrentInstallation(String user, Integer ignoredLegacyCajaId) {
        Integer empresaId = requireEmpresaId();
        UsuariosEntity usuario = findUsuario(user, empresaId);
        ResolvedInstallation resolved = resolveInstallation(empresaId, true);

        CajaSesionEntity session = cajaSesionRepository
                .findFirstByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndStatusInAndEstatusTrueOrderByOpenedAtDesc(
                        resolved.device().getInstallationId(), empresaId, stateMachine.activeStatuses())
                .orElseThrow(() -> new CajaOperacionException("CASH_SESSION_REQUIRED",
                        "No existe un turno de caja abierto para vender.", HttpStatus.CONFLICT));

        if (session.getStatus() != CajaSesionStatus.OPEN) {
            throw new CajaOperacionException("CASH_RECONCILIATION_REQUIRED",
                    "El turno de caja esta pendiente de conciliacion.", HttpStatus.CONFLICT);
        }

        if (!session.getOpenedByUser().getIdUsuario().equals(usuario.getIdUsuario())) {
            throw new CajaOperacionException("CASH_SESSION_OWNED_BY_OTHER",
                    "El turno de caja pertenece a otro usuario.", HttpStatus.FORBIDDEN);
        }

        return session;
    }

    @Override
    @Transactional(readOnly = true)
    public CajaSesionResumenDTO getResumenSesionActual(String user) {
        CajaSesionEntity session = requireOpenSessionForCurrentInstallation(user, null);
        Integer empresaId = requireEmpresaId();
        UsuariosEntity usuario = findUsuario(user, empresaId);
        CajaEstadoActualDTO.CashCapabilities capabilities = buildCapabilities(usuario, session);
        return buildSessionSummary(session,
                Boolean.TRUE.equals(capabilities.getCanViewExpectedBalance()),
                Boolean.TRUE.equals(capabilities.getCanViewSalesSummary()),
                capabilities);
    }

    @Override
    @Transactional
    public CajaSesionResumenDTO revelarEfectivoEsperado(String user) {
        CajaSesionEntity session = requireOpenSessionForCurrentInstallation(user, null);
        Integer empresaId = requireEmpresaId();
        UsuariosEntity usuario = findUsuario(user, empresaId);
        if (!permisosResolver.hasAny(usuario, "CASH_REVEAL_EXPECTED_BALANCE", "CASH_VIEW_EXPECTED_BALANCE",
                "CAJA_VER_ARQUEO")) {
            throw new CajaOperacionException("CASH_REVEAL_FORBIDDEN",
                    "El usuario no tiene permiso para revelar el efectivo esperado.", HttpStatus.FORBIDDEN);
        }
        session.setExpectedBalanceViewedBeforeCount(true);
        session.setExpectedBalanceViewedAt(LocalDateTime.now());
        session.setExpectedBalanceViewedBy(usuario);
        session.setUsuarioModificacion(user);
        cajaSesionRepository.save(session);
        CajaEstadoActualDTO.CashCapabilities capabilities = buildCapabilities(usuario, session);
        return buildSessionSummary(session, true, true, capabilities);
    }

    @Override
    @Transactional(readOnly = true)
    public CajaCierrePreviewDTO prepararCierreSesionActual(CajaCierreRequestDTO request, String user) {
        Integer empresaId = requireEmpresaId();
        UsuariosEntity usuario = findUsuario(user, empresaId);
        BigDecimal countedAmount = normalizeCountedAmount(request != null ? request.getCountedAmount() : null);

        ResolvedInstallation resolved = resolveInstallation(empresaId, true);
        CajaSesionEntity session = cajaSesionRepository
                .findFirstByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndStatusInAndEstatusTrueOrderByOpenedAtDesc(
                        resolved.device().getInstallationId(), empresaId, stateMachine.activeStatuses())
                .orElseThrow(() -> new CajaOperacionException("CASH_SESSION_REQUIRED",
                        "No existe un turno abierto para preparar el cierre.", HttpStatus.CONFLICT));

        if (session.getStatus() != CajaSesionStatus.OPEN) {
            throw new CajaOperacionException("CASH_RECONCILIATION_REQUIRED",
                    "El turno ya esta pendiente de conciliacion.", HttpStatus.CONFLICT);
        }

        validateCanCloseSession(session, usuario);

        SaldoEfectivoEntity saldo = cajaSaldoService.requireInitializedBalance(session.getLocalDevice(), empresaId);
        BigDecimal expected = scale(saldo.getCurrentBalanceSnapshot());
        BigDecimal difference = scale(countedAmount.subtract(expected));
        ConfiguracionCajaEntity policy = configuracionCajaService.getOrCreate(empresaId, user);
        return buildClosingPreview(session, countedAmount, expected, difference, policy);
    }

    @Override
    @Transactional
    public CajaCierreResultadoDTO cerrarSesionActual(CajaCierreRequestDTO request, String user) {
        Integer empresaId = requireEmpresaId();
        UsuariosEntity usuario = findUsuario(user, empresaId);
        BigDecimal countedAmount = normalizeCountedAmount(request != null ? request.getCountedAmount() : null);
        String idempotencyKey = normalizeIdempotencyKey(request != null ? request.getIdempotencyKey() : null);

        var processed = cajaSesionRepository
                .findByClosingIdempotencyKeyAndEmpresa_IdEmpresaAndEstatusTrue(idempotencyKey, empresaId);
        if (processed.isPresent()) {
            return buildClosingResult(processed.get(), null, null, configuracionCajaService.getOrCreate(empresaId, user));
        }

        ResolvedInstallation resolved = resolveInstallation(empresaId, true);
        CajaSesionEntity session = cajaSesionRepository
                .findFirstByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndStatusInAndEstatusTrueOrderByOpenedAtDesc(
                        resolved.device().getInstallationId(), empresaId, stateMachine.activeStatuses())
                .orElseThrow(() -> new CajaOperacionException("CASH_SESSION_REQUIRED",
                        "No existe un turno abierto para cerrar.", HttpStatus.CONFLICT));
        session = cajaSesionRepository.findByIdAndEmpresaForUpdate(session.getIdCajaSesion(), empresaId)
                .orElseThrow(() -> new CajaOperacionException("CASH_SESSION_REQUIRED",
                        "No existe un turno abierto para cerrar.", HttpStatus.CONFLICT));

        if (session.getStatus() != CajaSesionStatus.OPEN) {
            throw new CajaOperacionException("CASH_RECONCILIATION_REQUIRED",
                    "El turno ya esta pendiente de conciliacion.", HttpStatus.CONFLICT);
        }

        validateCanCloseSession(session, usuario);

        SaldoEfectivoEntity saldo = cajaSaldoService.requireInitializedBalance(session.getLocalDevice(), empresaId);
        BigDecimal expected = scale(saldo.getCurrentBalanceSnapshot());
        BigDecimal difference = scale(countedAmount.subtract(expected));
        boolean hasDifference = difference.signum() != 0;
        String reason = request != null ? request.getDiscrepancyReason() : null;
        if (hasDifference && (reason == null || reason.isBlank())) {
            throw new IllegalArgumentException("El motivo es obligatorio cuando existe diferencia de cierre.");
        }

        ConfiguracionCajaEntity policy = configuracionCajaService.getOrCreate(empresaId, user);
        if (hasDifference && policy.getHandoffPolicy() == CajaPoliticaOperacion.STRICT_SUPERVISED
                && !permisosResolver.hasAny(usuario, "CASH_RESOLVE_DISCREPANCY", "CASH_CLOSE_OTHERS",
                        "CAJA_AJUSTAR_DIFERENCIA")) {
            stateMachine.transition(session, CajaSesionStatus.PENDING_RECONCILIATION, usuario,
                    "STRICT_SUPERVISED_DIFFERENCE", "Diferencia pendiente de autorizacion.");
            session.setClosingExpectedCashAmount(expected);
            session.setCountedCashAmount(countedAmount);
            session.setDifferenceAmount(difference);
            session.setClosingIdempotencyKey(idempotencyKey);
            session.setUsuarioModificacion(user);
            cajaSesionRepository.save(session);
            throw new CajaOperacionException("CASH_SUPERVISOR_REVIEW_REQUIRED",
                    "La politica estricta requiere autorizacion para cerrar con diferencia.", HttpStatus.CONFLICT);
        }

        MovimientoCajaEntity adjustment = null;
        if (hasDifference) {
            adjustment = cajaSaldoService.registrarMovimientoContinuo(
                    session.getLocalDevice(),
                    session,
                    usuario,
                    MovimientoCajaTipo.CLOSING_RECONCILIATION,
                    difference.signum() > 0 ? "IN" : "OUT",
                    difference.abs(),
                    difference.signum() > 0 ? "CLOSING_OVERAGE" : "CLOSING_SHORTAGE",
                    reason,
                    "CASH_SESSION",
                    String.valueOf(session.getIdCajaSesion()),
                    "cash-close-adjust-" + idempotencyKey,
                    user);
        }

        session.setClosingExpectedCashAmount(expected);
        session.setCountedCashAmount(countedAmount);
        session.setDifferenceAmount(difference);
        session.setClosingIdempotencyKey(idempotencyKey);
        stateMachine.transition(session, CajaSesionStatus.CLOSED, usuario,
                hasDifference ? "CLOSING_WITH_DIFFERENCE" : "CLOSING_EXACT",
                request != null ? request.getNotes() : null);
        session.setUsuarioModificacion(user);
        CajaSesionEntity savedSession = cajaSesionRepository.save(session);

        CajaIncidenciaEntity incident = null;
        if (hasDifference) {
            incident = cajaIncidenciaService.crearIncidencia(
                    CajaIncidenciaTipo.CLOSING_DIFFERENCE,
                    session.getLocalDevice(),
                    savedSession,
                    adjustment,
                    expected,
                    countedAmount,
                    null,
                    countedAmount,
                    difference,
                    request != null ? request.getNotes() : null,
                    null,
                    policy.getHandoffPolicy().name(),
                    user);
        }

        return buildClosingResult(savedSession, adjustment, incident, policy);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CajaSesionHistorialDTO> getHistorialSesiones(String user, LocalDateTime desde, LocalDateTime hasta,
            String query, String medium, Integer sessionId, Pageable pageable) {
        Integer empresaId = requireEmpresaId();
        UsuariosEntity usuario = findUsuario(user, empresaId);
        if (!permisosResolver.hasAny(usuario, "CASH_VIEW_MOVEMENTS", "CASH_VIEW_HISTORY", "CAJA_MOVIMIENTOS",
                "CAJA_VER_ARQUEO")) {
            throw new CajaOperacionException("CASH_HISTORY_FORBIDDEN",
                    "El usuario no tiene permiso para ver historial de caja.", HttpStatus.FORBIDDEN);
        }
        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw new IllegalArgumentException("La fecha inicial no puede ser mayor a la fecha final.");
        }

        ResolvedInstallation resolved = resolveInstallation(empresaId, true);
        Specification<CajaSesionEntity> spec = Specification
                .where(sessionBaseSpec(empresaId, resolved.device().getInstallationId()))
                .and(sessionDateRangeSpec(desde, hasta))
                .and(sessionIdSpec(sessionId))
                .and(sessionSearchSpec(query, empresaId))
                .and(sessionMediumSpec(medium, empresaId));

        return cajaSesionRepository.findAll(spec, pageable)
                .map(session -> toHistorialDTO(session, empresaId, medium));
    }

    public CajaSesionResumenDTO buildSessionSummary(CajaSesionEntity session) {
        return buildSessionSummary(session, true, true, null);
    }

    public CajaSesionResumenDTO buildSessionSummary(CajaSesionEntity session, boolean includeExpected,
            boolean includeSalesSummary, CajaEstadoActualDTO.CashCapabilities capabilities) {
        Integer empresaId = session.getEmpresa().getIdEmpresa();
        List<MovimientoCajaEntity> movimientos = movimientoCajaRepository
                .findByCajaSesion_IdCajaSesionAndEmpresa_IdEmpresa(session.getIdCajaSesion(), empresaId);
        List<VentasEntity> ventas = ventasRepository
                .findByCajaSesion_IdCajaSesionAndEmpresa_IdEmpresa(session.getIdCajaSesion(), empresaId);

        BigDecimal opening = scale(session.getOpeningBalanceSnapshot());
        BigDecimal cashSales = sumMovements(movimientos, MovimientoCajaTipo.CASH_SALE.name());
        BigDecimal manualEntries = sumMovements(movimientos, MovimientoCajaTipo.MANUAL_ENTRY.name());
        BigDecimal withdrawals = sumMovements(movimientos, MovimientoCajaTipo.MANUAL_WITHDRAWAL.name());
        BigDecimal refunds = sumMovements(movimientos, MovimientoCajaTipo.CASH_REFUND.name());
        BigDecimal cardSales = sumSalesByMethod(ventas, PaymentFamily.CARD);
        BigDecimal transferSales = sumSalesByMethod(ventas, PaymentFamily.TRANSFER);
        BigDecimal electronicEntries = sumMovements(movimientos, MovimientoCajaTipo.CARD_ENTRY.name())
                .add(sumElectronicSalesWithoutMovement(ventas, movimientos));
        BigDecimal cardWithdrawals = sumMovements(movimientos, MovimientoCajaTipo.CARD_WITHDRAWAL.name());
        BigDecimal expectedCash = scale(opening.add(sumCashImpact(movimientos)));

        CajaSesionResumenDTO dto = new CajaSesionResumenDTO();
        dto.setSessionId(session.getIdCajaSesion());
        dto.setOpenedAt(session.getOpenedAt());
        dto.setResponsibleUser(toUserInfo(session.getOpenedByUser()));
        dto.setOpeningBalanceSnapshot(includeExpected ? scale(opening) : null);
        dto.setOpeningAmount(includeExpected ? scale(opening) : null);
        dto.setCashSalesAmount(includeSalesSummary || includeExpected ? scale(cashSales) : null);
        dto.setCardSalesAmount(includeSalesSummary ? scale(cardSales) : null);
        dto.setTransferSalesAmount(includeSalesSummary ? scale(transferSales) : null);
        dto.setTotalSalesAmount(includeSalesSummary ? scale(sumSalesByMethod(ventas, PaymentFamily.ANY)) : null);
        dto.setExpectedCardAmount(includeSalesSummary ? scale(electronicEntries.subtract(cardWithdrawals)) : null);
        dto.setCashEntriesAmount(includeExpected ? scale(sumMovementsByDirection(movimientos, "IN")) : null);
        dto.setCashOutflowsAmount(includeExpected ? scale(sumMovementsByDirection(movimientos, "OUT")) : null);
        dto.setCardEntriesAmount(includeSalesSummary ? scale(electronicEntries) : null);
        dto.setCardWithdrawalsAmount(includeSalesSummary ? scale(cardWithdrawals) : null);
        dto.setManualEntriesAmount(includeExpected ? scale(manualEntries) : null);
        dto.setManualWithdrawalsAmount(includeExpected ? scale(withdrawals) : null);
        dto.setCashRefundsAmount(includeExpected ? scale(refunds) : null);
        dto.setExpectedCashVisible(includeExpected);
        dto.setExpectedCashAmount(includeExpected ? scale(expectedCash) : null);
        dto.setSalesSummaryVisible(includeSalesSummary);
        dto.setExpectedBalanceViewedBeforeCount(Boolean.TRUE.equals(session.getExpectedBalanceViewedBeforeCount()));
        dto.setSalesCount(ventas.size());
        dto.setCapabilities(capabilities);
        return dto;
    }

    private CajaSesionHistorialDTO toHistorialDTO(CajaSesionEntity session, Integer empresaId, String medium) {
        List<MovimientoCajaEntity> movements = movimientoCajaRepository
                .findByCajaSesion_IdCajaSesionAndEmpresa_IdEmpresa(session.getIdCajaSesion(), empresaId)
                .stream()
                .filter(this::isVisibleHistoryMovement)
                .filter(movement -> movementMatchesMedium(movement, medium))
                .toList();

        CajaSesionHistorialDTO dto = new CajaSesionHistorialDTO();
        dto.setSessionId(session.getIdCajaSesion());
        dto.setOpenedAt(session.getOpenedAt());
        dto.setClosedAt(session.getClosedAt());
        dto.setLatestAt(movements.stream()
                .map(MovimientoCajaEntity::getFecha)
                .filter(value -> value != null)
                .max(LocalDateTime::compareTo)
                .orElse(session.getClosedAt() != null ? session.getClosedAt() : session.getLastActivityAt()));
        dto.setResponsibleUser(toUserInfo(session.getOpenedByUser()));
        dto.setStatus(session.getStatus() != null ? session.getStatus().name() : null);
        dto.setMovementCount((long) movements.size());
        dto.setCashInAmount(scale(sumHistoryMovements(movements, false, "IN")));
        dto.setCashOutAmount(scale(sumHistoryMovements(movements, false, "OUT")));
        dto.setElectronicInAmount(scale(sumHistoryMovements(movements, true, "IN")));
        dto.setElectronicOutAmount(scale(sumHistoryMovements(movements, true, "OUT")));
        return dto;
    }

    private BigDecimal sumHistoryMovements(List<MovimientoCajaEntity> movements, boolean electronic, String direction) {
        return movements.stream()
                .filter(movement -> MovimientoCajaTipo.isElectronic(movement.getTipo()) == electronic)
                .filter(movement -> direction.equalsIgnoreCase(cashDirection(movement)))
                .map(MovimientoCajaEntity::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Specification<CajaSesionEntity> sessionBaseSpec(Integer empresaId, String installationId) {
        return (root, query, cb) -> cb.and(
                cb.equal(root.get("empresa").get("idEmpresa"), empresaId),
                cb.equal(root.get("localDevice").get("installationId"), installationId),
                cb.isTrue(root.get("estatus")));
    }

    private Specification<CajaSesionEntity> sessionDateRangeSpec(LocalDateTime desde, LocalDateTime hasta) {
        return (root, query, cb) -> {
            var sessionEnd = cb.coalesce(root.<LocalDateTime>get("closedAt"), root.<LocalDateTime>get("lastActivityAt"));
            if (desde != null && hasta != null) {
                return cb.and(
                        cb.greaterThanOrEqualTo(sessionEnd, desde),
                        cb.lessThanOrEqualTo(root.get("openedAt"), hasta));
            }
            if (desde != null) {
                return cb.greaterThanOrEqualTo(sessionEnd, desde);
            }
            if (hasta != null) {
                return cb.lessThanOrEqualTo(root.get("openedAt"), hasta);
            }
            return cb.conjunction();
        };
    }

    private Specification<CajaSesionEntity> sessionIdSpec(Integer sessionId) {
        return (root, query, cb) -> sessionId == null
                ? cb.conjunction()
                : cb.equal(root.get("idCajaSesion"), sessionId);
    }

    private Specification<CajaSesionEntity> sessionSearchSpec(String value, Integer empresaId) {
        String queryText = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        return (root, query, cb) -> {
            if (queryText.isBlank()) {
                return cb.conjunction();
            }
            String pattern = "%" + queryText + "%";
            var movementQuery = query.subquery(Integer.class);
            var movement = movementQuery.from(MovimientoCajaEntity.class);
            movementQuery.select(cb.literal(1)).where(cb.and(
                    cb.equal(movement.get("cajaSesion").get("idCajaSesion"), root.get("idCajaSesion")),
                    cb.equal(movement.get("empresa").get("idEmpresa"), empresaId),
                    cb.isTrue(movement.get("estatus")),
                    cb.or(
                            cb.like(cb.lower(movement.get("tipo")), pattern),
                            cb.like(cb.lower(movement.get("motivo")), pattern),
                            cb.like(cb.lower(movement.get("category")), pattern),
                            cb.like(cb.lower(movement.get("referenceType")), pattern),
                            cb.like(cb.lower(movement.get("referenceId")), pattern))));

            return cb.or(
                    cb.like(cb.lower(root.get("openedByUser").get("nombreUsuario")), pattern),
                    cb.like(cb.lower(root.get("openedByUser").get("usuario")), pattern),
                    cb.exists(movementQuery));
        };
    }

    private Specification<CajaSesionEntity> sessionMediumSpec(String medium, Integer empresaId) {
        return (root, query, cb) -> {
            var movementQuery = query.subquery(Integer.class);
            var movement = movementQuery.from(MovimientoCajaEntity.class);
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(cb.equal(movement.get("cajaSesion").get("idCajaSesion"), root.get("idCajaSesion")));
            predicates.add(cb.equal(movement.get("empresa").get("idEmpresa"), empresaId));
            predicates.add(cb.isTrue(movement.get("estatus")));
            predicates.add(cb.not(cb.and(
                    movement.get("tipo").in(MovimientoCajaTipo.OPENING.name(), MovimientoCajaTipo.INITIAL_BALANCE.name()),
                    cb.equal(movement.get("monto"), BigDecimal.ZERO))));

            if (isElectronicMedium(medium)) {
                predicates.add(movement.get("tipo").in(ELECTRONIC_MOVEMENT_TYPES));
            } else if (isCashMedium(medium)) {
                predicates.add(cb.not(movement.get("tipo").in(ELECTRONIC_MOVEMENT_TYPES)));
            }

            movementQuery.select(cb.literal(1)).where(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
            return cb.exists(movementQuery);
        };
    }

    private CajaEstadoActualDTO buildState(LocalDeviceEntity device, UsuariosEntity currentUser,
            CajaSesionEntity preferredSession, String forcedCode) {
        CajaSesionEntity session = preferredSession;
        if (session == null) {
            session = cajaSesionRepository
                    .findFirstByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndStatusInAndEstatusTrueOrderByOpenedAtDesc(
                            device.getInstallationId(), currentUser.getEmpresa().getIdEmpresa(),
                            stateMachine.activeStatuses())
                    .orElse(null);
        }

        CajaEstadoActualDTO dto = baseDto(device);
        ConfiguracionCajaEntity policy = configuracionCajaService.getOrCreate(currentUser.getEmpresa().getIdEmpresa(),
                currentUser.getUsuario());
        dto.setPolicy(policy.getHandoffPolicy().name());
        CajaEstadoActualDTO.CashCapabilities capabilities = buildCapabilities(currentUser, session);
        dto.setCapabilities(capabilities);
        boolean canViewExpected = Boolean.TRUE.equals(capabilities.getCanViewExpectedBalance());
        boolean canReviewIncidents = Boolean.TRUE.equals(capabilities.getCanReviewIncidents());
        saldoEfectivoRepository
                .findByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndEstatusTrue(
                        device.getInstallationId(), currentUser.getEmpresa().getIdEmpresa())
                .ifPresentOrElse(saldo -> {
                    dto.setBalanceInitialized(Boolean.TRUE.equals(saldo.getInitialized()));
                    dto.setCurrentBalance(Boolean.TRUE.equals(saldo.getInitialized()) && canViewExpected
                            ? scale(saldo.getCurrentBalanceSnapshot())
                            : null);
                }, () -> {
                    dto.setBalanceInitialized(false);
                    dto.setCurrentBalance(null);
                });
        dto.setPendingIncidentCount(canReviewIncidents
                ? cajaIncidenciaService.countPendingForDevice(
                        device.getInstallationId(), currentUser.getEmpresa().getIdEmpresa())
                : null);
        CajaSesionEntity lastSession = findLastSessionForDevice(device, currentUser.getEmpresa().getIdEmpresa());
        boolean receivingCountRequired = requiresIncomingCount(policy, lastSession, currentUser);

        if (!Boolean.TRUE.equals(dto.getBalanceInitialized())) {
            dto.setStatus(STATUS_BALANCE_NOT_INITIALIZED);
            dto.setCode("CASH_BALANCE_NOT_INITIALIZED");
            dto.setMessage("Configura el saldo inicial de esta estacion antes de abrir turno.");
            dto.setCanCurrentUserClose(false);
            dto.setCanCurrentUserResume(false);
            dto.setRequiresReconciliation(false);
            dto.setRequiresReceivingCount(false);
            return dto;
        }

        if (session == null) {
            dto.setStatus(receivingCountRequired ? STATUS_RECEIVING_COUNT_REQUIRED : STATUS_NO_SESSION);
            dto.setCode(forcedCode != null ? forcedCode
                    : receivingCountRequired ? "CASH_RECEIVING_COUNT_REQUIRED" : "CASH_SESSION_NOT_OPEN");
            dto.setMessage(receivingCountRequired
                    ? "El relevo requiere conteo entrante antes de abrir turno."
                    : "No hay turno de caja abierto.");
            dto.setCanCurrentUserClose(false);
            dto.setCanCurrentUserResume(false);
            dto.setRequiresReconciliation(false);
            dto.setRequiresReceivingCount(receivingCountRequired);
            dto.setIncomingCount(receivingCountRequired
                    ? toIncomingCountInfo(policy, lastSession, dto.getCurrentBalance(), canViewExpected)
                    : null);
            return dto;
        }

        boolean isCurrentUserOwner = session.getOpenedByUser() != null
                && session.getOpenedByUser().getIdUsuario().equals(currentUser.getIdUsuario());

        capabilities = buildCapabilities(currentUser, session);
        dto.setCapabilities(capabilities);
        dto.setCurrentSession(toSessionInfo(session, Boolean.TRUE.equals(capabilities.getCanViewExpectedBalance())));
        dto.setStatus(session.getStatus() == CajaSesionStatus.OPEN && !isCurrentUserOwner
                ? STATUS_OPEN_BY_OTHER_USER
                : session.getStatus().name());
        dto.setRequiresReconciliation(session.getStatus() == CajaSesionStatus.PENDING_RECONCILIATION);
        dto.setRequiresReceivingCount(false);
        dto.setCanCurrentUserClose(Boolean.TRUE.equals(capabilities.getCanCloseCurrentSession()));
        dto.setCanCurrentUserResume(session.getStatus() == CajaSesionStatus.OPEN && isCurrentUserOwner);
        dto.setCode(resolveStateCode(session, isCurrentUserOwner, forcedCode));
        dto.setMessage(resolveStateMessage(session, isCurrentUserOwner));
        return dto;
    }

    private CajaEstadoActualDTO baseDto(LocalDeviceEntity device) {
        CajaEstadoActualDTO dto = new CajaEstadoActualDTO();
        CajaEstadoActualDTO.StationInfo station = new CajaEstadoActualDTO.StationInfo();
        station.setInstallationReference(obfuscateInstallationId(device.getInstallationId()));
        station.setDisplayName(resolveStationDisplayName(device));
        station.setStatus("ACTIVE");
        dto.setStation(station);
        dto.setLastSyncAt(LocalDateTime.now());
        return dto;
    }

    private CajaEstadoActualDTO buildErrorState(String code, String message) {
        CajaEstadoActualDTO dto = new CajaEstadoActualDTO();
        dto.setStatus(STATUS_ERROR);
        dto.setCode(code);
        dto.setMessage(message);
        dto.setCanCurrentUserClose(false);
        dto.setCanCurrentUserResume(false);
        dto.setRequiresReconciliation(false);
        dto.setLastSyncAt(LocalDateTime.now());
        return dto;
    }

    private CajaEstadoActualDTO.CashSessionInfo toSessionInfo(CajaSesionEntity session, boolean canViewExpected) {
        CajaEstadoActualDTO.CashSessionInfo info = new CajaEstadoActualDTO.CashSessionInfo();
        info.setId(session.getIdCajaSesion());
        info.setStatus(session.getStatus().name());
        info.setOpenedAt(session.getOpenedAt());
        info.setOpeningBalanceSnapshot(canViewExpected ? session.getOpeningBalanceSnapshot() : null);
        info.setOpeningAmount(canViewExpected ? session.getOpeningAmount() : null);
        info.setExpectedCashAmount(canViewExpected ? session.getExpectedCashAmount() : null);
        info.setExpectedCashVisible(canViewExpected);
        info.setExpectedBalanceViewedBeforeCount(Boolean.TRUE.equals(session.getExpectedBalanceViewedBeforeCount()));
        info.setLastActivityAt(session.getLastActivityAt());
        info.setOpenedBy(toUserInfo(session.getOpenedByUser()));
        return info;
    }

    private CajaEstadoActualDTO.UserInfo toUserInfo(UsuariosEntity user) {
        if (user == null) {
            return null;
        }
        CajaEstadoActualDTO.UserInfo info = new CajaEstadoActualDTO.UserInfo();
        info.setId(user.getIdUsuario());
        info.setUsername(user.getUsuario());
        info.setName(user.getNombreUsuario());
        info.setRole(user.getRol() != null ? user.getRol().getNombreRol() : null);
        info.setAvatarUrl(user.getAvatarUrl());
        return info;
    }

    private CajaEstadoActualDTO.CashCapabilities buildCapabilities(UsuariosEntity usuario, CajaSesionEntity session) {
        CajaEstadoActualDTO.CashCapabilities capabilities = new CajaEstadoActualDTO.CashCapabilities();
        boolean canViewSummary = permisosResolver.hasAny(usuario, "CASH_VIEW_SUMMARY", "CAJA_VER");
        boolean canViewSalesSummary = permisosResolver.hasAny(usuario, "CASH_VIEW_SALES_SUMMARY");
        boolean canViewExpectedBalance = permisosResolver.hasAny(usuario, "CASH_VIEW_EXPECTED_BALANCE", "CAJA_VER_ARQUEO");
        boolean canRevealExpectedBalance = permisosResolver.hasAny(usuario, "CASH_REVEAL_EXPECTED_BALANCE", "CAJA_VER_ARQUEO");
        boolean canViewMovements = permisosResolver.hasAny(usuario, "CASH_VIEW_MOVEMENTS", "CAJA_MOVIMIENTOS");
        boolean canViewHistory = permisosResolver.hasAny(usuario, "CASH_VIEW_HISTORY");
        boolean canReviewIncidents = permisosResolver.hasAny(usuario, "CASH_REVIEW_INCIDENTS", "CASH_RESOLVE_DISCREPANCY");
        boolean canCloseOwn = permisosResolver.hasAny(usuario, "CASH_CLOSE_OWN", "CAJA_CERRAR_PROPIA");
        boolean canCloseOthers = permisosResolver.hasAny(usuario, "CASH_CLOSE_OTHERS", "CAJA_CERRAR_AJENA");
        boolean canMoveCash = permisosResolver.hasAny(usuario, "CASH_MOVEMENT_ENTRY", "CASH_MOVEMENT_WITHDRAWAL",
                "CAJA_ENTRADA_EFECTIVO", "CAJA_RETIRO_EFECTIVO");
        boolean canManagePolicy = permisosResolver.hasAny(usuario, "CASH_MANAGE_POLICY", "CONFIG_CAJA_EDITAR");
        boolean ownsSession = session != null && session.getOpenedByUser() != null && usuario != null
                && session.getOpenedByUser().getIdUsuario().equals(usuario.getIdUsuario());
        boolean canCloseCurrent = session != null && session.getStatus() == CajaSesionStatus.OPEN
                && ((ownsSession && canCloseOwn) || (!ownsSession && canCloseOthers));
        boolean canOpenCashControl = canViewHistory || canViewMovements || canReviewIncidents || canMoveCash
                || canCloseOthers || canManagePolicy || canViewExpectedBalance;

        capabilities.setCanViewBasicSummary(canViewSummary || ownsSession);
        capabilities.setCanViewSalesSummary(canViewSalesSummary);
        capabilities.setCanViewExpectedBalance(canViewExpectedBalance);
        capabilities.setCanRevealExpectedBalance(canRevealExpectedBalance);
        capabilities.setCanOpenCashControl(canOpenCashControl);
        capabilities.setCanCloseCurrentSession(canCloseCurrent);
        capabilities.setCanCloseOwnSession(canCloseOwn);
        capabilities.setCanCloseOtherSession(canCloseOthers);
        capabilities.setCanViewMovements(canViewMovements);
        capabilities.setCanViewHistory(canViewHistory);
        capabilities.setCanReviewIncidents(canReviewIncidents);
        return capabilities;
    }

    private void validateCanCloseSession(CajaSesionEntity session, UsuariosEntity usuario) {
        boolean ownsSession = session.getOpenedByUser().getIdUsuario().equals(usuario.getIdUsuario());
        if (!ownsSession && !permisosResolver.hasAny(usuario, "CASH_CLOSE_OTHERS", "CAJA_CERRAR_AJENA")) {
            throw new CajaOperacionException("CASH_CLOSE_FORBIDDEN",
                    "El usuario no puede cerrar un turno de otra persona.", HttpStatus.FORBIDDEN);
        }
        if (ownsSession && !permisosResolver.hasAny(usuario, "CASH_CLOSE_OWN", "CAJA_CERRAR_PROPIA")) {
            throw new CajaOperacionException("CASH_CLOSE_FORBIDDEN",
                    "El usuario no tiene permiso para cerrar su turno.", HttpStatus.FORBIDDEN);
        }
    }

    private CajaSesionEntity findLastSessionForDevice(LocalDeviceEntity device, Integer empresaId) {
        if (device == null || device.getInstallationId() == null) {
            return null;
        }
        return cajaSesionRepository
                .findFirstByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndEstatusTrueOrderByOpenedAtDesc(
                        device.getInstallationId(), empresaId)
                .orElse(null);
    }

    private boolean requiresIncomingCount(ConfiguracionCajaEntity policy, CajaSesionEntity lastSession,
            UsuariosEntity currentUser) {
        if (!Boolean.TRUE.equals(policy.getRequireIncomingCountOnUserChange()) || lastSession == null
                || currentUser == null || lastSession.getOpenedByUser() == null) {
            return false;
        }
        boolean lastSessionClosed = lastSession.getStatus() == CajaSesionStatus.CLOSED
                || lastSession.getStatus() == CajaSesionStatus.CLOSED_BY_SUPERVISOR;
        if (!lastSessionClosed) {
            return false;
        }
        return !lastSession.getOpenedByUser().getIdUsuario().equals(currentUser.getIdUsuario());
    }

    private CajaEstadoActualDTO.IncomingCountInfo toIncomingCountInfo(ConfiguracionCajaEntity policy,
            CajaSesionEntity lastSession, BigDecimal expectedAmount, boolean canViewExpected) {
        CajaEstadoActualDTO.IncomingCountInfo info = new CajaEstadoActualDTO.IncomingCountInfo();
        info.setRequired(true);
        info.setExpectedAmount(canViewExpected ? scale(expectedAmount) : null);
        info.setPreviousCashier(toUserInfo(lastSession.getOpenedByUser()));
        info.setPreviousClosedAt(lastSession.getClosedAt());
        info.setPolicy(policy.getHandoffPolicy().name());
        return info;
    }

    private String resolveStateCode(CajaSesionEntity session, boolean isCurrentUserOwner, String forcedCode) {
        if (forcedCode != null) {
            return forcedCode;
        }
        return switch (session.getStatus()) {
            case OPEN -> isCurrentUserOwner ? "CASH_SESSION_OPEN" : "CASH_SESSION_OWNED_BY_OTHER";
            case PENDING_RECONCILIATION -> "CASH_PENDING_RECONCILIATION";
            case CLOSED -> "CASH_SESSION_CLOSED";
            case CLOSED_BY_SUPERVISOR -> "CASH_SESSION_CLOSED_BY_SUPERVISOR";
        };
    }

    private String resolveStateMessage(CajaSesionEntity session, boolean isCurrentUserOwner) {
        return switch (session.getStatus()) {
            case OPEN -> isCurrentUserOwner
                    ? "Turno de caja abierto."
                    : "La instalacion tiene un turno abierto por otro usuario.";
            case PENDING_RECONCILIATION -> "El turno de caja requiere conciliacion antes de vender.";
            case CLOSED, CLOSED_BY_SUPERVISOR -> "El turno anterior esta cerrado; se requiere una nueva apertura.";
        };
    }

    private ResolvedInstallation resolveInstallation(Integer empresaId, boolean throwOnError) {
        LocalDeviceEntity device = localDeviceRepository.findFirstByOrderByCreatedAtAsc()
                .orElse(null);

        if (device == null) {
            return resolveError("CASH_DEVICE_IDENTITY_MISSING",
                    "No se encontro identidad local de instalacion.", throwOnError, HttpStatus.CONFLICT);
        }

        if (device.getLicenseToken() == null || device.getLicenseToken().isBlank()) {
            return resolveError("CASH_DEVICE_ACTIVATION_REQUIRED",
                    "La instalacion no esta activada.", throwOnError, HttpStatus.CONFLICT);
        }

        if (device.getEmpresa() != null && device.getEmpresa().getIdEmpresa() != null
                && !device.getEmpresa().getIdEmpresa().equals(empresaId)) {
            return resolveError("CASH_DEVICE_COMPANY_MISMATCH",
                    "La instalacion esta vinculada a otra empresa.", throwOnError, HttpStatus.FORBIDDEN);
        }

        return new ResolvedInstallation(device, null, null);
    }

    private LocalDeviceEntity lockAndPrepareDevice(LocalDeviceEntity device, Integer empresaId) {
        LocalDeviceEntity locked = localDeviceRepository.findByInstallationIdForUpdate(device.getInstallationId())
                .orElseThrow(() -> new CajaOperacionException("CASH_DEVICE_IDENTITY_MISSING",
                        "No se encontro identidad local de instalacion.", HttpStatus.CONFLICT));

        if (locked.getEmpresa() != null && locked.getEmpresa().getIdEmpresa() != null
                && !locked.getEmpresa().getIdEmpresa().equals(empresaId)) {
            throw new CajaOperacionException("CASH_DEVICE_COMPANY_MISMATCH",
                    "La instalacion esta vinculada a otra empresa.", HttpStatus.FORBIDDEN);
        }

        if (locked.getEmpresa() == null || locked.getEmpresa().getIdEmpresa() == null) {
            locked.setEmpresa(empresaRef(empresaId));
            locked = localDeviceRepository.save(locked);
        }
        return locked;
    }

    private ResolvedInstallation resolveError(String code, String message, boolean throwOnError, HttpStatus status) {
        if (throwOnError) {
            throw new CajaOperacionException(code, message, status);
        }
        return new ResolvedInstallation(null, code, message);
    }

    private Integer requireEmpresaId() {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        if (empresaId == null) {
            throw new CajaOperacionException("CASH_COMPANY_CONTEXT_MISSING",
                    "No se encontro empresa activa en la sesion.", HttpStatus.UNAUTHORIZED);
        }
        return empresaId;
    }

    private UsuariosEntity findUsuario(String user, Integer empresaId) {
        if (user == null || user.isBlank()) {
            throw new CajaOperacionException("CASH_USER_CONTEXT_MISSING",
                    "No se encontro usuario autenticado.", HttpStatus.UNAUTHORIZED);
        }
        return usuariosRepository.findByUsuarioAndEmpresa_IdEmpresa(user, empresaId)
                .orElseThrow(() -> new CajaOperacionException("CASH_USER_NOT_FOUND",
                        "Usuario no encontrado en la empresa activa.", HttpStatus.UNAUTHORIZED));
    }

    private BigDecimal normalizeCountedAmount(BigDecimal amount) {
        if (amount == null) {
            throw new IllegalArgumentException("El efectivo contado es requerido.");
        }
        if (amount.signum() < 0) {
            throw new IllegalArgumentException("El efectivo contado no puede ser negativo.");
        }
        if (amount.stripTrailingZeros().scale() > 2) {
            throw new IllegalArgumentException("El efectivo contado no puede tener mas de dos decimales.");
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private String normalizeIdempotencyKey(String value) {
        String key = value == null ? "" : value.trim();
        if (key.length() < 8 || key.length() > 120) {
            throw new IllegalArgumentException("La llave de idempotencia es requerida y debe medir entre 8 y 120 caracteres.");
        }
        return key;
    }

    private String obfuscateInstallationId(String installationId) {
        if (installationId == null || installationId.isBlank()) {
            return "sin-identidad";
        }
        String normalized = installationId.trim();
        int size = normalized.length();
        return "inst-" + normalized.substring(Math.max(0, size - Math.min(8, size))).toLowerCase(Locale.ROOT);
    }

    private String resolveStationDisplayName(LocalDeviceEntity device) {
        if (device.getDisplayName() == null || device.getDisplayName().isBlank()) {
            return DEFAULT_STATION_NAME;
        }
        return device.getDisplayName().trim();
    }

    private BigDecimal sumMovements(List<MovimientoCajaEntity> movimientos, String type) {
        return movimientos.stream()
                .filter(m -> type.equalsIgnoreCase(m.getTipo()))
                .map(MovimientoCajaEntity::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumMovementsByDirection(List<MovimientoCajaEntity> movimientos, String direction) {
        return movimientos.stream()
                .filter(m -> !MovimientoCajaTipo.OPENING.name().equalsIgnoreCase(m.getTipo()))
                .filter(m -> !MovimientoCajaTipo.INITIAL_BALANCE.name().equalsIgnoreCase(m.getTipo()))
                .filter(m -> MovimientoCajaTipo.affectsCash(m.getTipo()))
                .filter(m -> direction.equalsIgnoreCase(cashDirection(m)))
                .map(MovimientoCajaEntity::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumCashImpact(List<MovimientoCajaEntity> movimientos) {
        return movimientos.stream()
                .filter(m -> !MovimientoCajaTipo.OPENING.name().equalsIgnoreCase(m.getTipo()))
                .filter(m -> !MovimientoCajaTipo.INITIAL_BALANCE.name().equalsIgnoreCase(m.getTipo()))
                .map(this::cashImpact)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal cashImpact(MovimientoCajaEntity movement) {
        if (!MovimientoCajaTipo.affectsCash(movement.getTipo())) {
            return BigDecimal.ZERO;
        }
        BigDecimal amount = movement.getMonto() == null ? BigDecimal.ZERO : movement.getMonto();
        String direction = movement.getFinancialDirection() == null ? "" : movement.getFinancialDirection();
        if ("IN".equalsIgnoreCase(direction)) {
            return amount;
        }
        if ("OUT".equalsIgnoreCase(direction)) {
            return amount.negate();
        }
        if (MovimientoCajaTipo.increasesCash(movement.getTipo())) {
            return amount;
        }
        if (MovimientoCajaTipo.decreasesCash(movement.getTipo())) {
            return amount.negate();
        }
        return BigDecimal.ZERO;
    }

    private String cashDirection(MovimientoCajaEntity movement) {
        String direction = movement.getFinancialDirection() == null ? "" : movement.getFinancialDirection();
        if ("IN".equalsIgnoreCase(direction) || "OUT".equalsIgnoreCase(direction)) {
            return direction.toUpperCase(Locale.ROOT);
        }
        if (MovimientoCajaTipo.increasesCash(movement.getTipo())) {
            return "IN";
        }
        if (MovimientoCajaTipo.decreasesCash(movement.getTipo())) {
            return "OUT";
        }
        return "NONE";
    }

    private boolean isVisibleHistoryMovement(MovimientoCajaEntity movement) {
        if (movement == null || Boolean.FALSE.equals(movement.getEstatus())) {
            return false;
        }
        String type = movement.getTipo() == null ? "" : movement.getTipo().trim().toUpperCase(Locale.ROOT);
        BigDecimal amount = movement.getMonto() == null ? BigDecimal.ZERO : movement.getMonto();
        return !(Set.of(MovimientoCajaTipo.OPENING.name(), MovimientoCajaTipo.INITIAL_BALANCE.name()).contains(type)
                && amount.signum() == 0);
    }

    private boolean movementMatchesMedium(MovimientoCajaEntity movement, String medium) {
        if (isElectronicMedium(medium)) {
            return MovimientoCajaTipo.isElectronic(movement.getTipo());
        }
        if (isCashMedium(medium)) {
            return !MovimientoCajaTipo.isElectronic(movement.getTipo());
        }
        return true;
    }

    private boolean isElectronicMedium(String medium) {
        String normalized = medium == null ? "" : medium.trim().toUpperCase(Locale.ROOT);
        return Set.of("CARD", "TARJETA", "ELECTRONIC", "ELECTRONICO").contains(normalized);
    }

    private boolean isCashMedium(String medium) {
        String normalized = medium == null ? "" : medium.trim().toUpperCase(Locale.ROOT);
        return Set.of("CASH", "EFECTIVO").contains(normalized);
    }

    private CajaCierrePreviewDTO buildClosingPreview(CajaSesionEntity session, BigDecimal counted,
            BigDecimal expected, BigDecimal difference, ConfiguracionCajaEntity policy) {
        Integer empresaId = session.getEmpresa().getIdEmpresa();
        List<MovimientoCajaEntity> movimientos = movimientoCajaRepository
                .findByCajaSesion_IdCajaSesionAndEmpresa_IdEmpresa(session.getIdCajaSesion(), empresaId);
        List<VentasEntity> ventas = ventasRepository
                .findByCajaSesion_IdCajaSesionAndEmpresa_IdEmpresa(session.getIdCajaSesion(), empresaId);

        CajaCierrePreviewDTO dto = new CajaCierrePreviewDTO();
        dto.setSessionId(session.getIdCajaSesion());
        dto.setOpenedAt(session.getOpenedAt());
        dto.setResponsibleUser(toUserInfo(session.getOpenedByUser()));
        dto.setOpeningBalanceSnapshot(scale(session.getOpeningBalanceSnapshot()));
        dto.setCashSalesAmount(scale(sumMovements(movimientos, MovimientoCajaTipo.CASH_SALE.name())));
        dto.setCardSalesAmount(scale(sumSalesByMethod(ventas, PaymentFamily.CARD)
                .add(sumSalesByMethod(ventas, PaymentFamily.TRANSFER))));
        dto.setManualEntriesAmount(scale(sumMovements(movimientos, MovimientoCajaTipo.MANUAL_ENTRY.name())));
        dto.setManualWithdrawalsAmount(scale(sumMovements(movimientos, MovimientoCajaTipo.MANUAL_WITHDRAWAL.name())));
        dto.setCashRefundsAmount(scale(sumMovements(movimientos, MovimientoCajaTipo.CASH_REFUND.name())));
        dto.setTotalSalesAmount(scale(sumSalesByMethod(ventas, PaymentFamily.ANY)));
        dto.setExpectedCashAmount(scale(expected));
        dto.setCountedCashAmount(scale(counted));
        dto.setDifferenceAmount(scale(difference));
        dto.setDiscrepancyReasonRequired(difference.signum() != 0);
        dto.setExpectedBalanceViewedBeforeCount(Boolean.TRUE.equals(session.getExpectedBalanceViewedBeforeCount()));
        dto.setSalesCount(ventas.size());
        dto.setResult(difference.signum() == 0 ? "EXACT" : difference.signum() > 0 ? "OVERAGE" : "SHORTAGE");
        dto.setPolicyApplied(policy.getHandoffPolicy().name());
        return dto;
    }

    private CajaCierreResultadoDTO buildClosingResult(CajaSesionEntity session, MovimientoCajaEntity movement,
            CajaIncidenciaEntity incident, ConfiguracionCajaEntity policy) {
        BigDecimal expected = scale(session.getClosingExpectedCashAmount() != null
                ? session.getClosingExpectedCashAmount()
                : session.getExpectedCashAmount());
        BigDecimal counted = scale(session.getCountedCashAmount() != null
                ? session.getCountedCashAmount()
                : session.getExpectedCashAmount());
        BigDecimal difference = scale(session.getDifferenceAmount() != null
                ? session.getDifferenceAmount()
                : counted.subtract(expected));
        CajaCierreResultadoDTO dto = new CajaCierreResultadoDTO();
        dto.setSessionId(session.getIdCajaSesion());
        dto.setOpeningBalanceSnapshot(scale(session.getOpeningBalanceSnapshot()));
        dto.setExpectedCashAmount(expected);
        dto.setCountedCashAmount(counted);
        dto.setDifferenceAmount(difference);
        dto.setFinalBalance(movement != null ? scale(movement.getBalanceAfter()) : counted);
        dto.setMovementId(movement != null ? movement.getIdMovimientoCaja() : null);
        dto.setIncidentId(incident != null ? incident.getIdCajaIncidencia() : null);
        dto.setExpectedBalanceViewedBeforeCount(Boolean.TRUE.equals(session.getExpectedBalanceViewedBeforeCount()));
        dto.setClosedAt(session.getClosedAt());
        dto.setPolicyApplied(policy.getHandoffPolicy().name());
        dto.setResult(difference.signum() == 0 ? "EXACT" : difference.signum() > 0 ? "OVERAGE" : "SHORTAGE");
        return dto;
    }

    private BigDecimal sumSalesByMethod(List<VentasEntity> ventas, PaymentFamily family) {
        return ventas.stream()
                .filter(v -> family == PaymentFamily.ANY || family.matches(v.getMetodoPago().getNombreMetodoPago()))
                .map(v -> BigDecimal.valueOf(v.getTotal()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumElectronicSalesWithoutMovement(List<VentasEntity> ventas,
            List<MovimientoCajaEntity> movimientos) {
        Set<String> coveredSaleIds = movimientos.stream()
                .filter(movement -> MovimientoCajaTipo.CARD_ENTRY.name().equalsIgnoreCase(movement.getTipo()))
                .filter(movement -> "SALE".equalsIgnoreCase(movement.getReferenceType()))
                .map(MovimientoCajaEntity::getReferenceId)
                .filter(value -> value != null && !value.isBlank())
                .collect(java.util.stream.Collectors.toSet());

        return ventas.stream()
                .filter(venta -> PaymentFamily.CARD.matches(venta.getMetodoPago().getNombreMetodoPago())
                        || PaymentFamily.TRANSFER.matches(venta.getMetodoPago().getNombreMetodoPago()))
                .filter(venta -> !coveredSaleIds.contains(String.valueOf(venta.getIdVenta())))
                .map(venta -> BigDecimal.valueOf(venta.getTotal()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal scale(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private EmpresasEntity empresaRef(Integer empresaId) {
        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(empresaId);
        return empresa;
    }

    private enum PaymentFamily {
        ANY {
            @Override
            boolean matches(String methodName) {
                return true;
            }
        },
        CARD {
            @Override
            boolean matches(String methodName) {
                String normalized = normalizePayment(methodName);
                return normalized.contains("tarjeta") || normalized.contains("credito")
                        || normalized.contains("debito") || normalized.contains("terminal")
                        || normalized.contains("mercado pago");
            }
        },
        TRANSFER {
            @Override
            boolean matches(String methodName) {
                String normalized = normalizePayment(methodName);
                return normalized.contains("transfer") || normalized.contains("spei");
            }
        };

        abstract boolean matches(String methodName);
    }

    private static String normalizePayment(String methodName) {
        return methodName == null ? "" : methodName.trim().toLowerCase(Locale.ROOT);
    }

    private record ResolvedInstallation(LocalDeviceEntity device, String errorCode, String message) {}
}
