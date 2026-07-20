package com.galtekone.services;

import java.util.List;

import com.galtekone.dto.proveedor.ProveedorActivoIncidenteRequest;
import com.galtekone.dto.proveedor.ProveedorActivoEstadoRequest;
import com.galtekone.entity.ProveedorActivoEntity;

public interface ProveedorActivoService {

    List<ProveedorActivoEntity> readByProveedor(Integer idProveedor);

    ProveedorActivoEntity create(Integer idProveedor, ProveedorActivoEntity obj, String user);

    ProveedorActivoEntity update(Integer idProveedor, Integer idProveedorActivo, ProveedorActivoEntity obj, String user);

    ProveedorActivoEntity changeState(Integer idProveedor, Integer idProveedorActivo, ProveedorActivoEstadoRequest request, String user);

    ProveedorActivoEntity reportIncident(Integer idProveedor, Integer idProveedorActivo, ProveedorActivoIncidenteRequest request, String user);

    ProveedorActivoEntity delete(Integer idProveedor, Integer idProveedorActivo, String user);
}
