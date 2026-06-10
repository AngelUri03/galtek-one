package com.galtekone.dto.devolucion;


import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DevolucionesDTO {
    private Integer idDevolucion;
    private Integer idVenta;
    private BigDecimal totalDevolucion;
    private String motivo;
}
