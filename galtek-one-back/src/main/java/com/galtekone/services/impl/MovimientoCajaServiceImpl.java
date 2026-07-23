package com.galtekone.services.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.dto.caja.CajaEstadoActualDTO;
import com.galtekone.dto.movimientoCaja.BalanceCajaDTO;
import com.galtekone.dto.movimientoCaja.MovimientoCajaDTO;
import com.galtekone.entity.CajaSesionEntity;
import com.galtekone.entity.CajasEntity;
import com.galtekone.entity.MovimientoCajaEntity;
import com.galtekone.entity.MovimientoCajaTipo;
import com.galtekone.entity.UsuariosEntity;
import com.galtekone.entity.VentasEntity;
import com.galtekone.repository.CajasRepository;
import com.galtekone.repository.DevolucionesRepository;
import com.galtekone.repository.MovimientoCajaRepository;
import com.galtekone.repository.UsuariosRepository;
import com.galtekone.repository.VentasRepository;
import com.galtekone.services.CajaSaldoService;
import com.galtekone.services.CajaSesionService;
import com.galtekone.services.MovimientoCajaService;
import com.galtekone.utils.EmpresaValidator;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;

@Service
public class MovimientoCajaServiceImpl implements MovimientoCajaService {

    @Autowired
    private MovimientoCajaRepository movimientoCajaRepository;

    @Autowired
    private CajasRepository cajasRepository;

    @Autowired
    private VentasRepository ventasRepository;

    @Autowired
    private DevolucionesRepository devolucionesRepository;

    @Autowired
    private EmpresaValidator empresaValidator;

    @Autowired
    private UsuariosRepository usuariosRepository;

    @Autowired
    private CajaSesionService cajaSesionService;

    @Autowired
    private CajaSaldoService cajaSaldoService;

