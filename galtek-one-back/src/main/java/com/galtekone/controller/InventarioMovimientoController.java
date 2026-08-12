package com.galtekone.controller;

import java.util.List;
import java.util.stream.Collectors;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.galtekone.dto.inventarioMovimiento.InventarioMovimientoRequestDTO;
import com.galtekone.dto.inventarioMovimiento.InventarioMovimientoResponseDTO;
import com.galtekone.entity.InventarioMovimientoEntity;
import com.galtekone.entity.ProductosEntity;
//import com.galtekone.entity.AlmacenesEntity; 
// Importa la entidad de Lotes si existe: import com.galtekone.entity.LotesEntity;

import com.galtekone.services.InventarioMovimientoService;
import com.galtekone.utils.ApiResponseBuilder;

@RestController
@RequestMapping("/api/v1/inventario-movimientos")
public class InventarioMovimientoController {

    @Autowired
    private InventarioMovimientoService inventarioMovimientoService;

    /**
     * Registra un nuevo movimiento de inventario (Entrada/Salida).
     */
    @PostMapping
    public ResponseEntity<Object> registrarMovimiento(
            @RequestHeader(name = "user", required = true) String user,
            @Valid @RequestBody InventarioMovimientoRequestDTO requestDTO) {
        
        long startTime = System.currentTimeMillis();
        
        try {
            // 1. Instanciar la nueva entidad
            InventarioMovimientoEntity movimientoNuevo = new InventarioMovimientoEntity();
            
            // Mapear Producto
            ProductosEntity producto = new ProductosEntity();
            producto.setIdProducto(requestDTO.getIdProducto());
            movimientoNuevo.setProducto(producto);

            // Mapear Almacén (Asumiendo que tu relación se llama setAlmacen)
            /* 
            AlmacenesEntity almacen = new AlmacenesEntity();
            almacen.setIdAlmacen(requestDTO.getIdAlmacen());
            movimientoNuevo.setAlmacen(almacen);
            */

            // Mapear Lote si viene en el request (Asumiendo que tu relación se llama setLote)
            /*
            if (requestDTO.getIdLote() != null) {
                LotesEntity lote = new LotesEntity();
                lote.setIdLote(requestDTO.getIdLote());
                movimientoNuevo.setLote(lote);
            }
            */

            // Mapear el resto de valores
            // Descomenta y ajusta según los nombres reales de las propiedades en tu Entidad
            /*
            movimientoNuevo.setCantidad(requestDTO.getCantidad());
            movimientoNuevo.setTipoMovimiento(requestDTO.getTipoMovimiento());
            movimientoNuevo.setObservaciones(requestDTO.getObservaciones());
            */

            // 2. Guardar en Base de Datos
            InventarioMovimientoEntity movimientoGuardado = inventarioMovimientoService.registrarMovimiento(movimientoNuevo);

            // 3. Devolver DTO
            InventarioMovimientoResponseDTO responseDTO = mapToResponseDTO(movimientoGuardado);

            return ApiResponseBuilder.buildSuccessResponse(
                    responseDTO, user, startTime, "Movimiento de inventario registrado con éxito");
                    
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al registrar movimiento: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Consulta movimientos por Producto
     */
    @GetMapping("/producto/{idProducto}")
    public ResponseEntity<Object> obtenerPorProducto(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer idProducto) {
        return procesarListado(inventarioMovimientoService.obtenerMovimientosProducto(idProducto), user);
    }

    /**
     * Consulta movimientos por Almacén
     */
    @GetMapping("/almacen/{idAlmacen}")
    public ResponseEntity<Object> obtenerPorAlmacen(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer idAlmacen) {
        return procesarListado(inventarioMovimientoService.obtenerMovimientosAlmacen(idAlmacen), user);
    }

    /**
     * Consulta movimientos por Lote
     */
    @GetMapping("/lote/{idLote}")
    public ResponseEntity<Object> obtenerPorLote(
            @RequestHeader(name = "user", required = true) String user,
            @PathVariable Integer idLote) {
        return procesarListado(inventarioMovimientoService.obtenerMovimientosLote(idLote), user);
    }

    /* =========================================================================
     *  MÉTODOS PRIVADOS DE UTILIDAD
     * ========================================================================= */
     
    private ResponseEntity<Object> procesarListado(List<InventarioMovimientoEntity> movimientos, String user) {
        long startTime = System.currentTimeMillis();
        try {
            List<InventarioMovimientoResponseDTO> responseList = movimientos.stream()
                    .map(this::mapToResponseDTO)
                    .collect(Collectors.toList());
                    
            return ApiResponseBuilder.buildSuccessResponse(
                    responseList, user, startTime, "Movimientos obtenidos con éxito");
        } catch (Exception e) {
            return ApiResponseBuilder.buildErrorResponse(user, startTime,
                    "Error al obtener movimientos: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private InventarioMovimientoResponseDTO mapToResponseDTO(InventarioMovimientoEntity entity) {
        InventarioMovimientoResponseDTO dto = new InventarioMovimientoResponseDTO();
        
        // Ajusta los getters según tu Entidad real
        // dto.setIdMovimiento(entity.getIdMovimiento()); 
        
        if (entity.getProducto() != null) {
            dto.setIdProducto(entity.getProducto().getIdProducto());
        }
        
        // Asumiendo que tu entidad tiene relaciones directas con Lote y Almacen
        /*
        if (entity.getAlmacen() != null) {
            dto.setIdAlmacen(entity.getAlmacen().getIdAlmacen());
        }
        if (entity.getLote() != null) {
            dto.setIdLote(entity.getLote().getIdLote());
        }
        
        dto.setCantidad(entity.getCantidad());
        dto.setTipoMovimiento(entity.getTipoMovimiento());
        */
        
        dto.setFechaMovimiento(entity.getFechaMovimiento());
        // dto.setObservaciones(entity.getObservaciones());
        
        return dto;
    }
}