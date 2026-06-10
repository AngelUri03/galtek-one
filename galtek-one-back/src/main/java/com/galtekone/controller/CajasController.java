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

import com.galtekone.dto.caja.CajasDTO;
import com.galtekone.entity.CajasEntity;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.services.CajasService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping(path = "cajas")
public class CajasController {

	@Autowired
	DynamicSpecification dynamicSpecification;

	@Autowired
	private CajasService cajasService;

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getCajas(@RequestHeader(name = "user", required = true) String user,
			@RequestParam Map<String, String> filters) {

		long startTime = System.currentTimeMillis();

		try {
			Specification<CajasEntity> specs = dynamicSpecification.buildSpecification(filters, CajasEntity.class);
			Object resp = cajasService.read(specs);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Caja obtenida con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener las cajas: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> postCajas(
			@RequestHeader(name = "user", required = true) String user,
			@RequestBody CajasDTO dto) {
		long startTime = System.currentTimeMillis();

		try {
			CajasEntity entity = new CajasEntity();
			entity.setNombreCaja(dto.getNombre());
			entity.setTipo(dto.getTipo());
			EmpresasEntity empresa = new EmpresasEntity();
			empresa.setIdEmpresa(dto.getIdEmpresa());
			entity.setEmpresa(empresa);

			Object resp = cajasService.create(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Caja creada con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al crear la caja: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putCajas(
			@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id,
			@RequestBody CajasDTO dto) {

		long startTime = System.currentTimeMillis();

		try {
			CajasEntity entity = new CajasEntity();

			entity.setIdCaja(id);
			entity.setNombreCaja(dto.getNombre());
			entity.setTipo(dto.getTipo());

			if (dto.getIdEmpresa() != null) {
				EmpresasEntity tipo = new EmpresasEntity();
				tipo.setIdEmpresa(dto.getIdEmpresa());
				entity.setEmpresa(tipo);
			}

			Object resp = cajasService.update(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime,
					"Datos de caja actualizados con Ã©xito");

		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar los datos de la caja: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@DeleteMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteCajas(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = cajasService.delete(id, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Caja eliminada con Ã©xito");

		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar las cajas: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

}
