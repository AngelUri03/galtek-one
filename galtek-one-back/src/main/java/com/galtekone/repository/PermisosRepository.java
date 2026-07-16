package com.galtekone.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import com.galtekone.entity.PermisosEntity;

@Repository
public interface PermisosRepository extends JpaRepository<PermisosEntity, Integer>, JpaSpecificationExecutor<PermisosEntity> {

	List<PermisosEntity> findByEstatusTrueOrderByModuloAscNombreAsc();

}
