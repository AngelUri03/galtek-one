package com.galtekone.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.EntradasSalidasEntity;

import java.util.Optional;

@Repository
public interface EntradasSalidasRepository extends JpaRepository<EntradasSalidasEntity, Integer>, JpaSpecificationExecutor<EntradasSalidasEntity> {

    //buscar entrada o salida por id y empresa
    Optional<EntradasSalidasEntity> findByIdRegistroAndEmpresa_IdEmpresa(Integer idRegistro, Integer idEmpresa);

}
