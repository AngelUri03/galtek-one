package com.galtekone.services;

import com.galtekone.dto.productoEstadoStock.ProductoEstadoStockResponseDTO;
import com.galtekone.entity.ProductoEstadoStockEntity;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

public interface ProductoEstadoStockService extends CommonService<ProductoEstadoStockEntity> {
    List<ProductoEstadoStockResponseDTO> readDTO(
            Specification<ProductoEstadoStockEntity> specs);
            
    void configurarUmbrales(com.galtekone.dto.productoEstadoStock.ConfigurarUmbralesDTO dto, String user);
}
