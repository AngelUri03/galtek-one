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

import com.galtekone.entity.UnidadesEntity;
import com.galtekone.services.UnidadesService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping(path = "unidades")
public class UnidadesController {

	@Autowired
	DynamicSpecification dynamicSpecification;

	@Autowired
	private UnidadesService unidadesService;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getUnidades(@RequestHeader(name = "user", required = true) String user,
			@RequestParam Map<String, String> filters) {

		long startTime = System.currentTimeMillis();

		try {
			Specification<UnidadesEntity> specs = dynamicSpecification.buildSpecification(filters, UnidadesEntity.class);
			Object resp = unidadesService.read(specs);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Unidad obtenida con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener las unidades: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> postUnidades(@RequestHeader(name = "user", required = true) String user,
			@RequestBody UnidadesEntity entity) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = unidadesService.create(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Unidad creada con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al crear las unidades: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@PutMapping(path="/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putUnidades(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id,
			@RequestBody UnidadesEntity entity) {
		long startTime = System.currentTimeMillis();

		try {
			entity.setIdUnidad(id);
			Object resp = unidadesService.update(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Unidad actualizado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar las unidades: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@DeleteMapping(path="/{id}",  produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteUnidades(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = unidadesService.delete(id, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Unidad eliminada con Ã©xito");

		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar las unidades: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

}
