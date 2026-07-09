package com.galtekone.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.galtekone.entity.ProveedorActivoEvidenciaEntity;

@Repository
public interface ProveedorActivoEvidenciaRepository extends JpaRepository<ProveedorActivoEvidenciaEntity, Integer> {

    List<ProveedorActivoEvidenciaEntity> findByHistorial_IdProveedorActivoHistorialInAndEmpresa_IdEmpresaOrderByIdProveedorActivoEvidenciaAsc(
            List<Integer> idsHistorial,
            Integer idEmpresa
    );
}
