package com.galtekone.services;

import com.galtekone.dto.inventario.InventarioDTO;
import com.galtekone.entity.InventarioEntity;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

public interface InventarioService extends CommonService<InventarioEntity>{
    List<InventarioDTO> getInventarioConEstado(Specification<InventarioEntity> specs);

}
