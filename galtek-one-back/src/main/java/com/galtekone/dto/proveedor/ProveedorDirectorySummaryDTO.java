package com.galtekone.dto.proveedor;

import lombok.Data;

@Data
public class ProveedorDirectorySummaryDTO {

    private Long total;
    private Long activos;
    private Long inactivos;
    private Long archivados;
    private Long sinProductos;
    private Long conActivos;
}
