package com.galtekone.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.ProveedorProductoEntity;
@Repository
public interface ProveedorProductoRespository extends JpaRepository<ProveedorProductoEntity, Integer>, JpaSpecificationExecutor<ProveedorProductoEntity>{
	Optional<ProveedorProductoEntity>

    findByIdProveedorProductoAndEmpresa_IdEmpresa(
            Integer idProveedorProducto,
            Integer idEmpresa
    );

    List<ProveedorProductoEntity> findByProducto_IdProducto(Integer idProducto);

    List<ProveedorProductoEntity> findByProveedor_IdProveedorAndEmpresa_IdEmpresa(Integer idProveedor, Integer idEmpresa);

    Optional<ProveedorProductoEntity> findByIdProveedorProductoAndProveedor_IdProveedorAndEmpresa_IdEmpresa(
            Integer idProveedorProducto,
            Integer idProveedor,
            Integer idEmpresa
    );

    long countByProveedor_IdProveedorAndEmpresa_IdEmpresa(Integer idProveedor, Integer idEmpresa);
}
