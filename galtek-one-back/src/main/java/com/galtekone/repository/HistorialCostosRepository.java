package com.galtekone.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.HistorialCostosEntity;

@Repository
public interface HistorialCostosRepository
        extends JpaRepository<HistorialCostosEntity, Integer>,
                JpaSpecificationExecutor<HistorialCostosEntity> {

    Optional<HistorialCostosEntity> findByIdHistorialCostosAndEmpresa_IdEmpresa(
            Integer idHistorialCostos,
            Integer idEmpresa);

    Optional<HistorialCostosEntity>
    findTopByProducto_IdProductoAndEmpresa_IdEmpresaAndFechaCambioLessThanEqualOrderByFechaCambioDesc(
            Integer idProducto,
            Integer idEmpresa,
            LocalDateTime fecha);

    Optional<HistorialCostosEntity>
    findTopByProducto_IdProductoAndEmpresa_IdEmpresaOrderByFechaCambioDesc(
            Integer idProducto,
            Integer idEmpresa);

    List<HistorialCostosEntity>
    findByProveedor_IdProveedorAndProducto_IdProductoAndEmpresa_IdEmpresaOrderByFechaCambioDesc(
            Integer idProveedor,
            Integer idProducto,
            Integer idEmpresa);
}

