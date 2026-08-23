package com.galtekone.dto.cliente;

import lombok.Data;

@Data
public class ClienteDirectorySummaryDTO {

    private Long total;
    private Long activos;
    private Long inactivos;
    private Long archivados;
    private Long conFiscales;
    private Long conDireccion;
}
