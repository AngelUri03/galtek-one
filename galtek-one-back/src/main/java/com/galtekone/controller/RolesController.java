package com.galtekone.controller;

import org.springframework.beans.factory.annotation.Autowired;
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
import org.springframework.web.bind.annotation.RestController;

import com.galtekone.dto.rol.RolPermisosRequestDTO;
import com.galtekone.dto.rol.RolRequestDTO;
import com.galtekone.services.RolesService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;

@RestController
@RequestMapping(path = "roles")
public class RolesController {

	@Autowired
	DynamicSpecification dynamicSpecification;

	@Autowired
	private RolesService rolesService;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getRoles(@RequestHeader(name = "user", required = true) String user, @RequestHeader(name = "idEmpresa", required = true) Integer idEmpresa) {

		long startTime = System.currentTimeMillis();

		try {
			Object resp = rolesService.read(idEmpresa);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Roles obtenidos con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, "Error al obtener los roles: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> postRoles(@RequestHeader(name = "user", required = true) String user, @RequestHeader(name = "idEmpresa", required = true) Integer idEmpresa, @Valid @RequestBody RolRequestDTO body) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = rolesService.create(idEmpresa, body, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Rol creado con Ã©xito");
		} catch (IllegalArgumentException e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.BAD_REQUEST);
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, "Error al crear el rol: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putRolMeta(@RequestHeader(name = "user", required = true) String user, @RequestHeader(name = "idEmpresa", required = true) Integer idEmpresa, @PathVariable Integer id, @Valid @RequestBody RolRequestDTO body) {
		long startTime = System.currentTimeMillis();
		try {
			Object resp = rolesService.update(idEmpresa, id, body, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Rol actualizado con Ã©xito");
		} catch (IllegalArgumentException e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.BAD_REQUEST);
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, "Error al actualizar el rol: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PutMapping(path = "/permisos/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putRolPermisos(@RequestHeader(name = "user", required = true) String user, @RequestHeader(name = "idEmpresa", required = true) Integer idEmpresa, @PathVariable Integer id, @Valid @RequestBody RolPermisosRequestDTO body) {
		long startTime = System.currentTimeMillis();
		try {
			Object resp = rolesService.updatePermisos(idEmpresa, id, body, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Permisos actualizados con Ã©xito");
		} catch (IllegalArgumentException e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.BAD_REQUEST);
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, "Error al actualizar permisos: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@DeleteMapping(path = "/{idRol}", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteRol(@RequestHeader(name = "user", required = true) String user, @RequestHeader(name = "idEmpresa", required = true) Integer idEmpresa, @PathVariable Integer idRol) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = rolesService.delete(idEmpresa, idRol, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Rol eliminado con Ã©xito");
		} catch (IllegalArgumentException e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.BAD_REQUEST);
		} catch (EntityNotFoundException e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.NOT_FOUND);
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, "Error al eliminar el rol: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

}
