package com.galtekone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.AlmacenEntity;

import java.util.Optional;

@Repository
public interface AlmacenRepository extends JpaRepository<AlmacenEntity, Integer>, JpaSpecificationExecutor<AlmacenEntity>{

    Optional<AlmacenEntity> findByIdAlmacenAndEmpresa_IdEmpresa(Integer idAlmacen, Integer empresaId);
}
