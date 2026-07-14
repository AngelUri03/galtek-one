package com.galtekone.services;

import java.util.List;

import com.galtekone.entity.ProveedorAcuerdoEntity;

public interface ProveedorAcuerdoService {

    List<ProveedorAcuerdoEntity> readByProveedor(Integer idProveedor);

    ProveedorAcuerdoEntity create(Integer idProveedor, ProveedorAcuerdoEntity obj, String user);

    ProveedorAcuerdoEntity update(Integer idProveedor, Integer idProveedorAcuerdo, ProveedorAcuerdoEntity obj, String user);

    ProveedorAcuerdoEntity delete(Integer idProveedor, Integer idProveedorAcuerdo, String user);
}
