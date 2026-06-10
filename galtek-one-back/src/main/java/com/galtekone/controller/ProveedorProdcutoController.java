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

import com.galtekone.entity.ProveedorProductoEntity;
import com.galtekone.services.ProveedorProductoService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;

@RestController
@RequestMapping(path = "proveedorProducto")
public class ProveedorProdcutoController {

	@Autowired
	DynamicSpecification dynamicSpecification;

	@Autowired
	private ProveedorProductoService proveedorProductoService;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getVentaDetalle(@RequestHeader(name = "user", required = true) String user,
			@RequestParam Map<String, String> filters) {

		long startTime = System.currentTimeMillis();

		try {
			Specification<ProveedorProductoEntity> specs = dynamicSpecification.buildSpecification(filters,
					ProveedorProductoEntity.class);
			Object resp = proveedorProductoService.read(specs);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime,
					"Proveedor de producto obtenido con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener los detalle de proveedor: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}



//	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
//	public ResponseEntity<Object> postVentaDetalle(@RequestHeader(name = "user", required = true) String user,
//			
//			@RequestBody ProveedorProductoEntity entity) {
//		long startTime = System.currentTimeMillis();
//		
//		try {
//			Object resp = proveedorProductoService.create(entity, user);
//			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Proveedor de producto creado con Ã©xito");
//		}catch (Exception e) {
//			return ApiResponseBuilder.buildErrorResponse(user, startTime,
//					"Error al crear proveedor de producto: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
//		}
//	}

	@PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> crear(@RequestHeader("user") String user,
			@RequestHeader("idEmpresa") Integer idEmpresa, @RequestBody ProveedorProductoEntity body) {

		long startTime = System.currentTimeMillis();

		try {
			Object resp = proveedorProductoService.create(body, user, idEmpresa);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime,
					"Proveedor producto creado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al crear proveedor producto: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

//	@PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
//	public ResponseEntity<Object> putProveecorProducto(@RequestHeader(name = "user", required = true) String user,
//			@PathVariable Integer id, @RequestBody ProveedorProductoEntity entity) {
//		long startTime = System.currentTimeMillis();
//		try {
//			entity.setIdProveedorProducto(id);
//			Object resp = proveedorProductoService.update(entity, user);
//			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime,
//					"Proveedor de producto actualizado con Ã©xito");
//
//		} catch (Exception e) {
//			return ApiResponseBuilder.buildErrorResponse(user, startTime,
//					"Error al actualizar el proveedor de producto " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
//			// TODO: handle exception
//		}
//	}
	
    @PutMapping(
            path = "/{id}",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Object> actualizar(
            @RequestHeader("user") String user,
            @RequestHeader("idEmpresa") Integer idEmpresa,
            @PathVariable Integer id,
            @RequestBody ProveedorProductoEntity entity) {

        long startTime = System.currentTimeMillis();

        try {
            entity.setIdProveedorProducto(id);

            Object resp = proveedorProductoService.update(entity, user, idEmpresa);

            return ApiResponseBuilder.buildSuccessResponse(
                    resp,
                    user,
                    startTime,
                    "Proveedor producto actualizado con Ã©xito"
            );
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(
                    user,
                    startTime,
                    "Error al actualizar proveedor producto: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @DeleteMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> deleteProveedorProducto(
            @RequestHeader("user") String user,
            @RequestHeader("idEmpresa") Integer idEmpresa,
            @PathVariable Integer id) {

        long startTime = System.currentTimeMillis();

        try {
            Object resp = proveedorProductoService.delete(id, user, idEmpresa);

            return ApiResponseBuilder.buildSuccessResponse(
                    resp,
                    user,
                    startTime,
                    "Proveedor de producto eliminado con Ã©xito"
            );

        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(
                    user,
                    startTime,
                    "Error al eliminar el proveedor de producto: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }


}
