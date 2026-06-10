package com.galtekone.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.ProductosEntity;

@Repository
public interface ProductosRepository extends JpaRepository<ProductosEntity, Integer>, JpaSpecificationExecutor<ProductosEntity>{

    //listar productos por categoria
	List<ProductosEntity> findByCategoria_IdCategoriaAndEmpresa_IdEmpresa(Integer idCategoria, Integer idEmpresa);

    //buscar producto por id y empresa
    Optional<ProductosEntity> findByIdProductoAndEmpresa_IdEmpresa(Integer idProducto, Integer idEmpresa);

    List<ProductosEntity> findByEmpresa_IdEmpresaAndEstatusTrue(Integer idEmpresa);



}
