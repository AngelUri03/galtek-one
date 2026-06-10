package com.galtekone.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.ClientesEntity;

@Repository
public interface ClientesRepository extends JpaRepository<ClientesEntity, Integer>, JpaSpecificationExecutor<ClientesEntity>{

	Optional<ClientesEntity> findByIdCliente(Integer idCliente);
    Optional<ClientesEntity> findByIdClienteAndEmpresa_IdEmpresa(Integer idCliente, Integer idEmpresa);

}
