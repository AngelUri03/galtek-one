package com.galtekone.controller;

import java.util.Map;

import com.galtekone.dto.venta.CreateVentaRequest;
import com.galtekone.dto.venta.TicketVentaResponse;
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

import com.galtekone.entity.VentasEntity;
import com.galtekone.services.VentasService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.CajaOperacionException;
import com.galtekone.utils.DynamicSpecification;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping(path = "ventas")
public class VentasController {

	@Autowired
	DynamicSpecification dynamicSpecification;

	@Autowired
	private VentasService ventasService;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getVentas(@RequestHeader(name = "user", required = true) String user,
			@RequestParam Map<String, String> filters) {

		long startTime = System.currentTimeMillis();

		try {
			Specification<VentasEntity> specs = dynamicSpecification.buildSpecification(filters, VentasEntity.class);
			Object resp = ventasService.read(specs);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Venta obtenido con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener los ventas: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> postVentas(@RequestHeader(name = "user", required = true) String user,
			@RequestBody VentasEntity entity) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = ventasService.create(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Venta creada con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al crear las ventas: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

    @PostMapping(
            value = "/crear",
            produces = MediaType.APPLICATION_JSON_VALUE,
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Object> crearVenta(
            @RequestHeader(name = "user") String user,
            @RequestBody CreateVentaRequest request
    ) {
        long startTime = System.currentTimeMillis();

        try {
            TicketVentaResponse resp = ventasService.generarVenta(request, user);

            return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime,
                    "Venta creada correctamente");
        } catch (CajaOperacionException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    e.getCode() + ": " + e.getMessage(),
                    e.getStatus());
        } catch (IllegalArgumentException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    e.getMessage(),
                    HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al crear la venta: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @PutMapping(path="/{id}",produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putVentas(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id,
			@RequestBody VentasEntity entity) {
		long startTime = System.currentTimeMillis();

		try {
			entity.setIdVenta(id);
			Object resp = ventasService.update(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Venta actualizada con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar las ventas: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
	
	@DeleteMapping(path="/{id}",  produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteVentas(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = ventasService.delete(id, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Venta eliminada con Ã©xito");

		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar las ventas: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

}
