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

import com.galtekone.entity.ProductoEstadoStockEntity;
import com.galtekone.services.ProductoEstadoStockService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;

@RestController
@RequestMapping(path = "productoEstadoStock")
public class ProductoEstadoStockController {

    @Autowired
    DynamicSpecification dynamicSpecification;

    @Autowired
    private ProductoEstadoStockService service;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getReglas(@RequestHeader(name = "user", required = true) String user,
            @RequestParam Map<String, String> filters) {

        long startTime = System.currentTimeMillis();

        try {
            Specification<ProductoEstadoStockEntity> specs = dynamicSpecification.buildSpecification(filters,
                    ProductoEstadoStockEntity.class);
            Object resp = service.readDTO(specs);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Reglas obtenidas con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al obtener las reglas: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> postRegla(@RequestHeader(name = "user", required = true) String user,
            @RequestBody ProductoEstadoStockEntity entity) {
        long startTime = System.currentTimeMillis();

        try {
            Object resp = service.create(entity, user);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Regla creada con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al crear la regla: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> putRegla(@RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id,
            @RequestBody ProductoEstadoStockEntity entity) {
        long startTime = System.currentTimeMillis();

        try {
            entity.setIdProductoEstadoStock(id);
            Object resp = service.update(entity, user);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Regla actualizada con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al actualizar la regla: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> deleteRegla(@RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id) {
        long startTime = System.currentTimeMillis();

        try {
            Object resp = service.delete(id, user);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Regla eliminada con Ã©xito");

        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al eliminar la regla: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(path = "/configurar", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> configurarUmbrales(@RequestHeader(name = "user", required = true) String user,
            @RequestBody com.galtekone.dto.productoEstadoStock.ConfigurarUmbralesDTO dto) {
        long startTime = System.currentTimeMillis();

        try {
            service.configurarUmbrales(dto, user);
            return ApiResponseBuilder.buildSuccessResponse(null, user, startTime, "Umbrales configurados con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al configurar los umbrales: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
