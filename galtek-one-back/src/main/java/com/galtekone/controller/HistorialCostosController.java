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

import com.galtekone.entity.HistorialCostosEntity;
import com.galtekone.services.HistorialCostosService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;

@RestController
@RequestMapping(path = "historialCostos")
public class HistorialCostosController {
	
	@Autowired
	DynamicSpecification dynamicSpecification;
	
	@Autowired
	private HistorialCostosService historialCostosService;
	
	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getHistorialCostos(@RequestHeader(name = "user", required = true) String user,
			@RequestParam Map<String, String> filters){
		
		long startTime = System.currentTimeMillis();
		try {
			Specification<HistorialCostosEntity> specs = dynamicSpecification.buildSpecification(filters, HistorialCostosEntity.class);
			Object resp = historialCostosService.read(specs);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Historial de costos obtenido con exito");
		} catch (Exception e) {
			// TODO: handle exception
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener Historial de Costos: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
		
	}
	
	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> postHistorialCostos(@RequestHeader(name = "user", required = true) String user,
			@RequestBody HistorialCostosEntity entity){
		
		long startTime = System.currentTimeMillis();
		try {
			Object resp = historialCostosService.create(entity, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Historial de costos creado con exito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al crear Historial de Costos: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
			
	}

	@PutMapping(path="/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putHistorialCostos(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id,
			@RequestBody HistorialCostosEntity entity){
		long startTime = System.currentTimeMillis();
		try {
			entity.setIdHistorialCostos(id);
			Object resp = historialCostosService.update(entity, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Historial de costos actualizado con exito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar Historial de Costos: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@DeleteMapping(path="/{id}",  produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteHistorialCostos(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id){
		long startTime = System.currentTimeMillis();
		try {
			Object resp = historialCostosService.delete(id, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Historial de costos eliminado con exito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al eliminar Historial de Costos: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
}
