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

import com.galtekone.entity.VentaDetalleEntity;
import com.galtekone.services.VentaDetalleService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;

@RestController
@RequestMapping(path = "ventaDetalle")
public class VentaDetalleController {
	
	@Autowired
	DynamicSpecification dynamicSpecification;
	
	@Autowired
	private VentaDetalleService ventaDetalleService;
	
	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getVentaDetalle(@RequestHeader(name = "user", required = true) String user,
	@RequestParam Map<String, String> filters) {
		
		long startTime = System.currentTimeMillis();
		
		try {
			Specification<VentaDetalleEntity> specs = dynamicSpecification.buildSpecification(filters, VentaDetalleEntity.class);
			Object resp = ventaDetalleService.read(specs);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Detalle de venta obtenido con Ã©xito");
		}catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener los detalle de venta: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> postVentaDetalle(@RequestHeader(name = "user", required = true) String user,
			
			@RequestBody VentaDetalleEntity entity) {
		long startTime = System.currentTimeMillis();
		
		try {
			Object resp = ventaDetalleService.create(entity, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Detalle de venta creado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al crear el detalle de venta: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putVentaDetalle(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id,
			@RequestBody VentaDetalleEntity entity) {
		long startTime = System.currentTimeMillis();
		
		try {
			entity.setIdVentaDetalle(id);
			Object resp = ventaDetalleService.update(entity, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Detalle de venta actualizado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar el detalle de venta: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@DeleteMapping(path="/{id}",  produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteVentaDetalle(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id) {
		long startTime = System.currentTimeMillis();
		
		try {
			Object resp = ventaDetalleService.delete(id, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Detalle de venta eliminado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al eliminar el detalle de venta: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}
