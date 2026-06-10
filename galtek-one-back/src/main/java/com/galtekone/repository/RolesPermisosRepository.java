package com.galtekone.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.RolesPermisosEntity;

@Repository
public interface RolesPermisosRepository extends JpaRepository<RolesPermisosEntity, Integer>, JpaSpecificationExecutor<RolesPermisosEntity> {

	List<RolesPermisosEntity> findAllByRol_IdRol(Integer idRol);

	boolean existsByRol_IdRolAndPermiso_IdPermiso(Integer idRol, Integer idPermiso);
	
	@Modifying(clearAutomatically = true, flushAutomatically = true)
    int deleteByRol_IdRolAndPermiso_IdPermisoIn(Integer idRol, Collection<Integer> ids);
	
	@Modifying
    int deleteByRol_IdRol(Integer idRol);

}