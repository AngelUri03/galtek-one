package com.galtekone.controller;

import java.util.List;
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

import com.galtekone.entity.ProductosEntity;
import com.galtekone.services.ProductosService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping(path = "productos")
public class ProductosController {

	@Autowired
	DynamicSpecification dynamicSpecification;

	@Autowired
	private ProductosService productosService;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getProductos(@RequestHeader(name = "user", required = true) String user,
			@RequestParam Map<String, String> filters) {

		long startTime = System.currentTimeMillis();

		try {
			Specification<ProductosEntity> specs = dynamicSpecification.buildSpecification(filters, ProductosEntity.class);
			Object resp = productosService.listarProductosActivos();

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Producto obtenido con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener los Productos: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> postProductos(@RequestHeader(name = "user", required = true) String user,
			@RequestBody ProductosEntity entity) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = productosService.create(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Producto creado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al crear los productos: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putProductos(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id,
			@RequestBody ProductosEntity entity) {
		long startTime = System.currentTimeMillis();

		try {
			entity.setIdProducto(id);
			Object resp = productosService.update(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Producto actualizado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar los productos: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@DeleteMapping(path="/{id}",  produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteProductos(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = productosService.delete(id, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Producto eliminado con Ã©xito");

		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar los productos: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
//	@GetMapping("/categoria/{idCategoria}")
//	public ResponseEntity<?> getProductosPorCategoria(@PathVariable Integer idCategoria) {
//	    try {
//	        List<ProductosEntity> productos = productosService.findByCategoria(idCategoria);
//	        if (productos.isEmpty()) {
//	            return ResponseEntity.status(HttpStatus.NOT_FOUND)
//	                    .body("No hay productos en esta categorÃ­a");
//	        }
//	        return ResponseEntity.ok(productos);
//	    } catch (Exception e) {
//	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//	                .body("Error al obtener productos por categorÃ­a: " + e.getMessage());
//	    }
//	}
	@GetMapping(path = "/categoria/{idCategoria}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getProductosPorCategoria(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer idCategoria) {

        long startTime = System.currentTimeMillis();

        try {
            List<ProductosEntity> productos = productosService.findByCategoria(idCategoria);

            if (productos.isEmpty()) {
                return ApiResponseBuilder.buildErrorResponse(
                        user, startTime,
                        "No se encontraron productos en esta categorÃ­a",
                        HttpStatus.NOT_FOUND);
            }

            return ApiResponseBuilder.buildSuccessResponse(
                    productos, user, startTime,
                    "Productos obtenidos por categorÃ­a con Ã©xito");

        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(
                    user, startTime,
                    "Error al obtener productos por categorÃ­a: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


}
