package com.galtekone.services.impl;

import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.ProveedorContactoEntity;
import com.galtekone.entity.ProveedoresEntity;
import com.galtekone.repository.ProveedorContactoRepository;
import com.galtekone.repository.ProveedoresRepository;
import com.galtekone.services.ProveedorContactoService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class ProveedorContactoServiceImpl implements ProveedorContactoService {

    private static final Set<String> ROLES = Set.of(
            "VENDEDOR",
            "REPARTIDOR",
            "COBRANZA",
            "ATENCION_CLIENTES",
            "ENCARGADO",
            "OTRO"
    );

    private static final Set<String> ESTADOS = Set.of("ACTIVO", "INACTIVO");

    @Autowired
    private ProveedorContactoRepository repository;

    @Autowired
    private ProveedoresRepository proveedoresRepository;

    @Override
    public List<ProveedorContactoEntity> readByProveedor(Integer idProveedor) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedor(idProveedor, empresaId);
        return repository.findByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId);
    }

    @Override
    public ProveedorContactoEntity create(Integer idProveedor, ProveedorContactoEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ProveedoresEntity proveedor = ensureProveedor(idProveedor, empresaId);
        ensureProveedorEditable(proveedor);
        validate(obj, true);
        normalize(obj);

        obj.setProveedor(proveedor);
        obj.setEmpresa(empresa(empresaId));
        obj.setUsuarioCreacion(user);
        syncEstatus(obj);
        clearOtherPrincipalIfNeeded(idProveedor, empresaId, obj);

        return repository.save(obj);
    }

    @Override
    public ProveedorContactoEntity update(Integer idProveedor, Integer idProveedorContacto, ProveedorContactoEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedorEditable(ensureProveedor(idProveedor, empresaId));
        ProveedorContactoEntity entity = find(idProveedor, idProveedorContacto, empresaId);
        validate(obj, false);
        applyUpdate(entity, obj);
        entity.setUsuarioModificacion(user);
        syncEstatus(entity);
        clearOtherPrincipalIfNeeded(idProveedor, empresaId, entity);

        return repository.save(entity);
    }

    @Override
    public ProveedorContactoEntity delete(Integer idProveedor, Integer idProveedorContacto, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedorEditable(ensureProveedor(idProveedor, empresaId));
        ProveedorContactoEntity entity = find(idProveedor, idProveedorContacto, empresaId);

        entity.setEstadoContacto("INACTIVO");
        entity.setEstatus(false);
        entity.setUsuarioModificacion(user);

        return repository.save(entity);
    }

    private ProveedoresEntity ensureProveedor(Integer idProveedor, Integer empresaId) {
        return proveedoresRepository.findByIdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Proveedor no encontrado o no pertenece a tu empresa"));
    }

    private void ensureProveedorEditable(ProveedoresEntity proveedor) {
        if (proveedor != null && "ARCHIVADO".equalsIgnoreCase(trimToNull(proveedor.getEstadoProveedor()))) {
            throw new IllegalStateException("El proveedor esta archivado como baja historica definitiva y no acepta cambios ni relaciones.");
        }
    }

    private ProveedorContactoEntity find(Integer idProveedor, Integer idContacto, Integer empresaId) {
        return repository.findByIdProveedorContactoAndProveedor_IdProveedorAndEmpresa_IdEmpresa(idContacto, idProveedor, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Contacto no encontrado o no pertenece al proveedor"));
    }

    private void validate(ProveedorContactoEntity obj, boolean creating) {
        if (obj == null) throw new IllegalArgumentException("El contacto es obligatorio");
        if (creating && isBlank(obj.getNombre())) throw new IllegalArgumentException("El nombre del contacto es obligatorio");
        if (!creating && obj.getNombre() != null && isBlank(obj.getNombre())) {
            throw new IllegalArgumentException("El nombre del contacto no puede estar vacio");
        }
        if (!isBlank(obj.getRol())) validateValue("rol", obj.getRol(), ROLES);
        if (!isBlank(obj.getEstadoContacto())) validateValue("estadoContacto", obj.getEstadoContacto(), ESTADOS);
        if (isBlank(obj.getTelefono()) && isBlank(obj.getWhatsapp()) && isBlank(obj.getCorreo())) {
            throw new IllegalArgumentException("El contacto debe tener telefono, WhatsApp o correo");
        }
    }

    private void applyUpdate(ProveedorContactoEntity target, ProveedorContactoEntity source) {
        if (source.getNombre() != null) target.setNombre(source.getNombre().trim());
        if (source.getRol() != null) target.setRol(normalizeValue(source.getRol()));
        if (source.getTelefono() != null) target.setTelefono(trimToNull(source.getTelefono()));
        if (source.getWhatsapp() != null) target.setWhatsapp(trimToNull(source.getWhatsapp()));
        if (source.getCorreo() != null) target.setCorreo(trimToNull(source.getCorreo()));
        if (source.getNotas() != null) target.setNotas(trimToNull(source.getNotas()));
        if (source.getContactoPrincipal() != null) target.setContactoPrincipal(source.getContactoPrincipal());
        if (source.getEstadoContacto() != null) target.setEstadoContacto(validateValue("estadoContacto", source.getEstadoContacto(), ESTADOS));
        if (source.getEstatus() != null && source.getEstadoContacto() == null) {
            target.setEstadoContacto(source.getEstatus() ? "ACTIVO" : "INACTIVO");
        }
    }

    private void normalize(ProveedorContactoEntity obj) {
        obj.setNombre(obj.getNombre().trim());
        obj.setRol(isBlank(obj.getRol()) ? "OTRO" : normalizeValue(obj.getRol()));
        obj.setTelefono(trimToNull(obj.getTelefono()));
        obj.setWhatsapp(trimToNull(obj.getWhatsapp()));
        obj.setCorreo(trimToNull(obj.getCorreo()));
        obj.setNotas(trimToNull(obj.getNotas()));
        obj.setEstadoContacto(isBlank(obj.getEstadoContacto()) ? "ACTIVO" : validateValue("estadoContacto", obj.getEstadoContacto(), ESTADOS));
    }

    private void clearOtherPrincipalIfNeeded(Integer idProveedor, Integer empresaId, ProveedorContactoEntity selected) {
        if (!Boolean.TRUE.equals(selected.getContactoPrincipal())) return;

        for (ProveedorContactoEntity contacto : repository.findByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId)) {
            if (contacto.getIdProveedorContacto() != null
                    && !contacto.getIdProveedorContacto().equals(selected.getIdProveedorContacto())
                    && Boolean.TRUE.equals(contacto.getContactoPrincipal())) {
                contacto.setContactoPrincipal(false);
                repository.save(contacto);
            }
        }
    }

    private void syncEstatus(ProveedorContactoEntity obj) {
        obj.setEstatus(!"INACTIVO".equals(validateValue("estadoContacto", obj.getEstadoContacto(), ESTADOS)));
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

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
