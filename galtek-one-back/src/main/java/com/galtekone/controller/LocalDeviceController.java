package com.galtekone.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.galtekone.dto.device.RegisterDeviceRequestDTO;
import com.galtekone.services.LocalDeviceIdentityService;
import com.galtekone.utils.ApiResponseBuilder;

@RestController
@RequestMapping("/device")
public class LocalDeviceController {

    @Autowired(required = false)
    private LocalDeviceIdentityService localDeviceIdentityService;

    @GetMapping(value = "/identity", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> getIdentity(jakarta.servlet.http.HttpServletRequest request) {
        long startTime = System.currentTimeMillis();
        try {
            // Validación de IP para mayor seguridad en endpoint público
            String ip = request.getRemoteAddr();
            if (!"127.0.0.1".equals(ip) && !"0:0:0:0:0:0:0:1".equals(ip) && !"localhost".equals(ip)) {
                return ApiResponseBuilder.buildErrorResponse("System", startTime, 
                    "Acceso denegado: Solo peticiones locales permitidas", HttpStatus.FORBIDDEN);
            }

            if (localDeviceIdentityService == null) {
                return ApiResponseBuilder.buildErrorResponse("System", startTime, 
                    "Servicio no disponible en este perfil", HttpStatus.NOT_IMPLEMENTED);
            }
            Object resp = localDeviceIdentityService.getIdentity();
            return ApiResponseBuilder.buildSuccessResponse(resp, "System", startTime, "Identidad obtenida con exito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse("System", startTime, 
                "Error al obtener identidad: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(value = "/register", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    // Asumiendo que el rol se llama ADMIN
    @PreAuthorize("hasAuthority('ADMIN') or hasRole('ADMIN')")
    public ResponseEntity<Object> registerDevice(@RequestHeader(name = "user", required = true) String user,
                                                 @RequestBody RegisterDeviceRequestDTO req) {
        long startTime = System.currentTimeMillis();
        try {
            if (localDeviceIdentityService == null) {
                return ApiResponseBuilder.buildErrorResponse(user, startTime, 
                    "Servicio no disponible en este perfil", HttpStatus.NOT_IMPLEMENTED);
            }
            if (req.getName() == null || req.getName().trim().isEmpty()) {
                return ApiResponseBuilder.buildErrorResponse(user, startTime, 
                    "El nombre de la estacion es requerido", HttpStatus.BAD_REQUEST);
            }
            
            localDeviceIdentityService.registerDevice(req.getName(), user);
            
            return ApiResponseBuilder.buildSuccessResponse(null, user, startTime, "Estacion registrada con exito");
        } catch (IllegalStateException e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime, e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime, 
                "Error al registrar la estacion: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping(value = "/activate", produces = MediaType.APPLICATION_JSON_VALUE, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Object> activateDevice(@RequestBody java.util.Map<String, String> payload) {
        long startTime = System.currentTimeMillis();
        try {
            if (localDeviceIdentityService == null) {
                return ApiResponseBuilder.buildErrorResponse("System", startTime, 
                    "Servicio no disponible en este perfil", HttpStatus.NOT_IMPLEMENTED);
            }
            
            String token = payload.get("token");
            if (token == null || token.isBlank()) {
                return ApiResponseBuilder.buildErrorResponse("System", startTime, 
                    "El token es requerido", HttpStatus.BAD_REQUEST);
            }
            
            localDeviceIdentityService.activateDevice(token);
            return ApiResponseBuilder.buildSuccessResponse(null, "System", startTime, "Dispositivo activado exitosamente");
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ApiResponseBuilder.buildErrorResponse("System", startTime, e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse("System", startTime, 
                "Error al activar: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
