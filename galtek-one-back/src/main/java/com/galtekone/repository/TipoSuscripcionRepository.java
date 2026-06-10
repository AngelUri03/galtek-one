package com.galtekone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.TipoSuscripcionEntity;

@Repository
public interface TipoSuscripcionRepository extends JpaRepository<TipoSuscripcionEntity, Integer>, JpaSpecificationExecutor<TipoSuscripcionEntity>{

}
