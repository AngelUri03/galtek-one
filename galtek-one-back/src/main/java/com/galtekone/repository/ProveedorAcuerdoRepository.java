package com.galtekone.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.ProveedorAcuerdoEntity;

@Repository
public interface ProveedorAcuerdoRepository extends JpaRepository<ProveedorAcuerdoEntity, Integer>, JpaSpecificationExecutor<ProveedorAcuerdoEntity> {

    List<ProveedorAcuerdoEntity> findByProveedor_IdProveedorAndEmpresa_IdEmpresa(Integer idProveedor, Integer idEmpresa);

    Optional<ProveedorAcuerdoEntity> findByIdProveedorAcuerdoAndProveedor_IdProveedorAndEmpresa_IdEmpresa(
            Integer idProveedorAcuerdo,
            Integer idProveedor,
            Integer idEmpresa
    );

    long countByProveedor_IdProveedorAndEmpresa_IdEmpresa(Integer idProveedor, Integer idEmpresa);
}
