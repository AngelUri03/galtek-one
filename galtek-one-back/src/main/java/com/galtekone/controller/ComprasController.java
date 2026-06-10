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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.galtekone.dto.compra.ComprasDTO;
import com.galtekone.entity.ComprasEntity;
import com.galtekone.entity.ProveedoresEntity;
import com.galtekone.entity.UsuariosEntity;
import com.galtekone.services.ComprasService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping(path = "compras")
public class ComprasController {

	@Autowired
	DynamicSpecification dynamicSpecification;

	@Autowired
	private ComprasService comprasService;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getCompras(@RequestHeader(name = "user", required = true) String user,
			@RequestParam Map<String, String> filters) {

		long startTime = System.currentTimeMillis();

		try {
			Specification<ComprasEntity> specs = dynamicSpecification.buildSpecification(filters, ComprasEntity.class);
			Object resp = comprasService.read(specs);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Compra obtenida con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener los compras: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
		
	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> postCompras(
	    @RequestHeader(name = "user", required = true) String user,
	    @RequestBody ComprasDTO dto
	) {
	    long startTime = System.currentTimeMillis();

	    try {
	        ComprasEntity entity = new ComprasEntity();
	        ProveedoresEntity proveedor = new ProveedoresEntity();
	        proveedor.setIdProveedor(dto.getIdProveedor());
	        entity.setIdProveedor(proveedor);
	        
	        UsuariosEntity usuario = new UsuariosEntity();
	        usuario.setIdUsuario(dto.getIdUsuario());
	        entity.setIdUsuario(usuario);
	        
	        entity.setFechaCompra(dto.getFechaCompra());
	        entity.setTotalCompra(dto.getTotalCompra());
	        entity.setTicketProveedor(dto.getTicketProveedor());

	        Object resp = comprasService.create(entity, user);

	        return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Compra registrada con Ã©xito");
	    } catch (Exception e) {
	        return ApiResponseBuilder.buildErrorResponse(user, startTime,
	            "Error al registrar la compra: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
	    }
	}
	
	
	@PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putCompras(
	        @RequestHeader(name = "user", required = true) String user,
	        @PathVariable Integer id,
	        @RequestBody ComprasDTO dto) {

	    long startTime = System.currentTimeMillis();

	    try {
	        ComprasEntity entity = new ComprasEntity();
	        entity.setIdCompra(id);
	        entity.setTotalCompra(dto.getTotalCompra());
	        entity.setTicketProveedor(dto.getTicketProveedor());
	        entity.setFechaCompra(dto.getFechaCompra());


	        if (dto.getIdProveedor() != null) {
	            ProveedoresEntity proveedor = new ProveedoresEntity();
	            proveedor.setIdProveedor(dto.getIdProveedor());
	            entity.setIdProveedor(proveedor);
	        }
	        
	        if (dto.getIdUsuario() != null) {
	            UsuariosEntity usuario = new UsuariosEntity();
	            usuario.setIdUsuario(dto.getIdUsuario());
	            entity.setIdUsuario(usuario);
	        }

	        Object resp = comprasService.update(entity, user);

	        return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Compra actualizada con Ã©xito");

	    } catch (Exception e) {
	        return ApiResponseBuilder.buildErrorResponse(user, startTime,
	                "Error al actualizar la compra: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
	    }
	}
	
	@DeleteMapping(path="/{id}",  produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteCompras(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = comprasService.delete(id, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Compra eliminada con Ã©xito");

		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar las compras: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

}
