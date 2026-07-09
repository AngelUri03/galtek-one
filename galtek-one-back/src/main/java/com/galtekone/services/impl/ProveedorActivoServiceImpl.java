package com.galtekone.services.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
import com.galtekone.dto.proveedor.ProveedorActivoEvidenciaRequest;
import com.galtekone.dto.proveedor.ProveedorActivoIncidenteRequest;
import com.galtekone.dto.proveedor.ProveedorActivoEstadoRequest;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.ProveedorActivoEntity;
import com.galtekone.entity.ProveedorActivoEvidenciaEntity;
import com.galtekone.entity.ProveedorActivoHistorialEntity;
import com.galtekone.entity.ProveedoresEntity;
import com.galtekone.repository.ProveedorActivoEvidenciaRepository;
import com.galtekone.repository.ProveedorActivoHistorialRepository;
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

    private static final Set<String> ESTADOS_FLUJO = Set.of(
            "RECIBIDO",
            "EN_TIENDA",
            "EN_EXHIBICION",
            "RETIRADO_DANO",
            "REPARACION",
            "DEVUELTO",
            "PERDIDO"
    );

    private static final Map<String, Set<String>> TRANSICIONES = Map.of(
            "RECIBIDO", Set.of("EN_TIENDA", "EN_EXHIBICION", "RETIRADO_DANO", "DEVUELTO"),
            "EN_TIENDA", Set.of("EN_EXHIBICION", "RETIRADO_DANO", "REPARACION", "DEVUELTO", "PERDIDO"),
            "EN_EXHIBICION", Set.of("EN_TIENDA", "RETIRADO_DANO", "REPARACION", "DEVUELTO", "PERDIDO"),
            "RETIRADO_DANO", Set.of("REPARACION", "EN_TIENDA", "EN_EXHIBICION", "DEVUELTO", "PERDIDO"),
            "REPARACION", Set.of("EN_TIENDA", "EN_EXHIBICION", "DEVUELTO", "PERDIDO"),
            "DEVUELTO", Set.of("RECIBIDO", "EN_TIENDA"),
            "PERDIDO", Set.of("RECIBIDO", "EN_TIENDA"),
            "INACTIVO", Set.of("RECIBIDO", "EN_TIENDA", "EN_EXHIBICION")
    );

    private static final Set<String> MIMES_EVIDENCIA = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_EVIDENCIA_BYTES = 10L * 1024L * 1024L;
    private static final int MAX_EVIDENCIAS_POR_EVENTO = 6;

    @Autowired
    private ProveedorActivoRepository repository;

    @Autowired
    private ProveedorActivoHistorialRepository historialRepository;

    @Autowired
    private ProveedorActivoEvidenciaRepository evidenciaRepository;

    @Autowired
    private ProveedoresRepository proveedoresRepository;

    @Override
    public List<ProveedorActivoEntity> readByProveedor(Integer idProveedor) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedor(idProveedor, empresaId);
        List<ProveedorActivoEntity> activos = repository.findByProveedor_IdProveedorAndEmpresa_IdEmpresa(idProveedor, empresaId);
        attachHistorial(activos, empresaId);
        return activos;
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

        ProveedorActivoEntity saved = repository.save(obj);
        recordHistory(
                saved,
                "RECIBIDO",
                null,
                operationalState(saved),
                "Activo recibido y registrado en la relacion comercial del proveedor.",
                null,
                null,
                user,
                empresaId,
                obj.getEvidencias()
        );
        attachHistorial(List.of(saved), empresaId);
        return saved;
    }

    @Override
    public ProveedorActivoEntity update(Integer idProveedor, Integer idProveedorActivo, ProveedorActivoEntity obj, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedor(idProveedor, empresaId);
        ProveedorActivoEntity entity = find(idProveedor, idProveedorActivo, empresaId);
        Map<String, String> before = snapshot(entity);
        String previousState = operationalState(entity);

        validate(obj, false);
        applyUpdate(entity, obj);
        entity.setUsuarioModificacion(user);
        syncEstatus(entity);

        ProveedorActivoEntity saved = repository.save(entity);
        Map<String, String> after = snapshot(saved);
        recordEditIfNeeded(saved, before, after, previousState, user, empresaId);
        attachHistorial(List.of(saved), empresaId);
        return saved;
    }

    @Override
    public ProveedorActivoEntity changeState(Integer idProveedor, Integer idProveedorActivo, ProveedorActivoEstadoRequest request, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedor(idProveedor, empresaId);
        ProveedorActivoEntity entity = find(idProveedor, idProveedorActivo, empresaId);

        if (request == null || isBlank(request.getEstadoNuevo())) {
            throw new IllegalArgumentException("El nuevo estado del activo es obligatorio");
        }

        Map<String, String> before = snapshot(entity);
        String previousState = operationalState(entity);
        String nextState = validateEstadoFlujo(request.getEstadoNuevo());
        validateTransition(previousState, nextState);

        entity.setEstadoActivoPrestado(nextState);
        entity.setEstatus(!isFinalState(nextState));
        applyOperationalData(entity, request.getEstadoFisico(), request.getUbicacionTienda(), request.getFechaRegreso());
        entity.setUsuarioModificacion(user);

        ProveedorActivoEntity saved = repository.save(entity);
        Map<String, String> after = snapshot(saved);
        recordHistory(
                saved,
                eventTypeForState(nextState),
                previousState,
                nextState,
                safeText(request.getDescripcion(), descriptionForState(saved, nextState)),
                detailDiff(before, after, true),
                detailDiff(before, after, false),
                user,
                empresaId,
                evidenceRequests(request)
        );
        attachHistorial(List.of(saved), empresaId);
        return saved;
    }

    @Override
    public ProveedorActivoEntity reportIncident(Integer idProveedor, Integer idProveedorActivo, ProveedorActivoIncidenteRequest request, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedor(idProveedor, empresaId);
        ProveedorActivoEntity entity = find(idProveedor, idProveedorActivo, empresaId);

        if (request == null || isBlank(request.getDescripcion())) {
            throw new IllegalArgumentException("El detalle del incidente es obligatorio");
        }

        Map<String, String> before = snapshot(entity);
        String state = operationalState(entity);
        if (!isBlank(request.getEstadoFisico())) entity.setEstadoFisico(trimToNull(request.getEstadoFisico()));
        if (!isBlank(request.getUbicacionTienda())) entity.setUbicacionTienda(trimToNull(request.getUbicacionTienda()));
        entity.setUsuarioModificacion(user);

        ProveedorActivoEntity saved = repository.save(entity);
        Map<String, String> after = snapshot(saved);
        recordHistory(
                saved,
                "INCIDENTE",
                state,
                state,
                request.getDescripcion().trim(),
                detailDiff(before, after, true),
                detailDiff(before, after, false),
                user,
                empresaId,
                request.getEvidencias()
        );
        attachHistorial(List.of(saved), empresaId);
        return saved;
    }

    @Override
    public ProveedorActivoEntity delete(Integer idProveedor, Integer idProveedorActivo, String user) {
        Integer empresaId = EmpresaContextHolder.getEmpresaId();
        ensureProveedor(idProveedor, empresaId);
        ProveedorActivoEntity entity = find(idProveedor, idProveedorActivo, empresaId);
        Map<String, String> before = snapshot(entity);
        String previousState = operationalState(entity);

        entity.setEstatus(false);
        entity.setUsuarioModificacion(user);

        ProveedorActivoEntity saved = repository.save(entity);
        Map<String, String> after = snapshot(saved);
        recordHistory(
                saved,
                "DESACTIVADO",
                previousState,
                "INACTIVO",
                "Activo desactivado. No cuenta como vigente, pero conserva historial y documentos.",
                detailDiff(before, after, true),
                detailDiff(before, after, false),
                user,
                empresaId,
                List.of()
        );
        attachHistorial(List.of(saved), empresaId);
        return saved;
    }

    private void attachHistorial(List<ProveedorActivoEntity> activos, Integer empresaId) {
        List<Integer> ids = activos.stream()
                .map(ProveedorActivoEntity::getIdProveedorActivo)
                .filter(Objects::nonNull)
                .toList();

        if (ids.isEmpty()) return;

        Map<Integer, List<ProveedorActivoHistorialEntity>> historyByActivo = historialRepository
                .findByActivo_IdProveedorActivoInAndEmpresa_IdEmpresaOrderByFechaEventoAscIdProveedorActivoHistorialAsc(ids, empresaId)
                .stream()
                .collect(Collectors.groupingBy(event -> event.getActivo().getIdProveedorActivo()));

        List<ProveedorActivoHistorialEntity> history = historyByActivo.values().stream()
                .flatMap(List::stream)
                .toList();
        attachEvidencias(history, empresaId);

        activos.forEach(activo -> activo.setHistorial(
                historyByActivo.getOrDefault(activo.getIdProveedorActivo(), List.of())
        ));
    }

    private void attachEvidencias(List<ProveedorActivoHistorialEntity> historial, Integer empresaId) {
        List<Integer> ids = historial.stream()
                .map(ProveedorActivoHistorialEntity::getIdProveedorActivoHistorial)
                .filter(Objects::nonNull)
                .toList();

        if (ids.isEmpty()) return;

        Map<Integer, List<ProveedorActivoEvidenciaEntity>> evidenciasByHistorial = evidenciaRepository
                .findByHistorial_IdProveedorActivoHistorialInAndEmpresa_IdEmpresaOrderByIdProveedorActivoEvidenciaAsc(ids, empresaId)
                .stream()
                .collect(Collectors.groupingBy(evidencia -> evidencia.getHistorial().getIdProveedorActivoHistorial()));

        historial.forEach(event -> event.setEvidencias(
                evidenciasByHistorial.getOrDefault(event.getIdProveedorActivoHistorial(), List.of())
        ));
    }

    private void recordEditIfNeeded(
            ProveedorActivoEntity activo,
            Map<String, String> before,
            Map<String, String> after,
            String previousState,
            String user,
            Integer empresaId
    ) {
        if (!hasDiff(before, after)) return;

        recordHistory(
                activo,
                "EDICION",
                previousState,
                operationalState(activo),
                "Datos generales del activo editados.",
                detailDiff(before, after, true),
                detailDiff(before, after, false),
                user,
                empresaId,
                List.of()
        );
    }

    private void recordHistory(
            ProveedorActivoEntity activo,
            String tipoEvento,
            String estadoAnterior,
            String estadoNuevo,
            String descripcion,
            String detalleAnterior,
            String detalleNuevo,
            String user,
            Integer empresaId,
            List<ProveedorActivoEvidenciaRequest> evidenciaRequests
    ) {
        ProveedorActivoHistorialEntity event = new ProveedorActivoHistorialEntity();
        event.setActivo(activo);
        event.setProveedor(activo.getProveedor());
        event.setTipoEvento(tipoEvento);
        event.setEstadoAnterior(estadoAnterior);
        event.setEstadoNuevo(estadoNuevo);
        event.setDescripcion(descripcion);
        event.setDetalleAnterior(trimToNull(detalleAnterior));
        event.setDetalleNuevo(trimToNull(detalleNuevo));
        event.setFechaEvento(LocalDateTime.now());
        event.setEmpresa(empresa(empresaId));
        event.setUsuarioCreacion(user);
        event.setEstatus(true);

        ProveedorActivoHistorialEntity savedEvent = historialRepository.save(event);
        List<ProveedorActivoEvidenciaEntity> evidencias = buildEvidenceEntities(savedEvent, evidenciaRequests, user, empresaId);
        if (!evidencias.isEmpty()) {
            List<ProveedorActivoEvidenciaEntity> savedEvidencias = evidenciaRepository.saveAll(evidencias);
            ProveedorActivoEvidenciaEntity first = savedEvidencias.get(0);
            savedEvent.setEvidenciaNombre(first.getEvidenciaNombre());
            savedEvent.setEvidenciaMimeType(first.getEvidenciaMimeType());
            savedEvent.setEvidenciaBase64(first.getEvidenciaBase64());
            savedEvent.setEvidenciaTamanoBytes(first.getEvidenciaTamanoBytes());
            savedEvent.setEvidencias(savedEvidencias);
            historialRepository.save(savedEvent);
        }
    }

    private String eventTypeForState(String state) {
        return switch (state) {
            case "RECIBIDO" -> "RECIBIDO";
            case "EN_TIENDA" -> "EN_TIENDA";
            case "EN_EXHIBICION" -> "EN_EXHIBICION";
            case "RETIRADO_DANO" -> "RETIRADO_DANO";
            case "REPARACION" -> "REPARACION";
            case "DEVUELTO" -> "DEVUELTO";
            case "PERDIDO" -> "PERDIDO";
            case "INACTIVO" -> "DESACTIVADO";
            default -> "CAMBIO_ESTADO";
        };
    }

    private String descriptionForState(ProveedorActivoEntity activo, String state) {
        return switch (state) {
            case "RECIBIDO" -> "Activo recibido del proveedor y pendiente de ubicacion operativa.";
            case "EN_TIENDA" -> "Activo colocado y disponible en tienda.";
            case "EN_EXHIBICION" -> "Activo colocado en exhibicion o punto visible de venta.";
            case "RETIRADO_DANO" -> "Activo retirado por dano: " + safeText(activo.getEstadoFisico(), "sin detalle fisico");
            case "REPARACION" -> "Activo enviado o marcado para reparacion: " + safeText(activo.getNotas(), "pendiente de seguimiento");
            case "DEVUELTO" -> "Activo devuelto al proveedor.";
            case "PERDIDO" -> "Activo marcado como perdido. Conservar evidencia y seguimiento.";
            case "INACTIVO" -> "Activo desactivado. No cuenta como vigente.";
            default -> "Estado operativo del activo actualizado.";
        };
    }

    private String operationalState(ProveedorActivoEntity activo) {
        String state = isBlank(activo.getEstadoActivoPrestado()) ? "RECIBIDO" : normalizeEstadoFlujo(activo.getEstadoActivoPrestado());
        if (Boolean.FALSE.equals(activo.getEstatus()) && !"DEVUELTO".equals(state) && !"PERDIDO".equals(state)) {
            return "INACTIVO";
        }
        return state;
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
        if (!isBlank(obj.getEstadoActivoPrestado())) validateEstadoFlujo(obj.getEstadoActivoPrestado());
        requireNonNegative(obj.getDepositoGarantia(), "depositoGarantia");
        validateEvidenceCount(obj.getEvidencias());
    }

    private void applyUpdate(ProveedorActivoEntity target, ProveedorActivoEntity source) {
        if (source.getNombre() != null) target.setNombre(source.getNombre().trim());
        if (source.getTipo() != null) target.setTipo(normalizeValue(source.getTipo()));
        if (source.getNumeroSerie() != null) target.setNumeroSerie(trimToNull(source.getNumeroSerie()));
        applyFechaEntrega(target, source);
        if (source.getFechaRegreso() != null) target.setFechaRegreso(source.getFechaRegreso());
        if (source.getEstadoFisico() != null && !Objects.equals(trimToNull(source.getEstadoFisico()), trimToNull(target.getEstadoFisico()))) {
            throw new IllegalArgumentException("El estado fisico se registra mediante incidente o cambio de estado");
        }
        if (source.getUbicacionTienda() != null && !Objects.equals(trimToNull(source.getUbicacionTienda()), trimToNull(target.getUbicacionTienda()))) {
            throw new IllegalArgumentException("La ubicacion en tienda se registra mediante cambio de estado o incidente");
        }
        if (source.getCondicionesPrestamo() != null) target.setCondicionesPrestamo(trimToNull(source.getCondicionesPrestamo()));
        if (source.getDepositoGarantia() != null) target.setDepositoGarantia(source.getDepositoGarantia());
        if (source.getNotas() != null) target.setNotas(trimToNull(source.getNotas()));
    }

    private void applyOperationalData(ProveedorActivoEntity entity, String estadoFisico, String ubicacionTienda, String fechaRegreso) {
        if (!isBlank(estadoFisico)) entity.setEstadoFisico(trimToNull(estadoFisico));
        if (!isBlank(ubicacionTienda)) entity.setUbicacionTienda(trimToNull(ubicacionTienda));
        if (!isBlank(fechaRegreso)) entity.setFechaRegreso(parseDate(fechaRegreso, "fechaRegreso"));
    }

    private void applyFechaEntrega(ProveedorActivoEntity target, ProveedorActivoEntity source) {
        if (source.getFechaEntrega() == null) return;
        if (target.getFechaEntrega() == null) {
            target.setFechaEntrega(source.getFechaEntrega());
            return;
        }
        if (!Objects.equals(target.getFechaEntrega(), source.getFechaEntrega())) {
            throw new IllegalArgumentException("La fecha de entrega no puede modificarse una vez registrada");
        }
    }

    private void normalize(ProveedorActivoEntity obj) {
        obj.setNombre(obj.getNombre().trim());
        obj.setTipo(isBlank(obj.getTipo()) ? "OTRO" : normalizeValue(obj.getTipo()));
        obj.setNumeroSerie(trimToNull(obj.getNumeroSerie()));
        obj.setEstadoFisico(trimToNull(obj.getEstadoFisico()));
        obj.setUbicacionTienda(trimToNull(obj.getUbicacionTienda()));
        obj.setCondicionesPrestamo(trimToNull(obj.getCondicionesPrestamo()));
        obj.setEstadoActivoPrestado(isBlank(obj.getEstadoActivoPrestado()) ? "RECIBIDO" : validateEstadoFlujo(obj.getEstadoActivoPrestado()));
        obj.setNotas(trimToNull(obj.getNotas()));
    }

    private void syncEstatus(ProveedorActivoEntity obj) {
        obj.setEstatus(!isFinalState(operationalState(obj)));
    }

    private void validateTransition(String previousState, String nextState) {
        if (Objects.equals(previousState, nextState)) {
            throw new IllegalArgumentException("El activo ya se encuentra en ese estado");
        }

        Set<String> allowed = TRANSICIONES.getOrDefault(previousState, Set.of());
        if (!allowed.contains(nextState)) {
            throw new IllegalArgumentException(
                    "Transicion no valida para activo. Desde " + previousState + " puedes moverlo a: " + allowed
            );
        }
    }

    private String validateEstadoFlujo(String rawValue) {
        String value = normalizeEstadoFlujo(rawValue);
        if (!ESTADOS_FLUJO.contains(value)) {
            throw new IllegalArgumentException("estadoActivoPrestado no es valido. Valores permitidos: " + ESTADOS_FLUJO);
        }
        return value;
    }

    private String normalizeEstadoFlujo(String value) {
        String normalized = normalizeValue(value);
        if ("DANADO".equals(normalized)) return "RETIRADO_DANO";
        return normalized;
    }

    private boolean isFinalState(String state) {
        return "DEVUELTO".equals(state) || "PERDIDO".equals(state);
    }

    private List<ProveedorActivoEvidenciaRequest> evidenceRequests(ProveedorActivoEstadoRequest request) {
        if (request == null) return List.of();
        List<ProveedorActivoEvidenciaRequest> requests = new ArrayList<>();
        if (request.getEvidencias() != null) requests.addAll(request.getEvidencias());
        if (!isBlank(request.getEvidenciaBase64())) {
            ProveedorActivoEvidenciaRequest legacy = new ProveedorActivoEvidenciaRequest();
            legacy.setEvidenciaNombre(request.getEvidenciaNombre());
            legacy.setEvidenciaMimeType(request.getEvidenciaMimeType());
            legacy.setEvidenciaBase64(request.getEvidenciaBase64());
            legacy.setEvidenciaTamanoBytes(request.getEvidenciaTamanoBytes());
            requests.add(legacy);
        }
        return requests;
    }

    private List<ProveedorActivoEvidenciaEntity> buildEvidenceEntities(
            ProveedorActivoHistorialEntity event,
            List<ProveedorActivoEvidenciaRequest> requests,
            String user,
            Integer empresaId
    ) {
        validateEvidenceCount(requests);
        if (requests == null || requests.isEmpty()) return List.of();

        List<ProveedorActivoEvidenciaEntity> entities = new ArrayList<>();
        for (ProveedorActivoEvidenciaRequest evidencia : requests) {
            ProveedorActivoEvidenciaEntity entity = buildEvidenceEntity(event, evidencia, user, empresaId);
            if (entity != null) entities.add(entity);
        }
        return entities;
    }

    private ProveedorActivoEvidenciaEntity buildEvidenceEntity(
            ProveedorActivoHistorialEntity event,
            ProveedorActivoEvidenciaRequest request,
            String user,
            Integer empresaId
    ) {
        if (request == null || isBlank(request.getEvidenciaBase64())) return null;

        String mimeType = trimToNull(request.getEvidenciaMimeType());
        if (mimeType == null || !MIMES_EVIDENCIA.contains(mimeType)) {
            throw new IllegalArgumentException("La evidencia debe ser JPG, PNG o WebP");
        }

        String base64 = stripDataUrlPrefix(request.getEvidenciaBase64());
        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(base64);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("La evidencia no es una imagen base64 valida");
        }

        long size = request.getEvidenciaTamanoBytes() != null ? request.getEvidenciaTamanoBytes() : decoded.length;
        if (size > MAX_EVIDENCIA_BYTES || decoded.length > MAX_EVIDENCIA_BYTES) {
            throw new IllegalArgumentException("Cada evidencia no puede superar 10 MB");
        }

        ProveedorActivoEvidenciaEntity entity = new ProveedorActivoEvidenciaEntity();
        entity.setHistorial(event);
        entity.setEvidenciaNombre(safeText(request.getEvidenciaNombre(), "evidencia-activo"));
        entity.setEvidenciaMimeType(mimeType);
        entity.setEvidenciaBase64(base64);
        entity.setEvidenciaTamanoBytes((long) decoded.length);
        entity.setEmpresa(empresa(empresaId));
        entity.setUsuarioCreacion(user);
        entity.setEstatus(true);
        return entity;
    }

    private void validateEvidenceCount(List<ProveedorActivoEvidenciaRequest> requests) {
        if (requests == null) return;
        long count = requests.stream().filter(request -> request != null && !isBlank(request.getEvidenciaBase64())).count();
        if (count > MAX_EVIDENCIAS_POR_EVENTO) {
            throw new IllegalArgumentException("Solo se permiten hasta 6 evidencias por movimiento");
        }
    }

    private Map<String, String> snapshot(ProveedorActivoEntity activo) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("Nombre", safeText(activo.getNombre(), "--"));
        values.put("Tipo", safeText(activo.getTipo(), "--"));
        values.put("Serie", safeText(activo.getNumeroSerie(), "--"));
        values.put("Fecha entrega", dateText(activo.getFechaEntrega()));
        values.put("Fecha regreso", dateText(activo.getFechaRegreso()));
        values.put("Estado operativo", operationalState(activo));
        values.put("Estado fisico", safeText(activo.getEstadoFisico(), "--"));
        values.put("Ubicacion", safeText(activo.getUbicacionTienda(), "--"));
        values.put("Condiciones", safeText(activo.getCondicionesPrestamo(), "--"));
        values.put("Deposito", activo.getDepositoGarantia() == null ? "--" : activo.getDepositoGarantia().toPlainString());
        values.put("Notas", safeText(activo.getNotas(), "--"));
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

    private String stripDataUrlPrefix(String value) {
        String text = trimToNull(value);
        if (text == null) return "";
        int comma = text.indexOf(",");
        if (text.startsWith("data:") && comma >= 0) {
            return text.substring(comma + 1);
        }
        return text;
    }

    private LocalDate parseDate(String value, String field) {
        try {
            return LocalDate.parse(String.valueOf(value).substring(0, 10));
        } catch (Exception ex) {
            throw new IllegalArgumentException(field + " debe tener formato yyyy-MM-dd");
        }
    }

    private String dateText(LocalDate value) {
        return value == null ? "--" : value.toString();
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

    private String safeText(String value, String fallback) {
        String trimmed = trimToNull(value);
        return trimmed == null ? fallback : trimmed;
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