    @Override
    @Transactional
    public MovimientoCajaEntity create(MovimientoCajaEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        Integer legacyCajaId = obj.getCaja() != null ? obj.getCaja().getIdCaja() : null;
        CajaSesionEntity session = cajaSesionService.requireOpenSessionForCurrentInstallation(user, legacyCajaId);

        com.galtekone.entity.UsuariosEntity usuario = usuariosRepository
                .findByUsuarioAndEmpresa_IdEmpresa(user, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

        MovimientoCajaTipo type = MovimientoCajaTipo.valueOf(normalizeManualMovementType(obj.getTipo()));
        String direction = type == MovimientoCajaTipo.MANUAL_ENTRY ? "IN" : "OUT";
        String fallbackCategory = type == MovimientoCajaTipo.MANUAL_ENTRY ? "OTHER_ENTRY" : "OTHER_WITHDRAWAL";

        return cajaSaldoService.registrarMovimientoContinuo(
                session.getLocalDevice(),
                session,
                usuario,
                type,
                direction,
                obj.getMonto(),
                obj.getCategory() != null ? obj.getCategory() : fallbackCategory,
                obj.getMotivo(),
                obj.getReferenceType(),
                obj.getReferenceId(),
                obj.getIdempotencyKey(),
                user);
    }

    @Override
    public List<MovimientoCajaEntity> read(Specification<MovimientoCajaEntity> specs) {
        return movimientoCajaRepository.findAll(baseSpec(specs));
    }

    @Override
    @Transactional
    public List<MovimientoCajaDTO> readDTO(Specification<MovimientoCajaEntity> specs) {
        List<MovimientoCajaEntity> entities = this.read(specs);
        return entities.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Page<MovimientoCajaDTO> readDTOPage(Specification<MovimientoCajaEntity> specs, Pageable pageable) {
        return movimientoCajaRepository.findAll(baseSpec(specs), pageable).map(this::toDTO);
    }

    @Override
    @Transactional
    public MovimientoCajaEntity update(MovimientoCajaEntity obj, String user) {
        throw new IllegalStateException("Los movimientos de caja son historicos e inmutables.");
    }

    @Override
    public MovimientoCajaEntity delete(Integer id, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        movimientoCajaRepository
                .findByIdMovimientoCajaAndEmpresa_IdEmpresa(id, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Movimiento no encontrado"));
        throw new IllegalStateException("Los movimientos de caja no se eliminan fisicamente.");
    }

    @Override
    public BalanceCajaDTO getBalanceCaja(Integer idCaja, LocalDateTime desde, LocalDateTime hasta) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        CajasEntity caja = empresaValidator.validarEntidadPorEmpresa(
                idCaja, empresaId, "Caja",
                cajasRepository::findByIdCajaAndEmpresa_IdEmpresa);

        List<MovimientoCajaEntity> movimientos = movimientoCajaRepository
                .findByCaja_IdCajaAndEmpresa_IdEmpresaAndFechaBetween(idCaja, empresaId, desde, hasta);

        BigDecimal totalIngresos = movimientos.stream()
                .filter(m -> movementIncreasesCash(m))
                .map(MovimientoCajaEntity::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalEgresos = movimientos.stream()
                .filter(m -> movementDecreasesCash(m))
                .map(MovimientoCajaEntity::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Specification<VentasEntity> ventasSpec = (root, query, cb) -> cb.and(
                cb.equal(root.get("empresa").get("idEmpresa"), empresaId),
                cb.equal(root.get("caja").get("idCaja"), idCaja),
                cb.between(root.get("fechaCreacion"), desde, hasta),
                cb.equal(cb.lower(root.get("metodoPago").get("nombreMetodoPago")), "efectivo"));
        List<VentasEntity> ventasEfectivo = ventasRepository.findAll(ventasSpec);
        BigDecimal totalVentasEfectivo = ventasEfectivo.stream()
                .map(v -> BigDecimal.valueOf(v.getTotal()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalDevoluciones = BigDecimal.ZERO;
        try {
            Specification<com.galtekone.entity.DevolucionesEntity> devSpec = (root, query, cb) -> cb.and(
                    cb.equal(root.get("empresa").get("idEmpresa"), empresaId),
                    cb.equal(root.get("venta").get("caja").get("idCaja"), idCaja),
                    cb.between(root.get("fechaCreacion"), desde, hasta));
            totalDevoluciones = devolucionesRepository.findAll(devSpec).stream()
                    .map(com.galtekone.entity.DevolucionesEntity::getTotalDevolucion)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        } catch (Exception e) {
            totalDevoluciones = BigDecimal.ZERO;
        }

        BigDecimal saldoFinal = totalIngresos
                .add(totalVentasEfectivo)
                .subtract(totalEgresos)
                .subtract(totalDevoluciones);

        BalanceCajaDTO dto = new BalanceCajaDTO();
        dto.setIdCaja(caja.getIdCaja());
        dto.setNombreCaja(caja.getNombreCaja());
        dto.setTotalIngresos(totalIngresos.setScale(2, RoundingMode.HALF_UP));
        dto.setTotalEgresos(totalEgresos.setScale(2, RoundingMode.HALF_UP));
        dto.setTotalVentasEfectivo(totalVentasEfectivo.setScale(2, RoundingMode.HALF_UP));
        dto.setTotalDevoluciones(totalDevoluciones.setScale(2, RoundingMode.HALF_UP));
        dto.setSaldoFinal(saldoFinal.setScale(2, RoundingMode.HALF_UP));
        dto.setDesde(desde);
        dto.setHasta(hasta);

        return dto;
    }

    private MovimientoCajaDTO toDTO(MovimientoCajaEntity entity) {
        MovimientoCajaDTO dto = new MovimientoCajaDTO();
        dto.setIdMovimientoCaja(entity.getIdMovimientoCaja());
        if (entity.getCaja() != null) {
            dto.setIdCaja(entity.getCaja().getIdCaja());
            dto.setNombreCaja(entity.getCaja().getNombreCaja());
        }
        if (entity.getUsuario() != null) {
            dto.setIdUsuario(entity.getUsuario().getIdUsuario());
        }
        if (entity.getCajaSesion() != null) {
            CajaSesionEntity session = entity.getCajaSesion();
            dto.setIdCajaSesion(session.getIdCajaSesion());
            dto.setSessionOpenedAt(session.getOpenedAt());
            dto.setSessionClosedAt(session.getClosedAt());
            dto.setSessionResponsibleUser(toUserInfo(session.getOpenedByUser()));
        }
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

    private String normalizeManualMovementType(String type) {
        String normalized = type == null ? "" : type.trim().toUpperCase();
        return switch (normalized) {
            case "INGRESO", "MANUAL_ENTRY" -> MovimientoCajaTipo.MANUAL_ENTRY.name();
            case "EGRESO", "MANUAL_WITHDRAWAL" -> MovimientoCajaTipo.MANUAL_WITHDRAWAL.name();
            default -> throw new IllegalArgumentException(
                    "Solo se permiten entradas y retiros manuales desde este endpoint.");
        };
    }

    private boolean movementIncreasesCash(MovimientoCajaEntity movement) {
        if ("IN".equalsIgnoreCase(movement.getFinancialDirection())) {
            return true;
        }
        return movement.getFinancialDirection() == null && MovimientoCajaTipo.increasesCash(movement.getTipo());
    }

    private boolean movementDecreasesCash(MovimientoCajaEntity movement) {
        if ("OUT".equalsIgnoreCase(movement.getFinancialDirection())) {
            return true;
        }
        return movement.getFinancialDirection() == null && MovimientoCajaTipo.decreasesCash(movement.getTipo());
    }

    private Specification<MovimientoCajaEntity> baseSpec(Specification<MovimientoCajaEntity> specs) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        Specification<MovimientoCajaEntity> filtroEmpresa = (root, query, cb) -> cb
                .equal(root.get("empresa").get("idEmpresa"), empresaId);
        Specification<MovimientoCajaEntity> activos = (root, query, cb) -> cb
                .isTrue(root.get("estatus"));
        Specification<MovimientoCajaEntity> historialVisible = (root, query, cb) -> cb.not(cb.and(
                root.get("tipo").in(MovimientoCajaTipo.OPENING.name(), MovimientoCajaTipo.INITIAL_BALANCE.name()),
                cb.equal(root.get("monto"), BigDecimal.ZERO)));
        return Specification.where(specs).and(filtroEmpresa).and(activos).and(historialVisible);
    }
}
