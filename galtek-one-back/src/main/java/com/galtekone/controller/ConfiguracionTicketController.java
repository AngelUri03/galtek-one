package com.galtekone.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.galtekone.dto.ticket.TicketConfigDTO;
import com.galtekone.services.ConfiguracionTicketService;
import com.galtekone.utils.ApiResponseBuilder;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping(path = "configuracion/ticket")
@RequiredArgsConstructor
public class ConfiguracionTicketController {

    private final ConfiguracionTicketService configuracionTicketService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getConfig(@RequestHeader(name = "user", required = true) String user) {
        long startTime = System.currentTimeMillis();
        try {
            TicketConfigDTO response = configuracionTicketService.readActual();
            return ApiResponseBuilder.buildSuccessResponse(response, user, startTime,
                    "Configuracion de ticket obtenida con exito");
        } catch (Exception ex) {
            return handleError(user, startTime, "Error al obtener configuracion de ticket: " + ex.getMessage(), ex);
        }
    }

    @PutMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> putConfig(
            @RequestHeader(name = "user", required = true) String user,
            @RequestBody TicketConfigDTO dto) {
        long startTime = System.currentTimeMillis();
        try {
            TicketConfigDTO response = configuracionTicketService.updateActual(dto, user);
            return ApiResponseBuilder.buildSuccessResponse(response, user, startTime,
                    "Configuracion de ticket guardada con exito");
        } catch (Exception ex) {
            return handleError(user, startTime, "Error al guardar configuracion de ticket: " + ex.getMessage(), ex);
        }
    }

    @PostMapping(path = "/restaurar-base", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> restoreConfig(@RequestHeader(name = "user", required = true) String user) {
        long startTime = System.currentTimeMillis();
        try {
            TicketConfigDTO response = configuracionTicketService.restoreDefault(user);
            return ApiResponseBuilder.buildSuccessResponse(response, user, startTime,
                    "Configuracion de ticket restaurada con exito");
        } catch (Exception ex) {
            return handleError(user, startTime, "Error al restaurar configuracion de ticket: " + ex.getMessage(), ex);
        }
    }

    private ResponseEntity<Object> handleError(String user, long startTime, String message, Exception ex) {
        if (ex instanceof IllegalArgumentException) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime, ex.getMessage(), HttpStatus.BAD_REQUEST);
        }
        if (ex instanceof EntityNotFoundException) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime, ex.getMessage(), HttpStatus.NOT_FOUND);
        }
        return ApiResponseBuilder.buildErrorResponse(user, startTime, message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
