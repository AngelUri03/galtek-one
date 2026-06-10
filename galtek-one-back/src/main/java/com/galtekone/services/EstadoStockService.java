package com.galtekone.services;

import com.galtekone.entity.EstadoStockEntity;

import java.math.BigDecimal;

public interface EstadoStockService extends CommonService<EstadoStockEntity> {

    String calcularEstado(Integer idProducto, BigDecimal existencia);

}
