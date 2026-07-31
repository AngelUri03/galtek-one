package com.galtekone.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.ConfiguracionCajaEntity;

@Repository
public interface ConfiguracionCajaRepository extends JpaRepository<ConfiguracionCajaEntity, Integer> {
    Optional<ConfiguracionCajaEntity> findByEmpresa_IdEmpresaAndEstatusTrue(Integer idEmpresa);
}
