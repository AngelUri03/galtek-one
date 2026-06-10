package com.galtekone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.VentaDetalleEntity;

@Repository
public interface VentaDetalleRepository extends JpaRepository<VentaDetalleEntity, Integer>,  JpaSpecificationExecutor<VentaDetalleEntity>{

}

