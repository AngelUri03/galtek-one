package com.galtekone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.UsuariosPermisosEntity;

@Repository
public interface UsuariosPermisosRepository extends JpaRepository<UsuariosPermisosEntity, Integer>, JpaSpecificationExecutor<UsuariosPermisosEntity> {

}
