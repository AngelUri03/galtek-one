package com.galtekone.services.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import com.galtekone.dto.categoria.CategoriaResponseDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.galtekone.config.EmpresaContextHolder;
import com.galtekone.entity.CategoriasEntity;
import com.galtekone.entity.EmpresasEntity;
import com.galtekone.repository.CategoriasRepository;
import com.galtekone.services.CategoriasService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class CategoriasServiceImpl implements CategoriasService {

	@Autowired
	private CategoriasRepository categoriasRepository;

	@Override
	public CategoriasEntity create(CategoriasEntity obj, String user) {
	    obj.setUsuarioCreacion(user);
	    return categoriasRepository.save(obj);
	}
	
	@Override
	public CategoriasEntity create(
	        CategoriasEntity obj,
	        String user,
	        Integer idEmpresa) {

	    if (idEmpresa == null) {
	        throw new IllegalArgumentException("El idEmpresa es obligatorio");
	    }

	    obj.setEmpresa(null);

	    EmpresasEntity empresa = new EmpresasEntity();
	    empresa.setIdEmpresa(idEmpresa);

	    obj.setEmpresa(empresa);
	    obj.setUsuarioCreacion(user);

	    return categoriasRepository.save(obj);
	}


	@Override
	public List<CategoriasEntity> read(Specification<CategoriasEntity> specs) {
	    return categoriasRepository.findAll(Specification.where(specs));
	}
	
	@Override
	public List<CategoriasEntity> read(
	        Specification<CategoriasEntity> specs,
	        Integer idEmpresa) {

	    Specification<CategoriasEntity> empresaSpec =
	            (root, query, cb) ->
	                    cb.equal(
	                            root.get("empresa").get("idEmpresa"),
	                            idEmpresa
	                    );

	    return categoriasRepository.findAll(
	            Specification.where(empresaSpec).and(specs)
	    );
	}


	@Override
	public CategoriasEntity update(CategoriasEntity obj, String user) {
	    Integer empresaId = EmpresaContextHolder.getEmpresaId();

	    Optional<CategoriasEntity> aux = categoriasRepository.findById(obj.getIdCategoria());

	    if (aux.isEmpty() || !aux.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
	        throw new EntityNotFoundException("Categoria no encontrada o no pertenece a tu empresa");
	    }

	    CategoriasEntity entityToUpdate = aux.get();

	    if (obj.getNombreCategoria() != null) {
	        entityToUpdate.setNombreCategoria(obj.getNombreCategoria());
	    }

	    if (obj.getEstatus() != null) {
	        entityToUpdate.setEstatus(obj.getEstatus());
	    }

	    entityToUpdate.setUsuarioModificacion(user);

	    return categoriasRepository.save(entityToUpdate);
	}
	
	@Override
	public CategoriasEntity update(
	        CategoriasEntity obj,
	        String user,
	        Integer idEmpresa) {

	    if (idEmpresa == null) {
	        throw new IllegalArgumentException("El idEmpresa es obligatorio");
	    }

	    CategoriasEntity categoria = categoriasRepository
	            .findByIdCategoriaAndEmpresa_IdEmpresa(
	                    obj.getIdCategoria(),
	                    idEmpresa
	            )
	            .orElseThrow(() ->
	                    new EntityNotFoundException(
	                            "Categoria no encontrada o no pertenece a la empresa"
	                    )
	            );

	    if (obj.getNombreCategoria() != null) {
	        categoria.setNombreCategoria(obj.getNombreCategoria());
	    }

	    if (obj.getEstatus() != null) {
	        categoria.setEstatus(obj.getEstatus());
	    }

	    categoria.setUsuarioModificacion(user);

	    return categoriasRepository.save(categoria);
	}


	@Override
	public CategoriasEntity delete(Integer idCategoria, String user) {
	    Integer empresaId = EmpresaContextHolder.getEmpresaId();

	    Optional<CategoriasEntity> optional = categoriasRepository.findById(idCategoria);

	    if (optional.isEmpty() || !optional.get().getEmpresa().getIdEmpresa().equals(empresaId)) {
	        throw new EntityNotFoundException("Categoria no encontrada o no pertenece a tu empresa");
	    }

	    CategoriasEntity entity = optional.get();
	    entity.setUsuarioModificacion(user);
	    categoriasRepository.deleteById(idCategoria);

	    return entity;
	}
	
	@Override
	public CategoriasEntity delete(
	        Integer idCategoria,
	        String user,
	        Integer idEmpresa) {

	    if (idEmpresa == null) {
	        throw new IllegalArgumentException("El idEmpresa es obligatorio");
	    }

	    CategoriasEntity categoria = categoriasRepository
	            .findByIdCategoriaAndEmpresa_IdEmpresa(
	                    idCategoria,
	                    idEmpresa
	            )
	            .orElseThrow(() ->
	                    new EntityNotFoundException(
	                            "Categoria no encontrada o no pertenece a la empresa"
	                    )
	            );

	    categoria.setUsuarioModificacion(user);
	    categoriasRepository.delete(categoria);

	    return categoria;
	}


//    @Override
//    public List<CategoriaResponseDTO> listarCategoriasActivas() {
//
//        Integer empresaId = EmpresaContextHolder.getEmpresaId();
//
//        List<CategoriasEntity> categorias =
//                categoriasRepository.findByEmpresa_IdEmpresaAndEstatusTrue(empresaId);
//
//        List<CategoriaResponseDTO> response = new ArrayList<>();
//
//        for (CategoriasEntity categoria : categorias) {
//            CategoriaResponseDTO dto = new CategoriaResponseDTO();
//            dto.setIdCategoria(categoria.getIdCategoria());
//            dto.setNombreCategoria(categoria.getNombreCategoria());
//            response.add(dto);
//        }
//
//        return response;
//    }
    
    @Override
    public List<CategoriaResponseDTO> listarCategoriasActivas(Integer idEmpresa) {

        List<CategoriasEntity> categorias =
                categoriasRepository
                        .findByEmpresa_IdEmpresaAndEstatusTrue(idEmpresa);

        List<CategoriaResponseDTO> response = new ArrayList<>();

        for (CategoriasEntity categoria : categorias) {
            CategoriaResponseDTO dto = new CategoriaResponseDTO();
            dto.setIdCategoria(categoria.getIdCategoria());
            dto.setNombreCategoria(categoria.getNombreCategoria());
            response.add(dto);
        }

        return response;
    }



}