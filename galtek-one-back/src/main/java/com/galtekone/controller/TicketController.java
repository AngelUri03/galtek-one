package com.galtekone.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.galtekone.dto.ticket.TicketPrintRequest;
import com.galtekone.utils.ApiResponseBuilder;

@RestController
@RequestMapping(path = "ticket")
public class TicketController {

    @PostMapping(
            value = "/imprimir",
            produces = MediaType.APPLICATION_JSON_VALUE,
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Object> imprimirTicket(
            @RequestHeader(name = "user", required = true) String user,
            @RequestBody TicketPrintRequest request
    ) {
        long startTime = System.currentTimeMillis();

        try {
            if (request == null) {
                return ApiResponseBuilder.buildErrorResponse(user, startTime,
                        "El ticket no puede estar vacio", HttpStatus.BAD_REQUEST);
            }

            Map<String, Object> resp = new HashMap<>();
            resp.put("folio", request.getFolio());
            resp.put("items", request.getItems() == null ? 0 : request.getItems().size());
            resp.put("impreso", false);
            resp.put("mensaje", "Ticket recibido. Impresion local pendiente de configurar.");

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime,
                    "Ticket procesado correctamente");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al procesar el ticket: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
