package com.galtekone.controller;

import java.util.Map;

import com.galtekone.dto.inventario.InventarioFilterDTO;
import com.galtekone.utils.InventarioSpecification;
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

import com.galtekone.entity.InventarioEntity;
import com.galtekone.services.InventarioService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping(path = "inventario")
public class InventarioController {

	@Autowired
	DynamicSpecification dynamicSpecification;

	@Autowired
	private InventarioService inventarioService;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getInventario(@RequestHeader(name = "user", required = true) String user,
			@RequestParam Map<String, String> filters) {

		long startTime = System.currentTimeMillis();

		try {
			Specification<InventarioEntity> specs = dynamicSpecification.buildSpecification(filters,
					InventarioEntity.class);
			Object resp = inventarioService.getInventarioConEstado(specs);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Inventario obtenido con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener los Inventarios: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/**
	 * Endpoint para filtros avanzados de inventario.
	 * Soporta filtrado por estado de stock, lotes caducados, rangos, etc.
	 */
	@PostMapping(path = "/filtrar", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> filterInventario(@RequestHeader(name = "user", required = true) String user,
			@RequestBody InventarioFilterDTO filterDTO) {

		long startTime = System.currentTimeMillis();

		try {
			// Construir Specification con lÃ³gica avanzada
			Specification<InventarioEntity> specs = InventarioSpecification
					.filter(filterDTO);

			// Reutilizar servicio existente que ya calcula el estado de stock
			Object resp = inventarioService.getInventarioConEstado(specs);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Inventario filtrado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al filtrar los Inventarios: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> postInventario(@RequestHeader(name = "user", required = true) String user,
			@RequestBody InventarioEntity entity) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = inventarioService.create(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Inventario creado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al crear los inventarios: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putInventario(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id,
			@RequestBody InventarioEntity entity) {
		long startTime = System.currentTimeMillis();

		try {
			entity.setIdInventario(id);
			Object resp = inventarioService.update(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Inventario actualizado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar los Inventarios: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
/* 
	@DeleteMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteInventario(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = inventarioService.delete(id, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Inventario eliminado con Ã©xito");

		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar los inventarios: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
*/
}
