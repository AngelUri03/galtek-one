package com.galtekone.services;

import com.galtekone.dto.lote.LoteResponseDTO;
import com.galtekone.entity.LotesEntity;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

public interface LotesService extends CommonService<LotesEntity> {

    void descontarConsumo(Integer idProducto, Integer idAlmacen, java.math.BigDecimal cantidad, String user);

    List<LoteResponseDTO> readDTO(
            Specification<LotesEntity> specs);
            
    LotesEntity ajustarStock(com.galtekone.dto.lotes.AjusteLoteRequest request, String user);
}
