package com.galtekone.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.galtekone.dto.caja.CajaAperturaRequestDTO;
import com.galtekone.dto.caja.CajaCierreRequestDTO;
import com.galtekone.services.CajaSesionService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.CajaOperacionException;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(path = "caja")
@RequiredArgsConstructor
public class CajaSesionController {

    private final CajaSesionService cajaSesionService;

    @GetMapping(path = "/estado-actual", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getEstadoActual(@RequestHeader(name = "user", required = true) String user) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = cajaSesionService.getEstadoActual(user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Estado de caja obtenido con exito");
        } catch (CajaOperacionException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    e.getCode() + ": " + e.getMessage(), e.getStatus());
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_STATE_ERROR: Error al obtener estado de caja: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping(path = "/sesiones/actual/resumen", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getResumenActual(@RequestHeader(name = "user", required = true) String user) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = cajaSesionService.getResumenSesionActual(user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Resumen de turno obtenido con exito");
        } catch (CajaOperacionException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    e.getCode() + ": " + e.getMessage(), e.getStatus());
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_SUMMARY_ERROR: Error al obtener resumen de turno: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping(path = "/sesiones/historial", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getHistorialSesiones(
            @RequestHeader(name = "user", required = true) String user,
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta,
            @RequestParam(required = false, name = "q") String query,
            @RequestParam(required = false) String medium,
            @RequestParam(required = false) Integer sessionId,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "8") Integer size,
            @RequestParam(defaultValue = "openedAt") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {
        long startTime = System.currentTimeMillis();
        try {
            LocalDateTime from = parseDateTime(desde, true);
            LocalDateTime to = parseDateTime(hasta, false);
            if (from != null && to != null && from.isAfter(to)) {
                throw new IllegalArgumentException("La fecha inicial no puede ser mayor a la fecha final.");
            }
            int safePage = Math.max(0, page == null ? 0 : page);
            int safeSize = Math.max(5, Math.min(50, size == null ? 8 : size));
            String sortField = "closedAt".equals(sort) || "lastActivityAt".equals(sort) ? sort : "openedAt";
            Sort.Direction sortDirection = "ASC".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;

            Object resp = cajaSesionService.getHistorialSesiones(
                    user,
                    from,
                    to,
                    query,
                    medium,
                    sessionId,
                    PageRequest.of(safePage, safeSize, Sort.by(sortDirection, sortField)));
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Historial de cortes obtenido con exito");
        } catch (CajaOperacionException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    e.getCode() + ": " + e.getMessage(), e.getStatus());
        } catch (IllegalArgumentException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_HISTORY_INVALID: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_HISTORY_ERROR: Error al obtener historial de cortes: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(path = "/sesiones/actual/revelar-efectivo-esperado", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> revelarEsperado(@RequestHeader(name = "user", required = true) String user) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = cajaSesionService.revelarEfectivoEsperado(user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Efectivo esperado revelado con exito");
        } catch (CajaOperacionException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    e.getCode() + ": " + e.getMessage(), e.getStatus());
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_REVEAL_ERROR: Error al revelar efectivo esperado: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(path = "/sesiones/actual/preparar-cierre", produces = MediaType.APPLICATION_JSON_VALUE,
            consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> prepararCierre(@RequestHeader(name = "user", required = true) String user,
            @RequestBody CajaCierreRequestDTO request) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = cajaSesionService.prepararCierreSesionActual(request, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Previsualizacion de cierre obtenida con exito");
        } catch (CajaOperacionException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    e.getCode() + ": " + e.getMessage(), e.getStatus());
        } catch (IllegalArgumentException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_CLOSE_PREVIEW_INVALID: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_CLOSE_PREVIEW_ERROR: Error al preparar cierre: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(path = "/sesiones/abrir", produces = MediaType.APPLICATION_JSON_VALUE,
            consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> abrir(@RequestHeader(name = "user", required = true) String user,
            @RequestBody CajaAperturaRequestDTO request) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = cajaSesionService.abrir(request, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Turno de caja abierto con exito");
        } catch (CajaOperacionException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    e.getCode() + ": " + e.getMessage(), e.getStatus());
        } catch (IllegalArgumentException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_OPEN_INVALID: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (IllegalStateException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_OPEN_CONFLICT: " + e.getMessage(), HttpStatus.CONFLICT);
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_OPEN_ERROR: Error al abrir caja: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(path = "/sesiones/actual/cerrar", produces = MediaType.APPLICATION_JSON_VALUE,
            consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> cerrar(@RequestHeader(name = "user", required = true) String user,
            @RequestBody CajaCierreRequestDTO request) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = cajaSesionService.cerrarSesionActual(request, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Turno de caja cerrado con exito");
        } catch (CajaOperacionException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    e.getCode() + ": " + e.getMessage(), e.getStatus());
        } catch (IllegalArgumentException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_CLOSE_INVALID: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (IllegalStateException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_CLOSE_CONFLICT: " + e.getMessage(), HttpStatus.CONFLICT);
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_CLOSE_ERROR: Error al cerrar caja: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private LocalDateTime parseDateTime(String value, boolean startOfDay) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.contains("T")) {
            return LocalDateTime.parse(normalized);
        }
        LocalDate date = LocalDate.parse(normalized);
        return startOfDay ? date.atStartOfDay() : date.atTime(LocalTime.MAX);
    }
}
