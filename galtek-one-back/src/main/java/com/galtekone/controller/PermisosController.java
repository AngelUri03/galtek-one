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

import com.galtekone.entity.PermisosEntity;
import com.galtekone.services.PermisosService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;

@RestController
@RequestMapping(path = "permisos")
public class PermisosController {

	@Autowired
	DynamicSpecification dynamicSpecification;

	@Autowired
	private PermisosService permisosService;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getPermisos(@RequestHeader(name = "user", required = true) String user, @RequestParam Map<String, String> filters) {

		long startTime = System.currentTimeMillis();

		try {
			Specification<PermisosEntity> specs = dynamicSpecification.buildSpecification(filters, PermisosEntity.class);
			Object resp = permisosService.read(specs);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Permisos obtenidos con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, "Error al obtener los permisos: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> postPermisos(@RequestHeader(name = "user", required = true) String user, @RequestBody PermisosEntity entity) {

		long startTime = System.currentTimeMillis();

		try {
			Object resp = permisosService.create(entity, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Permiso creado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, "Error al crear el permiso: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putPermisos(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id, @RequestBody PermisosEntity entity) {

		long startTime = System.currentTimeMillis();

		try {
			entity.setIdPermiso(id);
			Object resp = permisosService.update(entity, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Permiso actualizado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, "Error al actualizar el permiso: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@DeleteMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deletePermisos(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id) {

		long startTime = System.currentTimeMillis();

		try {
			Object resp = permisosService.delete(id, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Permiso eliminado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, "Error al eliminar el permiso: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
