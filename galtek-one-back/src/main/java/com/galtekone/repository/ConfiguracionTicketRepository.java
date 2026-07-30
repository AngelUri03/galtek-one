package com.galtekone.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.ConfiguracionTicketEntity;

@Repository
public interface ConfiguracionTicketRepository extends JpaRepository<ConfiguracionTicketEntity, Integer> {

    Optional<ConfiguracionTicketEntity> findFirstByEmpresa_IdEmpresa(Integer idEmpresa);
}
