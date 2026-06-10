package com.galtekone.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
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
import com.galtekone.services.MovimientoCajaService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;

@RestController
@RequestMapping(path = "movimiento-caja")
public class MovimientoCajaController {

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
            Specification<MovimientoCajaEntity> specs = dynamicSpecification.buildSpecification(filters,
                    MovimientoCajaEntity.class);
            Object resp = movimientoCajaService.readDTO(specs);
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
            entity.setFecha(dto.getFecha());

            CajasEntity caja = new CajasEntity();
            caja.setIdCaja(dto.getIdCaja());
            entity.setCaja(caja);

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
}

