package com.galtekone.dto.proveedor;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProveedorActivoEstadoRequest {

    private String estadoNuevo;
    private String descripcion;
    private String estadoFisico;
    private String ubicacionTienda;
    private String fechaRegreso;
    private String evidenciaNombre;
    private String evidenciaMimeType;
    private String evidenciaBase64;
    private Long evidenciaTamanoBytes;
    private List<ProveedorActivoEvidenciaRequest> evidencias;
}
