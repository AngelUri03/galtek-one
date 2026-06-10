package com.galtekone.dto.inventario;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

@Data
public class InventarioFilterDTO {

    // Filtros básicos
    private List<Integer> categoriaIds;
    private List<Integer> almacenIds;
    private List<Integer> proveedorIds;
    private Boolean activo; // Estado del producto

    // Filtros de Rango
    private BigDecimal stockMin;
    private BigDecimal stockMax;

    // Fechas
    private LocalDateTime actualizadoDesde;
    private LocalDateTime actualizadoHasta;

    // Lotes
    private String numeroLote; // Búsqueda por ID
    private Boolean tieneLotesCaducados;
    private Integer caducaEnDias; // Buscar lotes que caducan en <= X días

    // Estado Stock (Calculado)
    private String estadoStock; // "AGOTADO", "CRITICO", "BAJO", "OPTIMO"

}
