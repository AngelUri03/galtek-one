package com.galtekone.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.SaldoEfectivoEntity;

import jakarta.persistence.LockModeType;

@Repository
public interface SaldoEfectivoRepository
        extends JpaRepository<SaldoEfectivoEntity, Integer>, JpaSpecificationExecutor<SaldoEfectivoEntity> {

    Optional<SaldoEfectivoEntity> findByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndEstatusTrue(
            String installationId, Integer idEmpresa);

    Optional<SaldoEfectivoEntity> findByInitializationIdempotencyKeyAndEmpresa_IdEmpresaAndEstatusTrue(
            String initializationIdempotencyKey, Integer idEmpresa);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT s
            FROM SaldoEfectivoEntity s
            WHERE s.localDevice.installationId = :installationId
              AND s.empresa.idEmpresa = :idEmpresa
              AND s.estatus = true
            """)
    Optional<SaldoEfectivoEntity> findByDeviceAndEmpresaForUpdate(
            @Param("installationId") String installationId,
            @Param("idEmpresa") Integer idEmpresa);
}
