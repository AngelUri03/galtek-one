package com.galtekone.dto.productoHistorial;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ProductoHistorialRequestDTO {

    @NotNull(message = "El ID del producto es obligatorio")
    private Integer idProducto;

    @NotBlank(message = "El tipo de evento es obligatorio")
    private String tipoEvento;

    private String descripcion; // O detalles del cambio, ajústalo a tu entidad

    // Getters y Setters
    public Integer getIdProducto() { return idProducto; }
    public void setIdProducto(Integer idProducto) { this.idProducto = idProducto; }

    public String getTipoEvento() { return tipoEvento; }
    public void setTipoEvento(String tipoEvento) { this.tipoEvento = tipoEvento; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
}