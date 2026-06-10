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

import com.galtekone.entity.LotesEntity;
import com.galtekone.services.LotesService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;

@RestController
@RequestMapping(path = "lotes")
public class LotesController {

    @Autowired
    DynamicSpecification dynamicSpecification;

    @Autowired
    private LotesService lotesService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getLotes(@RequestHeader(name = "user", required = true) String user,
            @RequestParam Map<String, String> filters) {

        long startTime = System.currentTimeMillis();

        try {
            Specification<LotesEntity> specs = dynamicSpecification.buildSpecification(filters, LotesEntity.class);
            Object resp = lotesService.readDTO(specs);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Lotes obtenidos con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al obtener los Lotes: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> postLotes(@RequestHeader(name = "user", required = true) String user,
            @RequestBody LotesEntity entity) {
        long startTime = System.currentTimeMillis();

        try {
            Object resp = lotesService.create(entity, user);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Lote creado con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al crear el lote: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(path = "/ajuste", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> postLotesAjuste(@RequestHeader(name = "user", required = true) String user,
            @RequestBody com.galtekone.dto.lotes.AjusteLoteRequest request) {
        long startTime = System.currentTimeMillis();

        try {
            Object resp = lotesService.ajustarStock(request, user);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Stock ajustado con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al ajustar el stock: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> putLotes(@RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id,
            @RequestBody LotesEntity entity) {
        long startTime = System.currentTimeMillis();

        try {
            entity.setIdLote(id);
            Object resp = lotesService.update(entity, user);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Lote actualizado con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al actualizar el lote: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> deleteLotes(@RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id) {
        long startTime = System.currentTimeMillis();

        try {
            Object resp = lotesService.delete(id, user);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Lote eliminado con Ã©xito");

        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al eliminar el lote: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
