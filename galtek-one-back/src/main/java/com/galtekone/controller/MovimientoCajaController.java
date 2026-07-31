package com.galtekone.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.galtekone.dto.movimientoCaja.MovimientoCajaDTO;
import com.galtekone.entity.CajasEntity;
import com.galtekone.entity.MovimientoCajaEntity;
import com.galtekone.entity.MovimientoCajaTipo;
import com.galtekone.services.MovimientoCajaService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;

@RestController
@RequestMapping(path = "movimiento-caja")
public class MovimientoCajaController {

    private static final Set<String> CONTROL_PARAMS = Set.of(
            "page", "size", "sort", "direction", "desde", "hasta", "q", "sessionId", "movementMedium");
    private static final Set<String> SORT_FIELDS = Set.of("fecha", "monto", "tipo", "idMovimientoCaja");
    private static final Set<String> ELECTRONIC_MOVEMENT_TYPES = Set.of(
            MovimientoCajaTipo.CARD_ENTRY.name(),
            MovimientoCajaTipo.CARD_WITHDRAWAL.name());

    @Autowired
    private DynamicSpecification dynamicSpecification;

    @Autowired
    private MovimientoCajaService movimientoCajaService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getMovimientos(
            @RequestHeader(name = "user", required = true) String user,
            @RequestParam Map<String, String> filters) {

        long startTime = System.currentTimeMillis();
        try {
            Map<String, String> dynamicFilters = new HashMap<>(filters);
            CONTROL_PARAMS.forEach(dynamicFilters::remove);

            Specification<MovimientoCajaEntity> specs = dynamicSpecification.buildSpecification(dynamicFilters,
                    MovimientoCajaEntity.class);
            specs = specs
                    .and(dateRangeSpec(filters.get("desde"), filters.get("hasta")))
                    .and(searchSpec(filters.get("q")))
                    .and(sessionSpec(filters.get("sessionId")))
                    .and(mediumSpec(filters.get("movementMedium")));

            Object resp;
            if (filters.containsKey("page") || filters.containsKey("size")) {
                int page = parseInt(filters.get("page"), 0, 0, Integer.MAX_VALUE);
                int size = parseInt(filters.get("size"), 12, 5, 100);
                String sortField = SORT_FIELDS.contains(filters.get("sort")) ? filters.get("sort") : "fecha";
                Sort.Direction direction = "ASC".equalsIgnoreCase(filters.get("direction"))
                        ? Sort.Direction.ASC
                        : Sort.Direction.DESC;
                resp = movimientoCajaService.readDTOPage(specs, PageRequest.of(page, size, Sort.by(direction, sortField)));
            } else {
                resp = movimientoCajaService.readDTO(specs);
            }
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Movimientos obtenidos con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al obtener movimientos: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping(path = "/balance/{idCaja}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getBalance(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer idCaja,
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta) {

        long startTime = System.currentTimeMillis();
        try {
            LocalDateTime fechaDesde = desde != null ? LocalDate.parse(desde).atStartOfDay()
                    : LocalDate.now().atStartOfDay();
            LocalDateTime fechaHasta = hasta != null ? LocalDate.parse(hasta).atTime(23, 59, 59)
                    : LocalDate.now().atTime(23, 59, 59);

            Object resp = movimientoCajaService.getBalanceCaja(idCaja, fechaDesde, fechaHasta);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Balance obtenido con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al obtener balance: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> postMovimiento(
            @RequestHeader(name = "user", required = true) String user,
            @RequestBody MovimientoCajaDTO dto) {

        long startTime = System.currentTimeMillis();
        try {
            MovimientoCajaEntity entity = new MovimientoCajaEntity();
            entity.setTipo(dto.getTipo());
            entity.setMonto(dto.getMonto());
            entity.setMotivo(dto.getMotivo());
            entity.setCategory(dto.getCategory());
            entity.setFinancialDirection(dto.getFinancialDirection());
            entity.setReferenceType(dto.getReferenceType());
            entity.setReferenceId(dto.getReferenceId());
            entity.setIdempotencyKey(dto.getIdempotencyKey());
            entity.setFecha(dto.getFecha());

            if (dto.getIdCaja() != null) {
                CajasEntity caja = new CajasEntity();
                caja.setIdCaja(dto.getIdCaja());
                entity.setCaja(caja);
            }

            Object resp = movimientoCajaService.create(entity, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Movimiento creado con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al crear movimiento: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> putMovimiento(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id,
            @RequestBody MovimientoCajaDTO dto) {

        long startTime = System.currentTimeMillis();
        try {
            MovimientoCajaEntity entity = new MovimientoCajaEntity();
            entity.setIdMovimientoCaja(id);
            entity.setTipo(dto.getTipo());
            entity.setMonto(dto.getMonto());
            entity.setMotivo(dto.getMotivo());
            entity.setFecha(dto.getFecha());

            if (dto.getIdCaja() != null) {
                CajasEntity caja = new CajasEntity();
                caja.setIdCaja(dto.getIdCaja());
                entity.setCaja(caja);
            }

            Object resp = movimientoCajaService.update(entity, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Movimiento actualizado con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al actualizar movimiento: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> deleteMovimiento(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id) {

        long startTime = System.currentTimeMillis();
        try {
            Object resp = movimientoCajaService.delete(id, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Movimiento eliminado con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al eliminar movimiento: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private Specification<MovimientoCajaEntity> dateRangeSpec(String desde, String hasta) {
        LocalDateTime from = parseDateTime(desde, true);
        LocalDateTime to = parseDateTime(hasta, false);
        return (root, query, cb) -> {
            if (from != null && to != null) {
                return cb.between(root.get("fecha"), from, to);
            }
            if (from != null) {
                return cb.greaterThanOrEqualTo(root.get("fecha"), from);
            }
            if (to != null) {
                return cb.lessThanOrEqualTo(root.get("fecha"), to);
            }
            return cb.conjunction();
        };
    }

    private Specification<MovimientoCajaEntity> searchSpec(String value) {
        String queryText = value == null ? "" : value.trim().toLowerCase();
        return (root, query, cb) -> {
            if (queryText.isBlank()) {
                return cb.conjunction();
            }
            String pattern = "%" + queryText + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("tipo")), pattern),
                    cb.like(cb.lower(root.get("motivo")), pattern),
                    cb.like(cb.lower(root.get("category")), pattern),
                    cb.like(cb.lower(root.get("referenceType")), pattern),
                    cb.like(cb.lower(root.get("referenceId")), pattern));
        };
    }

    private Specification<MovimientoCajaEntity> sessionSpec(String value) {
        Integer sessionId = parseNullableInt(value);
        return (root, query, cb) -> sessionId == null
                ? cb.conjunction()
                : cb.equal(root.get("cajaSesion").get("idCajaSesion"), sessionId);
    }

    private Specification<MovimientoCajaEntity> mediumSpec(String value) {
        String medium = value == null ? "" : value.trim().toUpperCase();
        return (root, query, cb) -> {
            if (Set.of("CARD", "TARJETA", "ELECTRONIC", "ELECTRONICO").contains(medium)) {
                return root.get("tipo").in(ELECTRONIC_MOVEMENT_TYPES);
            }
            if (Set.of("CASH", "EFECTIVO").contains(medium)) {
                return cb.not(root.get("tipo").in(ELECTRONIC_MOVEMENT_TYPES));
            }
            return cb.conjunction();
        };
    }

    private LocalDateTime parseDateTime(String value, boolean startOfDay) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim();
        try {
            if (normalized.contains("T")) {
                return LocalDateTime.parse(normalized);
            }
            LocalDate date = LocalDate.parse(normalized);
            return startOfDay ? date.atStartOfDay() : date.atTime(LocalTime.MAX);
        } catch (Exception ignored) {
            return null;
        }
    }

    private Integer parseNullableInt(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Integer.valueOf(value.trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private int parseInt(String value, int fallback, int min, int max) {
        try {
            int parsed = Integer.parseInt(String.valueOf(value));
            return Math.max(min, Math.min(max, parsed));
        } catch (Exception ignored) {
            return fallback;
        }
    }
}

