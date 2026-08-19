package com.galtekone.dto.proveedor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProveedorProductoRowDTO {

    private Integer idProveedorProducto;
    private Integer idProducto;
    private String nombreProducto;
    private String descripcion;
    private String codigoBarras;
    private Float precioCompra;
    private String skuProveedor;
    private BigDecimal ultimoCosto;
    private LocalDateTime fechaUltimoCosto;
    private String presentacionCompra;
    private BigDecimal cantidadMinima;
    private Boolean proveedorPreferido;
    private String estadoRelacion;
    private Boolean estatus;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaModificacion;
}
