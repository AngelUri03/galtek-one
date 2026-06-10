package com.galtekone.services;

import java.util.List;

import org.springframework.data.jpa.domain.Specification;

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

}
