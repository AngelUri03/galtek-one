package com.galtekone.dto.inventario;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class LoteDTO {
    private Integer idLote;
    private String numeroLote;
    private BigDecimal cantidad;
    private LocalDate fechaExpiracion;
    private String ubicacion;
}
