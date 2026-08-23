package com.galtekone.services.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
import com.galtekone.dto.cliente.ClienteConPedidosDTO;
import com.galtekone.dto.cliente.ClienteDirectoryPageDTO;
import com.galtekone.dto.cliente.ClienteDirectoryRowDTO;
import com.galtekone.dto.cliente.ClienteDirectorySummaryDTO;
import com.galtekone.dto.cliente.DetallePedidoClienteDTO;
import com.galtekone.dto.cliente.PedidoClienteDTO;
import com.galtekone.entity.ClientesEntity;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.ProductosEntity;
import com.galtekone.entity.VentaDetalleEntity;
import com.galtekone.entity.VentasEntity;
import com.galtekone.repository.ClientesRepository;
import com.galtekone.repository.VentasRepository;
import com.galtekone.services.ClientesService;

import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

@Service
public class ClientesServiceImpl implements ClientesService {

    private static final Set<String> TIPOS_CLIENTE = Set.of("PERSONA", "NEGOCIO");
    private static final Set<String> ESTADOS_CLIENTE = Set.of("ACTIVO", "INACTIVO", "ARCHIVADO");
    private static final Set<String> DIRECTORY_SORT_FIELDS = Set.of(
            "nombre",
            "alias",
            "tipoCliente",
            "estadoCliente",
            "telefono",
            "email",
            "rfc",
            "razonSocial",
            "fechaCreacion",
            "fechaModificacion"
    );
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[0-9]{10,13}$");
    private static final Pattern RFC_PATTERN = Pattern.compile("^[A-Z&\\u00D1]{3,4}[0-9]{6}[A-Z0-9]{3}$");

    @Autowired
    private ClientesRepository clientesRepository;

    @Autowired
    private VentasRepository ventasRepository;

    @Override
    public ClientesEntity create(ClientesEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        validateCliente(obj);
        if (!isBlank(obj.getEstadoCliente()) && "ARCHIVADO".equals(validateEstado(obj.getEstadoCliente()))) {
            throw new IllegalArgumentException("No se puede crear un cliente archivado. Crealo activo y usa la salida segura si debe conservarse como historial.");
        }

        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(empresaId);

        normalizeCliente(obj);
        obj.setEmpresa(empresa);
        obj.setUsuarioCreacion(user);
        syncEstatusFromEstado(obj);

        return clientesRepository.save(obj);
    }

    @Override
    public List<ClientesEntity> read(Specification<ClientesEntity> specs) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Specification<ClientesEntity> filtroEmpresa = (root, query, cb) ->
                cb.equal(root.get("empresa").get("idEmpresa"), empresaId);

        Specification<ClientesEntity> finalSpec = Specification.where(specs).and(filtroEmpresa);

        return clientesRepository.findAll(finalSpec);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ClientesEntity> readPage(
            Specification<ClientesEntity> specs,
            int page,
            int size,
            String sort,
            String direction
    ) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        Specification<ClientesEntity> filtroEmpresa = (root, query, cb) ->
                cb.equal(root.get("empresa").get("idEmpresa"), empresaId);

