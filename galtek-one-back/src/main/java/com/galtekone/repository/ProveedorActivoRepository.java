package com.galtekone.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.galtekone.dto.proveedor.ProveedorActivoRowDTO;
import com.galtekone.entity.ProveedorActivoEntity;

@Repository
public interface ProveedorActivoRepository extends JpaRepository<ProveedorActivoEntity, Integer>, JpaSpecificationExecutor<ProveedorActivoEntity> {

    List<ProveedorActivoEntity> findByProveedor_IdProveedorAndEmpresa_IdEmpresa(Integer idProveedor, Integer idEmpresa);

    @Query("""
            select new com.galtekone.dto.proveedor.ProveedorActivoRowDTO(
                pa.idProveedorActivo,
                pa.nombre,
                pa.tipo,
                pa.numeroSerie,
                pa.fechaEntrega,
                pa.fechaRegreso,
                pa.estadoFisico,
                pa.ubicacionTienda,
                pa.condicionesPrestamo,
                pa.depositoGarantia,
                pa.estadoActivoPrestado,
                pa.notas,
                pa.estatus,
                pa.fechaCreacion,
                pa.fechaModificacion,
                (
                    select count(h.idProveedorActivoHistorial)
                    from ProveedorActivoHistorialEntity h
                    where h.activo.idProveedorActivo = pa.idProveedorActivo
                      and h.empresa.idEmpresa = :idEmpresa
                )
            )
            from ProveedorActivoEntity pa
            where pa.proveedor.idProveedor = :idProveedor
              and pa.empresa.idEmpresa = :idEmpresa
            order by pa.idProveedorActivo asc
            """)
    List<ProveedorActivoRowDTO> findRowsByProveedorAndEmpresa(
            @Param("idProveedor") Integer idProveedor,
            @Param("idEmpresa") Integer idEmpresa
    );

    Optional<ProveedorActivoEntity> findByIdProveedorActivoAndProveedor_IdProveedorAndEmpresa_IdEmpresa(
            Integer idProveedorActivo,
            Integer idProveedor,
            Integer idEmpresa
    );

    long countByProveedor_IdProveedorAndEmpresa_IdEmpresa(Integer idProveedor, Integer idEmpresa);

    @Query("""
            select pa.proveedor.idProveedor, count(pa)
            from ProveedorActivoEntity pa
            where pa.empresa.idEmpresa = :idEmpresa
              and pa.proveedor.idProveedor in :idsProveedor
            group by pa.proveedor.idProveedor
            """)
    List<Object[]> countByProveedorIdsAndEmpresa(
            @Param("idsProveedor") List<Integer> idsProveedor,
            @Param("idEmpresa") Integer idEmpresa
    );
}
