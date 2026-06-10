package com.galtekone.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.UsuariosEntity;

@Repository
public interface UsuariosRepository extends JpaRepository<UsuariosEntity, Integer>, JpaSpecificationExecutor<UsuariosEntity>{

    Optional<UsuariosEntity> findByIdUsuarioAndEmpresa_IdEmpresa(Integer idUsuario, Integer idEmpresa);

    Optional<UsuariosEntity> findByUsuario(String usuario);
	
	boolean existsByUsuario(String usuario);

    Optional<UsuariosEntity> findByUsuarioAndEmpresa_IdEmpresa(String user, Integer empresaId);
    
    List<UsuariosEntity> findByEmpresa_IdEmpresa(Integer idEmpresa);
    
    boolean existsByRol_IdRolAndEmpresa_IdEmpresa(Integer idRol, Integer idEmpresa);
}
