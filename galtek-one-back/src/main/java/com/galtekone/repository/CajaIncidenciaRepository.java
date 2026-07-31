package com.galtekone.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.CajaIncidenciaEntity;
import com.galtekone.entity.CajaIncidenciaStatus;

@Repository
public interface CajaIncidenciaRepository
        extends JpaRepository<CajaIncidenciaEntity, Integer>, JpaSpecificationExecutor<CajaIncidenciaEntity> {

    Optional<CajaIncidenciaEntity> findByIdCajaIncidenciaAndEmpresa_IdEmpresaAndEstatusTrue(
            Integer idCajaIncidencia, Integer idEmpresa);

    List<CajaIncidenciaEntity> findByEmpresa_IdEmpresaAndStatusInAndEstatusTrueOrderByFechaCreacionDesc(
            Integer idEmpresa, Collection<CajaIncidenciaStatus> statuses);

    long countByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndStatusInAndEstatusTrue(
            String installationId, Integer idEmpresa, Collection<CajaIncidenciaStatus> statuses);
}
