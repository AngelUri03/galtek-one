package com.galtekone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.DevolucionesEntity;

@Repository
public interface DevolucionesRepository extends JpaRepository<DevolucionesEntity, Integer>, JpaSpecificationExecutor<DevolucionesEntity>{

}
