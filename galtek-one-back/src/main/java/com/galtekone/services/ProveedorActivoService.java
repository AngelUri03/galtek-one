package com.galtekone.services;

import java.util.List;

import com.galtekone.dto.proveedor.ProveedorActivoRowDTO;
import com.galtekone.dto.proveedor.ProveedorActivoIncidenteRequest;
import com.galtekone.dto.proveedor.ProveedorActivoEstadoRequest;
import com.galtekone.entity.ProveedorActivoEntity;
import com.galtekone.entity.ProveedorActivoHistorialEntity;

public interface ProveedorActivoService {

    List<ProveedorActivoRowDTO> readByProveedor(Integer idProveedor);

    List<ProveedorActivoHistorialEntity> readHistory(Integer idProveedor, Integer idProveedorActivo);

    ProveedorActivoEntity create(Integer idProveedor, ProveedorActivoEntity obj, String user);

    ProveedorActivoEntity update(Integer idProveedor, Integer idProveedorActivo, ProveedorActivoEntity obj, String user);

    ProveedorActivoEntity changeState(Integer idProveedor, Integer idProveedorActivo, ProveedorActivoEstadoRequest request, String user);

    ProveedorActivoEntity reportIncident(Integer idProveedor, Integer idProveedorActivo, ProveedorActivoIncidenteRequest request, String user);

    ProveedorActivoEntity delete(Integer idProveedor, Integer idProveedorActivo, String user);
}
