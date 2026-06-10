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

import com.galtekone.dto.cliente.ClienteConPedidosDTO;
//import com.one.shop.entity.AlmacenEntity;
import com.galtekone.entity.ClientesEntity;
//import com.one.shop.entity.ProductosEntity;
import com.galtekone.services.ClientesService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;

import jakarta.persistence.EntityNotFoundException;

@RestController
@RequestMapping(path = "clientes")
public class ClientesController {

	@Autowired
	DynamicSpecification dynamicSpecification;
	
	@Autowired
	private ClientesService clientesService;
	
	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getClientes(@RequestHeader(name = "user", required = true) String user,
			@RequestParam Map<String, String> filters) {

		long startTime = System.currentTimeMillis();

		try {
			Specification<ClientesEntity> specs = dynamicSpecification.buildSpecification(filters, ClientesEntity.class);
			Object resp = clientesService.read(specs);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Clientes obtenido con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener los Clientes: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> postClientes(@RequestHeader(name = "user", required = true) String user,
			@RequestBody ClientesEntity entity) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = clientesService.create(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Cliente creado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al crear el Cliente: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putClientes(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id,
			@RequestBody ClientesEntity entity) {
		long startTime = System.currentTimeMillis();

		try {
			entity.setIdCliente(id);
			Object resp = clientesService.update(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Cliente actualizado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar el cliente: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@DeleteMapping(path="/{id}",  produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteClientes(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = clientesService.delete(id, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Cliente eliminado con Ã©xito");

		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar el cliente: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@GetMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getClienteById(
	        @RequestHeader(name = "user", required = true) String user,
	        @PathVariable Integer id) {

	    long startTime = System.currentTimeMillis();

	    try {
	        ClienteConPedidosDTO resp = clientesService.readById(id);
	        return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Cliente obtenido con Ã©xito");

	    } catch (EntityNotFoundException e) {
	        return ApiResponseBuilder.buildErrorResponse(
	                user, startTime, e.getMessage(), HttpStatus.NOT_FOUND);

	    } catch (Exception e) {
	        return ApiResponseBuilder.buildErrorResponse(
	                user, startTime, "Error al obtener el cliente: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
	    }
	}

}
