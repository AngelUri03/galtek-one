package com.galtekone.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.galtekone.services.ReporteFinancieroService;
import com.galtekone.utils.ApiResponseBuilder;

@RestController
@RequestMapping(path = "reportes-financieros")
public class ReporteFinancieroController {

    @Autowired
    private ReporteFinancieroService reporteFinancieroService;

    @GetMapping(path = "/ganancias", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getGanancias(
            @RequestHeader(name = "user", required = true) String user,
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta) {

        long startTime = System.currentTimeMillis();
        try {
            // Si no envÃ­an fechas, toma el mes en curso por defecto
            LocalDateTime fechaDesde = desde != null
                    ? LocalDate.parse(desde).atStartOfDay()
                    : LocalDate.now().withDayOfMonth(1).atStartOfDay();

            LocalDateTime fechaHasta = hasta != null
                    ? LocalDate.parse(hasta).atTime(23, 59, 59)
                    : LocalDate.now().atTime(23, 59, 59);

            Object resp = reporteFinancieroService.getReporteGanancia(fechaDesde, fechaHasta);
            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime,
                    "Reporte de ganancias obtenido con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al generar reporte de ganancias: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

