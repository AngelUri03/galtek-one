package com.galtekone.dto.inventario;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class InventarioDTO {

    private Integer idInventario;
    private Integer idProducto;
    private String nombreProducto;
    private BigDecimal existencia;
    private String estadoStock;
    private String almacen;

    // --- Campos del Producto ---
    private String codigoBarras;        // SKU / código de barras
    private Float precioVenta;          // de ProductosEntity.precioVenta
    private String imagen;              // de ProductosEntity.imagen
    private Integer idCategoria;        // de ProductosEntity.categoria.idCategoria
    private String categoriaNombre;     // de ProductosEntity.categoria.nombreCategoria
    private Integer idUnidad;           // de ProductosEntity.unidad.idUnidad
    private Boolean esPesaje;           // de ProductosEntity.esPesaje

    // --- Campo del Proveedor (primer proveedor asociado) ---
    private Integer idProveedor;        // de ProveedorProductoEntity → ProveedoresEntity.idProveedor
    private String proveedorNombre;     // de ProveedorProductoEntity → ProveedoresEntity.nombreProveedor
    private Float precioCompra;         // de ProveedorProductoEntity.precioCompra

    // --- Lotes ---
    private List<LoteDTO> lotes;

    // --- Metadatos ---
    private Boolean estatus;            // de CommonEntity (heredado por InventarioEntity)
    private LocalDateTime fechaActualizacion; // fechaModificacion de la entidad
}

