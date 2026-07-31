package com.galtekone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.CajasEntity;

import jakarta.persistence.LockModeType;
import java.util.Optional;

@Repository
public interface CajasRepository extends JpaRepository<CajasEntity, Integer>, JpaSpecificationExecutor<CajasEntity>{

    Optional<CajasEntity> findByIdCajaAndEmpresa_IdEmpresa(Integer idCaja, Integer idEmpresa);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT c
            FROM CajasEntity c
            WHERE c.idCaja = :idCaja
              AND c.empresa.idEmpresa = :idEmpresa
            """)
    Optional<CajasEntity> findByIdCajaAndEmpresaForUpdate(@Param("idCaja") Integer idCaja,
            @Param("idEmpresa") Integer idEmpresa);

}
