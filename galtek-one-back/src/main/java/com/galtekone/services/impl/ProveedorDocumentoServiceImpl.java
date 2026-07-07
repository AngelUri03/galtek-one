package com.galtekone.services.impl;

import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.ProveedorActivoEntity;
import com.galtekone.entity.ProveedorDocumentoEntity;
import com.galtekone.entity.ProveedoresEntity;
import com.galtekone.repository.ProveedorActivoRepository;
import com.galtekone.repository.ProveedorDocumentoRepository;
import com.galtekone.repository.ProveedoresRepository;
import com.galtekone.services.ProveedorDocumentoService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class ProveedorDocumentoServiceImpl implements ProveedorDocumentoService {

    private static final long MAX_DOCUMENT_BYTES = 25L * 1024L * 1024L;
    private static final Set<String> TIPOS = Set.of(
            "CONTRATO",
            "COMODATO",
            "LISTA_PRECIOS",
            "CATALOGO",
            "EVIDENCIA",
            "DOCUMENTO_CREDITO",
            "IDENTIFICACION",
            "OTRO"
    );
    private static final Set<String> ESTADOS = Set.of("ACTIVO", "ARCHIVADO");
    private static final Set<String> MIME_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "text/csv",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain"
    );
    private static final Set<String> EXTENSIONES = Set.of(
            ".pdf",
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
            ".xlsx",
            ".xls",
            ".csv",
            ".docx",
            ".txt"
    );

    @Autowired
    private ProveedorDocumentoRepository repository;

    @Autowired
    private ProveedoresRepository proveedoresRepository;

    @Autowired
    private ProveedorActivoRepository activoRepository;

    @Override
    public List<ProveedorDocumentoEntity> readByProveedor(Integer idProveedor) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedor(idProveedor, empresaId);
        return repository.findByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId);
    }

    @Override
    public ProveedorDocumentoEntity create(Integer idProveedor, ProveedorDocumentoEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ProveedoresEntity proveedor = ensureProveedor(idProveedor, empresaId);
        validate(obj, true);
        normalize(obj);

        obj.setProveedor(proveedor);
        obj.setActivo(resolveActivo(obj.getActivo(), idProveedor, empresaId));
        obj.setEmpresa(empresa(empresaId));
        obj.setUsuarioCreacion(user);
        syncEstatus(obj);

        return repository.save(obj);
    }

    @Override
    public ProveedorDocumentoEntity update(Integer idProveedor, Integer idProveedorDocumento, ProveedorDocumentoEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedor(idProveedor, empresaId);
        ProveedorDocumentoEntity entity = find(idProveedor, idProveedorDocumento, empresaId);
        validate(obj, false);
        applyUpdate(entity, obj, idProveedor, empresaId);
        entity.setUsuarioModificacion(user);
        syncEstatus(entity);

        return repository.save(entity);
    }

    @Override
    public ProveedorDocumentoEntity delete(Integer idProveedor, Integer idProveedorDocumento, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedor(idProveedor, empresaId);
        ProveedorDocumentoEntity entity = find(idProveedor, idProveedorDocumento, empresaId);

        entity.setEstadoDocumento("ARCHIVADO");
        entity.setEstatus(false);
        entity.setUsuarioModificacion(user);

        return repository.save(entity);
    }

    private ProveedoresEntity ensureProveedor(Integer idProveedor, Integer empresaId) {
        return proveedoresRepository.findByIdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Proveedor no encontrado o no pertenece a tu empresa"));
    }

    private ProveedorDocumentoEntity find(Integer idProveedor, Integer idDocumento, Integer empresaId) {
        return repository.findByIdProveedorDocumentoAndProveedor_IdProveedorAndEmpresa_IdEmpresa(idDocumento, idProveedor, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Documento no encontrado o no pertenece al proveedor"));
    }

    private void validate(ProveedorDocumentoEntity obj, boolean creating) {
        if (obj == null) throw new IllegalArgumentException("El documento es obligatorio");
        if (creating && isBlank(obj.getNombre())) throw new IllegalArgumentException("El nombre del documento es obligatorio");
        if (!creating && obj.getNombre() != null && isBlank(obj.getNombre())) {
            throw new IllegalArgumentException("El nombre del documento no puede estar vacio");
        }
        if (!isBlank(obj.getTipo())) validateValue("tipo", obj.getTipo(), TIPOS);
        if (!isBlank(obj.getEstadoDocumento())) validateValue("estadoDocumento", obj.getEstadoDocumento(), ESTADOS);
        if (obj.getTamanoBytes() != null && (obj.getTamanoBytes() < 0 || obj.getTamanoBytes() > MAX_DOCUMENT_BYTES)) {
            throw new IllegalArgumentException("tamanoBytes debe estar entre 0 y " + MAX_DOCUMENT_BYTES);
        }
        if (!isBlank(obj.getMimeType()) && !MIME_TYPES.contains(obj.getMimeType().trim().toLowerCase())) {
            throw new IllegalArgumentException("mimeType no es valido para documentos de proveedor");
        }
        if (!isBlank(obj.getRutaDocumento()) && !hasAllowedExtension(obj.getRutaDocumento())) {
            throw new IllegalArgumentException("La ruta del documento debe apuntar a un formato permitido");
        }
    }

    private void applyUpdate(ProveedorDocumentoEntity target, ProveedorDocumentoEntity source, Integer idProveedor, Integer empresaId) {
        if (source.getNombre() != null) target.setNombre(source.getNombre().trim());
        if (source.getTipo() != null) target.setTipo(normalizeValue(source.getTipo()));
        if (source.getRutaDocumento() != null) target.setRutaDocumento(trimToNull(source.getRutaDocumento()));
        if (source.getMimeType() != null) target.setMimeType(trimToNull(source.getMimeType()));
        if (source.getTamanoBytes() != null) target.setTamanoBytes(source.getTamanoBytes());
        if (source.getDescripcion() != null) target.setDescripcion(trimToNull(source.getDescripcion()));
        if (source.getEstadoDocumento() != null) target.setEstadoDocumento(validateValue("estadoDocumento", source.getEstadoDocumento(), ESTADOS));
        if (source.getActivo() != null) target.setActivo(resolveActivo(source.getActivo(), idProveedor, empresaId));
        if (source.getEstatus() != null && source.getEstadoDocumento() == null) {
            target.setEstadoDocumento(source.getEstatus() ? "ACTIVO" : "ARCHIVADO");
        }
    }

    private void normalize(ProveedorDocumentoEntity obj) {
        obj.setNombre(obj.getNombre().trim());
        obj.setTipo(isBlank(obj.getTipo()) ? "OTRO" : normalizeValue(obj.getTipo()));
        obj.setRutaDocumento(trimToNull(obj.getRutaDocumento()));
        obj.setMimeType(trimToNull(obj.getMimeType()));
        obj.setDescripcion(trimToNull(obj.getDescripcion()));
        obj.setEstadoDocumento(isBlank(obj.getEstadoDocumento()) ? "ACTIVO" : validateValue("estadoDocumento", obj.getEstadoDocumento(), ESTADOS));
    }

    private ProveedorActivoEntity resolveActivo(ProveedorActivoEntity activo, Integer idProveedor, Integer empresaId) {
        if (activo == null || activo.getIdProveedorActivo() == null) return null;

        return activoRepository.findByIdProveedorActivoAndProveedor_IdProveedorAndEmpresa_IdEmpresa(
                        activo.getIdProveedorActivo(),
                        idProveedor,
                        empresaId
                )
                .orElseThrow(() -> new EntityNotFoundException("Activo relacionado no encontrado o no pertenece al proveedor"));
    }

    private void syncEstatus(ProveedorDocumentoEntity obj) {
        obj.setEstatus(!"ARCHIVADO".equals(validateValue("estadoDocumento", obj.getEstadoDocumento(), ESTADOS)));
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

    private boolean hasAllowedExtension(String value) {
        String normalized = value.trim().toLowerCase();
        int queryIndex = normalized.indexOf('?');
        if (queryIndex >= 0) {
            normalized = normalized.substring(0, queryIndex);
        }
        int hashIndex = normalized.indexOf('#');
        if (hashIndex >= 0) {
            normalized = normalized.substring(0, hashIndex);
        }
        return EXTENSIONES.stream().anyMatch(normalized::endsWith);
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
