package com.galtekone.dto.proveedor;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProveedorActivoIncidenteRequest {

    private String descripcion;
    private String estadoFisico;
    private String ubicacionTienda;
    private List<ProveedorActivoEvidenciaRequest> evidencias;
}
