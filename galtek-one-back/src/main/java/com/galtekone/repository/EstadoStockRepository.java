package com.galtekone.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.EstadoStockEntity;

@Repository
public interface EstadoStockRepository
        extends JpaRepository<EstadoStockEntity, Integer>, JpaSpecificationExecutor<EstadoStockEntity> {

    Optional<EstadoStockEntity> findByIdEstadoStockAndEmpresa_IdEmpresa(Integer idEstadoStock, Integer idEmpresa);

    java.util.List<EstadoStockEntity> findByEmpresa_IdEmpresaOrderByOrdenAsc(Integer idEmpresa);

}
