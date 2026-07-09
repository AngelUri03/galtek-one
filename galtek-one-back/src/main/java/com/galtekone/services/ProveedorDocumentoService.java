package com.galtekone.services;

import java.util.List;

import com.galtekone.dto.proveedor.ProveedorDocumentoVersionRequest;
import com.galtekone.entity.ProveedorDocumentoEntity;

public interface ProveedorDocumentoService {

    List<ProveedorDocumentoEntity> readByProveedor(Integer idProveedor);

    ProveedorDocumentoEntity create(Integer idProveedor, ProveedorDocumentoEntity obj, String user);

    ProveedorDocumentoEntity update(Integer idProveedor, Integer idProveedorDocumento, ProveedorDocumentoEntity obj, String user);

    ProveedorDocumentoEntity newVersion(Integer idProveedor, Integer idProveedorDocumento, ProveedorDocumentoVersionRequest request, String user);

    ProveedorDocumentoEntity delete(Integer idProveedor, Integer idProveedorDocumento, String user);
}
