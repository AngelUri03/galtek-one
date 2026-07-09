package com.galtekone.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.galtekone.entity.ProveedorDocumentoHistorialEntity;

public interface ProveedorDocumentoHistorialRepository extends JpaRepository<ProveedorDocumentoHistorialEntity, Integer>, JpaSpecificationExecutor<ProveedorDocumentoHistorialEntity> {

    List<ProveedorDocumentoHistorialEntity> findByIdProveedorDocumentoAndEmpresa_IdEmpresaOrderByFechaEventoDesc(
            Integer idProveedorDocumento,
            Integer idEmpresa
    );
}
