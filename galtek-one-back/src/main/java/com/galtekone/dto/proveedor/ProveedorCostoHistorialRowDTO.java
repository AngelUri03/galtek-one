package com.galtekone.dto.proveedor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProveedorCostoHistorialRowDTO {

    private Integer idHistorialCostos;
    private BigDecimal costoAnterior;
    private BigDecimal costoNuevo;
    private BigDecimal diferencia;
    private String motivo;
    private String referencia;
    private String usuario;
    private LocalDateTime fechaCambio;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaModificacion;
    private String usuarioCreacion;
    private String usuarioModificacion;
}
