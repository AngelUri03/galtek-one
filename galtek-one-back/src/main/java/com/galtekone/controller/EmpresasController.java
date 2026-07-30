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

import com.galtekone.dto.empresa.EmpresasDTO;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.entity.TipoSuscripcionEntity;
import com.galtekone.services.EmpresasService;
import com.galtekone.utils.ApiResponseBuilder;
import com.galtekone.utils.DynamicSpecification;
import jakarta.persistence.EntityNotFoundException;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping(path = "empresas")
public class EmpresasController {

	@Autowired
	DynamicSpecification dynamicSpecification;

	@Autowired
	private EmpresasService empresasService;

	@GetMapping(path = "/actual", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getEmpresaActual(@RequestHeader(name = "user", required = true) String user) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = empresasService.readActual();
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Empresa actual obtenida con exito");
		} catch (Exception e) {
			return handleError(user, startTime, "Error al obtener la empresa actual: " + e.getMessage(), e);
		}
	}

	@PutMapping(path = "/actual", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putEmpresaActual(
			@RequestHeader(name = "user", required = true) String user,
			@RequestBody EmpresasDTO dto) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = empresasService.updateActual(dto, user);
			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Tienda actualizada con exito");
		} catch (Exception e) {
			return handleError(user, startTime, "Error al actualizar la tienda: " + e.getMessage(), e);
		}
	}

	@GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getEmpresas(@RequestHeader(name = "user", required = true) String user,
			@RequestParam Map<String, String> filters) {

		long startTime = System.currentTimeMillis();

		try {
			Specification<EmpresasEntity> specs = dynamicSpecification.buildSpecification(filters,
					EmpresasEntity.class);
			Object resp = empresasService.read(specs);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Empresa obtenida con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al obtener las empresa: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PostMapping(produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> postEmpresas(
			@RequestHeader(name = "user", required = true) String user,
			@RequestBody EmpresasDTO dto) {
		long startTime = System.currentTimeMillis();

		try {
			EmpresasEntity entity = new EmpresasEntity();
			entity.setNombreEmpresa(dto.getNombre());
			entity.setRazonSocial(dto.getRazonSocial());
			entity.setRfc(dto.getRfc());
			entity.setDireccion(dto.getDireccion());
			entity.setDireccionCalle(dto.getDireccionCalle());
			entity.setDireccionNumeroExterior(dto.getDireccionNumeroExterior());
			entity.setDireccionNumeroInterior(dto.getDireccionNumeroInterior());
			entity.setDireccionColonia(dto.getDireccionColonia());
			entity.setDireccionMunicipio(dto.getDireccionMunicipio());
			entity.setDireccionEstado(dto.getDireccionEstado());
			entity.setDireccionCodigoPostal(dto.getDireccionCodigoPostal());
			entity.setDireccionReferencia(dto.getDireccionReferencia());
			entity.setTelefono(dto.getTelefono());
			entity.setWhatsapp(dto.getWhatsapp());
			entity.setCorreo(dto.getCorreo());
			entity.setHorarioOperacion(dto.getHorarioOperacion());
			entity.setHorarioConfig(dto.getHorarioConfig());
			entity.setHorarioLunesViernesApertura(dto.getHorarioLunesViernesApertura());
			entity.setHorarioLunesViernesCierre(dto.getHorarioLunesViernesCierre());
			entity.setHorarioSabadoDomingoApertura(dto.getHorarioSabadoDomingoApertura());
			entity.setHorarioSabadoDomingoCierre(dto.getHorarioSabadoDomingoCierre());
			entity.setHorarioSabadoDomingoCerrado(dto.getHorarioSabadoDomingoCerrado());
			entity.setHorarioNotas(dto.getHorarioNotas());
			entity.setMoneda(dto.getMoneda());
			entity.setZonaHoraria(dto.getZonaHoraria());
			entity.setTicketMensaje(dto.getTicketMensaje());
			entity.setLogoNombre(dto.getLogoNombre());
			entity.setLogoMimeType(dto.getLogoMimeType());
			entity.setLogoBase64(dto.getLogoBase64());
			entity.setFechaInicio(dto.getFechaInicio());
			entity.setFechaFin(dto.getFechaFin());
			entity.setTokenLicencia(dto.getTokenLicencia());

			TipoSuscripcionEntity tipo = new TipoSuscripcionEntity();
			tipo.setIdTipoSuscripcion(dto.getIdTipoSuscripcion());
			entity.setTipoSuscripcion(tipo);

			Object resp = empresasService.create(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Empresa creada con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al crear la empresa: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@PutMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> putEmpresas(
			@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id,
			@RequestBody EmpresasDTO dto) {

		long startTime = System.currentTimeMillis();

		try {
			EmpresasEntity entity = new EmpresasEntity();
			entity.setIdEmpresa(id);
			entity.setNombreEmpresa(dto.getNombre());
			entity.setRazonSocial(dto.getRazonSocial());
			entity.setRfc(dto.getRfc());
			entity.setDireccion(dto.getDireccion());
			entity.setDireccionCalle(dto.getDireccionCalle());
			entity.setDireccionNumeroExterior(dto.getDireccionNumeroExterior());
			entity.setDireccionNumeroInterior(dto.getDireccionNumeroInterior());
			entity.setDireccionColonia(dto.getDireccionColonia());
			entity.setDireccionMunicipio(dto.getDireccionMunicipio());
			entity.setDireccionEstado(dto.getDireccionEstado());
			entity.setDireccionCodigoPostal(dto.getDireccionCodigoPostal());
			entity.setDireccionReferencia(dto.getDireccionReferencia());
			entity.setTelefono(dto.getTelefono());
			entity.setWhatsapp(dto.getWhatsapp());
			entity.setCorreo(dto.getCorreo());
			entity.setHorarioOperacion(dto.getHorarioOperacion());
			entity.setHorarioConfig(dto.getHorarioConfig());
			entity.setHorarioLunesViernesApertura(dto.getHorarioLunesViernesApertura());
			entity.setHorarioLunesViernesCierre(dto.getHorarioLunesViernesCierre());
			entity.setHorarioSabadoDomingoApertura(dto.getHorarioSabadoDomingoApertura());
			entity.setHorarioSabadoDomingoCierre(dto.getHorarioSabadoDomingoCierre());
			entity.setHorarioSabadoDomingoCerrado(dto.getHorarioSabadoDomingoCerrado());
			entity.setHorarioNotas(dto.getHorarioNotas());
			entity.setMoneda(dto.getMoneda());
			entity.setZonaHoraria(dto.getZonaHoraria());
			entity.setTicketMensaje(dto.getTicketMensaje());
			entity.setLogoNombre(dto.getLogoNombre());
			entity.setLogoMimeType(dto.getLogoMimeType());
			entity.setLogoBase64(dto.getLogoBase64());
			entity.setFechaInicio(dto.getFechaInicio());
			entity.setFechaFin(dto.getFechaFin());
			entity.setTokenLicencia(dto.getTokenLicencia());

			if (dto.getIdTipoSuscripcion() != null) {
				TipoSuscripcionEntity tipo = new TipoSuscripcionEntity();
				tipo.setIdTipoSuscripcion(dto.getIdTipoSuscripcion());
				entity.setTipoSuscripcion(tipo);
			}

			Object resp = empresasService.update(entity, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Empresa actualizada con Ã©xito");

		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar las empresas: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@DeleteMapping(path = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> deleteEmpresas(@RequestHeader(name = "user", required = true) String user,
			@PathVariable Integer id) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = empresasService.delete(id, user);

			return ApiResponseBuilder.buildSuccessResponse(resp, user, startTime, "Empresa eliminada con Ã©xito");

		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime,
					"Error al actualizar las empresas: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	private ResponseEntity<Object> handleError(String user, long startTime, String message, Exception e) {
		if (e instanceof IllegalArgumentException) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.BAD_REQUEST);
		}
		if (e instanceof EntityNotFoundException) {
			return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.NOT_FOUND);
		}
		return ApiResponseBuilder.buildErrorResponse(user, startTime, message, HttpStatus.INTERNAL_SERVER_ERROR);
	}

}
