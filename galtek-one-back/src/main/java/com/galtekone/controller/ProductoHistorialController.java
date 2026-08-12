package com.galtekone.controller;

import java.util.List;
import java.util.stream.Collectors;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.galtekone.dto.productoHistorial.ProductoHistorialRequestDTO;
import com.galtekone.dto.productoHistorial.ProductoHistorialResponseDTO;
import com.galtekone.entity.ProductoHistorialEntity;
import com.galtekone.entity.ProductosEntity;
import com.galtekone.services.ProductoHistorialService;

@RestController
@RequestMapping("/api/v1/historial-productos")
public class ProductoHistorialController {

    @Autowired
    private ProductoHistorialService productoHistorialService;

    /**
     * Registra un nuevo evento en el historial del producto.
     * Es la única operación de escritura permitida (Append-Only).
     */
    @PostMapping
    public ResponseEntity<ProductoHistorialResponseDTO> registrarEvento(
            @Valid @RequestBody ProductoHistorialRequestDTO requestDTO) {
        
        // Mapeo manual de DTO a Entidad (puedes usar MapStruct si prefieres)
        ProductoHistorialEntity entidadNueva = new ProductoHistorialEntity();
        
        ProductosEntity productoRef = new ProductosEntity();
        productoRef.setIdProducto(requestDTO.getIdProducto());
        
        entidadNueva.setProducto(productoRef);
        entidadNueva.setTipoEvento(requestDTO.getTipoEvento());
        // entidadNueva.setDescripcion(requestDTO.getDescripcion()); // Descomentar si existe en tu entidad

        // Guardamos usando el servicio
        ProductoHistorialEntity entidadGuardada = productoHistorialService.registrarEvento(entidadNueva);

        // Retornamos el DTO de respuesta
        return new ResponseEntity<>(mapToResponseDTO(entidadGuardada), HttpStatus.CREATED);
    }

    /**
     * Obtiene todo el historial de un producto específico.
     */
    @GetMapping("/producto/{idProducto}")
    public ResponseEntity<List<ProductoHistorialResponseDTO>> obtenerHistorialPorProducto(
            @PathVariable Integer idProducto) {
        
        List<ProductoHistorialEntity> historial = productoHistorialService.obtenerHistorialProducto(idProducto);
        
        List<ProductoHistorialResponseDTO> response = historial.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(response);
    }

    /**
     * Obtiene el historial filtrado por un tipo de evento (ej. "CAMBIO_PRECIO", "ENTRADA_STOCK").
     */
    @GetMapping("/evento/{tipoEvento}")
    public ResponseEntity<List<ProductoHistorialResponseDTO>> obtenerHistorialPorTipoEvento(
            @PathVariable String tipoEvento) {
        
        List<ProductoHistorialEntity> historial = productoHistorialService.obtenerPorTipoEvento(tipoEvento);
        
        List<ProductoHistorialResponseDTO> response = historial.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(response);
    }

    /* =========================================================================
     *  MÉTODOS PRIVADOS DE MAPEO (Entity -> DTO)
     * ========================================================================= */
     
    private ProductoHistorialResponseDTO mapToResponseDTO(ProductoHistorialEntity entity) {
        ProductoHistorialResponseDTO dto = new ProductoHistorialResponseDTO();
        
        // Asume que tu entidad tiene un getId() o getIdHistorial()
        // dto.setIdHistorial(entity.getIdHistorial()); 
        
        if (entity.getProducto() != null) {
            dto.setIdProducto(entity.getProducto().getIdProducto());
        }
        
        dto.setTipoEvento(entity.getTipoEvento());
        // dto.setDescripcion(entity.getDescripcion()); // Ajustar según tu entidad
        dto.setFechaEvento(entity.getFechaEvento());
        
        return dto;
    }
}