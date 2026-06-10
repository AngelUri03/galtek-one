package com.galtekone.dto.movimientoCaja;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class MovimientoCajaDTO {

    private Integer idMovimientoCaja;

    private Integer idCaja;
    private String nombreCaja;

    private Integer idUsuario;

    private String tipo;
    private BigDecimal monto;
    private String motivo;
    private LocalDateTime fecha;

}

