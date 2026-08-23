package com.galtekone.services.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
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
import org.springframework.transaction.annotation.Transactional;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.dto.proveedor.ProveedorDirectoryPageDTO;
import com.galtekone.dto.proveedor.ProveedorDirectoryRowDTO;
import com.galtekone.dto.proveedor.ProveedorDirectorySummaryDTO;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.ProveedorActivoEntity;
import com.galtekone.entity.ProveedorContactoEntity;
import com.galtekone.entity.ProveedorProductoEntity;
import com.galtekone.entity.ProveedoresEntity;
import com.galtekone.repository.ComprasRepository;
import com.galtekone.repository.ProveedorActivoRepository;
import com.galtekone.repository.ProveedorAcuerdoRepository;
import com.galtekone.repository.ProveedorContactoRepository;
import com.galtekone.repository.ProveedorDocumentoRepository;
import com.galtekone.repository.ProveedorProductoRespository;
import com.galtekone.repository.ProveedoresRepository;
import com.galtekone.services.ProveedorDocumentoService;
import com.galtekone.services.ProveedoresService;

import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

@Service
public class ProveedoresServiceImpl implements ProveedoresService {

    private static final Set<String> TIPOS_PROVEEDOR = Set.of(
            "DISTRIBUIDOR_FORMAL",
            "PROVEEDOR_INFORMAL",
            "ESTABLECIMIENTO_COMPRA"
    );

    private static final Set<String> ESTADOS_PROVEEDOR = Set.of("ACTIVO", "INACTIVO", "ARCHIVADO");
    private static final Set<String> MODALIDADES_ABASTECIMIENTO = Set.of("ENTREGA_DOMICILIO", "RECOGE_TENDERO", "MIXTO");
    private static final Set<String> FORMAS_PAGO = Set.of("CONTADO", "CREDITO", "MIXTO");
    private static final Set<String> DIRECTORY_SORT_FIELDS = Set.of(
            "nombreProveedor",
            "tipoProveedor",
            "contacto",
            "telefono",
            "modalidadAbastecimiento",
            "estadoProveedor",
            "fechaCreacion",
            "fechaModificacion"
    );
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
    private ProveedorDocumentoService proveedorDocumentoService;

    @Autowired
    private ProveedorAcuerdoRepository proveedorAcuerdoRepository;

    @Override
    public ProveedoresEntity create(ProveedoresEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        validateProveedor(obj, true);
        if (!isBlank(obj.getEstadoProveedor()) && "ARCHIVADO".equals(validateEstado(obj.getEstadoProveedor()))) {
            throw new IllegalArgumentException("No se puede crear un proveedor archivado. Crealo activo y usa la salida segura si debe conservarse como historial.");
        }

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
    public ProveedorDirectoryPageDTO readDirectoryPage(Map<String, String> filters, int page, int size, String sort, String direction) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        Specification<ProveedoresEntity> specs = buildDirectorySpec(filters, empresaId);
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String sortField = DIRECTORY_SORT_FIELDS.contains(trimToEmpty(sort)) ? sort.trim() : "nombreProveedor";
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);

        Page<ProveedoresEntity> pageData = proveedoresRepository.findAll(
                specs,
                PageRequest.of(safePage, safeSize, Sort.by(sortDirection, sortField))
        );

        List<Integer> idsProveedor = pageData.getContent().stream()
                .map(ProveedoresEntity::getIdProveedor)
                .toList();
        Map<Integer, Long> productosPorProveedor = countProductosByProveedor(idsProveedor, empresaId);
        Map<Integer, Long> activosPorProveedor = countActivosByProveedor(idsProveedor, empresaId);

