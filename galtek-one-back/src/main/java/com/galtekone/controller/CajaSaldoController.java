package com.galtekone.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.galtekone.dto.caja.CajaSaldoInicializarRequestDTO;
import com.galtekone.dto.caja.CajaSaldoMovimientoRequestDTO;
import com.galtekone.services.CajaSaldoService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.CajaOperacionException;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(path = "caja/saldo")
@RequiredArgsConstructor
public class CajaSaldoController {

    private final CajaSaldoService cajaSaldoService;

    @GetMapping(path = "/resumen", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getResumen(@RequestHeader(name = "user", required = true) String user) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = cajaSaldoService.getResumen(user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Saldo de efectivo obtenido con exito");
        } catch (CajaOperacionException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    e.getCode() + ": " + e.getMessage(), e.getStatus());
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_BALANCE_ERROR: Error al obtener saldo de efectivo: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(path = "/inicializar", produces = MediaType.APPLICATION_JSON_VALUE,
            consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> inicializar(@RequestHeader(name = "user", required = true) String user,
            @RequestBody CajaSaldoInicializarRequestDTO request) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = cajaSaldoService.inicializar(request, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Saldo inicial registrado con exito");
        } catch (CajaOperacionException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    e.getCode() + ": " + e.getMessage(), e.getStatus());
        } catch (IllegalArgumentException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_BALANCE_INIT_INVALID: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_BALANCE_INIT_ERROR: Error al inicializar saldo: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(path = "/entradas", produces = MediaType.APPLICATION_JSON_VALUE,
            consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> registrarEntrada(@RequestHeader(name = "user", required = true) String user,
            @RequestBody CajaSaldoMovimientoRequestDTO request) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = cajaSaldoService.registrarEntrada(request, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Entrada de efectivo registrada con exito");
        } catch (CajaOperacionException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    e.getCode() + ": " + e.getMessage(), e.getStatus());
        } catch (IllegalArgumentException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_ENTRY_INVALID: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_ENTRY_ERROR: Error al registrar entrada: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(path = "/retiros", produces = MediaType.APPLICATION_JSON_VALUE,
            consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> registrarRetiro(@RequestHeader(name = "user", required = true) String user,
            @RequestBody CajaSaldoMovimientoRequestDTO request) {
        long startTime = System.currentTimeMillis();
        try {
            Object resp = cajaSaldoService.registrarRetiro(request, user);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Retiro de efectivo registrado con exito");
        } catch (CajaOperacionException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    e.getCode() + ": " + e.getMessage(), e.getStatus());
        } catch (IllegalArgumentException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_WITHDRAWAL_INVALID: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "CASH_WITHDRAWAL_ERROR: Error al registrar retiro: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
