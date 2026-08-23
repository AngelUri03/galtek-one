package com.galtekone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query("""
            select v.cliente.idCliente, count(v)
            from VentasEntity v
            where v.empresa.idEmpresa = :idEmpresa
              and v.cliente.idCliente in :idsCliente
            group by v.cliente.idCliente
            """)
    List<Object[]> countByClienteIdsAndEmpresa(
            @Param("idsCliente") List<Integer> idsCliente,
            @Param("idEmpresa") Integer idEmpresa
    );

    @Query("""
            select v
            from VentasEntity v
            left join fetch v.metodoPago
            where v.empresa.idEmpresa = :idEmpresa
              and v.cliente.idCliente in :idsCliente
              and v.fechaCreacion is not null
              and v.fechaCreacion = (
                  select max(v2.fechaCreacion)
                  from VentasEntity v2
                  where v2.empresa.idEmpresa = :idEmpresa
                    and v2.cliente.idCliente = v.cliente.idCliente
              )
            order by v.cliente.idCliente asc, v.fechaCreacion desc, v.idVenta desc
            """)
    List<VentasEntity> findLatestByClienteIdsAndEmpresa(
            @Param("idsCliente") List<Integer> idsCliente,
            @Param("idEmpresa") Integer idEmpresa
    );

    List<VentasEntity> findByCajaSesion_IdCajaSesionAndEmpresa_IdEmpresa(Integer idCajaSesion, Integer idEmpresa);
}
