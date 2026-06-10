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

import com.galtekone.entity.MetodoPagoEntity;
import com.galtekone.services.MetodoPagoService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping(path = "metodoPago")
public class MetodoPagoController {

	@Autowired
	DynamicSpecification dynamicSpecification;

	@Autowired
	private MetodoPagoService metodoPagoService;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getMetodoPago(@RequestHeader(name = "user", required = true) String user,
			@RequestParam Map<String, String> filters) {

		long startTime = System.currentTimeMillis();

		try {
			Specification<MetodoPagoEntity> specs = dynamicSpecification.buildSpecification(filters, MetodoPagoEntity.class);
			Object resp = metodoPagoService.read(specs);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Pago obtenido con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener los Pagos: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> postMetodoPago(@RequestHeader(name = "user", required = true) String user,
			@RequestBody MetodoPagoEntity entity) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = metodoPagoService.create(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Pago creado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al crear los Pagos: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@PutMapping(path="/{id}",produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putMetodoPago(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id,
			@RequestBody MetodoPagoEntity entity) {
		long startTime = System.currentTimeMillis();

		try {
			entity.setIdMetodoPago(id);
			Object resp = metodoPagoService.update(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Pago actualizado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar los pagos: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@DeleteMapping(path="/{id}",  produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteMetodoPago(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = metodoPagoService.delete(id, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Pago eliminado con Ã©xito");

		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar los pagos: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

}
