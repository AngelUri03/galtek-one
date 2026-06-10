package com.galtekone.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.galtekone.crypto.RsaCryptoService;
import com.galtekone.dto.login.LoginRequestDTO;
import com.galtekone.security.LoginAttemptService;
import com.galtekone.services.AuthService;
import com.galtekone.utils.ApiResponseBuilder;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping(path = "auth")
public class AuthController {

	@Autowired
	private AuthService authService;

	@Autowired
	private RsaCryptoService rsaCryptoService;

	@Autowired
	private LoginAttemptService loginAttemptService;

	@PostMapping(value = "/login", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> login(@RequestBody LoginRequestDTO req, HttpServletRequest request) {
		long startTime = System.currentTimeMillis();
		String remoteAddress = request.getRemoteAddr();
		String username = req != null ? req.getUsuario() : null;

		try {
			if (req == null || req.getUsuario() == null || req.getPassword() == null) {
				return ApiResponseBuilder.buildErrorResponse("User", startTime,
						"Faltan credenciales", HttpStatus.BAD_REQUEST);
			}

			loginAttemptService.assertAllowed(username, remoteAddress);
			Object resp = authService.login(req);
			loginAttemptService.recordSuccess(username, remoteAddress);
			return ApiResponseBuilder.buildSuccessResponse(resp, "User", startTime, "Logueado correctamente");
		} catch (AuthenticationException e) {
			loginAttemptService.recordFailure(username, remoteAddress);
			return ApiResponseBuilder.buildErrorResponse("User", startTime, "Credenciales invalidas",
					HttpStatus.UNAUTHORIZED);
		} catch (IllegalStateException e) {
			return ApiResponseBuilder.buildErrorResponse("User", startTime, e.getMessage(), HttpStatus.TOO_MANY_REQUESTS);
		} catch (Exception e) {
			loginAttemptService.recordFailure(username, remoteAddress);
			return ApiResponseBuilder.buildErrorResponse("User", startTime, "Credenciales invalidas",
					HttpStatus.UNAUTHORIZED);
		}
	}

	@PostMapping(value = "/logout")
	public ResponseEntity<Void> logout(@RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
		authService.logout(authHeader);
		return ResponseEntity.noContent().build();
	}

	@PostMapping(value = "/encrypt", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> postSimpleEncrypt(@RequestBody String text) {
		long startTime = System.currentTimeMillis();

		try {
			Object resp = rsaCryptoService.encryptBase64(text);

			return ApiResponseBuilder.buildSuccessResponse(resp, "Generic-Test", startTime, "Usuario creado con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse("Generic-Test", startTime,
					"Error al crear el almacen: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@GetMapping(value = "/keys/public", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<Object> getPublicKeyPem() {

		long startTime = System.currentTimeMillis();

		try {
			Object resp = rsaCryptoService.getPublicKeyPem();

			return ApiResponseBuilder.buildSuccessResponse(resp, "User", startTime,
					"LLave publica RSA obtenida con Ã©xito");
		} catch (Exception e) {
			return ApiResponseBuilder.buildErrorResponse("User", startTime,
					"Error al obtener el almacen: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

}
