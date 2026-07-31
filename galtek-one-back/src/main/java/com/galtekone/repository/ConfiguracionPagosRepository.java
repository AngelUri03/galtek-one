package com.galtekone.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.ConfiguracionPagosEntity;

@Repository
public interface ConfiguracionPagosRepository extends JpaRepository<ConfiguracionPagosEntity, Integer> {
    Optional<ConfiguracionPagosEntity> findByEmpresa_IdEmpresaAndEstatusTrue(Integer idEmpresa);
}
