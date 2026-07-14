package com.galtekone.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.ProveedorActivoEntity;

@Repository
public interface ProveedorActivoRepository extends JpaRepository<ProveedorActivoEntity, Integer>, JpaSpecificationExecutor<ProveedorActivoEntity> {

    List<ProveedorActivoEntity> findByProveedor_IdProveedorAndEmpresa_IdEmpresa(Integer idProveedor, Integer idEmpresa);

    Optional<ProveedorActivoEntity> findByIdProveedorActivoAndProveedor_IdProveedorAndEmpresa_IdEmpresa(
            Integer idProveedorActivo,
            Integer idProveedor,
            Integer idEmpresa
    );

    long countByProveedor_IdProveedorAndEmpresa_IdEmpresa(Integer idProveedor, Integer idEmpresa);
}
