package com.galtekone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.MetodoPagoEntity;

import java.util.Optional;

@Repository
public interface MetodoPagoRepository extends JpaRepository<MetodoPagoEntity, Integer>, JpaSpecificationExecutor<MetodoPagoEntity>{

    Optional<MetodoPagoEntity> findByIdMetodoPagoAndEmpresa_IdEmpresa(Integer idMetodoPago, Integer idEmpresa);


}
