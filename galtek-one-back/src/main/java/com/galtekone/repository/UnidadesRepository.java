package com.galtekone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.UnidadesEntity;

@Repository
public interface UnidadesRepository extends JpaRepository<UnidadesEntity, Integer>, JpaSpecificationExecutor<UnidadesEntity>{

}
