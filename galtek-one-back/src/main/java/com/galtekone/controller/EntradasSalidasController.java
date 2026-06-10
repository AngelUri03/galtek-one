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

import com.galtekone.entity.EntradasSalidasEntity;
import com.galtekone.services.EntradasSalidasService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;

@RestController
@RequestMapping(path = "entradasSalidas")
public class EntradasSalidasController {
	
	@Autowired
	DynamicSpecification dynamicSpecification;
	
	@Autowired
	private EntradasSalidasService entradasSalidasService;
	
	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getEntradasSalidas(@RequestHeader(name = "user", required = true) String user,
			@RequestParam Map<String, String> filters){
		
		long startTime = System.currentTimeMillis();
		
		try {
			Specification<EntradasSalidasEntity> specs = dynamicSpecification.buildSpecification(filters, EntradasSalidasEntity.class);
			Object resp = entradasSalidasService.read(specs);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Entradas y Salidas obtenidascon exito");
		} catch (Exception e) {
			// TODO: handle exception
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener Entradas y Salidas: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> postEntradasSalidas(@RequestHeader(name = "user", required = true) String user,
			@RequestBody EntradasSalidasEntity entity){
		long startTime = System.currentTimeMillis();
		try {
			Object resp = entradasSalidasService.create(entity, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Entrada o Salida creada con exito");
			
		} catch (Exception e) {
			// TODO: handle exception
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al crear Entrada o Salida: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@PutMapping(path="/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putEntradasSalidas(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id,
			@RequestBody EntradasSalidasEntity entity){
		long startTime = System.currentTimeMillis();
		try {
			entity.setIdRegistro(id);
			Object resp = entradasSalidasService.update(entity, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Entrada o Salida actualizada con exito");
			
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar Entrada o Salida: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	
	}
	
	@DeleteMapping(path="/{id}",  produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteEntradasSalidas(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id){
		long startTime = System.currentTimeMillis();
		try {
			Object resp = entradasSalidasService.delete(id, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Entrada o Salida eliminada con exito");
			
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al eliminar Entrada o Salida: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	
	}
}
