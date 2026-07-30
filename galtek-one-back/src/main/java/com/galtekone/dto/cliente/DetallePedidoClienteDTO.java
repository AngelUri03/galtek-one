package com.galtekone.dto.cliente;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class DetallePedidoClienteDTO {

    private Integer idProducto;
    private String nombreProducto;
    private String codigoBarras;
    private String unidad;
    private Boolean esPesaje;
    private BigDecimal cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
}
