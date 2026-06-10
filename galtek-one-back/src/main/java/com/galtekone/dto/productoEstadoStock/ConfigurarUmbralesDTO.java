package com.galtekone.dto.productoEstadoStock;

import lombok.Data;

@Data
public class ConfigurarUmbralesDTO {
    private Integer idProducto;
    private Integer critico;
    private Integer bajo;
}
