package com.galtekone.dto.proveedor;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProveedorDocumentoVersionRequest {
    private String motivo;
    private String archivoNombre;
    private String mimeType;
    private String archivoBase64;
}
