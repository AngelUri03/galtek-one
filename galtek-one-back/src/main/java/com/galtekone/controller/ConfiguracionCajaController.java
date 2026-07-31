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

import com.galtekone.dto.caja.ConfiguracionCajaDTO;
import com.galtekone.services.ConfiguracionCajaService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.CajaOperacionException;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(path = "configuracion/caja")
@RequiredArgsConstructor
public class ConfiguracionCajaController {

    private final ConfiguracionCajaService configuracionCajaService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getConfiguracion(@RequestHeader(name = "user", required = true) String user) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = configuracionCajaService.getConfiguracion(user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Configuracion de caja obtenida con exito");
        } catch (CajaOperacionException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    e.getCode() + ": " + e.getMessage(), e.getStatus());
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_POLICY_ERROR: Error al obtener configuracion de caja: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> updateConfiguracion(@RequestHeader(name = "user", required = true) String user,
            @RequestBody ConfiguracionCajaDTO request) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = configuracionCajaService.updateConfiguracion(request, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Configuracion de caja actualizada con exito");
        } catch (CajaOperacionException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    e.getCode() + ": " + e.getMessage(), e.getStatus());
        } catch (IllegalArgumentException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_POLICY_INVALID: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_POLICY_ERROR: Error al actualizar configuracion de caja: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
