package com.galtekone.services.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.dto.caja.CajaEstadoActualDTO;
import com.galtekone.dto.caja.CajaSaldoInicializarRequestDTO;
import com.galtekone.dto.caja.CajaSaldoMovimientoRequestDTO;
import com.galtekone.dto.caja.CajaSaldoResumenDTO;
import com.galtekone.dto.movimientoCaja.MovimientoCajaDTO;
import com.galtekone.entity.CajaSesionEntity;
import com.galtekone.entity.CajaSesionStatus;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.LocalDeviceEntity;
import com.galtekone.entity.MovimientoCajaEntity;
import com.galtekone.entity.MovimientoCajaTipo;
import com.galtekone.entity.SaldoEfectivoEntity;
import com.galtekone.entity.UsuariosEntity;
import com.galtekone.repository.CajaSesionRepository;
import com.galtekone.repository.LocalDeviceRepository;
import com.galtekone.repository.MovimientoCajaRepository;
import com.galtekone.repository.SaldoEfectivoRepository;
import com.galtekone.repository.UsuariosRepository;
import com.galtekone.services.CajaPermisosResolver;
import com.galtekone.services.CajaSaldoService;
import com.galtekone.services.CajaSesionStateMachine;
import com.galtekone.utils.CajaOperacionException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CajaSaldoServiceImpl implements CajaSaldoService {

    private static final Set<String> INITIAL_CATEGORIES = Set.of(
            "INITIAL_OWNER_INVESTMENT",
            "INITIAL_CHANGE_FUND",
            "TRANSFER_FROM_ANOTHER_LOCATION",
            "OTHER_INITIAL_BALANCE",
            "BALANCE_MIGRATION");

    private static final Set<String> ENTRY_CATEGORIES = Set.of(
            "OWNER_INVESTMENT",
            "CHANGE_FUND",
            "CASH_RETURNED",
            "OTHER_ENTRY");

    private static final Set<String> WITHDRAWAL_CATEGORIES = Set.of(
            "OWNER_WITHDRAWAL",
            "BANK_DEPOSIT",
            "STORE_EXPENSE",
            "EXCESS_CASH_REMOVAL",
            "OTHER_WITHDRAWAL");

    private final SaldoEfectivoRepository saldoEfectivoRepository;
    private final MovimientoCajaRepository movimientoCajaRepository;
    private final CajaSesionRepository cajaSesionRepository;
    private final LocalDeviceRepository localDeviceRepository;
    private final UsuariosRepository usuariosRepository;
    private final CajaSesionStateMachine stateMachine;
    private final CajaPermisosResolver permisosResolver;

    @Override
    @Transactional
    public CajaSaldoResumenDTO inicializar(CajaSaldoInicializarRequestDTO request, String user) {
        Integer empresaId = requireEmpresaId();
        UsuariosEntity usuario = findUsuario(user, empresaId);
        LocalDeviceEntity device = lockAndPrepareDevice(resolveInstallation(true), empresaId);
        BigDecimal amount = normalizeAmount(request != null ? request.getAmount() : null, true, "monto inicial");
        String category = normalizeCategory(request != null ? request.getCategory() : null, INITIAL_CATEGORIES,
                "categoria inicial");
        String reason = normalizeReason(request != null ? request.getReason() : null);
        String idempotencyKey = normalizeIdempotencyKey(request != null ? request.getIdempotencyKey() : null);

        var processedMovement = movimientoCajaRepository
                .findByIdempotencyKeyAndEmpresa_IdEmpresaAndEstatusTrue(idempotencyKey, empresaId);
        if (processedMovement.isPresent()) {
            return buildResumen(device, saldoEfectivoRepository
                    .findByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndEstatusTrue(
                            device.getInstallationId(), empresaId)
                    .orElseThrow(() -> new CajaOperacionException("CASH_BALANCE_NOT_INITIALIZED",
                            "El saldo inicial aun no existe para esta instalacion.", HttpStatus.CONFLICT)),
                    canViewExpectedBalance(usuario));
        }

        SaldoEfectivoEntity saldo = saldoEfectivoRepository
                .findByDeviceAndEmpresaForUpdate(device.getInstallationId(), empresaId)
                .orElseGet(() -> createUninitializedBalance(device, empresaId, user));

        if (Boolean.TRUE.equals(saldo.getInitialized())) {
            throw new CajaOperacionException("CASH_BALANCE_ALREADY_INITIALIZED",
                    "El saldo inicial de esta instalacion ya fue configurado.", HttpStatus.CONFLICT);
        }

        LocalDateTime now = LocalDateTime.now();
        EmpresasEntity empresa = empresaRef(empresaId);

        MovimientoCajaEntity movement = new MovimientoCajaEntity();
        movement.setLocalDevice(device);
        movement.setUsuario(usuario);
        movement.setTipo(MovimientoCajaTipo.INITIAL_BALANCE.name());
        movement.setFinancialDirection(amount.signum() == 0 ? "NONE" : "IN");
        movement.setMonto(amount);
        movement.setCategory(category);
        movement.setMotivo(reason);
        movement.setReferenceType("CASH_BALANCE");
        movement.setReferenceId(device.getInstallationId());
        movement.setIdempotencyKey(idempotencyKey);
        movement.setBalanceBefore(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        movement.setBalanceAfter(amount);
        movement.setFecha(now);
        movement.setEmpresa(empresa);
        movement.setUsuarioCreacion(user);
        movimientoCajaRepository.save(movement);

        saldo.setCurrentBalanceSnapshot(amount);
        saldo.setInitialized(true);
        saldo.setInitializedAt(now);
        saldo.setInitializedBy(usuario);
        saldo.setInitializationCategory(category);
        saldo.setInitializationReason(reason);
        saldo.setInitializationIdempotencyKey(idempotencyKey);
        saldo.setLastMovementAt(now);
        saldo.setUsuarioModificacion(user);
        saldoEfectivoRepository.save(saldo);

        return buildResumen(device, saldo, canViewExpectedBalance(usuario));
    }

    @Override
    @Transactional(readOnly = true)
    public CajaSaldoResumenDTO getResumen(String user) {
        Integer empresaId = requireEmpresaId();
        UsuariosEntity usuario = findUsuario(user, empresaId);
        LocalDeviceEntity device = resolveInstallation(true);
        SaldoEfectivoEntity saldo = saldoEfectivoRepository
                .findByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndEstatusTrue(
                        device.getInstallationId(), empresaId)
                .orElse(null);
        return buildResumen(device, saldo, canViewExpectedBalance(usuario));
    }

    @Override
    @Transactional
    public MovimientoCajaDTO registrarEntrada(CajaSaldoMovimientoRequestDTO request, String user) {
        Integer empresaId = requireEmpresaId();
        UsuariosEntity usuario = findUsuario(user, empresaId);
        if (!permisosResolver.hasAny(usuario, "CASH_MOVEMENT_ENTRY", "CAJA_ENTRADA_EFECTIVO")) {
            throw new CajaOperacionException("CASH_ENTRY_FORBIDDEN",
                    "El usuario no tiene permiso para registrar entradas de efectivo.", HttpStatus.FORBIDDEN);
        }
        MovimientoCajaTipo type = isElectronicRequest(request) ? MovimientoCajaTipo.CARD_ENTRY : MovimientoCajaTipo.MANUAL_ENTRY;
        return toDTO(registrarManual(request, user, usuario, empresaId, type, "IN",
                ENTRY_CATEGORIES, "entrada"));
    }

    @Override
    @Transactional
    public MovimientoCajaDTO registrarRetiro(CajaSaldoMovimientoRequestDTO request, String user) {
        Integer empresaId = requireEmpresaId();
        UsuariosEntity usuario = findUsuario(user, empresaId);
        if (!permisosResolver.hasAny(usuario, "CASH_MOVEMENT_WITHDRAWAL", "CAJA_RETIRO_EFECTIVO")) {
            throw new CajaOperacionException("CASH_WITHDRAWAL_FORBIDDEN",
                    "El usuario no tiene permiso para registrar retiros de efectivo.", HttpStatus.FORBIDDEN);
        }
        MovimientoCajaTipo type = isElectronicRequest(request) ? MovimientoCajaTipo.CARD_WITHDRAWAL : MovimientoCajaTipo.MANUAL_WITHDRAWAL;
        return toDTO(registrarManual(request, user, usuario, empresaId, type, "OUT",
                WITHDRAWAL_CATEGORIES, "retiro"));
    }

    @Override
    @Transactional(readOnly = true)
    public SaldoEfectivoEntity requireInitializedBalance(LocalDeviceEntity device, Integer empresaId) {
        return saldoEfectivoRepository
                .findByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndEstatusTrue(
                        device.getInstallationId(), empresaId)
                .filter(saldo -> Boolean.TRUE.equals(saldo.getInitialized()))
                .orElseThrow(() -> new CajaOperacionException("CASH_BALANCE_NOT_INITIALIZED",
                        "Configura el saldo inicial antes de operar caja.", HttpStatus.CONFLICT));
    }

    @Override
    @Transactional
    public MovimientoCajaEntity registrarMovimientoContinuo(LocalDeviceEntity device, CajaSesionEntity session,
            UsuariosEntity usuario, MovimientoCajaTipo tipo, String financialDirection, BigDecimal amount,
            String category, String reason, String referenceType, String referenceId, String idempotencyKey,
            String user) {
        Integer empresaId = requireEmpresaId();
        String normalizedKey = idempotencyKey == null || idempotencyKey.isBlank()
                ? null
                : normalizeIdempotencyKey(idempotencyKey);
        if (normalizedKey != null) {
            var processed = movimientoCajaRepository
                    .findByIdempotencyKeyAndEmpresa_IdEmpresaAndEstatusTrue(normalizedKey, empresaId);
            if (processed.isPresent()) {
                return processed.get();
            }
        }

        LocalDeviceEntity targetDevice = device != null ? device : session.getLocalDevice();
        SaldoEfectivoEntity saldo = saldoEfectivoRepository
                .findByDeviceAndEmpresaForUpdate(targetDevice.getInstallationId(), empresaId)
                .filter(item -> Boolean.TRUE.equals(item.getInitialized()))
                .orElseThrow(() -> new CajaOperacionException("CASH_BALANCE_NOT_INITIALIZED",
                        "Configura el saldo inicial antes de registrar movimientos.", HttpStatus.CONFLICT));

        BigDecimal normalizedAmount = normalizeAmount(amount, MovimientoCajaTipo.allowsZeroAmount(tipo.name()),
                "monto");
        String direction = normalizeDirection(tipo, financialDirection);
        BigDecimal before = scale(saldo.getCurrentBalanceSnapshot());
        boolean affectsCash = MovimientoCajaTipo.affectsCash(tipo.name());
        BigDecimal impact = affectsCash
                ? switch (direction) {
                    case "IN" -> normalizedAmount;
                    case "OUT" -> normalizedAmount.negate();
                    default -> BigDecimal.ZERO;
                }
                : BigDecimal.ZERO;
        BigDecimal after = scale(before.add(impact));
        if (after.signum() < 0) {
            throw new IllegalArgumentException("El movimiento no puede dejar efectivo esperado negativo.");
        }

        LocalDateTime now = LocalDateTime.now();
        MovimientoCajaEntity movement = new MovimientoCajaEntity();
        movement.setLocalDevice(targetDevice);
        movement.setCajaSesion(session);
        movement.setCaja(session != null ? session.getCaja() : null);
        movement.setUsuario(usuario);
        movement.setTipo(typeName(tipo));
        movement.setFinancialDirection(direction);
        movement.setMonto(normalizedAmount);
        movement.setCategory(normalizeOptional(category));
        movement.setMotivo(normalizeReason(reason));
        movement.setReferenceType(normalizeOptional(referenceType));
        movement.setReferenceId(normalizeReferenceId(referenceId));
        movement.setIdempotencyKey(normalizedKey);
        movement.setBalanceBefore(before);
        movement.setBalanceAfter(after);
        movement.setFecha(now);
        movement.setEmpresa(empresaRef(empresaId));
        movement.setUsuarioCreacion(user);
        MovimientoCajaEntity saved = movimientoCajaRepository.save(movement);

        saldo.setCurrentBalanceSnapshot(after);
        saldo.setLastMovementAt(now);
        saldo.setUsuarioModificacion(user);
        saldoEfectivoRepository.save(saldo);

        if (session != null && affectsCash) {
            session.setExpectedCashAmount(after);
            session.setLastActivityAt(now);
            session.setUsuarioModificacion(user);
            cajaSesionRepository.save(session);
        } else if (session != null) {
            session.setLastActivityAt(now);
            session.setUsuarioModificacion(user);
            cajaSesionRepository.save(session);
        }

        return saved;
    }

    private MovimientoCajaEntity registrarManual(CajaSaldoMovimientoRequestDTO request, String user,
            UsuariosEntity usuario, Integer empresaId, MovimientoCajaTipo type, String direction,
            Set<String> allowedCategories, String label) {
        LocalDeviceEntity device = resolveInstallation(true);
        CajaSesionEntity session = cajaSesionRepository
                .findFirstByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndStatusInAndEstatusTrueOrderByOpenedAtDesc(
                        device.getInstallationId(), empresaId, stateMachine.activeStatuses())
                .orElseThrow(() -> new CajaOperacionException("CASH_SESSION_REQUIRED",
                        "Abre un turno de caja antes de registrar " + label + " de efectivo.", HttpStatus.CONFLICT));
        if (session.getStatus() != CajaSesionStatus.OPEN
                || !session.getOpenedByUser().getIdUsuario().equals(usuario.getIdUsuario())) {
            throw new CajaOperacionException("CASH_SESSION_OWNED_BY_OTHER",
                    "El movimiento debe registrarlo el usuario responsable del turno abierto.",
                    HttpStatus.FORBIDDEN);
        }

        BigDecimal amount = normalizeAmount(request != null ? request.getAmount() : null, false, "monto");
        String category = normalizeCategory(request != null ? request.getCategory() : null, allowedCategories,
                "categoria");
        String reason = normalizeReason(request != null ? request.getReason() : null);
        String referenceId = normalizeReferenceId(request != null ? request.getReferenceId() : null);
        String referenceType = referenceId == null
                ? "CASH_SESSION"
                : firstNonBlank(request != null ? request.getReferenceType() : null,
                        MovimientoCajaTipo.isElectronic(type.name()) ? "BANK_ACCOUNT" : "DESTINATION_ACCOUNT");
        String idempotencyKey = normalizeIdempotencyKey(request != null ? request.getIdempotencyKey() : null);
        return registrarMovimientoContinuo(device, session, usuario, type, direction, amount, category, reason,
                referenceType, referenceId == null ? String.valueOf(session.getIdCajaSesion()) : referenceId,
                idempotencyKey, user);
    }

    private SaldoEfectivoEntity createUninitializedBalance(LocalDeviceEntity device, Integer empresaId, String user) {
        SaldoEfectivoEntity saldo = new SaldoEfectivoEntity();
        saldo.setLocalDevice(device);
        saldo.setEmpresa(empresaRef(empresaId));
        saldo.setCurrentBalanceSnapshot(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        saldo.setInitialized(false);
        saldo.setUsuarioCreacion(user);
        return saldoEfectivoRepository.saveAndFlush(saldo);
    }

    private LocalDeviceEntity resolveInstallation(boolean throwOnError) {
        LocalDeviceEntity device = localDeviceRepository.findFirstByOrderByCreatedAtAsc().orElse(null);
        if (device == null) {
            return resolveError("CASH_DEVICE_IDENTITY_MISSING",
                    "No se encontro identidad local de instalacion.", throwOnError, HttpStatus.CONFLICT);
        }
        if (device.getLicenseToken() == null || device.getLicenseToken().isBlank()) {
            return resolveError("CASH_DEVICE_ACTIVATION_REQUIRED",
                    "La instalacion no esta activada.", throwOnError, HttpStatus.CONFLICT);
        }
        return device;
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

    private LocalDeviceEntity resolveError(String code, String message, boolean throwOnError, HttpStatus status) {
        if (throwOnError) {
            throw new CajaOperacionException(code, message, status);
        }
        return null;
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

    private String normalizeCategory(String value, Set<String> allowed, String label) {
        String normalized = normalizeOptional(value);
        if (normalized == null || !allowed.contains(normalized)) {
            throw new IllegalArgumentException("La " + label + " no es valida.");
        }
        return normalized;
    }

    private String normalizeReason(String value) {
        String reason = value == null ? "" : value.trim();
        if (reason.isBlank()) {
            throw new IllegalArgumentException("El motivo es obligatorio.");
        }
        if (reason.length() > 500) {
            throw new IllegalArgumentException("El motivo no puede superar 500 caracteres.");
        }
        return reason;
    }

    private BigDecimal normalizeAmount(BigDecimal amount, boolean allowZero, String label) {
        if (amount == null) {
            throw new IllegalArgumentException("El " + label + " es obligatorio.");
        }
        if (amount.signum() < 0 || (!allowZero && amount.signum() == 0)) {
            throw new IllegalArgumentException("El " + label + (allowZero ? " no puede ser negativo." : " debe ser mayor a cero."));
        }
        if (amount.stripTrailingZeros().scale() > 2) {
            throw new IllegalArgumentException("El " + label + " no puede tener mas de dos decimales.");
        }
        return scale(amount);
    }

    private String normalizeIdempotencyKey(String value) {
        String key = value == null ? "" : value.trim();
        if (key.length() < 8 || key.length() > 120) {
            throw new IllegalArgumentException("La llave de idempotencia es requerida y debe medir entre 8 y 120 caracteres.");
        }
        return key;
    }

    private String normalizeDirection(MovimientoCajaTipo type, String requested) {
        if (!MovimientoCajaTipo.requiresExplicitDirection(type.name())) {
            if (MovimientoCajaTipo.increasesCash(type.name())) {
                return "IN";
            }
            if (MovimientoCajaTipo.decreasesCash(type.name())) {
                return "OUT";
            }
        }
        String direction = normalizeOptional(requested);
        if (!"IN".equals(direction) && !"OUT".equals(direction) && !"NONE".equals(direction)) {
            throw new IllegalArgumentException("La direccion financiera no es valida.");
        }
        return direction;
    }

    private boolean isElectronicRequest(CajaSaldoMovimientoRequestDTO request) {
        String medium = request == null ? "" : normalizeOptional(request.getMovementMedium());
        return "CARD".equals(medium)
                || "TARJETA".equals(medium)
                || "ELECTRONIC".equals(medium)
                || "ELECTRONICO".equals(medium);
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized.toUpperCase(Locale.ROOT);
    }

    private String normalizeReferenceId(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.isBlank()) {
            return null;
        }
        if (normalized.length() > 80) {
            throw new IllegalArgumentException("La referencia de destino no puede superar 80 caracteres.");
        }
        return normalized;
    }

    private String firstNonBlank(String value, String fallback) {
        String normalized = value == null ? "" : value.trim();
        return normalized.isBlank() ? fallback : normalized;
    }

    private CajaSaldoResumenDTO buildResumen(LocalDeviceEntity device, SaldoEfectivoEntity saldo,
            boolean includeCurrentBalance) {
        CajaSaldoResumenDTO dto = new CajaSaldoResumenDTO();
        dto.setStation(toStationInfo(device));
        if (saldo == null) {
            dto.setInitialized(false);
            dto.setCurrentBalance(null);
            dto.setCurrentBalanceVisible(false);
            return dto;
        }
        dto.setInitialized(Boolean.TRUE.equals(saldo.getInitialized()));
        dto.setCurrentBalance(includeCurrentBalance ? scale(saldo.getCurrentBalanceSnapshot()) : null);
        dto.setCurrentBalanceVisible(includeCurrentBalance);
        dto.setInitializedAt(saldo.getInitializedAt());
        dto.setInitializedBy(toUserInfo(saldo.getInitializedBy()));
        dto.setInitializationCategory(saldo.getInitializationCategory());
        dto.setLastMovementAt(saldo.getLastMovementAt());
        return dto;
    }

    private boolean canViewExpectedBalance(UsuariosEntity usuario) {
        return permisosResolver.hasAny(usuario, "CASH_VIEW_EXPECTED_BALANCE", "CAJA_VER_ARQUEO");
    }

    private MovimientoCajaDTO toDTO(MovimientoCajaEntity entity) {
        MovimientoCajaDTO dto = new MovimientoCajaDTO();
        dto.setIdMovimientoCaja(entity.getIdMovimientoCaja());
        if (entity.getCajaSesion() != null) {
            CajaSesionEntity session = entity.getCajaSesion();
            dto.setIdCajaSesion(session.getIdCajaSesion());
            dto.setSessionOpenedAt(session.getOpenedAt());
            dto.setSessionClosedAt(session.getClosedAt());
            dto.setSessionResponsibleUser(toUserInfo(session.getOpenedByUser()));
        }
        dto.setIdUsuario(entity.getUsuario() != null ? entity.getUsuario().getIdUsuario() : null);
        dto.setTipo(entity.getTipo());
        dto.setMonto(entity.getMonto());
        dto.setMotivo(entity.getMotivo());
        dto.setCategory(entity.getCategory());
        dto.setFinancialDirection(entity.getFinancialDirection());
        dto.setReferenceType(entity.getReferenceType());
        dto.setReferenceId(entity.getReferenceId());
        dto.setIdempotencyKey(entity.getIdempotencyKey());
        dto.setBalanceBefore(entity.getBalanceBefore());
        dto.setBalanceAfter(entity.getBalanceAfter());
        dto.setFecha(entity.getFecha());
        return dto;
    }

    private CajaEstadoActualDTO.StationInfo toStationInfo(LocalDeviceEntity device) {
        CajaEstadoActualDTO.StationInfo station = new CajaEstadoActualDTO.StationInfo();
        station.setInstallationReference(obfuscateInstallationId(device.getInstallationId()));
        station.setDisplayName(device.getDisplayName() == null || device.getDisplayName().isBlank()
                ? "Punto de venta"
                : device.getDisplayName().trim());
        station.setStatus("ACTIVE");
        return station;
    }

    private CajaEstadoActualDTO.UserInfo toUserInfo(UsuariosEntity user) {
        if (user == null) {
            return null;
        }
        CajaEstadoActualDTO.UserInfo info = new CajaEstadoActualDTO.UserInfo();
        info.setId(user.getIdUsuario());
        info.setUsername(user.getUsuario());
        info.setName(user.getNombreUsuario());
        return info;
    }

    private String obfuscateInstallationId(String installationId) {
        if (installationId == null || installationId.isBlank()) {
            return "sin-identidad";
        }
        String normalized = installationId.trim();
        int size = normalized.length();
        return "inst-" + normalized.substring(Math.max(0, size - Math.min(8, size))).toLowerCase(Locale.ROOT);
    }

    private BigDecimal scale(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private String typeName(MovimientoCajaTipo type) {
        return type.name();
    }

    private EmpresasEntity empresaRef(Integer empresaId) {
        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(empresaId);
        return empresa;
    }
}
