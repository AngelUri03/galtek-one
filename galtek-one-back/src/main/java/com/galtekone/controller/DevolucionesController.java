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

import com.galtekone.dto.devolucion.DevolucionesDTO;
import com.galtekone.entity.DevolucionesEntity;
import com.galtekone.entity.VentasEntity;
import com.galtekone.services.DevolucionesService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping(path = "devoluciones")
public class DevolucionesController {

	@Autowired
	DynamicSpecification dynamicSpecification;

	@Autowired
	private DevolucionesService devolucionesService;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getDevoluciones(@RequestHeader(name = "user", required = true) String user,
			@RequestParam Map<String, String> filters) {

		long startTime = System.currentTimeMillis();

		try {
			Specification<DevolucionesEntity> specs = dynamicSpecification.buildSpecification(filters, DevolucionesEntity.class);
			Object resp = devolucionesService.read(specs);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Devolucion obtenida con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener las devoluciones: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

//	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
//	public ResponseEntity<Object> postDevoluciones(@RequestHeader(name = "user", required = true) String user,
//			@RequestBody DevolucionesEntity entity) {
//		long startTime = System.currentTimeMillis();
//
//		try {
//			Object resp = devolucionesService.create(entity, user);
//
//			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Devolucion creada con Ã©xito");
//		} catch (Exception e) {
//			return ApiResponseBuilder.buildErrorResponse(user, startTime,
//					"Error al crear las devoluciones: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
//		}
//	}
	
//	@PutMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
//	public ResponseEntity<Object> putDevoluciones(@RequestHeader(name = "user", required = true) String user,
//			@RequestBody DevolucionesEntity entity) {
//		long startTime = System.currentTimeMillis();
//
//		try {
//			Object resp = devolucionesService.update(entity, user);
//
//			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Devolucion actualizada con Ã©xito");
//		} catch (Exception e) {
//			return ApiResponseBuilder.buildErrorResponse(user, startTime,
//					"Error al actualizar las devoluciones: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
//		}
//	}
	
    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> postDevolucion(
            @RequestHeader(name = "user", required = true) String user,
            @RequestBody DevolucionesDTO dto) {

        long startTime = System.currentTimeMillis();

        try {
            DevolucionesEntity entity = new DevolucionesEntity();
            entity.setTotalDevolucion(dto.getTotalDevolucion());
            entity.setMotivo(dto.getMotivo());

            if (dto.getIdVenta() != null) {
                VentasEntity venta = new VentasEntity();
                venta.setIdVenta(dto.getIdVenta());
                entity.setVenta(venta);
            }

            Object resp = devolucionesService.create(entity, user);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime,
                    "DevoluciÃ³n registrada con Ã©xito");

        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al registrar la devoluciÃ³n: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
	
    @PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> putDevolucion(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id,
            @RequestBody DevolucionesDTO dto) {

        long startTime = System.currentTimeMillis();

        try {
            DevolucionesEntity entity = new DevolucionesEntity();
            entity.setIdDevolucion(id);
            entity.setTotalDevolucion(dto.getTotalDevolucion());
            entity.setMotivo(dto.getMotivo());

            if (dto.getIdVenta() != null) {
                VentasEntity venta = new VentasEntity();
                venta.setIdVenta(dto.getIdVenta());
                entity.setVenta(venta);
            }

            Object resp = devolucionesService.update(entity, user);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime,
                    "DevoluciÃ³n actualizada con Ã©xito");

        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al actualizar la devoluciÃ³n: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    
    
	@DeleteMapping(path="/{id}",  produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteDevoluciones(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = devolucionesService.delete(id, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Devolucion eliminada con Ã©xito");

		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar las Devoluciones: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

}