        Specification<ClientesEntity> finalSpec = Specification.where(specs).and(filtroEmpresa);
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String sortField = isBlank(sort) ? "nombre" : sort.trim();
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);

        return clientesRepository.findAll(finalSpec, PageRequest.of(safePage, safeSize, Sort.by(sortDirection, sortField)));
    }

    @Override
    @Transactional(readOnly = true)
    public ClienteDirectoryPageDTO readDirectoryPage(
            Map<String, String> filters,
            int page,
            int size,
            String sort,
            String direction
    ) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        Specification<ClientesEntity> specs = buildDirectorySpec(filters, empresaId);
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String sortField = DIRECTORY_SORT_FIELDS.contains(trimToEmpty(sort)) ? sort.trim() : "nombre";
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);

        Page<ClientesEntity> pageData = clientesRepository.findAll(
                specs,
                PageRequest.of(safePage, safeSize, Sort.by(sortDirection, sortField))
        );

        List<Integer> idsCliente = pageData.getContent().stream()
                .map(ClientesEntity::getIdCliente)
                .toList();
        Map<Integer, Long> comprasPorCliente = countComprasByCliente(idsCliente, empresaId);
        Map<Integer, PedidoClienteDTO> ultimaCompraPorCliente = latestPurchaseByCliente(idsCliente, empresaId);

        ClienteDirectoryPageDTO dto = new ClienteDirectoryPageDTO();
        dto.setItems(pageData.getContent().stream()
                .map(cliente -> toDirectoryRow(cliente, comprasPorCliente, ultimaCompraPorCliente))
                .toList());
        dto.setPage(pageData.getNumber());
        dto.setSize(pageData.getSize());
        dto.setTotalRecords(pageData.getTotalElements());
        dto.setTotalPages(pageData.getTotalPages());
        dto.setFirst(pageData.isFirst());
        dto.setLast(pageData.isLast());
        dto.setSummary(buildDirectorySummary(specs));
        return dto;
    }

    private Specification<ClientesEntity> buildDirectorySpec(Map<String, String> filters, Integer empresaId) {
        Map<String, String> safeFilters = filters == null ? Map.of() : filters;
        Specification<ClientesEntity> specs = empresaSpec(empresaId);

        specs = andSpec(specs, searchSpec(safeFilters.get("search")));
        specs = andSpec(specs, estadoFilterSpec(safeFilters.get("estado")));
        specs = andSpec(specs, fieldFilterSpec("tipoCliente", safeFilters.get("tipo")));
        specs = andSpec(specs, fiscalFilterSpec(safeFilters.get("fiscales")));
        specs = andSpec(specs, addressFilterSpec(safeFilters.get("direccion")));
        specs = andSpec(specs, comprasFilterSpec(safeFilters.get("compras"), empresaId));
        specs = andSpec(specs, comprasFilterSpec(safeFilters.get("ultimaCompra"), empresaId));

        return specs;
    }

    private Specification<ClientesEntity> andSpec(
            Specification<ClientesEntity> base,
            Specification<ClientesEntity> next
    ) {
        return next == null ? base : base.and(next);
    }

    private Specification<ClientesEntity> empresaSpec(Integer empresaId) {
        return (root, query, cb) -> cb.equal(root.get("empresa").get("idEmpresa"), empresaId);
    }

    private Specification<ClientesEntity> fieldFilterSpec(String field, String rawValue) {
        String value = filterValue(rawValue);
        if (value == null) return null;
        return (root, query, cb) -> cb.equal(root.get(field), value);
    }

    private Specification<ClientesEntity> estadoFilterSpec(String rawValue) {
        String value = filterValue(rawValue);
        if (value == null) return null;

        if ("ACTIVO".equals(value)) {
            return (root, query, cb) -> cb.or(
                    cb.equal(root.get("estadoCliente"), "ACTIVO"),
                    cb.and(
                            cb.or(
                                    cb.isNull(root.get("estadoCliente")),
                                    cb.equal(root.get("estadoCliente"), "")
                            ),
                            cb.isTrue(root.get("estatus"))
                    )
            );
        }

        if ("INACTIVO".equals(value)) {
            return (root, query, cb) -> cb.or(
                    cb.equal(root.get("estadoCliente"), "INACTIVO"),
                    cb.and(
                            cb.or(
                                    cb.isNull(root.get("estadoCliente")),
                                    cb.equal(root.get("estadoCliente"), "")
                            ),
                            cb.isFalse(root.get("estatus"))
                    )
            );
        }

        final String estado = value;
        return (root, query, cb) -> cb.equal(root.get("estadoCliente"), estado);
    }

    private Specification<ClientesEntity> searchSpec(String rawValue) {
        String value = trimToNull(rawValue);
        if (value == null) return null;

        String like = "%" + value.toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                like(root, cb, "nombre", like),
                like(root, cb, "alias", like),
                like(root, cb, "telefono", like),
                like(root, cb, "whatsapp", like),
                like(root, cb, "email", like),
                like(root, cb, "rfc", like),
                like(root, cb, "razonSocial", like),
                like(root, cb, "direccion", like),
                like(root, cb, "direccionCalle", like),
                like(root, cb, "direccionColonia", like),
                like(root, cb, "direccionMunicipio", like),
                like(root, cb, "direccionEstado", like),
                like(root, cb, "direccionCodigoPostal", like),
                like(root, cb, "notasInternas", like)
        );
    }

    private Predicate like(Root<?> root, CriteriaBuilder cb, String field, String like) {
        return cb.like(cb.lower(root.get(field).as(String.class)), like);
    }

    private Specification<ClientesEntity> fiscalFilterSpec(String rawValue) {
        String value = filterValue(rawValue);
        if (value == null) return null;

        if ("CON_FISCALES".equals(value)) return fiscalPresenceSpec(true);
        if ("SIN_FISCALES".equals(value)) return fiscalPresenceSpec(false);
        return null;
    }

    private Specification<ClientesEntity> addressFilterSpec(String rawValue) {
        String value = filterValue(rawValue);
        if (value == null) return null;

        if ("CON_DIRECCION".equals(value)) return addressPresenceSpec(true);
        if ("SIN_DIRECCION".equals(value)) return addressPresenceSpec(false);
        return null;
    }

    private Specification<ClientesEntity> comprasFilterSpec(String rawValue, Integer empresaId) {
        String value = filterValue(rawValue);
        if (value == null) return null;

        if ("CON_COMPRAS".equals(value)) return comprasPresenceSpec(empresaId, true);
        if ("SIN_COMPRAS".equals(value)) return comprasPresenceSpec(empresaId, false);
        return null;
    }

    private Specification<ClientesEntity> fiscalPresenceSpec(boolean present) {
        return (root, query, cb) -> {
            Predicate predicate = cb.or(
                    hasText(root, cb, "rfc"),
                    hasText(root, cb, "razonSocial"),
                    hasText(root, cb, "codigoPostalFiscal"),
                    hasText(root, cb, "correoFiscal"),
                    hasText(root, cb, "regimenFiscal"),
                    hasText(root, cb, "usoCfdi")
            );
            return present ? predicate : cb.not(predicate);
        };
    }

    private Specification<ClientesEntity> addressPresenceSpec(boolean present) {
        return (root, query, cb) -> {
            Predicate predicate = cb.or(
                    hasText(root, cb, "direccion"),
                    hasText(root, cb, "direccionCalle"),
                    hasText(root, cb, "direccionNumeroExterior"),
                    hasText(root, cb, "direccionNumeroInterior"),
                    hasText(root, cb, "direccionColonia"),
                    hasText(root, cb, "direccionMunicipio"),
                    hasText(root, cb, "direccionEstado"),
                    hasText(root, cb, "direccionCodigoPostal"),
                    hasText(root, cb, "direccionReferencia")
            );
            return present ? predicate : cb.not(predicate);
        };
    }

    private Predicate hasText(Root<ClientesEntity> root, CriteriaBuilder cb, String field) {
        return cb.and(cb.isNotNull(root.get(field)), cb.notEqual(root.get(field), ""));
    }

    private Specification<ClientesEntity> comprasPresenceSpec(Integer empresaId, boolean present) {
        return (root, query, cb) -> {
            Subquery<Integer> subquery = query.subquery(Integer.class);
            Root<VentasEntity> venta = subquery.from(VentasEntity.class);
            subquery.select(cb.literal(1));
            subquery.where(
                    cb.equal(venta.get("cliente").get("idCliente"), root.get("idCliente")),
                    cb.equal(venta.get("empresa").get("idEmpresa"), empresaId)
            );

            return present ? cb.exists(subquery) : cb.not(cb.exists(subquery));
        };
    }

    private ClienteDirectorySummaryDTO buildDirectorySummary(Specification<ClientesEntity> specs) {
        ClienteDirectorySummaryDTO summary = new ClienteDirectorySummaryDTO();
        summary.setTotal(clientesRepository.count(specs));
        summary.setActivos(clientesRepository.count(specs.and(estadoFilterSpec("ACTIVO"))));
        summary.setInactivos(clientesRepository.count(specs.and(estadoFilterSpec("INACTIVO"))));
        summary.setArchivados(clientesRepository.count(specs.and(equalSpec("estadoCliente", "ARCHIVADO"))));
        summary.setConFiscales(clientesRepository.count(specs.and(fiscalPresenceSpec(true))));
        summary.setConDireccion(clientesRepository.count(specs.and(addressPresenceSpec(true))));
        return summary;
    }

    private Specification<ClientesEntity> equalSpec(String field, String value) {
        return (root, query, cb) -> cb.equal(root.get(field), value);
    }

    private ClienteDirectoryRowDTO toDirectoryRow(
            ClientesEntity cliente,
            Map<Integer, Long> comprasPorCliente,
            Map<Integer, PedidoClienteDTO> ultimaCompraPorCliente
    ) {
        ClienteDirectoryRowDTO row = new ClienteDirectoryRowDTO();
        row.setIdCliente(cliente.getIdCliente());
        row.setNombre(cliente.getNombre());
        row.setAlias(cliente.getAlias());
        row.setTipoCliente(isBlank(cliente.getTipoCliente()) ? "PERSONA" : cliente.getTipoCliente());
        row.setEstadoCliente(normalizedEstadoCliente(cliente));
        row.setEmail(cliente.getEmail());
        row.setTelefono(cliente.getTelefono());
        row.setWhatsapp(cliente.getWhatsapp());
        row.setDireccion(cliente.getDireccion());
        row.setDireccionCalle(cliente.getDireccionCalle());
        row.setDireccionNumeroExterior(cliente.getDireccionNumeroExterior());
        row.setDireccionNumeroInterior(cliente.getDireccionNumeroInterior());
        row.setDireccionColonia(cliente.getDireccionColonia());
        row.setDireccionMunicipio(cliente.getDireccionMunicipio());
        row.setDireccionEstado(cliente.getDireccionEstado());
        row.setDireccionCodigoPostal(cliente.getDireccionCodigoPostal());
        row.setDireccionReferencia(cliente.getDireccionReferencia());
        row.setNotasInternas(cliente.getNotasInternas());
        row.setRfc(cliente.getRfc());
        row.setRazonSocial(cliente.getRazonSocial());
        row.setCodigoPostalFiscal(cliente.getCodigoPostalFiscal());
        row.setCorreoFiscal(cliente.getCorreoFiscal());
        row.setRegimenFiscal(cliente.getRegimenFiscal());
        row.setUsoCfdi(cliente.getUsoCfdi());
        row.setAvatar(cliente.getAvatar());
        row.setEstatus("ACTIVO".equals(normalizedEstadoCliente(cliente)));
        row.setTieneDatosFiscales(hasFiscalData(cliente));
        row.setTieneDireccion(hasAddressData(cliente));
        row.setComprasRegistradas(comprasPorCliente.getOrDefault(cliente.getIdCliente(), 0L));
        row.setUltimaCompra(ultimaCompraPorCliente.get(cliente.getIdCliente()));
        row.setFechaCreacion(cliente.getFechaCreacion());
        row.setFechaModificacion(cliente.getFechaModificacion());
        return row;
    }

    private Map<Integer, Long> countComprasByCliente(List<Integer> idsCliente, Integer empresaId) {
        if (idsCliente == null || idsCliente.isEmpty()) return Map.of();
        return toCountMap(ventasRepository.countByClienteIdsAndEmpresa(idsCliente, empresaId));
    }

    private Map<Integer, PedidoClienteDTO> latestPurchaseByCliente(List<Integer> idsCliente, Integer empresaId) {
        if (idsCliente == null || idsCliente.isEmpty()) return Map.of();
        Map<Integer, PedidoClienteDTO> result = new HashMap<>();
        for (VentasEntity venta : ventasRepository.findLatestByClienteIdsAndEmpresa(idsCliente, empresaId)) {
            if (venta.getCliente() == null || venta.getCliente().getIdCliente() == null) continue;
            result.putIfAbsent(venta.getCliente().getIdCliente(), toPedidoResumenDto(venta));
        }
        return result;
    }

    private Map<Integer, Long> toCountMap(List<Object[]> rows) {
        Map<Integer, Long> result = new HashMap<>();
        if (rows == null) return result;

        for (Object[] row : rows) {
            if (row == null || row.length < 2 || !(row[0] instanceof Number) || !(row[1] instanceof Number)) {
                continue;
            }
            result.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
        }
        return result;
    }

    @Override
    public ClientesEntity update(ClientesEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();

        ClientesEntity entityToUpdate = findCliente(obj.getIdCliente(), empresaId);
        ensureClienteNoArchivado(entityToUpdate);
        String estadoActual = normalizedEstadoCliente(entityToUpdate);
        String estadoSolicitado = requestedEstadoCliente(obj, estadoActual);
        if (!estadoActual.equals(estadoSolicitado)) {
            throw new IllegalArgumentException("El estado del cliente se cambia desde el flujo de salida segura.");
        }
        if ("INACTIVO".equals(estadoActual)) {
            throw new IllegalStateException("El cliente inactivo solo puede reactivarse antes de modificarlo.");
        }
        validateCliente(obj);
        applyUpdate(entityToUpdate, obj);
        entityToUpdate.setUsuarioModificacion(user);
        syncEstatusFromEstado(entityToUpdate);

        return clientesRepository.save(entityToUpdate);
    }

    @Override
    public ClientesEntity changeEstado(Integer idCliente, String estadoCliente, String motivo, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ClientesEntity entity = findCliente(idCliente, empresaId);
        String estadoNuevo = validateEstado(estadoCliente);
        String estadoAnterior = normalizedEstadoCliente(entity);

        if (estadoAnterior.equals(estadoNuevo)) {
            throw new IllegalArgumentException("El cliente ya se encuentra en estado " + estadoNuevo);
        }
        validateEstadoTransition(estadoAnterior, estadoNuevo);

        entity.setEstadoClienteAnterior(estadoAnterior);
        entity.setEstadoCliente(estadoNuevo);
        entity.setUltimaAccionEstado(actionForEstado(estadoNuevo));
        entity.setMotivoCambioEstado(requireMotivo(motivo));
        entity.setUsuarioCambioEstado(user);
        entity.setFechaCambioEstado(LocalDateTime.now());
        syncEstatusFromEstado(entity);
        entity.setUsuarioModificacion(user);

        return clientesRepository.save(entity);
    }

    @Override
    public ClientesEntity delete(Integer id, String user) {
        return delete(id, "Eliminacion segura solicitada", user);
    }

    @Override
    public Map<String, Object> deletePolicy(Integer idCliente) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ClientesEntity entity = findCliente(idCliente, empresaId);

        return buildDeletePolicy(entity, empresaId);
    }

    @Override
    public ClientesEntity delete(Integer idCliente, String motivo, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ClientesEntity entity = findCliente(idCliente, empresaId);
        Map<String, Object> policy = buildDeletePolicy(entity, empresaId);

        if (!Boolean.TRUE.equals(policy.get("puedeEliminar"))) {
            throw new IllegalStateException(
                    "No se puede eliminar fisicamente el cliente porque tiene historial o datos relevantes. " +
                    "Desactivalo o archivalo. Motivos: " + policy.get("motivos")
            );
        }

        requireMotivo(motivo);
        entity.setUsuarioModificacion(user);
        clientesRepository.delete(entity);

        return entity;
    }

    @Override
    @Transactional(readOnly = true)
    public ClienteConPedidosDTO readById(Integer idCliente) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ClientesEntity cliente = findCliente(idCliente, empresaId);
        List<VentasEntity> ventas = ventasRepository
                .findTop5ByCliente_IdClienteAndEmpresa_IdEmpresaOrderByFechaCreacionDesc(idCliente, empresaId);

        List<PedidoClienteDTO> pedidos = ventas.stream().map(this::toPedidoDto).toList();

        ClienteConPedidosDTO dto = toClienteDto(cliente);
        dto.setComprasRegistradas(ventasRepository.countByCliente_IdClienteAndEmpresa_IdEmpresa(idCliente, empresaId));
        dto.setPedidos(pedidos);
        return dto;
    }

    private PedidoClienteDTO toPedidoDto(VentasEntity venta) {
        List<DetallePedidoClienteDTO> productos = venta.getDetalles() == null
                ? List.of()
                : venta.getDetalles().stream().map(this::toPedidoDetalleDto).toList();
        Integer productosTotales = productos.size();
        BigDecimal importeTotal = BigDecimal.valueOf(venta.getTotal() == null ? 0 : venta.getTotal())
                .setScale(2, RoundingMode.HALF_UP);
        String metodoPago = venta.getMetodoPago() == null ? "" : venta.getMetodoPago().getNombreMetodoPago();

        return new PedidoClienteDTO(
                "Venta #" + venta.getIdVenta(),
                venta.getFechaCreacion() == null ? null : venta.getFechaCreacion().toLocalDate(),
                productosTotales,
                importeTotal,
                metodoPago,
                venta.getEstado(),
                productos
        );
    }

    private PedidoClienteDTO toPedidoResumenDto(VentasEntity venta) {
        BigDecimal importeTotal = BigDecimal.valueOf(venta.getTotal() == null ? 0 : venta.getTotal())
                .setScale(2, RoundingMode.HALF_UP);
        String metodoPago = venta.getMetodoPago() == null ? "" : venta.getMetodoPago().getNombreMetodoPago();

        return new PedidoClienteDTO(
                "Venta #" + venta.getIdVenta(),
                venta.getFechaCreacion() == null ? null : venta.getFechaCreacion().toLocalDate(),
                0,
                importeTotal,
                metodoPago,
                venta.getEstado(),
                List.of()
        );
    }

    private DetallePedidoClienteDTO toPedidoDetalleDto(VentaDetalleEntity detalle) {
        ProductosEntity producto = detalle.getProducto();
        return new DetallePedidoClienteDTO(
                producto == null ? null : producto.getIdProducto(),
                producto == null ? "" : producto.getNombreProducto(),
                producto == null ? "" : producto.getCodigoBarras(),
                producto == null || producto.getUnidad() == null ? "" : producto.getUnidad().getNombreUnidad(),
                producto == null ? null : producto.getEsPesaje(),
                detalle.getCantidad(),
                toMoney(detalle.getPrecioUnitario()),
                toMoney(detalle.getSubtotal())
        );
    }

    private BigDecimal toMoney(Float value) {
        return BigDecimal.valueOf(value == null ? 0 : value).setScale(2, RoundingMode.HALF_UP);
    }

    private ClienteConPedidosDTO toClienteDto(ClientesEntity cliente) {
        ClienteConPedidosDTO dto = new ClienteConPedidosDTO();
        dto.setIdCliente(cliente.getIdCliente());
        dto.setNombre(cliente.getNombre());
        dto.setAlias(cliente.getAlias());
        dto.setTipoCliente(cliente.getTipoCliente());
        dto.setEstadoCliente(validateEstado(cliente.getEstadoCliente()));
        dto.setEmail(cliente.getEmail());
        dto.setTelefono(cliente.getTelefono());
        dto.setWhatsapp(cliente.getWhatsapp());
        dto.setDireccion(cliente.getDireccion());
        dto.setDireccionCalle(cliente.getDireccionCalle());
        dto.setDireccionNumeroExterior(cliente.getDireccionNumeroExterior());
        dto.setDireccionNumeroInterior(cliente.getDireccionNumeroInterior());
        dto.setDireccionColonia(cliente.getDireccionColonia());
        dto.setDireccionMunicipio(cliente.getDireccionMunicipio());
        dto.setDireccionEstado(cliente.getDireccionEstado());
        dto.setDireccionCodigoPostal(cliente.getDireccionCodigoPostal());
        dto.setDireccionReferencia(cliente.getDireccionReferencia());
        dto.setNotasInternas(cliente.getNotasInternas());
        dto.setRfc(cliente.getRfc());
        dto.setRazonSocial(cliente.getRazonSocial());
        dto.setCodigoPostalFiscal(cliente.getCodigoPostalFiscal());
        dto.setCorreoFiscal(cliente.getCorreoFiscal());
        dto.setRegimenFiscal(cliente.getRegimenFiscal());
        dto.setUsoCfdi(cliente.getUsoCfdi());
        dto.setAvatar(cliente.getAvatar());
        dto.setEstatus(cliente.getEstatus());
        dto.setFechaCreacion(cliente.getFechaCreacion());
        dto.setFechaModificacion(cliente.getFechaModificacion());
        dto.setUsuarioCreacion(cliente.getUsuarioCreacion());
        dto.setUsuarioModificacion(cliente.getUsuarioModificacion());
        dto.setUltimaAccionEstado(cliente.getUltimaAccionEstado());
        dto.setMotivoCambioEstado(cliente.getMotivoCambioEstado());
        dto.setUsuarioCambioEstado(cliente.getUsuarioCambioEstado());
        dto.setFechaCambioEstado(cliente.getFechaCambioEstado());
        return dto;
    }

    private ClientesEntity findCliente(Integer idCliente, Integer empresaId) {
        if (idCliente == null) {
            throw new IllegalArgumentException("El idCliente es obligatorio");
        }

        return clientesRepository.findByIdClienteAndEmpresa_IdEmpresa(idCliente, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Cliente no encontrado o no pertenece a tu empresa"));
    }

    private void validateCliente(ClientesEntity obj) {
        if (obj == null) {
            throw new IllegalArgumentException("El cliente es obligatorio");
        }

        if (isBlank(obj.getNombre())) {
            throw new IllegalArgumentException("El nombre del cliente es obligatorio");
        }

        if (!isBlank(obj.getEmail()) && !EMAIL_PATTERN.matcher(obj.getEmail().trim()).matches()) {
            throw new IllegalArgumentException("El correo del cliente no tiene un formato valido");
        }

        if (!isBlank(obj.getCorreoFiscal()) && !EMAIL_PATTERN.matcher(obj.getCorreoFiscal().trim()).matches()) {
            throw new IllegalArgumentException("El correo fiscal no tiene un formato valido");
        }

        validatePhone("telefono", obj.getTelefono());
        validatePhone("whatsapp", obj.getWhatsapp());

        if (!isBlank(obj.getRfc())) {
            String rfc = obj.getRfc().trim().toUpperCase();
            if (!RFC_PATTERN.matcher(rfc).matches()) {
                throw new IllegalArgumentException("El RFC del cliente no tiene un formato valido");
            }
        }

        if (!isBlank(obj.getTipoCliente())) {
            validateValue("tipoCliente", obj.getTipoCliente(), TIPOS_CLIENTE);
        }

        if (!isBlank(obj.getEstadoCliente())) {
            validateEstado(obj.getEstadoCliente());
        }
    }

    private void applyUpdate(ClientesEntity target, ClientesEntity source) {
        target.setNombre(source.getNombre().trim());
        target.setAlias(trimToNull(source.getAlias()));
        target.setTipoCliente(isBlank(source.getTipoCliente()) ? "PERSONA" : validateValue("tipoCliente", source.getTipoCliente(), TIPOS_CLIENTE));
        target.setEmail(trimToEmpty(source.getEmail()));
        target.setTelefono(sanitizePhone(source.getTelefono()));
        target.setWhatsapp(sanitizePhone(source.getWhatsapp()));
        target.setDireccion(trimToNull(buildAddressText(source, true)));
        target.setDireccionCalle(trimToNull(source.getDireccionCalle()));
        target.setDireccionNumeroExterior(trimToNull(source.getDireccionNumeroExterior()));
        target.setDireccionNumeroInterior(trimToNull(source.getDireccionNumeroInterior()));
        target.setDireccionColonia(trimToNull(source.getDireccionColonia()));
        target.setDireccionMunicipio(trimToNull(source.getDireccionMunicipio()));
        target.setDireccionEstado(trimToNull(source.getDireccionEstado()));
        target.setDireccionCodigoPostal(trimToNull(source.getDireccionCodigoPostal()));
        target.setDireccionReferencia(trimToNull(source.getDireccionReferencia()));
        target.setNotasInternas(trimToNull(source.getNotasInternas()));
        target.setRfc(trimToNull(source.getRfc()) == null ? null : source.getRfc().trim().toUpperCase());
        target.setRazonSocial(trimToNull(source.getRazonSocial()));
        target.setCodigoPostalFiscal(trimToNull(source.getCodigoPostalFiscal()));
        target.setCorreoFiscal(trimToEmpty(source.getCorreoFiscal()));
        target.setRegimenFiscal(trimToNull(source.getRegimenFiscal()));
        target.setUsoCfdi(trimToNull(source.getUsoCfdi()));
        target.setAvatar(trimToEmpty(source.getAvatar()));
    }

    private void normalizeCliente(ClientesEntity obj) {
        obj.setNombre(obj.getNombre().trim());
        obj.setAlias(trimToNull(obj.getAlias()));
        obj.setTipoCliente(isBlank(obj.getTipoCliente()) ? "PERSONA" : validateValue("tipoCliente", obj.getTipoCliente(), TIPOS_CLIENTE));
        obj.setEstadoCliente(isBlank(obj.getEstadoCliente()) ? "ACTIVO" : validateEstado(obj.getEstadoCliente()));
        obj.setEmail(trimToEmpty(obj.getEmail()));
        obj.setTelefono(sanitizePhone(obj.getTelefono()));
        obj.setWhatsapp(sanitizePhone(obj.getWhatsapp()));
        obj.setDireccion(trimToNull(buildAddressText(obj, true)));
        obj.setDireccionCalle(trimToNull(obj.getDireccionCalle()));
        obj.setDireccionNumeroExterior(trimToNull(obj.getDireccionNumeroExterior()));
        obj.setDireccionNumeroInterior(trimToNull(obj.getDireccionNumeroInterior()));
        obj.setDireccionColonia(trimToNull(obj.getDireccionColonia()));
        obj.setDireccionMunicipio(trimToNull(obj.getDireccionMunicipio()));
        obj.setDireccionEstado(trimToNull(obj.getDireccionEstado()));
        obj.setDireccionCodigoPostal(trimToNull(obj.getDireccionCodigoPostal()));
        obj.setDireccionReferencia(trimToNull(obj.getDireccionReferencia()));
        obj.setNotasInternas(trimToNull(obj.getNotasInternas()));
        obj.setRfc(trimToNull(obj.getRfc()) == null ? null : obj.getRfc().trim().toUpperCase());
        obj.setRazonSocial(trimToNull(obj.getRazonSocial()));
        obj.setCodigoPostalFiscal(trimToNull(obj.getCodigoPostalFiscal()));
        obj.setCorreoFiscal(trimToEmpty(obj.getCorreoFiscal()));
        obj.setRegimenFiscal(trimToNull(obj.getRegimenFiscal()));
        obj.setUsoCfdi(trimToNull(obj.getUsoCfdi()));
        obj.setAvatar(trimToEmpty(obj.getAvatar()));
    }

    private Map<String, Object> buildDeletePolicy(ClientesEntity entity, Integer empresaId) {
        Map<String, Long> dependencies = new LinkedHashMap<>();
        dependencies.put("ventasHistoricas", ventasRepository.countByCliente_IdClienteAndEmpresa_IdEmpresa(entity.getIdCliente(), empresaId));
        dependencies.put("datosFiscales", hasFiscalData(entity) ? 1L : 0L);
        dependencies.put("auditoriaRelevante", hasRelevantAudit(entity) ? 1L : 0L);

        List<String> motivos = new ArrayList<>();
        dependencies.forEach((key, count) -> {
            if (count != null && count > 0) {
                motivos.add(deleteReason(key, count));
            }
        });

        boolean puedeEliminar = motivos.isEmpty();
        Map<String, Object> policy = new LinkedHashMap<>();
        policy.put("idCliente", entity.getIdCliente());
        policy.put("nombre", entity.getNombre());
        policy.put("estadoCliente", validateEstado(entity.getEstadoCliente()));
        policy.put("puedeEliminar", puedeEliminar);
        policy.put("dependencias", dependencies);
        policy.put("motivos", motivos);
        policy.put("accionRecomendada", recommendedExitAction(entity, puedeEliminar));
        policy.put(
                "mensaje",
                puedeEliminar
                        ? "El cliente no tiene uso registrado. Puede eliminarse fisicamente si fue creado por error."
                        : "El cliente tiene historial, datos fiscales o auditoria. Conserva la informacion desactivandolo o archivandolo."
        );
        return policy;
    }

    private boolean hasFiscalData(ClientesEntity entity) {
        return !isBlank(entity.getRfc())
                || !isBlank(entity.getRazonSocial())
                || !isBlank(entity.getCodigoPostalFiscal())
                || !isBlank(entity.getCorreoFiscal())
                || !isBlank(entity.getRegimenFiscal())
                || !isBlank(entity.getUsoCfdi());
    }

    private boolean hasAddressData(ClientesEntity entity) {
        return !isBlank(entity.getDireccion())
                || !isBlank(entity.getDireccionCalle())
                || !isBlank(entity.getDireccionNumeroExterior())
                || !isBlank(entity.getDireccionNumeroInterior())
                || !isBlank(entity.getDireccionColonia())
                || !isBlank(entity.getDireccionMunicipio())
                || !isBlank(entity.getDireccionEstado())
                || !isBlank(entity.getDireccionCodigoPostal())
                || !isBlank(entity.getDireccionReferencia());
    }

    private boolean hasRelevantAudit(ClientesEntity entity) {
        return !isBlank(entity.getUsuarioModificacion())
                || !isBlank(entity.getUsuarioCambioEstado())
                || !isBlank(entity.getMotivoCambioEstado())
                || !isBlank(entity.getUltimaAccionEstado())
                || entity.getFechaCambioEstado() != null;
    }

    private String deleteReason(String key, Long count) {
        String suffix = count == 1 ? " registro" : " registros";
        return switch (key) {
            case "ventasHistoricas" -> "Tiene ventas historicas (" + count + suffix + ")";
            case "datosFiscales" -> "Tiene datos fiscales capturados";
            case "auditoriaRelevante" -> "Tiene auditoria relevante de cambios";
            default -> "Tiene " + key + " (" + count + suffix + ")";
        };
    }

    private void syncEstatusFromEstado(ClientesEntity obj) {
        if (isBlank(obj.getEstadoCliente())) {
            obj.setEstadoCliente(obj.getEstatus() != null && !obj.getEstatus() ? "INACTIVO" : "ACTIVO");
        }

        obj.setEstatus("ACTIVO".equals(validateEstado(obj.getEstadoCliente())));
    }

    private void validateEstadoTransition(String estadoAnterior, String estadoNuevo) {
        if ("ARCHIVADO".equals(estadoAnterior)) {
            throw new IllegalStateException("El cliente archivado es una baja historica definitiva y no puede reactivarse ni cambiar de estado.");
        }
        if ("ACTIVO".equals(estadoNuevo) && !"INACTIVO".equals(estadoAnterior)) {
            throw new IllegalArgumentException("Solo un cliente inactivo puede reactivarse.");
        }
        if ("INACTIVO".equals(estadoNuevo) && !"ACTIVO".equals(estadoAnterior)) {
            throw new IllegalArgumentException("Solo un cliente activo puede desactivarse.");
        }
    }

    private void ensureClienteNoArchivado(ClientesEntity entity) {
        if (entity != null && "ARCHIVADO".equals(normalizedEstadoCliente(entity))) {
            throw new IllegalStateException("El cliente archivado es solo historico y no acepta cambios.");
        }
    }

    private String actionForEstado(String estado) {
        return switch (estado) {
            case "ACTIVO" -> "REACTIVAR";
            case "INACTIVO" -> "DESACTIVAR";
            case "ARCHIVADO" -> "ARCHIVAR";
            default -> "CAMBIAR_ESTADO";
        };
    }

    private String recommendedExitAction(ClientesEntity entity, boolean puedeEliminar) {
        if (puedeEliminar) return "ELIMINAR_FISICAMENTE";
        String estado = normalizedEstadoCliente(entity);
        if ("ACTIVO".equals(estado)) return "DESACTIVAR_O_ARCHIVAR";
        if ("INACTIVO".equals(estado)) return "REACTIVAR_O_ARCHIVAR";
        return "SOLO_CONSULTA";
    }

    private String normalizedEstadoCliente(ClientesEntity entity) {
        if (entity == null || isBlank(entity.getEstadoCliente())) {
            return entity != null && Boolean.FALSE.equals(entity.getEstatus()) ? "INACTIVO" : "ACTIVO";
        }
        return validateEstado(entity.getEstadoCliente());
    }

    private String requestedEstadoCliente(ClientesEntity request, String fallback) {
        if (request == null) return fallback;
        if (!isBlank(request.getEstadoCliente())) {
            return validateEstado(request.getEstadoCliente());
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

    private void validatePhone(String field, String value) {
        String phone = sanitizePhone(value);
        if (!isBlank(phone) && !PHONE_PATTERN.matcher(phone).matches()) {
            throw new IllegalArgumentException(field + " debe tener 10 digitos o formato + lada y 10 digitos");
        }
    }

    private String validateEstado(String estado) {
        return validateValue("estadoCliente", isBlank(estado) ? "ACTIVO" : estado, ESTADOS_CLIENTE);
    }

    private String filterValue(String rawValue) {
        String value = trimToNull(rawValue);
        if (value == null || "TODOS".equalsIgnoreCase(value) || "ALL".equalsIgnoreCase(value)) {
            return null;
        }
        return normalizeValue(value);
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

    private String buildAddressText(ClientesEntity source, boolean keepLegacy) {
        List<String> parts = new ArrayList<>();
        addPart(parts, source.getDireccionCalle());
        addPart(parts, source.getDireccionNumeroExterior());
        addPart(parts, source.getDireccionNumeroInterior());
        addPart(parts, source.getDireccionColonia());
        addPart(parts, source.getDireccionMunicipio());
        addPart(parts, source.getDireccionEstado());
        addPart(parts, source.getDireccionCodigoPostal());
        addPart(parts, source.getDireccionReferencia());

        if (!parts.isEmpty()) {
            return String.join(", ", parts);
        }

        return keepLegacy ? trimToNull(source.getDireccion()) : null;
    }

    private void addPart(List<String> parts, String value) {
        String text = trimToNull(value);
        if (text != null) {
            parts.add(text);
        }
    }

    private String sanitizePhone(String value) {
        if (value == null) return "";
        String trimmed = value.trim();
        String prefix = trimmed.startsWith("+") ? "+" : "";
        return prefix + trimmed.replaceAll("[^0-9]", "");
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
