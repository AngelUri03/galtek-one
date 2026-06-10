package com.galtekone.controller;

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

import com.galtekone.entity.EstadoStockEntity;
import com.galtekone.services.EstadoStockService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;

@RestController
@RequestMapping(path = "estadoStock")
public class EstadoStockController {

    @Autowired
    DynamicSpecification dynamicSpecification;

    @Autowired
    private EstadoStockService estadoStockService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getEstadoStock(@RequestHeader(name = "user", required = true) String user,
            @RequestParam Map<String, String> filters) {

        long startTime = System.currentTimeMillis();

        try {
            Specification<EstadoStockEntity> specs = dynamicSpecification.buildSpecification(filters,
                    EstadoStockEntity.class);
            Object resp = estadoStockService.read(specs);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime,
                    "Estados de stock obtenidos con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al obtener los Estados de stock: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> postEstadoStock(@RequestHeader(name = "user", required = true) String user,
            @RequestBody EstadoStockEntity entity) {
        long startTime = System.currentTimeMillis();

        try {
            Object resp = estadoStockService.create(entity, user);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Estado de stock creado con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al crear el estado de stock: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> putEstadoStock(@RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id,
            @RequestBody EstadoStockEntity entity) {
        long startTime = System.currentTimeMillis();

        try {
            entity.setIdEstadoStock(id);
            Object resp = estadoStockService.update(entity, user);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime,
                    "Estado de stock actualizado con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al actualizar el estado de stock: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> deleteEstadoStock(@RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id) {
        long startTime = System.currentTimeMillis();

        try {
            Object resp = estadoStockService.delete(id, user);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime,
                    "Estado de stock eliminado con Ã©xito");

        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al eliminar el estado de stock: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
