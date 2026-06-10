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

import com.galtekone.entity.UsuariosPermisosEntity;
import com.galtekone.services.UsuariosPermisosService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;

@RestController
@RequestMapping(path = "usuarioPermisos")
public class UsuariosPermisosController {

	@Autowired
	DynamicSpecification dynamicSpecification;

	@Autowired
	private UsuariosPermisosService usuariosPermisosService;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getUsuariosPermisos(@RequestHeader(name = "user", required = true) String user, @RequestParam Map<String, String> filters) {

		long startTime = System.currentTimeMillis();

		try {
			Specification<UsuariosPermisosEntity> specs = dynamicSpecification.buildSpecification(filters, UsuariosPermisosEntity.class);

			Object resp = usuariosPermisosService.read(specs);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Relaciones Usuario-Permiso obtenidas con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, "Error al obtener usuarios-permisos: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> postUsuariosPermisos(@RequestHeader(name = "user", required = true) String user, @RequestBody UsuariosPermisosEntity entity) {

		long startTime = System.currentTimeMillis();

		try {
			Object resp = usuariosPermisosService.create(entity, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Usuario-Permiso creado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, "Error al crear usuario-permiso: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putUsuariosPermisos(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id, @RequestBody UsuariosPermisosEntity entity) {

		long startTime = System.currentTimeMillis();

		try {
			entity.setIdUsuariosPermisos(id);
			Object resp = usuariosPermisosService.update(entity, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Usuario-Permiso actualizado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, "Error al actualizar usuario-permiso: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@DeleteMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteUsuariosPermisos(@RequestHeader(name = "user", required = true) String user, @PathVariable Integer id) {

		long startTime = System.currentTimeMillis();

		try {
			Object resp = usuariosPermisosService.delete(id, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Usuario-Permiso eliminado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, "Error al eliminar usuario-permiso: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
