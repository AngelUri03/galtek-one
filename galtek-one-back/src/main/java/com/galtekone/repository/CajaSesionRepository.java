package com.galtekone.repository;

import java.util.Collection;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.CajaSesionEntity;
import com.galtekone.entity.CajaSesionStatus;

import jakarta.persistence.LockModeType;

@Repository
public interface CajaSesionRepository extends JpaRepository<CajaSesionEntity, Integer>, JpaSpecificationExecutor<CajaSesionEntity> {

    Optional<CajaSesionEntity> findByOpeningIdempotencyKeyAndEmpresa_IdEmpresaAndEstatusTrue(
            String openingIdempotencyKey,
            Integer idEmpresa);

    Optional<CajaSesionEntity> findByClosingIdempotencyKeyAndEmpresa_IdEmpresaAndEstatusTrue(
            String closingIdempotencyKey,
            Integer idEmpresa);

    Optional<CajaSesionEntity> findFirstByCaja_IdCajaAndEmpresa_IdEmpresaAndStatusInAndEstatusTrueOrderByOpenedAtDesc(
            Integer idCaja,
            Integer idEmpresa,
            Collection<CajaSesionStatus> statuses);

    Optional<CajaSesionEntity> findFirstByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndStatusInAndEstatusTrueOrderByOpenedAtDesc(
            String installationId,
            Integer idEmpresa,
            Collection<CajaSesionStatus> statuses);

    Optional<CajaSesionEntity> findFirstByOpenedByUser_IdUsuarioAndEmpresa_IdEmpresaAndStatusInAndEstatusTrueOrderByOpenedAtDesc(
            Integer idUsuario,
            Integer idEmpresa,
            Collection<CajaSesionStatus> statuses);

    Optional<CajaSesionEntity> findFirstByCaja_IdCajaAndEmpresa_IdEmpresaAndEstatusTrueOrderByOpenedAtDesc(
            Integer idCaja,
            Integer idEmpresa);

    Optional<CajaSesionEntity> findFirstByLocalDevice_InstallationIdAndEmpresa_IdEmpresaAndEstatusTrueOrderByOpenedAtDesc(
            String installationId,
            Integer idEmpresa);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT s
            FROM CajaSesionEntity s
            WHERE s.idCajaSesion = :idCajaSesion
              AND s.empresa.idEmpresa = :idEmpresa
              AND s.estatus = true
            """)
    Optional<CajaSesionEntity> findByIdAndEmpresaForUpdate(
            @Param("idCajaSesion") Integer idCajaSesion,
            @Param("idEmpresa") Integer idEmpresa);
}
