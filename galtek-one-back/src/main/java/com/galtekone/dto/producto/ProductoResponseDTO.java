package com.galtekone.dto.producto;


import lombok.AllArgsConstructor;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductoResponseDTO {

    private Integer idProducto;
    private String nombreProducto;
    private String descripcion;
    private String codigoBarras;
    private String nombreUnidad;
    private Float precioVenta;
    private Integer idCategoria;
    private Integer idEmpresa;
    private Boolean esPesaje;
    private String imagen;
}
