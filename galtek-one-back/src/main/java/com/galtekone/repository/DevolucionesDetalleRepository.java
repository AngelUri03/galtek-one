package com.galtekone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.DevolucionesDetalleEntity;
@Repository
public interface DevolucionesDetalleRepository extends JpaRepository<DevolucionesDetalleEntity, Integer>,  JpaSpecificationExecutor<DevolucionesDetalleEntity>{


}
