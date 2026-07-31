package com.galtekone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.MetodoPagoEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface MetodoPagoRepository extends JpaRepository<MetodoPagoEntity, Integer>, JpaSpecificationExecutor<MetodoPagoEntity>{

    Optional<MetodoPagoEntity> findByIdMetodoPagoAndEmpresa_IdEmpresa(Integer idMetodoPago, Integer idEmpresa);

    List<MetodoPagoEntity> findByEmpresa_IdEmpresaOrderByOrdenAscIdMetodoPagoAsc(Integer idEmpresa);

    Optional<MetodoPagoEntity> findFirstByEmpresa_IdEmpresaAndCodigoIgnoreCase(Integer idEmpresa, String codigo);

    Optional<MetodoPagoEntity> findFirstByEmpresa_IdEmpresaAndNombreMetodoPagoIgnoreCase(Integer idEmpresa, String nombreMetodoPago);

}
