package com.galtekone.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.galtekone.dto.pagos.ConfiguracionPagosDTO;
import com.galtekone.services.ConfiguracionPagosService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.CajaOperacionException;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(path = "configuracion/pagos")
@RequiredArgsConstructor
public class ConfiguracionPagosController {

    private final ConfiguracionPagosService configuracionPagosService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getConfiguracion(@RequestHeader(name = "user", required = true) String user) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = configuracionPagosService.getConfiguracion(user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime,
                    "Configuracion de pagos obtenida con exito");
        } catch (CajaOperacionException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    e.getCode() + ": " + e.getMessage(), e.getStatus());
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "PAYMENTS_CONFIG_ERROR: Error al obtener configuracion de pagos: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> updateConfiguracion(@RequestHeader(name = "user", required = true) String user,
            @RequestBody ConfiguracionPagosDTO request) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = configuracionPagosService.updateConfiguracion(request, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime,
                    "Configuracion de pagos actualizada con exito");
        } catch (CajaOperacionException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    e.getCode() + ": " + e.getMessage(), e.getStatus());
        } catch (IllegalArgumentException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "PAYMENTS_CONFIG_INVALID: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "PAYMENTS_CONFIG_ERROR: Error al actualizar configuracion de pagos: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
