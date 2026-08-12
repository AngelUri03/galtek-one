package com.galtekone.dto.productoPrecioHistorial;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ProductoPrecioHistorialResponseDTO {

    private Integer idHistorial; // Ajusta el nombre si en tu entidad se llama diferente
    private Integer idProducto;
    private BigDecimal precioAnterior;
    private BigDecimal precioNuevo;
    private LocalDateTime fechaEvento;
    private String motivo;

    // Getters y Setters
    public Integer getIdHistorial() { return idHistorial; }
    public void setIdHistorial(Integer idHistorial) { this.idHistorial = idHistorial; }

    public Integer getIdProducto() { return idProducto; }
    public void setIdProducto(Integer idProducto) { this.idProducto = idProducto; }

    public BigDecimal getPrecioAnterior() { return precioAnterior; }
    public void setPrecioAnterior(BigDecimal precioAnterior) { this.precioAnterior = precioAnterior; }

    public BigDecimal getPrecioNuevo() { return precioNuevo; }
    public void setPrecioNuevo(BigDecimal precioNuevo) { this.precioNuevo = precioNuevo; }

    public LocalDateTime getFechaEvento() { return fechaEvento; }
    public void setFechaEvento(LocalDateTime fechaEvento) { this.fechaEvento = fechaEvento; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
}