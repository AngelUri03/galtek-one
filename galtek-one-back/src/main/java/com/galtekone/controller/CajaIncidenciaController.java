package com.galtekone.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.galtekone.dto.caja.CajaIncidenciaResolverRequestDTO;
import com.galtekone.services.CajaIncidenciaService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.CajaOperacionException;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(path = "caja/incidencias")
@RequiredArgsConstructor
public class CajaIncidenciaController {

    private final CajaIncidenciaService cajaIncidenciaService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getPendientes(@RequestHeader(name = "user", required = true) String user) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = cajaIncidenciaService.getPendientes(user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Incidencias de caja obtenidas con exito");
        } catch (CajaOperacionException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    e.getCode() + ": " + e.getMessage(), e.getStatus());
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_INCIDENTS_ERROR: Error al obtener incidencias: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(path = "/{id}/resolver", produces = MediaType.APPLICATION_JSON_VALUE,
            consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> resolver(@RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id,
            @RequestBody CajaIncidenciaResolverRequestDTO request) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = cajaIncidenciaService.resolver(id, request, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Incidencia de caja resuelta con exito");
        } catch (CajaOperacionException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    e.getCode() + ": " + e.getMessage(), e.getStatus());
        } catch (IllegalArgumentException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_INCIDENT_INVALID: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_INCIDENT_ERROR: Error al resolver incidencia: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
