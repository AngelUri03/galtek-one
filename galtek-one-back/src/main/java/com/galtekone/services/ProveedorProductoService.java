package com.galtekone.services;

import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import com.galtekone.dto.proveedor.ProveedorProductoRowDTO;
import com.galtekone.entity.ProveedorProductoEntity;

public interface ProveedorProductoService extends CommonService<ProveedorProductoEntity>{
	
    ProveedorProductoEntity create(
            ProveedorProductoEntity obj,
            String user,
            Integer idEmpresa
    );

    List<ProveedorProductoEntity> read(
            Specification<ProveedorProductoEntity> specs,
            Integer idEmpresa
    );

    ProveedorProductoEntity update(
            ProveedorProductoEntity obj,
            String user,
            Integer idEmpresa
    );

    ProveedorProductoEntity delete(
            Integer idProveedorProducto,
            String user,
            Integer idEmpresa
    );

    List<ProveedorProductoRowDTO> readByProveedor(Integer idProveedor);

    ProveedorProductoEntity createForProveedor(Integer idProveedor, ProveedorProductoEntity obj, String user);

    ProveedorProductoEntity updateForProveedor(Integer idProveedor, Integer idProveedorProducto, ProveedorProductoEntity obj, String user);

    ProveedorProductoEntity deleteForProveedor(Integer idProveedor, Integer idProveedorProducto, String user);

    Object readCostHistory(Integer idProveedor, Integer idProveedorProducto);

}
