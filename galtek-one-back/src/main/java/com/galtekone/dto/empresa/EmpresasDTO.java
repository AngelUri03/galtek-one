package com.galtekone.dto.empresa;

import java.time.LocalDate;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EmpresasDTO {

    private String nombre;
    private Integer idTipoSuscripcion;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private String direccion;
    private String tokenLicencia;
}
