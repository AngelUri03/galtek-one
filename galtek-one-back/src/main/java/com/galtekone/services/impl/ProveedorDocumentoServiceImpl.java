package com.galtekone.services.impl;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.dto.proveedor.ProveedorDocumentoVersionRequest;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.ProveedorDocumentoEntity;
import com.galtekone.entity.ProveedorDocumentoHistorialEntity;
import com.galtekone.entity.ProveedoresEntity;
import com.galtekone.repository.ProveedorDocumentoHistorialRepository;
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
    private static final Set<String> ESTADOS = Set.of("ACTIVO", "INACTIVO", "ARCHIVADO");
    private static final Set<String> MIME_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-powerpoint",
            "text/csv",
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
            ".docx",
            ".doc",
            ".pptx",
            ".ppt",
            ".csv",
            ".txt"
    );
    private static final String RUTA_DB = "BASE_DATOS";

    @Autowired
    private ProveedorDocumentoRepository repository;

    @Autowired
    private ProveedorDocumentoHistorialRepository historialRepository;

    @Autowired
    private ProveedoresRepository proveedoresRepository;

    @Override
    public List<ProveedorDocumentoEntity> readByProveedor(Integer idProveedor) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedor(idProveedor, empresaId);
        List<ProveedorDocumentoEntity> documentos = repository.findByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId);
        attachHistorial(documentos, empresaId);
        return documentos;
    }

    @Override
    public ProveedorDocumentoEntity create(Integer idProveedor, ProveedorDocumentoEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ProveedoresEntity proveedor = ensureProveedor(idProveedor, empresaId);
        ensureProveedorEditable(proveedor);
        validate(obj, true);
        normalize(obj);

        obj.setProveedor(proveedor);
        obj.setActivo(null);
        obj.setEmpresa(empresa(empresaId));
        obj.setUsuarioCreacion(user);
        syncEstatus(obj);

        ProveedorDocumentoEntity saved = repository.save(obj);
        recordHistory(saved, "CREACION", "Documento agregado al proveedor.", null, null, false, user, empresaId);
        attachHistorial(List.of(saved), empresaId);
        return saved;
    }

    @Override
    public ProveedorDocumentoEntity update(Integer idProveedor, Integer idProveedorDocumento, ProveedorDocumentoEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedorEditable(ensureProveedor(idProveedor, empresaId));
        ProveedorDocumentoEntity entity = find(idProveedor, idProveedorDocumento, empresaId);
        validate(obj, false);
        ensureDocumentoCanUpdate(entity, obj);

        Map<String, String> before = snapshot(entity);
        applyUpdate(entity, obj);
        ensureHasArchivo(entity);
        entity.setUsuarioModificacion(user);
        syncEstatus(entity);

        ProveedorDocumentoEntity saved = repository.save(entity);
        Map<String, String> after = snapshot(saved);
        recordEditIfNeeded(saved, before, after, user, empresaId, before.get("Estado"), after.get("Estado"));
        attachHistorial(List.of(saved), empresaId);
        return saved;
    }

    @Override
    public ProveedorDocumentoEntity newVersion(Integer idProveedor, Integer idProveedorDocumento, ProveedorDocumentoVersionRequest request, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedorEditable(ensureProveedor(idProveedor, empresaId));
        ProveedorDocumentoEntity entity = find(idProveedor, idProveedorDocumento, empresaId);
        ensureDocumentoActive(entity, "registrar una nueva version");

        if (request == null || isBlank(request.getMotivo())) {
            throw new IllegalArgumentException("El motivo de nueva version es obligatorio");
        }
        if (isBlank(request.getArchivoBase64())) {
            throw new IllegalArgumentException("El archivo de la nueva version es obligatorio");
        }

        Map<String, String> before = snapshot(entity);
        ProveedorDocumentoEntity previousFile = copyFileSnapshot(entity);

        ProveedorDocumentoEntity fileSource = new ProveedorDocumentoEntity();
        fileSource.setNombre(entity.getNombre());
        fileSource.setArchivoNombre(request.getArchivoNombre());
        fileSource.setMimeType(request.getMimeType());
        fileSource.setArchivoBase64(request.getArchivoBase64());
        applyArchivo(entity, fileSource);
        entity.setUsuarioModificacion(user);
        syncEstatus(entity);

        ProveedorDocumentoEntity saved = repository.save(entity);
        Map<String, String> after = snapshot(saved);
        recordHistory(saved, "NUEVA_VERSION", request.getMotivo(), detailDiff(before, after, true), detailDiff(before, after, false), true, user, empresaId, previousFile);
        attachHistorial(List.of(saved), empresaId);
        return saved;
    }

    @Override
    public ProveedorDocumentoEntity delete(Integer idProveedor, Integer idProveedorDocumento, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedorEditable(ensureProveedor(idProveedor, empresaId));
        ProveedorDocumentoEntity entity = find(idProveedor, idProveedorDocumento, empresaId);
        ensureDocumentoCanArchive(entity);
        Map<String, String> before = snapshot(entity);

        entity.setEstadoDocumento("ARCHIVADO");
        entity.setEstatus(false);
        entity.setUsuarioModificacion(user);

        ProveedorDocumentoEntity saved = repository.save(entity);
        Map<String, String> after = snapshot(saved);
        recordHistory(saved, "ARCHIVADO", "Documento archivado para conservar historial.", detailDiff(before, after, true), detailDiff(before, after, false), false, user, empresaId);
        attachHistorial(List.of(saved), empresaId);
        return saved;
    }

    private ProveedoresEntity ensureProveedor(Integer idProveedor, Integer empresaId) {
        return proveedoresRepository.findByIdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Proveedor no encontrado o no pertenece a tu empresa"));
    }

    private void ensureProveedorEditable(ProveedoresEntity proveedor) {
        String estado = estadoProveedor(proveedor);
        if (!"ACTIVO".equals(estado)) {
            throw new IllegalStateException("El proveedor no esta activo. Reactivalo antes de modificar documentos.");
        }
    }

    private String estadoProveedor(ProveedoresEntity proveedor) {
        if (proveedor == null) return "ACTIVO";
        String estado = trimToNull(proveedor.getEstadoProveedor());
        if (estado == null) {
            return Boolean.FALSE.equals(proveedor.getEstatus()) ? "INACTIVO" : "ACTIVO";
        }
        return estado.toUpperCase();
    }

    private ProveedorDocumentoEntity find(Integer idProveedor, Integer idDocumento, Integer empresaId) {
        return repository.findByIdProveedorDocumentoAndProveedor_IdProveedorAndEmpresa_IdEmpresa(idDocumento, idProveedor, empresaId)
                .orElseThrow(() -> new EntityNotFoundException("Documento no encontrado o no pertenece al proveedor"));
    }

    private void attachHistorial(List<ProveedorDocumentoEntity> documentos, Integer empresaId) {
        documentos.forEach(documento -> documento.setHistorial(
                historialRepository.findByIdProveedorDocumentoAndEmpresa_IdEmpresaOrderByFechaEventoDesc(
                        documento.getIdProveedorDocumento(),
                        empresaId
                )
        ));
    }

    private void validate(ProveedorDocumentoEntity obj, boolean creating) {
        if (obj == null) throw new IllegalArgumentException("El documento es obligatorio");
        if (creating && isBlank(obj.getNombre())) throw new IllegalArgumentException("El nombre del documento es obligatorio");
        if (!creating && obj.getNombre() != null && isBlank(obj.getNombre())) {
            throw new IllegalArgumentException("El nombre del documento no puede estar vacio");
        }
        if (!isBlank(obj.getTipo())) validateValue("tipo", obj.getTipo(), TIPOS);
        if (!isBlank(obj.getEstadoDocumento())) validateValue("estadoDocumento", obj.getEstadoDocumento(), ESTADOS);
        if (!isBlank(obj.getMimeType()) && !MIME_TYPES.contains(obj.getMimeType().trim().toLowerCase())) {
            throw new IllegalArgumentException("mimeType no es valido para documentos de proveedor");
        }
        if (creating && isBlank(obj.getArchivoBase64())) {
            throw new IllegalArgumentException("El archivo del documento es obligatorio");
        }
    }

    private void applyUpdate(ProveedorDocumentoEntity target, ProveedorDocumentoEntity source) {
        if (source.getNombre() != null) target.setNombre(source.getNombre().trim());
        if (source.getTipo() != null) target.setTipo(normalizeValue(source.getTipo()));
        refreshArchivoNombre(target);
        if (source.getDescripcion() != null) target.setDescripcion(trimToNull(source.getDescripcion()));
        if (source.getEstadoDocumento() != null) target.setEstadoDocumento(validateValue("estadoDocumento", source.getEstadoDocumento(), ESTADOS));
        target.setActivo(null);
        if (source.getEstatus() != null && source.getEstadoDocumento() == null) {
            target.setEstadoDocumento(source.getEstatus() ? "ACTIVO" : "INACTIVO");
        }
    }

    private void normalize(ProveedorDocumentoEntity obj) {
        obj.setNombre(obj.getNombre().trim());
        obj.setTipo(isBlank(obj.getTipo()) ? "OTRO" : normalizeValue(obj.getTipo()));
        obj.setDescripcion(trimToNull(obj.getDescripcion()));
        obj.setEstadoDocumento(isBlank(obj.getEstadoDocumento()) ? "ACTIVO" : validateValue("estadoDocumento", obj.getEstadoDocumento(), ESTADOS));
        applyArchivo(obj, obj);
        ensureHasArchivo(obj);
    }

    private void ensureHasArchivo(ProveedorDocumentoEntity obj) {
        if (obj == null || isBlank(obj.getArchivoBase64())) {
            throw new IllegalArgumentException("El documento debe tener un archivo guardado en base de datos");
        }
    }

    private void recordEditIfNeeded(
            ProveedorDocumentoEntity documento,
            Map<String, String> before,
            Map<String, String> after,
            String user,
            Integer empresaId,
            String previousState,
            String nextState
    ) {
        if (!hasDiff(before, after)) return;
        String tipoEvento = "EDICION";
        String descripcion = "Metadatos del documento actualizados.";
        if (!Objects.equals(normalizeValue(previousState), normalizeValue(nextState))) {
            String next = normalizeValue(nextState);
            if ("INACTIVO".equals(next)) {
                tipoEvento = "INACTIVACION";
                descripcion = "Documento inactivado para pausar su operacion.";
            } else if ("ACTIVO".equals(next)) {
                tipoEvento = "REACTIVACION";
                descripcion = "Documento reactivado para operacion normal.";
            } else if ("ARCHIVADO".equals(next)) {
                tipoEvento = "ARCHIVADO";
                descripcion = "Documento archivado como historial definitivo.";
            }
        }
        recordHistory(documento, tipoEvento, descripcion, detailDiff(before, after, true), detailDiff(before, after, false), false, user, empresaId);
    }

    private void recordHistory(
            ProveedorDocumentoEntity documento,
            String tipoEvento,
            String descripcion,
            String detalleAnterior,
            String detalleNuevo,
            boolean includeFileSnapshot,
            String user,
            Integer empresaId
    ) {
        recordHistory(documento, tipoEvento, descripcion, detalleAnterior, detalleNuevo, includeFileSnapshot, user, empresaId, null);
    }

    private void recordHistory(
            ProveedorDocumentoEntity documento,
            String tipoEvento,
            String descripcion,
            String detalleAnterior,
            String detalleNuevo,
            boolean includeFileSnapshot,
            String user,
            Integer empresaId,
            ProveedorDocumentoEntity previousFile
    ) {
        ProveedorDocumentoHistorialEntity event = new ProveedorDocumentoHistorialEntity();
        event.setIdProveedorDocumento(documento.getIdProveedorDocumento());
        event.setIdProveedor(documento.getProveedor() == null ? null : documento.getProveedor().getIdProveedor());
        event.setTipoEvento(tipoEvento);
        event.setDescripcion(trimToNull(descripcion));
        event.setDetalleAnterior(trimToNull(detalleAnterior));
        event.setDetalleNuevo(trimToNull(detalleNuevo));
        event.setFechaEvento(LocalDateTime.now());
        event.setEmpresa(empresa(empresaId));
        event.setEstatus(true);
        event.setUsuarioCreacion(user);

        if (includeFileSnapshot) {
            ProveedorDocumentoEntity previous = previousFile == null ? documento : previousFile;
            event.setArchivoAnteriorNombre(previous.getArchivoNombre());
            event.setArchivoAnteriorMimeType(previous.getMimeType());
            event.setArchivoAnteriorTamanoBytes(previous.getTamanoBytes());
            event.setArchivoAnteriorBase64(previous.getArchivoBase64());
            event.setArchivoNuevoNombre(documento.getArchivoNombre());
            event.setArchivoNuevoMimeType(documento.getMimeType());
            event.setArchivoNuevoTamanoBytes(documento.getTamanoBytes());
            event.setArchivoNuevoBase64(documento.getArchivoBase64());
        }

        historialRepository.save(event);
    }

    private ProveedorDocumentoEntity copyFileSnapshot(ProveedorDocumentoEntity source) {
        ProveedorDocumentoEntity copy = new ProveedorDocumentoEntity();
        copy.setArchivoNombre(source.getArchivoNombre());
        copy.setMimeType(source.getMimeType());
        copy.setTamanoBytes(source.getTamanoBytes());
        copy.setArchivoBase64(source.getArchivoBase64());
        return copy;
    }

    private Map<String, String> snapshot(ProveedorDocumentoEntity documento) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("Nombre", safeText(documento.getNombre(), "--"));
        values.put("Tipo", safeText(documento.getTipo(), "--"));
        values.put("Estado", safeText(documento.getEstadoDocumento(), "--"));
        values.put("Descripcion", safeText(documento.getDescripcion(), "--"));
        values.put("Archivo", safeText(documento.getArchivoNombre(), "--"));
        values.put("Formato", safeText(documento.getMimeType(), "--"));
        values.put("Tamano", documento.getTamanoBytes() == null ? "--" : documento.getTamanoBytes().toString());
        return values;
    }

    private boolean hasDiff(Map<String, String> before, Map<String, String> after) {
        return before.keySet().stream().anyMatch(key -> !Objects.equals(before.get(key), after.get(key)));
    }

    private String detailDiff(Map<String, String> before, Map<String, String> after, boolean previous) {
        return before.keySet().stream()
                .filter(key -> !Objects.equals(before.get(key), after.get(key)))
                .map(key -> key + ": " + (previous ? before.get(key) : after.get(key)))
                .collect(Collectors.joining("\n"));
    }

    private void syncEstatus(ProveedorDocumentoEntity obj) {
        obj.setEstatus("ACTIVO".equals(validateValue("estadoDocumento", obj.getEstadoDocumento(), ESTADOS)));
    }

    private void ensureDocumentoCanUpdate(ProveedorDocumentoEntity entity, ProveedorDocumentoEntity request) {
        String currentState = validateValue("estadoDocumento", entity.getEstadoDocumento(), ESTADOS);
        String nextState = request == null || request.getEstadoDocumento() == null
                ? currentState
                : validateValue("estadoDocumento", request.getEstadoDocumento(), ESTADOS);

        if ("ARCHIVADO".equals(currentState)) {
            throw new IllegalStateException("El documento archivado es historico definitivo y no puede reactivarse ni modificarse.");
        }
        if ("INACTIVO".equals(currentState) && !"ACTIVO".equals(nextState)) {
            throw new IllegalStateException("El documento inactivo solo puede reactivarse antes de modificarlo.");
        }
        if ("INACTIVO".equals(currentState) && "ACTIVO".equals(nextState) && hasMetadataChange(entity, request)) {
            throw new IllegalStateException("Reactiva el documento antes de modificar sus metadatos.");
        }
    }

    private void ensureDocumentoActive(ProveedorDocumentoEntity entity, String action) {
        String currentState = validateValue("estadoDocumento", entity.getEstadoDocumento(), ESTADOS);
        if ("ARCHIVADO".equals(currentState)) {
            throw new IllegalStateException("No se puede " + action + " porque el documento esta archivado como historial definitivo.");
        }
        if ("INACTIVO".equals(currentState)) {
            throw new IllegalStateException("No se puede " + action + " porque el documento esta inactivo. Reactivalo primero.");
        }
    }

    private void ensureDocumentoCanArchive(ProveedorDocumentoEntity entity) {
        String currentState = validateValue("estadoDocumento", entity.getEstadoDocumento(), ESTADOS);
        if ("ARCHIVADO".equals(currentState)) {
            throw new IllegalStateException("El documento ya esta archivado como historial definitivo.");
        }
    }

    private boolean hasMetadataChange(ProveedorDocumentoEntity entity, ProveedorDocumentoEntity request) {
        if (request == null) return false;
        if (request.getNombre() != null && !Objects.equals(trimToNull(request.getNombre()), trimToNull(entity.getNombre()))) return true;
        if (request.getTipo() != null && !Objects.equals(normalizeNullable(request.getTipo()), normalizeNullable(defaultIfBlank(entity.getTipo(), "OTRO")))) return true;
        if (request.getDescripcion() != null && !Objects.equals(trimToNull(request.getDescripcion()), trimToNull(entity.getDescripcion()))) return true;
        return false;
    }

    private String normalizeNullable(String value) {
        String clean = trimToNull(value);
        return clean == null ? null : normalizeValue(clean);
    }

    private String defaultIfBlank(String value, String fallback) {
        String clean = trimToNull(value);
        return clean == null ? fallback : clean;
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

    private void applyArchivo(ProveedorDocumentoEntity target, ProveedorDocumentoEntity source) {
        String base64 = stripDataUrlPrefix(source.getArchivoBase64());
        if (isBlank(base64)) return;

        String mimeType = detectMimeType(source);
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(base64);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("archivoBase64 no tiene un formato valido");
        }
        if (bytes.length <= 0 || bytes.length > MAX_DOCUMENT_BYTES) {
            throw new IllegalArgumentException("El archivo debe pesar entre 1 byte y " + MAX_DOCUMENT_BYTES + " bytes");
        }

        target.setArchivoBase64(base64);
        target.setMimeType(mimeType);
        target.setTamanoBytes((long) bytes.length);
        target.setArchivoNombre(buildArchivoNombre(target.getNombre(), mimeType));
        target.setRutaDocumento(RUTA_DB);
    }

    private String detectMimeType(ProveedorDocumentoEntity source) {
        String mimeType = trimToNull(source.getMimeType());
        if (mimeType != null) {
            mimeType = mimeType.toLowerCase();
            if (!MIME_TYPES.contains(mimeType)) {
                throw new IllegalArgumentException("mimeType no es valido para documentos de proveedor");
            }
            return mimeType;
        }

        String name = trimToNull(source.getArchivoNombre());
        if (name == null) name = trimToNull(source.getRutaDocumento());
        if (name == null || !hasAllowedExtension(name)) {
            throw new IllegalArgumentException("No se pudo reconocer automaticamente el formato del archivo");
        }

        String normalized = name.toLowerCase();
        if (normalized.endsWith(".pdf")) return "application/pdf";
        if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) return "image/jpeg";
        if (normalized.endsWith(".png")) return "image/png";
        if (normalized.endsWith(".webp")) return "image/webp";
        if (normalized.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        if (normalized.endsWith(".xls")) return "application/vnd.ms-excel";
        if (normalized.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (normalized.endsWith(".doc")) return "application/msword";
        if (normalized.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        if (normalized.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
        if (normalized.endsWith(".csv")) return "text/csv";
        if (normalized.endsWith(".txt")) return "text/plain";
        throw new IllegalArgumentException("No se pudo reconocer automaticamente el formato del archivo");
    }

    private void refreshArchivoNombre(ProveedorDocumentoEntity target) {
        if (!isBlank(target.getArchivoBase64()) && !isBlank(target.getMimeType()) && !isBlank(target.getNombre())) {
            target.setArchivoNombre(buildArchivoNombre(target.getNombre(), target.getMimeType()));
        }
    }

    private String buildArchivoNombre(String nombre, String mimeType) {
        String cleanName = trimToNull(nombre);
        if (cleanName == null) cleanName = "documento-proveedor";
        cleanName = cleanName.replaceAll("[\\\\/:*?\"<>|]", " ").replaceAll("\\s+", " ").trim();
        String extension = extensionFromMime(mimeType);
        return cleanName.toLowerCase().endsWith(extension) ? cleanName : cleanName + extension;
    }

    private String extensionFromMime(String mimeType) {
        return switch (mimeType == null ? "" : mimeType.toLowerCase()) {
            case "application/pdf" -> ".pdf";
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" -> ".xlsx";
            case "application/vnd.ms-excel" -> ".xls";
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> ".docx";
            case "application/msword" -> ".doc";
            case "application/vnd.openxmlformats-officedocument.presentationml.presentation" -> ".pptx";
            case "application/vnd.ms-powerpoint" -> ".ppt";
            case "text/csv" -> ".csv";
            case "text/plain" -> ".txt";
            default -> ".bin";
        };
    }

    private String stripDataUrlPrefix(String value) {
        String text = trimToNull(value);
        if (text == null) return null;
        int comma = text.indexOf(",");
        if (text.startsWith("data:") && comma >= 0) text = text.substring(comma + 1);
        return text.replaceAll("\\s+", "");
    }

    private String safeText(String value, String fallback) {
        return isBlank(value) ? fallback : value.trim();
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
