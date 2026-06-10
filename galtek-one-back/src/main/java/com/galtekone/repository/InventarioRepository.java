package com.galtekone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.InventarioEntity;

import java.util.Optional;

@Repository
public interface InventarioRepository extends JpaRepository<InventarioEntity, Integer>, JpaSpecificationExecutor<InventarioEntity>{

    Optional<InventarioEntity> findByProducto_IdProductoAndAlmacen_IdAlmacenAndEmpresa_IdEmpresa(
            Integer idProducto, Integer idAlmacen, Integer idEmpresa);

    Optional<InventarioEntity> findByIdInventarioAndEmpresa_IdEmpresa(Integer idInventario, Integer idEmpresa);


}
