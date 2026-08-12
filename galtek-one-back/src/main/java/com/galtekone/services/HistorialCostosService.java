package com.galtekone.services;

import com.galtekone.entity.HistorialCostosEntity;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;

public interface HistorialCostosService {

    HistorialCostosEntity registrarCambioCosto(HistorialCostosEntity historial);

    List<HistorialCostosEntity> obtenerHistorialProducto(
            Integer idProveedor,
            Integer idProducto);
            
    List<HistorialCostosEntity> read(Specification<HistorialCostosEntity> spec);

}