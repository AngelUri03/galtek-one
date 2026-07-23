package com.galtekone.repository;

import java.util.Collection;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.CajaRelevoEntity;
import com.galtekone.entity.CajaRelevoStatus;

@Repository
public interface CajaRelevoRepository extends JpaRepository<CajaRelevoEntity, Integer> {
    Optional<CajaRelevoEntity> findFirstByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndStatusInAndEstatusTrueOrderByFechaCreacionDesc(
            String installationId, Integer idEmpresa, Collection<CajaRelevoStatus> statuses);
}
