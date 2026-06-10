package com.galtekone.dto.reporte;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

@Data
public class ReporteGananciaDTO {

    private BigDecimal ventaBruta;
    private BigDecimal costoTotal;
    private BigDecimal gananciaNeta;
    private BigDecimal margenPorcentaje;
    private BigDecimal totalDevoluciones;
    private BigDecimal ventaNetaAjustada;

    private LocalDateTime desde;
    private LocalDateTime hasta;

    private List<DetalleGananciaProductoDTO> detallesPorProducto;

    @Data
    public static class DetalleGananciaProductoDTO {
        private Integer idProducto;
        private String nombreProducto;
        private BigDecimal cantidadVendida;
        private BigDecimal ingresoVenta;
        private BigDecimal costoHistorico;
        private BigDecimal ganancia;
        private BigDecimal margenPorcentaje;
    }
}

