package com.galtekone.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.MovimientoCajaEntity;

@Repository
public interface MovimientoCajaRepository
                extends JpaRepository<MovimientoCajaEntity, Integer>, JpaSpecificationExecutor<MovimientoCajaEntity> {

        Optional<MovimientoCajaEntity> findByIdMovimientoCajaAndEmpresa_IdEmpresa(Integer idMovimientoCaja,
                        Integer idEmpresa);

        Optional<MovimientoCajaEntity> findByIdempotencyKeyAndEmpresa_IdEmpresaAndEstatusTrue(
                        String idempotencyKey, Integer idEmpresa);

        List<MovimientoCajaEntity> findByCaja_IdCajaAndEmpresa_IdEmpresaAndFechaBetween(
                        Integer idCaja, Integer idEmpresa, LocalDateTime desde, LocalDateTime hasta);

        List<MovimientoCajaEntity> findByCajaSesion_IdCajaSesionAndEmpresa_IdEmpresa(
                        Integer idCajaSesion, Integer idEmpresa);

        List<MovimientoCajaEntity> findByLocalDevice_InstallationIdAndEmpresa_IdEmpresa(
                        String installationId, Integer idEmpresa);

        List<MovimientoCajaEntity> findByEmpresa_IdEmpresaAndFechaBetween(
                        Integer idEmpresa, LocalDateTime desde, LocalDateTime hasta);

        List<MovimientoCajaEntity> findByEmpresa_IdEmpresa(Integer idEmpresa);
}

