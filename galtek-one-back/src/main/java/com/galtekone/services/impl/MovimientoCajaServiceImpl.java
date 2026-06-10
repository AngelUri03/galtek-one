package com.galtekone.services.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.dto.movimientoCaja.BalanceCajaDTO;
import com.galtekone.dto.movimientoCaja.MovimientoCajaDTO;
import com.galtekone.entity.CajasEntity;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.MovimientoCajaEntity;
import com.galtekone.entity.VentasEntity;
import com.galtekone.repository.CajasRepository;
import com.galtekone.repository.DevolucionesRepository;
import com.galtekone.repository.MovimientoCajaRepository;
import com.galtekone.repository.VentasRepository;
import com.galtekone.services.MovimientoCajaService;
import com.galtekone.repository.UsuariosRepository;
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

    @Override
    @Transactional
    public MovimientoCajaEntity create(MovimientoCajaEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        CajasEntity caja = empresaValidator.validarEntidadPorEmpresa(
                obj.getCaja().getIdCaja(), empresaId, "Caja",
                cajasRepository::findByIdCajaAndEmpresa_IdEmpresa);

        obj.setCaja(caja);
        EmpresaValidator.asignarEmpresa(obj);

        // Buscar y asignar el usuario real que realiza la acción
        com.galtekone.entity.UsuariosEntity usuario = usuariosRepository
                .findByUsuarioAndEmpresa_IdEmpresa(user, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        obj.setUsuario(usuario);

        if (obj.getFecha() == null) {
            obj.setFecha(LocalDateTime.now());
        }

        obj.setUsuarioCreacion(user);
        return movimientoCajaRepository.save(obj);
    }

    @Override
    public List<MovimientoCajaEntity> read(Specification<MovimientoCajaEntity> specs) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        Specification<MovimientoCajaEntity> filtroEmpresa = (root, query, cb) -> cb
                .equal(root.get("empresa").get("idEmpresa"), empresaId);
        return movimientoCajaRepository.findAll(Specification.where(specs).and(filtroEmpresa));
    }

    @Override
    public List<MovimientoCajaDTO> readDTO(Specification<MovimientoCajaEntity> specs) {
        List<MovimientoCajaEntity> entities = this.read(specs);
        return entities.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MovimientoCajaEntity update(MovimientoCajaEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        MovimientoCajaEntity entity = movimientoCajaRepository
                .findByIdMovimientoCajaAndEmpresa_IdEmpresa(obj.getIdMovimientoCaja(), empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Movimiento no encontrado"));

        if (obj.getTipo() != null)
            entity.setTipo(obj.getTipo());
        if (obj.getMonto() != null)
            entity.setMonto(obj.getMonto());
        if (obj.getMotivo() != null)
            entity.setMotivo(obj.getMotivo());
        if (obj.getFecha() != null)
            entity.setFecha(obj.getFecha());

        if (obj.getCaja() != null) {
            CajasEntity caja = empresaValidator.validarEntidadPorEmpresa(
                    obj.getCaja().getIdCaja(), empresaId, "Caja",
                    cajasRepository::findByIdCajaAndEmpresa_IdEmpresa);
            entity.setCaja(caja);
        }

        entity.setUsuarioModificacion(user);
        return movimientoCajaRepository.save(entity);
    }

    @Override
    public MovimientoCajaEntity delete(Integer id, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        MovimientoCajaEntity entity = movimientoCajaRepository
                .findByIdMovimientoCajaAndEmpresa_IdEmpresa(id, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Movimiento no encontrado"));

        movimientoCajaRepository.delete(entity);
        return entity;
    }

    @Override
    public BalanceCajaDTO getBalanceCaja(Integer idCaja, LocalDateTime desde, LocalDateTime hasta) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        // Validar caja pertenece a empresa
        CajasEntity caja = empresaValidator.validarEntidadPorEmpresa(
                idCaja, empresaId, "Caja",
                cajasRepository::findByIdCajaAndEmpresa_IdEmpresa);

        // 1. Movimientos manuales del rango
        List<MovimientoCajaEntity> movimientos = movimientoCajaRepository
                .findByCaja_IdCajaAndEmpresa_IdEmpresaAndFechaBetween(idCaja, empresaId, desde, hasta);

        BigDecimal totalIngresos = movimientos.stream()
                .filter(m -> "INGRESO".equalsIgnoreCase(m.getTipo()))
                .map(MovimientoCajaEntity::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalEgresos = movimientos.stream()
                .filter(m -> "EGRESO".equalsIgnoreCase(m.getTipo()))
                .map(MovimientoCajaEntity::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Ventas en efectivo del rango (filtrando por caja y método de pago
        // "Efectivo")
        Specification<VentasEntity> ventasSpec = (root, query, cb) -> cb.and(
                cb.equal(root.get("empresa").get("idEmpresa"), empresaId),
                cb.equal(root.get("caja").get("idCaja"), idCaja),
                cb.between(root.get("fechaCreacion"), desde, hasta),
                cb.equal(cb.lower(root.get("metodoPago").get("nombreMetodoPago")), "efectivo"));
        List<VentasEntity> ventasEfectivo = ventasRepository.findAll(ventasSpec);
        BigDecimal totalVentasEfectivo = ventasEfectivo.stream()
                .map(v -> BigDecimal.valueOf(v.getTotal()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. Devoluciones del rango
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
            // Si no hay devoluciones, se mantiene en 0
        }

        // 4. Calcular saldo final
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
        dto.setTipo(entity.getTipo());
        dto.setMonto(entity.getMonto());
        dto.setMotivo(entity.getMotivo());
        dto.setFecha(entity.getFecha());
        return dto;
    }
}

