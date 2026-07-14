package com.galtekone.services;

import java.util.List;

import com.galtekone.entity.ProveedorContactoEntity;

public interface ProveedorContactoService {

    List<ProveedorContactoEntity> readByProveedor(Integer idProveedor);

    ProveedorContactoEntity create(Integer idProveedor, ProveedorContactoEntity obj, String user);

    ProveedorContactoEntity update(Integer idProveedor, Integer idProveedorContacto, ProveedorContactoEntity obj, String user);

    ProveedorContactoEntity delete(Integer idProveedor, Integer idProveedorContacto, String user);
}
