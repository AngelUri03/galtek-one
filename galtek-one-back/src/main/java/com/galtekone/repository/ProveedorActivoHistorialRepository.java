package com.galtekone.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.ProveedorActivoHistorialEntity;

@Repository
public interface ProveedorActivoHistorialRepository extends JpaRepository<ProveedorActivoHistorialEntity, Integer> {

    List<ProveedorActivoHistorialEntity> findByActivo_IdProveedorActivoInAndEmpresa_IdEmpresaOrderByFechaEventoAscIdProveedorActivoHistorialAsc(
            List<Integer> idsActivos,
            Integer idEmpresa
    );
}
