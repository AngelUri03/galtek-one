package com.galtekone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.CompraDetalleEntity;

@Repository
public interface CompraDetalleRepository extends JpaRepository<CompraDetalleEntity, Integer>, JpaSpecificationExecutor<CompraDetalleEntity>{

}
