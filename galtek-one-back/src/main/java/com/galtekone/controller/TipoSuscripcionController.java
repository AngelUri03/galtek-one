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

import com.galtekone.entity.TipoSuscripcionEntity;
import com.galtekone.services.TipoSuscripcionService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;


@RestController
@RequestMapping(path = "tipoSuscripcion")
public class TipoSuscripcionController {

	@Autowired
	DynamicSpecification dynamicSpecification;

	@Autowired
	private TipoSuscripcionService tipoSuscripcionService;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getTipoSuscripcion(@RequestHeader(name = "user", required = true) String user,
			@RequestParam Map<String, String> filters) {

		long startTime = System.currentTimeMillis();

		try {
			Specification<TipoSuscripcionEntity> specs = dynamicSpecification.buildSpecification(filters, TipoSuscripcionEntity.class);
			Object resp = tipoSuscripcionService.read(specs);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Suscripcion obtenida con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener la suscripcion: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> postTipoSuscripcion(@RequestHeader(name = "user", required = true) String user,
			@RequestBody TipoSuscripcionEntity entity) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = tipoSuscripcionService.create(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Suscripcion creada con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al crear la suscripcion: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putTipoSuscripcion(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id,
			@RequestBody TipoSuscripcionEntity entity) {
		long startTime = System.currentTimeMillis();

		try {
			entity.setIdTipoSuscripcion(id);
			Object resp = tipoSuscripcionService.update(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Suscricpion actualizada con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar la Suscripcion: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@DeleteMapping(path="/{id}",  produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteTipoSuscripcion(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = tipoSuscripcionService.delete(id, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Suscripcion eliminado con Ã©xito");

		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar la Suscripcion: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

}
