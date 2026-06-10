package com.galtekone.dto.lote;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.Data;

@Data
public class LoteResponseDTO {

    private Integer idLote;

    private Integer idProducto;
    private String nombreProducto;

    private Integer idAlmacen;
    private String nombreAlmacen;

    private BigDecimal cantidad;
    private LocalDate fechaCaducidad;

}
