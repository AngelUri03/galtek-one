package com.galtekone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.VentasEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface VentasRepository extends JpaRepository<VentasEntity, Integer>, JpaSpecificationExecutor<VentasEntity>{

    //buscar venta por id y empresa
    Optional<VentasEntity> findByIdVentaAndEmpresa_IdEmpresa(Integer idProducto, Integer idEmpresa);

    long countByCliente_IdClienteAndEmpresa_IdEmpresa(Integer idCliente, Integer idEmpresa);

    List<VentasEntity> findTop5ByCliente_IdClienteAndEmpresa_IdEmpresaOrderByFechaCreacionDesc(Integer idCliente, Integer idEmpresa);
}
