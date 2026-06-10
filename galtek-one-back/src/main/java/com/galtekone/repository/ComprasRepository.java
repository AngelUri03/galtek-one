package com.galtekone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.ComprasEntity;

@Repository
public interface ComprasRepository extends JpaRepository<ComprasEntity, Integer>, JpaSpecificationExecutor<ComprasEntity>{

}