        ProveedorDirectoryPageDTO dto = new ProveedorDirectoryPageDTO();
        dto.setItems(pageData.getContent().stream()
                .map(proveedor -> toDirectoryRow(proveedor, productosPorProveedor, activosPorProveedor))
                .toList());
        dto.setPage(pageData.getNumber());
        dto.setSize(pageData.getSize());
        dto.setTotalRecords(pageData.getTotalElements());
        dto.setTotalPages(pageData.getTotalPages());
        dto.setFirst(pageData.isFirst());
        dto.setLast(pageData.isLast());
        dto.setSummary(buildDirectorySummary(specs, empresaId));
        return dto;
    }

    private Specification<ProveedoresEntity> buildDirectorySpec(Map<String, String> filters, Integer empresaId) {
        Map<String, String> safeFilters = filters == null ? Map.of() : filters;
        Specification<ProveedoresEntity> specs = empresaSpec(empresaId);

        specs = andSpec(specs, searchSpec(safeFilters.get("search"), empresaId));
        specs = andSpec(specs, estadoFilterSpec(safeFilters.get("estado")));
        specs = andSpec(specs, fieldFilterSpec("tipoProveedor", safeFilters.get("tipo")));
        specs = andSpec(specs, fieldFilterSpec("modalidadAbastecimiento", safeFilters.get("modalidad")));
        specs = andSpec(specs, fieldFilterSpec("formaPagoPrincipal", safeFilters.get("pago")));
        specs = andSpec(specs, productosFilterSpec(safeFilters.get("productos"), empresaId));
        specs = andSpec(specs, activosFilterSpec(safeFilters.get("activos"), empresaId));

        return specs;
    }

    private Specification<ProveedoresEntity> andSpec(
            Specification<ProveedoresEntity> base,
            Specification<ProveedoresEntity> next
    ) {
        return next == null ? base : base.and(next);
    }

    private Specification<ProveedoresEntity> empresaSpec(Integer empresaId) {
        return (root, query, cb) -> cb.equal(root.get("empresa").get("idEmpresa"), empresaId);
    }

    private Specification<ProveedoresEntity> fieldFilterSpec(String field, String rawValue) {
        String value = filterValue(rawValue);
        if (value == null) return null;
        return (root, query, cb) -> cb.equal(root.get(field), value);
    }

    private Specification<ProveedoresEntity> estadoFilterSpec(String rawValue) {
        String value = filterValue(rawValue);
        if (value == null) return null;

        if ("ACTIVO".equals(value)) {
            return (root, query, cb) -> cb.or(
                    cb.equal(root.get("estadoProveedor"), "ACTIVO"),
                    cb.and(
                            cb.or(
                                    cb.isNull(root.get("estadoProveedor")),
                                    cb.equal(root.get("estadoProveedor"), "")
                            ),
                            cb.isTrue(root.get("estatus"))
                    )
            );
        }

        if ("INACTIVO".equals(value)) {
            return (root, query, cb) -> cb.or(
                    cb.equal(root.get("estadoProveedor"), "INACTIVO"),
                    cb.and(
                            cb.or(
                                    cb.isNull(root.get("estadoProveedor")),
                                    cb.equal(root.get("estadoProveedor"), "")
                            ),
                            cb.isFalse(root.get("estatus"))
                    )
            );
        }

        final String estado = value;
        return (root, query, cb) -> cb.equal(root.get("estadoProveedor"), estado);
    }

    private Specification<ProveedoresEntity> searchSpec(String rawValue, Integer empresaId) {
        String value = trimToNull(rawValue);
        if (value == null) return null;

        String like = "%" + value.toLowerCase() + "%";
        return (root, query, cb) -> {
            Predicate proveedorMatches = cb.or(
                    like(root, cb, "nombreProveedor", like),
                    like(root, cb, "razonSocial", like),
                    like(root, cb, "rfc", like),
                    like(root, cb, "contacto", like),
                    like(root, cb, "telefono", like),
                    like(root, cb, "correo", like),
                    like(root, cb, "direccion", like)
            );

            Subquery<Integer> contactoQuery = query.subquery(Integer.class);
            Root<ProveedorContactoEntity> contacto = contactoQuery.from(ProveedorContactoEntity.class);
            contactoQuery.select(cb.literal(1));
            contactoQuery.where(
                    cb.equal(contacto.get("proveedor").get("idProveedor"), root.get("idProveedor")),
                    cb.equal(contacto.get("empresa").get("idEmpresa"), empresaId),
                    cb.or(
                            like(contacto, cb, "nombre", like),
                            like(contacto, cb, "rol", like),
                            like(contacto, cb, "telefono", like),
                            like(contacto, cb, "whatsapp", like),
                            like(contacto, cb, "correo", like)
                    )
            );

            return cb.or(proveedorMatches, cb.exists(contactoQuery));
        };
    }

    private Predicate like(Root<?> root, CriteriaBuilder cb, String field, String like) {
        return cb.like(cb.lower(root.get(field).as(String.class)), like);
    }

    private Specification<ProveedoresEntity> productosFilterSpec(String rawValue, Integer empresaId) {
        String value = filterValue(rawValue);
        if (value == null) return null;

        if ("CON_PRODUCTOS".equals(value)) return productosPresenceSpec(empresaId, true);
        if ("SIN_PRODUCTOS".equals(value)) return productosPresenceSpec(empresaId, false);
        return null;
    }

    private Specification<ProveedoresEntity> activosFilterSpec(String rawValue, Integer empresaId) {
        String value = filterValue(rawValue);
        if (value == null) return null;

        if ("CON_ACTIVOS".equals(value)) return activosPresenceSpec(empresaId, true);
        if ("SIN_ACTIVOS".equals(value)) return activosPresenceSpec(empresaId, false);
        return null;
    }

    private Specification<ProveedoresEntity> productosPresenceSpec(Integer empresaId, boolean present) {
        return (root, query, cb) -> {
            Subquery<Integer> subquery = query.subquery(Integer.class);
            Root<ProveedorProductoEntity> producto = subquery.from(ProveedorProductoEntity.class);
            subquery.select(cb.literal(1));
            subquery.where(
                    cb.equal(producto.get("proveedor").get("idProveedor"), root.get("idProveedor")),
                    cb.equal(producto.get("empresa").get("idEmpresa"), empresaId)
            );

            return present ? cb.exists(subquery) : cb.not(cb.exists(subquery));
        };
    }

    private Specification<ProveedoresEntity> activosPresenceSpec(Integer empresaId, boolean present) {
        return (root, query, cb) -> {
            Subquery<Integer> subquery = query.subquery(Integer.class);
            Root<ProveedorActivoEntity> activo = subquery.from(ProveedorActivoEntity.class);
            subquery.select(cb.literal(1));
            subquery.where(
                    cb.equal(activo.get("proveedor").get("idProveedor"), root.get("idProveedor")),
                    cb.equal(activo.get("empresa").get("idEmpresa"), empresaId)
            );

            return present ? cb.exists(subquery) : cb.not(cb.exists(subquery));
        };
    }

    private ProveedorDirectorySummaryDTO buildDirectorySummary(
            Specification<ProveedoresEntity> specs,
            Integer empresaId
    ) {
        ProveedorDirectorySummaryDTO summary = new ProveedorDirectorySummaryDTO();
        summary.setTotal(proveedoresRepository.count(specs));
        summary.setActivos(proveedoresRepository.count(specs.and(estadoFilterSpec("ACTIVO"))));
        summary.setInactivos(proveedoresRepository.count(specs.and(estadoFilterSpec("INACTIVO"))));
        summary.setArchivados(proveedoresRepository.count(specs.and(equalSpec("estadoProveedor", "ARCHIVADO"))));
        summary.setSinProductos(proveedoresRepository.count(specs.and(productosPresenceSpec(empresaId, false))));
        summary.setConActivos(proveedoresRepository.count(specs.and(activosPresenceSpec(empresaId, true))));
        return summary;
    }

    private Specification<ProveedoresEntity> equalSpec(String field, String value) {
        return (root, query, cb) -> cb.equal(root.get(field), value);
    }

    private ProveedorDirectoryRowDTO toDirectoryRow(
            ProveedoresEntity proveedor,
            Map<Integer, Long> productosPorProveedor,
            Map<Integer, Long> activosPorProveedor
    ) {
        ProveedorDirectoryRowDTO row = new ProveedorDirectoryRowDTO();
        row.setIdProveedor(proveedor.getIdProveedor());
        row.setNombreProveedor(proveedor.getNombreProveedor());
        row.setRazonSocial(proveedor.getRazonSocial());
        row.setRfc(proveedor.getRfc());
        row.setTipoProveedor(isBlank(proveedor.getTipoProveedor()) ? "PROVEEDOR_INFORMAL" : proveedor.getTipoProveedor());
        row.setCategoriaPrincipal(proveedor.getCategoriaPrincipal());
        row.setEstadoProveedor(isBlank(proveedor.getEstadoProveedor()) ? "ACTIVO" : proveedor.getEstadoProveedor());
        row.setContacto(proveedor.getContacto());
        row.setTelefono(proveedor.getTelefono());
        row.setCorreo(proveedor.getCorreo());
        row.setDireccion(proveedor.getDireccion());
        row.setModalidadAbastecimiento(isBlank(proveedor.getModalidadAbastecimiento()) ? "ENTREGA_DOMICILIO" : proveedor.getModalidadAbastecimiento());
        row.setFormaPagoPrincipal(isBlank(proveedor.getFormaPagoPrincipal()) ? "CONTADO" : proveedor.getFormaPagoPrincipal());
        row.setPedidoWhatsapp(proveedor.getPedidoWhatsapp());
        row.setPedidoLlamada(proveedor.getPedidoLlamada());
        row.setPedidoApp(proveedor.getPedidoApp());
        row.setVisitaRuta(proveedor.getVisitaRuta());
        row.setCompraMostrador(proveedor.getCompraMostrador());
        row.setManejaCredito(proveedor.getManejaCredito());
        row.setEstatus(proveedor.getEstatus());
        row.setPedidoMinimo(proveedor.getPedidoMinimo());
        row.setCostoEnvio(proveedor.getCostoEnvio());
        row.setDiasCredito(proveedor.getDiasCredito());
        row.setLimiteCredito(proveedor.getLimiteCredito());
        row.setProductosAsociadosCount(productosPorProveedor.getOrDefault(proveedor.getIdProveedor(), 0L));
        row.setActivosPrestadosCount(activosPorProveedor.getOrDefault(proveedor.getIdProveedor(), 0L));
        row.setFechaCreacion(proveedor.getFechaCreacion());
        row.setFechaModificacion(proveedor.getFechaModificacion());
        return row;
    }

    private Map<Integer, Long> countProductosByProveedor(List<Integer> idsProveedor, Integer empresaId) {
        if (idsProveedor == null || idsProveedor.isEmpty()) return Map.of();
        return toCountMap(proveedorProductoRepository.countByProveedorIdsAndEmpresa(idsProveedor, empresaId));
    }

    private Map<Integer, Long> countActivosByProveedor(List<Integer> idsProveedor, Integer empresaId) {
        if (idsProveedor == null || idsProveedor.isEmpty()) return Map.of();
        return toCountMap(proveedorActivoRepository.countByProveedorIdsAndEmpresa(idsProveedor, empresaId));
    }

    private Map<Integer, Long> toCountMap(List<Object[]> rows) {
        Map<Integer, Long> counts = new HashMap<>();
        for (Object[] row : rows) {
            if (row == null || row.length < 2) continue;
            Integer id = ((Number) row[0]).intValue();
            Long count = ((Number) row[1]).longValue();
            counts.put(id, count);
        }
        return counts;
    }

    private String filterValue(String rawValue) {
        String value = trimToNull(rawValue);
        if (value == null || "TODOS".equalsIgnoreCase(value)) return null;
        return normalizeValue(value);
    }

    @Override
    public Map<String, Object> detail(Integer idProveedor) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ProveedoresEntity proveedor = findProveedor(idProveedor, empresaId);

        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("proveedor", proveedor);
        detail.put("contactos", proveedorContactoRepository.findByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId));
        detail.put("productos", proveedorProductoRepository.findRowsByProveedorAndEmpresa(idProveedor, empresaId));
        detail.put("activos", proveedorActivoRepository.findRowsByProveedorAndEmpresa(idProveedor, empresaId));
        detail.put("documentos", proveedorDocumentoService.readByProveedor(idProveedor));
        detail.put("acuerdos", proveedorAcuerdoRepository.findByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId));

        return detail;
    }

    @Override
    public Map<String, Object> editDetail(Integer idProveedor) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ProveedoresEntity proveedor = findProveedor(idProveedor, empresaId);

        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("proveedor", proveedor);
        detail.put("contactos", proveedorContactoRepository.findByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId));

        return detail;
    }

    @Override
    public ProveedoresEntity update(ProveedoresEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        ProveedoresEntity entityToUpdate = findProveedor(obj.getIdProveedor(), empresaId);
        ensureProveedorNoArchivado(entityToUpdate);
        String estadoActual = normalizedEstadoProveedor(entityToUpdate);
        String estadoSolicitado = requestedEstadoProveedor(obj, estadoActual);
        if (!estadoActual.equals(estadoSolicitado)) {
            throw new IllegalArgumentException("El estado del proveedor se cambia desde el flujo de salida segura.");
        }
        if ("INACTIVO".equals(estadoActual)) {
            throw new IllegalStateException("El proveedor inactivo solo puede reactivarse antes de modificarlo.");
        }
        validateProveedor(obj, false);
        if (!isBlank(obj.getEstadoProveedor()) && "ARCHIVADO".equals(validateEstado(obj.getEstadoProveedor()))) {
            throw new IllegalArgumentException("Archivar es una baja definitiva historica. Usa la accion Archivar desde el flujo de salida segura.");
        }
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
        String estadoAnterior = normalizedEstadoProveedor(entity);

        if (estadoAnterior.equals(estadoNuevo)) {
            throw new IllegalArgumentException("El proveedor ya se encuentra en estado " + estadoNuevo);
        }
        validateEstadoTransition(estadoAnterior, estadoNuevo);

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
    @Transactional
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
        proveedorContactoRepository.deleteAll(
                proveedorContactoRepository.findByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId)
        );
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

        String tipoProveedor = isBlank(obj.getTipoProveedor())
                ? "PROVEEDOR_INFORMAL"
                : validateValue("tipoProveedor", obj.getTipoProveedor(), TIPOS_PROVEEDOR);

        if ("DISTRIBUIDOR_FORMAL".equals(tipoProveedor)) {
            if (isBlank(obj.getRazonSocial())) {
                throw new IllegalArgumentException("La razon social del proveedor es obligatoria");
            }
            if (isBlank(obj.getRfc())) {
                throw new IllegalArgumentException("El RFC del proveedor es obligatorio");
            }
        }

        if (!isBlank(obj.getRfc())) {
            String rfc = obj.getRfc().trim().toUpperCase();
            if (!RFC_PATTERN.matcher(rfc).matches()) {
                throw new IllegalArgumentException("El RFC del proveedor no tiene un formato valido");
            }
        }

        if (!isBlank(obj.getEstadoProveedor())) {
            validateEstado(obj.getEstadoProveedor());
        }

        if (!isBlank(obj.getModalidadAbastecimiento())) {
            validateValue("modalidadAbastecimiento", obj.getModalidadAbastecimiento(), MODALIDADES_ABASTECIMIENTO);
        }

        String formaPagoPrincipal = isBlank(obj.getFormaPagoPrincipal())
                ? "CONTADO"
                : validateValue("formaPagoPrincipal", obj.getFormaPagoPrincipal(), FORMAS_PAGO);

        requireNonNegative(obj.getPedidoMinimo(), "pedidoMinimo");
        requireNonNegative(obj.getCostoEnvio(), "costoEnvio");
        requireNonNegative(obj.getLimiteCredito(), "limiteCredito");

        if (obj.getDiasCredito() != null && obj.getDiasCredito() < 0) {
            throw new IllegalArgumentException("diasCredito no puede ser negativo");
        }

        if ("CREDITO".equals(formaPagoPrincipal) || "MIXTO".equals(formaPagoPrincipal)) {
            if (obj.getDiasCredito() == null || obj.getDiasCredito() <= 0) {
                throw new IllegalArgumentException("diasCredito es obligatorio cuando el proveedor maneja credito");
            }
            if (obj.getLimiteCredito() == null || obj.getLimiteCredito().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("limiteCredito es obligatorio cuando el proveedor maneja credito");
            }
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
        target.setModalidadAbastecimiento(isBlank(source.getModalidadAbastecimiento()) ? "ENTREGA_DOMICILIO" : normalizeValue(source.getModalidadAbastecimiento()));
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
        String formaPago = isBlank(source.getFormaPagoPrincipal()) ? "CONTADO" : normalizeValue(source.getFormaPagoPrincipal());
        boolean usesCredit = "CREDITO".equals(formaPago) || "MIXTO".equals(formaPago);
        target.setFormaPagoPrincipal(formaPago);
        target.setManejaCredito(usesCredit);
        target.setDiasCredito(usesCredit ? source.getDiasCredito() : null);
        target.setLimiteCredito(usesCredit ? source.getLimiteCredito() : null);
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
        obj.setModalidadAbastecimiento(isBlank(obj.getModalidadAbastecimiento()) ? "ENTREGA_DOMICILIO" : normalizeValue(obj.getModalidadAbastecimiento()));
        obj.setDiasVisitaEntrega(trimToNull(obj.getDiasVisitaEntrega()));
        obj.setHorarioHabitual(trimToNull(obj.getHorarioHabitual()));
        obj.setTiempoEstimadoEntrega(trimToNull(obj.getTiempoEstimadoEntrega()));
        obj.setObservacionesAbastecimiento(trimToNull(obj.getObservacionesAbastecimiento()));
        String formaPago = isBlank(obj.getFormaPagoPrincipal()) ? "CONTADO" : normalizeValue(obj.getFormaPagoPrincipal());
        boolean usesCredit = "CREDITO".equals(formaPago) || "MIXTO".equals(formaPago);
        obj.setFormaPagoPrincipal(formaPago);
        obj.setManejaCredito(usesCredit);
        if (!usesCredit) {
            obj.setDiasCredito(null);
            obj.setLimiteCredito(null);
        }
        obj.setNotasComerciales(trimToNull(obj.getNotasComerciales()));
    }

    private Map<String, Long> dependencyCounts(Integer idProveedor, Integer empresaId) {
        Map<String, Long> dependencies = new LinkedHashMap<>();
        dependencies.put("comprasHistoricas", comprasRepository.countByProveedorAndEmpresa(idProveedor, empresaId));
        dependencies.put("productosAsociados", proveedorProductoRepository.countByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId));
        dependencies.put("activosPrestados", proveedorActivoRepository.countByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId));
        dependencies.put("documentosAnexos", proveedorDocumentoRepository.countByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId));
        dependencies.put("acuerdosComerciales", proveedorAcuerdoRepository.countByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId));
        return dependencies;
    }

    private Map<String, Object> buildDeletePolicy(ProveedoresEntity entity, Integer empresaId) {
        Map<String, Long> dependencies = dependencyCounts(entity.getIdProveedor(), empresaId);

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
        policy.put("accionRecomendada", recommendedExitAction(entity, puedeEliminar));
        policy.put(
                "mensaje",
                puedeEliminar
                        ? "El proveedor no tiene uso registrado. Puede eliminarse fisicamente si fue creado por error."
                        : "El proveedor tiene uso registrado. Puedes pausarlo desactivandolo o quitarlo del uso diario archivandolo."
        );
        return policy;
    }

    private String deleteReason(String key, Long count) {
        String suffix = count == 1 ? " registro" : " registros";
        return switch (key) {
            case "comprasHistoricas" -> "Tiene compras historicas (" + count + suffix + ")";
            case "productosAsociados" -> "Tiene productos asociados (" + count + suffix + ")";
            case "activosPrestados" -> "Tiene activos prestados (" + count + suffix + ")";
            case "documentosAnexos" -> "Tiene documentos anexos (" + count + suffix + ")";
            case "acuerdosComerciales" -> "Tiene acuerdos comerciales (" + count + suffix + ")";
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

    private void validateEstadoTransition(String estadoAnterior, String estadoNuevo) {
        if ("ARCHIVADO".equals(estadoAnterior)) {
            throw new IllegalStateException("El proveedor archivado es una baja historica definitiva y no puede reactivarse ni cambiar de estado.");
        }
        if ("ACTIVO".equals(estadoNuevo) && !"INACTIVO".equals(estadoAnterior)) {
            throw new IllegalArgumentException("Solo un proveedor inactivo puede reactivarse.");
        }
        if ("INACTIVO".equals(estadoNuevo) && !"ACTIVO".equals(estadoAnterior)) {
            throw new IllegalArgumentException("Solo un proveedor activo puede desactivarse.");
        }
    }

    private void ensureProveedorNoArchivado(ProveedoresEntity entity) {
        if (entity != null && "ARCHIVADO".equals(normalizedEstadoProveedor(entity))) {
            throw new IllegalStateException("El proveedor archivado es solo historico y no acepta cambios.");
        }
    }

    private String recommendedExitAction(ProveedoresEntity entity, boolean puedeEliminar) {
        if (puedeEliminar) return "ELIMINAR_FISICAMENTE";
        String estado = normalizedEstadoProveedor(entity);
        if ("ACTIVO".equals(estado)) return "DESACTIVAR_O_ARCHIVAR";
        if ("INACTIVO".equals(estado)) return "REACTIVAR_O_ARCHIVAR";
        return "SOLO_CONSULTA";
    }

    private String normalizedEstadoProveedor(ProveedoresEntity entity) {
        if (entity == null || isBlank(entity.getEstadoProveedor())) return "ACTIVO";
        return validateEstado(entity.getEstadoProveedor());
    }

    private String requestedEstadoProveedor(ProveedoresEntity request, String fallback) {
        if (request == null) return fallback;
        if (!isBlank(request.getEstadoProveedor())) {
            return validateEstado(request.getEstadoProveedor());
        }
        if (request.getEstatus() != null) {
            return Boolean.TRUE.equals(request.getEstatus()) ? "ACTIVO" : "INACTIVO";
        }
        return fallback;
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
