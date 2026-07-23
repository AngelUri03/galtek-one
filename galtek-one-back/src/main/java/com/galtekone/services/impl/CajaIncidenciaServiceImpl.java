package com.galtekone.services.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.dto.caja.CajaEstadoActualDTO;
import com.galtekone.dto.caja.CajaIncidenciaDTO;
import com.galtekone.dto.caja.CajaIncidenciaResolverRequestDTO;
import com.galtekone.entity.CajaIncidenciaEntity;
import com.galtekone.entity.CajaIncidenciaStatus;
import com.galtekone.entity.CajaIncidenciaTipo;
import com.galtekone.entity.CajaSesionEntity;
import com.galtekone.entity.CajaSesionStatus;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.LocalDeviceEntity;
import com.galtekone.entity.MovimientoCajaEntity;
import com.galtekone.entity.MovimientoCajaTipo;
import com.galtekone.entity.UsuariosEntity;
import com.galtekone.repository.CajaIncidenciaRepository;
import com.galtekone.repository.CajaSesionRepository;
import com.galtekone.repository.UsuariosRepository;
import com.galtekone.services.CajaIncidenciaService;
import com.galtekone.services.CajaPermisosResolver;
import com.galtekone.services.CajaSaldoService;
import com.galtekone.utils.CajaOperacionException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CajaIncidenciaServiceImpl implements CajaIncidenciaService {

    private static final Set<CajaIncidenciaStatus> OPEN_STATUSES = Set.of(
            CajaIncidenciaStatus.PENDING_REVIEW,
            CajaIncidenciaStatus.IN_REVIEW);

    private final CajaIncidenciaRepository cajaIncidenciaRepository;
    private final CajaSesionRepository cajaSesionRepository;
    private final UsuariosRepository usuariosRepository;
    private final CajaPermisosResolver permisosResolver;
    private final CajaSaldoService cajaSaldoService;

    @Override
    @Transactional
    public CajaIncidenciaEntity crearIncidencia(CajaIncidenciaTipo type, LocalDeviceEntity device,
            CajaSesionEntity session, MovimientoCajaEntity movement, BigDecimal expectedAmount,
            BigDecimal outgoingDeclaredAmount, BigDecimal incomingDeclaredAmount, BigDecimal acceptedAmount,
            BigDecimal differenceAmount, String outgoingNote, String incomingNote, String policySnapshot,
            String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        CajaIncidenciaEntity entity = new CajaIncidenciaEntity();
        entity.setTipo(type);
        entity.setStatus(CajaIncidenciaStatus.PENDING_REVIEW);
        entity.setLocalDevice(device);
        entity.setCajaSesion(session);
        entity.setMovimientoCaja(movement);
        entity.setExpectedAmount(expectedAmount);
        entity.setOutgoingDeclaredAmount(outgoingDeclaredAmount);
        entity.setIncomingDeclaredAmount(incomingDeclaredAmount);
        entity.setAcceptedAmount(acceptedAmount);
        entity.setDifferenceAmount(differenceAmount);
        entity.setOutgoingNote(outgoingNote);
        entity.setIncomingNote(incomingNote);
        entity.setPolicySnapshot(policySnapshot);
        entity.setEmpresa(empresaRef(empresaId));
        entity.setUsuarioCreacion(user);
        return cajaIncidenciaRepository.save(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CajaIncidenciaDTO> getPendientes(String user) {
        Integer empresaId = requireEmpresaId();
        UsuariosEntity usuario = findUsuario(user, empresaId);
        if (!permisosResolver.hasAny(usuario, "CASH_REVIEW_INCIDENTS", "CASH_RESOLVE_DISCREPANCY",
                "CASH_CLOSE_OTHERS", "CAJA_VER_ARQUEO")) {
            throw new CajaOperacionException("CASH_INCIDENTS_FORBIDDEN",
                    "El usuario no tiene permiso para revisar incidencias de caja.", HttpStatus.FORBIDDEN);
        }
        return cajaIncidenciaRepository
                .findByEmpresa_IdEmpresaAndStatusInAndEstatusTrueOrderByFechaCreacionDesc(empresaId, OPEN_STATUSES)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Override
    @Transactional
    public CajaIncidenciaDTO resolver(Integer id, CajaIncidenciaResolverRequestDTO request, String user) {
        Integer empresaId = requireEmpresaId();
        UsuariosEntity usuario = findUsuario(user, empresaId);
        if (!permisosResolver.hasAny(usuario, "CASH_RESOLVE_DISCREPANCY", "CASH_CLOSE_OTHERS",
                "CAJA_AJUSTAR_DIFERENCIA")) {
            throw new CajaOperacionException("CASH_RESOLVE_FORBIDDEN",
                    "El usuario no tiene permiso para resolver discrepancias de caja.", HttpStatus.FORBIDDEN);
        }
        CajaIncidenciaEntity entity = cajaIncidenciaRepository
                .findByIdCajaIncidenciaAndEmpresa_IdEmpresaAndEstatusTrue(id, empresaId)
                .orElseThrow(() -> new CajaOperacionException("CASH_INCIDENT_NOT_FOUND",
                        "Incidencia no encontrada.", HttpStatus.NOT_FOUND));
        if (entity.getStatus() == CajaIncidenciaStatus.RESOLVED || entity.getStatus() == CajaIncidenciaStatus.DISMISSED) {
            return toDTO(entity);
        }
        String category = request != null ? request.getResolutionCategory() : null;
        String notes = request != null ? request.getResolutionNotes() : null;
        String cashEffect = request != null ? request.getResolutionCashEffect() : null;
        BigDecimal resolutionAmount = request != null ? request.getResolutionAmount() : null;
        String resolutionReference = request != null ? request.getResolutionReference() : null;
        if (category == null || category.isBlank()) {
            throw new IllegalArgumentException("La categoria de resolucion es obligatoria.");
        }
        if (notes == null || notes.isBlank()) {
            throw new IllegalArgumentException("Las notas de resolucion son obligatorias.");
        }
        String normalizedEffect = normalizeResolutionToken(cashEffect, 60, "efecto contable");
        BigDecimal amount = normalizeResolutionAmount(resolutionAmount, entity.getDifferenceAmount());
        String direction = resolutionDirection(normalizedEffect, entity.getDifferenceAmount());
        MovimientoCajaEntity resolutionMovement = null;
        if (!"NONE".equals(direction)) {
            if (amount == null || amount.signum() == 0) {
                throw new IllegalArgumentException("El monto de resolucion debe ser mayor a cero cuando afecta la caja.");
            }
            CajaSesionEntity resolutionSession = findOpenResolutionSession(entity, empresaId);
            resolutionMovement = cajaSaldoService.registrarMovimientoContinuo(
                    entity.getLocalDevice(),
                    resolutionSession,
                    usuario,
                    MovimientoCajaTipo.INCIDENT_ADJUSTMENT,
                    direction,
                    amount,
                    resolutionMovementCategory(normalizedEffect, entity.getDifferenceAmount()),
                    resolutionMovementReason(entity, notes, normalizedEffect),
                    "CASH_INCIDENT",
                    String.valueOf(entity.getIdCajaIncidencia()),
                    "cash-incident-adjust-" + entity.getIdCajaIncidencia() + "-" + normalizeIdempotencySuffix(request),
                    user);
        }
        entity.setStatus(CajaIncidenciaStatus.RESOLVED);
        entity.setResolvedAt(LocalDateTime.now());
        entity.setResolvedBy(usuario);
        entity.setResolutionCategory(normalizeResolutionToken(category, 80, "categoria"));
        entity.setResolutionNotes(notes.trim());
        entity.setResolutionCashEffect(normalizedEffect);
        entity.setResolutionAmount(amount);
        entity.setResolutionReference(normalizeResolutionReference(resolutionReference));
        entity.setResolutionMovement(resolutionMovement);
        entity.setUsuarioModificacion(user);
        return toDTO(cajaIncidenciaRepository.save(entity));
    }

    private CajaSesionEntity findOpenResolutionSession(CajaIncidenciaEntity entity, Integer empresaId) {
        LocalDeviceEntity device = entity != null ? entity.getLocalDevice() : null;
        if (device == null || device.getInstallationId() == null || device.getInstallationId().isBlank()) {
            return null;
        }
        return cajaSesionRepository
                .findFirstByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndStatusInAndEstatusTrueOrderByOpenedAtDesc(
                        device.getInstallationId(), empresaId, Set.of(CajaSesionStatus.OPEN))
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public long countPendingForDevice(String installationId, Integer empresaId) {
        return cajaIncidenciaRepository.countByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndStatusInAndEstatusTrue(
                installationId, empresaId, OPEN_STATUSES);
    }

    private CajaIncidenciaDTO toDTO(CajaIncidenciaEntity entity) {
        CajaIncidenciaDTO dto = new CajaIncidenciaDTO();
        dto.setId(entity.getIdCajaIncidencia());
        dto.setType(entity.getTipo().name());
        dto.setStatus(entity.getStatus().name());
        if (entity.getCajaSesion() != null) {
            CajaSesionEntity session = entity.getCajaSesion();
            dto.setSessionId(session.getIdCajaSesion());
            dto.setSessionOpenedAt(session.getOpenedAt());
            dto.setSessionClosedAt(session.getClosedAt());
            dto.setSessionResponsibleUser(toUserInfo(session.getOpenedByUser()));
        }
        dto.setExpectedAmount(entity.getExpectedAmount());
        dto.setOutgoingDeclaredAmount(entity.getOutgoingDeclaredAmount());
        dto.setIncomingDeclaredAmount(entity.getIncomingDeclaredAmount());
        dto.setAcceptedAmount(entity.getAcceptedAmount());
        dto.setDifferenceAmount(entity.getDifferenceAmount());
        dto.setPolicySnapshot(entity.getPolicySnapshot());
        dto.setCreatedAt(entity.getFechaCreacion());
        dto.setResolvedAt(entity.getResolvedAt());
        dto.setResolvedBy(toUserInfo(entity.getResolvedBy()));
        dto.setResolutionCategory(entity.getResolutionCategory());
        dto.setResolutionNotes(entity.getResolutionNotes());
        dto.setResolutionCashEffect(entity.getResolutionCashEffect());
        dto.setResolutionAmount(entity.getResolutionAmount());
        dto.setResolutionReference(entity.getResolutionReference());
        dto.setResolutionMovementId(entity.getResolutionMovement() != null
                ? entity.getResolutionMovement().getIdMovimientoCaja()
                : null);
        return dto;
    }

    private String normalizeResolutionToken(String value, int maxLength, String label) {
        String token = value == null ? "" : value.trim();
        if (token.isBlank()) {
            return null;
        }
        if (token.length() > maxLength) {
            throw new IllegalArgumentException("El campo " + label + " no puede superar " + maxLength + " caracteres.");
        }
        return token.toUpperCase(Locale.ROOT);
    }

    private BigDecimal normalizeResolutionAmount(BigDecimal value, BigDecimal fallbackDifference) {
        BigDecimal amount = value != null ? value : (fallbackDifference == null ? null : fallbackDifference.abs());
        if (amount == null) {
            return null;
        }
        if (amount.signum() < 0) {
            throw new IllegalArgumentException("El monto de resolucion no puede ser negativo.");
        }
        if (amount.stripTrailingZeros().scale() > 2) {
            throw new IllegalArgumentException("El monto de resolucion no puede tener mas de dos decimales.");
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private String normalizeResolutionReference(String value) {
        String reference = value == null ? "" : value.trim();
        if (reference.isBlank()) {
            return null;
        }
        if (reference.length() > 160) {
            throw new IllegalArgumentException("La referencia de resolucion no puede superar 160 caracteres.");
        }
        return reference;
    }

    private String resolutionDirection(String effect, BigDecimal difference) {
        String normalized = effect == null ? "REPORT_ONLY" : effect;
        int sign = difference == null ? 0 : difference.signum();
        return switch (normalized) {
            case "HISTORICAL_RECOUNT" -> {
                if (sign < 0) {
                    yield "IN";
                }
                if (sign > 0) {
                    yield "OUT";
                }
                yield "NONE";
            }
            case "EXTERNAL_RECOVERY" -> {
                if (sign >= 0) {
                    throw new IllegalArgumentException("La recuperacion del responsable solo aplica a faltantes.");
                }
                yield "IN";
            }
            case "EXTERNAL_RETURN" -> {
                if (sign <= 0) {
                    throw new IllegalArgumentException("La devolucion de sobrante solo aplica a dinero de mas.");
                }
                yield "OUT";
            }
            case "CASH_IN" -> "IN";
            case "CASH_OUT" -> "OUT";
            case "REPORT_ONLY", "NO_CASH_CHANGE" -> "NONE";
            default -> "NONE";
        };
    }

    private String resolutionMovementCategory(String effect, BigDecimal difference) {
        String normalized = effect == null ? "REPORT_ONLY" : effect;
        int sign = difference == null ? 0 : difference.signum();
        if ("HISTORICAL_RECOUNT".equals(normalized)) {
            return sign < 0 ? "INCIDENT_RECOUNT_SHORTAGE_CORRECTION" : "INCIDENT_RECOUNT_OVERAGE_CORRECTION";
        }
        if ("EXTERNAL_RECOVERY".equals(normalized)) {
            return "INCIDENT_RESPONSIBLE_REIMBURSEMENT";
        }
        if ("EXTERNAL_RETURN".equals(normalized)) {
            return "INCIDENT_OVERAGE_RETURN";
        }
        return "INCIDENT_ADJUSTMENT";
    }

    private String resolutionMovementReason(CajaIncidenciaEntity entity, String notes, String effect) {
        String detail = notes == null ? "" : notes.trim();
        String prefix = "Resolucion de incidencia #" + entity.getIdCajaIncidencia();
        String suffix = effect == null ? "" : " (" + effect + ")";
        String reason = prefix + suffix + ": " + detail;
        return reason.length() <= 500 ? reason : reason.substring(0, 500);
    }

    private String normalizeIdempotencySuffix(CajaIncidenciaResolverRequestDTO request) {
        String key = request == null ? "" : String.valueOf(request.getIdempotencyKey()).trim();
        if (key.isBlank() || "null".equalsIgnoreCase(key)) {
            return "sin-llave";
        }
        return key.length() <= 80 ? key : key.substring(0, 80);
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

    private EmpresasEntity empresaRef(Integer empresaId) {
        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(empresaId);
        return empresa;
    }
}
