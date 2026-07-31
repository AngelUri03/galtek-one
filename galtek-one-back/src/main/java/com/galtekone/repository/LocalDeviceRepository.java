package com.galtekone.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.LocalDeviceEntity;

import jakarta.persistence.LockModeType;

@Repository
public interface LocalDeviceRepository extends JpaRepository<LocalDeviceEntity, String> {
    Optional<LocalDeviceEntity> findFirstByOrderByCreatedAtAsc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT d
            FROM LocalDeviceEntity d
            WHERE d.installationId = :installationId
            """)
    Optional<LocalDeviceEntity> findByInstallationIdForUpdate(@Param("installationId") String installationId);
}
