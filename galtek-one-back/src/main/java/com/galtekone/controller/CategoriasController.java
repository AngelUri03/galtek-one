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

import com.galtekone.entity.CategoriasEntity;
import com.galtekone.services.CategoriasService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping(path = "categorias")
public class CategoriasController {

	@Autowired
	DynamicSpecification dynamicSpecification;

	@Autowired
	private CategoriasService categoriasService;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getCategorias(@RequestHeader(name = "user", required = true) String user,
			@RequestParam Map<String, String> filters) {

		long startTime = System.currentTimeMillis();

		try {
			Specification<CategoriasEntity> specs = dynamicSpecification.buildSpecification(filters, CategoriasEntity.class);
			Object resp = categoriasService.read(specs);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Categoria obtenida con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener las Categorias: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@GetMapping()
	public ResponseEntity<Object> getCategoriasActivas(
	        @RequestHeader("user") String user,
	        @RequestHeader("idEmpresa") Integer idEmpresa) {

	    long startTime = System.currentTimeMillis();

	    Object resp = categoriasService.listarCategoriasActivas(idEmpresa);

	    return ApiResponseBuilder.buildSuccessResponse(
	            resp, user, startTime, "CategorÃ­as activas obtenidas con Ã©xito"
	    );
	}

//	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
//	public ResponseEntity<Object> postCategorias(@RequestHeader(name = "user", required = true) String user,
//			@RequestBody CategoriasEntity entity) {
//		long startTime = System.currentTimeMillis();
//
//		try {
//			Object resp = categoriasService.create(entity, user);
//
//			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Categoria creada con Ã©xito");
//		} catch (Exception e) {
//			return ApiResponseBuilder.buildErrorResponse(user, startTime,
//					"Error al crear las categorias: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
//		}
//	}
	
	@PostMapping(
	        produces = MediaType.APPLICATION_JSON_VALUE,
	        consumes = MediaType.APPLICATION_JSON_VALUE
	)
	public ResponseEntity<Object> postCategorias(
	        @RequestHeader(name = "user", required = true) String user,
	        @RequestHeader(name = "idEmpresa", required = true) Integer idEmpresa,
	        @RequestBody CategoriasEntity entity) {

	    long startTime = System.currentTimeMillis();

	    try {
	        Object resp = categoriasService.create(entity, user, idEmpresa);

	        return ApiResponseBuilder.buildSuccessResponse(
	                resp,
	                user,
	                startTime,
	                "Categoria creada con Ã©xito"
	        );

	    } catch (IllegalArgumentException e) {
	        return ApiResponseBuilder.buildErrorResponse(
	                user,
	                startTime,
	                e.getMessage(),
	                HttpStatus.BAD_REQUEST
	        );

	    } catch (Exception e) {
	        return ApiResponseBuilder.buildErrorResponse(
	                user,
	                startTime,
	                "Error al crear la categoria: " + e.getMessage(),
	                HttpStatus.INTERNAL_SERVER_ERROR
	        );
	    }
	}

	
//	@PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
//	public ResponseEntity<Object> putAlmacen(@RequestHeader(name = "user", required = true) String user,
//	                                         @PathVariable Integer id,
//	                                         @RequestBody CategoriasEntity entity) {
//	    long startTime = System.currentTimeMillis();
//
//	    try {
//	        entity.setIdCategoria(id);
//	        Object resp = categoriasService.update(entity, user);
//
//	        return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Categoria actualizada con Ã©xito");
//	    } catch (Exception e) {
//	        return ApiResponseBuilder.buildErrorResponse(user, startTime,
//	                "Error al actualizar el almacen: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
//	    }
//	}
	
	@PutMapping(
	        path = "/{id}",
	        produces = MediaType.APPLICATION_JSON_VALUE,
	        consumes = MediaType.APPLICATION_JSON_VALUE
	)
	public ResponseEntity<Object> putCategoria(
	        @RequestHeader(name = "user", required = true) String user,
	        @RequestHeader(name = "idEmpresa", required = true) Integer idEmpresa,
	        @PathVariable Integer id,
	        @RequestBody CategoriasEntity entity) {

	    long startTime = System.currentTimeMillis();

	    try {
	        entity.setIdCategoria(id);

	        Object resp = categoriasService.update(entity, user, idEmpresa);

	        return ApiResponseBuilder.buildSuccessResponse(
	                resp,
	                user,
	                startTime,
	                "Categoria actualizada con Ã©xito"
	        );

	    } catch (IllegalArgumentException e) {
	        return ApiResponseBuilder.buildErrorResponse(
	                user,
	                startTime,
	                e.getMessage(),
	                HttpStatus.BAD_REQUEST
	        );

	    } catch (Exception e) {
	        return ApiResponseBuilder.buildErrorResponse(
	                user,
	                startTime,
	                "Error al actualizar la categoria: " + e.getMessage(),
	                HttpStatus.INTERNAL_SERVER_ERROR
	        );
	    }
	}
	
//	@DeleteMapping(path="/{id}",  produces = MediaType.APPLICATION_JSON_VALUE)
//	public ResponseEntity<Object> deleteCategorias(@RequestHeader(name = "user", required = true) String user,
//			@PathVariable Integer id) {
//		long startTime = System.currentTimeMillis();
//
//		try {
//			Object resp = categoriasService.delete(id, user);
//
//			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Categoria eliminada con Ã©xito");
//
//		} catch (Exception e) {
//			return ApiResponseBuilder.buildErrorResponse(user, startTime,
//					"Error al actualizar las categorias: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
//		}
//	}
	
	@DeleteMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteCategoria(
	        @RequestHeader(name = "user", required = true) String user,
	        @RequestHeader(name = "idEmpresa", required = true) Integer idEmpresa,
	        @PathVariable Integer id) {

	    long startTime = System.currentTimeMillis();

	    try {
	        Object resp = categoriasService.delete(id, user, idEmpresa);

	        return ApiResponseBuilder.buildSuccessResponse(
	                resp,
	                user,
	                startTime,
	                "Categoria eliminada con Ã©xito"
	        );

	    } catch (IllegalArgumentException e) {
	        return ApiResponseBuilder.buildErrorResponse(
	                user,
	                startTime,
	                e.getMessage(),
	                HttpStatus.BAD_REQUEST
	        );

	    } catch (Exception e) {
	        return ApiResponseBuilder.buildErrorResponse(
	                user,
	                startTime,
	                "Error al eliminar la categoria: " + e.getMessage(),
	                HttpStatus.INTERNAL_SERVER_ERROR
	        );
	    }
	}


}
