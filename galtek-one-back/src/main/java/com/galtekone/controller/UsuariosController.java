package com.galtekone.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.galtekone.entity.UsuariosEntity;
import com.galtekone.dto.usuario.UsuarioOverridesRequestDTO;
import com.galtekone.services.UsuariosService;
import com.galtekone.services.UsuariosPermisosService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;

@RestController
@RequestMapping(path = "usuarios")
public class UsuariosController {

	@Autowired
	DynamicSpecification dynamicSpecification;

	@Autowired
	private UsuariosService usuariosService;

	@Autowired
	private UsuariosPermisosService usuariosPermisosService;

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

	@GetMapping(path = "/overrides", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getUsuariosOverridesResumen(@RequestHeader(name = "user", required = true) String user,
			@RequestHeader(name = "idEmpresa", required = true) Integer idEmpresa) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = usuariosPermisosService.getOverridesResumen(idEmpresa, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Resumen de overrides obtenido con exito");
		} catch (IllegalArgumentException e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.BAD_REQUEST);
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener overrides: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@GetMapping(path = "/{id}/permisos-efectivos", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getPermisosEfectivos(@RequestHeader(name = "user", required = true) String user,
			@RequestHeader(name = "idEmpresa", required = true) Integer idEmpresa, @PathVariable Integer id) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = usuariosPermisosService.getPermisosEfectivos(id, idEmpresa, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Permisos efectivos obtenidos con exito");
		} catch (IllegalArgumentException e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.BAD_REQUEST);
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener permisos efectivos: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@GetMapping(path = "/{id}/overrides", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getOverridesUsuario(@RequestHeader(name = "user", required = true) String user,
			@RequestHeader(name = "idEmpresa", required = true) Integer idEmpresa, @PathVariable Integer id) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = usuariosPermisosService.getOverridesActivos(id, idEmpresa, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Overrides obtenidos con exito");
		} catch (IllegalArgumentException e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.BAD_REQUEST);
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener overrides del usuario: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PutMapping(path = "/{id}/overrides", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putOverridesUsuario(@RequestHeader(name = "user", required = true) String user,
			@RequestHeader(name = "idEmpresa", required = true) Integer idEmpresa, @PathVariable Integer id,
			@RequestBody UsuarioOverridesRequestDTO body) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = usuariosPermisosService.updateOverrides(id, idEmpresa, body, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Overrides guardados con exito");
		} catch (IllegalArgumentException e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.BAD_REQUEST);
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al guardar overrides: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@DeleteMapping(path = "/{id}/overrides/{idPermiso}", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteOverrideUsuario(@RequestHeader(name = "user", required = true) String user,
			@RequestHeader(name = "idEmpresa", required = true) Integer idEmpresa, @PathVariable Integer id,
			@PathVariable Integer idPermiso) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = usuariosPermisosService.deleteOverride(id, idPermiso, idEmpresa, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Override eliminado con exito");
		} catch (IllegalArgumentException e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.BAD_REQUEST);
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al eliminar override: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PutMapping(path = "/me/password", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putOwnPassword(@RequestHeader(name = "user", required = true) String user,
			@RequestBody Map<String, String> body) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = usuariosService.changeOwnPassword(user, body.get("password"));
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Password actualizada con exito");
		} catch (IllegalArgumentException e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.BAD_REQUEST);
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar password: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PutMapping(path = "/{id}/password", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putPassword(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id, @RequestBody Map<String, String> body) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = usuariosService.updatePassword(id, body.get("password"), user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Password actualizada con exito");
		} catch (IllegalArgumentException e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.BAD_REQUEST);
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar password: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PostMapping(path = "/{id}/imagen", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<Object> postImagen(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id, @RequestParam("imagen") MultipartFile imagen) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = usuariosService.updateAvatar(id, imagen.getContentType(), imagen.getBytes(), user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Imagen actualizada con exito");
		} catch (IllegalArgumentException e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.BAD_REQUEST);
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar imagen: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PutMapping(path = "/{id}/activar", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> activarUsuario(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = usuariosService.activar(id, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Usuario activado con exito");
		} catch (IllegalArgumentException e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.BAD_REQUEST);
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al activar usuario: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PutMapping(path = "/{id}/desactivar", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> desactivarUsuario(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = usuariosService.desactivar(id, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Usuario desactivado con exito");
		} catch (IllegalArgumentException e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.BAD_REQUEST);
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al desactivar usuario: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@DeleteMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteUsuarios(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = usuariosService.delete(id, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Usuario desactivado con exito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al desactivar los usuarios: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
