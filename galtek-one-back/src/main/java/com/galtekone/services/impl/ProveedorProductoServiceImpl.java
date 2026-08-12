package com.galtekone.services.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.Optional;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.HistorialCostosEntity;
import com.galtekone.entity.ProductosEntity;
import com.galtekone.entity.ProveedorProductoEntity;
import com.galtekone.entity.ProveedoresEntity;
import com.galtekone.repository.HistorialCostosRepository;
import com.galtekone.repository.ProductosRepository;
import com.galtekone.repository.ProveedorProductoRespository;
import com.galtekone.repository.ProveedoresRepository;
import com.galtekone.services.ProveedorProductoService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class ProveedorProductoServiceImpl implements ProveedorProductoService {

    private static final Set<String> ESTADOS_RELACION = Set.of("ACTIVA", "INACTIVA", "ARCHIVADA");

    @Autowired
    private ProveedorProductoRespository proveedorProductoRepository;

    @Autowired
    private ProveedoresRepository proveedoresRepository;

    @Autowired
    private ProductosRepository productosRepository;

    @Autowired
    private HistorialCostosRepository historialCostosRepository;

    @Override
    public ProveedorProductoEntity create(ProveedorProductoEntity obj, String user, Integer idEmpresa) {
        if (idEmpresa == null) {
            throw new IllegalArgumentException("El idEmpresa es obligatorio");
        }

        validate(obj, true);
        normalize(obj);
        obj.setProveedor(resolveProveedor(obj.getProveedor(), idEmpresa));
        obj.setProducto(resolveProducto(obj.getProducto(), idEmpresa));
        obj.setEmpresa(empresa(idEmpresa));
        obj.setUsuarioCreacion(user);
        syncEstatus(obj);

        ProveedorProductoEntity saved = proveedorProductoRepository.save(obj);
        registerCostHistory(saved, user);
        return saved;
    }

    @Override
    public List<ProveedorProductoEntity> read(Specification<ProveedorProductoEntity> specs, Integer idEmpresa) {
        if (idEmpresa == null) {
            throw new IllegalArgumentException("El idEmpresa es obligatorio");
        }

        Specification<ProveedorProductoEntity> empresaSpec =
                (root, query, cb) -> cb.equal(root.get("empresa").get("idEmpresa"), idEmpresa);

        return proveedorProductoRepository.findAll(Specification.where(empresaSpec).and(specs));
    }

    @Override
    public ProveedorProductoEntity update(ProveedorProductoEntity obj, String user, Integer idEmpresa) {
        if (idEmpresa == null) {
            throw new IllegalArgumentException("El idEmpresa es obligatorio");
        }

        ProveedorProductoEntity entity = proveedorProductoRepository
                .findByIdProveedorProductoAndEmpresa_IdEmpresa(obj.getIdProveedorProducto(), idEmpresa)
                .orElseThrow(() -> new EntityNotFoundException("ProveedorProducto no encontrado o no pertenece a la empresa"));

        validate(obj, false);
        BigDecimal previousCost = entity.getUltimoCosto();
        applyUpdate(entity, obj, idEmpresa);
        entity.setUsuarioModificacion(user);
        syncEstatus(entity);

        ProveedorProductoEntity saved = proveedorProductoRepository.save(entity);
        registerCostHistoryIfChanged(saved, previousCost, user);
        return saved;
    }

    @Override
    public ProveedorProductoEntity delete(Integer idProveedorProducto, String user, Integer idEmpresa) {
        if (idEmpresa == null) {
            throw new IllegalArgumentException("El idEmpresa es obligatorio");
        }

        ProveedorProductoEntity entity = proveedorProductoRepository
                .findByIdProveedorProductoAndEmpresa_IdEmpresa(idProveedorProducto, idEmpresa)
                .orElseThrow(() -> new EntityNotFoundException("ProveedorProducto no encontrado o no pertenece a la empresa"));

        entity.setEstadoRelacion("INACTIVA");
        entity.setEstatus(false);
        entity.setUsuarioModificacion(user);

        return proveedorProductoRepository.save(entity);
    }

    @Override
    public List<ProveedorProductoEntity> readByProveedor(Integer idProveedor) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedor(idProveedor, empresaId);
        return proveedorProductoRepository.findByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId);
    }

    @Override
    public ProveedorProductoEntity createForProveedor(Integer idProveedor, ProveedorProductoEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ProveedoresEntity proveedor = ensureProveedor(idProveedor, empresaId);
        if (obj == null) throw new IllegalArgumentException("La relacion proveedor-producto es obligatoria");

        obj.setProveedor(proveedor);
        validate(obj, true);
        normalize(obj);
        obj.setProducto(resolveProducto(obj.getProducto(), empresaId));
        obj.setEmpresa(empresa(empresaId));
        obj.setUsuarioCreacion(user);
        syncEstatus(obj);

        ProveedorProductoEntity saved = proveedorProductoRepository.save(obj);
        registerCostHistory(saved, user);
        return saved;
    }

    @Override
    public ProveedorProductoEntity updateForProveedor(Integer idProveedor, Integer idProveedorProducto, ProveedorProductoEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedor(idProveedor, empresaId);
        ProveedorProductoEntity entity = proveedorProductoRepository
                .findByIdProveedorProductoAndProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedorProducto, idProveedor, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Producto asociado no encontrado o no pertenece al proveedor"));

        validate(obj, false);
        BigDecimal previousCost = entity.getUltimoCosto();
        applyUpdate(entity, obj, empresaId);
        entity.setUsuarioModificacion(user);
        syncEstatus(entity);

        ProveedorProductoEntity saved = proveedorProductoRepository.save(entity);
        registerCostHistoryIfChanged(saved, previousCost, user);
        return saved;
    }

    @Override
    public ProveedorProductoEntity deleteForProveedor(Integer idProveedor, Integer idProveedorProducto, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedor(idProveedor,empresaId);
        ProveedorProductoEntity entity = proveedorProductoRepository
                .findByIdProveedorProductoAndProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedorProducto, idProveedor, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Producto asociado no encontrado o no pertenece al proveedor"));

        entity.setEstadoRelacion("INACTIVA");
        entity.setEstatus(false);
        entity.setUsuarioModificacion(user);

        return proveedorProductoRepository.save(entity);
    }

    @Override
    public Object readCostHistory(Integer idProveedor, Integer idProveedorProducto) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedor(idProveedor, empresaId);
        ProveedorProductoEntity relation = proveedorProductoRepository
                .findByIdProveedorProductoAndProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedorProducto, idProveedor, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Producto asociado no encontrado o no pertenece al proveedor"));

        Integer idProducto = relation.getProducto() == null ? null : relation.getProducto().getIdProducto();
        if (idProducto == null) {
            throw new IllegalStateException("La relacion no tiene producto interno asociado");
        }

        return historialCostosRepository
                .findByProveedor_IdProveedorAndProducto_IdProductoAndEmpresa_IdEmpresaOrderByFechaCambioDesc(
                        idProveedor, idProducto, empresaId);
    }

    @Override
    public ProveedorProductoEntity create(ProveedorProductoEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        return create(obj, user, empresaId);
    }

    @Override
    public List<ProveedorProductoEntity> read(Specification<ProveedorProductoEntity> specs) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        return read(specs, empresaId);
    }

    @Override
    public ProveedorProductoEntity update(ProveedorProductoEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        return update(obj, user, empresaId);
    }

    @Override
    public ProveedorProductoEntity delete(Integer id, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        return delete(id, user, empresaId);
    }

    private void validate(ProveedorProductoEntity obj, boolean creating) {
        if (obj == null) throw new IllegalArgumentException("La relacion proveedor-producto es obligatoria");
        if (creating && (obj.getProducto() == null || obj.getProducto().getIdProducto() == null)) {
            throw new IllegalArgumentException("El producto es obligatorio");
        }
        if (creating && (obj.getProveedor() == null || obj.getProveedor().getIdProveedor() == null)) {
            throw new IllegalArgumentException("El proveedor es obligatorio");
        }
        if (obj.getPrecioCompra() != null && obj.getPrecioCompra() < 0) {
            throw new IllegalArgumentException("precioCompra no puede ser negativo");
        }
        requireNonNegative(obj.getUltimoCosto(), "ultimoCosto");
        requireNonNegative(obj.getCantidadMinima(), "cantidadMinima");
        if (obj.getEstadoRelacion() != null) {
            validateEstado(obj.getEstadoRelacion());
        }
    }

    private void applyUpdate(ProveedorProductoEntity target, ProveedorProductoEntity source, Integer empresaId) {
        if (source.getProducto() != null) target.setProducto(resolveProducto(source.getProducto(), empresaId));
        if (source.getProveedor() != null) target.setProveedor(resolveProveedor(source.getProveedor(), empresaId));
        if (source.getPrecioCompra() != null) target.setPrecioCompra(source.getPrecioCompra());
        if (source.getSkuProveedor() != null) target.setSkuProveedor(trimToNull(source.getSkuProveedor()));
        if (source.getUltimoCosto() != null) target.setUltimoCosto(source.getUltimoCosto());
        if (source.getFechaUltimoCosto() != null) target.setFechaUltimoCosto(source.getFechaUltimoCosto());
        if (source.getPresentacionCompra() != null) target.setPresentacionCompra(trimToNull(source.getPresentacionCompra()));
        if (source.getCantidadMinima() != null) target.setCantidadMinima(source.getCantidadMinima());
        if (source.getProveedorPreferido() != null) target.setProveedorPreferido(source.getProveedorPreferido());
        if (source.getEstadoRelacion() != null) target.setEstadoRelacion(validateEstado(source.getEstadoRelacion()));
        if (source.getEstatus() != null && source.getEstadoRelacion() == null) {
            target.setEstadoRelacion(source.getEstatus() ? "ACTIVA" : "INACTIVA");
        }
        normalizeCostFields(target);
    }

    private void normalize(ProveedorProductoEntity obj) {
        obj.setSkuProveedor(trimToNull(obj.getSkuProveedor()));
        obj.setPresentacionCompra(trimToNull(obj.getPresentacionCompra()));
        obj.setEstadoRelacion(obj.getEstadoRelacion() == null ? "ACTIVA" : validateEstado(obj.getEstadoRelacion()));
        normalizeCostFields(obj);
    }

    private void normalizeCostFields(ProveedorProductoEntity obj) {
        if (obj.getUltimoCosto() == null && obj.getPrecioCompra() != null) {
            obj.setUltimoCosto(BigDecimal.valueOf(obj.getPrecioCompra().doubleValue()));
        }
        if (obj.getPrecioCompra() == null && obj.getUltimoCosto() != null) {
            obj.setPrecioCompra(obj.getUltimoCosto().floatValue());
        }
        if (obj.getUltimoCosto() != null && obj.getFechaUltimoCosto() == null) {
            obj.setFechaUltimoCosto(LocalDateTime.now());
        }
    }

    private void registerCostHistoryIfChanged(ProveedorProductoEntity entity, BigDecimal previousCost, String user) {
        BigDecimal currentCost = entity.getUltimoCosto();
        if (currentCost == null) return;
        if (previousCost != null && previousCost.compareTo(currentCost) == 0) return;
        registerCostHistory(entity, user);
    }

    private void registerCostHistory(ProveedorProductoEntity entity, String user) {

    BigDecimal nuevoCosto = entity.getUltimoCosto();

    if (nuevoCosto == null
            || entity.getProveedor() == null
            || entity.getProducto() == null
            || entity.getEmpresa() == null) {
        return;
    }

    Optional<HistorialCostosEntity> ultimoRegistro =
            historialCostosRepository
                    .findTopByProducto_IdProductoAndEmpresa_IdEmpresaOrderByFechaCambioDesc(
                            entity.getProducto().getIdProducto(),
                            entity.getEmpresa().getIdEmpresa());

    BigDecimal costoAnterior = ultimoRegistro
            .map(HistorialCostosEntity::getCostoNuevo)
            .orElse(BigDecimal.ZERO);

    HistorialCostosEntity history = new HistorialCostosEntity();

    history.setProveedor(entity.getProveedor());
    history.setProducto(entity.getProducto());
    history.setEmpresa(entity.getEmpresa());

    history.setCostoAnterior(costoAnterior);
    history.setCostoNuevo(nuevoCosto);
    history.setDiferencia(nuevoCosto.subtract(costoAnterior));

    history.setUsuario(user);
    history.setFechaCambio(LocalDateTime.now());

    historialCostosRepository.save(history);
    }
   

    private ProveedoresEntity ensureProveedor(Integer idProveedor, Integer empresaId) {
        if (idProveedor == null) throw new IllegalArgumentException("El idProveedor es obligatorio");
        return proveedoresRepository.findByIdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Proveedor no encontrado o no pertenece a tu empresa"));
    }

    private ProveedoresEntity resolveProveedor(ProveedoresEntity proveedor, Integer empresaId) {
        if (proveedor == null || proveedor.getIdProveedor() == null) {
            throw new IllegalArgumentException("El proveedor es obligatorio");
        }
        return ensureProveedor(proveedor.getIdProveedor(), empresaId);
    }

    private ProductosEntity resolveProducto(ProductosEntity producto, Integer empresaId) {
        if (producto == null || producto.getIdProducto() == null) {
            throw new IllegalArgumentException("El producto es obligatorio");
        }
        return productosRepository.findByIdProductoAndEmpresa_IdEmpresa(producto.getIdProducto(), empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado o no pertenece a tu empresa"));
    }

    private void syncEstatus(ProveedorProductoEntity obj) {
        obj.setEstatus("ACTIVA".equals(validateEstado(obj.getEstadoRelacion())));
    }

    private String validateEstado(String estado) {
        String value = estado.trim().toUpperCase().replace(' ', '_').replace('-', '_');
        if (!ESTADOS_RELACION.contains(value)) {
            throw new IllegalArgumentException("estadoRelacion no es valido. Valores permitidos: " + ESTADOS_RELACION);
        }
        return value;
    }

    private void requireNonNegative(BigDecimal value, String field) {
        if (value != null && value.signum() < 0) {
            throw new IllegalArgumentException(field + " no puede ser negativo");
        }
    }

    private EmpresasEntity empresa(Integer empresaId) {
        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(empresaId);
        return empresa;
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
