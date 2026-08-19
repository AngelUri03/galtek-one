package com.galtekone.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.galtekone.dto.proveedor.ProveedorCostoHistorialRowDTO;
import com.galtekone.entity.HistorialCostosEntity;

@Repository
public interface HistorialCostosRepository
        extends JpaRepository<HistorialCostosEntity, Integer>,
                JpaSpecificationExecutor<HistorialCostosEntity> {

    Optional<HistorialCostosEntity> findByIdHistorialCostosAndEmpresa_IdEmpresa(
            Integer idHistorialCostos,
            Integer idEmpresa);

    Optional<HistorialCostosEntity>
    findTopByProducto_IdProductoAndEmpresa_IdEmpresaAndFechaCambioLessThanEqualOrderByFechaCambioDesc(
            Integer idProducto,
            Integer idEmpresa,
            LocalDateTime fecha);

    Optional<HistorialCostosEntity>
    findTopByProducto_IdProductoAndEmpresa_IdEmpresaOrderByFechaCambioDesc(
            Integer idProducto,
            Integer idEmpresa);

    List<HistorialCostosEntity>
    findByProveedor_IdProveedorAndProducto_IdProductoAndEmpresa_IdEmpresaOrderByFechaCambioDesc(
            Integer idProveedor,
            Integer idProducto,
            Integer idEmpresa);

    @Query("""
            select new com.galtekone.dto.proveedor.ProveedorCostoHistorialRowDTO(
                h.idHistorialCostos,
                h.costoAnterior,
                h.costoNuevo,
                h.diferencia,
                h.motivo,
                h.referencia,
                h.usuario,
                h.fechaCambio,
                h.fechaCreacion,
                h.fechaModificacion,
                h.usuarioCreacion,
                h.usuarioModificacion
            )
            from HistorialCostosEntity h
            where h.proveedor.idProveedor = :idProveedor
              and h.producto.idProducto = :idProducto
              and h.empresa.idEmpresa = :idEmpresa
            order by h.fechaCambio desc, h.idHistorialCostos desc
            """)
    List<ProveedorCostoHistorialRowDTO> findRowsByProveedorProductoEmpresa(
            @Param("idProveedor") Integer idProveedor,
            @Param("idProducto") Integer idProducto,
            @Param("idEmpresa") Integer idEmpresa
    );
}
