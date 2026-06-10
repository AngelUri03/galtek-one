package com.galtekone.services;

import com.galtekone.dto.categoria.CategoriaResponseDTO;
import com.galtekone.entity.CategoriasEntity;

import java.util.List;

import org.springframework.data.jpa.domain.Specification;

public interface CategoriasService extends CommonService<CategoriasEntity>{
	

    CategoriasEntity create(
            CategoriasEntity obj,
            String user,
            Integer idEmpresa
    );
    
    CategoriasEntity update(
            CategoriasEntity obj,
            String user,
            Integer idEmpresa
    );
	
    CategoriasEntity delete(
            Integer idCategoria,
            String user,
            Integer idEmpresa
    );
    
    List<CategoriasEntity> read(
            Specification<CategoriasEntity> specs,
            Integer idEmpresa
    );

    List<CategoriaResponseDTO> listarCategoriasActivas(Integer idEmpresa);

}
