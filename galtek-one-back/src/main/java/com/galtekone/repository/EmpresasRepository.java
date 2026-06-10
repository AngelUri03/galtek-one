package com.galtekone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.EmpresasEntity;

@Repository
public interface EmpresasRepository extends JpaRepository<EmpresasEntity, Integer>, JpaSpecificationExecutor<EmpresasEntity>{

}
