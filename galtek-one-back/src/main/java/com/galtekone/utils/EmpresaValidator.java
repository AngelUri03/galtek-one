package com.galtekone.utils;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.EmpresasEntity;
import org.springframework.stereotype.Component;
import jakarta.persistence.EntityNotFoundException;

import java.util.Optional;
import java.util.function.BiFunction;

@Component
public class EmpresaValidator {

    public static void asignarEmpresa(BaseEmpresa entity) {
        Integer idEmpresa = EmpresaContextHolder.getEmpresaId();
        EmpresasEntity empresa = new EmpresasEntity();
        empresa.setIdEmpresa(idEmpresa);
        entity.setEmpresa(empresa);
    }

    public <T> T validarEntidadPorEmpresa(
            Integer idEntidad,
            Integer empresaId,
            String nombreEntidad,
            BiFunction<Integer, Integer, Optional<T>> finder) {

        return finder.apply(idEntidad, empresaId)
                .orElseThrow(() -> new EntityNotFoundException(
                        nombreEntidad + " no encontrada o no pertenece a la empresa actual"));
    }

}
