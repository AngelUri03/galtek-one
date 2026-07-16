package com.galtekone.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.ProveedorDocumentoEntity;

@Repository
public interface ProveedorDocumentoRepository extends JpaRepository<ProveedorDocumentoEntity, Integer>, JpaSpecificationExecutor<ProveedorDocumentoEntity> {

    List<ProveedorDocumentoEntity> findByProveedor_IdProveedorAndEmpresa_IdEmpresa(Integer idProveedor, Integer idEmpresa);

    Optional<ProveedorDocumentoEntity> findByIdProveedorDocumentoAndProveedor_IdProveedorAndEmpresa_IdEmpresa(
            Integer idProveedorDocumento,
            Integer idProveedor,
            Integer idEmpresa
    );

    long countByProveedor_IdProveedorAndEmpresa_IdEmpresa(Integer idProveedor, Integer idEmpresa);
}
