package com.galtekone.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.RolesPermisosEntity;

@Repository
public interface RolesPermisosRepository extends JpaRepository<RolesPermisosEntity, Integer>, JpaSpecificationExecutor<RolesPermisosEntity> {

	List<RolesPermisosEntity> findAllByRol_IdRol(Integer idRol);

	@Query("""
			SELECT rp
			FROM RolesPermisosEntity rp
			JOIN FETCH rp.permiso p
			WHERE rp.rol.idRol = :idRol
			  AND rp.estatus = true
			""")
	List<RolesPermisosEntity> findActiveByRolWithPermiso(@Param("idRol") Integer idRol);

	boolean existsByRol_IdRolAndPermiso_IdPermiso(Integer idRol, Integer idPermiso);

	long countByRol_IdRolAndPermiso_ClaveIgnoreCaseAndEstatusTrue(Integer idRol, String clave);
	
	@Modifying(clearAutomatically = true, flushAutomatically = true)
    int deleteByRol_IdRolAndPermiso_IdPermisoIn(Integer idRol, Collection<Integer> ids);
	
	@Modifying
    int deleteByRol_IdRol(Integer idRol);

}
