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

import com.galtekone.dto.compra.CompraDetalleDTO;
import com.galtekone.entity.CompraDetalleEntity;
import com.galtekone.entity.ComprasEntity;
import com.galtekone.entity.ProductosEntity;
import com.galtekone.services.CompraDetalleService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping(path = "compraDetalle")
public class CompraDetalleController {

	@Autowired
	DynamicSpecification dynamicSpecification;

	@Autowired
	private CompraDetalleService compraDetalleService;

//	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
//	public ResponseEntity<Object> getCompraDetalle(@RequestHeader(name = "user", required = true) String user,
//			@RequestParam Map<String, String> filters) {
//
//		long startTime = System.currentTimeMillis();
//
//		try {
//			Specification<CompraDetalleEntity> specs = dynamicSpecification.buildSpecification(filters, CompraDetalleEntity.class);
//			Object resp = compraDetalleService.read(specs);
//
//			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Detalle de la compra obtenido con Ã©xito");
//		} catch (Exception e) {
//			return ApiResponseBuilder.buildErrorResponse(user, startTime,
//					"Error al obtener el detalle de la compra: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
//		}
//	}
	
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getCompraDetalle(@RequestHeader(name = "user", required = true) String user,
            @RequestParam Map<String, String> filters) {

        long startTime = System.currentTimeMillis();

        try {
            Specification<CompraDetalleEntity> specs = dynamicSpecification.buildSpecification(filters, CompraDetalleEntity.class);
            Object resp = compraDetalleService.read(specs);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Detalle de la compra obtenido con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al obtener el detalle de la compra: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

//	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
//	public ResponseEntity<Object> postRoles(@RequestHeader(name = "user", required = true) String user,
//			@RequestBody CompraDetalleEntity entity) {
//		long startTime = System.currentTimeMillis();
//
//		try {
//			Object resp = compraDetalleService.create(entity, user);
//
//			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Detalle de la compra creada con Ã©xito");
//		} catch (Exception e) {
//			return ApiResponseBuilder.buildErrorResponse(user, startTime,
//					"Error al crear los detalles de la compras: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
//		}
//	}
    
    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> postCompraDetalle(@RequestHeader(name = "user", required = true) String user,
            @RequestBody CompraDetalleDTO dto) {
        long startTime = System.currentTimeMillis();

        try {
            CompraDetalleEntity entity = new CompraDetalleEntity();
            ComprasEntity compra = new ComprasEntity();
            compra.setIdCompra(dto.getIdCompra());
            entity.setCompra(compra);
            
            ProductosEntity producto = new ProductosEntity();
            producto.setIdProducto(dto.getIdProducto());
            entity.setProducto(producto);

            entity.setCantidad(dto.getCantidad());
            entity.setPrecioUnitario(dto.getPrecioUnitario());
            entity.setSubtotal(dto.getSubtotal());

            Object resp = compraDetalleService.create(entity, user);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Detalle de la compra creado con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al crear el detalle de la compra: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
	
//	@PutMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
//	public ResponseEntity<Object> putRoles(@RequestHeader(name = "user", required = true) String user,
//			@RequestBody CompraDetalleEntity entity) {
//		long startTime = System.currentTimeMillis();
//
//		try {
//			Object resp = compraDetalleService.update(entity, user);
//
//			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Detalle de la compra actualizado con Ã©xito");
//		} catch (Exception e) {
//			return ApiResponseBuilder.buildErrorResponse(user, startTime,
//					"Error al actualizar los detalles de la compra: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
//		}
//	}
    
    @PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> putCompraDetalle(@RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id,
            @RequestBody CompraDetalleDTO dto) {
        long startTime = System.currentTimeMillis();

        try {
            CompraDetalleEntity entity = new CompraDetalleEntity();
            entity.setIdCompraDetalle(id);

            if (dto.getIdCompra() != null) {
                ComprasEntity compra = new ComprasEntity();
                compra.setIdCompra(dto.getIdCompra());
                entity.setCompra(compra);
            }

            if (dto.getIdProducto() != null) {
                ProductosEntity producto = new ProductosEntity();
                producto.setIdProducto(dto.getIdProducto());
                entity.setProducto(producto);
            }

            entity.setCantidad(dto.getCantidad());
            entity.setPrecioUnitario(dto.getPrecioUnitario());
            entity.setSubtotal(dto.getSubtotal());

            Object resp = compraDetalleService.update(entity, user);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Detalle de la compra actualizado con Ã©xito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al actualizar el detalle de la compra: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
	
//	@DeleteMapping(path="/{id}",  produces = MediaType.APPLICATION_JSON_VALUE)
//	public ResponseEntity<Object> deleteCompraDetalle(@RequestHeader(name = "user", required = true) String user,
//			@PathVariable Long id) {
//		long startTime = System.currentTimeMillis();
//
//		try {
//			Object resp = compraDetalleService.delete(id, user);
//
//			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Detalle de la compra eliminado con Ã©xito");
//
//		} catch (Exception e) {
//			return ApiResponseBuilder.buildErrorResponse(user, startTime,
//					"Error al actualizar los detalles de la compra: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
//		}
//	}
    
    @DeleteMapping(path="/{id}",  produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> deleteCompraDetalle(@RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer id) {
        long startTime = System.currentTimeMillis();

        try {
            Object resp = compraDetalleService.delete(id, user);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Detalle de la compra eliminado con Ã©xito");

        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al eliminar el detalle de la compra: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}