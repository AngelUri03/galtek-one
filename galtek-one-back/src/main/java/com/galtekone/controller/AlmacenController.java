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

import com.galtekone.entity.AlmacenEntity;
import com.galtekone.services.AlmacenService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping(path = "almacen")
public class AlmacenController {

	@Autowired
	DynamicSpecification dynamicSpecification;

	@Autowired
	private AlmacenService almacenService;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getAlmacen(@RequestHeader(name = "user", required = true) String user,
			@RequestParam Map<String, String> filters) {

		long startTime = System.currentTimeMillis();

		try {
			Specification<AlmacenEntity> specs = dynamicSpecification.buildSpecification(filters, AlmacenEntity.class);
			Object resp = almacenService.read(specs);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Almacen obtenido con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener el almacen: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> postAlmacen(@RequestHeader(name = "user", required = true) String user,
			@RequestBody AlmacenEntity entity) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = almacenService.create(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Almacen creado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al crear el almacen: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putAlmacen(@RequestHeader(name = "user", required = true) String user,
	                                         @PathVariable Integer id,
	                                         @RequestBody AlmacenEntity entity) {
	    long startTime = System.currentTimeMillis();

	    try {
	        entity.setIdAlmacen(id);
	        Object resp = almacenService.update(entity, user);

	        return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Almacen actualizado con Ã©xito");
	    } catch (Exception e) {
	        return ApiResponseBuilder.buildErrorResponse(user, startTime,
	                "Error al actualizar el almacen: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
	    }
	}

	
	@DeleteMapping(path="/{id}",  produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteAlmacen(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = almacenService.delete(id, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Almacen eliminado con Ã©xito");

		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar el almacen: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

}