package com.galtekone.dto.proveedor;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProveedorActivoEvidenciaRequest {

    private String evidenciaNombre;
    private String evidenciaMimeType;
    private String evidenciaBase64;
    private Long evidenciaTamanoBytes;
}
