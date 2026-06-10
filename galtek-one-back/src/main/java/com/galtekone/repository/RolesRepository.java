package com.galtekone.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.RolesEntity;

@Repository
public interface RolesRepository extends JpaRepository<RolesEntity, Integer>, JpaSpecificationExecutor<RolesEntity> {

	List<RolesEntity> findByEmpresa_IdEmpresaOrderByNombreRolAsc(Integer idEmpresa);

	@Query(value = """
			SELECT
			    r.id_rol            AS idRol,
			    r.nombre_rol        AS nombreRol,
			    r.estatus           AS estatus,
			    p.id_permiso        AS idPermiso,
			    p.nombre            AS nombrePermiso,
			    p.clave             AS clavePermiso
			FROM Roles r
			LEFT JOIN RolesPermisos rp
			       ON rp.id_rol = r.id_rol
			LEFT JOIN Permisos p
			       ON p.id_permiso = rp.id_permiso
			WHERE r.id_empresa = :idEmpresa
			ORDER BY r.nombre_rol ASC, p.nombre ASC
			""", nativeQuery = true)
	List<Object[]> findRolesWithPermisosByEmpresa(@Param("idEmpresa") Integer idEmpresa);
	
	Optional<RolesEntity> findByIdRolAndEmpresa_IdEmpresa(Integer idRol, Integer idEmpresa);

	boolean existsByEmpresa_IdEmpresaAndNombreRolIgnoreCase(Integer idEmpresa, String nombreRol);

	boolean existsByEmpresa_IdEmpresaAndNombreRolIgnoreCaseAndIdRolNot(Integer idEmpresa, String nombreRol, Integer idRol);

}
