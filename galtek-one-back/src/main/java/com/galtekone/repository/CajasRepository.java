package com.galtekone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.CajasEntity;

import java.util.Optional;

@Repository
public interface CajasRepository extends JpaRepository<CajasEntity, Integer>, JpaSpecificationExecutor<CajasEntity>{

    Optional<CajasEntity> findByIdCajaAndEmpresa_IdEmpresa(Integer idCaja, Integer idEmpresa);


}
