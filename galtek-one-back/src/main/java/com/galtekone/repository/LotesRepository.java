package com.galtekone.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.LotesEntity;

import jakarta.persistence.LockModeType;

@Repository
public interface LotesRepository extends JpaRepository<LotesEntity, Integer>, JpaSpecificationExecutor<LotesEntity> {

    Optional<LotesEntity> findByIdLoteAndEmpresa_IdEmpresa(Integer idLote, Integer idEmpresa);

    /**
     * Busca lotes disponibles (cantidad > 0) para un producto y almacen,
     * ordenados por:
     * 1. Fecha Caducidad ASC (NULLS LAST para usar FEFO preferente, o FIRST si
     * caducan pronto)
     * Generalmente: Los que caducan primero van primero. Los nulos van al final o
     * se tratan como no perecederos.
     * Para simplificar y asegurar consistencia: ORDER BY fechaCaducidad ASC.
     * 2. Fecha Creacion / ID (FIFO) para desempate.
     * 
     * Aplica PESSIMISTIC_WRITE para bloqueo en ventas concurrentes.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT l FROM LotesEntity l " +
            "WHERE l.producto.idProducto = :idProducto " +
            "AND l.almacen.idAlmacen = :idAlmacen " +
            "AND l.empresa.idEmpresa = :idEmpresa " +
            "AND l.cantidad > 0 " +
            "ORDER BY l.fechaCaducidad ASC NULLS LAST, l.idLote ASC")
    List<LotesEntity> findDisponiblesParaVenta(@Param("idProducto") Integer idProducto,
            @Param("idAlmacen") Integer idAlmacen,
            @Param("idEmpresa") Integer idEmpresa);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT l FROM LotesEntity l " +
            "WHERE l.producto.idProducto = :idProducto " +
            "AND l.empresa.idEmpresa = :idEmpresa " +
            "AND l.cantidad > 0 " +
            "ORDER BY l.fechaCaducidad ASC NULLS LAST, l.idLote ASC")
    List<LotesEntity> findDisponiblesParaVentaEnEmpresa(@Param("idProducto") Integer idProducto,
            @Param("idEmpresa") Integer idEmpresa);

    @Query("SELECT SUM(l.cantidad) FROM LotesEntity l " +
            "WHERE l.producto.idProducto = :idProducto " +
            "AND l.almacen.idAlmacen = :idAlmacen " +
            "AND l.empresa.idEmpresa = :idEmpresa")
    java.math.BigDecimal sumCantidadByProductoAndAlmacen(
            @Param("idProducto") Integer idProducto,
            @Param("idAlmacen") Integer idAlmacen,
            @Param("idEmpresa") Integer idEmpresa);

}
