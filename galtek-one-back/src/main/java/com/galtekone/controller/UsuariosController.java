package com.galtekone.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.galtekone.entity.UsuariosEntity;
import com.galtekone.services.UsuariosService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;

@RestController
@RequestMapping(path = "usuarios")
public class UsuariosController {

	@Autowired
	DynamicSpecification dynamicSpecification;

	@Autowired
	private UsuariosService usuariosService;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getUsuarios(@RequestHeader(name = "user", required = true) String user,
			@RequestParam Map<String, String> filters) {

		long startTime = System.currentTimeMillis();

		try {
			Specification<UsuariosEntity> specs = dynamicSpecification.buildSpecification(filters,
					UsuariosEntity.class);
			Object resp = usuariosService.read(specs);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Usuario obtenido con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener los usuarios: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@GetMapping(path = "/rol", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getUsuariosRol(@RequestHeader(name = "user", required = true) String user,
			@RequestHeader(name = "idEmpresa", required = true) Integer idEmpresa) {

		long startTime = System.currentTimeMillis();

		try {
			Object resp = usuariosService.getUsuariosRol(idEmpresa);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Usuarios obtenidos con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener los usuarios: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> postUsuarios(@RequestHeader(name = "user", required = true) String user,
			@RequestBody UsuariosEntity entity) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = usuariosService.create(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Usuario creado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al crear los usuarios: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putUsuarios(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id, @RequestBody UsuariosEntity entity) {
		long startTime = System.currentTimeMillis();

		try {
			entity.setIdUsuario(id);
			Object resp = usuariosService.update(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Usuario actualizado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar los usuarios: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@DeleteMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteUsuarios(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = usuariosService.delete(id, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Usuario eliminado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al eliminar los usuarios: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
