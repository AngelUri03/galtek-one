package com.galtekone.services.impl;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.ProveedorActivoEntity;
import com.galtekone.entity.ProveedoresEntity;
import com.galtekone.repository.ProveedorActivoRepository;
import com.galtekone.repository.ProveedoresRepository;
import com.galtekone.services.ProveedorActivoService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class ProveedorActivoServiceImpl implements ProveedorActivoService {

    private static final Set<String> TIPOS = Set.of(
            "ENFRIADOR",
            "REFRIGERADOR",
            "STAND",
            "ANAQUEL",
            "EXHIBIDOR",
            "LONA",
            "SOMBRILLA",
            "BASCULA",
            "OTRO"
    );

    private static final Set<String> ESTADOS = Set.of("EN_TIENDA", "DANADO", "REPARACION", "DEVUELTO", "PERDIDO");

    @Autowired
    private ProveedorActivoRepository repository;

    @Autowired
    private ProveedoresRepository proveedoresRepository;

    @Override
    public List<ProveedorActivoEntity> readByProveedor(Integer idProveedor) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedor(idProveedor, empresaId);
        return repository.findByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId);
    }

    @Override
    public ProveedorActivoEntity create(Integer idProveedor, ProveedorActivoEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ProveedoresEntity proveedor = ensureProveedor(idProveedor, empresaId);
        validate(obj, true);
        normalize(obj);

        obj.setProveedor(proveedor);
        obj.setEmpresa(empresa(empresaId));
        obj.setUsuarioCreacion(user);
        syncEstatus(obj);

        return repository.save(obj);
    }

    @Override
    public ProveedorActivoEntity update(Integer idProveedor, Integer idProveedorActivo, ProveedorActivoEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedor(idProveedor, empresaId);
        ProveedorActivoEntity entity = find(idProveedor, idProveedorActivo, empresaId);
        validate(obj, false);
        applyUpdate(entity, obj);
        entity.setUsuarioModificacion(user);
        syncEstatus(entity);

        return repository.save(entity);
    }

    @Override
    public ProveedorActivoEntity delete(Integer idProveedor, Integer idProveedorActivo, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedor(idProveedor, empresaId);
        ProveedorActivoEntity entity = find(idProveedor, idProveedorActivo, empresaId);

        entity.setEstatus(false);
        entity.setUsuarioModificacion(user);

        return repository.save(entity);
    }

    private ProveedoresEntity ensureProveedor(Integer idProveedor, Integer empresaId) {
        return proveedoresRepository.findByIdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Proveedor no encontrado o no pertenece a tu empresa"));
    }

    private ProveedorActivoEntity find(Integer idProveedor, Integer idActivo, Integer empresaId) {
        return repository.findByIdProveedorActivoAndProveedor_IdProveedorAndEmpresa_IdEmpresa(idActivo, idProveedor, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Activo no encontrado o no pertenece al proveedor"));
    }

    private void validate(ProveedorActivoEntity obj, boolean creating) {
        if (obj == null) throw new IllegalArgumentException("El activo es obligatorio");
        if (creating && isBlank(obj.getNombre())) throw new IllegalArgumentException("El nombre del activo es obligatorio");
        if (!creating && obj.getNombre() != null && isBlank(obj.getNombre())) {
            throw new IllegalArgumentException("El nombre del activo no puede estar vacio");
        }
        if (!isBlank(obj.getTipo())) validateValue("tipo", obj.getTipo(), TIPOS);
        if (!isBlank(obj.getEstadoActivoPrestado())) validateValue("estadoActivoPrestado", obj.getEstadoActivoPrestado(), ESTADOS);
        requireNonNegative(obj.getDepositoGarantia(), "depositoGarantia");
    }

    private void applyUpdate(ProveedorActivoEntity target, ProveedorActivoEntity source) {
        if (source.getNombre() != null) target.setNombre(source.getNombre().trim());
        if (source.getTipo() != null) target.setTipo(normalizeValue(source.getTipo()));
        if (source.getNumeroSerie() != null) target.setNumeroSerie(trimToNull(source.getNumeroSerie()));
        if (source.getFechaEntrega() != null) target.setFechaEntrega(source.getFechaEntrega());
        if (source.getEstadoFisico() != null) target.setEstadoFisico(trimToNull(source.getEstadoFisico()));
        if (source.getUbicacionTienda() != null) target.setUbicacionTienda(trimToNull(source.getUbicacionTienda()));
        if (source.getCondicionesPrestamo() != null) target.setCondicionesPrestamo(trimToNull(source.getCondicionesPrestamo()));
        if (source.getDepositoGarantia() != null) target.setDepositoGarantia(source.getDepositoGarantia());
        if (source.getEstadoActivoPrestado() != null) target.setEstadoActivoPrestado(validateValue("estadoActivoPrestado", source.getEstadoActivoPrestado(), ESTADOS));
        if (source.getNotas() != null) target.setNotas(trimToNull(source.getNotas()));
        if (source.getEstatus() != null) target.setEstatus(source.getEstatus());
    }

    private void normalize(ProveedorActivoEntity obj) {
        obj.setNombre(obj.getNombre().trim());
        obj.setTipo(isBlank(obj.getTipo()) ? "OTRO" : normalizeValue(obj.getTipo()));
        obj.setNumeroSerie(trimToNull(obj.getNumeroSerie()));
        obj.setEstadoFisico(trimToNull(obj.getEstadoFisico()));
        obj.setUbicacionTienda(trimToNull(obj.getUbicacionTienda()));
        obj.setCondicionesPrestamo(trimToNull(obj.getCondicionesPrestamo()));
        obj.setEstadoActivoPrestado(isBlank(obj.getEstadoActivoPrestado()) ? "EN_TIENDA" : validateValue("estadoActivoPrestado", obj.getEstadoActivoPrestado(), ESTADOS));
        obj.setNotas(trimToNull(obj.getNotas()));
    }

    private void syncEstatus(ProveedorActivoEntity obj) {
        if ("DEVUELTO".equals(obj.getEstadoActivoPrestado()) || "PERDIDO".equals(obj.getEstadoActivoPrestado())) {
            obj.setEstatus(false);
        } else if (obj.getEstatus() == null) {
            obj.setEstatus(true);
        }
    }

    private EmpresasEntity empresa(Integer empresaId) {
        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(empresaId);
        return empresa;
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
}
