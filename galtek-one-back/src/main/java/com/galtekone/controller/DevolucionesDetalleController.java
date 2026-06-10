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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.galtekone.dto.devolucion.DevolucionesDetalleDTO;
import com.galtekone.entity.DevolucionesDetalleEntity;
import com.galtekone.entity.DevolucionesEntity;
import com.galtekone.entity.ProductosEntity;
import com.galtekone.services.DevolucionesDetalleService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping(path = "devolucionesDetalle")
public class DevolucionesDetalleController {

    @Autowired
    DynamicSpecification dynamicSpecification;

    @Autowired
    private DevolucionesDetalleService devolucionesDetalleService;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getDevolucionesDetalle(
            @RequestHeader(name = "user", required = true) String user,
            @RequestParam Map<String, String> filters) {

        long startTime = System.currentTimeMillis();

        try {
            Specification<DevolucionesDetalleEntity> specs =
                    dynamicSpecification.buildSpecification(filters, DevolucionesDetalleEntity.class);

            Object resp = devolucionesDetalleService.read(specs);

            return ApiResponseBuilder.buildSuccessResponse(
                    resp, user, startTime, "Detalles de devoluciÃ³n obtenidos con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(
                    user, startTime,
                    "Error al obtener los detalles de devoluciÃ³n: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> postDevolucionesDetalle(
            @RequestHeader(name = "user", required = true) String user,
            @RequestBody DevolucionesDetalleDTO dto) {

        long startTime = System.currentTimeMillis();

        try {
            DevolucionesDetalleEntity entity = new DevolucionesDetalleEntity();

            DevolucionesEntity devolucion = new DevolucionesEntity();
            devolucion.setIdDevolucion(dto.getIdDevolucion());
            entity.setDevolucion(devolucion);

            ProductosEntity producto = new ProductosEntity();
            producto.setIdProducto(dto.getIdProducto());
            entity.setProducto(producto);

            entity.setCantidad(dto.getCantidad());
            entity.setSubtotal(dto.getSubtotal());

            Object resp = devolucionesDetalleService.create(entity, user);

            return ApiResponseBuilder.buildSuccessResponse(
                    resp, user, startTime, "Detalle de devoluciÃ³n registrado con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(
                    user, startTime,
                    "Error al registrar el detalle de devoluciÃ³n: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> putDevolucionesDetalle(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id,
            @RequestBody DevolucionesDetalleDTO dto) {

        long startTime = System.currentTimeMillis();

        try {
            DevolucionesDetalleEntity entity = new DevolucionesDetalleEntity();
            entity.setIdDevolucionDetalle(id);

            if (dto.getIdDevolucion() != null) {
                DevolucionesEntity devolucion = new DevolucionesEntity();
                devolucion.setIdDevolucion(dto.getIdDevolucion());
                entity.setDevolucion(devolucion);
            }

            if (dto.getIdProducto() != null) {
                ProductosEntity producto = new ProductosEntity();
                producto.setIdProducto(dto.getIdProducto());
                entity.setProducto(producto);
            }

            entity.setCantidad(dto.getCantidad());
            entity.setSubtotal(dto.getSubtotal());

            Object resp = devolucionesDetalleService.update(entity, user);

            return ApiResponseBuilder.buildSuccessResponse(
                    resp, user, startTime, "Detalle de devoluciÃ³n actualizado con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(
                    user, startTime,
                    "Error al actualizar el detalle de devoluciÃ³n: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> deleteDevolucionesDetalle(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id) {

        long startTime = System.currentTimeMillis();

        try {
            Object resp = devolucionesDetalleService.delete(id, user);

            return ApiResponseBuilder.buildSuccessResponse(
                    resp, user, startTime, "Detalle de devoluciÃ³n eliminado con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(
                    user, startTime,
                    "Error al eliminar el detalle de devoluciÃ³n: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

