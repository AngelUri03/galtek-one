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

import com.galtekone.entity.ProveedoresEntity;
import com.galtekone.services.ProveedoresService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping(path = "proveedores")
public class ProveedoresController {

	@Autowired
	DynamicSpecification dynamicSpecification;

	@Autowired
	private ProveedoresService proveedoresService;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getProveedores(@RequestHeader(name = "user", required = true) String user,
			@RequestParam Map<String, String> filters) {

		long startTime = System.currentTimeMillis();

		try {
			Specification<ProveedoresEntity> specs = dynamicSpecification.buildSpecification(filters, ProveedoresEntity.class);
			Object resp = proveedoresService.read(specs);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Proveedor obtenido con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener los Proveedores: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> postProveedores(@RequestHeader(name = "user", required = true) String user,
			@RequestBody ProveedoresEntity entity) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = proveedoresService.create(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Proveedor creado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al crear los proveedores: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@PutMapping(path="/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putProveedores(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id,
			@RequestBody ProveedoresEntity entity) {
		long startTime = System.currentTimeMillis();

		try {
			entity.setIdProveedor(id);
			Object resp = proveedoresService.update(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Proveedor actualizado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar los proveedores: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@DeleteMapping(path="/{id}",  produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteProveedores(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = proveedoresService.delete(id, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Proveedor eliminado con Ã©xito");

		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar los proveedores: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

}
