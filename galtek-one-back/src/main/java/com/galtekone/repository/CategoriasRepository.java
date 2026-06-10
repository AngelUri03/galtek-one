package com.galtekone.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.CategoriasEntity;

@Repository
public interface CategoriasRepository extends JpaRepository<CategoriasEntity, Integer>, JpaSpecificationExecutor<CategoriasEntity>{

    Optional<CategoriasEntity> findByIdCategoriaAndEmpresa_IdEmpresa(Integer idCategoria, Integer idEmpresa);
    List<CategoriasEntity> findByEmpresa_IdEmpresaAndEstatusTrue(Integer idEmpresa);




}
