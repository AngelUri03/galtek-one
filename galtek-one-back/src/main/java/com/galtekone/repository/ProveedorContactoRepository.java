package com.galtekone.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.ProveedorContactoEntity;

@Repository
public interface ProveedorContactoRepository extends JpaRepository<ProveedorContactoEntity, Integer>, JpaSpecificationExecutor<ProveedorContactoEntity> {

    List<ProveedorContactoEntity> findByProveedor_IdProveedorAndEmpresa_IdEmpresa(Integer idProveedor, Integer idEmpresa);

    Optional<ProveedorContactoEntity> findByIdProveedorContactoAndProveedor_IdProveedorAndEmpresa_IdEmpresa(
            Integer idProveedorContacto,
            Integer idProveedor,
            Integer idEmpresa
    );

    long countByProveedor_IdProveedorAndEmpresa_IdEmpresa(Integer idProveedor, Integer idEmpresa);
}
