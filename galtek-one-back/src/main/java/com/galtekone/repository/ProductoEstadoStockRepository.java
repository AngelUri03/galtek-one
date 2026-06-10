package com.galtekone.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.ProductoEstadoStockEntity;

@Repository
public interface ProductoEstadoStockRepository
                extends JpaRepository<ProductoEstadoStockEntity, Integer>,
                JpaSpecificationExecutor<ProductoEstadoStockEntity> {

        Optional<ProductoEstadoStockEntity> findByIdProductoEstadoStockAndEmpresa_IdEmpresa(Integer id,
                        Integer idEmpresa);

        List<ProductoEstadoStockEntity> findByProducto_IdProductoAndEmpresa_IdEmpresa(Integer idProducto,
                        Integer idEmpresa);

        boolean existsByProducto_IdProductoAndEstadoStock_IdEstadoStockAndEmpresa_IdEmpresa(
                        Integer idProducto, Integer idEstadoStock, Integer idEmpresa);

        // Check overlap for CREATE (no ID exclusion)
        @Query("SELECT COUNT(p) > 0 FROM ProductoEstadoStockEntity p " +
                        "WHERE p.producto.idProducto = :idProducto " +
                        "AND p.empresa.idEmpresa = :idEmpresa " +
                        "AND (" +
                        "   (p.minimo <= :maximo AND p.maximo >= :minimo)" + // Overlap condition
                        ")")
        boolean existsOverlap(@Param("idProducto") Integer idProducto,
                        @Param("idEmpresa") Integer idEmpresa,
                        @Param("minimo") BigDecimal minimo,
                        @Param("maximo") BigDecimal maximo);

        // Check overlap for UPDATE (exclude current ID)
        @Query("SELECT COUNT(p) > 0 FROM ProductoEstadoStockEntity p " +
                        "WHERE p.producto.idProducto = :idProducto " +
                        "AND p.empresa.idEmpresa = :idEmpresa " +
                        "AND p.idProductoEstadoStock <> :excludeId " +
                        "AND (" +
                        "   (p.minimo <= :maximo AND p.maximo >= :minimo)" +
                        ")")
        boolean existsOverlapExcludeId(@Param("idProducto") Integer idProducto,
                        @Param("idEmpresa") Integer idEmpresa,
                        @Param("minimo") BigDecimal minimo,
                        @Param("maximo") BigDecimal maximo,
                        @Param("excludeId") Integer excludeId);
}
