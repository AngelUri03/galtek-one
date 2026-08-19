package com.galtekone.services;

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;

import com.galtekone.dto.proveedor.ProveedorDirectoryPageDTO;
import com.galtekone.entity.ProveedoresEntity;

public interface ProveedoresService extends CommonService<ProveedoresEntity>{

    Page<ProveedoresEntity> readPage(Specification<ProveedoresEntity> specs, int page, int size, String sort, String direction);

    ProveedorDirectoryPageDTO readDirectoryPage(Map<String, String> filters, int page, int size, String sort, String direction);

    Map<String, Object> detail(Integer idProveedor);

    Map<String, Object> editDetail(Integer idProveedor);

    ProveedoresEntity changeEstado(Integer idProveedor, String estadoProveedor, String motivo, String user);

    Map<String, Object> deletePolicy(Integer idProveedor);

    ProveedoresEntity delete(Integer idProveedor, String motivo, String user);
}
