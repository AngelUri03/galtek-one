package com.galtekone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.ComprasEntity;

@Repository
public interface ComprasRepository extends JpaRepository<ComprasEntity, Integer>, JpaSpecificationExecutor<ComprasEntity>{

    @Query("select count(c) from ComprasEntity c where c.IdProveedor.idProveedor = :idProveedor and c.empresa.idEmpresa = :idEmpresa")
    long countByProveedorAndEmpresa(@Param("idProveedor") Integer idProveedor, @Param("idEmpresa") Integer idEmpresa);

}
