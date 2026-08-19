package com.galtekone.dto.proveedor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProveedorActivoRowDTO {

    private Integer idProveedorActivo;
    private String nombre;
    private String tipo;
    private String numeroSerie;
    private LocalDate fechaEntrega;
    private LocalDate fechaRegreso;
    private String estadoFisico;
    private String ubicacionTienda;
    private String condicionesPrestamo;
    private BigDecimal depositoGarantia;
    private String estadoActivoPrestado;
    private String notas;
    private Boolean estatus;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaModificacion;
    private Long historialCount;
}
