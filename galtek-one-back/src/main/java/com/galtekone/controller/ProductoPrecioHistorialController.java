package com.galtekone.controller;

import java.util.List;
import java.util.stream.Collectors;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.galtekone.dto.productoPrecioHistorial.ProductoPrecioHistorialRequestDTO;
import com.galtekone.dto.productoPrecioHistorial.ProductoPrecioHistorialResponseDTO;
import com.galtekone.entity.ProductoPrecioHistorialEntity;
import com.galtekone.entity.ProductosEntity;
import com.galtekone.services.ProductoPrecioHistorialService;
import com.galtekone.utils.ApiResponseBuilder;

@RestController
@RequestMapping("/api/v1/historial-precios")
public class ProductoPrecioHistorialController {

    @Autowired
    private ProductoPrecioHistorialService productoPrecioHistorialService;

    /**
     * Registra un nuevo cambio de precio.
     * Operación Append-Only (Solo inserción).
     */
    @PostMapping
    public ResponseEntity<Object> registrarCambioPrecio(
            @RequestHeader(name = "user", required = true) String user,
            @Valid @RequestBody ProductoPrecioHistorialRequestDTO requestDTO) {
        
        long startTime = System.currentTimeMillis();
        
        try {
            // 1. Mapear de DTO a Entidad
            ProductoPrecioHistorialEntity entidadNueva = new ProductoPrecioHistorialEntity();
            
            ProductosEntity productoRef = new ProductosEntity();
            productoRef.setIdProducto(requestDTO.getIdProducto());
            
            entidadNueva.setProducto(productoRef);
            entidadNueva.setPrecioNuevo(requestDTO.getPrecioNuevo());
            entidadNueva.setPrecioAnterior(requestDTO.getPrecioAnterior());
            
            // Si tu entidad tiene el campo motivo, descomenta la siguiente línea:
            // entidadNueva.setMotivo(requestDTO.getMotivo());

            // 2. Guardar en BD usando tu Service
            ProductoPrecioHistorialEntity entidadGuardada = productoPrecioHistorialService.registrarCambioPrecio(entidadNueva);

            // 3. Mapear de Entidad a DTO Response
            ProductoPrecioHistorialResponseDTO responseDTO = mapToResponseDTO(entidadGuardada);

            return ApiResponseBuilder.buildSuccessResponse(
                    responseDTO, user, startTime, "Cambio de precio registrado con éxito");
                    
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al registrar historial de precios: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Obtiene el historial completo de precios de un producto específico.
     */
    @GetMapping("/producto/{idProducto}")
    public ResponseEntity<Object> obtenerHistorialPorProducto(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer idProducto) {
        
        long startTime = System.currentTimeMillis();
        
        try {
            // El servicio ya valida que el producto pertenezca a la empresa en sesión
            List<ProductoPrecioHistorialEntity> historial = productoPrecioHistorialService.obtenerHistorialPrecios(idProducto);
            
            // Mapear la lista de entidades a una lista de DTOs
            List<ProductoPrecioHistorialResponseDTO> responseList = historial.stream()
                    .map(this::mapToResponseDTO)
                    .collect(Collectors.toList());
                    
            return ApiResponseBuilder.buildSuccessResponse(
                    responseList, user, startTime, "Historial de precios obtenido con éxito");
                    
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al obtener historial de precios: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /* =========================================================================
     *  MÉTODO PRIVADO DE MAPEO (Entity -> DTO)
     * ========================================================================= */
     
    private ProductoPrecioHistorialResponseDTO mapToResponseDTO(ProductoPrecioHistorialEntity entity) {
        ProductoPrecioHistorialResponseDTO dto = new ProductoPrecioHistorialResponseDTO();
        
        // Ajusta "getIdHistorial()" al nombre real del getter de tu Primary Key
        // dto.setIdHistorial(entity.getIdHistorial()); 
        
        if (entity.getProducto() != null) {
            dto.setIdProducto(entity.getProducto().getIdProducto());
        }
        
        dto.setPrecioAnterior(entity.getPrecioAnterior());
        dto.setPrecioNuevo(entity.getPrecioNuevo());
        dto.setFechaEvento(entity.getFechaEvento());
        
        // Si tu entidad tiene el campo motivo:
        // dto.setMotivo(entity.getMotivo());
        
        return dto;
    }
}