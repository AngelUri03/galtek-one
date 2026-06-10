package com.galtekone.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.HistorialCostosEntity;

@Repository
public interface HistorialCostosRepository
        extends JpaRepository<HistorialCostosEntity, Integer>, JpaSpecificationExecutor<HistorialCostosEntity> {

    // buscar historial de costos por id y empresa
    Optional<HistorialCostosEntity> findByIdHistorialCostosAndEmpresa_IdEmpresa(Integer IdHistorialCostos,
            Integer idEmpresa);

    // Obtener el costo más reciente de un producto antes de una fecha dada
    Optional<HistorialCostosEntity> findTopByProducto_IdProductoAndEmpresa_IdEmpresaAndFechaCreacionLessThanEqualOrderByFechaCreacionDesc(
            Integer idProducto, Integer idEmpresa, LocalDateTime fecha);
}

