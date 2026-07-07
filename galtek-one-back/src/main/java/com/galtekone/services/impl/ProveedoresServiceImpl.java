package com.galtekone.services.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.ProveedoresEntity;
import com.galtekone.repository.ComprasRepository;
import com.galtekone.repository.ProveedorActivoRepository;
import com.galtekone.repository.ProveedorAcuerdoRepository;
import com.galtekone.repository.ProveedorContactoRepository;
import com.galtekone.repository.ProveedorDocumentoRepository;
import com.galtekone.repository.ProveedorProductoRespository;
import com.galtekone.repository.ProveedoresRepository;
import com.galtekone.services.ProveedoresService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class ProveedoresServiceImpl implements ProveedoresService {

    private static final Set<String> TIPOS_PROVEEDOR = Set.of(
            "DISTRIBUIDOR_FORMAL",
            "PROVEEDOR_INFORMAL",
            "ESTABLECIMIENTO_COMPRA",
            "ENTREGA_DOMICILIO",
            "MIXTO"
    );

    private static final Set<String> ESTADOS_PROVEEDOR = Set.of("ACTIVO", "INACTIVO", "ARCHIVADO");
    private static final Set<String> MODALIDADES_ABASTECIMIENTO = Set.of("ENTREGA_DOMICILIO", "RECOGE_TENDERO", "MIXTO");
    private static final Set<String> FORMAS_PAGO = Set.of("CONTADO", "CREDITO", "MIXTO");
    private static final Pattern RFC_PATTERN = Pattern.compile("^[A-Z&\\u00D1]{3,4}[0-9]{6}[A-Z0-9]{3}$");

    @Autowired
    private ProveedoresRepository proveedoresRepository;

    @Autowired
    private ComprasRepository comprasRepository;

    @Autowired
    private ProveedorProductoRespository proveedorProductoRepository;

    @Autowired
    private ProveedorContactoRepository proveedorContactoRepository;

    @Autowired
    private ProveedorActivoRepository proveedorActivoRepository;

    @Autowired
    private ProveedorDocumentoRepository proveedorDocumentoRepository;

    @Autowired
    private ProveedorAcuerdoRepository proveedorAcuerdoRepository;

    @Override
    public ProveedoresEntity create(ProveedoresEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        validateProveedor(obj, true);

        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(empresaId);

        normalizeProveedor(obj);
        obj.setEmpresa(empresa);
        obj.setUsuarioCreacion(user);
        syncEstatusFromEstado(obj);

        return proveedoresRepository.save(obj);
    }

    @Override
    public List<ProveedoresEntity> read(Specification<ProveedoresEntity> specs) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Specification<ProveedoresEntity> filtroEmpresa = (root, query, cb) ->
                cb.equal(root.get("empresa").get("idEmpresa"), empresaId);

        Specification<ProveedoresEntity> finalSpec = Specification.where(specs).and(filtroEmpresa);

        return proveedoresRepository.findAll(finalSpec);
    }

    @Override
    public Page<ProveedoresEntity> readPage(Specification<ProveedoresEntity> specs, int page, int size, String sort, String direction) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Specification<ProveedoresEntity> filtroEmpresa = (root, query, cb) ->
                cb.equal(root.get("empresa").get("idEmpresa"), empresaId);

        Specification<ProveedoresEntity> finalSpec = Specification.where(specs).and(filtroEmpresa);
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String sortField = isBlank(sort) ? "nombreProveedor" : sort.trim();
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);

        return proveedoresRepository.findAll(finalSpec, PageRequest.of(safePage, safeSize, Sort.by(sortDirection, sortField)));
    }

    @Override
    public Map<String, Object> detail(Integer idProveedor) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ProveedoresEntity proveedor = findProveedor(idProveedor, empresaId);

        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("proveedor", proveedor);
        detail.put("contactos", proveedorContactoRepository.findByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId));
        detail.put("productos", proveedorProductoRepository.findByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId));
        detail.put("activos", proveedorActivoRepository.findByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId));
        detail.put("documentos", proveedorDocumentoRepository.findByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId));
        detail.put("acuerdos", proveedorAcuerdoRepository.findByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId));

        return detail;
    }

    @Override
    public ProveedoresEntity update(ProveedoresEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        ProveedoresEntity entityToUpdate = findProveedor(obj.getIdProveedor(), empresaId);
        validateProveedor(obj, false);
        applyUpdate(entityToUpdate, obj);
        entityToUpdate.setUsuarioModificacion(user);
        syncEstatusFromEstado(entityToUpdate);

        return proveedoresRepository.save(entityToUpdate);
    }

    @Override
    public ProveedoresEntity changeEstado(Integer idProveedor, String estadoProveedor, String motivo, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ProveedoresEntity entity = findProveedor(idProveedor, empresaId);
        String estadoNuevo = validateEstado(estadoProveedor);
        String estadoAnterior = validateEstado(entity.getEstadoProveedor());

        if (estadoAnterior.equals(estadoNuevo)) {
            throw new IllegalArgumentException("El proveedor ya se encuentra en estado " + estadoNuevo);
        }

        entity.setEstadoProveedorAnterior(estadoAnterior);
        entity.setEstadoProveedor(estadoNuevo);
        entity.setUltimaAccionEstado(actionForEstado(estadoNuevo));
        entity.setMotivoCambioEstado(requireMotivo(motivo));
        entity.setUsuarioCambioEstado(user);
        entity.setFechaCambioEstado(LocalDateTime.now());
        syncEstatusFromEstado(entity);
        entity.setUsuarioModificacion(user);

        return proveedoresRepository.save(entity);
    }

    @Override
    public ProveedoresEntity delete(Integer idProveedor, String user) {
        return delete(idProveedor, null, user);
    }

    @Override
    public Map<String, Object> deletePolicy(Integer idProveedor) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ProveedoresEntity entity = findProveedor(idProveedor, empresaId);

        return buildDeletePolicy(entity, empresaId);
    }

    @Override
    public ProveedoresEntity delete(Integer idProveedor, String motivo, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ProveedoresEntity entity = findProveedor(idProveedor, empresaId);
        Map<String, Object> policy = buildDeletePolicy(entity, empresaId);

        if (!Boolean.TRUE.equals(policy.get("puedeEliminar"))) {
            throw new IllegalStateException(
                    "No se puede eliminar fisicamente el proveedor porque tiene historial o dependencias. " +
                    "Desactivalo o archivalo. Motivos: " + policy.get("motivos")
            );
        }

        requireMotivo(motivo);
        entity.setUsuarioModificacion(user);
        proveedoresRepository.delete(entity);

        return entity;
    }

    private ProveedoresEntity findProveedor(Integer idProveedor, Integer empresaId) {
        if (idProveedor == null) {
            throw new IllegalArgumentException("El idProveedor es obligatorio");
        }

        return proveedoresRepository.findByIdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Proveedor no encontrado o no pertenece a tu empresa"));
    }

    private void validateProveedor(ProveedoresEntity obj, boolean creating) {
        if (obj == null) {
            throw new IllegalArgumentException("El proveedor es obligatorio");
        }

        if (isBlank(obj.getNombreProveedor())) {
            throw new IllegalArgumentException("El nombre comercial del proveedor es obligatorio");
        }

        if (!isBlank(obj.getRfc())) {
            String rfc = obj.getRfc().trim().toUpperCase();
            if (!RFC_PATTERN.matcher(rfc).matches()) {
                throw new IllegalArgumentException("El RFC del proveedor no tiene un formato valido");
            }
        }

        if (!isBlank(obj.getTipoProveedor())) {
            validateValue("tipoProveedor", obj.getTipoProveedor(), TIPOS_PROVEEDOR);
        }

        if (!isBlank(obj.getEstadoProveedor())) {
            validateEstado(obj.getEstadoProveedor());
        }

        if (!isBlank(obj.getModalidadAbastecimiento())) {
            validateValue("modalidadAbastecimiento", obj.getModalidadAbastecimiento(), MODALIDADES_ABASTECIMIENTO);
        }

        if (!isBlank(obj.getFormaPagoPrincipal())) {
            validateValue("formaPagoPrincipal", obj.getFormaPagoPrincipal(), FORMAS_PAGO);
        }

        requireNonNegative(obj.getPedidoMinimo(), "pedidoMinimo");
        requireNonNegative(obj.getCostoEnvio(), "costoEnvio");
        requireNonNegative(obj.getLimiteCredito(), "limiteCredito");

        if (obj.getDiasCredito() != null && obj.getDiasCredito() < 0) {
            throw new IllegalArgumentException("diasCredito no puede ser negativo");
        }
    }

    private void applyUpdate(ProveedoresEntity target, ProveedoresEntity source) {
        target.setNombreProveedor(source.getNombreProveedor().trim());
        target.setRazonSocial(trimToNull(source.getRazonSocial()));
        target.setRfc(trimToNull(source.getRfc()) == null ? null : source.getRfc().trim().toUpperCase());
        target.setTipoProveedor(isBlank(source.getTipoProveedor()) ? "PROVEEDOR_INFORMAL" : normalizeValue(source.getTipoProveedor()));
        target.setCategoriaPrincipal(trimToNull(source.getCategoriaPrincipal()));
        target.setEstadoProveedor(!isBlank(source.getEstadoProveedor())
                ? validateEstado(source.getEstadoProveedor())
                : source.getEstatus() != null && !source.getEstatus() ? "INACTIVO" : "ACTIVO");
        target.setNotasInternas(trimToNull(source.getNotasInternas()));
        target.setContacto(trimToEmpty(source.getContacto()));
        target.setCorreo(trimToEmpty(source.getCorreo()));
        target.setDireccion(trimToEmpty(source.getDireccion()));
        target.setTelefono(trimToEmpty(source.getTelefono()));
        target.setModalidadAbastecimiento(isBlank(source.getModalidadAbastecimiento()) ? null : normalizeValue(source.getModalidadAbastecimiento()));
        target.setPedidoWhatsapp(Boolean.TRUE.equals(source.getPedidoWhatsapp()));
        target.setPedidoLlamada(Boolean.TRUE.equals(source.getPedidoLlamada()));
        target.setPedidoApp(Boolean.TRUE.equals(source.getPedidoApp()));
        target.setVisitaRuta(Boolean.TRUE.equals(source.getVisitaRuta()));
        target.setCompraMostrador(Boolean.TRUE.equals(source.getCompraMostrador()));
        target.setDiasVisitaEntrega(trimToNull(source.getDiasVisitaEntrega()));
        target.setHorarioHabitual(trimToNull(source.getHorarioHabitual()));
        target.setPedidoMinimo(source.getPedidoMinimo());
        target.setTiempoEstimadoEntrega(trimToNull(source.getTiempoEstimadoEntrega()));
        target.setCostoEnvio(source.getCostoEnvio());
        target.setObservacionesAbastecimiento(trimToNull(source.getObservacionesAbastecimiento()));
        target.setFormaPagoPrincipal(isBlank(source.getFormaPagoPrincipal()) ? null : normalizeValue(source.getFormaPagoPrincipal()));
        target.setManejaCredito(Boolean.TRUE.equals(source.getManejaCredito()));
        target.setDiasCredito(source.getDiasCredito());
        target.setLimiteCredito(source.getLimiteCredito());
        target.setPermiteDevoluciones(Boolean.TRUE.equals(source.getPermiteDevoluciones()));
        target.setCambiosCaducidad(Boolean.TRUE.equals(source.getCambiosCaducidad()));
        target.setBonificaciones(Boolean.TRUE.equals(source.getBonificaciones()));
        target.setDescuentosFrecuentes(Boolean.TRUE.equals(source.getDescuentosFrecuentes()));
        target.setNotasComerciales(trimToNull(source.getNotasComerciales()));
    }

    private void normalizeProveedor(ProveedoresEntity obj) {
        obj.setNombreProveedor(obj.getNombreProveedor().trim());
        obj.setRazonSocial(trimToNull(obj.getRazonSocial()));
        obj.setRfc(trimToNull(obj.getRfc()) == null ? null : obj.getRfc().trim().toUpperCase());
        obj.setTipoProveedor(isBlank(obj.getTipoProveedor()) ? "PROVEEDOR_INFORMAL" : normalizeValue(obj.getTipoProveedor()));
        obj.setEstadoProveedor(isBlank(obj.getEstadoProveedor()) ? "ACTIVO" : validateEstado(obj.getEstadoProveedor()));
        obj.setCategoriaPrincipal(trimToNull(obj.getCategoriaPrincipal()));
        obj.setNotasInternas(trimToNull(obj.getNotasInternas()));
        obj.setContacto(trimToEmpty(obj.getContacto()));
        obj.setTelefono(trimToEmpty(obj.getTelefono()));
        obj.setCorreo(trimToEmpty(obj.getCorreo()));
        obj.setDireccion(trimToEmpty(obj.getDireccion()));
        obj.setModalidadAbastecimiento(isBlank(obj.getModalidadAbastecimiento()) ? null : normalizeValue(obj.getModalidadAbastecimiento()));
        obj.setDiasVisitaEntrega(trimToNull(obj.getDiasVisitaEntrega()));
        obj.setHorarioHabitual(trimToNull(obj.getHorarioHabitual()));
        obj.setTiempoEstimadoEntrega(trimToNull(obj.getTiempoEstimadoEntrega()));
        obj.setObservacionesAbastecimiento(trimToNull(obj.getObservacionesAbastecimiento()));
        obj.setFormaPagoPrincipal(isBlank(obj.getFormaPagoPrincipal()) ? null : normalizeValue(obj.getFormaPagoPrincipal()));
        obj.setNotasComerciales(trimToNull(obj.getNotasComerciales()));
    }

    private Map<String, Long> dependencyCounts(Integer idProveedor, Integer empresaId) {
        Map<String, Long> dependencies = new LinkedHashMap<>();
        dependencies.put("comprasHistoricas", comprasRepository.countByProveedorAndEmpresa(idProveedor, empresaId));
        dependencies.put("productosAsociados", proveedorProductoRepository.countByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId));
        dependencies.put("contactos", proveedorContactoRepository.countByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId));
        dependencies.put("activosPrestados", proveedorActivoRepository.countByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId));
        dependencies.put("documentosAnexos", proveedorDocumentoRepository.countByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId));
        dependencies.put("acuerdosComerciales", proveedorAcuerdoRepository.countByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId));
        return dependencies;
    }

    private Map<String, Object> buildDeletePolicy(ProveedoresEntity entity, Integer empresaId) {
        Map<String, Long> dependencies = dependencyCounts(entity.getIdProveedor(), empresaId);
        if (hasRelevantAudit(entity)) {
            dependencies.put("auditoriaRelevante", 1L);
        } else {
            dependencies.put("auditoriaRelevante", 0L);
        }

        List<String> motivos = new ArrayList<>();
        dependencies.forEach((key, count) -> {
            if (count != null && count > 0) {
                motivos.add(deleteReason(key, count));
            }
        });

        boolean puedeEliminar = motivos.isEmpty();
        Map<String, Object> policy = new LinkedHashMap<>();
        policy.put("idProveedor", entity.getIdProveedor());
        policy.put("nombreProveedor", entity.getNombreProveedor());
        policy.put("estadoProveedor", entity.getEstadoProveedor());
        policy.put("puedeEliminar", puedeEliminar);
        policy.put("dependencias", dependencies);
        policy.put("motivos", motivos);
        policy.put("accionRecomendada", puedeEliminar ? "ELIMINAR_FISICAMENTE" : "DESACTIVAR_O_ARCHIVAR");
        policy.put(
                "mensaje",
                puedeEliminar
                        ? "El proveedor no tiene uso registrado. Puede eliminarse fisicamente si fue creado por error."
                        : "El proveedor tiene historial o relaciones. Conserva la informacion desactivandolo o archivandolo."
        );
        return policy;
    }

    private boolean hasRelevantAudit(ProveedoresEntity entity) {
        return !isBlank(entity.getUsuarioModificacion())
                || !isBlank(entity.getUsuarioCambioEstado())
                || !isBlank(entity.getMotivoCambioEstado())
                || !isBlank(entity.getUltimaAccionEstado())
                || entity.getFechaCambioEstado() != null;
    }

    private String deleteReason(String key, Long count) {
        String suffix = count == 1 ? " registro" : " registros";
        return switch (key) {
            case "comprasHistoricas" -> "Tiene compras historicas (" + count + suffix + ")";
            case "productosAsociados" -> "Tiene productos asociados (" + count + suffix + ")";
            case "contactos" -> "Tiene contactos registrados (" + count + suffix + ")";
            case "activosPrestados" -> "Tiene activos prestados (" + count + suffix + ")";
            case "documentosAnexos" -> "Tiene documentos anexos (" + count + suffix + ")";
            case "acuerdosComerciales" -> "Tiene acuerdos comerciales (" + count + suffix + ")";
            case "auditoriaRelevante" -> "Tiene auditoria relevante de cambios";
            default -> "Tiene " + key + " (" + count + suffix + ")";
        };
    }

    private void syncEstatusFromEstado(ProveedoresEntity obj) {
        if (isBlank(obj.getEstadoProveedor())) {
            obj.setEstadoProveedor(obj.getEstatus() != null && !obj.getEstatus() ? "INACTIVO" : "ACTIVO");
        }

        obj.setEstatus("ACTIVO".equals(validateEstado(obj.getEstadoProveedor())));
    }

    private String actionForEstado(String estado) {
        return switch (estado) {
            case "ACTIVO" -> "REACTIVAR";
            case "INACTIVO" -> "DESACTIVAR";
            case "ARCHIVADO" -> "ARCHIVAR";
            default -> "CAMBIAR_ESTADO";
        };
    }

    private String requireMotivo(String motivo) {
        String value = trimToNull(motivo);
        if (value == null) {
            throw new IllegalArgumentException("El motivo es obligatorio para esta accion");
        }
        if (value.length() < 5) {
            throw new IllegalArgumentException("El motivo debe tener al menos 5 caracteres");
        }
        if (value.length() > 500) {
            throw new IllegalArgumentException("El motivo no puede exceder 500 caracteres");
        }
        return value;
    }

    private String validateEstado(String estado) {
        return validateValue("estadoProveedor", estado, ESTADOS_PROVEEDOR);
    }

    private String validateValue(String field, String rawValue, Set<String> allowedValues) {
        String value = normalizeValue(rawValue);
        if (!allowedValues.contains(value)) {
            throw new IllegalArgumentException(field + " no es valido. Valores permitidos: " + allowedValues);
        }
        return value;
    }

    private String normalizeValue(String value) {
        return value.trim().toUpperCase().replace(' ', '_').replace('-', '_');
    }

    private void requireNonNegative(BigDecimal value, String field) {
        if (value != null && value.signum() < 0) {
            throw new IllegalArgumentException(field + " no puede ser negativo");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String trimToEmpty(String value) {
        if (value == null) return "";
        return value.trim();
    }
}
