package com.galtekone.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.UsuariosPermisosEntity;

@Repository
public interface UsuariosPermisosRepository extends JpaRepository<UsuariosPermisosEntity, Integer>, JpaSpecificationExecutor<UsuariosPermisosEntity> {

    @Query("""
            SELECT up
            FROM UsuariosPermisosEntity up
            JOIN FETCH up.usuario u
            JOIN FETCH up.permiso p
            WHERE u.empresa.idEmpresa = :idEmpresa
              AND up.estatus = true
            """)
    List<UsuariosPermisosEntity> findActiveByEmpresa(@Param("idEmpresa") Integer idEmpresa);

    @Query("""
            SELECT up
            FROM UsuariosPermisosEntity up
            JOIN FETCH up.usuario u
            JOIN FETCH up.permiso p
            WHERE u.idUsuario = :idUsuario
              AND u.empresa.idEmpresa = :idEmpresa
              AND up.estatus = true
            """)
    List<UsuariosPermisosEntity> findActiveByUsuarioAndEmpresa(
            @Param("idUsuario") Integer idUsuario,
            @Param("idEmpresa") Integer idEmpresa);

    @Query("""
            SELECT up
            FROM UsuariosPermisosEntity up
            JOIN FETCH up.usuario u
            JOIN FETCH up.permiso p
            WHERE u.idUsuario = :idUsuario
              AND p.idPermiso = :idPermiso
              AND u.empresa.idEmpresa = :idEmpresa
            ORDER BY up.idUsuariosPermisos ASC
            """)
    List<UsuariosPermisosEntity> findByUsuarioPermisoAndEmpresa(
            @Param("idUsuario") Integer idUsuario,
            @Param("idPermiso") Integer idPermiso,
            @Param("idEmpresa") Integer idEmpresa);

}
