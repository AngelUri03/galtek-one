package com.galtekone.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.galtekone.dto.proveedor.ProveedorProductoRowDTO;
import com.galtekone.entity.ProveedorProductoEntity;
@Repository
public interface ProveedorProductoRespository extends JpaRepository<ProveedorProductoEntity, Integer>, JpaSpecificationExecutor<ProveedorProductoEntity>{

    Optional<ProveedorProductoEntity> findByIdProveedorProductoAndEmpresa_IdEmpresa(
            Integer idProveedorProducto,
            Integer idEmpresa
    );

    List<ProveedorProductoEntity> findByProducto_IdProducto(Integer idProducto);

    List<ProveedorProductoEntity> findByProveedor_IdProveedorAndEmpresa_IdEmpresa(Integer idProveedor, Integer idEmpresa);

    List<ProveedorProductoEntity> findAllByProveedor_IdProveedorAndProducto_IdProductoAndEmpresa_IdEmpresaOrderByIdProveedorProductoAsc(
            Integer idProveedor,
            Integer idProducto,
            Integer idEmpresa
    );

    @Query("""
            select new com.galtekone.dto.proveedor.ProveedorProductoRowDTO(
                pp.idProveedorProducto,
                p.idProducto,
                p.nombreProducto,
                p.descripcion,
                p.codigoBarras,
                pp.precioCompra,
                pp.skuProveedor,
                pp.ultimoCosto,
                pp.fechaUltimoCosto,
                pp.presentacionCompra,
                pp.cantidadMinima,
                pp.proveedorPreferido,
                pp.estadoRelacion,
                pp.estatus,
                pp.fechaCreacion,
                pp.fechaModificacion
            )
            from ProveedorProductoEntity pp
            join pp.producto p
            where pp.proveedor.idProveedor = :idProveedor
              and pp.empresa.idEmpresa = :idEmpresa
            order by p.nombreProducto asc, pp.idProveedorProducto asc
            """)
    List<ProveedorProductoRowDTO> findRowsByProveedorAndEmpresa(
            @Param("idProveedor") Integer idProveedor,
            @Param("idEmpresa") Integer idEmpresa
    );

    @Query("""
            select pp.producto.idProducto
            from ProveedorProductoEntity pp
            where pp.idProveedorProducto = :idProveedorProducto
              and pp.proveedor.idProveedor = :idProveedor
              and pp.empresa.idEmpresa = :idEmpresa
            """)
    Optional<Integer> findProductoIdByRelacion(
            @Param("idProveedorProducto") Integer idProveedorProducto,
            @Param("idProveedor") Integer idProveedor,
            @Param("idEmpresa") Integer idEmpresa
    );

    Optional<ProveedorProductoEntity> findByIdProveedorProductoAndProveedor_IdProveedorAndEmpresa_IdEmpresa(
            Integer idProveedorProducto,
            Integer idProveedor,
            Integer idEmpresa
    );

    long countByProveedor_IdProveedorAndEmpresa_IdEmpresa(Integer idProveedor, Integer idEmpresa);

    @Query("""
            select pp.proveedor.idProveedor, count(pp)
            from ProveedorProductoEntity pp
            where pp.empresa.idEmpresa = :idEmpresa
              and pp.proveedor.idProveedor in :idsProveedor
            group by pp.proveedor.idProveedor
            """)
    List<Object[]> countByProveedorIdsAndEmpresa(
            @Param("idsProveedor") List<Integer> idsProveedor,
            @Param("idEmpresa") Integer idEmpresa
    );
}
