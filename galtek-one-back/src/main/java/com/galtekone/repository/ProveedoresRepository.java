package com.galtekone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.ProveedoresEntity;

import java.util.Optional;

@Repository
public interface ProveedoresRepository extends JpaRepository<ProveedoresEntity, Integer>, JpaSpecificationExecutor<ProveedoresEntity>{

    //encontrar por idProveedor y idEmpresa
    Optional<ProveedoresEntity> findByIdProveedorAndEmpresa_IdEmpresa(Integer idProveedor, Integer idEmpresa);

}
