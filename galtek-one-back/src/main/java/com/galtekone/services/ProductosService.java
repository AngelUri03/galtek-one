package com.galtekone.services;

import java.util.List;

import com.galtekone.dto.producto.ProductoResponseDTO;
import com.galtekone.entity.ProductosEntity;

public interface ProductosService extends CommonService<ProductosEntity>{
	List<ProductosEntity> findByCategoria(Integer idCategoria);
    List<ProductoResponseDTO> listarProductosActivos();

}
